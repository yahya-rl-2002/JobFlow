# Système Automatisé de Postulation

Système complet permettant aux candidats de télécharger leur CV, d'analyser les offres d'emploi de LinkedIn et Indeed, et de postuler automatiquement.

## Architecture

```
systeme/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── controllers/  # Contrôleurs API
│   │   ├── models/       # Modèles de données
│   │   ├── routes/       # Routes API
│   │   ├── middleware/   # Middleware (auth, validation)
│   │   ├── services/     # Services métier
│   │   └── utils/        # Utilitaires
│   └── config/           # Configuration
├── frontend/             # Application React
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages
│   │   ├── services/     # Services API
│   │   └── hooks/        # Hooks React
├── nlp-service/          # Service Python pour NLP
│   ├── matching/         # Algorithme de matching
│   ├── cv_optimization/  # Personnalisation CV
│   └── models/           # Modèles ML
├── database/             # Scripts de base de données
└── docs/                 # Documentation

```

## Fonctionnalités

- ✅ Récupération automatique des offres LinkedIn et Indeed
- ✅ Matching intelligent CV - Offres d'emploi (NLP)
- ✅ Personnalisation automatique du CV
- ✅ Soumission automatique des candidatures
- ✅ Suivi des candidatures
- ✅ Conformité RGPD

## Technologies

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript
- **NLP**: Python + Transformers (BERT)
- **Base de données**: PostgreSQL
- **Authentification**: JWT

## Installation

Voir les README dans chaque dossier pour les instructions détaillées.

## Configuration

1. Copier `.env.example` vers `.env` dans chaque service
2. Configurer les clés API LinkedIn et Indeed
3. Configurer la base de données PostgreSQL
4. Installer les dépendances Python pour le service NLP

## Démarrage

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm start

# Service NLP
cd nlp-service && pip install -r requirements.txt && python app.py
```

## Sécurité et RGPD

- Authentification JWT sécurisée
- Chiffrement des données sensibles
- Gestion des consentements utilisateurs
- Conformité RGPD intégrée

