"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "./button";

interface LogoutButtonProps extends ButtonProps {
  displayText?: boolean;
  className?: string;
}

/**
 * Bouton de déconnexion pour T-Cardio AI
 * Peut être utilisé avec ou sans texte, dans différentes tailles
 */
export function LogoutButton({ 
  displayText = true, 
  className = "", 
  ...props 
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Afficher un message dans la console pour confirmer la déconnexion
    console.log('Déconnexion en cours...');
    
    // Supprimer les informations utilisateur du localStorage
    localStorage.removeItem("user");
    
    // Supprimer toutes les autres données de session si nécessaire
    sessionStorage.clear();
    
    // Rediriger vers la page d'authentification
    router.push("/auth");
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className={`text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ${className}`}
      {...props}
    >
      <LogOut className="h-4 w-4" />
      {displayText && <span className="ml-2">Déconnexion</span>}
    </Button>
  );
}
