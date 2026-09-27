/**
 * lib/api/portfolio — Multi-Project Portfolio, Officer Cross-Project Workload & Network API client.
 */

import { http, isBackendConfigured } from './httpClient';
import type { PortfolioSummary, OfficerWorkload, RoadNetworkFeature, ConnectivityGap, ProjectAssignment } from '@/types';
import { MOCK_PROJECTS } from '@/lib/mock/projects';
import { DEMO_ROAD_NETWORK_FEATURES, DEMO_CONNECTIVITY_GAPS } from '@/lib/gis/networkData';

export const portfolioApi = {
  async getSummary(): Promise<PortfolioSummary> {
    if (!isBackendConfigured()) {
      return {
        totalProjects: MOCK_PROJECTS.length,
        activeProjects: MOCK_PROJECTS.length,
        planningProjects: 4,
        highRiskProjects: 2,
        criticalProjects: 1,
        underConstructionProjects: 3,
        completedProjects: 0,
        overdueProjects: 1,
        totalEstimatedBudgetCr: MOCK_PROJECTS.reduce((s, p) => s + p.estimatedBudgetCr, 0),
        totalLandImpactAcres: MOCK_PROJECTS.reduce((s, p) => s + p.requiredLandAreaAcres, 0),
        totalAffectedParcels: MOCK_PROJECTS.reduce((s, p) => s + p.parcelsCount, 0),
        totalStakeholders: MOCK_PROJECTS.reduce((s, p) => s + p.stakeholdersCount, 0),
        overallPortfolioRiskPct: 38,
        portfolioRiskBand: 'medium',
        projectsBreakdown: MOCK_PROJECTS.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          district: p.district,
          state: p.state,
          status: p.status,
          workflowState: 'LAND_ACQUISITION',
          budgetCr: p.estimatedBudgetCr,
          overallProgressPct: 35.0,
          landAcquisitionProgressPct: 42.0,
          constructionProgressPct: 15.0,
          riskPct: p.id === 'PRJ-1042' ? 16 : 45,
          riskBand: p.id === 'PRJ-1042' ? 'low' : 'high',
          parcelsCount: p.parcelsCount,
          stakeholdersCount: p.stakeholdersCount,
          targetCompletion: p.targetCompletion,
        })),
      };
    }
    try {
      const res = await http.get<any>('/portfolio/summary');
      return {
        totalProjects: res.total_projects,
        activeProjects: res.active_projects,
        planningProjects: res.planning_projects,
        highRiskProjects: res.high_risk_projects,
        criticalProjects: res.critical_projects,
        underConstructionProjects: res.under_construction_projects,
        completedProjects: res.completed_projects,
        overdueProjects: res.overdue_projects,
        totalEstimatedBudgetCr: res.total_estimated_budget_cr,
        totalLandImpactAcres: res.total_land_impact_acres,
        totalAffectedParcels: res.total_affected_parcels,
        totalStakeholders: res.total_stakeholders,
        overallPortfolioRiskPct: res.overall_portfolio_risk_pct,
        portfolioRiskBand: res.portfolio_risk_band,
        projectsBreakdown: res.projects_breakdown.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          district: p.district,
          state: p.state,
          status: p.status,
          workflowState: p.workflowState,
          budgetCr: p.budgetCr,
          overallProgressPct: p.overallProgressPct,
          landAcquisitionProgressPct: p.landAcquisitionProgressPct,
          constructionProgressPct: p.constructionProgressPct,
          riskPct: p.riskPct,
          riskBand: p.riskBand,
          parcelsCount: p.parcelsCount,
          stakeholdersCount: p.stakeholdersCount,
          targetCompletion: p.targetCompletion,
        })),
      };
    } catch {
      return portfolioApi.getSummary();
    }
  },

  async getOfficerWorkload(): Promise<OfficerWorkload[]> {
    if (!isBackendConfigured()) {
      return [
        {
          officerId: 'OFF-01',
          officerName: 'R. Vignesh (Senior Field Officer)',
          role: 'FIELD_OFFICER',
          activeProjects: [
            { projectId: 'PRJ-1042', taskCount: 4, critical: 1, overdue: 0 },
            { projectId: 'PRJ-1015', taskCount: 2, critical: 0, overdue: 0 },
          ],
          totalAssignedProjects: 2,
          totalPendingTasks: 6,
          totalCriticalTasks: 1,
          totalOverdueTasks: 0,
          totalCompletedTasks: 24,
          slaCompliancePct: 96,
          incentivePoints: 340,
          crossProjectWorkloadIndex: 0.45,
          availabilityStatus: 'Moderate Load',
        },
        {
          officerId: 'OFF-02',
          officerName: 'S. Prakash (Cadastral Surveyor)',
          role: 'FIELD_OFFICER',
          activeProjects: [{ projectId: 'PRJ-1088', taskCount: 8, critical: 3, overdue: 1 }],
          totalAssignedProjects: 1,
          totalPendingTasks: 8,
          totalCriticalTasks: 3,
          totalOverdueTasks: 1,
          totalCompletedTasks: 16,
          slaCompliancePct: 88,
          incentivePoints: 180,
          crossProjectWorkloadIndex: 0.82,
          availabilityStatus: 'Near Capacity',
        },
      ];
    }
    try {
      const res = await http.get<any[]>('/portfolio/officers/workload');
      return res.map((o) => ({
        officerId: o.officer_id,
        officerName: o.officer_name,
        role: o.role,
        activeProjects: o.active_projects,
        totalAssignedProjects: o.total_assigned_projects,
        totalPendingTasks: o.total_pending_tasks,
        totalCriticalTasks: o.total_critical_tasks,
        totalOverdueTasks: o.total_overdue_tasks,
        totalCompletedTasks: o.total_completed_tasks,
        slaCompliancePct: o.sla_compliance_pct,
        incentivePoints: o.incentive_points,
        crossProjectWorkloadIndex: o.cross_project_workload_index,
        availabilityStatus: o.availability_status,
      }));
    } catch {
      return portfolioApi.getOfficerWorkload();
    }
  },

  async getContractorProjects(contractorName: string = 'DEMO Infra Consortium'): Promise<any[]> {
    if (!isBackendConfigured()) {
      return [
        {
          project_id: 'PRJ-1042',
          project_name: 'Chennai-Bengaluru Industrial Corridor (DEMO)',
          assigned_work_packages_count: 2,
          overall_progress_pct: 36.0,
          land_acquisition_status: 'ACQUISITION',
          approved_design_id: 'DSG-PRJ-1042-D',
          approved_design_name: 'Design D — AI Optimized Corridor',
          active_change_requests_count: 1,
          delay_variance_pct: -5.5,
          pending_inspections_count: 1,
          workPackages: [
            {
              id: 'PKG-1042-01',
              packageName: 'Package 1: Earthwork & Viaduct Foundation (Km 0-25)',
              status: 'IN_PROGRESS',
              plannedProgressPct: 45.0,
              actualProgressPct: 42.0,
              variancePct: -3.0,
              delayRisk: 'LOW',
              targetDate: '2027-12-31',
            },
          ],
        },
      ];
    }
    try {
      return http.get<any[]>(`/portfolio/contractor/projects?contractor_name=${encodeURIComponent(contractorName)}`);
    } catch {
      return portfolioApi.getContractorProjects(contractorName);
    }
  },

  async getRoadNetwork(projectId: string): Promise<{
    features: RoadNetworkFeature[];
    connectivityGaps: ConnectivityGap[];
  }> {
    if (!isBackendConfigured()) {
      return {
        features: DEMO_ROAD_NETWORK_FEATURES,
        connectivityGaps: DEMO_CONNECTIVITY_GAPS,
      };
    }
    try {
      const res = await http.get<any>(`/portfolio/network/${projectId}`);
      return {
        features: res.features,
        connectivityGaps: res.connectivityGaps,
      };
    } catch {
      return {
        features: DEMO_ROAD_NETWORK_FEATURES,
        connectivityGaps: DEMO_CONNECTIVITY_GAPS,
      };
    }
  },

  async getProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
    if (!isBackendConfigured()) {
      return [
        {
          id: `ASN-${projectId}-01`,
          projectId,
          userId: 'head-01',
          userName: 'Dr. A. Sundaram (DEMO)',
          role: 'PROJECT_HEAD',
          designation: 'Project Director',
          assignedAt: '2026-08-01T09:00:00Z',
          assignedBy: 'System Administrator',
          status: 'ACTIVE',
        },
        {
          id: `ASN-${projectId}-02`,
          projectId,
          userId: 'field-01',
          userName: 'R. Vignesh (DEMO)',
          role: 'FIELD_OFFICER',
          designation: 'Senior Field Surveyor',
          assignedAt: '2026-08-05T09:00:00Z',
          assignedBy: 'Dr. A. Sundaram',
          status: 'ACTIVE',
        },
      ];
    }
    try {
      const res = await http.get<any[]>(`/portfolio/assignments/${projectId}`);
      return res.map((a) => ({
        id: a.id,
        projectId: a.project_id,
        userId: a.user_id,
        userName: a.user_name,
        role: a.role,
        designation: a.designation,
        assignedAt: a.assigned_at,
        assignedBy: a.assigned_by,
        status: a.status,
      }));
    } catch {
      return portfolioApi.getProjectAssignments(projectId);
    }
  },

  async createAssignment(
    projectId: string,
    data: { userId: string; userName: string; role: string; designation?: string }
  ): Promise<any> {
    if (!isBackendConfigured()) {
      return { status: 'SUCCESS', message: 'Assignment created (Simulation Mode)' };
    }
    return http.post(`/portfolio/assignments/${projectId}`, {
      user_id: data.userId,
      user_name: data.userName,
      role: data.role,
      designation: data.designation,
    });
  },
};
