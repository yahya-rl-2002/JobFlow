import express from 'express';
import { authenticate } from '../middleware/auth';
import { ApplicationController } from '../controllers/ApplicationController';

const router = express.Router();

router.use(authenticate);

router.get('/', ApplicationController.getAll);
router.get('/:id', ApplicationController.getById);
router.post('/', ApplicationController.create);
router.put('/:id', ApplicationController.update);
router.post('/bulk', ApplicationController.bulkApply);
router.post('/:id/submit', ApplicationController.submit);

export default router;

