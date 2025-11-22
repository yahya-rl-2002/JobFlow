import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { config } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { JobSyncService } from './services/JobSyncService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cvRoutes from './routes/cv';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import matchingRoutes from './routes/matching';
import linkedinRoutes from './routes/linkedin';
import rgpdRoutes from './routes/rgpd';
import webhookRoutes from './routes/webhooks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/linkedin', linkedinRoutes);
app.use('/api/rgpd', rgpdRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialisation de la base de données
config.initialize()
  .then(() => {
    logger.info('Database connected successfully');
    
    // Démarrer le service de synchronisation automatique des offres
    // Par défaut activé, peut être désactivé avec ENABLE_JOB_SYNC=false
    if (process.env.ENABLE_JOB_SYNC !== 'false') {
      JobSyncService.start();
      logger.info('Job sync service started');
    } else {
      logger.info('Job sync service disabled (ENABLE_JOB_SYNC=false)');
    }
    
    const server = createServer(app);
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;

