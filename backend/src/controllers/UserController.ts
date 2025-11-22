import { Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { config } from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      logger.error('Get profile error', error);
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { first_name, last_name, phone } = req.body;
      const user = await UserModel.update(req.userId!, {
        first_name,
        last_name,
        phone,
      });
      res.json(user);
    } catch (error) {
      logger.error('Update profile error', error);
      next(error);
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await UserModel.delete(req.userId!);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      logger.error('Delete account error', error);
      next(error);
    }
  }

  static async getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await config.query(
        'SELECT * FROM user_preferences WHERE user_id = $1',
        [req.userId!]
      );

      if (result.rows.length === 0) {
        return res.json(null);
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get preferences error', error);
      next(error);
    }
  }

  static async updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        job_keywords,
        locations,
        job_types,
        salary_min,
        salary_max,
        remote_only,
        auto_apply,
        min_match_score,
      } = req.body;

      const result = await config.query(
        `INSERT INTO user_preferences (
          user_id, job_keywords, locations, job_types, salary_min, salary_max,
          remote_only, auto_apply, min_match_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) DO UPDATE SET
          job_keywords = EXCLUDED.job_keywords,
          locations = EXCLUDED.locations,
          job_types = EXCLUDED.job_types,
          salary_min = EXCLUDED.salary_min,
          salary_max = EXCLUDED.salary_max,
          remote_only = EXCLUDED.remote_only,
          auto_apply = EXCLUDED.auto_apply,
          min_match_score = EXCLUDED.min_match_score,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          req.userId!,
          job_keywords || [],
          locations || [],
          job_types || [],
          salary_min || null,
          salary_max || null,
          remote_only || false,
          auto_apply || false,
          min_match_score || 70.0,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Update preferences error', error);
      next(error);
    }
  }
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password hash
      const result = await config.query(
        'SELECT * FROM users WHERE id = $1',
        [req.userId!]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await UserModel.verifyPassword(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid current password' });
      }

      // Update password
      await UserModel.updatePassword(req.userId!, newPassword);

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      logger.error('Change password error', error);
      next(error);
    }
  }
  static async exportData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      // Fetch all user data in parallel
      const [user, preferences, cvs, applications, matches] = await Promise.all([
        config.query('SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = $1', [userId]),
        config.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]),
        config.query('SELECT * FROM cvs WHERE user_id = $1', [userId]),
        config.query('SELECT * FROM applications WHERE user_id = $1', [userId]),
        config.query('SELECT * FROM matching_results WHERE user_id = $1', [userId])
      ]);

      const exportData = {
        user: user.rows[0],
        preferences: preferences.rows[0] || null,
        cvs: cvs.rows,
        applications: applications.rows,
        matches: matches.rows,
        export_date: new Date().toISOString()
      };

      res.json(exportData);
    } catch (error) {
      logger.error('Export data error', error);
      next(error);
    }
  }
}

