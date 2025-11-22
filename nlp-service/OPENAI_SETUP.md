# Configuration OpenAI pour l'analyse de CV

## 📋 Prérequis

1. **Compte OpenAI** : Créer un compte sur https://platform.openai.com
2. **Clé API** : Obtenir une clé API depuis https://platform.openai.com/api-keys

## 🔧 Configuration

### 1. Obtenir une clé API OpenAI

1. Aller sur https://platform.openai.com/api-keys
2. Cliquer sur "Create new secret key"
3. Donner un nom à la clé (ex: "Job Application System")
4. Copier la clé (elle ne sera affichée qu'une seule fois !)

### 2. Configurer la clé dans le projet

Créer ou modifier le fichier `nlp-service/.env` :

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-votre-cle-api-ici
OPENAI_MODEL=gpt-4o-mini

# Service Configuration
PORT=5001
CV_OUTPUT_DIR=./optimized_cvs
```

**Note** : `gpt-4o-mini` est recommandé car :
- Plus économique que GPT-4
- Très performant pour l'extraction de données structurées
- Rapide et fiable

### 3. Installer les dépendances

```bash
cd nlp-service
pip install -r requirements.txt
```

Cela installera automatiquement `openai>=1.12.0`.

## 🚀 Utilisation

Le système utilise automatiquement OpenAI si :
- La clé API est configurée (`OPENAI_API_KEY`)
- Le package `openai` est installé

Si OpenAI n'est pas disponible, le système utilise automatiquement l'extraction regex en fallback.

## 💰 Coûts

### Modèle `gpt-4o-mini` (recommandé)
- **Input** : ~$0.15 par 1M tokens
- **Output** : ~$0.60 par 1M tokens
- **Estimation** : ~$0.001-0.002 par CV analysé (selon la longueur)

### Modèle `gpt-4o` (plus puissant mais plus cher)
- **Input** : ~$2.50 par 1M tokens
- **Output** : ~$10.00 par 1M tokens
- **Estimation** : ~$0.01-0.02 par CV analysé

**Conseil** : Commencez avec `gpt-4o-mini` qui est largement suffisant pour l'extraction de données structurées.

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Démarrer le service NLP :
```bash
cd nlp-service
python app.py
```

2. Vérifier les logs au démarrage :
```
INFO:services.cv_parser:OpenAI CV parser initialized successfully
```

3. Tester l'analyse d'un CV depuis l'interface web

## 🔒 Sécurité

⚠️ **Important** :
- Ne jamais commiter la clé API dans Git
- Ajouter `.env` au `.gitignore`
- Utiliser des variables d'environnement en production
- Limiter les permissions de la clé API dans OpenAI Dashboard

## 🐛 Dépannage

### Erreur : "OPENAI_API_KEY environment variable is required"
- Vérifier que le fichier `.env` existe dans `nlp-service/`
- Vérifier que `OPENAI_API_KEY` est bien défini
- Redémarrer le service NLP

### Erreur : "Invalid API key"
- Vérifier que la clé API est correcte
- Vérifier que la clé n'a pas expiré
- Vérifier les crédits sur votre compte OpenAI

### Le système utilise toujours le parser regex
- Vérifier les logs : `INFO:services.cv_parser:OpenAI CV parser initialized successfully`
- Si ce message n'apparaît pas, vérifier la configuration

## 📊 Avantages d'OpenAI

✅ **Extraction précise** : Comprend le contexte et la structure
✅ **Multilingue** : Fonctionne avec CVs en français, anglais, etc.
✅ **Robuste** : Gère différents formats de CV
✅ **Structuré** : Retourne des données JSON bien formatées
✅ **Complet** : Extrait toutes les informations importantes

