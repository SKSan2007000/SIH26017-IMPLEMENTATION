import { http, isBackendConfigured } from './httpClient';
import { getMockStakeholdersByProject } from '@/lib/mock';
import type { Stakeholder, DocumentRecord } from '@/types';

export const stakeholdersApi = {
  getStakeholders: async (projectId: string): Promise<Stakeholder[]> => {
    if (!isBackendConfigured()) {
      return getMockStakeholdersByProject(projectId);
    }
    return http.get<Stakeholder[]>(`/api/v1/projects/${projectId}/stakeholders`);
  },

  getStakeholder: async (id: string): Promise<Stakeholder | undefined> => {
    if (!isBackendConfigured()) {
      const all = ['PRJ-1042', 'PRJ-1088', 'PRJ-1015', 'PRJ-1092', 'PRJ-1033'].flatMap(getMockStakeholdersByProject);
      return all.find((s) => s.id === id || s.ref === id);
    }
    return http.get<Stakeholder>(`/api/v1/stakeholders/${id}`);
  },

  getStakeholderDocuments: async (stakeholderId: string): Promise<DocumentRecord[]> => {
    if (!isBackendConfigured()) {
      return [];
    }
    return http.get<DocumentRecord[]>(`/api/v1/stakeholders/${stakeholderId}/documents`);
  },

  createStakeholder: async (projectId: string, stakeholder: Partial<Stakeholder>): Promise<Stakeholder> => {
    if (!isBackendConfigured()) {
      const list = getMockStakeholdersByProject(projectId);
      return {
        ...list[0],
        ...stakeholder,
        id: stakeholder.id ?? `SH-${Date.now().toString().slice(-4)}`,
        projectId,
      } as Stakeholder;
    }
    return http.post<Stakeholder>(`/api/v1/projects/${projectId}/stakeholders`, stakeholder);
  },

  updateStakeholder: async (id: string, stakeholder: Partial<Stakeholder>): Promise<Stakeholder> => {
    if (!isBackendConfigured()) {
      const all = ['PRJ-1042', 'PRJ-1088', 'PRJ-1015', 'PRJ-1092', 'PRJ-1033'].flatMap(getMockStakeholdersByProject);
      const existing = all.find((s) => s.id === id || s.ref === id) || all[0];
      return { ...existing, ...stakeholder };
    }
    return http.put<Stakeholder>(`/api/v1/stakeholders/${id}`, stakeholder);
  },
};
