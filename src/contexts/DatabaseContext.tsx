"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db, TCardioDatabase } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { Measurement, PatientInfo, MedicalReport, ShareToken } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from '@/hooks/use-toast';

// Type du contexte
interface DatabaseContextType {
  isInitialized: boolean;
  addMeasurement: (measurement: Omit<Measurement, 'id'>) => Promise<string>;
  deleteMeasurement: (id: string) => Promise<void>;
  getMeasurements: () => Measurement[];
  addReport: (report: Omit<MedicalReport, 'id'>) => Promise<string>;
  getReports: () => MedicalReport[];
  addShareToken: (token: Omit<ShareToken, 'id'>) => Promise<string>;
  getShareTokens: () => ShareToken[];
  deactivateShareToken: (id: string) => Promise<void>;
  exportData: () => Promise<Blob>;
  clearAllData: () => Promise<void>;
}

// Création du contexte avec une valeur par défaut
const DatabaseContext = createContext<DatabaseContextType | null>(null);

// Hook personnalisé pour accéder au contexte
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase doit être utilisé à l\'intérieur d\'un DatabaseProvider');
  }
  return context;
};

// Propriétés du provider
interface DatabaseProviderProps {
  children: ReactNode;
}

// Composant Provider de la base de données
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  // Utilisation de useLiveQuery pour obtenir des données réactives
  const measurements = useLiveQuery(
    () => userId ? db.measurements.where('userId').equals(userId).toArray() : [],
    [userId]
  ) || [];
  
  const reports = useLiveQuery(
    () => userId ? db.reports.where('userId').equals(userId).toArray() : [],
    [userId]
  ) || [];
  
  const shareTokens = useLiveQuery(
    () => userId ? db.shareTokens.where('userId').equals(userId).toArray() : [],
    [userId]
  ) || [];

  // Initialisation de la base de données et migration des données
  useEffect(() => {
    if (!userId || isInitialized) return;

    const initDatabase = async () => {
      try {
        // Migrer les données du localStorage vers IndexedDB
        await db.migrateFromLocalStorage();
        
        // Vérifier si l'utilisateur existe déjà dans la base de données
        const existingUser = await db.users.get(userId);
        
        // Si l'utilisateur n'existe pas, l'ajouter
        if (!existingUser && user) {
          // S'assurer que le genre est une valeur valide
          let gender: 'male' | 'female' | 'other' | undefined = undefined;
          if (user.gender === 'male' || user.gender === 'female' || user.gender === 'other') {
            gender = user.gender;
          }

          // S'assurer que le rôle est une valeur valide
          let role: 'patient' | 'doctor' | 'admin' | undefined = 'patient';
          if (user.role === 'patient' || user.role === 'doctor' || user.role === 'admin') {
            role = user.role;
          }

          await db.users.add({
            ...user,
            gender: gender,
            role: role,
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        setIsInitialized(true);
        console.log('Base de données initialisée avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        toast({
          title: 'Erreur',
          description: 'Un problème est survenu lors de l\'initialisation de la base de données locale.',
          variant: 'destructive',
        });
      }
    };

    initDatabase();
  }, [userId, user, isInitialized]);

  // Fonction pour ajouter une nouvelle mesure
  const addMeasurement = async (measurementData: Omit<Measurement, 'id'>): Promise<string> => {
    if (!userId) throw new Error('Utilisateur non connecté');
    
    const newMeasurement: Measurement = {
      ...measurementData,
      id: crypto.randomUUID(),
      userId,
      date: measurementData.date || new Date().toISOString()
    };
    
    try {
      const id = await db.addMeasurement(newMeasurement);
      
      // Ajout dans localStorage pour compatibilité
      const storedMeasurements = localStorage.getItem('measurements');
      const measurements = storedMeasurements ? JSON.parse(storedMeasurements) : [];
      measurements.unshift(newMeasurement);
      localStorage.setItem('measurements', JSON.stringify(measurements));
      
      return id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la mesure:', error);
      throw error;
    }
  };

  // Fonction pour supprimer une mesure
  const deleteMeasurement = async (id: string): Promise<void> => {
    try {
      await db.deleteMeasurement(id);
      
      // Mise à jour du localStorage pour compatibilité
      const storedMeasurements = localStorage.getItem('measurements');
      if (storedMeasurements) {
        const measurements = JSON.parse(storedMeasurements);
        const updatedMeasurements = measurements.filter((m: Measurement) => m.id !== id);
        localStorage.setItem('measurements', JSON.stringify(updatedMeasurements));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la mesure:', error);
      throw error;
    }
  };

  // Fonction pour ajouter un nouveau rapport
  const addReport = async (reportData: Omit<MedicalReport, 'id'>): Promise<string> => {
    if (!userId) throw new Error('Utilisateur non connecté');
    
    const newReport: MedicalReport = {
      ...reportData,
      id: crypto.randomUUID(),
      userId,
      createdAt: reportData.createdAt || new Date().toISOString()
    };
    
    try {
      const id = await db.addReport(newReport);
      
      // Ajout dans localStorage pour compatibilité
      const storedReports = localStorage.getItem('reports');
      const reports = storedReports ? JSON.parse(storedReports) : [];
      reports.unshift(newReport);
      localStorage.setItem('reports', JSON.stringify(reports));
      
      return id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rapport:', error);
      throw error;
    }
  };

  // Fonction pour ajouter un nouveau token de partage
  const addShareToken = async (tokenData: Omit<ShareToken, 'id'>): Promise<string> => {
    if (!userId) throw new Error('Utilisateur non connecté');
    
    const newToken: ShareToken = {
      ...tokenData,
      id: crypto.randomUUID(),
      userId,
      createdAt: tokenData.createdAt || new Date().toISOString(),
      isActive: true
    };
    
    try {
      const id = await db.addShareToken(newToken);
      
      // Ajout dans localStorage pour compatibilité
      const storedTokens = localStorage.getItem('shareTokens');
      const tokens = storedTokens ? JSON.parse(storedTokens) : [];
      tokens.unshift(newToken);
      localStorage.setItem('shareTokens', JSON.stringify(tokens));
      
      return id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du token de partage:', error);
      throw error;
    }
  };

  // Fonction pour désactiver un token de partage
  const deactivateShareToken = async (id: string): Promise<void> => {
    try {
      await db.deactivateShareToken(id);
      
      // Mise à jour du localStorage pour compatibilité
      const storedTokens = localStorage.getItem('shareTokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        const updatedTokens = tokens.map((t: ShareToken) => 
          t.id === id ? { ...t, isActive: false } : t
        );
        localStorage.setItem('shareTokens', JSON.stringify(updatedTokens));
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation du token de partage:', error);
      throw error;
    }
  };

  // Fonction pour exporter toutes les données utilisateur
  const exportData = async (): Promise<Blob> => {
    if (!userId) throw new Error('Utilisateur non connecté');
    
    try {
      const userData = await db.exportUserData(userId);
      const jsonString = JSON.stringify(userData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
      throw error;
    }
  };

  // Fonction pour effacer toutes les données utilisateur
  const clearAllData = async (): Promise<void> => {
    if (!userId) throw new Error('Utilisateur non connecté');
    
    try {
      // Supprimer toutes les données de l'utilisateur
      await db.measurements.where('userId').equals(userId).delete();
      await db.reports.where('userId').equals(userId).delete();
      await db.shareTokens.where('userId').equals(userId).delete();
      
      // Effacer du localStorage pour compatibilité
      localStorage.removeItem('measurements');
      localStorage.removeItem('reports');
      localStorage.removeItem('shareTokens');
      
      toast({
        title: 'Données effacées',
        description: 'Toutes vos données ont été supprimées avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  };

  // Fonctions accesseur pour les données
  const getMeasurements = () => measurements;
  const getReports = () => reports;
  const getShareTokens = () => shareTokens;

  const value = {
    isInitialized,
    addMeasurement,
    deleteMeasurement,
    getMeasurements,
    addReport,
    getReports,
    addShareToken,
    getShareTokens,
    deactivateShareToken,
    exportData,
    clearAllData
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}
