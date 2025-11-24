import { config } from '../src/config/database';
import { logger } from '../src/utils/logger';

async function checkTokens() {
    try {
        await config.initialize();

        console.log('--- Checking Users ---');
        const users = await config.query('SELECT id, email, first_name, last_name FROM users');
        console.table(users.rows);

        console.log('--- Checking LinkedIn Tokens ---');
        const tokens = await config.query('SELECT user_id, expires_at, created_at FROM linkedin_tokens');
        console.table(tokens.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error checking tokens:', error);
        process.exit(1);
    }
}

checkTokens();
