import axios, { AxiosError } from 'axios';
import { config } from '../config/config';
import { JobOffer } from '../models/JobOffer';
import { LinkedInTokenModel, LinkedInToken } from '../models/LinkedInToken';
import { logger } from '../utils/logger';
import { TokenEncryption } from '../utils/tokenEncryption';
import {
  LinkedInError,
  LinkedInAuthError,
  LinkedInTokenError,
  LinkedInAPIError,
  LinkedInRateLimitError,
} from '../utils/LinkedInErrors';
import { retryWithBackoff } from '../utils/retry';

interface LinkedInJobSearchParams {
  keywords: string;
  location: string;
  limit?: number;
  period?: '24h' | 'week' | 'month';
}

interface LinkedInOAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
}

export class LinkedInService {
  private static readonly API_BASE_URL = 'https://api.linkedin.com/v2';
  private static readonly AUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2';
  private static readonly CLIENT_ID = config.linkedin.clientId;
  private static readonly CLIENT_SECRET = config.linkedin.clientSecret;
  private static readonly REDIRECT_URI = config.linkedin.redirectUri;

  // LinkedIn utilise maintenant OpenID Connect
  // Scopes valides: openid (requis), profile, email
  // Note: w_member_social nécessite un produit LinkedIn spécifique
  // Commençons avec les scopes de base pour tester
  private static readonly SCOPES = 'openid profile email';

  /**
   * Génère l'URL d'autorisation OAuth2 pour LinkedIn
   */
  static getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES,
      state: state || this.generateState(),
    });

    return `${this.AUTH_BASE_URL}/authorization?${params.toString()}`;
  }

  /**
   * Génère un state pour la sécurité OAuth2
   */
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Échange le code d'autorisation contre un token d'accès
   */
  static async exchangeCodeForToken(authorizationCode: string): Promise<LinkedInOAuthResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
      });

      const response = await axios.post(
        `${this.AUTH_BASE_URL}/accessToken`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data || {};
      logger.error('LinkedIn token exchange error', {
        status: error.response?.status,
        error: errorData.error,
        error_description: errorData.error_description,
        full_error: errorData,
      });

      const errorMessage = errorData.error_description || errorData.error || error.message;
      throw new Error(`LinkedIn authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Rafraîchit un token d'accès expiré
   */
  static async refreshAccessToken(refreshToken: string): Promise<LinkedInOAuthResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
      });

      const response = await axios.post(
        `${this.AUTH_BASE_URL}/accessToken`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('LinkedIn token refresh error', {
        error: error.response?.data || error.message,
      });
      throw new Error(`Failed to refresh token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Obtient ou rafraîchit le token d'accès pour un utilisateur
   */
  static async getAccessToken(userId: number): Promise<string> {
    try {
      let token = await LinkedInTokenModel.findByUserId(userId);

      if (!token) {
        throw new LinkedInTokenError('No LinkedIn token found for user. Please authenticate first.');
      }

      // Décrypter le token
      let decryptedAccessToken: string;
      let decryptedRefreshToken: string | null = null;

      try {
        decryptedAccessToken = this.decryptToken(token.access_token);
        if (token.refresh_token) {
          decryptedRefreshToken = this.decryptToken(token.refresh_token);
        }
      } catch (decryptError) {
        logger.error('Failed to decrypt token', { userId, error: decryptError });
        throw new LinkedInTokenError('Failed to decrypt stored token. Please re-authenticate.');
      }

      // Vérifier si le token est expiré (avec une marge de 5 minutes)
      const now = new Date();
      const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
      const timeUntilExpiry = expiresAt ? expiresAt.getTime() - now.getTime() : -1; // -1 si pas de date d'expiration
      const isExpired = timeUntilExpiry <= 0;
      const isExpiringSoon = timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000; // Moins de 5 minutes

      if (isExpired || isExpiringSoon) {
        // Token expiré ou sur le point d'expirer, essayer de le rafraîchir
        if (!decryptedRefreshToken) {
          logger.warn(`LinkedIn token expired and no refresh token available for user ${userId}`);
          // Supprimer le token expiré
          await LinkedInTokenModel.delete(userId);
          throw new LinkedInTokenError('Token expired and no refresh token available. Please re-authenticate with LinkedIn.');
        }

        logger.info(`Refreshing LinkedIn token for user ${userId} (expired: ${isExpired}, expiring soon: ${isExpiringSoon})`);

        try {
          const newTokenData = await this.refreshAccessToken(decryptedRefreshToken);

          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (newTokenData.expires_in || 5184000));

          // Chiffrer les nouveaux tokens
          const encryptedAccessToken = this.encryptToken(newTokenData.access_token);
          const encryptedRefreshToken = newTokenData.refresh_token
            ? this.encryptToken(newTokenData.refresh_token)
            : token.refresh_token;

          await LinkedInTokenModel.update(userId, {
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
            expires_at: newExpiresAt,
            token_type: newTokenData.token_type,
            scope: newTokenData.scope,
          });

          logger.info(`Token refreshed successfully for user ${userId}, new expiry: ${newExpiresAt.toISOString()}`);
          return newTokenData.access_token;
        } catch (refreshError: any) {
          logger.error('Failed to refresh LinkedIn token', { 
            userId, 
            error: refreshError?.message || String(refreshError),
            errorResponse: refreshError?.response?.data,
            errorStatus: refreshError?.response?.status
          });

          // Si le refresh token est aussi expiré ou invalide, supprimer le token
          const errorMessage = refreshError?.message || String(refreshError) || '';
          const errorData = refreshError?.response?.data || {};
          const isTokenInvalid = errorMessage.toLowerCase().includes('expired') || 
                                 errorMessage.toLowerCase().includes('invalid') ||
                                 errorData.error === 'invalid_grant' ||
                                 errorData.error === 'invalid_token' ||
                                 refreshError?.response?.status === 400;

          if (isTokenInvalid) {
            logger.warn(`Refresh token expired or invalid for user ${userId}, deleting token`);
            await LinkedInTokenModel.delete(userId);
            throw new LinkedInTokenError('Refresh token expired or invalid. Please re-authenticate with LinkedIn in your settings.');
          }

          throw new LinkedInTokenError(`Failed to refresh token: ${errorMessage}`, refreshError);
        }
      }

      return decryptedAccessToken;
    } catch (error: any) {
      if (error instanceof LinkedInTokenError) {
        throw error;
      }
      logger.error('Get LinkedIn access token error', error);
      throw new LinkedInTokenError('Failed to get access token', error);
    }
  }

  /**
   * Sauvegarde le token d'accès pour un utilisateur (avec chiffrement)
   */
  static async saveToken(userId: number, tokenData: LinkedInOAuthResponse): Promise<LinkedInToken> {
    try {
      // Chiffrer les tokens avant stockage
      const encryptedAccessToken = TokenEncryption.encrypt(tokenData.access_token);
      const encryptedRefreshToken = tokenData.refresh_token
        ? TokenEncryption.encrypt(tokenData.refresh_token)
        : null;

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 5184000)); // 60 jours par défaut

      return await LinkedInTokenModel.create({
        user_id: userId,
        access_token: encryptedAccessToken, // Token chiffré
        refresh_token: encryptedRefreshToken || undefined,
        expires_at: expiresAt,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      });
    } catch (error) {
      logger.error('Save LinkedIn token error', error);
      throw new LinkedInTokenError('Failed to save token securely', error);
    }
  }

  /**
   * Chiffre un token
   */
  private static encryptToken(token: string): string {
    return TokenEncryption.encrypt(token);
  }

  /**
   * Déchiffre un token
   */
  private static decryptToken(encryptedToken: string): string {
    return TokenEncryption.decrypt(encryptedToken);
  }

  /**
   * Récupère les offres d'emploi depuis LinkedIn
   * Utilise le service de scraping Python (JobSpy) pour récupérer de vraies offres
   */
  static async fetchJobs(userId: number, params: LinkedInJobSearchParams): Promise<JobOffer[]> {
    try {
      const nlpServiceUrl = config.nlpService.url;

      logger.info(`Fetching real LinkedIn jobs for user ${userId} with keywords: ${params.keywords}, location: ${params.location}, period: ${params.period}`);

      // Utiliser le service de scraping Python
      try {
        const response = await axios.post(`${nlpServiceUrl}/scrape-jobs`, {
          keywords: params.keywords || '',
          location: params.location || '',
          limit: params.limit || 25,
          platform: 'linkedin',
          period: params.period || 'month', // Pass period to scraper
        }, {
          timeout: 60000, // 60 secondes pour le scraping
        });

        if (response.data.success && response.data.jobs) {
          const jobs: JobOffer[] = response.data.jobs.map((job: any) => ({
            external_id: job.external_id,
            platform: 'linkedin',
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: job.salary_currency,
            job_type: job.job_type,
            remote: job.remote,
            url: job.url,
            posted_date: job.posted_date ? new Date(job.posted_date) : new Date(),
            raw_data: job.raw_data,
          }));

          logger.info(`Fetched ${jobs.length} real LinkedIn jobs for user ${userId}`);
          return jobs;
        } else {
          throw new Error('No jobs returned from scraper');
        }
      } catch (scrapeError: any) {
        logger.warn('LinkedIn scraping failed', {
          error: scrapeError?.message || String(scrapeError),
          response: scrapeError.response?.data,
        });

        // Ne pas retourner de démos automatiquement - laisser l'utilisateur savoir qu'il n'y a pas de résultats
        logger.info('No jobs found from LinkedIn scraper. User should try different keywords or location.');
        return []; // Retourner un tableau vide plutôt que des démos
      }
    } catch (error: any) {
      logger.error('LinkedIn fetch jobs error', error);
      // En cas d'erreur, retourner un tableau vide plutôt que des démos
      // L'utilisateur saura qu'il n'y a pas de vraies offres disponibles
      return [];
    }
  }

  /**
   * Génère des offres d'emploi de démonstration
   * À remplacer par une vraie API en production
   */
  private static generateDemoJobs(params: LinkedInJobSearchParams): JobOffer[] {
    const keywords = params.keywords.toLowerCase() || 'developer';
    const location = params.location || 'Paris, France';
    const limit = params.limit || 10;

    // Templates d'offres basés sur les mots-clés
    const jobTemplates = [
      {
        title: `Développeur ${keywords.includes('full') ? 'Full Stack' : keywords.includes('front') ? 'Frontend' : keywords.includes('back') ? 'Backend' : ''} Senior`,
        company: 'TechCorp Solutions',
        description: `Nous recherchons un développeur ${keywords} expérimenté pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants et collaborerez avec une équipe talentueuse.`,
        requirements: `Minimum 5 ans d'expérience, maîtrise des technologies modernes, capacité à travailler en équipe.`,
        salary_min: 50000,
        salary_max: 70000,
        remote: true,
      },
      {
        title: `Ingénieur ${keywords.includes('software') ? 'Software' : 'Développement'} - ${location}`,
        company: 'InnovateTech',
        description: `Poste d'ingénieur ${keywords} dans une entreprise en pleine croissance. Environnement stimulant avec de nombreuses opportunités d'évolution.`,
        requirements: `Bac+5 en informatique, expérience en développement, bonne communication.`,
        salary_min: 45000,
        salary_max: 65000,
        remote: false,
      },
      {
        title: `${keywords.charAt(0).toUpperCase() + keywords.slice(1)} Developer - Remote`,
        company: 'Digital Solutions',
        description: `Rejoignez notre équipe de développeurs talentueux. Poste en télétravail avec flexibilité horaire.`,
        requirements: `Expérience confirmée, autonomie, maîtrise de Git et des bonnes pratiques.`,
        salary_min: 55000,
        salary_max: 75000,
        remote: true,
      },
      {
        title: `Senior ${keywords} Engineer`,
        company: 'StartupTech',
        description: `Nous cherchons un ingénieur senior pour diriger nos projets techniques. Ambiance startup avec beaucoup d'autonomie.`,
        requirements: `8+ ans d'expérience, leadership technique, architecture logicielle.`,
        salary_min: 70000,
        salary_max: 90000,
        remote: true,
      },
      {
        title: `Développeur ${keywords} - CDI`,
        company: 'Enterprise Solutions',
        description: `Poste en CDI pour un développeur ${keywords} dans une grande entreprise. Avantages sociaux compétitifs.`,
        requirements: `Bac+3 minimum, 3 ans d'expérience, anglais professionnel.`,
        salary_min: 40000,
        salary_max: 60000,
        remote: false,
      },
    ];

    const jobs: JobOffer[] = [];
    const usedTitles = new Set<string>();

    for (let i = 0; i < Math.min(limit, jobTemplates.length * 2); i++) {
      const template = jobTemplates[i % jobTemplates.length];
      const jobId = `linkedin_demo_${Date.now()}_${i}`;
      const title = `${template.title} ${i > jobTemplates.length ? `(${Math.floor(i / jobTemplates.length)})` : ''}`;

      if (usedTitles.has(title)) continue;
      usedTitles.add(title);

      jobs.push({
        external_id: jobId,
        platform: 'linkedin',
        title: title,
        company: template.company,
        location: location,
        description: template.description,
        requirements: template.requirements,
        salary_min: template.salary_min,
        salary_max: template.salary_max,
        salary_currency: 'EUR',
        job_type: 'CDI',
        remote: template.remote,
        url: `https://www.linkedin.com/jobs/view/${jobId}`,
        posted_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Derniers 7 jours
        raw_data: {
          source: 'demo',
          generated_at: new Date().toISOString(),
        },
      });
    }

    return jobs;
  }

  /**
   * Soumet une candidature sur LinkedIn
   * NOTE: Nécessite des scopes et permissions spécifiques
   */
  static async submitApplication(
    userId: number,
    jobId: string,
    cvPath: string,
    coverLetter?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // L'API LinkedIn pour soumettre des candidatures nécessite généralement
      // un partenariat LinkedIn Talent Solutions ou des permissions spéciales
      // Cette implémentation est un exemple de structure

      // Note: L'endpoint exact peut varier selon votre type d'accès
      const applicationData = {
        job: jobId,
        // Ajouter d'autres données de candidature selon l'API disponible
      };

      try {
        const response = await axios.post(
          `${this.API_BASE_URL}/jobApplications`,
          applicationData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );

        return {
          success: true,
          message: 'Application submitted successfully to LinkedIn',
        };
      } catch (apiError: any) {
        // Si l'API n'est pas disponible, retourner l'URL de candidature
        logger.warn('LinkedIn application API not available, returning job URL', {
          error: apiError.response?.data || apiError.message,
        });

        return {
          success: true,
          message: `Please submit your application manually at: https://www.linkedin.com/jobs/view/${jobId}`,
        };
      }
    } catch (error: any) {
      logger.error('LinkedIn submit application error', error);
      throw error;
    }
  }

  /**
   * Récupère le profil LinkedIn de l'utilisateur
   * Utilise OpenID Connect userinfo endpoint
   */
  static async getUserProfile(userId: number): Promise<any> {
    try {
      const accessToken = await this.getAccessToken(userId);

      // Essayer d'abord l'endpoint OpenID Connect userinfo
      try {
        const response = await axios.get(
          `${this.API_BASE_URL}/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return response.data;
      } catch (userinfoError: any) {
        // Si userinfo ne fonctionne pas, essayer l'endpoint /me avec les champs de base
        logger.warn('OpenID Connect userinfo endpoint failed, trying /me', {
          error: userinfoError.response?.data || userinfoError.message,
        });

        const response = await axios.get(
          `${this.API_BASE_URL}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
            },
          }
        );
        return response.data;
      }
    } catch (error: any) {
      logger.error('Get LinkedIn user profile error', error);
      throw error;
    }
  }
}
