import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { ToastProvider } from '@/components/ui/toast';
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
      <body
        className="antialiased bg-slate-900 text-slate-50"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
