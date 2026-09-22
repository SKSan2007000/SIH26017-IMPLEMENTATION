from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.audit import AuditLog
from backend.app.schemas.audit import AuditLogCreate

router = APIRouter()


def format_audit_dict(a: AuditLog) -> Dict[str, Any]:
    return {
        "id": a.id,
        "projectId": a.project_id,
        "userId": a.user_id,
        "actor": a.actor,
        "action": a.action,
        "entity": a.entity,
        "entityId": a.entity_id,
        "label": a.label,
        "category": a.category,
        "details": a.details,
        "metadata": a.extra_metadata,
        "time": a.time,
        "date": a.date,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
    }


@router.get("/projects/{project_id}/audit", response_model=List[Dict[str, Any]])
def get_project_audit_trail(project_id: str, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.project_id == project_id).order_by(AuditLog.timestamp.desc()).all()
    return [format_audit_dict(l) for l in logs]


@router.get("/audit-logs", response_model=List[Dict[str, Any]])
def list_audit_logs(
    project_id: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if project_id:
        query = query.filter(AuditLog.project_id == project_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    logs = query.order_by(AuditLog.timestamp.desc()).all()
    return [format_audit_dict(l) for l in logs]


@router.post("/audit-logs", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_audit_log(a_in: AuditLogCreate, db: Session = Depends(get_db)):
    a_id = a_in.id or f"AUD-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc)
    log = AuditLog(
        id=a_id,
        project_id=a_in.project_id,
        user_id=a_in.user_id,
        actor=a_in.actor,
        action=a_in.action,
        entity=a_in.entity,
        entity_id=a_in.entity_id,
        label=a_in.label,
        category=a_in.category or "System",
        details=a_in.details,
        extra_metadata=a_in.extra_metadata,
        time=a_in.time or now.strftime("%H:%M:%S"),
        date=a_in.date or now.strftime("%Y-%m-%d"),
        timestamp=now,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return format_audit_dict(log)
