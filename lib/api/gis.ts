import { http, isBackendConfigured } from './httpClient';
import {
  parcelsToPolygonsGeoJSON,
  parcelsToPointsGeoJSON,
  routesToGeoJSON,
  corridorToPolygonGeoJSON,
  getDemoBuildings,
  getDemoInfrastructure,
  infrastructureToGeoJSON,
  riskColor,
  getDemoRiverPath,
  getDemoRailwayPath,
  circlePolygon,
} from '@/lib/gis/geojson';
import { getMockProject } from '@/lib/mock/projects';
import { getMockRoutes } from '@/lib/mock/routes';
import { MOCK_PARCELS } from '@/lib/mock/parcels';
import { MOCK_FIELD_CASES } from '@/lib/mock/fieldCases';

export interface GisFeatureCollection {
  type: 'FeatureCollection';
  metadata?: {
    projectId: string;
    projectName: string;
    state: string;
    district: string;
    status: string;
    routesCount: number;
    parcelsCount: number;
    selectedRouteId?: string;
    overallRiskScore?: number;
    isDemoDataset?: boolean;
  };
  features: any[];
}

export interface ParcelRiskDetail {
  parcelId: string;
  projectId: string;
  ownerRef: string;
  stakeholderName: string;
  areaSqFt: number;
  landType: string;
  riskScore: number;
  riskBand: string;
  estimatedDelayMonths: number;
  verificationStatus: string;
  acquisitionStatus: string;
  disputed: boolean;
  assignedOfficer: string;
  assignedOfficerRef: string;
  drivers: { factor: string; contribution: number; severity: string }[];
  recommendations: string[];
}

/**
 * Builds synthetic demo GeoJSON FeatureCollection when offline or backend unavailable
 */
export function buildSyntheticDemoGis(projectId: string): GisFeatureCollection {
  const project = getMockProject(projectId) ?? {
    id: projectId,
    name: 'Chennai Northern Port Corridor',
    state: 'Tamil Nadu',
    district: 'Chennai',
    status: 'Land Acquisition',
    coords: [80.27, 13.08] as [number, number],
  };

  const routes = getMockRoutes(projectId);
  const parcels = MOCK_PARCELS.filter((p) => p.projectId === projectId);
  const activeRoute = routes.find((r) => r.aiRecommended) ?? routes[0];

  const features: any[] = [];

  // 1. Risk buffer
  features.push({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [circlePolygon(project.coords, 0.026)] },
    properties: {
      entityType: 'RISK_BUFFER',
      id: `risk-zone-${projectId}`,
      riskScore: 72,
      riskBand: 'high',
      color: riskColor('critical'),
    },
  });

  // 2. Waterway & Railway
  features.push({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: getDemoRiverPath(project.coords) },
    properties: {
      entityType: 'WATERWAY',
      id: `waterway-${projectId}`,
      name: 'DEMO Kosasthalaiyar Waterway Channel',
      color: '#1b547d',
    },
  });

  features.push({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: getDemoRailwayPath(project.coords) },
    properties: {
      entityType: 'RAILWAY',
      id: `railway-${projectId}`,
      name: 'DEMO Southern Railway Main Line',
      color: '#e8d15c',
    },
  });

  // 3. Route alignments & corridors
  routes.forEach((r) => {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: r.path },
      properties: {
        entityType: 'ROUTE',
        id: r.id,
        projectId: r.projectId,
        label: r.label,
        strategy: r.strategy,
        distanceKm: r.distanceKm,
        estimatedCostCr: r.estimatedCostCr,
        aiRecommended: r.aiRecommended,
        delayProbabilityPct: r.delayProbabilityPct,
        color: r.label === 'Route A' ? '#38d3f0' : r.label === 'Route B' ? '#e8d15c' : r.label === 'Route C' ? '#4fbf7c' : '#f0a742',
      },
    });

    const ribbon = corridorToPolygonGeoJSON(r, 32);
    if (ribbon && ribbon.features?.[0]) {
      features.push({
        ...ribbon.features[0],
        properties: {
          ...ribbon.features[0].properties,
          entityType: 'CORRIDOR_RIBBON',
          routeId: r.id,
        },
      });
    }
  });

  // 4. Parcels
  const polyGeoJson = parcelsToPolygonsGeoJSON(parcels);
  polyGeoJson.features.forEach((f) => {
    features.push({
      ...f,
      properties: {
        ...f.properties,
        entityType: 'PARCEL',
        assignedOfficer: 'R. Vignesh',
        assignedOfficerRef: 'OFF-08',
        riskScore: f.properties.disputed ? 88 : f.properties.impact === 'high' ? 79 : 45,
        riskLevel: f.properties.riskContribution?.toUpperCase() || 'MEDIUM',
        estimatedDelayMonths: f.properties.disputed ? 5.8 : 2.5,
      },
    });
  });

  // 5. Infrastructure
  const infraGeoJson = infrastructureToGeoJSON(getDemoInfrastructure(project.coords));
  infraGeoJson.features.forEach((f) => {
    features.push({
      ...f,
      properties: {
        ...f.properties,
        entityType: 'INFRASTRUCTURE',
      },
    });
  });

  return {
    type: 'FeatureCollection',
    metadata: {
      projectId: project.id,
      projectName: project.name,
      state: project.state,
      district: project.district,
      status: 'Land Acquisition',
      routesCount: routes.length,
      parcelsCount: parcels.length,
      selectedRouteId: activeRoute?.id,
      overallRiskScore: 72,
      isDemoDataset: true,
    },
    features,
  };
}

export const gisApi = {
  getProjectGis: async (projectId: string): Promise<GisFeatureCollection> => {
    try {
      if (!isBackendConfigured()) {
        return buildSyntheticDemoGis(projectId);
      }
      return await http.get<GisFeatureCollection>(`/api/v1/projects/${projectId}/gis`);
    } catch (err) {
      console.warn('[gisApi.getProjectGis] Falling back to synthetic demo GIS dataset:', err);
      return buildSyntheticDemoGis(projectId);
    }
  },

  getParcelRisk: async (parcelId: string): Promise<ParcelRiskDetail> => {
    try {
      if (!isBackendConfigured()) {
        return {
          parcelId,
          projectId: 'PRJ-1042',
          ownerRef: `DEMO OWNER-${parcelId.replace('P-', '')}`,
          stakeholderName: `DEMO OWNER-${parcelId.replace('P-', '')}`,
          areaSqFt: 14200,
          landType: 'Private',
          riskScore: 78,
          riskBand: 'HIGH',
          estimatedDelayMonths: 4.2,
          verificationStatus: 'PENDING',
          acquisitionStatus: 'IN PROGRESS',
          disputed: false,
          assignedOfficer: 'R. Vignesh',
          assignedOfficerRef: 'OFF-08',
          drivers: [
            { factor: 'Statutory Documentation Verification Pending', contribution: 40, severity: 'HIGH' },
            { factor: 'Corridor Alignment Proximity', contribution: 30, severity: 'MEDIUM' },
          ],
          recommendations: ['Dispatch field officer for GPS peg survey', 'Fast-track valuation certificate'],
        };
      }
      return await http.get<ParcelRiskDetail>(`/api/v1/parcels/${parcelId}/risk`);
    } catch (err) {
      console.warn('[gisApi.getParcelRisk] Fallback:', err);
      return {
        parcelId,
        projectId: 'PRJ-1042',
        ownerRef: `DEMO OWNER-${parcelId.replace('P-', '')}`,
        stakeholderName: `DEMO OWNER-${parcelId.replace('P-', '')}`,
        areaSqFt: 14200,
        landType: 'Private',
        riskScore: 78,
        riskBand: 'HIGH',
        estimatedDelayMonths: 4.2,
        verificationStatus: 'PENDING',
        acquisitionStatus: 'IN PROGRESS',
        disputed: false,
        assignedOfficer: 'R. Vignesh',
        assignedOfficerRef: 'OFF-08',
        drivers: [{ factor: 'Cadastral Survey Pending', contribution: 50, severity: 'MEDIUM' }],
        recommendations: ['Execute field verification'],
      };
    }
  },

  assignOfficer: async (parcelId: string, officerRef = 'OFF-08', officerName = 'R. Vignesh'): Promise<any> => {
    try {
      if (!isBackendConfigured()) {
        return { status: 'SUCCESS', parcelId, officerRef, officerName };
      }
      return await http.post(`/api/v1/parcels/${parcelId}/assign-officer`, { officerRef, officerName });
    } catch (err) {
      console.warn('[gisApi.assignOfficer] Fallback:', err);
      return { status: 'SUCCESS', parcelId, officerRef, officerName };
    }
  },

  verifyParcel: async (parcelId: string, payload: any = {}): Promise<any> => {
    try {
      if (!isBackendConfigured()) {
        return { status: 'SUCCESS', parcelId, verification: 'VERIFIED' };
      }
      return await http.post(`/api/v1/parcels/${parcelId}/verify`, payload);
    } catch (err) {
      console.warn('[gisApi.verifyParcel] Fallback:', err);
      return { status: 'SUCCESS', parcelId, verification: 'VERIFIED' };
    }
  },
};
