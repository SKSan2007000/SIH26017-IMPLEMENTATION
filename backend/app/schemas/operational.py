from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# 1. Project Workflow State Schemas
class ProjectStateTransitionRequest(BaseModel):
    target_state: str = Field(..., description="Target project workflow state")
    actor_name: Optional[str] = "Project Director"
    actor_role: Optional[str] = "PROJECT_HEAD"
    notes: Optional[str] = None
    force: Optional[bool] = False


class ProjectStateTransitionResponse(BaseModel):
    projectId: str
    projectName: str
    previousState: str
    currentState: str
    overallProgress: float
    landAcquisitionProgress: float
    constructionProgress: float
    transitionTimestamp: str
    auditLogId: str


# 2. Parcel Workflow Schemas
class ParcelWorkflowUpdateRequest(BaseModel):
    target_status: str = Field(..., description="Target parcel workflow status")
    actor_name: Optional[str] = "Land Acquisition Officer"
    notes: Optional[str] = None


class ParcelWorkflowUpdateResponse(BaseModel):
    parcelId: str
    projectId: str
    previousStatus: str
    currentStatus: str
    verification: str
    acquisitionStatus: str
    disputed: bool
    updatedAt: str


# 3. Officer Auto-Assignment Schemas
class OfficerAutoAssignRequest(BaseModel):
    parcel_id: str
    project_id: str
    location: str
    priority: Optional[str] = "Medium"
    district: Optional[str] = None
    zone: Optional[str] = None
    coords: Optional[List[float]] = None
    task_type: Optional[str] = "FIELD_VERIFICATION"
    custom_sla_seconds: Optional[int] = None


# 4. Task Action & SLA Schemas
class TaskAcceptRequest(BaseModel):
    officer_id: str


class TaskCompleteRequest(BaseModel):
    officer_id: str
    gps_coordinates: Optional[List[float]] = None
    photo_evidence_ref: Optional[str] = None
    video_evidence_ref: Optional[str] = None
    observation: Optional[str] = None


class TaskSupervisorReviewRequest(BaseModel):
    supervisor_id: str
    decision: str = Field("APPROVED", description="'APPROVED' | 'REJECTED' | 'REVISIT_REQUESTED'")
    remarks: Optional[str] = None


class TaskEscalateRequest(BaseModel):
    trigger_reason: str = "SLA_BREACH"
    custom_details: Optional[str] = None


# 5. Officer Incentive & Leaderboard Schemas
class OfficerAwardPointsRequest(BaseModel):
    action_type: str
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    custom_points: Optional[int] = None
    reason: Optional[str] = None


class OfficerLeaderboardItem(BaseModel):
    rank: int
    id: str
    name: str
    role: str
    district: str
    completedTasks: int
    onTimeRatePct: float
    averageResponseSec: float
    verificationAccuracyPct: float
    totalPoints: int
    tier: str
    isAvailable: bool


# 6. Closed-Loop Intervention Schemas
class ClosedLoopInterventionRequest(BaseModel):
    action_type: str = Field(..., description="'DISPUTE_MEDIATION', 'DOCUMENT_OCR', 'COMPENSATION_ESCROW', 'POSSESSION'")
    target_parcel_ids: Optional[List[str]] = None
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None
    notes: Optional[str] = None


class ClosedLoopInterventionResponse(BaseModel):
    interventionId: str
    projectId: str
    actionTitle: str
    category: str
    riskBefore: int
    riskAfter: int
    improvementPoints: int
    delayBeforeMonths: float
    delayAfterMonths: float
    savedTimelineMonths: float
    officerName: str
    completedAt: str


# 7. Contractor Monitoring Schemas
class ContractorPackageCreateRequest(BaseModel):
    project_id: str
    package_name: str
    contractor_name: str
    planned_progress_pct: Optional[float] = 0.0
    target_date: Optional[str] = None


class ContractorProgressSubmitRequest(BaseModel):
    reported_progress_pct: float
    photo_evidence_ref: Optional[str] = None
    video_evidence_ref: Optional[str] = None
    notes: Optional[str] = None


class ContractorProgressVerifyRequest(BaseModel):
    officer_id: str
    decision: Optional[str] = "VERIFIED"


# 8. Stakeholder Benefit Schemas
class StakeholderBenefitCreateRequest(BaseModel):
    stakeholder_id: str
    project_id: str
    owner_ref: str
    category: Optional[str] = "Field Support"
    stipend_amount_inr: Optional[float] = 15000.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None
