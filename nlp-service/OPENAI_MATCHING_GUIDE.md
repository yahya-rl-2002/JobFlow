# 🚀 Guide Complet - Matching Sémantique avec OpenAI

## 📋 Vue d'ensemble

Ce système implémente un **matching hybride** qui combine :
- **Pipeline local** (Sentence-Transformers) : Rapide, gratuit, pour les cas simples
- **OpenAI Embeddings** : Plus précis, payant, pour les cas complexes

## 🏗️ Architecture

### Composants principaux

1. **`OpenAIMatcher`** : Génère des embeddings avec OpenAI et calcule la similarité
2. **`HybridMatcher`** : Choisit automatiquement entre local et OpenAI
3. **`OpenAICVOptimizer`** : Personnalise les CVs avec GPT
4. **`PerformanceMetrics`** : Compare les méthodes et calcule les métriques

## 🔧 Configuration

### Variables d'environnement

Dans `nlp-service/.env` :

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-votre-cle-api
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Hybrid Matcher Configuration
USE_OPENAI_FOR_COMPLEX=true
OPENAI_MATCH_THRESHOLD=0.7
MAX_JOBS_FOR_OPENAI=50
```

### Modèles recommandés

- **Embeddings** : `text-embedding-3-small` ($0.02/1M tokens) - Économique
- **Embeddings** : `text-embedding-3-large` ($0.13/1M tokens) - Plus précis
- **Optimisation CV** : `gpt-4o-mini` ($0.15/$0.60 per 1M tokens) - Économique et performant

## 📡 API Endpoints

### 1. Matching Hybride

**POST** `/match`

```json
{
  "cv_data": {
    "raw_text": "Texte du CV...",
    "skills": ["Python", "React"],
    "experience": [...]
  },
  "jobs": [
    {
      "id": 1,
      "title": "Développeur Full Stack",
      "description": "...",
      "requirements": "..."
    }
  ],
  "use_openai": null,  // null = décision automatique
  "top_k": 10
}
```

**Réponse** :
```json
{
  "success": true,
  "results": [
    {
      "job_id": 1,
      "score": 85.5,
      "method": "openai",
      "details": {
        "method": "openai_embedding",
        "similarity": 0.855
      }
    }
  ],
  "method": "openai",
  "count": 10
}
```

### 2. Comparaison des Méthodes

**POST** `/match/compare`

Compare les résultats local vs OpenAI pour des tests de performance.

### 3. Estimation des Coûts

**POST** `/match/estimate-cost`

```json
{
  "num_jobs": 50,
  "avg_text_length": 1000
}
```

**Réponse** :
```json
{
  "success": true,
  "cost_estimate": {
    "estimated_cost": 0.001,
    "tokens_estimate": 12500,
    "model": "text-embedding-3-small",
    "cost_per_million": 0.02
  }
}
```

### 4. Optimisation de CV avec OpenAI

**POST** `/customize-cv`

```json
{
  "cv_text": "Texte du CV...",
  "job_title": "Développeur Full Stack",
  "job_description": "...",
  "job_requirements": "...",
  "use_openai": true
}
```

**Réponse** :
```json
{
  "success": true,
  "optimized_text": "CV optimisé...",
  "changes": [
    {
      "section": "Compétences",
      "original": "...",
      "optimized": "...",
      "reason": "..."
    }
  ],
  "improvements": {
    "keywords_added": ["React", "Node.js"],
    "match_score_improvement": 15.5
  },
  "method": "openai"
}
```

## 💰 Gestion des Coûts

### Coûts estimés

#### Embeddings (`text-embedding-3-small`)
- **Input** : $0.02 par 1M tokens
- **Estimation** : ~$0.001-0.002 par matching (50 offres)

#### Optimisation CV (`gpt-4o-mini`)
- **Input** : $0.15 par 1M tokens
- **Output** : $0.60 par 1M tokens
- **Estimation** : ~$0.002-0.005 par CV optimisé

### Stratégie hybride

Le système utilise automatiquement :
- **Pipeline local** si :
  - Plus de 50 offres (limite de coût)
  - CV simple (texte court)
  - Pas de clé API OpenAI
  
- **OpenAI** si :
  - CV complexe (texte long > 2000 caractères)
  - Plus de 50% d'offres complexes
  - Explicitement demandé (`use_openai: true`)

## 📊 Métriques de Performance

### Calcul des métriques

```python
from services.performance_metrics import PerformanceMetrics

# Comparer deux méthodes
comparison = PerformanceMetrics.compare_methods(
    local_results,
    openai_results,
    ground_truth  # Optionnel
)

# Calculer coût/bénéfice
cost_benefit = PerformanceMetrics.calculate_cost_benefit(
    local_results,
    openai_results,
    openai_cost=0.002,
    improvement_threshold=5.0
)
```

### Métriques retournées

- **Precision** : Proportion de prédictions positives correctes
- **Recall** : Proportion de vrais positifs détectés
- **F1-Score** : Moyenne harmonique de précision et rappel
- **Accuracy** : Proportion de prédictions correctes
- **Score Difference** : Différence moyenne entre méthodes

## 🧪 Tests de Performance

### Exemple de test

```python
# 1. Préparer les données
cv_data = {...}
jobs = [...]
ground_truth = [...]  # Scores réels (si disponibles)

# 2. Matching avec les deux méthodes
local_results = local_matcher.match_multiple(cv_data, jobs)
openai_results = openai_matcher.match_cv_to_jobs(cv_text, jobs)

# 3. Comparer
comparison = PerformanceMetrics.compare_methods(
    local_results,
    openai_results,
    ground_truth
)

# 4. Analyser le coût/bénéfice
cost_benefit = PerformanceMetrics.calculate_cost_benefit(
    local_results,
    openai_results,
    openai_cost=0.002
)
```

## 🚀 Déploiement

### 1. Installation

```bash
cd nlp-service
pip install -r requirements.txt
```

### 2. Configuration

Ajouter `OPENAI_API_KEY` dans `.env`

### 3. Démarrage

```bash
python app.py
```

### 4. Vérification

```bash
curl http://localhost:5001/health
```

## 📈 Optimisation

### Recommandations

1. **Pour les volumes élevés** : Utiliser le pipeline local par défaut
2. **Pour la précision** : Utiliser OpenAI pour les CVs complexes
3. **Pour les coûts** : Limiter `MAX_JOBS_FOR_OPENAI` à 50
4. **Pour les tests** : Utiliser `/match/compare` pour évaluer

### Monitoring

- Suivre les coûts avec `/match/estimate-cost`
- Comparer les performances avec `/match/compare`
- Ajuster les seuils selon les résultats

## 🔒 Sécurité

- Ne jamais commiter la clé API
- Utiliser des variables d'environnement
- Limiter les permissions de la clé API
- Monitorer l'utilisation dans OpenAI Dashboard

## 📝 Exemples d'utilisation

Voir `examples/openai_matching_examples.py` pour des exemples complets.

