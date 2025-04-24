"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const router = useRouter();

  // Fonction d'authentification en mode production
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Récupérer les valeurs des champs (à implémenter avec useState)
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
      // Afficher une erreur
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      // En production, remplacer ceci par un véritable appel d'API
      // Créer un utilisateur temporaire avec UUID aléatoire et sans données fictives
      const userId = crypto.randomUUID();
      
      localStorage.setItem("user", JSON.stringify({
        id: userId,
        name: 'Utilisateur',
        email: email,
        role: "patient",
        createdAt: new Date().toISOString()
      }));
      
      router.push("/dashboard");
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      alert('Erreur lors de la connexion');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Récupérer les valeurs des champs (à implémenter avec useState)
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    
    if (!nameInput || !emailInput || !passwordInput) return;
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!name || !email || !password) {
      // Afficher une erreur
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      // En production, remplacer ceci par un véritable appel d'API
      // Pour l'instant, simplement rediriger vers le login
      setActiveTab("login");
      alert('Compte créé avec succès. Veuillez vous connecter.');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      alert('Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="T-Cardio AI Logo" width={40} height={40} className="mr-3" />
            <CardTitle className="text-2xl font-bold text-blue-700">T-Cardio AI</CardTitle>
          </div>
          <CardDescription>
            Votre assistant de suivi cardiaque intelligent
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <CardContent className="pt-6">
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Input
                      id="email"
                      placeholder="Email"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      id="password"
                      placeholder="Mot de passe"
                      type="password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800">
                    Se connecter
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Input
                      id="name"
                      placeholder="Nom complet"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      id="email"
                      placeholder="Email"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      id="password"
                      placeholder="Mot de passe"
                      type="password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Input id="role-patient" type="radio" name="role" value="patient" className="h-4 w-4" defaultChecked />
                      <label htmlFor="role-patient">Patient</label>
                      <Input id="role-doctor" type="radio" name="role" value="doctor" className="h-4 w-4 ml-4" />
                      <label htmlFor="role-doctor">Médecin</label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800">
                    S'inscrire
                  </Button>
                </div>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
