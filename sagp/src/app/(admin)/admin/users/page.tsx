'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Card, CardContent } from '@/components/ui/card';
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
import { Avatar } from '@/components/ui/avatar';
import { Search, Plus, Upload, MoreVertical } from 'lucide-react';

const mockUsers = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@company.com',
    role: 'employee',
    department: 'Engineering',
    status: 'active',
    lastLogin: '2024-03-09 14:30',
    riskTier: 'low',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@company.com',
    role: 'manager',
    department: 'Sales',
    status: 'active',
    lastLogin: '2024-03-08 10:15',
    riskTier: 'medium',
  },
  {
    id: '3',
    name: 'Carol White',
    email: 'carol@company.com',
    role: 'employee',
    department: 'HR',
    status: 'inactive',
    lastLogin: '2024-02-20 09:00',
    riskTier: 'high',
  },
  {
    id: '4',
    name: 'David Lee',
    email: 'david@company.com',
    role: 'org_admin',
    department: 'IT',
    status: 'active',
    lastLogin: '2024-03-09 16:45',
    riskTier: 'low',
  },
  {
    id: '5',
    name: 'Eva Martinez',
    email: 'eva@company.com',
    role: 'employee',
    department: 'Finance',
    status: 'active',
    lastLogin: '2024-03-07 11:20',
    riskTier: 'critical',
  },
];

const DEPARTMENTS = ['Engineering', 'Sales', 'HR', 'IT', 'Finance', 'Legal'];
const ROLES = ['employee', 'manager', 'org_admin'];

function getRiskColor(tier: string): 'low' | 'medium' | 'high' | 'critical' {
  return (tier as 'low' | 'medium' | 'high' | 'critical');
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesDept = selectedDepartment === 'all' || user.department === selectedDepartment;
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminTopBar
        breadcrumbs={[{ label: 'Users' }]}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Risk Tier</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-slate-700/30"
                      onClick={() => {
                        // Navigate to per-user report
                        window.location.href = `/admin/reports/${user.id}`;
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} />
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.department}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant={getRiskColor(user.riskTier)}>{user.riskTier}</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="text-sm text-slate-400">
            Showing {filteredUsers.length} of {mockUsers.length} users
          </div>
        </div>
      </div>
    </div>
  );
}
