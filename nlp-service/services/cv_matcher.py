import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class CVMatcher:
    """
    Algorithme de matching CV - Offres d'emploi utilisant des embeddings sémantiques
    """
    
    def __init__(self):
        # Charger le modèle BERT pré-entraîné pour les embeddings
        # Utilise un modèle multilingue pour supporter le français et l'anglais
        try:
            self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            logger.info('CV Matcher model loaded successfully')
        except Exception as e:
            logger.error(f'Error loading model: {str(e)}')
            # Fallback vers un modèle plus simple
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def match_multiple(self, cv_data: Dict, jobs: List[Dict]) -> List[Dict]:
        """
        Match un CV avec plusieurs offres d'emploi
        Retourne une liste de résultats avec scores et détails
        """
        results = []
        
        # Préparer le texte du CV
        cv_text = self._prepare_cv_text(cv_data)
        cv_embedding = self.model.encode(cv_text, convert_to_numpy=True)
        
        for job in jobs:
            try:
                match_result = self._match_single(cv_data, cv_embedding, job)
                results.append(match_result)
            except Exception as e:
                logger.error(f'Error matching job {job.get("id")}: {str(e)}')
                results.append({
                    'job_id': job.get('id'),
                    'score': 0.0,
                    'details': {'error': str(e)}
                })
        
        # Trier par score décroissant
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results
    
    def _match_single(self, cv_data: Dict, cv_embedding: np.ndarray, job: Dict) -> Dict:
        """
        Match un CV avec une seule offre d'emploi
        """
        # Préparer le texte de l'offre
        job_text = self._prepare_job_text(job)
        job_embedding = self.model.encode(job_text, convert_to_numpy=True)
        
        # Calculer la similarité cosinus
        similarity = cosine_similarity(
            cv_embedding.reshape(1, -1),
            job_embedding.reshape(1, -1)
        )[0][0]
        
        # Score de base (0-1)
        base_score = float(similarity) * 100
        
        # Analyse détaillée
        details = self._analyze_match_details(cv_data, job)
        
        # Ajuster le score selon les détails
        adjusted_score = self._adjust_score(base_score, details)
        
        return {
            'job_id': job.get('id'),
            'score': round(adjusted_score, 2),
            'details': details,
            'base_similarity': round(base_score, 2)
        }
    
    def _prepare_cv_text(self, cv_data: Dict) -> str:
        """
        Prépare le texte du CV pour l'embedding
        """
        parts = []
        
        # Compétences
        if cv_data.get('skills'):
            parts.append('Compétences: ' + ', '.join(cv_data['skills']))
        
        # Expériences
        if cv_data.get('experience'):
            exp_text = 'Expériences: '
            for exp in cv_data['experience']:
                exp_text += f"{exp.get('position', '')} chez {exp.get('company', '')}. "
            parts.append(exp_text)
        
        # Formation
        if cv_data.get('education'):
            edu_text = 'Formation: '
            for edu in cv_data['education']:
                edu_text += f"{edu.get('degree', '')} à {edu.get('institution', '')}. "
            parts.append(edu_text)
        
        # Texte brut si disponible
        if cv_data.get('raw_text'):
            parts.append(cv_data['raw_text'][:1000])  # Limiter la longueur
        
        return ' '.join(parts)
    
    def _prepare_job_text(self, job: Dict) -> str:
        """
        Prépare le texte de l'offre d'emploi pour l'embedding
        """
        parts = []
        
        if job.get('title'):
            parts.append(f"Titre: {job['title']}")
        
        if job.get('description'):
            parts.append(f"Description: {job['description']}")
        
        if job.get('requirements'):
            parts.append(f"Exigences: {job['requirements']}")
        
        return ' '.join(parts)
    
    def _analyze_match_details(self, cv_data: Dict, job: Dict) -> Dict:
        """
        Analyse détaillée de la correspondance
        """
        details = {
            'skills_match': [],
            'skills_missing': [],
            'experience_match': False,
            'education_match': False,
            'keywords_match': 0,
            'total_keywords': 0,
        }
        
        # Extraire les mots-clés de l'offre
        job_text = self._prepare_job_text(job).lower()
        job_keywords = self._extract_keywords(job_text)
        details['total_keywords'] = len(job_keywords)
        
        # Comparer les compétences
        cv_skills = [s.lower() for s in cv_data.get('skills', [])]
        job_skills = self._extract_skills_from_job(job_text)
        
        for skill in job_skills:
            if any(cv_skill in skill or skill in cv_skill for cv_skill in cv_skills):
                details['skills_match'].append(skill)
            else:
                details['skills_missing'].append(skill)
        
        # Compter les mots-clés correspondants
        cv_text = self._prepare_cv_text(cv_data).lower()
        for keyword in job_keywords:
            if keyword in cv_text:
                details['keywords_match'] += 1
        
        # Vérifier la formation
        if cv_data.get('education'):
            details['education_match'] = True
            
        # Générer des suggestions
        details['suggestions'] = []
        if details['skills_missing']:
            top_missing = details['skills_missing'][:3]
            details['suggestions'].append(f"Ajoutez ces compétences clés : {', '.join(top_missing)}")
        
        if details['keywords_match'] < details['total_keywords'] / 2:
            details['suggestions'].append("Enrichissez votre CV avec plus de mots-clés de l'offre")
            
        if not details['experience_match']:
            details['suggestions'].append("Mettez en avant vos expériences pertinentes pour ce poste")
        
        return details
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extrait les mots-clés importants d'un texte
        """
        # Mots vides à ignorer
        stop_words = {'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'pour', 'avec', 'dans', 'sur'}
        
        # Extraire les mots (minimum 3 caractères)
        words = re.findall(r'\b\w{3,}\b', text.lower())
        
        # Filtrer les mots vides et les doublons
        keywords = [w for w in words if w not in stop_words]
        
        return list(set(keywords))[:50]  # Limiter à 50 mots-clés
    
    def _extract_skills_from_job(self, job_text: str) -> List[str]:
        """
        Extrait les compétences mentionnées dans l'offre
        """
        # Liste de compétences techniques communes
        common_skills = [
            'python', 'java', 'javascript', 'typescript', 'react', 'vue', 'angular',
            'node.js', 'django', 'flask', 'spring', 'postgresql', 'mysql', 'mongodb',
            'aws', 'azure', 'docker', 'kubernetes', 'git', 'agile', 'scrum'
        ]
        
        found_skills = []
        for skill in common_skills:
            if skill in job_text:
                found_skills.append(skill)
        
        return found_skills
    
    def _adjust_score(self, base_score: float, details: Dict) -> float:
        """
        Ajuste le score selon les détails de correspondance
        """
        adjusted = base_score
        
        # Bonus pour compétences correspondantes
        skills_match_ratio = len(details['skills_match']) / max(len(details['skills_match']) + len(details['skills_missing']), 1)
        adjusted += skills_match_ratio * 10
        
        # Bonus pour mots-clés correspondants
        if details['total_keywords'] > 0:
            keywords_ratio = details['keywords_match'] / details['total_keywords']
            adjusted += keywords_ratio * 15
        
        # Bonus pour expérience
        if details['experience_match']:
            adjusted += 5
        
        # Bonus pour formation
        if details['education_match']:
            adjusted += 5
        
        # Limiter à 100
        return min(adjusted, 100.0)

