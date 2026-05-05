'use client';

import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import SSOCallbackContent from './sso-callback-content';

function SSOCallbackLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="border-slate-700 bg-slate-800">
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
          <p className="mt-4 text-slate-300">Processing authentication...</p>
        </div>
      </Card>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense fallback={<SSOCallbackLoading />}>
      <SSOCallbackContent />
    </Suspense>
  );
}
