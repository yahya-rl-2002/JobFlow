import express from 'express';
import { authenticate } from '../middleware/auth';
import { LinkedInController } from '../controllers/LinkedInController';

const router = express.Router();

// Route publique pour obtenir l'URL d'autorisation
router.get('/auth-url', LinkedInController.getAuthorizationUrl);

// Route publique pour le callback OAuth
router.get('/callback', LinkedInController.handleCallback);

// Routes protégées
router.use(authenticate);

router.post('/connect', LinkedInController.connect);
router.get('/profile', LinkedInController.getProfile);
router.delete('/disconnect', LinkedInController.disconnect);
router.get('/token-status', LinkedInController.getTokenStatus);

export default router;

