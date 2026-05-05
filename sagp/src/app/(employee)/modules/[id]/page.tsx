'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Award, ArrowLeft, CheckCircle2 } from 'lucide-react';

const MOCK_MODULE = {
  id: 1,
  title: 'Password Security Best Practices',
  description:
    'Learn how to create, manage, and protect strong passwords. This module covers best practices for password creation, storage, and authentication methods.',
  category: 'Security',
  difficulty: 'Easy',
  points: 180,
  estimatedTime: 15,
  compliance: ['GDPR', 'ISO 27001'],
  prerequisites: [],
  attempts: [
    {
      id: 1,
      date: '2024-03-10',
      score: 95,
      time: 12,
      status: 'Passed',
    },
    {
      id: 2,
      date: '2024-03-05',
      score: 88,
      time: 14,
      status: 'Passed',
    },
  ],
  bestScore: 95,
};

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id;

  const handleStartGame = () => {
    router.push(`/game/${moduleId}`);
  };

  const canStart = MOCK_MODULE.prerequisites.length === 0;

  return (
    <div className="space-y-6 p-8">
      {/* Back Button */}
      <Link
        href="/modules"
        className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Modules
      </Link>

      {/* Header */}
      <div className="border-b border-slate-700 pb-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{MOCK_MODULE.title}</h1>
            <p className="mt-2 text-slate-400">{MOCK_MODULE.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-teal-400">+{MOCK_MODULE.points}</p>
            <p className="text-sm text-slate-400">XP</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3">
          <Badge className="border-slate-600 bg-slate-700 text-slate-200">
            {MOCK_MODULE.category}
          </Badge>
          <Badge className="border-red-600 bg-red-900 text-red-200">
            {MOCK_MODULE.difficulty}
          </Badge>
          {MOCK_MODULE.compliance.map((comp) => (
            <Badge key={comp} className="border-teal-600 bg-teal-900 text-teal-200">
              {comp}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Module Info */}
          <Card className="border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 p-6">
              <h3 className="font-semibold text-white">Module Information</h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-teal-400" />
                <div>
                  <p className="text-sm text-slate-400">Estimated Time</p>
                  <p className="font-medium text-white">{MOCK_MODULE.estimatedTime} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Award className="h-5 w-5 text-teal-400" />
                <div>
                  <p className="text-sm text-slate-400">Reward</p>
                  <p className="font-medium text-white">{MOCK_MODULE.points} XP</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <BookOpen className="h-5 w-5 text-teal-400" />
                <div>
                  <p className="text-sm text-slate-400">Category</p>
                  <p className="font-medium text-white">{MOCK_MODULE.category}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Prerequisites */}
          {MOCK_MODULE.prerequisites.length > 0 && (
            <Card className="border-slate-700 bg-slate-800">
              <div className="border-b border-slate-700 p-6">
                <h3 className="font-semibold text-white">Prerequisites</h3>
              </div>
              <div className="space-y-3 p-6">
                {MOCK_MODULE.prerequisites.map((prereq, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-white">{prereq}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Past Attempts */}
          <Card className="border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 p-6">
              <h3 className="font-semibold text-white">Past Attempts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-left font-medium text-slate-400">Date</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">Score</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">Time</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_MODULE.attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-slate-700">
                      <td className="px-6 py-4 text-white">{attempt.date}</td>
                      <td className="px-6 py-4 font-medium text-teal-400">{attempt.score}%</td>
                      <td className="px-6 py-4 text-white">{attempt.time}m</td>
                      <td className="px-6 py-4">
                        <Badge className="border-green-600 bg-green-900 text-green-200">
                          {attempt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column - CTA */}
        <div className="space-y-4">
          {/* Best Score */}
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700">
            <div className="p-6">
              <p className="mb-2 text-sm text-slate-400">Your Best Score</p>
              <p className="text-4xl font-bold text-teal-400">{MOCK_MODULE.bestScore}%</p>
              <p className="mt-4 text-xs text-slate-500">
                Complete the module again to improve your score
              </p>
            </div>
          </Card>

          {/* Start Button */}
          <Button
            onClick={handleStartGame}
            disabled={!canStart}
            variant="primary"
            className="w-full py-6 text-base"
          >
            {canStart ? 'Start Module' : 'Complete Prerequisites'}
          </Button>

          {/* Info */}
          {canStart && (
            <Card className="border-slate-700 bg-slate-800">
              <div className="p-4">
                <p className="text-xs text-slate-400">
                  This is an interactive training module. You'll complete scenarios and answer
                  questions to test your knowledge.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
