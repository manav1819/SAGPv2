'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Lock, CheckCircle2, Clock } from 'lucide-react';

const CATEGORIES = ['All', 'Security', 'Awareness', 'Compliance', 'Phishing'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'Completed', 'In Progress', 'Locked'];

const MOCK_MODULES = [
  {
    id: 1,
    title: 'Password Security Best Practices',
    category: 'Security',
    difficulty: 'Easy',
    points: 180,
    estimatedTime: 15,
    status: 'completed',
    progress: 100,
    compliance: ['GDPR', 'ISO 27001'],
  },
  {
    id: 2,
    title: 'Phishing Email Identification',
    category: 'Phishing',
    difficulty: 'Medium',
    points: 250,
    estimatedTime: 25,
    status: 'in-progress',
    progress: 60,
    compliance: ['NIST', 'GDPR'],
  },
  {
    id: 3,
    title: 'Advanced Phishing Detection',
    category: 'Phishing',
    difficulty: 'Hard',
    points: 350,
    estimatedTime: 40,
    status: 'locked',
    progress: 0,
    compliance: ['ISO 27001'],
    prerequisite: 'Phishing Email Identification',
  },
  {
    id: 4,
    title: 'Data Protection Fundamentals',
    category: 'Compliance',
    difficulty: 'Easy',
    points: 200,
    estimatedTime: 20,
    status: 'completed',
    progress: 100,
    compliance: ['GDPR'],
  },
  {
    id: 5,
    title: 'Social Engineering Defense',
    category: 'Awareness',
    difficulty: 'Medium',
    points: 280,
    estimatedTime: 30,
    status: 'available',
    progress: 0,
    compliance: ['NIST', 'ISO 27001'],
  },
  {
    id: 6,
    title: 'Incident Response Protocols',
    category: 'Security',
    difficulty: 'Hard',
    points: 400,
    estimatedTime: 45,
    status: 'available',
    progress: 0,
    compliance: ['ISO 27001', 'HIPAA'],
  },
  {
    id: 7,
    title: 'Cloud Security Essentials',
    category: 'Security',
    difficulty: 'Medium',
    points: 220,
    estimatedTime: 28,
    status: 'available',
    progress: 0,
    compliance: ['GDPR'],
  },
  {
    id: 8,
    title: 'Secure Development Basics',
    category: 'Security',
    difficulty: 'Hard',
    points: 350,
    estimatedTime: 50,
    status: 'locked',
    progress: 0,
    compliance: ['OWASP'],
    prerequisite: 'Cloud Security Essentials',
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-900 text-green-200',
  Medium: 'bg-yellow-900 text-yellow-200',
  Hard: 'bg-red-900 text-red-200',
};

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredModules = MOCK_MODULES.filter((module) => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || module.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || module.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'All' || module.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedModules = filteredModules.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Training Modules</h1>
        <p className="mt-1 text-slate-400">
          Complete modules to improve your security awareness and earn points
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
        <Input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="border-slate-600 bg-slate-800 pl-10 text-white placeholder-slate-400"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-600 text-slate-300 hover:border-teal-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  setSelectedDifficulty(diff);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-600 text-slate-300 hover:border-teal-600'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-600 text-slate-300 hover:border-teal-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedModules.map((module) => (
          <Card key={module.id} className="border-slate-700 bg-slate-800 transition-transform hover:scale-105">
            <div className="p-6">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 font-semibold text-white">{module.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-slate-600 bg-slate-700 text-slate-200">
                      {module.category}
                    </Badge>
                    <Badge className={DIFFICULTY_COLORS[module.difficulty]}>
                      {module.difficulty}
                    </Badge>
                  </div>
                </div>
                {module.status === 'locked' && <Lock className="h-5 w-5 text-slate-500" />}
                {module.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>

              {/* Progress */}
              {module.status !== 'locked' && (
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-teal-500 transition-all"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Locked Info */}
              {module.status === 'locked' && module.prerequisite && (
                <p className="mb-3 text-xs text-slate-400">
                  Prerequisite: {module.prerequisite}
                </p>
              )}

              {/* Compliance Tags */}
              {module.compliance.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1">
                  {module.compliance.map((comp) => (
                    <span
                      key={comp}
                      className="rounded-sm bg-teal-900 px-2 py-1 text-xs text-teal-200"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="font-medium text-teal-400">+{module.points} XP</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.estimatedTime}m</span>
                  </div>
                </div>
                <Link href={`/modules/${module.id}`}>
                  <Button
                    size="sm"
                    disabled={module.status === 'locked'}
                    className={
                      module.status === 'locked'
                        ? 'bg-slate-600 text-slate-400'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }
                  >
                    {module.status === 'locked' ? 'Locked' : 'Start'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded ${
                  currentPage === page
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-600 text-slate-300 hover:border-teal-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
