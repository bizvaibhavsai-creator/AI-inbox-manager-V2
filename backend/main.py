"""FastAPI application for the AI-powered Inbox Manager.

Receives webhook replies from PlusVibe.ai, classifies them with GPT-4o-mini,
generates AI draft responses using a playbook, and manages follow-ups.
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan -- create DB tables on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables when the application starts."""
    create_db_and_tables()
    logger.info("Database tables created / verified")
    yield
    logger.info("Application shutting down")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AI Inbox Manager",
    description="Backend for AI-powered cold email reply management with PlusVibe.ai",
    version="1.0.0",
    lifespan=lifespan,
)

# Full CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register route modules
# ---------------------------------------------------------------------------
from routes.webhook import router as webhook_router
from routes.replies import router as replies_router
from routes.campaigns import router as campaigns_router
from routes.analytics import router as analytics_router
from routes.followups import router as followups_router

app.include_router(webhook_router)
app.include_router(replies_router)
app.include_router(campaigns_router)
app.include_router(analytics_router)
app.include_router(followups_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
