import type { CSSProperties } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sagp-login-page sagp-app px-4">
      <div className="sagp-matrix-rain" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => (
          <span
            key={index}
            style={{
              '--matrix-left': `${index * 3.75 - 2}%`,
              '--matrix-delay': `${index * -0.48}s`,
            } as CSSProperties}
          >
            0101101010010110
          </span>
        ))}
      </div>
      <div className="sagp-radial-center" />
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
