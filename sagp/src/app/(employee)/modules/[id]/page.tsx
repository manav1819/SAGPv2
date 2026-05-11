'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { CertificateAward } from '@/components/employee/certificate-award';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface ModuleRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  game_type: string;
  points_value: number;
  estimated_mins: number;
  compliance_tags: string[] | null;
  prerequisites: string[] | null;
}

interface SessionRecord {
  id: string;
  score: number | null;
  passed: boolean | null;
  time_taken_seconds: number | null;
  ended_at: string | null;
}

interface ProgressRecord {
  status: string;
  best_score: number | null;
  attempts: number;
  completed_at: string | null;
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const moduleId = String(params.id);

  const [moduleRecord, setModuleRecord] = useState<ModuleRecord | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const loadModule = async () => {
      const supabase = createClient();
      const [{ data: moduleData }, { data: sessionData }, { data: progressData }] =
        await Promise.all([
          supabase.from('modules').select('*').eq('id', moduleId).maybeSingle(),
          user
            ? supabase
                .from('game_sessions')
                .select('id, score, passed, time_taken_seconds, ended_at')
                .eq('user_id', user.id)
                .eq('module_id', moduleId)
                .eq('status', 'completed')
                .order('ended_at', { ascending: false })
            : Promise.resolve({ data: [] }),
          user
            ? supabase
                .from('progress')
                .select('status, best_score, attempts, completed_at')
                .eq('user_id', user.id)
                .eq('module_id', moduleId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

      setModuleRecord((moduleData as ModuleRecord) || null);
      setSessions((sessionData as SessionRecord[]) || []);
      setProgress((progressData as ProgressRecord) || null);
      setIsLoading(false);
    };

    loadModule();
  }, [authLoading, moduleId, user]);

  const learnerName = useMemo(() => {
    if (!profile) return 'Learner';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;
  }, [profile]);

  const isCompleted = progress?.status === 'completed';

  const handleStartGame = async () => {
    if (!moduleRecord) return;

    if (moduleRecord.game_type === 'phishing_sim') {
      router.push('/game/phishing');
      return;
    }

    setIsStarting(true);
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleRecord.id }),
    });

    if (response.ok) {
      const data = await response.json();
      router.push(`/game/${data.session.id}`);
    } else {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center sagp-text-muted">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin sagp-text-cyan" />
          Loading module...
        </Card>
      </div>
    );
  }

  if (!moduleRecord) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center sagp-text-muted">Module not found.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Link href="/modules" className="inline-flex items-center gap-2 sagp-text-cyan hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Modules
      </Link>

      <div className="border-b border-cyan-300/15 pb-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white sagp-neon-text">
              {moduleRecord.title}
            </h1>
            <p className="mt-2 sagp-text-muted">{moduleRecord.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold sagp-text-cyan">+{moduleRecord.points_value}</p>
            <p className="text-sm sagp-text-muted">XP</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge>{moduleRecord.category}</Badge>
          <Badge variant="warning">{moduleRecord.difficulty}</Badge>
          {(moduleRecord.compliance_tags || []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="border-b border-cyan-300/15 p-6">
              <h3 className="font-semibold text-white">Module Information</h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 sagp-text-cyan" />
                <div>
                  <p className="text-sm sagp-text-muted">Estimated Time</p>
                  <p className="font-medium text-white">{moduleRecord.estimated_mins} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Award className="h-5 w-5 sagp-text-cyan" />
                <div>
                  <p className="text-sm sagp-text-muted">Reward</p>
                  <p className="font-medium text-white">{moduleRecord.points_value} XP</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <BookOpen className="h-5 w-5 sagp-text-cyan" />
                <div>
                  <p className="text-sm sagp-text-muted">Category</p>
                  <p className="font-medium text-white">{moduleRecord.category}</p>
                </div>
              </div>
            </div>
          </Card>

          {sessions.length > 0 && (
            <Card>
              <div className="border-b border-cyan-300/15 p-6">
                <h3 className="font-semibold text-white">Completed Attempts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyan-300/15">
                      <th className="px-6 py-3 text-left font-medium sagp-text-muted">Date</th>
                      <th className="px-6 py-3 text-left font-medium sagp-text-muted">Score</th>
                      <th className="px-6 py-3 text-left font-medium sagp-text-muted">Time</th>
                      <th className="px-6 py-3 text-left font-medium sagp-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-cyan-300/10">
                        <td className="px-6 py-4 text-white">
                          {session.ended_at ? new Date(session.ended_at).toLocaleDateString() : 'Completed'}
                        </td>
                        <td className="px-6 py-4 font-medium sagp-text-cyan">{session.score || 0}</td>
                        <td className="px-6 py-4 text-white">
                          {Math.round((session.time_taken_seconds || 0) / 60)}m
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={session.passed ? 'success' : 'destructive'}>
                            {session.passed ? 'Cleared' : 'Review Needed'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {isCompleted && (
            <CertificateAward
              learnerName={learnerName}
              moduleTitle={moduleRecord.title}
              completedAt={progress?.completed_at || undefined}
              score={progress?.best_score}
            />
          )}
        </div>

        <div className="space-y-4">
          {isCompleted && (
            <Card>
              <div className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 sagp-text-green" />
                  <p className="text-sm sagp-text-muted">Your Best Score</p>
                </div>
                <p className="text-4xl font-bold sagp-text-cyan">{progress?.best_score || 0}</p>
              </div>
            </Card>
          )}

          <Button
            onClick={handleStartGame}
            disabled={isStarting}
            variant="primary"
            className="w-full py-6 text-base"
          >
            {isStarting ? 'Starting...' : isCompleted ? 'Play Again' : 'Start Module'}
          </Button>
        </div>
      </div>
    </div>
  );
}
