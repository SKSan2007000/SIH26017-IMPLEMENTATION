/**
 * lib/api — service abstraction layer.
 *
 * Provides modular API clients and a unified `api` object.
 *
 * Behavior:
 *   - If NEXT_PUBLIC_API_URL is configured, calls the real FastAPI backend.
 *   - If not set, transparently falls back to mock/simulation data.
 */

import { projectsApi } from './projects';
import { routesApi } from './routes';
import { parcelsApi } from './parcels';
import { stakeholdersApi } from './stakeholders';
import { documentsApi } from './documents';
import { fieldApi } from './field';
import { notificationsApi } from './notifications';
import { riskApi } from './risk';
import { auditApi } from './audit';
import { authApi } from './auth';
import { workflowApi } from './workflow';
import { operationsApi } from './operations';
import { designsApi } from './designs';
import { portfolioApi } from './portfolio';
import { gisApi } from './gis';
import { isBackendConfigured } from './httpClient';
import { MOCK_OFFICERS, MOCK_ANALYTICS } from '@/lib/mock';
import type {
  Project, Route, Parcel, Stakeholder, RiskScore, RiskDriver, VerificationCase,
  DocumentRecord, NotificationItem, Officer, AnalyticsSnapshot, AuditEvent,
  CitizenReport, WhatIfLever,
} from '@/types';

export {
  projectsApi,
  routesApi,
  parcelsApi,
  stakeholdersApi,
  documentsApi,
  fieldApi,
  notificationsApi,
  riskApi,
  auditApi,
  authApi,
  workflowApi,
  operationsApi,
  designsApi,
  portfolioApi,
  gisApi,
};

export const api = {
  // Phase 6 Multi-Design & Versioning
  getProjectDesigns: designsApi.getProjectDesigns,
  generateAiDesigns: designsApi.generateAiDesigns,
  compareDesigns: designsApi.compareDesigns,
  recalculateDesign: designsApi.recalculateDesign,
  saveDesignVersion: designsApi.saveDesignVersion,
  approveDesign: designsApi.approveDesign,
  getDesignPackage: designsApi.getDesignPackage,
  createChangeRequest: designsApi.createChangeRequest,
  getChangeRequests: designsApi.getChangeRequests,
  reviewChangeRequest: designsApi.reviewChangeRequest,

  // Phase 6 Multi-Project Portfolio, Workload & Road Network
  getPortfolioSummary: portfolioApi.getSummary,
  getOfficerCrossProjectWorkload: portfolioApi.getOfficerWorkload,
  getContractorProjects: portfolioApi.getContractorProjects,
  getRoadNetwork: portfolioApi.getRoadNetwork,
  getProjectAssignments: portfolioApi.getProjectAssignments,
  createProjectAssignment: portfolioApi.createAssignment,

  // Operations & Workflow
  getTodaysOperations: operationsApi.getTodaysOperations,
  getDailySummary: operationsApi.getDailySummary,
  getLeaderboard: operationsApi.getLeaderboard,
  getOfficersWorkloadStatus: operationsApi.getOfficersWorkloadStatus,
  autoAssignProjectOfficers: operationsApi.autoAssignProjectOfficers,
  uploadEvidence: operationsApi.uploadEvidence,
  autoAssignTask: operationsApi.autoAssignTask,
  acceptTask: operationsApi.acceptTask,
  completeTask: operationsApi.completeTask,
  reviewTask: operationsApi.reviewTask,
  escalateTask: operationsApi.escalateTask,
  executeIntervention: operationsApi.executeIntervention,
  getInterventionHistory: operationsApi.getInterventionHistory,
  getGovernmentAlerts: operationsApi.getGovernmentAlerts,
  transitionProjectState: workflowApi.transitionProjectState,
  updateParcelWorkflowStatus: workflowApi.updateParcelWorkflowStatus,
  getWorkflowStates: workflowApi.getWorkflowStates,

  // Projects
  getProjects: projectsApi.getProjects,
  getProject: projectsApi.getProject,
  createProject: projectsApi.createProject,
  updateProject: projectsApi.updateProject,

  // Routes
  getRoutes: routesApi.getRoutes,
  getRouteById: routesApi.getRouteById,
  createRoute: routesApi.createRoute,
  getRecommendations: routesApi.getRecommendations,

  // Parcels & Spatial Intersections
  getParcels: parcelsApi.getParcels,
  getParcelsByRoute: parcelsApi.getParcelsByRoute,
  getAffectedParcelsSpatial: parcelsApi.getAffectedParcelsSpatial,
  getParcel: parcelsApi.getParcel,
  createParcel: parcelsApi.createParcel,
  updateParcel: parcelsApi.updateParcel,

  // Stakeholders
  getStakeholders: stakeholdersApi.getStakeholders,
  getStakeholder: stakeholdersApi.getStakeholder,
  getStakeholderDocuments: stakeholdersApi.getStakeholderDocuments,
  createStakeholder: stakeholdersApi.createStakeholder,
  updateStakeholder: stakeholdersApi.updateStakeholder,

  // Documents
  getDocuments: documentsApi.getDocuments,
  getDocument: documentsApi.getDocument,
  createDocument: documentsApi.createDocument,
  updateDocument: documentsApi.updateDocument,

  // Field Verification & Cases
  getVerificationCases: (projectId?: string) => fieldApi.getFieldVerifications(projectId ? { projectId } : undefined),
  getFieldVerification: fieldApi.getFieldVerification,
  createFieldVerification: fieldApi.createFieldVerification,
  updateFieldVerification: fieldApi.updateFieldVerification,

  // Citizen Grievance Reports
  getCitizenReports: (projectId?: string) => fieldApi.getCitizenReports(projectId ? { projectId } : undefined),
  createCitizenReport: fieldApi.createCitizenReport,
  updateCitizenReport: fieldApi.updateCitizenReport,

  // Notifications
  getNotifications: (projectId?: string) => notificationsApi.getNotifications(projectId ? { projectId } : undefined),
  createNotification: notificationsApi.createNotification,
  markNotificationAsRead: notificationsApi.markAsRead,

  // Risk Intelligence & What-If
  getProjectRisk: riskApi.getProjectRisk,
  getRiskDrivers: riskApi.getRiskDrivers,
  getRiskFactors: riskApi.getRiskFactors,
  explainRisk: riskApi.explainRisk,
  recalculateRisk: riskApi.recalculateRisk,
  runWhatIf: riskApi.runWhatIf,

  // Audit Logs
  getProjectAuditTrail: auditApi.getProjectAuditTrail,
  listAuditLogs: auditApi.listAuditLogs,
  createAuditLog: auditApi.createAuditLog,

  // Analytics & Officers (Simulation)
  getOfficerPerformance: (): Promise<Officer[]> => Promise.resolve(MOCK_OFFICERS),
  getAnalytics: (): Promise<AnalyticsSnapshot> => Promise.resolve(MOCK_ANALYTICS),

  // Auth
  login: authApi.login,
  getCurrentUser: authApi.getCurrentUser,
  logout: authApi.logout,
};

export const isUsingRealBackend = isBackendConfigured();

