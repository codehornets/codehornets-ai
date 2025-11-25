"""
Prometheus metrics collection for agent communication system.
Provides custom collectors and metric helpers.
"""

import time
import os
import psutil
import threading
from typing import Dict, Any, Optional, List
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timedelta

from prometheus_client import (
    Counter, Gauge, Histogram, Summary, Info,
    CollectorRegistry, generate_latest,
    start_http_server, push_to_gateway
)
from prometheus_client.core import GaugeMetricFamily, CounterMetricFamily


# Create a custom registry for isolation
REGISTRY = CollectorRegistry()

# =============================================================================
# Core Task Metrics
# =============================================================================

task_created_total = Counter(
    'task_created_total',
    'Total number of tasks created',
    ['worker', 'task_type', 'priority'],
    registry=REGISTRY
)

task_completed_total = Counter(
    'task_completed_total',
    'Total number of tasks completed',
    ['worker', 'task_type', 'status'],
    registry=REGISTRY
)

task_failed_total = Counter(
    'task_failed_total',
    'Total number of tasks failed',
    ['worker', 'task_type', 'error_type'],
    registry=REGISTRY
)

task_retried_total = Counter(
    'task_retried_total',
    'Total number of task retries',
    ['worker', 'task_type', 'retry_count'],
    registry=REGISTRY
)

# Task processing time histogram with useful buckets for our use case
task_processing_duration = Histogram(
    'task_processing_duration_seconds',
    'Time taken to process a task',
    ['worker', 'task_type'],
    buckets=(0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300),
    registry=REGISTRY
)

task_queue_wait_time = Histogram(
    'task_queue_wait_seconds',
    'Time task spent waiting in queue before processing',
    ['worker', 'priority'],
    buckets=(0.1, 0.5, 1, 5, 10, 30, 60, 300, 600),
    registry=REGISTRY
)

# =============================================================================
# Queue and Backlog Metrics
# =============================================================================

task_queue_depth = Gauge(
    'task_queue_depth',
    'Current number of tasks in queue',
    ['worker', 'status'],
    registry=REGISTRY
)

task_backlog_age = Gauge(
    'task_backlog_age_seconds',
    'Age of oldest unprocessed task in queue',
    ['worker'],
    registry=REGISTRY
)

active_tasks = Gauge(
    'active_tasks',
    'Number of currently processing tasks',
    ['worker'],
    registry=REGISTRY
)

# =============================================================================
# Watcher and System Metrics
# =============================================================================

watcher_events_total = Counter(
    'watcher_events_total',
    'Total number of file system events detected',
    ['worker', 'event_type'],
    registry=REGISTRY
)

watcher_trigger_latency = Histogram(
    'watcher_trigger_latency_seconds',
    'Time from file detection to trigger creation',
    ['worker'],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1),
    registry=REGISTRY
)

watcher_heartbeat = Gauge(
    'watcher_heartbeat_timestamp',
    'Last heartbeat timestamp from watcher',
    ['worker'],
    registry=REGISTRY
)

# =============================================================================
# Named Pipe Metrics
# =============================================================================

pipe_messages_sent = Counter(
    'pipe_messages_sent_total',
    'Total messages sent through named pipes',
    ['worker', 'pipe_name', 'message_type'],
    registry=REGISTRY
)

pipe_messages_received = Counter(
    'pipe_messages_received_total',
    'Total messages received through named pipes',
    ['worker', 'pipe_name', 'message_type'],
    registry=REGISTRY
)

pipe_write_latency = Histogram(
    'pipe_write_latency_seconds',
    'Time to write message to named pipe',
    ['worker', 'pipe_name'],
    buckets=(0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1),
    registry=REGISTRY
)

pipe_connection_errors = Counter(
    'pipe_connection_errors_total',
    'Total named pipe connection errors',
    ['worker', 'pipe_name', 'error_type'],
    registry=REGISTRY
)

# =============================================================================
# Claude Process Metrics
# =============================================================================

claude_invocations = Counter(
    'claude_invocations_total',
    'Total Claude process invocations',
    ['worker', 'invocation_type'],
    registry=REGISTRY
)

claude_processing_time = Histogram(
    'claude_processing_time_seconds',
    'Claude process execution time',
    ['worker', 'task_type'],
    buckets=(1, 5, 10, 30, 60, 120, 300, 600),
    registry=REGISTRY
)

claude_memory_usage = Gauge(
    'claude_memory_usage_bytes',
    'Memory usage of Claude processes',
    ['worker', 'process_id'],
    registry=REGISTRY
)

claude_api_errors = Counter(
    'claude_api_errors_total',
    'Total Claude API errors',
    ['worker', 'error_type', 'status_code'],
    registry=REGISTRY
)

# =============================================================================
# System Resource Metrics
# =============================================================================

system_cpu_usage = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage',
    ['worker', 'core'],
    registry=REGISTRY
)

system_memory_usage = Gauge(
    'system_memory_usage_bytes',
    'System memory usage',
    ['worker', 'memory_type'],
    registry=REGISTRY
)

system_disk_usage = Gauge(
    'system_disk_usage_bytes',
    'Disk usage for shared volume',
    ['worker', 'mount_point', 'usage_type'],
    registry=REGISTRY
)

system_io_operations = Counter(
    'system_io_operations_total',
    'Total I/O operations',
    ['worker', 'operation_type'],
    registry=REGISTRY
)


class SystemMetricsCollector:
    """Collects system-level metrics for monitoring."""

    def __init__(self, worker_name: str, collect_interval: int = 10):
        self.worker_name = worker_name
        self.collect_interval = collect_interval
        self.running = False
        self.thread = None

    def start(self):
        """Start collecting system metrics in background."""
        self.running = True
        self.thread = threading.Thread(target=self._collect_loop, daemon=True)
        self.thread.start()

    def stop(self):
        """Stop collecting system metrics."""
        self.running = False
        if self.thread:
            self.thread.join()

    def _collect_loop(self):
        """Main collection loop."""
        while self.running:
            self.collect_metrics()
            time.sleep(self.collect_interval)

    def collect_metrics(self):
        """Collect current system metrics."""
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
        for i, percent in enumerate(cpu_percent):
            system_cpu_usage.labels(
                worker=self.worker_name,
                core=f"cpu{i}"
            ).set(percent)

        # Memory metrics
        memory = psutil.virtual_memory()
        system_memory_usage.labels(
            worker=self.worker_name,
            memory_type="used"
        ).set(memory.used)

        system_memory_usage.labels(
            worker=self.worker_name,
            memory_type="available"
        ).set(memory.available)

        system_memory_usage.labels(
            worker=self.worker_name,
            memory_type="cached"
        ).set(memory.cached if hasattr(memory, 'cached') else 0)

        # Disk metrics for shared volume
        shared_path = "/shared"
        if os.path.exists(shared_path):
            disk = psutil.disk_usage(shared_path)
            system_disk_usage.labels(
                worker=self.worker_name,
                mount_point=shared_path,
                usage_type="used"
            ).set(disk.used)

            system_disk_usage.labels(
                worker=self.worker_name,
                mount_point=shared_path,
                usage_type="free"
            ).set(disk.free)

        # I/O metrics
        io_counters = psutil.disk_io_counters()
        if io_counters:
            system_io_operations.labels(
                worker=self.worker_name,
                operation_type="read"
            )._value.set(io_counters.read_count)

            system_io_operations.labels(
                worker=self.worker_name,
                operation_type="write"
            )._value.set(io_counters.write_count)


class TaskQueueMetricsCollector:
    """Collects metrics about task queues."""

    def __init__(self, worker_name: str, queue_path: str = "/shared/tasks"):
        self.worker_name = worker_name
        self.queue_path = Path(queue_path) / worker_name

    def collect_queue_metrics(self):
        """Collect current queue depth and age metrics."""
        statuses = ['pending', 'active', 'completed', 'failed']

        for status in statuses:
            status_path = self.queue_path / status
            if status_path.exists():
                # Count tasks
                task_files = list(status_path.glob("*.json"))
                task_queue_depth.labels(
                    worker=self.worker_name,
                    status=status
                ).set(len(task_files))

                # Find oldest task for backlog age
                if status == 'pending' and task_files:
                    oldest_time = min(f.stat().st_mtime for f in task_files)
                    age = time.time() - oldest_time
                    task_backlog_age.labels(worker=self.worker_name).set(age)

    def update_active_tasks(self, count: int):
        """Update active task count."""
        active_tasks.labels(worker=self.worker_name).set(count)


class MetricsAggregator:
    """Aggregates and exposes metrics for Prometheus scraping."""

    def __init__(self,
                 worker_name: str,
                 port: int = 9090,
                 pushgateway_url: Optional[str] = None):
        self.worker_name = worker_name
        self.port = port
        self.pushgateway_url = pushgateway_url

        # Initialize collectors
        self.system_collector = SystemMetricsCollector(worker_name)
        self.queue_collector = TaskQueueMetricsCollector(worker_name)

        # Track task processing times for percentile calculations
        self.processing_times: Dict[str, List[float]] = defaultdict(list)
        self.max_samples = 1000  # Keep last N samples per task type

    def start_http_server(self):
        """Start HTTP server for Prometheus scraping."""
        start_http_server(self.port, registry=REGISTRY)
        self.system_collector.start()
        print(f"Metrics server started on port {self.port}")

    def push_metrics(self):
        """Push metrics to Prometheus Pushgateway if configured."""
        if self.pushgateway_url:
            push_to_gateway(
                self.pushgateway_url,
                job=f'agent_worker_{self.worker_name}',
                registry=REGISTRY
            )

    def record_task_created(self, task_type: str, priority: str = "normal"):
        """Record task creation."""
        task_created_total.labels(
            worker=self.worker_name,
            task_type=task_type,
            priority=priority
        ).inc()

    def record_task_completed(self, task_type: str, duration: float, status: str = "success"):
        """Record task completion."""
        task_completed_total.labels(
            worker=self.worker_name,
            task_type=task_type,
            status=status
        ).inc()

        task_processing_duration.labels(
            worker=self.worker_name,
            task_type=task_type
        ).observe(duration)

        # Store for percentile calculations
        self.processing_times[task_type].append(duration)
        if len(self.processing_times[task_type]) > self.max_samples:
            self.processing_times[task_type].pop(0)

    def record_task_failed(self, task_type: str, error_type: str):
        """Record task failure."""
        task_failed_total.labels(
            worker=self.worker_name,
            task_type=task_type,
            error_type=error_type
        ).inc()

    def record_watcher_event(self, event_type: str):
        """Record watcher event."""
        watcher_events_total.labels(
            worker=self.worker_name,
            event_type=event_type
        ).inc()

    def record_watcher_trigger_latency(self, latency: float):
        """Record watcher trigger creation latency."""
        watcher_trigger_latency.labels(
            worker=self.worker_name
        ).observe(latency)

    def update_watcher_heartbeat(self):
        """Update watcher heartbeat timestamp."""
        watcher_heartbeat.labels(
            worker=self.worker_name
        ).set(time.time())

    def record_pipe_message(self, pipe_name: str, message_type: str, direction: str = "sent"):
        """Record named pipe message."""
        if direction == "sent":
            pipe_messages_sent.labels(
                worker=self.worker_name,
                pipe_name=pipe_name,
                message_type=message_type
            ).inc()
        else:
            pipe_messages_received.labels(
                worker=self.worker_name,
                pipe_name=pipe_name,
                message_type=message_type
            ).inc()

    def record_claude_invocation(self, invocation_type: str = "task_processing"):
        """Record Claude invocation."""
        claude_invocations.labels(
            worker=self.worker_name,
            invocation_type=invocation_type
        ).inc()

    def record_claude_processing_time(self, task_type: str, duration: float):
        """Record Claude processing time."""
        claude_processing_time.labels(
            worker=self.worker_name,
            task_type=task_type
        ).observe(duration)

    def get_percentiles(self, task_type: str) -> Dict[str, float]:
        """Calculate percentiles for task processing times."""
        if task_type not in self.processing_times:
            return {}

        times = sorted(self.processing_times[task_type])
        if not times:
            return {}

        n = len(times)
        return {
            "p50": times[int(n * 0.5)],
            "p95": times[int(n * 0.95)] if n > 20 else times[-1],
            "p99": times[int(n * 0.99)] if n > 100 else times[-1]
        }


# Example usage
if __name__ == "__main__":
    # Initialize metrics aggregator
    metrics = MetricsAggregator(
        worker_name="marie",
        port=9091,
        pushgateway_url="http://localhost:9091"
    )

    # Start metrics server
    metrics.start_http_server()

    # Simulate some metrics
    metrics.record_task_created("document_analysis", "high")
    metrics.record_watcher_event("file_created")

    time.sleep(2)

    metrics.record_task_completed("document_analysis", 1.5)
    metrics.update_watcher_heartbeat()

    # Push to gateway if configured
    metrics.push_metrics()

    # Keep running
    try:
        while True:
            metrics.queue_collector.collect_queue_metrics()
            time.sleep(10)
    except KeyboardInterrupt:
        print("Shutting down metrics collection")