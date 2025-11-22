# 🚀 Configuration OpenAI - Guide Rapide

## Étapes pour activer l'analyse de CV avec OpenAI

### 1. Obtenir une clé API OpenAI

1. Aller sur https://platform.openai.com
2. Créer un compte ou se connecter
3. Aller sur https://platform.openai.com/api-keys
4. Cliquer sur "Create new secret key"
5. **Copier la clé** (elle commence par `sk-`)

### 2. Ajouter la clé au fichier .env

Ouvrir le fichier `nlp-service/.env` et ajouter :

```env
PORT=5001
OPENAI_API_KEY=sk-votre-cle-api-ici
OPENAI_MODEL=gpt-4o-mini
```

**Remplacez `sk-votre-cle-api-ici` par votre vraie clé API.**

### 3. Installer la dépendance OpenAI

```bash
cd nlp-service
pip install openai
```

Ou réinstaller toutes les dépendances :

```bash
cd nlp-service
pip install -r requirements.txt
```

### 4. Redémarrer le service NLP

```bash
cd nlp-service
python app.py
```

Vous devriez voir dans les logs :
```
INFO:services.cv_parser:OpenAI CV parser initialized successfully
```

### 5. Tester

1. Aller dans "Mes CVs" dans l'application
2. Cliquer sur "Analyser" pour un CV
3. L'analyse devrait maintenant fonctionner avec OpenAI ! 🎉

## 💡 Notes importantes

- **Coût** : ~$0.001-0.002 par CV analysé avec `gpt-4o-mini`
- **Modèle recommandé** : `gpt-4o-mini` (économique et performant)
- **Sécurité** : Ne jamais partager votre clé API

## 🔧 Si ça ne fonctionne pas

1. Vérifier que la clé API est correcte dans `.env`
2. Vérifier que `openai` est installé : `pip list | grep openai`
3. Vérifier les logs du service NLP pour voir les erreurs
4. Vérifier que vous avez des crédits sur votre compte OpenAI

## ✅ Avantages d'OpenAI

- ✅ Analyse précise et intelligente
- ✅ Fonctionne avec tous les formats de CV
- ✅ Extraction structurée complète
- ✅ Multilingue (français, anglais, etc.)

