#!/usr/bin/env python3
"""
Orchestrator Listener - Monitors worker completions and coordinates results.

Listens for completion signals from all workers, aggregates results,
and notifies the orchestrator for synthesis.

Features:
- Multi-worker result monitoring (inotify-based)
- Named pipe communication (optional)
- State persistence across restarts
- Worker health monitoring
- Completion aggregation
- Timeout handling for incomplete tasks
- Structured logging
- Graceful shutdown

Usage:
    python orchestrator_listener.py
    python orchestrator_listener.py --poll-interval 0.5
    python orchestrator_listener.py --log-level DEBUG
"""

import argparse
import asyncio
import json
import os
import signal
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from watcher_config import OrchestratorConfig, load_orchestrator_config


class TaskState:
    """Tracks task execution state across workers."""

    def __init__(self, task_id: str, worker: str, created_at: float):
        self.task_id = task_id
        self.worker = worker
        self.created_at = created_at
        self.completed_at: Optional[float] = None
        self.status: str = "pending"
        self.result_file: Optional[Path] = None
        self.attempts: int = 0


class WorkerState:
    """Tracks worker health and activity."""

    def __init__(self, name: str):
        self.name = name
        self.last_heartbeat: Optional[float] = None
        self.active_tasks: Set[str] = set()
        self.completed_tasks: int = 0
        self.failed_tasks: int = 0
        self.is_healthy: bool = True


class StructuredLogger:
    """Structured logger for orchestrator."""

    def __init__(self, name: str, config: OrchestratorConfig):
        self.name = name
        self.config = config

    def _format_message(self, level: str, message: str, **kwargs: Any) -> str:
        """Format log message."""
        timestamp = datetime.utcnow().isoformat()

        if self.config.log_format == "json":
            log_entry = {
                "timestamp": timestamp,
                "level": level,
                "logger": self.name,
                "component": "orchestrator_listener",
                "message": message,
                **kwargs,
            }
            return json.dumps(log_entry)
        else:
            extra = " ".join(f"{k}={v}" for k, v in kwargs.items())
            return f"[{timestamp}] {level:8s} {self.name} {message} {extra}"

    def debug(self, message: str, **kwargs: Any) -> None:
        if self.config.log_level == "DEBUG":
            print(self._format_message("DEBUG", message, **kwargs), file=sys.stderr)

    def info(self, message: str, **kwargs: Any) -> None:
        if self.config.log_level in ["DEBUG", "INFO"]:
            print(self._format_message("INFO", message, **kwargs))

    def warning(self, message: str, **kwargs: Any) -> None:
        if self.config.log_level in ["DEBUG", "INFO", "WARNING"]:
            print(self._format_message("WARNING", message, **kwargs), file=sys.stderr)

    def error(self, message: str, **kwargs: Any) -> None:
        if self.config.log_level in ["DEBUG", "INFO", "WARNING", "ERROR"]:
            print(self._format_message("ERROR", message, **kwargs), file=sys.stderr)

    def critical(self, message: str, **kwargs: Any) -> None:
        print(self._format_message("CRITICAL", message, **kwargs), file=sys.stderr)


class OrchestratorListener:
    """
    Orchestrator listener for multi-worker coordination.

    Monitors result files from all workers, tracks completion state,
    and notifies orchestrator when tasks complete.
    """

    def __init__(self, config: OrchestratorConfig):
        """
        Initialize orchestrator listener.

        Args:
            config: Orchestrator configuration
        """
        self.config = config
        self.logger = StructuredLogger("orchestrator_listener", config)

        # State tracking
        self.tasks: Dict[str, TaskState] = {}
        self.workers: Dict[str, WorkerState] = {
            name: WorkerState(name) for name in config.workers
        }

        # Observers
        self.observers: List[Observer] = []

        # Control
        self.shutdown = False
        self.start_time = time.time()

        # Statistics
        self.stats = {
            "total_tasks": 0,
            "completed_tasks": 0,
            "failed_tasks": 0,
            "timeout_tasks": 0,
        }

        # Load persisted state
        self._load_state()

        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)

        self.logger.info("Orchestrator listener initialized", workers=config.workers)

    def _handle_shutdown(self, signum: int, frame: Any) -> None:
        """Handle shutdown signal."""
        self.logger.info("Shutdown signal received", signal=signum)
        self.shutdown = True

    def _load_state(self) -> None:
        """Load persisted state from disk."""
        try:
            if self.config.state_file.exists():
                state_data = json.loads(self.config.state_file.read_text())

                # Restore tasks
                for task_data in state_data.get("tasks", []):
                    task = TaskState(
                        task_id=task_data["task_id"],
                        worker=task_data["worker"],
                        created_at=task_data["created_at"],
                    )
                    task.status = task_data.get("status", "pending")
                    if task_data.get("completed_at"):
                        task.completed_at = task_data["completed_at"]
                    if task_data.get("result_file"):
                        task.result_file = Path(task_data["result_file"])
                    task.attempts = task_data.get("attempts", 0)

                    self.tasks[task.task_id] = task

                # Restore statistics
                self.stats = state_data.get("stats", self.stats)

                self.logger.info("State restored", task_count=len(self.tasks))

        except Exception as e:
            self.logger.error("Failed to load state", error=str(e))

    def _save_state(self) -> None:
        """Persist current state to disk."""
        try:
            state_data = {
                "tasks": [
                    {
                        "task_id": task.task_id,
                        "worker": task.worker,
                        "created_at": task.created_at,
                        "completed_at": task.completed_at,
                        "status": task.status,
                        "result_file": str(task.result_file) if task.result_file else None,
                        "attempts": task.attempts,
                    }
                    for task in self.tasks.values()
                ],
                "stats": self.stats,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Atomic write
            temp_file = self.config.state_file.with_suffix(".tmp")
            temp_file.write_text(json.dumps(state_data, indent=2))
            temp_file.rename(self.config.state_file)

            self.logger.debug("State saved", task_count=len(self.tasks))

        except Exception as e:
            self.logger.error("Failed to save state", error=str(e))

    async def _check_worker_health(self) -> None:
        """Monitor worker health via heartbeat files."""
        while not self.shutdown:
            try:
                current_time = time.time()

                for worker_name, worker in self.workers.items():
                    heartbeat_file = (
                        self.config.result_dir.parent
                        / "heartbeats"
                        / f"{worker_name}.json"
                    )

                    if heartbeat_file.exists():
                        try:
                            heartbeat_data = json.loads(heartbeat_file.read_text())
                            heartbeat_time_str = heartbeat_data.get("timestamp", "")

                            # Parse timestamp
                            heartbeat_time = datetime.fromisoformat(
                                heartbeat_time_str.replace("Z", "+00:00")
                            ).timestamp()

                            worker.last_heartbeat = heartbeat_time

                            # Check if stale (> 30 seconds)
                            age = current_time - heartbeat_time
                            was_healthy = worker.is_healthy
                            worker.is_healthy = age < 30

                            if was_healthy and not worker.is_healthy:
                                self.logger.warning(
                                    "Worker unhealthy",
                                    worker=worker_name,
                                    age_seconds=f"{age:.1f}",
                                )
                            elif not was_healthy and worker.is_healthy:
                                self.logger.info("Worker recovered", worker=worker_name)

                        except Exception as e:
                            self.logger.error(
                                "Failed to parse heartbeat",
                                worker=worker_name,
                                error=str(e),
                            )
                            worker.is_healthy = False

                    else:
                        worker.is_healthy = False

                await asyncio.sleep(10)  # Check every 10 seconds

            except Exception as e:
                self.logger.error("Health check error", error=str(e))
                await asyncio.sleep(10)

    async def _monitor_timeouts(self) -> None:
        """Monitor tasks for timeouts."""
        while not self.shutdown:
            try:
                current_time = time.time()
                timeout_threshold = current_time - self.config.completion_timeout

                for task in list(self.tasks.values()):
                    if (
                        task.status == "pending"
                        and task.created_at < timeout_threshold
                    ):
                        self.logger.warning(
                            "Task timeout",
                            task_id=task.task_id,
                            worker=task.worker,
                            age_seconds=f"{current_time - task.created_at:.1f}",
                        )

                        task.status = "timeout"
                        self.stats["timeout_tasks"] += 1

                        # Notify orchestrator of timeout
                        await self._notify_orchestrator(
                            "task_timeout",
                            {
                                "task_id": task.task_id,
                                "worker": task.worker,
                                "age_seconds": current_time - task.created_at,
                            },
                        )

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                self.logger.error("Timeout monitoring error", error=str(e))
                await asyncio.sleep(30)

    async def _process_result_file(self, result_path: Path) -> None:
        """
        Process a worker result file.

        Args:
            result_path: Path to result file
        """
        try:
            # Parse result
            result_data = json.loads(result_path.read_text())
            task_id = result_data.get("task_id")
            worker = result_data.get("worker")
            status = result_data.get("status")

            if not task_id or not worker:
                self.logger.error("Invalid result file", result_path=str(result_path))
                return

            # Get or create task state
            if task_id not in self.tasks:
                task = TaskState(
                    task_id=task_id, worker=worker, created_at=time.time()
                )
                self.tasks[task_id] = task
                self.stats["total_tasks"] += 1

            task = self.tasks[task_id]
            task.completed_at = time.time()
            task.status = status
            task.result_file = result_path

            # Update worker state
            if worker in self.workers:
                worker_state = self.workers[worker]
                worker_state.active_tasks.discard(task_id)

                if status == "completed":
                    worker_state.completed_tasks += 1
                    self.stats["completed_tasks"] += 1
                elif status == "failed":
                    worker_state.failed_tasks += 1
                    self.stats["failed_tasks"] += 1

            self.logger.info(
                "Task completed",
                task_id=task_id,
                worker=worker,
                status=status,
                duration=f"{task.completed_at - task.created_at:.2f}s",
            )

            # Save state
            self._save_state()

            # Notify orchestrator
            await self._notify_orchestrator(
                "task_completed",
                {
                    "task_id": task_id,
                    "worker": worker,
                    "status": status,
                    "result_file": str(result_path),
                    "duration_seconds": task.completed_at - task.created_at,
                },
            )

        except json.JSONDecodeError as e:
            self.logger.error(
                "Invalid JSON in result file", result_path=str(result_path), error=str(e)
            )
        except Exception as e:
            self.logger.error(
                "Error processing result file",
                result_path=str(result_path),
                error=str(e),
            )

    async def _notify_orchestrator(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Notify orchestrator of an event.

        Creates a trigger file in the orchestrator's trigger directory.

        Args:
            event_type: Type of event
            data: Event data
        """
        try:
            trigger_dir = self.config.trigger_dir / "orchestrator"
            trigger_dir.mkdir(parents=True, exist_ok=True)

            trigger_file = trigger_dir / f"{event_type}_{int(time.time() * 1000)}.json"

            notification = {
                "event_type": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data,
            }

            trigger_file.write_text(json.dumps(notification, indent=2))

            self.logger.debug(
                "Orchestrator notified", event_type=event_type, trigger_file=str(trigger_file)
            )

        except Exception as e:
            self.logger.error(
                "Failed to notify orchestrator", event_type=event_type, error=str(e)
            )

    def _start_result_watchers(self) -> None:
        """Start file watchers for all worker result directories."""

        class ResultFileHandler(FileSystemEventHandler):
            def __init__(self, listener: "OrchestratorListener", worker: str):
                self.listener = listener
                self.worker = worker

            def on_created(self, event):
                if not event.is_directory and event.src_path.endswith(".json"):
                    asyncio.create_task(
                        self.listener._process_result_file(Path(event.src_path))
                    )

        for worker_name in self.config.workers:
            result_dir = self.config.result_dir / worker_name
            result_dir.mkdir(parents=True, exist_ok=True)

            handler = ResultFileHandler(self, worker_name)
            observer = Observer()
            observer.schedule(handler, str(result_dir), recursive=False)
            observer.start()

            self.observers.append(observer)

            self.logger.info(
                "Result watcher started", worker=worker_name, directory=str(result_dir)
            )

    async def _print_status(self) -> None:
        """Print periodic status summary."""
        while not self.shutdown:
            try:
                await asyncio.sleep(60)  # Every minute

                uptime = time.time() - self.start_time
                pending_tasks = sum(1 for t in self.tasks.values() if t.status == "pending")
                active_tasks = sum(len(w.active_tasks) for w in self.workers.values())

                # Worker health summary
                healthy_workers = sum(1 for w in self.workers.values() if w.is_healthy)

                self.logger.info(
                    "Status summary",
                    uptime_seconds=f"{uptime:.0f}",
                    healthy_workers=f"{healthy_workers}/{len(self.workers)}",
                    pending_tasks=pending_tasks,
                    active_tasks=active_tasks,
                    completed=self.stats["completed_tasks"],
                    failed=self.stats["failed_tasks"],
                    timeout=self.stats["timeout_tasks"],
                )

            except Exception as e:
                self.logger.error("Status print error", error=str(e))

    async def run(self) -> None:
        """Run the orchestrator listener."""
        self.logger.info("Starting orchestrator listener", workers=self.config.workers)

        # Start result watchers
        self._start_result_watchers()

        # Start background tasks
        health_check_task = asyncio.create_task(self._check_worker_health())
        timeout_monitor_task = asyncio.create_task(self._monitor_timeouts())
        status_task = asyncio.create_task(self._print_status())

        self.logger.info("Orchestrator listener ready")

        try:
            # Wait for shutdown
            while not self.shutdown:
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            self.logger.info("Keyboard interrupt received")

        finally:
            # Cleanup
            self.logger.info("Shutting down...")

            # Stop file watchers
            for observer in self.observers:
                observer.stop()
                observer.join()

            # Cancel background tasks
            health_check_task.cancel()
            timeout_monitor_task.cancel()
            status_task.cancel()

            # Save final state
            self._save_state()

            # Print final stats
            uptime = time.time() - self.start_time
            self.logger.info(
                "Shutdown complete",
                uptime_seconds=f"{uptime:.1f}",
                total_tasks=self.stats["total_tasks"],
                completed=self.stats["completed_tasks"],
                failed=self.stats["failed_tasks"],
                timeout=self.stats["timeout_tasks"],
            )

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a specific task.

        Args:
            task_id: Task identifier

        Returns:
            Task status dictionary or None if not found
        """
        if task_id not in self.tasks:
            return None

        task = self.tasks[task_id]
        return {
            "task_id": task.task_id,
            "worker": task.worker,
            "status": task.status,
            "created_at": task.created_at,
            "completed_at": task.completed_at,
            "result_file": str(task.result_file) if task.result_file else None,
            "attempts": task.attempts,
        }

    def get_worker_status(self, worker_name: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a specific worker.

        Args:
            worker_name: Worker name

        Returns:
            Worker status dictionary or None if not found
        """
        if worker_name not in self.workers:
            return None

        worker = self.workers[worker_name]
        return {
            "name": worker.name,
            "is_healthy": worker.is_healthy,
            "last_heartbeat": worker.last_heartbeat,
            "active_tasks": len(worker.active_tasks),
            "completed_tasks": worker.completed_tasks,
            "failed_tasks": worker.failed_tasks,
        }

    def get_all_stats(self) -> Dict[str, Any]:
        """
        Get all statistics.

        Returns:
            Statistics dictionary
        """
        return {
            "uptime_seconds": time.time() - self.start_time,
            "tasks": self.stats,
            "workers": {
                name: self.get_worker_status(name) for name in self.config.workers
            },
        }


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Orchestrator Listener - Multi-worker coordination and result aggregation"
    )
    parser.add_argument(
        "--poll-interval",
        type=float,
        help="Polling interval in seconds (overrides POLL_INTERVAL)",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Log level (overrides LOG_LEVEL)",
    )
    parser.add_argument(
        "--workers",
        help="Comma-separated list of workers (overrides WORKERS)",
    )

    args = parser.parse_args()

    # Override config from CLI args
    if args.poll_interval:
        os.environ["POLL_INTERVAL"] = str(args.poll_interval)
    if args.log_level:
        os.environ["LOG_LEVEL"] = args.log_level
    if args.workers:
        os.environ["WORKERS"] = args.workers

    # Load configuration
    config = load_orchestrator_config()

    print("=" * 70)
    print(f"  Orchestrator Listener v1.0")
    print(f"  Workers: {', '.join(config.workers)}")
    print(f"  Result Directory: {config.result_dir}")
    print(f"  Log Level: {config.log_level}")
    print("=" * 70)

    # Create and run listener
    listener = OrchestratorListener(config)
    await listener.run()


if __name__ == "__main__":
    asyncio.run(main())
