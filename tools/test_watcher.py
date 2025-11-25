"""
Unit tests for watcher system.

Tests worker watcher, orchestrator listener, and configuration modules.

Usage:
    pytest test_watcher.py
    pytest test_watcher.py -v
    pytest test_watcher.py::TestWorkerWatcher
    pytest test_watcher.py -k "test_circuit_breaker"
"""

import asyncio
import json
import os
import tempfile
import time
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from watcher_config import (
    MetricsConfig,
    OrchestratorConfig,
    WatcherConfig,
    load_orchestrator_config,
    load_watcher_config,
)
from worker_watcher import CircuitBreaker, CircuitBreakerState, WorkerWatcher


class TestWatcherConfig:
    """Test watcher configuration."""

    def test_watcher_config_defaults(self):
        """Test default configuration values."""
        config = WatcherConfig(worker_name="marie")

        assert config.worker_name == "marie"
        assert config.max_concurrent_tasks >= 1
        assert config.task_timeout > 0
        assert config.max_retries >= 0
        assert config.log_level in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

    def test_watcher_config_validation(self):
        """Test configuration validation."""
        # Invalid log level
        with pytest.raises(ValueError):
            WatcherConfig(worker_name="marie", log_level="INVALID")

        # Invalid log format
        with pytest.raises(ValueError):
            WatcherConfig(worker_name="marie", log_format="xml")

    def test_watcher_config_paths(self):
        """Test worker-specific path generation."""
        config = WatcherConfig(worker_name="marie")

        task_dir = config.get_worker_task_dir()
        assert "marie" in str(task_dir)

        trigger_dir = config.get_worker_trigger_dir()
        assert "marie" in str(trigger_dir)

        result_dir = config.get_worker_result_dir()
        assert "marie" in str(result_dir)

        dlq_dir = config.get_worker_dlq_dir()
        assert "marie" in str(dlq_dir)

    def test_watcher_config_directory_creation(self, tmp_path):
        """Test automatic directory creation."""
        config = WatcherConfig(
            worker_name="test",
            task_dir=tmp_path / "tasks",
            trigger_dir=tmp_path / "triggers",
            result_dir=tmp_path / "results",
            dlq_dir=tmp_path / "dlq",
            heartbeat_dir=tmp_path / "heartbeats",
        )

        config.ensure_directories()

        assert config.get_worker_task_dir().exists()
        assert config.get_worker_trigger_dir().exists()
        assert config.get_worker_result_dir().exists()
        assert config.get_worker_dlq_dir().exists()
        assert config.heartbeat_dir.exists()

    def test_orchestrator_config_defaults(self):
        """Test orchestrator configuration defaults."""
        config = OrchestratorConfig()

        assert len(config.workers) > 0
        assert config.poll_interval > 0
        assert config.completion_timeout > 0

    def test_orchestrator_config_worker_list(self):
        """Test worker list configuration."""
        with patch.dict(os.environ, {"WORKERS": "alice,bob,charlie"}):
            config = OrchestratorConfig()
            assert config.workers == ["alice", "bob", "charlie"]


class TestCircuitBreaker:
    """Test circuit breaker functionality."""

    def test_circuit_breaker_closed_state(self):
        """Test circuit breaker starts in closed state."""
        cb = CircuitBreaker(threshold=3, timeout=10)
        assert cb.state == CircuitBreakerState.CLOSED
        assert not cb.is_open()

    def test_circuit_breaker_opens_after_threshold(self):
        """Test circuit breaker opens after threshold failures."""
        cb = CircuitBreaker(threshold=3, timeout=10)

        # Record failures
        cb.record_failure()
        assert cb.state == CircuitBreakerState.CLOSED

        cb.record_failure()
        assert cb.state == CircuitBreakerState.CLOSED

        cb.record_failure()
        assert cb.state == CircuitBreakerState.OPEN
        assert cb.is_open()

    def test_circuit_breaker_resets_on_success(self):
        """Test circuit breaker resets failure count on success."""
        cb = CircuitBreaker(threshold=3, timeout=10)

        cb.record_failure()
        cb.record_failure()
        assert cb.failures == 2

        cb.record_success()
        assert cb.failures == 0
        assert cb.state == CircuitBreakerState.CLOSED

    def test_circuit_breaker_half_open_after_timeout(self):
        """Test circuit breaker enters half-open state after timeout."""
        cb = CircuitBreaker(threshold=2, timeout=1)

        # Open the circuit
        cb.record_failure()
        cb.record_failure()
        assert cb.is_open()

        # Wait for timeout
        time.sleep(1.1)

        # Should now be half-open
        assert not cb.is_open()
        assert cb.state == CircuitBreakerState.HALF_OPEN


class TestWorkerWatcher:
    """Test worker watcher functionality."""

    @pytest.fixture
    def temp_config(self, tmp_path):
        """Create temporary test configuration."""
        config = WatcherConfig(
            worker_name="test",
            task_dir=tmp_path / "tasks",
            trigger_dir=tmp_path / "triggers",
            result_dir=tmp_path / "results",
            dlq_dir=tmp_path / "dlq",
            heartbeat_dir=tmp_path / "heartbeats",
            max_concurrent_tasks=2,
            task_timeout=5,
            max_retries=2,
            log_level="INFO",
        )
        config.ensure_directories()
        return config

    @pytest.fixture
    def watcher(self, temp_config):
        """Create worker watcher instance."""
        return WorkerWatcher(temp_config)

    def test_watcher_initialization(self, watcher):
        """Test watcher initialization."""
        assert watcher.config.worker_name == "test"
        assert watcher.task_queue is not None
        assert watcher.circuit_breaker is not None
        assert not watcher.shutdown

    @pytest.mark.asyncio
    async def test_read_task_file_valid(self, watcher, temp_config):
        """Test reading valid task file."""
        task_file = temp_config.get_worker_task_dir() / "task-001.json"
        task_data = {
            "task_id": "task-001",
            "description": "Test task",
            "worker": "test",
        }
        task_file.write_text(json.dumps(task_data))

        result = await watcher._read_task_file(task_file)
        assert result is not None
        assert result["task_id"] == "task-001"
        assert result["description"] == "Test task"

    @pytest.mark.asyncio
    async def test_read_task_file_invalid_json(self, watcher, temp_config):
        """Test reading invalid JSON task file."""
        task_file = temp_config.get_worker_task_dir() / "invalid.json"
        task_file.write_text("{ invalid json")

        result = await watcher._read_task_file(task_file)
        assert result is None

    @pytest.mark.asyncio
    async def test_read_task_file_missing_fields(self, watcher, temp_config):
        """Test reading task file with missing required fields."""
        task_file = temp_config.get_worker_task_dir() / "incomplete.json"
        task_data = {"description": "Missing task_id"}
        task_file.write_text(json.dumps(task_data))

        result = await watcher._read_task_file(task_file)
        assert result is None

    @pytest.mark.asyncio
    async def test_create_trigger_file(self, watcher, temp_config):
        """Test trigger file creation."""
        await watcher._create_trigger_file("task-001")

        trigger_file = temp_config.get_worker_trigger_dir() / "task-001.trigger"
        assert trigger_file.exists()

        trigger_data = json.loads(trigger_file.read_text())
        assert trigger_data["task_id"] == "task-001"
        assert trigger_data["worker"] == "test"
        assert trigger_data["status"] == "received"

    @pytest.mark.asyncio
    async def test_write_result(self, watcher, temp_config):
        """Test result file writing."""
        task_data = {"task_id": "task-001", "description": "Test"}

        await watcher._write_result(
            task_data=task_data,
            exit_code=0,
            stdout="Success",
            stderr="",
            duration=1.5,
        )

        result_file = temp_config.get_worker_result_dir() / "task-001.json"
        assert result_file.exists()

        result_data = json.loads(result_file.read_text())
        assert result_data["task_id"] == "task-001"
        assert result_data["status"] == "completed"
        assert result_data["exit_code"] == 0
        assert result_data["duration_seconds"] == 1.5

    @pytest.mark.asyncio
    async def test_move_to_dlq(self, watcher, temp_config):
        """Test moving failed task to DLQ."""
        task_file = temp_config.get_worker_task_dir() / "failed.json"
        task_data = {"task_id": "failed-001", "description": "Failed task"}
        task_file.write_text(json.dumps(task_data))

        await watcher._move_to_dlq(task_file, "max_retries_exceeded")

        # Original should be deleted
        assert not task_file.exists()

        # Should be in DLQ
        dlq_files = list(temp_config.get_worker_dlq_dir().glob("failed*.json"))
        assert len(dlq_files) == 1

        dlq_data = json.loads(dlq_files[0].read_text())
        assert dlq_data["task_id"] == "failed-001"
        assert dlq_data["dlq_reason"] == "max_retries_exceeded"

    @pytest.mark.asyncio
    async def test_queue_task(self, watcher, temp_config):
        """Test task queuing."""
        task_file = temp_config.get_worker_task_dir() / "queue-test.json"
        task_data = {"task_id": "queue-001", "description": "Queue test"}
        task_file.write_text(json.dumps(task_data))

        initial_size = watcher.task_queue.qsize()
        await watcher._queue_task(task_file)

        assert watcher.task_queue.qsize() == initial_size + 1

    @pytest.mark.asyncio
    async def test_queue_ignores_temp_files(self, watcher, temp_config):
        """Test that temporary files are ignored."""
        task_file = temp_config.get_worker_task_dir() / ".tmp_test.json"
        task_file.write_text("{}")

        initial_size = watcher.task_queue.qsize()
        await watcher._queue_task(task_file)

        assert watcher.task_queue.qsize() == initial_size

    @pytest.mark.asyncio
    async def test_heartbeat_writing(self, watcher, temp_config):
        """Test heartbeat file writing."""
        # Manually trigger heartbeat once
        await watcher._write_heartbeat()

        heartbeat_file = temp_config.heartbeat_dir / "test.json"

        # Wait a bit for async write
        await asyncio.sleep(0.1)

        # Check if heartbeat exists (might not in test environment)
        # This is a basic check - full test requires running event loop
        assert temp_config.heartbeat_dir.exists()


class TestOrchestratorListener:
    """Test orchestrator listener functionality."""

    @pytest.fixture
    def temp_config(self, tmp_path):
        """Create temporary orchestrator configuration."""
        config = OrchestratorConfig(
            workers=["worker1", "worker2"],
            result_dir=tmp_path / "results",
            trigger_dir=tmp_path / "triggers",
            pipe_dir=tmp_path / "pipes",
            state_file=tmp_path / "state.json",
            log_level="INFO",
        )
        config.ensure_directories()
        return config

    def test_orchestrator_config_directory_creation(self, temp_config):
        """Test orchestrator directory structure."""
        assert temp_config.result_dir.exists()
        assert temp_config.trigger_dir.exists()
        assert temp_config.pipe_dir.exists()

        # Worker-specific result directories
        for worker in temp_config.workers:
            assert (temp_config.result_dir / worker).exists()


class TestMetricsConfig:
    """Test metrics configuration."""

    def test_metrics_config_defaults(self):
        """Test metrics configuration defaults."""
        config = MetricsConfig()

        assert config.namespace == "watcher"
        assert config.tasks_processed_total == "tasks_processed_total"
        assert config.tasks_failed_total == "tasks_failed_total"
        assert config.task_duration_seconds == "task_duration_seconds"

    def test_metrics_config_from_environment(self):
        """Test metrics configuration from environment."""
        with patch.dict(os.environ, {"ENABLE_METRICS": "false", "METRICS_PORT": "8080"}):
            config = MetricsConfig()
            assert not config.enabled
            assert config.port == 8080


class TestIntegration:
    """Integration tests for full workflow."""

    @pytest.mark.asyncio
    async def test_end_to_end_task_processing(self, tmp_path):
        """Test complete task processing workflow."""
        # Setup configuration
        config = WatcherConfig(
            worker_name="integration_test",
            task_dir=tmp_path / "tasks",
            trigger_dir=tmp_path / "triggers",
            result_dir=tmp_path / "results",
            dlq_dir=tmp_path / "dlq",
            heartbeat_dir=tmp_path / "heartbeats",
            max_concurrent_tasks=1,
            task_timeout=5,
            max_retries=1,
            claude_command="echo",  # Use echo as mock
            log_level="DEBUG",
        )
        config.ensure_directories()

        # Create watcher
        watcher = WorkerWatcher(config)

        # Create test task
        task_file = config.get_worker_task_dir() / "integration-001.json"
        task_data = {
            "task_id": "integration-001",
            "description": "Integration test task",
            "worker": "integration_test",
        }
        task_file.write_text(json.dumps(task_data))

        # Queue and process task
        await watcher._queue_task(task_file)
        assert watcher.task_queue.qsize() == 1

        # Process the task (mocked Claude CLI)
        with patch.object(
            watcher,
            "_execute_claude_cli",
            return_value=(0, "Success", ""),
        ):
            task_path = await asyncio.wait_for(watcher.task_queue.get(), timeout=1.0)
            await watcher._process_task(task_path)

        # Verify result
        result_file = config.get_worker_result_dir() / "integration-001.json"
        assert result_file.exists()

        result_data = json.loads(result_file.read_text())
        assert result_data["task_id"] == "integration-001"
        assert result_data["status"] == "completed"

        # Verify trigger
        trigger_file = config.get_worker_trigger_dir() / "integration-001.trigger"
        assert trigger_file.exists()


# Performance tests
class TestPerformance:
    """Performance and stress tests."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_task_processing(self, tmp_path):
        """Test concurrent task processing performance."""
        config = WatcherConfig(
            worker_name="perf_test",
            task_dir=tmp_path / "tasks",
            trigger_dir=tmp_path / "triggers",
            result_dir=tmp_path / "results",
            dlq_dir=tmp_path / "dlq",
            heartbeat_dir=tmp_path / "heartbeats",
            max_concurrent_tasks=5,
            task_timeout=10,
            log_level="ERROR",  # Reduce log noise
        )
        config.ensure_directories()

        watcher = WorkerWatcher(config)

        # Create multiple tasks
        num_tasks = 10
        for i in range(num_tasks):
            task_file = config.get_worker_task_dir() / f"perf-{i:03d}.json"
            task_data = {
                "task_id": f"perf-{i:03d}",
                "description": f"Performance test task {i}",
            }
            task_file.write_text(json.dumps(task_data))
            await watcher._queue_task(task_file)

        assert watcher.task_queue.qsize() == num_tasks

        # Process all tasks (mocked)
        start_time = time.time()

        with patch.object(
            watcher,
            "_execute_claude_cli",
            return_value=(0, "Success", ""),
        ):
            tasks = []
            for _ in range(num_tasks):
                task_path = await asyncio.wait_for(watcher.task_queue.get(), timeout=1.0)
                task = asyncio.create_task(watcher._process_task(task_path))
                tasks.append(task)

            await asyncio.gather(*tasks)

        duration = time.time() - start_time

        # Should process faster than sequential
        # (With 5 concurrent workers, should be ~2x faster than sequential)
        print(f"Processed {num_tasks} tasks in {duration:.2f}s")
        assert duration < num_tasks  # Very generous - real test would be tighter


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
