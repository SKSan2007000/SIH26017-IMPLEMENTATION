/**
 * LandGuard AI — shared domain types.
 * All data conforming to these types anywhere in this repo is FICTIONAL
 * DEMO / SIMULATION DATA. No real government, land-ownership, or Aadhaar
 * data is modeled or stored.
 */

export type RiskBand = 'critical' | 'high' | 'medium' | 'low';
export type LonLat = [number, number];

export type ProjectStatus =
  | 'Planning'
  | 'Land Identification'
  | 'Impact Analysis'
  | 'Stakeholder Verification'
  | 'Documentation'
  | 'Approval'
  | 'Land Acquisition'
  | 'Compensation'
  | 'Possession'
  | 'Project Start';

export const PROJECT_STAGES: ProjectStatus[] = [
  'Planning',
  'Land Identification',
  'Impact Analysis',
  'Stakeholder Verification',
  'Documentation',
  'Approval',
  'Compensation',
  'Possession',
  'Project Start',
];

export interface RiskDriver {
  label: string;
  contributionPct: number; // e.g. +24
}

export interface CategoryRisk {
  name:
    | 'Legal Dispute'
    | 'Documentation'
    | 'Compensation'
    | 'Approval'
    | 'Stakeholder Response'
    | 'Rehabilitation'
    | 'Possession'
    | 'Administrative Coordination';
  pct: number;
}

export interface RiskRecommendation {
  id: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  action: string;
  estimatedRiskReductionPct: number;
  affectedParcelsCount: number;
}

export interface RiskScore {
  projectId: string;
  overallPct: number;
  band: RiskBand;
  predictedDelayLabel: string; // e.g. "+5 months"
  confidencePct: number;
  trend: number[]; // historical progression, e.g. [42, 48, 61, 73, 87]
  trendStatus: string;
  categories: CategoryRisk[];
  drivers: RiskDriver[];
  recommendations?: RiskRecommendation[];
  originalCompletionMonths: number;
  predictedCompletionMonths: number;
  delay_probability?: number;
  risk_score?: number;
  risk_category?: string;
  expected_delay_months?: number;
  expected_delay_days?: number;
  model_version?: string;
}

export interface TeamMemberInfo {
  id: string;
  name: string;
  role: string;
  designation: string;
  district?: string;
  zone?: string;
  allocationReason: string;
  scoreBreakdown: Record<string, any>;
  capacityStatus: 'AVAILABLE' | 'NEAR CAPACITY' | 'AT CAPACITY' | string;
  assignedAt?: string;
}

export interface ProjectTeam {
  projectHead?: TeamMemberInfo;
  districtOfficer?: TeamMemberInfo;
  landAcquisitionOfficer?: TeamMemberInfo;
  fieldOfficer?: TeamMemberInfo;
  supervisor?: TeamMemberInfo;
  contractor?: TeamMemberInfo;
  [key: string]: TeamMemberInfo | undefined;
}

export interface OfficerAllocationProof {
  role: string;
  name: string;
  designation: string;
  reason: string;
  scoreBreakdown: Record<string, any>;
  capacityStatus: string;
}

export interface AllocationDetails {
  projectId: string;
  projectName: string;
  allocationTitle: string;
  algorithm: string;
  officerAllocations: OfficerAllocationProof[];
}

export interface Project {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  status: ProjectStatus;
  coords: LonLat;
  startLocation: string;
  destination: string;
  estimatedBudgetCr: number; // ₹ crore, fictional
  targetCompletion: string; // ISO date
  requiredLandAreaAcres: number;
  currentStageIndex: number;
  bottleneckStageIndex: number;
  selectedRouteId: string | null;
  parcelsCount: number;
  stakeholdersCount: number;
  stage?: string;
  budget?: string;
  landAreaAcres?: number;
  routeCount?: number;
  riskScore?: number;
  riskBand?: RiskBand;
  description?: string;
  taluk?: string;
  city?: string;
  priority?: string;
  corridorLengthKm?: number;
  rightOfWayM?: number;
  projectHeadId?: string;
  districtOfficerId?: string;
  laoId?: string;
  fieldOfficerId?: string;
  supervisorId?: string;
  activeContractorId?: string;
  team?: ProjectTeam;
  allocationDetails?: ProjectTeam | AllocationDetails;
}

export interface Route {
  id: string;
  projectId: string;
  label: 'Route A' | 'Route B' | 'Route C' | 'Route D';
  strategy: 'Minimum Land Impact' | 'Minimum Cost' | 'Minimum Delay' | 'Maximum Connectivity';
  path: LonLat[];
  distanceKm: number;
  affectedParcels: number;
  affectedParcelIds?: string[];
  stakeholders: number;
  estimatedCostCr: number;
  estimatedDelayMonths: number;
  delayProbabilityPct: number;
  infrastructureImpact: 'Low' | 'Medium' | 'High';
  overallScore: number; // 0-100, higher = better
  aiRecommended: boolean;
  corridorWidthMeters?: number;
  lanes?: number;
}

export type ParcelImpact = 'unaffected' | 'potential' | 'affected' | 'high';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'AWAITING SUPERVISOR VERIFICATION';
export type AcquisitionStatus = 'NOT STARTED' | 'NOTICE ISSUED' | 'IN PROGRESS' | 'COMPENSATED' | 'POSSESSED';
export type ResponseStatus = 'PENDING' | 'RECEIVED' | 'UNRESPONSIVE' | 'DISPUTED';
export type NotificationStatus = 'NOT SENT' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';

export interface Parcel {
  id: string;
  projectId: string;
  routeIds: string[]; // which candidate routes affect this parcel
  coords: LonLat; // centroid
  polygonCoords?: LonLat[]; // polygon vertices for realistic 2D & 3D boundary rendering
  areaSqFt: number;
  impact: ParcelImpact;
  landType: 'Government' | 'Private';
  ownerRef: string; // fictional, e.g. "DEMO OWNER-024"
  verification: VerificationStatus;
  acquisitionStatus: AcquisitionStatus;
  responseStatus?: ResponseStatus;
  notificationStatus?: NotificationStatus;
  documentsComplete: number;
  documentsRequired: number;
  disputed: boolean;
  riskContribution: RiskBand;
  structuresPresent?: boolean;
  structureType?: 'Residential House' | 'Commercial Shed' | 'Agricultural Well' | 'Vacant Plot';
  areaAcres?: number;
  surveyNo?: string;
  village?: string;
  landUse?: string;
  compensationCr?: number;
  riskBand?: RiskBand;
}

export interface Stakeholder {
  id: string;
  ref: string; // fictional, e.g. "DEMO OWNER-024"
  name?: string; // fictional demo label, e.g. "DEMO OWNER-024 (K. Ramanathan - Fictional)"
  projectId: string;
  parcelIds: string[]; // multi-parcel association
  parcelId: string; // primary parcel
  parcelRef?: string;
  contactRef?: string; // fictional demo contact, e.g. "+91 98XXX-XXXX4"
  status: 'Verified' | 'Pending' | 'Unresponsive' | 'Disputed';
  responseStatus: ResponseStatus;
  notificationStatus: NotificationStatus;
  documentsComplete: boolean;
  documentsCount: number;
  documentsRequired: number;
  compensationStatus: 'Not Initiated' | 'Assessment Complete' | 'Disbursement Pending' | 'Completed';
  lastContact: string; // ISO date, fictional
  preferredLanguage?: 'Tamil' | 'English' | 'Hindi';
  surveyNo?: string;
  landUse?: string;
}

export interface VerificationCase {
  id: string;
  parcelId: string;
  projectId: string;
  officerRef: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  deadline: string;
  status: 'Assigned' | 'In Progress' | 'Awaiting Supervisor Verification' | 'Verified' | 'Revisit Requested';
  gpsCaptured: boolean;
  photosCount: number;
  videosCount: number;
  observation?: string;
  assignedDate?: string;
  completedDate?: string;
}

export interface DocumentRecord {
  id: string;
  parcelId: string;
  projectId?: string;
  type: 'Ownership' | 'Survey' | 'Compensation' | 'Legal' | 'Approval' | 'Project';
  status: 'Uploaded' | 'Processing' | 'Verified' | 'Rejected' | 'Missing';
  uploadedAt?: string;
  fileSize?: string;
  ocr?: {
    extractedFields: Record<string, string>;
    confidencePct: number;
    humanVerified: boolean;
  };
}

export interface NotificationItem {
  id: string;
  title?: string;
  category:
    | 'Critical Delay Risk'
    | 'Document Missing'
    | 'Legal Dispute'
    | 'Compensation Delay'
    | 'Stakeholder Response'
    | 'Verification Pending'
    | 'Approval Delay'
    | 'Field Task'
    | 'Project Deadline'
    | 'Project Assignment'
    | 'Cadre Allocation'
    | 'District Operations'
    | 'Land Acquisition'
    | 'Field Verification'
    | 'Supervisor Review'
    | 'Contractor Operations'
    | string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  type?: string;
  message: string;
  actionUrl?: string;
  projectId?: string;
  parcelId?: string;
  recipient?: string;
  channel?: string;
  timestamp: string;
  read: boolean;
  createdAt?: string;
}

export type OfficerRole =
  | 'Head Officer'
  | 'State Officer'
  | 'District Officer'
  | 'Project Officer'
  | 'Land Acquisition Officer'
  | 'Survey Officer'
  | 'Legal Officer'
  | 'Finance Officer'
  | 'Field Officer';

export interface Officer {
  id: string;
  name: string; // fictional demo name
  role: OfficerRole;
  phone?: string; // fictional
  points: number;
  onTimeRatePct: number;
  evidenceQualityPct: number;
  verificationQualityPct: number;
  tasksCompleted: number;
  pendingTasks: number;
  activeDistrict?: string;
  assignedParcels?: number;
  criticalTasks?: number;
  completedTasks?: number;
  slaCompliance?: number;
  tier?: string;
}

export interface CitizenReport {
  id: string;
  projectId?: string;
  location: string;
  description: string;
  category?: 'Boundary Grievance' | 'Environmental Concern' | 'Access Road Request' | 'Waterbody Protection' | 'Structural Assessment';
  hasPhoto: boolean;
  hasVideo: boolean;
  status: 'Submitted' | 'Under Review' | 'Verified' | 'Considered' | 'Planned' | 'Rejected';
  submittedAt: string;
  responseNote?: string;
}

export interface AuditEvent {
  id: string;
  projectId: string;
  time: string; // HH:mm or full timestamp
  date?: string;
  actor: string;
  label: string;
  category?: 'Route Selection' | 'Risk Assessment' | 'Verification' | 'Document Review' | 'Compensation' | 'System';
}

export interface AnalyticsSnapshot {
  stateWiseDelayDays: { state: string; avgDelayDays: number }[];
  districtWiseDelayDays: { district: string; avgDelayDays: number }[];
  stageWiseDelayDays: { stage: ProjectStatus; avgDelayDays: number }[];
  riskDistribution: { band: RiskBand; count: number }[];
  avgAcquisitionDurationMonths: number;
  stakeholderResponseRatePct: number;
  compensationProgressPct: number;
  documentCompletionPct: number;
  verificationWorkload: { officer: string; pending: number }[];
}

export interface WhatIfLever {
  id: 'resolve_documents' | 'resolve_disputes' | 'more_field_officers' | 'more_verification_capacity' | 'alternate_route';
  label: string;
  resultingRiskPct: number;
  description?: string;
}

// Phase 6 Multi-Design & Versioning Interfaces
export type DesignStatus = 'DRAFT' | 'AI_GENERATED' | 'OFFICER_MODIFIED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface DesignVersion {
  id: string;
  designId: string;
  projectId: string;
  versionNumber: number;
  createdBy: string;
  createdAt: string;
  source: 'AI_GENERATED' | 'OFFICER_MODIFIED' | 'CONTRACTOR_CHANGE_REQUEST';
  routeGeometry: LonLat[];
  lengthKm: number;
  landImpactAcres: number;
  affectedParcelsCount: number;
  affectedParcelIds: string[];
  stakeholdersCount: number;
  estimatedCostCr: number;
  estimatedDurationMonths: number;
  delayRiskPct: number;
  connectivityScore: number;
  constructionComplexity: 'Low' | 'Medium' | 'High' | 'Very High';
  overallScore: number;
  status: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  notes?: string;
  visualUrl?: string;
}

export interface DesignAlternative {
  id: string;
  projectId: string;
  routeId?: string;
  name: string;
  label: string;
  strategy: string;
  currentVersionNumber: number;
  status: DesignStatus;
  connectivityScore: number;
  constructionComplexity: 'Low' | 'Medium' | 'High' | 'Very High';
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  versions: DesignVersion[];
}

export interface DesignComparisonItem {
  id: string;
  label: string;
  name: string;
  strategy: string;
  versionNumber: number;
  lengthKm: number;
  landImpactAcres: number;
  affectedParcels: number;
  stakeholders: number;
  estimatedCostCr: number;
  estimatedDurationMonths: number;
  delayRiskPct: number;
  connectivityScore: number;
  constructionComplexity: string;
  overallScore: number;
  status: string;
  isApproved: boolean;
  aiRecommended?: boolean;
  routeGeometry: LonLat[];
}

export interface DesignChangeRequest {
  id: string;
  projectId: string;
  designId: string;
  versionId: string;
  contractorId: string;
  contractorName: string;
  title: string;
  reason: string;
  requestedModifications: Record<string, any>;
  proposedGeometry?: LonLat[];
  officerReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  officerComment?: string;
  aiImpactAnalysis: {
    costDeltaCr: number;
    riskDeltaPct: number;
    timeDeltaMonths: number;
    newScore: number;
    recommendation: string;
  };
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DesignPackage {
  id: string;
  projectId: string;
  designId: string;
  versionId: string;
  packageNumber: string;
  title: string;
  approvedBy: string;
  approvedAt: string;
  specs: {
    designName: string;
    strategy: string;
    version: number;
    lengthKm: number;
    landImpactAcres: number;
    affectedParcelsCount: number;
    stakeholdersCount: number;
    estimatedCostCr: number;
    estimatedDurationMonths: number;
    delayRiskPct: number;
    connectivityScore: number;
    corridorWidthMeters?: number;
    lanes?: number;
  };
  officerInstructions: string;
  documentsCount: number;
  disclaimer: string;
  accessLog: { actor: string; action: string; timestamp: string }[];
}

export interface RoadNetworkFeature {
  id: string;
  name: string;
  type: 'HIGHWAY' | 'MAJOR_ROAD' | 'LOCAL_ROAD' | 'RAILWAY' | 'RIVER' | 'INDUSTRIAL_HUB' | 'URBAN_HUB';
  coordinates: any;
  properties: Record<string, any>;
}

export interface ConnectivityGap {
  id: string;
  region: string;
  description: string;
  gapType: 'MISSING_DIRECT_LINK' | 'CONGESTION_CHOKEPOINT' | 'INDUSTRIAL_ACCESS';
  existingTravelTimeMin: number;
  potentialTravelTimeMin: number;
  estimatedSocioEconomicBenefitCr: number;
  predictedAcquisitionDifficulty: 'Low' | 'Medium' | 'High';
  proposedCorridorCoordinates: LonLat[];
}

export interface PortfolioSummary {
  totalProjects: number;
  activeProjects: number;
  planningProjects: number;
  highRiskProjects: number;
  criticalProjects: number;
  underConstructionProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalEstimatedBudgetCr: number;
  totalLandImpactAcres: number;
  totalAffectedParcels: number;
  totalStakeholders: number;
  overallPortfolioRiskPct: number;
  portfolioRiskBand: RiskBand;
  projectsBreakdown: {
    id: string;
    name: string;
    type: string;
    district: string;
    state: string;
    status: string;
    workflowState: string;
    budgetCr: number;
    overallProgressPct: number;
    landAcquisitionProgressPct: number;
    constructionProgressPct: number;
    riskPct: number;
    riskBand: RiskBand;
    parcelsCount: number;
    stakeholdersCount: number;
    targetCompletion: string;
  }[];
}

export interface OfficerWorkload {
  officerId: string;
  officerName: string;
  role: string;
  activeProjects: { projectId: string; taskCount: number; critical: number; overdue: number }[];
  totalAssignedProjects: number;
  totalPendingTasks: number;
  totalCriticalTasks: number;
  totalOverdueTasks: number;
  totalCompletedTasks: number;
  slaCompliancePct: number;
  incentivePoints: number;
  crossProjectWorkloadIndex: number;
  availabilityStatus: 'Available' | 'Moderate Load' | 'Near Capacity' | 'Overloaded';
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  role: string;
  designation?: string;
  assignedAt: string;
  assignedBy: string;
  status: 'ACTIVE' | 'INACTIVE';
}

