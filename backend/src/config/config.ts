import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Environment variable ${key} is missing`);
        }
        return ''; // Return empty string in dev if not required/provided
    }
    return value;
};

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),

    db: {
        host: getEnv('DB_HOST', 'localhost'),
        port: parseInt(getEnv('DB_PORT', '5432'), 10),
        name: getEnv('DB_NAME', 'job_application_db'),
        user: getEnv('DB_USER', 'postgres'),
        password: getEnv('DB_PASSWORD', ''),
    },

    redis: {
        url: getEnv('REDIS_URL', 'redis://localhost:6379'),
    },

    jwt: {
        secret: getEnv('JWT_SECRET', 'dev-secret-do-not-use-in-prod'),
        expiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
    },

    linkedin: {
        clientId: getEnv('LINKEDIN_CLIENT_ID'),
        clientSecret: getEnv('LINKEDIN_CLIENT_SECRET'),
        redirectUri: getEnv('LINKEDIN_REDIRECT_URI', 'http://localhost:5173/auth/linkedin/callback'),
    },

    nlpService: {
        url: getEnv('NLP_SERVICE_URL', 'http://127.0.0.1:5001'),
    },

    logging: {
        level: getEnv('LOG_LEVEL', 'info'),
    },

    security: {
        encryptionKey: getEnv('ENCRYPTION_KEY'),
    },
};
