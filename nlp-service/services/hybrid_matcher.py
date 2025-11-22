import os
import logging
from typing import Dict, List, Optional
from services.cv_matcher import CVMatcher

logger = logging.getLogger(__name__)

# Import conditionnel d'OpenAI Matcher
try:
    from services.openai_matcher import OpenAIMatcher
    OPENAI_AVAILABLE = True
except (ImportError, ValueError) as e:
    OPENAI_AVAILABLE = False
    logger.warning(f'OpenAI Matcher not available: {str(e)}. Using local matcher only.')


class HybridMatcher:
    """
    Système de matching hybride qui choisit entre OpenAI et le pipeline local
    selon les critères de performance, coût et précision
    """
    
    def __init__(self):
        # Pipeline local (toujours disponible)
        self.local_matcher = CVMatcher()
        
        # Pipeline OpenAI (si disponible)
        self.openai_matcher = None
        if OPENAI_AVAILABLE:
            try:
                self.openai_matcher = OpenAIMatcher()
                logger.info('Hybrid Matcher initialized with OpenAI support')
            except Exception as e:
                logger.warning(f'OpenAI Matcher initialization failed: {str(e)}')
                self.openai_matcher = None
        
        # Configuration
        self.use_openai_for_complex = os.getenv('USE_OPENAI_FOR_COMPLEX', 'true').lower() == 'true'
        self.openai_threshold = float(os.getenv('OPENAI_MATCH_THRESHOLD', '0.7'))  # Utiliser OpenAI si score local < 0.7
        self.max_jobs_for_openai = int(os.getenv('MAX_JOBS_FOR_OPENAI', '50'))  # Limite pour éviter les coûts élevés
    
    def match(
        self,
        cv_data: Dict,
        jobs: List[Dict],
        use_openai: Optional[bool] = None,
        top_k: int = 10
    ) -> List[Dict]:
        """
        Match un CV avec des offres d'emploi
        
        Args:
            cv_data: Données du CV (doit contenir 'raw_text' ou les champs structurés)
            jobs: Liste des offres d'emploi
            use_openai: Force l'utilisation d'OpenAI (None = décision automatique)
            top_k: Nombre de meilleures correspondances
        
        Returns:
            Liste des résultats de matching
        """
        # Décision automatique si use_openai n'est pas spécifié
        if use_openai is None:
            use_openai = self._should_use_openai(cv_data, jobs)
        
        if use_openai and self.openai_matcher:
            return self._match_with_openai(cv_data, jobs, top_k)
        else:
            return self._match_with_local(cv_data, jobs, top_k)
    
    def _should_use_openai(self, cv_data: Dict, jobs: List[Dict]) -> bool:
        """
        Détermine si on doit utiliser OpenAI pour le matching
        """
        # Si OpenAI n'est pas disponible, utiliser le pipeline local
        if not self.openai_matcher:
            return False
        
        # Si on a trop d'offres, utiliser le pipeline local (coût)
        if len(jobs) > self.max_jobs_for_openai:
            logger.info(f'Too many jobs ({len(jobs)}), using local matcher to save costs')
            return False
        
        # Si la configuration dit de ne pas utiliser OpenAI pour les cas complexes
        if not self.use_openai_for_complex:
            return False
        
        # Utiliser OpenAI si le CV est complexe (long texte, beaucoup d'expériences)
        cv_text = cv_data.get('raw_text', '')
        if len(cv_text) > 2000:  # CV long = plus complexe
            return True
        
        # Utiliser OpenAI si beaucoup d'offres complexes
        complex_jobs = sum(1 for job in jobs if len(job.get('description', '') + job.get('requirements', '')) > 1000)
        if complex_jobs > len(jobs) * 0.5:  # Plus de 50% d'offres complexes
            return True
        
        return False
    
    def _match_with_openai(self, cv_data: Dict, jobs: List[Dict], top_k: int) -> List[Dict]:
        """
        Matching avec OpenAI
        """
        try:
            logger.info(f'Matching with OpenAI for {len(jobs)} jobs')
            
            # Préparer le texte du CV
            cv_text = self._prepare_cv_text(cv_data)
            
            # Matching avec OpenAI
            results = self.openai_matcher.match_cv_to_jobs(cv_text, jobs, top_k)
            
            # Ajouter l'indicateur de méthode
            for result in results:
                result['method'] = 'openai'
                result['details']['method'] = 'openai_embedding'
            
            return results
            
        except Exception as e:
            logger.error(f'OpenAI matching failed: {str(e)}. Falling back to local matcher.')
            return self._match_with_local(cv_data, jobs, top_k)
    
    def _match_with_local(self, cv_data: Dict, jobs: List[Dict], top_k: int) -> List[Dict]:
        """
        Matching avec le pipeline local
        """
        logger.info(f'Matching with local pipeline for {len(jobs)} jobs')
        
        results = self.local_matcher.match_multiple(cv_data, jobs)
        
        # Ajouter l'indicateur de méthode
        for result in results:
            result['method'] = 'local'
            if 'details' not in result:
                result['details'] = {}
            result['details']['method'] = 'sentence_transformer'
        
        # Trier et retourner top_k
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]
    
    def _prepare_cv_text(self, cv_data: Dict) -> str:
        """
        Prépare le texte du CV à partir des données structurées
        """
        # Si on a déjà le texte brut, l'utiliser
        if 'raw_text' in cv_data:
            return cv_data['raw_text']
        
        # Sinon, reconstruire à partir des données structurées
        parts = []
        
        if 'personal_info' in cv_data:
            info = cv_data['personal_info']
            if isinstance(info, dict):
                parts.append(f"Nom: {info.get('full_name', '')}")
                parts.append(f"Email: {info.get('email', '')}")
        
        if 'summary' in cv_data and cv_data['summary']:
            parts.append(f"Résumé: {cv_data['summary']}")
        
        if 'skills' in cv_data:
            skills = cv_data['skills']
            if isinstance(skills, list):
                parts.append(f"Compétences: {', '.join(skills)}")
        
        if 'experience' in cv_data:
            parts.append("Expérience:")
            for exp in cv_data['experience']:
                if isinstance(exp, dict):
                    parts.append(f"- {exp.get('position', '')} chez {exp.get('company', '')}")
                    if exp.get('description'):
                        parts.append(f"  {exp.get('description')}")
        
        if 'education' in cv_data:
            parts.append("Formation:")
            for edu in cv_data['education']:
                if isinstance(edu, dict):
                    parts.append(f"- {edu.get('degree', '')} à {edu.get('institution', '')}")
        
        return '\n'.join(parts)
    
    def compare_methods(
        self,
        cv_data: Dict,
        jobs: List[Dict]
    ) -> Dict:
        """
        Compare les résultats du matching local vs OpenAI
        Utile pour les tests de performance
        """
        results = {
            'local': self._match_with_local(cv_data, jobs, len(jobs)),
            'openai': None,
            'comparison': {}
        }
        
        if self.openai_matcher:
            try:
                results['openai'] = self._match_with_openai(cv_data, jobs, len(jobs))
                
                # Comparer les scores
                local_scores = {r['job_id']: r['score'] for r in results['local']}
                openai_scores = {r['job_id']: r['score'] for r in results['openai']}
                
                # Calculer les métriques de comparaison
                common_jobs = set(local_scores.keys()) & set(openai_scores.keys())
                if common_jobs:
                    score_diffs = [
                        openai_scores[job_id] - local_scores[job_id]
                        for job_id in common_jobs
                    ]
                    
                    results['comparison'] = {
                        'avg_score_diff': sum(score_diffs) / len(score_diffs),
                        'max_score_diff': max(score_diffs),
                        'min_score_diff': min(score_diffs),
                        'common_jobs': len(common_jobs)
                    }
            except Exception as e:
                logger.error(f'Error comparing methods: {str(e)}')
        
        return results

