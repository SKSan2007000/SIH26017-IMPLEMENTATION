import { http, isBackendConfigured } from './httpClient';
import { getMockParcelsByProject, getMockParcelsByRoute } from '@/lib/mock';
import type { Parcel } from '@/types';

export interface AffectedParcelSpatialItem {
  id: string;
  parcelId: string;
  projectId: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  coords: [number, number];
  polygonCoords?: [number, number][];
  area: number;
  areaSqFt: number;
  impact: string;
  risk: string;
  riskContribution: string;
  stakeholderId: string;
  ownerRef: string;
  landType: string;
  verification: string;
  acquisitionStatus: string;
  disputed: boolean;
  structuresPresent?: boolean;
}

export const parcelsApi = {
  getParcels: async (projectId: string): Promise<Parcel[]> => {
    if (!isBackendConfigured()) {
      return getMockParcelsByProject(projectId);
    }
    return http.get<Parcel[]>(`/api/v1/projects/${projectId}/parcels`);
  },

  getParcelsByRoute: async (routeId: string): Promise<Parcel[]> => {
    if (!isBackendConfigured()) {
      return getMockParcelsByRoute(routeId);
    }
    return http.get<Parcel[]>(`/api/v1/routes/${routeId}/parcels`);
  },

  getAffectedParcelsSpatial: async (routeId: string): Promise<AffectedParcelSpatialItem[]> => {
    if (!isBackendConfigured()) {
      const mockParcels = getMockParcelsByRoute(routeId);
      return mockParcels.map((p) => ({
        id: p.id,
        parcelId: p.id,
        projectId: p.projectId,
        geometry: {
          type: p.polygonCoords ? 'Polygon' : 'Point',
          coordinates: p.polygonCoords || p.coords,
        },
        coords: p.coords,
        polygonCoords: p.polygonCoords,
        area: p.areaSqFt,
        areaSqFt: p.areaSqFt,
        impact: p.impact,
        risk: p.riskContribution,
        riskContribution: p.riskContribution,
        stakeholderId: p.ownerRef,
        ownerRef: p.ownerRef,
        landType: p.landType,
        verification: p.verification,
        acquisitionStatus: p.acquisitionStatus,
        disputed: p.disputed,
        structuresPresent: p.structuresPresent,
      }));
    }
    return http.get<AffectedParcelSpatialItem[]>(`/api/v1/routes/${routeId}/affected-parcels`);
  },

  getParcel: async (id: string): Promise<Parcel | undefined> => {
    if (!isBackendConfigured()) {
      const all = ['PRJ-1042', 'PRJ-1088', 'PRJ-1015', 'PRJ-1092', 'PRJ-1033'].flatMap(getMockParcelsByProject);
      return all.find((p) => p.id === id);
    }
    return http.get<Parcel>(`/api/v1/parcels/${id}`);
  },

  createParcel: async (projectId: string, parcel: Partial<Parcel>): Promise<Parcel> => {
    if (!isBackendConfigured()) {
      const mockList = getMockParcelsByProject(projectId);
      return {
        ...mockList[0],
        ...parcel,
        id: parcel.id ?? `P-${Date.now().toString().slice(-4)}`,
        projectId,
      } as Parcel;
    }
    return http.post<Parcel>(`/api/v1/projects/${projectId}/parcels`, parcel);
  },

  updateParcel: async (id: string, parcel: Partial<Parcel>): Promise<Parcel> => {
    if (!isBackendConfigured()) {
      const all = ['PRJ-1042', 'PRJ-1088', 'PRJ-1015', 'PRJ-1092', 'PRJ-1033'].flatMap(getMockParcelsByProject);
      const existing = all.find((p) => p.id === id) || all[0];
      return { ...existing, ...parcel };
    }
    return http.put<Parcel>(`/api/v1/parcels/${id}`, parcel);
  },
};
