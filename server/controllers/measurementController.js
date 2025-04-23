const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

/**
 * Ajouter une nouvelle mesure de tension
 */
async function addMeasurement(req, res) {
  try {
    const { userId, systolic, diastolic, pulse, notes, date } = req.body;
    
    // Valider les données
    if (!userId || !systolic || !diastolic || !pulse) {
      return res.status(400).json({ message: 'Données invalides. Tous les champs requis doivent être remplis.' });
    }
    
    // Vérifier des valeurs physiologiquement plausibles
    if (systolic < 60 || systolic > 250 || diastolic < 40 || diastolic > 150 || pulse < 40 || pulse > 200) {
      return res.status(400).json({ message: 'Valeurs physiologiquement non plausibles' });
    }
    
    // Classifier la pression artérielle
    const classification = classifyBloodPressure(systolic, diastolic);
    
    // Créer un ID unique pour la mesure
    const measurementId = uuidv4();
    
    // Ajouter la mesure à la base de données
    await run(
      `INSERT INTO measurements (id, user_id, date, systolic, diastolic, pulse, notes, classification) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [measurementId, userId, date || new Date().toISOString(), systolic, diastolic, pulse, notes, classification]
    );
    
    res.status(201).json({
      message: 'Mesure ajoutée avec succès',
      measurement: {
        id: measurementId,
        userId,
        date: date || new Date().toISOString(),
        systolic,
        diastolic,
        pulse,
        notes,
        classification
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une mesure:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout d\'une mesure' });
  }
}

/**
 * Obtenir toutes les mesures d'un utilisateur
 */
async function getUserMeasurements(req, res) {
  try {
    const userId = req.params.userId;
    const { limit, offset, startDate, endDate, sortBy, sortOrder } = req.query;
    
    // Construire la requête SQL de base
    let sql = 'SELECT * FROM measurements WHERE user_id = ?';
    let params = [userId];
    
    // Ajouter des filtres de date si présents
    if (startDate && endDate) {
      sql += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    } else if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    
    // Ajouter tri
    sql += ` ORDER BY ${sortBy || 'date'} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
    
    // Ajouter pagination
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
      
      if (offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(offset));
      }
    }
    
    // Exécuter la requête
    const measurements = await all(sql, params);
    
    res.json({
      count: measurements.length,
      measurements
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mesures:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des mesures' });
  }
}

/**
 * Obtenir une mesure spécifique
 */
async function getMeasurement(req, res) {
  try {
    const measurementId = req.params.id;
    
    const measurement = await get('SELECT * FROM measurements WHERE id = ?', [measurementId]);
    
    if (!measurement) {
      return res.status(404).json({ message: 'Mesure non trouvée' });
    }
    
    res.json({ measurement });
  } catch (error) {
    console.error('Erreur lors de la récupération de la mesure:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la mesure' });
  }
}

/**
 * Supprimer une mesure
 */
async function deleteMeasurement(req, res) {
  try {
    const measurementId = req.params.id;
    
    // Vérifier si la mesure existe
    const measurement = await get('SELECT * FROM measurements WHERE id = ?', [measurementId]);
    
    if (!measurement) {
      return res.status(404).json({ message: 'Mesure non trouvée' });
    }
    
    // Vérifier si l'utilisateur est autorisé à supprimer cette mesure
    if (measurement.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette mesure' });
    }
    
    // Supprimer la mesure
    await run('DELETE FROM measurements WHERE id = ?', [measurementId]);
    
    res.json({ message: 'Mesure supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la mesure:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la mesure' });
  }
}

/**
 * Obtenir des statistiques sur les mesures d'un utilisateur
 */
async function getUserStats(req, res) {
  try {
    const userId = req.params.userId;
    const { period } = req.query;
    
    let timeFilter = '';
    if (period === 'week') {
      timeFilter = "AND date >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      timeFilter = "AND date >= datetime('now', '-30 days')";
    } else if (period === 'year') {
      timeFilter = "AND date >= datetime('now', '-1 year')";
    }
    
    // Obtenir le nombre total de mesures
    const countResult = await get(
      `SELECT COUNT(*) as count FROM measurements WHERE user_id = ? ${timeFilter}`,
      [userId]
    );
    
    // Obtenir les moyennes
    const averagesResult = await get(
      `SELECT 
        AVG(systolic) as avgSystolic, 
        AVG(diastolic) as avgDiastolic, 
        AVG(pulse) as avgPulse,
        MAX(systolic) as maxSystolic,
        MIN(systolic) as minSystolic,
        MAX(diastolic) as maxDiastolic,
        MIN(diastolic) as minDiastolic,
        MAX(pulse) as maxPulse,
        MIN(pulse) as minPulse
      FROM measurements 
      WHERE user_id = ? ${timeFilter}`,
      [userId]
    );
    
    // Obtenir la distribution des classifications
    const classifications = await all(
      `SELECT classification, COUNT(*) as count 
       FROM measurements 
       WHERE user_id = ? ${timeFilter}
       GROUP BY classification`,
      [userId]
    );
    
    res.json({
      totalMeasurements: countResult.count,
      averages: {
        systolic: Math.round(averagesResult.avgSystolic) || 0,
        diastolic: Math.round(averagesResult.avgDiastolic) || 0,
        pulse: Math.round(averagesResult.avgPulse) || 0
      },
      ranges: {
        systolic: {
          min: averagesResult.minSystolic || 0,
          max: averagesResult.maxSystolic || 0
        },
        diastolic: {
          min: averagesResult.minDiastolic || 0,
          max: averagesResult.maxDiastolic || 0
        },
        pulse: {
          min: averagesResult.minPulse || 0,
          max: averagesResult.maxPulse || 0
        }
      },
      classifications: classifications.reduce((acc, item) => {
        acc[item.classification] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
}

/**
 * Fonction utilitaire pour classifier la pression artérielle
 */
function classifyBloodPressure(systolic, diastolic) {
  if (systolic < 90 || diastolic < 60) {
    return "Hypotension";
  }
  if (systolic < 120 && diastolic < 80) {
    return "Optimale";
  }
  if ((systolic >= 120 && systolic < 130) && diastolic < 85) {
    return "Normale";
  }
  if ((systolic >= 130 && systolic < 140) || (diastolic >= 85 && diastolic < 90)) {
    return "Normale haute";
  }
  if ((systolic >= 140 && systolic < 160) || (diastolic >= 90 && diastolic < 100)) {
    return "Hypertension légère (Stade 1)";
  }
  if ((systolic >= 160 && systolic < 180) || (diastolic >= 100 && diastolic < 110)) {
    return "Hypertension modérée (Stade 2)";
  }
  return "Hypertension sévère (Stade 3)";
}

module.exports = {
  addMeasurement,
  getUserMeasurements,
  getMeasurement,
  deleteMeasurement,
  getUserStats
};
