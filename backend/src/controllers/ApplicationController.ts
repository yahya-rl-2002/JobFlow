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

      logger.info('Bulk apply request', { 
        userId: req.userId, 
        job_ids, 
        job_ids_type: typeof job_ids,
        isArray: Array.isArray(job_ids),
        body: req.body 
      });

      if (!job_ids) {
        return res.status(400).json({ error: 'job_ids is required' });
      }

      // Normaliser job_ids en tableau si nécessaire
      let normalizedJobIds: number[];
      if (Array.isArray(job_ids)) {
        normalizedJobIds = job_ids.map(id => parseInt(String(id))).filter(id => !isNaN(id));
      } else if (typeof job_ids === 'string') {
        // Si c'est une chaîne, essayer de la parser
        try {
          normalizedJobIds = JSON.parse(job_ids).map((id: any) => parseInt(String(id))).filter((id: number) => !isNaN(id));
        } catch {
          normalizedJobIds = [parseInt(job_ids)].filter(id => !isNaN(id));
        }
      } else {
        normalizedJobIds = [parseInt(String(job_ids))].filter(id => !isNaN(id));
      }

      if (normalizedJobIds.length === 0) {
        return res.status(400).json({ error: 'job_ids must be a non-empty array of numbers' });
      }

      // Récupérer les offres
      const { JobOfferModel } = await import('../models/JobOffer');
      const jobs = await Promise.all(
        normalizedJobIds.map((id: number) => JobOfferModel.findById(id))
      );
      
      const validJobs = jobs.filter(j => j !== null && j.user_id === req.userId!);
      
      if (validJobs.length === 0) {
        return res.status(404).json({ error: 'No valid jobs found' });
      }

      // Récupérer le CV
      const { CVModel } = await import('../models/CV');
      const cv = cv_id 
        ? await CVModel.findById(cv_id) 
        : await CVModel.findLatestByUserId(req.userId!);
        
      logger.info('CV check', { 
        userId: req.userId,
        cv_id: cv_id || 'latest',
        cvFound: !!cv,
        cvPath: cv?.file_path
      });
        
      if (!cv || !cv.file_path) {
        logger.warn('No CV found for user', { userId: req.userId });
        return res.status(400).json({ 
          error: 'CV not found. Please upload a CV first.',
          code: 'CV_NOT_FOUND'
        });
      }

      // Vérifier que le fichier CV existe
      const fs = await import('fs/promises');
      try {
        await fs.access(cv.file_path);
        logger.info('CV file exists', { path: cv.file_path });
      } catch (error) {
        logger.error('CV file not found on server', { path: cv.file_path, error });
        return res.status(400).json({ 
          error: 'CV file not found on server. Please re-upload your CV.',
          code: 'CV_FILE_NOT_FOUND'
        });
      }

      // Vérifier les plateformes des offres sélectionnées
      const platforms = [...new Set(validJobs.map(j => j.platform))];
      
      // Vérifier la connexion LinkedIn OAuth (OBLIGATOIRE)
      const { LinkedInTokenModel } = await import('../models/LinkedInToken');
      const linkedInToken = await LinkedInTokenModel.findByUserId(req.userId!);
      const hasLinkedInOAuth = !!linkedInToken;
      
      logger.info('Platform authentication check', { 
        userId: req.userId,
        platforms,
        hasLinkedInOAuth,
        validJobsCount: validJobs.length
      });
      
      // LinkedIn OAuth est OBLIGATOIRE pour toutes les candidatures
      if (!hasLinkedInOAuth) {
        logger.warn('LinkedIn OAuth not connected', { userId: req.userId });
        return res.status(400).json({ 
          error: 'LinkedIn non connecté. Veuillez connecter votre compte LinkedIn via OAuth dans les paramètres.',
          code: 'LINKEDIN_NOT_CONNECTED',
          message: 'Please connect your LinkedIn account via OAuth in your settings to use automated applications.',
          redirectTo: '/settings'
        });
      }

      // Récupérer les préférences utilisateur pour la lettre de motivation
      const { config } = await import('../config/database');
      let coverLetter: string | undefined;
      try {
        const prefsResult = await config.query(
          'SELECT default_cover_letter FROM user_preferences WHERE user_id = $1',
          [req.userId!]
        );
        if (prefsResult.rows[0]) {
          coverLetter = prefsResult.rows[0].default_cover_letter;
        }
      } catch {
        // Si pas de préférences, pas de lettre de motivation
      }

      // Préparer les données d'authentification LinkedIn OAuth (OBLIGATOIRE)
      const { LinkedInService } = await import('../services/LinkedInService');
      let linkedInAccessToken: string | null = null;
      
      try {
        linkedInAccessToken = await LinkedInService.getAccessToken(req.userId!);
        logger.info('LinkedIn OAuth token retrieved successfully', { userId: req.userId });
      } catch (error: any) {
        logger.error('Failed to get LinkedIn OAuth token', { userId: req.userId, error: error.message });
        return res.status(400).json({
          error: 'Token LinkedIn expiré. Veuillez reconnecter votre compte LinkedIn dans les paramètres.',
          code: 'LINKEDIN_TOKEN_EXPIRED',
          redirectTo: '/settings'
        });
      }

      // Appeler le service d'automatisation Python
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:5001';
      const axios = (await import('axios')).default;
      
      logger.info(`Starting automated application for ${validJobs.length} jobs via NLP service`, {
        hasLinkedInOAuth: true,
        userId: req.userId
      });

      const response = await axios.post(`${nlpServiceUrl}/apply-jobs`, {
        jobs: validJobs.map(job => ({
          id: job.id,
          url: job.url,
          platform: job.platform,
          title: job.title
        })),
        cv_path: cv.file_path,
        // Utiliser UNIQUEMENT OAuth LinkedIn
        credentials: {
          linkedin_oauth_token: linkedInAccessToken,
        },
        cover_letter: coverLetter
      }, {
        timeout: 300000, // 5 minutes pour plusieurs candidatures
      });

      // Sauvegarder les résultats en base de données
      const results = [];
      let successCount = 0;

      for (const result of response.data.results) {
        try {
          const job = validJobs.find(j => j.id === result.job_id);
          if (!job) continue;

          // Vérifier si déjà candidaté
          const existing = await ApplicationModel.findByUserAndJob(req.userId!, job.id!);
          if (existing) {
            results.push({ job_id: job.id, status: 'skipped', message: 'Already applied' });
            continue;
          }

          // Créer l'enregistrement de candidature
          const application = await ApplicationModel.create({
            user_id: req.userId!,
            job_offer_id: job.id!,
            cv_id: cv.id || null,
            status: result.success ? 'submitted' : 'failed',
            application_date: new Date(),
            submission_status: result.success ? 'success' : 'failed',
            submission_message: result.message,
            submission_method: 'automated',
            match_score: 0
          });

          results.push({ 
            job_id: job.id, 
            status: result.success ? 'success' : 'failed',
            application_id: application.id,
            message: result.message
          });
          
          if (result.success) successCount++;
        } catch (err: any) {
          logger.error(`Failed to save application for job ${result.job_id}`, err);
          results.push({ job_id: result.job_id, status: 'failed', error: err.message });
        }
      }

      res.json({
        message: `Successfully applied to ${successCount} out of ${validJobs.length} jobs`,
        total: validJobs.length,
        success_count: successCount,
        failed_count: validJobs.length - successCount,
        results
      });
    } catch (error: any) {
      logger.error('Bulk apply error', { 
        error: error?.message || String(error),
        stack: error?.stack,
        userId: req.userId,
        body: req.body
      });
      
      // Si c'est une erreur du service NLP, donner un message plus clair
      if (error.response?.data?.error) {
        return res.status(500).json({ 
          error: 'Automated application failed',
          message: error.response.data.error,
          suggestion: 'Please check that ChromeDriver is installed and your credentials are correct.'
        });
      }
      
      // Retourner un message d'erreur plus clair
      const errorMessage = error?.message || 'An unexpected error occurred';
      return res.status(500).json({ 
        error: errorMessage,
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

