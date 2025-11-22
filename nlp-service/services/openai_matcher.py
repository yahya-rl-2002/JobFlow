import os
import json
import logging
from typing import Dict, List, Tuple
import numpy as np
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class OpenAIMatcher:
    """
    Service de matching sémantique utilisant les embeddings OpenAI
    Plus précis que le matching basé sur Sentence-Transformers
    """
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError('OPENAI_API_KEY environment variable is required')
        
        self.client = OpenAI(api_key=api_key)
        self.embedding_model = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
        # text-embedding-3-small : $0.02/1M tokens (économique)
        # text-embedding-3-large : $0.13/1M tokens (plus précis)
        
        logger.info(f'OpenAI Matcher initialized with model: {self.embedding_model}')
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Génère un embedding pour un texte donné
        """
        try:
            # Limiter la longueur du texte (limite OpenAI: 8191 tokens)
            # On prend les premiers 6000 caractères pour être sûr
            text = text[:6000] if len(text) > 6000 else text
            
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            return response.data[0].embedding
        except Exception as e:
            logger.error(f'Error generating embedding: {str(e)}')
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Génère des embeddings pour plusieurs textes (batch processing)
        Plus efficace et économique que plusieurs appels individuels
        """
        try:
            # Limiter la longueur de chaque texte
            processed_texts = [text[:6000] if len(text) > 6000 else text for text in texts]
            
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=processed_texts
            )
            
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f'Error generating batch embeddings: {str(e)}')
            raise
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calcule la similarité cosinus entre deux embeddings
        Retourne un score entre 0 et 1
        """
        try:
            # Convertir en numpy arrays
            vec1 = np.array(embedding1).reshape(1, -1)
            vec2 = np.array(embedding2).reshape(1, -1)
            
            # Calculer la similarité cosinus
            similarity = cosine_similarity(vec1, vec2)[0][0]
            
            return float(similarity)
        except Exception as e:
            logger.error(f'Error calculating similarity: {str(e)}')
            raise
    
    def match_cv_to_jobs(
        self, 
        cv_text: str, 
        jobs: List[Dict],
        top_k: int = 10
    ) -> List[Dict]:
        """
        Match un CV avec plusieurs offres d'emploi en utilisant les embeddings OpenAI
        
        Args:
            cv_text: Texte du CV
            jobs: Liste des offres d'emploi avec 'id', 'title', 'description', 'requirements'
            top_k: Nombre de meilleures correspondances à retourner
        
        Returns:
            Liste des résultats de matching triés par score décroissant
        """
        try:
            # Préparer les textes des offres
            job_texts = []
            for job in jobs:
                # Combiner titre, description et requirements
                job_text = f"{job.get('title', '')}\n{job.get('description', '')}\n{job.get('requirements', '')}"
                job_texts.append(job_text)
            
            # Générer l'embedding du CV
            logger.info('Generating CV embedding...')
            cv_embedding = self.generate_embedding(cv_text)
            
            # Générer les embeddings des offres (batch)
            logger.info(f'Generating embeddings for {len(job_texts)} jobs...')
            job_embeddings = self.generate_embeddings_batch(job_texts)
            
            # Calculer les similarités
            results = []
            for i, job in enumerate(jobs):
                similarity = self.calculate_similarity(cv_embedding, job_embeddings[i])
                
                # Convertir en score de 0-100
                score = similarity * 100
                
                results.append({
                    'job_id': job.get('id'),
                    'score': round(score, 2),
                    'similarity': round(similarity, 4),
                    'details': {
                        'method': 'openai_embedding',
                        'model': self.embedding_model,
                        'base_similarity': round(similarity, 4)
                    }
                })
            
            # Trier par score décroissant
            results.sort(key=lambda x: x['score'], reverse=True)
            
            # Retourner les top_k meilleures correspondances
            return results[:top_k]
            
        except Exception as e:
            logger.error(f'Error matching CV to jobs: {str(e)}')
            raise
    
    def estimate_cost(self, num_texts: int, avg_text_length: int = 1000) -> Dict:
        """
        Estime le coût d'utilisation de l'API OpenAI pour les embeddings
        
        Returns:
            Dict avec 'estimated_cost', 'tokens_estimate', 'model'
        """
        # Estimation: 1 token ≈ 4 caractères
        tokens_per_text = avg_text_length / 4
        total_tokens = num_texts * tokens_per_text
        
        # Coûts par million de tokens (au 2024)
        costs = {
            'text-embedding-3-small': 0.02,  # $0.02/1M tokens
            'text-embedding-3-large': 0.13,   # $0.13/1M tokens
        }
        
        cost_per_million = costs.get(self.embedding_model, 0.02)
        estimated_cost = (total_tokens / 1_000_000) * cost_per_million
        
        return {
            'estimated_cost': round(estimated_cost, 6),
            'tokens_estimate': int(total_tokens),
            'model': self.embedding_model,
            'cost_per_million': cost_per_million
        }

