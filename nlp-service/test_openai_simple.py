#!/usr/bin/env python3
"""
Test simple de la connexion OpenAI avec gestion des rate limits
"""

import os
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def test_openai_connection():
    """Teste la connexion OpenAI avec retry"""
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY non configuré")
        return False
    
    client = OpenAI(api_key=api_key)
    
    print("Test de connexion OpenAI...")
    print(f"Modèle: text-embedding-3-small")
    print(f"Crédits disponibles: $4.82")
    print()
    
    # Essayer plusieurs fois avec retry
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Tentative {attempt + 1}/{max_retries}...")
            response = client.embeddings.create(
                model='text-embedding-3-small',
                input='Test de connexion OpenAI'
            )
            
            print("✅ Connexion réussie!")
            print(f"   Dimension embedding: {len(response.data[0].embedding)}")
            print(f"   Modèle utilisé: text-embedding-3-small")
            return True
            
        except Exception as e:
            error_msg = str(e)
            
            if '429' in error_msg or 'rate_limit' in error_msg.lower():
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 5
                    print(f"⚠️  Rate limit détecté. Attente de {wait_time} secondes...")
                    time.sleep(wait_time)
                else:
                    print("❌ Rate limit persistant")
                    print("   Vérifiez: https://platform.openai.com/account/rate-limits")
                    print("   Attendez quelques minutes et réessayez")
                    return False
            elif 'quota' in error_msg.lower() or 'insufficient_quota' in error_msg.lower():
                print("❌ Quota insuffisant")
                print("   Vérifiez: https://platform.openai.com/account/billing")
                return False
            else:
                print(f"❌ Erreur: {error_msg}")
                return False
    
    return False

if __name__ == "__main__":
    print("=" * 60)
    print("Test de Configuration OpenAI")
    print("=" * 60)
    print()
    
    success = test_openai_connection()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Configuration OpenAI: OK - Prêt à utiliser!")
        print()
        print("Le système peut maintenant utiliser:")
        print("  - OpenAI pour l'analyse de CV")
        print("  - OpenAI pour le matching sémantique")
        print("  - OpenAI pour l'optimisation de CV")
    else:
        print("⚠️  Problème détecté - Le système utilisera le pipeline local")
        print("   (Sentence-Transformers) en fallback")
    print("=" * 60)

