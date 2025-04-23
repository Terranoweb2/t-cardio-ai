const express = require('express');
const router = express.Router();
const { 
  addMeasurement, 
  getUserMeasurements, 
  getMeasurement, 
  deleteMeasurement, 
  getUserStatistics 
} = require('../controllers/measurementController');
const { authenticateToken, isResourceOwnerOrAuthorized } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Ajouter une nouvelle mesure
router.post('/', addMeasurement);

// Récupérer toutes les mesures d'un utilisateur
router.get('/user/:userId', isResourceOwnerOrAuthorized, getUserMeasurements);

// Récupérer les statistiques d'un utilisateur
router.get('/user/:userId/statistics', isResourceOwnerOrAuthorized, getUserStatistics);

// Récupérer une mesure spécifique
router.get('/:id', getMeasurement);

// Supprimer une mesure
router.delete('/:id', deleteMeasurement);

module.exports = router;
