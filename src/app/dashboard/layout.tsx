"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Heart, User, BarChart3, Share2, FileText } from "lucide-react";

// Définir l'interface pour l'utilisateur
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor";
  doctor?: {
    id: string;
    name: string;
    speciality: string;
    phone?: string;
    email?: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    setUser(JSON.parse(storedUser) as UserProfile);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/auth");
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  const navItems = [
    { label: "Saisie", href: "/dashboard", icon: <Heart className="mr-2 h-4 w-4" /> },
    { label: "Historique", href: "/dashboard/history", icon: <BarChart3 className="mr-2 h-4 w-4" /> },
    { label: "Partage", href: "/dashboard/share", icon: <Share2 className="mr-2 h-4 w-4" /> },
    { label: "Rapports", href: "/dashboard/reports", icon: <FileText className="mr-2 h-4 w-4" /> },
    { label: "Profil", href: "/dashboard/profile", icon: <User className="mr-2 h-4 w-4" /> },
  ];

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-64 md:bg-card md:border-r border-border">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center h-20 border-b border-border bg-card">
              {/* Logo area with animation */}
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="T-Cardio AI Logo"
                  className="h-12 w-12 object-contain mr-3 logo-heartbeat"
                  loading="lazy"
                />
                <span className="text-2xl font-bold text-primary logo-animation">T-Cardio AI</span>
              </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
              <nav className="space-y-1 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-muted hover:text-primary transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex flex-col w-full">
          <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-border bg-card md:hidden">
            <Link href="/dashboard" className="flex items-center">
              <img
                src="/logo.png"
                alt="T-Cardio AI Logo"
                className="h-9 w-9 object-contain mr-2 logo-heartbeat"
                loading="lazy"
              />
              <span className="text-xl font-bold text-primary logo-animation">T-Cardio AI</span>
            </Link>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center cursor-pointer">
                        {item.icon}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">{children}</main>
        </div>
      </div>
    </>
  );
}
