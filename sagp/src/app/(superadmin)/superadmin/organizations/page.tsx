'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Building, Copy, Plus, Check } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  domain: string | null;
  join_code: string;
  created_at: string;
}

export default function SuperadminOrganizationsPage() {
  const { toast } = useToast();
  // Keep a stable ref to toast so it never needs to be a useCallback dependency
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [orgs, setOrgs]           = useState<Org[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState({ name: '', domain: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [copiedId, setCopiedId]   = useState<string | null>(null);

  // Stable fetchOrgs — no toast in deps, uses AbortController to cancel on unmount/sign-out
  const fetchOrgs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res  = await fetch('/api/superadmin/organizations', { signal });
      // 401 means we are signing out — silently ignore
      if (res.status === 401) return;
      if (!res.ok) throw new Error('non-ok');
      const data = await res.json();
      setOrgs(data.organizations ?? []);
    } catch (err: unknown) {
      // AbortError fires on unmount or sign-out navigation — suppress it
      if (err instanceof Error && err.name === 'AbortError') return;
      toastRef.current({ title: 'Error loading Organizations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []); // empty deps — deliberately stable

  useEffect(() => {
    const controller = new AbortController();
    fetchOrgs(controller.signal);
    return () => controller.abort(); // cancel on unmount (including during sign-out)
  }, [fetchOrgs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const res  = await fetch('/api/superadmin/organizations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: formData.name, domain: formData.domain || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Organisation created!', description: `Join code: ${data.organization.join_code}` });
      setFormData({ name: '', domain: '' });
      setShowForm(false);
      fetchOrgs(); // no signal — intentional one-off refresh
    } catch {
      toast({ title: 'Error creating organisation', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async (orgId: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(orgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Organisations</h1>
          <p className="mt-1 text-slate-400">Create and manage all organisations on the platform.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Organisation
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-purple-500/30 bg-slate-800 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Create Organisation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Organisation Name <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="border-slate-600 bg-slate-700 text-white"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Email Domain <span className="text-slate-500">(optional — enforces domain on sign-up)</span>
              </label>
              <Input
                value={formData.domain}
                onChange={e => setFormData(p => ({ ...p, domain: e.target.value }))}
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Org list */}
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : orgs.length === 0 ? (
        <p className="text-slate-400">No organisations yet. Create one above.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Organisation</th>
                <th className="px-6 py-4 text-left font-medium">Domain</th>
                <th className="px-6 py-4 text-left font-medium">Join Code</th>
                <th className="px-6 py-4 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-900">
              {orgs.map(org => (
                <tr key={org.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-white">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {org.domain ? `@${org.domain}` : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-700 px-2 py-1 font-mono text-teal-300 tracking-widest">
                        {org.join_code}
                      </span>
                      <button
                        onClick={() => copyCode(org.id, org.join_code)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy join code"
                      >
                        {copiedId === org.id
                          ? <Check className="h-4 w-4 text-teal-400" />
                          : <Copy className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
