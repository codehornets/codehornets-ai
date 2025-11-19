"""
Centralized logging infrastructure.

Provides structured logging with support for JSON formatting,
log levels, and integration with monitoring systems.
"""

import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path

from pythonjsonlogger import jsonlogger

from config.settings import get_settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON log formatter with additional context."""

    def add_fields(
        self,
        log_record: Dict[str, Any],
        record: logging.LogRecord,
        message_dict: Dict[str, Any],
    ) -> None:
        """
        Add custom fields to log record.

        Args:
            log_record: Log record dictionary
            record: LogRecord instance
            message_dict: Message dictionary
        """
        super().add_fields(log_record, record, message_dict)

        # Add timestamp
        log_record["timestamp"] = datetime.utcnow().isoformat()

        # Add log level
        log_record["level"] = record.levelname

        # Add logger name
        log_record["logger"] = record.name

        # Add thread info
        log_record["thread"] = record.thread
        log_record["thread_name"] = record.threadName

        # Add process info
        log_record["process"] = record.process

        # Add file info
        log_record["file"] = record.filename
        log_record["line"] = record.lineno
        log_record["function"] = record.funcName


def setup_logger(
    name: str,
    log_level: Optional[str] = None,
    log_file: Optional[str] = None,
    use_json: bool = True,
) -> logging.Logger:
    """
    Set up a logger with configured handlers.

    Args:
        name: Logger name
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        use_json: Use JSON formatting

    Returns:
        logging.Logger: Configured logger
    """
    settings = get_settings()

    # Get log level
    level_str = log_level or settings.log_level
    level = getattr(logging, level_str.upper(), logging.INFO)

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Remove existing handlers
    logger.handlers.clear()

    # Determine format
    if use_json and settings.log_format == "json":
        # JSON format
        formatter = CustomJsonFormatter(
            "%(timestamp)s %(level)s %(name)s %(message)s"
        )
    else:
        # Standard format
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler
    log_file_path = log_file or settings.log_file_path
    if log_file_path:
        try:
            # Ensure directory exists
            log_dir = Path(log_file_path).parent
            log_dir.mkdir(parents=True, exist_ok=True)

            file_handler = logging.FileHandler(log_file_path)
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Failed to set up file logging: {e}")

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get or create a logger.

    Args:
        name: Logger name

    Returns:
        logging.Logger: Logger instance
    """
    logger = logging.getLogger(name)

    # Set up logger if not already configured
    if not logger.handlers:
        setup_logger(name)

    return logger


def log_agent_action(
    logger: logging.Logger,
    agent_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None,
    level: str = "INFO",
) -> None:
    """
    Log an agent action with structured data.

    Args:
        logger: Logger instance
        agent_id: Agent identifier
        action: Action description
        details: Additional details
        level: Log level
    """
    log_data = {
        "agent_id": agent_id,
        "action": action,
        "details": details or {},
    }

    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.log(log_level, f"Agent action: {action}", extra=log_data)


def log_task_event(
    logger: logging.Logger,
    task_id: str,
    event: str,
    details: Optional[Dict[str, Any]] = None,
    level: str = "INFO",
) -> None:
    """
    Log a task event with structured data.

    Args:
        logger: Logger instance
        task_id: Task identifier
        event: Event description
        details: Additional details
        level: Log level
    """
    log_data = {
        "task_id": task_id,
        "event": event,
        "details": details or {},
    }

    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.log(log_level, f"Task event: {event}", extra=log_data)


def log_workflow_event(
    logger: logging.Logger,
    workflow_id: str,
    event: str,
    details: Optional[Dict[str, Any]] = None,
    level: str = "INFO",
) -> None:
    """
    Log a workflow event with structured data.

    Args:
        logger: Logger instance
        workflow_id: Workflow identifier
        event: Event description
        details: Additional details
        level: Log level
    """
    log_data = {
        "workflow_id": workflow_id,
        "event": event,
        "details": details or {},
    }

    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.log(log_level, f"Workflow event: {event}", extra=log_data)


# Initialize root logger for the application
def init_logging() -> None:
    """Initialize application-wide logging."""
    settings = get_settings()

    # Set up root logger
    root_logger = setup_logger(
        "digital_agency",
        log_level=settings.log_level,
        log_file=settings.log_file_path,
        use_json=(settings.log_format == "json"),
    )

    root_logger.info("Logging initialized")

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
