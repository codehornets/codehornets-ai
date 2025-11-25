"""
Configuration module for watcher system.

Centralizes all configuration settings for worker watchers and orchestrator listener.
Uses environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class WatcherConfig(BaseModel):
    """Configuration for file watcher system."""

    # Worker identity
    worker_name: str = Field(..., description="Worker name (marie, anga, fabien)")

    # Directories
    task_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("TASK_DIR", "/shared/tasks")),
        description="Root task directory",
    )
    trigger_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("TRIGGER_DIR", "/shared/triggers")),
        description="Trigger directory for signaling",
    )
    result_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("RESULT_DIR", "/shared/results")),
        description="Result output directory",
    )
    heartbeat_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("HEARTBEAT_DIR", "/shared/heartbeats")),
        description="Heartbeat directory for health checks",
    )
    dlq_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("DLQ_DIR", "/shared/dlq")),
        description="Dead letter queue for failed tasks",
    )

    # Performance
    max_concurrent_tasks: int = Field(
        default=int(os.getenv("MAX_CONCURRENT_TASKS", "3")),
        ge=1,
        le=10,
        description="Maximum concurrent task executions",
    )
    task_timeout: int = Field(
        default=int(os.getenv("TASK_TIMEOUT", "600")),
        ge=10,
        le=3600,
        description="Task execution timeout in seconds",
    )
    heartbeat_interval: int = Field(
        default=int(os.getenv("HEARTBEAT_INTERVAL", "10")),
        ge=1,
        le=60,
        description="Heartbeat interval in seconds",
    )

    # Retry configuration
    max_retries: int = Field(
        default=int(os.getenv("MAX_RETRIES", "3")),
        ge=0,
        le=10,
        description="Maximum retry attempts for failed tasks",
    )
    retry_backoff: float = Field(
        default=float(os.getenv("RETRY_BACKOFF", "2.0")),
        ge=1.0,
        le=10.0,
        description="Exponential backoff multiplier",
    )
    initial_retry_delay: float = Field(
        default=float(os.getenv("INITIAL_RETRY_DELAY", "1.0")),
        ge=0.1,
        le=60.0,
        description="Initial retry delay in seconds",
    )

    # Circuit breaker
    circuit_breaker_threshold: int = Field(
        default=int(os.getenv("CIRCUIT_BREAKER_THRESHOLD", "5")),
        ge=1,
        le=20,
        description="Failures before circuit breaker opens",
    )
    circuit_breaker_timeout: int = Field(
        default=int(os.getenv("CIRCUIT_BREAKER_TIMEOUT", "60")),
        ge=10,
        le=600,
        description="Circuit breaker timeout in seconds",
    )

    # Logging
    log_level: str = Field(
        default=os.getenv("LOG_LEVEL", "INFO"),
        description="Logging level",
    )
    log_format: str = Field(
        default=os.getenv("LOG_FORMAT", "json"),
        description="Log format (json or text)",
    )

    # Metrics
    enable_metrics: bool = Field(
        default=os.getenv("ENABLE_METRICS", "true").lower() == "true",
        description="Enable Prometheus metrics",
    )
    metrics_port: int = Field(
        default=int(os.getenv("METRICS_PORT", "9090")),
        ge=1024,
        le=65535,
        description="Prometheus metrics port",
    )

    # Claude CLI
    claude_command: str = Field(
        default=os.getenv("CLAUDE_COMMAND", "claude"),
        description="Claude CLI command",
    )
    system_prompt_file: Optional[Path] = Field(
        default=None,
        description="System prompt file for worker",
    )

    # File locking
    lock_timeout: int = Field(
        default=int(os.getenv("LOCK_TIMEOUT", "30")),
        ge=1,
        le=300,
        description="File lock timeout in seconds",
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"Invalid log level: {v}. Must be one of {valid_levels}")
        return v_upper

    @field_validator("log_format")
    @classmethod
    def validate_log_format(cls, v: str) -> str:
        """Validate log format."""
        valid_formats = ["json", "text"]
        v_lower = v.lower()
        if v_lower not in valid_formats:
            raise ValueError(f"Invalid log format: {v}. Must be one of {valid_formats}")
        return v_lower

    def get_worker_task_dir(self) -> Path:
        """Get worker-specific task directory."""
        return self.task_dir / self.worker_name

    def get_worker_trigger_dir(self) -> Path:
        """Get worker-specific trigger directory."""
        return self.trigger_dir / self.worker_name

    def get_worker_result_dir(self) -> Path:
        """Get worker-specific result directory."""
        return self.result_dir / self.worker_name

    def get_worker_dlq_dir(self) -> Path:
        """Get worker-specific DLQ directory."""
        return self.dlq_dir / self.worker_name

    def ensure_directories(self) -> None:
        """Create all required directories."""
        directories = [
            self.get_worker_task_dir(),
            self.get_worker_trigger_dir(),
            self.get_worker_result_dir(),
            self.get_worker_dlq_dir(),
            self.heartbeat_dir,
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def get_system_prompt_path(self) -> Optional[Path]:
        """Get system prompt file path for worker."""
        if self.system_prompt_file:
            return self.system_prompt_file

        # Try to find worker-specific prompt
        prompts_dir = Path(__file__).parent.parent / "core" / "prompts" / "agents"
        worker_prompt = prompts_dir / f"{self.worker_name.upper()}.md"

        if worker_prompt.exists():
            return worker_prompt

        return None

    class Config:
        arbitrary_types_allowed = True


class OrchestratorConfig(BaseModel):
    """Configuration for orchestrator listener."""

    # Workers
    workers: List[str] = Field(
        default_factory=lambda: os.getenv("WORKERS", "marie,anga,fabien").split(","),
        description="List of worker names",
    )

    # Directories
    result_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("RESULT_DIR", "/shared/results")),
        description="Result directory to monitor",
    )
    trigger_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("TRIGGER_DIR", "/shared/triggers")),
        description="Trigger directory for orchestrator notifications",
    )
    pipe_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("PIPE_DIR", "/shared/pipes")),
        description="Named pipes directory",
    )

    # Performance
    poll_interval: float = Field(
        default=float(os.getenv("POLL_INTERVAL", "0.5")),
        ge=0.1,
        le=5.0,
        description="Polling interval in seconds",
    )
    completion_timeout: int = Field(
        default=int(os.getenv("COMPLETION_TIMEOUT", "600")),
        ge=10,
        le=3600,
        description="Timeout for task completion in seconds",
    )

    # Logging
    log_level: str = Field(
        default=os.getenv("LOG_LEVEL", "INFO"),
        description="Logging level",
    )
    log_format: str = Field(
        default=os.getenv("LOG_FORMAT", "json"),
        description="Log format (json or text)",
    )

    # State persistence
    state_file: Path = Field(
        default_factory=lambda: Path(
            os.getenv("STATE_FILE", "/shared/orchestrator_state.json")
        ),
        description="State persistence file",
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"Invalid log level: {v}. Must be one of {valid_levels}")
        return v_upper

    @field_validator("log_format")
    @classmethod
    def validate_log_format(cls, v: str) -> str:
        """Validate log format."""
        valid_formats = ["json", "text"]
        v_lower = v.lower()
        if v_lower not in valid_formats:
            raise ValueError(f"Invalid log format: {v}. Must be one of {valid_formats}")
        return v_lower

    def ensure_directories(self) -> None:
        """Create all required directories."""
        directories = [
            self.result_dir,
            self.trigger_dir,
            self.pipe_dir,
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

        # Create worker-specific result directories
        for worker in self.workers:
            (self.result_dir / worker).mkdir(parents=True, exist_ok=True)

    class Config:
        arbitrary_types_allowed = True


@dataclass
class MetricsConfig:
    """Configuration for metrics collection."""

    enabled: bool = field(
        default_factory=lambda: os.getenv("ENABLE_METRICS", "true").lower() == "true"
    )
    port: int = field(
        default_factory=lambda: int(os.getenv("METRICS_PORT", "9090"))
    )
    namespace: str = field(default="watcher")
    subsystem: str = field(default="")

    # Metric names
    tasks_processed_total: str = field(default="tasks_processed_total")
    tasks_failed_total: str = field(default="tasks_failed_total")
    task_duration_seconds: str = field(default="task_duration_seconds")
    task_queue_size: str = field(default="task_queue_size")
    active_tasks: str = field(default="active_tasks")
    circuit_breaker_state: str = field(default="circuit_breaker_state")


def load_watcher_config(worker_name: str) -> WatcherConfig:
    """
    Load watcher configuration for a specific worker.

    Args:
        worker_name: Name of the worker

    Returns:
        WatcherConfig: Configuration instance
    """
    config = WatcherConfig(worker_name=worker_name)
    config.ensure_directories()
    return config


def load_orchestrator_config() -> OrchestratorConfig:
    """
    Load orchestrator configuration.

    Returns:
        OrchestratorConfig: Configuration instance
    """
    config = OrchestratorConfig()
    config.ensure_directories()
    return config
