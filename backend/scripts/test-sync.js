/**
 * Script de test pour la synchronisation des offres d'emploi
 * Usage: node scripts/test-sync.js
 */

require('dotenv').config();
const { JobSyncService } = require('../dist/services/JobSyncService');

async function testSync() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           TEST DE SYNCHRONISATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('🔄 Démarrage de la synchronisation...\n');
    
    const stats = await JobSyncService.forceSync('developer', 'Paris, France');
    
    console.log('\n✅ Synchronisation terminée avec succès!\n');
    console.log('📊 Statistiques:');
    console.log(`   LinkedIn: ${stats.linkedin.fetched} récupérées, ${stats.linkedin.new} nouvelles, ${stats.linkedin.updated} mises à jour`);
    console.log(`   Indeed: ${stats.indeed.fetched} récupérées, ${stats.indeed.new} nouvelles, ${stats.indeed.updated} mises à jour`);
    console.log(`   Total: ${stats.total.fetched} offres, ${stats.total.new} nouvelles, ${stats.total.updated} mises à jour`);
    console.log(`   Durée: ${stats.duration}ms\n`);
    
    if (stats.total.errors > 0) {
      console.log(`⚠️  ${stats.total.errors} erreur(s) détectée(s)`);
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la synchronisation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSync();

