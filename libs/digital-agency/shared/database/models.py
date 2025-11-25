"""
Database models.

SQLAlchemy models for agents, tasks, workflows, contacts, deals,
and campaign data.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class AgentStatus(str, enum.Enum):
    """Agent status enumeration."""

    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    STOPPED = "stopped"


class TaskStatus(str, enum.Enum):
    """Task status enumeration."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Agent(Base):
    """Agent model."""

    __tablename__ = "agents"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False, index=True)
    type = Column(String(100), nullable=False)
    status = Column(SQLEnum(AgentStatus), default=AgentStatus.IDLE, index=True)

    model = Column(String(100), default="claude-sonnet-4-5-20250929")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)

    capabilities = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="agent")


class Task(Base):
    """Task model."""

    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    domain = Column(String(100), nullable=False, index=True)
    task_type = Column(String(100), nullable=False)

    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, index=True)
    priority = Column(String(20), default="medium")

    agent_id = Column(String(36), ForeignKey("agents.id"), index=True)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), index=True)

    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error_message = Column(Text)

    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    timeout_seconds = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    metadata = Column(JSON, default=dict)

    # Relationships
    agent = relationship("Agent", back_populates="tasks")
    workflow = relationship("Workflow", back_populates="tasks")


class Workflow(Base):
    """Workflow model."""

    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="pending", index=True)

    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)

    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    metadata = Column(JSON, default=dict)

    # Relationships
    tasks = relationship("Task", back_populates="workflow")


class Contact(Base):
    """Contact model for CRM."""

    __tablename__ = "contacts"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    company = Column(String(255), index=True)
    title = Column(String(255))
    phone = Column(String(50))

    # Lead scoring
    lead_score = Column(Integer, default=0)
    lead_status = Column(String(50), default="new", index=True)

    # External IDs
    hubspot_id = Column(String(100), index=True)
    salesforce_id = Column(String(100), index=True)

    # Metadata
    properties = Column(JSON, default=dict)
    tags = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    deals = relationship("Deal", back_populates="contact")


class Deal(Base):
    """Deal/opportunity model."""

    __tablename__ = "deals"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    contact_id = Column(String(36), ForeignKey("contacts.id"), index=True)

    amount = Column(Float)
    stage = Column(String(100), index=True)
    probability = Column(Float)

    close_date = Column(DateTime)
    won = Column(Boolean, default=False)

    # External IDs
    hubspot_id = Column(String(100), index=True)
    salesforce_id = Column(String(100), index=True)

    # Metadata
    properties = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contact = relationship("Contact", back_populates="deals")


class Campaign(Base):
    """Marketing campaign model."""

    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False, index=True)  # email, social, ad, etc.
    status = Column(String(50), default="draft", index=True)

    # Campaign details
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    budget = Column(Float)

    # Metrics
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    spend = Column(Float, default=0.0)

    # Configuration
    config = Column(JSON, default=dict)
    metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
