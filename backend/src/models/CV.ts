import { config } from '../config/database';

export interface CV {
  id?: number;
  user_id: number;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  parsed_data?: any;
  created_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
}

export class CVModel {
  static async create(cvData: Omit<CV, 'id' | 'created_at' | 'updated_at'>): Promise<CV> {
    const result = await config.query(
      `INSERT INTO cvs (user_id, file_path, file_name, file_type, file_size, parsed_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        cvData.user_id,
        cvData.file_path,
        cvData.file_name,
        cvData.file_type || null,
        cvData.file_size || null,
        cvData.parsed_data ? JSON.stringify(cvData.parsed_data) : null,
      ]
    );

    return result.rows[0];
  }

  static async findById(id: number): Promise<CV | null> {
    const result = await config.query(
      'SELECT * FROM cvs WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<CV[]> {
    const result = await config.query(
      'SELECT * FROM cvs WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async update(id: number, cvData: Partial<CV>): Promise<CV> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(cvData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'user_id') {
        if (key === 'parsed_data' && typeof value === 'object') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Ajouter updated_at
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    
    // Ajouter l'id pour la clause WHERE
    values.push(id);

    const result = await config.query(
      `UPDATE cvs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id: number): Promise<void> {
    await config.query(
      'UPDATE cvs SET is_active = false, updated_at = $1 WHERE id = $2',
      [new Date(), id]
    );
  }
}

