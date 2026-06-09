'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Mail, Building, Shield, Calendar, User, IdCard, Activity } from 'lucide-react';

const profileMatrixBits = [
  '0110100101101010',
  '1011010010110010',
  '0100111010010110',
  '1101001011010010',
  '0011010110100101',
  '1010110011100101',
  '0101101001011010',
  '1110010100101101',
  '0010110101101001',
  '1001011100101011',
  '0111010010110100',
  '1100101011010010',
];

export default function ProfilePage() {
  const { user, profile, membership, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="sagp-content-area flex min-h-[60vh] items-center justify-center">
        <Shield className="h-10 w-10 sagp-text-primary animate-pulse" />
      </div>
    );
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.email ?? 'Unknown';
  const initials = (profile?.first_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();
  const joinedDate = membership?.joined_at
    ? new Date(membership.joined_at).toLocaleDateString()
    : profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString()
      : '-';

  return (
    <div className="sagp-content-area sagp-profile-page mx-auto w-full max-w-6xl p-6 lg:p-8">
      <div className="sagp-profile-shell">
        <section className="sagp-card sagp-profile-hero-card">
          <div className="sagp-profile-matrix" aria-hidden="true">
            {profileMatrixBits.map((bits, index) => (
              <span
                key={`${bits}-${index}`}
                style={{
                  '--profile-matrix-left': `${8 + index * 7.4}%`,
                  '--profile-matrix-delay': `${index * -0.46}s`,
                  '--profile-matrix-start-x': `${(index - 6) * -0.08}rem`,
                  '--profile-matrix-end-x': `${(6 - index) * 0.12}rem`,
                } as CSSProperties}
              >
                {bits}
              </span>
            ))}
          </div>

          <div className="sagp-profile-hero-content">
            <div className="sagp-profile-avatar">
              {initials}
            </div>
            <div className="space-y-2 text-center">
              <p className="sagp-heading-2 sagp-neon-text">{displayName}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="sagp-badge sagp-badge-green">
                  <Activity className="h-3.5 w-3.5" />
                  Active profile
                </span>
                <span className="sagp-badge sagp-badge-purple">
                  <Shield className="h-3.5 w-3.5" />
                  {profile?.role ?? 'employee'}
                </span>
              </div>
              <p className="sagp-text-muted text-sm">
                Security identity and organization context for your SAGP training account.
              </p>
            </div>
          </div>
        </section>

        <div className="sagp-profile-grid-expanded">
          <section className="sagp-card p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="sagp-eyebrow">Account</p>
                <h2 className="sagp-card-title mt-2">Profile Details</h2>
              </div>
              <div className="sagp-icon-tile">
                <User className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email ?? user?.email ?? '-'} />
              <ProfileField icon={<Shield className="h-4 w-4" />} label="Role" value={profile?.role ?? '-'} />
              <ProfileField icon={<IdCard className="h-4 w-4" />} label="User ID" value={profile?.id ?? user?.id ?? '-'} />
              <ProfileField icon={<Calendar className="h-4 w-4" />} label="Joined" value={joinedDate} />
            </div>
          </section>

          <section className="sagp-card p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="sagp-eyebrow">Organization</p>
                <h2 className="sagp-card-title mt-2">Training Context</h2>
              </div>
              <div className="sagp-icon-tile">
                <Building className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <ProfileField icon={<Building className="h-4 w-4" />} label="Department" value={membership?.department ?? '-'} />
              <ProfileField icon={<Shield className="h-4 w-4" />} label="Access Role" value={profile?.role ?? '-'} />
              <ProfileField icon={<IdCard className="h-4 w-4" />} label="Organization ID" value={membership?.org_id ?? '-'} />
            </div>
          </section>

          <section className="sagp-card sagp-profile-wide-panel p-6">
            <div>
              <p className="sagp-eyebrow">Readiness</p>
              <h2 className="sagp-card-title mt-2">Security Training Identity</h2>
              <p className="sagp-card-description">
                Your profile connects game results, risk insights, badges, and leaderboard progress to the right organization record.
              </p>
            </div>
            <a href="/games" className="sagp-btn sagp-btn-primary">
              Continue Training
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="sagp-profile-field">
      <span className="sagp-text-muted text-xs flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
  );
}
