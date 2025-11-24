import express from 'express';
import { authenticate } from '../middleware/auth';
import { JobController } from '../controllers/JobController';
import { JobSyncService } from '../services/JobSyncService';
import { logger } from '../utils/logger';

const router = express.Router();

router.use(authenticate);

// Routes existantes
router.get('/search', JobController.search);
router.get('/:id', JobController.getById);
router.post('/sync', JobController.syncJobs);
router.delete('/', JobController.deleteAll); // Route to delete all jobs for user

// Nouvelle route pour forcer une synchronisation
router.post('/sync/force', async (req, res, next) => {
  try {
    const { keywords, location } = req.body;
    const stats = await JobSyncService.forceSync(keywords, location);
    res.json({
      message: 'Synchronization completed',
      stats,
    });
  } catch (error: any) {
    logger.error('Force sync error', error);
    next(error);
  }
});

// Route pour obtenir les statistiques de synchronisation
router.get('/sync/stats', async (req, res, next) => {
  try {
    const stats = JobSyncService.getLastSyncStats();
    if (!stats) {
      return res.json({ message: 'No sync statistics available yet' });
    }
    res.json(stats);
  } catch (error: any) {
    logger.error('Get sync stats error', error);
    next(error);
  }
});

// Route pour nettoyer les offres obsolètes
router.post('/cleanup', async (req, res, next) => {
  try {
    const daysOld = parseInt(req.body.daysOld || '30');
    const deletedCount = await JobSyncService.cleanupOldJobs(daysOld);
    res.json({
      message: 'Cleanup completed',
      deletedCount,
      daysOld,
    });
  } catch (error: any) {
    logger.error('Cleanup error', error);
    next(error);
  }
});

export default router;
