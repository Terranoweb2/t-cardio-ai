const express = require('express');
const router = express.Router();
const { 
  createReport, 
  getUserReports, 
  getReport, 
  deleteReport, 
  generateAnalysisReport 
} = require('../controllers/reportController');
const { authenticateToken, isResourceOwnerOrAuthorized } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Créer un nouveau rapport
router.post('/', createReport);

// Générer un rapport d'analyse
router.post('/analysis', generateAnalysisReport);

// Récupérer tous les rapports d'un utilisateur
router.get('/user/:userId', isResourceOwnerOrAuthorized, getUserReports);

// Récupérer un rapport spécifique
router.get('/:id', getReport);

// Supprimer un rapport
router.delete('/:id', deleteReport);

module.exports = router;
