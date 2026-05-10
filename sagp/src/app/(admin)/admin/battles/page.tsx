'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Trophy, Plus, Clock, Calendar } from 'lucide-react';

const mockBattles = [
  {
    id: '1',
    name: 'Q1 Security Challenge',
    status: 'active',
    metric: 'total_points',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    daysLeft: 8,
    departments: ['Engineering', 'Sales', 'HR'],
    leaderboard: [
      { rank: 1, department: 'Engineering', score: 2450, participants: 24 },
      { rank: 2, department: 'Sales', score: 1890, participants: 18 },
      { rank: 3, department: 'HR', score: 1245, participants: 12 },
    ],
  },
  {
    id: '2',
    name: 'February Phishing Excellence',
    status: 'completed',
    metric: 'completion_rate',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    daysLeft: 0,
    departments: ['Finance', 'Legal'],
    leaderboard: [
      { rank: 1, department: 'Finance', score: 95, participants: 15 },
      { rank: 2, department: 'Legal', score: 88, participants: 8 },
    ],
  },
  {
    id: '3',
    name: 'January Module Marathon',
    status: 'completed',
    metric: 'avg_score',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    daysLeft: 0,
    departments: ['Engineering', 'Sales'],
    leaderboard: [
      { rank: 1, department: 'Engineering', score: 82, participants: 24 },
      { rank: 2, department: 'Sales', score: 76, participants: 18 },
    ],
  },
];

export default function BattlesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedBattle, setExpandedBattle] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    departments: [] as string[],
    metric: 'total_points',
    startDate: '',
    endDate: '',
  });

  const toggleDepartment = (dept: string) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }));
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Department Battles' }]}
        actions={
          <Button variant="primary" size="md" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Battle
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Battles List */}
          <div className="space-y-4">
            {mockBattles.map((battle) => (
              <Card key={battle.id}>
                <CardContent className="pt-6">
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedBattle(
                        expandedBattle === battle.id ? null : battle.id
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-100">
                            {battle.name}
                          </h3>
                          <Badge
                            variant={
                              battle.status === 'active' ? 'success' : 'secondary'
                            }
                          >
                            {battle.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                          {battle.departments.join(', ')}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-400">
                              {battle.startDate} → {battle.endDate}
                            </span>
                          </div>
                          {battle.status === 'active' && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-teal-400" />
                              <span className="text-xs text-teal-300 font-medium">
                                {battle.daysLeft} days left
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Metric</p>
                        <p className="text-sm font-medium text-slate-200 mt-1">
                          {battle.metric.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Leaderboard */}
                    {expandedBattle === battle.id && (
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <h4 className="font-semibold text-slate-100 mb-4">
                          Leaderboard
                        </h4>
                        <div className="space-y-2">
                          {battle.leaderboard.map((entry) => (
                            <div
                              key={entry.rank}
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                  {entry.rank === 1 ? (
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                  ) : (
                                    <span className="text-sm font-bold text-slate-300">
                                      #{entry.rank}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-100">
                                    {entry.department}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {entry.participants} participants
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-teal-300">
                                  {entry.score}
                                  {battle.metric === 'completion_rate' && '%'}
                                  {battle.metric === 'avg_score' && '%'}
                                </p>
                                {entry.rank === 1 && (
                                  <Badge variant="success" className="mt-1">
                                    Leading
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {battle.status === 'active' && (
                          <div className="flex gap-2 mt-6">
                            <Button variant="secondary" size="sm">
                              Pause Battle
                            </Button>
                            <Button variant="destructive" size="sm">
                              End Battle
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create Battle Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Battle</CardTitle>
                <CardDescription>
                  Set up a new department competition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  label="Battle Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Participating Departments
                  </label>
                  <div className="space-y-2">
                    {[
                      'Engineering',
                      'Sales',
                      'HR',
                      'Finance',
                      'Legal',
                      'IT',
                    ].map((dept) => (
                      <label key={dept} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.departments.includes(dept)}
                          onChange={() => toggleDepartment(dept)}
                          className="rounded border-slate-600 bg-slate-800 text-teal-600"
                        />
                        <span className="text-sm text-slate-300">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Select
                  label="Competition Metric"
                  value={formData.metric}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metric: e.target.value }))
                  }
                >
                  <option value="total_points">Total Points</option>
                  <option value="completion_rate">Completion Rate</option>
                  <option value="avg_score">Average Score</option>
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="primary">Create Battle</Button>
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
