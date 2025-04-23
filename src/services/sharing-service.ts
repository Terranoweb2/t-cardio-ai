/**
 * Service de partage sécurisé des rapports médicaux
 */
// Comment out nodemailer for client-side compatibility
// import nodemailer from 'nodemailer';
import CryptoJS from 'crypto-js';
import qrcode from 'qrcode-generator';
import type { MedicalReport } from '@/lib/types';

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
  // private emailTransporter: nodemailer.Transporter | null = null;
  private emailTransporter: any = null;
  private encryptionKey: string;

  constructor() {
    // Récupération des variables d'environnement
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    // this.initEmailTransporter();
  }

  private initEmailTransporter() {
    // This method is for server-side use only
    // For client-side static export, we'll just simulate email sending
    console.log("Email transporter initialization skipped for client-side compatibility");
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
      // Simulation du partage en environnement de développement ou client-side
      console.log("[DEV] Envoi d'email à", recipientEmail, "avec le rapport:", report.title);
      const { url, accessCode: generatedAccessCode } = this.generateSecureReportLink({
        report,
        accessCode
      });

      return {
        success: true,
        message: `Email simulé envoyé à ${recipientEmail}. Lien: ${url}`,
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
