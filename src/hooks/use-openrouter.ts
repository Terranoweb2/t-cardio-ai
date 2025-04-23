'use client';

import { useState } from 'react';
import openRouterService, {
  type Message,
  type OpenRouterOptions,
  OPENROUTER_MODELS
} from '@/services/openrouter-service';
import type { Measurement, PatientInfo } from '@/lib/types';

type AnalysisType = 'general' | 'specialized' | 'cardio';

/**
 * Hook personnalisé pour interagir avec l'API OpenRouter
 */
export function useOpenRouter() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour envoyer une requête à l'API OpenRouter
   */
  const sendMessage = async (
    messages: Message[],
    options?: OpenRouterOptions
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await openRouterService.completion(messages, options);
      return response.choices[0].message.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analyse des données de santé
   */
  const analyzeHealthData = async (
    data: string,
    prompt?: string,
    analysisType: AnalysisType = 'general'
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.analyzeHealthData(data, prompt, analysisType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analyse des tendances dans les mesures
   */
  const analyzeTrends = async (
    measurements: Measurement[],
    patientInfo: PatientInfo,
    period?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.analyzeTrends(measurements, patientInfo, period);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analyse comparative entre deux périodes
   */
  const compareTimePeriods = async (
    periodA: Measurement[],
    periodB: Measurement[],
    patientInfo: PatientInfo,
    periodAName?: string,
    periodBName?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.compareTimePeriods(
        periodA,
        periodB,
        patientInfo,
        periodAName,
        periodBName
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Génère un rapport médical
   */
  const generateHealthReport = async (
    measurements: Measurement[],
    patientInfo: PatientInfo,
    additionalContext?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.generateHealthReport(
        measurements,
        patientInfo,
        additionalContext
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Prédire les tendances futures basées sur les mesures passées
   */
  const predictTrends = async (
    measurements: Measurement[],
    patientInfo: PatientInfo,
    predictionDays = 30
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.predictTrends(
        measurements,
        patientInfo,
        predictionDays
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analyser l'impact des facteurs externes sur les mesures
   */
  const analyzeExternalFactors = async (
    measurements: Measurement[],
    patientInfo: PatientInfo,
    externalFactors: {
      medications: { name: string, dosage: string, timing: string, startDate?: string }[];
      activities: { type: string, duration: number, intensity: string, date: string }[];
      diet: { salt: 'low' | 'medium' | 'high', alcohol: boolean, caffeine: boolean }[];
      stress: { level: number, date: string }[];
      sleep: { hours: number, quality: number, date: string }[];
    }
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.analyzeExternalFactors(
        measurements,
        patientInfo,
        externalFactors
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Générer un plan personnalisé d'amélioration
   */
  const generatePersonalizedPlan = async (
    measurements: Measurement[],
    patientInfo: PatientInfo,
    targetValues: { systolic: number, diastolic: number },
    timeframe = 30
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.generatePersonalizedPlan(
        measurements,
        patientInfo,
        targetValues,
        timeframe
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    analyzeHealthData,
    analyzeTrends,
    compareTimePeriods,
    generateHealthReport,
    predictTrends,
    analyzeExternalFactors,
    generatePersonalizedPlan,
    isLoading,
    error,
    models: OPENROUTER_MODELS,
  };
}

export default useOpenRouter;
