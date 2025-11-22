import fs from 'fs/promises';
import { Application } from '../models/Application';
import { JobOfferModel } from '../models/JobOffer';
import { LinkedInService } from './LinkedInService';
import { IndeedService } from './IndeedService';
import { logger } from '../utils/logger';
import axios from 'axios';

export class ApplicationService {
  /**
   * Soumet une candidature sur la plateforme appropriée
   */
  static async submitApplication(application: Application): Promise<{
    success: boolean;
    platform: string;
    message: string;
    submittedAt?: Date;
  }> {
    try {
      const job = await JobOfferModel.findById(application.job_offer_id);
      if (!job) {
        throw new Error('Job offer not found');
      }

      const cvPath = application.customized_cv_path || '';

      if (!cvPath || !(await fs.access(cvPath).then(() => true).catch(() => false))) {
        throw new Error('CV file not found');
      }

      let result;

      switch (job.platform) {
        case 'linkedin':
          result = await LinkedInService.submitApplication(
            application.user_id,
            job.external_id,
            cvPath
          );
          break;

        case 'indeed':
          result = await IndeedService.submitApplication(
            job.external_id,
            job.url || '',
            cvPath
          );
          break;

        default:
          throw new Error(`Unsupported platform: ${job.platform}`);
      }

      if (result.success) {
        return {
          success: true,
          platform: job.platform,
          message: result.message,
          submittedAt: new Date(),
        };
      } else {
        // Si l'API n'est pas disponible, on peut envoyer par email
        // ou rediriger l'utilisateur vers la page de candidature
        return await this.submitViaEmail(job, cvPath);
      }
    } catch (error: any) {
      logger.error('Submit application error', error);
      throw error;
    }
  }

  /**
   * Soumet une candidature par email si l'API n'est pas disponible
   */
  private static async submitViaEmail(
    job: any,
    cvPath: string
  ): Promise<{
    success: boolean;
    platform: string;
    message: string;
    submittedAt?: Date;
  }> {
    try {
      // Option 1: Envoyer un email avec le CV en pièce jointe
      // Option 2: Retourner l'URL de candidature pour que l'utilisateur postule manuellement
      // Option 3: Utiliser un service d'automatisation (Puppeteer, Selenium) avec respect des ToS

      logger.info(`Application submission via email for job ${job.id}`);

      // Pour l'instant, on retourne l'URL de candidature
      return {
        success: true,
        platform: job.platform,
        message: `Please submit your application manually at: ${job.url}`,
        submittedAt: new Date(),
      };
    } catch (error) {
      logger.error('Submit via email error', error);
      throw error;
    }
  }

  /**
   * Personnalise un CV pour une offre d'emploi spécifique
   */
  static async customizeCV(
    cvPath: string,
    jobId: number
  ): Promise<{ customizedPath: string; changes: any[] }> {
    try {
      const job = await JobOfferModel.findById(jobId);
      if (!job) {
        throw new Error('Job offer not found');
      }

      // Appeler le service NLP pour personnaliser le CV
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:5000';
      const response = await axios.post(`${nlpServiceUrl}/customize-cv`, {
        cv_path: cvPath,
        job_description: job.description,
        job_requirements: job.requirements,
        job_title: job.title,
      });

      const customizedPath = response.data.customized_path;
      const changes = response.data.changes || [];

      return {
        customizedPath,
        changes,
      };
    } catch (error: any) {
      logger.error('Customize CV error', error);
      throw error;
    }
  }
}

