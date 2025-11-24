/**
 * Script pour vérifier le statut de connexion LinkedIn
 * Usage: node check_linkedin_status.js [token]
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const token = process.argv[2];

if (!token) {
  console.log('❌ Erreur: Token d\'authentification requis');
  console.log('');
  console.log('Usage: node check_linkedin_status.js <token>');
  console.log('');
  console.log('Pour obtenir votre token:');
  console.log('1. Connectez-vous sur http://localhost:3001');
  console.log('2. Ouvrez la console du navigateur (F12)');
  console.log('3. Tapez: localStorage.getItem("token")');
  console.log('4. Copiez le token et utilisez-le avec ce script');
  process.exit(1);
}

const options = {
  hostname: new URL(API_URL).hostname,
  port: new URL(API_URL).port || 3000,
  path: '/api/linkedin/token-status',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Vérification du statut de connexion LinkedIn...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('📊 Résultat:');
      console.log('─'.repeat(50));
      
      if (result.connected) {
        console.log('✅ Statut: CONNECTÉ');
        console.log('');
        console.log('📋 Détails:');
        if (result.expires_at) {
          const expiresAt = new Date(result.expires_at);
          const now = new Date();
          const daysLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
          
          console.log(`   • Expire le: ${expiresAt.toLocaleString('fr-FR')}`);
          if (result.expires_in) {
            console.log(`   • Temps restant: ${Math.floor(result.expires_in / 86400)} jours`);
          }
          
          if (result.is_expired) {
            console.log('   ⚠️  Token expiré - Reconnectez-vous');
          } else {
            console.log(`   ✅ Token valide (${daysLeft} jours restants)`);
          }
        }
        
        if (result.has_refresh_token) {
          console.log('   ✅ Refresh token disponible');
        }
        
        if (result.scope) {
          console.log(`   • Scopes: ${result.scope}`);
        }
      } else {
        console.log('❌ Statut: NON CONNECTÉ');
        console.log('');
        console.log('💡 Pour connecter votre compte LinkedIn:');
        console.log('   1. Allez sur http://localhost:3001/settings');
        console.log('   2. Cliquez sur "Se connecter à LinkedIn"');
        console.log('   3. Autorisez l\'application dans la popup');
      }
      
      console.log('─'.repeat(50));
    } catch (error) {
      console.error('❌ Erreur lors de la lecture de la réponse:', error.message);
      console.log('Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('');
  console.log('Vérifiez que:');
  console.log('1. Le backend est démarré (http://localhost:3000)');
  console.log('2. Le token est valide');
  console.log('3. Vous êtes bien connecté à l\'application');
});

req.end();

