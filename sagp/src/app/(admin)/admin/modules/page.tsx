'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { Search, Plus, Edit2, Trash2, Copy, Download } from 'lucide-react';

const mockModules = [
  {
    id: '1',
    title: 'Phishing 101',
    category: 'phishing',
    difficulty: 'easy',
    version: '2.1',
    compliance: ['NIST', 'ISO27001'],
    activeUsers: 156,
    completionRate: 78,
    status: 'active',
  },
  {
    id: '2',
    title: 'Password Best Practices',
    category: 'passwords',
    difficulty: 'medium',
    version: '1.5',
    compliance: ['PCI-DSS', 'HIPAA'],
    activeUsers: 89,
    completionRate: 64,
    status: 'active',
  },
  {
    id: '3',
    title: 'Malware Detection',
    category: 'malware',
    difficulty: 'hard',
    version: '3.0',
    compliance: ['SOC2'],
    activeUsers: 45,
    completionRate: 52,
    status: 'active',
  },
  {
    id: '4',
    title: 'Social Engineering Tactics',
    category: 'social_engineering',
    difficulty: 'hard',
    version: '1.2',
    compliance: ['NIST'],
    activeUsers: 67,
    completionRate: 71,
    status: 'inactive',
  },
];

function getDifficultyColor(difficulty: string): 'low' | 'medium' | 'high' {
  switch (difficulty) {
    case 'easy':
      return 'low';
    case 'medium':
      return 'medium';
    case 'hard':
      return 'high';
    default:
      return 'medium';
  }
}

export default function ModulesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredModules = mockModules.filter((module) => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || module.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Modules' }]}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/admin/modules/create" className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 focus-visible:ring-offset-slate-900 h-10 px-4 text-base">
              <Plus className="w-4 h-4" />
              Create Module
            </Link>
            <Button variant="secondary" size="md">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <div className="flex gap-2">
                  <Button variant="secondary" size="md">
                    Bulk Assign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.title}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-300">{module.category}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-100">{module.version}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {module.compliance.map((tag) => (
                            <Badge key={tag} variant="primary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{module.activeUsers}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full"
                              style={{ width: `${module.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{module.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={module.status === 'active' ? 'success' : 'secondary'}>
                          {module.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/modules/${module.id}/versions`} className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500 text-slate-300 hover:bg-slate-800 active:bg-slate-700 focus-visible:ring-offset-slate-900 h-8 px-3 text-sm">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
