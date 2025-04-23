"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Copy,
  Link,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle,
  Users,
  UserRoundX,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Types
interface SharedToken {
  id: string;
  name: string;
  token: string;
  recipientEmail?: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  notes: string;
  active: boolean;
}

interface IncomingShare {
  id: string;
  token: string;
  senderName: string;
  senderEmail: string;
  createdAt: Date | string;
  accepted: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor";
}

export default function SharePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<SharedToken[]>([]);
  const [incomingShares, setIncomingShares] = useState<IncomingShare[]>([]);
  const [newTokenName, setNewTokenName] = useState<string>("");
  const [newTokenEmail, setNewTokenEmail] = useState<string>("");
  const [newTokenNotes, setNewTokenNotes] = useState<string>("");
  const [newTokenExpiration, setNewTokenExpiration] = useState<string>("7");
  const [isNewTokenDialogOpen, setIsNewTokenDialogOpen] = useState<boolean>(false);
  const [isProcessingToken, setIsProcessingToken] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as UserProfile);
      } catch (e) {
        setUser(null);
      }
    }
    const storedTokens = localStorage.getItem("sharedTokens");
    if (storedTokens) {
      try {
        setTokens(JSON.parse(storedTokens));
      } catch (e) {
        setTokens([]);
      }
    }
    const storedIncomingShares = localStorage.getItem("incomingShares");
    if (storedIncomingShares) {
      try {
        setIncomingShares(JSON.parse(storedIncomingShares));
      } catch (e) {
        setIncomingShares([]);
      }
    }
  }, []);

  const createNewToken = () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez donner un nom à ce partage.",
        variant: "destructive",
      });
      return;
    }

    const tokenValue = uuidv4();
    const expirationDays = Number.parseInt(newTokenExpiration) || 7;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    const newToken: SharedToken = {
      id: uuidv4(),
      name: newTokenName,
      token: tokenValue,
      recipientEmail: newTokenEmail || undefined,
      createdAt: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(),
      notes: newTokenNotes,
      active: true,
    };

    const updatedTokens = [...tokens, newToken];
    setTokens(updatedTokens);
    localStorage.setItem("sharedTokens", JSON.stringify(updatedTokens));

    setNewTokenName("");
    setNewTokenEmail("");
    setNewTokenNotes("");
    setNewTokenExpiration("7");
    setIsNewTokenDialogOpen(false);

    toast({
      title: "Token créé",
      description: "Le token de partage a été créé avec succès.",
    });
  };

  const deactivateToken = (id: string) => {
    const updatedTokens = tokens.map((token) =>
      token.id === id ? { ...token, active: false } : token
    );

    setTokens(updatedTokens);
    localStorage.setItem("sharedTokens", JSON.stringify(updatedTokens));

    toast({
      title: "Token désactivé",
      description: "Le token de partage n'est plus actif.",
    });
  };

  const copyTokenToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copié !",
      description: "Le token a été copié dans le presse-papier.",
    });
  };

  const processIncomingToken = () => {
    if (!manualTokenInput.trim()) {
      toast({
        title: "Token requis",
        description: "Veuillez entrer un token de partage.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingToken(true);

    setTimeout(() => {
      const newIncomingShare: IncomingShare = {
        id: uuidv4(),
        token: manualTokenInput,
        senderName: "Dr. Marie Martin",
        senderEmail: "dr.martin@exemple.com",
        createdAt: new Date().toISOString(),
        accepted: false,
      };

      const updatedIncomingShares = [...incomingShares, newIncomingShare];
      setIncomingShares(updatedIncomingShares);
      localStorage.setItem("incomingShares", JSON.stringify(updatedIncomingShares));

      setManualTokenInput("");
      setIsProcessingToken(false);

      toast({
        title: "Partage accepté",
        description: "Le token a été vérifié et ajouté à vos partages entrants.",
      });
    }, 1500);
  };

  const acceptIncomingShare = (id: string) => {
    const updatedIncomingShares = incomingShares.map((share) =>
      share.id === id ? { ...share, accepted: true } : share
    );

    setIncomingShares(updatedIncomingShares);
    localStorage.setItem("incomingShares", JSON.stringify(updatedIncomingShares));

    toast({
      title: "Partage accepté",
      description:
        "Vous avez accepté de partager vos données avec ce professionnel de santé.",
    });
  };

  const rejectIncomingShare = (id: string) => {
    const updatedIncomingShares = incomingShares.filter((share) => share.id !== id);

    setIncomingShares(updatedIncomingShares);
    localStorage.setItem("incomingShares", JSON.stringify(updatedIncomingShares));

    toast({
      title: "Partage refusé",
      description: "Le partage a été refusé et supprimé de votre liste.",
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  const isExpired = (expiresAt: Date | string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    return now > expiration;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Partage de données</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section des tokens créés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Share2 className="mr-2 h-5 w-5 text-blue-500" />
              Mes partages
            </CardTitle>
            <CardDescription>
              Créez et gérez les tokens de partage pour vos professionnels de santé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tokens.length > 0 ? (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className={`p-3 rounded-md border ${
                      !token.active || isExpired(token.expiresAt)
                        ? "bg-gray-50 opacity-70"
                        : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{token.name}</p>
                      {token.active && !isExpired(token.expiresAt) ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Actif
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                          {isExpired(token.expiresAt) ? "Expiré" : "Inactif"}
                        </span>
                      )}
                    </div>

                    {token.recipientEmail && (
                      <p className="text-xs text-gray-600 mb-1">
                        Destinataire : {token.recipientEmail}
                      </p>
                    )}

                    <p className="text-xs text-gray-600 mb-2">
                      Expire le {formatDate(token.expiresAt)}
                    </p>

                    {token.notes && (
                      <p className="text-xs text-gray-600 italic mb-2 border-l-2 border-gray-300 pl-2">
                        {token.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTokenToClipboard(token.token)}
                          disabled={!token.active || isExpired(token.expiresAt)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copier
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={true}
                          className="text-blue-600"
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Envoyer
                        </Button>
                      </div>

                      {token.active && !isExpired(token.expiresAt) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateToken(token.id)}
                          className="text-red-600"
                        >
                          <UserRoundX className="h-4 w-4 mr-1" />
                          Désactiver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">Aucun token de partage créé</p>
                <p className="text-gray-400 text-sm mb-4">
                  Créez un token pour partager vos données avec un professionnel de santé
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Dialog open={isNewTokenDialogOpen} onOpenChange={setIsNewTokenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouveau token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un token de partage</DialogTitle>
                  <DialogDescription>
                    Ce token permettra à un professionnel de santé d'accéder à vos données de tension artérielle.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="token-name" className="text-sm font-medium">
                      Nom du partage
                    </label>
                    <Input
                      id="token-name"
                      placeholder="Ex: Dr. Martin - Suivi tension"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="token-email" className="text-sm font-medium">
                      Email du destinataire (optionnel)
                    </label>
                    <Input
                      id="token-email"
                      type="email"
                      placeholder="docteur@exemple.com"
                      value={newTokenEmail}
                      onChange={(e) => setNewTokenEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="token-expiration" className="text-sm font-medium">
                      Durée de validité (jours)
                    </label>
                    <Input
                      id="token-expiration"
                      type="number"
                      placeholder="7"
                      min="1"
                      max="365"
                      value={newTokenExpiration}
                      onChange={(e) => setNewTokenExpiration(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="token-notes" className="text-sm font-medium">
                      Notes (optionnel)
                    </label>
                    <Textarea
                      id="token-notes"
                      placeholder="Ajoutez des détails sur ce partage..."
                      value={newTokenNotes}
                      onChange={(e) => setNewTokenNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewTokenDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={createNewToken}>
                    Créer le token
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* Section des partages entrants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Partages reçus
            </CardTitle>
            <CardDescription>
              Accédez aux données partagées par vos professionnels de santé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomingShares.length > 0 ? (
              <div className="space-y-3">
                {incomingShares.map((share) => (
                  <div
                    key={share.id}
                    className={`p-3 rounded-md border ${
                      share.accepted ? "bg-green-50" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{share.senderName}</p>
                      {share.accepted ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3 inline-block mr-1" />
                          Accepté
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          En attente
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-2">
                      {share.senderEmail}
                    </p>

                    <p className="text-xs text-gray-600 mb-2">
                      Reçu le {formatDate(share.createdAt)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {share.accepted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir les données
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => acceptIncomingShare(share.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accepter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectIncomingShare(share.id)}
                            className="text-red-600"
                          >
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">Aucun partage reçu</p>
                <p className="text-gray-400 text-sm mb-4">
                  Entrez un token de partage pour recevoir des données
                </p>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-2">Ajouter un partage manuellement</p>
              <div className="flex space-x-2">
                <Input
                  placeholder="Entrez un token de partage"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={processIncomingToken}
                  disabled={isProcessingToken}
                >
                  {isProcessingToken ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Ajouter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
