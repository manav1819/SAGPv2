'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Mail } from 'lucide-react';

interface OrgOption {
  id: string;
  name: string;
}

export default function SuperadminAdminsPage() {
  const { toast } = useToast();

  const [orgs, setOrgs]         = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [success, setSuccess]         = useState('');

  const [formData, setFormData] = useState({
    email:     '',
    firstName: '',
    lastName:  '',
    orgId:     '',
  });

  const fetchOrgs = useCallback(async () => {
    try {
      const res  = await fetch('/api/superadmin/organizations');
      const data = await res.json();
      setOrgs(data.organizations ?? []);
    } catch {
      toast({ title: 'Failed to load organisations', variant: 'destructive' });
    } finally {
      setOrgsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.email.includes('@')) e.email = 'Valid email required';
    if (!formData.orgId)               e.orgId = 'Please select an organisation';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSuccess('');
    try {
      const res  = await fetch('/api/superadmin/invite-admin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Invite failed', description: data.message, variant: 'destructive' });
        return;
      }

      setSuccess(data.message);
      setFormData({ email: '', firstName: '', lastName: '', orgId: '' });
    } catch {
      toast({ title: 'Error sending invite', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Invite Admins</h1>
        <p className="mt-1 text-slate-400">
          Send an invite email to a new organisation Admin. Only Superadmins can do this.
        </p>
      </div>

      <div className="max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
            <UserPlus className="h-5 w-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">New Admin Invite</h2>
        </div>

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-teal-900/30 border border-teal-500/30 p-4">
            <Mail className="mt-0.5 h-4 w-4 text-teal-400 flex-shrink-0" />
            <p className="text-sm text-teal-300">{success}</p>
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          {/* Organisation */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Organisation <span className="text-red-400">*</span>
            </label>
            <select
              name="orgId" value={formData.orgId} onChange={handleChange}
              disabled={orgsLoading}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
            >
              <option value="">{orgsLoading ? 'Loading…' : 'Select organisation'}</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            {errors.orgId && <p className="mt-1 text-xs text-red-400">{errors.orgId}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Admin Email <span className="text-red-400">*</span>
            </label>
            <Input
              name="email" type="email" placeholder="admin@company.com"
              value={formData.email} onChange={handleChange}
              className="border-slate-600 bg-slate-700 text-white"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">First Name</label>
              <Input
                name="firstName" placeholder="Jane"
                value={formData.firstName} onChange={handleChange}
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Last Name</label>
              <Input
                name="lastName" placeholder="Smith"
                value={formData.lastName} onChange={handleChange}
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={submitting || orgsLoading} className="w-full">
            {submitting ? 'Sending invite…' : 'Send Invite'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          The invited Admin will receive an email with a link to set their password. They will be granted
          Admin access to the selected organisation upon accepting the invite.
        </p>
      </div>
    </div>
  );
}
