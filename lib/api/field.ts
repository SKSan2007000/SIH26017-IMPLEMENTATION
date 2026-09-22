import { http, isBackendConfigured } from './httpClient';
import { MOCK_FIELD_CASES, getMockFieldCasesByProject, MOCK_CITIZEN_REPORTS } from '@/lib/mock';
import type { VerificationCase, CitizenReport } from '@/types';

export const fieldApi = {
  getFieldVerifications: async (params?: { projectId?: string; status?: string; officerRef?: string }): Promise<VerificationCase[]> => {
    if (!isBackendConfigured()) {
      if (params?.projectId) {
        return getMockFieldCasesByProject(params.projectId);
      }
      return MOCK_FIELD_CASES;
    }
    const query = new URLSearchParams();
    if (params?.projectId) query.append('projectId', params.projectId);
    if (params?.status) query.append('status_filter', params.status);
    if (params?.officerRef) query.append('officer_ref', params.officerRef);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.get<VerificationCase[]>(`/api/v1/field-verifications${qs}`);
  },

  getFieldVerification: async (id: string): Promise<VerificationCase | undefined> => {
    if (!isBackendConfigured()) {
      return MOCK_FIELD_CASES.find((c) => c.id === id);
    }
    return http.get<VerificationCase>(`/api/v1/field-verifications/${id}`);
  },

  createFieldVerification: async (verification: Partial<VerificationCase>): Promise<VerificationCase> => {
    if (!isBackendConfigured()) {
      return {
        ...MOCK_FIELD_CASES[0],
        ...verification,
        id: verification.id ?? `VER-${Date.now().toString().slice(-4)}`,
      } as VerificationCase;
    }
    return http.post<VerificationCase>('/api/v1/field-verifications', {
      id: verification.id,
      parcel_id: verification.parcelId,
      project_id: verification.projectId,
      officer_ref: verification.officerRef,
      officer_name: (verification as any).officerName,
      location: verification.location,
      priority: verification.priority,
      deadline: verification.deadline,
      status: verification.status,
      gps_captured: verification.gpsCaptured,
      photos_count: verification.photosCount,
      videos_count: verification.videosCount,
      observation: verification.observation,
      assigned_date: verification.assignedDate,
      completed_date: verification.completedDate,
    });
  },

  updateFieldVerification: async (id: string, verification: Partial<VerificationCase>): Promise<VerificationCase> => {
    if (!isBackendConfigured()) {
      const existing = MOCK_FIELD_CASES.find((c) => c.id === id) || MOCK_FIELD_CASES[0];
      return { ...existing, ...verification };
    }
    return http.put<VerificationCase>(`/api/v1/field-verifications/${id}`, {
      status: verification.status,
      photos_count: verification.photosCount,
      videos_count: verification.videosCount,
      observation: verification.observation,
      completed_date: verification.completedDate,
    });
  },

  // Citizen Reports
  getCitizenReports: async (params?: { projectId?: string; category?: string }): Promise<CitizenReport[]> => {
    if (!isBackendConfigured()) {
      let result = [...MOCK_CITIZEN_REPORTS];
      if (params?.projectId) {
        result = result.filter((r) => r.projectId === params.projectId);
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.category) query.append('category', params.category);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.get<CitizenReport[]>(`/api/v1/citizen-reports${qs}`);
  },

  createCitizenReport: async (report: Partial<CitizenReport>): Promise<CitizenReport> => {
    if (!isBackendConfigured()) {
      return {
        ...MOCK_CITIZEN_REPORTS[0],
        ...report,
        id: report.id ?? `CR-${Date.now().toString().slice(-4)}`,
      } as CitizenReport;
    }
    return http.post<CitizenReport>('/api/v1/citizen-reports', {
      id: report.id,
      project_id: report.projectId,
      location: report.location,
      description: report.description,
      category: report.category,
      has_photo: report.hasPhoto,
      has_video: report.hasVideo,
      status: report.status,
      submitted_at: report.submittedAt,
      response_note: report.responseNote,
    });
  },

  updateCitizenReport: async (id: string, report: Partial<CitizenReport>): Promise<CitizenReport> => {
    if (!isBackendConfigured()) {
      const existing = MOCK_CITIZEN_REPORTS.find((r) => r.id === id) || MOCK_CITIZEN_REPORTS[0];
      return { ...existing, ...report };
    }
    return http.put<CitizenReport>(`/api/v1/citizen-reports/${id}`, {
      status: report.status,
      response_note: report.responseNote,
    });
  },
};
