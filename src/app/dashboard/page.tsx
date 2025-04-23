"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, AlertTriangle, CheckCircle, AlertCircle, LineChart } from "lucide-react";
import Link from "next/link";

// Animation CSS pour la transition de page
const pageTransitionStyle = `
  .page-transition {
    animation: fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(32px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Types
interface Measurement {
  id: string;
  date: Date;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string;
  classification: string;
  color: string;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [systolic, setSystolic] = useState<string>("");
  const [diastolic, setDiastolic] = useState<string>("");
  const [pulse, setPulse] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [result, setResult] = useState<Measurement | null>(null);

  const clearInputs = () => {
    setSystolic("");
    setDiastolic("");
    setPulse("");
    setNotes("");
  };

  const classifyBloodPressure = (sys: number, dia: number): { classification: string; color: string } => {
    // Classification selon les normes de l'OMS
    if (sys < 90 || dia < 60) {
      return { classification: "Hypotension", color: "text-blue-700 bg-blue-50" };
    }
    if (sys < 120 && dia < 80) {
      return { classification: "Optimale", color: "text-green-700 bg-green-50" };
    }
    if ((sys >= 120 && sys < 130) && dia < 85) {
      return { classification: "Normale", color: "text-green-700 bg-green-50" };
    }
    if ((sys >= 130 && sys < 140) || (dia >= 85 && dia < 90)) {
      return { classification: "Normale haute", color: "text-yellow-700 bg-yellow-50" };
    }
    if ((sys >= 140 && sys < 160) || (dia >= 90 && dia < 100)) {
      return { classification: "Hypertension légère (Stade 1)", color: "text-orange-700 bg-orange-50" };
    }
    if ((sys >= 160 && sys < 180) || (dia >= 100 && dia < 110)) {
      return { classification: "Hypertension modérée (Stade 2)", color: "text-red-700 bg-red-50" };
    }
    return { classification: "Hypertension sévère (Stade 3)", color: "text-red-900 bg-red-100" };
  };

  const classifyPulse = (pulse: number): string => {
    if (pulse < 60) {
      return "Bradycardie";
    }
    if (pulse > 100) {
      return "Tachycardie";
    }
    return "Normal";
  };

  const getRecommendations = (classification: string): string[] => {
    // Recommendations basées sur la classification
    const commonRecommendations = [
      "Maintenez une alimentation équilibrée, faible en sel",
      "Pratiquez une activité physique régulière",
      "Limitez votre consommation d'alcool",
      "Arrêtez de fumer si vous êtes fumeur",
      "Gérez votre stress par des techniques de relaxation"
    ];

    const specificRecommendations: Record<string, string[]> = {
      "Hypotension": [
        "Hydratez-vous régulièrement",
        "Augmentez légèrement votre consommation de sel",
        "Évitez de vous lever trop rapidement",
        "Consultez votre médecin si les symptômes persistent"
      ],
      "Optimale": [
        "Continuez vos bonnes habitudes",
        "Effectuez un contrôle annuel"
      ],
      "Normale": [
        "Maintenez vos habitudes actuelles",
        "Contrôlez votre tension tous les 6 mois"
      ],
      "Normale haute": [
        "Surveillez votre tension plus régulièrement",
        "Réduisez votre consommation de sel",
        "Contrôlez votre poids si nécessaire"
      ],
      "Hypertension légère (Stade 1)": [
        "Consultez votre médecin pour un suivi",
        "Suivez strictement les conseils d'hygiène de vie",
        "Contrôlez votre tension hebdomadairement"
      ],
      "Hypertension modérée (Stade 2)": [
        "Consultez rapidement votre médecin",
        "Un traitement médicamenteux peut être nécessaire",
        "Mesurez votre tension plusieurs fois par semaine"
      ],
      "Hypertension sévère (Stade 3)": [
        "Consultez un médecin en urgence",
        "Un traitement médicamenteux est nécessaire",
        "Suivez rigoureusement les prescriptions médicales"
      ]
    };

    // On retourne les recommandations spécifiques + quelques recommandations communes
    return [
      ...(specificRecommendations[classification] || []),
      ...commonRecommendations.slice(0, 3) // Prendre seulement 3 recommandations communes
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const sysValue = Number.parseInt(systolic);
    const diaValue = Number.parseInt(diastolic);
    const pulseValue = Number.parseInt(pulse);

    if (Number.isNaN(sysValue) || Number.isNaN(diaValue) || Number.isNaN(pulseValue)) {
      toast({
        title: "Données invalides",
        description: "Veuillez saisir des valeurs numériques valides",
        variant: "destructive",
      });
      return;
    }

    // Classification
    const { classification, color } = classifyBloodPressure(sysValue, diaValue);
    const pulseStatus = classifyPulse(pulseValue);

    // Création d'une nouvelle mesure
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      date: new Date(),
      systolic: sysValue,
      diastolic: diaValue,
      pulse: pulseValue,
      notes: notes,
      classification: classification,
      color: color,
    };

    // Stocker dans l'historique (localStorage)
    const history = JSON.parse(localStorage.getItem("measurements") || "[]");
    history.push(newMeasurement);
    localStorage.setItem("measurements", JSON.stringify(history));

    // Afficher le résultat
    setResult(newMeasurement);

    toast({
      title: "Mesure enregistrée",
      description: "Votre mesure a été ajoutée à l'historique",
    });
  };

  return (
    <>
      <style>{pageTransitionStyle}</style>
      <div className="max-w-4xl mx-auto page-transition">
        <h1 className="text-2xl tablet:text-tablet-xl font-bold mb-6">Saisie des constantes</h1>

        <div className="grid gap-6 md:grid-cols-2 tablet-portrait:grid-cols-2 tablet-landscape:gap-8">
          <Card className="tablet-portrait:p-tablet">
            <CardHeader>
              <CardTitle className="flex items-center tablet:text-tablet-lg">
                <HeartPulse className="mr-2 h-5 w-5 tablet:h-6 tablet:w-6 text-red-500" />
                Nouvelle mesure
              </CardTitle>
              <CardDescription className="tablet:text-base">
                Saisissez vos constantes vitales pour obtenir une analyse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 tablet:space-y-5">
                <div className="grid grid-cols-2 gap-4 tablet:gap-5">
                  <div>
                    <label htmlFor="systolic" className="block text-sm tablet:text-base font-medium mb-1">
                      Systolique (SYS) mmHg
                    </label>
                    <Input
                      id="systolic"
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="120"
                      required
                      className="tablet:h-12 tablet:text-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="diastolic" className="block text-sm tablet:text-base font-medium mb-1">
                      Diastolique (DIA) mmHg
                    </label>
                    <Input
                      id="diastolic"
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="80"
                      required
                      className="tablet:h-12 tablet:text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="pulse" className="block text-sm tablet:text-base font-medium mb-1">
                    Pouls (PUL) bpm
                  </label>
                  <Input
                    id="pulse"
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="75"
                    required
                    className="tablet:h-12 tablet:text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm tablet:text-base font-medium mb-1">
                    Notes (optionnel)
                  </label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Activité, médicaments, symptômes..."
                    className="tablet:h-12 tablet:text-lg"
                  />
                </div>
                <div className="flex space-x-2 pt-2 tablet:pt-4">
                  <Button type="submit" className="flex-1 tablet:h-12 tablet:text-base">
                    Analyser
                  </Button>
                  <Button type="button" variant="outline" onClick={clearInputs} className="tablet:h-12 tablet:text-base">
                    Effacer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {result ? (
            <Card className="tablet-portrait:p-tablet">
              <CardHeader className={result.color}>
                <CardTitle className="flex items-center tablet:text-tablet-lg">
                  {result.classification.includes("Hypertension sévère") ? (
                    <AlertTriangle className="mr-2 h-5 w-5 tablet:h-6 tablet:w-6" />
                  ) : result.classification.includes("Hypertension") ? (
                    <AlertCircle className="mr-2 h-5 w-5 tablet:h-6 tablet:w-6" />
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5 tablet:h-6 tablet:w-6" />
                  )}
                  Résultat
                </CardTitle>
                <CardDescription className="text-inherit opacity-90 tablet:text-base">
                  {new Date(result.date).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 tablet:pt-8">
                <div className="space-y-4 tablet:space-y-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm tablet:text-base text-muted-foreground">SYS</p>
                      <p className="text-2xl tablet:text-3xl font-bold">{result.systolic}</p>
                    </div>
                    <div>
                      <p className="text-sm tablet:text-base text-muted-foreground">DIA</p>
                      <p className="text-2xl tablet:text-3xl font-bold">{result.diastolic}</p>
                    </div>
                    <div>
                      <p className="text-sm tablet:text-base text-muted-foreground">PUL</p>
                      <p className="text-2xl tablet:text-3xl font-bold">{result.pulse}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-1 tablet:text-base">Classification:</p>
                    <Alert className={result.color}>
                      <AlertTitle className="tablet:text-lg">{result.classification}</AlertTitle>
                      <AlertDescription>
                        {classifyPulse(result.pulse) !== "Normal" && (
                          <span className="block mt-1 tablet:text-base">
                            Pouls: {classifyPulse(result.pulse)}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 tablet:text-base">Recommandations:</p>
                    <ul className="space-y-1 text-sm tablet:text-base">
                      {getRecommendations(result.classification).map((rec, index) => (
                        <li key={`${result.id}-rec-${index}`} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.notes && (
                    <div>
                      <p className="font-semibold mb-1 tablet:text-base">Notes:</p>
                      <p className="text-sm tablet:text-base text-muted-foreground">{result.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 tablet:pt-6">
                <Button
                  variant="outline"
                  className="w-full tablet:h-12 tablet:text-base"
                  onClick={() => setResult(null)}
                >
                  Nouvelle analyse
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-dashed bg-muted/20 tablet-portrait:p-tablet">
              <CardContent className="flex flex-col items-center justify-center h-full py-10 tablet:py-16">
                <LineChart className="h-12 w-12 tablet:h-16 tablet:w-16 text-muted mb-4" />
                <p className="text-foreground text-center mb-2 tablet:text-lg">Visualisez vos tendances</p>
                <p className="text-muted-foreground text-sm tablet:text-base text-center mb-6 max-w-xs">
                  Suivez l'évolution de votre tension artérielle et de votre pouls dans le temps grâce aux graphiques interactifs
                </p>
                <Button variant="outline" asChild className="tablet:h-12 tablet:text-base">
                  <Link href="/dashboard/history">
                    Voir les graphiques
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
