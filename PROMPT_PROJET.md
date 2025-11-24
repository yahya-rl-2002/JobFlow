# 📋 PROMPT DU PROJET JOBFLOW

## 🎯 VUE D'ENSEMBLE DU PROJET

**JobFlow** est un système complet de gestion de carrière et de candidature automatique aux offres d'emploi, intégré avec LinkedIn via OAuth2.

### Architecture du Système

Le système est composé de **3 services principaux** :

1. **Backend (Node.js/Express/TypeScript)**
   - Port: `3000`
   - API REST pour la gestion des utilisateurs, CVs, offres d'emploi, candidatures
   - Intégration LinkedIn OAuth2
   - Base de données PostgreSQL
   - Authentification JWT

2. **Frontend (React/Vite/TypeScript)**
   - Port: `3001`
   - Interface utilisateur moderne et responsive
   - Gestion des offres d'emploi, CVs, candidatures
   - Intégration LinkedIn OAuth2 côté client

3. **NLP Service (Python/Flask)**
   - Port: `5001`
   - Scraping d'offres d'emploi depuis LinkedIn et Indeed
   - Automatisation des candidatures avec Selenium
   - Traitement des CVs et matching

---

## 🔐 STRATÉGIE D'AUTHENTIFICATION (OBLIGATOIRE)

### Flux Utilisateur

1. **Inscription/Connexion**
   - Email + Mot de passe uniquement
   - Pas de connexion LinkedIn à l'inscription

2. **Connexion LinkedIn (OBLIGATOIRE)**
   - **UNIQUEMENT** via OAuth2 dans la page **Settings**
   - URL de callback: `http://localhost:3001/auth/linkedin/callback`
   - Redirection automatique vers `/settings` après connexion
   - **AUCUNE** page Profile (supprimée)
   - **AUCUN** système de credentials email/password pour LinkedIn

3. **Candidature Automatique**
   - **UNIQUEMENT** via OAuth LinkedIn
   - Pas de credentials Indeed
   - Vérification obligatoire de la connexion LinkedIn avant candidature

### Configuration LinkedIn OAuth

- **Client ID**: Configuré dans `backend/.env`
- **Client Secret**: Configuré dans `backend/.env`
- **Redirect URI**: `http://localhost:3001/auth/linkedin/callback`
- **Scopes**: `openid`, `profile`, `email`
- **Token**: Stocké dans la table `linkedin_tokens` avec refresh token

---

## 📁 STRUCTURE DU PROJET

```
systeme Linkedin copie/
├── backend/                    # Service Node.js/Express
│   ├── src/
│   │   ├── config/            # Configuration (DB, JWT, etc.)
│   │   ├── controllers/       # Contrôleurs API
│   │   ├── models/            # Modèles de données
│   │   ├── routes/            # Routes API
│   │   ├── services/          # Services métier
│   │   └── middleware/        # Middleware (auth, etc.)
│   ├── migrations/            # Migrations SQL
│   └── .env                   # Variables d'environnement
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   │   ├── LinkedInConnect.tsx
│   │   │   ├── LinkedInRequiredBanner.tsx
│   │   │   └── Layout.tsx
│   │   ├── pages/             # Pages de l'application
│   │   │   ├── Dashboard.tsx
│   │   │   ├── JobSearch.tsx
│   │   │   ├── Settings.tsx   # Page principale pour LinkedIn
│   │   │   └── LinkedInCallback.tsx
│   │   ├── services/          # Services API
│   │   └── contexts/          # Contextes React (Auth)
│   └── vite.config.ts
│
└── nlp-service/               # Service Python/Flask
    ├── services/
    │   ├── linkedin_scraper.py
    │   └── job_application_automator.py
    └── app.py
```

---

## 🔄 FONCTIONNALITÉS PRINCIPALES

### 1. Gestion des Offres d'Emploi

- **Synchronisation automatique** depuis LinkedIn et Indeed
- **Recherche** par mots-clés, localisation, type de poste
- **Filtres** : date de publication, télétravail, plateforme
- **Affichage** des offres avec détails (salaire, localisation, entreprise)

### 2. Candidature Automatique

- **Sélection multiple** d'offres
- **Choix du CV** à utiliser
- **Candidature en masse** via Selenium
- **Suivi** des candidatures (statut, date, score de matching)

### 3. Gestion des CVs

- **Upload** de CVs (PDF, DOCX)
- **Stockage** sécurisé sur le serveur
- **Sélection** du CV pour les candidatures

### 4. Connexion LinkedIn (Obligatoire)

- **OAuth2** via la page Settings
- **Vérification automatique** du statut sur toutes les pages
- **Banner d'alerte** si non connecté
- **Synchronisation** entre toutes les pages

---

## 🛠️ TECHNOLOGIES UTILISÉES

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **PostgreSQL** (base de données)
- **JWT** (authentification)
- **Axios** (requêtes HTTP)
- **Winston** (logging)
- **dotenv** (variables d'environnement)

### Frontend
- **React** 18
- **Vite** (build tool)
- **TypeScript**
- **React Router** (routing)
- **Axios** (API client)
- **React Query** (gestion d'état)
- **React Toastify** (notifications)
- **React Icons** (icônes)

### NLP Service
- **Python** 3.x
- **Flask** (API)
- **Selenium** (automatisation navigateur)
- **BeautifulSoup4** (scraping)
- **webdriver-manager** (gestion ChromeDriver)

---

## 🔧 PROBLÈMES RÉSOLUS RÉCEMMENT

### 1. Synchronisation LinkedIn entre Pages
**Problème**: La page JobSearch n'affichait pas le statut LinkedIn correct après connexion dans Settings.

**Solution**:
- Vérification automatique toutes les 10 secondes
- Événement `linkedin-connected` pour synchroniser toutes les pages
- Vérification quand la page redevient visible
- Mise à jour automatique du statut

### 2. Stratégie d'Authentification
**Problème**: Confusion entre connexion email/password et OAuth LinkedIn.

**Solution**:
- Connexion LinkedIn **UNIQUEMENT** via OAuth dans Settings
- Suppression de la page Profile
- Redirection automatique vers Settings après connexion
- Candidature **UNIQUEMENT** via OAuth LinkedIn

### 3. Vérification du Statut LinkedIn
**Problème**: Pas de moyen simple de vérifier si LinkedIn est connecté.

**Solution**:
- Affichage détaillé du statut dans Settings
- Banner d'alerte sur toutes les pages si non connecté
- Vérification avant chaque candidature
- Messages d'erreur clairs

---

## 📊 BASE DE DONNÉES

### Tables Principales

- **users**: Utilisateurs (email, password hash)
- **linkedin_tokens**: Tokens OAuth LinkedIn (access_token, refresh_token, expires_at)
- **cvs**: CVs uploadés (file_path, file_name, user_id)
- **job_offers**: Offres d'emploi synchronisées (title, company, url, platform)
- **applications**: Candidatures (job_offer_id, cv_id, status, submission_status)
- **user_preferences**: Préférences utilisateur (default_cover_letter, etc.)

---

## 🚀 DÉMARRAGE DU SYSTÈME

### Prérequis
- Node.js 18+
- Python 3.9+
- PostgreSQL
- Chrome/Chromium (pour Selenium)

### Commandes de Démarrage

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# NLP Service
cd nlp-service
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### URLs
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000/api`
- NLP Service: `http://localhost:5001`

---

## 🔑 VARIABLES D'ENVIRONNEMENT

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobflow
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/auth/linkedin/callback
FRONTEND_URL=http://localhost:3001
NLP_SERVICE_URL=http://127.0.0.1:5001
```

### NLP Service (.env)
```env
FLASK_PORT=5001
OPENAI_API_KEY=your_openai_key  # Optionnel
```

---

## 📝 ÉTAT ACTUEL DU PROJET

### ✅ Fonctionnalités Complètes
- [x] Authentification email/password
- [x] Connexion LinkedIn OAuth2
- [x] Synchronisation offres d'emploi
- [x] Upload et gestion de CVs
- [x] Candidature automatique (LinkedIn uniquement)
- [x] Suivi des candidatures
- [x] Dashboard avec statistiques
- [x] Page Settings pour configuration LinkedIn

### 🔄 En Cours
- Synchronisation automatique du statut LinkedIn entre pages
- Amélioration des messages d'erreur
- Optimisation de la candidature automatique

### 📋 À Faire (Optionnel)
- Support Indeed (si nécessaire)
- Matching intelligent CV/Offres
- Notifications email
- Export de données

---

## 🎯 OBJECTIF PRINCIPAL

Créer un système complet où :
1. L'utilisateur s'inscrit avec email/password
2. L'utilisateur **DOIT** connecter LinkedIn via OAuth dans Settings
3. L'utilisateur peut rechercher et synchroniser des offres d'emploi
4. L'utilisateur peut postuler automatiquement aux offres sélectionnées
5. Toutes les candidatures sont tracées et suivies

---

## 🔍 POINTS D'ATTENTION

1. **LinkedIn OAuth est OBLIGATOIRE** pour utiliser le système
2. **Pas de credentials email/password** pour LinkedIn (OAuth uniquement)
3. **Page Profile supprimée** - tout est dans Settings
4. **Candidature uniquement via OAuth LinkedIn** - pas de credentials Indeed
5. **Synchronisation automatique** du statut LinkedIn sur toutes les pages

---

## 📞 SUPPORT

Pour toute question ou problème :
- Vérifier les logs backend (`backend/logs/`)
- Vérifier la console navigateur (F12)
- Vérifier le statut LinkedIn dans Settings
- Vérifier que tous les services sont démarrés

---

**Dernière mise à jour**: Janvier 2025
**Version**: 1.0.0

