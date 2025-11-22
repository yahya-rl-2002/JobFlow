"""
Exemples d'utilisation du système de matching hybride OpenAI
"""

import requests
import json

# Configuration
NLP_SERVICE_URL = "http://localhost:5001"

# Exemple 1: Matching simple avec décision automatique
def example_simple_matching():
    """Matching simple - le système choisit automatiquement la méthode"""
    
    cv_data = {
        "raw_text": """
        YAHYA RAHIL
        Développeur Full Stack
        
        Compétences:
        - Python, JavaScript, React, Node.js
        - PostgreSQL, MongoDB
        - Docker, AWS
        
        Expérience:
        - Développeur Full Stack chez TechCorp (2020-2023)
          Développement d'applications web avec React et Node.js
        - Développeur Junior chez StartupXYZ (2018-2020)
          Maintenance et développement de fonctionnalités
        """,
        "skills": ["Python", "JavaScript", "React", "Node.js", "PostgreSQL"],
        "experience": [
            {
                "position": "Développeur Full Stack",
                "company": "TechCorp",
                "start_date": "2020",
                "end_date": "2023"
            }
        ]
    }
    
    jobs = [
        {
            "id": 1,
            "title": "Développeur Full Stack React/Node.js",
            "description": "Nous recherchons un développeur full stack expérimenté...",
            "requirements": "React, Node.js, PostgreSQL, 3+ ans d'expérience"
        },
        {
            "id": 2,
            "title": "Développeur Python Backend",
            "description": "Poste de développeur backend Python...",
            "requirements": "Python, Django, PostgreSQL, 2+ ans d'expérience"
        }
    ]
    
    response = requests.post(
        f"{NLP_SERVICE_URL}/match",
        json={
            "cv_data": cv_data,
            "jobs": jobs,
            "top_k": 5
        }
    )
    
    result = response.json()
    print("Résultats du matching:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    return result


# Exemple 2: Forcer l'utilisation d'OpenAI
def example_force_openai():
    """Forcer l'utilisation d'OpenAI pour un matching précis"""
    
    cv_data = {
        "raw_text": "CV complet avec beaucoup de détails..."
    }
    
    jobs = [
        {
            "id": 1,
            "title": "Senior Full Stack Developer",
            "description": "Description détaillée de l'offre...",
            "requirements": "Exigences détaillées..."
        }
    ]
    
    response = requests.post(
        f"{NLP_SERVICE_URL}/match",
        json={
            "cv_data": cv_data,
            "jobs": jobs,
            "use_openai": True,  # Forcer OpenAI
            "top_k": 10
        }
    )
    
    result = response.json()
    print(f"Méthode utilisée: {result['method']}")
    print(f"Nombre de résultats: {result['count']}")
    
    return result


# Exemple 3: Comparer les méthodes
def example_compare_methods():
    """Comparer les résultats local vs OpenAI"""
    
    cv_data = {
        "raw_text": "CV détaillé...",
        "skills": ["Python", "React", "Node.js"]
    }
    
    jobs = [
        {
            "id": i,
            "title": f"Job {i}",
            "description": f"Description du job {i}...",
            "requirements": "Requirements..."
        }
        for i in range(1, 11)
    ]
    
    response = requests.post(
        f"{NLP_SERVICE_URL}/match/compare",
        json={
            "cv_data": cv_data,
            "jobs": jobs
        }
    )
    
    comparison = response.json()
    print("Comparaison des méthodes:")
    print(json.dumps(comparison, indent=2, ensure_ascii=False))
    
    return comparison


# Exemple 4: Estimer les coûts
def example_estimate_costs():
    """Estimer les coûts avant de faire le matching"""
    
    response = requests.post(
        f"{NLP_SERVICE_URL}/match/estimate-cost",
        json={
            "num_jobs": 50,
            "avg_text_length": 1000
        }
    )
    
    cost_estimate = response.json()
    print("Estimation des coûts:")
    print(json.dumps(cost_estimate, indent=2))
    
    estimated_cost = cost_estimate['cost_estimate']['estimated_cost']
    print(f"\nCoût estimé: ${estimated_cost:.6f}")
    
    return cost_estimate


# Exemple 5: Optimiser un CV avec OpenAI
def example_optimize_cv():
    """Personnaliser un CV pour une offre spécifique"""
    
    cv_text = """
    YAHYA RAHIL
    Développeur Full Stack
    
    Compétences: Python, JavaScript, React, Node.js
    Expérience: 5 ans en développement web
    """
    
    job_title = "Senior Full Stack Developer"
    job_description = "Nous recherchons un développeur senior..."
    job_requirements = "React, Node.js, TypeScript, 5+ ans d'expérience"
    
    response = requests.post(
        f"{NLP_SERVICE_URL}/customize-cv",
        json={
            "cv_text": cv_text,
            "job_title": job_title,
            "job_description": job_description,
            "job_requirements": job_requirements,
            "use_openai": True
        }
    )
    
    result = response.json()
    print("CV optimisé:")
    print(result['optimized_text'])
    print("\nChangements apportés:")
    for change in result['changes']:
        print(f"- {change['section']}: {change['reason']}")
    
    return result


# Exemple 6: Test de performance complet
def example_performance_test():
    """Test complet de performance avec métriques"""
    
    from services.performance_metrics import PerformanceMetrics
    
    # Simuler des résultats
    local_results = [
        {"job_id": 1, "score": 75.5},
        {"job_id": 2, "score": 68.2},
        {"job_id": 3, "score": 82.1}
    ]
    
    openai_results = [
        {"job_id": 1, "score": 88.3},
        {"job_id": 2, "score": 71.5},
        {"job_id": 3, "score": 85.7}
    ]
    
    ground_truth = [
        {"job_id": 1, "score": 90},
        {"job_id": 2, "score": 70},
        {"job_id": 3, "score": 85}
    ]
    
    # Comparer
    comparison = PerformanceMetrics.compare_methods(
        local_results,
        openai_results,
        ground_truth
    )
    
    print("Comparaison de performance:")
    print(json.dumps(comparison, indent=2))
    
    # Analyser coût/bénéfice
    cost_benefit = PerformanceMetrics.calculate_cost_benefit(
        local_results,
        openai_results,
        openai_cost=0.002,
        improvement_threshold=5.0
    )
    
    print("\nAnalyse coût/bénéfice:")
    print(json.dumps(cost_benefit, indent=2))
    
    return comparison, cost_benefit


if __name__ == "__main__":
    print("=== Exemple 1: Matching simple ===")
    example_simple_matching()
    
    print("\n=== Exemple 2: Forcer OpenAI ===")
    example_force_openai()
    
    print("\n=== Exemple 3: Comparer méthodes ===")
    example_compare_methods()
    
    print("\n=== Exemple 4: Estimer coûts ===")
    example_estimate_costs()
    
    print("\n=== Exemple 5: Optimiser CV ===")
    example_optimize_cv()
    
    print("\n=== Exemple 6: Test performance ===")
    example_performance_test()

