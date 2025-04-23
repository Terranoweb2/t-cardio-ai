const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const measurementRoutes = require('./routes/measurements');
const reportRoutes = require('./routes/reports');
const shareRoutes = require('./routes/shares'); // Correction du chemin du fichier

// Initialisation de la base de données
const { initializeDatabase } = require('./db/database');

// Configuration du serveur
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/shares', shareRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API T-Cardio AI',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/measurements',
      '/api/shares',
      '/api/reports'
    ]
  });
});

// Middleware pour gérer les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Une erreur est survenue sur le serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

// Démarrage du serveur
app.listen(PORT, async () => {
  try {
    // Initialiser la base de données au démarrage
    await initializeDatabase();
    console.log(`✅ Base de données initialisée avec succès`);
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📊 L'API est disponible à l'adresse http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
});
