import type { Officer, OfficerRole } from '@/types';
import { intBetween, mulberry32 } from './_generators';

const ROLES: OfficerRole[] = [
  'Head Officer', 'State Officer', 'District Officer', 'Project Officer',
  'Land Acquisition Officer', 'Survey Officer', 'Legal Officer', 'Finance Officer', 'Field Officer',
];

const NAMES = [
  'R. Kannan', 'A. Priya', 'M. Suresh', 'D. Lakshmi', 'K. Vikram', 'S. Anitha',
  'N. Ganesh', 'T. Meena', 'V. Karthik', 'B. Divya', 'C. Anand', 'J. Revathi',
];

function generate(): Officer[] {
  const rng = mulberry32(881220);
  return NAMES.map((name, i) => {
    const tasksCompleted = intBetween(rng, 40, 140);
    return {
      id: `OFC-${100 + i}`,
      name: `${name} (DEMO)`,
      role: ROLES[i % ROLES.length],
      points: intBetween(rng, 220, 980),
      onTimeRatePct: intBetween(rng, 78, 99),
      evidenceQualityPct: intBetween(rng, 72, 98),
      verificationQualityPct: intBetween(rng, 75, 99),
      tasksCompleted,
      pendingTasks: intBetween(rng, 0, 12),
    };
  });
}

// Prototype accountability / motivation mechanism — NOT an existing
// government reward policy. Point weights below are illustrative demo
// values only:
//   Daily report +10 · Property verification +10 · Complete evidence +5
//   Verified issue +20 · High-priority completion +25
export const MOCK_OFFICERS: Officer[] = generate();

export const CONTRIBUTION_POINT_RULES = [
  { action: 'Daily report submitted', points: 10 },
  { action: 'Property verification completed', points: 10 },
  { action: 'Complete evidence package', points: 5 },
  { action: 'Verified issue resolved', points: 20 },
  { action: 'High-priority task completed', points: 25 },
];
