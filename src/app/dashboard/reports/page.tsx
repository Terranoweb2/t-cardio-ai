"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, ArrowRight, Info } from "lucide-react";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";

// Types
interface Measurement {
  id: string;
  date: Date | string;
  systolic: number;
  diastolic: number;
  pulse: number;
  notes: string;
  classification: string;
  color: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor";
  birthdate?: string;
  phone?: string;
  address?: string;
  medicalInfo?: string;
  allergies?: string;
  medications?: string;
  doctor?: {
    id: string;
    name: string;
    speciality: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "trimester" | "custom">("month");
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Chargement des données depuis le localStorage
  useEffect(() => {
    const storedMeasurements = localStorage.getItem("measurements");
    if (storedMeasurements) {
      setMeasurements(JSON.parse(storedMeasurements));
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser) as UserProfile);
    }

    // Initialiser la période
    updatePeriodLabel("month");
    // eslint-disable-next-line
  }, []);

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
    return dayjs(date).format("DD/MM/YYYY HH:mm");
  };

  // Génération du rapport en PDF
  const generateReport = () => {
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
          doc.text(`Nom: ${user.name}`, 20, 60);
          if (user.birthdate) doc.text(`Date de naissance: ${user.birthdate}`, 20, 65);
          if (user.phone) doc.text(`Téléphone: ${user.phone}`, 20, 70);

          // Infos médecin
          if (user.doctor) {
            doc.text(`Médecin: ${user.doctor.name}`, 120, 60);
            if (user.doctor.speciality) doc.text(`Spécialité: ${user.doctor.speciality}`, 120, 65);
            if (user.doctor.phone) doc.text(`Téléphone: ${user.doctor.phone}`, 120, 70);
          }
        }

        // Statistiques
        doc.setFontSize(14);
        doc.text("Synthèse", 20, 85);

        doc.setFontSize(10);
        const avgClassification = classifyBloodPressure(stats.avgSys, stats.avgDia);
        doc.text(`Tension moyenne: ${stats.avgSys}/${stats.avgDia} mmHg - ${avgClassification}`, 20, 95);
        doc.text(`Pouls moyen: ${stats.avgPulse} bpm`, 20, 100);
        doc.text(`Variations systolique: ${stats.minSys} - ${stats.maxSys} mmHg`, 20, 105);
        doc.text(`Variations diastolique: ${stats.minDia} - ${stats.maxDia} mmHg`, 20, 110);
        doc.text(`Nombre de mesures: ${filteredMeasurements.length}`, 20, 115);

        // Tableau des mesures
        if (filteredMeasurements.length > 0) {
          doc.setFontSize(14);
          doc.text("Détail des mesures", 20, 130);

          // En-tête du tableau
          doc.setFontSize(9);
          doc.text("Date", 20, 140);
          doc.text("SYS", 70, 140);
          doc.text("DIA", 85, 140);
          doc.text("PUL", 100, 140);
          doc.text("Classification", 115, 140);
          doc.text("Notes", 160, 140);

          // Ligne de séparation
          doc.line(20, 142, 190, 142);

          // Données du tableau
          let y = 148;

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
              doc.text("Notes", 160, 20);
              doc.line(20, 22, 190, 22);
              y = 30;
            }

            // Ajouter les données
            doc.text(formatDate(m.date), 20, y);
            doc.text(m.systolic.toString(), 70, y);
            doc.text(m.diastolic.toString(), 85, y);
            doc.text(m.pulse.toString(), 100, y);
            doc.text(m.classification, 115, y);

            // Tronquer les notes si elles sont trop longues
            const notes = m.notes.length > 15 ? `${m.notes.substring(0, 15)}...` : m.notes;
            doc.text(notes, 160, y);

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

  const filteredMeasurements = getFilteredMeasurements();
  const hasMeasurements = filteredMeasurements.length > 0;
  const stats = getStats(filteredMeasurements);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rapports</h1>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-500" />
              Générer un rapport de suivi
            </CardTitle>
            <CardDescription>
              Créez un rapport PDF détaillé de vos mesures de tension artérielle
            </CardDescription>
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

              <div className="flex justify-end">
                <Button
                  onClick={generateReport}
                  disabled={!hasMeasurements || isGenerating}
                  className={hasMeasurements ? "bg-blue-700 hover:bg-blue-800" : ""}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
    </div>
  );
}
