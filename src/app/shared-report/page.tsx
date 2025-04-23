'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Lock, FileText, Calendar, CheckCircle, Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import sharingService from '@/services/sharing-service';
import Link from 'next/link';

interface SharedReportData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  expiresAt: string;
}

export default function SharedReportPage() {
  const { toast } = useToast();
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [encryptedData, setEncryptedData] = useState<string | null>(null);

  // Only use this hook after component mount to avoid SSG issues
  useEffect(() => {
    // Get search params only on client-side to avoid SSG issues
    const searchParams = new URLSearchParams(window.location.search);
    const data = searchParams.get('data');

    if (data) {
      setEncryptedData(data);
    } else {
      toast({
        title: 'Lien invalide',
        description: 'Le lien que vous avez suivi ne contient pas de données valides.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const verifyAccessCode = () => {
    if (!encryptedData) return;

    setIsVerifying(true);

    try {
      // Tenter de déchiffrer avec le code d'accès fourni
      const decryptedData = sharingService.decryptReport(encryptedData, accessCode);
      const data = JSON.parse(decryptedData) as SharedReportData;

      // Vérifier si le rapport a expiré
      const expirationDate = new Date(data.expiresAt);
      const now = new Date();

      if (now > expirationDate) {
        setIsExpired(true);
        toast({
          title: 'Rapport expiré',
          description: 'Ce rapport a expiré et n\'est plus accessible.',
          variant: 'destructive',
        });
      } else {
        setReportData(data);
        toast({
          title: 'Accès autorisé',
          description: 'Le code d\'accès est correct. Rapport déverrouillé.',
        });
      }
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      toast({
        title: 'Code d\'accès incorrect',
        description: 'Veuillez vérifier le code d\'accès et réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadAsPDF = () => {
    if (!reportData) return;

    // Dans une implémentation réelle, cette fonction génèrerait un PDF à partir du contenu
    // Pour cette démo, nous simulons un téléchargement
    toast({
      title: 'Téléchargement du PDF',
      description: 'Cette fonctionnalité serait implémentée dans une version de production.',
    });
  };

  // Formater la date de création
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isExpired) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 text-red-700">
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Rapport expiré
            </CardTitle>
            <CardDescription className="text-red-600">
              Ce rapport n'est plus accessible car il a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-4">
              Pour des raisons de sécurité, les rapports partagés expirent après 72 heures.
            </p>
            <p className="text-gray-600">
              Contactez l'expéditeur si vous avez besoin d'accéder à nouveau à ce rapport.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/" passHref legacyBehavior>
              <Button as="a" variant="outline" className="w-full">
                Retour à l'accueil
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex justify-center items-center">
              <Lock className="mr-2 h-5 w-5 text-blue-600" />
              Rapport sécurisé
            </CardTitle>
            <CardDescription>
              Veuillez saisir le code d'accès pour consulter ce rapport.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium mb-1">
                  Code d'accès
                </label>
                <Input
                  id="accessCode"
                  placeholder="Saisissez le code (ex: A12B3C)"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="text-center text-lg tracking-wider"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ce code vous a été fourni par la personne qui a partagé ce rapport.
                </p>
              </div>
              <Button
                onClick={verifyAccessCode}
                disabled={isVerifying || !accessCode || accessCode.length < 4}
                className="w-full"
              >
                {isVerifying ? 'Vérification...' : 'Accéder au rapport'}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-xs text-gray-500 text-center">
              Les rapports médicaux partagés sont chiffrés et protégés par un code d'accès.
              <br />Ils expirent automatiquement après 72 heures.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              {reportData.title}
            </CardTitle>
            <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
              <CheckCircle className="mr-1 h-4 w-4" />
              Vérifié
            </span>
          </div>
          <CardDescription className="flex items-center mt-2">
            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
            Rapport généré le {formatDate(reportData.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: reportData.content }} />
          </div>
        </CardContent>
        <CardFooter className="border-t flex justify-between pt-6">
          <p className="text-xs text-gray-500">
            Ce rapport est accessible jusqu'au {formatDate(reportData.expiresAt)}
          </p>
          <Button onClick={downloadAsPDF} variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Télécharger en PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
