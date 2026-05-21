import { createServiceRoleClient } from '@/lib/supabase/server';
import type { DepartmentBattle } from '@/types/database';

interface CreateBattleConfig {
  name: string;
  departments: string[];
  metric: 'total_points' | 'completion_rate' | 'avg_score';
  start_date: string;
  end_date: string;
}

export async function createBattle(
  orgId: string,
  config: CreateBattleConfig,
  userId: string
): Promise<DepartmentBattle> {
  const client = await createServiceRoleClient();

  const { data, error } = await client
    .from('department_battles')
    .insert({
      org_id: orgId,
      name: config.name,
      departments: config.departments,
      metric: config.metric,
      start_date: config.start_date,
      end_date: config.end_date,
      status: 'upcoming',
      created_by: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

interface BattleStanding {
  department: string;
  score: number;
  rank: number;
}

export async function getBattleStandings(
  battleId: string
): Promise<BattleStanding[]> {
  const client = await createServiceRoleClient();

  // Get battle info
  const { data: battle } = await client
    .from('department_battles')
    .select()
    .eq('id', battleId)
    .single();

  if (!battle) throw new Error('Battle not found');

  const standings: BattleStanding[] = [];

  for (const department of battle.departments) {
    let score = 0;

    if (battle.metric === 'total_points') {
      const { data: entries } = await client
        .from('leaderboard')
        .select('total_points')
        .eq('org_id', battle.org_id)
        .eq('department', department)
        .eq('scope', 'department');

      score = entries?.reduce((sum, e) => sum + e.total_points, 0) || 0;
    } else if (battle.metric === 'completion_rate') {
      const { data: orgMembers } = await client
        .from('org_memberships')
        .select('user_id')
        .eq('org_id', battle.org_id)
        .eq('department', department);

      const memberIds = orgMembers?.map((m) => m.user_id) || [];

      if (memberIds.length > 0) {
        const { data: completed } = await client
          .from('progress')
          .select()
          .eq('org_id', battle.org_id)
          .in('user_id', memberIds)
          .eq('status', 'completed');

        score = memberIds.length > 0 ? (completed?.length || 0) / memberIds.length : 0;
      }
    } else if (battle.metric === 'avg_score') {
      const { data: entries } = await client
        .from('leaderboard')
        .select('modules_completed')
        .eq('org_id', battle.org_id)
        .eq('department', department)
        .eq('scope', 'department');

      const totalModules = entries?.reduce((sum, e) => sum + e.modules_completed, 0) || 0;
      const count = entries?.length || 1;
      score = totalModules / count;
    }

    standings.push({ department, score, rank: 0 });
  }

  // Sort by score descending and assign ranks
  standings.sort((a, b) => b.score - a.score);
  standings.forEach((s, i) => (s.rank = i + 1));

  return standings;
}

export async function completeBattle(battleId: string): Promise<DepartmentBattle> {
  const client = await createServiceRoleClient();

  // Get current standings
  const standings = await getBattleStandings(battleId);

  // Winner is rank 1
  const winner = standings.length > 0 ? standings[0].department : null;

  const { data, error } = await client
    .from('department_battles')
    .update({
      status: 'completed',
      winner_department: winner,
      updated_at: new Date().toISOString(),
    })
    .eq('id', battleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
