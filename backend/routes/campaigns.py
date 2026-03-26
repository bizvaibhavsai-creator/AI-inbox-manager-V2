"""Campaign listing and sync endpoints."""

import logging
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from database import get_session
from models import Campaign
from plusvibe_client import list_campaigns as plusvibe_list_campaigns

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["campaigns"])


# ---------------------------------------------------------------------------
# GET /api/campaigns -- list all local campaigns
# ---------------------------------------------------------------------------

@router.get("/campaigns")
async def list_campaigns() -> Dict[str, Any]:
    """Return all campaigns stored in the local database."""
    with get_session() as session:
        campaigns: List[Campaign] = list(
            session.exec(
                select(Campaign).order_by(Campaign.created_at.desc())  # type: ignore[arg-type]
            ).all()
        )

        return {
            "campaigns": [
                {
                    "id": c.id,
                    "plusvibe_camp_id": c.plusvibe_camp_id,
                    "name": c.name,
                    "status": c.status,
                    "created_at": c.created_at.isoformat(),
                    "updated_at": c.updated_at.isoformat(),
                }
                for c in campaigns
            ],
            "total": len(campaigns),
        }


# ---------------------------------------------------------------------------
# POST /api/campaigns/sync -- sync campaigns from PlusVibe
# ---------------------------------------------------------------------------

@router.post("/campaigns/sync")
async def sync_campaigns() -> Dict[str, Any]:
    """Fetch campaigns from PlusVibe list-all endpoint and upsert into local DB.

    Iterates through all pages until no more results are returned.
    """
    created = 0
    updated = 0
    page = 1

    try:
        while True:
            data = await plusvibe_list_campaigns(page=page)

            # PlusVibe may return {"data": [...]} or a plain list
            campaigns_list = data if isinstance(data, list) else data.get("data", data.get("campaigns", []))
            if not campaigns_list:
                break

            with get_session() as session:
                for item in campaigns_list:
                    camp_id = str(item.get("id", "") or item.get("camp_id", ""))
                    if not camp_id:
                        continue

                    existing = session.exec(
                        select(Campaign).where(Campaign.plusvibe_camp_id == camp_id)
                    ).first()

                    if existing:
                        existing.name = item.get("name", existing.name)
                        existing.status = item.get("status", existing.status)
                        existing.updated_at = datetime.utcnow()
                        session.add(existing)
                        updated += 1
                    else:
                        campaign = Campaign(
                            plusvibe_camp_id=camp_id,
                            name=item.get("name", ""),
                            status=item.get("status", "active"),
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                        )
                        session.add(campaign)
                        created += 1

                session.commit()

            # Check for pagination -- stop if fewer results than expected
            if len(campaigns_list) < 100:
                break
            page += 1

    except Exception as exc:
        logger.exception("Error syncing campaigns from PlusVibe")
        raise HTTPException(status_code=502, detail=f"PlusVibe API error: {exc}")

    logger.info("Campaign sync complete: %d created, %d updated", created, updated)
    return {
        "status": "synced",
        "created": created,
        "updated": updated,
    }
