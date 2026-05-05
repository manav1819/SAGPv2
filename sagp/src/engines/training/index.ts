import { createServiceRoleClient } from '@/lib/supabase/server';
import type {
  Module,
  ModuleVersion,
  Progress,
  OrgMembership,
} from '@/types/database';

interface CreateModuleData {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  game_type: 'quiz' | 'phishing_sim' | 'scenario' | 'drag_drop';
  points_value: number;
  estimated_mins: number;
  compliance_tags: string[];
  prerequisites: string[];
  org_id?: string;
}

interface UpdateModuleData {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points_value?: number;
  estimated_mins?: number;
  compliance_tags?: string[];
  prerequisites?: string[];
  change_notes?: string;
}

interface ModuleWithVersion extends Module {
  version?: ModuleVersion;
}

interface ListModulesFilters {
  category?: string;
  difficulty?: string;
  compliance_tags?: string[];
  is_active?: boolean;
}

export async function createModule(
  data: CreateModuleData,
  userId: string
): Promise<Module> {
  const client = await createServiceRoleClient();

  const { data: module, error: moduleError } = await client
    .from('modules')
    .insert({
      ...data,
      created_by: userId,
      is_active: true,
    })
    .select()
    .single();

  if (moduleError) throw moduleError;

  // Create initial version
  await client.from('module_versions').insert({
    module_id: module.id,
    version_number: 1,
    content: {},
    change_notes: 'Initial version',
    created_by: userId,
  });

  return module;
}

export async function updateModule(
  moduleId: string,
  data: UpdateModuleData,
  userId: string
): Promise<Module> {
  const client = await createServiceRoleClient();

  // Get current module
  const { data: currentModule, error: fetchError } = await client
    .from('modules')
    .select()
    .eq('id', moduleId)
    .single();

  if (fetchError) throw fetchError;

  // Update module
  const { data: updated, error: updateError } = await client
    .from('modules')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Create new version if content changed
  if (data.change_notes) {
    const { data: latestVersion } = await client
      .from('module_versions')
      .select()
      .eq('module_id', moduleId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    await client.from('module_versions').insert({
      module_id: moduleId,
      version_number: nextVersion,
      content: data,
      change_notes: data.change_notes,
      created_by: userId,
    });
  }

  return updated;
}

export async function getModuleWithVersion(
  moduleId: string
): Promise<ModuleWithVersion> {
  const client = await createServiceRoleClient();

  const { data: module, error: moduleError } = await client
    .from('modules')
    .select()
    .eq('id', moduleId)
    .single();

  if (moduleError) throw moduleError;

  const { data: version } = await client
    .from('module_versions')
    .select()
    .eq('module_id', moduleId)
    .eq('is_active', true)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  return { ...module, version: version || undefined };
}

export async function listModules(
  orgId: string,
  filters?: ListModulesFilters
): Promise<Module[]> {
  const client = await createServiceRoleClient();

  let query = client
    .from('modules')
    .select()
    .or(`org_id.eq.${orgId},org_id.is.null`);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.compliance_tags && filters.compliance_tags.length > 0) {
    // Filter modules that have any of the compliance tags
    const { data: modules, error } = await query;
    if (error) throw error;
    return modules?.filter((m) =>
      filters.compliance_tags?.some((tag) =>
        m.compliance_tags.includes(tag)
      )
    ) || [];
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  });

  if (error) throw error;
  return data || [];
}

export async function checkPrerequisites(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const client = await createServiceRoleClient();

  const { data: module, error: moduleError } = await client
    .from('modules')
    .select('prerequisites')
    .eq('id', moduleId)
    .single();

  if (moduleError) throw moduleError;

  if (!module?.prerequisites || module.prerequisites.length === 0) {
    return true;
  }

  // Check if user has completed all prerequisites
  const { data: completed, error: progressError } = await client
    .from('progress')
    .select('module_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('module_id', module.prerequisites);

  if (progressError) throw progressError;

  const completedIds = completed?.map((p) => p.module_id) || [];
  return module.prerequisites.every((prereq: string) =>
    completedIds.includes(prereq)
  );
}

export async function toggleModuleActive(
  moduleId: string
): Promise<Module> {
  const client = await createServiceRoleClient();

  const { data: current } = await client
    .from('modules')
    .select('is_active')
    .eq('id', moduleId)
    .single();

  const { data, error } = await client
    .from('modules')
    .update({
      is_active: !current?.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getModuleVersions(moduleId: string): Promise<ModuleVersion[]> {
  const client = await createServiceRoleClient();

  const { data, error } = await client
    .from('module_versions')
    .select()
    .eq('module_id', moduleId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function restoreVersion(
  moduleId: string,
  versionId: string,
  userId: string
): Promise<ModuleVersion> {
  const client = await createServiceRoleClient();

  const { data: targetVersion, error: versionError } = await client
    .from('module_versions')
    .select()
    .eq('id', versionId)
    .eq('module_id', moduleId)
    .single();

  if (versionError) throw versionError;

  // Create new version from old one
  const { data: latestVersion } = await client
    .from('module_versions')
    .select('version_number')
    .eq('module_id', moduleId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestVersion?.version_number || 0) + 1;

  const { data: restored, error: restoreError } = await client
    .from('module_versions')
    .insert({
      module_id: moduleId,
      version_number: nextVersion,
      content: targetVersion.content,
      change_notes: `Restored from version ${targetVersion.version_number}`,
      created_by: userId,
    })
    .select()
    .single();

  if (restoreError) throw restoreError;
  return restored;
}

export async function assignModuleToOrg(
  moduleId: string,
  orgId: string
): Promise<Module> {
  const client = await createServiceRoleClient();

  const { data, error } = await client
    .from('modules')
    .update({
      org_id: orgId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
