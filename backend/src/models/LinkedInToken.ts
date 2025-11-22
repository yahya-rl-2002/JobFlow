import { config } from '../config/database';

export interface LinkedInToken {
  id?: number;
  user_id: number;
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  token_type?: string;
  scope?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class LinkedInTokenModel {
  static async create(tokenData: Omit<LinkedInToken, 'id' | 'created_at' | 'updated_at'>): Promise<LinkedInToken> {
    const result = await config.query(
      `INSERT INTO linkedin_tokens (user_id, access_token, refresh_token, expires_at, token_type, scope)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         token_type = EXCLUDED.token_type,
         scope = EXCLUDED.scope,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        tokenData.user_id,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.expires_at || null,
        tokenData.token_type || 'Bearer',
        tokenData.scope || null,
      ]
    );

    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<LinkedInToken | null> {
    const result = await config.query(
      'SELECT * FROM linkedin_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async update(userId: number, tokenData: Partial<LinkedInToken>): Promise<LinkedInToken> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(tokenData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'user_id') {
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
    values.push(userId);

    const result = await config.query(
      `UPDATE linkedin_tokens SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(userId: number): Promise<void> {
    await config.query('DELETE FROM linkedin_tokens WHERE user_id = $1', [userId]);
  }
}

