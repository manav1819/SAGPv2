import { NextRequest, NextResponse } from 'next/server';
import { evaluateResponse } from '@/services/EvaluationService';
import type { EvaluationRequest } from '@/types/game';

export async function POST(req: NextRequest) {
  try {
    const body: EvaluationRequest = await req.json();

    if (!body.scenarioId || !body.nodeId || body.playerInput === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await evaluateResponse(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/game/evaluate]', err);
    return NextResponse.json({ error: 'Internal evaluation error' }, { status: 500 });
  }
}
