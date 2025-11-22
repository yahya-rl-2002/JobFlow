import os
import json
import logging
from typing import Dict, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class OpenAICVParser:
    """
    Parse les CVs en utilisant l'API OpenAI pour une extraction intelligente
    """
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError('OPENAI_API_KEY environment variable is required')
        
        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')  # Utilise gpt-4o-mini par défaut (plus économique)
    
    def parse_from_text(self, text: str) -> Dict:
        """
        Parse un CV à partir du texte extrait
        Utilise OpenAI pour extraire les informations structurées
        """
        try:
            prompt = self._create_parsing_prompt(text)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en recrutement et analyse de CVs. Tu extrais les informations de manière structurée et précise."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Faible température pour plus de cohérence
                response_format={"type": "json_object"}  # Force la réponse en JSON
            )
            
            # Parser la réponse JSON
            result_text = response.choices[0].message.content
            parsed_data = json.loads(result_text)
            
            # Ajouter le texte brut
            parsed_data['raw_text'] = text
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f'Error parsing OpenAI JSON response: {str(e)}')
            # Fallback: retourner une structure de base
            return self._create_fallback_structure(text)
        except Exception as e:
            logger.error(f'Error with OpenAI API: {str(e)}')
            raise
    
    def _create_parsing_prompt(self, text: str) -> str:
        """
        Crée le prompt pour OpenAI
        """
        return f"""Analyse ce CV et extrais toutes les informations importantes de manière structurée.

CV:
{text}

Extrais les informations suivantes et retourne-les au format JSON avec cette structure exacte:
{{
  "personal_info": {{
    "full_name": "Nom complet",
    "email": "email@example.com",
    "phone": "+33 6 12 34 56 78",
    "location": "Ville, Pays",
    "linkedin": "URL LinkedIn si présente",
    "website": "Site web si présent"
  }},
  "skills": ["Compétence 1", "Compétence 2", ...],
  "experience": [
    {{
      "position": "Titre du poste",
      "company": "Nom de l'entreprise",
      "location": "Lieu",
      "start_date": "MM/YYYY",
      "end_date": "MM/YYYY ou 'Present'",
      "description": "Description des responsabilités et réalisations"
    }}
  ],
  "education": [
    {{
      "degree": "Diplôme",
      "institution": "École/Université",
      "location": "Lieu",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "field_of_study": "Domaine d'études"
    }}
  ],
  "languages": [
    {{
      "language": "Langue",
      "level": "Niveau (A1, A2, B1, B2, C1, C2, Natif)"
    }}
  ],
  "certifications": [
    {{
      "name": "Nom de la certification",
      "issuer": "Organisme émetteur",
      "date": "MM/YYYY",
      "expiry_date": "MM/YYYY si applicable"
    }}
  ],
  "projects": [
    {{
      "name": "Nom du projet",
      "description": "Description",
      "technologies": ["Tech 1", "Tech 2"],
      "url": "URL si disponible"
    }}
  ],
  "summary": "Résumé professionnel ou objectif de carrière"
}}

Important:
- Si une information n'est pas disponible, utilise null ou un tableau vide
- Pour les dates, utilise le format indiqué
- Extrais toutes les compétences techniques mentionnées
- Sois précis et complet
- Retourne UNIQUEMENT le JSON, sans texte supplémentaire
"""
    
    def _create_fallback_structure(self, text: str) -> Dict:
        """
        Crée une structure de base si le parsing OpenAI échoue
        """
        return {
            'raw_text': text,
            'personal_info': {},
            'skills': [],
            'experience': [],
            'education': [],
            'languages': [],
            'certifications': [],
            'projects': [],
            'summary': None
        }
    
    def parse_from_file(self, file_path: str, extracted_text: str) -> Dict:
        """
        Parse un CV à partir d'un fichier (utilise le texte déjà extrait)
        """
        return self.parse_from_text(extracted_text)

