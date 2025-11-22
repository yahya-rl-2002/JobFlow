#!/usr/bin/env python3
"""
Script de test pour vérifier la configuration OpenAI
"""

import os
from dotenv import load_dotenv

load_dotenv()

def test_openai_config():
    """Teste la configuration OpenAI"""
    
    print("=" * 50)
    print("Test de Configuration OpenAI")
    print("=" * 50)
    
    # Vérifier la clé API
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        print(f"✅ OPENAI_API_KEY: Configuré ({api_key[:20]}...)")
    else:
        print("❌ OPENAI_API_KEY: Non configuré")
        return False
    
    # Vérifier le modèle
    model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    print(f"✅ OPENAI_MODEL: {model}")
    
    # Vérifier le modèle d'embedding
    embedding_model = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
    print(f"✅ OPENAI_EMBEDDING_MODEL: {embedding_model}")
    
    # Tester l'import
    try:
        from openai import OpenAI
        print("✅ Package OpenAI: Installé")
    except ImportError:
        print("❌ Package OpenAI: Non installé")
        print("   Installez avec: pip install openai")
        return False
    
    # Tester la connexion
    try:
        client = OpenAI(api_key=api_key)
        # Test simple avec un petit embedding
        response = client.embeddings.create(
            model=embedding_model,
            input="Test"
        )
        print("✅ Connexion OpenAI: Réussie")
        print(f"   Dimension de l'embedding: {len(response.data[0].embedding)}")
        return True
    except Exception as e:
        print(f"❌ Connexion OpenAI: Échouée")
        print(f"   Erreur: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_openai_config()
    print("\n" + "=" * 50)
    if success:
        print("✅ Configuration OpenAI: OK - Prêt à utiliser!")
    else:
        print("❌ Configuration OpenAI: Problème détecté")
    print("=" * 50)

