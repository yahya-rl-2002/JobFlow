import { Request, Response, NextFunction } from 'express';
import {
  LinkedInError,
  LinkedInAuthError,
  LinkedInTokenError,
  LinkedInAPIError,
  LinkedInRateLimitError,
} from '../utils/LinkedInErrors';
import { logger } from '../utils/logger';

/**
 * Gestionnaire d'erreurs spécifique pour LinkedIn
 */
export const linkedinErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof LinkedInError) {
    logger.error('LinkedIn error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
      userId: (req as any).userId,
      originalError: error.originalError,
    });

    // Messages utilisateur-friendly selon le type d'erreur
    let userMessage = error.message;

    if (error instanceof LinkedInAuthError) {
      userMessage = 'LinkedIn authentication failed. Please try connecting again.';
    } else if (error instanceof LinkedInTokenError) {
      userMessage = 'LinkedIn token expired. Please reconnect your LinkedIn account.';
    } else if (error instanceof LinkedInRateLimitError) {
      userMessage = 'Too many requests to LinkedIn. Please try again later.';
    } else if (error instanceof LinkedInAPIError) {
      userMessage = 'LinkedIn API error. Please try again later.';
    }

    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: userMessage,
        type: error.name,
        ...(process.env.NODE_ENV !== 'production' && {
          details: error.message,
          originalError: error.originalError,
        }),
      },
    });
  }

  // Passer à l'erreur handler suivant si ce n'est pas une erreur LinkedIn
  next(error);
};

