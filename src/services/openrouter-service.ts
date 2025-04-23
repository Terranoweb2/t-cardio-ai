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
  MEDICAL_SPECIALIZED: 'anthropic/claude-3-opus', // Utilisation de Claude pour les analyses médicales spécialisées
  CARDIOLOGY_FOCUSED: 'openai/gpt-4-turbo', // GPT-4 pour des analyses cardiologiques poussées
  TREND_ANALYSIS: 'meta/llama-3-70b-instruct', // Llama 3 pour l'analyse de tendances
};

/**
 * Classe principale du service OpenRouter
 */
export class OpenRouterService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    // Récupération des variables d'environnement
    this.apiKey = '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'; // Clé API fournie directement
    this.apiUrl = process.env.NEXT_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      console.warn('La clé API OpenRouter n\'est pas définie');
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
    prompt = "Analyser ces données de santé et fournir des insights cliniques.",
    modelType: 'general' | 'specialized' | 'cardio' = 'general'
  ): Promise<string> {
    // Sélection du modèle le plus approprié selon le type d'analyse
    let model = OPENROUTER_MODELS.GPT_4;
    let temperature = 0.2;
    let systemPrompt = '';

    switch(modelType) {
      case 'specialized':
        model = OPENROUTER_MODELS.MEDICAL_SPECIALIZED;
        temperature = 0.1; // Plus faible pour des réponses plus précises
        systemPrompt = `Vous êtes un cardiologue expert spécialisé dans l'hypertension et les maladies cardiovasculaires.
        Analysez ces données de tension artérielle en utilisant votre expertise médicale approfondie.
        Identifiez les risques spécifiques pour ce patient en fonction de son profil et suggérez des approches thérapeutiques adaptées.
        Appuyez vos analyses sur les dernières directives de l'ESC (European Society of Cardiology) et expliquez les implications cliniques.
        Répondez en français avec un ton professionnel mais accessible, en structurant votre analyse en sections clairement définies.`;
        break;
      case 'cardio':
        model = OPENROUTER_MODELS.CARDIOLOGY_FOCUSED;
        temperature = 0.15;
        systemPrompt = `Vous êtes un assistant spécialisé dans l'interprétation des données cardiovasculaires.
        Analysez ces mesures de tension artérielle et de pouls en tenant compte des facteurs de risque individuels du patient.
        Identifiez précisément les variations anormales, les tendances préoccupantes, et les corrélations avec les symptômes mentionnés.
        Soyez précis dans l'interprétation des valeurs selon les normes médicales établies.
        Votre analyse doit être rigoureusement basée sur les données fournies, en évitant les généralisations.
        Répondez en français avec une structure claire: résumé, analyse détaillée, interprétation clinique et recommandations.`;
        break;
      default:
        systemPrompt = `Vous êtes un assistant médical spécialisé dans l'analyse des données cardiovasculaires.
        Répondez en français de manière professionnelle et précise, en vous concentrant sur l'interprétation des
        données de tension artérielle et de pouls du patient. Structurez votre réponse pour faciliter la compréhension.`;
    }

    const messages: Message[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `${prompt}\n\nDonnées à analyser:\n${data}`
      }
    ];

    try {
      const response = await this.completion(messages, {
        model,
        temperature,
        max_tokens: 1500, // Augmenté pour permettre des analyses plus détaillées
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de l\'analyse des données de santé:', error);
      return 'Une erreur est survenue lors de l\'analyse des données. Veuillez réessayer.';
    }
  }

  /**
   * Analyse des tendances dans les mesures de tension
   */
  async analyzeTrends(
    measurements: Measurement[],
    patientInfo: PatientInfo,
    period = "dernier mois"
  ): Promise<string> {
    if (measurements.length < 3) {
      return "Nombre insuffisant de mesures pour analyser des tendances. Il est recommandé d'avoir au moins 3 mesures.";
    }

    const formattedMeasurements = JSON.stringify(measurements, null, 2);
    const formattedPatientInfo = JSON.stringify(patientInfo, null, 2);

    const systemPrompt = `Vous êtes un spécialiste en cardiologie avec une expertise en analyse de tendances de données médicales.
    Analysez les tendances de tension artérielle et de pouls de ce patient sur la période indiquée.
    Concentrez-vous sur l'identification des patterns, des variations cycliques, des améliorations ou détériorations progressives.
    Votre analyse doit être factuelle, basée sur les données, et présentée de façon accessible au patient.
    Identifiez spécifiquement:
    1. Les tendances générales (amélioration, stabilité, détérioration)
    2. Les variations importantes et leurs possibles causes
    3. Les corrélations entre les différentes mesures (SYS, DIA, pouls)
    4. Les périodes ou moments spécifiques nécessitant une attention particulière
    Répondez en français avec un format structuré et clair.`;

    const userPrompt = `Veuillez analyser les tendances de mes mesures de tension artérielle sur ${period}.

    Information patient:
    ${formattedPatientInfo}

    Historique chronologique des mesures (du plus ancien au plus récent):
    ${formattedMeasurements}

    Merci de fournir:
    - Une analyse des tendances générales
    - L'identification de patterns ou cycles notables
    - Une interprétation médicale de l'évolution observée
    - Des suggestions de suivi basées sur ces tendances`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.TREND_ANALYSIS,
        temperature: 0.25,
        max_tokens: 1800,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de l\'analyse des tendances:', error);
      return 'Une erreur est survenue lors de l\'analyse des tendances. Veuillez réessayer.';
    }
  }

  /**
   * Analyse comparative avancée entre différentes périodes
   */
  async compareTimePeriods(
    periodA: Measurement[],
    periodB: Measurement[],
    patientInfo: PatientInfo,
    periodAName = "Période 1",
    periodBName = "Période 2"
  ): Promise<string> {
    if (periodA.length < 3 || periodB.length < 3) {
      return "Nombre insuffisant de mesures pour effectuer une comparaison valide. Chaque période devrait avoir au moins 3 mesures.";
    }

    const formattedPeriodA = JSON.stringify(periodA, null, 2);
    const formattedPeriodB = JSON.stringify(periodB, null, 2);
    const formattedPatientInfo = JSON.stringify(patientInfo, null, 2);

    const systemPrompt = `Vous êtes un spécialiste en cardiologie avec une expertise en analyse comparative de données médicales.
    Comparez scientifiquement les deux périodes de mesures de tension artérielle et de pouls fournies.
    Concentrez-vous sur les changements statistiquement significatifs, les améliorations ou détériorations mesurables.
    Votre analyse doit être factuelle, basée sur les données, et présenter une interprétation médicale rigoureuse.
    Utilisez des statistiques appropriées pour quantifier les différences (moyennes, écarts-types, etc.).
    Suggérez des explications potentielles pour les changements observés, en tenant compte du profil du patient.
    Répondez en français avec un format structuré, précis et pédagogique.`;

    const userPrompt = `Veuillez comparer ces deux périodes de mesures de tension artérielle et fournir une analyse comparative détaillée.

    Information patient:
    ${formattedPatientInfo}

    ${periodAName}:
    ${formattedPeriodA}

    ${periodBName}:
    ${formattedPeriodB}

    Merci de fournir:
    - Une comparaison statistique des moyennes et des variations pour SYS, DIA et pouls
    - Une analyse des différences significatives entre les deux périodes
    - Une interprétation médicale des changements observés
    - Des recommandations basées sur cette comparaison`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.CARDIOLOGY_FOCUSED,
        temperature: 0.2,
        max_tokens: 2000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la comparaison des périodes:', error);
      return 'Une erreur est survenue lors de la comparaison des périodes. Veuillez réessayer.';
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

    const systemPrompt = `Vous êtes un cardiologue expert qui analyse des données de tension artérielle et de pouls.
    Rédigez un rapport médical professionnel, précis et utile au patient, en français.

    Votre rapport doit suivre cette structure:
    1. RÉSUMÉ EXÉCUTIF - Un aperçu clair et concis des principales conclusions
    2. ANALYSE DES CONSTANTES - Détail des moyennes, tendances et valeurs atypiques
    3. INTERPRÉTATION CLINIQUE - Explication de la signification médicale des résultats
    4. FACTEURS DE RISQUE CARDIOVASCULAIRE - Évaluation des risques spécifiques au patient
    5. RECOMMANDATIONS PERSONNALISÉES - Conseils adaptés au profil du patient

    Utilisez un langage médical précis mais accessible. Concentrez-vous sur les données fournies et évitez les généralisations.
    Intégrez des références aux directives médicales actuelles quand c'est pertinent.
    Si certaines mesures sont préoccupantes, indiquez-le clairement avec les seuils de référence.`;

    const userPrompt = `Veuillez générer un rapport médical complet basé sur ces données:

    Informations du patient:
    ${formattedPatientInfo}

    Historique des mesures:
    ${formattedMeasurements}

    Contexte supplémentaire:
    ${additionalContext}`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.MEDICAL_SPECIALIZED,
        temperature: 0.3,
        max_tokens: 2500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport médical:', error);
      return 'Une erreur est survenue lors de la génération du rapport. Veuillez réessayer.';
    }
  }

  /**
   * Prédire les tendances futures basées sur les mesures passées
   */
  async predictTrends(
    measurements: Measurement[],
    patientInfo: PatientInfo,
    predictionDays = 30
  ): Promise<string> {
    if (measurements.length < 10) {
      return "Nombre insuffisant de mesures pour faire une prédiction fiable. Il est recommandé d'avoir au moins 10 mesures.";
    }

    const formattedMeasurements = JSON.stringify(measurements, null, 2);
    const formattedPatientInfo = JSON.stringify(patientInfo, null, 2);

    const systemPrompt = `Vous êtes un spécialiste en cardiologie et en analyse prédictive de données médicales.
    En vous basant sur l'historique de mesures de tension artérielle et de pouls de ce patient,
    prédisez l'évolution probable de ses constantes sur les ${predictionDays} prochains jours.
    Votre analyse doit:
    1. Identifier les tendances mathématiques dans les données (régression, saisonnalité, etc.)
    2. Prédire les valeurs probables (SYS, DIA, pouls) à différents horizons temporels
    3. Évaluer les risques potentiels selon les prédictions
    4. Recommander des interventions préventives adaptées

    Présentez votre analyse de façon factuelle et mesurée, en insistant sur les limites des prédictions.
    Incluez des chiffres précis et quantifiez l'incertitude quand c'est possible.
    Si les données montrent des patterns préoccupants, soulignez-les clairement.`;

    const userPrompt = `Veuillez analyser mes mesures de tension artérielle et prédire l'évolution probable sur les ${predictionDays} prochains jours.

    Information patient:
    ${formattedPatientInfo}

    Historique chronologique des mesures (du plus ancien au plus récent):
    ${formattedMeasurements}

    Merci de fournir:
    - Une prédiction de l'évolution de mes mesures (SYS, DIA, pouls)
    - L'identification des risques potentiels basés sur ces prédictions
    - Des recommandations préventives personnalisées`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.CARDIOLOGY_FOCUSED,
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la prédiction des tendances:', error);
      return 'Une erreur est survenue lors de la prédiction des tendances. Veuillez réessayer.';
    }
  }

  /**
   * Analyser l'impact des facteurs externes sur les mesures
   */
  async analyzeExternalFactors(
    measurements: Measurement[],
    patientInfo: PatientInfo,
    externalFactors: {
      medications: { name: string, dosage: string, timing: string, startDate?: string }[];
      activities: { type: string, duration: number, intensity: string, date: string }[];
      diet: { salt: 'low' | 'medium' | 'high', alcohol: boolean, caffeine: boolean }[];
      stress: { level: number, date: string }[];
      sleep: { hours: number, quality: number, date: string }[];
    }
  ): Promise<string> {
    const formattedMeasurements = JSON.stringify(measurements, null, 2);
    const formattedPatientInfo = JSON.stringify(patientInfo, null, 2);
    const formattedFactors = JSON.stringify(externalFactors, null, 2);

    const systemPrompt = `Vous êtes un spécialiste en cardiologie avec une expertise en analyse multifactorielle.
    Analysez les corrélations entre les mesures de tension artérielle/pouls et les facteurs externes fournis.
    Identifiez les facteurs qui semblent avoir un impact significatif sur les constantes cardiovasculaires du patient.
    Utilisez des méthodes statistiques implicites (corrélation temporelle, clustering, analyse de variance) pour établir ces liens.

    Votre analyse doit être:
    1. Factuelle et basée sur les données
    2. Nuancée quant aux limites de l'analyse (corrélation ≠ causalité)
    3. Orientée vers des recommandations pratiques et personnalisées

    Structurez votre réponse avec des sections claires pour chaque type de facteur externe analysé.`;

    const userPrompt = `Veuillez analyser l'impact des facteurs externes sur mes mesures de tension artérielle et de pouls.

    Information patient:
    ${formattedPatientInfo}

    Historique des mesures:
    ${formattedMeasurements}

    Facteurs externes à analyser:
    ${formattedFactors}

    Merci de fournir:
    - Une analyse des corrélations entre chaque facteur et mes mesures
    - L'identification des facteurs ayant l'impact le plus significatif
    - Des recommandations pour optimiser ces facteurs`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.MEDICAL_SPECIALIZED,
        temperature: 0.2,
        max_tokens: 2200,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de l\'analyse des facteurs externes:', error);
      return 'Une erreur est survenue lors de l\'analyse des facteurs externes. Veuillez réessayer.';
    }
  }

  /**
   * Générer un plan personnalisé d'amélioration pour le patient
   */
  async generatePersonalizedPlan(
    measurements: Measurement[],
    patientInfo: PatientInfo,
    targetValues: { systolic: number, diastolic: number },
    timeframe: number // en jours
  ): Promise<string> {
    const formattedMeasurements = JSON.stringify(measurements, null, 2);
    const formattedPatientInfo = JSON.stringify(patientInfo, null, 2);

    const systemPrompt = `Vous êtes un cardiologue spécialisé dans la gestion de l'hypertension et la médecine préventive.
    Créez un plan d'action personnalisé pour aider ce patient à atteindre ses objectifs de tension artérielle
    dans le délai spécifié (${timeframe} jours).

    Votre plan doit être:
    1. Scientifiquement fondé et conforme aux directives médicales actuelles
    2. Progressif et réaliste, avec des jalons intermédiaires mesurables
    3. Adapté au profil spécifique du patient (âge, conditions médicales, etc.)
    4. Holistique, incluant régime alimentaire, activité physique, médication et gestion du stress

    Présentez un plan structuré en semaines, avec des objectifs concrets pour chaque période.
    Incluez des méthodes d'auto-surveillance et d'ajustement du plan selon les progrès.`;

    const userPrompt = `Veuillez créer un plan personnalisé pour m'aider à atteindre une tension de ${targetValues.systolic}/${targetValues.diastolic} mmHg en ${timeframe} jours.

    Information patient:
    ${formattedPatientInfo}

    Mes mesures actuelles:
    ${formattedMeasurements}

    Merci de fournir:
    - Un plan d'action détaillé et progressif
    - Des recommandations diététiques spécifiques
    - Un programme d'activité physique adapté
    - Des techniques de gestion du stress
    - Un calendrier de suivi et d'ajustement du plan`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.completion(messages, {
        model: OPENROUTER_MODELS.MEDICAL_SPECIALIZED,
        temperature: 0.4,
        max_tokens: 2500,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération du plan personnalisé:', error);
      return 'Une erreur est survenue lors de la génération du plan personnalisé. Veuillez réessayer.';
    }
  }
}

// Créer une instance singleton du service
const openRouterService = new OpenRouterService();
export default openRouterService;
