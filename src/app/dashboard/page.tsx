"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, LineChart, Activity, Heart, History, Calendar, Sparkles, Loader2 } from "lucide-react";
import { BloodPressureChart } from "@/components/ui/blood-pressure-chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Measurement, PatientInfo } from "@/lib/types";
import useOpenRouter from "@/hooks/use-openrouter";
import { useAuth } from "@/contexts/AuthContext";
import { measurementService } from "@/services/api";
import { v4 as uuidv4 } from 'uuid';

export default function Dashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, token } = useAuth();
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(70);
  const [notes, setNotes] = useState<string>("");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingMeasurements, setFetchingMeasurements] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [openAIAnalysis, setOpenAIAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const { analyzeHealthData } = useOpenRouter();

  // Charger les mesures depuis l'API
  useEffect(() => {
    if (!user || !token) {
      // Fallback au localStorage pendant la transition vers l'API
      if (typeof window === 'undefined') return;
      
      try {
        const storedMeasurements = localStorage.getItem("measurements");
        if (storedMeasurements) {
          setMeasurements(JSON.parse(storedMeasurements));
        }
        setFetchingMeasurements(false);
      } catch (error) {
        console.error("Erreur lors du chargement des mesures depuis le localStorage:", error);
        setFetchingMeasurements(false);
      }
      return;
    }
    
    // Charger les mesures depuis l'API
    async function fetchMeasurements() {
      setFetchingMeasurements(true);
      setErrorMessage("");
      
      try {
        const response = await measurementService.getUserMeasurements(user.id, token);
        
        if (response.status === 200) {
          setMeasurements(response.data.measurements || []);
        } else {
          setErrorMessage(response.error || "Erreur lors du chargement des mesures");
          // Fallback au localStorage
          const storedMeasurements = localStorage.getItem("measurements");
          if (storedMeasurements) {
            setMeasurements(JSON.parse(storedMeasurements));
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des mesures:", error);
        setErrorMessage("Impossible de se connecter au serveur");
        // Fallback au localStorage
        const storedMeasurements = localStorage.getItem("measurements");
        if (storedMeasurements) {
          setMeasurements(JSON.parse(storedMeasurements));
        }
      } finally {
        setFetchingMeasurements(false);
      }
    }
    
    fetchMeasurements();
  }, [user, token]);

  // Enregistrer les mesures dans le localStorage
  useEffect(() => {
    if (measurements.length > 0) {
      localStorage.setItem("measurements", JSON.stringify(measurements));
    }
  }, [measurements]);

  const addMeasurement = async () => {
    if (systolic < 60 || systolic > 250 || diastolic < 40 || diastolic > 150 || pulse < 40 || pulse > 200) {
      toast({
        title: "Valeurs incorrectes",
        description: "Veuillez entrer des valeurs physiologiquement plausibles.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Classification de la pression artérielle
    const classification = classifyBloodPressure(systolic, diastolic);

    // Détermination de la couleur selon la classification
    const color = getClassificationColor(classification);

    const measurementData = {
      systolic,
      diastolic,
      pulse,
      notes: notes || "",
      date: new Date().toISOString(),
      classification,
      userId: user?.id || "unknown"
    };

    try {
      // Si connecté à l'API, envoyer la mesure au serveur
      if (user?.id && token) {
        const response = await measurementService.addMeasurement(measurementData, token);
        
        if (response.status === 201) {
          // Mesure ajoutée avec succès via l'API
          // Actualiser les mesures en ajoutant celle qui vient d'être créée
          setMeasurements(prev => [response.data, ...prev]);
          
          toast({
            title: "Mesure ajoutée au serveur",
            description: `Tension: ${systolic}/${diastolic} mmHg, Pouls: ${pulse} bpm`,
          });
        } else {
          // Erreur lors de l'ajout via l'API, fallback au localStorage
          handleLocalMeasurementAddition(measurementData);
          toast({
            title: "Erreur de connexion au serveur",
            description: "La mesure a été enregistrée localement.",
            variant: "warning",
          });
        }
      } else {
        // Pas connecté à l'API, utiliser le localStorage
        handleLocalMeasurementAddition(measurementData);
        toast({
          title: "Mesure ajoutée localement",
          description: `Tension: ${systolic}/${diastolic} mmHg, Pouls: ${pulse} bpm`,
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la mesure:", error);
      // Fallback au localStorage en cas d'erreur
      handleLocalMeasurementAddition(measurementData);
      toast({
        title: "Erreur lors de l'ajout",
        description: "La mesure a été enregistrée localement.",
        variant: "warning",
      });
    } finally {
      // Réinitialiser le formulaire
      setSystolic(120);
      setDiastolic(80);
      setPulse(70);
      setNotes("");
      
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };
  
  // Fonction utilitaire pour ajouter une mesure au localStorage
  const handleLocalMeasurementAddition = (measurementData: any) => {
    const localMeasurement: Measurement = {
      ...measurementData,
      id: uuidv4(),
    };
    
    setMeasurements(prev => [localMeasurement, ...prev]);
  };

  // Classification de la pression artérielle selon les normes OMS
  const classifyBloodPressure = (sys: number, dia: number): string => {
    if (sys < 90 || dia < 60) {
      return "Hypotension";
    }
    if (sys < 120 && dia < 80) {
      return "Optimale";
    }
    if ((sys >= 120 && sys < 130) && dia < 85) {
      return "Normale";
    }
    if ((sys >= 130 && sys < 140) || (dia >= 85 && dia < 90)) {
      return "Normale haute";
    }
    if ((sys >= 140 && sys < 160) || (dia >= 90 && dia < 100)) {
      return "Hypertension légère (Stade 1)";
    }
    if ((sys >= 160 && sys < 180) || (dia >= 100 && dia < 110)) {
      return "Hypertension modérée (Stade 2)";
    }
    return "Hypertension sévère (Stade 3)";
  };

  // Attribuer une couleur selon la classification
  const getClassificationColor = (classification: string): string => {
    switch (classification) {
      case "Hypotension":
        return "blue";
      case "Optimale":
        return "green";
      case "Normale":
        return "green";
      case "Normale haute":
        return "yellow";
      case "Hypertension légère (Stade 1)":
        return "orange";
      case "Hypertension modérée (Stade 2)":
        return "red";
      case "Hypertension sévère (Stade 3)":
        return "purple";
      default:
        return "gray";
    }
  };

  const analyzeLastMeasurements = async () => {
    if (measurements.length === 0) {
      toast({
        title: "Aucune mesure disponible",
        description: "Veuillez ajouter des mesures avant de demander une analyse.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const lastFiveMeasurements = measurements.slice(0, 5);
      const formattedData = lastFiveMeasurements.map(m => {
        return `Date: ${new Date(m.date).toLocaleString()}, SYS: ${m.systolic}, DIA: ${m.diastolic}, Pouls: ${m.pulse}, Notes: ${m.notes}`;
      }).join('\n');

      const prompt = `
        Analyse ces 5 dernières mesures de tension artérielle et donne un avis médical concis en français.

        Patient: ${user?.displayName || 'Inconnu'},
        Âge: ${user?.age || 'Non précisé'},
        Sexe: ${user?.gender || 'Non précisé'},
        Médicaments: ${user?.medications?.join(', ') || 'Aucun'}

        Données:
      `;

      const analysis = await analyzeHealthData(formattedData, prompt);
      setOpenAIAnalysis(analysis);

      toast({
        title: "Analyse complétée",
        description: "L'analyse de vos données a été réalisée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse de vos données.",
        variant: "destructive",
      });
      console.error("Erreur d'analyse:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Générer des données de test
  const generateTestData = () => {
    const now = new Date();
    const testMeasurements: Measurement[] = [];

    // Générer des mesures pour les 30 derniers jours
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);

      // Simuler une tendance à l'amélioration (valeurs qui diminuent légèrement)
      const day = i;

      // Base values
      const baseSystolic = 145 - Math.floor(day / 10) * 5;
      const baseDiastolic = 95 - Math.floor(day / 10) * 3;
      const basePulse = 78 - Math.floor(day / 15) * 2;

      // Ajouter une variation aléatoire
      const systolic = baseSystolic + Math.floor(Math.random() * 10) - 5;
      const diastolic = baseDiastolic + Math.floor(Math.random() * 8) - 4;
      const pulse = basePulse + Math.floor(Math.random() * 6) - 3;

      // Générer des notes
      let notes = "";
      if (i === 0) {
        notes = "Mesure prise après activité physique légère";
      } else if (i === 7) {
        notes = "Début traitement médicamenteux";
      } else if (i === 15) {
        notes = "Mesure prise en position assise après repos";
      } else if (i === 25) {
        notes = "Mesure prise le matin à jeun";
      }

      testMeasurements.push({
        id: uuidv4(),
        date: date.toISOString(),
        systolic,
        diastolic,
        pulse,
        notes,
        userId: user?.id || "unknown"
      });
    }

    setMeasurements(testMeasurements);

    toast({
      title: "Données de test générées",
      description: "30 mesures de test ont été créées pour les 30 derniers jours.",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={generateTestData}
        >
          Générer des données de test
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="add-measurement" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une mesure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-medium">Dernière tension</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {measurements.length > 0 ? (
                  <>
                    <div className="text-3xl font-bold">
                      {measurements[0].systolic}/{measurements[0].diastolic}
                      <span className="text-sm font-normal text-gray-500 ml-1">mmHg</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(measurements[0].date).toLocaleString()}
                    </p>
                    <p className="text-sm font-medium mt-2">{classifyBloodPressure(measurements[0].systolic, measurements[0].diastolic)}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Aucune mesure enregistrée</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-medium">Dernier pouls</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {measurements.length > 0 ? (
                  <>
                    <div className="text-3xl font-bold">
                      {measurements[0].pulse}
                      <span className="text-sm font-normal text-gray-500 ml-1">bpm</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(measurements[0].date).toLocaleString()}
                    </p>
                    <p className="text-sm mt-2">
                      {measurements[0].pulse < 60 ? "Bradycardie" : measurements[0].pulse > 100 ? "Tachycardie" : "Normal"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Aucune mesure enregistrée</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md font-medium">Historique</CardTitle>
                <History className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {measurements.length}
                  <span className="text-sm font-normal text-gray-500 ml-1">mesures</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {measurements.length > 0
                    ? `Première mesure le ${new Date(
                        measurements[measurements.length - 1].date
                      ).toLocaleDateString()}`
                    : "Aucune mesure enregistrée"}
                </p>
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href="/dashboard/history">Voir l'historique</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {measurements.length > 0 && (
            <>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-xl">Évolution de la tension artérielle</CardTitle>
                  <CardDescription>
                    Visualisation des 10 dernières mesures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BloodPressureChart
                    data={measurements.slice(0, 10).reverse()}
                    height={300}
                    timeFrame="all"
                  />
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                      Analyse IA
                    </CardTitle>
                    <CardDescription>
                      Analyse de vos dernières mesures par intelligence artificielle
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/advanced-analysis')}
                      size="sm"
                    >
                      Analyse avancée
                    </Button>
                    <Button
                      onClick={analyzeLastMeasurements}
                      disabled={analyzing || measurements.length === 0}
                      size="sm"
                    >
                      {analyzing ? "Analyse en cours..." : "Analyser mes données"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {openAIAnalysis ? (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-medium mb-2">Résultat de l'analyse :</h3>
                      <div className="text-sm">
                        {openAIAnalysis.split('\n').map((paragraph, i) => (
                          <p key={i} className="mb-2">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {analyzing ? (
                        <div className="animate-pulse">Analyse en cours, veuillez patienter...</div>
                      ) : (
                        <p>Cliquez sur "Analyser mes données" pour obtenir une analyse personnalisée de votre tension artérielle.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="add-measurement">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une nouvelle mesure</CardTitle>
              <CardDescription>
                Enregistrez vos valeurs de tension artérielle et de pouls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="systolic" className="block text-sm font-medium mb-1">
                      Systolique (SYS)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="systolic"
                        value={systolic}
                        onChange={(e) => setSystolic(Number(e.target.value))}
                        className="border border-gray-300 p-2 rounded-md w-full"
                        min="60"
                        max="250"
                      />
                      <span className="absolute right-2 top-2 text-gray-500 text-sm">
                        mmHg
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="diastolic" className="block text-sm font-medium mb-1">
                      Diastolique (DIA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="diastolic"
                        value={diastolic}
                        onChange={(e) => setDiastolic(Number(e.target.value))}
                        className="border border-gray-300 p-2 rounded-md w-full"
                        min="40"
                        max="150"
                      />
                      <span className="absolute right-2 top-2 text-gray-500 text-sm">
                        mmHg
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pulse" className="block text-sm font-medium mb-1">
                      Pouls
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="pulse"
                        value={pulse}
                        onChange={(e) => setPulse(Number(e.target.value))}
                        className="border border-gray-300 p-2 rounded-md w-full"
                        min="40"
                        max="200"
                      />
                      <span className="absolute right-2 top-2 text-gray-500 text-sm">
                        bpm
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Notes (facultatif)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full h-20"
                    placeholder="Ajouter des notes sur la mesure (situation, symptômes, médicaments...)"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                  <Button onClick={addMeasurement} disabled={loading}>
                    {loading ? "Enregistrement..." : "Enregistrer la mesure"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
