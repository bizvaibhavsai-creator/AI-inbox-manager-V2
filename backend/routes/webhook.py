"""Webhook endpoint for receiving reply events from PlusVibe.ai."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Request
from sqlmodel import select

from ai_service import classify_reply, generate_draft
from config import settings
from database import get_session
from models import Campaign, FollowUp, Reply
from plusvibe_client import add_to_blocklist, update_lead_label

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["webhook"])


@router.post("/webhook/plusvibe")
async def receive_plusvibe_webhook(request: Request) -> Dict[str, Any]:
    """Receive a reply webhook from PlusVibe.ai.

    Flow:
    1. Parse the webhook payload.
    2. Find or create the campaign record.
    3. Store the reply in the database.
    4. Classify the reply with GPT-4o-mini.
    5. Generate AI draft for actionable categories.
    6. Auto-handle non-actionable categories (ooo, unsubscribe, dnc, wrong_person).
    7. Create follow-up schedule for interested / info_request.
    8. POST to n8n webhook for Slack notification.
    """
    payload: Dict[str, Any] = await request.json()

    # --- Extract fields from the PlusVibe webhook payload ---
    camp_id: str = payload.get("camp_id", "") or ""
    campaign_name: str = payload.get("campaign_name", "") or ""
    lead_email: str = payload.get("email", "") or ""
    lead_first = payload.get("first_name", "") or ""
    lead_last = payload.get("last_name", "") or ""
    lead_name = f"{lead_first} {lead_last}".strip() or None
    lead_company: Optional[str] = payload.get("company_name") or payload.get("company") or None
    subject: str = payload.get("subject", "") or ""
    body: str = payload.get("text_body", "") or payload.get("body", "") or ""
    from_email: str = payload.get("from_email", "") or payload.get("from", "") or ""
    to_email: str = payload.get("to_email", "") or payload.get("to", "") or ""
    sentiment: str = payload.get("sentiment", "") or ""
    webhook_event: str = payload.get("webhook_event", "") or ""
    reply_to_id: str = payload.get("webhook_id", "") or payload.get("lead_id", "") or ""
    direction: str = payload.get("direction", "IN") or "IN"

    # Only process inbound replies
    if direction == "OUT":
        logger.info("Skipping outbound email from %s", from_email)
        return {"status": "skipped", "reason": "outbound_email"}

    if not body:
        logger.warning("Empty body in webhook payload, skipping")
        return {"status": "skipped", "reason": "empty_body"}

    logger.info(
        "Webhook received: lead=%s campaign=%s event=%s",
        lead_email, campaign_name, webhook_event,
    )

    # --- 1. Find or create campaign ---
    with get_session() as session:
        campaign = None
        if camp_id:
            campaign = session.exec(
                select(Campaign).where(Campaign.plusvibe_camp_id == camp_id)
            ).first()
            if not campaign:
                campaign = Campaign(
                    plusvibe_camp_id=camp_id,
                    name=campaign_name,
                )
                session.add(campaign)
                session.commit()
                session.refresh(campaign)
                logger.info("Created campaign record: %s (%s)", campaign_name, camp_id)

        campaign_db_id = campaign.id if campaign else None

        # --- 2. Store reply ---
        reply = Reply(
            campaign_id=campaign_db_id,
            plusvibe_camp_id=camp_id,
            lead_email=lead_email,
            lead_name=lead_name,
            lead_company=lead_company,
            subject=subject,
            body=body,
            from_email=to_email,  # The sending account (our side) is the "to" in an inbound reply
            plusvibe_reply_to_id=reply_to_id,
            sentiment=sentiment,
            webhook_event=webhook_event,
            status="pending_approval",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(reply)
        session.commit()
        session.refresh(reply)
        reply_id = reply.id

    # --- 3. Classify ---
    category = await classify_reply(body)
    logger.info("Reply %d classified as: %s", reply_id, category)

    # --- 4. Generate draft for actionable categories ---
    ai_draft = ""
    if category in ("interested", "info_request", "not_interested"):
        ai_draft = await generate_draft(
            reply_text=body,
            category=category,
            lead_name=lead_name or "",
            campaign_name=campaign_name,
        )

    # --- 5. Determine status & handle auto-actions ---
    if category in ("ooo", "unsubscribe", "dnc", "wrong_person"):
        status = "auto_handled"
    else:
        status = "pending_approval"

    with get_session() as session:
        reply = session.get(Reply, reply_id)
        if reply is None:
            logger.error("Reply %d not found after creation", reply_id)
            return {"status": "error", "detail": "reply_not_found"}

        reply.category = category
        reply.ai_draft = ai_draft
        reply.status = status
        reply.updated_at = datetime.utcnow()
        session.add(reply)
        session.commit()

        # --- Auto-handle side effects ---
        if category in ("ooo", "unsubscribe", "dnc") and camp_id and lead_email:
            label_map = {
                "ooo": "Out of Office",
                "unsubscribe": "Unsubscribed",
                "dnc": "Do Not Contact",
            }
            try:
                await update_lead_label(camp_id, lead_email, label_map[category])
                logger.info("Updated lead label for %s -> %s", lead_email, label_map[category])
            except Exception:
                logger.exception("Failed to update lead label for %s", lead_email)

            if category == "dnc":
                try:
                    await add_to_blocklist([lead_email])
                    logger.info("Added %s to blocklist", lead_email)
                except Exception:
                    logger.exception("Failed to add %s to blocklist", lead_email)

        # --- 6. Create follow-up schedule for interested / info_request ---
        if category in ("interested", "info_request"):
            now = datetime.utcnow()
            for day in (3, 5, 7):
                followup = FollowUp(
                    reply_id=reply_id,
                    day_number=day,
                    status="pending",
                    scheduled_for=now + timedelta(days=day),
                    created_at=now,
                )
                session.add(followup)
            session.commit()
            logger.info("Created follow-up schedule for reply %d", reply_id)

        # Build payload for n8n / Slack notification
        n8n_payload = {
            "reply_id": reply.id,
            "lead_email": reply.lead_email,
            "lead_name": reply.lead_name,
            "lead_company": reply.lead_company,
            "campaign_name": campaign_name,
            "plusvibe_camp_id": camp_id,
            "category": category,
            "body": reply.body,
            "subject": reply.subject,
            "ai_draft": reply.ai_draft or "",
            "status": reply.status,
            "sentiment": reply.sentiment,
            "created_at": reply.created_at.isoformat(),
            "backend_url": settings.BACKEND_PUBLIC_URL,
        }

    # --- 7. POST to n8n webhook for Slack notification ---
    if settings.WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(settings.WEBHOOK_URL, json=n8n_payload)
            logger.info("Forwarded reply %d to n8n webhook", reply_id)
        except Exception:
            logger.exception("Failed to forward reply %d to n8n webhook", reply_id)

    return {
        "status": "processed",
        "reply_id": reply_id,
        "category": category,
    }
