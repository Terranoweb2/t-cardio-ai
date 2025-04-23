/**
 * Service pour interagir avec l'API OpenRouter
 * Ce service permet d'envoyer des requêtes à différents modèles d'IA via OpenRouter
 */

import type { Measurement, PatientInfo } from '@/lib/types';

// Types pour les messages et les réponses OpenRouter
export type Message = {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
};

export type OpenRouterResponse = {
  id: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type OpenRouterOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

// Modèles disponibles sur OpenRouter
export const OPENROUTER_MODELS = {
  GPT_4: 'openai/gpt-4-turbo',
  GPT_3_5: 'openai/gpt-3.5-turbo',
  CLAUDE: 'anthropic/claude-3-opus',
  CLAUDE_HAIKU: 'anthropic/claude-3-haiku',
  LLAMA_3: 'meta/llama-3-70b-instruct',
  MISTRAL: 'mistralai/mistral-7b',
};

/**
 * Classe principale du service OpenRouter
 */
export class OpenRouterService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    // Récupération des variables d'environnement
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      console.warn('La clé API OpenRouter n\'est pas définie. Veuillez configurer OPENROUTER_API_KEY dans .env.local');
    }
  }

  /**
   * Vérifie si le service est correctement configuré
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Envoie une requête au modèle d'IA via OpenRouter
   */
  async completion(messages: Message[], options: OpenRouterOptions = {}): Promise<OpenRouterResponse> {
    if (!this.isConfigured()) {
      throw new Error('Le service OpenRouter n\'est pas configuré. Veuillez définir OPENROUTER_API_KEY dans .env.local');
    }

    const defaultOptions: OpenRouterOptions = {
      model: OPENROUTER_MODELS.GPT_3_5,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://t-cardio-ai.netlify.app',
          'X-Title': 'T-Cardio-AI',
        },
        body: JSON.stringify({
          messages,
          ...mergedOptions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur OpenRouter: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la communication avec OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Fonction utilitaire pour analyser un texte médical ou des mesures cardiaques
   */
  async analyzeHealthData(
    data: string,
    prompt = "Analyser ces données de santé et fournir des insights cliniques."
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'Vous êtes un assistant médical spécialisé dans l\'analyse des données cardiovasculaires. Répondez en français de manière professionnelle et précise.',
      },
      {
        role: 'user',
        content: `${prompt}\n\nDonnées à analyser:\n${data}`
      }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.GPT_4, // Utiliser GPT-4 pour une meilleure analyse médicale
        temperature: 0.2, // Température basse pour des réponses plus précises et cohérentes
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de l\'analyse des données de santé:', error);
      return 'Une erreur est survenue lors de l\'analyse des données. Veuillez réessayer.';
    }
  }

  /**
   * Fonction utilitaire pour générer un rapport médical structuré
   */
  async generateHealthReport(
    measurements: Measurement[],
    patientInfo: PatientInfo,
    additionalContext = ""
  ): Promise<string> {
    const formattedMeasurements = JSON.stringify(measurements, null, 2);
    const formattedPatientInfo = JSON.stringify(patientInfo, null, 2);

    const messages: Message[] = [
      {
        role: 'system',
        content: `Vous êtes un cardiologue expert qui analyse des données de tension artérielle et de pouls.
        Rédigez un rapport médical professionnel, précis et utile au patient, en français.
        Incluez une analyse des tendances, des recommandations personnalisées et des explications sur les facteurs de risque.`
      },
      {
        role: 'user',
        content: `Veuillez générer un rapport médical complet basé sur ces données:

        Informations du patient:
        ${formattedPatientInfo}

        Historique des mesures:
        ${formattedMeasurements}

        Contexte supplémentaire:
        ${additionalContext}

        Format requis:
        1. Résumé des constantes (moyennes, valeurs min/max, tendances)
        2. Analyse des données et interprétation clinique
        3. Recommandations personnalisées
        4. Facteurs de risque cardiovasculaire à surveiller`
      }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.GPT_4,
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport médical:', error);
      return 'Une erreur est survenue lors de la génération du rapport. Veuillez réessayer.';
    }
  }
}

// Créer une instance singleton du service
const openRouterService = new OpenRouterService();
export default openRouterService;
