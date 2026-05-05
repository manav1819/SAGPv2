'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Flame, TrendingUp, Award, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  Low: { bg: 'bg-green-900', text: 'text-green-200' },
  Medium: { bg: 'bg-yellow-900', text: 'text-yellow-200' },
  High: { bg: 'bg-orange-900', text: 'text-orange-200' },
  Critical: { bg: 'bg-red-900', text: 'text-red-200' },
};

const MOCK_ACTIVITY = [
  {
    id: 1,
    title: 'Phishing Simulation Round 1',
    result: 'Passed',
    points: 250,
    date: '2 days ago',
  },
  {
    id: 2,
    title: 'Password Security Module',
    result: 'Passed',
    points: 180,
    date: '3 days ago',
  },
  {
    id: 3,
    title: 'Data Protection Training',
    result: 'Passed',
    points: 220,
    date: '5 days ago',
  },
  {
    id: 4,
    title: 'Email Security Basics',
    result: 'Passed',
    points: 150,
    date: '1 week ago',
  },
  {
    id: 5,
    title: 'Compliance Essentials',
    result: 'Passed',
    points: 200,
    date: '1 week ago',
  },
];

const RECOMMENDED_MODULES = [
  {
    id: 1,
    title: 'Advanced Phishing Detection',
    category: 'Security',
    difficulty: 'Hard',
    points: 350,
    icon: '🎯',
  },
  {
    id: 2,
    title: 'Social Engineering Defense',
    category: 'Awareness',
    difficulty: 'Medium',
    points: 280,
    icon: '🛡️',
  },
  {
    id: 3,
    title: 'Incident Response Protocols',
    category: 'Compliance',
    difficulty: 'Hard',
    points: 400,
    icon: '🚨',
  },
];

export default function DashboardPage() {
  const userRiskTier = 'Medium';
  const riskScore = 45;
  const companyScore = 72;
  const xpCurrent = 3850;
  const xpNeeded = 5000;
  const xpPercent = (xpCurrent / xpNeeded) * 100;

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-slate-400">Welcome back! Here's your security training progress</p>
      </div>

      {/* Top Row - Key Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Security Persona */}
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Security Persona</h3>
              <span className="text-2xl">🎭</span>
            </div>
            <p className="mb-2 text-lg font-bold text-teal-400">Careful Defender</p>
            <p className="text-sm text-slate-400">
              You demonstrate strong security awareness and cautious behavior
            </p>
          </div>
        </Card>

        {/* Risk Tier */}
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Risk Tier</h3>
              <AlertCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <Badge
                className={`${
                  RISK_COLORS[userRiskTier].bg
                } ${RISK_COLORS[userRiskTier].text} border-0`}
              >
                {userRiskTier}
              </Badge>
              <span className="text-2xl font-bold text-white">{riskScore}</span>
              <span className="text-sm text-slate-400">/100</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Risk score based on training performance</p>
          </div>
        </Card>

        {/* Streak */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Current Streak</h3>
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-orange-400">7</p>
            <p className="mt-2 text-sm text-slate-400">days of consistent training</p>
          </div>
        </Card>
      </div>

      {/* XP Progress and Company Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* XP Progress */}
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Next Level Progress</h3>
              <TrendingUp className="h-5 w-5 text-teal-400" />
            </div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{xpCurrent}</span>
              <span className="text-sm text-slate-400">/ {xpNeeded} XP</span>
            </div>
            <ProgressBar value={xpPercent} max={100} />
            <p className="mt-3 text-xs text-slate-400">
              {Math.round((xpNeeded - xpCurrent) / 10)} training actions remaining
            </p>
          </div>
        </Card>

        {/* Company Score */}
        <Card className="border-slate-700 bg-slate-800">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Company Security Score</h3>
              <Award className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mb-2 text-3xl font-bold text-teal-400">{companyScore}%</p>
            <p className="text-sm text-slate-400">
              Your organization is above industry average
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-6">
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {MOCK_ACTIVITY.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4">
              <div className="flex-1">
                <p className="font-medium text-white">{activity.title}</p>
                <p className="text-xs text-slate-400">{activity.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="border-slate-600 bg-slate-700 text-slate-200">
                  {activity.result}
                </Badge>
                <span className="font-semibold text-teal-400">+{activity.points} XP</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommended Modules */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Recommended Modules</h3>
          <Link href="/modules">
            <Button variant="ghost">
              View All
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {RECOMMENDED_MODULES.map((module) => (
            <Card key={module.id} className="border-slate-700 bg-slate-800">
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-3xl">{module.icon}</span>
                  <Badge className="border-slate-600 bg-teal-900 text-teal-200">
                    {module.difficulty}
                  </Badge>
                </div>
                <h4 className="mb-2 font-semibold text-white">{module.title}</h4>
                <p className="mb-4 text-sm text-slate-400">{module.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-teal-400">+{module.points} XP</span>
                  <Link href={`/modules/${module.id}`}>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      Start
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
