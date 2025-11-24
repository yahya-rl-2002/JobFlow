import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { config } from './config';

const redisClient = createClient({
    url: config.redis.url
});

redisClient.on('error', (err) => {
    logger.warn('Redis Client Error', err);
});

redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
});

// Connect without blocking app startup if redis fails
redisClient.connect().catch(err => {
    logger.warn('Failed to connect to Redis, caching will be disabled', err);
});

export default redisClient;
