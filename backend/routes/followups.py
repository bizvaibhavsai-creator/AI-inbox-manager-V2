"""Follow-up management endpoints."""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from database import get_session
from models import FollowUp, Reply

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["followups"])


class UpdateFollowUpRequest(BaseModel):
    status: Optional[str] = None  # sent | skipped
    sent_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# GET /api/pending-followups
# ---------------------------------------------------------------------------

@router.get("/pending-followups")
async def get_pending_followups() -> Dict[str, Any]:
    """Return follow-ups where status=pending AND scheduled_for <= now,
    joined with the associated reply data."""
    now = datetime.utcnow()

    with get_session() as session:
        followups: List[FollowUp] = list(
            session.exec(
                select(FollowUp)
                .where(FollowUp.status == "pending")
                .where(FollowUp.scheduled_for <= now)
                .order_by(FollowUp.scheduled_for)
            ).all()
        )

        results: List[Dict[str, Any]] = []
        for fu in followups:
            reply = session.get(Reply, fu.reply_id)
            if not reply:
                continue

            results.append({
                "followup_id": fu.id,
                "reply_id": fu.reply_id,
                "day_number": fu.day_number,
                "message": fu.message,
                "status": fu.status,
                "scheduled_for": fu.scheduled_for.isoformat(),
                "reply": {
                    "id": reply.id,
                    "lead_email": reply.lead_email,
                    "lead_name": reply.lead_name,
                    "lead_company": reply.lead_company,
                    "subject": reply.subject,
                    "body": reply.body,
                    "category": reply.category,
                    "ai_draft": reply.ai_draft,
                    "campaign_id": reply.campaign_id,
                    "plusvibe_camp_id": reply.plusvibe_camp_id,
                    "from_email": reply.from_email,
                },
            })

        return {
            "followups": results,
            "count": len(results),
        }


# ---------------------------------------------------------------------------
# PATCH /api/followups/{id}
# ---------------------------------------------------------------------------

@router.patch("/followups/{followup_id}")
async def update_followup(
    followup_id: int,
    body: UpdateFollowUpRequest,
) -> Dict[str, Any]:
    """Update a follow-up's status (sent/skipped) and optionally set sent_at."""
    with get_session() as session:
        followup = session.get(FollowUp, followup_id)
        if not followup:
            raise HTTPException(status_code=404, detail="Follow-up not found")

        if body.status is not None:
            if body.status not in ("pending", "sent", "skipped"):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid status. Must be: pending, sent, or skipped",
                )
            followup.status = body.status

        if body.status == "sent":
            followup.sent_at = body.sent_at or datetime.utcnow()

        session.add(followup)
        session.commit()

        logger.info("Follow-up %d updated to status=%s", followup_id, followup.status)

        return {
            "status": "updated",
            "followup_id": followup_id,
            "new_status": followup.status,
            "sent_at": followup.sent_at.isoformat() if followup.sent_at else None,
        }
