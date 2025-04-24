"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  // Vérifier si l'utilisateur est déjà connecté, mais uniquement côté client
  useEffect(() => {
    // Cette vérification s'exécute uniquement côté client, évitant les problèmes d'hydratation
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error);
      }
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-4">
      <div className="max-w-3xl w-full text-center">
        <div className="flex items-center justify-center mb-8">
          <Image src="/logo.png" alt="T-Cardio AI Logo" width={50} height={50} className="mr-4" />
          <h1 className="text-5xl font-bold text-blue-700">T-Cardio AI</h1>
        </div>

        <h2 className="text-2xl font-medium text-gray-700 mb-6">
          Votre assistant intelligent pour le suivi de votre tension artérielle
        </h2>

        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          T-Cardio AI vous permet de suivre facilement votre tension artérielle,
          d'analyser vos données selon les recommandations de l'OMS et de partager vos résultats
          avec votre médecin en toute sécurité.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-blue-600 text-3xl font-bold mb-3">1</div>
            <h3 className="text-xl font-semibold mb-2">Saisissez vos mesures</h3>
            <p className="text-gray-600">
              Entrez simplement vos valeurs de tension artérielle et recevez une analyse immédiate.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-blue-600 text-3xl font-bold mb-3">2</div>
            <h3 className="text-xl font-semibold mb-2">Suivez votre évolution</h3>
            <p className="text-gray-600">
              Visualisez l'historique de vos mesures et identifiez les tendances sur le long terme.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-blue-600 text-3xl font-bold mb-3">3</div>
            <h3 className="text-xl font-semibold mb-2">Partagez en toute sécurité</h3>
            <p className="text-gray-600">
              Partagez vos données avec votre médecin à l'aide de tokens sécurisés pour un meilleur suivi.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-blue-700 hover:bg-blue-800"
            onClick={() => router.push("/auth")}
          >
            Commencer maintenant
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/auth")}
          >
            Se connecter
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          T-Cardio AI est conforme aux recommandations officielles de l'OMS pour l'analyse de la tension artérielle.
          <div className="mt-2">
            © {new Date().getFullYear()} T-Cardio AI - Tous droits réservés
          </div>
        </div>
      </div>
    </main>
  );
}
