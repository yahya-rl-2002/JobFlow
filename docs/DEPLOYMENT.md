# Guide de Déploiement

## Prérequis

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- npm/yarn

## Installation

### 1. Base de données

```bash
# Créer la base de données
createdb job_application_db

# Les tables seront créées automatiquement au démarrage du backend
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

### 3. Service NLP

```bash
cd nlp-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration Production

### Variables d'environnement

#### Backend (.env)
```env
NODE_ENV=production
DB_HOST=your_db_host
DB_PASSWORD=your_secure_password
JWT_SECRET=your_very_secure_secret
LINKEDIN_API_KEY=your_key
INDEED_PUBLISHER_ID=your_id
```

#### Service NLP (.env)
```env
PORT=5000
CV_OUTPUT_DIR=/path/to/output
```

### Déploiement avec Docker (optionnel)

Créer des Dockerfiles pour chaque service et utiliser docker-compose.

## Sécurité

- Utiliser HTTPS en production
- Configurer des secrets forts
- Activer le rate limiting
- Configurer CORS correctement
- Utiliser un reverse proxy (Nginx)

## Monitoring

- Logs: Winston pour le backend
- Health checks: `/health` endpoints
- Monitoring des performances

