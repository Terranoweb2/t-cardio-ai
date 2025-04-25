"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

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
    <main className="flex min-h-screen flex-col items-center bg-white">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-blue-50 to-blue-100 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <div className="flex items-center justify-center md:justify-start mb-5">
                <Image src="/logo.png" alt="T-Cardio AI Logo" width={60} height={60} className="mr-4" />
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">T-Cardio AI</h1>
              </div>
              <h2 className="text-2xl md:text-3xl font-medium text-gray-700 mb-6">
                <span className="text-blue-600">Votre assistant intelligent</span> pour le suivi de votre tension artérielle
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                T-Cardio AI vous permet de suivre facilement votre tension artérielle,
                d'analyser vos données selon les recommandations de l'OMS et de partager vos résultats
                avec votre médecin en toute sécurité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-blue-700 hover:bg-blue-800 text-lg py-6 font-medium"
                  onClick={() => router.push("/auth")}
                >
                  Commencer maintenant <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg py-6 font-medium"
                  onClick={() => router.push("/auth")}
                >
                  Se connecter
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <Image 
                  src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835949/top-view-tensiometer-checking-blood-pressure_ehcwx8.jpg" 
                  alt="Suivi de tension artérielle" 
                  width={600} 
                  height={400} 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Comment ça fonctionne</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              T-Cardio AI simplifie la gestion de votre tension artérielle en trois étapes faciles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="relative mb-6 overflow-hidden rounded-lg">
                <Image 
                  src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835891/african-american-black-doctor-man-with-stethoscope-isolated-white-background_pcjy7l.jpg" 
                  alt="Saisie des mesures" 
                  width={400} 
                  height={300}
                  className="w-full h-48 object-cover" 
                />
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3">Saisissez vos mesures</h3>
              <p className="text-gray-600">
                Entrez simplement vos valeurs de tension artérielle et recevez une analyse immédiate basée sur les recommandations de l'OMS.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="relative mb-6 overflow-hidden rounded-lg">
                <Image 
                  src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835890/cardio-running-png-sticker-health-wellness-vector-illustration-transparent-background_wft52s.jpg" 
                  alt="Suivi de l'évolution" 
                  width={400} 
                  height={300}
                  className="w-full h-48 object-cover" 
                />
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3">Suivez votre évolution</h3>
              <p className="text-gray-600">
                Visualisez l'historique de vos mesures avec des graphiques clairs et identifiez les tendances sur le long terme.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="relative mb-6 overflow-hidden rounded-lg">
                <Image 
                  src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835873/africa-humanitarian-aid-doctor-taking-care-patient_cyowcy.jpg" 
                  alt="Partage sécurisé" 
                  width={400} 
                  height={300}
                  className="w-full h-48 object-cover" 
                />
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3">Partagez en toute sécurité</h3>
              <p className="text-gray-600">
                Partagez vos données avec votre médecin à l'aide de tokens sécurisés pour un suivi médical optimal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-16 md:py-24 bg-blue-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-lg shadow-lg">
                  <Image 
                    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835892/africa-humanitarian-aid-doctor-taking-care-patient_2_opxcpv.jpg" 
                    alt="Médecin et patient" 
                    width={300} 
                    height={300}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="overflow-hidden rounded-lg shadow-lg">
                  <Image 
                    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835886/africa-humanitarian-aid-doctor-taking-care-patient_3_syuphh.jpg" 
                    alt="Consultation médicale" 
                    width={300} 
                    height={300}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="overflow-hidden rounded-lg shadow-lg">
                  <Image 
                    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835880/africa-humanitarian-aid-doctor-taking-care-patient_1_ca9ffx.jpg" 
                    alt="Soins médicaux" 
                    width={300} 
                    height={300}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="overflow-hidden rounded-lg shadow-lg">
                  <Image 
                    src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1742835860/africa-humanitarian-aid-doctor-taking-care-patient_4_fqhd5p.jpg" 
                    alt="Suivi patient" 
                    width={300} 
                    height={300}
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
            </div>
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Une solution complète pour votre santé cardiovasculaire
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-blue-600 rounded-full p-1">
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-semibold text-gray-800">Conforme aux standards médicaux</h3>
                    <p className="mt-1 text-gray-600">Analyses basées sur les recommandations officielles de l'OMS pour l'interprétation de la tension artérielle.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-blue-600 rounded-full p-1">
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-semibold text-gray-800">Données sécurisées et privées</h3>
                    <p className="mt-1 text-gray-600">Vos informations sont stockées localement sur votre appareil et protégées par chiffrement.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-blue-600 rounded-full p-1">
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-semibold text-gray-800">Intelligence artificielle</h3>
                    <p className="mt-1 text-gray-600">Analyses avancées et tendances détectées grâce à notre système d'IA intégré.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button
                  className="bg-blue-700 hover:bg-blue-800 text-lg py-6 px-8 font-medium"
                  onClick={() => router.push("/auth")}
                >
                  Découvrir T-Cardio AI
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-gray-600 mb-4">
            T-Cardio AI est conforme aux recommandations officielles de l'OMS pour l'analyse de la tension artérielle.
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} T-Cardio AI - Tous droits réservés
          </p>
        </div>
      </footer>
    </main>
  );
}
