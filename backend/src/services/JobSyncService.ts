import cron from 'node-cron';
import { JobOfferModel } from '../models/JobOffer';
import { LinkedInService } from './LinkedInService';
import { IndeedService } from './IndeedService';
import { config } from '../config/database';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

interface SyncStats {
  linkedin: {
    fetched: number;
    new: number;
    updated: number;
    errors: number;
  };
  indeed: {
    fetched: number;
    new: number;
    updated: number;
    errors: number;
  };
  total: {
    fetched: number;
    new: number;
    updated: number;
    errors: number;
  };
  duration: number;
}

/**
 * Service de synchronisation automatique des offres d'emploi
 * S'exécute selon un planning configuré avec gestion d'erreurs robuste
 */
export class JobSyncService {
  private static isRunning = false;
  private static syncStats: SyncStats | null = null;

  /**
   * Démarre le service de synchronisation automatique
   * Par défaut: toutes les heures (configurable via env)
   */
  static start() {
    // Fréquence configurable via variable d'environnement
    // Format: "0 * * * *" = toutes les heures
    // Format: "0 0 * * *" = tous les jours à minuit
    // Format: "0 */6 * * *" = toutes les 6 heures
    const cronSchedule = process.env.JOB_SYNC_CRON || '0 * * * *'; // Par défaut: toutes les heures
    
    cron.schedule(cronSchedule, async () => {
      if (this.isRunning) {
        logger.warn('Job sync already running, skipping...');
        return;
      }

      logger.info(`Starting scheduled job synchronization (cron: ${cronSchedule})`);
      await this.syncAllJobs();
    });

    // Nettoyage des offres obsolètes (tous les jours à 2h du matin)
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting cleanup of old job offers');
      await this.cleanupOldJobs();
    });

    logger.info(`Job sync service started (cron: ${cronSchedule}, cleanup: daily at 2 AM)`);
  }

  /**
   * Synchronise toutes les offres d'emploi pour tous les utilisateurs actifs
   * Avec gestion d'erreurs robuste et retry automatique
   */
  static async syncAllJobs(): Promise<SyncStats> {
    const startTime = Date.now();
    this.isRunning = true;
    
    const stats: SyncStats = {
      linkedin: { fetched: 0, new: 0, updated: 0, errors: 0 },
      indeed: { fetched: 0, new: 0, updated: 0, errors: 0 },
      total: { fetched: 0, new: 0, updated: 0, errors: 0 },
      duration: 0
    };

    logger.info('Starting job synchronization...');

    try {
      // Récupérer les préférences de tous les utilisateurs actifs
      const usersResult = await config.query(
        `SELECT DISTINCT up.user_id, up.job_keywords, up.locations, up.job_types, up.remote_only
         FROM user_preferences up
         JOIN users u ON up.user_id = u.id
         WHERE u.is_active = true`
      );

      if (usersResult.rows.length === 0) {
        logger.warn('No active users with preferences found');
        // Utiliser des paramètres par défaut pour une synchronisation globale
        await this.syncWithDefaultParams(stats);
      } else {
        // Synchroniser pour chaque utilisateur
        for (const userPref of usersResult.rows) {
          try {
            const keywords = userPref.job_keywords?.join(' ') || 'developer';
            const location = userPref.locations?.[0] || 'Paris, France';

            await this.syncForKeywordsAndLocation(keywords, location, stats);

            // Rate limiting entre les utilisateurs
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (error: any) {
            logger.error('Error syncing jobs for user', { 
              userId: userPref.user_id, 
              error: error.message 
            });
            stats.total.errors++;
          }
        }
      }

      // Calculer les totaux
      stats.total.fetched = stats.linkedin.fetched + stats.indeed.fetched;
      stats.total.new = stats.linkedin.new + stats.indeed.new;
      stats.total.updated = stats.linkedin.updated + stats.indeed.updated;
      stats.total.errors = stats.linkedin.errors + stats.indeed.errors;
      stats.duration = Date.now() - startTime;

      this.syncStats = stats;

      logger.info('Job synchronization completed', {
        duration: `${stats.duration}ms`,
        linkedin: stats.linkedin,
        indeed: stats.indeed,
        total: stats.total
      });

      return stats;
    } catch (error: any) {
      logger.error('Job synchronization error', { error: error.message, stack: error.stack });
      stats.total.errors++;
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Synchronise avec des paramètres par défaut (quand aucun utilisateur n'a de préférences)
   */
  private static async syncWithDefaultParams(stats: SyncStats) {
    const defaultKeywords = ['developer', 'engineer', 'designer', 'manager'];
    const defaultLocations = ['Paris, France', 'Lyon, France', 'Marseille, France'];

    for (const keyword of defaultKeywords) {
      for (const location of defaultLocations) {
        await this.syncForKeywordsAndLocation(keyword, location, stats);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Synchronise les offres pour des mots-clés et une localisation spécifiques
   */
  private static async syncForKeywordsAndLocation(
    keywords: string,
    location: string,
    stats: SyncStats
  ) {
    // Synchroniser LinkedIn avec retry
    try {
      const linkedInJobs = await retryWithBackoff(
        async () => {
          // Utiliser un userId par défaut (0) pour les synchronisations globales
          return await LinkedInService.fetchJobs(0, {
            keywords,
            location,
            limit: 50,
          });
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
        }
      );

      stats.linkedin.fetched += linkedInJobs.length;
      const linkedInResult = await this.saveJobs(linkedInJobs, 'linkedin');
      stats.linkedin.new += linkedInResult.new;
      stats.linkedin.updated += linkedInResult.updated;
    } catch (error: any) {
      logger.error('LinkedIn sync error', { 
        keywords, 
        location, 
        error: error.message 
      });
      stats.linkedin.errors++;
    }

    // Synchroniser Indeed avec retry
    try {
      const indeedJobs = await retryWithBackoff(
        async () => {
          return await IndeedService.fetchJobs({
            keywords,
            location,
            limit: 50,
          });
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
        }
      );

      stats.indeed.fetched += indeedJobs.length;
      const indeedResult = await this.saveJobs(indeedJobs, 'indeed');
      stats.indeed.new += indeedResult.new;
      stats.indeed.updated += indeedResult.updated;
    } catch (error: any) {
      logger.error('Indeed sync error', { 
        keywords, 
        location, 
        error: error.message 
      });
      stats.indeed.errors++;
    }
  }

  /**
   * Sauvegarde les offres avec extraction des compétences et détection des nouvelles/mises à jour
   */
  private static async saveJobs(
    jobs: any[],
    platform: 'linkedin' | 'indeed'
  ): Promise<{ new: number; updated: number }> {
    let newCount = 0;
    let updatedCount = 0;

    for (const job of jobs) {
      try {
        // Extraire les compétences depuis la description
        const skills = this.extractSkills(job.description || '', job.requirements || '');
        
        // Vérifier si l'offre existe déjà
        const existing = await JobOfferModel.findByExternalId(job.external_id);
        
        if (existing) {
          // Mise à jour
          await JobOfferModel.update(existing.id!, {
            ...job,
            requirements: job.requirements || job.description,
          });
          updatedCount++;
          logger.debug(`Updated job: ${job.external_id} (${job.title})`);
        } else {
          // Nouvelle offre
          await JobOfferModel.create({
            ...job,
            requirements: job.requirements || job.description,
          });
          newCount++;
          logger.debug(`New job: ${job.external_id} (${job.title})`);
        }
      } catch (error: any) {
        logger.error('Error saving job', { 
          external_id: job.external_id, 
          error: error.message 
        });
      }
    }

    return { new: newCount, updated: updatedCount };
  }

  /**
   * Extrait les compétences requises depuis la description et les requirements
   */
  private static extractSkills(description: string, requirements: string): string[] {
    const text = `${description} ${requirements}`.toLowerCase();
    const skills: string[] = [];

    // Liste de compétences techniques communes
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
      'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
      'git', 'ci/cd', 'jenkins', 'github actions',
      'agile', 'scrum', 'devops', 'microservices',
      'html', 'css', 'sass', 'less', 'webpack', 'babel',
      'machine learning', 'ai', 'data science', 'big data',
      'rest api', 'graphql', 'soap',
      'linux', 'unix', 'bash', 'shell scripting'
    ];

    for (const skill of commonSkills) {
      if (text.includes(skill)) {
        skills.push(skill);
      }
    }

    // Extraire les compétences mentionnées explicitement (ex: "Compétences: React, Node.js")
    const skillPatterns = [
      /compétences?[:\s]+([^\.]+)/i,
      /skills?[:\s]+([^\.]+)/i,
      /technologies?[:\s]+([^\.]+)/i,
      /requirements?[:\s]+([^\.]+)/i,
    ];

    for (const pattern of skillPatterns) {
      const match = text.match(pattern);
      if (match) {
        const skillsText = match[1];
        const extracted = skillsText.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2);
        skills.push(...extracted);
      }
    }

    // Dédupliquer et limiter
    return [...new Set(skills)].slice(0, 20);
  }

  /**
   * Synchronise les offres pour un utilisateur spécifique
   */
  static async syncForUser(userId: number): Promise<SyncStats> {
    const startTime = Date.now();
    const stats: SyncStats = {
      linkedin: { fetched: 0, new: 0, updated: 0, errors: 0 },
      indeed: { fetched: 0, new: 0, updated: 0, errors: 0 },
      total: { fetched: 0, new: 0, updated: 0, errors: 0 },
      duration: 0
    };

    try {
      const result = await config.query(
        'SELECT * FROM user_preferences WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        logger.warn(`No preferences found for user ${userId}`);
        return stats;
      }

      const prefs = result.rows[0];
      const keywords = prefs.job_keywords?.join(' ') || 'developer';
      const location = prefs.locations?.[0] || 'Paris, France';

      await this.syncForKeywordsAndLocation(keywords, location, stats);

      stats.duration = Date.now() - startTime;
      logger.info(`Synchronized jobs for user ${userId}`, stats);

      return stats;
    } catch (error: any) {
      logger.error(`Error syncing jobs for user ${userId}`, { error: error.message });
      stats.total.errors++;
      throw error;
    }
  }

  /**
   * Nettoie les offres obsolètes (plus de 30 jours par défaut)
   */
  static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const result = await config.query(
        `UPDATE job_offers 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE posted_date < NOW() - INTERVAL '${daysOld} days'
         AND is_active = true
         RETURNING id`
      );

      const deletedCount = result.rowCount || 0;
      logger.info(`Cleaned up ${deletedCount} old job offers (older than ${daysOld} days)`);

      // Optionnel: Supprimer complètement les offres très anciennes (plus de 90 jours)
      const hardDeleteResult = await config.query(
        `DELETE FROM job_offers 
         WHERE posted_date < NOW() - INTERVAL '90 days'
         AND is_active = false`
      );

      if (hardDeleteResult.rowCount && hardDeleteResult.rowCount > 0) {
        logger.info(`Hard deleted ${hardDeleteResult.rowCount} very old job offers`);
      }

      return deletedCount;
    } catch (error: any) {
      logger.error('Error cleaning up old jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupère les statistiques de la dernière synchronisation
   */
  static getLastSyncStats(): SyncStats | null {
    return this.syncStats;
  }

  /**
   * Force une synchronisation manuelle (pour tests ou webhooks)
   */
  static async forceSync(keywords?: string, location?: string): Promise<SyncStats> {
    if (this.isRunning) {
      throw new Error('Synchronization is already running');
    }

    const stats: SyncStats = {
      linkedin: { fetched: 0, new: 0, updated: 0, errors: 0 },
      indeed: { fetched: 0, new: 0, updated: 0, errors: 0 },
      total: { fetched: 0, new: 0, updated: 0, errors: 0 },
      duration: 0
    };

    const startTime = Date.now();
    this.isRunning = true;

    try {
      if (keywords && location) {
        await this.syncForKeywordsAndLocation(keywords, location, stats);
      } else {
        await this.syncAllJobs();
        return this.syncStats || stats;
      }

      stats.duration = Date.now() - startTime;
      return stats;
    } finally {
      this.isRunning = false;
    }
  }
}
