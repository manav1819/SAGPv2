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
    : 'Loading…';

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-slate-400">Manage your personal information</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Avatar + name card */}
        <Card className="border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4 p-6 border-b border-slate-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{displayName}</p>
              <p className="text-sm text-slate-400 capitalize">
                {membership?.org_role?.replace('_', ' ') || 'Employee'}
                {membership?.department ? ` · ${membership.department}` : ''}
              </p>
            </div>
          </div>

          {/* Personal information */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Personal Information</h3>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-teal-400 hover:text-teal-300"
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {/* First name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">First Name</label>
              <Input
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                className="border-slate-600 bg-slate-700 text-white disabled:opacity-60"
              />
            </div>

            {/* Last name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Last Name</label>
              <Input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                className="border-slate-600 bg-slate-700 text-white disabled:opacity-60"
              />
            </div>

            {/* Display name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Display Name <span className="text-slate-500">(shown on leaderboard)</span>
              </label>
              <Input
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                disabled={!isEditing}
                className="border-slate-600 bg-slate-700 text-white disabled:opacity-60"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
              <Input
                value={profile?.email || ''}
                disabled
                className="border-slate-600 bg-slate-700 text-slate-400 disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-slate-500">Email address cannot be changed</p>
            </div>

            {/* Department (read-only) */}
            {membership?.department && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Department</label>
                <Input
                  value={membership.department}
                  disabled
                  className="border-slate-600 bg-slate-700 text-slate-400 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-slate-500">Contact your admin to change your department</p>
              </div>
            )}

            {/* Save / Cancel buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-2 border-t border-slate-700">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="primary"
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} variant="ghost" disabled={isSaving}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Role & org info */}
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <h3 className="mb-4 font-semibold text-white">Account Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span className="capitalize text-white">
                  {membership?.org_role?.replace('_', ' ') || 'Employee'}
                </span>
              </div>
              {membership?.department && (
                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="text-slate-400">Department</span>
                  <span className="text-white">{membership.department}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 pt-3">
                <span className="text-slate-400">Account ID</span>
                <span className="font-mono text-xs text-slate-500">
                  {profile?.id?.slice(0, 8)}…
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
