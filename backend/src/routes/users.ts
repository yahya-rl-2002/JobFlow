import express from 'express';
import { authenticate } from '../middleware/auth';
import { UserController } from '../controllers/UserController';

const router = express.Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/password', UserController.changePassword);
router.delete('/account', UserController.deleteAccount);
router.get('/preferences', UserController.getPreferences);
router.put('/preferences', UserController.updatePreferences);
router.get('/export', UserController.exportData);
router.get('/credentials', UserController.getCredentials);
router.put('/credentials', UserController.updateCredentials);

export default router;

