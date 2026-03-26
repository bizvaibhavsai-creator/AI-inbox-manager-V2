"""Application configuration loaded from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PlusVibe.ai
    PLUSVIBE_API_KEY: str = ""
    PLUSVIBE_WORKSPACE_ID: str = ""

    # Anthropic (Claude)
    ANTHROPIC_API_KEY: str = ""

    # Webhook URL (n8n webhook for Slack notifications)
    WEBHOOK_URL: str = ""

    # Backend public URL (for n8n callbacks)
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = "sqlite:///./inbox_manager.db"

    # Server port (Railway sets PORT automatically)
    PORT: int = 8000

    # Playbook / follow-up template paths (check local first, then parent)
    PLAYBOOK_PATH: str = str(
        Path(__file__).resolve().parent / "playbook.md"
        if (Path(__file__).resolve().parent / "playbook.md").exists()
        else Path(__file__).resolve().parent.parent / "playbook.md"
    )
    FOLLOWUPS_PATH: str = str(
        Path(__file__).resolve().parent / "followups.md"
        if (Path(__file__).resolve().parent / "followups.md").exists()
        else Path(__file__).resolve().parent.parent / "followups.md"
    )

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
