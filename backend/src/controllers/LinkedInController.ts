import { Request, Response, NextFunction } from 'express';
import { LinkedInService } from '../services/LinkedInService';
import { LinkedInTokenModel } from '../models/LinkedInToken';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class LinkedInController {
  /**
   * Génère l'URL d'autorisation OAuth2
   */
  static getAuthorizationUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const state = req.query.state as string;
      const authUrl = LinkedInService.getAuthorizationUrl(state);

      res.json({
        authorization_url: authUrl,
        state: state,
      });
    } catch (error) {
      logger.error('Get LinkedIn auth URL error', error);
      next(error);
    }
  }

  /**
   * Gère le callback OAuth2 après l'autorisation
   */
  static async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error, error_description } = req.query;

      // LinkedIn redirige vers cette URL avec error si l'autorisation échoue
      if (error) {
        logger.error('LinkedIn authorization error in callback', {
          error,
          error_description,
          query: req.query,
        });

        const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/linkedin/callback?error=${encodeURIComponent(error as string)}${error_description ? `&error_description=${encodeURIComponent(error_description as string)}` : ''}`;
        return res.redirect(errorUrl);
      }

      if (!code) {
        logger.error('LinkedIn callback missing authorization code', { query: req.query });
        const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/linkedin/callback?error=missing_code`;
        return res.redirect(errorUrl);
      }

      // Le code sera traité par le frontend via la page callback
      // On redirige simplement vers la page callback avec le code
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/linkedin/callback?code=${code}${state ? `&state=${state}` : ''}`;

      res.redirect(redirectUrl);
    } catch (error: any) {
      logger.error('LinkedIn callback error', error);
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/linkedin/callback?error=${encodeURIComponent(error.message)}`;
      res.redirect(errorUrl);
    }
  }

  /**
   * Connecte l'utilisateur à LinkedIn (associe le token à l'utilisateur)
   */
  static async connect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { authorization_code } = req.body;

      if (!authorization_code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      // Échanger le code contre un token
      const tokenData = await LinkedInService.exchangeCodeForToken(authorization_code);

      // Sauvegarder le token pour l'utilisateur
      await LinkedInService.saveToken(req.userId!, tokenData);

      // Récupérer le profil pour vérifier la connexion
      const profile = await LinkedInService.getUserProfile(req.userId!);

      res.json({
        message: 'LinkedIn connected successfully',
        profile: {
          id: profile.id,
          firstName: profile.localizedFirstName,
          lastName: profile.localizedLastName,
        },
      });
    } catch (error: any) {
      logger.error('Connect LinkedIn error', error);
      next(error);
    }
  }

  /**
   * Récupère le profil LinkedIn de l'utilisateur
   */
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await LinkedInService.getUserProfile(req.userId!);
      res.json(profile);
    } catch (error: any) {
      logger.error('Get LinkedIn profile error', error);
      if (error.message?.includes('No LinkedIn token')) {
        return res.status(404).json({ error: 'LinkedIn not connected. Please connect your LinkedIn account first.' });
      }
      next(error);
    }
  }

  /**
   * Déconnecte l'utilisateur de LinkedIn
   */
  static async disconnect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await LinkedInTokenModel.delete(req.userId!);
      res.json({ message: 'LinkedIn disconnected successfully' });
    } catch (error) {
      logger.error('Disconnect LinkedIn error', error);
      next(error);
    }
  }

  /**
   * Vérifie le statut du token LinkedIn
   */
  static async getTokenStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = await LinkedInTokenModel.findByUserId(req.userId!);

      if (!token) {
        return res.json({
          connected: false,
          message: 'LinkedIn not connected',
        });
      }

      const now = new Date();
      const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
      const isExpired = expiresAt ? expiresAt.getTime() < now.getTime() : false;
      const expiresIn = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) : null;

      res.json({
        connected: true,
        expires_at: token.expires_at,
        expires_in: expiresIn,
        is_expired: isExpired,
        has_refresh_token: !!token.refresh_token,
        scope: token.scope,
      });
    } catch (error) {
      logger.error('Get LinkedIn token status error', error);
      next(error);
    }
  }
}

