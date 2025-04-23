/**
 * Script pour effacer toutes les données de test de la base de données T-Cardio AI
 * Utiliser avec précaution - Cette opération est irréversible
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, '../db/tcardio.sqlite');

console.log('🔄 Démarrage du nettoyage de toutes les données de test...');

// Vérifier si la base de données existe
if (!fs.existsSync(dbPath)) {
  console.log('ℹ️ Aucune base de données trouvée à l\'emplacement spécifié.');
  process.exit(0);
}

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  }
  console.log('✅ Connexion à la base de données établie');
});

// Supprimer les données de toutes les tables
const tables = ['shares', 'reports', 'measurements', 'users'];

// Utiliser une transaction pour garantir l'intégrité des données
db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  
  let hasErrors = false;
  
  tables.forEach(table => {
    db.run(`DELETE FROM ${table}`, [], function(err) {
      if (err) {
        console.error(`❌ Erreur lors de la suppression des données de ${table}:`, err.message);
        hasErrors = true;
      } else {
        console.log(`✅ Toutes les données de la table ${table} ont été supprimées. Lignes affectées: ${this.changes}`);
      }
    });
  });
  
  // Réinitialiser les séquences d'identifiants (SQLite utilise généralement rowid)
  tables.forEach(table => {
    db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`, [], function(err) {
      if (err) {
        console.error(`❌ Erreur lors de la réinitialisation de la séquence pour ${table}:`, err.message);
        hasErrors = true;
      }
    });
  });
  
  if (hasErrors) {
    db.run('ROLLBACK', [], () => {
      console.error('❌ Nettoyage annulé en raison d\'erreurs.');
      db.close();
      process.exit(1);
    });
  } else {
    db.run('COMMIT', [], () => {
      console.log('✅ Nettoyage des données terminé avec succès.');
      db.close(() => {
        console.log('✅ Connexion à la base de données fermée.');
      });
    });
  }
});
