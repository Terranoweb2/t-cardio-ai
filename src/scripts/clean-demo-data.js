// Script pour nettoyer toutes les données de démonstration
// À exécuter avant le déploiement en production

console.log('Suppression des données de démonstration...');

// Supprimer les données du localStorage
function clearLocalStorageData() {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('measurements');
    localStorage.removeItem('reports');
    localStorage.removeItem('shareTokens');
    localStorage.removeItem('loginTimestamp');
    
    // Supprimer tous les autres éléments qui pourraient contenir des données de test
    const keysToKeep = []; // Liste des clés à conserver (vide = tout supprimer)
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('Données localStorage supprimées avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression des données localStorage:', error);
  }
}

// Supprimer les données de sessionStorage
function clearSessionStorageData() {
  try {
    sessionStorage.clear();
    console.log('Données sessionStorage supprimées avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression des données sessionStorage:', error);
  }
}

// Nettoyer la base de données IndexedDB
// Cette fonction doit être appelée dans un contexte client (navigateur)
async function clearIndexedDBData() {
  try {
    if (typeof window !== 'undefined') {
      // Importer dynamiquement la base de données
      const { db } = await import('../lib/database.js');
      
      // Utiliser la méthode clearAllData que nous avons créée
      await db.clearAllData();
      console.log('Données IndexedDB supprimées avec succès');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des données IndexedDB:', error);
  }
}

// Exécuter la suppression des données
if (typeof window !== 'undefined') {
  clearLocalStorageData();
  clearSessionStorageData();
  clearIndexedDBData().catch(console.error);
  
  console.log('Nettoyage des données de démonstration terminé.');
}

// Note: Ce script doit être exécuté dans le navigateur
// Exemple d'utilisation:
// 1. Ouvrir la console du navigateur
// 2. Coller ce code ou l'importer comme module
// 3. Les données de démonstration seront supprimées
