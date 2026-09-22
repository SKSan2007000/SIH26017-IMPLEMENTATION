/**
 * LandGuard AI — Mock Designs, Versions & Packages (Phase 6)
 * All data is synthetic demonstration data.
 */

import type { DesignAlternative, DesignPackage, DesignChangeRequest } from '@/types';
import { generateCandidateDesignsForProject } from '@/lib/simulation/designEngine';
import { MOCK_PROJECTS } from './projects';

const INITIAL_DESIGNS: DesignAlternative[] = MOCK_PROJECTS.slice(0, 5).flatMap((p) =>
  generateCandidateDesignsForProject(p.id, p.coords)
);

export const MOCK_DESIGNS: DesignAlternative[] = INITIAL_DESIGNS;

export const MOCK_DESIGN_PACKAGES: DesignPackage[] = [
  {
    id: 'PKG-1042-D',
    projectId: 'PRJ-1042',
    designId: 'DSG-PRJ-1042-D',
    versionId: 'VER-DSG-PRJ-1042-D-V1',
    packageNumber: 'DPKG-PRJ-1042-v1',
    title: 'Approved Engineering Design Package — Design D v1 (AI Optimized Corridor)',
    approvedBy: 'Dr. A. Sundaram (Project Director)',
    approvedAt: '2026-08-28T14:30:00Z',
    specs: {
      designName: 'Design D — AI Optimized Corridor',
      strategy: 'AI Optimized Corridor',
      version: 1,
      lengthKm: 38.4,
      landImpactAcres: 145.9,
      affectedParcelsCount: 14,
      stakeholdersCount: 19,
      estimatedCostCr: 2180.0,
      estimatedDurationMonths: 18.0,
      delayRiskPct: 16,
      connectivityScore: 96,
      corridorWidthMeters: 32.0,
      lanes: 6,
    },
    officerInstructions:
      'Contractor shall execute work packages strictly within designated corridor bounds. Deep excavation near residential clusters must coordinate with LAO field units.',
    documentsCount: 6,
    disclaimer: 'CONCEPTUAL / SIMULATION — NOT A CERTIFIED ENGINEERING DRAWING',
    accessLog: [
      { actor: 'Dr. A. Sundaram', action: 'PACKAGE_RELEASED', timestamp: '2026-08-28T14:30:00Z' },
      { actor: 'Larsen & Toubro Infra Consortium', action: 'PACKAGE_DOWNLOADED', timestamp: '2026-08-29T10:15:00Z' },
    ],
  },
];

export const MOCK_CHANGE_REQUESTS: DesignChangeRequest[] = [
  {
    id: 'CR-PRJ-1042-01',
    projectId: 'PRJ-1042',
    designId: 'DSG-PRJ-1042-D',
    versionId: 'VER-DSG-PRJ-1042-D-V1',
    contractorId: 'con-01',
    contractorName: 'Larsen & Toubro Infra Consortium',
    title: 'Viaduct Alignment Shift at Km 14 to avoid Waterbody Canal',
    reason: 'Ground soil probe revealed high water table at Pier 42-48. Minor 35m northern shift saves ₹14 Cr in deep piling foundations.',
    requestedModifications: { shiftDirection: 'North', offsetMeters: 35.0, affectedPiers: '42-48' },
    proposedGeometry: [
      [80.222, 13.067],
      [80.235, 13.098],
      [80.248, 13.135],
      [80.264, 13.175],
      [80.278, 13.205],
    ],
    officerReviewStatus: 'PENDING',
    aiImpactAnalysis: {
      costDeltaCr: -14.2,
      riskDeltaPct: -6,
      timeDeltaMonths: -1.0,
      newScore: 96,
      recommendation: 'Favorable — Reduces Foundation Risk and Piling Delay',
    },
    createdAt: '2026-08-30T11:20:00Z',
  },
];

export function getMockDesignsForProject(projectId: string): DesignAlternative[] {
  const found = MOCK_DESIGNS.filter((d) => d.projectId === projectId);
  if (found.length > 0) return found;
  return generateCandidateDesignsForProject(projectId);
}
