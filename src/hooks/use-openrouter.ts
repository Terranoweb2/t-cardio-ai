'use client';

import { useState } from 'react';
import openRouterService, {
  type Message,
  type OpenRouterOptions,
  OPENROUTER_MODELS
} from '@/services/openrouter-service';
import type { Measurement, PatientInfo } from '@/lib/types';

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
    prompt?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      return await openRouterService.analyzeHealthData(data, prompt);
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

  return {
    sendMessage,
    analyzeHealthData,
    generateHealthReport,
    isLoading,
    error,
    models: OPENROUTER_MODELS,
  };
}

export default useOpenRouter;
