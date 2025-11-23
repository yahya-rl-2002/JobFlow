import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, first_name, last_name, gdpr_consent } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Create user
      const user = await UserModel.create({
        email,
        password_hash: password,
        first_name,
        last_name,
        gdpr_consent: gdpr_consent === true,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });
    } catch (error) {
      logger.error('Registration error', error);
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await UserModel.verifyPassword(
        password,
        user.password_hash!
      );

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });
    } catch (error) {
      logger.error('Login error', error);
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as { userId: number; email: string };

      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
      );

      res.json({ token: newToken });
    } catch (error) {
      logger.error('Token refresh error', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  /**
   * Login or register user via LinkedIn OAuth
   */
  static async linkedInLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorization_code } = req.body;

      if (!authorization_code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      // Import LinkedInService and axios
      const { LinkedInService } = await import('../services/LinkedInService');
      const axios = await import('axios');

      // Exchange code for LinkedIn token
      const tokenData = await LinkedInService.exchangeCodeForToken(authorization_code);

      // Get LinkedIn user profile using the access token directly
      const profileResponse = await axios.default.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        }
      });

      const linkedInUser = profileResponse.data;
      const email = linkedInUser.email;

      if (!email) {
        return res.status(400).json({ error: 'Email not provided by LinkedIn. Please ensure email permission is granted.' });
      }

      // Check if user exists
      let user = await UserModel.findByEmail(email);

      if (!user) {
        // Create new user
        const firstName = linkedInUser.given_name || linkedInUser.name?.split(' ')[0] || 'LinkedIn';
        const lastName = linkedInUser.family_name || linkedInUser.name?.split(' ').slice(1).join(' ') || 'User';

        user = await UserModel.create({
          email,
          password_hash: Math.random().toString(36), // Random password for OAuth users
          first_name: firstName,
          last_name: lastName,
          gdpr_consent: true, // Implicit consent via LinkedIn
        });

        logger.info(`New user created via LinkedIn: ${email} (ID: ${user.id})`);
      } else {
        logger.info(`Existing user logged in via LinkedIn: ${email} (ID: ${user.id})`);
      }

      // Save LinkedIn token for the user
      await LinkedInService.saveToken(user.id!, tokenData);

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
      );

      res.json({
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });

    } catch (error: any) {
      logger.error('LinkedIn login error', error);
      const errorMessage = error.response?.data?.error_description || error.message || 'LinkedIn login failed';
      res.status(500).json({ error: errorMessage });
    }
  }
}
