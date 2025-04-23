/**
 * Utilitaire pour effacer toutes les données de test du localStorage
 * Utiliser avec précaution - Cette opération est irréversible
 */

export function clearLocalStorageData() {
  const localStorageKeys = [
    'user',
    'token',
    'measurements',
    'shares',
    'reports',
    'incomingShares',
    'sharedMeasurements',
    'userPreferences',
    'lastAnalysis'
  ];

  // Effacer chaque clé individuellement
  localStorageKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Données '${key}' effacées du localStorage`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de '${key}':`, error);
    }
  });

  console.log('✅ Toutes les données du localStorage ont été effacées');
  return true;
}

// Fonction pour usage direct dans la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).clearTCardioData = clearLocalStorageData;
}
