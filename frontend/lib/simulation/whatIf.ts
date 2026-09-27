import type { WhatIfLever } from '@/types';
import { getMockRisk } from '@/lib/mock/risks';

const LEVER_IMPACT: Record<WhatIfLever['id'], { label: string; deltaPct: number }> = {
  resolve_documents: { label: 'Resolve pending documents', deltaPct: -13 },
  resolve_disputes: { label: 'Resolve legal disputes', deltaPct: -9 },
  more_field_officers: { label: 'Increase field officers', deltaPct: -6 },
  more_verification_capacity: { label: 'Increase verification capacity', deltaPct: -8 },
  alternate_route: { label: 'Select alternate route', deltaPct: -13 },
};

export const WHAT_IF_LEVER_DEFS: { id: WhatIfLever['id']; label: string }[] = (
  Object.keys(LEVER_IMPACT) as WhatIfLever['id'][]
).map((id) => ({ id, label: LEVER_IMPACT[id].label }));

/**
 * Deterministic SIMULATED ESTIMATE of risk change under a combination of
 * interventions. This is a decision-support illustration, not a model
 * prediction — every caller must label results "SIMULATED ESTIMATE" and
 * never present them as an automated decision.
 */
export function simulateWhatIf(projectId: string, leverIds: WhatIfLever['id'][]): WhatIfLever[] {
  const base = getMockRisk(projectId)?.overallPct ?? 50;
  let running = base;
  return leverIds.map((id) => {
    running = Math.max(5, running + LEVER_IMPACT[id].deltaPct);
    return { id, label: LEVER_IMPACT[id].label, resultingRiskPct: Math.round(running) };
  });
}

export function currentRiskFor(projectId: string): number {
  return getMockRisk(projectId)?.overallPct ?? 50;
}
