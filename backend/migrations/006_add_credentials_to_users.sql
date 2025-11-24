-- Migration: Ajouter les colonnes pour stocker les credentials LinkedIn/Indeed
-- Date: 2025-01-23

-- Ajouter les colonnes pour les credentials LinkedIn
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linkedin_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS linkedin_password_encrypted TEXT;

-- Ajouter les colonnes pour les credentials Indeed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS indeed_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS indeed_password_encrypted TEXT;

-- Créer un index sur linkedin_email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_linkedin_email ON users(linkedin_email) WHERE linkedin_email IS NOT NULL;

-- Créer un index sur indeed_email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_indeed_email ON users(indeed_email) WHERE indeed_email IS NOT NULL;

