import type { Stakeholder } from '@/types';
import { MOCK_PARCELS } from './parcels';
import { intBetween, mulberry32, pick } from './_generators';

const FICTIONAL_NAMES = [
  'K. Ramanathan (Fictional)',
  'S. Meenakshi (Fictional)',
  'M. Murugan (Fictional)',
  'A. Soundararajan (Fictional)',
  'P. Jayalakshmi (Fictional)',
  'V. Thirunavukkarasu (Fictional)',
  'G. Radhakrishnan (Fictional)',
  'D. Selvamani (Fictional)',
  'R. Gomathi (Fictional)',
  'C. Annamalai (Fictional)',
  'N. Vijayalakshmi (Fictional)',
  'T. Balasubramanian (Fictional)',
  'K. Shenbagam (Fictional)',
  'S. Velmurugan (Fictional)',
  'M. Poongodi (Fictional)',
];

function generate(): Stakeholder[] {
  const rng = mulberry32(447712);
  const byOwner = new Map<string, typeof MOCK_PARCELS>();

  MOCK_PARCELS.forEach((p) => {
    const list = byOwner.get(p.ownerRef) ?? [];
    list.push(p);
    byOwner.set(p.ownerRef, list);
  });

  const out: Stakeholder[] = [];
  let i = 0;

  byOwner.forEach((parcels, ownerRef) => {
    const primary = parcels[0];
    const disputed = parcels.some((p) => p.disputed);
    const docsCount = Math.min(...parcels.map((p) => p.documentsComplete));
    const allDocs = docsCount >= 4;

    const status: Stakeholder['status'] = disputed
      ? 'Disputed'
      : allDocs
      ? 'Verified'
      : docsCount === 0
      ? 'Unresponsive'
      : 'Pending';

    const respStatus = primary.responseStatus ?? (disputed ? 'DISPUTED' : allDocs ? 'RECEIVED' : 'PENDING');
    const notifStatus = primary.notificationStatus ?? (allDocs ? 'ACKNOWLEDGED' : 'SENT');

    out.push({
      id: `SH-${1000 + i}`,
      ref: ownerRef,
      name: `${ownerRef} — ${FICTIONAL_NAMES[i % FICTIONAL_NAMES.length]}`,
      projectId: primary.projectId,
      parcelId: primary.id,
      parcelIds: parcels.map((p) => p.id),
      contactRef: `+91 98${intBetween(rng, 10, 99)}X-XXXX${intBetween(rng, 1, 9)}`,
      status,
      responseStatus: respStatus,
      notificationStatus: notifStatus,
      documentsComplete: allDocs,
      documentsCount: docsCount,
      documentsRequired: 4,
      compensationStatus: allDocs ? 'Disbursement Pending' : primary.acquisitionStatus === 'COMPENSATED' ? 'Completed' : 'Not Initiated',
      lastContact: `2026-0${intBetween(rng, 1, 8)}-${String(intBetween(rng, 1, 28)).padStart(2, '0')}`,
      preferredLanguage: pick(rng, ['Tamil', 'Tamil', 'English']),
    });
    i++;
  });

  return out;
}

export const MOCK_STAKEHOLDERS: Stakeholder[] = generate();

export function getMockStakeholdersByProject(projectId: string): Stakeholder[] {
  return MOCK_STAKEHOLDERS.filter((s) => s.projectId === projectId);
}

export function getMockStakeholderByOwnerRef(ownerRef: string): Stakeholder | undefined {
  return MOCK_STAKEHOLDERS.find((s) => s.ref === ownerRef);
}

export function getMockStakeholderByParcelId(parcelId: string): Stakeholder | undefined {
  return MOCK_STAKEHOLDERS.find((s) => s.parcelIds.includes(parcelId) || s.parcelId === parcelId);
}

export function getMockStakeholder(id: string): Stakeholder | undefined {
  return MOCK_STAKEHOLDERS.find((s) => s.id === id);
}

