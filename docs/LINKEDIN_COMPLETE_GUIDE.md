# Guide Complet d'Intégration LinkedIn OAuth2 - Exemples de Code Détaillés

Ce guide fournit des exemples de code détaillés pour chaque étape de l'intégration LinkedIn OAuth2.

## Table des matières

1. [Authentification OAuth2](#1-authentification-oauth2)
2. [Appels API LinkedIn](#2-appels-api-linkedin)
3. [Gestion des Tokens](#3-gestion-des-tokens)
4. [Sécurité et RGPD](#4-sécurité-et-rgpd)
5. [Gestion des Erreurs](#5-gestion-des-erreurs)

---

## 1. Authentification OAuth2

### 1.1 Créer l'URL d'autorisation

**Fichier:** `backend/src/services/LinkedInService.ts`

```typescript
import crypto from 'crypto';
import { logger } from '../utils/logger';

export class LinkedInService {
  private static readonly CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '78g3tk7nu8h5g8';
  private static readonly REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/auth/linkedin/callback';
  private static readonly AUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2';
  
  // Scopes LinkedIn (note: certains peuvent nécessiter une migration vers OpenID Connect)
  private static readonly SCOPES = 'r_liteprofile r_emailaddress w_member_social';

  /**
   * Génère l'URL d'autorisation OAuth2 avec gestion sécurisée du state
   * 
   * @param userId - ID de l'utilisateur pour associer le state
   * @returns URL d'autorisation et state pour validation
   */
  static async getAuthorizationUrl(userId: number): Promise<{ url: string; state: string }> {
    try {
      // Générer un state sécurisé (CSRF protection)
      const state = this.generateSecureState(userId);
      
      // Stocker le state en session/cache pour validation ultérieure
      await this.storeStateForValidation(userId, state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.CLIENT_ID,
        redirect_uri: this.REDIRECT_URI,
        scope: this.SCOPES,
        state: state, // Protection CSRF
      });

      const authUrl = `${this.AUTH_BASE_URL}/authorization?${params.toString()}`;
      
      logger.info('Generated LinkedIn authorization URL', { userId, state });
      
      return { url: authUrl, state };
    } catch (error: any) {
      logger.error('Error generating authorization URL', error);
      throw new Error('Failed to generate authorization URL');
    }
  }

  /**
   * Génère un state sécurisé avec timestamp et hash
   */
  private static generateSecureState(userId: number): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const data = `${userId}:${timestamp}:${random}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `${hash}:${timestamp}`;
  }

  /**
   * Stocke le state pour validation ultérieure (exemple avec Redis ou session)
   */
  private static async storeStateForValidation(userId: number, state: string): Promise<void> {
    // Option 1: Utiliser Redis (recommandé pour production)
    // await redis.setex(`linkedin:state:${userId}`, 600, state); // 10 minutes
    
    // Option 2: Stocker en base de données temporaire
    // Option 3: Utiliser la session Express
    // Pour cet exemple, on utilise une Map en mémoire (non recommandé pour production)
    if (!this.stateStore) {
      this.stateStore = new Map();
    }
    this.stateStore.set(`user:${userId}`, { state, expiresAt: Date.now() + 600000 });
  }

  /**
   * Valide le state reçu lors du callback
   */
  static async validateState(userId: number, receivedState: string): Promise<boolean> {
    try {
      const stored = this.stateStore?.get(`user:${userId}`);
      if (!stored) {
        logger.warn('No stored state found for user', { userId });
        return false;
      }

      // Vérifier l'expiration
      if (Date.now() > stored.expiresAt) {
        this.stateStore?.delete(`user:${userId}`);
        logger.warn('State expired', { userId });
        return false;
      }

      // Vérifier la correspondance
      const isValid = stored.state === receivedState;
      
      if (isValid) {
        // Supprimer le state après validation (one-time use)
        this.stateStore?.delete(`user:${userId}`);
      }

      return isValid;
    } catch (error) {
      logger.error('Error validating state', error);
      return false;
    }
  }

  private static stateStore: Map<string, { state: string; expiresAt: number }> | null = null;
}
```

### 1.2 Échanger le code contre un token

**Fichier:** `backend/src/services/LinkedInService.ts`

```typescript
import axios, { AxiosError } from 'axios';
import { LinkedInTokenModel } from '../models/LinkedInToken';

interface LinkedInOAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
}

interface LinkedInErrorResponse {
  error: string;
  error_description: string;
}

export class LinkedInService {
  private static readonly CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '78g3tk7nu8h5g8';
  private static readonly CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
  private static readonly REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/auth/linkedin/callback';
  private static readonly AUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2';

  /**
   * Échange le code d'autorisation contre un token d'accès
   * 
   * @param authorizationCode - Code reçu du callback LinkedIn
   * @param state - State pour validation CSRF
   * @param userId - ID de l'utilisateur
   * @returns Données du token d'accès
   */
  static async exchangeCodeForToken(
    authorizationCode: string,
    state: string,
    userId: number
  ): Promise<LinkedInOAuthResponse> {
    try {
      // 1. Valider le state (protection CSRF)
      const isValidState = await this.validateState(userId, state);
      if (!isValidState) {
        throw new Error('Invalid or expired state parameter');
      }

      // 2. Préparer les paramètres de la requête
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
      });

      // 3. Effectuer la requête POST
      const response = await axios.post<LinkedInOAuthResponse>(
        `${this.AUTH_BASE_URL}/accessToken`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          timeout: 10000, // 10 secondes timeout
        }
      );

      // 4. Valider la réponse
      if (!response.data.access_token) {
        throw new Error('Invalid response from LinkedIn: missing access_token');
      }

      logger.info('Successfully exchanged authorization code for token', {
        userId,
        expiresIn: response.data.expires_in,
        hasRefreshToken: !!response.data.refresh_token,
      });

      return response.data;
    } catch (error) {
      // Gestion détaillée des erreurs
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<LinkedInErrorResponse>;
        
        if (axiosError.response) {
          // Erreur de l'API LinkedIn
          const errorData = axiosError.response.data;
          logger.error('LinkedIn API error during token exchange', {
            status: axiosError.response.status,
            error: errorData?.error,
            description: errorData?.error_description,
          });
          
          throw new Error(
            `LinkedIn API error: ${errorData?.error_description || errorData?.error || 'Unknown error'}`
          );
        } else if (axiosError.request) {
          // Pas de réponse du serveur
          logger.error('No response from LinkedIn during token exchange', {
            request: axiosError.request,
          });
          throw new Error('No response from LinkedIn. Please try again later.');
        }
      }

      // Erreur inconnue
      logger.error('Unexpected error during token exchange', error);
      throw new Error('Failed to exchange authorization code. Please try again.');
    }
  }

  /**
   * Sauvegarde le token de manière sécurisée
   */
  static async saveTokenSecurely(
    userId: number,
    tokenData: LinkedInOAuthResponse
  ): Promise<void> {
    try {
      // Chiffrer le token avant stockage (voir section sécurité)
      const encryptedAccessToken = await this.encryptToken(tokenData.access_token);
      const encryptedRefreshToken = tokenData.refresh_token
        ? await this.encryptToken(tokenData.refresh_token)
        : null;

      // Calculer la date d'expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 5184000));

      // Sauvegarder en base de données
      await LinkedInTokenModel.create({
        user_id: userId,
        access_token: encryptedAccessToken, // Token chiffré
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
      });

      logger.info('Token saved securely for user', { userId });
    } catch (error) {
      logger.error('Error saving token', error);
      throw new Error('Failed to save token securely');
    }
  }
}
```

---

## 2. Appels API LinkedIn

### 2.1 Récupérer les offres d'emploi

**Fichier:** `backend/src/services/LinkedInService.ts`

```typescript
import axios, { AxiosError } from 'axios';
import { JobOffer } from '../models/JobOffer';

interface LinkedInJobSearchParams {
  keywords: string;
  location: string;
  limit?: number;
  start?: number; // Pour la pagination
}

interface LinkedInJobResponse {
  elements?: Array<{
    id: string;
    title: string;
    companyName: string;
    location: string;
    description: string;
    postedDate: number;
    url: string;
    [key: string]: any;
  }>;
  paging?: {
    count: number;
    start: number;
    links: Array<{ rel: string; href: string }>;
  };
}

export class LinkedInService {
  private static readonly API_BASE_URL = 'https://api.linkedin.com/v2';

  /**
   * Récupère les offres d'emploi depuis LinkedIn avec gestion d'erreurs robuste
   * 
   * @param userId - ID de l'utilisateur
   * @param params - Paramètres de recherche
   * @returns Liste des offres d'emploi
   */
  static async fetchJobs(
    userId: number,
    params: LinkedInJobSearchParams
  ): Promise<JobOffer[]> {
    try {
      // 1. Obtenir le token d'accès (avec renouvellement automatique si nécessaire)
      const accessToken = await this.getAccessToken(userId);

      // 2. Préparer les paramètres de recherche
      const searchParams = new URLSearchParams({
        keywords: params.keywords || '',
        location: params.location || '',
        count: String(params.limit || 25),
        start: String(params.start || 0),
      });

      // 3. Essayer plusieurs endpoints selon la disponibilité
      let jobs: JobOffer[] = [];

      // Endpoint 1: Job Search API (si disponible)
      try {
        jobs = await this.fetchJobsFromJobSearchAPI(accessToken, searchParams);
        if (jobs.length > 0) {
          logger.info(`Fetched ${jobs.length} jobs from Job Search API`);
          return jobs;
        }
      } catch (error: any) {
        logger.warn('Job Search API failed, trying alternative', {
          error: error.message,
        });
      }

      // Endpoint 2: General Search API
      try {
        jobs = await this.fetchJobsFromSearchAPI(accessToken, searchParams);
        if (jobs.length > 0) {
          logger.info(`Fetched ${jobs.length} jobs from Search API`);
          return jobs;
        }
      } catch (error: any) {
        logger.warn('Search API failed, trying alternative', {
          error: error.message,
        });
      }

      // Endpoint 3: Job Posting API (si l'utilisateur a les permissions)
      try {
        jobs = await this.fetchJobsFromJobPostingAPI(accessToken, searchParams);
        if (jobs.length > 0) {
          logger.info(`Fetched ${jobs.length} jobs from Job Posting API`);
          return jobs;
        }
      } catch (error: any) {
        logger.warn('Job Posting API failed', {
          error: error.message,
        });
      }

      // Si aucun endpoint ne fonctionne
      if (jobs.length === 0) {
        throw new Error(
          'Unable to fetch jobs from LinkedIn. ' +
          'Please check your API access, scopes, and ensure you have the necessary permissions.'
        );
      }

      return jobs;
    } catch (error: any) {
      logger.error('Error fetching jobs from LinkedIn', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Récupère les offres via l'API Job Search
   */
  private static async fetchJobsFromJobSearchAPI(
    accessToken: string,
    searchParams: URLSearchParams
  ): Promise<JobOffer[]> {
    const response = await axios.get<LinkedInJobResponse>(
      `${this.API_BASE_URL}/jobSearch?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Accept': 'application/json',
        },
        timeout: 15000,
      }
    );

    return this.transformJobResponse(response.data);
  }

  /**
   * Récupère les offres via l'API Search générale
   */
  private static async fetchJobsFromSearchAPI(
    accessToken: string,
    searchParams: URLSearchParams
  ): Promise<JobOffer[]> {
    const params = new URLSearchParams({
      q: 'jobs',
      keywords: searchParams.get('keywords') || '',
      location: searchParams.get('location') || '',
    });

    const response = await axios.get(
      `${this.API_BASE_URL}/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        timeout: 15000,
      }
    );

    const elements = response.data?.elements || [];
    return elements
      .filter((item: any) => item.type === 'JOB')
      .map((item: any) => this.transformJobElement(item));
  }

  /**
   * Transforme la réponse LinkedIn en format JobOffer
   */
  private static transformJobResponse(data: LinkedInJobResponse): JobOffer[] {
    if (!data.elements || data.elements.length === 0) {
      return [];
    }

    return data.elements.map((job) => ({
      external_id: `linkedin_${job.id}`,
      platform: 'linkedin',
      title: job.title || '',
      company: job.companyName || '',
      location: job.location || '',
      description: job.description || '',
      requirements: job.description || '', // LinkedIn ne sépare pas toujours
      url: job.url || `https://www.linkedin.com/jobs/view/${job.id}`,
      posted_date: job.postedDate ? new Date(job.postedDate) : new Date(),
      raw_data: job,
    }));
  }

  /**
   * Transforme un élément de job en format JobOffer
   */
  private static transformJobElement(job: any): JobOffer {
    return {
      external_id: `linkedin_${job.id || job.targetUrn?.split(':').pop()}`,
      platform: 'linkedin',
      title: job.title || '',
      company: job.companyName || '',
      location: job.location || '',
      description: job.description || '',
      requirements: job.description || '',
      url: job.url || '',
      posted_date: new Date(),
      raw_data: job,
    };
  }
}
```

### 2.2 Soumettre une candidature

**Fichier:** `backend/src/services/LinkedInService.ts`

```typescript
import axios, { AxiosError } from 'axios';
import fs from 'fs/promises';

interface ApplicationData {
  jobId: string;
  cvPath: string;
  coverLetter?: string;
  answers?: Record<string, string>; // Réponses aux questions de l'offre
}

/**
 * Soumet une candidature sur LinkedIn
 */
static async submitApplication(
  userId: number,
  applicationData: ApplicationData
): Promise<{ success: boolean; message: string; applicationId?: string }> {
  try {
    const accessToken = await this.getAccessToken(userId);

    // 1. Lire le CV
    const cvBuffer = await fs.readFile(applicationData.cvPath);
    const cvBase64 = cvBuffer.toString('base64');

    // 2. Préparer les données de candidature
    const payload = {
      job: applicationData.jobId,
      resume: {
        data: cvBase64,
        filename: applicationData.cvPath.split('/').pop(),
      },
      coverLetter: applicationData.coverLetter || '',
      answers: applicationData.answers || {},
    };

    // 3. Soumettre la candidature
    try {
      const response = await axios.post(
        `${this.API_BASE_URL}/jobApplications`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          timeout: 30000, // 30 secondes pour l'upload
        }
      );

      return {
        success: true,
        message: 'Application submitted successfully to LinkedIn',
        applicationId: response.data?.id,
      };
    } catch (apiError: any) {
      // Si l'API n'est pas disponible, retourner l'URL de candidature
      if (apiError.response?.status === 403 || apiError.response?.status === 404) {
        logger.warn('LinkedIn application API not available', {
          status: apiError.response.status,
          error: apiError.response.data,
        });

        return {
          success: true,
          message: `Please submit your application manually at: https://www.linkedin.com/jobs/view/${applicationData.jobId}`,
        };
      }

      throw apiError;
    }
  } catch (error: any) {
    logger.error('Error submitting application to LinkedIn', {
      userId,
      jobId: applicationData.jobId,
      error: error.message,
    });

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `LinkedIn API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`
        );
      }
    }

    throw new Error('Failed to submit application to LinkedIn');
  }
}
```

---

## 3. Gestion des Tokens

### 3.1 Renouvellement automatique des tokens

**Fichier:** `backend/src/services/LinkedInService.ts`

```typescript
import { LinkedInTokenModel } from '../models/LinkedInToken';

/**
 * Obtient ou rafraîchit automatiquement le token d'accès
 */
static async getAccessToken(userId: number): Promise<string> {
  try {
    let token = await LinkedInTokenModel.findByUserId(userId);

    if (!token) {
      throw new Error('No LinkedIn token found. Please authenticate first.');
    }

    // Décrypter le token
    const decryptedAccessToken = await this.decryptToken(token.access_token);
    const decryptedRefreshToken = token.refresh_token
      ? await this.decryptToken(token.refresh_token)
      : null;

    // Vérifier l'expiration (avec marge de 5 minutes)
    const now = new Date();
    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    const timeUntilExpiry = expiresAt
      ? expiresAt.getTime() - now.getTime()
      : 0;

    // Si le token expire dans moins de 5 minutes, le rafraîchir
    if (timeUntilExpiry < 5 * 60 * 1000) {
      if (!decryptedRefreshToken) {
        throw new Error(
          'Token expired and no refresh token available. Please re-authenticate.'
        );
      }

      logger.info(`Refreshing LinkedIn token for user ${userId}`);

      try {
        // Rafraîchir le token
        const newTokenData = await this.refreshAccessToken(decryptedRefreshToken);

        // Calculer la nouvelle date d'expiration
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(
          newExpiresAt.getSeconds() + (newTokenData.expires_in || 5184000)
        );

        // Chiffrer et sauvegarder les nouveaux tokens
        const encryptedAccessToken = await this.encryptToken(newTokenData.access_token);
        const encryptedRefreshToken = newTokenData.refresh_token
          ? await this.encryptToken(newTokenData.refresh_token)
          : decryptedRefreshToken;

        await LinkedInTokenModel.update(userId, {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: newExpiresAt,
          token_type: newTokenData.token_type,
          scope: newTokenData.scope,
        });

        logger.info(`Token refreshed successfully for user ${userId}`);
        return newTokenData.access_token;
      } catch (refreshError: any) {
        logger.error('Failed to refresh token', {
          userId,
          error: refreshError.message,
        });

        // Si le refresh token est aussi expiré, supprimer le token
        if (refreshError.message.includes('expired') || refreshError.message.includes('invalid')) {
          await LinkedInTokenModel.delete(userId);
          throw new Error(
            'Refresh token expired. Please re-authenticate with LinkedIn.'
          );
        }

        throw refreshError;
      }
    }

    return decryptedAccessToken;
  } catch (error: any) {
    logger.error('Error getting access token', {
      userId,
      error: error.message,
    });
    throw error;
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

    const response = await axios.post<LinkedInOAuthResponse>(
      `${this.AUTH_BASE_URL}/accessToken`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (!response.data.access_token) {
      throw new Error('Invalid response from LinkedIn: missing access_token');
    }

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<LinkedInErrorResponse>;
      if (axiosError.response) {
        const errorData = axiosError.response.data;
        throw new Error(
          `Failed to refresh token: ${errorData?.error_description || errorData?.error || 'Unknown error'}`
        );
      }
    }

    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}
```

### 3.2 Stockage sécurisé des tokens

**Fichier:** `backend/src/utils/tokenEncryption.ts`

```typescript
import crypto from 'crypto';

/**
 * Service de chiffrement pour les tokens sensibles
 */
export class TokenEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;

  /**
   * Génère une clé de chiffrement depuis une clé maître
   */
  private static getEncryptionKey(): Buffer {
    const masterKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    
    // Utiliser PBKDF2 pour dériver une clé sécurisée
    return crypto.pbkdf2Sync(
      masterKey,
      'linkedin-token-salt', // Salt fixe (en production, utiliser un salt unique par token)
      100000, // 100k itérations
      this.KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Chiffre un token
   */
  static encrypt(token: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combiner IV + tag + données chiffrées
      const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

      return Buffer.from(combined).toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Déchiffre un token
   */
  static decrypt(encryptedToken: string): string {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedToken, 'base64').toString('hex');

      const parts = combined.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt token');
    }
  }
}
```

**Mise à jour de LinkedInService pour utiliser le chiffrement:**

```typescript
import { TokenEncryption } from '../utils/tokenEncryption';

export class LinkedInService {
  /**
   * Chiffre un token avant stockage
   */
  private static async encryptToken(token: string): Promise<string> {
    return TokenEncryption.encrypt(token);
  }

  /**
   * Déchiffre un token après récupération
   */
  private static async decryptToken(encryptedToken: string): Promise<string> {
    return TokenEncryption.decrypt(encryptedToken);
  }
}
```

---

## 4. Sécurité et RGPD

### 4.1 Conformité RGPD

**Fichier:** `backend/src/services/RGPDService.ts`

```typescript
import { LinkedInTokenModel } from '../models/LinkedInToken';
import { UserModel } from '../models/User';
import { ApplicationModel } from '../models/Application';
import { logger } from '../utils/logger';

export class RGPDService {
  /**
   * Exporte toutes les données d'un utilisateur (droit à la portabilité)
   */
  static async exportUserData(userId: number): Promise<any> {
    try {
      const user = await UserModel.findById(userId);
      const linkedinToken = await LinkedInTokenModel.findByUserId(userId);
      const applications = await ApplicationModel.findByUserId(userId);

      return {
        user: {
          email: user?.email,
          first_name: user?.first_name,
          last_name: user?.last_name,
          created_at: user?.created_at,
        },
        linkedin: {
          connected: !!linkedinToken,
          connected_at: linkedinToken?.created_at,
          // Ne pas inclure les tokens dans l'export
        },
        applications: applications.map((app) => ({
          job_title: app.job_title,
          company: app.company,
          status: app.status,
          application_date: app.application_date,
        })),
        exported_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error exporting user data', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Supprime toutes les données d'un utilisateur (droit à l'oubli)
   */
  static async deleteUserData(userId: number): Promise<void> {
    try {
      // 1. Supprimer le token LinkedIn
      await LinkedInTokenModel.delete(userId);

      // 2. Anonymiser les applications (soft delete)
      const applications = await ApplicationModel.findByUserId(userId);
      for (const app of applications) {
        await ApplicationModel.update(app.id!, {
          status: 'deleted',
          notes: 'Deleted for RGPD compliance',
        });
      }

      // 3. Supprimer l'utilisateur (soft delete)
      await UserModel.delete(userId);

      logger.info(`User data deleted for RGPD compliance`, { userId });
    } catch (error) {
      logger.error('Error deleting user data', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Vérifie le consentement RGPD
   */
  static async checkConsent(userId: number): Promise<boolean> {
    const user = await UserModel.findById(userId);
    return user?.gdpr_consent === true;
  }
}
```

### 4.2 Sécurisation HTTPS

**Fichier:** `backend/src/middleware/security.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Middleware de sécurité pour protéger les communications
 */
export const securityMiddleware = [
  // Helmet pour les headers de sécurité
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),

  // Forcer HTTPS en production
  (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(`https://${req.header('host')}${req.url}`);
      }
    }
    next();
  },
];
```

---

## 5. Gestion des Erreurs

### 5.1 Classe d'erreurs personnalisée

**Fichier:** `backend/src/utils/LinkedInErrors.ts`

```typescript
export class LinkedInError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public originalError?: any
  ) {
    super(message);
    this.name = 'LinkedInError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class LinkedInAuthError extends LinkedInError {
  constructor(message: string, originalError?: any) {
    super(message, 'LINKEDIN_AUTH_ERROR', 401, originalError);
    this.name = 'LinkedInAuthError';
  }
}

export class LinkedInTokenError extends LinkedInError {
  constructor(message: string, originalError?: any) {
    super(message, 'LINKEDIN_TOKEN_ERROR', 401, originalError);
    this.name = 'LinkedInTokenError';
  }
}

export class LinkedInAPIError extends LinkedInError {
  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message, 'LINKEDIN_API_ERROR', statusCode, originalError);
    this.name = 'LinkedInAPIError';
  }
}

export class LinkedInRateLimitError extends LinkedInError {
  constructor(message: string = 'Rate limit exceeded', originalError?: any) {
    super(message, 'LINKEDIN_RATE_LIMIT', 429, originalError);
    this.name = 'LinkedInRateLimitError';
  }
}
```

### 5.2 Gestionnaire d'erreurs global

**Fichier:** `backend/src/middleware/linkedinErrorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import {
  LinkedInError,
  LinkedInAuthError,
  LinkedInTokenError,
  LinkedInAPIError,
  LinkedInRateLimitError,
} from '../utils/LinkedInErrors';
import { logger } from '../utils/logger';

export const linkedinErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof LinkedInError) {
    logger.error('LinkedIn error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
    });

    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        type: error.name,
      },
    });
  }

  // Passer à l'erreur handler suivant
  next(error);
};
```

### 5.3 Retry avec backoff exponentiel

**Fichier:** `backend/src/utils/retry.ts`

```typescript
/**
 * Retry une fonction avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Ne pas retry sur certaines erreurs
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

**Utilisation dans LinkedInService:**

```typescript
import { retryWithBackoff } from '../utils/retry';

static async fetchJobs(userId: number, params: LinkedInJobSearchParams): Promise<JobOffer[]> {
  return retryWithBackoff(async () => {
    const accessToken = await this.getAccessToken(userId);
    // ... code de récupération des offres
  }, 3, 1000);
}
```

---

## Configuration finale

**Fichier:** `backend/.env`

```env
# LinkedIn OAuth2
LINKEDIN_CLIENT_ID=votre_client_id
LINKEDIN_CLIENT_SECRET=votre_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback

# Sécurité
ENCRYPTION_KEY=your-very-secure-encryption-key-change-in-production
NODE_ENV=production

# HTTPS (en production)
FORCE_HTTPS=true
```

Ce guide fournit des exemples de code complets pour chaque étape de l'intégration LinkedIn OAuth2 avec une gestion robuste des erreurs et des mesures de sécurité.

