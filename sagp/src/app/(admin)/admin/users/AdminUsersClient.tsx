'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Search, ArrowUpRight } from 'lucide-react';
import { RISK_TIER_COLORS, PERSONA_LABELS } from '@/lib/hooks/useLiveData';
import type { OrgEmployeeSummary } from '@/lib/actions/dashboard';

interface Props {
  employees: OrgEmployeeSummary[];
}

export function AdminUsersClient({ employees }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department ?? '').toLowerCase().includes(q)
      );
    });
  }, [employees, query]);

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sagp-heading-1 flex items-center gap-3">
          <Users className="h-7 w-7 sagp-text-primary" />
          Users
        </h1>
        <button className="sagp-btn sagp-btn-primary flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sagp-text-muted" />
          <input
            type="search"
            placeholder="Search users…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sagp-input pl-9 w-full"
          />
        </div>
        <p className="text-xs sagp-text-muted shrink-0">
          {filtered.length} of {employees.length} employee{employees.length === 1 ? '' : 's'}
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="sagp-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Users className="h-12 w-12 sagp-text-muted opacity-30" />
          <p className="sagp-heading-3 sagp-text-muted">No users yet</p>
          <p className="sagp-text-muted text-sm max-w-xs">
            Invite employees to join your organisation using the join code in Settings.
          </p>
        </div>
      ) : (
        <div className="sagp-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Employee</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Department</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Games</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Completed</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Risk</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Persona</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted">Last Active</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider sagp-text-muted"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center sagp-text-muted">
                    No employees match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const name = `${e.firstName} ${e.lastName}`.trim() || e.email;
                  return (
                    <tr key={e.userId} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-slate-200 font-medium truncate max-w-[220px]">{name}</p>
                        <p className="text-xs sagp-text-muted truncate max-w-[220px]">{e.email}</p>
                      </td>
                      <td className="px-4 py-3 sagp-text-muted">{e.department ?? '—'}</td>
                      <td className="px-4 py-3 sagp-text-muted">{e.sessionsPlayed}</td>
                      <td className="px-4 py-3 sagp-text-muted">{e.sessionsCompleted}</td>
                      <td className="px-4 py-3">
                        {e.riskScore != null ? (
                          <span className={`font-semibold ${RISK_TIER_COLORS[e.riskTier ?? ''] ?? 'sagp-text-muted'}`}>
                            {e.riskScore}
                          </span>
                        ) : (
                          <span className="sagp-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 sagp-text-muted">
                        {e.persona ? PERSONA_LABELS[e.persona] ?? e.persona : '—'}
                      </td>
                      <td className="px-4 py-3 sagp-text-muted whitespace-nowrap">
                        {e.lastActivityAt ? new Date(e.lastActivityAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/reports/${e.userId}`}
                          className="sagp-link inline-flex items-center gap-1 text-xs whitespace-nowrap"
                        >
                          View report <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
