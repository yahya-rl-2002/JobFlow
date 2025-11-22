# Guide de Test - Intégration LinkedIn OAuth2

## Configuration initiale

### 1. Vérifier les variables d'environnement

Dans `backend/.env`, assurez-vous d'avoir :

```env
LINKEDIN_CLIENT_ID=votre_client_id
LINKEDIN_CLIENT_SECRET=votre_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
FRONTEND_URL=http://localhost:3001
```

### 2. Vérifier la configuration LinkedIn Developer Portal

1. Aller sur https://www.linkedin.com/developers/apps
2. Sélectionner votre application
3. Vérifier que l'URL de redirection est configurée :
   ```
   http://localhost:3001/auth/linkedin/callback
   ```

## Tests étape par étape

### Test 1: Obtenir l'URL d'autorisation

**Endpoint:** `GET http://localhost:3000/api/linkedin/auth-url`

**Réponse attendue:**
```json
{
  "authorization_url": "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=78g3tk7nu8h5g8&redirect_uri=...",
  "state": "random_string"
}
```

**Test avec curl:**
```bash
curl http://localhost:3000/api/linkedin/auth-url
```

### Test 2: Connexion via le frontend

1. Démarrer le frontend : `cd frontend && npm run dev`
2. Se connecter à l'application
3. Aller dans "Profil"
4. Cliquer sur "Se connecter à LinkedIn"
5. Autoriser l'application dans la popup LinkedIn
6. Vérifier que la connexion est réussie

### Test 3: Vérifier le statut du token

**Endpoint:** `GET http://localhost:3000/api/linkedin/token-status`

**Headers:**
```
Authorization: Bearer <votre_token_jwt>
```

**Réponse attendue:**
```json
{
  "connected": true,
  "expires_at": "2024-12-31T23:59:59Z",
  "expires_in": 5184000,
  "is_expired": false,
  "has_refresh_token": true,
  "scope": "r_liteprofile r_emailaddress w_member_social"
}
```

### Test 4: Récupérer le profil LinkedIn

**Endpoint:** `GET http://localhost:3000/api/linkedin/profile`

**Headers:**
```
Authorization: Bearer <votre_token_jwt>
```

**Réponse attendue:**
```json
{
  "id": "user_id",
  "localizedFirstName": "John",
  "localizedLastName": "Doe",
  ...
}
```

### Test 5: Récupérer les offres d'emploi LinkedIn

**Endpoint:** `POST http://localhost:3000/api/jobs/sync`

**Headers:**
```
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "platform": "linkedin",
  "keywords": "developer",
  "location": "Paris"
}
```

**Réponse attendue:**
```json
{
  "message": "Jobs synced successfully",
  "count": 25
}
```

### Test 6: Soumettre une candidature

1. Créer une candidature pour une offre LinkedIn
2. Appeler : `POST http://localhost:3000/api/applications/:id/submit`
3. Vérifier que la candidature est soumise (ou que l'URL est retournée)

## Tests de renouvellement de token

### Test 7: Vérifier le renouvellement automatique

1. Modifier manuellement la date d'expiration du token en base de données pour qu'il soit expiré
2. Essayer de récupérer des offres LinkedIn
3. Vérifier dans les logs que le token a été rafraîchi automatiquement

**Requête SQL pour tester:**
```sql
UPDATE linkedin_tokens 
SET expires_at = NOW() - INTERVAL '1 day' 
WHERE user_id = 1;
```

Puis appeler l'endpoint de récupération d'offres. Le token devrait être automatiquement rafraîchi.

## Dépannage

### Erreur: "Invalid redirect_uri"

**Solution:**
- Vérifier que l'URL dans `.env` correspond exactement à celle dans LinkedIn Developer Portal
- Pas de trailing slash
- Même protocole (http vs https)

### Erreur: "Invalid client_id or client_secret"

**Solution:**
- Vérifier les identifiants dans `.env`
- Vérifier que l'application est active dans LinkedIn Developer Portal

### Erreur: "Invalid scope"

**Solution:**
- Les scopes `r_liteprofile` et `r_emailaddress` peuvent ne plus être disponibles
- Essayer avec les nouveaux scopes OpenID Connect dans `LinkedInService.ts`:
  ```typescript
  private static readonly SCOPES = 'openid profile email';
  ```

### Erreur lors de la récupération des offres

**Solution:**
- Vérifier que le token est valide
- Vérifier les logs pour voir l'erreur exacte de l'API LinkedIn
- Certains endpoints nécessitent un partenariat LinkedIn Talent Solutions

### Le callback ne fonctionne pas

**Solution:**
- Vérifier que la route `/auth/linkedin/callback` est accessible
- Vérifier que le frontend écoute sur le bon port
- Vérifier les logs du backend pour voir si le callback est reçu

## Vérification de la base de données

### Vérifier les tokens stockés

```sql
SELECT 
  u.email,
  lt.access_token,
  lt.expires_at,
  lt.has_refresh_token,
  lt.scope
FROM linkedin_tokens lt
JOIN users u ON lt.user_id = u.id;
```

### Vérifier les offres LinkedIn récupérées

```sql
SELECT 
  title,
  company,
  location,
  created_at
FROM job_offers
WHERE platform = 'linkedin'
ORDER BY created_at DESC
LIMIT 10;
```

## Tests automatisés (optionnel)

Créer un script de test `test-linkedin.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"
TOKEN="your_jwt_token"

echo "1. Test auth URL..."
curl -s "$BASE_URL/linkedin/auth-url" | jq .

echo "2. Test token status..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/linkedin/token-status" | jq .

echo "3. Test profile..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/linkedin/profile" | jq .
```

## Notes importantes

1. **Rate Limits**: LinkedIn a des limites de taux. Ne pas faire trop de requêtes en peu de temps.

2. **Scopes**: Les scopes peuvent varier selon le type d'application LinkedIn. Vérifier la documentation LinkedIn pour les scopes disponibles.

3. **Endpoints API**: Les endpoints LinkedIn peuvent varier. Le code essaie plusieurs endpoints et s'adapte selon les erreurs.

4. **Sécurité**: Les tokens sont stockés en base de données. En production, considérer le chiffrement des tokens sensibles.

5. **Production**: Pour la production, utiliser HTTPS et mettre à jour les URLs de redirection dans LinkedIn Developer Portal.

