"""Analytics endpoints for the AI Inbox Manager dashboard."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query
from sqlmodel import func, select

from database import get_session
from models import Campaign, FollowUp, Reply

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])

CATEGORIES = [
    "interested",
    "not_interested",
    "ooo",
    "unsubscribe",
    "info_request",
    "wrong_person",
    "dnc",
]


def _apply_period_filter(query, period: str):
    """Apply a time-period filter to a query on Reply.created_at."""
    now = datetime.utcnow()
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.where(Reply.created_at >= start)
    elif period == "week":
        query = query.where(Reply.created_at >= now - timedelta(days=7))
    elif period == "month":
        query = query.where(Reply.created_at >= now - timedelta(days=30))
    # "all" -- no filter
    return query


# ---------------------------------------------------------------------------
# GET /api/analytics/overview
# ---------------------------------------------------------------------------

@router.get("/overview")
async def analytics_overview(
    period: str = Query("all", description="all|today|week|month"),
) -> Dict[str, Any]:
    """Return aggregate stats: total replies, counts by category and status,
    average response time, and daily volumes for the last 30 days."""
    with get_session() as session:
        query = select(Reply)
        query = _apply_period_filter(query, period)
        replies: List[Reply] = list(session.exec(query).all())

        total = len(replies)

        # Category counts
        by_category: Dict[str, int] = {}
        for cat in CATEGORIES:
            by_category[cat] = sum(1 for r in replies if r.category == cat)

        # Status counts
        statuses = ["pending_approval", "approved", "rejected", "sent", "auto_handled"]
        by_status: Dict[str, int] = {}
        for s in statuses:
            by_status[s] = sum(1 for r in replies if r.status == s)

        # Average response time (created_at -> sent_at)
        response_times: List[float] = []
        for r in replies:
            if r.sent_at and r.created_at:
                delta = (r.sent_at - r.created_at).total_seconds() / 60
                response_times.append(delta)
        avg_response_time: Optional[float] = (
            round(sum(response_times) / len(response_times), 1)
            if response_times
            else None
        )

        # Daily volumes (last 30 days)
        now = datetime.utcnow()
        daily: Dict[str, Dict[str, Any]] = {}
        for r in replies:
            date_key = r.created_at.strftime("%Y-%m-%d")
            if date_key not in daily:
                daily[date_key] = {"date": date_key, "total": 0}
                for cat in CATEGORIES:
                    daily[date_key][cat] = 0
            daily[date_key]["total"] += 1
            if r.category in CATEGORIES:
                daily[date_key][r.category] += 1

        # Fill missing dates for the last 30 days
        daily_volumes: List[Dict[str, Any]] = []
        for i in range(30):
            date_key = (now - timedelta(days=29 - i)).strftime("%Y-%m-%d")
            if date_key in daily:
                entry = daily[date_key]
                daily_volumes.append({"date": entry["date"], "count": entry["total"]})
            else:
                daily_volumes.append({"date": date_key, "count": 0})

        # Follow-up stats
        all_followups: List[FollowUp] = list(session.exec(select(FollowUp)).all())
        follow_up_stats = {
            "total": len(all_followups),
            "pending": sum(1 for f in all_followups if f.status == "pending"),
            "sent": sum(1 for f in all_followups if f.status == "sent"),
            "skipped": sum(1 for f in all_followups if f.status == "skipped"),
        }

        # Convert avg response time to hours
        avg_hours = round(avg_response_time / 60, 1) if avg_response_time else 0

        return {
            "total": total,
            "by_category": by_category,
            "by_status": by_status,
            "avg_response_time_hours": avg_hours,
            "daily_volumes": daily_volumes,
            "follow_up_stats": follow_up_stats,
        }


# ---------------------------------------------------------------------------
# GET /api/analytics/campaigns
# ---------------------------------------------------------------------------

@router.get("/campaigns")
async def analytics_campaigns() -> Dict[str, Any]:
    """Return per-campaign stats: reply count, category breakdown,
    interest rate, and unsubscribe rate."""
    with get_session() as session:
        campaigns: List[Campaign] = list(session.exec(select(Campaign)).all())
        replies: List[Reply] = list(session.exec(select(Reply)).all())

        # Group replies by campaign_id
        campaign_replies: Dict[Optional[int], List[Reply]] = {}
        for r in replies:
            campaign_replies.setdefault(r.campaign_id, []).append(r)

        results: List[Dict[str, Any]] = []
        for camp in campaigns:
            camp_replies = campaign_replies.get(camp.id, [])
            total = len(camp_replies)

            breakdown: Dict[str, int] = {}
            for cat in CATEGORIES:
                breakdown[cat] = sum(1 for r in camp_replies if r.category == cat)

            interest_rate = round(breakdown["interested"] / total, 4) if total > 0 else 0.0
            unsub_rate = round(breakdown["unsubscribe"] / total, 4) if total > 0 else 0.0

            results.append({
                "id": camp.id,
                "plusvibe_camp_id": camp.plusvibe_camp_id,
                "name": camp.name,
                "status": camp.status,
                "total_replies": total,
                "by_category": breakdown,
                "interest_rate": interest_rate,
                "unsubscribe_rate": unsub_rate,
            })

        # Sort by reply count descending
        results.sort(key=lambda x: x["total_replies"], reverse=True)

        return {"campaigns": results}
