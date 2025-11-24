import crypto from 'crypto';
import { logger } from './logger';
import { config } from '../config/config';

/**
 * Service de chiffrement pour les tokens sensibles
 * Utilise AES-256-GCM pour un chiffrement authentifié
 */
export class TokenEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16;

  /**
   * Génère une clé de chiffrement depuis une clé maître
   */
  /**
   * Génère une clé de chiffrement depuis une clé maître
   */
  private static getEncryptionKey(): Buffer {
    const masterKey = config.security.encryptionKey;

    if (!masterKey) {
      if (config.env === 'production') {
        throw new Error('ENCRYPTION_KEY must be set in production');
      }
      logger.warn('ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
      return crypto.pbkdf2Sync(
        'default-dev-key-do-not-use',
        'linkedin-token-salt',
        100000,
        this.KEY_LENGTH,
        'sha256'
      );
    }

    // Utiliser PBKDF2 pour dériver une clé sécurisée
    return crypto.pbkdf2Sync(
      masterKey,
      'linkedin-token-salt', // Salt fixe (en production, considérer un salt unique par token)
      100000, // 100k itérations
      this.KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Chiffre un token
   * 
   * @param token - Token à chiffrer
   * @returns Token chiffré en base64
   */
  static encrypt(token: string): string {
    try {
      if (!token) {
        throw new Error('Token cannot be empty');
      }

      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combiner IV + tag + données chiffrées
      // Format: IV:tag:encrypted_data
      const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

      return Buffer.from(combined).toString('base64');
    } catch (error: any) {
      logger.error('Failed to encrypt token', { error: error.message });
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Déchiffre un token
   * 
   * @param encryptedToken - Token chiffré en base64
   * @returns Token déchiffré
   */
  static decrypt(encryptedToken: string): string {
    try {
      if (!encryptedToken) {
        throw new Error('Encrypted token cannot be empty');
      }

      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedToken, 'base64').toString('hex');

      const parts = combined.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      if (iv.length !== this.IV_LENGTH || tag.length !== this.TAG_LENGTH) {
        throw new Error('Invalid IV or tag length');
      }

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      logger.error('Failed to decrypt token', { error: error.message });
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Vérifie si une chaîne est un token chiffré valide
   */
  static isValidEncryptedFormat(encryptedToken: string): boolean {
    try {
      const combined = Buffer.from(encryptedToken, 'base64').toString('hex');
      const parts = combined.split(':');
      return parts.length === 3;
    } catch {
      return false;
    }
  }
}

