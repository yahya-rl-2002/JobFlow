#!/bin/bash

# Script de configuration PostgreSQL pour le système de postulation

set -e

echo "🚀 Configuration PostgreSQL pour le système de postulation"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si PostgreSQL est installé
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL n'est pas installé${NC}"
    echo ""
    echo "Installation de PostgreSQL via Homebrew..."
    
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}❌ Homebrew n'est pas installé${NC}"
        echo "Installez Homebrew d'abord: https://brew.sh"
        exit 1
    fi
    
    brew install postgresql@14
    brew services start postgresql@14
    
    # Ajouter au PATH
    if [[ "$SHELL" == *"zsh"* ]]; then
        echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
        export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
    elif [[ "$SHELL" == *"bash"* ]]; then
        echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.bash_profile
        export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
    fi
    
    echo -e "${GREEN}✅ PostgreSQL installé${NC}"
    sleep 2
fi

# Vérifier que PostgreSQL est démarré
echo "Vérification que PostgreSQL est démarré..."
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL n'est pas démarré, démarrage...${NC}"
    brew services start postgresql@14 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Impossible de démarrer via brew services, essayez manuellement${NC}"
    }
    sleep 2
fi

# Obtenir le nom d'utilisateur actuel
CURRENT_USER=$(whoami)
echo ""
echo "Utilisateur PostgreSQL: $CURRENT_USER"
echo ""

# Demander si on veut créer un utilisateur dédié
read -p "Voulez-vous créer un utilisateur dédié pour l'application? (o/N): " CREATE_USER
CREATE_USER=${CREATE_USER:-N}

if [[ "$CREATE_USER" =~ ^[Oo]$ ]]; then
    read -p "Nom d'utilisateur (par défaut: jobapp_user): " DB_USER
    DB_USER=${DB_USER:-jobapp_user}
    
    read -sp "Mot de passe: " DB_PASSWORD
    echo ""
    
    # Créer l'utilisateur
    psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  L'utilisateur existe déjà ou erreur de création${NC}"
    }
    
    echo -e "${GREEN}✅ Utilisateur créé${NC}"
else
    DB_USER=$CURRENT_USER
    DB_PASSWORD=""
    echo "Utilisation de l'utilisateur: $DB_USER"
fi

# Créer la base de données
echo ""
echo "Création de la base de données..."
DB_NAME="job_application_db"

# Supprimer la base de données si elle existe (optionnel)
read -p "La base de données existe-t-elle déjà? Supprimer et recréer? (o/N): " RECREATE
RECREATE=${RECREATE:-N}

if [[ "$RECREATE" =~ ^[Oo]$ ]]; then
    psql postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    echo -e "${YELLOW}⚠️  Base de données supprimée${NC}"
fi

# Créer la base de données
psql postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  La base de données existe déjà${NC}"
}

# Donner les permissions si un utilisateur dédié a été créé
if [[ "$CREATE_USER" =~ ^[Oo]$ ]]; then
    echo "Attribution des permissions..."
    psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
fi

echo -e "${GREEN}✅ Base de données créée: $DB_NAME${NC}"

# Mettre à jour le fichier .env
echo ""
echo "Mise à jour du fichier backend/.env..."

ENV_FILE="backend/.env"

if [ -f "$ENV_FILE" ]; then
    # Mettre à jour DB_USER
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/DB_USER=.*/DB_USER=$DB_USER/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" "$ENV_FILE"
    fi
    
    # Mettre à jour DB_PASSWORD si fourni
    if [ -n "$DB_PASSWORD" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        else
            sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        fi
    else
        echo -e "${YELLOW}⚠️  Mot de passe non défini. Mettez à jour manuellement DB_PASSWORD dans $ENV_FILE${NC}"
    fi
    
    echo -e "${GREEN}✅ Fichier .env mis à jour${NC}"
else
    echo -e "${RED}❌ Fichier $ENV_FILE non trouvé${NC}"
fi

# Test de connexion
echo ""
echo "Test de connexion à la base de données..."
if psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✅ Connexion réussie!${NC}"
else
    echo -e "${RED}❌ Échec de la connexion${NC}"
    echo "Vérifiez vos identifiants dans backend/.env"
fi

echo ""
echo -e "${GREEN}🎉 Configuration PostgreSQL terminée!${NC}"
echo ""
echo "Prochaines étapes:"
echo "1. Vérifiez les identifiants dans backend/.env"
echo "2. Démarrez le backend: cd backend && npm run dev"
echo "3. Les tables seront créées automatiquement au premier démarrage"

