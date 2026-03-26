"""AI-powered email classification and draft generation using Claude Sonnet 4.6."""

import logging
from pathlib import Path
from typing import Optional

import anthropic

from config import settings

logger = logging.getLogger(__name__)

_client: Optional[anthropic.AsyncAnthropic] = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured")
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


MODEL = "claude-sonnet-4-6-20250514"

VALID_CATEGORIES = [
    "interested",
    "not_interested",
    "ooo",
    "unsubscribe",
    "info_request",
    "wrong_person",
    "dnc",
]

CLASSIFICATION_SYSTEM_PROMPT = (
    "You are an email classifier for cold email campaigns. "
    "Classify the following reply into exactly one category: "
    "interested, not_interested, ooo, unsubscribe, info_request, wrong_person, dnc. "
    "Reply with ONLY the category name, nothing else."
)


def _load_file(path: str) -> str:
    """Load a text file, returning an empty string if not found."""
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning("File not found: %s", path)
        return ""


# ---------------------------------------------------------------------------
# classify_reply
# ---------------------------------------------------------------------------

async def classify_reply(reply_text: str) -> str:
    """Classify an email reply into one of the standard categories using Claude.

    Returns one of: interested, not_interested, ooo, unsubscribe,
    info_request, wrong_person, dnc.
    """
    try:
        client = _get_client()
        response = await client.messages.create(
            model=MODEL,
            max_tokens=20,
            temperature=0,
            system=CLASSIFICATION_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": reply_text},
            ],
        )
        category = response.content[0].text.strip().lower()
        if category not in VALID_CATEGORIES:
            logger.warning(
                "Claude returned unexpected category '%s', defaulting to not_interested",
                category,
            )
            return "not_interested"
        return category
    except Exception:
        logger.exception("Error classifying reply, defaulting to not_interested")
        return "not_interested"


# ---------------------------------------------------------------------------
# generate_draft
# ---------------------------------------------------------------------------

async def generate_draft(
    reply_text: str,
    category: str,
    lead_name: str,
    campaign_name: str,
) -> str:
    """Generate a draft response for an email reply using the playbook."""
    if category not in ("interested", "info_request", "not_interested"):
        return ""

    playbook = _load_file(settings.PLAYBOOK_PATH)
    if not playbook:
        playbook = "(No playbook provided -- use professional B2B sales best practices)"

    system_prompt = (
        "You are a B2B cold email expert writing a response on behalf of a sales agency.\n\n"
        "Follow the messaging playbook below for tone, style, and approach.\n\n"
        "MESSAGING PLAYBOOK:\n"
        f"{playbook}\n\n"
        "RULES:\n"
        "- Write ONLY the email body text (no subject line).\n"
        "- Be concise (2-5 sentences).\n"
        "- Feel human and personalised, not templated.\n"
        "- Include a clear next step or CTA when appropriate.\n"
    )

    user_prompt = (
        f"Lead name: {lead_name or 'Unknown'}\n"
        f"Campaign: {campaign_name}\n"
        f"Category: {category}\n"
        f"Their reply:\n{reply_text}"
    )

    try:
        client = _get_client()
        response = await client.messages.create(
            model=MODEL,
            max_tokens=400,
            temperature=0.7,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.content[0].text.strip()
    except Exception:
        logger.exception("Error generating draft response")
        return ""


# ---------------------------------------------------------------------------
# generate_followup
# ---------------------------------------------------------------------------

async def generate_followup(
    reply_text: str,
    original_draft: str,
    day_number: int,
    lead_name: str,
) -> str:
    """Generate a follow-up message for a given day number using followups.md templates."""
    followup_templates = _load_file(settings.FOLLOWUPS_PATH)
    if not followup_templates:
        followup_templates = (
            "(No follow-up templates provided -- use professional B2B follow-up best practices)"
        )

    system_prompt = (
        "You are a B2B cold email expert writing a follow-up message.\n\n"
        "FOLLOW-UP TEMPLATES:\n"
        f"{followup_templates}\n\n"
        "RULES:\n"
        "- Use the template for the matching day number as a guide.\n"
        "- Keep it short (1-3 sentences).\n"
        "- Make it feel natural, not automated.\n"
        "- Write ONLY the email body text.\n"
    )

    user_prompt = (
        f"Lead name: {lead_name or 'Unknown'}\n"
        f"Day number: {day_number}\n"
        f"Original reply from prospect:\n{reply_text}\n\n"
        f"Our last response:\n{original_draft}"
    )

    try:
        client = _get_client()
        response = await client.messages.create(
            model=MODEL,
            max_tokens=200,
            temperature=0.7,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.content[0].text.strip()
    except Exception:
        logger.exception("Error generating follow-up message")
        return ""
