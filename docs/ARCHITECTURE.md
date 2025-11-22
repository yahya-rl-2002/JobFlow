# Architecture du Système

## Vue d'ensemble

Le système est composé de trois services principaux:

1. **Backend (Node.js + Express)**: API REST pour la gestion des données
2. **Frontend (React)**: Interface utilisateur
3. **Service NLP (Python + Flask)**: Analyse et matching de CVs

## Architecture Backend

### Structure

```
backend/
├── src/
│   ├── config/         # Configuration (DB, etc.)
│   ├── controllers/    # Contrôleurs API
│   ├── models/        # Modèles de données
│   ├── routes/        # Routes Express
│   ├── services/      # Services métier
│   ├── middleware/    # Middleware (auth, validation)
│   └── utils/         # Utilitaires
```

### Flux de données

1. **Authentification**: JWT pour la sécurité
2. **Upload CV**: Multer pour le téléchargement de fichiers
3. **Récupération offres**: Services LinkedIn/Indeed
4. **Matching**: Appel au service NLP
5. **Soumission**: Via services ou email

## Service NLP

### Modèles utilisés

- **Sentence Transformers**: Pour les embeddings sémantiques
- **BERT multilingue**: Pour la compréhension du texte
- **Scikit-learn**: Pour les calculs de similarité

### Pipeline de matching

1. Extraction des informations du CV (parsing)
2. Préparation des textes (CV + Offre)
3. Génération d'embeddings avec BERT
4. Calcul de similarité cosinus
5. Ajustement du score selon les détails

## Base de données

### Schéma principal

- **users**: Utilisateurs
- **cvs**: CVs téléchargés
- **job_offers**: Offres d'emploi
- **applications**: Candidatures
- **matching_results**: Résultats de matching
- **user_preferences**: Préférences utilisateurs

## Sécurité

- Authentification JWT
- Hashage des mots de passe (bcrypt)
- Rate limiting
- Validation des entrées
- Conformité RGPD

## Performance

- Indexation des tables pour les requêtes fréquentes
- Cache des modèles NLP
- Traitement asynchrone des tâches longues
- Rate limiting pour les APIs externes

