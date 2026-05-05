'use client';

import React from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { TrendingUp, Users, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data
const securityScore = 72;

const trendData = [
  { date: 'Mar 1', completions: 145, avgScore: 68, newUsers: 12 },
  { date: 'Mar 2', completions: 158, avgScore: 71, newUsers: 8 },
  { date: 'Mar 3', completions: 142, avgScore: 69, newUsers: 15 },
  { date: 'Mar 4', completions: 172, avgScore: 73, newUsers: 10 },
  { date: 'Mar 5', completions: 165, avgScore: 75, newUsers: 18 },
  { date: 'Mar 6', completions: 188, avgScore: 76, newUsers: 14 },
  { date: 'Mar 7', completions: 195, avgScore: 78, newUsers: 20 },
];

const auditEvents = [
  {
    id: '1',
    action: 'Module Created',
    entity: 'Phishing 101',
    actor: 'admin@company.com',
    timestamp: '2 hours ago',
    severity: 'info',
  },
  {
    id: '2',
    action: 'User Deactivated',
    entity: 'john.doe@company.com',
    actor: 'sarah@company.com',
    timestamp: '4 hours ago',
    severity: 'warning',
  },
  {
    id: '3',
    action: 'Campaign Started',
    entity: 'March Phishing Campaign',
    actor: 'admin@company.com',
    timestamp: '1 day ago',
    severity: 'info',
  },
  {
    id: '4',
    action: 'Settings Updated',
    entity: 'SSO Configuration',
    actor: 'superadmin@company.com',
    timestamp: '2 days ago',
    severity: 'critical',
  },
];

const battleStatus = {
  name: 'Q1 Security Challenge',
  departments: ['Engineering', 'Sales', 'HR'],
  leaders: ['Engineering', '2,450 pts'],
  status: 'active',
  daysLeft: 8,
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'positive',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
          <p
            className={`text-xs mt-2 ${
              changeType === 'positive'
                ? 'text-green-400'
                : changeType === 'negative'
                  ? 'text-red-400'
                  : 'text-slate-400'
            }`}
          >
            {change}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center text-teal-400">
          {Icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar breadcrumbs={[{ label: 'Dashboard' }]} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              icon={<Users className="w-6 h-6" />}
              label="Active Users"
              value={1243}
              change="+12% from last week"
              changeType="positive"
            />
            <KpiCard
              icon={<CheckCircle className="w-6 h-6" />}
              label="Completion Rate"
              value="78%"
              change="+5% from last week"
              changeType="positive"
            />
            <KpiCard
              icon={<AlertCircle className="w-6 h-6" />}
              label="Avg Risk Score"
              value="42"
              change="-8% from last week"
              changeType="positive"
            />
            <KpiCard
              icon={<Zap className="w-6 h-6" />}
              label="Active Modules"
              value={18}
              change="3 new modules"
              changeType="neutral"
            />
          </div>

          {/* Security Score Gauge and Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Security Score Gauge */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Company Security Score</CardTitle>
                <CardDescription>Overall organizational security posture</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(71, 85, 99, 0.3)" strokeWidth="8" />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#0D9488"
                      strokeWidth="8"
                      strokeDasharray={`${(securityScore / 100) * 283} 283`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-teal-400">{securityScore}</span>
                    <span className="text-xs text-slate-400">out of 100</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4 text-center">
                  Organization is performing <span className="text-teal-300 font-medium">well</span>
                </p>
              </CardContent>
            </Card>

            {/* 30-day Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>30-Day Trend</CardTitle>
                <CardDescription>Completions, scores, and user growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 99, 0.5)" />
                    <XAxis dataKey="date" stroke="rgb(148, 163, 184)" />
                    <YAxis stroke="rgb(148, 163, 184)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(15, 23, 42)',
                        border: '1px solid rgb(71, 85, 99)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'rgb(226, 232, 240)' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completions"
                      stroke="#0D9488"
                      strokeWidth={2}
                      dot={false}
                      name="Completions"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                      name="Avg Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Audit Events and Battle Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Audit Events */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Audit Events</CardTitle>
                <CardDescription>Latest admin activity and system changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100">{event.action}</p>
                        <p className="text-xs text-slate-400 mt-1">{event.entity}</p>
                        <p className="text-xs text-slate-500 mt-1">{event.actor}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={
                            event.severity === 'critical'
                              ? 'critical'
                              : event.severity === 'warning'
                                ? 'warning'
                                : 'info'
                          }
                        >
                          {event.severity}
                        </Badge>
                        <span className="text-xs text-slate-500">{event.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Battle Status */}
            <Card>
              <CardHeader>
                <CardTitle>Active Battle</CardTitle>
                <CardDescription>Department competition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-100">{battleStatus.name}</p>
                  <Badge variant="success" className="mt-2">
                    {battleStatus.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400">Departments</p>
                    <p className="text-sm text-slate-100 mt-1">{battleStatus.departments.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Current Leader</p>
                    <p className="text-sm font-medium text-teal-300 mt-1">{battleStatus.leaders[0]}</p>
                    <p className="text-xs text-slate-400 mt-1">{battleStatus.leaders[1]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Time Remaining</p>
                    <p className="text-sm text-slate-100 mt-1">{battleStatus.daysLeft} days</p>
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="w-full">
                  View Battle Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
