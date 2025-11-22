import express from 'express';
import { JobSyncService } from '../services/JobSyncService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = express.Router();

/**
 * Webhook pour recevoir des notifications de nouvelles offres d'emploi
 * Supporte LinkedIn et Indeed (si webhooks disponibles)
 */
router.post('/jobs', async (req, res) => {
  try {
    // Vérifier la signature du webhook (sécurité)
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { platform, event, data } = req.body;

    logger.info('Webhook received', { platform, event });

    // Traiter selon le type d'événement
    switch (event) {
      case 'job.created':
      case 'job.updated':
        // Déclencher une synchronisation pour cette offre spécifique
        if (data.keywords && data.location) {
          await JobSyncService.forceSync(data.keywords, data.location);
          logger.info('Triggered sync from webhook', { keywords: data.keywords, location: data.location });
        }
        break;
      
      case 'jobs.bulk_update':
        // Synchronisation complète
        await JobSyncService.syncAllJobs();
        logger.info('Triggered full sync from webhook');
        break;
      
      default:
        logger.warn('Unknown webhook event', { event });
    }

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
  } catch (error: any) {
    logger.error('Webhook processing error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Endpoint de vérification pour les webhooks (LinkedIn/Indeed)
 */
router.get('/jobs', (req, res) => {
  const challenge = req.query.challenge;
  if (challenge) {
    // LinkedIn/Indeed peuvent envoyer un challenge pour vérifier l'endpoint
    res.send(challenge);
  } else {
    res.json({ status: 'ok', message: 'Webhook endpoint is active' });
  }
});

export default router;

