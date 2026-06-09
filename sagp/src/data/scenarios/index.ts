import type { Scenario } from '@/types/game';
import { scenario01 } from './scenario01_nigerian-prince';
import { scenario02 } from './scenario02_fake-it-support';
import { scenario03 } from './scenario03_payroll-verification';
import { scenario04 } from './scenario04_ceo-gift-card';
import { scenario05 } from './scenario05_vendor-invoice-fraud';
import { scenario06 } from './scenario06_mfa-approval';
import { scenario07 } from './scenario07_helpdesk-reset';
import { scenario08 } from './scenario08_deepfake-executive';

export const SCENARIOS: Scenario[] = [
  scenario01, scenario02, scenario03, scenario04,
  scenario05, scenario06, scenario07, scenario08,
];

export const SCENARIO_MAP: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);

export function getScenario(id: string): Scenario | null {
  return SCENARIO_MAP[id] ?? null;
}
