import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operation Human Firewall | SAGP',
  description: 'Immersive social engineering phone simulator — defend against vishing attacks in real time.',
};

export default function HumanFirewallLayout({ children }: { children: React.ReactNode }) {
  // Full-screen game layout — no sidebar, no nav wrapper
  return <>{children}</>;
}
