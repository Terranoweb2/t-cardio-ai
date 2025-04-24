/**
 * Service de partage sécurisé des rapports médicaux
 */
import CryptoJS from 'crypto-js';
import qrcode from 'qrcode-generator';
import type { MedicalReport } from '@/lib/types';
import emailjs from '@emailjs/browser';

interface EmailOptions {
  to: string;
  subject: string;
  content: string;
  pdfAttachment?: Buffer;
  filename?: string;
}

interface WhatsAppOptions {
  phoneNumber: string;
  message: string;
  reportUrl?: string;
}

interface SecureReportOptions {
  report: MedicalReport;
  accessCode?: string;
  expiresInHours?: number;
}

class SharingService {
  private encryptionKey: string;
  private emailJsServiceId: string = 'default_service';
  private emailJsTemplateId: string = 'template_report';
  private emailJsUserId: string = 'user_id'; // Vous devrez remplacer par votre ID utilisateur EmailJS

  constructor() {
    // Récupération des variables d'environnement
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    
    // Initialiser EmailJS si des variables d'environnement sont disponibles
    if (process.env.EMAILJS_SERVICE_ID) {
      this.emailJsServiceId = process.env.EMAILJS_SERVICE_ID;
    }
    if (process.env.EMAILJS_TEMPLATE_ID) {
      this.emailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
    }
    if (process.env.EMAILJS_USER_ID) {
      this.emailJsUserId = process.env.EMAILJS_USER_ID;
    }

    // Initialiser EmailJS
    this.initEmailService();
  }

  private initEmailService() {
    // Initialiser EmailJS pour l'envoi client-side
    if (typeof window !== 'undefined') {
      // Pas besoin d'initialiser si nous n'avons pas d'ID utilisateur valide
      if (this.emailJsUserId !== 'user_id') {
        emailjs.init(this.emailJsUserId);
        console.log("EmailJS initialized successfully");
      } else {
        console.warn("EmailJS not initialized: missing user ID");
      }
    }
  }

  /**
   * Chiffrer les données d'un rapport pour un partage sécurisé
   */
  encryptReport(data: string, accessCode?: string): string {
    // Si un code d'accès est fourni, l'utiliser comme sel pour le chiffrement
    const encryptionKeyWithSalt = accessCode
      ? `${this.encryptionKey}-${accessCode}`
      : this.encryptionKey;

    return CryptoJS.AES.encrypt(data, encryptionKeyWithSalt).toString();
  }

  /**
   * Déchiffrer les données d'un rapport
   */
  decryptReport(encryptedData: string, accessCode?: string): string {
    const encryptionKeyWithSalt = accessCode
      ? `${this.encryptionKey}-${accessCode}`
      : this.encryptionKey;

    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKeyWithSalt);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Générer un lien sécurisé pour partager un rapport
   */
  generateSecureReportLink(options: SecureReportOptions): { url: string; accessCode: string } {
    const { report, accessCode, expiresInHours = 72 } = options;

    // Générer un code d'accès aléatoire si non fourni
    const generatedAccessCode = accessCode || this.generateAccessCode();

    // Configurer l'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Données à inclure dans le lien
    const reportData = {
      id: report.id,
      title: report.title,
      expiresAt: expiresAt.toISOString(),
      content: report.content,
      createdAt: report.createdAt,
    };

    // Chiffrer les données avec le code d'accès
    const encryptedData = this.encryptReport(JSON.stringify(reportData), generatedAccessCode);

    // URL de base de l'application
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://t-cardio-ai.netlify.app';

    // Construire l'URL avec les données chiffrées
    const url = `${baseUrl}/shared-report?data=${encodeURIComponent(encryptedData)}`;

    return { url, accessCode: generatedAccessCode };
  }

  /**
   * Générer un code QR pour un lien de rapport
   */
  generateQRCode(url: string, size = 5): string {
    const qr = qrcode(0, 'L');
    qr.addData(url);
    qr.make();
    return qr.createDataURL(size, 0);
  }

  /**
   * Générer un code d'accès aléatoire
   */
  private generateAccessCode(length = 6): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  /**
   * Partager un rapport par email
   */
  async shareReportByEmail(
    report: MedicalReport,
    recipientEmail: string,
    senderName: string,
    accessCode?: string,
    pdfAttachment?: Buffer
  ): Promise<{ success: boolean; message: string; accessCode?: string }> {
    try {
      const { url, accessCode: generatedAccessCode } = this.generateSecureReportLink({
        report,
        accessCode
      });

      // Si EmailJS n'est pas configuré, simuler l'envoi
      if (this.emailJsUserId === 'user_id' || typeof window === 'undefined') {
        console.log("[DEV] Envoi d'email à", recipientEmail, "avec le rapport:", report.title);
        
        return {
          success: true,
          message: `Email simulé envoyé à ${recipientEmail}. Lien: ${url}`,
          accessCode: generatedAccessCode
        };
      }

      // Préparer les données pour le template EmailJS
      const templateParams = {
        to_email: recipientEmail,
        from_name: senderName,
        report_title: report.title,
        report_url: url,
        access_code: generatedAccessCode,
        report_date: new Date(report.createdAt).toLocaleDateString(),
        message: `${senderName} a partagé un rapport médical avec vous via T-Cardio AI.`,
      };

      // Envoyer l'email via EmailJS
      const response = await emailjs.send(
        this.emailJsServiceId,
        this.emailJsTemplateId,
        templateParams,
        this.emailJsUserId
      );

      console.log('Email envoyé avec succès:', response);

      return {
        success: true,
        message: `Email envoyé à ${recipientEmail} avec succès.`,
        accessCode: generatedAccessCode
      };
    } catch (error) {
      console.error('Erreur lors du partage du rapport par email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors du partage'
      };
    }
  }

  /**
   * Partager un rapport via WhatsApp
   */
  shareReportViaWhatsApp(
    report: MedicalReport,
    phoneNumber: string,
    senderName: string,
    accessCode?: string
  ): { success: boolean; message: string; whatsappLink: string; accessCode?: string } {
    try {
      // Générer un lien sécurisé avec un code d'accès
      const { url, accessCode: generatedAccessCode } = this.generateSecureReportLink({
        report,
        accessCode
      });

      // Construire le message WhatsApp
      const message = `${senderName} a partagé un rapport médical de T-Cardio-AI avec vous:\n\n*${report.title}*\nDate: ${new Date(report.createdAt).toLocaleDateString()}\n\nAccédez au rapport via ce lien: ${url}\n\nCode d'accès: *${generatedAccessCode}*\n\nCe lien expirera dans 72 heures pour des raisons de sécurité.`;

      // Formatter le numéro de téléphone (enlever les espaces et ajouter le "+" si nécessaire)
      const formattedNumber = phoneNumber.replace(/\s+/g, '');
      const whatsappNumber = formattedNumber.startsWith('+') ? formattedNumber.substring(1) : formattedNumber;

      // Créer le lien WhatsApp
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      return {
        success: true,
        message: 'Lien WhatsApp généré avec succès',
        whatsappLink,
        accessCode: generatedAccessCode
      };
    } catch (error) {
      console.error('Erreur lors de la génération du lien WhatsApp:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur est survenue',
        whatsappLink: ''
      };
    }
  }

  /**
   * Envoyer un email (implémentation réelle ou simulée)
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    // Simulation en environnement de développement ou client-side
    console.log("[DEV] Email envoyé:", options);
    return;
  }
}

// Créer une instance singleton du service
const sharingService = new SharingService();
export default sharingService;
