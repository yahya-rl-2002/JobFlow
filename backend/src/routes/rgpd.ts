import express from 'express';
import { authenticate } from '../middleware/auth';
import { RGPDController } from '../controllers/RGPDController';

const router = express.Router();

router.use(authenticate);

// Export des données utilisateur (droit à la portabilité)
router.get('/export', RGPDController.exportData);

// Suppression des données utilisateur (droit à l'oubli)
router.delete('/delete', RGPDController.deleteData);

// Vérifier le consentement
router.get('/consent', RGPDController.checkConsent);

// Enregistrer le consentement
router.post('/consent', RGPDController.recordConsent);

export default router;

