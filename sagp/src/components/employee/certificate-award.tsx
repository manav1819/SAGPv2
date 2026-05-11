'use client';

import type { CSSProperties } from 'react';
import { Award, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CertificateAwardProps {
  learnerName: string;
  moduleTitle: string;
  completedAt?: string;
  score?: number | null;
  showConfetti?: boolean;
}

export function CertificateAward({
  learnerName,
  moduleTitle,
  completedAt,
  score,
  showConfetti = false,
}: CertificateAwardProps) {
  const completionDate = completedAt
    ? new Date(completedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative overflow-hidden rounded-sm border border-cyan-300/25 bg-black/30 p-6 shadow-[0_0_34px_rgba(0,245,255,0.16)]">
      {showConfetti && (
        <div className="sagp-confetti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} style={{ '--i': index } as CSSProperties} />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-sm border border-cyan-300/35 bg-cyan-300/10 text-cyan-300">
          <Award className="h-9 w-9" />
        </div>
        <p className="sagp-badge mx-auto mb-4 w-fit sagp-badge-green">Certificate Earned</p>
        <h2 className="font-heading text-3xl font-black text-white sagp-neon-text">
          Certificate of Completion
        </h2>
        <p className="mt-4 text-sm sagp-text-muted">Awarded to</p>
        <p className="mt-1 font-heading text-2xl font-bold text-white">{learnerName}</p>
        <p className="mt-4 text-sm sagp-text-muted">for completing</p>
        <p className="mt-1 text-lg font-semibold sagp-text-cyan">{moduleTitle}</p>
        {typeof score === 'number' && (
          <p className="mt-4 text-sm sagp-text-muted">
            Final score <span className="font-bold sagp-text-green">{score}</span>
          </p>
        )}
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] sagp-text-soft">
          Issued {completionDate}
        </p>
        <Button onClick={handlePrint} variant="secondary" className="mt-6">
          <Download className="h-4 w-4" />
          Print Certificate
        </Button>
      </div>
    </div>
  );
}
