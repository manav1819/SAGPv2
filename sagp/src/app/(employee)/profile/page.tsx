'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Save, User, Pencil, X } from 'lucide-react';

export default function ProfilePage() {
  const { toast } = useToast();
  const { profile, membership, setProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name:   profile.first_name   || '',
        last_name:    profile.last_name    || '',
        display_name: profile.display_name || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      const updated = await res.json();
      // Sync into the global auth store so the sidebar also updates
      setProfile(updated);

      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
      setIsEditing(false);
    } catch {
      toast({ title: 'Error', description: 'Could not save profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile values
    if (profile) {
      setFormData({
        first_name:   profile.first_name   || '',
        last_name:    profile.last_name    || '',
        display_name: profile.display_name || '',
      });
    }
    setIsEditing(false);
  };

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : 'Loading...';

  return (
    <div className="min-h-full p-6 text-white">
      <div className="mx-auto mb-0 max-w-2xl border border-cyan-300/20 bg-slate-900 px-4 py-3 text-center shadow-2xl">
        <h1 className="font-heading text-2xl font-bold text-white sagp-neon-text">Profile</h1>
        <p className="mt-1 text-sm sagp-text-muted">Manage your personal information</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 border-x border-b border-cyan-300/15 bg-slate-900/60 p-4 shadow-2xl">
        {/* Avatar + name card */}
        <Card>
          <div className="flex flex-col items-center gap-3 border-b border-cyan-300/15 bg-cyan-300/5 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center border border-cyan-300/30 bg-cyan-300/10 shadow-lg">
              <User className="h-10 w-10 sagp-text-cyan" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{displayName}</p>
              <p className="text-sm capitalize sagp-text-muted">
                {membership?.org_role?.replace('_', ' ') || 'Employee'}
                {membership?.department ? ` · ${membership.department}` : ''}
              </p>
            </div>
          </div>

          {/* Personal information */}
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">Personal Information</h3>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border border-cyan-300/25 bg-cyan-300/10 px-3 sagp-text-cyan hover:bg-cyan-300/20"
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {/* First name */}
            <div>
              <label className="mb-1 block text-center text-sm font-bold text-white">First Name</label>
              <Input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-center disabled:opacity-60"
              />
            </div>

            {/* Last name */}
            <div>
              <label className="mb-1 block text-center text-sm font-bold text-white">Last Name</label>
              <Input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-center disabled:opacity-60"
              />
            </div>

            {/* Display name */}
            <div>
              <label className="mb-1 block text-center text-sm font-bold text-white">
                Display Name <span className="font-normal sagp-text-muted">(shown on leaderboard)</span>
              </label>
              <Input
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                disabled={!isEditing}
                className="text-center disabled:opacity-60"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1 block text-center text-sm font-bold text-white">Email</label>
              <Input
                value={profile?.email || ''}
                disabled
                className="text-center disabled:opacity-60"
              />
              <p className="mt-1 text-center text-xs sagp-text-muted">Email address cannot be changed</p>
            </div>

            {/* Department (read-only) */}
            {membership?.department && (
              <div>
                <label className="mb-1 block text-center text-sm font-bold text-white">Department</label>
                <Input
                  value={membership.department}
                  disabled
                  className="text-center disabled:opacity-60"
                />
                <p className="mt-1 text-center text-xs sagp-text-muted">Contact your admin to change your department</p>
              </div>
            )}

            {/* Save / Cancel buttons */}
            {isEditing && (
              <div className="flex gap-3 border-t border-cyan-300/15 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="primary"
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  disabled={isSaving}
                  className="border border-cyan-300/25 bg-white/5 text-white hover:bg-white/10"
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Role & org info */}
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-center font-bold text-white">Account Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-t border-cyan-300/15 pt-3 first:border-t-0 first:pt-0">
                <span className="font-bold sagp-text-muted">Role</span>
                <span className="capitalize text-white">
                  {membership?.org_role?.replace('_', ' ') || 'Employee'}
                </span>
              </div>
              {membership?.department && (
                <div className="flex justify-between border-t border-cyan-300/15 pt-3">
                  <span className="font-bold sagp-text-muted">Department</span>
                  <span className="text-white">{membership.department}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-cyan-300/15 pt-3">
                <span className="font-bold sagp-text-muted">Account ID</span>
                <span className="font-mono text-xs sagp-text-muted">
                  {profile?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
