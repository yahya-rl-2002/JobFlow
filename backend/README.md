# Backend - API REST

API Node.js + Express + TypeScript pour le système automatisé de postulation.

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` vers `.env` et configurer:

```env
PORT=3000
DB_HOST=localhost
DB_NAME=job_application_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
LINKEDIN_API_KEY=your_key
INDEED_PUBLISHER_ID=your_id
NLP_SERVICE_URL=http://localhost:5000
ENABLE_JOB_SYNC=true
```

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## Structure

- `src/controllers/` - Contrôleurs API
- `src/models/` - Modèles de données
- `src/routes/` - Routes Express
- `src/services/` - Services métier
- `src/middleware/` - Middleware (auth, validation)
- `src/config/` - Configuration

## API Endpoints

Voir `/docs/API_DOCUMENTATION.md` pour la documentation complète.

## Tests

```bash
npm test
```

