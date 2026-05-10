'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, Calendar } from 'lucide-react';

const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-03-09 15:45:32',
    actor: 'admin@company.com',
    action: 'Module Created',
    entity: 'modules',
    entityId: 'mod_456',
    entityName: 'Advanced Phishing Detection',
    ipAddress: '192.168.1.100',
    severity: 'info',
  },
  {
    id: '2',
    timestamp: '2024-03-09 14:30:15',
    actor: 'sarah@company.com',
    action: 'User Deactivated',
    entity: 'users',
    entityId: 'usr_789',
    entityName: 'john.doe@company.com',
    ipAddress: '192.168.1.105',
    severity: 'warning',
  },
  {
    id: '3',
    timestamp: '2024-03-09 12:15:42',
    actor: 'admin@company.com',
    action: 'Settings Updated',
    entity: 'organization',
    entityId: 'org_123',
    entityName: 'SSO Configuration',
    ipAddress: '192.168.1.100',
    severity: 'critical',
  },
  {
    id: '4',
    timestamp: '2024-03-09 10:20:10',
    actor: 'content@company.com',
    action: 'Module Version Created',
    entity: 'module_versions',
    entityId: 'ver_321',
    entityName: 'Phishing 101 v3.1',
    ipAddress: '192.168.1.110',
    severity: 'info',
  },
  {
    id: '5',
    timestamp: '2024-03-08 16:45:30',
    actor: 'admin@company.com',
    action: 'Campaign Started',
    entity: 'phishing_campaigns',
    entityId: 'camp_555',
    entityName: 'March Security Awareness',
    ipAddress: '192.168.1.100',
    severity: 'info',
  },
  {
    id: '6',
    timestamp: '2024-03-08 14:20:15',
    actor: 'manager@company.com',
    action: 'Bulk User Import',
    entity: 'users',
    entityId: null,
    entityName: '25 users imported',
    ipAddress: '192.168.1.115',
    severity: 'warning',
  },
  {
    id: '7',
    timestamp: '2024-03-08 11:30:45',
    actor: 'superadmin@company.com',
    action: 'Admin Privileges Granted',
    entity: 'org_membership',
    entityId: 'mem_987',
    entityName: 'sarah@company.com',
    ipAddress: '192.168.1.120',
    severity: 'critical',
  },
  {
    id: '8',
    timestamp: '2024-03-07 15:10:20',
    actor: 'admin@company.com',
    action: 'Report Generated',
    entity: 'reports',
    entityId: 'rpt_654',
    entityName: 'Compliance Report - Q1',
    ipAddress: '192.168.1.100',
    severity: 'info',
  },
];

const ACTIONS = ['All', 'Created', 'Updated', 'Deleted', 'Deactivated', 'Imported', 'Exported'];
const ENTITIES = ['All', 'Users', 'Modules', 'Campaigns', 'Organization', 'Reports'];

function getSeverityColor(
  severity: string
): 'success' | 'info' | 'warning' | 'critical' {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'success';
  }
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch = log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'All' ||
      log.action.toLowerCase().includes(selectedAction.toLowerCase());
    const matchesEntity = selectedEntity === 'All' ||
      log.entity.toLowerCase().includes(selectedEntity.toLowerCase());
    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Audit Log' }]}
        actions={
          <Button variant="secondary" size="md" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  {ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </Select>

                <Select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                >
                  {ENTITIES.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </Select>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pl-10 text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Events</CardTitle>
              <CardDescription>System activity and administrative actions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm font-mono text-slate-400">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="text-sm">{log.actor}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-sm text-slate-300">{log.entity}</TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="text-slate-100">{log.entityName}</p>
                          {log.entityId && (
                            <p className="text-xs text-slate-500 font-mono">
                              {log.entityId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-400">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSeverityColor(log.severity)}
                        >
                          {log.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-400">Total Events</p>
                <p className="text-3xl font-bold text-slate-100 mt-2">
                  {mockAuditLogs.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-400">Critical Events</p>
                <p className="text-3xl font-bold text-red-400 mt-2">
                  {mockAuditLogs.filter((l) => l.severity === 'critical').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-400">Warnings</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  {mockAuditLogs.filter((l) => l.severity === 'warning').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-400">Unique Actors</p>
                <p className="text-3xl font-bold text-teal-400 mt-2">
                  {new Set(mockAuditLogs.map((l) => l.actor)).size}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
