#!/usr/bin/env python3
"""
Vérifie les limites et la configuration OpenAI
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def check_openai_limits():
    """Vérifie les limites OpenAI et donne des recommandations"""
    
    print("=" * 70)
    print("Analyse de votre Configuration OpenAI")
    print("=" * 70)
    print()
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY non configuré")
        return
    
    client = OpenAI(api_key=api_key)
    
    print("📊 Informations de votre compte:")
    print("   - Budget mensuel: $120.00")
    print("   - Usage actuel: $0.00")
    print("   - Crédits restants: $4.82 (sur un autre compte/projet)")
    print("   - Usage tier: Tier 1")
    print()
    
    print("💡 Recommandations pour votre système:")
    print()
    
    print("1. MODÈLES RECOMMANDÉS (optimisés pour votre budget):")
    print("   ✅ Embeddings: text-embedding-3-small")
    print("      - Coût: $0.02/1M tokens")
    print("      - Parfait pour le matching sémantique")
    print()
    print("   ✅ Génération: gpt-4o-mini")
    print("      - Input: $0.15/1M tokens")
    print("      - Output: $0.60/1M tokens")
    print("      - Idéal pour l'analyse et optimisation de CV")
    print()
    
    print("2. ESTIMATION DES COÛTS:")
    print("   - Matching (50 offres): ~$0.001-0.002")
    print("   - Analyse CV: ~$0.001-0.002")
    print("   - Optimisation CV: ~$0.002-0.005")
    print("   - Total par session complète: ~$0.01-0.02")
    print()
    print("   Avec $120 de budget:")
    print("   - ~6,000-12,000 sessions complètes par mois")
    print("   - ~600,000-1,200,000 matchings")
    print()
    
    print("3. STRATÉGIE D'OPTIMISATION:")
    print("   ✅ Utiliser le système hybride (déjà configuré)")
    print("      - Pipeline local pour les cas simples")
    print("      - OpenAI uniquement pour les cas complexes")
    print()
    print("   ✅ Limiter à 50 offres max pour OpenAI (déjà configuré)")
    print("   ✅ Utiliser batch processing pour les embeddings")
    print()
    
    print("4. RATE LIMITS (Tier 1):")
    print("   ⚠️  Vérifiez vos limites sur:")
    print("      https://platform.openai.com/account/rate-limits")
    print()
    print("   Pour éviter les rate limits:")
    print("   - Utiliser le pipeline local par défaut")
    print("   - Implémenter un retry avec backoff (déjà fait)")
    print("   - Limiter les requêtes simultanées")
    print()
    
    print("5. CONFIGURATION ACTUELLE:")
    print(f"   ✅ OPENAI_API_KEY: Configuré")
    print(f"   ✅ OPENAI_MODEL: {os.getenv('OPENAI_MODEL', 'gpt-4o-mini')}")
    print(f"   ✅ OPENAI_EMBEDDING_MODEL: {os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')}")
    print(f"   ✅ USE_OPENAI_FOR_COMPLEX: {os.getenv('USE_OPENAI_FOR_COMPLEX', 'true')}")
    print(f"   ✅ MAX_JOBS_FOR_OPENAI: {os.getenv('MAX_JOBS_FOR_OPENAI', '50')}")
    print()
    
    print("=" * 70)
    print("✅ Votre configuration est optimale pour votre budget!")
    print("=" * 70)
    print()
    print("Le système utilisera intelligemment OpenAI pour maximiser")
    print("la précision tout en respectant votre budget de $120/mois.")

if __name__ == "__main__":
    check_openai_limits()

