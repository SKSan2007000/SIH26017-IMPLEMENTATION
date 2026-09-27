import type { Project, Parcel, Route, LonLat, Stakeholder, VerificationCase } from '@/types';

export const RISK_HEX: Record<string, string> = {
  critical: '#ef5b5b',
  high: '#f0a742',
  medium: '#e8d15c',
  low: '#4fbf7c',
  unaffected: '#4fbf7c',
  potential: '#e8d15c',
  affected: '#f0a742',
};

export function riskColor(bandOrImpact: string): string {
  return RISK_HEX[bandOrImpact] ?? '#38d3f0';
}

export function getParcelColor(parcel: Parcel): string {
  if (parcel.disputed || parcel.riskContribution === 'critical') return '#ef5b5b'; // Red - high risk
  if (parcel.impact === 'high' || parcel.riskContribution === 'high') return '#ef5b5b'; // Red
  if (parcel.impact === 'affected') return '#f0a742'; // Orange - affected
  if (parcel.impact === 'potential' || parcel.riskContribution === 'medium') return '#e8d15c'; // Yellow - potential
  return '#4fbf7c'; // Green - unaffected / low risk
}

/** Create a realistic 4-5 sided parcel polygon around a center coordinate if not already defined */
export function generateParcelPolygon(center: LonLat, areaSqFt = 1200, seed = 0): LonLat[] {
  // Approximate scale: 1 deg lat ~ 111,000m, 1 sq.ft ~ 0.0929 sq.m
  const sideMeters = Math.sqrt(areaSqFt * 0.0929) * 1.3;
  const degOffsetLat = (sideMeters / 111000) * 0.5;
  const degOffsetLon = (sideMeters / (111000 * Math.cos((center[1] * Math.PI) / 180))) * 0.5;

  const jitter = (n: number) => 1 + (((seed * 9301 + n * 49297) % 233280) / 233280 - 0.5) * 0.3;

  const dx1 = degOffsetLon * jitter(1);
  const dy1 = degOffsetLat * jitter(2);
  const dx2 = degOffsetLon * jitter(3);
  const dy2 = degOffsetLat * jitter(4);

  return [
    [center[0] - dx1, center[1] - dy1],
    [center[0] + dx2, center[1] - dy1 * 0.9],
    [center[0] + dx2 * 0.95, center[1] + dy2],
    [center[0] - dx1 * 0.9, center[1] + dy2 * 1.05],
    [center[0] - dx1, center[1] - dy1], // close loop
  ];
}

export function projectsToGeoJSON(projects: Project[], risks: Record<string, { band: string; overallPct: number }>) {
  return {
    type: 'FeatureCollection' as const,
    features: projects.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: p.coords },
      properties: {
        id: p.id,
        name: p.name,
        state: p.state,
        district: p.district,
        status: p.status,
        budget: p.estimatedBudgetCr,
        risk: risks[p.id]?.overallPct ?? 0,
        band: risks[p.id]?.band ?? 'low',
        color: riskColor(risks[p.id]?.band ?? 'low'),
      },
    })),
  };
}

/** GeoJSON FeatureCollection of Parcel Polygons for 2D GIS fill/outline rendering */
export function parcelsToPolygonsGeoJSON(parcels: Parcel[]) {
  return {
    type: 'FeatureCollection' as const,
    features: parcels.map((p, i) => {
      const polyCoords = p.polygonCoords && p.polygonCoords.length >= 4 ? p.polygonCoords : generateParcelPolygon(p.coords, p.areaSqFt, i + 1);
      const color = getParcelColor(p);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polyCoords],
        },
        properties: {
          id: p.id,
          projectId: p.projectId,
          ownerRef: p.ownerRef,
          areaSqFt: p.areaSqFt,
          impact: p.impact,
          landType: p.landType,
          verification: p.verification,
          acquisitionStatus: p.acquisitionStatus,
          responseStatus: p.responseStatus ?? 'PENDING',
          notificationStatus: p.notificationStatus ?? 'SENT',
          documentsComplete: p.documentsComplete,
          documentsRequired: p.documentsRequired,
          disputed: p.disputed,
          riskContribution: p.riskContribution,
          color,
        },
      };
    }),
  };
}

export function parcelsToPointsGeoJSON(parcels: Parcel[]) {
  return {
    type: 'FeatureCollection' as const,
    features: parcels.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: p.coords },
      properties: {
        ...p,
        color: getParcelColor(p),
      },
    })),
  };
}

export function routeToGeoJSON(route: Route) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: route.path },
        properties: {
          id: route.id,
          label: route.label,
          strategy: route.strategy,
          distanceKm: route.distanceKm,
          estimatedCostCr: route.estimatedCostCr,
          aiRecommended: route.aiRecommended,
          delayProbabilityPct: route.delayProbabilityPct,
        },
      },
    ],
  };
}

export function routesToGeoJSON(routes: Route[]) {
  return {
    type: 'FeatureCollection' as const,
    features: routes.map((r) => ({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: r.path },
      properties: {
        id: r.id,
        label: r.label,
        strategy: r.strategy,
        distanceKm: r.distanceKm,
        estimatedCostCr: r.estimatedCostCr,
        aiRecommended: r.aiRecommended,
        delayProbabilityPct: r.delayProbabilityPct,
        color: r.label === 'Route A' ? '#38d3f0' : r.label === 'Route B' ? '#e8d15c' : r.label === 'Route C' ? '#4fbf7c' : '#f0a742',
      },
    })),
  };
}

/** Generates a wide corridor polygon around a route path to visualize the highway footprint ribbon */
export function corridorToPolygonGeoJSON(route: Route, bufferMeters = 30) {
  const path = route.path;
  if (!path || path.length < 2) return null;

  const leftCoords: LonLat[] = [];
  const rightCoords: LonLat[] = [];

  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    let dx = 0;
    let dy = 0;

    if (i < path.length - 1) {
      dx = path[i + 1][0] - p[0];
      dy = path[i + 1][1] - p[1];
    } else {
      dx = p[0] - path[i - 1][0];
      dy = p[1] - path[i - 1][1];
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const degLon = bufferMeters / (111000 * Math.cos((p[1] * Math.PI) / 180));
    const degLat = bufferMeters / 111000;

    leftCoords.push([p[0] + nx * degLon, p[1] + ny * degLat]);
    rightCoords.unshift([p[0] - nx * degLon, p[1] - ny * degLat]);
  }

  const ring = [...leftCoords, ...rightCoords, leftCoords[0]];

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [ring],
        },
        properties: {
          id: `corridor-${route.id}`,
          label: `${route.label} Highway Corridor`,
          widthMeters: bufferMeters * 2,
        },
      },
    ],
  };
}

/** Approximate circular buffer polygon around a point, in degrees — for fictional risk-zone shading only */
export function circlePolygon(center: LonLat, radiusDeg: number, points = 48): LonLat[] {
  const coords: LonLat[] = [];
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * 2 * Math.PI;
    coords.push([center[0] + radiusDeg * Math.cos(a), center[1] + radiusDeg * Math.sin(a) * 0.8]);
  }
  return coords;
}

/** Fictional building footprints and diverse architectural archetypes along the project corridor */
export interface DemoBuilding {
  id: string;
  name: string;
  type: 'Commercial Tower' | 'Residential Apartment' | 'Institutional' | 'Industrial' | 'Low-rise Residential';
  coords?: LonLat[];
  center: LonLat;
  widthM: number;
  lengthM: number;
  heightMeters: number;
  colorHex: string;
  roofColorHex: string;
  hasRooftopStructure?: boolean;
}

export function getDemoBuildings(projectCoords: LonLat) {
  const [cx, cy] = projectCoords;

  // Curated diverse urban layout inspired by real metropolitan highway corridors (high-rise core, mid-rise residential, civic zones)
  const rawBuildings: DemoBuilding[] = [
    // 1. DOWNTOWN COMMERCIAL GLASS SKYLINE (North-West Sector)
    { id: 'BLD-CW-01', name: 'Tech Park Tower Alpha', type: 'Commercial Tower', center: [cx - 0.012, cy + 0.008], widthM: 65, lengthM: 55, heightMeters: 140, colorHex: '#25415c', roofColorHex: '#182b3d', hasRooftopStructure: true },
    { id: 'BLD-CW-02', name: 'Global Finance Center', type: 'Commercial Tower', center: [cx - 0.009, cy + 0.011], widthM: 75, lengthM: 60, heightMeters: 165, colorHex: '#35597a', roofColorHex: '#213a52', hasRooftopStructure: true },
    { id: 'BLD-CW-03', name: 'Vertex Corporate Plaza', type: 'Commercial Tower', center: [cx - 0.006, cy + 0.007], widthM: 50, lengthM: 50, heightMeters: 110, colorHex: '#1f364d', roofColorHex: '#152536', hasRooftopStructure: true },
    { id: 'BLD-CW-04', name: 'Meridian Commercial Hub', type: 'Commercial Tower', center: [cx - 0.015, cy + 0.014], widthM: 58, lengthM: 48, heightMeters: 125, colorHex: '#2c4b69', roofColorHex: '#1c3145', hasRooftopStructure: true },
    { id: 'BLD-CW-05', name: 'Cyber Heights Tower', type: 'Commercial Tower', center: [cx - 0.003, cy + 0.013], widthM: 45, lengthM: 45, heightMeters: 95, colorHex: '#385e82', roofColorHex: '#243e57', hasRooftopStructure: true },

    // 2. MID-RISE RESIDENTIAL APARTMENTS & BLOCKS (Flanking the highway viaduct)
    { id: 'BLD-RS-01', name: 'Ennore Greens Block A', type: 'Residential Apartment', center: [cx - 0.008, cy + 0.002], widthM: 70, lengthM: 40, heightMeters: 55, colorHex: '#5c4838', roofColorHex: '#3d3025', hasRooftopStructure: true },
    { id: 'BLD-RS-02', name: 'Ennore Greens Block B', type: 'Residential Apartment', center: [cx - 0.006, cy + 0.001], widthM: 70, lengthM: 40, heightMeters: 55, colorHex: '#5c4838', roofColorHex: '#3d3025', hasRooftopStructure: true },
    { id: 'BLD-RS-03', name: 'Ennore Greens Block C', type: 'Residential Apartment', center: [cx - 0.004, cy + 0.003], widthM: 65, lengthM: 38, heightMeters: 62, colorHex: '#695341', roofColorHex: '#423429', hasRooftopStructure: true },
    { id: 'BLD-RS-04', name: 'Metro View Residences A', type: 'Residential Apartment', center: [cx + 0.003, cy + 0.006], widthM: 80, lengthM: 45, heightMeters: 68, colorHex: '#524338', roofColorHex: '#362c25', hasRooftopStructure: true },
    { id: 'BLD-RS-05', name: 'Metro View Residences B', type: 'Residential Apartment', center: [cx + 0.005, cy + 0.007], widthM: 80, lengthM: 45, heightMeters: 68, colorHex: '#524338', roofColorHex: '#362c25', hasRooftopStructure: true },
    { id: 'BLD-RS-06', name: 'Grand Horizon Heights', type: 'Residential Apartment', center: [cx + 0.008, cy + 0.009], widthM: 60, lengthM: 50, heightMeters: 75, colorHex: '#5e4e42', roofColorHex: '#3b312a', hasRooftopStructure: true },
    { id: 'BLD-RS-07', name: 'Sunrise Bay Towers', type: 'Residential Apartment', center: [cx + 0.012, cy + 0.012], widthM: 55, lengthM: 55, heightMeters: 82, colorHex: '#635347', roofColorHex: '#3e342c', hasRooftopStructure: true },

    // 3. URBAN INFILL & MULTI-FAMILY BUILDINGS (South of Highway Alignment)
    { id: 'BLD-MF-01', name: 'City Urban Block 1', type: 'Residential Apartment', center: [cx - 0.011, cy - 0.004], widthM: 50, lengthM: 35, heightMeters: 38, colorHex: '#4d4138', roofColorHex: '#332b25' },
    { id: 'BLD-MF-02', name: 'City Urban Block 2', type: 'Residential Apartment', center: [cx - 0.007, cy - 0.005], widthM: 55, lengthM: 35, heightMeters: 42, colorHex: '#54463c', roofColorHex: '#382f28' },
    { id: 'BLD-MF-03', name: 'City Urban Block 3', type: 'Residential Apartment', center: [cx - 0.003, cy - 0.006], widthM: 60, lengthM: 38, heightMeters: 46, colorHex: '#4d4138', roofColorHex: '#332b25' },
    { id: 'BLD-MF-04', name: 'Southern Gateway Apartments', type: 'Residential Apartment', center: [cx + 0.002, cy - 0.005], widthM: 75, lengthM: 40, heightMeters: 52, colorHex: '#57483d', roofColorHex: '#3b3129' },
    { id: 'BLD-MF-05', name: 'Corridor Residency Complex', type: 'Residential Apartment', center: [cx + 0.007, cy - 0.003], widthM: 85, lengthM: 42, heightMeters: 58, colorHex: '#5e4e42', roofColorHex: '#3e342c' },
    { id: 'BLD-MF-06', name: 'Highland Park Flats', type: 'Residential Apartment', center: [cx + 0.011, cy - 0.002], widthM: 65, lengthM: 45, heightMeters: 48, colorHex: '#54463c', roofColorHex: '#382f28' },

    // 4. CIVIC & INSTITUTIONAL COMPLEXES
    { id: 'BLD-INS-01', name: 'Govt Model Higher Secondary Campus', type: 'Institutional', center: [cx + 0.007, cy + 0.004], widthM: 95, lengthM: 70, heightMeters: 24, colorHex: '#3c4d5e', roofColorHex: '#25303b' },
    { id: 'BLD-INS-02', name: 'District Multi-Specialty Hospital', type: 'Institutional', center: [cx - 0.009, cy - 0.006], widthM: 110, lengthM: 85, heightMeters: 36, colorHex: '#425569', roofColorHex: '#2a3642', hasRooftopStructure: true },
    { id: 'BLD-INS-03', name: 'Revenue & Cadastral Administration Center', type: 'Institutional', center: [cx + 0.001, cy + 0.012], widthM: 80, lengthM: 60, heightMeters: 28, colorHex: '#4a5b6d', roofColorHex: '#2f3b47' },

    // 5. INDUSTRIAL WAREHOUSING & FREIGHT LOGISTICS
    { id: 'BLD-IND-01', name: 'Port Logistics Hub Warehouse A', type: 'Industrial', center: [cx + 0.018, cy - 0.007], widthM: 130, lengthM: 65, heightMeters: 18, colorHex: '#3a4450', roofColorHex: '#262d36' },
    { id: 'BLD-IND-02', name: 'Port Logistics Hub Warehouse B', type: 'Industrial', center: [cx + 0.021, cy - 0.005], widthM: 120, lengthM: 60, heightMeters: 18, colorHex: '#3a4450', roofColorHex: '#262d36' },
    { id: 'BLD-IND-03', name: 'Automotive Freight Depot', type: 'Industrial', center: [cx + 0.024, cy - 0.003], widthM: 140, lengthM: 70, heightMeters: 20, colorHex: '#333c47', roofColorHex: '#21272e' },

    // 6. LOW-RISE PERI-URBAN HOUSES & SETTLEMENTS (Cadastral land parcels border)
    { id: 'BLD-LR-01', name: 'Sector 4 Residential Colony A', type: 'Low-rise Residential', center: [cx - 0.002, cy + 0.001], widthM: 35, lengthM: 25, heightMeters: 12, colorHex: '#4a423b', roofColorHex: '#312c27' },
    { id: 'BLD-LR-02', name: 'Sector 4 Residential Colony B', type: 'Low-rise Residential', center: [cx + 0.001, cy + 0.002], widthM: 35, lengthM: 25, heightMeters: 14, colorHex: '#4a423b', roofColorHex: '#312c27' },
    { id: 'BLD-LR-03', name: 'Village Homestead Settlement', type: 'Low-rise Residential', center: [cx + 0.015, cy + 0.003], widthM: 40, lengthM: 30, heightMeters: 10, colorHex: '#423b35', roofColorHex: '#2c2723' },
    { id: 'BLD-LR-04', name: 'Agricultural Farm Houses', type: 'Low-rise Residential', center: [cx + 0.019, cy + 0.006], widthM: 45, lengthM: 35, heightMeters: 11, colorHex: '#423b35', roofColorHex: '#2c2723' },
  ];

  // Synthesize exact polygon footprint rings for 2D MapLibre and 3D Cesium
  const features = rawBuildings.map((b) => {
    const degLat = (b.lengthM / 111000) * 0.5;
    const degLon = (b.widthM / (111000 * Math.cos((b.center[1] * Math.PI) / 180))) * 0.5;
    const poly: LonLat[] = [
      [b.center[0] - degLon, b.center[1] - degLat],
      [b.center[0] + degLon, b.center[1] - degLat],
      [b.center[0] + degLon, b.center[1] + degLat],
      [b.center[0] - degLon, b.center[1] + degLat],
      [b.center[0] - degLon, b.center[1] - degLat],
    ];

    return {
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [poly] },
      properties: {
        ...b,
        coords: poly,
      },
    };
  });

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

/** Compute concrete pier support column positions underneath the elevated viaduct at regular intervals */
export function getViaductPierPositions(path: LonLat[], spacingKm = 0.45): { lon: number; lat: number; heading: number }[] {
  if (!path || path.length < 2) return [];

  const piers: { lon: number; lat: number; heading: number }[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    const dLon = p2[0] - p1[0];
    const dLat = p2[1] - p1[1];
    const segDist = Math.sqrt(dLon * dLon + dLat * dLat);
    const heading = Math.atan2(dLon, dLat);

    const steps = Math.max(3, Math.floor(segDist / (spacingKm * 0.009)));
    for (let s = 1; s < steps; s++) {
      const frac = s / steps;
      piers.push({
        lon: p1[0] + dLon * frac,
        lat: p1[1] + dLat * frac,
        heading,
      });
    }
  }

  return piers;
}

/** River waterway channel running through the terrain */
export function getDemoRiverPath(projectCoords: LonLat): LonLat[] {
  const [cx, cy] = projectCoords;
  return [
    [cx - 0.022, cy - 0.016],
    [cx - 0.014, cy - 0.009],
    [cx - 0.004, cy + 0.002],
    [cx + 0.006, cy + 0.012],
    [cx + 0.018, cy + 0.024],
    [cx + 0.028, cy + 0.032],
  ];
}

/** Railway track corridor crossing the region */
export function getDemoRailwayPath(projectCoords: LonLat): LonLat[] {
  const [cx, cy] = projectCoords;
  return [
    [cx - 0.025, cy + 0.018],
    [cx - 0.01, cy + 0.006],
    [cx + 0.008, cy - 0.007],
    [cx + 0.022, cy - 0.017],
    [cx + 0.035, cy - 0.025],
  ];
}

/** Fictional infrastructure landmarks along the project corridor */
export function getDemoInfrastructure(projectCoords: LonLat) {
  const [cx, cy] = projectCoords;
  return [
    { id: 'INF-01', name: 'DEMO Govt. Model Higher Secondary School', type: 'School', coords: [cx + 0.007, cy + 0.004] as LonLat, icon: '🏫' },
    { id: 'INF-02', name: 'DEMO District Community Hospital', type: 'Hospital', coords: [cx - 0.009, cy - 0.006] as LonLat, icon: '🏥' },
    { id: 'INF-03', name: 'DEMO Southern Railway Main Line Crossing', type: 'Railway', coords: [cx + 0.008, cy - 0.007] as LonLat, icon: '🚆' },
    { id: 'INF-04', name: 'DEMO Kosasthalaiyar Waterway Channel', type: 'Waterbody', coords: [cx - 0.004, cy + 0.002] as LonLat, icon: '🌊' },
    { id: 'INF-05', name: 'DEMO 230kV High Tension Powerline Corridor', type: 'Utility', coords: [cx + 0.016, cy + 0.007] as LonLat, icon: '⚡' },
  ];
}

export function infrastructureToGeoJSON(infra: ReturnType<typeof getDemoInfrastructure>) {
  return {
    type: 'FeatureCollection' as const,
    features: infra.map((item) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: item.coords },
      properties: { ...item },
    })),
  };
}

export function stakeholdersToGeoJSON(stakeholders: Stakeholder[], parcels: Parcel[]) {
  const parcelMap = new Map(parcels.map((p) => [p.id, p]));
  return {
    type: 'FeatureCollection' as const,
    features: stakeholders.map((s) => {
      const p = parcelMap.get(s.parcelId);
      const coords: LonLat = p ? [p.coords[0] + 0.002, p.coords[1] + 0.002] : [80.237, 13.087];
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: {
          id: s.id,
          ref: s.ref,
          name: s.name ?? s.ref,
          projectId: s.projectId,
          parcelId: s.parcelId,
          status: s.status,
          responseStatus: s.responseStatus,
          notificationStatus: s.notificationStatus,
          documentsComplete: s.documentsComplete,
        },
      };
    }),
  };
}

export function fieldCasesToGeoJSON(cases: VerificationCase[], parcels: Parcel[]) {
  const parcelMap = new Map(parcels.map((p) => [p.id, p]));
  return {
    type: 'FeatureCollection' as const,
    features: cases.map((c) => {
      const p = parcelMap.get(c.parcelId);
      const coords: LonLat = p ? [p.coords[0] - 0.0015, p.coords[1] - 0.0015] : [80.237, 13.087];
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: {
          id: c.id,
          parcelId: c.parcelId,
          officerRef: c.officerRef,
          location: c.location,
          priority: c.priority,
          status: c.status,
          photosCount: c.photosCount,
        },
      };
    }),
  };
}

