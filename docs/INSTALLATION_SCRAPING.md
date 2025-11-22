# Installation du Système de Scraping pour Vraies Annonces

## 📋 Vue d'ensemble

Le système utilise maintenant **JobSpy** pour récupérer de vraies offres d'emploi depuis LinkedIn et Indeed.

## 🔧 Installation

### Étape 1 : Activer l'environnement virtuel

```bash
cd nlp-service
source venv/bin/activate  # Sur macOS/Linux
# ou
venv\Scripts\activate  # Sur Windows
```

### Étape 2 : Installer les dépendances

```bash
pip install jobspy beautifulsoup4 selenium
```

Ou installer toutes les dépendances :

```bash
pip install -r requirements.txt
```

### Étape 3 : Redémarrer le service NLP

```bash
# Arrêter le service actuel (Ctrl+C)
# Puis redémarrer
python app.py
```

## ✅ Vérification

### Tester le scraper

Vous pouvez tester le scraper directement via curl :

```bash
curl -X POST http://127.0.0.1:5001/scrape-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "developer",
    "location": "Paris, France",
    "limit": 10,
    "platform": "linkedin"
  }'
```

## 🚀 Utilisation

### Depuis l'interface

1. Allez dans **"Offres d'emploi"**
2. Utilisez les filtres pour spécifier :
   - Mots-clés (ex: "developer", "designer")
   - Localisation (ex: "Paris, France")
   - Plateforme (LinkedIn, Indeed, ou Toutes)
3. Cliquez sur **"🔄 Synchroniser les offres"**

Le système va maintenant récupérer de **vraies annonces** depuis LinkedIn et Indeed !

## ⚠️ Notes importantes

### LinkedIn

- **Respect des ToS** : Le scraping doit être fait de manière respectueuse
- **Rate Limiting** : Ne pas surcharger les serveurs LinkedIn
- **Limitations** : LinkedIn peut bloquer les requêtes trop fréquentes

### Indeed

- **API Publisher** : Le système utilise d'abord le scraping, puis l'API Publisher en fallback
- **Gratuit** : Pas besoin de Publisher ID si le scraping fonctionne
- **Limitations** : Rate limiting recommandé

## 🔄 Fallback

Si le scraping échoue :
- **LinkedIn** : Retourne des offres de démonstration
- **Indeed** : Utilise l'API Publisher si configurée

## 🐛 Dépannage

### Erreur "JobSpy not available"

```bash
pip install jobspy
```

### Erreur "LinkedIn scraper not available"

Vérifiez que le service NLP est démarré et que JobSpy est installé.

### Aucune offre récupérée

- Vérifiez vos mots-clés et localisation
- Essayez avec des termes plus génériques
- Vérifiez les logs du service NLP

## 📊 Performance

- **Temps de scraping** : 10-30 secondes pour 25 offres
- **Rate limiting** : 1 requête toutes les 2-3 secondes recommandé
- **Timeout** : 60 secondes par défaut

## 🔒 Sécurité et Légalité

- Respectez les conditions d'utilisation de LinkedIn et Indeed
- Ne surchargez pas les serveurs
- Utilisez le système de manière responsable
- Considérez les alternatives légales (APIs officielles, partenariats)

