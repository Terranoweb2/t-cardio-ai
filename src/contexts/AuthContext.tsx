import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, authLocalStorageService, UserProfile } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (displayName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Charger l'utilisateur au démarrage depuis le localStorage
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const storedToken = authLocalStorageService.getToken();
        
        if (storedToken) {
          setToken(storedToken);
          
          // Tenter de récupérer les données utilisateur du serveur
          const { status, data, error } = await authService.getCurrentUser(storedToken);
          
          if (status === 200) {
            setUser(data);
            authLocalStorageService.setUser(data);
          } else {
            // Si le token est invalide, déconnecter l'utilisateur
            console.error("Erreur lors de la récupération de l'utilisateur:", error);
            authLocalStorageService.logout();
            setToken(null);
            setUser(null);
          }
        } else {
          // Fallback au localStorage si pas de token 
          // (pour la transition vers l'API)
          const storedUser = authLocalStorageService.getUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation de l'authentification:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { status, data, error } = await authService.login({ email, password });

      if (status === 200 && data.token && data.user) {
        // Sauvegarder dans le localStorage
        authLocalStorageService.setToken(data.token);
        authLocalStorageService.setUser(data.user);
        
        // Mettre à jour l'état
        setToken(data.token);
        setUser(data.user);
        
        return true;
      } else {
        setError(error || "Échec de connexion. Veuillez vérifier vos identifiants.");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de la connexion.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (displayName: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { status, data, error } = await authService.register({ 
        displayName, 
        email, 
        password 
      });

      if (status === 201 && data.token && data.user) {
        // Sauvegarder dans le localStorage
        authLocalStorageService.setToken(data.token);
        authLocalStorageService.setUser(data.user);
        
        // Mettre à jour l'état
        setToken(data.token);
        setUser(data.user);
        
        return true;
      } else {
        setError(error || "Échec d'inscription. Veuillez réessayer.");
        return false;
      }
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de l'inscription.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    authLocalStorageService.logout();
    setUser(null);
    setToken(null);
    router.push('/');
  };

  // Fonction de mise à jour de l'utilisateur
  const updateUser = (userData: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      authLocalStorageService.setUser(updatedUser);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
