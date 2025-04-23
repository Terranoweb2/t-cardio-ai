'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Mail, Share2, Phone, QrCode, Check, Clipboard } from 'lucide-react';
import sharingService from '@/services/sharing-service';
import type { MedicalReport } from '@/lib/types';
import Image from 'next/image';

interface ShareDialogProps {
  report: MedicalReport;
  userName: string;
  pdfBuffer?: Buffer;
}

export default function ShareDialog({ report, userName, pdfBuffer }: ShareDialogProps) {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{
    success: boolean;
    accessCode?: string;
    url?: string;
    whatsappLink?: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [shareMethod, setShareMethod] = useState<'email' | 'whatsapp' | 'link'>('email');

  const handleShareByEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast({
        title: 'Email invalide',
        description: 'Veuillez saisir une adresse email valide.',
        variant: 'destructive',
      });
      return;
    }

    setIsSharing(true);
    try {
      // Partager le rapport par email
      const result = await sharingService.shareReportByEmail(
        report,
        recipientEmail,
        userName,
        undefined, // Le service générera un code d'accès aléatoire
        pdfBuffer
      );

      setShareResult({
        success: result.success,
        accessCode: result.accessCode,
      });

      if (result.success) {
        toast({
          title: 'Rapport partagé',
          description: `Le rapport a été envoyé à ${recipientEmail} avec succès.`,
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du partage du rapport.',
        variant: 'destructive',
      });
      console.error('Erreur lors du partage:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareViaWhatsApp = () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast({
        title: 'Numéro invalide',
        description: 'Veuillez saisir un numéro de téléphone valide.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Générer un lien WhatsApp
      const result = sharingService.shareReportViaWhatsApp(
        report,
        phoneNumber,
        userName
      );

      setShareResult({
        success: result.success,
        accessCode: result.accessCode,
        whatsappLink: result.whatsappLink,
      });

      if (result.success) {
        // Ouvrir le lien WhatsApp dans une nouvelle fenêtre
        window.open(result.whatsappLink, '_blank');

        toast({
          title: 'Lien WhatsApp généré',
          description: 'Vous allez être redirigé vers WhatsApp pour envoyer le message.',
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération du lien WhatsApp.',
        variant: 'destructive',
      });
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleGenerateLink = () => {
    try {
      // Générer un lien de partage
      const { url, accessCode } = sharingService.generateSecureReportLink({ report });
      const qrCode = sharingService.generateQRCode(url, 4);

      setShareResult({
        success: true,
        accessCode,
        url,
      });

      setQrCodeUrl(qrCode);

      toast({
        title: 'Lien généré',
        description: 'Un lien sécurisé a été généré avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération du lien.',
        variant: 'destructive',
      });
      console.error('Erreur lors de la génération du lien:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied(true);
        toast({
          title: 'Copié !',
          description: 'Le texte a été copié dans le presse-papier.',
        });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Erreur lors de la copie:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de copier le texte.',
          variant: 'destructive',
        });
      }
    );
  };

  const resetForm = () => {
    setShareResult(null);
    setRecipientEmail('');
    setPhoneNumber('');
    setQrCodeUrl(null);
    setShareMethod('email');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager le rapport</DialogTitle>
          <DialogDescription>
            Envoyez ce rapport à un médecin ou à un proche de façon sécurisée.
          </DialogDescription>
        </DialogHeader>

        {shareResult?.success ? (
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-green-50 p-4 border border-green-100">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-green-800">
                  {shareMethod === 'email'
                    ? `Rapport envoyé à ${recipientEmail}`
                    : shareMethod === 'whatsapp'
                      ? 'Message WhatsApp créé'
                      : 'Lien de partage généré'}
                </h3>
              </div>

              {shareResult.accessCode && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-1">Code d'accès :</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 p-2 rounded-md font-mono font-medium text-center text-lg tracking-wider flex-grow">
                      {shareResult.accessCode}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => copyToClipboard(shareResult.accessCode!)}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Communiquez ce code au destinataire. Il en aura besoin pour accéder au rapport.
                  </p>
                </div>
              )}

              {shareResult.url && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700 mb-1">Lien du rapport :</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 p-2 rounded-md text-xs text-gray-800 overflow-x-auto flex-grow">
                      <code>{shareResult.url}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => copyToClipboard(shareResult.url!)}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {qrCodeUrl && (
                <div className="mt-4 flex justify-center">
                  <div className="bg-white p-3 rounded-md shadow-sm border">
                    <img src={qrCodeUrl} alt="QR Code" width={150} height={150} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Nouveau partage
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
              >
                Terminer
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="email" className="w-full" onValueChange={(value) => setShareMethod(value as any)}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-1">
                <Clipboard className="h-4 w-4" />
                Lien
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 pt-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Adresse email du destinataire
                </label>
                <Input
                  id="email"
                  placeholder="exemple@domaine.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  type="email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le destinataire recevra un email avec un lien sécurisé vers le rapport.
                </p>
              </div>

              <Button
                onClick={handleShareByEmail}
                disabled={isSharing || !recipientEmail}
                className="w-full"
              >
                {isSharing ? 'Envoi en cours...' : 'Envoyer par email'}
              </Button>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 pt-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Numéro de téléphone du destinataire
                </label>
                <Input
                  id="phone"
                  placeholder="+33 6 12 34 56 78"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  type="tel"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inclure l'indicatif du pays (ex: +33 pour la France).
                </p>
              </div>

              <Button
                onClick={handleShareViaWhatsApp}
                disabled={isSharing || !phoneNumber}
                className="w-full"
              >
                Partager via WhatsApp
              </Button>
            </TabsContent>

            <TabsContent value="link" className="space-y-4 pt-4">
              <div className="text-center space-y-3">
                <QrCode className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Générez un lien sécurisé et un QR code pour partager ce rapport.
                </p>
                <Button
                  onClick={handleGenerateLink}
                  disabled={isSharing}
                  className="mx-auto"
                >
                  Générer un lien
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="text-xs text-gray-500">
          Les rapports partagés sont protégés par un code d'accès et expirent après 72 heures.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
