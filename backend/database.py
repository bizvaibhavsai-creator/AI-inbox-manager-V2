"""Database engine and session management using SQLModel + SQLite."""

from sqlmodel import Session, SQLModel, create_engine

from config import settings

# Use check_same_thread=False for SQLite with FastAPI (async context)
connect_args = {"check_same_thread": False}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)


def create_db_and_tables() -> None:
    """Create all tables defined in SQLModel metadata."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Return a new database session. Caller is responsible for closing it."""
    return Session(engine)
