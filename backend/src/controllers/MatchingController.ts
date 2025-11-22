import { Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/database';
import { CVModel } from '../models/CV';
import { JobOfferModel } from '../models/JobOffer';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import redisClient from '../config/redis';

export class MatchingController {
  static async matchCVWithJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cv_id, job_ids, limit = 50 } = req.body;

      // Try to get from cache
      const cacheKey = `match:${cv_id}:${job_ids ? JSON.stringify(job_ids.sort()) : 'all'}`;
      try {
        if (redisClient.isReady) {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            logger.info(`Cache hit for key: ${cacheKey}`);
            return res.json(JSON.parse(cached));
          }
        }
      } catch (e) {
        logger.warn('Redis get error', e);
      }

      const cv = await CVModel.findById(cv_id);
      if (!cv || cv.user_id !== req.userId) {
        return res.status(404).json({ error: 'CV not found' });
      }

      // Get jobs to match
      let jobs;
      if (job_ids && Array.isArray(job_ids)) {
        jobs = await Promise.all(
          job_ids.map((id: number) => JobOfferModel.findById(id))
        );
        jobs = jobs.filter((j) => j !== null);
      } else {
        jobs = await JobOfferModel.search({ limit });
      }

      // Call NLP service for matching
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:5001';
      const response = await axios.post(`${nlpServiceUrl}/match`, {
        cv_data: cv.parsed_data || {},
        jobs: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
        })),
      });

      const matchingResults = response.data.results;

      // Save matching results
      for (const result of matchingResults) {
        await config.query(
          `INSERT INTO matching_results (user_id, cv_id, job_offer_id, match_score, matching_details)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [
            req.userId!,
            cv_id,
            result.job_id,
            result.score,
            JSON.stringify(result.details),
          ]
        );
      }

      const responseData = {
        cv_id,
        results: matchingResults,
      };

      // Cache the result
      try {
        if (redisClient.isReady) {
          await redisClient.set(cacheKey, JSON.stringify(responseData), {
            EX: 3600 // 1 hour cache
          });
        }
      } catch (e) {
        logger.warn('Redis set error', e);
      }

      res.json(responseData);
    } catch (error: any) {
      logger.error('Matching error', error);
      res.status(500).json({
        error: 'Matching failed',
        message: error.message,
      });
    }
  }

  static async getMatchingResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cvId } = req.params;

      const results = await config.query(
        `SELECT mr.*, jo.title, jo.company, jo.platform, jo.url
         FROM matching_results mr
         JOIN job_offers jo ON mr.job_offer_id = jo.id
         WHERE mr.cv_id = $1 AND mr.user_id = $2
         ORDER BY mr.match_score DESC`,
        [cvId, req.userId!]
      );

      res.json(results.rows);
    } catch (error) {
      logger.error('Get matching results error', error);
      next(error);
    }
  }

  static async getJobMatchScore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const { cv_id } = req.query;

      if (!cv_id) {
        return res.status(400).json({ error: 'cv_id is required' });
      }

      const cv = await CVModel.findById(parseInt(cv_id as string));
      if (!cv || cv.user_id !== req.userId) {
        return res.status(404).json({ error: 'CV not found' });
      }

      const job = await JobOfferModel.findById(parseInt(jobId));
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Call NLP service for single match
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:5000';
      const response = await axios.post(`${nlpServiceUrl}/match`, {
        cv_data: cv.parsed_data || {},
        jobs: [{
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
        }],
      });

      res.json({
        job_id: jobId,
        cv_id,
        match_score: response.data.results[0]?.score || 0,
        details: response.data.results[0]?.details || {},
      });
    } catch (error: any) {
      logger.error('Get job match score error', error);
      res.status(500).json({
        error: 'Matching failed',
        message: error.message,
      });
    }
  }
}

