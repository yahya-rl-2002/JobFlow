from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging

from services.cv_parser import CVParser
from services.cv_matcher import CVMatcher
from services.cv_optimizer import CVOptimizer

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import conditionnel du scraper LinkedIn (après la définition du logger)
try:
    from services.linkedin_scraper import LinkedInScraper
    LINKEDIN_SCRAPER_AVAILABLE = True
except ImportError as e:
    LINKEDIN_SCRAPER_AVAILABLE = False
    logger.warning(f'LinkedIn scraper not available: {str(e)}')

# Import conditionnel des services OpenAI
try:
    from services.hybrid_matcher import HybridMatcher
    from services.openai_cv_optimizer import OpenAICVOptimizer
    OPENAI_SERVICES_AVAILABLE = True
except (ImportError, ValueError) as e:
    OPENAI_SERVICES_AVAILABLE = False
    logger.warning(f'OpenAI services not available: {str(e)}')

# Initialize services
cv_parser = CVParser()
cv_matcher = CVMatcher()
cv_optimizer = CVOptimizer()

# Initialize hybrid matcher if available
hybrid_matcher = None
openai_cv_optimizer = None
if OPENAI_SERVICES_AVAILABLE:
    try:
        hybrid_matcher = HybridMatcher()
        openai_cv_optimizer = OpenAICVOptimizer()
        logger.info('OpenAI services initialized successfully')
    except Exception as e:
        logger.warning(f'OpenAI services initialization failed: {str(e)}')
        hybrid_matcher = None
        openai_cv_optimizer = None

# Initialize LinkedIn scraper if available
linkedin_scraper = None
if LINKEDIN_SCRAPER_AVAILABLE:
    try:
        linkedin_scraper = LinkedInScraper()
        logger.info('LinkedIn scraper initialized successfully')
    except Exception as e:
        logger.warning(f'LinkedIn scraper initialization failed: {str(e)}')
        linkedin_scraper = None


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/parse-cv', methods=['POST'])
def parse_cv():
    """
    Parse un CV et extrait les informations structurées
    """
    try:
        data = request.json
        file_path = data.get('file_path')

        if not file_path:
            return jsonify({'error': 'file_path is required'}), 400

        logger.info(f'Attempting to parse CV: {file_path}')
        
        # Le parser gère maintenant les chemins relatifs/absolus
        parsed_data = cv_parser.parse(file_path)

        return jsonify({
            'success': True,
            'parsed_data': parsed_data
        })
    except FileNotFoundError as e:
        logger.error(f'CV file not found: {str(e)}')
        return jsonify({'error': f'CV file not found: {str(e)}'}), 404
    except ValueError as e:
        logger.error(f'Invalid CV file: {str(e)}')
        return jsonify({'error': f'Invalid CV file: {str(e)}'}), 400
    except Exception as e:
        logger.error(f'Error parsing CV: {str(e)}', exc_info=True)
        return jsonify({'error': f'Failed to parse CV: {str(e)}'}), 500


@app.route('/match', methods=['POST'])
def match_cv_jobs():
    """
    Match un CV avec plusieurs offres d'emploi
    Utilise le système hybride (OpenAI si disponible, sinon local)
    """
    try:
        data = request.json
        cv_data = data.get('cv_data', {})
        jobs = data.get('jobs', [])
        use_openai = data.get('use_openai')  # Optionnel: forcer l'utilisation d'OpenAI
        top_k = data.get('top_k', 10)

        if not cv_data or not jobs:
            return jsonify({'error': 'CV data and jobs are required'}), 400

        # Utiliser le matcher hybride si disponible, sinon le matcher local
        if hybrid_matcher:
            results = hybrid_matcher.match(cv_data, jobs, use_openai=use_openai, top_k=top_k)
            method_used = results[0]['method'] if results else 'unknown'
        else:
            results = cv_matcher.match_multiple(cv_data, jobs)
            method_used = 'local'
            # Limiter à top_k
            results.sort(key=lambda x: x['score'], reverse=True)
            results = results[:top_k]

        return jsonify({
            'success': True,
            'results': results,
            'method': method_used,
            'count': len(results)
        })
    except Exception as e:
        logger.error(f'Error matching CV: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/match/compare', methods=['POST'])
def compare_match_methods():
    """
    Compare les résultats du matching local vs OpenAI
    Utile pour les tests de performance
    """
    if not hybrid_matcher:
        return jsonify({'error': 'Hybrid matcher not available'}), 503
    
    try:
        data = request.json
        cv_data = data.get('cv_data', {})
        jobs = data.get('jobs', [])

        if not cv_data or not jobs:
            return jsonify({'error': 'CV data and jobs are required'}), 400

        comparison = hybrid_matcher.compare_methods(cv_data, jobs)

        return jsonify({
            'success': True,
            'comparison': comparison
        })
    except Exception as e:
        logger.error(f'Error comparing match methods: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/match/estimate-cost', methods=['POST'])
def estimate_match_cost():
    """
    Estime le coût d'utilisation d'OpenAI pour le matching
    """
    try:
        from services.openai_matcher import OpenAIMatcher
        matcher = OpenAIMatcher()
        
        data = request.json
        num_jobs = data.get('num_jobs', 10)
        avg_text_length = data.get('avg_text_length', 1000)

        cost_estimate = matcher.estimate_cost(num_jobs, avg_text_length)

        return jsonify({
            'success': True,
            'cost_estimate': cost_estimate
        })
    except Exception as e:
        logger.error(f'Error estimating cost: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/customize-cv', methods=['POST'])
def customize_cv():
    """
    Personnalise un CV pour une offre d'emploi spécifique
    Utilise OpenAI si disponible, sinon le pipeline local
    """
    try:
        data = request.json
        cv_path = data.get('cv_path')
        cv_text = data.get('cv_text')  # Texte du CV (alternative au fichier)
        job_description = data.get('job_description', '')
        job_requirements = data.get('job_requirements', '')
        job_title = data.get('job_title', '')
        use_openai = data.get('use_openai', True)  # Utiliser OpenAI par défaut si disponible

        # Si on a le texte du CV et OpenAI est disponible, utiliser OpenAI
        if cv_text and openai_cv_optimizer and use_openai:
            result = openai_cv_optimizer.optimize_cv(
                cv_text,
                job_title,
                job_description,
                job_requirements
            )
            return jsonify({
                'success': True,
                'optimized_text': result.get('optimized_text'),
                'changes': result.get('changes', []),
                'improvements': result.get('improvements', {}),
                'method': 'openai'
            })
        
        # Sinon, utiliser le pipeline local (nécessite un fichier)
        if not cv_path or not os.path.exists(cv_path):
            return jsonify({'error': 'CV file not found or cv_text not provided'}), 404

        result = cv_optimizer.optimize(
            cv_path,
            job_description,
            job_requirements,
            job_title
        )

        return jsonify({
            'success': True,
            'customized_path': result['customized_path'],
            'changes': result['changes'],
            'match_improvements': result.get('match_improvements', {}),
            'method': 'local'
        })
    except Exception as e:
        logger.error(f'Error customizing CV: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/customize-cv/estimate-cost', methods=['POST'])
def estimate_customize_cost():
    """
    Estime le coût d'optimisation d'un CV avec OpenAI
    """
    if not openai_cv_optimizer:
        return jsonify({'error': 'OpenAI CV optimizer not available'}), 503
    
    try:
        data = request.json
        cv_length = data.get('cv_length', 2000)
        job_description_length = data.get('job_description_length', 1000)

        cost_estimate = openai_cv_optimizer.estimate_cost(cv_length, job_description_length)

        return jsonify({
            'success': True,
            'cost_estimate': cost_estimate
        })
    except Exception as e:
        logger.error(f'Error estimating cost: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/scrape-jobs', methods=['POST'])
def scrape_jobs():
    """
    Scrape les offres d'emploi depuis LinkedIn ou Indeed
    """
    try:
        if not linkedin_scraper:
            return jsonify({
                'error': 'LinkedIn scraper not available. Please check the service logs.'
            }), 503
        
        data = request.json
        keywords = data.get('keywords', '')
        location = data.get('location', '')
        limit = data.get('limit', 25)
        platform = data.get('platform', 'linkedin')  # 'linkedin' ou 'indeed'
        
        if not keywords:
            return jsonify({'error': 'keywords is required'}), 400
        
        logger.info(f'Scraping {platform} jobs: keywords={keywords}, location={location}, limit={limit}')
        
        jobs = linkedin_scraper.scrape_jobs(
            keywords=keywords,
            location=location,
            limit=limit,
            site_name=platform
        )
        
        # S'assurer que toutes les offres ont des URLs valides pour la candidature
        valid_jobs = []
        for job in jobs:
            if job.get('url') and ('linkedin.com' in job['url'] or 'indeed.com' in job['url']):
                valid_jobs.append(job)
            elif job.get('url'):
                # URL valide mais pas LinkedIn/Indeed, on l'accepte quand même
                valid_jobs.append(job)
            else:
                logger.warning(f"Job sans URL valide ignoré: {job.get('title', 'Unknown')}")
        
        if len(valid_jobs) == 0 and len(jobs) > 0:
            logger.warning("Aucune offre avec URL valide. Vérifiez le scraper.")
        
        return jsonify({
            'success': True,
            'jobs': valid_jobs,
            'count': len(valid_jobs),
            'platform': platform,
            'message': f'Récupéré {len(valid_jobs)} offres réelles depuis {platform}' if valid_jobs else 'Aucune offre trouvée'
        })
    except Exception as e:
        logger.error(f'Error scraping jobs: {str(e)}', exc_info=True)
        return jsonify({'error': f'Failed to scrape jobs: {str(e)}'}), 500


@app.route('/apply-jobs', methods=['POST'])
def apply_jobs():
    """
    Postule automatiquement à plusieurs offres d'emploi en utilisant Selenium
    Optimisé pour réutiliser la session LinkedIn OAuth pour toutes les candidatures
    Supporte retry automatique et gestion intelligente des délais
    """
    try:
        data = request.json
        jobs = data.get('jobs', [])  # Liste des offres avec id, url, platform, title
        cv_path = data.get('cv_path')
        linkedin_oauth_token = data.get('credentials', {}).get('linkedin_oauth_token') or data.get('linkedin_oauth_token')
        credentials = data.get('credentials', {})  # indeed_email, indeed_password
        cover_letter = data.get('cover_letter')
        max_retries = data.get('max_retries', 2)  # Nombre de tentatives en cas d'échec
        delay_between_applications = data.get('delay_between_applications', 3)  # Délai entre candidatures
        
        if not jobs or not cv_path:
            return jsonify({'error': 'jobs and cv_path are required'}), 400
        
        # Vérifier qu'on a soit un token LinkedIn OAuth, soit des credentials Indeed
        platforms = [job.get('platform', '').lower() for job in jobs]
        needs_linkedin = any('linkedin' in p for p in platforms)
        needs_indeed = any('indeed' in p for p in platforms)
        
        if needs_linkedin and not linkedin_oauth_token:
            return jsonify({'error': 'LinkedIn OAuth token is required for LinkedIn jobs'}), 400
        
        if needs_indeed and not credentials.get('indeed_email'):
            return jsonify({'error': 'Indeed credentials are required for Indeed jobs'}), 400
        
        from services.job_application_automator import JobApplicationAutomator
        
        logger.info(f'Starting optimized bulk application process for {len(jobs)} jobs')
        logger.info(f'LinkedIn OAuth token: {"provided" if linkedin_oauth_token else "not provided"}')
        logger.info(f'Indeed credentials: {"provided" if credentials.get("indeed_email") else "not provided"}')
        logger.info(f'Max retries: {max_retries}, Delay: {delay_between_applications}s')
        
        # Créer l'automatiseur avec réutilisation de session
        automator = JobApplicationAutomator(headless=True, reuse_session=True)
        
        try:
            results = automator.apply_to_multiple_jobs(
                jobs=jobs,
                cv_path=cv_path,
                linkedin_oauth_token=linkedin_oauth_token,
                credentials=credentials,
                cover_letter=cover_letter,
                max_retries=max_retries,
                delay_between_applications=delay_between_applications
            )
            
            success_count = sum(1 for r in results if r.get('success'))
            failed_count = len(results) - success_count
            
            logger.info(f'Bulk application completed: {success_count}/{len(results)} successful')
            
            return jsonify({
                'success': True,
                'results': results,
                'total': len(results),
                'success_count': success_count,
                'failed_count': failed_count,
                'message': f'Successfully applied to {success_count} out of {len(results)} jobs'
            })
        finally:
            # Fermer le driver pour libérer les ressources
            automator.close()
            
    except Exception as e:
        logger.error(f'Error in apply_jobs: {str(e)}', exc_info=True)
        return jsonify({'error': f'Failed to apply to jobs: {str(e)}'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)

