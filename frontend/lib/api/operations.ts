import { http, isBackendConfigured, getApiBaseUrl, normalizePath } from './httpClient';
import { MOCK_OFFICERS } from '@/lib/mock';

export interface TodayOperationItem {
  id: string;
  type: string;
  title: string;
  location?: string;
  assignedOfficer?: string;
  priority?: string;
  status: string;
  projectId?: string;
  parcelId?: string;
  deadline?: string;
  delayLabel?: string;
}

export interface TodayOperationsResponse {
  date: string;
  totalOperationsCount: number;
  criticalCount: number;
  highCount: number;
  pendingCount: number;
  overdueCount: number;
  completedCount: number;
  critical: TodayOperationItem[];
  high: TodayOperationItem[];
  pending: TodayOperationItem[];
  overdue: TodayOperationItem[];
  completed: TodayOperationItem[];
}

export interface OfficerLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  role: string;
  district: string;
  completedTasks: number;
  onTimeRatePct: number;
  averageResponseSec: number;
  verificationAccuracyPct: number;
  totalPoints: number;
  tier: string;
  isAvailable: boolean;
}

export interface InterventionHistoryItem {
  id: string;
  projectId: string;
  actionTitle: string;
  category: string;
  riskBefore: number;
  riskAfter: number;
  improvementPoints: number;
  delayBeforeMonths: number;
  delayAfterMonths: number;
  officerName: string;
  status: string;
  completedAt?: string;
}

export interface GovernmentAlertItem {
  id: string;
  projectId: string;
  projectName: string;
  riskScore: number;
  reason: string;
  affectedArea: string;
  affectedParcelsCount: number;
  affectedPopulation: number;
  recommendedAction: string;
  responsibleAuthority: string;
  severity: string;
  status: string;
  demoFlag: string;
  createdAt: string;
}

export const operationsApi = {
  getTodaysOperations: async (projectId?: string): Promise<TodayOperationsResponse> => {
    if (!isBackendConfigured()) {
      return {
        date: new Date().toISOString().split('T')[0],
        totalOperationsCount: 12,
        criticalCount: 2,
        highCount: 3,
        pendingCount: 4,
        overdueCount: 1,
        completedCount: 2,
        critical: [
          {
            id: 'CRIT-01',
            type: 'DISPUTED_PARCEL',
            title: 'Cadastral Dispute on Parcel P-108 (DEMO OWNER-008)',
            location: 'Ennore North Section 2',
            priority: 'Critical',
            status: 'DISPUTED',
            projectId: 'PRJ-1042',
          },
        ],
        high: [
          {
            id: 'HIGH-01',
            type: 'CITIZEN_GRIEVANCE',
            title: 'Canal Crossing Alignment Dispute',
            location: 'Kosasthalaiyar River',
            priority: 'High',
            status: 'Under Review',
            projectId: 'PRJ-1042',
          },
        ],
        pending: [
          {
            id: 'PEND-01',
            type: 'FIELD_TASK',
            title: 'Boundary Peg Verification on P-105',
            assignedOfficer: 'R. Vignesh (Senior Field Officer)',
            priority: 'Medium',
            status: 'Assigned',
            projectId: 'PRJ-1042',
          },
        ],
        overdue: [],
        completed: [
          {
            id: 'COMP-01',
            type: 'PARCEL_ACQUIRED',
            title: 'Parcel P-101 Acquired & Possessed',
            status: 'ACQUIRED',
            projectId: 'PRJ-1042',
          },
        ],
      };
    }
    const query = projectId ? `?project_id=${projectId}` : '';
    return http.get<TodayOperationsResponse>(`/api/v1/operations/today${query}`);
  },

  getDailySummary: async (): Promise<any> => {
    if (!isBackendConfigured()) {
      return {
        reportDate: new Date().toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
      };
    }
    return http.get('/api/v1/operations/daily-summary');
  },

  getLeaderboard: async (limit: number = 20): Promise<OfficerLeaderboardEntry[]> => {
    if (!isBackendConfigured()) {
      return MOCK_OFFICERS.map((o, idx) => ({
        rank: idx + 1,
        id: o.id,
        name: o.name,
        role: o.role,
        district: o.activeDistrict || 'Chennai',
        completedTasks: o.tasksCompleted,
        onTimeRatePct: o.onTimeRatePct,
        averageResponseSec: 90.0,
        verificationAccuracyPct: o.verificationQualityPct,
        totalPoints: o.points,
        tier: o.points > 250 ? 'Diamond' : o.points > 150 ? 'Platinum' : 'Gold',
        isAvailable: true,
      }));
    }
    return http.get<OfficerLeaderboardEntry[]>(`/api/v1/operations/officers/leaderboard?limit=${limit}`);
  },

  autoAssignTask: async (params: {
    parcel_id: string;
    project_id: string;
    location: string;
    priority?: string;
    district?: string;
    task_type?: string;
  }): Promise<any> => {
    if (!isBackendConfigured()) {
      return { taskId: `VER-${Date.now()}`, assignedOfficer: 'R. Vignesh', status: 'Assigned' };
    }
    return http.post('/api/v1/operations/assignments/auto', params);
  },

  acceptTask: async (taskId: string, officerId: string): Promise<any> => {
    if (!isBackendConfigured()) {
      return { taskId, status: 'In Progress', acceptedAt: new Date().toISOString() };
    }
    return http.post(`/api/v1/operations/tasks/${taskId}/accept`, { officer_id: officerId });
  },

  completeTask: async (taskId: string, params: {
    officer_id: string;
    gps_coordinates?: number[];
    photo_evidence_ref?: string;
    video_evidence_ref?: string;
    observation?: string;
  }): Promise<any> => {
    if (!isBackendConfigured()) {
      return { taskId, status: 'Awaiting Supervisor Verification', slaStatus: 'ON_TIME' };
    }
    return http.post(`/api/v1/operations/tasks/${taskId}/complete`, params);
  },

  reviewTask: async (taskId: string, supervisorId: string, decision: string = 'APPROVED'): Promise<any> => {
    if (!isBackendConfigured()) {
      return { taskId, supervisorDecision: decision, status: 'Verified' };
    }
    return http.post(`/api/v1/operations/tasks/${taskId}/review`, {
      supervisor_id: supervisorId,
      decision,
    });
  },

  escalateTask: async (taskId: string, triggerReason: string = 'SLA_BREACH'): Promise<any> => {
    if (!isBackendConfigured()) {
      return { taskId, currentLevel: 'SUPERVISOR', triggerReason };
    }
    return http.post(`/api/v1/operations/tasks/${taskId}/escalate`, { trigger_reason: triggerReason });
  },

  executeIntervention: async (params: {
    project_id: string;
    action_type: string;
    target_parcel_ids?: string[];
    officer_id?: string;
    officer_name?: string;
    notes?: string;
  }): Promise<any> => {
    if (!isBackendConfigured()) {
      return {
        interventionId: `INT-${Date.now()}`,
        projectId: params.project_id,
        actionTitle: params.action_type,
        riskBefore: 82,
        riskAfter: 67,
        improvementPoints: 15,
        delayBeforeMonths: 5.2,
        delayAfterMonths: 3.8,
        savedTimelineMonths: 1.4,
        officerName: params.officer_name || 'Special Cell',
        completedAt: new Date().toISOString(),
      };
    }
    return http.post('/api/v1/operations/closed-loop/intervene', params);
  },

  getInterventionHistory: async (projectId: string): Promise<InterventionHistoryItem[]> => {
    if (!isBackendConfigured()) {
      return [];
    }
    return http.get<InterventionHistoryItem[]>(`/api/v1/operations/closed-loop/history/${projectId}`);
  },

  getGovernmentAlerts: async (status?: string): Promise<GovernmentAlertItem[]> => {
    if (!isBackendConfigured()) {
      return [
        {
          id: 'GOV-ALT-01',
          projectId: 'PRJ-1042',
          projectName: 'Chennai-Bengaluru Industrial Corridor',
          riskScore: 87,
          reason: 'Critical cadastral title dispute cluster threatening 5.2 month corridor viaduct delay',
          affectedArea: 'Ennore North Section 2',
          affectedParcelsCount: 14,
          affectedPopulation: 45,
          recommendedAction: 'Convene Special RDO inquiry sitting and fast-track SLAC clearance',
          responsibleAuthority: 'District Revenue Administration & NHAI Special Cell',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          demoFlag: 'DEMO GOVERNMENT ALERT',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const query = status ? `?status=${status}` : '';
    return http.get<GovernmentAlertItem[]>(`/api/v1/operations/alerts/government${query}`);
  },

  getOfficersWorkloadStatus: async (maxCapacity: number = 5): Promise<any[]> => {
    return http.get<any[]>(`/api/v1/operations/officers/workload-status?max_capacity=${maxCapacity}`);
  },

  autoAssignProjectOfficers: async (projectId: string, district?: string, zone?: string, maxCapacity: number = 5): Promise<any> => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (zone) params.append('zone', zone);
    params.append('max_capacity', maxCapacity.toString());
    return http.post<any>(`/api/v1/operations/projects/${projectId}/auto-assign-officers?${params.toString()}`);
  },

  uploadEvidence: async (taskId: string, formData: FormData): Promise<any> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('landguard_token') : null;
    const base = getApiBaseUrl();
    const url = normalizePath(base, `/api/v1/operations/tasks/${taskId}/upload-evidence`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }
    return res.json();
  },
};

