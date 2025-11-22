import { logger } from './logger';

/**
 * Retry une fonction avec backoff exponentiel
 * 
 * @param fn - Fonction à exécuter
 * @param maxRetries - Nombre maximum de tentatives
 * @param initialDelay - Délai initial en millisecondes
 * @param shouldRetry - Fonction pour déterminer si on doit retry (optionnel)
 * @returns Résultat de la fonction
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Vérifier si on doit retry
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Ne pas retry sur certaines erreurs
      if (
        error.statusCode === 401 || // Unauthorized
        error.statusCode === 403 || // Forbidden
        error.statusCode === 404    // Not Found
      ) {
        throw error;
      }

      // Si c'est la dernière tentative, throw l'erreur
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculer le délai avec backoff exponentiel
      const delay = initialDelay * Math.pow(2, attempt);
      
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
        error: error.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Retry avec jitter (ajout de randomisation pour éviter le thundering herd)
 */
export async function retryWithBackoffAndJitter<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      if (
        error.statusCode === 401 ||
        error.statusCode === 403 ||
        error.statusCode === 404
      ) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Backoff exponentiel avec jitter
      const baseDelay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * baseDelay; // Jitter de 30%
      const delay = baseDelay + jitter;

      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`, {
        error: error.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

