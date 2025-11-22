import { config } from '../config/database';
import bcrypt from 'bcryptjs';

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
}

