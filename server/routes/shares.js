const express = require('express');
const router = express.Router();
const { 
  createShareToken, 
  getUserShareTokens, 
  deactivateShareToken, 
  getShareTokenInfo, 
  acceptShareToken, 
  getAcceptedShares 
} = require('../controllers/shareController');
const { authenticateToken, isResourceOwnerOrAuthorized } = require('../middleware/auth');

// Routes protégées par authentification
router.use(authenticateToken);

// Créer un nouveau jeton de partage
router.post('/', createShareToken);

// Récupérer tous les jetons de partage d'un utilisateur
router.get('/user/:userId', isResourceOwnerOrAuthorized, getUserShareTokens);

// Désactiver un jeton de partage
router.put('/:id/deactivate', deactivateShareToken);

// Récupérer les partages acceptés par un utilisateur
router.get('/accepted/user/:userId', isResourceOwnerOrAuthorized, getAcceptedShares);

// Routes pour les jetons publics (avec authentification)
router.get('/token/:token', getShareTokenInfo);
router.post('/token/:token/accept', acceptShareToken);

module.exports = router;
