import os
import json
import logging
from typing import Dict, List
from openai import OpenAI

logger = logging.getLogger(__name__)


class OpenAICVOptimizer:
    """
    Personnalise et optimise un CV pour une offre d'emploi spécifique
    en utilisant l'API OpenAI
    """
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError('OPENAI_API_KEY environment variable is required')
        
        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        
        logger.info(f'OpenAI CV Optimizer initialized with model: {self.model}')
    
    def optimize_cv(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        job_requirements: str
    ) -> Dict:
        """
        Optimise un CV pour une offre d'emploi spécifique
        
        Returns:
            Dict avec 'optimized_text', 'changes', 'improvements', 'match_score_improvement'
        """
        try:
            prompt = self._create_optimization_prompt(
                cv_text, job_title, job_description, job_requirements
            )
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en recrutement et optimisation de CVs. Tu personnalises les CVs pour qu'ils correspondent parfaitement aux offres d'emploi tout en restant honnête et authentique."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,  # Un peu de créativité pour la reformulation
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f'Error parsing OpenAI JSON response: {str(e)}')
            raise ValueError(f'Failed to parse optimization result: {str(e)}')
        except Exception as e:
            logger.error(f'Error optimizing CV with OpenAI: {str(e)}')
            raise
    
    def _create_optimization_prompt(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        job_requirements: str
    ) -> str:
        """
        Crée le prompt pour l'optimisation du CV
        """
        return f"""Analyse ce CV et cette offre d'emploi, puis optimise le CV pour qu'il corresponde mieux à l'offre.

CV ACTUEL:
{cv_text}

OFFRE D'EMPLOI:
Titre: {job_title}
Description: {job_description}
Exigences: {job_requirements}

Tâches:
1. Identifie les compétences et expériences du CV qui correspondent à l'offre
2. Reformule les sections pertinentes pour mettre en avant ces correspondances
3. Ajoute des mots-clés pertinents de l'offre (sans inventer d'expériences)
4. Réorganise si nécessaire pour mettre en avant les points les plus pertinents
5. Garde le CV authentique et honnête

Retourne un JSON avec cette structure:
{{
  "optimized_text": "CV optimisé complet",
  "changes": [
    {{
      "section": "Nom de la section (ex: Expérience, Compétences)",
      "original": "Texte original",
      "optimized": "Texte optimisé",
      "reason": "Pourquoi ce changement améliore la correspondance"
    }}
  ],
  "improvements": {{
    "keywords_added": ["mot-clé 1", "mot-clé 2"],
    "sections_reorganized": ["Section 1", "Section 2"],
    "match_score_improvement": 15.5
  }},
  "summary": "Résumé des améliorations apportées"
}}

Important:
- Ne pas inventer d'expériences ou compétences
- Rester honnête et authentique
- Mettre en avant les points forts existants
- Utiliser les mots-clés de l'offre de manière naturelle
"""
    
    def estimate_cost(self, cv_length: int, job_description_length: int) -> Dict:
        """
        Estime le coût d'optimisation d'un CV
        """
        # Estimation: 1 token ≈ 4 caractères
        input_tokens = (cv_length + job_description_length) / 4
        # Estimation: output ≈ 1.2x input (le CV optimisé est généralement plus long)
        output_tokens = input_tokens * 1.2
        
        # Coûts par million de tokens (gpt-4o-mini)
        input_cost_per_million = 0.15  # $0.15/1M tokens
        output_cost_per_million = 0.60  # $0.60/1M tokens
        
        input_cost = (input_tokens / 1_000_000) * input_cost_per_million
        output_cost = (output_tokens / 1_000_000) * output_cost_per_million
        total_cost = input_cost + output_cost
        
        return {
            'estimated_cost': round(total_cost, 6),
            'input_tokens_estimate': int(input_tokens),
            'output_tokens_estimate': int(output_tokens),
            'model': self.model
        }

