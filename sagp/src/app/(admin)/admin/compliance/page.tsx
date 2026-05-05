'use client';

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-ui';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, FileText } from 'lucide-react';

const FRAMEWORKS = ['NIST', 'ISO27001', 'SOC2', 'PCI-DSS', 'HIPAA'];

const mockComplianceData = {
  NIST: [
    { requirement: 'AT-1: Security Awareness Program', status: 'compliant', coverage: 95 },
    { requirement: 'AT-2: Security Training', status: 'compliant', coverage: 92 },
    { requirement: 'AT-3: Role-Based Training', status: 'partial', coverage: 78 },
    { requirement: 'AT-4: Security Awareness Refresher', status: 'compliant', coverage: 88 },
  ],
  ISO27001: [
    { requirement: 'A.7.2.1: Information Security Awareness', status: 'compliant', coverage: 93 },
    { requirement: 'A.7.2.2: User Responsibilities', status: 'compliant', coverage: 90 },
    { requirement: 'A.7.2.3: Incident Reporting', status: 'partial', coverage: 82 },
  ],
  SOC2: [
    { requirement: 'CC6.2: Security Awareness', status: 'compliant', coverage: 91 },
    { requirement: 'CC7.2: Training Requirements', status: 'compliant', coverage: 89 },
    { requirement: 'CC7.3: Security Procedures', status: 'partial', coverage: 85 },
  ],
  'PCI-DSS': [
    { requirement: 'Req 12.6: Security Policy', status: 'compliant', coverage: 94 },
    { requirement: 'Req 12.6.1: Train Personnel', status: 'compliant', coverage: 91 },
    { requirement: 'Req 12.6.2: Acknowledge Policy', status: 'compliant', coverage: 96 },
  ],
  HIPAA: [
    { requirement: '§ 164.308(a)(5): Security Awareness Training', status: 'compliant', coverage: 92 },
    { requirement: '§ 164.308(a)(5)(i): General Training', status: 'compliant', coverage: 94 },
    { requirement: '§ 164.308(a)(5)(ii): Security Reminders', status: 'partial', coverage: 80 },
  ],
};

const employeeComplianceStatus = [
  {
    name: 'Alice Johnson',
    email: 'alice@company.com',
    nist: 'completed',
    iso27001: 'completed',
    soc2: 'in_progress',
    pci: 'completed',
    hipaa: 'pending',
  },
  {
    name: 'Bob Smith',
    email: 'bob@company.com',
    nist: 'completed',
    iso27001: 'completed',
    soc2: 'completed',
    pci: 'completed',
    hipaa: 'completed',
  },
  {
    name: 'Carol White',
    email: 'carol@company.com',
    nist: 'in_progress',
    iso27001: 'pending',
    soc2: 'pending',
    pci: 'completed',
    hipaa: 'pending',
  },
  {
    name: 'David Lee',
    email: 'david@company.com',
    nist: 'completed',
    iso27001: 'completed',
    soc2: 'completed',
    pci: 'in_progress',
    hipaa: 'completed',
  },
  {
    name: 'Eva Martinez',
    email: 'eva@company.com',
    nist: 'pending',
    iso27001: 'pending',
    soc2: 'pending',
    pci: 'pending',
    hipaa: 'pending',
  },
];

function getStatusColor(status: string): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    default:
      return 'secondary';
  }
}

function getComplianceStatusColor(
  status: string
): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'compliant':
      return 'success';
    case 'partial':
      return 'warning';
    default:
      return 'secondary';
  }
}

export default function CompliancePage() {
  const [activeFramework, setActiveFramework] = useState('NIST');

  const data =
    mockComplianceData[activeFramework as keyof typeof mockComplianceData] || [];

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Compliance' }]}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="secondary" size="md" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Framework Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>
                Framework requirements and organizational coverage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Framework Tabs */}
              <div className="flex gap-2 border-b border-slate-700 pb-4">
                {FRAMEWORKS.map((framework) => (
                  <button
                    key={framework}
                    onClick={() => setActiveFramework(framework)}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                      activeFramework === framework
                        ? 'bg-slate-700 text-teal-300 border-b-2 border-teal-500'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {framework}
                  </button>
                ))}
              </div>

              {/* Requirements Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((req, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-slate-100">
                        {req.requirement}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getComplianceStatusColor(req.status)}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full"
                              style={{ width: `${req.coverage}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-300">{req.coverage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Employee Completion Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Compliance Status</CardTitle>
              <CardDescription>
                Training completion status per employee and framework
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>NIST</TableHead>
                      <TableHead>ISO27001</TableHead>
                      <TableHead>SOC2</TableHead>
                      <TableHead>PCI-DSS</TableHead>
                      <TableHead>HIPAA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeComplianceStatus.map((emp) => (
                      <TableRow key={emp.email}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(emp.nist)}>
                            {emp.nist.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(emp.iso27001)}>
                            {emp.iso27001.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(emp.soc2)}>
                            {emp.soc2.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(emp.pci)}>
                            {emp.pci.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(emp.hipaa)}>
                            {emp.hipaa.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Framework Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {FRAMEWORKS.map((framework) => {
              const frameworkData =
                mockComplianceData[
                  framework as keyof typeof mockComplianceData
                ] || [];
              const compliantCount = frameworkData.filter(
                (r) => r.status === 'compliant'
              ).length;
              const avgCoverage =
                frameworkData.reduce((sum, r) => sum + r.coverage, 0) /
                frameworkData.length;

              return (
                <Card key={framework}>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-300">{framework}</p>
                    <p className="text-3xl font-bold text-teal-400 mt-3">
                      {compliantCount}/{frameworkData.length}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {avgCoverage.toFixed(0)}% avg coverage
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
