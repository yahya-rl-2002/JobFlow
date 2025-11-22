# Guide d'Implémentation Complet

## Vue d'ensemble

Ce document détaille les étapes pour implémenter et utiliser le système automatisé de postulation.

## Architecture du Système

### Composants principaux

1. **Backend (Node.js + Express + TypeScript)**
   - API REST pour toutes les opérations
   - Gestion des utilisateurs et authentification
   - Intégration avec LinkedIn et Indeed
   - Base de données PostgreSQL

2. **Service NLP (Python + Flask)**
   - Parsing de CVs (PDF, DOC, DOCX)
   - Matching CV-Offres avec BERT
   - Personnalisation automatique de CV

3. **Frontend (React + TypeScript)**
   - Interface utilisateur moderne
   - Gestion des CVs
   - Recherche et matching d'offres
   - Suivi des candidatures

## Étapes d'Installation

### 1. Prérequis

```bash
# Node.js 18+
node --version

# Python 3.9+
python --version

# PostgreSQL 14+
psql --version

# npm ou yarn
npm --version
```

### 2. Base de données

```bash
# Créer la base de données
createdb job_application_db

# Les tables seront créées automatiquement au premier démarrage
```

### 3. Backend

```bash
cd backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Créer le dossier pour les uploads
mkdir -p uploads logs

# Démarrer en mode développement
npm run dev
```

### 4. Service NLP

```bash
cd nlp-service

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Télécharger les modèles spaCy (optionnel mais recommandé)
python -m spacy download fr_core_news_sm
python -m spacy download en_core_web_sm

# Créer le dossier de sortie
mkdir -p optimized_cvs

# Démarrer le service
python app.py
```

### 5. Frontend

```bash
cd frontend
npm install

# Démarrer en mode développement
npm run dev
```

## Configuration des APIs

### LinkedIn

⚠️ **Important**: LinkedIn n'offre pas d'API publique pour la recherche d'emploi.

**Options:**
1. Contacter LinkedIn pour un partenariat (LinkedIn Talent Solutions)
2. Utiliser des services tiers autorisés
3. Implémenter une solution manuelle

**Si vous avez accès à l'API:**
```env
LINKEDIN_API_KEY=your_api_key
LINKEDIN_API_SECRET=your_api_secret
```

### Indeed

1. Créer un compte sur https://ads.indeed.com/jobroll
2. Obtenir votre Publisher ID
3. Configurer dans `.env`:

```env
INDEED_PUBLISHER_ID=your_publisher_id
```

## Utilisation du Système

### 1. Inscription et Connexion

- Accéder à `http://localhost:3001/register`
- Créer un compte avec consentement RGPD
- Se connecter avec les identifiants

### 2. Upload de CV

- Aller dans "Mes CVs"
- Télécharger un CV (PDF, DOC, DOCX)
- Le système parse automatiquement le CV

### 3. Configuration des Préférences

- Aller dans "Profil"
- Configurer:
  - Mots-clés de recherche
  - Localisations
  - Types de postes
  - Score de matching minimum
  - Auto-application (optionnel)

### 4. Synchronisation des Offres

- Aller dans "Offres d'emploi"
- Cliquer sur "Synchroniser"
- Les offres sont récupérées depuis LinkedIn/Indeed
- Stockées en base de données

### 5. Matching CV-Offres

- Aller dans "Matching"
- Sélectionner un CV
- Le système calcule les scores de correspondance
- Affiche les offres triées par score

### 6. Personnalisation de CV

- Pour chaque offre, le système peut personnaliser le CV
- Ajout de mots-clés pertinents
- Mise en avant des compétences correspondantes
- Génération d'une version optimisée

### 7. Soumission de Candidatures

- Créer une candidature depuis une offre
- Le système personnalise le CV si nécessaire
- Soumettre la candidature (via API ou redirection)
- Suivre le statut dans "Candidatures"

## Algorithme de Matching

### Méthode utilisée

1. **Embeddings sémantiques**
   - Utilisation de BERT multilingue
   - Génération d'embeddings pour CV et offres

2. **Similarité cosinus**
   - Calcul de la similarité entre embeddings
   - Score de base (0-100)

3. **Ajustements**
   - Bonus pour compétences correspondantes
   - Bonus pour mots-clés correspondants
   - Bonus pour expérience/formation

4. **Score final**
   - Score ajusté (0-100)
   - Détails de correspondance

### Amélioration du matching

Pour améliorer les résultats:

1. **Entraîner un modèle personnalisé**
   - Utiliser des données d'entraînement
   - Fine-tuning sur le domaine spécifique

2. **Ajouter des règles métier**
   - Poids différents selon le type de compétence
   - Priorité aux compétences requises

3. **Feedback utilisateur**
   - Collecter les retours
   - Ajuster les poids

## Personnalisation de CV

### Processus

1. **Analyse de l'offre**
   - Extraction des mots-clés
   - Identification des compétences requises

2. **Analyse du CV**
   - Identification des sections
   - Extraction des compétences existantes

3. **Optimisation**
   - Ajout de mots-clés manquants
   - Reformulation de phrases
   - Mise en avant des compétences pertinentes

4. **Génération**
   - Création d'une version optimisée
   - Conservation du format original

### Limitations

- Ne modifie pas radicalement le CV
- Ajoute des éléments pertinents
- L'utilisateur peut accepter/refuser les modifications

## Conformité RGPD

### Implémentations

1. **Consentement**
   - Checkbox obligatoire à l'inscription
   - Date de consentement enregistrée

2. **Droit à l'oubli**
   - Suppression soft des données
   - Possibilité de suppression complète

3. **Accès aux données**
   - Export des données utilisateur
   - Transparence sur l'utilisation

4. **Sécurité**
   - Chiffrement des mots de passe
   - HTTPS en production
   - Protection des données sensibles

## Performance et Évolutivité

### Optimisations

1. **Base de données**
   - Index sur les colonnes fréquemment recherchées
   - Requêtes optimisées

2. **Cache**
   - Cache des modèles NLP
   - Cache des résultats de matching

3. **Traitement asynchrone**
   - Jobs en arrière-plan
   - Queue pour les tâches longues

4. **Rate limiting**
   - Protection contre les abus
   - Respect des limites des APIs externes

### Scaling

Pour gérer plus d'utilisateurs:

1. **Horizontal scaling**
   - Plusieurs instances du backend
   - Load balancer

2. **Base de données**
   - Réplication
   - Sharding si nécessaire

3. **Service NLP**
   - Plusieurs workers
   - Queue de traitement

## Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifier les credentials dans `.env`
   - Vérifier que PostgreSQL est démarré

2. **Service NLP ne répond pas**
   - Vérifier que le service est démarré
   - Vérifier le port (5000 par défaut)
   - Vérifier les logs

3. **Erreur de parsing de CV**
   - Vérifier le format du fichier
   - Vérifier que les dépendances Python sont installées

4. **APIs LinkedIn/Indeed ne fonctionnent pas**
   - Vérifier les clés API
   - Vérifier les rate limits
   - Consulter la documentation des APIs

## Prochaines Étapes

### Améliorations possibles

1. **Machine Learning avancé**
   - Entraîner un modèle personnalisé
   - Améliorer la précision du matching

2. **Plus de plateformes**
   - Ajouter d'autres sources d'offres
   - Intégration avec d'autres APIs

3. **Fonctionnalités avancées**
   - Lettre de motivation automatique
   - Suivi des réponses
   - Statistiques avancées

4. **Interface utilisateur**
   - Améliorer le design
   - Ajouter des visualisations
   - Mobile responsive

## Support

Pour toute question ou problème:
- Consulter la documentation dans `/docs`
- Vérifier les logs dans `/backend/logs`
- Vérifier les issues GitHub (si applicable)

