'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download } from 'lucide-react';

const heatmapData = [
  { module: 'Phishing 101', mon: 45, tue: 52, wed: 48, thu: 61, fri: 58, sat: 12, sun: 8 },
  { module: 'Password Best Practices', mon: 38, tue: 42, wed: 40, thu: 51, fri: 48, sat: 10, sun: 6 },
  { module: 'Malware Detection', mon: 22, tue: 28, wed: 25, thu: 35, fri: 32, sat: 5, sun: 3 },
  { module: 'Social Engineering', mon: 31, tue: 35, wed: 33, thu: 44, fri: 40, sat: 8, sun: 5 },
];

const riskDistribution = [
  { score: '0-20', users: 145, percentage: 12 },
  { score: '21-40', users: 342, percentage: 28 },
  { score: '41-60', users: 428, percentage: 35 },
  { score: '61-80', users: 215, percentage: 18 },
  { score: '81-100', users: 73, percentage: 6 },
];

const personaData = [
  { name: 'Careful Defender', value: 380, color: '#0D9488' },
  { name: 'Speed Runner', value: 290, color: '#8B5CF6' },
  { name: 'Clicker', value: 165, color: '#F59E0B' },
  { name: 'Guesser', value: 98, color: '#EF4444' },
  { name: 'Skeptic', value: 167, color: '#3B82F6' },
];

const moduleEffectiveness = [
  {
    module: 'Phishing 101',
    completions: 412,
    avgScore: 78,
    riskReduction: 34,
    effectiveness: 'high',
  },
  {
    module: 'Password Best Practices',
    completions: 387,
    avgScore: 71,
    riskReduction: 28,
    effectiveness: 'high',
  },
  {
    module: 'Malware Detection',
    completions: 156,
    avgScore: 64,
    riskReduction: 22,
    effectiveness: 'medium',
  },
  {
    module: 'Social Engineering Tactics',
    completions: 289,
    avgScore: 73,
    riskReduction: 31,
    effectiveness: 'high',
  },
  {
    module: 'Insider Threat Awareness',
    completions: 134,
    avgScore: 68,
    riskReduction: 18,
    effectiveness: 'medium',
  },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Analytics' }]}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="secondary" size="md" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Completion Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Heatmap</CardTitle>
              <CardDescription>Module completions by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-slate-300 p-2">Module</th>
                      <th className="text-center font-medium text-slate-300 p-2">Mon</th>
                      <th className="text-center font-medium text-slate-300 p-2">Tue</th>
                      <th className="text-center font-medium text-slate-300 p-2">Wed</th>
                      <th className="text-center font-medium text-slate-300 p-2">Thu</th>
                      <th className="text-center font-medium text-slate-300 p-2">Fri</th>
                      <th className="text-center font-medium text-slate-300 p-2">Sat</th>
                      <th className="text-center font-medium text-slate-300 p-2">Sun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row) => (
                      <tr key={row.module} className="border-t border-slate-700">
                        <td className="p-2 text-slate-300">{row.module}</td>
                        {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun].map(
                          (value, idx) => {
                            const maxValue = 61;
                            const intensity = value / maxValue;
                            return (
                              <td key={idx} className="p-2 text-center">
                                <div
                                  className="inline-block px-3 py-1 rounded font-medium text-white text-xs"
                                  style={{
                                    backgroundColor: `rgba(13, 148, 136, ${intensity})`,
                                  }}
                                >
                                  {value}
                                </div>
                              </td>
                            );
                          }
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Distribution and Persona Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Distribution</CardTitle>
                <CardDescription>User distribution across risk scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 99, 0.5)" />
                    <XAxis dataKey="score" stroke="rgb(148, 163, 184)" />
                    <YAxis stroke="rgb(148, 163, 184)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(15, 23, 42)',
                        border: '1px solid rgb(71, 85, 99)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="users" fill="#0D9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Persona Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Persona Breakdown</CardTitle>
                <CardDescription>Distribution of user security personas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={personaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {personaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(15, 23, 42)',
                        border: '1px solid rgb(71, 85, 99)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Module Effectiveness Table */}
          <Card>
            <CardHeader>
              <CardTitle>Module Effectiveness</CardTitle>
              <CardDescription>Performance metrics for each module</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Completions</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Risk Reduction</TableHead>
                    <TableHead>Effectiveness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleEffectiveness.map((module) => (
                    <TableRow key={module.module}>
                      <TableCell className="font-medium">{module.module}</TableCell>
                      <TableCell>{module.completions}</TableCell>
                      <TableCell>
                        <span className="text-teal-300 font-medium">{module.avgScore}%</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-300 font-medium">{module.riskReduction}%</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-medium ${
                            module.effectiveness === 'high' ? 'text-green-400' : 'text-yellow-400'
                          }`}
                        >
                          {module.effectiveness}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
