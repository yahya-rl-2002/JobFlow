# Guide de Démarrage Rapide

## 🚀 Démarrage en 5 minutes

### 1. Prérequis

Assurez-vous d'avoir installé:
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### 2. Configuration de la base de données

```bash
# Créer la base de données
createdb job_application_db
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

Le backend démarre sur `http://localhost:3000`

### 4. Service NLP

```bash
cd nlp-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Le service NLP démarre sur `http://localhost:5000`

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre sur `http://localhost:3001`

## 📋 Checklist de Configuration

- [ ] Base de données PostgreSQL créée
- [ ] Variables d'environnement backend configurées (`.env`)
- [ ] Variables d'environnement NLP configurées (optionnel)
- [ ] Clés API LinkedIn/Indeed configurées (si disponibles)
- [ ] Dossiers `uploads/` et `logs/` créés dans backend
- [ ] Dossier `optimized_cvs/` créé dans nlp-service

## 🔑 Variables d'environnement essentielles

### Backend (.env)
```env
DB_HOST=localhost
DB_NAME=job_application_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_very_secure_secret
NLP_SERVICE_URL=http://localhost:5000
```

### Service NLP (.env)
```env
PORT=5000
CV_OUTPUT_DIR=./optimized_cvs
```

## ⚠️ Notes importantes

1. **LinkedIn API**: LinkedIn n'offre pas d'API publique. Voir `docs/LINKEDIN_INDEED_INTEGRATION.md` pour les options.

2. **Indeed API**: Inscription requise sur https://ads.indeed.com/jobroll pour obtenir un Publisher ID.

3. **Premier démarrage**: Les tables de base de données sont créées automatiquement au premier démarrage du backend.

4. **Modèles NLP**: Les modèles sont téléchargés automatiquement au premier usage. Cela peut prendre quelques minutes.

## 🧪 Test rapide

1. Accéder à `http://localhost:3001`
2. Créer un compte
3. Uploader un CV
4. Synchroniser des offres
5. Tester le matching

## 📚 Documentation complète

- Architecture: `docs/ARCHITECTURE.md`
- Guide d'implémentation: `docs/IMPLEMENTATION_GUIDE.md`
- API: `docs/API_DOCUMENTATION.md`
- Déploiement: `docs/DEPLOYMENT.md`
- Intégration APIs: `docs/LINKEDIN_INDEED_INTEGRATION.md`

## 🆘 Problèmes courants

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `.env`

### Service NLP ne répond pas
- Vérifier que le service est démarré
- Vérifier le port (5000)
- Vérifier les logs

### Erreur CORS
- Vérifier que `CORS_ORIGIN` dans backend `.env` correspond à l'URL du frontend

## 🎯 Prochaines étapes

1. Configurer les APIs LinkedIn/Indeed (voir documentation)
2. Personnaliser les préférences utilisateur
3. Tester le matching avec vos CVs
4. Configurer la synchronisation automatique

Bon développement ! 🚀

