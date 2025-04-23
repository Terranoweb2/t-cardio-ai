const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Chemin vers le fichier de base de données
const dbPath = path.resolve(__dirname, 'tcardio.sqlite');

// Création d'une nouvelle instance de base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('✅ Connexion à la base de données SQLite établie');
  }
});

// Fonction pour exécuter une requête SQL
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Erreur d\'exécution SQL:', err.message);
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// Fonction pour exécuter une requête SQL et obtenir un résultat unique
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        console.error('Erreur de requête SQL (get):', err.message);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Fonction pour exécuter une requête SQL et obtenir tous les résultats
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Erreur de requête SQL (all):', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Initialisation des tables de la base de données
async function initializeDatabase() {
  try {
    // Table des utilisateurs
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT DEFAULT 'patient',
        age INTEGER,
        gender TEXT,
        weight REAL,
        height REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des médicaments des utilisateurs
    await run(`
      CREATE TABLE IF NOT EXISTS user_medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Table des conditions médicales des utilisateurs
    await run(`
      CREATE TABLE IF NOT EXISTS user_conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        condition_name TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Table des mesures de tension artérielle
    await run(`
      CREATE TABLE IF NOT EXISTS measurements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        pulse INTEGER NOT NULL,
        notes TEXT,
        classification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Table des rapports
    await run(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        report_type TEXT NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Table des jetons de partage
    await run(`
      CREATE TABLE IF NOT EXISTS share_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        recipient_email TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Table des partages acceptés
    await run(`
      CREATE TABLE IF NOT EXISTS accepted_shares (
        id TEXT PRIMARY KEY,
        token_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES share_tokens (id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Toutes les tables ont été créées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

// Fermer la connexion à la base de données (à utiliser lors de l'arrêt du serveur)
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la base de données:', err.message);
        reject(err);
      } else {
        console.log('Connexion à la base de données fermée');
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  initializeDatabase,
  closeDatabase
};
