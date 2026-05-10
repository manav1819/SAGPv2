'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Lock, Building, Key } from 'lucide-react';

interface OrgOption {
  id: string;
  name: string;
  domain: string | null;
}

const DEPARTMENTS = [
  'Engineering', 'Finance', 'HR', 'Operations',
  'Sales', 'Marketing', 'Legal', 'Other',
];

export default function RegisterPage() {
  const router    = useRouter();
  const { toast } = useToast();

  const [orgs, setOrgs]               = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName:   '',
    lastName:    '',
    email:       '',
    password:    '',
    confirmPassword: '',
    orgId:       '',
    joinCode:    '',
    department:  'Engineering',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.firstName.trim())    e.firstName = 'First name required';
    if (!formData.lastName.trim())     e.lastName  = 'Last name required';
    if (!formData.email.includes('@')) e.email     = 'Valid email required';
    if (formData.password.length < 8)  e.password  = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    if (!formData.orgId)               e.orgId     = 'Please select your organisation';
    if (!formData.joinCode.trim())     e.joinCode  = 'Join code required';
    if (!acceptTerms)                  e.terms     = 'You must accept the terms';

    // Client-side domain hint (non-blocking — server validates authoritatively)
    if (selectedOrg?.domain && formData.email.includes('@')) {
      const emailDomain = formData.email.split('@')[1] ?? '';
      const orgDomain   = selectedOrg.domain.replace(/^@/, '').toLowerCase();
      if (emailDomain.toLowerCase() !== orgDomain) {
        e.email = `Your email must use the @${orgDomain} domain`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          firstName:  formData.firstName,
          lastName:   formData.lastName,
          email:      formData.email,
          password:   formData.password,
          orgId:      formData.orgId,
          joinCode:   formData.joinCode,
          department: formData.department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'EMAIL_EXISTS') {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
        } else if (data.code === 'INVALID_JOIN_CODE') {
          setErrors(prev => ({ ...prev, joinCode: data.message }));
        } else if (data.code === 'DOMAIN_MISMATCH') {
          setErrors(prev => ({ ...prev, email: data.message }));
        } else {
          toast({ title: 'Registration Failed', description: data.message || 'An error occurred', variant: 'destructive' });
        }
        return;
      }

      toast({ title: 'Account Created!', description: 'Please sign in with your new credentials.' });
      router.push('/login');
    } catch {
      toast({ title: 'Error', description: 'An error occurred during registration', variant: 'destructive' });
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
    <Card className="border-slate-700 bg-slate-800 shadow-2xl">
      <div className="p-8">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-teal-400 to-teal-600">
            <span className="text-lg font-bold text-white">🛡️</span>
          </div>
          <h1 className="ml-3 text-2xl font-bold text-white">SAGP</h1>
        </div>

        <h2 className="mb-1 text-center text-2xl font-bold text-white">Create Account</h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          Join your organisation&apos;s security training programme
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-300">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input id="firstName" name="firstName"
                  value={formData.firstName} onChange={handleChange}
                  className="border-slate-600 bg-slate-700 pl-9 text-white placeholder-slate-400" />
              </div>
              {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-300">Last Name</label>
              <Input id="lastName" name="lastName"
                value={formData.lastName} onChange={handleChange}
                className="border-slate-600 bg-slate-700 text-white placeholder-slate-400" />
              {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              Work Email
              {selectedOrg?.domain && (
                <span className="ml-2 text-xs text-teal-400">(@{selectedOrg.domain.replace(/^@/, '')})</span>
              )}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input id="email" name="email" type="email"
                value={formData.email} onChange={handleChange}
                className="border-slate-600 bg-slate-700 pl-9 text-white placeholder-slate-400" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

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
            <select id="department" name="department" value={formData.department} onChange={handleChange}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input id="password" name="password" type="password"
                value={formData.password} onChange={handleChange}
                className="border-slate-600 bg-slate-700 pl-9 text-white placeholder-slate-400" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-300">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input id="confirmPassword" name="confirmPassword" type="password"
                value={formData.confirmPassword} onChange={handleChange}
                className="border-slate-600 bg-slate-700 pl-9 text-white placeholder-slate-400" />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input id="acceptTerms" type="checkbox" checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-700 text-teal-600" />
            <label htmlFor="acceptTerms" className="text-sm text-slate-400">
              I accept the{' '}
              <Link href="/terms" className="text-teal-400 hover:text-teal-300">terms and conditions</Link>
            </label>
          </div>
          {errors.terms && <p className="text-xs text-red-400">{errors.terms}</p>}

          <Button type="submit" disabled={isLoading || orgsLoading} variant="primary" className="w-full">
            {isLoading ? 'Creating Account…' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-teal-400 hover:text-teal-300">Sign in</Link>
        </p>
      </div>
    </Card>
  );
}
