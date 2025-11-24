// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { config } from '../src/config/database';
import { logger } from '../src/utils/logger';

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../migrations/007_add_submission_fields_to_applications.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        logger.info('Running migration: 007_add_submission_fields_to_applications.sql');
        await config.query(sql);
        logger.info('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Migration failed', error);
        process.exit(1);
    }
}

runMigration();
