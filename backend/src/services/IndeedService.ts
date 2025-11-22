import axios from 'axios';
import { JobOffer } from '../models/JobOffer';
import { logger } from '../utils/logger';

interface IndeedJobSearchParams {
  keywords: string;
  location: string;
  limit?: number;
  period?: '24h' | 'week' | 'month';
}

export class IndeedService {
  private static readonly API_BASE_URL = 'https://api.indeed.com/ads/apisearch';

  /**
   * Récupère les offres d'emploi depuis Indeed
   * Utilise l'API Indeed Publisher (gratuite avec limitations)
   */
  static async fetchJobs(params: IndeedJobSearchParams): Promise<JobOffer[]> {
    try {
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:5001';

      // Essayer d'abord le scraping via le service Python (plus fiable)
      try {
        logger.info(`Fetching real Indeed jobs via scraper: keywords=${params.keywords}, location=${params.location}, period=${params.period}`);

        const response = await axios.post(`${nlpServiceUrl}/scrape-jobs`, {
          keywords: params.keywords || '',
          location: params.location || '',
          limit: params.limit || 25,
          platform: 'indeed',
          period: params.period || 'month', // Pass period to scraper
        }, {
          timeout: 60000, // 60 secondes pour le scraping
        });

        if (response.data.success && response.data.jobs && response.data.jobs.length > 0) {
          const jobs: JobOffer[] = response.data.jobs.map((job: any) => ({
            external_id: job.external_id,
            platform: 'indeed',
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: job.salary_currency,
            job_type: job.job_type,
            remote: job.remote,
            url: job.url,
            posted_date: job.posted_date ? new Date(job.posted_date) : new Date(),
            raw_data: job.raw_data,
          }));

          logger.info(`Fetched ${jobs.length} real Indeed jobs via scraper`);
          return jobs;
        }
      } catch (scrapeError: any) {
        logger.warn('Indeed scraping failed, trying API Publisher', {
          error: scrapeError.message,
        });
      }

      // Fallback vers l'API Publisher si le scraping échoue
      const publisherId = process.env.INDEED_PUBLISHER_ID;

      if (!publisherId) {
        logger.warn('Indeed Publisher ID not configured and scraping failed');
        return [];
      }

      const jobs: JobOffer[] = [];
      const limit = params.limit || 25;
      const start = 0;

      // Map period to fromage (days)
      let fromage = 30; // Default month
      if (params.period === '24h') fromage = 1;
      if (params.period === 'week') fromage = 7;

      // Indeed API permet jusqu'à 25 résultats par requête
      const requestsNeeded = Math.ceil(limit / 25);

      for (let i = 0; i < requestsNeeded; i++) {
        const currentStart = start + i * 25;
        const currentLimit = Math.min(25, limit - currentStart);

        if (currentLimit <= 0) break;

        try {
          const response = await axios.get(this.API_BASE_URL, {
            params: {
              publisher: publisherId,
              v: '2', // Version de l'API
              format: 'json',
              q: params.keywords,
              l: params.location,
              sort: 'date',
              radius: 25,
              start: currentStart,
              limit: currentLimit,
              fromage: fromage, // Use mapped period
              highlight: 0,
              filter: 1,
              latlong: 1,
              co: 'fr', // Pays (France) - ajustez selon vos besoins
              chnl: '',
              userip: '1.2.3.4',
              useragent: 'Mozilla/5.0',
            },
            timeout: 10000,
          });

          if (response.data && response.data.results) {
            for (const job of response.data.results) {
              // Parser le salaire si disponible
              let salaryMin: number | undefined;
              let salaryMax: number | undefined;
              let salaryCurrency = 'EUR';

              if (job.salary) {
                const salaryMatch = job.salary.match(/(\d+[\s,.]?\d*)\s*-\s*(\d+[\s,.]?\d*)/);
                if (salaryMatch) {
                  salaryMin = parseInt(salaryMatch[1].replace(/[\s,.]/g, ''));
                  salaryMax = parseInt(salaryMatch[2].replace(/[\s,.]/g, ''));
                } else {
                  const singleSalary = job.salary.match(/(\d+[\s,.]?\d*)/);
                  if (singleSalary) {
                    salaryMin = parseInt(singleSalary[1].replace(/[\s,.]/g, ''));
                  }
                }

                // Détecter la devise
                if (job.salary.includes('€') || job.salary.includes('EUR')) {
                  salaryCurrency = 'EUR';
                } else if (job.salary.includes('$') || job.salary.includes('USD')) {
                  salaryCurrency = 'USD';
                } else if (job.salary.includes('£') || job.salary.includes('GBP')) {
                  salaryCurrency = 'GBP';
                }
              }

              jobs.push({
                external_id: `indeed_${job.jobkey}`,
                platform: 'indeed',
                title: job.jobtitle || '',
                company: job.company || '',
                location: job.formattedLocation || job.location || '',
                description: job.snippet || '',
                requirements: job.snippet || '', // Indeed ne sépare pas toujours description et requirements
                salary_min: salaryMin,
                salary_max: salaryMax,
                salary_currency: salaryCurrency,
                job_type: this.parseJobType(job.jobtitle, job.snippet),
                remote: this.isRemote(job.jobtitle, job.snippet, job.location),
                url: job.url || job.indeedApplyUrl || '',
                posted_date: job.date ? new Date(job.date) : new Date(),
                raw_data: job,
              });
            }
          }

          // Rate limiting: Indeed recommande de ne pas faire plus de 1 requête par seconde
          if (i < requestsNeeded - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error: any) {
          logger.error(`Indeed API request error (batch ${i})`, {
            error: error.message,
            response: error.response?.data,
          });
          // Continue avec les autres requêtes même si une échoue
        }
      }

      logger.info(`Fetched ${jobs.length} jobs from Indeed`);
      return jobs;
    } catch (error) {
      logger.error('Indeed fetch jobs error', error);
      throw error;
    }
  }

  /**
   * Parse le type de poste depuis le titre et la description
   */
  private static parseJobType(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('cdi') || text.includes('permanent') || text.includes('full-time')) {
      return 'CDI';
    } else if (text.includes('cdd') || text.includes('contract') || text.includes('temporary')) {
      return 'CDD';
    } else if (text.includes('stage') || text.includes('internship') || text.includes('intern')) {
      return 'Stage';
    } else if (text.includes('freelance') || text.includes('freelance') || text.includes('consultant')) {
      return 'Freelance';
    } else if (text.includes('alternance') || text.includes('apprenticeship')) {
      return 'Alternance';
    }

    return 'Non spécifié';
  }

  /**
   * Détermine si le poste est en télétravail
   */
  private static isRemote(title: string, description: string, location: string): boolean {
    const text = `${title} ${description} ${location}`.toLowerCase();
    return (
      text.includes('remote') ||
      text.includes('télétravail') ||
      text.includes('telework') ||
      text.includes('work from home') ||
      text.includes('wfh') ||
      (!!location && location.toLowerCase().includes('remote'))
    );
  }

  /**
   * Soumet une candidature sur Indeed
   * NOTE: Indeed n'offre pas d'API publique pour soumettre des candidatures
   * Cette méthode nécessiterait du web scraping (avec respect des ToS)
   */
  static async submitApplication(
    jobId: string,
    jobUrl: string,
    cvPath: string,
    coverLetter?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Indeed n'a pas d'API pour soumettre des candidatures
      // Options:
      // 1. Utiliser Indeed Apply (nécessite un compte Indeed)
      // 2. Web scraping avec respect strict des ToS
      // 3. Rediriger l'utilisateur vers la page de candidature

      logger.warn('Indeed application submission requires alternative approach');

      return {
        success: false,
        message: 'Indeed application submission requires manual process or web automation (with ToS compliance).',
      };
    } catch (error) {
      logger.error('Indeed submit application error', error);
      throw error;
    }
  }
}

