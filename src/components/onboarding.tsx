"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, BarChart3, Share2, FileText, User, CheckCircle, ArrowRight } from "lucide-react";

// Étapes d'onboarding
const steps = [
  {
    id: 1,
    title: "Bienvenue sur T-Cardio AI",
    description: "Votre application de suivi de tension artérielle et de pouls vous accompagne pour une meilleure santé cardiovasculaire.",
    icon: <Heart className="h-12 w-12 text-red-500 mb-4" />,
    features: [
      "Suivez votre tension artérielle et votre pouls",
      "Visualisez vos tendances avec des graphiques",
      "Partagez vos données avec vos professionnels de santé",
      "Recevez des recommandations personnalisées"
    ]
  },
  {
    id: 2,
    title: "Saisie des mesures",
    description: "Entrez vos mesures de tension systolique, diastolique et votre pouls pour obtenir une analyse immédiate.",
    icon: <Heart className="h-12 w-12 text-red-500 mb-4" />,
    image: "/screenshots/saisie.png",
    annotation: "Sur l'écran principal, saisissez vos valeurs et cliquez sur Analyser"
  },
  {
    id: 3,
    title: "Historique et graphiques",
    description: "Visualisez l'évolution de vos constantes dans le temps grâce aux graphiques interactifs.",
    icon: <BarChart3 className="h-12 w-12 text-blue-500 mb-4" />,
    image: "/screenshots/historique.png",
    annotation: "Dans la section Historique, consultez vos tendances et statistiques"
  },
  {
    id: 4,
    title: "Partage avec les professionnels",
    description: "Partagez facilement vos données avec votre médecin ou spécialiste.",
    icon: <Share2 className="h-12 w-12 text-green-500 mb-4" />,
    image: "/screenshots/partage.png",
    annotation: "Créez un token de partage ou utilisez celui de votre médecin"
  },
  {
    id: 5,
    title: "Rapports et analyses",
    description: "Générez des rapports PDF détaillés pour vos consultations médicales.",
    icon: <FileText className="h-12 w-12 text-purple-500 mb-4" />,
    image: "/screenshots/rapports.png",
    annotation: "Exportez vos données dans un rapport professionnel"
  },
  {
    id: 6,
    title: "Personnalisez votre profil",
    description: "Complétez vos informations personnelles et médicales pour un suivi plus précis.",
    icon: <User className="h-12 w-12 text-orange-500 mb-4" />,
    image: "/screenshots/profil.png",
    annotation: "Renseignez vos informations de santé et celles de votre médecin"
  },
  {
    id: 7,
    title: "Vous êtes prêt !",
    description: "Vous savez maintenant comment utiliser T-Cardio AI. Commencez dès maintenant à suivre votre santé cardiovasculaire.",
    icon: <CheckCircle className="h-12 w-12 text-green-500 mb-4" />,
    buttonText: "Commencer"
  }
];

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu l'onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader className="text-center">
          <div className="flex justify-center">{currentStepData.icon}</div>
          <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-center">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {currentStepData.features ? (
            <div className="space-y-2">
              {currentStepData.features.map((feature, index) => (
                <div key={index} className="flex items-center bg-muted p-3 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
          ) : currentStepData.image ? (
            <div className="rounded-md overflow-hidden border border-border">
              <div className="relative">
                {/* Pour les images, nous utiliserions des captures d'écran ici */}
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    {currentStepData.annotation || "Capture d'écran"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <div className="flex items-center justify-center mb-2 sm:mb-0">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Précédent
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                currentStepData.buttonText || "Terminer"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
