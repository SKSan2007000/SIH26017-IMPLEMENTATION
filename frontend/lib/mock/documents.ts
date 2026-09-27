import type { DocumentRecord } from '@/types';
import { MOCK_PARCELS } from './parcels';
import { intBetween, mulberry32, pick } from './_generators';

const DOC_TYPES: DocumentRecord['type'][] = ['Ownership', 'Survey', 'Compensation', 'Legal', 'Approval', 'Project'];
const DOC_STATUS: DocumentRecord['status'][] = ['Uploaded', 'Processing', 'Verified', 'Rejected', 'Missing'];

function generate(): DocumentRecord[] {
  const rng = mulberry32(552091);
  const out: DocumentRecord[] = [];
  MOCK_PARCELS.slice(0, 40).forEach((parcel, i) => {
    const type = pick(rng, DOC_TYPES);
    const status = pick(rng, DOC_STATUS);
    out.push({
      id: `DOC-${9000 + i}`,
      parcelId: parcel.id,
      type,
      status,
      ocr:
        status === 'Missing'
          ? undefined
          : {
              extractedFields: {
                'Parcel ID': parcel.id,
                'Document Type': type,
                'Document Number': `TN/${type.slice(0, 3).toUpperCase()}/${intBetween(rng, 10000, 99999)}`,
                Area: `${parcel.areaSqFt} sq.ft.`,
                Date: `2026-0${intBetween(rng, 1, 8)}-${String(intBetween(rng, 1, 28)).padStart(2, '0')}`,
                Stakeholder: parcel.ownerRef,
              },
              confidencePct: intBetween(rng, 61, 98),
              humanVerified: status === 'Verified',
            },
    });
  });
  return out;
}

export const MOCK_DOCUMENTS: DocumentRecord[] = generate();

export function getMockDocumentsByParcel(parcelId: string): DocumentRecord[] {
  return MOCK_DOCUMENTS.filter((d) => d.parcelId === parcelId);
}
