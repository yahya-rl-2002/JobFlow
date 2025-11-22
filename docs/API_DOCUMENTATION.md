# Documentation API

## Base URL

```
http://localhost:3000/api
```

## Authentification

Toutes les routes (sauf `/auth/*`) nécessitent un token JWT dans le header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentification

#### POST /auth/register
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "gdpr_consent": true
}
```

#### POST /auth/login
Connexion.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### CVs

#### POST /cv/upload
Télécharger un CV.

**Form Data:**
- `cv`: File (PDF, DOC, DOCX)

#### GET /cv
Récupérer tous les CVs de l'utilisateur.

#### POST /cv/:id/parse
Parser un CV pour extraire les informations.

### Offres d'emploi

#### GET /jobs/search
Rechercher des offres.

**Query params:**
- `platform`: linkedin | indeed
- `location`: string
- `keywords`: string
- `limit`: number
- `offset`: number

#### POST /jobs/sync
Synchroniser les offres depuis les plateformes.

**Body:**
```json
{
  "platform": "linkedin",
  "keywords": "developer",
  "location": "Paris"
}
```

### Candidatures

#### GET /applications
Récupérer toutes les candidatures.

#### POST /applications
Créer une candidature.

**Body:**
```json
{
  "job_offer_id": 1,
  "cv_id": 1,
  "match_score": 85.5
}
```

#### POST /applications/:id/submit
Soumettre une candidature.

### Matching

#### POST /matching/match
Matcher un CV avec des offres.

**Body:**
```json
{
  "cv_id": 1,
  "job_ids": [1, 2, 3]
}
```

## Service NLP

### Base URL

```
http://localhost:5000
```

### Endpoints

#### POST /parse-cv
Parser un CV.

#### POST /match
Matcher CV avec offres.

#### POST /customize-cv
Personnaliser un CV.

