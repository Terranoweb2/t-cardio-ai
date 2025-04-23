const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, deleteUser } = require('../controllers/userController');
const { authenticateToken, isResourceOwnerOrAuthorized } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Récupérer le profil d'un utilisateur
router.get('/:id', isResourceOwnerOrAuthorized, getUserProfile);

// Mettre à jour le profil d'un utilisateur
router.put('/:id', isResourceOwnerOrAuthorized, updateUserProfile);

// Supprimer un utilisateur
router.delete('/:id', isResourceOwnerOrAuthorized, deleteUser);

module.exports = router;
