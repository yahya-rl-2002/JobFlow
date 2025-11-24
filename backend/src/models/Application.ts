import { config } from '../config/database';

export interface Application {
  id?: number;
  user_id: number;
  job_offer_id: number;
  cv_id?: number;
  status: 'pending' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  match_score?: number;
  customized_cv_path?: string;
  application_date?: Date;
  response_date?: Date;
  notes?: string;
  submission_status?: 'success' | 'failed' | 'manual' | 'pending';
  submission_message?: string;
  submission_date?: Date;
  submission_method?: 'api' | 'email' | 'manual' | 'redirect';
  created_at?: Date;
  updated_at?: Date;
}

export class ApplicationModel {
  static async create(applicationData: Omit<Application, 'id' | 'created_at' | 'updated_at'>): Promise<Application> {
    const result = await config.query(
      `INSERT INTO applications (user_id, job_offer_id, cv_id, status, match_score, customized_cv_path, application_date, notes, submission_status, submission_message, submission_date, submission_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        applicationData.user_id,
        applicationData.job_offer_id,
        applicationData.cv_id || null,
        applicationData.status || 'pending',
        applicationData.match_score || null,
        applicationData.customized_cv_path || null,
        applicationData.application_date || new Date(),
        applicationData.notes || null,
        applicationData.submission_status || null,
        applicationData.submission_message || null,
        applicationData.submission_date || null,
        applicationData.submission_method || null,
      ]
    );

    return result.rows[0];
  }

  static async findById(id: number): Promise<Application | null> {
    const result = await config.query(
      `SELECT a.*, j.title as job_title, j.company, j.platform, j.url as job_url
       FROM applications a
       JOIN job_offers j ON a.job_offer_id = j.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<Application[]> {
    const result = await config.query(
      `SELECT a.*, j.title as job_title, j.company, j.platform, j.url as job_url
       FROM applications a
       JOIN job_offers j ON a.job_offer_id = j.id
       WHERE a.user_id = $1
       ORDER BY a.application_date DESC`,
      [userId]
    );
    return result.rows;
  }

  static async update(id: number, applicationData: Partial<Application>): Promise<Application> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(applicationData).forEach(([key, value]) => {
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
    values.push(id);

    const result = await config.query(
      `UPDATE applications SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async findByJobOfferId(jobOfferId: number): Promise<Application[]> {
    const result = await config.query(
      'SELECT * FROM applications WHERE job_offer_id = $1',
      [jobOfferId]
    );
    return result.rows;
  }
  static async findByUserAndJob(userId: number, jobOfferId: number): Promise<Application | null> {
    const result = await config.query(
      'SELECT * FROM applications WHERE user_id = $1 AND job_offer_id = $2',
      [userId, jobOfferId]
    );
    return result.rows[0] || null;
  }
}

