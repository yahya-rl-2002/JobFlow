# Configuration des Offres d'Emploi

## 📋 Vue d'ensemble

Le système de récupération des offres d'emploi supporte actuellement :
- **LinkedIn** : Offres de démonstration (car LinkedIn n'a pas d'API publique)
- **Indeed** : API Publisher (gratuite avec limitations)

## 🔧 Configuration

### 1. LinkedIn (Démo)

LinkedIn n'a pas d'API publique pour récupérer les offres d'emploi. Le système génère actuellement des offres de démonstration basées sur vos critères de recherche.

**Pour une production réelle, considérez :**
- Utiliser une API tierce (RapidAPI LinkedIn Jobs)
- Web scraping léger (avec respect strict des ToS)
- Partenariat LinkedIn Talent Solutions

### 2. Indeed API Publisher

#### Étape 1 : Obtenir un Publisher ID

1. Allez sur [Indeed Publisher](https://ads.indeed.com/jobroll/xmlfeed)
2. Créez un compte ou connectez-vous
3. Obtenez votre **Publisher ID** (gratuit)

#### Étape 2 : Configurer dans `.env`

Ajoutez dans `backend/.env` :

```env
INDEED_PUBLISHER_ID=votre_publisher_id_ici
```

#### Étape 3 : Redémarrer le backend

```bash
cd backend
npm run dev
```

## 🚀 Utilisation

### Synchronisation manuelle

1. Allez dans **"Offres d'emploi"** dans l'interface
2. Utilisez les filtres pour spécifier :
   - Mots-clés (ex: "developer", "designer")
   - Localisation (ex: "Paris, France")
   - Plateforme (LinkedIn, Indeed, ou Toutes)
   - Télétravail uniquement
3. Cliquez sur **"🔄 Synchroniser les offres"**

### Recherche dans la base de données

Les offres synchronisées sont stockées dans la base de données. Utilisez les filtres pour rechercher parmi les offres déjà synchronisées.

## 📊 Limitations

### Indeed API Publisher
- Maximum 25 résultats par requête
- Rate limiting : 1 requête par seconde recommandée
- Limité à certains pays (France supportée)
- Gratuit mais avec limitations

### LinkedIn
- Pas d'API publique disponible
- Offres de démonstration uniquement actuellement
- Pour production : utiliser une solution tierce

## 🔄 Synchronisation automatique

Un service de synchronisation automatique est disponible (`JobSyncService`) qui :
- Synchronise les offres toutes les 6 heures
- Utilise les préférences utilisateur (keywords, location)
- Stocke les offres dans la base de données

Pour l'activer, décommentez dans `backend/src/index.ts` :

```typescript
// JobSyncService.start();
```

## 🎯 Prochaines améliorations

- [ ] Intégration d'une API tierce pour LinkedIn
- [ ] Pagination dans l'interface
- [ ] Filtres avancés (salaire, type de contrat, etc.)
- [ ] Notifications pour nouvelles offres
- [ ] Export des offres (CSV, PDF)

## 📝 Notes

- Les offres sont stockées avec `external_id` unique pour éviter les doublons
- Les offres expirées peuvent être marquées comme inactives
- Le système supporte plusieurs plateformes simultanément

