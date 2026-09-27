import { http, isBackendConfigured } from './httpClient';
import { getMockAuditByProject } from '@/lib/mock';
import type { AuditEvent } from '@/types';

export interface DetailedAuditEvent extends AuditEvent {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  details?: string;
  metadata?: any;
  timestamp?: string;
}

export const auditApi = {
  getProjectAuditTrail: async (projectId: string): Promise<DetailedAuditEvent[]> => {
    if (!isBackendConfigured()) {
      return getMockAuditByProject(projectId);
    }
    return http.get<DetailedAuditEvent[]>(`/api/v1/projects/${projectId}/audit`);
  },

  listAuditLogs: async (params?: { projectId?: string; action?: string; entity?: string }): Promise<DetailedAuditEvent[]> => {
    if (!isBackendConfigured()) {
      if (params?.projectId) return getMockAuditByProject(params.projectId);
      return [];
    }
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.action) query.append('action', params.action);
    if (params?.entity) query.append('entity', params.entity);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.get<DetailedAuditEvent[]>(`/api/v1/audit-logs${qs}`);
  },

  createAuditLog: async (log: Partial<DetailedAuditEvent>): Promise<DetailedAuditEvent> => {
    if (!isBackendConfigured()) {
      return {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        projectId: log.projectId || 'PRJ-1042',
        actor: log.actor || 'System User',
        label: log.label || 'Audit Event',
        time: new Date().toLocaleTimeString(),
        date: new Date().toISOString().split('T')[0],
      };
    }
    return http.post<DetailedAuditEvent>('/api/v1/audit-logs', {
      project_id: log.projectId,
      user_id: log.userId,
      actor: log.actor,
      action: log.action || 'CUSTOM_ACTION',
      entity: log.entity || 'System',
      entity_id: log.entityId || log.projectId,
      label: log.label,
      category: log.category || 'System',
      details: log.details,
      extra_metadata: log.metadata,
    });
  },
};
