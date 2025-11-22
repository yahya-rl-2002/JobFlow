# Service NLP - Matching et Optimisation de CV

Service Python Flask pour l'analyse, le matching et l'optimisation de CVs.

## Fonctionnalités

- **Parsing de CV**: Extraction d'informations structurées depuis PDF/DOCX
- **Matching CV-Offres**: Algorithme de matching basé sur BERT
- **Optimisation de CV**: Personnalisation automatique pour chaque offre

## Installation

```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Télécharger les modèles spaCy (optionnel)
python -m spacy download fr_core_news_sm
python -m spacy download en_core_web_sm
```

## Configuration

Créer un fichier `.env`:

```env
PORT=5000
CV_OUTPUT_DIR=./optimized_cvs
```

## Démarrage

```bash
# Mode développement
python app.py

# Mode production avec Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### POST /parse-cv
Parse un CV et extrait les informations structurées.

**Request:**
```json
{
  "file_path": "/path/to/cv.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "parsed_data": {
    "personal_info": {...},
    "skills": [...],
    "experience": [...],
    "education": [...]
  }
}
```

### POST /match
Match un CV avec plusieurs offres d'emploi.

**Request:**
```json
{
  "cv_data": {...},
  "jobs": [
    {
      "id": 1,
      "title": "Développeur Full Stack",
      "description": "...",
      "requirements": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "job_id": 1,
      "score": 85.5,
      "details": {...}
    }
  ]
}
```

### POST /customize-cv
Personnalise un CV pour une offre spécifique.

**Request:**
```json
{
  "cv_path": "/path/to/cv.pdf",
  "job_description": "...",
  "job_requirements": "...",
  "job_title": "..."
}
```

**Response:**
```json
{
  "success": true,
  "customized_path": "/path/to/cv_optimized.docx",
  "changes": [...],
  "match_improvements": {...}
}
```

## Modèles utilisés

- **Sentence Transformers**: `paraphrase-multilingual-MiniLM-L12-v2` pour les embeddings multilingues
- **BERT**: Pour la compréhension sémantique du texte

## Performance

Le service est optimisé pour traiter plusieurs CVs et offres simultanément. Les modèles sont chargés une fois au démarrage pour améliorer les performances.

