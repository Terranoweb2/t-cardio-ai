import Dexie, { Table } from 'dexie';
import { Measurement, PatientInfo, MedicalReport, ShareToken } from '@/lib/types';

/**
 * TCardioDatabase - Base de données locale IndexedDB pour l'application T-Cardio AI
 * Elle stocke toutes les informations utilisateur : profil, mesures, rapports, etc.
 */
export class TCardioDatabase extends Dexie {
  // Tables
  users!: Table<PatientInfo>;
  measurements!: Table<Measurement>;
  reports!: Table<MedicalReport>;
  shareTokens!: Table<ShareToken>;

  constructor() {
    super('TCardioDatabase');
    
    // Définition du schéma de la base de données
    this.version(1).stores({
      users: 'id, email, displayName',
      measurements: 'id, userId, date, [userId+date]',
      reports: 'id, userId, createdAt, [userId+createdAt]',
      shareTokens: 'id, userId, recipientEmail, createdAt, [userId+createdAt]'
    });
  }

  /**
   * Obtenir le profil de l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<PatientInfo | null> {
    try {
      // Récupérer l'ID utilisateur du localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      
      const userData = JSON.parse(storedUser);
      const userId = userData.id;
      
      // Récupérer l'utilisateur depuis la base de données
      let user = await this.users.get(userId) || null;
      
      // Si l'utilisateur n'existe pas encore dans la base de données IndexedDB,
      // l'ajouter depuis les données du localStorage
      if (!user) {
        // S'assurer que le genre est une valeur valide
        let gender: 'male' | 'female' | 'other' | undefined = undefined;
        if (userData.gender === 'male' || userData.gender === 'female' || userData.gender === 'other') {
          gender = userData.gender as 'male' | 'female' | 'other';
        }
        
        const newUser: PatientInfo = {
          ...userData,
          id: userId,
          displayName: userData.displayName || userData.name || 'Utilisateur',
          email: userData.email || 'utilisateur@exemple.fr',
          gender: gender,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: userData.role as ('patient' | 'doctor' | 'admin' | undefined) || 'patient'
        };
        await this.users.add(newUser);
        user = newUser;
      }
      
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Obtenir toutes les mesures d'un utilisateur
   */
  async getUserMeasurements(userId: string): Promise<Measurement[]> {
    try {
      return await this.measurements
        .where('userId')
        .equals(userId)
        .toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des mesures:', error);
      return [];
    }
  }

  /**
   * Ajouter une nouvelle mesure
   */
  async addMeasurement(measurement: Measurement): Promise<string> {
    try {
      const id = await this.measurements.add(measurement);
      return id as string;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la mesure:', error);
      throw error;
    }
  }

  /**
   * Supprimer une mesure
   */
  async deleteMeasurement(id: string): Promise<void> {
    try {
      await this.measurements.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de la mesure:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les rapports d'un utilisateur
   */
  async getUserReports(userId: string): Promise<MedicalReport[]> {
    try {
      return await this.reports
        .where('userId')
        .equals(userId)
        .reverse() // Du plus récent au plus ancien
        .toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      return [];
    }
  }

  /**
   * Ajouter un nouveau rapport
   */
  async addReport(report: MedicalReport): Promise<string> {
    try {
      const id = await this.reports.add(report);
      return id as string;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rapport:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les tokens de partage d'un utilisateur
   */
  async getUserShareTokens(userId: string): Promise<ShareToken[]> {
    try {
      return await this.shareTokens
        .where('userId')
        .equals(userId)
        .reverse() // Du plus récent au plus ancien
        .toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des tokens de partage:', error);
      return [];
    }
  }

  /**
   * Ajouter un nouveau token de partage
   */
  async addShareToken(token: ShareToken): Promise<string> {
    try {
      const id = await this.shareTokens.add(token);
      return id as string;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du token de partage:', error);
      throw error;
    }
  }

  /**
   * Désactiver un token de partage
   */
  async deactivateShareToken(id: string): Promise<void> {
    try {
      await this.shareTokens.update(id, { isActive: false });
    } catch (error) {
      console.error('Erreur lors de la désactivation du token de partage:', error);
      throw error;
    }
  }

  /**
   * Migrer les données du localStorage vers IndexedDB
   * Cette fonction est utilisée lors de la première initialisation pour transférer
   * les données existantes du localStorage vers la base de données IndexedDB
   */
  async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('Migration des données depuis localStorage...');
      
      // Mesures
      const storedMeasurements = localStorage.getItem('measurements');
      if (storedMeasurements) {
        const measurements = JSON.parse(storedMeasurements) as Measurement[];
        
        // S'assurer que chaque mesure a un ID unique et un userId
        for (const measurement of measurements) {
          if (!measurement.id) {
            measurement.id = crypto.randomUUID();
          }
          
          const existingMeasurement = await this.measurements.get(measurement.id);
          if (!existingMeasurement) {
            await this.measurements.add(measurement);
          }
        }
        
        console.log(`${measurements.length} mesures migrées`);
      }
      
      // Rapports
      const storedReports = localStorage.getItem('reports');
      if (storedReports) {
        const reports = JSON.parse(storedReports) as MedicalReport[];
        
        for (const report of reports) {
          if (!report.id) {
            report.id = crypto.randomUUID();
          }
          
          const existingReport = await this.reports.get(report.id);
          if (!existingReport) {
            await this.reports.add(report);
          }
        }
        
        console.log(`${reports.length} rapports migrés`);
      }
      
      // Tokens de partage
      const storedShareTokens = localStorage.getItem('shareTokens');
      if (storedShareTokens) {
        const shareTokens = JSON.parse(storedShareTokens) as ShareToken[];
        
        for (const token of shareTokens) {
          if (!token.id) {
            token.id = crypto.randomUUID();
          }
          
          const existingToken = await this.shareTokens.get(token.id);
          if (!existingToken) {
            await this.shareTokens.add(token);
          }
        }
        
        console.log(`${shareTokens.length} tokens de partage migrés`);
      }
      
      console.log('Migration terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la migration des données:', error);
      throw error;
    }
  }
  
  /**
   * Exporter toutes les données de l'utilisateur
   */
  async exportUserData(userId: string): Promise<{
    user: PatientInfo | null;
    measurements: Measurement[];
    reports: MedicalReport[];
    shareTokens: ShareToken[];
  }> {
    const user = await this.users.get(userId) || null;
    const measurements = await this.getUserMeasurements(userId);
    const reports = await this.getUserReports(userId);
    const shareTokens = await this.getUserShareTokens(userId);
    
    return {
      user,
      measurements,
      reports,
      shareTokens
    };
  }
}

// Instance unique de la base de données
export const db = new TCardioDatabase();
