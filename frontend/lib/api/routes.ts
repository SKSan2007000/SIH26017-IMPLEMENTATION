import { http, isBackendConfigured } from './httpClient';
import { getMockRoutes } from '@/lib/mock';
import type { Route } from '@/types';

export const routesApi = {
  getRoutes: async (projectId: string): Promise<Route[]> => {
    if (!isBackendConfigured()) {
      return getMockRoutes(projectId);
    }
    return http.get<Route[]>(`/api/v1/projects/${projectId}/routes`);
  },

  getRouteById: async (routeId: string): Promise<Route | undefined> => {
    if (!isBackendConfigured()) {
      // Find in mock routes across projects
      const all = ['PRJ-1042', 'PRJ-1088', 'PRJ-1015', 'PRJ-1092', 'PRJ-1033'].flatMap(getMockRoutes);
      return all.find((r) => r.id === routeId);
    }
    return http.get<Route>(`/api/v1/routes/${routeId}`);
  },

  createRoute: async (projectId: string, route: Partial<Route>): Promise<Route> => {
    if (!isBackendConfigured()) {
      const mockRoutes = getMockRoutes(projectId);
      return {
        ...mockRoutes[0],
        ...route,
        id: route.id ?? `RT-${projectId.replace('PRJ-', '')}-NEW`,
        projectId,
      } as Route;
    }
    return http.post<Route>(`/api/v1/projects/${projectId}/routes`, route);
  },

  getRecommendations: async (projectId: string): Promise<Route[]> => {
    if (!isBackendConfigured()) {
      return getMockRoutes(projectId).filter((r) => r.aiRecommended);
    }
    return http.get<Route[]>(`/api/v1/projects/${projectId}/recommendations`);
  },

  evaluateRoutes: async (projectId: string): Promise<Route[]> => {
    if (!isBackendConfigured()) {
      return getMockRoutes(projectId);
    }
    return http.post<Route[]>(`/api/v1/projects/${projectId}/routes/evaluate`);
  },
};
