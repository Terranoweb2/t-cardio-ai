const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

/**
 * Créer un nouveau jeton de partage
 */
async function createShareToken(req, res) {
  try {
    const { userId, name, recipientEmail, expiresInDays, notes } = req.body;
    
    // Valider les données
    if (!userId || !name) {
      return res.status(400).json({ message: 'Données invalides. Le nom du partage est requis.' });
    }
    
    // Créer un ID unique pour le jeton
    const tokenId = uuidv4();
    const token = uuidv4(); // Jeton de partage aléatoire
    
    // Calculer la date d'expiration
    const expirationDays = expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    // Ajouter le jeton à la base de données
    await run(
      `INSERT INTO share_tokens (id, user_id, token, name, recipient_email, notes, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tokenId, userId, token, name, recipientEmail, notes, expiresAt.toISOString()]
    );
    
    res.status(201).json({
      message: 'Jeton de partage créé avec succès',
      shareToken: {
        id: tokenId,
        userId,
        token,
        name,
        recipientEmail,
        notes,
        expiresAt: expiresAt.toISOString(),
        active: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du jeton de partage:', error);
    res.status(500).json({ message: 'Erreur lors de la création du jeton de partage' });
  }
}

/**
 * Récupérer tous les jetons de partage d'un utilisateur
 */
async function getUserShareTokens(req, res) {
  try {
    const userId = req.params.userId;
    
    const tokens = await all(
      'SELECT * FROM share_tokens WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      count: tokens.length,
      shareTokens: tokens
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des jetons de partage:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des jetons de partage' });
  }
}

/**
 * Désactiver un jeton de partage
 */
async function deactivateShareToken(req, res) {
  try {
    const tokenId = req.params.id;
    
    // Vérifier si le jeton existe
    const token = await get('SELECT * FROM share_tokens WHERE id = ?', [tokenId]);
    
    if (!token) {
      return res.status(404).json({ message: 'Jeton de partage non trouvé' });
    }
    
    // Désactiver le jeton
    await run(
      'UPDATE share_tokens SET active = 0 WHERE id = ?',
      [tokenId]
    );
    
    res.json({ message: 'Jeton de partage désactivé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la désactivation du jeton de partage:', error);
    res.status(500).json({ message: 'Erreur lors de la désactivation du jeton de partage' });
  }
}

/**
 * Récupérer les informations d'un jeton de partage par son code
 */
async function getShareTokenInfo(req, res) {
  try {
    const { token } = req.params;
    
    // Vérifier si le jeton existe et est actif
    const shareToken = await get(
      'SELECT s.*, u.display_name as user_name, u.email as user_email FROM share_tokens s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.active = 1 AND s.expires_at > datetime("now")',
      [token]
    );
    
    if (!shareToken) {
      return res.status(404).json({ message: 'Jeton de partage invalide, expiré ou inactif' });
    }
    
    res.json({
      shareToken: {
        id: shareToken.id,
        name: shareToken.name,
        senderName: shareToken.user_name,
        senderEmail: shareToken.user_email,
        createdAt: shareToken.created_at,
        expiresAt: shareToken.expires_at
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations du jeton:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des informations du jeton' });
  }
}

/**
 * Accepter un jeton de partage
 */
async function acceptShareToken(req, res) {
  try {
    const { token } = req.params;
    const { recipientId } = req.body;
    
    // Vérifier si le jeton existe et est actif
    const shareToken = await get(
      'SELECT * FROM share_tokens WHERE token = ? AND active = 1 AND expires_at > datetime("now")',
      [token]
    );
    
    if (!shareToken) {
      return res.status(404).json({ message: 'Jeton de partage invalide, expiré ou inactif' });
    }
    
    // Vérifier si le jeton a déjà été accepté par cet utilisateur
    const existingAcceptance = await get(
      'SELECT * FROM accepted_shares WHERE token_id = ? AND recipient_id = ?',
      [shareToken.id, recipientId]
    );
    
    if (existingAcceptance) {
      return res.status(400).json({ message: 'Ce jeton de partage a déjà été accepté' });
    }
    
    // Créer un ID unique pour l'acceptation
    const acceptanceId = uuidv4();
    
    // Enregistrer l'acceptation
    await run(
      'INSERT INTO accepted_shares (id, token_id, recipient_id) VALUES (?, ?, ?)',
      [acceptanceId, shareToken.id, recipientId]
    );
    
    res.status(201).json({
      message: 'Jeton de partage accepté avec succès',
      acceptance: {
        id: acceptanceId,
        tokenId: shareToken.id,
        recipientId,
        acceptedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation du jeton de partage:', error);
    res.status(500).json({ message: 'Erreur lors de l\'acceptation du jeton de partage' });
  }
}

/**
 * Récupérer les partages acceptés par un utilisateur
 */
async function getAcceptedShares(req, res) {
  try {
    const userId = req.params.userId;
    
    const acceptedShares = await all(
      `SELECT 
        a.id, a.accepted_at, 
        s.id as token_id, s.name, s.expires_at,
        u.id as sharer_id, u.display_name as sharer_name, u.email as sharer_email
      FROM accepted_shares a
      JOIN share_tokens s ON a.token_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.recipient_id = ? AND s.active = 1 AND s.expires_at > datetime("now")
      ORDER BY a.accepted_at DESC`,
      [userId]
    );
    
    res.json({
      count: acceptedShares.length,
      acceptedShares
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des partages acceptés:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des partages acceptés' });
  }
}

module.exports = {
  createShareToken,
  getUserShareTokens,
  deactivateShareToken,
  getShareTokenInfo,
  acceptShareToken,
  getAcceptedShares
};
