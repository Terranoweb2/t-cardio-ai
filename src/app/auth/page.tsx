"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const router = useRouter();

  // Ces fonctions seront remplacées par de véritables appels d'API
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler une connexion réussie
    localStorage.setItem("user", JSON.stringify({
      id: "user-123",
      name: "Jean Dupont",
      email: "jean@example.com",
      role: "patient",
      doctor: {
        id: "doc-456",
        name: "Dr. Marie Martin",
        speciality: "Cardiologie"
      }
    }));
    router.push("/dashboard");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler une inscription réussie
    setActiveTab("login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-700">T-Cardio AI</CardTitle>
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
