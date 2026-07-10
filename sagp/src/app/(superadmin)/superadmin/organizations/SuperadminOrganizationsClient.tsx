'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Search, Copy, UserCog, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { reassignOrgAdmin, type SuperadminOrgRow } from '@/lib/actions/superadmin';

interface Props {
  orgs: SuperadminOrgRow[];
}

export function SuperadminOrganizationsClient({ orgs }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<SuperadminOrgRow | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.joinCode.toLowerCase().includes(q) ||
        (o.orgAdmin?.email ?? '').toLowerCase().includes(q)
    );
  }, [orgs, query]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // clipboard permissions can fail silently — non-critical
    }
  };

  const openReassign = (org: SuperadminOrgRow) => {
    setReassignTarget(org);
    setEmailInput(org.orgAdmin?.email ?? '');
    setFormError(null);
  };

  const submitReassign = () => {
    if (!reassignTarget) return;
    setFormError(null);
    startTransition(async () => {
      const result = await reassignOrgAdmin(reassignTarget.orgId, emailInput);
      if (!result.success) {
        setFormError(result.error ?? 'Something went wrong.');
        return;
      }
      setReassignTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Building className="h-7 w-7 sagp-text-primary" />
          Organisations
        </h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
        <input
          type="search"
          placeholder="Search organisations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sagp-input pl-9 w-full"
        />
      </div>

      <div className="sagp-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Name</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Org Admin</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Employees</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Join Code</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Created</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center sagp-text-muted">
                  {orgs.length === 0 ? 'No organisations yet.' : `No organisations match "${query}".`}
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <tr key={org.orgId} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{org.name}</td>
                  <td className="px-4 py-3">
                    {org.orgAdmin ? (
                      <div>
                        <p className="text-slate-200">{org.orgAdmin.name}</p>
                        <p className="text-xs sagp-text-muted">{org.orgAdmin.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs sagp-text-muted italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 sagp-text-muted">{org.employeeCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyCode(org.joinCode)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs tracking-widest text-slate-300 hover:text-cyan-400 transition-colors"
                      title="Copy join code"
                    >
                      {org.joinCode}
                      {copiedCode === org.joinCode ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 sagp-text-muted whitespace-nowrap">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openReassign(org)}
                      className="sagp-btn sagp-btn-secondary sagp-btn-sm inline-flex items-center gap-1.5"
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      Reassign admin
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={reassignTarget !== null} onOpenChange={(open) => !open && setReassignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign org admin</DialogTitle>
            <DialogDescription>
              {reassignTarget && (
                <>
                  Set the org_admin for <span className="text-slate-200 font-medium">{reassignTarget.name}</span>.
                  {reassignTarget.orgAdmin && (
                    <> The current admin ({reassignTarget.orgAdmin.email}) will be demoted to employee.</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label className="sagp-label text-xs" htmlFor="admin-email">
              User email
            </label>
            <input
              id="admin-email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="user@company.com"
              className="sagp-input"
            />
            <p className="text-xs sagp-text-muted">
              Must be an existing SAGP user. If they belong to a different org, they&apos;ll be moved into this one as
              org_admin.
            </p>
            {formError && (
              <p className="rounded-md bg-red-900/30 px-3 py-2 text-xs text-red-400 border border-red-500/30">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setReassignTarget(null)}
              className="sagp-btn sagp-btn-ghost"
              disabled={isPending}
            >
              Cancel
            </button>
            <button onClick={submitReassign} className="sagp-btn sagp-btn-primary" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
