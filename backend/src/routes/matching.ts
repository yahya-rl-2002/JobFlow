import express from 'express';
import { authenticate } from '../middleware/auth';
import { MatchingController } from '../controllers/MatchingController';

const router = express.Router();

router.use(authenticate);

router.post('/match', MatchingController.matchCVWithJobs);
router.get('/results/:cvId', MatchingController.getMatchingResults);
router.get('/job/:jobId/score', MatchingController.getJobMatchScore);

export default router;

