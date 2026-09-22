from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from backend.app.db.database import get_db
from backend.app.db.models.notification import Notification
from backend.app.schemas.notification import NotificationCreate

router = APIRouter()


def format_notification_dict(n: Notification) -> Dict[str, Any]:
    return {
        "id": n.id,
        "title": getattr(n, "title", "Platform Notification") or "Platform Notification",
        "category": n.category,
        "type": n.type or "NOTICE",
        "severity": n.severity or "High",
        "priority": getattr(n, "priority", "HIGH") or "HIGH",
        "message": n.message,
        "actionUrl": getattr(n, "action_url", None),
        "projectId": n.project_id,
        "parcelId": n.parcel_id,
        "recipient": n.recipient,
        "channel": n.channel or "In-App",
        "timestamp": n.timestamp,
        "read": n.read,
        "createdAt": n.created_at.isoformat() if n.created_at else None,
    }


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_notifications(
    project_id: Optional[str] = None,
    recipient: Optional[str] = None,
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Notification)
    if project_id:
        query = query.filter(Notification.project_id == project_id)
    if recipient:
        query = query.filter(Notification.recipient == recipient)
    if unread_only:
        query = query.filter(Notification.read == False)
    if notification_type:
        query = query.filter((Notification.type == notification_type) | (Notification.category == notification_type))
    notifications = query.order_by(Notification.created_at.desc()).all()
    return [format_notification_dict(n) for n in notifications]


@router.put("/read-all", response_model=Dict[str, Any])
@router.put("/mark-all-read", response_model=Dict[str, Any])
def mark_all_as_read(
    project_id: Optional[str] = Query(None),
    recipient: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.read == False)
    if project_id:
        query = query.filter(Notification.project_id == project_id)
    if recipient:
        query = query.filter(Notification.recipient == recipient)
    
    count = query.update({Notification.read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "markedCount": count, "message": f"Marked {count} notifications as read."}


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_notification(n_in: NotificationCreate, db: Session = Depends(get_db)):
    n_id = n_in.id or f"NTF-{uuid.uuid4().hex[:4].upper()}"
    ts = n_in.timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    n = Notification(
        id=n_id,
        title=n_in.title or "Platform Notification",
        category=n_in.category or "Critical Delay Risk",
        type=n_in.type or "NOTICE",
        severity=n_in.severity or "High",
        priority=n_in.priority or "HIGH",
        message=n_in.message,
        action_url=n_in.action_url,
        project_id=n_in.project_id,
        parcel_id=n_in.parcel_id,
        recipient=n_in.recipient,
        channel=n_in.channel or "In-App",
        timestamp=ts,
        read=n_in.read or False,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return format_notification_dict(n)


@router.put("/{notification_id}/read", response_model=Dict[str, Any])
def mark_as_read(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Notification {notification_id} not found")
    n.read = True
    db.commit()
    db.refresh(n)
    return format_notification_dict(n)

