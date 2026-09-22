import { http, isBackendConfigured } from './httpClient';
import { MOCK_PROJECTS, getMockProject } from '@/lib/mock';
import type { Project, ProjectTeam, AllocationDetails } from '@/types';

export interface CreateProjectPayload {
  id?: string;
  project_code?: string;
  name: string;
  type?: string;
  project_type?: string;
  description?: string;
  state: string;
  district: string;
  taluk?: string;
  city?: string;
  project_value?: number;
  estimated_budget_cr?: number;
  land_required_acres?: number;
  required_land_area_acres?: number;
  target_completion_date?: string;
  target_completion?: string;
  priority?: string;
  start_location?: string;
  end_location?: string;
  destination?: string;
  corridor_length_km?: number;
  right_of_way_m?: number;
  coords?: [number, number];
  auto_assign_team?: boolean;
}

export const projectsApi = {
  getProjects: async (params?: { state?: string; district?: string }): Promise<Project[]> => {
    if (!isBackendConfigured()) {
      let result = [...MOCK_PROJECTS];
      if (params?.state) {
        result = result.filter((p) => p.state.toLowerCase().includes(params.state!.toLowerCase()));
      }
      if (params?.district) {
        result = result.filter((p) => p.district.toLowerCase().includes(params.district!.toLowerCase()));
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params?.state) query.append('state', params.state);
    if (params?.district) query.append('district', params.district);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.get<Project[]>(`/api/v1/projects${qs}`);
  },

  getProject: async (id: string): Promise<Project | undefined> => {
    if (!isBackendConfigured()) {
      return getMockProject(id);
    }
    return http.get<Project>(`/api/v1/projects/${id}`);
  },

  createProject: async (project: CreateProjectPayload | Partial<Project>): Promise<Project> => {
    if (!isBackendConfigured()) {
      return {
        ...MOCK_PROJECTS[0],
        ...project,
        id: (project as any).project_code ?? project.id ?? `PRJ-${Date.now().toString().slice(-4)}`,
      } as Project;
    }
    return http.post<Project>('/api/v1/projects', project);
  },

  updateProject: async (id: string, project: Partial<Project>): Promise<Project> => {
    if (!isBackendConfigured()) {
      const existing = getMockProject(id) || MOCK_PROJECTS[0];
      return { ...existing, ...project };
    }
    return http.put<Project>(`/api/v1/projects/${id}`, project);
  },

  autoAssignTeam: async (projectId: string, params?: { district?: string; zone?: string; maxCapacity?: number }): Promise<any> => {
    if (!isBackendConfigured()) {
      return {
        projectId,
        status: 'TEAM_ASSIGNED',
        message: 'Team assigned in demo mode',
      };
    }
    const query = new URLSearchParams();
    if (params?.district) query.append('district', params.district);
    if (params?.zone) query.append('zone', params.zone);
    if (params?.maxCapacity) query.append('max_capacity', params.maxCapacity.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.post<any>(`/api/v1/projects/${projectId}/auto-assign-team${qs}`, {});
  },

  getProjectTeam: async (projectId: string): Promise<{ projectId: string; projectName: string; team: ProjectTeam; totalMembers: number }> => {
    if (!isBackendConfigured()) {
      return {
        projectId,
        projectName: 'National Highway 45 Extension',
        totalMembers: 6,
        team: {
          projectHead: {
            id: 'USR-HEAD-01',
            name: 'Dr. A. Sundaram',
            role: 'PROJECT_HEAD',
            designation: 'Project Director — National Corridors',
            allocationReason: 'Highest corridor experience & active status in region',
            scoreBreakdown: { 'Role Match': 50, 'District Match': 60, 'SLA Track Record': 80, 'Final Score': 190 },
            capacityStatus: 'AVAILABLE',
          },
          districtOfficer: {
            id: 'USR-DIST-01',
            name: 'M. K. Revathi IAS',
            role: 'DISTRICT_OFFICER',
            designation: 'District Collector',
            allocationReason: 'Primary jurisdiction District Collector matching project administrative territory',
            scoreBreakdown: { 'Jurisdiction Match': 100, 'Authority Level': 95, 'Active Status': 100, 'Final Score': 295 },
            capacityStatus: 'AVAILABLE',
          },
          landAcquisitionOfficer: {
            id: 'USR-LAO-01',
            name: 'K. Rajagopal',
            role: 'LAND_ACQUISITION_OFFICER',
            designation: 'Special LAO — Corridor Division',
            allocationReason: 'District territory match & top SLA on Section 3D notices',
            scoreBreakdown: { 'District Match': 60, 'Notice Velocity': 82, 'SLA': 76, 'Final Score': 218 },
            capacityStatus: 'AVAILABLE',
          },
          fieldOfficer: {
            id: 'USR-FO-01',
            name: 'P. Murugan',
            role: 'FIELD_OFFICER',
            designation: 'Lead Field Verification Officer',
            allocationReason: 'Same Zone (+100), Same District (+60), GPS Proximity (+40), SLA (88/100). Workload 2/5 (AVAILABLE)',
            scoreBreakdown: { 'Zone Match': 100, 'District Match': 60, 'Proximity Score': 40, 'SLA Performance': 88, 'Workload Penalty': -20, 'Final Score': 268 },
            capacityStatus: 'AVAILABLE',
          },
          supervisor: {
            id: 'USR-SUP-01',
            name: 'V. Natarajan',
            role: 'SUPERVISOR',
            designation: 'Chief Cadastral Surveyor',
            allocationReason: 'Highest resolution SLA & supervisory clearance accuracy in zone',
            scoreBreakdown: { 'Jurisdiction Match': 60, 'Review Accuracy': 94, 'Active Status': 100, 'Final Score': 254 },
            capacityStatus: 'AVAILABLE',
          },
          contractor: {
            id: 'USR-CTR-01',
            name: 'L&T Infrastructure Project Corp',
            role: 'CONTRACTOR',
            designation: 'EPC Highway Contractor',
            allocationReason: 'Highway & Expressway EPC classification with regional equipment mobilization capability',
            scoreBreakdown: { 'Sector Specialization': 100, 'Equipment Score': 92, 'Safety Rating': 96, 'Final Score': 288 },
            capacityStatus: 'AVAILABLE',
          },
        },
      };
    }
    return http.get<{ projectId: string; projectName: string; team: ProjectTeam; totalMembers: number }>(`/api/v1/projects/${projectId}/team`);
  },

  getAllocationDetails: async (projectId: string): Promise<AllocationDetails> => {
    if (!isBackendConfigured()) {
      return {
        projectId,
        projectName: 'National Highway 45 Extension',
        allocationTitle: 'Intelligent Multi-Factor Cadre Allocation Proof',
        algorithm: 'LandGuard Multi-Factor Workload-Balanced Officer Allocation Engine v2.0',
        officerAllocations: [],
      };
    }
    return http.get<AllocationDetails>(`/api/v1/projects/${projectId}/allocation-details`);
  },
};
