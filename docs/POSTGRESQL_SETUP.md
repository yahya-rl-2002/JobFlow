# Guide d'Installation et Configuration PostgreSQL

## Installation PostgreSQL sur macOS

### Option 1: Installation via Homebrew (Recommandé)

```bash
# Installer Homebrew si ce n'est pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer PostgreSQL
brew install postgresql@14

# Démarrer PostgreSQL
brew services start postgresql@14

# Vérifier l'installation
psql --version
```

### Option 2: Installation via Postgres.app

1. Télécharger Postgres.app depuis : https://postgresapp.com/
2. Installer l'application
3. Lancer Postgres.app
4. Cliquer sur "Initialize" pour créer un nouveau serveur

### Option 3: Installation via PostgreSQL officiel

1. Télécharger depuis : https://www.postgresql.org/download/macosx/
2. Installer le package
3. Suivre les instructions d'installation

## Configuration après installation

### 1. Vérifier que PostgreSQL est démarré

```bash
# Vérifier le statut
brew services list | grep postgresql

# Ou avec Postgres.app, vérifier que l'application est lancée
```

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL (par défaut, l'utilisateur est votre nom d'utilisateur macOS)
psql postgres

# Ou si vous avez un utilisateur postgres
psql -U postgres
```

Une fois connecté, exécutez :

```sql
-- Créer la base de données
CREATE DATABASE job_application_db;

-- Créer un utilisateur (optionnel, vous pouvez utiliser votre utilisateur)
CREATE USER jobapp_user WITH PASSWORD 'your_secure_password';

-- Donner les permissions
GRANT ALL PRIVILEGES ON DATABASE job_application_db TO jobapp_user;

-- Vérifier que la base de données existe
\l

-- Se déconnecter
\q
```

### 3. Mettre à jour le fichier .env

Dans `backend/.env`, mettez à jour :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_application_db
DB_USER=votre_nom_utilisateur  # ou jobapp_user si vous l'avez créé
DB_PASSWORD=votre_mot_de_passe  # ou votre_secure_password
```

## Commandes utiles PostgreSQL

### Se connecter à la base de données

```bash
# Avec votre utilisateur macOS
psql job_application_db

# Avec un utilisateur spécifique
psql -U jobapp_user -d job_application_db

# Avec mot de passe
psql -U jobapp_user -d job_application_db -W
```

### Commandes SQL utiles

```sql
-- Lister toutes les bases de données
\l

-- Se connecter à une base de données
\c job_application_db

-- Lister toutes les tables
\dt

-- Décrire une table
\d nom_table

-- Voir les utilisateurs
\du

-- Quitter
\q
```

## Dépannage

### Erreur: "psql: command not found"

**Solution:** Ajouter PostgreSQL au PATH

```bash
# Pour Homebrew
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Ou pour Postgres.app
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Erreur: "connection refused"

**Solution:** Démarrer PostgreSQL

```bash
# Avec Homebrew
brew services start postgresql@14

# Avec Postgres.app, lancer l'application
```

### Erreur: "password authentication failed"

**Solution:** Vérifier le mot de passe dans `.env` ou réinitialiser le mot de passe

```sql
-- Se connecter en tant que superutilisateur
psql postgres

-- Changer le mot de passe
ALTER USER votre_utilisateur WITH PASSWORD 'nouveau_mot_de_passe';
```

### Erreur: "database does not exist"

**Solution:** Créer la base de données

```bash
createdb job_application_db
```

## Vérification de la configuration

### Test de connexion depuis Node.js

Le backend créera automatiquement les tables au premier démarrage. Pour tester manuellement :

```bash
cd backend
npm install
npm run dev
```

Si la connexion fonctionne, vous verrez dans les logs :
```
Database connected successfully
Database tables created/verified
```

## Configuration de production

Pour la production, considérez :

1. **Utilisateur dédié** : Créer un utilisateur spécifique pour l'application
2. **Mot de passe fort** : Utiliser un mot de passe sécurisé
3. **Permissions limitées** : Donner uniquement les permissions nécessaires
4. **Backup** : Configurer des sauvegardes régulières
5. **SSL** : Activer SSL pour les connexions

```sql
-- Exemple de configuration production
CREATE USER jobapp_prod WITH PASSWORD 'very_secure_password';
GRANT CONNECT ON DATABASE job_application_db TO jobapp_prod;
GRANT USAGE ON SCHEMA public TO jobapp_prod;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jobapp_prod;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jobapp_prod;
```

## Script de configuration automatique

Vous pouvez créer un script `setup-db.sh` :

```bash
#!/bin/bash

# Créer la base de données
createdb job_application_db

# Créer un utilisateur (optionnel)
# psql -c "CREATE USER jobapp_user WITH PASSWORD 'your_password';"
# psql -c "GRANT ALL PRIVILEGES ON DATABASE job_application_db TO jobapp_user;"

echo "Base de données créée avec succès!"
echo "N'oubliez pas de mettre à jour backend/.env avec vos identifiants"
```

