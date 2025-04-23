const jwt = require('jsonwebtoken');
const { get } = require('../db/database');

/**
 * Middleware pour vérifier le token JWT et authentifier l'utilisateur
 */
function authenticateToken(req, res, next) {
  // Récupérer le token depuis les headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Authentification requise.' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Assigner les informations de l'utilisateur à l'objet request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);
    return res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
}

/**
 * Middleware pour vérifier si l'utilisateur est un médecin
 */
function isDoctor(req, res, next) {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    return res.status(403).json({ message: 'Accès refusé. Privilèges de médecin requis.' });
  }
}

/**
 * Middleware pour vérifier si l'utilisateur est le propriétaire des ressources
 * ou un médecin ayant accès
 */
async function isResourceOwnerOrAuthorized(req, res, next) {
  const userId = req.params.userId || req.body.userId;
  const requestingUserId = req.user.id;
  
  // Si l'utilisateur est le propriétaire de la ressource
  if (userId === requestingUserId) {
    return next();
  }
  
  // Si l'utilisateur est un médecin, vérifier s'il a un partage valide
  if (req.user.role === 'doctor') {
    try {
      // Vérifier s'il existe un partage actif entre le patient et le médecin
      const share = await get(`
        SELECT s.* FROM share_tokens s
        JOIN accepted_shares a ON s.id = a.token_id
        WHERE s.user_id = ? AND a.recipient_id = ? AND s.active = 1 AND s.expires_at > datetime('now')
      `, [userId, requestingUserId]);
      
      if (share) {
        return next();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du partage:', error);
    }
  }
  
  return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette ressource.' });
}

module.exports = {
  authenticateToken,
  isDoctor,
  isResourceOwnerOrAuthorized
};
