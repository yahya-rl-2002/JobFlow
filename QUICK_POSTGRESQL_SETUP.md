# Configuration Rapide PostgreSQL

## Option 1: Script Automatique (Recommandé)

```bash
# Exécuter le script de configuration
./scripts/setup-postgresql.sh
```

Le script va :
- ✅ Installer PostgreSQL si nécessaire
- ✅ Démarrer le service PostgreSQL
- ✅ Créer la base de données `job_application_db`
- ✅ Mettre à jour automatiquement le fichier `backend/.env`

## Option 2: Installation Manuelle

### 1. Installer PostgreSQL

```bash
brew install postgresql@14
brew services start postgresql@14
```

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Dans psql, exécuter:
CREATE DATABASE job_application_db;

# Quitter
\q
```

### 3. Mettre à jour backend/.env

Ouvrez `backend/.env` et configurez :

```env
DB_USER=votre_nom_utilisateur_macos
DB_PASSWORD=  # Laissez vide si pas de mot de passe
```

## Vérification

```bash
# Tester la connexion
psql job_application_db

# Si ça fonctionne, vous verrez:
# job_application_db=#
```

## Démarrer le backend

```bash
cd backend
npm install
npm run dev
```

Les tables seront créées automatiquement au premier démarrage !

