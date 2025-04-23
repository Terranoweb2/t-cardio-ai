"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import useOpenRouter from "@/hooks/use-openrouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingUp,
  ActivitySquare,
  Calendar,
  Target,
  PenTool,
  Heart,
  Pill,
  Utensils,
  Moon,
  Zap,
  ArrowRight,
  ChevronRight,
  Clock
} from "lucide-react";
import type { Measurement, PatientInfo } from "@/lib/types";

export default function AdvancedAnalysisPage() {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [user, setUser] = useState<PatientInfo | null>(null);
  const [activeTab, setActiveTab] = useState("predictions");
  const [predictionDays, setPredictionDays] = useState(30);
  const [prediction, setPrediction] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);

  // États pour les facteurs externes
  const [medications, setMedications] = useState<{
    name: string;
    dosage: string;
    timing: string;
    startDate?: string;
  }[]>([{ name: "", dosage: "", timing: "" }]);

  const [activities, setActivities] = useState<{
    type: string;
    duration: number;
    intensity: string;
    date: string;
  }[]>([{ type: "", duration: 30, intensity: "moderate", date: "" }]);

  const [diet, setDiet] = useState<{
    salt: 'low' | 'medium' | 'high';
    alcohol: boolean;
    caffeine: boolean;
  }[]>([{ salt: 'medium', alcohol: false, caffeine: false }]);

  const [sleep, setSleep] = useState<{
    hours: number;
    quality: number;
    date: string;
  }[]>([{ hours: 7, quality: 7, date: "" }]);

  const [stress, setStress] = useState<{
    level: number;
    date: string;
  }[]>([{ level: 5, date: "" }]);

  const [factorAnalysis, setFactorAnalysis] = useState("");
  const [isAnalyzingFactors, setIsAnalyzingFactors] = useState(false);

  // États pour le plan personnalisé
  const [targetSystolic, setTargetSystolic] = useState(120);
  const [targetDiastolic, setTargetDiastolic] = useState(80);
  const [planTimeframe, setPlanTimeframe] = useState(30);
  const [personalPlan, setPersonalPlan] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const {
    predictTrends,
    analyzeExternalFactors,
    generatePersonalizedPlan,
    isLoading,
    error
  } = useOpenRouter();

  // Charger les données depuis le localStorage
  useEffect(() => {
    const storedMeasurements = localStorage.getItem("measurements");
    if (storedMeasurements) {
      setMeasurements(JSON.parse(storedMeasurements));
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const generatePrediction = async () => {
    if (measurements.length < 10) {
      toast({
        title: "Données insuffisantes",
        description: "Vous avez besoin d'au moins 10 mesures pour générer une prédiction fiable.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Profil incomplet",
        description: "Veuillez compléter votre profil avant de générer une prédiction.",
        variant: "destructive",
      });
      return;
    }

    setIsPredicting(true);
    try {
      const result = await predictTrends(measurements, user, predictionDays);
      setPrediction(result);

      toast({
        title: "Prédiction générée",
        description: `Prédiction sur ${predictionDays} jours générée avec succès.`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération de la prédiction.",
        variant: "destructive",
      });
      console.error("Erreur de prédiction:", err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleAddMedication = () => {
    setMedications([...medications, { name: "", dosage: "", timing: "" }]);
  };

  const handleRemoveMedication = (index: number) => {
    const newMedications = [...medications];
    newMedications.splice(index, 1);
    setMedications(newMedications);
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    const newMedications = [...medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setMedications(newMedications);
  };

  const handleAddActivity = () => {
    setActivities([...activities, { type: "", duration: 30, intensity: "moderate", date: "" }]);
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = [...activities];
    newActivities.splice(index, 1);
    setActivities(newActivities);
  };

  const handleActivityChange = (index: number, field: string, value: any) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  const handleAddSleep = () => {
    setSleep([...sleep, { hours: 7, quality: 5, date: "" }]);
  };

  const handleRemoveSleep = (index: number) => {
    const newSleep = [...sleep];
    newSleep.splice(index, 1);
    setSleep(newSleep);
  };

  const handleSleepChange = (index: number, field: string, value: any) => {
    const newSleep = [...sleep];
    newSleep[index] = { ...newSleep[index], [field]: value };
    setSleep(newSleep);
  };

  const handleAddStress = () => {
    setStress([...stress, { level: 5, date: "" }]);
  };

  const handleRemoveStress = (index: number) => {
    const newStress = [...stress];
    newStress.splice(index, 1);
    setStress(newStress);
  };

  const handleStressChange = (index: number, field: string, value: any) => {
    const newStress = [...stress];
    newStress[index] = { ...newStress[index], [field]: value };
    setStress(newStress);
  };

  const handleDietChange = (field: string, value: any) => {
    const newDiet = [...diet];
    newDiet[0] = { ...newDiet[0], [field]: value };
    setDiet(newDiet);
  };

  const analyzeFactors = async () => {
    if (measurements.length < 5) {
      toast({
        title: "Données insuffisantes",
        description: "Vous avez besoin d'au moins 5 mesures pour analyser les facteurs externes.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Profil incomplet",
        description: "Veuillez compléter votre profil avant de générer une analyse.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que les données des facteurs sont suffisamment complètes
    if (medications.some(m => !m.name) || activities.some(a => !a.type) ||
        sleep.some(s => !s.date) || stress.some(s => !s.date)) {
      toast({
        title: "Données incomplètes",
        description: "Veuillez compléter toutes les informations des facteurs externes.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingFactors(true);
    try {
      const externalFactors = {
        medications,
        activities,
        diet,
        sleep,
        stress
      };

      const result = await analyzeExternalFactors(measurements, user, externalFactors);
      setFactorAnalysis(result);

      toast({
        title: "Analyse générée",
        description: "Analyse des facteurs externes générée avec succès.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'analyse des facteurs externes.",
        variant: "destructive",
      });
      console.error("Erreur d'analyse:", err);
    } finally {
      setIsAnalyzingFactors(false);
    }
  };

  const generatePlan = async () => {
    if (measurements.length < 5) {
      toast({
        title: "Données insuffisantes",
        description: "Vous avez besoin d'au moins 5 mesures pour générer un plan personnalisé.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Profil incomplet",
        description: "Veuillez compléter votre profil avant de générer un plan.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const targetValues = {
        systolic: targetSystolic,
        diastolic: targetDiastolic
      };

      const result = await generatePersonalizedPlan(measurements, user, targetValues, planTimeframe);
      setPersonalPlan(result);

      toast({
        title: "Plan généré",
        description: "Plan personnalisé généré avec succès.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du plan personnalisé.",
        variant: "destructive",
      });
      console.error("Erreur de génération du plan:", err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Rendu du composant
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Analyse avancée de santé</h1>
      <p className="text-gray-500 mb-6">
        Utilisez l'intelligence artificielle pour des analyses plus poussées de vos données de santé
      </p>

      {measurements.length < 5 ? (
        <Alert>
          <AlertTitle>Données insuffisantes</AlertTitle>
          <AlertDescription>
            Pour utiliser les analyses avancées, vous avez besoin d'au moins 5 mesures enregistrées.
            <div className="mt-2">
              <Button variant="outline" asChild>
                <a href="/dashboard">Ajouter des mesures</a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="predictions" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Prédictions
            </TabsTrigger>
            <TabsTrigger value="factors" className="flex items-center">
              <ActivitySquare className="mr-2 h-4 w-4" />
              Facteurs externes
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Plan personnalisé
            </TabsTrigger>
          </TabsList>

          {/* Contenu de l'onglet Prédictions */}
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                  Prédiction des tendances futures
                </CardTitle>
                <CardDescription>
                  Utilisez l'IA pour prédire l'évolution probable de votre tension artérielle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="predictionDays">Période de prédiction (jours)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="predictionDays"
                          type="number"
                          min={7}
                          max={90}
                          value={predictionDays}
                          onChange={(e) => setPredictionDays(Number.parseInt(e.target.value))}
                          className="w-24"
                        />
                        <div className="ml-2 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-500">{predictionDays} jours</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Choisissez une période entre 7 et 90 jours
                      </p>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={generatePrediction}
                        disabled={isPredicting || measurements.length < 10}
                        className="w-full"
                      >
                        {isPredicting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Génération en cours...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Générer une prédiction
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {prediction ? (
                    <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                      <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                        Prédiction sur {predictionDays} jours
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        {prediction.split('\n').map((paragraph, i) => (
                          <p
                            key={`prediction-${i}`}
                            className={i === 0 ? "font-medium" : ""}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-6 text-center text-gray-500 border border-dashed rounded-md">
                      {isPredicting ? (
                        <div className="animate-pulse">
                          Génération de la prédiction en cours, veuillez patienter...
                        </div>
                      ) : (
                        <div>
                          <TrendingUp className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                          <p>Cliquez sur "Générer une prédiction" pour obtenir une analyse prédictive personnalisée.</p>
                          <p className="text-xs mt-2">
                            Cette analyse utilise un modèle d'intelligence artificielle pour prédire les tendances futures
                            de votre tension artérielle et de votre pouls.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenu de l'onglet Facteurs externes */}
          <TabsContent value="factors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ActivitySquare className="mr-2 h-5 w-5 text-green-500" />
                  Analyse des facteurs externes
                </CardTitle>
                <CardDescription>
                  Découvrez comment votre mode de vie influence votre tension artérielle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Section médicaments */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <Pill className="h-4 w-4 mr-2 text-blue-500" />
                      Médicaments
                    </h3>

                    {medications.map((med, index) => (
                      <div key={`med-${index}`} className="grid md:grid-cols-3 gap-2 p-2 border rounded-md">
                        <div>
                          <Label htmlFor={`med-name-${index}`} className="text-xs">Nom</Label>
                          <Input
                            id={`med-name-${index}`}
                            value={med.name}
                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                            placeholder="Ex: Amlodipine"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`med-dosage-${index}`} className="text-xs">Dosage</Label>
                          <Input
                            id={`med-dosage-${index}`}
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            placeholder="Ex: 5mg"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveMedication(index)}
                            disabled={medications.length <= 1}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddMedication}
                      className="w-full"
                    >
                      + Ajouter un médicament
                    </Button>
                  </div>

                  {/* Section activités physiques */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <ActivitySquare className="h-4 w-4 mr-2 text-green-500" />
                      Activités physiques
                    </h3>

                    {activities.map((activity, index) => (
                      <div key={`activity-${index}`} className="grid md:grid-cols-3 gap-2 p-2 border rounded-md">
                        <div>
                          <Label htmlFor={`activity-type-${index}`} className="text-xs">Type</Label>
                          <Input
                            id={`activity-type-${index}`}
                            value={activity.type}
                            onChange={(e) => handleActivityChange(index, 'type', e.target.value)}
                            placeholder="Ex: Marche, Natation"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`activity-duration-${index}`} className="text-xs">Durée (min)</Label>
                          <Input
                            id={`activity-duration-${index}`}
                            type="number"
                            value={activity.duration}
                            onChange={(e) => handleActivityChange(index, 'duration', Number.parseInt(e.target.value))}
                            min={5}
                            max={300}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveActivity(index)}
                            disabled={activities.length <= 1}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddActivity}
                      className="w-full"
                    >
                      + Ajouter une activité
                    </Button>
                  </div>

                  {/* Section habitudes alimentaires */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <Utensils className="h-4 w-4 mr-2 text-orange-500" />
                      Habitudes alimentaires
                    </h3>

                    <div className="grid md:grid-cols-3 gap-4 p-3 border rounded-md">
                      <div>
                        <Label htmlFor="salt-level" className="text-xs">Consommation de sel</Label>
                        <Select
                          value={diet[0].salt}
                          onValueChange={(value) => handleDietChange('salt', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau de sel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col justify-center">
                        <Label className="text-xs mb-2">Consommation d'alcool</Label>
                        <Button
                          type="button"
                          variant={diet[0].alcohol ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDietChange('alcohol', !diet[0].alcohol)}
                        >
                          {diet[0].alcohol ? "Oui" : "Non"}
                        </Button>
                      </div>

                      <div className="flex flex-col justify-center">
                        <Label className="text-xs mb-2">Consommation de caféine</Label>
                        <Button
                          type="button"
                          variant={diet[0].caffeine ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDietChange('caffeine', !diet[0].caffeine)}
                        >
                          {diet[0].caffeine ? "Oui" : "Non"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Section stress */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-red-500" />
                      Niveaux de stress
                    </h3>

                    {stress.map((s, index) => (
                      <div key={`stress-${index}`} className="grid md:grid-cols-2 gap-2 p-2 border rounded-md">
                        <div>
                          <Label htmlFor={`stress-level-${index}`} className="text-xs">Niveau (1-10)</Label>
                          <Input
                            id={`stress-level-${index}`}
                            type="number"
                            value={s.level}
                            onChange={(e) => handleStressChange(index, 'level', Number.parseInt(e.target.value))}
                            min={1}
                            max={10}
                          />
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <Input
                            type="date"
                            value={s.date}
                            onChange={(e) => handleStressChange(index, 'date', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                            onClick={() => handleRemoveStress(index)}
                            disabled={stress.length <= 1}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddStress}
                      className="w-full"
                    >
                      + Ajouter un niveau de stress
                    </Button>
                  </div>

                  {/* Section sommeil */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <Moon className="h-4 w-4 mr-2 text-indigo-500" />
                      Sommeil
                    </h3>

                    {sleep.map((s, index) => (
                      <div key={`sleep-${index}`} className="grid md:grid-cols-3 gap-2 p-2 border rounded-md">
                        <div>
                          <Label htmlFor={`sleep-hours-${index}`} className="text-xs">Heures</Label>
                          <Input
                            id={`sleep-hours-${index}`}
                            type="number"
                            value={s.hours}
                            onChange={(e) => handleSleepChange(index, 'hours', Number.parseFloat(e.target.value))}
                            min={1}
                            max={14}
                            step={0.5}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`sleep-quality-${index}`} className="text-xs">Qualité (1-10)</Label>
                          <Input
                            id={`sleep-quality-${index}`}
                            type="number"
                            value={s.quality}
                            onChange={(e) => handleSleepChange(index, 'quality', Number.parseInt(e.target.value))}
                            min={1}
                            max={10}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Input
                            type="date"
                            value={s.date}
                            onChange={(e) => handleSleepChange(index, 'date', e.target.value)}
                            className="flex-grow"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                            onClick={() => handleRemoveSleep(index)}
                            disabled={sleep.length <= 1}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSleep}
                      className="w-full"
                    >
                      + Ajouter une période de sommeil
                    </Button>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={analyzeFactors}
                      disabled={isAnalyzingFactors || measurements.length < 5}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isAnalyzingFactors ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyse en cours...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <ActivitySquare className="mr-2 h-4 w-4" />
                          Analyser les facteurs
                        </span>
                      )}
                    </Button>
                  </div>

                  {factorAnalysis && (
                    <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
                      <h3 className="font-medium text-green-800 mb-2 flex items-center">
                        <ActivitySquare className="mr-2 h-4 w-4 text-green-600" />
                        Analyse des facteurs influençant votre tension
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        {factorAnalysis.split('\n').map((paragraph, i) => (
                          <p
                            key={`factor-${i}`}
                            className={i === 0 ? "font-medium" : ""}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenu de l'onglet Plan personnalisé */}
          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-red-500" />
                  Plan personnalisé d'amélioration
                </CardTitle>
                <CardDescription>
                  Créez un plan sur mesure pour atteindre vos objectifs de tension artérielle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <h3 className="text-sm font-medium mb-3">Définir vos objectifs</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="target-sys">Objectif Systolique (SYS)</Label>
                        <Input
                          id="target-sys"
                          type="number"
                          min={100}
                          max={160}
                          value={targetSystolic}
                          onChange={(e) => setTargetSystolic(Number.parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Valeur idéale: 120 mmHg</p>
                      </div>
                      <div>
                        <Label htmlFor="target-dia">Objectif Diastolique (DIA)</Label>
                        <Input
                          id="target-dia"
                          type="number"
                          min={60}
                          max={100}
                          value={targetDiastolic}
                          onChange={(e) => setTargetDiastolic(Number.parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Valeur idéale: 80 mmHg</p>
                      </div>
                      <div>
                        <Label htmlFor="plan-timeframe">Délai (jours)</Label>
                        <Input
                          id="plan-timeframe"
                          type="number"
                          min={7}
                          max={180}
                          value={planTimeframe}
                          onChange={(e) => setPlanTimeframe(Number.parseInt(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Période recommandée: 30-90 jours
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={generatePlan}
                      disabled={isGeneratingPlan || measurements.length < 5}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isGeneratingPlan ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Génération en cours...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Target className="mr-2 h-4 w-4" />
                          Générer mon plan
                        </span>
                      )}
                    </Button>
                  </div>

                  {personalPlan ? (
                    <div className="mt-6 p-4 bg-red-50 rounded-md border border-red-200">
                      <h3 className="font-medium text-red-800 mb-2 flex items-center">
                        <Target className="mr-2 h-4 w-4 text-red-600" />
                        Plan personnalisé pour atteindre {targetSystolic}/{targetDiastolic} mmHg en {planTimeframe} jours
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        {personalPlan.split('\n').map((paragraph, i) => (
                          <p
                            key={`plan-${i}`}
                            className={i === 0 ? "font-medium" : ""}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-6 text-center text-gray-500 border border-dashed rounded-md">
                      {isGeneratingPlan ? (
                        <div className="animate-pulse">
                          Génération de votre plan personnalisé en cours, veuillez patienter...
                        </div>
                      ) : (
                        <div>
                          <Target className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                          <p>Définissez vos objectifs et cliquez sur "Générer mon plan" pour créer votre plan d'amélioration personnalisé.</p>
                          <p className="text-xs mt-2">
                            Ce plan utilisera l'IA pour proposer des recommandations adaptées à votre profil et à vos objectifs.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
