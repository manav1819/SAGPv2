import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ComplianceFramework, ComplianceReport } from '@/types/database';

interface ComplianceData {
  framework: ComplianceFramework;
  total_modules: number;
  required_modules: number;
  completion_pct: number;
  users_compliant: number;
  users_total: number;
  generated_at: string;
  details: Record<string, unknown>;
}

export async function generateComplianceReport(
  orgId: string,
  framework: ComplianceFramework,
  generatedBy: string
): Promise<ComplianceReport> {
  const client = await createServiceRoleClient();

  // Get all modules tagged with this framework
  const { data: modules } = await client
    .from('modules')
    .select()
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .eq('is_active', true);

  const requiredModules =
    modules?.filter((m) => m.compliance_tags.includes(framework)) || [];

  // Get all org members
  const { data: members } = await client
    .from('org_memberships')
    .select('user_id')
    .eq('org_id', orgId);

  const userIds = members?.map((m) => m.user_id) || [];

  // Check compliance for each user
  let compliantCount = 0;

  for (const userId of userIds) {
    const { data: completed } = await client
      .from('progress')
      .select()
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .in(
        'module_id',
        requiredModules.map((m) => m.id)
      );

    if (
      completed &&
      completed.length === requiredModules.length &&
      requiredModules.length > 0
    ) {
      compliantCount++;
    }
  }

  const completionPct =
    userIds.length > 0 ? (compliantCount / userIds.length) * 100 : 0;

  const reportData: ComplianceData = {
    framework,
    total_modules: modules?.length || 0,
    required_modules: requiredModules.length,
    completion_pct: Math.round(completionPct),
    users_compliant: compliantCount,
    users_total: userIds.length,
    generated_at: new Date().toISOString(),
    details: {
      deadline: getFrameworkDeadline(framework),
      requirements: getFrameworkRequirements(framework),
    },
  };

  const { data, error } = await client
    .from('compliance_reports')
    .insert({
      org_id: orgId,
      framework,
      report_data: reportData,
      generated_by: generatedBy,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCompletionMatrix(
  orgId: string,
  framework: ComplianceFramework
): Promise<Array<{ user_id: string; email: string; completed: number; total: number; percentage: number }>> {
  const client = await createServiceRoleClient();

  // Get required modules for framework
  const { data: modules } = await client
    .from('modules')
    .select()
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .eq('is_active', true);

  const requiredModules =
    modules?.filter((m) => m.compliance_tags.includes(framework)) || [];

  // Get all org members with their profiles
  const { data: memberships } = await client
    .from('org_memberships')
    .select('user_id, users: id (email)')
    .eq('org_id', orgId);

  const matrix: Array<{
    user_id: string;
    email: string;
    completed: number;
    total: number;
    percentage: number;
  }> = [];

  for (const membership of memberships || []) {
    const userId = membership.user_id;
    const email = (membership.users as any)?.email || 'unknown';

    const { data: completed } = await client
      .from('progress')
      .select()
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .in(
        'module_id',
        requiredModules.map((m) => m.id)
      );

    const completedCount = completed?.length || 0;
    const totalRequired = requiredModules.length;
    const percentage =
      totalRequired > 0 ? (completedCount / totalRequired) * 100 : 0;

    matrix.push({
      user_id: userId,
      email,
      completed: completedCount,
      total: totalRequired,
      percentage: Math.round(percentage),
    });
  }

  return matrix;
}

function getFrameworkDeadline(framework: ComplianceFramework): string {
  // Return typical compliance deadline dates
  const today = new Date();

  switch (framework) {
    case 'NIST':
      return 'Continuous';
    case 'ISO27001':
      return `${today.getFullYear()}-12-31`;
    case 'SOC2':
      return `${today.getFullYear()}-12-31`;
    case 'PCI_DSS':
      return `${today.getFullYear()}-06-30`;
    case 'HIPAA':
      return 'Continuous';
    default:
      return 'Unknown';
  }
}

function getFrameworkRequirements(framework: ComplianceFramework): string[] {
  switch (framework) {
    case 'NIST':
      return [
        'Phishing Awareness',
        'Password Security',
        'Incident Reporting',
      ];
    case 'ISO27001':
      return [
        'Information Security Fundamentals',
        'Data Handling',
        'Access Control',
      ];
    case 'SOC2':
      return [
        'Security Awareness',
        'Confidentiality',
        'Availability',
      ];
    case 'PCI_DSS':
      return [
        'Cardholder Data Protection',
        'Secure Networks',
        'Vulnerability Management',
      ];
    case 'HIPAA':
      return [
        'ePHI Protection',
        'Breach Notification',
        'Privacy Training',
      ];
    default:
      return [];
  }
}
