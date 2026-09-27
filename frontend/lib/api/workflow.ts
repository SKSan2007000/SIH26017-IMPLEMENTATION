import { http, isBackendConfigured } from './httpClient';

export interface WorkflowTransitionResponse {
  projectId: string;
  projectName: string;
  previousState: string;
  currentState: string;
  overallProgress: number;
  landAcquisitionProgress: number;
  constructionProgress: number;
  transitionTimestamp: string;
  auditLogId: string;
}

export interface ParcelWorkflowResponse {
  parcelId: string;
  projectId: string;
  previousStatus: string;
  currentStatus: string;
  verification: string;
  acquisitionStatus: string;
  disputed: boolean;
  updatedAt: string;
}

export const workflowApi = {
  getWorkflowStates: async (): Promise<{ projectWorkflowStates: string[]; parcelWorkflowStates: string[] }> => {
    if (!isBackendConfigured()) {
      return {
        projectWorkflowStates: [
          'DRAFT', 'PLANNING', 'ROUTE_ANALYSIS', 'ROUTE_APPROVAL', 'LAND_IDENTIFICATION',
          'STAKEHOLDER_NOTIFICATION', 'FIELD_VERIFICATION', 'DOCUMENT_VERIFICATION',
          'COMPENSATION', 'ACQUISITION', 'CONSTRUCTION', 'MONITORING', 'FINAL_VERIFICATION',
          'COMPLETED', 'CLOSED',
        ],
        parcelWorkflowStates: [
          'IDENTIFIED', 'NOTICE_PENDING', 'NOTICE_SENT', 'OWNER_RESPONDED',
          'FIELD_VERIFICATION_PENDING', 'FIELD_VERIFIED', 'DOCUMENTS_PENDING',
          'DOCUMENTS_VERIFIED', 'COMPENSATION_PENDING', 'COMPENSATION_COMPLETED',
          'ACQUISITION_PENDING', 'ACQUIRED', 'DISPUTED', 'ON_HOLD',
        ],
      };
    }
    return http.get('/api/v1/workflow/states');
  },

  transitionProjectState: async (
    projectId: string,
    targetState: string,
    notes?: string
  ): Promise<WorkflowTransitionResponse> => {
    if (!isBackendConfigured()) {
      return {
        projectId,
        projectName: 'Infrastructure Corridor',
        previousState: 'PLANNING',
        currentState: targetState,
        overallProgress: 45.0,
        landAcquisitionProgress: 50.0,
        constructionProgress: 0.0,
        transitionTimestamp: new Date().toISOString(),
        auditLogId: `AUD-SIM-${Date.now()}`,
      };
    }
    return http.post<WorkflowTransitionResponse>(`/api/v1/workflow/projects/${projectId}/transition`, {
      target_state: targetState,
      notes,
    });
  },

  updateParcelWorkflowStatus: async (
    parcelId: string,
    targetStatus: string,
    notes?: string
  ): Promise<ParcelWorkflowResponse> => {
    if (!isBackendConfigured()) {
      return {
        parcelId,
        projectId: 'PRJ-1042',
        previousStatus: 'IDENTIFIED',
        currentStatus: targetStatus,
        verification: 'VERIFIED',
        acquisitionStatus: 'IN_PROGRESS',
        disputed: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return http.put<ParcelWorkflowResponse>(`/api/v1/workflow/parcels/${parcelId}/status`, {
      target_status: targetStatus,
      notes,
    });
  },
};
