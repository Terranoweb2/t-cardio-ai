const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db/database');

/**
 * Inscription d'un nouvel utilisateur
 */
async function register(req, res) {
  try {
    const { email, password, displayName, role, age, gender, weight, height } = req.body;

    // Vérifier si l'email est déjà utilisé
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const userId = uuidv4();
    await run(
      `INSERT INTO users (id, email, password, display_name, role, age, gender, weight, height) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, displayName, role || 'patient', age, gender, weight, height]
    );

    // Générer un token JWT
    const token = jwt.sign(
      { id: userId, email, role: role || 'patient', name: displayName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: userId,
        email,
        displayName,
        role: role || 'patient',
        age,
        gender,
        weight,
        height
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
}

/**
 * Connexion d'un utilisateur existant
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.display_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        age: user.age,
        gender: user.gender,
        weight: user.weight,
        height: user.height
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
}

/**
 * Récupérer les informations de l'utilisateur connecté
 */
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    
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

module.exports = {
  register,
  login,
  getCurrentUser
};
