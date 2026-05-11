'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Activity } from 'lucide-react';

const mockCampaigns = [
  {
    id: '1',
    name: 'March Security Awareness',
    status: 'active',
    template: 'CEO Spoof',
    targets: 'All Staff',
    startDate: '2024-03-01',
    endDate: null,
    sent: 1243,
    opened: 856,
    clicked: 342,
    credentials: 45,
    reported: 127,
  },
  {
    id: '2',
    name: 'February Phishing Campaign',
    status: 'completed',
    template: 'IT Support',
    targets: 'Engineering + Finance',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    sent: 892,
    opened: 612,
    clicked: 198,
    credentials: 23,
    reported: 89,
  },
  {
    id: '3',
    name: 'January Advanced Training',
    status: 'completed',
    template: 'Banking Fraud',
    targets: 'Finance Department',
    startDate: '2024-01-15',
    endDate: '2024-01-31',
    sent: 234,
    opened: 178,
    clicked: 67,
    credentials: 12,
    reported: 34,
  },
];

const campaignAnalytics = [
  { metric: 'Sent', value: 1243, color: '#0D9488' },
  { metric: 'Opened', value: 856, color: '#8B5CF6' },
  { metric: 'Clicked', value: 342, color: '#F59E0B' },
  { metric: 'Credentials', value: 45, color: '#EF4444' },
  { metric: 'Reported', value: 127, color: '#10B981' },
];

export default function PhishingPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Phishing Campaigns' }]}
        actions={
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Campaign List */}
          <Card>
            <CardHeader>
              <CardTitle>Phishing Campaigns</CardTitle>
              <CardDescription>Active and completed phishing simulation campaigns</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Targets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCampaigns.map((campaign) => (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-sm text-slate-300">{campaign.template}</TableCell>
                      <TableCell className="text-sm text-slate-300">{campaign.targets}</TableCell>
                      <TableCell>
                        <Badge
                          variant={campaign.status === 'active' ? 'success' : 'secondary'}
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {campaign.startDate} {campaign.endDate && `→ ${campaign.endDate}`}
                      </TableCell>
                      <TableCell className="font-medium">{campaign.sent}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Activity className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Campaign Analytics */}
          {selectedCampaign && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Analytics - March Security Awareness</CardTitle>
                  <CardDescription>Real-time metrics for active campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">Open Rate</p>
                      <p className="text-2xl font-bold text-teal-300 mt-2">
                        {((856 / 1243) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">Click Rate</p>
                      <p className="text-2xl font-bold text-purple-300 mt-2">
                        {((342 / 1243) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">Credential Rate</p>
                      <p className="text-2xl font-bold text-red-400 mt-2">
                        {((45 / 342) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">Report Rate</p>
                      <p className="text-2xl font-bold text-green-400 mt-2">
                        {((127 / 1243) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">No Interaction</p>
                      <p className="text-2xl font-bold text-slate-300 mt-2">
                        {(
                          ((1243 - 856) /
                            1243) *
                          100
                        ).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={campaignAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 99, 0.5)" />
                      <XAxis dataKey="metric" stroke="rgb(148, 163, 184)" />
                      <YAxis stroke="rgb(148, 163, 184)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(15, 23, 42)',
                          border: '1px solid rgb(71, 85, 99)',
                        }}
                      />
                      <Bar dataKey="value" fill="#0D9488" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Create Campaign Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input label="Campaign Name" />

                <Select label="Email Template">
                  <option>CEO Spoof</option>
                  <option>IT Support</option>
                  <option>Banking Fraud</option>
                  <option>Prize Winner</option>
                  <option>Password Reset</option>
                </Select>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Departments
                  </label>
                  <div className="space-y-2">
                    {['Engineering', 'Sales', 'HR', 'Finance', 'Legal'].map((dept) => (
                      <label key={dept} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-slate-600 bg-slate-800 text-teal-600"
                        />
                        <span className="text-sm text-slate-300">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Input label="Schedule Launch Date" type="datetime-local" />

                <div className="flex gap-4">
                  <Button variant="primary">Create Campaign</Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
