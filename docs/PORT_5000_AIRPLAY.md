# Port 5000 utilisé par AirPlay Receiver

## Problème

Sur macOS, le port 5000 est souvent utilisé par **AirPlay Receiver**, ce qui empêche le service NLP de démarrer.

## Solution appliquée

Le service NLP a été configuré pour utiliser le **port 5001** à la place.

### Fichiers modifiés

1. **nlp-service/.env** : `PORT=5001`
2. **backend/.env** : `NLP_SERVICE_URL=http://localhost:5001`

## Alternative : Désactiver AirPlay Receiver

Si vous préférez utiliser le port 5000, vous pouvez désactiver AirPlay Receiver :

1. Ouvrir **Réglages Système** (System Settings)
2. Aller dans **Général** → **AirDrop et Handoff**
3. Désactiver **Récepteur AirPlay** (AirPlay Receiver)

Puis remettre le port à 5000 dans les fichiers `.env`.

## Vérification

Le service NLP démarre maintenant sur :
```
http://localhost:5001
```

Test :
```bash
curl http://localhost:5001/health
```

