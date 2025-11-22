#!/bin/bash
# Script de test pour l'analyse de CV

echo "═══════════════════════════════════════════════════════════"
echo "           TEST D'ANALYSE DE CV"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Vérifier que le service NLP tourne
echo "1. Vérification du service NLP..."
if curl -s http://localhost:5001/health > /dev/null; then
    echo "   ✅ Service NLP actif sur le port 5001"
else
    echo "   ❌ Service NLP non accessible"
    echo "   Démarrez-le avec: cd nlp-service && python app.py"
    exit 1
fi

# Trouver un fichier CV
echo ""
echo "2. Recherche d'un fichier CV..."
CV_FILE=$(find backend/uploads -name "cv-*.pdf" 2>/dev/null | head -1)
if [ -z "$CV_FILE" ]; then
    echo "   ❌ Aucun fichier CV trouvé dans backend/uploads"
    exit 1
fi

echo "   ✅ Fichier trouvé: $CV_FILE"

# Tester l'analyse
echo ""
echo "3. Test d'analyse avec le service NLP..."
RESPONSE=$(curl -s -X POST http://localhost:5001/parse-cv \
  -H "Content-Type: application/json" \
  -d "{\"file_path\": \"$CV_FILE\"}")

if echo "$RESPONSE" | grep -q "parsed_data"; then
    echo "   ✅ Analyse réussie!"
    echo ""
    echo "   Données extraites:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
    echo "   ❌ Erreur lors de l'analyse:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

