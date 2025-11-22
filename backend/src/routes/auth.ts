import express from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '../controllers/AuthController';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').optional().trim(),
    body('last_name').optional().trim(),
    body('gdpr_consent').isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    AuthController.register(req, res, next);
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    AuthController.login(req, res, next);
  }
);

router.post('/refresh', AuthController.refreshToken);

// LinkedIn OAuth login
router.post('/linkedin/login', AuthController.linkedInLogin);

export default router;

