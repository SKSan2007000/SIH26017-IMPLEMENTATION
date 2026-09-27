import type { RiskScore, RiskBand, CategoryRisk } from '@/types';
import { MOCK_PROJECTS } from './projects';
import { intBetween, mulberry32 } from './_generators';

function bandFor(pct: number): RiskBand {
  if (pct >= 80) return 'critical';
  if (pct >= 60) return 'high';
  if (pct >= 35) return 'medium';
  return 'low';
}

const CATEGORY_NAMES: CategoryRisk['name'][] = [
  'Legal Dispute',
  'Documentation',
  'Compensation',
  'Approval',
  'Stakeholder Response',
  'Rehabilitation',
  'Possession',
  'Administrative Coordination',
];

// Hand-authored hero risk scores — match the exact demo figures from the brief.
const HERO_RISKS: Record<string, RiskScore> = {
  'PRJ-1042': {
    projectId: 'PRJ-1042',
    overallPct: 87,
    band: 'critical',
    predictedDelayLabel: '+5 months',
    confidencePct: 88,
    trend: [42, 48, 61, 73, 87],
    trendStatus: 'RAPIDLY DETERIORATING',
    categories: [
      { name: 'Legal Dispute', pct: 82 },
      { name: 'Documentation', pct: 67 },
      { name: 'Compensation', pct: 74 },
      { name: 'Approval', pct: 58 },
      { name: 'Stakeholder Response', pct: 71 },
      { name: 'Rehabilitation', pct: 49 },
      { name: 'Possession', pct: 63 },
      { name: 'Administrative Coordination', pct: 44 },
    ],
    drivers: [
      { label: 'Pending legal disputes', contributionPct: 24 },
      { label: 'Compensation delays', contributionPct: 19 },
      { label: 'Incomplete documentation', contributionPct: 16 },
      { label: 'Approval bottleneck', contributionPct: 13 },
      { label: 'Stakeholder non-response', contributionPct: 9 },
      { label: 'Administrative coordination', contributionPct: 7 },
    ],
    originalCompletionMonths: 18,
    predictedCompletionMonths: 23,
  },
  'PRJ-1078': {
    projectId: 'PRJ-1078',
    overallPct: 61,
    band: 'high',
    predictedDelayLabel: '+2 months',
    confidencePct: 76,
    trend: [30, 38, 44, 52, 61],
    trendStatus: 'DETERIORATING',
    categories: [
      { name: 'Legal Dispute', pct: 41 },
      { name: 'Documentation', pct: 58 },
      { name: 'Compensation', pct: 62 },
      { name: 'Approval', pct: 45 },
      { name: 'Stakeholder Response', pct: 55 },
      { name: 'Rehabilitation', pct: 38 },
      { name: 'Possession', pct: 40 },
      { name: 'Administrative Coordination', pct: 33 },
    ],
    drivers: [
      { label: 'Compensation delays', contributionPct: 22 },
      { label: 'Stakeholder non-response', contributionPct: 18 },
      { label: 'Incomplete documentation', contributionPct: 15 },
      { label: 'Approval bottleneck', contributionPct: 11 },
      { label: 'Administrative coordination', contributionPct: 8 },
    ],
    originalCompletionMonths: 14,
    predictedCompletionMonths: 16,
  },
  'PRJ-1103': {
    projectId: 'PRJ-1103',
    overallPct: 39,
    band: 'medium',
    predictedDelayLabel: '+3 weeks',
    confidencePct: 71,
    trend: [22, 26, 31, 35, 39],
    trendStatus: 'STABLE, MINOR RISE',
    categories: [
      { name: 'Legal Dispute', pct: 20 },
      { name: 'Documentation', pct: 44 },
      { name: 'Compensation', pct: 33 },
      { name: 'Approval', pct: 30 },
      { name: 'Stakeholder Response', pct: 28 },
      { name: 'Rehabilitation', pct: 19 },
      { name: 'Possession', pct: 22 },
      { name: 'Administrative Coordination', pct: 17 },
    ],
    drivers: [
      { label: 'Incomplete documentation', contributionPct: 21 },
      { label: 'Approval bottleneck', contributionPct: 12 },
      { label: 'Administrative coordination', contributionPct: 6 },
    ],
    originalCompletionMonths: 12,
    predictedCompletionMonths: 13,
  },
  'PRJ-1121': {
    projectId: 'PRJ-1121',
    overallPct: 18,
    band: 'low',
    predictedDelayLabel: 'On track',
    confidencePct: 92,
    trend: [12, 14, 15, 17, 18],
    trendStatus: 'STABLE',
    categories: CATEGORY_NAMES.map((name) => ({ name, pct: intBetween(mulberry32(name.length * 7), 5, 22) })),
    drivers: [
      { label: 'Approval bottleneck', contributionPct: 10 },
      { label: 'Administrative coordination', contributionPct: 5 },
    ],
    originalCompletionMonths: 20,
    predictedCompletionMonths: 20,
  },
};

function generateRiskFor(projectId: string, seed: number): RiskScore {
  const rng = mulberry32(seed);
  const overallPct = intBetween(rng, 8, 92);
  const steps = 4;
  const trend: number[] = [];
  let v = Math.max(5, overallPct - intBetween(rng, 20, 45));
  for (let i = 0; i <= steps; i++) {
    trend.push(Math.min(97, v));
    v += intBetween(rng, 2, 14);
  }
  trend[trend.length - 1] = overallPct;
  const categories: CategoryRisk[] = CATEGORY_NAMES.map((name) => ({
    name,
    pct: Math.max(3, Math.min(96, overallPct + intBetween(rng, -25, 15))),
  }));
  const driverPool = [
    'Pending legal disputes',
    'Compensation delays',
    'Incomplete documentation',
    'Approval bottleneck',
    'Stakeholder non-response',
    'Administrative coordination',
    'Survey re-verification required',
  ];
  const driverCount = intBetween(rng, 2, driverPool.length);
  const drivers = driverPool.slice(0, driverCount).map((label) => ({ label, contributionPct: intBetween(rng, 4, 26) }));

  return {
    projectId,
    overallPct,
    band: bandFor(overallPct),
    predictedDelayLabel: overallPct >= 60 ? `+${intBetween(rng, 2, 7)} months` : overallPct >= 35 ? `+${intBetween(rng, 2, 6)} weeks` : 'On track',
    confidencePct: intBetween(rng, 65, 95),
    trend,
    trendStatus: overallPct >= 70 ? 'RAPIDLY DETERIORATING' : overallPct >= 45 ? 'DETERIORATING' : 'STABLE',
    categories,
    drivers,
    originalCompletionMonths: intBetween(rng, 10, 24),
    predictedCompletionMonths: intBetween(rng, 10, 30),
  };
}

export const MOCK_RISKS: Record<string, RiskScore> = MOCK_PROJECTS.reduce((acc, p, i) => {
  acc[p.id] = HERO_RISKS[p.id] ?? generateRiskFor(p.id, 5000 + i * 97);
  return acc;
}, {} as Record<string, RiskScore>);

export function getMockRisk(projectId: string): RiskScore | undefined {
  return MOCK_RISKS[projectId];
}
