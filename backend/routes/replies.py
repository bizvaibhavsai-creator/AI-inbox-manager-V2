"""Reply listing, detail, update, and send endpoints."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import func, or_, select

from database import get_session
from models import FollowUp, Reply
from plusvibe_client import send_reply as plusvibe_send_reply

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["replies"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class SendReplyRequest(BaseModel):
    reply_id: int


class UpdateReplyRequest(BaseModel):
    status: Optional[str] = None
    ai_draft: Optional[str] = None


# ---------------------------------------------------------------------------
# GET /api/replies -- paginated list
# ---------------------------------------------------------------------------

@router.get("/replies")
async def list_replies(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    campaign_id: Optional[int] = Query(None, description="Filter by campaign DB id"),
    search: Optional[str] = Query(None, description="Search in email or name"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
) -> Dict[str, Any]:
    """Return a paginated list of replies with optional filters."""
    with get_session() as session:
        query = select(Reply)
        count_query = select(func.count()).select_from(Reply)

        # Apply filters
        if category:
            query = query.where(Reply.category == category)
            count_query = count_query.where(Reply.category == category)
        if status:
            query = query.where(Reply.status == status)
            count_query = count_query.where(Reply.status == status)
        if campaign_id is not None:
            query = query.where(Reply.campaign_id == campaign_id)
            count_query = count_query.where(Reply.campaign_id == campaign_id)
        if search:
            pattern = f"%{search}%"
            search_filter = or_(
                Reply.lead_email.ilike(pattern),  # type: ignore[union-attr]
                Reply.lead_name.ilike(pattern),  # type: ignore[union-attr]
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total: int = session.exec(count_query).one()

        query = query.order_by(Reply.created_at.desc())  # type: ignore[arg-type]
        query = query.offset((page - 1) * per_page).limit(per_page)
        replies: List[Reply] = list(session.exec(query).all())

        return {
            "replies": [
                {
                    "id": r.id,
                    "campaign_id": r.campaign_id,
                    "plusvibe_camp_id": r.plusvibe_camp_id,
                    "lead_email": r.lead_email,
                    "lead_name": r.lead_name,
                    "lead_company": r.lead_company,
                    "subject": r.subject,
                    "body": r.body,
                    "category": r.category,
                    "ai_draft": r.ai_draft,
                    "status": r.status,
                    "from_email": r.from_email,
                    "sentiment": r.sentiment,
                    "created_at": r.created_at.isoformat(),
                    "sent_at": r.sent_at.isoformat() if r.sent_at else None,
                    "updated_at": r.updated_at.isoformat(),
                }
                for r in replies
            ],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": max(1, (total + per_page - 1) // per_page),
        }


# ---------------------------------------------------------------------------
# GET /api/replies/{id} -- single reply with follow-ups
# ---------------------------------------------------------------------------

@router.get("/replies/{reply_id}")
async def get_reply(reply_id: int) -> Dict[str, Any]:
    """Return a single reply with its follow-ups."""
    with get_session() as session:
        reply = session.get(Reply, reply_id)
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")

        followups = session.exec(
            select(FollowUp)
            .where(FollowUp.reply_id == reply_id)
            .order_by(FollowUp.day_number)
        ).all()

        return {
            "id": reply.id,
            "campaign_id": reply.campaign_id,
            "plusvibe_camp_id": reply.plusvibe_camp_id,
            "lead_email": reply.lead_email,
            "lead_name": reply.lead_name,
            "lead_company": reply.lead_company,
            "subject": reply.subject,
            "body": reply.body,
            "category": reply.category,
            "ai_draft": reply.ai_draft,
            "status": reply.status,
            "plusvibe_reply_to_id": reply.plusvibe_reply_to_id,
            "from_email": reply.from_email,
            "sentiment": reply.sentiment,
            "webhook_event": reply.webhook_event,
            "created_at": reply.created_at.isoformat(),
            "sent_at": reply.sent_at.isoformat() if reply.sent_at else None,
            "updated_at": reply.updated_at.isoformat(),
            "follow_ups": [
                {
                    "id": fu.id,
                    "day_number": fu.day_number,
                    "message": fu.message,
                    "status": fu.status,
                    "scheduled_for": fu.scheduled_for.isoformat(),
                    "sent_at": fu.sent_at.isoformat() if fu.sent_at else None,
                }
                for fu in followups
            ],
        }


# ---------------------------------------------------------------------------
# PATCH /api/replies/{id} -- update status / draft
# ---------------------------------------------------------------------------

@router.patch("/replies/{reply_id}")
async def update_reply(reply_id: int, body: UpdateReplyRequest) -> Dict[str, Any]:
    """Update a reply's status and/or AI draft."""
    with get_session() as session:
        reply = session.get(Reply, reply_id)
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")

        if body.status is not None:
            reply.status = body.status
        if body.ai_draft is not None:
            reply.ai_draft = body.ai_draft

        reply.updated_at = datetime.utcnow()
        session.add(reply)
        session.commit()

        return {
            "status": "updated",
            "reply_id": reply_id,
            "new_status": reply.status,
        }


# ---------------------------------------------------------------------------
# POST /api/send-reply -- send via PlusVibe API
# ---------------------------------------------------------------------------

@router.post("/send-reply")
async def send_reply_endpoint(request: SendReplyRequest) -> Dict[str, Any]:
    """Send an approved draft reply through the PlusVibe API."""
    with get_session() as session:
        reply = session.get(Reply, request.reply_id)
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")

        if not reply.ai_draft:
            raise HTTPException(status_code=400, detail="No draft to send")

        if not reply.plusvibe_reply_to_id:
            raise HTTPException(
                status_code=400,
                detail="No plusvibe_reply_to_id -- cannot send reply without a thread reference",
            )

        # Send via PlusVibe
        try:
            await plusvibe_send_reply(
                reply_to_id=reply.plusvibe_reply_to_id,
                subject=f"Re: {reply.subject}" if not reply.subject.startswith("Re:") else reply.subject,
                from_email=reply.from_email or "",
                to_email=reply.lead_email,
                body=reply.ai_draft,
            )
        except Exception as exc:
            logger.exception("Failed to send reply %d via PlusVibe", reply.id)
            raise HTTPException(
                status_code=502,
                detail=f"PlusVibe API error: {exc}",
            )

        reply.status = "sent"
        reply.sent_at = datetime.utcnow()
        reply.updated_at = datetime.utcnow()
        session.add(reply)
        session.commit()

        logger.info("Reply %d sent to %s via PlusVibe", reply.id, reply.lead_email)
        return {
            "status": "sent",
            "reply_id": reply.id,
            "lead_email": reply.lead_email,
        }
