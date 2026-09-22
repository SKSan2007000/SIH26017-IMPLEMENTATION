import type { AnalyticsSnapshot } from '@/types';
import { MOCK_PROJECTS } from './projects';
import { MOCK_RISKS } from './risks';
import { PROJECT_STAGES } from '@/types';
import { intBetween, mulberry32 } from './_generators';

function generate(): AnalyticsSnapshot {
  const rng = mulberry32(662281);
  const states = Array.from(new Set(MOCK_PROJECTS.map((p) => p.state)));
  const districts = Array.from(new Set(MOCK_PROJECTS.map((p) => p.district)));
  const bandCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  Object.values(MOCK_RISKS).forEach((r) => (bandCounts[r.band] += 1));

  return {
    stateWiseDelayDays: states.map((state) => ({ state, avgDelayDays: intBetween(rng, 15, 210) })),
    districtWiseDelayDays: districts.map((district) => ({ district, avgDelayDays: intBetween(rng, 10, 190) })),
    stageWiseDelayDays: PROJECT_STAGES.map((stage) => ({ stage, avgDelayDays: intBetween(rng, 5, 95) })),
    riskDistribution: [
      { band: 'critical', count: bandCounts.critical },
      { band: 'high', count: bandCounts.high },
      { band: 'medium', count: bandCounts.medium },
      { band: 'low', count: bandCounts.low },
    ],
    avgAcquisitionDurationMonths: intBetween(rng, 14, 22),
    stakeholderResponseRatePct: intBetween(rng, 58, 84),
    compensationProgressPct: intBetween(rng, 40, 76),
    documentCompletionPct: intBetween(rng, 55, 88),
    verificationWorkload: [
      { officer: 'Survey Officer', pending: intBetween(rng, 2, 9) },
      { officer: 'Legal Officer', pending: intBetween(rng, 1, 6) },
      { officer: 'Finance Officer', pending: intBetween(rng, 1, 8) },
      { officer: 'Field Officer', pending: intBetween(rng, 4, 14) },
    ],
  };
}

export const MOCK_ANALYTICS: AnalyticsSnapshot = generate();
