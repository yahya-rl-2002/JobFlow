# Intégration LinkedIn et Indeed

## LinkedIn

### Limitations importantes

⚠️ **LinkedIn n'offre pas d'API publique pour la recherche d'emploi.**

### Options disponibles

1. **LinkedIn Talent Solutions API** (Partenariat requis)
   - Nécessite un partenariat avec LinkedIn
   - Accès aux offres d'emploi via API officielle
   - Coûteux mais conforme aux ToS

2. **Web Scraping** (Risqué)
   - Violation potentielle des ToS
   - Nécessite un respect strict des rate limits
   - Risque de blocage IP
   - **Non recommandé**

3. **Services tiers autorisés**
   - Utiliser des services qui ont des accords avec LinkedIn
   - Vérifier la légalité avant utilisation

### Recommandation

Pour un système de production, il est recommandé de:
- Contacter LinkedIn pour un partenariat
- Utiliser des services tiers légitimes
- Implémenter une solution manuelle (redirection vers LinkedIn)

## Indeed

### API Publisher

Indeed offre une API gratuite avec limitations:

1. **Inscription**
   - Créer un compte sur https://ads.indeed.com/jobroll
   - Obtenir un Publisher ID

2. **Limitations**
   - Maximum 25 résultats par requête
   - Rate limit: ~1 requête/seconde
   - Données limitées (pas toutes les informations)

3. **Utilisation**
   - API REST simple
   - Documentation: https://ads.indeed.com/jobroll/xmlfeed

### Exemple de requête

```
GET https://api.indeed.com/ads/apisearch?publisher=YOUR_PUBLISHER_ID&v=2&format=json&q=developer&l=Paris&limit=25
```

### Soumission de candidatures

⚠️ **Indeed n'offre pas d'API pour soumettre des candidatures.**

Options:
1. Rediriger l'utilisateur vers la page Indeed
2. Web automation (avec respect strict des ToS)
3. Email de candidature si disponible

## Conformité et ToS

### Points importants

1. **Respecter les rate limits**
   - Ne pas surcharger les serveurs
   - Implémenter des délais entre requêtes

2. **Respecter les robots.txt**
   - Vérifier les règles de scraping
   - Respecter les restrictions

3. **Authentification**
   - Utiliser les APIs officielles quand disponibles
   - Ne pas partager les credentials

4. **Données personnelles**
   - Respecter le RGPD
   - Ne pas stocker de données sans consentement

## Alternatives

Si les APIs ne sont pas disponibles:

1. **Intégration manuelle**
   - L'utilisateur copie-colle les offres
   - Import CSV/JSON

2. **Services d'agrégation**
   - Utiliser des services qui agrègent les offres
   - Vérifier la légalité

3. **Partenariats**
   - Contacter directement les plateformes
   - Négocier un accès API

## Recommandations finales

1. **Pour LinkedIn**: Chercher un partenariat ou utiliser des services tiers
2. **Pour Indeed**: Utiliser l'API Publisher avec respect des limites
3. **Pour la soumission**: Implémenter une redirection ou un processus manuel
4. **Toujours**: Respecter les ToS et les réglementations

