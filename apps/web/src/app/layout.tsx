import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { NotificationLoader } from '@/components/shared/NotificationLoader';

// next/font avec police locale — jamais d'import Google Fonts externe (règle projet)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Whatsell — Dashboard Vendeur',
  description: "Gérez vos ventes WhatsApp avec l'agent IA Whatsell",
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-background text-text-primary antialiased">
        {children}
        <Toaster />
        <NotificationLoader />
      </body>
    </html>
  );
}
