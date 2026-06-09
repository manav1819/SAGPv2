import { NextRequest, NextResponse } from 'next/server';
import { SCENARIOS, getScenario } from '@/data/scenarios';

/** GET /api/game/scenarios — returns full scenario list (without audio urls) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const scenario = getScenario(id);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }
    return NextResponse.json(scenario);
  }

  // Return lightweight list for lobby
  const list = SCENARIOS.map(({ id, title, difficulty, description, attackerPersona, xpMultiplier, tags, estimatedDurationSecs, coverImageKey }) => ({
    id, title, difficulty, description, attackerPersona, xpMultiplier, tags, estimatedDurationSecs, coverImageKey,
  }));

  return NextResponse.json(list);
}
