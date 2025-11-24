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
  skills_required?: string[];
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
  user_id?: number;
}

export interface JobSearchFilters {
  platform?: string;
  location?: string | string[];
  job_type?: string;
  remote?: boolean;
  keywords?: string | string[];
  limit?: number;
  offset?: number;
  user_id?: number;
}

export class JobOfferModel {
  static async create(jobData: JobOffer): Promise<JobOffer> {
    const result = await config.query(
      `INSERT INTO job_offers (
        external_id, platform, title, company, location, description, requirements,
        skills_required, salary_min, salary_max, salary_currency, job_type, remote, url,
        posted_date, expiry_date, raw_data, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        jobData.user_id || null,
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

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

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

  static async search(filters: JobSearchFilters): Promise<JobOffer[]> {
    let query = `SELECT * FROM job_offers WHERE is_active = true`;
    const params: any[] = [];
    let paramCount = 1;

    // Handle keywords with Full Text Search
    let searchKeywords = '';
    if (Array.isArray(filters.keywords)) {
      searchKeywords = filters.keywords.join(' ');
    } else if (filters.keywords) {
      searchKeywords = filters.keywords;
    }

    if (searchKeywords) {
      query = `
        SELECT *, ts_rank(search_vector, websearch_to_tsquery('english', $${paramCount})) as rank
        FROM job_offers
        WHERE is_active = true
        AND search_vector @@ websearch_to_tsquery('english', $${paramCount})
      `;
      params.push(searchKeywords);
      paramCount++;
    }

    if (filters.platform) {
      query += ` AND platform = $${paramCount}`;
      params.push(filters.platform);
      paramCount++;
    }

    if (filters.location) {
      if (Array.isArray(filters.location)) {
        const locations = filters.location.map(l => `%${l}%`);
        query += ` AND (${locations.map((_, i) => `location ILIKE $${paramCount + i}`).join(' OR ')})`;
        locations.forEach(l => params.push(l));
        paramCount += locations.length;
      } else {
        query += ` AND location ILIKE $${paramCount}`;
        params.push(`%${filters.location}%`);
        paramCount++;
      }
    }

    if (filters.job_type) {
      query += ` AND job_type = $${paramCount}`;
      params.push(filters.job_type);
      paramCount++;
    }

    if (filters.remote) {
      query += ` AND remote = $${paramCount}`;
      params.push(true);
      paramCount++;
    }

    if (filters.user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.user_id);
      paramCount++;
    }

    // Add sorting
    if (searchKeywords) {
      query += ` ORDER BY rank DESC, posted_date DESC`;
    } else {
      query += ` ORDER BY posted_date DESC`;
    }

    // Add pagination
    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
      paramCount++;
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
              posted_date, expiry_date, raw_data, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
            job.user_id || null,
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

  static async deleteAllForUser(userId: number): Promise<void> {
    await config.query('DELETE FROM job_offers WHERE user_id = $1', [userId]);
  }
}
