"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Download, Trash2, CalendarRange } from "lucide-react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  BarChart2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BloodPressureChart } from "@/components/ui/blood-pressure-chart";

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

export default function HistoryPage() {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'all'>('month');

  // Chargement des mesures depuis le localStorage
  useEffect(() => {
    const storedMeasurements = localStorage.getItem("measurements");
    if (storedMeasurements) {
      setMeasurements(JSON.parse(storedMeasurements));
    }
  }, []);

  // Fonctions pour le formatage des dates
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  const formatDateTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString("fr-FR");
  };

  // Suppression d'une mesure
  const deleteMeasurement = (id: string) => {
    const updatedMeasurements = measurements.filter((m) => m.id !== id);
    setMeasurements(updatedMeasurements);
    localStorage.setItem("measurements", JSON.stringify(updatedMeasurements));
    toast({
      title: "Mesure supprimée",
      description: "La mesure a été supprimée de votre historique",
    });
  };

  // Calcul des statistiques
  const getStats = () => {
    if (measurements.length === 0) {
      return { avgSys: 0, avgDia: 0, avgPulse: 0 };
    }

    const sum = measurements.reduce(
      (acc, measurement) => {
        return {
          sys: acc.sys + measurement.systolic,
          dia: acc.dia + measurement.diastolic,
          pulse: acc.pulse + measurement.pulse,
        };
      },
      { sys: 0, dia: 0, pulse: 0 }
    );

    return {
      avgSys: Math.round(sum.sys / measurements.length),
      avgDia: Math.round(sum.dia / measurements.length),
      avgPulse: Math.round(sum.pulse / measurements.length),
    };
  };

  // Classification de la pression artérielle selon les normes OMS
  const classifyBloodPressure = (sys: number, dia: number): { classification: string; color: string } => {
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

  // Classification du pouls
  const classifyPulse = (pulse: number): string => {
    if (pulse < 60) {
      return "Bradycardie";
    }
    if (pulse > 100) {
      return "Tachycardie";
    }
    return "Normal";
  };

  // Obtention des recommandations basées sur la classification
  const getRecommendations = (classification: string): string[] => {
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

    return [
      ...(specificRecommendations[classification] || []),
      ...commonRecommendations.slice(0, 3)
    ];
  };

  // Exporter l'historique au format PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Historique des mesures de tension artérielle", 20, 20);
    doc.setFontSize(12);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 20, 30);

    // En-tête du tableau
    doc.setFontSize(10);
    doc.text("Date", 20, 45);
    doc.text("SYS", 50, 45);
    doc.text("DIA", 70, 45);
    doc.text("PUL", 90, 45);
    doc.text("Classification", 110, 45);
    doc.text("Notes", 170, 45);

    // Ligne horizontale
    doc.line(20, 48, 190, 48);

    // Contenu du tableau
    let y = 55;
    measurements.forEach((m, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
        // En-tête sur la nouvelle page
        doc.text("Date", 20, y);
        doc.text("SYS", 50, y);
        doc.text("DIA", 70, y);
        doc.text("PUL", 90, y);
        doc.text("Classification", 110, y);
        doc.text("Notes", 170, y);
        doc.line(20, y + 3, 190, y + 3);
        y += 10;
      }

      doc.text(formatDateTime(m.date), 20, y);
      doc.text(m.systolic.toString(), 50, y);
      doc.text(m.diastolic.toString(), 70, y);
      doc.text(m.pulse.toString(), 90, y);
      doc.text(m.classification, 110, y);

      // Tronquer les notes si elles sont trop longues
      const notes = m.notes.length > 20 ? m.notes.substring(0, 20) + "..." : m.notes;
      doc.text(notes, 170, y);

      y += 8;
    });

    // Statistiques
    const stats = getStats();
    y += 10;
    doc.setFontSize(12);
    doc.text("Statistiques :", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Moyenne SYS: ${stats.avgSys} mmHg`, 20, y);
    y += 6;
    doc.text(`Moyenne DIA: ${stats.avgDia} mmHg`, 20, y);
    y += 6;
    doc.text(`Moyenne Pouls: ${stats.avgPulse} bpm`, 20, y);

    doc.save("historique-tension.pdf");

    toast({
      title: "Export réussi",
      description: "L'historique a été exporté au format PDF",
    });
  };

  // Regrouper les mesures par date
  const groupByDate = () => {
    const groups: Record<string, Measurement[]> = {};

    measurements.forEach((m) => {
      const date = formatDate(m.date);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(m);
    });

    return Object.entries(groups).map(([date, measurements]) => ({
      date,
      measurements,
    }));
  };

  // Obtenir l'icône correspondant à la classification
  const getIcon = (classification: string | undefined) => {
    if (!classification) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (classification.includes("Hypertension sévère")) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (classification.includes("Hypertension")) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  const groupedMeasurements = groupByDate();
  const stats = getStats();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Historique des mesures</h1>
        <div className="flex space-x-2 mt-2 md:mt-0">
          <Button variant="outline" onClick={exportToPDF} disabled={measurements.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {measurements.length > 0 ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
                Statistiques globales
              </CardTitle>
              <CardDescription>
                Basé sur {measurements.length} mesure{measurements.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Moyenne SYS</p>
                  <p className="text-2xl font-bold">{stats.avgSys}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Moyenne DIA</p>
                  <p className="text-2xl font-bold">{stats.avgDia}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Moyenne PUL</p>
                  <p className="text-2xl font-bold">{stats.avgPulse}</p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-md bg-gray-50">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Classification moyenne : </span>
                  {classifyBloodPressure(stats.avgSys, stats.avgDia).classification}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Nouvelle section graphique */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-blue-500" />
                Évolution de la tension artérielle
              </CardTitle>
              <CardDescription>
                Visualisez l'évolution de votre tension artérielle au fil du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="month" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="week" onClick={() => setTimeFrame('week')}>7 derniers jours</TabsTrigger>
                  <TabsTrigger value="month" onClick={() => setTimeFrame('month')}>30 derniers jours</TabsTrigger>
                  <TabsTrigger value="all" onClick={() => setTimeFrame('all')}>Toutes les mesures</TabsTrigger>
                </TabsList>
                <TabsContent value="week">
                  <BloodPressureChart measurements={measurements} timeFrame="week" />
                </TabsContent>
                <TabsContent value="month">
                  <BloodPressureChart measurements={measurements} timeFrame="month" />
                </TabsContent>
                <TabsContent value="all">
                  <BloodPressureChart measurements={measurements} timeFrame="all" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {groupedMeasurements.map((group) => (
              <Card key={group.date}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {group.date}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.measurements.map((measurement) => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className={`p-1 rounded-full mr-3 ${measurement.color}`}>
                            {getIcon(measurement.classification)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(measurement.date).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {measurement.systolic}/{measurement.diastolic} mmHg - {measurement.pulse} bpm
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMeasurement(measurement)}
                              >
                                Détails
                              </Button>
                            </DialogTrigger>
                            {selectedMeasurement && (
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Détails de la mesure</DialogTitle>
                                  <DialogDescription>
                                    {formatDateTime(selectedMeasurement.date)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <p className="text-sm text-gray-500">SYS</p>
                                      <p className="text-2xl font-bold">{selectedMeasurement.systolic}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">DIA</p>
                                      <p className="text-2xl font-bold">{selectedMeasurement.diastolic}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">PUL</p>
                                      <p className="text-2xl font-bold">{selectedMeasurement.pulse}</p>
                                    </div>
                                  </div>

                                  <div className={`p-3 rounded-md ${selectedMeasurement.color}`}>
                                    <p className="font-medium">{selectedMeasurement.classification}</p>
                                    {classifyPulse(selectedMeasurement.pulse) !== "Normal" && (
                                      <p className="text-sm mt-1">
                                        Pouls: {classifyPulse(selectedMeasurement.pulse)}
                                      </p>
                                    )}
                                  </div>

                                  {selectedMeasurement.notes && (
                                    <div>
                                      <p className="font-medium text-sm">Notes:</p>
                                      <p className="text-sm text-gray-600">{selectedMeasurement.notes}</p>
                                    </div>
                                  )}

                                  <div>
                                    <p className="font-medium text-sm">Recommandations:</p>
                                    <ul className="text-sm text-gray-600 space-y-1 mt-1">
                                      {getRecommendations(selectedMeasurement.classification).map((rec, i) => (
                                        <li key={`${selectedMeasurement.id}-rec-${i}`} className="flex">
                                          <span className="mr-2">•</span>
                                          <span>{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMeasurement(measurement.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-2">Aucune mesure enregistrée</p>
            <p className="text-gray-400 text-sm text-center mb-6">
              Enregistrez votre première mesure de tension pour commencer à suivre votre santé cardiaque
            </p>
            <Button asChild>
              <a href="/dashboard">Nouvelle mesure</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
