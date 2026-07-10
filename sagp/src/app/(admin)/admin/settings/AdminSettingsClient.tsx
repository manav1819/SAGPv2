'use client';

import { useState } from 'react';
import { Settings, Copy, Check } from 'lucide-react';

interface Props {
  orgName: string;
  joinCode: string;
}

export function AdminSettingsClient({ orgName, joinCode }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permissions can fail silently — non-critical
    }
  };

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6 max-w-2xl">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <Settings className="h-7 w-7 sagp-text-primary" />
        Settings
      </h1>

      {/* Organisation join code */}
      <div className="sagp-card p-5 space-y-4">
        <h2 className="sagp-heading-3">Organisation Join Code</h2>
        <p className="sagp-text-muted text-sm">
          Share this code with employees so they can register and join {orgName || 'your organisation'}.
        </p>
        <div className="flex items-center gap-3">
          <input
            readOnly
            value={joinCode || 'Unavailable'}
            className="sagp-input flex-1 font-mono tracking-widest cursor-default"
          />
          <button onClick={copyCode} className="sagp-btn sagp-btn-secondary flex items-center gap-2" disabled={!joinCode}>
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* SSO config placeholder */}
      <div className="sagp-card p-5 space-y-4">
        <h2 className="sagp-heading-3">SSO Configuration</h2>
        <p className="sagp-text-muted text-sm">
          Configure SAML or OAuth SSO for your organisation. Contact support to enable enterprise SSO.
        </p>
        <button className="sagp-btn sagp-btn-secondary" disabled>
          Configure SSO
        </button>
      </div>
    </div>
  );
}
