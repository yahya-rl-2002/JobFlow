import { LinkedInTokenModel } from '../models/LinkedInToken';
import { UserModel } from '../models/User';
import { ApplicationModel } from '../models/Application';
import { CVModel } from '../models/CV';
import { config } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Service pour la conformité RGPD
 */
export class RGPDService {
  /**
   * Exporte toutes les données d'un utilisateur (droit à la portabilité - Article 20 RGPD)
   * 
   * @param userId - ID de l'utilisateur
   * @returns Données exportées au format JSON
   */
  static async exportUserData(userId: number): Promise<any> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const linkedinToken = await LinkedInTokenModel.findByUserId(userId);
      const applications = await ApplicationModel.findByUserId(userId);
      const cvs = await CVModel.findByUserId(userId);

      // Récupérer les préférences
      const preferencesResult = await config.query(
        'SELECT * FROM user_preferences WHERE user_id = $1',
        [userId]
      );
      const preferences = preferencesResult.rows[0] || null;

      // Récupérer les résultats de matching
      const matchingResult = await config.query(
        'SELECT * FROM matching_results WHERE user_id = $1',
        [userId]
      );

      const exportData = {
        user: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          created_at: user.created_at,
          gdpr_consent: user.gdpr_consent,
          gdpr_consent_date: user.gdpr_consent_date,
        },
        linkedin: {
          connected: !!linkedinToken,
          connected_at: linkedinToken?.created_at || null,
          // Ne pas inclure les tokens dans l'export pour la sécurité
        },
        cvs: cvs.map((cv) => ({
          file_name: cv.file_name,
          file_type: cv.file_type,
          created_at: cv.created_at,
          // Ne pas inclure le chemin du fichier pour la sécurité
        })),
        applications: applications.map((app) => ({
          job_title: app.job_title,
          company: app.company,
          platform: app.platform,
          status: app.status,
          match_score: app.match_score,
          application_date: app.application_date,
        })),
        preferences: preferences ? {
          job_keywords: preferences.job_keywords,
          locations: preferences.locations,
          job_types: preferences.job_types,
          salary_min: preferences.salary_min,
          salary_max: preferences.salary_max,
          remote_only: preferences.remote_only,
          auto_apply: preferences.auto_apply,
          min_match_score: preferences.min_match_score,
        } : null,
        matching_results: matchingResult.rows.map((match) => ({
          match_score: match.match_score,
          created_at: match.created_at,
        })),
        exported_at: new Date().toISOString(),
        format_version: '1.0',
      };

      logger.info(`User data exported for RGPD compliance`, { userId });

      return exportData;
    } catch (error: any) {
      logger.error('Error exporting user data', { userId, error: error.message });
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Supprime toutes les données d'un utilisateur (droit à l'oubli - Article 17 RGPD)
   * 
   * @param userId - ID de l'utilisateur
   */
  static async deleteUserData(userId: number): Promise<void> {
    try {
      // 1. Supprimer le token LinkedIn
      try {
        await LinkedInTokenModel.delete(userId);
      } catch (error) {
        logger.warn('Error deleting LinkedIn token', { userId, error });
      }

      // 2. Anonymiser les applications (soft delete avec anonymisation)
      const applications = await ApplicationModel.findByUserId(userId);
      for (const app of applications) {
        await ApplicationModel.update(app.id!, {
          status: 'deleted',
          notes: 'Deleted for RGPD compliance',
        });
      }

      // 3. Supprimer les CVs (soft delete)
      const cvs = await CVModel.findByUserId(userId);
      for (const cv of cvs) {
        await CVModel.delete(cv.id!);
      }

      // 4. Supprimer les préférences
      await config.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);

      // 5. Supprimer les résultats de matching
      await config.query('DELETE FROM matching_results WHERE user_id = $1', [userId]);

      // 6. Anonymiser l'utilisateur (soft delete)
      await UserModel.delete(userId);

      logger.info(`User data deleted for RGPD compliance`, { userId });
    } catch (error: any) {
      logger.error('Error deleting user data', { userId, error: error.message });
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Vérifie le consentement RGPD d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns true si l'utilisateur a donné son consentement
   */
  static async checkConsent(userId: number): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      return user?.gdpr_consent === true;
    } catch (error) {
      logger.error('Error checking GDPR consent', { userId, error });
      return false;
    }
  }

  /**
   * Enregistre le consentement RGPD
   * 
   * @param userId - ID de l'utilisateur
   * @param consent - Consentement donné
   */
  static async recordConsent(userId: number, consent: boolean): Promise<void> {
    try {
      await UserModel.update(userId, {
        gdpr_consent: consent,
        gdpr_consent_date: consent ? new Date() : null,
      });

      logger.info(`GDPR consent recorded`, { userId, consent });
    } catch (error) {
      logger.error('Error recording GDPR consent', { userId, error });
      throw new Error('Failed to record GDPR consent');
    }
  }
}

