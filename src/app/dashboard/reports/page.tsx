"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, ArrowRight, Info, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import useOpenRouter from "@/hooks/use-openrouter";
import type { Measurement, PatientInfo, MedicalReport } from "@/lib/types";
import ShareDialog from "./share-dialog";
import { v4 as uuidv4 } from 'uuid';

export default function ReportsPage() {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [user, setUser] = useState<PatientInfo | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "trimester" | "custom">("month");
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>("");
  const [generatedReports, setGeneratedReports] = useState<MedicalReport[]>([]);
  const { generateHealthReport, isLoading, error } = useOpenRouter();

  // Chargement des données depuis le localStorage
  useEffect(() => {
    const storedMeasurements = localStorage.getItem("measurements");
    if (storedMeasurements) {
      setMeasurements(JSON.parse(storedMeasurements));
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as PatientInfo);
    }

    const storedReports = localStorage.getItem("reports");
    if (storedReports) {
      setGeneratedReports(JSON.parse(storedReports));
    }

    // Initialiser la période
    updatePeriodLabel("month");
    // eslint-disable-next-line
  }, []);

  // Sauvegarder les rapports dans le localStorage
  useEffect(() => {
    if (generatedReports.length > 0) {
      localStorage.setItem("reports", JSON.stringify(generatedReports));
    }
  }, [generatedReports]);

  // Mettre à jour le libellé de la période sélectionnée
  const updatePeriodLabel = (period: "week" | "month" | "trimester" | "custom") => {
    const now = dayjs();

    let startDate: dayjs.Dayjs | null = null;
    const endDate = now;

    switch (period) {
      case "week":
        startDate = now.subtract(7, "day");
        setPeriodLabel(`Du ${startDate.format("DD/MM/YYYY")} au ${endDate.format("DD/MM/YYYY")}`);
        break;
      case "month":
        startDate = now.subtract(1, "month");
        setPeriodLabel(`Du ${startDate.format("DD/MM/YYYY")} au ${endDate.format("DD/MM/YYYY")}`);
        break;
      case "trimester":
        startDate = now.subtract(3, "month");
        setPeriodLabel(`Du ${startDate.format("DD/MM/YYYY")} au ${endDate.format("DD/MM/YYYY")}`);
        break;
      default:
        setPeriodLabel("Période personnalisée");
    }

    setSelectedPeriod(period);
  };

  // Filtrer les mesures selon la période sélectionnée
  const getFilteredMeasurements = (): Measurement[] => {
    const now = dayjs();

    let startDate: dayjs.Dayjs;
    const endDate = now;

    switch (selectedPeriod) {
      case "week":
        startDate = now.subtract(7, "day");
        break;
      case "month":
        startDate = now.subtract(1, "month");
        break;
      case "trimester":
        startDate = now.subtract(3, "month");
        break;
      default:
        startDate = now.subtract(1, "month"); // Par défaut, 1 mois
    }

    return measurements.filter(m => {
      const measureDate = dayjs(m.date);
      return measureDate.isAfter(startDate) && measureDate.isBefore(endDate);
    });
  };

  // Calcul des statistiques
  const getStats = (filteredMeasurements: Measurement[]) => {
    if (filteredMeasurements.length === 0) {
      return { avgSys: 0, avgDia: 0, avgPulse: 0, minSys: 0, maxSys: 0, minDia: 0, maxDia: 0 };
    }

    const sum = filteredMeasurements.reduce(
      (acc, measurement) => {
        return {
          sys: acc.sys + measurement.systolic,
          dia: acc.dia + measurement.diastolic,
          pulse: acc.pulse + measurement.pulse,
        };
      },
      { sys: 0, dia: 0, pulse: 0 }
    );

    // Valeurs min/max
    const minSys = Math.min(...filteredMeasurements.map(m => m.systolic));
    const maxSys = Math.max(...filteredMeasurements.map(m => m.systolic));
    const minDia = Math.min(...filteredMeasurements.map(m => m.diastolic));
    const maxDia = Math.max(...filteredMeasurements.map(m => m.diastolic));

    return {
      avgSys: Math.round(sum.sys / filteredMeasurements.length),
      avgDia: Math.round(sum.dia / filteredMeasurements.length),
      avgPulse: Math.round(sum.pulse / filteredMeasurements.length),
      minSys,
      maxSys,
      minDia,
      maxDia,
    };
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

  // Formatage des dates
  const formatDate = (date: Date | string) => {
    try {
      return dayjs(date).format("DD/MM/YYYY HH:mm");
    } catch (error) {
      console.error("Erreur formatage date:", error);
      return "Date invalide";
    }
  };

  // Génération du rapport en PDF
  const generateReport = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const filteredMeasurements = getFilteredMeasurements();
        const stats = getStats(filteredMeasurements);

        const doc = new jsPDF();

        // Titre
        doc.setFontSize(22);
        doc.text("Rapport de suivi de tension artérielle", 105, 20, { align: "center" });

        // Sous-titre avec la période
        doc.setFontSize(12);
        doc.text(`${periodLabel}`, 105, 30, { align: "center" });
        doc.text(`Généré le ${dayjs().format("DD/MM/YYYY à HH:mm")}`, 105, 38, { align: "center" });

        // Infos patient
        if (user) {
          doc.setFontSize(14);
          doc.text("Informations patient", 20, 50);

          doc.setFontSize(10);
          doc.text(`Nom: ${user.displayName}`, 20, 60);
          if (user.age) doc.text(`Âge: ${user.age} ans`, 20, 65);
          if (user.gender) doc.text(`Genre: ${user.gender === 'male' ? 'Masculin' : user.gender === 'female' ? 'Féminin' : 'Autre'}`, 20, 70);
        }

        // Si un rapport IA existe, l'ajouter
        if (aiReport) {
          let yPos = 85;

          doc.setFontSize(14);
          doc.text("Analyse IA", 20, yPos);
          yPos += 10;

          doc.setFontSize(10);
          // Reformater le rapport IA pour l'adapter au PDF
          const maxWidth = 170;
          const lines = doc.splitTextToSize(aiReport, maxWidth);

          // Vérifier si on a besoin d'ajouter une page
          if (yPos + lines.length * 5 > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.text(lines, 20, yPos);
          yPos += lines.length * 5 + 10;

          // Statistiques
          doc.setFontSize(14);
          doc.text("Synthèse", 20, yPos);

          // Si on est presque en bas de page, ajouter une nouvelle page
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
            doc.setFontSize(14);
            doc.text("Synthèse", 20, yPos);
          }

          yPos += 10;
          doc.setFontSize(10);
        } else {
          // Statistiques (si pas de rapport IA)
          doc.setFontSize(14);
          doc.text("Synthèse", 20, 85);
          doc.setFontSize(10);
        }

        // Position Y actuelle pour les statistiques
        const yPos = aiReport ? (doc.getNumberOfPages() > 1 ? 30 : 95) : 95;

        const avgClassification = stats && stats.avgSys && stats.avgDia ? classifyBloodPressure(stats.avgSys, stats.avgDia) : 'Non disponible';
        doc.text(`Tension moyenne: ${stats.avgSys || 'N/A'}/${stats.avgDia || 'N/A'} mmHg - ${avgClassification}`, 20, yPos);
        doc.text(`Pouls moyen: ${stats.avgPulse || 'N/A'} bpm`, 20, yPos + 5);
        doc.text(`Variations systolique: ${stats.minSys || 'N/A'} - ${stats.maxSys || 'N/A'} mmHg`, 20, yPos + 10);
        doc.text(`Variations diastolique: ${stats.minDia || 'N/A'} - ${stats.maxDia || 'N/A'} mmHg`, 20, yPos + 15);
        doc.text(`Nombre de mesures: ${filteredMeasurements.length}`, 20, yPos + 20);

        // Tableau des mesures
        if (filteredMeasurements.length > 0) {
          let tableYPos = yPos + 35;

          // Si on est proche du bas de page, nouvelle page
          if (tableYPos > 240) {
            doc.addPage();
            tableYPos = 20;
          }

          doc.setFontSize(14);
          doc.text("Détail des mesures", 20, tableYPos);

          // En-tête du tableau
          doc.setFontSize(9);
          tableYPos += 10;
          doc.text("Date", 20, tableYPos);
          doc.text("SYS", 70, tableYPos);
          doc.text("DIA", 85, tableYPos);
          doc.text("PUL", 100, tableYPos);
          doc.text("Classification", 115, tableYPos);
          doc.text("Notes", 170, tableYPos);

          // Ligne de séparation
          doc.line(20, tableYPos + 2, 190, tableYPos + 2);

          // Données du tableau
          let y = tableYPos + 8;

          // Trier les mesures par date
          const sortedMeasurements = [...filteredMeasurements].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          sortedMeasurements.forEach((m, index) => {
            // Ajouter une nouvelle page si nécessaire
            if (y > 270) {
              doc.addPage();
              doc.text("Date", 20, 20);
              doc.text("SYS", 70, 20);
              doc.text("DIA", 85, 20);
              doc.text("PUL", 100, 20);
              doc.text("Classification", 115, 20);
              doc.text("Notes", 170, 20);
              doc.line(20, 22, 190, 22);
              y = 30;
            }

            // Classification de la mesure
            const classification = m.systolic && m.diastolic ? classifyBloodPressure(m.systolic, m.diastolic) : 'Non disponible';

            // Ajouter les données
            doc.text(formatDate(m.date), 20, y);
            doc.text(m.systolic ? m.systolic.toString() : 'N/A', 70, y);
            doc.text(m.diastolic ? m.diastolic.toString() : 'N/A', 85, y);
            doc.text(m.pulse ? m.pulse.toString() : 'N/A', 100, y);
            doc.text(classification, 115, y);

            // Tronquer les notes si elles sont trop longues
            const notes = m.notes && m.notes.length > 0 ? (m.notes.length > 20 ? `${m.notes.substring(0, 20)}...` : m.notes) : '';
            doc.text(notes, 170, y);

            y += 6;

            // Ajouter une ligne légère entre les mesures
            if (index < sortedMeasurements.length - 1) {
              doc.setDrawColor(220, 220, 220); // Gris clair
              doc.line(20, y - 3, 190, y - 3);
              doc.setDrawColor(0, 0, 0); // Réinitialiser en noir
            }
          });
        }

        // Ajouter un pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(`T-Cardio AI - Page ${i} sur ${pageCount}`, 105, 285, { align: "center" });
        }

        // Créer un nouveau rapport pour le partage
        const reportTitle = `Rapport de tension - ${dayjs().format("DD/MM/YYYY")}`;
        const reportContent = aiReport || "Rapport de suivi de tension artérielle"; // Utiliser le rapport AI s'il existe

        // Stocker le rapport généré pour le partage
        const newReport: MedicalReport = {
          id: uuidv4(),
          title: reportTitle,
          content: reportContent,
          createdAt: new Date().toISOString(),
          userId: user?.id || "unknown",
          measurementIds: filteredMeasurements.map(m => m.id),
        };

        setGeneratedReports(prev => [newReport, ...prev]);

        // Sauvegarder le PDF
        doc.save(`rapport-tension-${dayjs().format("YYYY-MM-DD")}.pdf`);

        toast({
          title: "Rapport généré",
          description: "Le rapport PDF a été créé avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la génération du rapport.",
          variant: "destructive",
        });
        // eslint-disable-next-line no-console
        console.error("Erreur PDF:", error);
      } finally {
        setIsGenerating(false);
      }
    }, 500);
  };

  // Générer un rapport d'analyse avec l'IA
  const generateAIReport = async () => {
    setIsGeneratingAI(true);
    try {
      const filteredMeasurements = getFilteredMeasurements();
      if (!filteredMeasurements.length || !user) {
        throw new Error("Données insuffisantes pour générer un rapport");
      }

      const additionalContext = `
        Période d'analyse: ${periodLabel}
        Nombre de mesures: ${filteredMeasurements.length}
      `;

      const reportContent = await generateHealthReport(
        filteredMeasurements,
        user,
        additionalContext
      );

      setAiReport(reportContent);

      toast({
        title: "Analyse IA générée",
        description: "L'analyse de vos données a été réalisée avec succès.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: error || "Une erreur est survenue lors de la génération de l'analyse IA.",
        variant: "destructive",
      });
      console.error("Erreur IA:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredMeasurements = getFilteredMeasurements();
  const hasMeasurements = filteredMeasurements.length > 0;
  const stats = getStats(filteredMeasurements);

  // Récupérer le dernier rapport généré pour le partage
  const latestReport = generatedReports.length > 0 ? generatedReports[0] : null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rapports</h1>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-500" />
                  Générer un rapport de suivi
                </CardTitle>
                <CardDescription>
                  Créez un rapport PDF détaillé de vos mesures de tension artérielle
                </CardDescription>
              </div>
              {latestReport && (
                <ShareDialog
                  report={latestReport}
                  userName={user?.displayName || "Utilisateur"}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-3">Sélectionnez une période :</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedPeriod === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePeriodLabel("week")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    7 derniers jours
                  </Button>
                  <Button
                    variant={selectedPeriod === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePeriodLabel("month")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    30 derniers jours
                  </Button>
                  <Button
                    variant={selectedPeriod === "trimester" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePeriodLabel("trimester")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    3 derniers mois
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-3 bg-gray-50">
                <p className="text-sm font-medium mb-1 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                  Période sélectionnée :
                </p>
                <p className="text-sm">{periodLabel}</p>
                <p className="text-sm mt-2">
                  {hasMeasurements ? (
                    <>
                      {filteredMeasurements.length} mesure{filteredMeasurements.length > 1 ? "s" : ""} disponible{filteredMeasurements.length > 1 ? "s" : ""}
                    </>
                  ) : (
                    <>Aucune mesure disponible pour cette période</>
                  )}
                </p>
              </div>

              {hasMeasurements && (
                <div className="border rounded-md p-4">
                  <p className="text-sm font-medium mb-3">Aperçu des statistiques :</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Tension moyenne</p>
                      <p className="text-xl font-bold">{stats.avgSys}/{stats.avgDia}</p>
                      <p className="text-xs text-gray-600">{classifyBloodPressure(stats.avgSys, stats.avgDia)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pouls moyen</p>
                      <p className="text-xl font-bold">{stats.avgPulse}</p>
                      <p className="text-xs text-gray-600">bpm</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">SYS Min / Max</p>
                      <p className="text-xl font-bold">{stats.minSys}<ArrowRight className="h-3 w-3 inline mx-1" />{stats.maxSys}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">DIA Min / Max</p>
                      <p className="text-xl font-bold">{stats.minDia}<ArrowRight className="h-3 w-3 inline mx-1" />{stats.maxDia}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section d'analyse IA */}
              {hasMeasurements && (
                <div className="border rounded-md p-4 bg-blue-50">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                      Analyse IA de vos données
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generateAIReport}
                      disabled={isGeneratingAI || !hasMeasurements}
                    >
                      {isGeneratingAI ? "Analyse en cours..." : "Analyser mes données"}
                    </Button>
                  </div>

                  {aiReport ? (
                    <div className="mt-3 bg-white p-3 rounded-md text-sm border">
                      <p className="text-xs text-gray-500 mb-2">Résultat de l'analyse :</p>
                      <div className="prose prose-sm max-w-none">
                        {aiReport.split('\n').map((paragraph, i) => (
                          <p key={i} className={i === 0 ? "font-medium" : ""}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic">
                      {isGeneratingAI
                        ? "Analyse en cours, veuillez patienter..."
                        : "Cliquez sur \"Analyser mes données\" pour obtenir une analyse personnalisée de votre tension artérielle par intelligence artificielle."}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={generateReport}
                  disabled={!hasMeasurements || isGenerating}
                  className={hasMeasurements ? "bg-blue-700 hover:bg-blue-800" : ""}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Générer le rapport PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasMeasurements && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-2">Aucune mesure disponible pour cette période</p>
            <p className="text-gray-400 text-sm text-center mb-6">
              Ajoutez des mesures de tension et revenez pour générer votre rapport
            </p>
            <Button asChild>
              <a href="/dashboard">Ajouter une mesure</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des rapports générés */}
      {generatedReports.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rapports générés</CardTitle>
            <CardDescription>
              Historique des rapports que vous avez créés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ShareDialog
                      report={report}
                      userName={user?.displayName || "Utilisateur"}
                    />
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
