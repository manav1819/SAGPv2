'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Gamepad2, Loader2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface ModuleRecord {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  game_type?: string;
  points_value: number;
  estimated_mins: number;
  compliance_tags: string[] | null;
  games?: ModuleGame[];
  isTemplate?: boolean;
}

interface ProgressRecord {
  module_id: string;
  status: string;
}

const CATEGORIES = ['All', 'phishing', 'passwords', 'social_engineering', 'malware', 'insider_threat', 'device_security', 'data_handling'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];
const STATUSES = ['All', 'completed', 'in_progress', 'not_started'];
const HIDDEN_MODULE_TITLES = new Set(['Phishing Simulator']);

interface ModuleGame {
  title: string;
  type: string;
  duration: string;
}

const MODULE_TEMPLATES: ModuleRecord[] = [
  {
    id: 'template-phishing',
    title: 'Phishing Defense Lab',
    description: 'Practice inbox triage, link inspection, and reporting decisions across short playable drills.',
    category: 'phishing',
    difficulty: 'medium',
    points_value: 0,
    estimated_mins: 15,
    compliance_tags: ['NIST', 'SOC2'],
    games: [
      { title: 'Inbox Triage', type: 'spot-the-threat', duration: '5m' },
      { title: 'URL Decoder', type: 'pattern match', duration: '4m' },
      { title: 'Report or Reply', type: 'scenario', duration: '6m' },
    ],
    isTemplate: true,
  },
  {
    id: 'template-passwords',
    title: 'Password Fortress',
    description: 'Build stronger credentials with bite-sized challenges for passwords, passphrases, and MFA.',
    category: 'passwords',
    difficulty: 'easy',
    points_value: 0,
    estimated_mins: 12,
    compliance_tags: ['ISO27001'],
    games: [
      { title: 'Passphrase Builder', type: 'builder', duration: '4m' },
      { title: 'Crack Timer', type: 'estimator', duration: '3m' },
      { title: 'MFA Match', type: 'matching', duration: '5m' },
    ],
    isTemplate: true,
  },
  {
    id: 'template-malware',
    title: 'Malware Response Arcade',
    description: 'Identify suspicious files, isolate endpoints, and choose the right first response.',
    category: 'malware',
    difficulty: 'hard',
    points_value: 0,
    estimated_mins: 18,
    compliance_tags: ['NIST', 'PCI-DSS'],
    games: [
      { title: 'File Verdict', type: 'classifier', duration: '6m' },
      { title: 'Kill Chain Sort', type: 'sequence', duration: '5m' },
      { title: 'Containment Sprint', type: 'scenario', duration: '7m' },
    ],
    isTemplate: true,
  },
  {
    id: 'template-data-handling',
    title: 'Data Handling Quest',
    description: 'Sort data, pick safe channels, and practice clean sharing habits with fast mini-games.',
    category: 'data_handling',
    difficulty: 'medium',
    points_value: 0,
    estimated_mins: 14,
    compliance_tags: ['HIPAA', 'SOC2'],
    games: [
      { title: 'Classify It', type: 'sorting', duration: '4m' },
      { title: 'Share Safely', type: 'decision', duration: '5m' },
      { title: 'Retention Rush', type: 'timeline', duration: '5m' },
    ],
    isTemplate: true,
  },
];

export default function ModulesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const loadModules = async () => {
      const [moduleResponse, progressResponse] = await Promise.all([
        fetch('/api/modules?is_active=true'),
        user
          ? createClient()
              .from('progress')
              .select('module_id, status')
              .eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      if (moduleResponse.ok) {
        const data = await moduleResponse.json();
        setModules((data.modules || []).filter((module: ModuleRecord) => !HIDDEN_MODULE_TITLES.has(module.title)));
      }

      const progressRows = ((progressResponse as { data?: ProgressRecord[] }).data || []).reduce(
        (acc, row) => ({ ...acc, [row.module_id]: row }),
        {} as Record<string, ProgressRecord>
      );
      setProgress(progressRows);
      setIsLoading(false);
    };

    loadModules();
  }, [authLoading, user]);

  const filteredModules = useMemo(() => {
    const moduleCards = [...modules, ...MODULE_TEMPLATES];

    return moduleCards.filter((module) => {
      const moduleProgress = progress[module.id];
      const status = moduleProgress?.status || 'not_started';
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        module.title.toLowerCase().includes(query) ||
        module.description?.toLowerCase().includes(query) ||
        module.games?.some((game) => game.title.toLowerCase().includes(query));
      const matchesCategory = selectedCategory === 'All' || module.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || module.difficulty === selectedDifficulty;
      const matchesStatus = selectedStatus === 'All' || status === selectedStatus;
      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });
  }, [modules, progress, searchQuery, selectedCategory, selectedDifficulty, selectedStatus]);

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white sagp-neon-text">
          Training Modules
        </h1>
        <p className="mt-1 sagp-text-muted">
          Progress appears on module cards after you start or complete training.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 sagp-text-soft" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FilterGroup label="Category" options={CATEGORIES} value={selectedCategory} onChange={setSelectedCategory} />
        <FilterGroup label="Difficulty" options={DIFFICULTIES} value={selectedDifficulty} onChange={setSelectedDifficulty} />
        <FilterGroup label="Status" options={STATUSES} value={selectedStatus} onChange={setSelectedStatus} />
      </div>

      {isLoading ? (
        <Card className="p-8 text-center sagp-text-muted">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin sagp-text-cyan" />
          Loading modules...
        </Card>
      ) : filteredModules.length === 0 ? (
        <Card className="p-8 text-center sagp-text-muted">No active modules are available.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => {
            const moduleProgress = progress[module.id];
            const isCompleted = moduleProgress?.status === 'completed';
            const hasMiniGames = (module.games || []).length > 0;

            return (
              <Card key={module.id} className="transition-transform hover:scale-[1.02]">
                <div className="p-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-white">{module.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{module.category}</Badge>
                        <Badge variant="warning">{module.difficulty}</Badge>
                        {module.isTemplate && <Badge variant="secondary">template</Badge>}
                      </div>
                    </div>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 sagp-text-green" />}
                  </div>

                  {moduleProgress && (
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between text-xs sagp-text-muted">
                        <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                        <span>{isCompleted ? 'Done' : 'Active'}</span>
                      </div>
                      <ProgressBar value={isCompleted ? 100 : 50} max={100} />
                    </div>
                  )}

                  {module.description && (
                    <p className="mb-4 text-sm leading-relaxed sagp-text-muted">{module.description}</p>
                  )}

                  {hasMiniGames && (
                    <div className="mb-4 space-y-2">
                      {(module.games || []).map((game) => (
                        <div
                          key={game.title}
                          className="flex items-center justify-between rounded-md border border-cyan-300/15 bg-black/20 px-3 py-2 text-xs"
                        >
                          <span className="flex items-center gap-2 text-white">
                            <Gamepad2 className="h-3.5 w-3.5 sagp-text-cyan" />
                            {game.title}
                          </span>
                          <span className="sagp-text-muted">{game.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(module.compliance_tags || []).length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {(module.compliance_tags || []).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-cyan-300/15 pt-3">
                    <div className="flex items-center gap-3 text-sm sagp-text-muted">
                      <span className="font-medium sagp-text-cyan">+{module.points_value} XP</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{module.estimated_mins}m</span>
                      </div>
                    </div>
                    {module.isTemplate ? (
                      <Button size="sm" disabled>
                        Template
                      </Button>
                    ) : (
                      <Link href={`/modules/${module.id}`}>
                        <Button size="sm">{isCompleted ? 'View' : 'Start'}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium sagp-text-muted">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`sagp-btn sagp-btn-sm ${value === option ? 'sagp-btn-primary' : 'sagp-btn-secondary'}`}
          >
            {option.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
