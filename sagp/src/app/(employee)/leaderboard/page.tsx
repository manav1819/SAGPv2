'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Medal } from 'lucide-react';

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    name: 'Alice Johnson',
    points: 8450,
    badges: 12,
    streak: 45,
    completed: 28,
    isCurrentUser: false,
  },
  {
    rank: 2,
    name: 'Bob Smith',
    points: 7820,
    badges: 10,
    streak: 32,
    completed: 26,
    isCurrentUser: false,
  },
  {
    rank: 3,
    name: 'Carol Davis',
    points: 7650,
    badges: 11,
    streak: 28,
    completed: 25,
    isCurrentUser: false,
  },
  {
    rank: 4,
    name: 'David Wilson',
    points: 6920,
    badges: 9,
    streak: 18,
    completed: 22,
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: 'Eve Martinez',
    points: 6450,
    badges: 8,
    streak: 15,
    completed: 20,
    isCurrentUser: false,
  },
  {
    rank: 6,
    name: 'Frank Brown',
    points: 5890,
    badges: 7,
    streak: 12,
    completed: 18,
    isCurrentUser: false,
  },
  {
    rank: 7,
    name: 'Grace Lee',
    points: 5450,
    badges: 6,
    streak: 8,
    completed: 15,
    isCurrentUser: false,
  },
  {
    rank: 8,
    name: 'Henry Taylor',
    points: 4920,
    badges: 5,
    streak: 5,
    completed: 14,
    isCurrentUser: false,
  },
];

const MOCK_DEPARTMENT_BATTLE = {
  department: 'Engineering',
  leader: 'Security Team',
  endDate: '2024-03-25',
  status: 'active',
  prize: 'Department bragging rights + 100 bonus XP',
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('global');

  const topThree = MOCK_LEADERBOARD.slice(0, 3);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="mt-1 text-slate-400">See how you rank against your peers</p>
      </div>

      {/* Active Battle Banner */}
      {MOCK_DEPARTMENT_BATTLE.status === 'active' && (
        <Card className="border-teal-600 bg-gradient-to-r from-teal-900 to-teal-800">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  Department Battle Active: {MOCK_DEPARTMENT_BATTLE.department}
                </h3>
                <p className="mt-1 text-sm text-teal-100">
                  Currently leading: {MOCK_DEPARTMENT_BATTLE.leader}. Prize: {MOCK_DEPARTMENT_BATTLE.prize}
                </p>
                <p className="text-xs text-teal-200">
                  Ends on {MOCK_DEPARTMENT_BATTLE.endDate}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {topThree.map((user) => (
          <Card
            key={user.rank}
            className={`border-slate-700 text-center ${
              user.rank === 1 ? 'md:col-span-1 md:order-2' : ''
            }`}
          >
            <div
              className={`p-6 ${
                user.rank === 1
                  ? 'bg-gradient-to-br from-yellow-900 to-yellow-800'
                  : user.rank === 2
                    ? 'bg-gradient-to-br from-slate-700 to-slate-600'
                    : 'bg-gradient-to-br from-orange-900 to-orange-800'
              }`}
            >
              <div className="mb-4 text-4xl font-bold">
                {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{user.name}</h3>
              <p className="mb-4 text-2xl font-bold text-white">{user.points}</p>
              <div className="flex justify-center gap-3 text-sm">
                <span className="text-slate-200">Streak: {user.streak}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="border-b border-slate-700 bg-transparent">
          <TabsTrigger
            value="global"
            className="border-b-2 border-transparent text-slate-400 data-[state=active]:border-teal-500 data-[state=active]:text-white"
          >
            Global
          </TabsTrigger>
          <TabsTrigger
            value="organization"
            className="border-b-2 border-transparent text-slate-400 data-[state=active]:border-teal-500 data-[state=active]:text-white"
          >
            Organization
          </TabsTrigger>
          <TabsTrigger
            value="department"
            className="border-b-2 border-transparent text-slate-400 data-[state=active]:border-teal-500 data-[state=active]:text-white"
          >
            Department
          </TabsTrigger>
          <TabsTrigger
            value="weekly"
            className="border-b-2 border-transparent text-slate-400 data-[state=active]:border-teal-500 data-[state=active]:text-white"
          >
            Weekly
          </TabsTrigger>
        </TabsList>

        {['global', 'organization', 'department', 'weekly'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card className="border-slate-700 bg-slate-800 mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-6 py-4 text-left font-medium text-slate-400">Rank</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-400">Name</th>
                      <th className="px-6 py-4 text-right font-medium text-slate-400">Points</th>
                      <th className="px-6 py-4 text-center font-medium text-slate-400">Badges</th>
                      <th className="px-6 py-4 text-center font-medium text-slate-400">Streak</th>
                      <th className="px-6 py-4 text-center font-medium text-slate-400">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_LEADERBOARD.map((user) => (
                      <tr
                        key={user.rank}
                        className={`border-b border-slate-700 transition-colors ${
                          user.isCurrentUser ? 'bg-teal-900' : 'hover:bg-slate-700'
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-white">#{user.rank}</td>
                        <td className="px-6 py-4 text-white">
                          {user.name}
                          {user.isCurrentUser && (
                            <Badge className="ml-2 border-teal-600 bg-teal-900 text-teal-200">
                              You
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-teal-400">
                          {user.points}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            {Array(user.badges)
                              .fill(0)
                              .map((_, i) => (
                                <span key={i} className="text-yellow-400">
                                  ⭐
                                </span>
                              ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-orange-400">
                            <Flame className="h-4 w-4" />
                            <span>{user.streak}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-white">{user.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
