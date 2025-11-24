import logging
from typing import List, Dict, Optional
from datetime import datetime
# Utiliser le scraper BeautifulSoup qui est plus fiable
from services.job_scraper import JobScraper

logger = logging.getLogger(__name__)

class LinkedInScraper:
    """
    Service de scraping LinkedIn utilisant BeautifulSoup
    pour récupérer de VRAIES offres basées sur les critères utilisateurs.
    """

    def scrape_jobs(
        self,
        keywords: str,
        location: str = '',
        limit: int = 25,
        site_name: str = 'linkedin'
    ) -> List[Dict]:
        """
        Scrape les offres via BeautifulSoup en respectant les critères
        """
        try:
            logger.info(f'🔍 Scraping {site_name}: "{keywords}" in "{location}" (Limit: {limit})')
            
            # Utiliser le scraper BeautifulSoup existant
            scraper = JobScraper()
            
            if site_name == 'linkedin':
                jobs = scraper.scrape_linkedin(
                    keywords=keywords,
                    location=location,
                    limit=limit
                )
            elif site_name == 'indeed':
                jobs = scraper.scrape_indeed(
                    keywords=keywords,
                    location=location,
                    limit=limit
                )
            else:
                # Par défaut, essayer LinkedIn
                jobs = scraper.scrape_linkedin(
                    keywords=keywords,
                    location=location,
                    limit=limit
                )
            
            # Filtrer les offres avec URLs valides
            valid_jobs = []
            for job in jobs:
                if job.get('url') and ('linkedin.com' in job['url'] or 'indeed.com' in job['url']):
                    valid_jobs.append(job)
                elif job.get('url'):
                    # URL valide mais pas LinkedIn/Indeed, on l'accepte quand même
                    valid_jobs.append(job)
            
            if len(valid_jobs) == 0:
                logger.warning(f"❌ Aucune offre valide trouvée pour '{keywords}' dans '{location}'")
                logger.info("💡 LinkedIn peut bloquer les requêtes. Essayez avec d'autres critères ou configurez des proxies.")
                return []
            
            logger.info(f"✅ Found {len(valid_jobs)} valid jobs with URLs")
            return valid_jobs[:limit]
            
        except Exception as e:
            logger.error(f'🔥 Critical Error in scraping: {str(e)}', exc_info=True)
            # Ne pas retourner de démos, retourner un tableau vide
            return []
