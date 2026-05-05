'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge-ui';
import { Save } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { id: 'sso', label: 'Single Sign-On', icon: '🔐' },
  { id: 'streaks', label: 'Streak Settings', icon: '🔥' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'retention', label: 'Data Retention', icon: '💾' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('sso');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = () => {
    setHasChanges(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Settings' }]}
        actions={
          hasChanges && (
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4 space-y-2">
                  {SETTINGS_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* SSO Configuration */}
              {activeSection === 'sso' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Single Sign-On Configuration</CardTitle>
                    <CardDescription>
                      Configure enterprise SSO for your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        SSO Provider
                      </label>
                      <Select onChange={handleChange}>
                        <option>None</option>
                        <option>Okta</option>
                        <option>Azure AD</option>
                        <option>Google Workspace</option>
                        <option>SAML 2.0</option>
                      </Select>
                    </div>

                    <Input label="SAML 2.0 Metadata URL" onChange={handleChange} />
                    <Input label="Entity ID" onChange={handleChange} />
                    <Input label="SSO Login URL" onChange={handleChange} />
                    <Input label="SSO Logout URL" onChange={handleChange} />

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        defaultChecked
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Enforce SSO for all users
                      </label>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400 mb-3">Connection Status</p>
                      <Badge variant="success">Connected</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Streak Settings */}
              {activeSection === 'streaks' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Streak Rules</CardTitle>
                    <CardDescription>
                      Configure how user streaks work in your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Input
                      label="Streak Freeze Days"
                      type="number"
                      defaultValue="5"
                      onChange={handleChange}
                      helperText="Number of days users can skip without losing their streak"
                    />

                    <Input
                      label="Daily Activity Requirement (hours)"
                      type="number"
                      defaultValue="24"
                      onChange={handleChange}
                      helperText="Activity window for maintaining streaks"
                    />

                    <Input
                      label="Minimum Module Completion for Streak"
                      type="number"
                      defaultValue="1"
                      onChange={handleChange}
                      helperText="Minimum modules to complete per day to maintain streak"
                    />

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        defaultChecked
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Enable streak freeze feature
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Reset all streaks on organization refresh
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leaderboard Settings */}
              {activeSection === 'leaderboard' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Leaderboard Configuration</CardTitle>
                    <CardDescription>
                      Control leaderboard visibility and scope
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Default Leaderboard Scope
                      </label>
                      <Select onChange={handleChange}>
                        <option value="org">Organization-wide</option>
                        <option value="department">Department</option>
                        <option value="weekly">Weekly</option>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        defaultChecked
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Show user names on leaderboard
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        defaultChecked
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Show department names on leaderboard
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Allow anonymous leaderboard mode
                      </label>
                    </div>

                    <Input
                      label="Leaderboard Refresh Interval (hours)"
                      type="number"
                      defaultValue="1"
                      onChange={handleChange}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Configure system notification behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-3">
                        Email Notifications
                      </p>
                      <div className="space-y-2">
                        {['Badge Earned', 'Streak Milestone', 'Module Completion', 'Remediation Required'].map(
                          (notif) => (
                            <label
                              key={notif}
                              className="flex items-center gap-2 p-2"
                            >
                              <input
                                type="checkbox"
                                defaultChecked
                                onChange={handleChange}
                                className="rounded border-slate-600 bg-slate-800 text-teal-600"
                              />
                              <span className="text-sm text-slate-300">{notif}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    <Input
                      label="Notification Digest Frequency"
                      type="select"
                      onChange={handleChange}
                    />

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        defaultChecked
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Send admin alerts for high-risk users
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Retention */}
              {activeSection === 'retention' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Data Retention Policy</CardTitle>
                    <CardDescription>
                      Configure how long system data is retained
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Input
                      label="Retain Session Data (days)"
                      type="number"
                      defaultValue="365"
                      onChange={handleChange}
                    />

                    <Input
                      label="Retain Audit Logs (days)"
                      type="number"
                      defaultValue="730"
                      onChange={handleChange}
                    />

                    <Input
                      label="Retain Risk Scores (days)"
                      type="number"
                      defaultValue="90"
                      onChange={handleChange}
                    />

                    <Input
                      label="Retain Phishing Campaign Data (days)"
                      type="number"
                      defaultValue="365"
                      onChange={handleChange}
                    />

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                      <input
                        type="checkbox"
                        onChange={handleChange}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <label className="text-sm text-slate-300">
                        Anonymize deleted user data
                      </label>
                    </div>

                    <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
                      <p className="text-sm text-yellow-300">
                        Data older than the retention period will be automatically deleted.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
