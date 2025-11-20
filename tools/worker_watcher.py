#!/usr/bin/env python3
"""
Worker Watcher - Production-ready file watcher for agent tasks.

Monitors task directory for new JSON files, executes tasks via Claude CLI,
and manages results with comprehensive error handling and observability.

Features:
- inotify-based file watching (zero-CPU idle)
- Concurrent task execution with semaphore control
- Exponential backoff retry logic
- Circuit breaker for repeated failures
- Dead letter queue for failed tasks
- Structured logging (JSON/text)
- Prometheus metrics
- Graceful shutdown
- Health check heartbeat
- File locking to prevent duplicate processing

Usage:
    python worker_watcher.py marie
    python worker_watcher.py anga --max-concurrent 5
    python worker_watcher.py fabien --log-level DEBUG
"""

import argparse
import asyncio
import fcntl
import json
import os
import shutil
import signal
import subprocess
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Optional

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

try:
    from prometheus_client import Counter, Gauge, Histogram, start_http_server

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    print("⚠️  prometheus_client not available, metrics disabled")

from watcher_config import MetricsConfig, WatcherConfig, load_watcher_config


class TaskStatus(str, Enum):
    """Task execution status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRY = "retry"
    DLQ = "dead_letter_queue"


class CircuitBreakerState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Blocking requests
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreaker:
    """
    Circuit breaker to prevent cascading failures.

    Opens after threshold failures, blocking new requests.
    Automatically resets after timeout period.
    """

    def __init__(self, threshold: int, timeout: int):
        """
        Initialize circuit breaker.

        Args:
            threshold: Number of failures before opening
            timeout: Timeout in seconds before attempting recovery
        """
        self.threshold = threshold
        self.timeout = timeout
        self.failures = 0
        self.state = CircuitBreakerState.CLOSED
        self.last_failure_time: Optional[float] = None

    def record_success(self) -> None:
        """Record successful operation."""
        self.failures = 0
        self.state = CircuitBreakerState.CLOSED

    def record_failure(self) -> None:
        """Record failed operation."""
        self.failures += 1
        self.last_failure_time = time.time()

        if self.failures >= self.threshold:
            self.state = CircuitBreakerState.OPEN

    def is_open(self) -> bool:
        """Check if circuit breaker is open."""
        if self.state == CircuitBreakerState.OPEN:
            # Check if timeout has elapsed
            if (
                self.last_failure_time
                and time.time() - self.last_failure_time > self.timeout
            ):
                self.state = CircuitBreakerState.HALF_OPEN
                return False
            return True
        return False

    def get_state(self) -> str:
        """Get current state as string."""
        return self.state.value


class StructuredLogger:
    """
    Structured logger with JSON and text output support.

    Provides consistent logging interface with structured data.
    """

    def __init__(self, name: str, config: WatcherConfig):
        """
        Initialize logger.

        Args:
            name: Logger name
            config: Watcher configuration
        """
        self.name = name
        self.config = config
        self.worker_name = config.worker_name

    def _format_message(self, level: str, message: str, **kwargs: Any) -> str:
        """Format log message based on configuration."""
        timestamp = datetime.utcnow().isoformat()

        if self.config.log_format == "json":
            log_entry = {
                "timestamp": timestamp,
                "level": level,
                "logger": self.name,
                "worker": self.worker_name,
                "message": message,
                **kwargs,
            }
            return json.dumps(log_entry)
        else:
            # Text format
            extra = " ".join(f"{k}={v}" for k, v in kwargs.items())
            return f"[{timestamp}] {level:8s} {self.name} [{self.worker_name}] {message} {extra}"

    def debug(self, message: str, **kwargs: Any) -> None:
        """Log debug message."""
        if self.config.log_level == "DEBUG":
            print(self._format_message("DEBUG", message, **kwargs), file=sys.stderr)

    def info(self, message: str, **kwargs: Any) -> None:
        """Log info message."""
        if self.config.log_level in ["DEBUG", "INFO"]:
            print(self._format_message("INFO", message, **kwargs))

    def warning(self, message: str, **kwargs: Any) -> None:
        """Log warning message."""
        if self.config.log_level in ["DEBUG", "INFO", "WARNING"]:
            print(self._format_message("WARNING", message, **kwargs), file=sys.stderr)

    def error(self, message: str, **kwargs: Any) -> None:
        """Log error message."""
        if self.config.log_level in ["DEBUG", "INFO", "WARNING", "ERROR"]:
            print(self._format_message("ERROR", message, **kwargs), file=sys.stderr)

    def critical(self, message: str, **kwargs: Any) -> None:
        """Log critical message."""
        print(self._format_message("CRITICAL", message, **kwargs), file=sys.stderr)


class MetricsCollector:
    """
    Prometheus metrics collector.

    Provides application metrics for monitoring and alerting.
    """

    def __init__(self, config: WatcherConfig, metrics_config: MetricsConfig):
        """
        Initialize metrics collector.

        Args:
            config: Watcher configuration
            metrics_config: Metrics configuration
        """
        self.config = config
        self.metrics_config = metrics_config
        self.enabled = metrics_config.enabled and PROMETHEUS_AVAILABLE

        if not self.enabled:
            return

        # Define metrics
        self.tasks_processed = Counter(
            metrics_config.tasks_processed_total,
            "Total tasks processed",
            ["worker", "status"],
            namespace=metrics_config.namespace,
        )

        self.tasks_failed = Counter(
            metrics_config.tasks_failed_total,
            "Total tasks failed",
            ["worker", "reason"],
            namespace=metrics_config.namespace,
        )

        self.task_duration = Histogram(
            metrics_config.task_duration_seconds,
            "Task execution duration",
            ["worker"],
            namespace=metrics_config.namespace,
            buckets=(1, 5, 10, 30, 60, 120, 300, 600),
        )

        self.queue_size = Gauge(
            metrics_config.task_queue_size,
            "Current queue size",
            ["worker"],
            namespace=metrics_config.namespace,
        )

        self.active_tasks = Gauge(
            metrics_config.active_tasks,
            "Currently executing tasks",
            ["worker"],
            namespace=metrics_config.namespace,
        )

        self.circuit_breaker_state = Gauge(
            metrics_config.circuit_breaker_state,
            "Circuit breaker state (0=closed, 1=open, 2=half_open)",
            ["worker"],
            namespace=metrics_config.namespace,
        )

    def record_task_processed(self, status: str) -> None:
        """Record task processing."""
        if self.enabled:
            self.tasks_processed.labels(
                worker=self.config.worker_name, status=status
            ).inc()

    def record_task_failed(self, reason: str) -> None:
        """Record task failure."""
        if self.enabled:
            self.tasks_failed.labels(
                worker=self.config.worker_name, reason=reason
            ).inc()

    def record_task_duration(self, duration: float) -> None:
        """Record task duration."""
        if self.enabled:
            self.task_duration.labels(worker=self.config.worker_name).observe(duration)

    def set_queue_size(self, size: int) -> None:
        """Set queue size."""
        if self.enabled:
            self.queue_size.labels(worker=self.config.worker_name).set(size)

    def set_active_tasks(self, count: int) -> None:
        """Set active task count."""
        if self.enabled:
            self.active_tasks.labels(worker=self.config.worker_name).set(count)

    def set_circuit_breaker_state(self, state: CircuitBreakerState) -> None:
        """Set circuit breaker state."""
        if self.enabled:
            state_value = {
                CircuitBreakerState.CLOSED: 0,
                CircuitBreakerState.OPEN: 1,
                CircuitBreakerState.HALF_OPEN: 2,
            }[state]
            self.circuit_breaker_state.labels(worker=self.config.worker_name).set(
                state_value
            )


@asynccontextmanager
async def file_lock(file_path: Path, timeout: int = 30):
    """
    Async context manager for file locking.

    Prevents duplicate processing of the same task file.

    Args:
        file_path: Path to lock
        timeout: Lock timeout in seconds

    Raises:
        TimeoutError: If lock cannot be acquired
    """
    lock_file = file_path.with_suffix(file_path.suffix + ".lock")
    fd = None

    try:
        # Create lock file
        fd = os.open(str(lock_file), os.O_CREAT | os.O_RDWR)

        # Try to acquire lock with timeout
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                yield
                return
            except BlockingIOError:
                await asyncio.sleep(0.1)

        raise TimeoutError(f"Could not acquire lock for {file_path}")

    finally:
        if fd is not None:
            try:
                fcntl.flock(fd, fcntl.LOCK_UN)
                os.close(fd)
                lock_file.unlink(missing_ok=True)
            except Exception:
                pass


class WorkerWatcher:
    """
    Production-ready worker watcher.

    Monitors task directory for new JSON files and executes them via Claude CLI
    with comprehensive error handling, retry logic, and observability.
    """

    def __init__(self, config: WatcherConfig):
        """
        Initialize worker watcher.

        Args:
            config: Watcher configuration
        """
        self.config = config
        self.logger = StructuredLogger("worker_watcher", config)
        self.metrics = MetricsCollector(config, MetricsConfig())

        # Task management
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.task_semaphore = asyncio.Semaphore(config.max_concurrent_tasks)
        self.retry_counts: Dict[str, int] = {}

        # Circuit breaker
        self.circuit_breaker = CircuitBreaker(
            threshold=config.circuit_breaker_threshold,
            timeout=config.circuit_breaker_timeout,
        )

        # State
        self.shutdown = False
        self.start_time = time.time()
        self.observer: Optional[Observer] = None

        # Statistics
        self.stats = {
            "tasks_processed": 0,
            "tasks_failed": 0,
            "tasks_retried": 0,
            "tasks_dlq": 0,
        }

        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)

        self.logger.info(
            "Worker watcher initialized",
            max_concurrent=config.max_concurrent_tasks,
            timeout=config.task_timeout,
        )

    def _handle_shutdown(self, signum: int, frame: Any) -> None:
        """Handle shutdown signal."""
        self.logger.info("Shutdown signal received", signal=signum)
        self.shutdown = True

    async def _write_heartbeat(self) -> None:
        """Write heartbeat file periodically."""
        heartbeat_file = self.config.heartbeat_dir / f"{self.config.worker_name}.json"

        while not self.shutdown:
            try:
                heartbeat = {
                    "worker": self.config.worker_name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "uptime_seconds": time.time() - self.start_time,
                    "queue_size": self.task_queue.qsize(),
                    "active_tasks": len(self.active_tasks),
                    "circuit_breaker_state": self.circuit_breaker.get_state(),
                    "stats": self.stats,
                    "status": "healthy",
                }

                # Atomic write
                temp_file = heartbeat_file.with_suffix(".tmp")
                temp_file.write_text(json.dumps(heartbeat, indent=2))
                shutil.move(str(temp_file), str(heartbeat_file))

                self.logger.debug("Heartbeat written")

            except Exception as e:
                self.logger.error("Heartbeat write failed", error=str(e))

            await asyncio.sleep(self.config.heartbeat_interval)

    async def _read_task_file(self, task_path: Path) -> Optional[Dict[str, Any]]:
        """
        Read and parse task file.

        Args:
            task_path: Path to task file

        Returns:
            Task data or None if invalid
        """
        try:
            task_data = json.loads(task_path.read_text())

            # Validate required fields
            required_fields = ["task_id", "description"]
            for field in required_fields:
                if field not in task_data:
                    self.logger.error(
                        "Invalid task file: missing field",
                        task_path=str(task_path),
                        field=field,
                    )
                    return None

            return task_data

        except json.JSONDecodeError as e:
            self.logger.error(
                "Invalid JSON in task file", task_path=str(task_path), error=str(e)
            )
            return None
        except Exception as e:
            self.logger.error(
                "Error reading task file", task_path=str(task_path), error=str(e)
            )
            return None

    async def _create_trigger_file(self, task_id: str) -> None:
        """
        Create trigger file to signal task receipt.

        Args:
            task_id: Task identifier
        """
        try:
            trigger_dir = self.config.get_worker_trigger_dir()
            trigger_file = trigger_dir / f"{task_id}.trigger"

            trigger_data = {
                "task_id": task_id,
                "worker": self.config.worker_name,
                "status": "received",
                "timestamp": datetime.utcnow().isoformat(),
            }

            trigger_file.write_text(json.dumps(trigger_data, indent=2))
            self.logger.debug("Trigger file created", task_id=task_id)

        except Exception as e:
            self.logger.error("Failed to create trigger file", task_id=task_id, error=str(e))

    async def _execute_claude_cli(
        self, task_data: Dict[str, Any]
    ) -> tuple[int, str, str]:
        """
        Execute Claude CLI for task.

        Args:
            task_data: Task data

        Returns:
            Tuple of (exit_code, stdout, stderr)
        """
        task_id = task_data["task_id"]
        description = task_data["description"]
        timeout = task_data.get("timeout", self.config.task_timeout)

        # Build command
        cmd = [self.config.claude_command]

        # Add system prompt if available
        system_prompt = self.config.get_system_prompt_path()
        if system_prompt:
            cmd.extend(["--system-prompt-file", str(system_prompt)])

        # Add task description
        cmd.extend(["-p", description])

        self.logger.info("Executing Claude CLI", task_id=task_id, timeout=timeout)

        try:
            # Execute with timeout
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.config.task_dir.parent),
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )

            return (
                process.returncode or 0,
                stdout.decode("utf-8", errors="replace"),
                stderr.decode("utf-8", errors="replace"),
            )

        except asyncio.TimeoutError:
            self.logger.warning("Task timeout", task_id=task_id, timeout=timeout)
            process.kill()
            await process.wait()
            return (124, "", f"Task timed out after {timeout}s")

        except Exception as e:
            self.logger.error("Claude CLI execution failed", task_id=task_id, error=str(e))
            return (1, "", str(e))

    async def _write_result(
        self, task_data: Dict[str, Any], exit_code: int, stdout: str, stderr: str, duration: float
    ) -> None:
        """
        Write task result file.

        Args:
            task_data: Task data
            exit_code: CLI exit code
            stdout: Standard output
            stderr: Standard error
            duration: Execution duration
        """
        task_id = task_data["task_id"]
        result_dir = self.config.get_worker_result_dir()
        result_file = result_dir / f"{task_id}.json"

        result = {
            "task_id": task_id,
            "worker": self.config.worker_name,
            "status": "completed" if exit_code == 0 else "failed",
            "exit_code": exit_code,
            "stdout": stdout,
            "stderr": stderr,
            "duration_seconds": duration,
            "timestamp": datetime.utcnow().isoformat(),
            "retry_count": self.retry_counts.get(task_id, 0),
        }

        # Atomic write
        temp_file = result_file.with_suffix(".tmp")
        temp_file.write_text(json.dumps(result, indent=2))
        shutil.move(str(temp_file), str(result_file))

        self.logger.info(
            "Result written",
            task_id=task_id,
            status=result["status"],
            duration=f"{duration:.2f}s",
        )

    async def _move_to_dlq(self, task_path: Path, reason: str) -> None:
        """
        Move task to dead letter queue.

        Args:
            task_path: Path to task file
            reason: Failure reason
        """
        try:
            dlq_dir = self.config.get_worker_dlq_dir()
            dlq_file = dlq_dir / f"{task_path.stem}_{int(time.time())}.json"

            # Read task data and add metadata
            task_data = json.loads(task_path.read_text())
            task_data["dlq_reason"] = reason
            task_data["dlq_timestamp"] = datetime.utcnow().isoformat()
            task_data["retry_count"] = self.retry_counts.get(task_data.get("task_id", ""), 0)

            dlq_file.write_text(json.dumps(task_data, indent=2))

            # Remove original
            task_path.unlink(missing_ok=True)

            self.stats["tasks_dlq"] += 1
            self.logger.warning("Task moved to DLQ", task_path=str(task_path), reason=reason)

        except Exception as e:
            self.logger.error("Failed to move to DLQ", task_path=str(task_path), error=str(e))

    async def _process_task(self, task_path: Path) -> None:
        """
        Process a single task with retry logic.

        Args:
            task_path: Path to task file
        """
        task_id = None

        try:
            # Acquire file lock
            async with file_lock(task_path, timeout=self.config.lock_timeout):
                # Check if file still exists
                if not task_path.exists():
                    self.logger.debug("Task file disappeared", task_path=str(task_path))
                    return

                # Read task
                task_data = await self._read_task_file(task_path)
                if not task_data:
                    await self._move_to_dlq(task_path, "invalid_format")
                    return

                task_id = task_data["task_id"]

                # Check circuit breaker
                if self.circuit_breaker.is_open():
                    self.logger.warning("Circuit breaker open, deferring task", task_id=task_id)
                    self.metrics.set_circuit_breaker_state(CircuitBreakerState.OPEN)
                    await asyncio.sleep(5)  # Wait before retry
                    return

                # Create trigger file
                await self._create_trigger_file(task_id)

                # Execute task
                start_time = time.time()

                async with self.task_semaphore:
                    self.metrics.set_active_tasks(self.config.max_concurrent_tasks - self.task_semaphore._value)

                    exit_code, stdout, stderr = await self._execute_claude_cli(task_data)

                    duration = time.time() - start_time

                # Write result
                await self._write_result(task_data, exit_code, stdout, stderr, duration)

                # Record metrics
                self.metrics.record_task_duration(duration)

                if exit_code == 0:
                    # Success
                    self.stats["tasks_processed"] += 1
                    self.metrics.record_task_processed("completed")
                    self.circuit_breaker.record_success()

                    # Clean up
                    task_path.unlink(missing_ok=True)
                    if task_id in self.retry_counts:
                        del self.retry_counts[task_id]

                    self.logger.info("Task completed", task_id=task_id, duration=f"{duration:.2f}s")

                else:
                    # Failure - check retry
                    retry_count = self.retry_counts.get(task_id, 0)

                    if retry_count < self.config.max_retries:
                        # Retry with exponential backoff
                        self.retry_counts[task_id] = retry_count + 1
                        delay = self.config.initial_retry_delay * (self.config.retry_backoff ** retry_count)

                        self.stats["tasks_retried"] += 1
                        self.metrics.record_task_failed("retry")
                        self.circuit_breaker.record_failure()

                        self.logger.warning(
                            "Task failed, scheduling retry",
                            task_id=task_id,
                            retry_count=retry_count + 1,
                            delay=f"{delay:.2f}s",
                        )

                        await asyncio.sleep(delay)
                        # Re-queue task
                        await self.task_queue.put(task_path)

                    else:
                        # Max retries exceeded - move to DLQ
                        self.stats["tasks_failed"] += 1
                        self.metrics.record_task_failed("max_retries")
                        self.circuit_breaker.record_failure()

                        await self._move_to_dlq(task_path, "max_retries_exceeded")

        except TimeoutError:
            self.logger.error("Lock timeout", task_path=str(task_path))
            if task_id:
                self.metrics.record_task_failed("lock_timeout")

        except Exception as e:
            self.logger.error("Task processing error", task_path=str(task_path), error=str(e))
            if task_id:
                self.metrics.record_task_failed("exception")
            await self._move_to_dlq(task_path, f"exception: {str(e)}")

        finally:
            # Update metrics
            self.metrics.set_active_tasks(self.config.max_concurrent_tasks - self.task_semaphore._value)
            if task_id and task_id in self.active_tasks:
                del self.active_tasks[task_id]

    async def _task_worker(self) -> None:
        """Worker coroutine that processes queued tasks."""
        self.logger.info("Task worker started")

        while not self.shutdown:
            try:
                # Get task from queue with timeout
                task_path = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)

                # Create task
                task_id = task_path.stem
                task = asyncio.create_task(self._process_task(task_path))
                self.active_tasks[task_id] = task

                # Wait for completion
                await task

                self.task_queue.task_done()

            except asyncio.TimeoutError:
                # Queue empty, continue
                continue

            except Exception as e:
                self.logger.error("Task worker error", error=str(e))
                continue

    async def _queue_task(self, task_path: Path) -> None:
        """
        Queue a task for processing.

        Args:
            task_path: Path to task file
        """
        try:
            # Ignore temp files
            if task_path.name.startswith(".") or task_path.name.endswith(".tmp"):
                return

            if not task_path.exists():
                return

            await self.task_queue.put(task_path)
            self.metrics.set_queue_size(self.task_queue.qsize())

            self.logger.debug("Task queued", task_path=str(task_path), queue_size=self.task_queue.qsize())

        except Exception as e:
            self.logger.error("Failed to queue task", task_path=str(task_path), error=str(e))

    def _start_file_watcher(self) -> None:
        """Start watchdog file watcher."""

        class TaskFileHandler(FileSystemEventHandler):
            def __init__(self, watcher: "WorkerWatcher"):
                self.watcher = watcher

            def on_created(self, event):
                if not event.is_directory and event.src_path.endswith(".json"):
                    asyncio.create_task(self.watcher._queue_task(Path(event.src_path)))

        handler = TaskFileHandler(self)
        self.observer = Observer()
        self.observer.schedule(handler, str(self.config.get_worker_task_dir()), recursive=False)
        self.observer.start()

        self.logger.info("File watcher started", directory=str(self.config.get_worker_task_dir()))

    async def run(self) -> None:
        """Run the worker watcher."""
        self.logger.info("Starting worker watcher", worker=self.config.worker_name)

        # Start metrics server
        if self.metrics.enabled:
            try:
                start_http_server(self.config.metrics_port)
                self.logger.info("Metrics server started", port=self.config.metrics_port)
            except Exception as e:
                self.logger.warning("Failed to start metrics server", error=str(e))

        # Start file watcher
        self._start_file_watcher()

        # Start background tasks
        heartbeat_task = asyncio.create_task(self._write_heartbeat())

        # Start worker tasks
        worker_tasks = [asyncio.create_task(self._task_worker()) for _ in range(self.config.max_concurrent_tasks)]

        self.logger.info("Worker watcher ready", idle_mode="zero_cpu")

        try:
            # Wait for shutdown
            while not self.shutdown:
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            self.logger.info("Keyboard interrupt received")

        finally:
            # Cleanup
            self.logger.info("Shutting down...")

            # Stop file watcher
            if self.observer:
                self.observer.stop()
                self.observer.join()

            # Cancel background tasks
            heartbeat_task.cancel()
            for task in worker_tasks:
                task.cancel()

            # Wait for active tasks to complete
            if self.active_tasks:
                self.logger.info("Waiting for active tasks to complete", count=len(self.active_tasks))
                await asyncio.gather(*self.active_tasks.values(), return_exceptions=True)

            # Print final stats
            uptime = time.time() - self.start_time
            self.logger.info(
                "Shutdown complete",
                uptime_seconds=f"{uptime:.1f}",
                tasks_processed=self.stats["tasks_processed"],
                tasks_failed=self.stats["tasks_failed"],
                tasks_retried=self.stats["tasks_retried"],
                tasks_dlq=self.stats["tasks_dlq"],
            )


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Worker Watcher - Production-ready file watcher for agent tasks"
    )
    parser.add_argument("worker_name", help="Worker name (marie, anga, fabien)")
    parser.add_argument(
        "--max-concurrent",
        type=int,
        help="Maximum concurrent tasks (overrides MAXCONCURRENT_TASKS)",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Log level (overrides LOG_LEVEL)",
    )
    parser.add_argument(
        "--metrics-port",
        type=int,
        help="Prometheus metrics port (overrides METRICS_PORT)",
    )

    args = parser.parse_args()

    # Override config from CLI args
    if args.max_concurrent:
        os.environ["MAX_CONCURRENT_TASKS"] = str(args.max_concurrent)
    if args.log_level:
        os.environ["LOG_LEVEL"] = args.log_level
    if args.metrics_port:
        os.environ["METRICS_PORT"] = str(args.metrics_port)

    # Load configuration
    config = load_watcher_config(args.worker_name)

    print("=" * 70)
    print(f"  Worker Watcher v1.0")
    print(f"  Worker: {config.worker_name}")
    print(f"  Task Directory: {config.get_worker_task_dir()}")
    print(f"  Max Concurrent: {config.max_concurrent_tasks}")
    print(f"  Log Level: {config.log_level}")
    print("=" * 70)

    # Create and run watcher
    watcher = WorkerWatcher(config)
    await watcher.run()


if __name__ == "__main__":
    asyncio.run(main())
