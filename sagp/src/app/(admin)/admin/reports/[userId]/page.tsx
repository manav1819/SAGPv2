'use client';

import React from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Avatar } from '@/components/ui/avatar';
import {
  BarChart,
  Bar,
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
import { Clock } from 'lucide-react';

const userInfo = {
  name: 'John Doe',
  email: 'john.doe@company.com',
  department: 'Engineering',
  riskTier: 'high',
  completionRate: 65,
  lastActive: '2024-03-09 14:30',
};

const sessionHistory = [
  {
    id: '1',
    module: 'Phishing 101',
    date: '2024-03-09',
    duration: '12 min',
    score: 85,
    result: 'pass',
  },
  {
    id: '2',
    module: 'Password Best Practices',
    date: '2024-03-08',
    duration: '8 min',
    score: 72,
    result: 'pass',
  },
  {
    id: '3',
    module: 'Malware Detection',
    date: '2024-03-06',
    duration: '15 min',
    score: 58,
    result: 'fail',
  },
  {
    id: '4',
    module: 'Social Engineering',
    date: '2024-03-05',
    duration: '18 min',
    score: 65,
    result: 'pass',
  },
  {
    id: '5',
    module: 'Insider Threat Awareness',
    date: '2024-03-01',
    duration: '10 min',
    score: 78,
    result: 'pass',
  },
];

const riskComponentData = [
  { component: 'Phishing', value: 68 },
  { component: 'Password', value: 45 },
  { component: 'Malware', value: 52 },
  { component: 'Social Eng', value: 38 },
  { component: 'Insider Threat', value: 55 },
];

const remediationLog = [
  {
    id: '1',
    module: 'Malware Detection',
    sessionDate: '2024-03-06',
    result: 'failed',
    remediation: 'Phishing 101 Refresher',
    assigned: '2024-03-06',
    completed: '2024-03-07',
    status: 'completed',
  },
  {
    id: '2',
    module: 'Social Engineering',
    sessionDate: '2024-03-05',
    result: 'weak performance',
    remediation: 'Advanced Phishing Tactics',
    assigned: '2024-03-05',
    completed: null,
    status: 'in_progress',
  },
];

const personaHistory = [
  { date: '2024-02-15', persona: 'Speed Runner', confidence: 0.72 },
  { date: '2024-01-15', persona: 'Clicker', confidence: 0.65 },
  { date: '2024-01-01', persona: 'Guesser', confidence: 0.58 },
];

export default function UserReportPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[
          { label: 'Users', href: '/admin/users' },
          { label: 'Report' },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* User Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar name={userInfo.name} size="lg" />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-100">{userInfo.name}</h1>
                    <p className="text-slate-400 text-sm mt-1">{userInfo.email}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-400">Department</p>
                        <p className="text-sm text-slate-200">{userInfo.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Risk Tier</p>
                        <Badge variant="high" className="mt-1">{userInfo.riskTier}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Completion Rate</p>
                        <p className="text-sm text-slate-200 font-medium">{userInfo.completionRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Last Active</p>
                        <p className="text-sm text-slate-200">{userInfo.lastActive}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Component Breakdown</CardTitle>
              <CardDescription>Score breakdown across security categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskComponentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 99, 0.5)" />
                  <XAxis dataKey="component" stroke="rgb(148, 163, 184)" />
                  <YAxis stroke="rgb(148, 163, 184)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(15, 23, 42)',
                      border: '1px solid rgb(71, 85, 99)',
                    }}
                  />
                  <Bar dataKey="value" fill="#EF4444" radius={[8, 8, 0, 0]} name="Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Recent module completion sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionHistory.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.module}</TableCell>
                      <TableCell className="text-sm text-slate-400">{session.date}</TableCell>
                      <TableCell className="text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {session.duration}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-teal-300">{session.score}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.result === 'pass' ? 'success' : 'destructive'}
                        >
                          {session.result}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Remediation Log */}
          <Card>
            <CardHeader>
              <CardTitle>Remediation Log</CardTitle>
              <CardDescription>Assigned remediation modules and progress</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Original Module</TableHead>
                    <TableHead>Trigger Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Remediation Module</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remediationLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.module}</TableCell>
                      <TableCell className="text-sm text-slate-400">{log.sessionDate}</TableCell>
                      <TableCell className="text-sm text-slate-300">{log.result}</TableCell>
                      <TableCell className="text-sm">{log.remediation}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'completed'
                              ? 'success'
                              : log.status === 'in_progress'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {log.completed || 'Pending'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Persona History */}
          <Card>
            <CardHeader>
              <CardTitle>Security Persona History</CardTitle>
              <CardDescription>Evolution of user security behavior profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {personaHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                    <div>
                      <p className="font-medium text-slate-100">{entry.persona}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Confidence: {(entry.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{entry.date}</span>
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{ width: `${entry.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
