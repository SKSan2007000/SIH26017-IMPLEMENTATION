/**
 * lib/api/designs — Multi-Design, Versioning, Dynamic Comparison & Change Request API client.
 * Seamlessly falls back to client-side simulation when backend is unreachable.
 */

import { http, isBackendConfigured } from './httpClient';
import type {
  DesignAlternative,
  DesignVersion,
  DesignComparisonItem,
  DesignChangeRequest,
  DesignPackage,
  LonLat,
} from '@/types';
import { getMockDesignsForProject, MOCK_DESIGN_PACKAGES, MOCK_CHANGE_REQUESTS } from '@/lib/mock/designs';
import { evaluateDesignGeometry } from '@/lib/simulation/designEngine';

export const designsApi = {
  async getProjectDesigns(projectId: string): Promise<DesignAlternative[]> {
    if (!isBackendConfigured()) {
      return getMockDesignsForProject(projectId);
    }
    try {
      const data = await http.get<any[]>(`/designs/project/${projectId}`);
      return data.map((d) => ({
        id: d.id,
        projectId: d.project_id,
        routeId: d.route_id,
        name: d.name,
        label: d.label,
        strategy: d.strategy,
        currentVersionNumber: d.current_version_number,
        status: d.status,
        connectivityScore: d.connectivity_score,
        constructionComplexity: d.construction_complexity,
        isApproved: d.is_approved,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        versions: (d.versions || []).map((v: any) => ({
          id: v.id,
          designId: v.design_id,
          projectId: v.project_id,
          versionNumber: v.version_number,
          createdBy: v.created_by,
          createdAt: v.created_at,
          source: v.source,
          routeGeometry: v.route_geometry,
          lengthKm: v.length_km,
          landImpactAcres: v.land_impact_acres,
          affectedParcelsCount: v.affected_parcels_count,
          affectedParcelIds: v.affected_parcel_ids || [],
          stakeholdersCount: v.stakeholders_count,
          estimatedCostCr: v.estimated_cost_cr,
          estimatedDurationMonths: v.estimated_duration_months,
          delayRiskPct: v.delay_risk_pct,
          connectivityScore: v.connectivity_score,
          constructionComplexity: v.construction_complexity,
          overallScore: v.overall_score,
          status: v.status,
          approvalStatus: v.approval_status,
          approvedBy: v.approved_by,
          notes: v.notes,
          visualUrl: v.visual_url,
        })),
      }));
    } catch {
      return getMockDesignsForProject(projectId);
    }
  },

  async generateAiDesigns(projectId: string, count: number = 4): Promise<DesignAlternative[]> {
    if (!isBackendConfigured()) {
      return getMockDesignsForProject(projectId);
    }
    try {
      await http.post('/designs/generate', { project_id: projectId, count });
      return designsApi.getProjectDesigns(projectId);
    } catch {
      return getMockDesignsForProject(projectId);
    }
  },

  async compareDesigns(projectId: string, designIds?: string[]): Promise<{
    comparedDesigns: DesignComparisonItem[];
    recommendedDesignId: string;
  }> {
    if (!isBackendConfigured()) {
      const all = getMockDesignsForProject(projectId);
      const filtered = designIds ? all.filter((d) => designIds.includes(d.id)) : all;
      const compared: DesignComparisonItem[] = filtered.map((d) => {
        const v = d.versions[d.versions.length - 1] || d.versions[0];
        return {
          id: d.id,
          label: d.label,
          name: d.name,
          strategy: d.strategy,
          versionNumber: v?.versionNumber ?? 1,
          lengthKm: v?.lengthKm ?? 35,
          landImpactAcres: v?.landImpactAcres ?? 120,
          affectedParcels: v?.affectedParcelsCount ?? 14,
          stakeholders: v?.stakeholdersCount ?? 20,
          estimatedCostCr: v?.estimatedCostCr ?? 2100,
          estimatedDurationMonths: v?.estimatedDurationMonths ?? 18,
          delayRiskPct: v?.delayRiskPct ?? 22,
          connectivityScore: v?.connectivityScore ?? 90,
          constructionComplexity: v?.constructionComplexity ?? 'Medium',
          overallScore: v?.overallScore ?? 88,
          status: v?.status ?? 'SUBMITTED',
          isApproved: d.isApproved,
          routeGeometry: v?.routeGeometry ?? [],
        };
      });
      const best = compared.reduce((prev, curr) => (curr.overallScore > prev.overallScore ? curr : prev), compared[0]);
      compared.forEach((c) => {
        c.aiRecommended = c.id === best?.id;
      });
      return { comparedDesigns: compared, recommendedDesignId: best?.id ?? '' };
    }
    try {
      const res = await http.post<any>(`/designs/project/${projectId}/compare`);
      return {
        comparedDesigns: res.compared_designs.map((c: any) => ({
          id: c.id,
          label: c.label,
          name: c.name,
          strategy: c.strategy,
          versionNumber: c.versionNumber,
          lengthKm: c.lengthKm,
          landImpactAcres: c.landImpactAcres,
          affectedParcels: c.affectedParcels,
          stakeholders: c.stakeholders,
          estimatedCostCr: c.estimatedCostCr,
          estimatedDurationMonths: c.estimatedDurationMonths,
          delayRiskPct: c.delayRiskPct,
          connectivityScore: c.connectivityScore,
          constructionComplexity: c.constructionComplexity,
          overallScore: c.overallScore,
          status: c.status,
          isApproved: c.isApproved,
          aiRecommended: c.aiRecommended,
          routeGeometry: c.routeGeometry,
        })),
        recommendedDesignId: res.recommended_design_id,
      };
    } catch {
      return designsApi.compareDesigns(projectId, designIds);
    }
  },

  async recalculateDesign(
    projectId: string,
    routeGeometry: LonLat[],
    corridorWidthMeters: number = 32.0,
    strategy?: string
  ) {
    if (!isBackendConfigured()) {
      return evaluateDesignGeometry(routeGeometry, corridorWidthMeters, strategy);
    }
    try {
      const res = await http.post<any>(`/designs/recalculate/${projectId}`, {
        route_geometry: routeGeometry,
        corridor_width_meters: corridorWidthMeters,
        strategy,
      });
      return {
        lengthKm: res.length_km,
        landImpactAcres: res.land_impact_acres,
        affectedParcelsCount: res.affected_parcels_count,
        affectedParcelIds: res.affected_parcel_ids,
        stakeholdersCount: res.stakeholders_count,
        estimatedCostCr: res.estimated_cost_cr,
        estimatedDurationMonths: res.estimated_duration_months,
        delayRiskPct: res.delay_risk_pct,
        connectivityScore: res.connectivity_score,
        constructionComplexity: res.construction_complexity,
        overallScore: res.overall_score,
        aiRecommendationReason: res.ai_recommendation_reason,
      };
    } catch {
      return evaluateDesignGeometry(routeGeometry, corridorWidthMeters, strategy);
    }
  },

  async saveDesignVersion(
    designId: string,
    routeGeometry: LonLat[],
    createdBy: string = 'Authorized Officer',
    notes?: string,
    corridorWidthMeters: number = 32.0
  ): Promise<DesignVersion> {
    if (!isBackendConfigured()) {
      const metrics = evaluateDesignGeometry(routeGeometry, corridorWidthMeters);
      return {
        id: `VER-${designId}-V${Date.now()}`,
        designId,
        projectId: 'PRJ-1042',
        versionNumber: 2,
        createdBy,
        createdAt: new Date().toISOString(),
        source: 'OFFICER_MODIFIED',
        routeGeometry,
        lengthKm: metrics.lengthKm,
        landImpactAcres: metrics.landImpactAcres,
        affectedParcelsCount: metrics.affectedParcelsCount,
        affectedParcelIds: metrics.affectedParcelIds,
        stakeholdersCount: metrics.stakeholdersCount,
        estimatedCostCr: metrics.estimatedCostCr,
        estimatedDurationMonths: metrics.estimatedDurationMonths,
        delayRiskPct: metrics.delayRiskPct,
        connectivityScore: metrics.connectivityScore,
        constructionComplexity: metrics.constructionComplexity,
        overallScore: metrics.overallScore,
        status: 'SUBMITTED',
        approvalStatus: 'PENDING',
        notes,
      };
    }
    const res = await http.post<any>(`/designs/${designId}/versions`, {
      route_geometry: routeGeometry,
      created_by: createdBy,
      source: 'OFFICER_MODIFIED',
      notes,
      corridor_width_meters: corridorWidthMeters,
    });
    return {
      id: res.id,
      designId: res.design_id,
      projectId: res.project_id,
      versionNumber: res.version_number,
      createdBy: res.created_by,
      createdAt: res.created_at,
      source: res.source,
      routeGeometry: res.route_geometry,
      lengthKm: res.length_km,
      landImpactAcres: res.land_impact_acres,
      affectedParcelsCount: res.affected_parcels_count,
      affectedParcelIds: res.affected_parcel_ids,
      stakeholdersCount: res.stakeholders_count,
      estimatedCostCr: res.estimated_cost_cr,
      estimatedDurationMonths: res.estimated_duration_months,
      delayRiskPct: res.delay_risk_pct,
      connectivityScore: res.connectivity_score,
      constructionComplexity: res.construction_complexity,
      overallScore: res.overall_score,
      status: res.status,
      approvalStatus: 'PENDING',
      notes: res.notes,
    };
  },

  async approveDesign(designId: string, approvedBy: string = 'Project Director'): Promise<any> {
    if (!isBackendConfigured()) {
      return { status: 'SUCCESS', message: 'Design approved (Simulation Mode)' };
    }
    return http.post(`/designs/${designId}/approve`, null);
  },

  async getDesignPackage(designId: string): Promise<DesignPackage> {
    if (!isBackendConfigured()) {
      return (
        MOCK_DESIGN_PACKAGES.find((p) => p.designId === designId) ||
        MOCK_DESIGN_PACKAGES[0]
      );
    }
    try {
      const res = await http.get<any>(`/designs/${designId}/package`);
      return {
        id: res.id,
        projectId: res.project_id,
        designId: res.design_id,
        versionId: res.version_id,
        packageNumber: res.package_number,
        title: res.title,
        approvedBy: res.approved_by,
        approvedAt: res.approved_at,
        specs: res.specs,
        officerInstructions: res.officer_instructions,
        documentsCount: res.documents_count,
        disclaimer: res.disclaimer,
        accessLog: res.access_log || [],
      };
    } catch {
      return MOCK_DESIGN_PACKAGES[0];
    }
  },

  async createChangeRequest(
    projectId: string,
    designId: string,
    data: {
      title: string;
      reason: string;
      contractorId: string;
      contractorName: string;
      requestedModifications: Record<string, any>;
      proposedGeometry?: LonLat[];
    }
  ): Promise<any> {
    if (!isBackendConfigured()) {
      return { status: 'SUCCESS', message: 'Change request submitted (Simulation Mode)' };
    }
    return http.post(`/designs/${designId}/change-requests?project_id=${projectId}`, {
      title: data.title,
      reason: data.reason,
      contractor_id: data.contractorId,
      contractor_name: data.contractorName,
      requested_modifications: data.requestedModifications,
      proposed_geometry: data.proposedGeometry,
    });
  },

  async getChangeRequests(projectId: string): Promise<DesignChangeRequest[]> {
    if (!isBackendConfigured()) {
      return MOCK_CHANGE_REQUESTS.filter((c) => c.projectId === projectId);
    }
    try {
      const res = await http.get<any[]>(`/designs/project/${projectId}/change-requests`);
      return res.map((c) => ({
        id: c.id,
        projectId: c.project_id,
        designId: c.design_id,
        versionId: c.version_id,
        contractorId: c.contractor_id,
        contractorName: c.contractor_name,
        title: c.title,
        reason: c.reason,
        requestedModifications: c.requested_modifications,
        proposedGeometry: c.proposed_geometry,
        officerReviewStatus: c.officer_review_status,
        officerComment: c.officer_comment,
        aiImpactAnalysis: c.ai_impact_analysis,
        createdAt: c.created_at,
        reviewedAt: c.reviewed_at,
        reviewedBy: c.reviewed_by,
      }));
    } catch {
      return MOCK_CHANGE_REQUESTS;
    }
  },

  async reviewChangeRequest(
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
    comment: string,
    reviewerName: string = 'Project Director'
  ): Promise<any> {
    if (!isBackendConfigured()) {
      return { status: 'SUCCESS', message: `Change request marked as ${status}` };
    }
    return http.post(`/designs/change-requests/${requestId}/review`, {
      officer_review_status: status,
      officer_comment: comment,
      reviewer_name: reviewerName,
    });
  },
};
