# 🚀 Système de Candidature Automatique

## ✅ Fonctionnalités Implémentées

Le système permet maintenant de **postuler automatiquement à toutes les offres en un clic** en utilisant Selenium pour automatiser le navigateur.

### 1. **Service d'Automatisation Python**
- Utilise Selenium avec ChromeDriver
- Support LinkedIn et Indeed
- Upload automatique de CV
- Gestion des formulaires de candidature
- Gestion d'erreurs robuste

### 2. **Backend**
- Endpoint `/api/applications/bulk-apply` amélioré
- Gestion sécurisée des credentials (chiffrement)
- Validation des CVs et credentials
- Sauvegarde des résultats en base de données

### 3. **Frontend**
- Section de configuration des credentials dans le profil
- Interface pour configurer LinkedIn/Indeed
- Messages d'erreur clairs

## 📋 Prérequis

### 1. Chrome Browser
Assurez-vous que Google Chrome est installé sur votre système :
- **macOS** : `brew install --cask google-chrome`
- **Linux** : `sudo apt-get install google-chrome-stable`
- **Windows** : Téléchargez depuis [chrome.google.com](https://www.google.com/chrome/)

### 2. ChromeDriver
ChromeDriver est **automatiquement téléchargé** par `webdriver-manager`, donc pas besoin de l'installer manuellement !

### 3. Dépendances Python
Les dépendances sont déjà dans `requirements.txt` :
```bash
cd nlp-service
source venv/bin/activate
pip install -r requirements.txt
```

## 🔧 Configuration

### 1. Configurer vos Credentials

1. Allez dans **Profil** → Section **"Identifiants pour Candidature Automatique"**
2. Entrez votre email LinkedIn et mot de passe
3. (Optionnel) Entrez vos credentials Indeed
4. Cliquez sur **"Enregistrer les identifiants"**

⚠️ **Sécurité** : Vos mots de passe sont chiffrés et stockés de manière sécurisée.

### 2. Uploader un CV

Assurez-vous d'avoir uploadé un CV dans la section **CVs** de votre profil.

## 🎯 Utilisation

### Postuler à Toutes les Offres en Un Clic

1. Allez sur la page **"Offres d'emploi"**
2. Recherchez des offres avec vos critères
3. Sélectionnez les offres qui vous intéressent (ou utilisez "Tout sélectionner")
4. Cliquez sur **"Postuler à tout"** (bouton flottant en bas)
5. Le système va :
   - Se connecter à LinkedIn/Indeed avec vos credentials
   - Ouvrir chaque offre
   - Uploader votre CV
   - Remplir le formulaire
   - Soumettre la candidature

### Résultats

Après la candidature, vous verrez :
- Nombre de candidatures réussies
- Nombre d'échecs
- Détails pour chaque offre
- Statut sauvegardé en base de données

## 🔒 Sécurité

- **Chiffrement** : Les mots de passe sont chiffrés avec `TokenEncryption` avant stockage
- **Isolation** : Chaque utilisateur ne peut accéder qu'à ses propres credentials
- **Validation** : Vérification des permissions avant chaque candidature

## ⚠️ Limitations et Avertissements

### 1. Respect des Conditions d'Utilisation
- **LinkedIn** : Vérifiez les [Conditions d'utilisation de LinkedIn](https://www.linkedin.com/legal/user-agreement)
- **Indeed** : Vérifiez les [Conditions d'utilisation d'Indeed](https://www.indeed.com/legal/terms-of-service)
- L'automatisation peut violer les ToS de certaines plateformes

### 2. Rate Limiting
- Le système attend 5 secondes entre chaque candidature
- LinkedIn/Indeed peuvent bloquer les comptes avec trop de candidatures rapides
- **Recommandation** : Ne postulez pas à plus de 20-30 offres par jour

### 3. Captcha et Vérifications
- LinkedIn/Indeed peuvent demander une vérification (captcha, 2FA)
- Dans ce cas, la candidature échouera et nécessitera une intervention manuelle

### 4. Formulaires Complexes
- Certaines offres ont des formulaires complexes qui nécessitent des réponses personnalisées
- Le système essaie de remplir automatiquement, mais peut échouer sur des formulaires très complexes

## 🐛 Dépannage

### Erreur : "ChromeDriver not found"
```bash
cd nlp-service
source venv/bin/activate
pip install webdriver-manager
```
Le webdriver-manager télécharge automatiquement ChromeDriver.

### Erreur : "LinkedIn login failed"
- Vérifiez vos credentials dans le profil
- Assurez-vous que votre compte LinkedIn n'est pas bloqué
- LinkedIn peut demander une vérification 2FA

### Erreur : "CV file not found"
- Uploader un nouveau CV dans la section CVs
- Vérifiez que le fichier existe sur le serveur

### Candidatures qui échouent
- Vérifiez les logs du service NLP : `nlp-service/app.py`
- Certaines offres peuvent nécessiter une candidature manuelle
- LinkedIn/Indeed peuvent bloquer les candidatures automatisées

## 📊 Logs

Les logs sont disponibles dans :
- **Backend** : `backend/logs/combined.log`
- **NLP Service** : Console du service Python

## 🔄 Améliorations Futures

- [ ] Support des lettres de motivation personnalisées par offre
- [ ] Gestion des questions de formulaire personnalisées
- [ ] Support d'autres plateformes (Glassdoor, etc.)
- [ ] Mode "slow" pour éviter le rate limiting
- [ ] Notifications par email des résultats

## 📝 Notes Importantes

1. **Testez d'abord** : Testez avec 1-2 offres avant de postuler à 50 offres
2. **Vérifiez régulièrement** : Vérifiez vos candidatures sur LinkedIn/Indeed pour confirmer
3. **Respectez les limites** : Ne surchargez pas les plateformes
4. **Sécurité** : Ne partagez jamais vos credentials avec d'autres personnes

---

**Bon courage dans votre recherche d'emploi ! 🎯**

