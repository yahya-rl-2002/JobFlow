#!/bin/bash

# Script pour démarrer le service NLP

cd "$(dirname "$0")"

# Activer l'environnement virtuel
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Environnement virtuel activé"
else
    echo "⚠️  Aucun environnement virtuel trouvé"
fi

# Vérifier que Flask est installé
python -c "import flask" 2>/dev/null || {
    echo "❌ Flask n'est pas installé. Installation..."
    pip install -r requirements.txt
}

# Démarrer le service
echo "🚀 Démarrage du service NLP sur http://localhost:5000"
python app.py

