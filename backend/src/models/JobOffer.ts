import { config } from '../config/database';

export interface JobOffer {
  id?: number;
  external_id: string;
  platform: 'linkedin' | 'indeed';
  title: string;
  company: string;
  location?: string;
  description?: string;
  requirements?: string;
  skills_required?: string[]; // Compétences extraites
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  job_type?: string;
  remote?: boolean;
  url?: string;
  posted_date?: Date;
  expiry_date?: Date;
  raw_data?: any;
  created_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
}

export class JobOfferModel {
  static async create(jobData: JobOffer): Promise<JobOffer> {
    const result = await config.query(
      `INSERT INTO job_offers (
        external_id, platform, title, company, location, description, requirements,
        skills_required, salary_min, salary_max, salary_currency, job_type, remote, url,
        posted_date, expiry_date, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (external_id) DO UPDATE SET
        title = EXCLUDED.title,
        company = EXCLUDED.company,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        requirements = EXCLUDED.requirements,
        skills_required = EXCLUDED.skills_required,
        salary_min = EXCLUDED.salary_min,
        salary_max = EXCLUDED.salary_max,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        jobData.external_id,
        jobData.platform,
        jobData.title,
        jobData.company,
        jobData.location || null,
        jobData.description || null,
        jobData.requirements || null,
        jobData.skills_required || null,
        jobData.salary_min || null,
        jobData.salary_max || null,
        jobData.salary_currency || null,
        jobData.job_type || null,
        jobData.remote || false,
        jobData.url || null,
        jobData.posted_date || null,
        jobData.expiry_date || null,
        jobData.raw_data ? JSON.stringify(jobData.raw_data) : null,
      ]
    );

    return result.rows[0];
  }

  static async findById(id: number): Promise<JobOffer | null> {
    const result = await config.query(
      'SELECT * FROM job_offers WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByExternalId(externalId: string): Promise<JobOffer | null> {
    const result = await config.query(
      'SELECT * FROM job_offers WHERE external_id = $1',
      [externalId]
    );
    return result.rows[0] || null;
  }

  static async update(id: number, jobData: Partial<JobOffer>): Promise<JobOffer> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(jobData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'external_id') {
        if (key === 'raw_data' && typeof value === 'object') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else if (key === 'skills_required' && Array.isArray(value)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
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
      `UPDATE job_offers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Job offer not found');
    }

    return result.rows[0];
  }

  static async search(filters: {
    platform?: string;
    location?: string;
    job_type?: string;
    remote?: boolean;
    keywords?: string;
    limit?: number;
    offset?: number;
  }): Promise<JobOffer[]> {
    let query = 'SELECT * FROM job_offers WHERE is_active = true';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.platform) {
      query += ` AND platform = $${paramCount}`;
      params.push(filters.platform);
      paramCount++;
    }

    if (filters.location && filters.location.trim()) {
      query += ` AND location ILIKE $${paramCount}`;
      params.push(`%${filters.location.trim()}%`);
      paramCount++;
    }

    if (filters.job_type) {
      query += ` AND job_type = $${paramCount}`;
      params.push(filters.job_type);
      paramCount++;
    }

    if (filters.remote !== undefined) {
      query += ` AND remote = $${paramCount}`;
      params.push(filters.remote);
      paramCount++;
    }

    if (filters.keywords && filters.keywords.trim()) {
      // Recherche plus flexible : chaque mot-clé est recherché séparément
      const keywords = filters.keywords.trim().split(/\s+/).filter(k => k.length > 0);
      if (keywords.length > 0) {
        const keywordConditions = keywords.map((_, idx) => {
          const paramIdx = paramCount + idx;
          return `(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR requirements ILIKE $${paramIdx} OR company ILIKE $${paramIdx})`;
        }).join(' AND ');
        query += ` AND (${keywordConditions})`;
        keywords.forEach(keyword => {
          params.push(`%${keyword}%`);
        });
        paramCount += keywords.length;
      }
    }

    query += ' ORDER BY posted_date DESC, created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await config.query(query, params);
    return result.rows;
  }

  static async bulkCreate(jobs: JobOffer[]): Promise<void> {
    const client = await config.getClient();
    try {
      await client.query('BEGIN');

      for (const job of jobs) {
        await client.query(
          `INSERT INTO job_offers (
            external_id, platform, title, company, location, description, requirements,
            skills_required, salary_min, salary_max, salary_currency, job_type, remote, url,
            posted_date, expiry_date, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title,
            company = EXCLUDED.company,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            requirements = EXCLUDED.requirements,
            skills_required = EXCLUDED.skills_required,
            salary_min = EXCLUDED.salary_min,
            salary_max = EXCLUDED.salary_max,
            updated_at = CURRENT_TIMESTAMP`,
          [
            job.external_id,
            job.platform,
            job.title,
            job.company,
            job.location || null,
            job.description || null,
            job.requirements || null,
            job.skills_required || null,
            job.salary_min || null,
            job.salary_max || null,
            job.salary_currency || null,
            job.job_type || null,
            job.remote || false,
            job.url || null,
            job.posted_date || null,
            job.expiry_date || null,
            job.raw_data ? JSON.stringify(job.raw_data) : null,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

