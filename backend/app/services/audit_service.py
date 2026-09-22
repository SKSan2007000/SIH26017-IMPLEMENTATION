from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import uuid
from backend.app.db.models.audit import AuditLog


def log_audit_event(
    db: Session,
    project_id: str,
    actor: str,
    action: str,
    entity: str,
    entity_id: str,
    label: str,
    category: str = "System",
    details: Optional[str] = None,
    user_id: Optional[str] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """Helper service to create an immutable audit log entry."""
    now = datetime.now(timezone.utc)
    log = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
        project_id=project_id,
        user_id=user_id,
        actor=actor,
        action=action,
        entity=entity,
        entity_id=entity_id,
        label=label,
        category=category,
        details=details or f"{action} performed on {entity} {entity_id}",
        extra_metadata=extra_metadata,
        time=now.strftime("%H:%M:%S"),
        date=now.strftime("%Y-%m-%d"),
        timestamp=now,
    )
    db.add(log)
    try:
        db.commit()
        db.refresh(log)
    except Exception:
        db.rollback()
    return log
