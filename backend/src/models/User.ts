import { config } from '../config/database';
import bcrypt from 'bcryptjs';
import { TokenEncryption } from '../utils/tokenEncryption';

export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
  gdpr_consent?: boolean;
  gdpr_consent_date?: Date;
  is_active?: boolean;
  linkedin_email?: string;
  linkedin_password_encrypted?: string;
  indeed_email?: string;
  indeed_password_encrypted?: string;
}

export interface UserCredentials {
  linkedin_email?: string;
  linkedin_password?: string;
  indeed_email?: string;
  indeed_password?: string;
}

export class UserModel {
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password_hash!, 10);
    
    const result = await config.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, gdpr_consent, gdpr_consent_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, created_at, gdpr_consent, gdpr_consent_date`,
      [
        userData.email,
        hashedPassword,
        userData.first_name || null,
        userData.last_name || null,
        userData.phone || null,
        userData.gdpr_consent || false,
        userData.gdpr_consent ? new Date() : null,
      ]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await config.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await config.query(
      'SELECT id, email, first_name, last_name, phone, created_at, gdpr_consent FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id: number, userData: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'password_hash') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const result = await config.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await config.query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [hashedPassword, new Date(), id]
    );
  }

  static async delete(id: number): Promise<void> {
    // Soft delete for RGPD compliance
    await config.query(
      'UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2',
      [new Date(), id]
    );
  }

  /**
   * Met à jour les credentials LinkedIn/Indeed de l'utilisateur
   */
  static async updateCredentials(userId: number, credentials: UserCredentials): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (credentials.linkedin_email !== undefined) {
      updates.push(`linkedin_email = $${paramCount}`);
      values.push(credentials.linkedin_email);
      paramCount++;
    }

    if (credentials.linkedin_password !== undefined) {
      const encrypted = TokenEncryption.encrypt(credentials.linkedin_password);
      updates.push(`linkedin_password_encrypted = $${paramCount}`);
      values.push(encrypted);
      paramCount++;
    }

    if (credentials.indeed_email !== undefined) {
      updates.push(`indeed_email = $${paramCount}`);
      values.push(credentials.indeed_email);
      paramCount++;
    }

    if (credentials.indeed_password !== undefined) {
      const encrypted = TokenEncryption.encrypt(credentials.indeed_password);
      updates.push(`indeed_password_encrypted = $${paramCount}`);
      values.push(encrypted);
      paramCount++;
    }

    if (updates.length === 0) {
      return; // Rien à mettre à jour
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    values.push(userId);

    await config.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );
  }

  /**
   * Récupère les credentials décryptés de l'utilisateur
   */
  static async getCredentials(userId: number): Promise<UserCredentials | null> {
    const result = await config.query(
      `SELECT linkedin_email, linkedin_password_encrypted, indeed_email, indeed_password_encrypted
       FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    const credentials: UserCredentials = {};

    if (row.linkedin_email) {
      credentials.linkedin_email = row.linkedin_email;
    }

    if (row.linkedin_password_encrypted) {
      try {
        credentials.linkedin_password = TokenEncryption.decrypt(row.linkedin_password_encrypted);
      } catch (error) {
        // Si le déchiffrement échoue, ne pas inclure le mot de passe
      }
    }

    if (row.indeed_email) {
      credentials.indeed_email = row.indeed_email;
    }

    if (row.indeed_password_encrypted) {
      try {
        credentials.indeed_password = TokenEncryption.decrypt(row.indeed_password_encrypted);
      } catch (error) {
        // Si le déchiffrement échoue, ne pas inclure le mot de passe
      }
    }

    return credentials;
  }
}

