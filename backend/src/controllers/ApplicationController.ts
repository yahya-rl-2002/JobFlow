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

      // ============================================
      // 1. LOGS DÉTAILLÉS AU DÉBUT
      // ============================================
      logger.info('=== BULK APPLY REQUEST START ===', {
        userId: req.userId,
        job_ids,
        job_ids_type: typeof job_ids,
        isArray: Array.isArray(job_ids),
        cv_id: cv_id || 'not provided',
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

      logger.info('Normalized job IDs', {
        userId: req.userId,
        normalizedJobIds,
        count: normalizedJobIds.length
      });

      // Récupérer les offres depuis la base de données
      const { JobOfferModel } = await import('../models/JobOffer');
      const jobs = await Promise.all(
        normalizedJobIds.map((id: number) => JobOfferModel.findById(id))
      );
      
      const validJobs = jobs.filter(j => j !== null && j.user_id === req.userId!);

      if (validJobs.length === 0) {
        logger.warn('No valid jobs found', { userId: req.userId, requestedIds: normalizedJobIds });
        return res.status(404).json({ error: 'No valid jobs found' });
      }

      logger.info('Valid jobs retrieved', {
        userId: req.userId,
        validJobsCount: validJobs.length,
        validJobsIds: validJobs.map(j => j.id),
        platforms: validJobs.map(j => j.platform)
      });

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

      // ============================================
      // 2. ANALYSE INTELLIGENTE DES PLATEFORMES
      // ============================================
      
      // 1. Analyse des plateformes demandées
      const platforms = [...new Set(validJobs.map(j => j.platform?.toLowerCase() || 'unknown').filter(p => p !== 'unknown'))];
      const hasLinkedInJobs = platforms.some(p => p.includes('linkedin'));
      const hasIndeedJobs = platforms.some(p => p.includes('indeed'));
      const hasOtherPlatforms = platforms.some(p => !p.includes('linkedin') && !p.includes('indeed'));

      // 2. Vérification du Token LinkedIn en base
      const { LinkedInTokenModel } = await import('../models/LinkedInToken');
      let linkedInToken;
      try {
        linkedInToken = await LinkedInTokenModel.findByUserId(req.userId!);
      } catch (error: any) {
        logger.error('Error checking LinkedIn token', { 
          userId: req.userId, 
          error: error?.message || String(error) 
        });
        linkedInToken = null;
      }
      
      const hasLinkedInOAuth = !!linkedInToken;

      // 3. Logs de débogage (Crucial pour comprendre l'erreur)
      logger.info('=== BULK APPLY DEBUG INFO ===', { 
        userId: req.userId,
        platformsRequested: platforms,
        hasLinkedInJobs: hasLinkedInJobs,
        hasIndeedJobs: hasIndeedJobs,
        hasOtherPlatforms: hasOtherPlatforms,
        hasLinkedInToken: hasLinkedInOAuth,
        tokenData: linkedInToken ? {
          exists: true,
          expires_at: linkedInToken.expires_at,
          has_refresh_token: !!linkedInToken.refresh_token
        } : 'Missing',
        validJobsCount: validJobs.length,
        validJobsDetails: validJobs.map(j => ({
          id: j.id,
          platform: j.platform,
          title: j.title?.substring(0, 50)
        }))
      });

      // 4. Validation Intelligente
      // On ne rejette QUE si on a besoin de LinkedIn et qu'on ne l'a pas
      if (hasLinkedInJobs && !hasLinkedInOAuth) {
        logger.warn(`Blocage: Tentative de postuler sur LinkedIn sans token pour l'user ${req.userId}`, {
          userId: req.userId,
          platforms,
          linkedInJobsCount: validJobs.filter(j => j.platform?.toLowerCase().includes('linkedin')).length
        });
        return res.status(400).json({ 
          error: 'Connexion LinkedIn requise pour ces offres.',
          code: 'LINKEDIN_NOT_CONNECTED',
          details: 'Vous avez sélectionné des offres LinkedIn mais votre compte n\'est pas connecté.',
          redirectTo: '/settings',
          message: 'Please connect your LinkedIn account in settings to apply to LinkedIn jobs.'
        });
      }

      // ============================================
      // 3. RÉCUPÉRATION DES PRÉFÉRENCES ET TOKENS
      // ============================================

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

      // Préparer les données d'authentification LinkedIn OAuth (SEULEMENT si nécessaire)
      const { LinkedInService } = await import('../services/LinkedInService');
      let linkedInAccessToken: string | null = null;

      // Récupérer le token LinkedIn UNIQUEMENT si on a des offres LinkedIn
      if (hasLinkedInJobs) {
        try {
          linkedInAccessToken = await LinkedInService.getAccessToken(req.userId!);
          logger.info('LinkedIn OAuth token retrieved successfully', { 
            userId: req.userId,
            tokenLength: linkedInAccessToken?.length || 0
          });
        } catch (error: any) {
          logger.error('Failed to get LinkedIn OAuth token', { 
            userId: req.userId, 
            error: error?.message || String(error),
            errorStack: error?.stack,
            errorName: error?.name
          });
          
          // Déterminer le type d'erreur pour un message plus précis
          const errorMessage = error?.message || String(error) || '';
          let errorCode = 'LINKEDIN_TOKEN_EXPIRED';
          let userMessage = 'Token LinkedIn expiré ou invalide. Veuillez reconnecter votre compte LinkedIn dans les paramètres.';
          
          if (errorMessage.includes('refresh token expired') || errorMessage.includes('Refresh token expired')) {
            errorCode = 'LINKEDIN_REFRESH_TOKEN_EXPIRED';
            userMessage = 'Votre session LinkedIn a expiré. Veuillez vous reconnecter à LinkedIn dans les paramètres.';
          } else if (errorMessage.includes('no refresh token') || errorMessage.includes('no refresh token available')) {
            errorCode = 'LINKEDIN_NO_REFRESH_TOKEN';
            userMessage = 'Session LinkedIn invalide. Veuillez vous reconnecter à LinkedIn dans les paramètres.';
          } else if (errorMessage.includes('re-authenticate') || errorMessage.includes('reconnect') || errorMessage.includes('Please authenticate')) {
            errorCode = 'LINKEDIN_REAUTH_REQUIRED';
            userMessage = 'Veuillez vous reconnecter à LinkedIn dans les paramètres pour continuer.';
          } else if (errorMessage.includes('No LinkedIn token found')) {
            errorCode = 'LINKEDIN_NOT_CONNECTED';
            userMessage = 'LinkedIn non connecté. Veuillez connecter votre compte LinkedIn dans les paramètres.';
          }
          
          return res.status(400).json({
            error: userMessage,
            code: errorCode,
            message: 'Please reconnect your LinkedIn account in settings.',
            redirectTo: '/settings'
          });
        }

        if (!linkedInAccessToken) {
          logger.error('LinkedIn access token is null or empty', { userId: req.userId });
          return res.status(400).json({
            error: 'Token LinkedIn manquant. Veuillez reconnecter votre compte LinkedIn.',
            code: 'LINKEDIN_TOKEN_MISSING',
            redirectTo: '/settings'
          });
        }
      } else {
        logger.info('No LinkedIn jobs, skipping LinkedIn token retrieval', {
          userId: req.userId,
          platforms
        });
      }

      // ============================================
      // 4. PRÉPARATION DE LA REQUÊTE NLP
      // ============================================

      // Appeler le service d'automatisation Python
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:5001';
      const axios = (await import('axios')).default;

      logger.info(`Starting automated application for ${validJobs.length} jobs via NLP service`, {
        userId: req.userId,
        platforms
      });

      // Préparer la requête pour le service NLP
      const nlpRequestPayload = {
        jobs: validJobs.map(job => ({
          id: job.id,
          url: job.url,
          platform: job.platform || 'linkedin',
          title: job.title
        })),
        cv_path: cv.file_path,
        credentials: {
          linkedin_oauth_token: linkedInAccessToken || undefined
        },
        cover_letter: coverLetter,
        max_retries: 2,
        delay_between_applications: 3
      };

      logger.info('=== SENDING REQUEST TO NLP SERVICE ===', {
        userId: req.userId,
        jobsCount: validJobs.length,
        cvPath: cv.file_path,
        hasLinkedInToken: !!linkedInAccessToken,
        tokenLength: linkedInAccessToken?.length || 0,
        platforms: platforms,
        payloadJobs: nlpRequestPayload.jobs.map(j => ({
          id: j.id,
          platform: j.platform,
          title: j.title?.substring(0, 30)
        }))
      });

      const response = await axios.post(`${nlpServiceUrl}/apply-jobs`, nlpRequestPayload, {
        timeout: 600000, // 10 minutes pour plusieurs candidatures avec retries
      });

      // Vérifier la réponse du service NLP
      if (!response.data || !response.data.results) {
        logger.error('Invalid response from NLP service', {
          userId: req.userId,
          responseData: response.data
        });
        return res.status(500).json({
          error: 'Réponse invalide du service de candidature. Veuillez réessayer.',
          code: 'NLP_SERVICE_ERROR'
        });
      }

      logger.info('NLP service response received', {
        userId: req.userId,
        resultsCount: response.data.results?.length || 0,
        successCount: response.data.success_count || 0
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
        errorStack: error?.stack,
        userId: req.userId,
        body: req.body,
        errorResponse: error?.response?.data,
        errorStatus: error?.response?.status,
        errorCode: error?.code
      });
      
      // Si c'est une erreur 400 du service NLP, retourner un message plus clair
      if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.error || error?.message || 'Erreur lors de la candidature';
        const errorCode = error?.response?.data?.code || 'APPLICATION_ERROR';
        return res.status(400).json({
          error: errorMessage,
          code: errorCode,
          details: error?.response?.data,
          message: 'Erreur lors de la candidature. Vérifiez les logs pour plus de détails.'
        });
      }
      
      // Si c'est une erreur de timeout
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        return res.status(504).json({
          error: 'Timeout lors de la candidature. Le processus prend trop de temps.',
          code: 'TIMEOUT_ERROR',
          message: 'Please try with fewer jobs or check your connection.'
        });
      }
      
      // Si c'est une erreur de connexion au service NLP
      if (error?.code === 'ECONNREFUSED' || error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
        return res.status(503).json({
          error: 'Service de candidature indisponible. Veuillez réessayer plus tard.',
          code: 'NLP_SERVICE_UNAVAILABLE',
          message: 'The application service is currently unavailable. Please check if the NLP service is running.'
        });
      }

      // Si c'est une erreur du service NLP (500)
      if (error?.response?.status === 500 || error?.response?.data?.error) {
        return res.status(500).json({
          error: 'Erreur du service de candidature automatique',
          code: 'NLP_SERVICE_ERROR',
          message: error?.response?.data?.error || error?.message || 'Erreur inconnue',
          suggestion: 'Vérifiez que ChromeDriver est installé et que vos identifiants sont corrects.'
        });
      }

      // Retourner un message d'erreur générique
      const errorMessage = error?.message || 'Une erreur inattendue s\'est produite';
      return res.status(500).json({
        error: errorMessage,
        code: 'INTERNAL_ERROR',
        message: 'Erreur lors du traitement de la candidature. Veuillez réessayer.'
      });
    }
  }
}

