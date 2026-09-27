import type { Route, LonLat } from '@/types';
import { MOCK_PROJECTS } from './projects';

// Fictional route geometry around the Chennai Northern Corridor demo project.
// None of these coordinates correspond to real surveyed alignments.
export const HERO_ROUTES: Route[] = [
  {
    id: 'RT-1042-A',
    projectId: 'PRJ-1042',
    label: 'Route A',
    strategy: 'Minimum Land Impact',
    path: [
      [80.19, 13.055],
      [80.205, 13.068],
      [80.221, 13.081],
      [80.238, 13.09],
      [80.257, 13.101],
      [80.281, 13.112],
    ],
    distanceKm: 24.8,
    affectedParcels: 327,
    affectedParcelIds: ['LG-P1024', 'LG-P1048', 'LG-P1069', 'LG-P1074', 'LG-P1091'],
    stakeholders: 184,
    estimatedCostCr: 2140,
    estimatedDelayMonths: 6,
    delayProbabilityPct: 72,
    infrastructureImpact: 'High',
    overallScore: 58,
    aiRecommended: false,
    corridorWidthMeters: 35,
    lanes: 6,
  },
  {
    id: 'RT-1042-B',
    projectId: 'PRJ-1042',
    label: 'Route B',
    strategy: 'Minimum Cost',
    path: [
      [80.19, 13.06],
      [80.212, 13.065],
      [80.233, 13.075],
      [80.252, 13.088],
      [80.27, 13.1],
      [80.29, 13.108],
    ],
    distanceKm: 22.1,
    affectedParcels: 298,
    affectedParcelIds: ['LG-P1031', 'LG-P1062', 'LG-P1074', 'LG-P1104'],
    stakeholders: 152,
    estimatedCostCr: 1780,
    estimatedDelayMonths: 4,
    delayProbabilityPct: 61,
    infrastructureImpact: 'Medium',
    overallScore: 67,
    aiRecommended: false,
    corridorWidthMeters: 30,
    lanes: 4,
  },
  {
    id: 'RT-1042-C',
    projectId: 'PRJ-1042',
    label: 'Route C',
    strategy: 'Minimum Delay',
    path: [
      [80.19, 13.06],
      [80.21, 13.07],
      [80.237, 13.087],
      [80.26, 13.1],
      [80.285, 13.115],
    ],
    distanceKm: 23.4,
    affectedParcels: 281,
    affectedParcelIds: ['LG-P1024', 'LG-P1055', 'LG-P1069', 'LG-P1074', 'LG-P1082', 'LG-P1104', 'LG-P1125'],
    stakeholders: 121,
    estimatedCostCr: 1960,
    estimatedDelayMonths: 2,
    delayProbabilityPct: 42,
    infrastructureImpact: 'Medium',
    overallScore: 86,
    aiRecommended: true,
    corridorWidthMeters: 32,
    lanes: 6,
  },
  {
    id: 'RT-1042-D',
    projectId: 'PRJ-1042',
    label: 'Route D',
    strategy: 'Maximum Connectivity',
    path: [
      [80.188, 13.05],
      [80.2, 13.063],
      [80.219, 13.079],
      [80.241, 13.093],
      [80.264, 13.106],
      [80.283, 13.118],
      [80.3, 13.125],
    ],
    distanceKm: 27.6,
    affectedParcels: 305,
    affectedParcelIds: ['LG-P1048', 'LG-P1062', 'LG-P1082', 'LG-P1091', 'LG-P1112'],
    stakeholders: 137,
    estimatedCostCr: 2280,
    estimatedDelayMonths: 5,
    delayProbabilityPct: 49,
    infrastructureImpact: 'High',
    overallScore: 63,
    aiRecommended: false,
    corridorWidthMeters: 40,
    lanes: 8,
  },
];

export function generateRoutesForProject(projectId: string, centerCoords: LonLat): Route[] {
  const [cx, cy] = centerCoords;
  return [
    {
      id: `RT-${projectId}-A`,
      projectId,
      label: 'Route A',
      strategy: 'Minimum Land Impact',
      path: [
        [cx - 0.035, cy - 0.022],
        [cx - 0.018, cy - 0.01],
        [cx + 0.002, cy + 0.003],
        [cx + 0.021, cy + 0.016],
        [cx + 0.038, cy + 0.028],
      ],
      distanceKm: 22.4,
      affectedParcels: 145,
      stakeholders: 78,
      estimatedCostCr: 1240,
      estimatedDelayMonths: 5,
      delayProbabilityPct: 68,
      infrastructureImpact: 'High',
      overallScore: 62,
      aiRecommended: false,
      corridorWidthMeters: 30,
      lanes: 4,
    },
    {
      id: `RT-${projectId}-B`,
      projectId,
      label: 'Route B',
      strategy: 'Minimum Cost',
      path: [
        [cx - 0.035, cy - 0.02],
        [cx - 0.015, cy - 0.015],
        [cx + 0.005, cy - 0.005],
        [cx + 0.022, cy + 0.01],
        [cx + 0.04, cy + 0.025],
      ],
      distanceKm: 20.1,
      affectedParcels: 132,
      stakeholders: 64,
      estimatedCostCr: 980,
      estimatedDelayMonths: 4,
      delayProbabilityPct: 58,
      infrastructureImpact: 'Medium',
      overallScore: 71,
      aiRecommended: false,
      corridorWidthMeters: 28,
      lanes: 4,
    },
    {
      id: `RT-${projectId}-C`,
      projectId,
      label: 'Route C',
      strategy: 'Minimum Delay',
      path: [
        [cx - 0.035, cy - 0.02],
        [cx - 0.016, cy - 0.008],
        [cx, cy],
        [cx + 0.018, cy + 0.012],
        [cx + 0.038, cy + 0.026],
      ],
      distanceKm: 21.2,
      affectedParcels: 110,
      stakeholders: 48,
      estimatedCostCr: 1120,
      estimatedDelayMonths: 2,
      delayProbabilityPct: 38,
      infrastructureImpact: 'Medium',
      overallScore: 88,
      aiRecommended: true,
      corridorWidthMeters: 32,
      lanes: 6,
    },
    {
      id: `RT-${projectId}-D`,
      projectId,
      label: 'Route D',
      strategy: 'Maximum Connectivity',
      path: [
        [cx - 0.038, cy - 0.025],
        [cx - 0.02, cy - 0.005],
        [cx + 0.005, cy + 0.01],
        [cx + 0.025, cy + 0.02],
        [cx + 0.042, cy + 0.03],
      ],
      distanceKm: 25.8,
      affectedParcels: 160,
      stakeholders: 89,
      estimatedCostCr: 1380,
      estimatedDelayMonths: 5,
      delayProbabilityPct: 52,
      infrastructureImpact: 'High',
      overallScore: 65,
      aiRecommended: false,
      corridorWidthMeters: 36,
      lanes: 6,
    },
  ];
}

const ALL_ROUTES: Route[] = [
  ...HERO_ROUTES,
  ...MOCK_PROJECTS.filter((p) => p.id !== 'PRJ-1042').flatMap((p) => generateRoutesForProject(p.id, p.coords)),
];

export const MOCK_ROUTES: Route[] = ALL_ROUTES;

export function getMockRoutes(projectId: string): Route[] {
  const existing = MOCK_ROUTES.filter((r) => r.projectId === projectId);
  if (existing.length > 0) return existing;
  const prj = MOCK_PROJECTS.find((p) => p.id === projectId);
  return generateRoutesForProject(projectId, prj?.coords ?? [80.237, 13.087]);
}

export function getMockRoute(routeId: string): Route | undefined {
  return MOCK_ROUTES.find((r) => r.id === routeId);
}

