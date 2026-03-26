"""SQLModel database tables for the AI Inbox Manager."""

from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: Optional[int] = Field(default=None, primary_key=True)
    plusvibe_camp_id: str = Field(unique=True, index=True)
    name: str = ""
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    replies: List["Reply"] = Relationship(back_populates="campaign")


class Reply(SQLModel, table=True):
    __tablename__ = "replies"

    id: Optional[int] = Field(default=None, primary_key=True)
    campaign_id: Optional[int] = Field(default=None, foreign_key="campaigns.id", index=True)
    plusvibe_camp_id: str = Field(default="", index=True)
    lead_email: str = Field(default="", index=True)
    lead_name: Optional[str] = None
    lead_company: Optional[str] = None
    subject: str = ""
    body: str = ""
    category: str = ""  # interested|not_interested|ooo|unsubscribe|info_request|wrong_person|dnc
    ai_draft: Optional[str] = None
    status: str = Field(default="pending_approval")
    # Status flow: pending_approval -> approved -> sent
    #              auto_handled (for ooo/unsubscribe/dnc/wrong_person)
    #              pending_approval -> rejected
    plusvibe_reply_to_id: Optional[str] = None
    from_email: Optional[str] = None
    sentiment: Optional[str] = None
    webhook_event: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    campaign: Optional[Campaign] = Relationship(back_populates="replies")
    follow_ups: List["FollowUp"] = Relationship(back_populates="reply")


class FollowUp(SQLModel, table=True):
    __tablename__ = "follow_ups"

    id: Optional[int] = Field(default=None, primary_key=True)
    reply_id: int = Field(foreign_key="replies.id", index=True)
    day_number: int  # 3, 5, or 7
    message: Optional[str] = None
    status: str = Field(default="pending")  # pending|sent|skipped
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    reply: Optional[Reply] = Relationship(back_populates="follow_ups")
