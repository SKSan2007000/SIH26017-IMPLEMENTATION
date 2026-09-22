import type { Parcel, ParcelImpact, RiskBand, ResponseStatus, NotificationStatus } from '@/types';
import { MOCK_PROJECTS } from './projects';
import { MOCK_ROUTES } from './routes';
import { intBetween, jitterCoord, mulberry32, pick } from './_generators';
import { generateParcelPolygon } from '../gis/geojson';

const IMPACT_POOL: ParcelImpact[] = ['unaffected', 'potential', 'affected', 'high'];
const RISK_POOL: RiskBand[] = ['low', 'medium', 'high', 'critical'];

// Featured parcels for the primary demo walkthrough (Chennai Northern Corridor).
// Each parcel has realistic coordinates, polygon vertices, stakeholder linkage, and route intersection membership.
const FEATURED_PARCELS: Parcel[] = [
  {
    id: 'LG-P1024',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-A', 'RT-1042-C'],
    coords: [80.241, 13.083],
    polygonCoords: generateParcelPolygon([80.241, 13.083], 1240, 1024),
    areaSqFt: 1240,
    impact: 'high',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-024',
    verification: 'PENDING',
    acquisitionStatus: 'NOTICE ISSUED',
    responseStatus: 'PENDING',
    notificationStatus: 'SENT',
    documentsComplete: 3,
    documentsRequired: 4,
    disputed: true,
    riskContribution: 'high',
    structuresPresent: true,
    structureType: 'Commercial Shed',
  },
  {
    id: 'LG-P1031',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-B'],
    coords: [80.233, 13.091],
    polygonCoords: generateParcelPolygon([80.233, 13.091], 860, 1031),
    areaSqFt: 860,
    impact: 'potential',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-031',
    verification: 'VERIFIED',
    acquisitionStatus: 'IN PROGRESS',
    responseStatus: 'RECEIVED',
    notificationStatus: 'ACKNOWLEDGED',
    documentsComplete: 4,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'medium',
    structuresPresent: false,
    structureType: 'Vacant Plot',
  },
  {
    id: 'LG-P1048',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-A', 'RT-1042-D'],
    coords: [80.246, 13.079],
    polygonCoords: generateParcelPolygon([80.246, 13.079], 2010, 1048),
    areaSqFt: 2010,
    impact: 'high',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-048',
    verification: 'PENDING',
    acquisitionStatus: 'NOT STARTED',
    responseStatus: 'UNRESPONSIVE',
    notificationStatus: 'DELIVERED',
    documentsComplete: 1,
    documentsRequired: 4,
    disputed: true,
    riskContribution: 'critical',
    structuresPresent: true,
    structureType: 'Residential House',
  },
  {
    id: 'LG-P1055',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-C'],
    coords: [80.229, 13.095],
    polygonCoords: generateParcelPolygon([80.229, 13.095], 410, 1055),
    areaSqFt: 410,
    impact: 'unaffected',
    landType: 'Government',
    ownerRef: 'DEMO OWNER-055',
    verification: 'VERIFIED',
    acquisitionStatus: 'POSSESSED',
    responseStatus: 'RECEIVED',
    notificationStatus: 'ACKNOWLEDGED',
    documentsComplete: 4,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'low',
    structuresPresent: false,
    structureType: 'Vacant Plot',
  },
  {
    id: 'LG-P1062',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-B', 'RT-1042-D'],
    coords: [80.252, 13.086],
    polygonCoords: generateParcelPolygon([80.252, 13.086], 1120, 1062),
    areaSqFt: 1120,
    impact: 'potential',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-062',
    verification: 'PENDING',
    acquisitionStatus: 'NOTICE ISSUED',
    responseStatus: 'PENDING',
    notificationStatus: 'SENT',
    documentsComplete: 2,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'medium',
    structuresPresent: false,
    structureType: 'Agricultural Well',
  },
  {
    id: 'LG-P1069',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-C', 'RT-1042-A'],
    coords: [80.259, 13.099],
    polygonCoords: generateParcelPolygon([80.259, 13.099], 1580, 1069),
    areaSqFt: 1580,
    impact: 'high',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-069',
    verification: 'PENDING',
    acquisitionStatus: 'NOTICE ISSUED',
    responseStatus: 'DISPUTED',
    notificationStatus: 'SENT',
    documentsComplete: 2,
    documentsRequired: 4,
    disputed: true,
    riskContribution: 'critical',
    structuresPresent: true,
    structureType: 'Residential House',
  },
  {
    id: 'LG-P1074',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-A', 'RT-1042-B', 'RT-1042-C'],
    coords: [80.215, 13.072],
    polygonCoords: generateParcelPolygon([80.215, 13.072], 980, 1074),
    areaSqFt: 980,
    impact: 'affected',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-074',
    verification: 'VERIFIED',
    acquisitionStatus: 'IN PROGRESS',
    responseStatus: 'RECEIVED',
    notificationStatus: 'ACKNOWLEDGED',
    documentsComplete: 3,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'medium',
    structuresPresent: true,
    structureType: 'Commercial Shed',
  },
  {
    id: 'LG-P1082',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-C', 'RT-1042-D'],
    coords: [80.272, 13.107],
    polygonCoords: generateParcelPolygon([80.272, 13.107], 1850, 1082),
    areaSqFt: 1850,
    impact: 'potential',
    landType: 'Government',
    ownerRef: 'DEMO OWNER-082',
    verification: 'VERIFIED',
    acquisitionStatus: 'COMPENSATED',
    responseStatus: 'RECEIVED',
    notificationStatus: 'ACKNOWLEDGED',
    documentsComplete: 4,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'low',
    structuresPresent: false,
    structureType: 'Vacant Plot',
  },
  {
    id: 'LG-P1091',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-A', 'RT-1042-D'],
    coords: [80.201, 13.062],
    polygonCoords: generateParcelPolygon([80.201, 13.062], 2400, 1091),
    areaSqFt: 2400,
    impact: 'high',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-091',
    verification: 'AWAITING SUPERVISOR VERIFICATION',
    acquisitionStatus: 'NOTICE ISSUED',
    responseStatus: 'PENDING',
    notificationStatus: 'SENT',
    documentsComplete: 2,
    documentsRequired: 4,
    disputed: true,
    riskContribution: 'critical',
    structuresPresent: true,
    structureType: 'Residential House',
  },
  {
    id: 'LG-P1104',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-B', 'RT-1042-C'],
    coords: [80.248, 13.093],
    polygonCoords: generateParcelPolygon([80.248, 13.093], 1340, 1104),
    areaSqFt: 1340,
    impact: 'affected',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-104',
    verification: 'PENDING',
    acquisitionStatus: 'IN PROGRESS',
    responseStatus: 'PENDING',
    notificationStatus: 'SENT',
    documentsComplete: 3,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'medium',
    structuresPresent: true,
    structureType: 'Commercial Shed',
  },
  {
    id: 'LG-P1112',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-D'],
    coords: [80.288, 13.121],
    polygonCoords: generateParcelPolygon([80.288, 13.121], 1750, 1112),
    areaSqFt: 1750,
    impact: 'high',
    landType: 'Private',
    ownerRef: 'DEMO OWNER-112',
    verification: 'PENDING',
    acquisitionStatus: 'NOT STARTED',
    responseStatus: 'UNRESPONSIVE',
    notificationStatus: 'DELIVERED',
    documentsComplete: 1,
    documentsRequired: 4,
    disputed: true,
    riskContribution: 'high',
    structuresPresent: true,
    structureType: 'Residential House',
  },
  {
    id: 'LG-P1125',
    projectId: 'PRJ-1042',
    routeIds: ['RT-1042-C'],
    coords: [80.235, 13.085],
    polygonCoords: generateParcelPolygon([80.235, 13.085], 890, 1125),
    areaSqFt: 890,
    impact: 'potential',
    landType: 'Government',
    ownerRef: 'DEMO OWNER-125',
    verification: 'VERIFIED',
    acquisitionStatus: 'IN PROGRESS',
    responseStatus: 'RECEIVED',
    notificationStatus: 'ACKNOWLEDGED',
    documentsComplete: 4,
    documentsRequired: 4,
    disputed: false,
    riskContribution: 'low',
    structuresPresent: false,
    structureType: 'Vacant Plot',
  },
];

function generateFillerParcels(count: number): Parcel[] {
  const rng = mulberry32(883141);
  const out: Parcel[] = [];
  let n = 2000;
  for (let i = 0; i < count; i++) {
    const project = pick(rng, MOCK_PROJECTS);
    const impact = pick(rng, IMPACT_POOL);
    const routesForProject = MOCK_ROUTES.filter((r) => r.projectId === project.id);
    const routeIds = routesForProject.length
      ? routesForProject.filter(() => rng() > 0.45).map((r) => r.id)
      : [];
    if (routesForProject.length && routeIds.length === 0) {
      routeIds.push(routesForProject[0].id);
    }
    n += intBetween(rng, 3, 9);
    const coords = jitterCoord(project.coords, rng, 0.05);
    const area = intBetween(rng, 400, 2600);
    const disputed = rng() > 0.8;
    const docs = intBetween(rng, 1, 4);

    out.push({
      id: `LG-P${n}`,
      projectId: project.id,
      routeIds,
      coords,
      polygonCoords: generateParcelPolygon(coords, area, n),
      areaSqFt: area,
      impact,
      landType: rng() > 0.4 ? 'Private' : 'Government',
      ownerRef: `DEMO OWNER-${n}`,
      verification: pick(rng, ['PENDING', 'VERIFIED', 'REJECTED', 'AWAITING SUPERVISOR VERIFICATION']),
      acquisitionStatus: pick(rng, ['NOT STARTED', 'NOTICE ISSUED', 'IN PROGRESS', 'COMPENSATED', 'POSSESSED']),
      responseStatus: disputed ? 'DISPUTED' : pick(rng, ['PENDING', 'RECEIVED', 'UNRESPONSIVE'] as ResponseStatus[]),
      notificationStatus: pick(rng, ['SENT', 'DELIVERED', 'ACKNOWLEDGED'] as NotificationStatus[]),
      documentsComplete: docs,
      documentsRequired: 4,
      disputed,
      riskContribution: impact === 'high' || disputed ? pick(rng, ['high', 'critical']) : impact === 'affected' ? 'medium' : pick(rng, RISK_POOL),
      structuresPresent: rng() > 0.5,
      structureType: pick(rng, ['Residential House', 'Commercial Shed', 'Agricultural Well', 'Vacant Plot']),
    });
  }
  return out;
}

export const MOCK_PARCELS: Parcel[] = [...FEATURED_PARCELS, ...generateFillerParcels(58)];

export function getMockParcelsByProject(projectId: string): Parcel[] {
  return MOCK_PARCELS.filter((p) => p.projectId === projectId);
}

export function getMockParcelsByRoute(routeId: string): Parcel[] {
  return MOCK_PARCELS.filter((p) => p.routeIds.includes(routeId));
}

export function getMockParcel(id: string): Parcel | undefined {
  return MOCK_PARCELS.find((p) => p.id === id);
}

export function generateMockParcels(projectId: string, centerCoords?: [number, number]): Parcel[] {
  const existing = getMockParcelsByProject(projectId);
  if (existing && existing.length > 0) return existing;
  const baseCoords = centerCoords || [80.237, 13.087];
  return MOCK_PARCELS.slice(0, 12).map((p, idx) => ({
    ...p,
    id: `PAR-${projectId.replace('PRJ-', '')}-${String(idx + 1).padStart(3, '0')}`,
    projectId,
    coords: [baseCoords[0] + (idx * 0.008), baseCoords[1] + (idx * 0.006)],
    surveyNo: p.surveyNo || `SF-${100 + idx}/${(idx % 3) + 1}A`,
    areaAcres: p.areaAcres || +(p.areaSqFt / 43560).toFixed(2) || 1.8,
    compensationCr: p.compensationCr || +(0.45 + (idx * 0.08)).toFixed(2),
  }));
}
