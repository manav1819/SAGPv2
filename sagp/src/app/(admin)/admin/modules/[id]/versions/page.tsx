'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcw, Download, Eye } from 'lucide-react';

const mockVersions = [
  {
    id: 'v1',
    versionNumber: '3.1',
    createdAt: '2024-03-09T14:30:00Z',
    changeNotes: 'Added new phishing examples, improved UI',
    createdBy: 'admin@company.com',
    active: true,
  },
  {
    id: 'v2',
    versionNumber: '3.0',
    createdAt: '2024-02-15T10:20:00Z',
    changeNotes: 'Major redesign, added interactive elements',
    createdBy: 'content@company.com',
    active: false,
  },
  {
    id: 'v3',
    versionNumber: '2.5',
    createdAt: '2024-01-30T09:15:00Z',
    changeNotes: 'Bug fixes and performance improvements',
    createdBy: 'admin@company.com',
    active: false,
  },
  {
    id: 'v4',
    versionNumber: '2.0',
    createdAt: '2024-01-10T16:45:00Z',
    changeNotes: 'Content update, added new scenarios',
    createdBy: 'content@company.com',
    active: false,
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VersionsPage() {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[
          { label: 'Modules', href: '/admin/modules' },
          { label: 'Version History' },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Version Table */}
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>All module versions with change history</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVersions.map((version) => (
                    <React.Fragment key={version.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedVersion(expandedVersion === version.id ? null : version.id)
                        }
                      >
                        <TableCell className="font-mono font-medium">{version.versionNumber}</TableCell>
                        <TableCell className="text-sm text-slate-400">
                          {formatDate(version.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">{version.createdBy}</TableCell>
                        <TableCell className="text-sm text-slate-300">{version.changeNotes}</TableCell>
                        <TableCell>
                          {version.active && (
                            <Badge variant="success">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!version.active && (
                              <Button variant="ghost" size="sm" title="Restore this version">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      {expandedVersion === version.id && (
                        <TableRow className="bg-slate-800/50">
                          <TableCell colSpan={6} className="py-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-slate-300 mb-2">Change Notes</p>
                                <p className="text-sm text-slate-400">{version.changeNotes}</p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-slate-300 mb-2">
                                  Diff Preview (Simplified)
                                </p>
                                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-xs space-y-1">
                                  <div className="text-red-400">
                                    - Removed: Old question format
                                  </div>
                                  <div className="text-green-400">
                                    + Added: New interactive elements
                                  </div>
                                  <div className="text-blue-400">
                                    ~ Modified: UI styling
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm">
                                  View Full Diff
                                </Button>
                                {!version.active && (
                                  <Button variant="primary" size="sm">
                                    Restore Version
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Version Control Info */}
          <Card>
            <CardHeader>
              <CardTitle>About Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                Each version is automatically created when you save module changes. You can restore
                previous versions at any time, which will make that version the active one for all new
                learners. Current active version is marked in green.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
