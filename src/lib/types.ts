/**
 * Types communs pour l'application
 */

// Type pour une mesure de pression artérielle et de pouls
export interface Measurement {
  id: string;
  date: string;
  systolic: number;  // Systolique (pression maximale)
  diastolic: number; // Diastolique (pression minimale)
  pulse: number;     // Pouls (battements par minute)
  notes: string;     // Notes ou commentaires
  userId: string;    // ID de l'utilisateur
}

// Type pour les informations du patient
export interface PatientInfo {
  id: string;
  displayName: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  medicalConditions?: string[];
  medications?: string[];
}

// Type pour un rapport médical
export interface MedicalReport {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  userId: string;
  measurementIds: string[];  // IDs des mesures incluses dans le rapport
  summary?: string;          // Résumé court du rapport
  recommendations?: string;  // Recommandations médicales
  riskFactors?: string[];    // Facteurs de risque identifiés
}

// Type pour les options de partage
export interface SharingOptions {
  id: string;
  userId: string;
  targetEmail?: string;      // Email du destinataire
  accessCode?: string;       // Code d'accès (optionnel)
  expiresAt?: string;        // Date d'expiration (optionnel)
  reportIds: string[];       // IDs des rapports partagés
  measurementIds: string[];  // IDs des mesures partagées
  readonly: boolean;         // Mode lecture seule
}

// Type pour les statistiques
export interface Statistics {
  averageSystolic: number;
  averageDiastolic: number;
  averagePulse: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  minPulse: number;
  maxPulse: number;
  totalMeasurements: number;
  firstMeasurementDate: string;
  lastMeasurementDate: string;
}
