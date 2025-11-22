# Configuration LinkedIn OAuth2

## Informations d'identification

Vos identifiants LinkedIn ont été configurés :
- **Client ID**: `78g3tk7nu8h5g8`
- **Client Secret**: `[REDACTED]`

## Configuration dans LinkedIn Developer Portal

### 1. Vérifier les paramètres de l'application

1. Aller sur https://www.linkedin.com/developers/apps
2. Sélectionner votre application
3. Vérifier les paramètres suivants :

**Authorized redirect URLs:**
```
http://localhost:3001/auth/linkedin/callback
http://localhost:3000/api/linkedin/callback
```

**Scopes autorisés:**
- `r_liteprofile` - Accès au profil de base
- `r_emailaddress` - Accès à l'email
- `w_member_social` - Permissions d'écriture (pour les candidatures)

⚠️ **Note importante**: LinkedIn a migré vers OpenID Connect. Les scopes `r_liteprofile` et `r_emailaddress` sont des anciens scopes qui peuvent ne plus être disponibles. Si vous rencontrez des erreurs, vous devrez peut-être utiliser les nouveaux scopes :
- `openid`
- `profile`
- `email`

## Configuration du backend

### Variables d'environnement

Dans `backend/.env`, configurez :

```env
LINKEDIN_CLIENT_ID=votre_client_id
LINKEDIN_CLIENT_SECRET=votre_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
FRONTEND_URL=http://localhost:3001
```

## Flux d'authentification

### 1. Obtenir l'URL d'autorisation

**Endpoint:** `GET /api/linkedin/auth-url`

**Réponse:**
```json
{
  "authorization_url": "https://www.linkedin.com/oauth/v2/authorization?...",
  "state": "random_state_string"
}
```

### 2. Redirection de l'utilisateur

Rediriger l'utilisateur vers `authorization_url`. LinkedIn affichera une page de consentement.

### 3. Callback OAuth

Après autorisation, LinkedIn redirige vers :
```
http://localhost:3001/auth/linkedin/callback?code=AUTHORIZATION_CODE&state=STATE
```

### 4. Échanger le code contre un token

**Endpoint:** `POST /api/linkedin/connect`

**Body:**
```json
{
  "authorization_code": "AUTHORIZATION_CODE_FROM_CALLBACK"
}
```

**Réponse:**
```json
{
  "message": "LinkedIn connected successfully",
  "profile": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Utilisation

### Vérifier le statut de connexion

**Endpoint:** `GET /api/linkedin/token-status`

**Réponse:**
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

### Récupérer le profil

**Endpoint:** `GET /api/linkedin/profile`

### Récupérer les offres d'emploi

Une fois connecté, les offres LinkedIn seront automatiquement récupérées lors de la synchronisation :

**Endpoint:** `POST /api/jobs/sync`

**Body:**
```json
{
  "platform": "linkedin",
  "keywords": "developer",
  "location": "Paris"
}
```

### Soumettre une candidature

**Endpoint:** `POST /api/applications/:id/submit`

Le système utilisera automatiquement le token LinkedIn de l'utilisateur.

## Gestion automatique des tokens

Le système gère automatiquement :

1. **Renouvellement automatique**: Si un token est sur le point d'expirer, il est automatiquement rafraîchi
2. **Stockage sécurisé**: Les tokens sont stockés en base de données, associés à l'utilisateur
3. **Refresh token**: Utilisé pour obtenir de nouveaux tokens d'accès sans ré-authentification

## Déconnexion

**Endpoint:** `DELETE /api/linkedin/disconnect`

Supprime le token LinkedIn de l'utilisateur.

## Dépannage

### Erreur: "Invalid redirect_uri"

- Vérifier que l'URL de redirection dans `.env` correspond exactement à celle configurée dans LinkedIn Developer Portal
- Les URLs doivent correspondre exactement (pas de trailing slash, même protocole)

### Erreur: "Invalid client_id or client_secret"

- Vérifier que les identifiants dans `.env` sont corrects
- Vérifier que l'application est active dans LinkedIn Developer Portal

### Erreur: "Invalid scope"

- Les scopes `r_liteprofile` et `r_emailaddress` peuvent ne plus être disponibles
- Essayer avec les nouveaux scopes OpenID Connect : `openid profile email`

### Erreur lors de la récupération des offres

- Vérifier que les scopes incluent les permissions nécessaires
- Certains endpoints LinkedIn nécessitent un partenariat LinkedIn Talent Solutions
- Vérifier les logs pour plus de détails sur l'erreur API

## API LinkedIn pour les offres d'emploi

⚠️ **Important**: LinkedIn n'offre pas d'API publique standard pour la recherche d'emploi. Les endpoints peuvent varier selon :

1. **Type d'accès**: Partenariat LinkedIn Talent Solutions
2. **Scopes disponibles**: Certains endpoints nécessitent des permissions spéciales
3. **Version de l'API**: LinkedIn utilise différentes versions d'API

Le code implémenté essaie plusieurs endpoints et s'adapte selon les erreurs rencontrées.

## Sécurité

- Les tokens sont stockés de manière sécurisée en base de données
- Les tokens sont associés à l'utilisateur authentifié
- Le refresh token est utilisé pour éviter de demander une nouvelle autorisation
- Les tokens expirent automatiquement et sont renouvelés si nécessaire

## Test

Pour tester l'intégration :

1. Démarrer le backend
2. Se connecter à l'application
3. Appeler `GET /api/linkedin/auth-url` pour obtenir l'URL d'autorisation
4. Rediriger l'utilisateur vers cette URL
5. Après autorisation, utiliser le code pour appeler `POST /api/linkedin/connect`
6. Vérifier le statut avec `GET /api/linkedin/token-status`
7. Tester la récupération d'offres avec `POST /api/jobs/sync`

