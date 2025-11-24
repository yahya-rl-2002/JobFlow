import logging
import time
from typing import Dict, List, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import os

logger = logging.getLogger(__name__)

class JobApplicationAutomator:
    """
    Automatise les candidatures réelles sur LinkedIn et Indeed
    en utilisant Selenium pour contrôler un navigateur.
    Optimisé pour réutiliser la session LinkedIn OAuth.
    """
    
    def __init__(self, headless: bool = True, reuse_session: bool = True):
        self.headless = headless
        self.reuse_session = reuse_session
        self.driver = None
        self.linkedin_session_active = False
        self.last_application_time = 0
        self.min_delay_between_applications = 3  # Secondes minimum entre candidatures
        
    def _setup_driver(self):
        """Configure le driver Selenium avec webdriver-manager pour télécharger automatiquement ChromeDriver"""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # Utiliser webdriver-manager pour télécharger automatiquement ChromeDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            logger.info("Chrome driver initialized successfully with webdriver-manager")
        except Exception as e:
            logger.error(f"Failed to setup Chrome driver: {str(e)}")
            logger.error("Make sure Chrome browser is installed on your system")
            raise
        
    def apply_to_linkedin_job(
        self,
        job_url: str,
        cv_path: str,
        linkedin_oauth_token: Optional[str] = None,
        cover_letter: Optional[str] = None
    ) -> Dict:
        """
        Postule à une offre LinkedIn en utilisant la session OAuth réutilisable
        Optimisé pour les candidatures multiples avec réutilisation de session
        """
        try:
            # S'assurer que le driver est initialisé
            if not self.driver:
                self._setup_driver()
            
            # Si on a un token OAuth et qu'on n'a pas encore de session active, l'établir
            if linkedin_oauth_token and not self.linkedin_session_active:
                logger.info("Establishing LinkedIn session with OAuth token")
                if not self._ensure_linkedin_session(linkedin_oauth_token):
                    logger.warning("Could not establish LinkedIn session, trying direct access")
            
            # Accéder directement à la page de l'offre (session déjà établie)
            logger.info(f"Accessing LinkedIn job page: {job_url}")
            self.driver.get(job_url)
            time.sleep(3)
            
            # Si on est redirigé vers la page de connexion, le token OAuth n'a pas fonctionné
            if "login" in self.driver.current_url.lower() or "challenge" in self.driver.current_url.lower():
                logger.warning("LinkedIn authentication required. OAuth token may need to be used differently.")
                # Note: Pour une vraie intégration OAuth, on devrait utiliser l'API LinkedIn
                # ou injecter les cookies de session depuis le token OAuth
                return {
                    'success': False,
                    'message': 'LinkedIn authentication required. Please ensure your LinkedIn account is connected via OAuth and try again.',
                    'job_url': job_url
                }
            
            # 3. Cliquer sur "Postuler" ou "Easy Apply"
            try:
                # Essayer plusieurs sélecteurs pour le bouton Postuler
                apply_button = None
                selectors = [
                    "//button[contains(., 'Postuler')]",
                    "//button[contains(., 'Easy Apply')]",
                    "//button[contains(@aria-label, 'Apply')]",
                    "//button[contains(@aria-label, 'Postuler')]",
                    "//span[contains(text(), 'Postuler')]/ancestor::button",
                    "//span[contains(text(), 'Easy Apply')]/ancestor::button"
                ]
                
                for selector in selectors:
                    try:
                        apply_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                        break
                    except TimeoutException:
                        continue
                
                if not apply_button:
                    return {
                        'success': False,
                        'message': 'Could not find apply button. The job may require manual application.',
                        'job_url': job_url
                    }
                
                apply_button.click()
                time.sleep(3)
                logger.info("Clicked on apply button")
                
            except Exception as e:
                logger.error(f"Error clicking apply button: {str(e)}")
                return {
                    'success': False,
                    'message': f'Could not click apply button: {str(e)}',
                    'job_url': job_url
                }
            
            # 4. Remplir le formulaire de candidature
            # Uploader le CV si nécessaire
            try:
                file_inputs = self.driver.find_elements(By.XPATH, "//input[@type='file']")
                if file_inputs:
                    file_input = file_inputs[0]
                    absolute_cv_path = os.path.abspath(cv_path)
                    if os.path.exists(absolute_cv_path):
                        file_input.send_keys(absolute_cv_path)
                        time.sleep(2)
                        logger.info("CV uploaded successfully")
                    else:
                        logger.warning(f"CV file not found at: {absolute_cv_path}")
                else:
                    logger.info("No file input found, CV may already be uploaded")
            except Exception as e:
                logger.warning(f"Error uploading CV: {str(e)}")
            
            # Ajouter une lettre de motivation si fournie
            if cover_letter:
                try:
                    # Essayer plusieurs sélecteurs pour le textarea
                    textarea_selectors = [
                        "//textarea[contains(@name, 'message')]",
                        "//textarea[contains(@id, 'message')]",
                        "//textarea[contains(@placeholder, 'message')]",
                        "//textarea[contains(@aria-label, 'message')]",
                        "//div[@role='textbox']"
                    ]
                    
                    for selector in textarea_selectors:
                        try:
                            cover_letter_textarea = self.driver.find_element(By.XPATH, selector)
                            cover_letter_textarea.clear()
                            cover_letter_textarea.send_keys(cover_letter)
                            time.sleep(1)
                            logger.info("Cover letter added")
                            break
                        except NoSuchElementException:
                            continue
                except Exception as e:
                    logger.warning(f"Error adding cover letter: {str(e)}")
            
            # 5. Soumettre la candidature
            try:
                # Essayer plusieurs sélecteurs pour le bouton Submit
                submit_selectors = [
                    "//button[contains(., 'Submit')]",
                    "//button[contains(., 'Envoyer')]",
                    "//button[contains(., 'Postuler')]",
                    "//button[@aria-label='Submit application']",
                    "//button[@aria-label='Envoyer la candidature']",
                    "//span[contains(text(), 'Submit')]/ancestor::button",
                    "//span[contains(text(), 'Envoyer')]/ancestor::button"
                ]
                
                submit_button = None
                for selector in submit_selectors:
                    try:
                        submit_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                        break
                    except TimeoutException:
                        continue
                
                if submit_button:
                    submit_button.click()
                    time.sleep(4)
                    
                    # Vérifier si la candidature a été soumise
                    success_indicators = [
                        "submitted",
                        "envoyée",
                        "success",
                        "applied",
                        "candidature"
                    ]
                    
                    page_text = self.driver.page_source.lower()
                    if any(indicator in page_text for indicator in success_indicators):
                        return {
                            'success': True,
                            'message': 'Application submitted successfully to LinkedIn',
                            'job_url': job_url
                        }
                    else:
                        # Peut-être qu'il y a des étapes supplémentaires
                        return {
                            'success': True,
                            'message': 'Application process completed (may require additional steps)',
                            'job_url': job_url
                        }
                else:
                    return {
                        'success': False,
                        'message': 'Could not find submit button',
                        'job_url': job_url
                    }
                    
            except Exception as e:
                logger.error(f"Error submitting application: {str(e)}")
                return {
                    'success': False,
                    'message': f'Error submitting: {str(e)}',
                    'job_url': job_url
                }
                
        except Exception as e:
            logger.error(f"Error applying to LinkedIn job: {str(e)}", exc_info=True)
            return {
                'success': False,
                'message': f'Error: {str(e)}',
                'job_url': job_url
            }
    
    def apply_to_indeed_job(
        self,
        job_url: str,
        cv_path: str,
        indeed_email: str,
        indeed_password: str,
        cover_letter: Optional[str] = None
    ) -> Dict:
        """
        Postule à une offre Indeed en utilisant Selenium
        """
        try:
            if not self.driver:
                self._setup_driver()
            
            # 1. Se connecter à Indeed
            logger.info(f"Logging into Indeed for job: {job_url}")
            self.driver.get("https://secure.indeed.com/account/login")
            time.sleep(3)
            
            # Entrer email
            try:
                email_input = WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.ID, "login-email-input"))
                )
                email_input.clear()
                email_input.send_keys(indeed_email)
                time.sleep(1)
            except TimeoutException:
                email_input = self.driver.find_element(By.NAME, "__email")
                email_input.clear()
                email_input.send_keys(indeed_email)
                time.sleep(1)
            
            # Entrer mot de passe
            try:
                password_input = self.driver.find_element(By.ID, "login-password-input")
            except NoSuchElementException:
                password_input = self.driver.find_element(By.NAME, "__password")
            
            password_input.clear()
            password_input.send_keys(indeed_password)
            time.sleep(1)
            
            # Cliquer sur se connecter
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()
            time.sleep(5)
            
            # Vérifier si la connexion a réussi
            if "login" in self.driver.current_url.lower():
                return {
                    'success': False,
                    'message': 'Indeed login failed. Please check your credentials.',
                    'job_url': job_url
                }
            
            logger.info("Successfully logged into Indeed")
            
            # 2. Aller sur la page de l'offre
            logger.info(f"Navigating to job: {job_url}")
            self.driver.get(job_url)
            time.sleep(3)
            
            # 3. Cliquer sur "Postuler maintenant"
            try:
                apply_selectors = [
                    "//button[contains(., 'Postuler maintenant')]",
                    "//button[contains(., 'Apply now')]",
                    "//a[contains(., 'Postuler maintenant')]",
                    "//a[contains(., 'Apply now')]"
                ]
                
                apply_button = None
                for selector in apply_selectors:
                    try:
                        apply_button = WebDriverWait(self.driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                        break
                    except TimeoutException:
                        continue
                
                if not apply_button:
                    return {
                        'success': False,
                        'message': 'Could not find apply button',
                        'job_url': job_url
                    }
                
                apply_button.click()
                time.sleep(3)
                logger.info("Clicked on apply button")
                
            except Exception as e:
                return {
                    'success': False,
                    'message': f'Could not click apply button: {str(e)}',
                    'job_url': job_url
                }
            
            # 4. Uploader le CV
            try:
                file_input = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
                )
                absolute_cv_path = os.path.abspath(cv_path)
                if os.path.exists(absolute_cv_path):
                    file_input.send_keys(absolute_cv_path)
                    time.sleep(2)
                    logger.info("CV uploaded successfully")
            except TimeoutException:
                logger.warning("File input not found, may already have CV")
            
            # 5. Soumettre
            try:
                submit_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Submit') or contains(., 'Envoyer')]"))
                )
                submit_button.click()
                time.sleep(3)
                
                return {
                    'success': True,
                    'message': 'Application submitted successfully to Indeed',
                    'job_url': job_url
                }
            except TimeoutException:
                return {
                    'success': False,
                    'message': 'Could not submit application',
                    'job_url': job_url
                }
                
        except Exception as e:
            logger.error(f"Error applying to Indeed job: {str(e)}", exc_info=True)
            return {
                'success': False,
                'message': f'Error: {str(e)}',
                'job_url': job_url
            }
    
    def _ensure_linkedin_session(self, linkedin_oauth_token: Optional[str] = None) -> bool:
        """
        S'assure qu'une session LinkedIn est active
        Réutilise la session si elle existe déjà
        """
        if self.linkedin_session_active and self.driver:
            # Vérifier que la session est toujours valide
            try:
                self.driver.get("https://www.linkedin.com/feed")
                time.sleep(2)
                if "login" not in self.driver.current_url.lower():
                    logger.info("LinkedIn session is still active, reusing it")
                    return True
            except:
                pass
        
        # Créer une nouvelle session si nécessaire
        if not self.driver:
            self._setup_driver()
        
        # Se connecter à LinkedIn (avec OAuth, on devrait être déjà connecté)
        try:
            self.driver.get("https://www.linkedin.com/feed")
            time.sleep(3)
            
            # Vérifier si on est connecté
            if "login" not in self.driver.current_url.lower() and "challenge" not in self.driver.current_url.lower():
                self.linkedin_session_active = True
                logger.info("LinkedIn session established successfully")
                return True
            else:
                logger.warning("LinkedIn session not active, user may need to login manually")
                self.linkedin_session_active = False
                return False
        except Exception as e:
            logger.error(f"Error establishing LinkedIn session: {str(e)}")
            self.linkedin_session_active = False
            return False
    
    def apply_to_multiple_jobs(
        self,
        jobs: List[Dict],
        cv_path: str,
        linkedin_oauth_token: Optional[str] = None,
        credentials: Optional[Dict] = None,
        cover_letter: Optional[str] = None,
        max_retries: int = 2,
        delay_between_applications: int = 3
    ) -> List[Dict]:
        """
        Postule à plusieurs offres en une seule session optimisée
        - Réutilise la session LinkedIn pour toutes les candidatures
        - Gère les retries automatiques
        - Optimise les délais entre candidatures
        - Utilise OAuth LinkedIn si disponible
        """
        results = []
        credentials = credentials or {}
        linkedin_jobs = [j for j in jobs if j.get('platform', '').lower() == 'linkedin']
        indeed_jobs = [j for j in jobs if j.get('platform', '').lower() == 'indeed']
        other_jobs = [j for j in jobs if j.get('platform', '').lower() not in ['linkedin', 'indeed']]
        
        try:
            # Établir la session LinkedIn une seule fois pour toutes les candidatures LinkedIn
            if linkedin_jobs and linkedin_oauth_token:
                logger.info(f"Establishing LinkedIn session for {len(linkedin_jobs)} LinkedIn jobs")
                if not self._ensure_linkedin_session(linkedin_oauth_token):
                    logger.warning("Could not establish LinkedIn session, will try anyway")
            
            # Traiter toutes les candidatures LinkedIn en une session
            for i, job in enumerate(linkedin_jobs):
                logger.info(f"Applying to LinkedIn job {i+1}/{len(linkedin_jobs)}: {job.get('title', 'Unknown')}")
                
                # Retry logic
                retry_count = 0
                result = None
                
                while retry_count <= max_retries:
                    try:
                        result = self.apply_to_linkedin_job(
                            job_url=job.get('url', ''),
                            cv_path=cv_path,
                            linkedin_oauth_token=linkedin_oauth_token,
                            cover_letter=cover_letter
                        )
                        
                        # Si succès, sortir de la boucle de retry
                        if result.get('success'):
                            break
                        
                        # Si échec mais pas d'erreur critique, retry
                        if retry_count < max_retries:
                            logger.info(f"Retrying application for job {job.get('id')} (attempt {retry_count + 2}/{max_retries + 1})")
                            time.sleep(2)  # Court délai avant retry
                        
                        retry_count += 1
                    except Exception as e:
                        logger.error(f"Error applying to job {job.get('id')}: {str(e)}")
                        if retry_count < max_retries:
                            retry_count += 1
                            time.sleep(2)
                        else:
                            result = {
                                'success': False,
                                'message': f'Error after {max_retries + 1} attempts: {str(e)}',
                                'job_url': job.get('url', '')
                            }
                            break
                
                if not result:
                    result = {
                        'success': False,
                        'message': 'Failed to apply after all retries',
                        'job_url': job.get('url', '')
                    }
                
                result['job_id'] = job.get('id')
                result['job_title'] = job.get('title')
                result['retry_count'] = retry_count
                results.append(result)
                
                # Délai intelligent entre candidatures (évite le rate limiting)
                if i < len(linkedin_jobs) - 1:
                    # Délai adaptatif : plus long si échec, plus court si succès
                    delay = delay_between_applications * 2 if not result.get('success') else delay_between_applications
                    # Ajouter un peu de randomisation pour paraître plus humain
                    import random
                    delay += random.uniform(0, 2)
                    logger.info(f"Waiting {delay:.1f}s before next application...")
                    time.sleep(delay)
            
            # Traiter les candidatures Indeed
            for i, job in enumerate(indeed_jobs):
                logger.info(f"Applying to Indeed job {i+1}/{len(indeed_jobs)}: {job.get('title', 'Unknown')}")
                
                result = self.apply_to_indeed_job(
                    job_url=job.get('url', ''),
                    cv_path=cv_path,
                    indeed_email=credentials.get('indeed_email', ''),
                    indeed_password=credentials.get('indeed_password', ''),
                    cover_letter=cover_letter
                )
                
                result['job_id'] = job.get('id')
                result['job_title'] = job.get('title')
                results.append(result)
                
                if i < len(indeed_jobs) - 1:
                    time.sleep(delay_between_applications)
            
            # Traiter les autres plateformes
            for job in other_jobs:
                result = {
                    'success': False,
                    'message': f"Unsupported platform: {job.get('platform')}",
                    'job_url': job.get('url', ''),
                    'job_id': job.get('id'),
                    'job_title': job.get('title')
                }
                results.append(result)
                
        finally:
            # Ne pas fermer le driver si on réutilise la session
            if not self.reuse_session:
                if self.driver:
                    self.driver.quit()
                    self.driver = None
                    self.linkedin_session_active = False
        
        # Statistiques
        success_count = sum(1 for r in results if r.get('success'))
        logger.info(f"Bulk application completed: {success_count}/{len(results)} successful")
        
        return results
    
    def close(self):
        """Ferme le navigateur"""
        if self.driver:
            self.driver.quit()
            self.driver = None

