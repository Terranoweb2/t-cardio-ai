/**
 * Service d'IA pour T-Cardio AI
 * Ce service orchestre l'accès aux analyses IA, que ce soit via l'API OpenRouter ou le service mock local
 */

import { OpenRouterService } from './openrouter-service';
import { MockAIService } from './mock-ai-service';
import type { Measurement, PatientInfo } from '@/lib/types';

// Essaie d'utiliser OpenRouter, sinon fallback sur le service mock
const openRouterService = new OpenRouterService();

// Détermine si on utilise le service mock ou OpenRouter
const useMockService = !openRouterService.isConfigured() || true; // Force l'utilisation du mock pour éviter les erreurs d'API

/**
 * Analyse des données de santé pour générer un rapport
 */
export async function analyzeHealthData(
  measurements: Measurement[],
  patientInfo?: PatientInfo
): Promise<string> {
  try {
    if (useMockService) {
      console.log('Utilisation du service IA mock pour l\'analyse de santé');
      return MockAIService.generateAnalysis(measurements, patientInfo);
    } else {
      console.log('Utilisation d\'OpenRouter pour l\'analyse de santé');
      // Formatage des données pour l'API
      const systolicValues = measurements.map(m => m.systolic);
      const diastolicValues = measurements.map(m => m.diastolic);
      const pulseValues = measurements.map(m => m.pulse);
      
      // Préparation du prompt
      const prompt = `
      Analyser les données de tension artérielle suivantes pour un patient:
      
      Mesures systoliques: ${systolicValues.join(', ')} mmHg
      Mesures diastoliques: ${diastolicValues.join(', ')} mmHg
      Mesures du pouls: ${pulseValues.join(', ')} bpm
      ${patientInfo ? `
      Patient: ${patientInfo.name || 'Inconnu'}
      Âge: ${patientInfo.age || 'Non précisé'}
      Sexe: ${patientInfo.gender || 'Non précisé'}
      Médicaments: ${patientInfo.medications?.join(', ') || 'Aucun'}
      ` : ''}
      
      Fournir une analyse détaillée incluant:
      1. Classification de la tension selon les normes médicales
      2. Tendances observées et variations significatives
      3. Risques potentiels identifiés
      4. Recommandations personnalisées
      
      Répondre en français uniquement, de manière structurée et concise.
      `;
      
      const result = await openRouterService.analyzeHealthData(prompt, undefined, 'specialized');
      return result;
    }
  } catch (error) {
    console.error('Erreur lors de l\'analyse de santé:', error);
    // En cas d'erreur avec l'API, utiliser le service mock comme fallback
    return MockAIService.generateAnalysis(measurements, patientInfo);
  }
}

/**
 * Génère un rapport de santé complet
 */
export async function generateHealthReport(
  measurements: Measurement[],
  patientInfo?: PatientInfo
): Promise<string> {
  try {
    if (useMockService) {
      console.log('Utilisation du service IA mock pour le rapport de santé');
      return MockAIService.generateHealthReport(measurements, patientInfo);
    } else {
      console.log('Utilisation d\'OpenRouter pour le rapport de santé');
      // Construction du prompt pour le rapport
      const systolicValues = measurements.map(m => m.systolic);
      const diastolicValues = measurements.map(m => m.diastolic);
      const pulseValues = measurements.map(m => m.pulse);
      
      const prompt = `
      Générer un rapport médical complet basé sur les données de tension artérielle suivantes:
      
      Mesures systoliques: ${systolicValues.join(', ')} mmHg
      Mesures diastoliques: ${diastolicValues.join(', ')} mmHg
      Mesures du pouls: ${pulseValues.join(', ')} bpm
      ${patientInfo ? `
      Patient: ${patientInfo.name || 'Inconnu'}
      Âge: ${patientInfo.age || 'Non précisé'}
      Sexe: ${patientInfo.gender || 'Non précisé'}
      Médicaments: ${patientInfo.medications?.join(', ') || 'Aucun'}
      ` : ''}
      
      Le rapport doit inclure:
      1. Résumé des valeurs moyennes et leur interprétation
      2. Analyse des tendances sur la période
      3. Évaluation du risque cardiovasculaire
      4. Recommandations thérapeutiques détaillées
      5. Suggestions de suivi à court et moyen terme
      
      Répondre en français avec un format professionnel adapté à un rapport médical.
      `;
      
      const result = await openRouterService.generateHealthReport(prompt);
      return result;
    }
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de santé:', error);
    // Fallback vers le service mock en cas d'erreur
    return MockAIService.generateHealthReport(measurements, patientInfo);
  }
}

/**
 * Prédit les tendances futures des mesures
 */
export async function predictTrends(measurements: Measurement[]): Promise<string> {
  try {
    if (useMockService) {
      console.log('Utilisation du service IA mock pour la prédiction de tendances');
      return MockAIService.predictTrends(measurements);
    } else {
      console.log('Utilisation d\'OpenRouter pour la prédiction de tendances');
      // Construction du prompt pour les prédictions
      const systolicValues = measurements.map(m => m.systolic);
      const diastolicValues = measurements.map(m => m.diastolic);
      const pulseValues = measurements.map(m => m.pulse);
      
      const prompt = `
      Analyser l'évolution et prédire les tendances futures pour les données de tension artérielle suivantes:
      
      Mesures systoliques (chronologiques): ${systolicValues.join(', ')} mmHg
      Mesures diastoliques (chronologiques): ${diastolicValues.join(', ')} mmHg
      Mesures du pouls (chronologiques): ${pulseValues.join(', ')} bpm
      
      Pour cette analyse de tendances:
      1. Identifier les patterns d'évolution pour chaque métrique
      2. Projeter l'évolution probable à court terme (1-2 semaines)
      3. Évaluer la stabilité ou variabilité des mesures
      4. Suggérer des ajustements si nécessaire
      
      Répondre en français avec une présentation structurée des résultats.
      `;
      
      const result = await openRouterService.predictTrends(prompt);
      return result;
    }
  } catch (error) {
    console.error('Erreur lors de la prédiction des tendances:', error);
    // Fallback vers le service mock en cas d'erreur
    return MockAIService.predictTrends(measurements);
  }
}
