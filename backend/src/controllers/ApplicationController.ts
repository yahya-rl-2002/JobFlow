import { Response, NextFunction } from 'express';
import { ApplicationModel } from '../models/Application';
import { ApplicationService } from '../services/ApplicationService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class ApplicationController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const applications = await ApplicationModel.findByUserId(req.userId!);
      res.json(applications);
    } catch (error) {
      logger.error('Get applications error', error);
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await ApplicationModel.findById(parseInt(req.params.id));
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(application);
    } catch (error) {
      logger.error('Get application error', error);
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { job_offer_id, cv_id, match_score } = req.body;

      const application = await ApplicationModel.create({
        user_id: req.userId!,
        job_offer_id,
        cv_id,
        match_score,
        status: 'pending',
      });

      res.status(201).json(application);
    } catch (error) {
      logger.error('Create application error', error);
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await ApplicationModel.findById(parseInt(req.params.id));
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updated = await ApplicationModel.update(
        parseInt(req.params.id),
        req.body
      );

      res.json(updated);
    } catch (error) {
      logger.error('Update application error', error);
      next(error);
    }
  }

  static async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await ApplicationModel.findById(parseInt(req.params.id));
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Submit application via service
      const result = await ApplicationService.submitApplication(application);

      // Déterminer le statut de soumission
      let submissionStatus: 'success' | 'failed' | 'manual' | 'pending' = 'pending';
      let submissionMethod: 'api' | 'email' | 'manual' | 'redirect' = 'api';

      if (result.success) {
        if (result.message.includes('manually') || result.message.includes('Please submit')) {
          submissionStatus = 'manual';
          submissionMethod = 'redirect';
        } else {
          submissionStatus = 'success';
          submissionMethod = 'api';
        }
      } else {
        submissionStatus = 'failed';
      }

      await ApplicationModel.update(parseInt(req.params.id), {
        status: 'submitted',
        application_date: new Date(),
        submission_status: submissionStatus,
        submission_message: result.message,
        submission_date: result.submittedAt || new Date(),
        submission_method: submissionMethod,
      });

      res.json({
        message: 'Application submitted successfully',
        result: {
          ...result,
          submission_status: submissionStatus,
          submission_method: submissionMethod,
        },
      });
    } catch (error) {
      logger.error('Submit application error', error);
      next(error);
    }
  }
  static async bulkApply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { job_ids, cv_id } = req.body;

      if (!Array.isArray(job_ids) || job_ids.length === 0) {
        return res.status(400).json({ error: 'job_ids array is required' });
      }

      const results = [];
      let successCount = 0;

      for (const job_id of job_ids) {
        try {
          // Check if already applied
          const existing = await ApplicationModel.findByUserAndJob(req.userId!, job_id);
          if (existing) {
            results.push({ job_id, status: 'skipped', message: 'Already applied' });
            continue;
          }

          // Create application
          const application = await ApplicationModel.create({
            user_id: req.userId!,
            job_offer_id: job_id,
            cv_id: cv_id || null, // Optional CV
            status: 'submitted', // Auto-submit for mass apply
            application_date: new Date(),
            submission_status: 'success',
            submission_message: 'Mass applied via JobFlow SaaS',
            submission_method: 'api',
            match_score: 0 // Default score, can be updated later
          });

          results.push({ job_id, status: 'success', application_id: application.id });
          successCount++;
        } catch (err: any) {
          logger.error(`Failed to apply for job ${job_id}`, err);
          results.push({ job_id, status: 'failed', error: err.message });
        }
      }

      res.json({
        message: `Successfully applied to ${successCount} jobs`,
        total: job_ids.length,
        success_count: successCount,
        results
      });
    } catch (error) {
      logger.error('Bulk apply error', error);
      next(error);
    }
  }
}

