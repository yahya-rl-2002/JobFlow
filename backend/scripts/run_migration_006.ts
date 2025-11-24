// Script pour exécuter la migration 006: Ajouter les colonnes de credentials
import fs from 'fs';
import path from 'path';
import { config } from '../src/config/database';
import { logger } from '../src/utils/logger';

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../migrations/006_add_credentials_to_users.sql');
        
        if (!fs.existsSync(migrationPath)) {
            logger.error(`Migration file not found: ${migrationPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        logger.info('Running migration: 006_add_credentials_to_users.sql');
        logger.info('Adding LinkedIn and Indeed credentials columns to users table...');
        
        await config.query(sql);
        
        logger.info('✅ Migration completed successfully');
        logger.info('Users table now has linkedin_email, linkedin_password_encrypted, indeed_email, indeed_password_encrypted columns');
        
        process.exit(0);
    } catch (error: any) {
        logger.error('❌ Migration failed', error);
        
        // Si les colonnes existent déjà, c'est OK
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            logger.info('⚠️ Columns may already exist. This is OK if you are re-running the migration.');
            process.exit(0);
        }
        
        process.exit(1);
    }
}

runMigration();

