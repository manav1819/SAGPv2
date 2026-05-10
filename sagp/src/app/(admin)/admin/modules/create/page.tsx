'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge-ui';
import { Eye, Save } from 'lucide-react';

const CATEGORIES = ['phishing', 'passwords', 'social_engineering', 'malware', 'insider_threat', 'device_security', 'data_handling'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const GAME_TYPES = [
  { value: 'quiz', label: 'Quiz', description: 'Traditional multiple choice questions' },
  { value: 'phishing_sim', label: 'Phishing Simulation', description: 'Email phishing simulation' },
  { value: 'scenario', label: 'Scenario', description: 'Real-world scenario based learning' },
  { value: 'drag_drop', label: 'Drag & Drop', description: 'Interactive drag and drop activities' },
];
const COMPLIANCE_FRAMEWORKS = ['NIST', 'ISO27001', 'SOC2', 'PCI-DSS', 'HIPAA'];
const PREREQUISITES = ['Phishing 101', 'Security Basics', 'Password Best Practices'];

export default function CreateModulePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'phishing',
    difficulty: 'medium',
    gameType: 'quiz',
    complianceTags: [] as string[],
    prerequisites: [] as string[],
    pointsValue: 100,
    estimatedMins: 10,
  });

  const [contentJson, setContentJson] = useState('{}');
  const [selectedComplianceTab, setSelectedComplianceTab] = useState('NIST');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleComplianceTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      complianceTags: prev.complianceTags.includes(tag)
        ? prev.complianceTags.filter((t) => t !== tag)
        : [...prev.complianceTags, tag],
    }));
  };

  const togglePrerequisite = (prereq: string) => {
    setFormData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.includes(prereq)
        ? prev.prerequisites.filter((p) => p !== prereq)
        : [...prev.prerequisites, prereq],
    }));
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[
          { label: 'Modules', href: '/admin/modules' },
          { label: 'Create' },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Module title, description, and category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Module Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-base text-slate-100 placeholder-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  name="description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Game Type */}
          <Card>
            <CardHeader>
              <CardTitle>Game Type</CardTitle>
              <CardDescription>Select how users will interact with this module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {GAME_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData((prev) => ({ ...prev, gameType: type.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.gameType === type.value
                        ? 'border-teal-500 bg-teal-600/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <p className="font-medium text-slate-100">{type.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Prerequisites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Compliance Frameworks
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLIANCE_FRAMEWORKS.map((framework) => (
                    <button
                      key={framework}
                      onClick={() => toggleComplianceTag(framework)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        formData.complianceTags.includes(framework)
                          ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:border-slate-500'
                      }`}
                    >
                      {framework}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Prerequisites</label>
                <div className="space-y-2">
                  {PREREQUISITES.map((prereq) => (
                    <label key={prereq} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.prerequisites.includes(prereq)}
                        onChange={() => togglePrerequisite(prereq)}
                        className="rounded border-slate-600 bg-slate-800 text-teal-600"
                      />
                      <span className="text-sm text-slate-300">{prereq}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points & Duration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Points Value"
                  type="number"
                  name="pointsValue"
                  value={formData.pointsValue}
                  onChange={handleInputChange}
                  min="0"
                />
                <Input
                  label="Estimated Time (minutes)"
                  type="number"
                  name="estimatedMins"
                  value={formData.estimatedMins}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content (JSON)</CardTitle>
              <CardDescription>Raw module content in JSON format</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                rows={10}
                value={contentJson}
                onChange={(e) => setContentJson(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Module
            </Button>
            <Button variant="secondary" size="md" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
