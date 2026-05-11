'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Building, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface OrgOption {
  id: string;
  name: string;
  domain: string | null;
}

const DEPARTMENTS = [
  'Engineering', 'Finance', 'HR', 'Operations',
  'Sales', 'Marketing', 'Legal', 'Other',
];

export default function CompleteProfilePage() {
  const router    = useRouter();
  const { toast } = useToast();
  const supabase  = createClient();

  const [orgs, setOrgs]               = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [userEmail, setUserEmail]     = useState('');

  const [formData, setFormData] = useState({
    orgId:      '',
    joinCode:   '',
    department: 'Engineering',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  // Guard: if user isn't logged in, send them to login
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUserEmail(data.user.email ?? '');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch organisations for the dropdown
  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.json())
      .then(d => setOrgs(d.organizations ?? []))
      .catch(() => toast({ title: 'Could not load organisations', variant: 'destructive' }))
      .finally(() => setOrgsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrg = orgs.find(o => o.id === formData.orgId) ?? null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.orgId)           e.orgId    = 'Please select your organisation';
    if (!formData.joinCode.trim()) e.joinCode = 'Join code required';

    // Client-side domain hint
    if (selectedOrg?.domain && userEmail.includes('@')) {
      const emailDomain = userEmail.split('@')[1] ?? '';
      const orgDomain   = selectedOrg.domain.replace(/^@/, '').toLowerCase();
      if (emailDomain.toLowerCase() !== orgDomain) {
        e.orgId = `Your Google account uses @${emailDomain}, but this org requires @${orgDomain}`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orgId:      formData.orgId,
          joinCode:   formData.joinCode,
          department: formData.department,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INVALID_JOIN_CODE') {
          setErrors(prev => ({ ...prev, joinCode: data.message }));
        } else if (data.code === 'DOMAIN_MISMATCH') {
          setErrors(prev => ({ ...prev, orgId: data.message }));
        } else {
          toast({ title: 'Error', description: data.message || 'Could not save profile', variant: 'destructive' });
        }
        return;
      }

      toast({ title: 'Profile complete!', description: 'Welcome to SAGP.' });
      router.push('/dashboard');
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800 shadow-2xl">
          <div className="p-8">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-teal-400 to-teal-600">
                <span className="text-lg font-bold text-white">🛡️</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-white">SAGP</h1>
            </div>

            <h2 className="mb-1 text-center text-2xl font-bold text-white">Complete your profile</h2>
            <p className="mb-6 text-center text-sm text-slate-400">
              Just a few more details to get you set up
            </p>

            {userEmail && (
              <p className="mb-4 rounded-md bg-slate-700 px-3 py-2 text-center text-sm text-slate-300">
                Signed in as <span className="font-medium text-teal-400">{userEmail}</span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Organisation */}
              <div>
                <label htmlFor="orgId" className="mb-1 block text-sm font-medium text-slate-300">
                  Organisation
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  <select
                    id="orgId" name="orgId"
                    value={formData.orgId} onChange={handleChange}
                    disabled={orgsLoading}
                    className="w-full rounded-md border border-slate-600 bg-slate-700 py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                  >
                    <option value="">{orgsLoading ? 'Loading…' : 'Select your organisation'}</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                {errors.orgId && <p className="mt-1 text-xs text-red-400">{errors.orgId}</p>}
              </div>

              {/* Join Code */}
              <div>
                <label htmlFor="joinCode" className="mb-1 block text-sm font-medium text-slate-300">
                  Join Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="joinCode" name="joinCode"
                    value={formData.joinCode} onChange={handleChange}
                    className="border-slate-600 bg-slate-700 pl-9 text-white placeholder-slate-400 uppercase tracking-widest"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                {errors.joinCode && <p className="mt-1 text-xs text-red-400">{errors.joinCode}</p>}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="mb-1 block text-sm font-medium text-slate-300">Department</label>
                <select
                  id="department" name="department"
                  value={formData.department} onChange={handleChange}
                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <Button type="submit" disabled={isLoading || orgsLoading} variant="primary" className="w-full">
                {isLoading ? 'Saving…' : 'Complete Sign-Up'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
