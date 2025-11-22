# Comment mettre ce projet sur GitHub

Voici les étapes pour héberger votre projet "Système LinkedIn Copie" sur GitHub.

## 1. Prérequis
- Avoir un compte [GitHub](https://github.com).
- Avoir `git` installé sur votre machine.

## 2. Créer un nouveau repository sur GitHub
1. Allez sur [github.com/new](https://github.com/new).
2. Nommez votre repository (ex: `jobflow-linkedin-clone`).
3. Choisissez **Public** ou **Private**.
4. **Ne cochez pas** "Initialize this repository with a README", "Add .gitignore", ou "Choose a license" (car vous avez déjà ces fichiers localement).
5. Cliquez sur **Create repository**.

## 3. Initialiser Git localement
Ouvrez votre terminal à la racine du projet (`/Volumes/YAHYA SSD/Documents/systeme Linkedin copie`) et lancez les commandes suivantes :

```bash
# 1. Initialiser git
git init

# 2. Ajouter tous les fichiers (le fichier .gitignore exclura automatiquement les fichiers sensibles comme .env et node_modules)
git add .

# 3. Faire le premier commit
git commit -m "Initial commit: JobFlow system complete"

# 4. Renommer la branche principale en 'main' (si ce n'est pas déjà fait)
git branch -M main
```

## 4. Lier et envoyer vers GitHub
Copiez l'URL de votre repository (ex: `https://github.com/votre-nom/jobflow-linkedin-clone.git`) et lancez :

```bash
# 5. Ajouter l'URL distante (remplacez l'URL par la vôtre)
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/NOM_DU_REPO.git

# 6. Envoyer le code
git push -u origin main
```

## ⚠️ Important : Sécurité
Votre fichier `.gitignore` est déjà configuré pour ignorer :
- `node_modules/` (dépendances lourdes)
- `.env` (vos clés secrètes LinkedIn, Base de données, etc.)
- `venv/` (environnement virtuel Python)

**Assurez-vous de ne jamais commiter vos clés API ou mots de passe directement dans le code.** Utilisez toujours le fichier `.env`.

## En cas d'erreur "Remote origin already exists"
Si vous avez déjà lié ce projet à un autre repo, faites :
```bash
git remote remove origin
# Puis recommencez l'étape 5
```
