import { Response, NextFunction } from 'express';
import { JobOfferModel } from '../models/JobOffer';
import { LinkedInService } from '../services/LinkedInService';
import { IndeedService } from '../services/IndeedService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class JobController {
  static async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        platform,
        location,
        job_type,
        remote,
        keywords,
        limit = 50,
        offset = 0,
      } = req.query;

      const jobs = await JobOfferModel.search({
        platform: platform as string,
        location: location as string | string[],
        job_type: job_type as string,
        remote: remote === 'true',
        keywords: keywords as string | string[],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        user_id: req.userId!, // Filter by current user
      });

      res.json({
        jobs,
        total: jobs.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      logger.error('Job search error', error);
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const job = await JobOfferModel.findById(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      logger.error('Get job error', error);
      next(error);
    }
  }

  static async syncJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { platform, keywords, location, limit, period } = req.body;

      let jobs: any[] = [];
      const searchKeywords = keywords || 'developer';
      const searchLocation = location || 'Paris, France';
      const searchLimit = limit || 25;
      const searchPeriod = period || 'month'; // Default to month as requested

      if (!platform || platform === 'linkedin') {
        try {
          const linkedInJobs = await LinkedInService.fetchJobs(req.userId!, {
            keywords: searchKeywords,
            location: searchLocation,
            limit: searchLimit,
            period: searchPeriod,
          });
          jobs = [...jobs, ...linkedInJobs];
          logger.info(`Fetched ${linkedInJobs.length} jobs from LinkedIn`);
        } catch (error: any) {
          logger.warn('LinkedIn fetch jobs failed', { error: error.message });
          // Continuer avec les autres plateformes même si LinkedIn échoue
        }
      }

      if (!platform || platform === 'indeed') {
        try {
          const indeedJobs = await IndeedService.fetchJobs({
            keywords: searchKeywords,
            location: searchLocation,
            limit: searchLimit,
            period: searchPeriod,
          });
          jobs = [...jobs, ...indeedJobs];
          logger.info(`Fetched ${indeedJobs.length} jobs from Indeed`);
        } catch (error: any) {
          logger.warn('Indeed fetch jobs failed', { error: error.message });
          // Continuer même si Indeed échoue
        }
      }

      // Save jobs to database with user_id
      if (jobs.length > 0) {
        // Add user_id to each job
        const userJobs = jobs.map(job => ({
          ...job,
          user_id: req.userId!
        }));

        await JobOfferModel.bulkCreate(userJobs);
        logger.info(`Saved ${jobs.length} jobs to database for user ${req.userId}`);
      }

      res.json({
        message: 'Jobs synced successfully',
        count: jobs.length,
        platforms: {
          linkedin: platform === 'linkedin' || !platform ? jobs.filter(j => j.platform === 'linkedin').length : 0,
          indeed: platform === 'indeed' || !platform ? jobs.filter(j => j.platform === 'indeed').length : 0,
        },
      });
    } catch (error) {
      logger.error('Sync jobs error', error);
      next(error);
    }
  }
}

