import { Response, NextFunction } from 'express';
import { RGPDService } from '../services/RGPDService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class RGPDController {
  /**
   * Exporte les données de l'utilisateur (Article 20 RGPD - Droit à la portabilité)
   */
  static async exportData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await RGPDService.exportUserData(req.userId!);

      // Retourner les données en JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.userId}-${Date.now()}.json"`);
      
      res.json(data);
    } catch (error: any) {
      logger.error('Export user data error', { userId: req.userId, error: error.message });
      next(error);
    }
  }

  /**
   * Supprime les données de l'utilisateur (Article 17 RGPD - Droit à l'oubli)
   */
  static async deleteData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await RGPDService.deleteUserData(req.userId!);
      
      res.json({
        message: 'Your data has been deleted in accordance with GDPR regulations.',
      });
    } catch (error: any) {
      logger.error('Delete user data error', { userId: req.userId, error: error.message });
      next(error);
    }
  }

  /**
   * Vérifie le consentement RGPD
   */
  static async checkConsent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const hasConsent = await RGPDService.checkConsent(req.userId!);
      res.json({ hasConsent });
    } catch (error: any) {
      logger.error('Check consent error', { userId: req.userId, error: error.message });
      next(error);
    }
  }

  /**
   * Enregistre le consentement RGPD
   */
  static async recordConsent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { consent } = req.body;
      
      if (typeof consent !== 'boolean') {
        return res.status(400).json({ error: 'Consent must be a boolean value' });
      }

      await RGPDService.recordConsent(req.userId!, consent);
      
      res.json({
        message: 'Consent recorded successfully',
        consent,
      });
    } catch (error: any) {
      logger.error('Record consent error', { userId: req.userId, error: error.message });
      next(error);
    }
  }
}

