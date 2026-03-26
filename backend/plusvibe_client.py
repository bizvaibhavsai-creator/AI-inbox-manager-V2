"""Async HTTP client for the PlusVibe.ai API (v1)."""

import logging
from typing import Any, Dict, List, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://api.plusvibe.ai/api/v1"


def _headers() -> Dict[str, str]:
    return {
        "x-api-key": settings.PLUSVIBE_API_KEY,
        "Content-Type": "application/json",
    }


def _workspace_params(extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Return query params that always include workspace_id."""
    params: Dict[str, Any] = {"workspace_id": settings.PLUSVIBE_WORKSPACE_ID}
    if extra:
        params.update(extra)
    return params


# ---------------------------------------------------------------------------
# Reply to an email
# ---------------------------------------------------------------------------

async def send_reply(
    reply_to_id: str,
    subject: str,
    from_email: str,
    to_email: str,
    body: str,
) -> Dict[str, Any]:
    """Send a reply to an email via PlusVibe unibox.

    POST /unibox/emails/reply
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/unibox/emails/reply",
            headers=_headers(),
            params=_workspace_params(),
            json={
                "reply_to_id": reply_to_id,
                "subject": subject,
                "from": from_email,
                "to": to_email,
                "body": body,
            },
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Get emails
# ---------------------------------------------------------------------------

async def get_emails(
    campaign_id: Optional[str] = None,
    email_type: Optional[str] = None,
    label: Optional[str] = None,
    page_trail: Optional[str] = None,
) -> Dict[str, Any]:
    """Fetch emails from PlusVibe unibox.

    GET /unibox/emails
    """
    extra: Dict[str, Any] = {}
    if campaign_id:
        extra["campaign_id"] = campaign_id
    if email_type:
        extra["email_type"] = email_type
    if label:
        extra["label"] = label
    if page_trail:
        extra["page_trail"] = page_trail

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{BASE_URL}/unibox/emails",
            headers=_headers(),
            params=_workspace_params(extra),
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# List campaigns
# ---------------------------------------------------------------------------

async def list_campaigns(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 100,
) -> Dict[str, Any]:
    """Fetch all campaigns from PlusVibe.

    GET /campaign/list-all
    """
    extra: Dict[str, Any] = {"page": page, "limit": limit}
    if status:
        extra["status"] = status

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{BASE_URL}/campaign/list-all",
            headers=_headers(),
            params=_workspace_params(extra),
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Campaign stats
# ---------------------------------------------------------------------------

async def get_campaign_stats(
    campaign_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Fetch campaign analytics from PlusVibe.

    GET /analytics/campaign/stats
    """
    extra: Dict[str, Any] = {"campaign_id": campaign_id}
    if start_date:
        extra["start_date"] = start_date
    if end_date:
        extra["end_date"] = end_date

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{BASE_URL}/analytics/campaign/stats",
            headers=_headers(),
            params=_workspace_params(extra),
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Update lead label
# ---------------------------------------------------------------------------

async def update_lead_label(
    campaign_id: str,
    email: str,
    label: str,
) -> Dict[str, Any]:
    """Update a lead's label in PlusVibe.

    POST /lead/data/update
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/lead/data/update",
            headers=_headers(),
            json={
                "workspace_id": settings.PLUSVIBE_WORKSPACE_ID,
                "campaign_id": campaign_id,
                "email": email,
                "label": label,
            },
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Blocklist
# ---------------------------------------------------------------------------

async def add_to_blocklist(entries: List[str]) -> Dict[str, Any]:
    """Add email addresses to the workspace blocklist.

    POST /blocklist/add
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/blocklist/add",
            headers=_headers(),
            json={
                "workspace_id": settings.PLUSVIBE_WORKSPACE_ID,
                "entries": entries,
            },
        )
        response.raise_for_status()
        return response.json()
