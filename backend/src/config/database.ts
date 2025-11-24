import { Pool, PoolClient } from 'pg';
import { config as appConfig } from '../config/config';
import { logger } from '../utils/logger';

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: appConfig.db.host,
      port: appConfig.db.port,
      database: appConfig.db.name,
      user: appConfig.db.user,
      password: appConfig.db.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Query error', { text, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async initialize() {
    try {
      // Test connection
      await this.pool.query('SELECT NOW()');

      // Create tables if they don't exist
      await this.createTables();

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization failed', error);
      throw error;
    }
  }

  private async createTables() {
    // Users table
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        gdpr_consent BOOLEAN DEFAULT false,
        gdpr_consent_date TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        linkedin_email VARCHAR(255),
        linkedin_password_encrypted TEXT,
        indeed_email VARCHAR(255),
        indeed_password_encrypted TEXT
      )
    `);
    
    // Créer les index pour les credentials
    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_users_linkedin_email ON users(linkedin_email) WHERE linkedin_email IS NOT NULL
    `);
    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_users_indeed_email ON users(indeed_email) WHERE indeed_email IS NOT NULL
    `);

    // CVs table
    await this.query(`
      CREATE TABLE IF NOT EXISTS cvs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        file_path VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        parsed_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Job offers table
    await this.query(`
      CREATE TABLE IF NOT EXISTS job_offers (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) UNIQUE NOT NULL,
        platform VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        requirements TEXT,
        skills_required TEXT[],
        salary_min INTEGER,
        salary_max INTEGER,
        salary_currency VARCHAR(10),
        job_type VARCHAR(50),
        remote BOOLEAN DEFAULT false,
        url VARCHAR(500),
        posted_date TIMESTAMP,
        expiry_date TIMESTAMP,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Ajouter la colonne skills_required si elle n'existe pas (migration)
    await this.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'job_offers' AND column_name = 'skills_required'
        ) THEN
          ALTER TABLE job_offers ADD COLUMN skills_required TEXT[];
        END IF;
      END $$;
    `);

    // Applications table
    await this.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_offer_id INTEGER REFERENCES job_offers(id) ON DELETE CASCADE,
        cv_id INTEGER REFERENCES cvs(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        match_score DECIMAL(5,2),
        customized_cv_path VARCHAR(500),
        application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_date TIMESTAMP,
        notes TEXT,
        submission_status VARCHAR(50),
        submission_message TEXT,
        submission_date TIMESTAMP,
        submission_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ajouter les colonnes de soumission si elles n'existent pas (migration)
    await this.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'applications' AND column_name = 'submission_status'
        ) THEN
          ALTER TABLE applications ADD COLUMN submission_status VARCHAR(50);
          ALTER TABLE applications ADD COLUMN submission_message TEXT;
          ALTER TABLE applications ADD COLUMN submission_date TIMESTAMP;
          ALTER TABLE applications ADD COLUMN submission_method VARCHAR(50);
        END IF;
      END $$;
    `);

    // Matching results table
    await this.query(`
      CREATE TABLE IF NOT EXISTS matching_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cv_id INTEGER REFERENCES cvs(id) ON DELETE CASCADE,
        job_offer_id INTEGER REFERENCES job_offers(id) ON DELETE CASCADE,
        match_score DECIMAL(5,2) NOT NULL,
        matching_details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User preferences table
    await this.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        job_keywords TEXT[],
        locations TEXT[],
        job_types TEXT[],
        salary_min INTEGER,
        salary_max INTEGER,
        remote_only BOOLEAN DEFAULT false,
        auto_apply BOOLEAN DEFAULT false,
        min_match_score DECIMAL(5,2) DEFAULT 70.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LinkedIn tokens table
    await this.query(`
      CREATE TABLE IF NOT EXISTS linkedin_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        token_type VARCHAR(50) DEFAULT 'Bearer',
        scope TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for performance
    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_job_offers_platform ON job_offers(platform);
      CREATE INDEX IF NOT EXISTS idx_job_offers_external_id ON job_offers(external_id);
      CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_applications_job_offer_id ON applications(job_offer_id);
      CREATE INDEX IF NOT EXISTS idx_matching_results_user_id ON matching_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
      CREATE INDEX IF NOT EXISTS idx_linkedin_tokens_user_id ON linkedin_tokens(user_id);
    `);

    logger.info('Database tables created/verified');
  }

  async close() {
    await this.pool.end();
  }
}

export const config = new Database();

