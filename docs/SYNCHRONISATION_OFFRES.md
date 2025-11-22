# Guide de Synchronisation des Offres d'Emploi

## 📋 Vue d'ensemble

Le système de synchronisation automatique récupère les offres d'emploi depuis LinkedIn et Indeed, les stocke dans la base de données avec prévention des doublons, et nettoie automatiquement les offres obsolètes.

## 🔧 Configuration

### Variables d'environnement

Ajoutez dans `backend/.env` :

```env
# Activer/désactiver la synchronisation automatique
ENABLE_JOB_SYNC=true

# Planification Cron (par défaut: toutes les heures)
# Format: "minute heure jour mois jour-semaine"
# Exemples:
#   "0 * * * *"     = toutes les heures
#   "0 0 * * *"     = tous les jours à minuit
#   "0 */6 * * *"   = toutes les 6 heures
#   "0 0 * * 0"     = tous les dimanches à minuit
JOB_SYNC_CRON=0 * * * *

# Secret pour les webhooks (optionnel)
WEBHOOK_SECRET=votre_secret_ici
```

### Structure de la base de données

La table `job_offers` inclut :
- `external_id` : Identifiant unique (UNIQUE constraint pour éviter les doublons)
- `skills_required` : Tableau de compétences extraites automatiquement
- `posted_date` : Date de publication
- `is_active` : Statut actif/inactif

## 🚀 Fonctionnalités

### 1. Synchronisation automatique

Le service s'exécute automatiquement selon le planning configuré :
- Récupération depuis LinkedIn et Indeed
- Extraction automatique des compétences
- Détection des nouvelles offres vs mises à jour
- Prévention des doublons via `ON CONFLICT`

### 2. Extraction des compétences

Le système extrait automatiquement les compétences depuis :
- La description de l'offre
- Les requirements
- Les patterns comme "Compétences:", "Skills:", etc.

Compétences détectées automatiquement :
- Technologies : JavaScript, Python, React, Node.js, etc.
- Frameworks : Django, Flask, Express, etc.
- Outils : Docker, Kubernetes, AWS, etc.
- Méthodologies : Agile, Scrum, DevOps, etc.

### 3. Nettoyage automatique

- **Offres inactives** : Marquées comme `is_active = false` après 30 jours
- **Suppression définitive** : Supprimées après 90 jours d'inactivité
- **Exécution** : Tous les jours à 2h du matin

### 4. Gestion des erreurs

- **Retry automatique** : 3 tentatives avec backoff exponentiel
- **Logs détaillés** : Chaque étape est loggée
- **Statistiques** : Suivi des nouvelles offres, mises à jour, erreurs

### 5. Webhooks

Endpoint disponible pour recevoir des notifications en temps réel :
- `POST /api/webhooks/jobs` : Recevoir des notifications
- `GET /api/webhooks/jobs` : Vérification de l'endpoint

## 📊 API Endpoints

### Synchronisation manuelle

```bash
POST /api/jobs/sync/force
Content-Type: application/json
Authorization: Bearer <token>

{
  "keywords": "developer",
  "location": "Paris, France"
}
```

### Statistiques de synchronisation

```bash
GET /api/jobs/sync/stats
Authorization: Bearer <token>
```

Réponse :
```json
{
  "linkedin": {
    "fetched": 50,
    "new": 30,
    "updated": 20,
    "errors": 0
  },
  "indeed": {
    "fetched": 45,
    "new": 25,
    "updated": 20,
    "errors": 0
  },
  "total": {
    "fetched": 95,
    "new": 55,
    "updated": 40,
    "errors": 0
  },
  "duration": 45000
}
```

### Nettoyage manuel

```bash
POST /api/jobs/cleanup
Content-Type: application/json
Authorization: Bearer <token>

{
  "daysOld": 30
}
```

## 🔄 Prévention des doublons

Le système utilise `ON CONFLICT (external_id)` pour :
- **Détecter** les offres existantes
- **Mettre à jour** les informations si l'offre existe
- **Insérer** si c'est une nouvelle offre

Exemple SQL :
```sql
INSERT INTO job_offers (external_id, title, company, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (external_id) DO UPDATE SET
  title = EXCLUDED.title,
  company = EXCLUDED.company,
  updated_at = CURRENT_TIMESTAMP
```

## 📈 Logs et surveillance

### Logs de synchronisation

Chaque synchronisation génère des logs détaillés :
```
[INFO] Starting job synchronization...
[INFO] Fetched 50 jobs from LinkedIn
[INFO] New job: linkedin_12345 (Développeur Full Stack)
[INFO] Updated job: indeed_67890 (Ingénieur Software)
[INFO] Job synchronization completed
  duration: 45000ms
  linkedin: { fetched: 50, new: 30, updated: 20, errors: 0 }
  indeed: { fetched: 45, new: 25, updated: 20, errors: 0 }
```

### Surveillance recommandée

- **Prometheus** : Exporter les métriques
- **Grafana** : Tableaux de bord de visualisation
- **Alertes** : Notifications en cas d'erreurs répétées

## ⚙️ Personnalisation

### Modifier la fréquence de synchronisation

```env
# Toutes les 30 minutes
JOB_SYNC_CRON=*/30 * * * *

# Tous les jours à 6h du matin
JOB_SYNC_CRON=0 6 * * *
```

### Modifier l'âge des offres à nettoyer

```typescript
// Dans JobSyncService.cleanupOldJobs()
await JobSyncService.cleanupOldJobs(60); // 60 jours au lieu de 30
```

### Ajouter des compétences personnalisées

Modifier la méthode `extractSkills()` dans `JobSyncService.ts` :

```typescript
const customSkills = ['votre_compétence_1', 'votre_compétence_2'];
commonSkills.push(...customSkills);
```

## 🐛 Dépannage

### La synchronisation ne s'exécute pas

1. Vérifier `ENABLE_JOB_SYNC=true` dans `.env`
2. Vérifier les logs du backend
3. Vérifier que le cron est correctement formaté

### Erreurs de connexion API

- Vérifier les credentials LinkedIn/Indeed
- Vérifier les rate limits
- Consulter les logs pour les détails d'erreur

### Doublons dans la base de données

- Vérifier que `external_id` est unique
- Vérifier que la contrainte UNIQUE existe sur `external_id`

## 📝 Notes importantes

- **Rate Limiting** : Respecter les limites des APIs LinkedIn et Indeed
- **Respect des ToS** : S'assurer de respecter les conditions d'utilisation
- **Performance** : La synchronisation peut prendre 30-60 secondes selon le volume
- **Stockage** : Surveiller l'espace disque avec le volume d'offres

