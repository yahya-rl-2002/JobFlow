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

      // Parser les paramètres pour gérer les chaînes séparées par des virgules et les arrays
      let parsedKeywords: string | string[] | undefined;
      if (keywords) {
        if (typeof keywords === 'string') {
          // Si c'est une chaîne, vérifier si elle contient des virgules
          parsedKeywords = keywords.includes(',') ? keywords.split(',').map(k => k.trim()) : keywords;
        } else if (Array.isArray(keywords)) {
          parsedKeywords = keywords;
        }
      }
      // Gérer le cas où axios envoie keywords[] au lieu de keywords
      if (!parsedKeywords && (req.query as any)['keywords[]']) {
        parsedKeywords = Array.isArray((req.query as any)['keywords[]']) 
          ? (req.query as any)['keywords[]'] 
          : [(req.query as any)['keywords[]']];
      }

      let parsedLocation: string | string[] | undefined;
      if (location) {
        if (typeof location === 'string') {
          // Si c'est une chaîne, vérifier si elle contient des virgules
          parsedLocation = location.includes(',') ? location.split(',').map(l => l.trim()) : location;
        } else if (Array.isArray(location)) {
          parsedLocation = location;
        }
      }
      // Gérer le cas où axios envoie location[] au lieu de location
      if (!parsedLocation && (req.query as any)['location[]']) {
        parsedLocation = Array.isArray((req.query as any)['location[]']) 
          ? (req.query as any)['location[]'] 
          : [(req.query as any)['location[]']];
      }

      const jobs = await JobOfferModel.search({
        platform: platform as string,
        location: parsedLocation,
        job_type: job_type as string,
        remote: remote === 'true',
        keywords: parsedKeywords,
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

      // Handle keywords: if array, join with OR, else use as is or default
      let searchKeywords = 'developer';
      if (Array.isArray(keywords) && keywords.length > 0) {
        searchKeywords = keywords.join(' OR ');
      } else if (typeof keywords === 'string' && keywords.length > 0) {
        searchKeywords = keywords;
      }

      // Handle locations: ensure it's an array to loop through
      let searchLocations: string[] = ['Paris, France'];
      if (Array.isArray(location) && location.length > 0) {
        searchLocations = location;
      } else if (typeof location === 'string' && location.length > 0) {
        searchLocations = [location];
      }

      const searchLimit = limit || 50; // Increased default limit
      const searchPeriod = period || 'month';

      // Loop through each location to maximize results
      for (const loc of searchLocations) {
        if (!platform || platform === 'linkedin') {
          try {
            const linkedInJobs = await LinkedInService.fetchJobs(req.userId!, {
              keywords: searchKeywords,
              location: loc,
              limit: searchLimit,
              period: searchPeriod,
            });
            jobs = [...jobs, ...linkedInJobs];
            logger.info(`Fetched ${linkedInJobs.length} jobs from LinkedIn for location: ${loc}`);
          } catch (error: any) {
            logger.warn(`LinkedIn fetch jobs failed for ${loc}`, { error: error.message });
          }
        }

        if (!platform || platform === 'indeed') {
          try {
            const indeedJobs = await IndeedService.fetchJobs({
              keywords: searchKeywords,
              location: loc,
              limit: searchLimit,
              period: searchPeriod,
            });
            jobs = [...jobs, ...indeedJobs];
            logger.info(`Fetched ${indeedJobs.length} jobs from Indeed for location: ${loc}`);
          } catch (error: any) {
            logger.warn(`Indeed fetch jobs failed for ${loc}`, { error: error.message });
          }
        }
      }

      // Save jobs to database with user_id
      if (jobs.length > 0) {
        // Add user_id to each job and remove duplicates based on external_id
        const uniqueJobsMap = new Map();
        jobs.forEach(job => {
          if (!uniqueJobsMap.has(job.external_id)) {
            uniqueJobsMap.set(job.external_id, {
              ...job,
              user_id: req.userId!
            });
          }
        });

        const uniqueJobs = Array.from(uniqueJobsMap.values());

        await JobOfferModel.bulkCreate(uniqueJobs);
        logger.info(`Saved ${uniqueJobs.length} unique jobs to database for user ${req.userId}`);
      }

      // Si aucune offre n'a été trouvée, donner un message plus clair
      if (jobs.length === 0) {
        logger.warn(`No jobs found for keywords: ${searchKeywords}, locations: ${searchLocations.join(', ')}`);
        return res.json({
          message: 'Aucune offre trouvée pour ces critères. Essayez avec d\'autres mots-clés ou localisations.',
          count: 0,
          platforms: {
            linkedin: 0,
            indeed: 0,
          },
          suggestion: 'Essayez des mots-clés plus généraux ou vérifiez votre connexion internet.',
        });
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

  static async deleteAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await JobOfferModel.deleteAllForUser(req.userId!);
      res.json({ message: 'All jobs deleted successfully' });
    } catch (error) {
      logger.error('Delete all jobs error', error);
      next(error);
    }
  }
}

