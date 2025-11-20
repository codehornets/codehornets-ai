"""
Structured logging utilities for agent communication system.
Provides JSON-formatted logging with correlation IDs and context.
"""

import json
import logging
import sys
import traceback
from typing import Dict, Any, Optional, Union
from datetime import datetime, timezone
from pathlib import Path
from contextvars import ContextVar
from dataclasses import dataclass, asdict
import threading
import queue
import os

import structlog
from pythonjsonlogger import jsonlogger


# Context variables for request tracking
correlation_id_var: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)
task_id_var: ContextVar[Optional[str]] = ContextVar('task_id', default=None)
worker_name_var: ContextVar[Optional[str]] = ContextVar('worker_name', default=None)
trace_id_var: ContextVar[Optional[str]] = ContextVar('trace_id', default=None)
span_id_var: ContextVar[Optional[str]] = ContextVar('span_id', default=None)


@dataclass
class LogContext:
    """Context information for structured logging."""
    correlation_id: Optional[str] = None
    task_id: Optional[str] = None
    worker_name: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    environment: str = "production"
    service_name: str = "agent-orchestrator"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in asdict(self).items() if v is not None}


class ContextFilter(logging.Filter):
    """Add context variables to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Add context to log record."""
        record.correlation_id = correlation_id_var.get()
        record.task_id = task_id_var.get()
        record.worker_name = worker_name_var.get()
        record.trace_id = trace_id_var.get()
        record.span_id = span_id_var.get()
        record.timestamp = datetime.now(timezone.utc).isoformat()
        return True


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with standard fields."""

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]):
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)

        # Add timestamp in ISO format
        log_record['timestamp'] = datetime.now(timezone.utc).isoformat()

        # Add severity (standardized field)
        log_record['severity'] = record.levelname

        # Add source location
        log_record['source'] = {
            'file': record.pathname,
            'line': record.lineno,
            'function': record.funcName,
            'module': record.module
        }

        # Add context fields if present
        for field in ['correlation_id', 'task_id', 'worker_name', 'trace_id', 'span_id']:
            if hasattr(record, field) and getattr(record, field):
                log_record[field] = getattr(record, field)

        # Add exception details if present
        if record.exc_info:
            log_record['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'stacktrace': traceback.format_exception(*record.exc_info)
            }


class AsyncLogHandler(logging.Handler):
    """Asynchronous log handler to prevent blocking I/O."""

    def __init__(self, handler: logging.Handler, queue_size: int = 10000):
        super().__init__()
        self.handler = handler
        self.queue = queue.Queue(maxsize=queue_size)
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def _worker(self):
        """Worker thread to process log records."""
        while True:
            try:
                record = self.queue.get(timeout=1)
                if record is None:  # Shutdown signal
                    break
                self.handler.emit(record)
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error in async log handler: {e}", file=sys.stderr)

    def emit(self, record: logging.LogRecord):
        """Queue log record for async processing."""
        try:
            self.queue.put_nowait(record)
        except queue.Full:
            # Drop log if queue is full (prevent memory issues)
            print(f"Log queue full, dropping log: {record.getMessage()}", file=sys.stderr)

    def close(self):
        """Close handler and wait for queue to drain."""
        self.queue.put(None)  # Shutdown signal
        self.thread.join(timeout=5)
        super().close()


class StructuredLogger:
    """Structured logger using structlog for rich context."""

    def __init__(self,
                 service_name: str = "agent-orchestrator",
                 worker_name: Optional[str] = None,
                 log_level: str = "INFO",
                 log_file: Optional[str] = None,
                 enable_async: bool = True):

        self.service_name = service_name
        self.worker_name = worker_name
        self.log_level = getattr(logging, log_level.upper())

        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                self._add_context,
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

        # Configure standard logging
        root_logger = logging.getLogger()
        root_logger.setLevel(self.log_level)

        # Console handler with JSON formatting
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(CustomJsonFormatter())
        console_handler.addFilter(ContextFilter())

        # Wrap in async handler if enabled
        if enable_async:
            console_handler = AsyncLogHandler(console_handler)

        root_logger.addHandler(console_handler)

        # File handler if specified
        if log_file:
            Path(log_file).parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(CustomJsonFormatter())
            file_handler.addFilter(ContextFilter())

            if enable_async:
                file_handler = AsyncLogHandler(file_handler)

            root_logger.addHandler(file_handler)

        # Get logger instance
        self.logger = structlog.get_logger(service_name)

    def _add_context(self, logger, log_method, event_dict):
        """Add context to log events."""
        # Add service metadata
        event_dict['service'] = {
            'name': self.service_name,
            'environment': os.getenv('ENVIRONMENT', 'production'),
            'version': os.getenv('SERVICE_VERSION', 'unknown')
        }

        # Add worker name if set
        if self.worker_name or worker_name_var.get():
            event_dict['worker_name'] = self.worker_name or worker_name_var.get()

        # Add context variables
        if correlation_id := correlation_id_var.get():
            event_dict['correlation_id'] = correlation_id

        if task_id := task_id_var.get():
            event_dict['task_id'] = task_id

        if trace_id := trace_id_var.get():
            event_dict['trace_id'] = trace_id

        if span_id := span_id_var.get():
            event_dict['span_id'] = span_id

        return event_dict

    def bind(self, **kwargs) -> 'StructuredLogger':
        """Create a new logger with bound context."""
        new_logger = StructuredLogger(
            service_name=self.service_name,
            worker_name=self.worker_name
        )
        new_logger.logger = self.logger.bind(**kwargs)
        return new_logger

    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(message, **kwargs)

    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(message, **kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(message, **kwargs)

    def error(self, message: str, exception: Optional[Exception] = None, **kwargs):
        """Log error message."""
        if exception:
            kwargs['exc_info'] = True
        self.logger.error(message, **kwargs)

    def critical(self, message: str, exception: Optional[Exception] = None, **kwargs):
        """Log critical message."""
        if exception:
            kwargs['exc_info'] = True
        self.logger.critical(message, **kwargs)


class LogAggregator:
    """Aggregates logs from multiple sources for centralized collection."""

    def __init__(self,
                 aggregation_endpoint: Optional[str] = None,
                 buffer_size: int = 1000,
                 flush_interval: int = 5):

        self.endpoint = aggregation_endpoint
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        self.buffer: List[Dict[str, Any]] = []
        self.lock = threading.Lock()

        # Start flush thread if endpoint configured
        if self.endpoint:
            self.flush_thread = threading.Thread(target=self._flush_worker, daemon=True)
            self.flush_thread.start()

    def add_log(self, log_entry: Dict[str, Any]):
        """Add log entry to buffer."""
        with self.lock:
            self.buffer.append(log_entry)
            if len(self.buffer) >= self.buffer_size:
                self._flush()

    def _flush(self):
        """Flush logs to aggregation endpoint."""
        if not self.buffer:
            return

        logs_to_send = self.buffer.copy()
        self.buffer.clear()

        # Send to endpoint (implement based on your log aggregator)
        # This could be Elasticsearch, Loki, CloudWatch, etc.
        try:
            self._send_logs(logs_to_send)
        except Exception as e:
            print(f"Failed to send logs: {e}", file=sys.stderr)

    def _send_logs(self, logs: List[Dict[str, Any]]):
        """Send logs to aggregation endpoint."""
        # Implement based on your log aggregator
        # Example: POST to Loki, bulk insert to Elasticsearch, etc.
        pass

    def _flush_worker(self):
        """Worker thread to periodically flush logs."""
        import time
        while True:
            time.sleep(self.flush_interval)
            with self.lock:
                self._flush()


# Logging utilities
def set_log_context(**kwargs):
    """Set logging context variables."""
    if 'correlation_id' in kwargs:
        correlation_id_var.set(kwargs['correlation_id'])
    if 'task_id' in kwargs:
        task_id_var.set(kwargs['task_id'])
    if 'worker_name' in kwargs:
        worker_name_var.set(kwargs['worker_name'])
    if 'trace_id' in kwargs:
        trace_id_var.set(kwargs['trace_id'])
    if 'span_id' in kwargs:
        span_id_var.set(kwargs['span_id'])


def clear_log_context():
    """Clear all logging context variables."""
    correlation_id_var.set(None)
    task_id_var.set(None)
    worker_name_var.set(None)
    trace_id_var.set(None)
    span_id_var.set(None)


def get_logger(name: str, **kwargs) -> StructuredLogger:
    """Get a configured logger instance."""
    return StructuredLogger(service_name=name, **kwargs)


# Performance logging decorator
def log_performance(operation_name: str):
    """Decorator to log function performance."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            start_time = datetime.now(timezone.utc)

            logger.info(f"Starting {operation_name}",
                       operation=operation_name,
                       function=func.__name__)

            try:
                result = func(*args, **kwargs)
                duration = (datetime.now(timezone.utc) - start_time).total_seconds()

                logger.info(f"Completed {operation_name}",
                           operation=operation_name,
                           function=func.__name__,
                           duration_seconds=duration,
                           success=True)

                return result

            except Exception as e:
                duration = (datetime.now(timezone.utc) - start_time).total_seconds()

                logger.error(f"Failed {operation_name}",
                           operation=operation_name,
                           function=func.__name__,
                           duration_seconds=duration,
                           success=False,
                           exception=e)
                raise

        return wrapper
    return decorator


# Example usage
if __name__ == "__main__":
    # Initialize logger
    logger = get_logger(
        "agent-worker",
        worker_name="marie",
        log_level="DEBUG",
        log_file="/var/log/agents/marie.log"
    )

    # Set context for request
    set_log_context(
        correlation_id="corr-123",
        task_id="task-456",
        trace_id="trace-789"
    )

    # Log with context
    logger.info("Processing task",
               task_type="document_analysis",
               document_id="doc-001")

    # Log with performance decorator
    @log_performance("database_query")
    def query_database():
        import time
        time.sleep(0.1)
        return "result"

    result = query_database()

    # Log error with exception
    try:
        raise ValueError("Something went wrong")
    except Exception as e:
        logger.error("Task processing failed",
                    exception=e,
                    task_type="document_analysis")

    # Clear context
    clear_log_context()