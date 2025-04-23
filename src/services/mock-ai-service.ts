/**
 * Service IA Mock pour T-Cardio AI
 * Fournit des analyses générées localement sans dépendre d'API externes
 */

import type { Measurement, PatientInfo } from '@/lib/types';

// Fonction pour calculer la moyenne d'un tableau de nombres
const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
};

// Fonction pour déterminer la tendance d'un ensemble de mesures
const determineTrend = (values: number[]): 'stable' | 'increasing' | 'decreasing' | 'fluctuating' => {
  if (values.length < 3) return 'stable';

  const differences: number[] = [];
  for (let i = 1; i < values.length; i++) {
    differences.push(values[i] - values[i - 1]);
  }

  const increasingCount = differences.filter(diff => diff > 0).length;
  const decreasingCount = differences.filter(diff => diff < 0).length;
  const stableCount = differences.filter(diff => diff === 0).length;

  const totalComparisons = differences.length;
  
  if (increasingCount > 0.7 * totalComparisons) return 'increasing';
  if (decreasingCount > 0.7 * totalComparisons) return 'decreasing';
  if (stableCount > 0.7 * totalComparisons) return 'stable';
  
  return 'fluctuating';
};

// Classification de la pression artérielle
const classifyBloodPressure = (systolic: number, diastolic: number): string => {
  if (systolic < 120 && diastolic < 80) return 'Optimale';
  if ((systolic >= 120 && systolic < 130) && diastolic < 85) return 'Normale';
  if ((systolic >= 130 && systolic < 140) || (diastolic >= 85 && diastolic < 90)) return 'Normale haute';
  if ((systolic >= 140 && systolic < 160) || (diastolic >= 90 && diastolic < 100)) return 'Hypertension légère (Stade 1)';
  if ((systolic >= 160 && systolic < 180) || (diastolic >= 100 && diastolic < 110)) return 'Hypertension modérée (Stade 2)';
  if (systolic >= 180 || diastolic >= 110) return 'Hypertension sévère (Stade 3)';
  return 'Non classée';
};

// Recommandations générales basées sur la classification
const getRecommendations = (classification: string): string[] => {
  const commonRecommendations = [
    "Maintenez une alimentation équilibrée, faible en sel",
    "Pratiquez une activité physique régulière",
    "Limitez votre consommation d'alcool",
    "Arrêtez de fumer si vous êtes fumeur",
    "Gérez votre stress par des techniques de relaxation"
  ];

  switch (classification) {
    case 'Optimale':
      return [
        "Continuez vos bonnes habitudes",
        "Effectuez un contrôle annuel de votre tension artérielle",
        ...commonRecommendations.slice(0, 2)
      ];
    case 'Normale':
      return [
        "Maintenez vos habitudes actuelles",
        "Contrôlez votre tension tous les 6 mois",
        ...commonRecommendations.slice(0, 3)
      ];
    case 'Normale haute':
      return [
        "Surveillez votre tension plus régulièrement",
        "Réduisez votre consommation de sel",
        "Contrôlez votre poids si nécessaire",
        ...commonRecommendations
      ];
    case 'Hypertension légère (Stade 1)':
      return [
        "Consultez votre médecin pour un suivi",
        "Suivez strictement les conseils d'hygiène de vie",
        "Contrôlez votre tension hebdomadairement",
        ...commonRecommendations
      ];
    case 'Hypertension modérée (Stade 2)':
      return [
        "Consultez rapidement votre médecin",
        "Un traitement médicamenteux peut être nécessaire",
        "Mesurez votre tension plusieurs fois par semaine",
        ...commonRecommendations
      ];
    case 'Hypertension sévère (Stade 3)':
      return [
        "Consultez un médecin en urgence",
        "Un traitement médicamenteux est nécessaire",
        "Suivez rigoureusement les prescriptions médicales",
        ...commonRecommendations
      ];
    default:
      return commonRecommendations;
  }
};

/**
 * Génère une analyse basée sur les mesures de tension artérielle
 */
export const generateMockAnalysis = (measurements: Measurement[], patientInfo?: PatientInfo): string => {
  if (!measurements || measurements.length === 0) {
    return "Aucune mesure disponible pour analyse. Veuillez enregistrer des mesures de tension artérielle pour obtenir une analyse.";
  }

  // Extraire les données de tension
  const systolicValues = measurements.map(m => m.systolic);
  const diastolicValues = measurements.map(m => m.diastolic);
  const pulseValues = measurements.map(m => m.pulse);
  
  // Calculer les moyennes
  const avgSystolic = calculateAverage(systolicValues);
  const avgDiastolic = calculateAverage(diastolicValues);
  const avgPulse = calculateAverage(pulseValues);
  
  // Déterminer les tendances
  const systolicTrend = determineTrend(systolicValues);
  const diastolicTrend = determineTrend(diastolicValues);
  const pulseTrend = determineTrend(pulseValues);
  
  // Classifier la pression artérielle moyenne
  const classification = classifyBloodPressure(avgSystolic, avgDiastolic);
  
  // Obtenir des recommandations
  const recommendations = getRecommendations(classification);

  // Construire l'analyse
  let analysis = `# Analyse de tension artérielle\n\n`;
  
  // Informations du patient si disponibles
  if (patientInfo) {
    analysis += `## Informations du patient\n`;
    analysis += `- **Nom**: ${patientInfo.name || 'Non spécifié'}\n`;
    analysis += `- **Âge**: ${patientInfo.age || 'Non spécifié'}\n`;
    analysis += `- **Sexe**: ${patientInfo.gender || 'Non spécifié'}\n`;
    if (patientInfo.medications && patientInfo.medications.length > 0) {
      analysis += `- **Médicaments**: ${patientInfo.medications.join(', ')}\n`;
    }
    analysis += '\n';
  }
  
  analysis += `## Résumé des mesures\n`;
  analysis += `- **Nombre de mesures analysées**: ${measurements.length}\n`;
  analysis += `- **Période d'analyse**: ${new Date(measurements[0].date).toLocaleDateString('fr-FR')} à ${new Date(measurements[measurements.length - 1].date).toLocaleDateString('fr-FR')}\n\n`;
  
  analysis += `## Valeurs moyennes\n`;
  analysis += `- **Tension systolique moyenne**: ${avgSystolic} mmHg (${systolicTrend === 'increasing' ? 'en augmentation' : systolicTrend === 'decreasing' ? 'en diminution' : systolicTrend === 'fluctuating' ? 'fluctuante' : 'stable'})\n`;
  analysis += `- **Tension diastolique moyenne**: ${avgDiastolic} mmHg (${diastolicTrend === 'increasing' ? 'en augmentation' : diastolicTrend === 'decreasing' ? 'en diminution' : diastolicTrend === 'fluctuating' ? 'fluctuante' : 'stable'})\n`;
  analysis += `- **Pouls moyen**: ${avgPulse} bpm (${pulseTrend === 'increasing' ? 'en augmentation' : pulseTrend === 'decreasing' ? 'en diminution' : pulseTrend === 'fluctuating' ? 'fluctuant' : 'stable'})\n\n`;
  
  analysis += `## Évaluation clinique\n`;
  analysis += `- **Classification**: ${classification}\n\n`;
  
  analysis += `## Interprétation\n`;
  
  // Interprétation basée sur la classification
  switch (classification) {
    case 'Optimale':
      analysis += `Votre tension artérielle est optimale, ce qui est excellent pour votre santé cardiovasculaire. Continuez à maintenir vos bonnes habitudes de vie.\n\n`;
      break;
    case 'Normale':
      analysis += `Votre tension artérielle est dans la plage normale. C'est une bonne nouvelle, mais restez vigilant et continuez à surveiller régulièrement vos mesures.\n\n`;
      break;
    case 'Normale haute':
      analysis += `Votre tension artérielle est à la limite supérieure de la normale. Bien que cela ne soit pas encore considéré comme de l'hypertension, c'est un signal pour porter une attention particulière à votre mode de vie et consulter régulièrement votre médecin.\n\n`;
      break;
    case 'Hypertension légère (Stade 1)':
      analysis += `Votre tension artérielle correspond à une hypertension légère (stade 1). À ce stade, des modifications du mode de vie sont généralement recommandées, et dans certains cas, un traitement médicamenteux peut être envisagé. Il est important de consulter votre médecin.\n\n`;
      break;
    case 'Hypertension modérée (Stade 2)':
      analysis += `Votre tension artérielle indique une hypertension modérée (stade 2). À ce niveau, un traitement médicamenteux est généralement nécessaire, en plus des changements de mode de vie. Une consultation médicale est fortement recommandée.\n\n`;
      break;
    case 'Hypertension sévère (Stade 3)':
      analysis += `Votre tension artérielle montre des signes d'hypertension sévère (stade 3). Cette situation nécessite une attention médicale immédiate. Veuillez consulter un médecin dès que possible pour une évaluation et un traitement appropriés.\n\n`;
      break;
    default:
      analysis += `Votre tension artérielle nécessite une surveillance continue. Il est recommandé de consulter votre médecin pour une évaluation plus précise.\n\n`;
  }
  
  // Tendances
  analysis += `### Tendances observées\n`;
  
  if (systolicTrend === 'increasing') {
    analysis += `- Votre tension systolique montre une tendance à la hausse, ce qui mérite attention.\n`;
  } else if (systolicTrend === 'decreasing') {
    analysis += `- Votre tension systolique montre une tendance à la baisse, ce qui est généralement positif si vous suivez un traitement ou avez apporté des changements à votre mode de vie.\n`;
  } else if (systolicTrend === 'fluctuating') {
    analysis += `- Votre tension systolique présente des fluctuations importantes, ce qui peut indiquer une instabilité cardiovasculaire ou être lié à des facteurs externes comme le stress, l'alimentation ou l'activité physique.\n`;
  } else {
    analysis += `- Votre tension systolique est relativement stable.\n`;
  }
  
  if (diastolicTrend === 'increasing') {
    analysis += `- Votre tension diastolique montre une tendance à la hausse, ce qui peut indiquer une augmentation de la résistance vasculaire périphérique.\n`;
  } else if (diastolicTrend === 'decreasing') {
    analysis += `- Votre tension diastolique montre une tendance à la baisse, ce qui peut être bénéfique dans le contexte d'une hypertension.\n`;
  } else if (diastolicTrend === 'fluctuating') {
    analysis += `- Votre tension diastolique présente des variations notables qui méritent une surveillance.\n`;
  } else {
    analysis += `- Votre tension diastolique reste stable, ce qui est généralement un bon signe.\n`;
  }
  
  analysis += `\n## Recommandations\n`;
  recommendations.forEach(rec => {
    analysis += `- ${rec}\n`;
  });
  
  analysis += `\n---\n`;
  analysis += `*Cette analyse est générée automatiquement par T-Cardio AI à titre informatif uniquement et ne remplace pas l'avis d'un professionnel de santé. Consultez toujours votre médecin pour des conseils médicaux personnalisés.*`;
  
  return analysis;
};

/**
 * Génère un rapport de santé complet
 */
export const generateMockHealthReport = (measurements: Measurement[], patientInfo?: PatientInfo): string => {
  const analysis = generateMockAnalysis(measurements, patientInfo);
  
  // Ajouter des sections supplémentaires pour un rapport complet
  let report = analysis;
  
  // Ajouter des prédictions de tendances
  report += `\n\n## Prédictions de tendances\n\n`;
  
  if (measurements.length >= 10) {
    const recentMeasurements = measurements.slice(-10);
    const systolicValues = recentMeasurements.map(m => m.systolic);
    const diastolicValues = recentMeasurements.map(m => m.diastolic);
    
    const systolicTrend = determineTrend(systolicValues);
    const diastolicTrend = determineTrend(diastolicValues);
    
    report += `### Projection à court terme\n`;
    report += `En se basant sur vos mesures récentes, voici les tendances projetées pour les prochaines semaines :\n\n`;
    
    if (systolicTrend === 'increasing') {
      report += `- **Tension systolique** : Si la tendance actuelle se maintient, votre tension systolique pourrait continuer à augmenter. Un suivi plus rigoureux et une consultation médicale sont recommandés.\n`;
    } else if (systolicTrend === 'decreasing') {
      report += `- **Tension systolique** : La tendance à la baisse observée est encourageante et suggère que vos efforts ou votre traitement ont un impact positif. Continuez dans cette voie.\n`;
    } else if (systolicTrend === 'fluctuating') {
      report += `- **Tension systolique** : Les fluctuations observées suggèrent une instabilité qui mérite attention. Essayez d'identifier les facteurs qui pourraient expliquer ces variations (stress, alimentation, activité physique, prise irrégulière de médicaments).\n`;
    } else {
      report += `- **Tension systolique** : Votre tension systolique montre une stabilité rassurante. Continuez votre suivi régulier.\n`;
    }
    
    if (diastolicTrend === 'increasing') {
      report += `- **Tension diastolique** : La tendance à la hausse de votre tension diastolique nécessite attention. Cela peut indiquer un stress cardiovasculaire accru.\n`;
    } else if (diastolicTrend === 'decreasing') {
      report += `- **Tension diastolique** : La diminution progressive de votre tension diastolique est un signe positif, particulièrement si vous avez récemment modifié votre mode de vie ou commencé un traitement.\n`;
    } else if (diastolicTrend === 'fluctuating') {
      report += `- **Tension diastolique** : Les variations observées dans votre tension diastolique suggèrent une réactivité vasculaire qui mérite d'être surveillée.\n`;
    } else {
      report += `- **Tension diastolique** : Votre tension diastolique présente une stabilité rassurante.\n`;
    }
  } else {
    report += `Nombre insuffisant de mesures pour établir des prédictions fiables. Continuez à enregistrer régulièrement vos mesures pour obtenir des analyses de tendances plus précises.\n`;
  }
  
  report += `\n### Facteurs de risque\n`;
  
  // Évaluation des facteurs de risque basée sur les moyennes
  const avgSystolic = calculateAverage(measurements.map(m => m.systolic));
  const avgDiastolic = calculateAverage(measurements.map(m => m.diastolic));
  
  let riskFactors = [];
  
  if (avgSystolic >= 140 || avgDiastolic >= 90) {
    riskFactors.push("Hypertension artérielle");
  }
  
  if (patientInfo?.age && parseInt(patientInfo.age) > 65) {
    riskFactors.push("Âge avancé (plus de 65 ans)");
  }
  
  if (patientInfo?.medications && patientInfo.medications.some(med => 
    med.toLowerCase().includes("diabet") || 
    med.toLowerCase().includes("insulin")
  )) {
    riskFactors.push("Diabète (suggéré par les médicaments mentionnés)");
  }
  
  if (patientInfo?.medications && patientInfo.medications.some(med => 
    med.toLowerCase().includes("cholest") || 
    med.toLowerCase().includes("statin") ||
    med.toLowerCase().includes("lipid")
  )) {
    riskFactors.push("Dyslipidémie (suggérée par les médicaments mentionnés)");
  }
  
  if (riskFactors.length > 0) {
    report += `Basé sur vos mesures et les informations disponibles, voici les facteurs de risque cardiovasculaire identifiés :\n`;
    riskFactors.forEach(risk => {
      report += `- ${risk}\n`;
    });
    
    if (riskFactors.length >= 2) {
      report += `\nLa présence de multiples facteurs de risque augmente significativement votre risque cardiovasculaire global. Une prise en charge médicale appropriée est fortement recommandée.\n`;
    }
  } else {
    report += `Aucun facteur de risque majeur n'a été identifié à partir des données disponibles. Continuez à maintenir un mode de vie sain.\n`;
  }
  
  return report;
};

/**
 * Prédit les tendances futures des mesures
 */
export const generateMockTrendPrediction = (measurements: Measurement[]): string => {
  if (measurements.length < 7) {
    return "Nombre insuffisant de mesures pour établir une prédiction fiable. Veuillez enregistrer au moins 7 mesures.";
  }
  
  // Extraire les données des 30 derniers jours au maximum
  const recentMeasurements = measurements.slice(-30);
  const systolicValues = recentMeasurements.map(m => m.systolic);
  const diastolicValues = recentMeasurements.map(m => m.diastolic);
  const pulseValues = recentMeasurements.map(m => m.pulse);
  
  // Calculer les moyennes
  const avgSystolic = calculateAverage(systolicValues);
  const avgDiastolic = calculateAverage(diastolicValues);
  const avgPulse = calculateAverage(pulseValues);
  
  // Déterminer les tendances
  const systolicTrend = determineTrend(systolicValues);
  const diastolicTrend = determineTrend(diastolicValues);
  const pulseTrend = determineTrend(pulseValues);
  
  // Prédire les valeurs futures (simple projection linéaire)
  const predictFutureValue = (values: number[], trend: string): number => {
    if (trend === 'stable') return values[values.length - 1];
    
    if (values.length < 3) return values[values.length - 1];
    
    // Calculer la variation moyenne sur les dernières mesures
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }
    const avgChange = totalChange / (values.length - 1);
    
    // Appliquer la variation moyenne pour prédire la prochaine valeur
    const predictedValue = Math.round(values[values.length - 1] + avgChange);
    
    return predictedValue;
  };
  
  const predictedSystolic = predictFutureValue(systolicValues, systolicTrend);
  const predictedDiastolic = predictFutureValue(diastolicValues, diastolicTrend);
  const predictedPulse = predictFutureValue(pulseValues, pulseTrend);
  
  // Générer l'analyse
  let prediction = `# Prédiction des tendances futures\n\n`;
  
  prediction += `## Résumé des tendances actuelles\n`;
  prediction += `- **Tension systolique** : ${systolicTrend === 'increasing' ? 'En augmentation' : systolicTrend === 'decreasing' ? 'En diminution' : systolicTrend === 'fluctuating' ? 'Fluctuante' : 'Stable'}\n`;
  prediction += `- **Tension diastolique** : ${diastolicTrend === 'increasing' ? 'En augmentation' : diastolicTrend === 'decreasing' ? 'En diminution' : diastolicTrend === 'fluctuating' ? 'Fluctuante' : 'Stable'}\n`;
  prediction += `- **Pouls** : ${pulseTrend === 'increasing' ? 'En augmentation' : pulseTrend === 'decreasing' ? 'En diminution' : pulseTrend === 'fluctuating' ? 'Fluctuant' : 'Stable'}\n\n`;
  
  prediction += `## Projections à court terme\n`;
  prediction += `Si les tendances actuelles se maintiennent, voici les valeurs projetées pour vos prochaines mesures :\n\n`;
  prediction += `- **Tension systolique** : Environ ${predictedSystolic} mmHg\n`;
  prediction += `- **Tension diastolique** : Environ ${predictedDiastolic} mmHg\n`;
  prediction += `- **Pouls** : Environ ${predictedPulse} bpm\n\n`;
  
  // Interprétation des tendances
  prediction += `## Interprétation des tendances\n\n`;
  
  // Interprétation de la tension systolique
  prediction += `### Tension systolique\n`;
  if (systolicTrend === 'increasing') {
    prediction += `L'augmentation progressive de votre tension systolique mérite attention. `;
    if (predictedSystolic >= 140) {
      prediction += `La projection indique que votre tension pourrait atteindre ou dépasser le seuil d'hypertension si cette tendance se poursuit. Il est recommandé de :\n\n`;
      prediction += `- Surveiller plus fréquemment votre tension\n`;
      prediction += `- Revoir votre consommation de sel\n`;
      prediction += `- Consulter votre médecin si cette tendance persiste\n`;
    } else {
      prediction += `Cependant, les valeurs projetées restent dans une plage acceptable. Continuez à surveiller régulièrement.\n`;
    }
  } else if (systolicTrend === 'decreasing') {
    prediction += `La diminution de votre tension systolique est généralement un signe positif, surtout si vous avez récemment commencé un traitement ou modifié votre mode de vie. `;
    if (predictedSystolic < 90) {
      prediction += `Attention toutefois, car une tension trop basse peut également être problématique. Consultez votre médecin si vous ressentez des vertiges ou une fatigue inhabituelle.\n`;
    } else {
      prediction += `Les valeurs projetées se maintiennent dans une plage saine.\n`;
    }
  } else if (systolicTrend === 'fluctuating') {
    prediction += `Les fluctuations importantes de votre tension systolique pourraient indiquer une réactivité cardiovasculaire accrue ou l'influence de facteurs externes variables (stress, alimentation, activité physique). Essayez d'identifier ce qui pourrait expliquer ces variations.\n`;
  } else {
    prediction += `Votre tension systolique reste stable, ce qui est généralement un bon signe de contrôle cardiovasculaire.\n`;
  }
  
  prediction += `\n### Tension diastolique\n`;
  if (diastolicTrend === 'increasing') {
    prediction += `L'augmentation de votre tension diastolique mérite attention car elle reflète la pression dans vos artères lorsque votre cœur est au repos. `;
    if (predictedDiastolic >= 90) {
      prediction += `La projection indique que votre tension diastolique pourrait atteindre ou dépasser le seuil d'hypertension. Une consultation médicale est recommandée si cette tendance se confirme.\n`;
    } else {
      prediction += `Les valeurs projetées restent toutefois dans une plage acceptable.\n`;
    }
  } else if (diastolicTrend === 'decreasing') {
    prediction += `La diminution de votre tension diastolique est généralement positive, surtout si vous étiez en situation d'hypertension. `;
    if (predictedDiastolic < 60) {
      prediction += `Attention cependant à l'hypotension qui peut causer des vertiges. Parlez-en à votre médecin si nécessaire.\n`;
    } else {
      prediction += `Les valeurs projetées se maintiennent dans une plage saine.\n`;
    }
  } else if (diastolicTrend === 'fluctuating') {
    prediction += `Les variations de votre tension diastolique méritent attention et pourraient refléter une variabilité de la résistance vasculaire périphérique.\n`;
  } else {
    prediction += `Votre tension diastolique demeure stable, ce qui est généralement un bon indicateur de santé cardiovasculaire.\n`;
  }
  
  // Recommandations finales
  prediction += `\n## Recommandations générales\n\n`;
  prediction += `- Continuez à mesurer régulièrement votre tension artérielle\n`;
  prediction += `- Notez les circonstances de vos mesures (heure, position, avant/après repas)\n`;
  prediction += `- Maintenez une alimentation équilibrée, faible en sel\n`;
  prediction += `- Pratiquez une activité physique régulière adaptée à votre condition\n`;
  
  // Avertissement
  prediction += `\n---\n`;
  prediction += `*Cette prédiction est générée automatiquement par T-Cardio AI à titre informatif uniquement et ne remplace pas l'avis d'un professionnel de santé. Les projections sont basées sur des tendances simples et peuvent ne pas refléter l'évolution réelle de votre tension artérielle. Consultez toujours votre médecin pour des conseils médicaux personnalisés.*`;
  
  return prediction;
};

// Export du service mock complet
export const MockAIService = {
  generateAnalysis: generateMockAnalysis,
  generateHealthReport: generateMockHealthReport,
  predictTrends: generateMockTrendPrediction
};
