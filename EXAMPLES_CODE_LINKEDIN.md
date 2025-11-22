# Exemples de Code Complets - Intégration LinkedIn

Ce document contient des exemples de code complets et prêts à l'emploi pour chaque étape de l'intégration LinkedIn OAuth2.

## 📚 Documentation Complète

Consultez `docs/LINKEDIN_COMPLETE_GUIDE.md` pour le guide détaillé avec explications.

## 🚀 Exemples Rapides

### 1. Authentification OAuth2

#### Obtenir l'URL d'autorisation

```typescript
// Backend: GET /api/linkedin/auth-url
const { authorization_url, state } = await linkedinService.getAuthorizationUrl();

// Rediriger l'utilisateur vers authorization_url
```

#### Échanger le code contre un token

```typescript
// Backend: POST /api/linkedin/connect
const { authorization_code } = req.body;
const tokenData = await LinkedInService.exchangeCodeForToken(authorization_code);
await LinkedInService.saveToken(userId, tokenData);
```

### 2. Récupérer les offres d'emploi

```typescript
// Backend: POST /api/jobs/sync
const jobs = await LinkedInService.fetchJobs(userId, {
  keywords: 'developer',
  location: 'Paris',
  limit: 25,
});
```

### 3. Soumettre une candidature

```typescript
// Backend: POST /api/applications/:id/submit
const result = await LinkedInService.submitApplication(
  userId,
  jobId,
  cvPath,
  coverLetter
);
```

### 4. Gestion RGPD

#### Exporter les données

```typescript
// Backend: GET /api/rgpd/export
const data = await RGPDService.exportUserData(userId);
// Retourne un JSON avec toutes les données de l'utilisateur
```

#### Supprimer les données

```typescript
// Backend: DELETE /api/rgpd/delete
await RGPDService.deleteUserData(userId);
// Supprime toutes les données de l'utilisateur
```

## 🔐 Sécurité

### Chiffrement des tokens

Les tokens sont automatiquement chiffrés avant stockage en base de données :

```typescript
// Configuration requise dans .env
ENCRYPTION_KEY=your-very-secure-encryption-key

// Le chiffrement est automatique dans LinkedInService.saveToken()
```

### Gestion des erreurs

```typescript
try {
  await LinkedInService.fetchJobs(userId, params);
} catch (error) {
  if (error instanceof LinkedInTokenError) {
    // Token expiré, demander à l'utilisateur de se reconnecter
  } else if (error instanceof LinkedInRateLimitError) {
    // Rate limit, attendre avant de réessayer
  } else if (error instanceof LinkedInAPIError) {
    // Erreur API LinkedIn
  }
}
```

## 📝 Configuration

### Variables d'environnement

```env
# LinkedIn OAuth2
LINKEDIN_CLIENT_ID=votre_client_id
LINKEDIN_CLIENT_SECRET=votre_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback

# Sécurité
ENCRYPTION_KEY=your-very-secure-encryption-key-change-in-production

# Environnement
NODE_ENV=production
```

## 🧪 Tests

Voir `TEST_LINKEDIN.md` pour des exemples de tests complets.

## 📖 Documentation Complète

- Guide complet : `docs/LINKEDIN_COMPLETE_GUIDE.md`
- Configuration : `docs/LINKEDIN_OAUTH_SETUP.md`
- Tests : `TEST_LINKEDIN.md`

