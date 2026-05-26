'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { User, Mail, Building, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, membership, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="sagp-content-area flex items-center justify-center min-h-[60vh]">
        <Shield className="h-10 w-10 sagp-text-primary animate-pulse" />
      </div>
    );
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.email ?? 'Unknown';

  return (
    <div className="sagp-content-area p-6 lg:p-8 space-y-6 max-w-2xl">
      <h1 className="sagp-heading-1 flex items-center gap-3">
        <User className="h-7 w-7 sagp-text-primary" />
        My Profile
      </h1>

      {/* Profile card */}
      <div className="sagp-card p-6 space-y-5">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="sagp-brand-mark h-16 w-16 text-2xl font-bold">
            {(profile?.first_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="sagp-heading-3 sagp-neon-text">{displayName}</p>
            <p className="sagp-text-muted text-sm capitalize">{profile?.role ?? 'employee'}</p>
          </div>
        </div>

        <hr className="border-slate-700" />

        {/* Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email ?? user?.email ?? '—'} />
          <ProfileField icon={<Shield className="h-4 w-4" />} label="Role" value={profile?.role ?? '—'} />
          <ProfileField icon={<Building className="h-4 w-4" />} label="Department" value={membership?.department ?? '—'} />
          <ProfileField
            icon={<Calendar className="h-4 w-4" />}
            label="Joined"
            value={
              membership?.joined_at
                ? new Date(membership.joined_at).toLocaleDateString()
                : profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : '—'
            }
          />
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="sagp-text-muted text-xs flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
  );
}
