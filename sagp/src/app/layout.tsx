import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { ToastProvider } from '@/components/ui/toast';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAGP - Security Awareness Gamification Platform',
  description:
    'A comprehensive security awareness training platform with gamification, phishing simulations, and real-time analytics',
  keywords: [
    'security',
    'awareness',
    'training',
    'phishing',
    'gamification',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="sagp-body sagp-scanlines sagp-cyber-grid antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
