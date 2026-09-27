import type { Project } from '@/types';
import { DISTRICT_COORDS, STATES_DISTRICTS, intBetween, jitterCoord, mulberry32, pick } from './_generators';

const PROJECT_TYPES = ['Highway Corridor', 'Ring Road', 'Rail Link', 'Bridge', 'Bypass', 'Metro Extension'];

// Hand-authored hero projects — these carry the full demo narrative used
// throughout Command Center → Route Planning → GIS → 3D Twin → Risk.
const HERO_PROJECTS: Project[] = [
  {
    id: 'PRJ-1042',
    name: 'Chennai Northern Corridor',
    type: 'Highway Corridor',
    state: 'Tamil Nadu',
    district: 'Chennai',
    status: 'Land Acquisition',
    coords: [80.237, 13.087],
    startLocation: 'Chennai Port Junction (DEMO)',
    destination: 'Ennore Industrial Belt (DEMO)',
    estimatedBudgetCr: 1840,
    targetCompletion: '2028-03-31',
    requiredLandAreaAcres: 214,
    currentStageIndex: 4,
    bottleneckStageIndex: 5,
    selectedRouteId: 'RT-1042-C',
    parcelsCount: 327,
    stakeholdersCount: 184,
  },
  {
    id: 'PRJ-1078',
    name: 'Coimbatore Ring Road Ph-2',
    type: 'Ring Road',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    status: 'Impact Analysis',
    coords: [76.981, 11.017],
    startLocation: 'Neelambur Junction (DEMO)',
    destination: 'Sulur Bypass (DEMO)',
    estimatedBudgetCr: 960,
    targetCompletion: '2027-11-30',
    requiredLandAreaAcres: 132,
    currentStageIndex: 2,
    bottleneckStageIndex: 3,
    selectedRouteId: null,
    parcelsCount: 214,
    stakeholdersCount: 96,
  },
  {
    id: 'PRJ-1103',
    name: 'Madurai Bypass Extension',
    type: 'Bypass',
    state: 'Tamil Nadu',
    district: 'Madurai',
    status: 'Documentation',
    coords: [78.119, 9.925],
    startLocation: 'Melur Road (DEMO)',
    destination: 'Usilampatti Link (DEMO)',
    estimatedBudgetCr: 540,
    targetCompletion: '2027-06-30',
    requiredLandAreaAcres: 88,
    currentStageIndex: 4,
    bottleneckStageIndex: 4,
    selectedRouteId: null,
    parcelsCount: 118,
    stakeholdersCount: 52,
  },
  {
    id: 'PRJ-1121',
    name: 'Tiruchirappalli River Bridge',
    type: 'Bridge',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    status: 'Approval',
    coords: [78.686, 10.79],
    startLocation: 'Srirangam Bank (DEMO)',
    destination: 'Thiruverumbur Bank (DEMO)',
    estimatedBudgetCr: 410,
    targetCompletion: '2027-09-30',
    requiredLandAreaAcres: 41,
    currentStageIndex: 5,
    bottleneckStageIndex: -1,
    selectedRouteId: null,
    parcelsCount: 64,
    stakeholdersCount: 21,
  },
];

function generateFillerProjects(count: number): Project[] {
  const rng = mulberry32(20260830);
  const out: Project[] = [];
  let n = 1200;
  for (let i = 0; i < count; i++) {
    const state = pick(rng, Object.keys(STATES_DISTRICTS));
    const district = pick(rng, STATES_DISTRICTS[state]);
    const base = DISTRICT_COORDS[district] ?? [78.9, 20.6];
    const stageIdx = intBetween(rng, 0, 8);
    const hasBottleneck = rng() > 0.4;
    n += intBetween(rng, 3, 11);
    out.push({
      id: `PRJ-${n}`,
      name: `${district} ${pick(rng, ['Expressway', 'Freight Corridor', 'Link Road', 'Flyover Project', 'Rail Siding', 'Industrial Access Road'])} ${pick(rng, ['Ph-1', 'Ph-2', 'Ph-3', 'Extension'])}`,
      type: pick(rng, PROJECT_TYPES),
      state,
      district,
      status: (['Planning', 'Land Identification', 'Impact Analysis', 'Stakeholder Verification', 'Documentation', 'Approval', 'Land Acquisition', 'Compensation', 'Possession'] as const)[stageIdx] ?? 'Planning',
      coords: jitterCoord(base, rng, 0.16),
      startLocation: `${district} Junction-${intBetween(rng, 1, 9)} (DEMO)`,
      destination: `${district} Sector-${intBetween(rng, 10, 40)} (DEMO)`,
      estimatedBudgetCr: intBetween(rng, 120, 1500),
      targetCompletion: `202${intBetween(rng, 6, 9)}-${String(intBetween(rng, 1, 12)).padStart(2, '0')}-28`,
      requiredLandAreaAcres: intBetween(rng, 20, 260),
      currentStageIndex: stageIdx,
      bottleneckStageIndex: hasBottleneck ? Math.min(stageIdx + intBetween(rng, 0, 1), 8) : -1,
      selectedRouteId: null,
      parcelsCount: intBetween(rng, 30, 260),
      stakeholdersCount: intBetween(rng, 15, 150),
    });
  }
  return out;
}

export const MOCK_PROJECTS: Project[] = [...HERO_PROJECTS, ...generateFillerProjects(8)];

export function getMockProject(id: string): Project | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}
