import { Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { CVModel } from '../models/CV';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class CVController {
  static async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const cv = await CVModel.create({
        user_id: req.userId!,
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
      });

      res.status(201).json(cv);
    } catch (error) {
      logger.error('CV upload error', error);
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cvs = await CVModel.findByUserId(req.userId!);
      res.json(cvs);
    } catch (error) {
      logger.error('Get CVs error', error);
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cv = await CVModel.findById(parseInt(req.params.id));
      if (!cv) {
        return res.status(404).json({ error: 'CV not found' });
      }

      if (cv.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(cv);
    } catch (error) {
      logger.error('Get CV error', error);
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cv = await CVModel.findById(parseInt(req.params.id));
      if (!cv) {
        return res.status(404).json({ error: 'CV not found' });
      }

      if (cv.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete file from filesystem
      try {
        await fs.unlink(cv.file_path);
      } catch (error) {
        logger.warn('File deletion error', error);
      }

      await CVModel.delete(cv.id!);
      res.json({ message: 'CV deleted successfully' });
    } catch (error) {
      logger.error('Delete CV error', error);
      next(error);
    }
  }

  static async parse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cv = await CVModel.findById(parseInt(req.params.id));
      if (!cv) {
        return res.status(404).json({ error: 'CV not found' });
      }

      if (cv.user_id !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Call NLP service to parse CV
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:5001'; // Utiliser 127.0.0.1 au lieu de localhost pour éviter IPv6
      
      try {
        
        // Convertir le chemin en chemin absolu si nécessaire
        let filePath = cv.file_path;
        
        // Liste des chemins possibles à essayer
        const possiblePaths = [];
        
        // Si c'est déjà un chemin absolu, l'utiliser
        if (path.isAbsolute(filePath)) {
          possiblePaths.push(filePath);
        } else {
          // Chemins relatifs possibles
          // 1. Depuis le répertoire courant (backend/)
          possiblePaths.push(path.join(process.cwd(), filePath));
          // 2. Depuis backend/uploads (si file_path commence par uploads/)
          if (filePath.startsWith('uploads/')) {
            possiblePaths.push(path.join(process.cwd(), filePath));
            possiblePaths.push(path.join(process.cwd(), 'backend', filePath));
          } else {
            // 3. Depuis uploads/ directement
            possiblePaths.push(path.join(process.cwd(), 'uploads', path.basename(filePath)));
            possiblePaths.push(path.join(process.cwd(), 'backend', 'uploads', path.basename(filePath)));
          }
        }
        
        // Essayer chaque chemin jusqu'à trouver celui qui existe
        let fileExists = false;
        for (const testPath of possiblePaths) {
          try {
            await fs.access(testPath);
            filePath = testPath;
            fileExists = true;
            logger.info(`CV file found at: ${filePath}`);
            break;
          } catch {
            continue;
          }
        }
        
        if (!fileExists) {
          logger.error(`CV file not found. Tried paths: ${possiblePaths.join(', ')}`);
          throw new Error(`CV file not found: ${cv.file_path}. Tried: ${possiblePaths.join(', ')}`);
        }
        
        // S'assurer que le chemin est absolu
        filePath = path.resolve(filePath);
        
        logger.info(`Parsing CV: ${filePath}`);
        
        const response = await axios.post(`${nlpServiceUrl}/parse-cv`, {
          file_path: filePath,
        });

        // Le service NLP retourne { success: true, parsed_data: {...} }
        const parsedData = response.data.parsed_data || response.data;

        // Vérifier que parsed_data existe
        if (!parsedData) {
          throw new Error('No parsed data returned from NLP service');
        }

        await CVModel.update(cv.id!, { parsed_data: parsedData });

        logger.info(`CV ${cv.id} parsed successfully`);
        
        res.json({
          message: 'CV parsed successfully',
          parsed_data: parsedData,
        });
      } catch (error: any) {
        logger.error('CV parsing error', {
          error: error.message,
          response: error.response?.data,
          file_path: cv.file_path,
          stack: error.stack,
        });
        
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        res.status(500).json({
          error: 'Failed to parse CV',
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            file_path: cv.file_path,
            nlp_service_url: nlpServiceUrl,
            error_type: error.constructor.name,
          } : undefined,
        });
      }
    } catch (error) {
      logger.error('Parse CV error', error);
      next(error);
    }
  }
}

