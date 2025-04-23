import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "T-Cardio AI",
  description: "Application de suivi de santé cardiovasculaire avec analyse IA",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>

        {/* Script de gestion des notifications */}
        <Script
          id="notification-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Fonction pour vérifier et déclencher les notifications
              function checkAndSendNotifications() {
                try {
                  // Vérifier si les notifications sont activées
                  const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
                  if (!notificationsEnabled) return;

                  // Vérifier si le navigateur supporte les notifications
                  if (!('Notification' in window)) return;

                  // Vérifier si l'utilisateur a accepté les notifications
                  if (Notification.permission !== 'granted') return;

                  // Récupérer les rappels configurés
                  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
                  if (!reminders.length) return;

                  // Obtenir la date et l'heure actuelles
                  const now = new Date();
                  const currentDay = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][now.getDay()];
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();

                  // Vérifier chaque rappel
                  reminders.forEach(reminder => {
                    if (!reminder.enabled) return;

                    // Vérifier si le jour actuel est inclus dans les jours du rappel
                    if (!reminder.days.includes(currentDay)) return;

                    // Vérifier l'heure du rappel
                    const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number);

                    if (reminderHour === currentHour && reminderMinute === currentMinute) {
                      // C'est l'heure d'envoyer une notification!
                      const notification = new Notification('T-Cardio AI - Rappel', {
                        body: reminder.message,
                        icon: '/logo.png',
                        badge: '/logo.png'
                      });

                      // Gérer le clic sur la notification
                      notification.onclick = function() {
                        window.focus();
                        notification.close();
                        window.location.href = '/dashboard';
                      };
                    }
                  });
                } catch (error) {
                  console.error('Erreur lors de la vérification des notifications:', error);
                }
              }

              // Vérifier les notifications toutes les minutes
              setInterval(checkAndSendNotifications, 60000);

              // Vérifier aussi au chargement de la page (avec un délai pour laisser le temps de charger)
              setTimeout(checkAndSendNotifications, 5000);
            `,
          }}
        />
      </body>
    </html>
  );
}
