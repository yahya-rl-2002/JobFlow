"""
Service de scraping LinkedIn pour récupérer de vraies offres d'emploi
Utilise le service de scraping personnalisé
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Utiliser le scraper personnalisé
from services.job_scraper import JobScraper

class LinkedInScraper:
    """
    Service de scraping LinkedIn utilisant JobSpy
    """
    
    def __init__(self):
        self.scraper = JobScraper()
    
    def scrape_jobs(
        self,
        keywords: str,
        location: str = '',
        limit: int = 25,
        site_name: str = 'linkedin'
    ) -> List[Dict]:
        """
        Scrape les offres d'emploi depuis LinkedIn ou Indeed
        
        Args:
            keywords: Mots-clés de recherche
            location: Localisation (ex: "Paris, France")
            limit: Nombre maximum d'offres à récupérer
            site_name: 'linkedin' ou 'indeed'
        
        Returns:
            Liste d'offres d'emploi au format standardisé
        """
        try:
            logger.info(f'Scraping {site_name} jobs: keywords={keywords}, location={location}, limit={limit}')
            
            if site_name == 'indeed':
                jobs = self.scraper.scrape_indeed(keywords, location, limit)
            elif site_name == 'linkedin':
                jobs = self.scraper.scrape_linkedin(keywords, location, limit)
            else:
                logger.warning(f'Unknown site_name: {site_name}')
                jobs = []
            
            logger.info(f'Successfully scraped {len(jobs)} jobs from {site_name}')
            return jobs
            
        except Exception as e:
            logger.error(f'Error scraping {site_name} jobs: {str(e)}', exc_info=True)
            return []
    
    def _standardize_job_legacy(self, job: any, platform: str) -> Optional[Dict]:
        """
        Convertit un job JobSpy au format standardisé
        
        Args:
            job: Objet job de JobSpy
            platform: 'linkedin' ou 'indeed'
        
        Returns:
            Dictionnaire au format standardisé ou None
        """
        try:
            # Extraire les informations de base
            title = getattr(job, 'title', '') or ''
            company = getattr(job, 'company', '') or ''
            location = getattr(job, 'location', '') or ''
            description = getattr(job, 'description', '') or ''
            job_url = getattr(job, 'job_url', '') or ''
            date_posted = getattr(job, 'date_posted', None)
            
            # Générer un external_id unique
            job_id = getattr(job, 'job_id', None) or getattr(job, 'id', None)
            if not job_id and job_url:
                # Extraire l'ID depuis l'URL
                if 'linkedin.com/jobs/view/' in job_url:
                    job_id = job_url.split('/jobs/view/')[-1].split('?')[0]
                elif 'indeed.com/viewjob' in job_url:
                    job_id = job_url.split('jk=')[-1].split('&')[0] if 'jk=' in job_url else None
            
            external_id = f"{platform}_{job_id}" if job_id else f"{platform}_{hash(job_url)}"
            
            # Parser le salaire si disponible
            salary_min, salary_max, salary_currency = self._parse_salary(
                getattr(job, 'salary', '') or ''
            )
            
            # Déterminer si c'est du télétravail
            remote = self._is_remote(title, description, location)
            
            # Parser le type de poste
            job_type = self._parse_job_type(title, description)
            
            # Convertir la date
            posted_date = None
            if date_posted:
                try:
                    if isinstance(date_posted, str):
                        # Parser différentes formats de date
                        posted_date = datetime.fromisoformat(date_posted.replace('Z', '+00:00'))
                    elif isinstance(date_posted, datetime):
                        posted_date = date_posted
                except:
                    posted_date = datetime.now()
            
            if not posted_date:
                posted_date = datetime.now()
            
            return {
                'external_id': external_id,
                'platform': platform,
                'title': title,
                'company': company,
                'location': location,
                'description': description,
                'requirements': description,  # JobSpy ne sépare pas toujours description et requirements
                'salary_min': salary_min,
                'salary_max': salary_max,
                'salary_currency': salary_currency,
                'job_type': job_type,
                'remote': remote,
                'url': job_url,
                'posted_date': posted_date.isoformat() if isinstance(posted_date, datetime) else posted_date,
                'raw_data': {
                    'source': 'jobspy',
                    'scraped_at': datetime.now().isoformat(),
                    'original_data': str(job)
                }
            }
        except Exception as e:
            logger.error(f'Error in _standardize_job: {str(e)}')
            return None
    
    def _parse_salary(self, salary_text: str) -> tuple:
        """
        Parse le texte de salaire pour extraire min, max et devise
        
        Returns:
            (salary_min, salary_max, currency)
        """
        if not salary_text:
            return (None, None, None)
        
        salary_text = salary_text.lower()
        currency = 'EUR'
        
        # Détecter la devise
        if '€' in salary_text or 'eur' in salary_text or 'euro' in salary_text:
            currency = 'EUR'
        elif '$' in salary_text or 'usd' in salary_text or 'dollar' in salary_text:
            currency = 'USD'
        elif '£' in salary_text or 'gbp' in salary_text or 'pound' in salary_text:
            currency = 'GBP'
        
        # Extraire les nombres
        import re
        numbers = re.findall(r'[\d\s,\.]+', salary_text.replace(',', '').replace('.', ''))
        
        if len(numbers) >= 2:
            try:
                salary_min = int(numbers[0].replace(' ', '').replace(',', '').replace('.', ''))
                salary_max = int(numbers[1].replace(' ', '').replace(',', '').replace('.', ''))
                return (salary_min, salary_max, currency)
            except:
                pass
        
        if len(numbers) >= 1:
            try:
                salary_min = int(numbers[0].replace(' ', '').replace(',', '').replace('.', ''))
                return (salary_min, None, currency)
            except:
                pass
        
        return (None, None, None)
    
    def _is_remote(self, title: str, description: str, location: str) -> bool:
        """Détermine si le poste est en télétravail"""
        text = f"{title} {description} {location}".lower()
        remote_keywords = [
            'remote', 'télétravail', 'telework', 'work from home',
            'wfh', 'télétravail', 'à distance', 'distant', 'home office'
        ]
        return any(keyword in text for keyword in remote_keywords)
    
    def _parse_job_type(self, title: str, description: str) -> str:
        """Parse le type de poste"""
        text = f"{title} {description}".lower()
        
        if 'cdi' in text or 'permanent' in text or 'full-time' in text or 'full time' in text:
            return 'CDI'
        elif 'cdd' in text or 'contract' in text or 'temporary' in text:
            return 'CDD'
        elif 'stage' in text or 'internship' in text or 'intern' in text:
            return 'Stage'
        elif 'freelance' in text or 'consultant' in text:
            return 'Freelance'
        elif 'alternance' in text or 'apprenticeship' in text:
            return 'Alternance'
        
        return 'Non spécifié'

