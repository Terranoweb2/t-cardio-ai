const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

/**
 * Créer un nouveau rapport
 */
async function createReport(req, res) {
  try {
    const { userId, title, content, reportType, startDate, endDate } = req.body;
    
    // Valider les données
    if (!userId || !title || !content || !reportType) {
      return res.status(400).json({ message: 'Données invalides. Tous les champs requis doivent être remplis.' });
    }
    
    // Créer un ID unique pour le rapport
    const reportId = uuidv4();
    
    // Ajouter le rapport à la base de données
    await run(
      `INSERT INTO reports (id, user_id, title, content, report_type, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reportId, userId, title, content, reportType, startDate, endDate]
    );
    
    res.status(201).json({
      message: 'Rapport créé avec succès',
      report: {
        id: reportId,
        userId,
        title,
        content,
        reportType,
        startDate,
        endDate,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du rapport:', error);
    res.status(500).json({ message: 'Erreur lors de la création du rapport' });
  }
}

/**
 * Récupérer tous les rapports d'un utilisateur
 */
async function getUserReports(req, res) {
  try {
    const userId = req.params.userId;
    const { limit, offset, type } = req.query;
    
    // Construire la requête SQL de base
    let sql = 'SELECT * FROM reports WHERE user_id = ?';
    let params = [userId];
    
    // Ajouter des filtres par type si présents
    if (type) {
      sql += ' AND report_type = ?';
      params.push(type);
    }
    
    // Ajouter tri
    sql += ' ORDER BY created_at DESC';
    
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
    const reports = await all(sql, params);
    
    res.json({
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports' });
  }
}

/**
 * Récupérer un rapport spécifique
 */
async function getReport(req, res) {
  try {
    const reportId = req.params.id;
    
    const report = await get('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    if (!report) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }
    
    res.json({ report });
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du rapport' });
  }
}

/**
 * Supprimer un rapport
 */
async function deleteReport(req, res) {
  try {
    const reportId = req.params.id;
    
    // Vérifier si le rapport existe
    const report = await get('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    if (!report) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à supprimer ce rapport
    if (report.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce rapport' });
    }
    
    // Supprimer le rapport
    await run('DELETE FROM reports WHERE id = ?', [reportId]);
    
    res.json({ message: 'Rapport supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du rapport:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du rapport' });
  }
}

/**
 * Générer un rapport d'analyse basé sur les mesures d'un utilisateur
 */
async function generateAnalysisReport(req, res) {
  try {
    const { userId, title, startDate, endDate, notes } = req.body;
    
    // Récupérer les mesures dans la période spécifiée
    let dateFilter = '';
    let params = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'AND date >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'AND date <= ?';
      params.push(endDate);
    }
    
    const measurements = await all(
      `SELECT * FROM measurements 
       WHERE user_id = ? ${dateFilter}
       ORDER BY date ASC`,
      params
    );
    
    if (measurements.length === 0) {
      return res.status(400).json({ message: 'Aucune mesure disponible pour la période spécifiée' });
    }
    
    // Calculer les statistiques
    const stats = calculateStats(measurements);
    
    // Générer le contenu du rapport
    const content = generateReportContent(measurements, stats, notes);
    
    // Créer le rapport
    const reportId = uuidv4();
    
    await run(
      `INSERT INTO reports (id, user_id, title, content, report_type, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reportId, userId, title || 'Rapport d\'analyse de tension artérielle', content, 'analysis', startDate, endDate]
    );
    
    res.status(201).json({
      message: 'Rapport d\'analyse généré avec succès',
      report: {
        id: reportId,
        userId,
        title: title || 'Rapport d\'analyse de tension artérielle',
        content,
        reportType: 'analysis',
        startDate,
        endDate,
        createdAt: new Date().toISOString(),
        stats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport d\'analyse:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport d\'analyse' });
  }
}

/**
 * Fonctions utilitaires pour générer le rapport
 */
function calculateStats(measurements) {
  // Initialiser les accumulateurs
  let totalSystolic = 0;
  let totalDiastolic = 0;
  let totalPulse = 0;
  let minSystolic = Infinity;
  let maxSystolic = -Infinity;
  let minDiastolic = Infinity;
  let maxDiastolic = -Infinity;
  let minPulse = Infinity;
  let maxPulse = -Infinity;
  const classifications = {};
  
  // Calculer les statistiques
  measurements.forEach(m => {
    totalSystolic += m.systolic;
    totalDiastolic += m.diastolic;
    totalPulse += m.pulse;
    
    minSystolic = Math.min(minSystolic, m.systolic);
    maxSystolic = Math.max(maxSystolic, m.systolic);
    
    minDiastolic = Math.min(minDiastolic, m.diastolic);
    maxDiastolic = Math.max(maxDiastolic, m.diastolic);
    
    minPulse = Math.min(minPulse, m.pulse);
    maxPulse = Math.max(maxPulse, m.pulse);
    
    classifications[m.classification] = (classifications[m.classification] || 0) + 1;
  });
  
  const count = measurements.length;
  
  return {
    count,
    period: {
      start: measurements[0].date,
      end: measurements[count - 1].date
    },
    averages: {
      systolic: Math.round(totalSystolic / count),
      diastolic: Math.round(totalDiastolic / count),
      pulse: Math.round(totalPulse / count)
    },
    ranges: {
      systolic: { min: minSystolic, max: maxSystolic },
      diastolic: { min: minDiastolic, max: maxDiastolic },
      pulse: { min: minPulse, max: maxPulse }
    },
    classifications
  };
}

function generateReportContent(measurements, stats, notes) {
  // Déterminer la tendance
  const firstSystolic = measurements[0].systolic;
  const lastSystolic = measurements[measurements.length - 1].systolic;
  const systolicDiff = lastSystolic - firstSystolic;
  
  const firstDiastolic = measurements[0].diastolic;
  const lastDiastolic = measurements[measurements.length - 1].diastolic;
  const diastolicDiff = lastDiastolic - firstDiastolic;
  
  let trend;
  if (systolicDiff > 5 || diastolicDiff > 5) {
    trend = "à la hausse";
  } else if (systolicDiff < -5 || diastolicDiff < -5) {
    trend = "à la baisse";
  } else {
    trend = "stable";
  }
  
  // Classification prédominante
  let predominantClass = '';
  let maxCount = 0;
  
  for (const [classification, count] of Object.entries(stats.classifications)) {
    if (count > maxCount) {
      maxCount = count;
      predominantClass = classification;
    }
  }
  
  // Générer le contenu du rapport
  return `
## Rapport d'analyse de tension artérielle

**Période analysée:** ${new Date(stats.period.start).toLocaleDateString('fr-FR')} au ${new Date(stats.period.end).toLocaleDateString('fr-FR')}

**Nombre de mesures:** ${stats.count}

### Résumé des mesures
- **Tension systolique moyenne:** ${stats.averages.systolic} mmHg (min: ${stats.ranges.systolic.min}, max: ${stats.ranges.systolic.max})
- **Tension diastolique moyenne:** ${stats.averages.diastolic} mmHg (min: ${stats.ranges.diastolic.min}, max: ${stats.ranges.diastolic.max})
- **Pouls moyen:** ${stats.averages.pulse} bpm (min: ${stats.ranges.pulse.min}, max: ${stats.ranges.pulse.max})

### Analyse
- La tendance générale de votre tension artérielle est **${trend}** sur cette période.
- Classification prédominante: **${predominantClass}**

### Recommandations
${getRecommendations(predominantClass, stats.averages, trend)}

${notes ? `### Notes supplémentaires\n${notes}` : ''}

*Ce rapport a été généré automatiquement par T-Cardio AI le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.*
  `;
}

function getRecommendations(classification, averages, trend) {
  const systolic = averages.systolic;
  const diastolic = averages.diastolic;
  
  if (classification.includes('Hypotension')) {
    return `
- Consultez votre médecin pour discuter de votre tension artérielle basse.
- Assurez-vous de bien vous hydrater tout au long de la journée.
- Évitez de vous lever trop brusquement pour prévenir les étourdissements.
- Considérez l'ajout de sel à votre alimentation si recommandé par votre médecin.
    `;
  } else if (classification.includes('Optimale') || classification.includes('Normale')) {
    return `
- Continuez vos bonnes habitudes de vie.
- Maintenez une alimentation équilibrée et une activité physique régulière.
- Effectuez des contrôles réguliers de votre tension artérielle.
    `;
  } else if (classification.includes('Normale haute')) {
    return `
- Surveillez votre consommation de sel (moins de 5g par jour).
- Pratiquez une activité physique modérée régulièrement (30 minutes, 5 fois par semaine).
- Limitez votre consommation d'alcool.
- Maintenez un poids santé.
    `;
  } else if (classification.includes('Hypertension légère')) {
    return `
- Consultez votre médecin pour discuter de votre tension artérielle.
- Réduisez votre consommation de sel et d'aliments transformés.
- Adoptez le régime DASH (riche en fruits, légumes et produits laitiers faibles en gras).
- Pratiquez une activité physique régulière.
- Gérez votre stress par des techniques de relaxation.
    `;
  } else if (classification.includes('Hypertension modérée') || classification.includes('Hypertension sévère')) {
    return `
- Consultez rapidement votre médecin pour une évaluation médicale.
- Prenez vos médicaments contre l'hypertension exactement comme prescrits.
- Suivez un régime pauvre en sel et riche en fruits et légumes.
- Limitez strictement votre consommation d'alcool.
- Contrôlez votre tension artérielle plus fréquemment.
    `;
  } else {
    return `
- Continuez à surveiller régulièrement votre tension artérielle.
- Maintenez un mode de vie sain avec une alimentation équilibrée.
- Pratiquez une activité physique adaptée à votre condition.
- Consultez votre médecin pour un suivi régulier.
    `;
  }
}

module.exports = {
  createReport,
  getUserReports,
  getReport,
  deleteReport,
  generateAnalysisReport
};
