import type { CitizenReport } from '@/types';
import { intBetween, mulberry32, pick } from './_generators';

const DESCRIPTIONS = [
  'Road extension required to connect this locality.',
  'Frequent flooding near the proposed alignment during monsoon.',
  'Existing footbridge unsafe for daily use.',
  'Requesting a service road for local access.',
  'Drainage blocked near survey marker (DEMO).',
];
const STATUS_POOL: CitizenReport['status'][] = ['Submitted', 'Under Review', 'Verified', 'Considered', 'Planned', 'Rejected'];

function generate(): CitizenReport[] {
  const rng = mulberry32(90210);
  return Array.from({ length: 14 }).map((_, i) => ({
    id: `CR-${i + 1}`,
    location: `Ward ${intBetween(rng, 1, 40)}, DEMO Locality`,
    description: pick(rng, DESCRIPTIONS),
    hasPhoto: rng() > 0.3,
    hasVideo: rng() > 0.75,
    status: pick(rng, STATUS_POOL),
    submittedAt: `2026-08-${String(intBetween(rng, 1, 29)).padStart(2, '0')}`,
  }));
}

// Citizen reports always require authorized officer review before any
// status beyond "Submitted" / "Under Review" is reached — never auto-approved.
export const MOCK_CITIZEN_REPORTS: CitizenReport[] = generate();
