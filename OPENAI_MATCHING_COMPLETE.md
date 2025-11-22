# 🎯 Système de Matching Hybride OpenAI - Guide Complet

## 📋 Résumé

Système hybride intelligent qui combine :
- **Pipeline local** (Sentence-Transformers) : Rapide, gratuit
- **OpenAI Embeddings** : Précis, payant mais optimisé
- **GPT pour optimisation** : Personnalisation intelligente des CVs

## 🚀 Installation Rapide

### 1. Installer les dépendances

```bash
cd nlp-service
pip install -r requirements.txt
```

### 2. Configurer OpenAI

Ajouter dans `nlp-service/.env` :

```env
OPENAI_API_KEY=sk-votre-cle-api
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
USE_OPENAI_FOR_COMPLEX=true
MAX_JOBS_FOR_OPENAI=50
```

### 3. Redémarrer le service

```bash
python app.py
```

## 💡 Utilisation

### Matching Automatique (Recommandé)

Le système choisit automatiquement la meilleure méthode :

```python
POST /match
{
  "cv_data": {...},
  "jobs": [...],
  "top_k": 10
}
```

### Forcer OpenAI

Pour une précision maximale :

```python
POST /match
{
  "cv_data": {...},
  "jobs": [...],
  "use_openai": true
}
```

### Optimiser un CV

Personnaliser un CV pour une offre :

```python
POST /customize-cv
{
  "cv_text": "...",
  "job_title": "...",
  "job_description": "...",
  "job_requirements": "..."
}
```

## 💰 Coûts

### Embeddings
- **text-embedding-3-small** : ~$0.001-0.002 par matching (50 offres)
- **text-embedding-3-large** : ~$0.005-0.010 par matching

### Optimisation CV
- **gpt-4o-mini** : ~$0.002-0.005 par CV optimisé

### Stratégie d'économie
- Pipeline local par défaut
- OpenAI uniquement pour les cas complexes
- Limite automatique à 50 offres

## 📊 Métriques de Performance

Le système calcule automatiquement :
- **Precision** : Précision des prédictions
- **Recall** : Taux de détection
- **F1-Score** : Score combiné
- **Score Difference** : Amélioration vs méthode locale

## 🧪 Tests

Voir `nlp-service/examples/openai_matching_examples.py` pour des exemples complets.

## 📚 Documentation Complète

Voir `nlp-service/OPENAI_MATCHING_GUIDE.md` pour la documentation détaillée.

## ✅ Avantages

✅ **Hybride intelligent** : Choisit automatiquement la meilleure méthode
✅ **Optimisé coûts** : Utilise OpenAI uniquement quand nécessaire
✅ **Haute précision** : Embeddings OpenAI pour matching précis
✅ **Personnalisation** : GPT pour optimiser les CVs
✅ **Métriques** : Suivi de performance et coûts

## 🔧 Configuration Avancée

### Variables d'environnement

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Hybrid Matcher
USE_OPENAI_FOR_COMPLEX=true
OPENAI_MATCH_THRESHOLD=0.7
MAX_JOBS_FOR_OPENAI=50
```

### Ajuster les seuils

- **OPENAI_MATCH_THRESHOLD** : Seuil pour utiliser OpenAI (0.0-1.0)
- **MAX_JOBS_FOR_OPENAI** : Limite d'offres pour éviter les coûts élevés

## 🎯 Recommandations

1. **Démarrage** : Utiliser les valeurs par défaut
2. **Tests** : Utiliser `/match/compare` pour évaluer
3. **Optimisation** : Ajuster les seuils selon vos résultats
4. **Monitoring** : Suivre les coûts avec `/match/estimate-cost`

## 📞 Support

Pour toute question, voir la documentation complète dans `nlp-service/OPENAI_MATCHING_GUIDE.md`.

