import type { VerificationCase } from '@/types';
import { MOCK_PARCELS } from './parcels';
import { intBetween, mulberry32, pick } from './_generators';

const OFFICER_REFS = ['OFC-Anand-R', 'OFC-Priya-S', 'OFC-Mohan-K', 'OFC-Divya-N', 'OFC-Karthik-V', 'OFC-Lakshmi-T'];
const PRIORITY_POOL: VerificationCase['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_POOL: VerificationCase['status'][] = ['Assigned', 'In Progress', 'Awaiting Supervisor Verification', 'Verified', 'Revisit Requested'];

function generate(): VerificationCase[] {
  const rng = mulberry32(719003);
  return MOCK_PARCELS.slice(0, 36).map((parcel, i) => {
    const status = pick(rng, STATUS_POOL);
    return {
      id: `FC-${5000 + i}`,
      parcelId: parcel.id,
      projectId: parcel.projectId,
      officerRef: pick(rng, OFFICER_REFS),
      location: `Field Zone ${String.fromCharCode(65 + (i % 6))}-${intBetween(rng, 1, 9)} (DEMO)`,
      priority: parcel.disputed ? 'Critical' : pick(rng, PRIORITY_POOL),
      deadline: `2026-0${intBetween(rng, 6, 9)}-${String(intBetween(rng, 1, 28)).padStart(2, '0')}`,
      status,
      gpsCaptured: status !== 'Assigned',
      photosCount: status === 'Assigned' ? 0 : intBetween(rng, 1, 6),
      videosCount: status === 'Assigned' ? 0 : intBetween(rng, 0, 2),
      observation: status === 'Assigned' ? undefined : 'Site matches survey record; boundary markers visible (DEMO observation).',
    };
  });
}

export const MOCK_FIELD_CASES: VerificationCase[] = generate();

export function getMockFieldCasesByProject(projectId: string): VerificationCase[] {
  return MOCK_FIELD_CASES.filter((c) => c.projectId === projectId);
}
