const bcrypt = require('bcrypt');
const { get, all, run } = require('../db/database');

/**
 * Récupérer le profil d'un utilisateur
 */
async function getUserProfile(req, res) {
  try {
    const userId = req.params.id;
    
    // Récupérer les informations de base de l'utilisateur
    const user = await get('SELECT id, email, display_name, role, age, gender, weight, height FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Récupérer les médicaments de l'utilisateur
    const medications = await all('SELECT medication_name, dosage FROM user_medications WHERE user_id = ?', [userId]);
    
    // Récupérer les conditions médicales de l'utilisateur
    const conditions = await all('SELECT condition_name FROM user_conditions WHERE user_id = ?', [userId]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        age: user.age,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        medications: medications.map(m => ({ name: m.medication_name, dosage: m.dosage })),
        medicalConditions: conditions.map(c => c.condition_name)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
}

/**
 * Mettre à jour le profil d'un utilisateur
 */
async function updateUserProfile(req, res) {
  try {
    const userId = req.params.id;
    const { email, displayName, age, gender, weight, height, medications, medicalConditions, currentPassword, newPassword } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Commencer une transaction
    await run('BEGIN TRANSACTION');
    
    // Mettre à jour les informations de base
    await run(`
      UPDATE users 
      SET email = ?, display_name = ?, age = ?, gender = ?, weight = ?, height = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [email || user.email, displayName || user.display_name, age, gender, weight, height, userId]);
    
    // Si un nouveau mot de passe est fourni, vérifier l'ancien et mettre à jour
    if (newPassword && currentPassword) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!validPassword) {
        await run('ROLLBACK');
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }
    
    // Mettre à jour les médicaments si fournis
    if (medications) {
      // Supprimer les anciens médicaments
      await run('DELETE FROM user_medications WHERE user_id = ?', [userId]);
      
      // Ajouter les nouveaux médicaments
      for (const med of medications) {
        await run(
          'INSERT INTO user_medications (user_id, medication_name, dosage) VALUES (?, ?, ?)',
          [userId, med.name, med.dosage]
        );
      }
    }
    
    // Mettre à jour les conditions médicales si fournies
    if (medicalConditions) {
      // Supprimer les anciennes conditions
      await run('DELETE FROM user_conditions WHERE user_id = ?', [userId]);
      
      // Ajouter les nouvelles conditions
      for (const condition of medicalConditions) {
        await run(
          'INSERT INTO user_conditions (user_id, condition_name) VALUES (?, ?)',
          [userId, condition]
        );
      }
    }
    
    // Valider la transaction
    await run('COMMIT');
    
    res.json({ 
      message: 'Profil mis à jour avec succès',
      user: {
        id: userId,
        email: email || user.email,
        displayName: displayName || user.display_name,
        age,
        gender,
        weight,
        height
      }
    });
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await run('ROLLBACK');
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
}

/**
 * Supprimer un utilisateur
 */
async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    
    // Vérifier si l'utilisateur existe
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur (les contraintes CASCADE s'occuperont des données associées)
    await run('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUser
};
