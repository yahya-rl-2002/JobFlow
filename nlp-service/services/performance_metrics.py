import logging
from typing import Dict, List, Tuple
from sklearn.metrics import precision_score, recall_score, f1_score
import numpy as np

logger = logging.getLogger(__name__)


class PerformanceMetrics:
    """
    Calcule les métriques de performance pour comparer les méthodes de matching
    """
    
    @staticmethod
    def calculate_metrics(
        predictions: List[float],
        ground_truth: List[float],
        threshold: float = 0.5
    ) -> Dict:
        """
        Calcule précision, rappel et F1-score
        
        Args:
            predictions: Scores prédits (0-100)
            ground_truth: Scores réels (0-100) ou labels binaires (0/1)
            threshold: Seuil pour convertir les scores en labels binaires
        
        Returns:
            Dict avec precision, recall, f1_score, accuracy
        """
        # Convertir en labels binaires si nécessaire
        if all(0 <= x <= 1 for x in ground_truth):
            # Déjà des labels binaires
            y_true = [1 if x >= threshold else 0 for x in ground_truth]
        else:
            # Scores, convertir en labels
            y_true = [1 if x >= threshold * 100 else 0 for x in ground_truth]
        
        y_pred = [1 if x >= threshold * 100 else 0 for x in predictions]
        
        # Calculer les métriques
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        accuracy = sum(1 for i in range(len(y_true)) if y_true[i] == y_pred[i]) / len(y_true)
        
        return {
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1_score': round(f1, 4),
            'accuracy': round(accuracy, 4),
            'threshold': threshold
        }
    
    @staticmethod
    def compare_methods(
        local_results: List[Dict],
        openai_results: List[Dict],
        ground_truth: List[Dict] = None
    ) -> Dict:
        """
        Compare les résultats de deux méthodes de matching
        
        Args:
            local_results: Résultats du matching local
            openai_results: Résultats du matching OpenAI
            ground_truth: Scores réels (optionnel)
        
        Returns:
            Dict avec comparaison détaillée
        """
        # Créer des dictionnaires pour faciliter la comparaison
        local_scores = {r['job_id']: r['score'] for r in local_results}
        openai_scores = {r['job_id']: r['score'] for r in openai_results}
        
        # Jobs communs
        common_jobs = set(local_scores.keys()) & set(openai_scores.keys())
        
        if not common_jobs:
            return {
                'error': 'No common jobs found between methods'
            }
        
        # Calculer les différences de scores
        score_diffs = []
        for job_id in common_jobs:
            diff = openai_scores[job_id] - local_scores[job_id]
            score_diffs.append(diff)
        
        comparison = {
            'common_jobs': len(common_jobs),
            'avg_score_diff': round(np.mean(score_diffs), 2),
            'max_score_diff': round(max(score_diffs), 2),
            'min_score_diff': round(min(score_diffs), 2),
            'std_score_diff': round(np.std(score_diffs), 2),
            'local_avg_score': round(np.mean([local_scores[j] for j in common_jobs]), 2),
            'openai_avg_score': round(np.mean([openai_scores[j] for j in common_jobs]), 2),
        }
        
        # Si on a des ground truth, calculer les métriques
        if ground_truth:
            gt_scores = {gt['job_id']: gt['score'] for gt in ground_truth}
            common_with_gt = common_jobs & set(gt_scores.keys())
            
            if common_with_gt:
                local_pred = [local_scores[j] for j in common_with_gt]
                openai_pred = [openai_scores[j] for j in common_with_gt]
                gt_values = [gt_scores[j] for j in common_with_gt]
                
                comparison['local_metrics'] = PerformanceMetrics.calculate_metrics(
                    local_pred, gt_values
                )
                comparison['openai_metrics'] = PerformanceMetrics.calculate_metrics(
                    openai_pred, gt_values
                )
        
        return comparison
    
    @staticmethod
    def calculate_cost_benefit(
        local_results: List[Dict],
        openai_results: List[Dict],
        openai_cost: float,
        improvement_threshold: float = 5.0
    ) -> Dict:
        """
        Calcule le rapport coût/bénéfice de l'utilisation d'OpenAI
        
        Args:
            local_results: Résultats du matching local
            openai_results: Résultats du matching OpenAI
            openai_cost: Coût d'utilisation d'OpenAI (en $)
            improvement_threshold: Seuil d'amélioration minimum pour justifier le coût
        
        Returns:
            Dict avec analyse coût/bénéfice
        """
        local_scores = {r['job_id']: r['score'] for r in local_results}
        openai_scores = {r['job_id']: r['score'] for r in openai_results}
        
        common_jobs = set(local_scores.keys()) & set(openai_scores.keys())
        
        improvements = []
        for job_id in common_jobs:
            improvement = openai_scores[job_id] - local_scores[job_id]
            improvements.append(improvement)
        
        avg_improvement = np.mean(improvements)
        significant_improvements = sum(1 for imp in improvements if imp >= improvement_threshold)
        
        return {
            'openai_cost': round(openai_cost, 6),
            'avg_improvement': round(avg_improvement, 2),
            'significant_improvements': significant_improvements,
            'improvement_rate': round(significant_improvements / len(common_jobs) * 100, 2) if common_jobs else 0,
            'cost_per_improvement': round(openai_cost / significant_improvements, 6) if significant_improvements > 0 else float('inf'),
            'recommendation': 'use_openai' if avg_improvement >= improvement_threshold else 'use_local'
        }

