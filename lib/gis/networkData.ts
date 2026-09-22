/**
 LandGuard AI — Regional Road Network & Connectivity Gaps (Client GIS Layer)
 All data is synthetic / simulated demonstration infrastructure.
 */

import type { RoadNetworkFeature, ConnectivityGap } from '@/types';

export const DEMO_ROAD_NETWORK_FEATURES: RoadNetworkFeature[] = [
  {
    id: 'NET-HW-01',
    name: 'NH-48 (Chennai — Kanchipuram — Vellore — Bengaluru)',
    type: 'HIGHWAY',
    coordinates: [
      [80.220, 13.040],
      [80.010, 13.010],
      [79.710, 12.830],
      [79.130, 12.920],
      [78.550, 12.870],
      [77.720, 12.950],
    ],
    properties: { lanes: 6, speedLimit: 100, status: 'Operational', trafficVolume: 'Heavy' },
  },
  {
    id: 'NET-HW-02',
    name: 'NH-32 / ECR (Chennai — Mahabalipuram — Puducherry)',
    type: 'HIGHWAY',
    coordinates: [
      [80.250, 13.010],
      [80.240, 12.830],
      [80.190, 12.520],
      [79.830, 11.930],
    ],
    properties: { lanes: 4, speedLimit: 80, status: 'Operational', trafficVolume: 'Moderate' },
  },
  {
    id: 'NET-HW-03',
    name: 'NH-44 (Bengaluru — Krishnagiri — Dharmapuri — Salem)',
    type: 'HIGHWAY',
    coordinates: [
      [77.700, 12.930],
      [78.220, 12.530],
      [78.160, 12.120],
      [78.140, 11.660],
    ],
    properties: { lanes: 6, speedLimit: 100, status: 'Operational', trafficVolume: 'Heavy' },
  },
  {
    id: 'NET-RD-01',
    name: 'Outer Ring Road (Vandalur — Minjur Corridor)',
    type: 'MAJOR_ROAD',
    coordinates: [
      [80.080, 12.890],
      [80.040, 13.020],
      [80.120, 13.180],
      [80.260, 13.280],
    ],
    properties: { lanes: 6, speedLimit: 80, status: 'Operational', trafficVolume: 'High' },
  },
  {
    id: 'NET-RD-02',
    name: 'Sriperumbudur — Thiruvallur Link',
    type: 'MAJOR_ROAD',
    coordinates: [
      [79.940, 12.970],
      [79.910, 13.140],
    ],
    properties: { lanes: 4, speedLimit: 60, status: 'Operational', trafficVolume: 'Moderate' },
  },
  {
    id: 'NET-RL-01',
    name: 'Southern Railway Mainline (Chennai Central — Katpadi)',
    type: 'RAILWAY',
    coordinates: [
      [80.275, 13.082],
      [80.140, 13.110],
      [79.820, 13.080],
      [79.140, 12.970],
    ],
    properties: { tracks: 4, electrified: true, type: 'Broad Gauge' },
  },
  {
    id: 'NET-RV-01',
    name: 'Palar River Basin (DEMO)',
    type: 'RIVER',
    coordinates: [
      [78.600, 12.780],
      [79.150, 12.890],
      [79.720, 12.770],
      [80.150, 12.510],
    ],
    properties: { category: 'Ecological Buffer', spanMeters: 450 },
  },
  {
    id: 'NET-HUB-01',
    name: 'Sriperumbudur-Oragadam Auto Hub (DEMO)',
    type: 'INDUSTRIAL_HUB',
    coordinates: [79.950, 12.920],
    properties: { freightDemand: 'Very High', workersDaily: 85000 },
  },
  {
    id: 'NET-HUB-02',
    name: 'Ennore-Kattupalli Port Complex (DEMO)',
    type: 'INDUSTRIAL_HUB',
    coordinates: [80.330, 13.280],
    properties: { cargoTEUYear: '2.4M', heavyTrucksDaily: 14000 },
  },
];

export const DEMO_CONNECTIVITY_GAPS: ConnectivityGap[] = [
  {
    id: 'GAP-01',
    region: 'North Chennai Industrial Arc',
    description: 'Lack of high-speed grade-separated freight access between Oragadam Auto Cluster and Ennore Port.',
    gapType: 'MISSING_DIRECT_LINK',
    existingTravelTimeMin: 115,
    potentialTravelTimeMin: 42,
    estimatedSocioEconomicBenefitCr: 420.0,
    predictedAcquisitionDifficulty: 'Medium',
    proposedCorridorCoordinates: [
      [79.950, 12.920],
      [80.080, 13.060],
      [80.200, 13.190],
      [80.330, 13.280],
    ],
  },
  {
    id: 'GAP-02',
    region: 'Vellore-Ranipet Leather Corridor',
    description: 'Congestion bottleneck along urban market bypass causing 45 min transit delays for cargo.',
    gapType: 'CONGESTION_CHOKEPOINT',
    existingTravelTimeMin: 65,
    potentialTravelTimeMin: 20,
    estimatedSocioEconomicBenefitCr: 180.0,
    predictedAcquisitionDifficulty: 'Low',
    proposedCorridorCoordinates: [
      [79.130, 12.920],
      [79.250, 12.960],
      [79.380, 12.930],
    ],
  },
  {
    id: 'GAP-03',
    region: 'Salem Southern Agricultural Link',
    description: 'Rural farm-to-market feeder roads unpaved, restricting refrigerated logistics transport.',
    gapType: 'INDUSTRIAL_ACCESS',
    existingTravelTimeMin: 90,
    potentialTravelTimeMin: 35,
    estimatedSocioEconomicBenefitCr: 260.0,
    predictedAcquisitionDifficulty: 'Low',
    proposedCorridorCoordinates: [
      [78.140, 11.660],
      [78.080, 11.450],
      [78.010, 11.280],
    ],
  },
];
