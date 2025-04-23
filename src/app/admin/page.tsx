"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Trash2, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clearLocalStorageData } from "@/utils/clear-data";
import Link from "next/link";

export default function AdminPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessages, setStatusMessages] = useState<{message: string, type: 'success' | 'error' | 'info'}[]>([]);

  const clearClientData = () => {
    try {
      setIsLoading(true);
      addStatusMessage("Début du nettoyage des données client...", "info");
      
      clearLocalStorageData();
      
      addStatusMessage("✅ Toutes les données client ont été effacées", "success");
      toast({
        title: "Données effacées",
        description: "Toutes les données du localStorage ont été supprimées avec succès",
      });
    } catch (error) {
      addStatusMessage(`❌ Erreur lors de l'effacement des données client: ${error}`, "error");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearServerData = async () => {
    try {
      setIsLoading(true);
      addStatusMessage("Début du nettoyage des données serveur...", "info");
      
      const response = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }
      
      addStatusMessage("✅ Toutes les données serveur ont été effacées", "success");
      toast({
        title: "Données effacées",
        description: "Toutes les données de la base de données ont été supprimées avec succès",
      });
    } catch (error: any) {
      addStatusMessage(`❌ Erreur lors de l'effacement des données serveur: ${error.message}`, "error");
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = async () => {
    try {
      setIsLoading(true);
      addStatusMessage("Début du nettoyage de toutes les données...", "info");
      
      // Nettoyer le client d'abord
      clearLocalStorageData();
      addStatusMessage("✅ Données client effacées", "success");
      
      // Puis nettoyer le serveur
      const response = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }
      
      addStatusMessage("✅ Données serveur effacées", "success");
      toast({
        title: "Toutes les données effacées",
        description: "Les données client et serveur ont été supprimées avec succès",
      });
    } catch (error: any) {
      addStatusMessage(`❌ Erreur: ${error.message}`, "error");
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression des données",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addStatusMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setStatusMessages(prev => [...prev, { message, type }]);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Administration T-Cardio AI</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Nettoyage des données
            </CardTitle>
            <CardDescription>
              Supprimez toutes les données de test de l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm">
              Attention : cette action est irréversible. Utilisez ces options uniquement si vous souhaitez 
              supprimer définitivement toutes les données de test de l'application.
            </p>
            <div className="space-y-4">
              <Button 
                variant="outline"
                onClick={clearClientData}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                Effacer les données client (localStorage)
              </Button>
              
              <Button 
                variant="outline"
                onClick={clearServerData}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <Database className="mr-2 h-4 w-4 text-red-500" />
                Effacer les données serveur (base de données)
              </Button>
              
              <Button 
                variant="destructive"
                onClick={clearAllData}
                disabled={isLoading}
                className="w-full justify-start"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Effacer toutes les données (client + serveur)
              </Button>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              Retour au tableau de bord
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Journal d'activité</CardTitle>
            <CardDescription>
              Suivi des opérations de nettoyage des données
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusMessages.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune activité pour le moment</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {statusMessages.map((status, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-md text-sm flex items-start ${
                      status.type === 'success' ? 'bg-green-50 text-green-700' : 
                      status.type === 'error' ? 'bg-red-50 text-red-700' : 
                      'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /> : 
                     status.type === 'error' ? <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /> :
                     <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />}
                    <span>{status.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
