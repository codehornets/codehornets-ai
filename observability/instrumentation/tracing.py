"""
Distributed tracing instrumentation for agent communication system.
Provides decorators and utilities for OpenTelemetry integration.
"""

import json
import time
import functools
from typing import Dict, Any, Optional, Callable
from contextlib import contextmanager
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
import uuid

from opentelemetry import trace, metrics, baggage
from opentelemetry.context import attach, detach
from opentelemetry.trace import Status, StatusCode, SpanKind
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.metrics import CallbackOptions, Observation
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.logging import LoggingInstrumentor


@dataclass
class TraceContext:
    """Trace context for propagation through file-based communication."""
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    correlation_id: str
    worker_name: str
    task_id: str
    timestamp: str
    baggage: Dict[str, str]

    def to_json(self) -> str:
        """Serialize trace context to JSON for file storage."""
        return json.dumps(asdict(self), indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> 'TraceContext':
        """Deserialize trace context from JSON."""
        return cls(**json.loads(json_str))

    def to_headers(self) -> Dict[str, str]:
        """Convert to headers format for propagation."""
        return {
            'traceparent': f'00-{self.trace_id}-{self.span_id}-01',
            'tracestate': f'worker={self.worker_name}',
            'correlation-id': self.correlation_id,
            'task-id': self.task_id
        }


class ObservabilityManager:
    """Central observability management for the agent system."""

    def __init__(self,
                 service_name: str,
                 worker_name: str,
                 otlp_endpoint: str = "localhost:4317",
                 enable_logging: bool = True):
        self.service_name = service_name
        self.worker_name = worker_name
        self.otlp_endpoint = otlp_endpoint

        # Initialize resource with service metadata
        resource = Resource.create({
            "service.name": service_name,
            "service.instance.id": f"{worker_name}-{uuid.uuid4().hex[:8]}",
            "worker.name": worker_name,
            "deployment.environment": "production"
        })

        # Setup tracing
        trace.set_tracer_provider(TracerProvider(resource=resource))
        tracer_provider = trace.get_tracer_provider()
        tracer_provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True))
        )
        self.tracer = trace.get_tracer(__name__)

        # Setup metrics
        metrics.set_meter_provider(MeterProvider(resource=resource))
        self.meter = metrics.get_meter(__name__)

        # Setup logging instrumentation
        if enable_logging:
            LoggingInstrumentor().instrument()

        # Initialize metrics
        self._setup_metrics()

        # Trace propagator for context passing
        self.propagator = TraceContextTextMapPropagator()

    def _setup_metrics(self):
        """Initialize all metrics collectors."""
        # Counter metrics
        self.task_created_counter = self.meter.create_counter(
            name="tasks_created_total",
            description="Total number of tasks created",
            unit="1"
        )

        self.task_completed_counter = self.meter.create_counter(
            name="tasks_completed_total",
            description="Total number of tasks completed",
            unit="1"
        )

        self.task_failed_counter = self.meter.create_counter(
            name="tasks_failed_total",
            description="Total number of tasks failed",
            unit="1"
        )

        # Histogram metrics
        self.task_duration_histogram = self.meter.create_histogram(
            name="task_duration_seconds",
            description="Task processing duration",
            unit="s"
        )

        self.queue_wait_time_histogram = self.meter.create_histogram(
            name="task_queue_wait_seconds",
            description="Time task spent waiting in queue",
            unit="s"
        )

        # Gauge metrics (registered as observable)
        self.queue_depth_gauge = self.meter.create_observable_gauge(
            name="task_queue_depth",
            callbacks=[self._get_queue_depth],
            description="Current number of tasks in queue",
            unit="1"
        )

        self.active_tasks_gauge = self.meter.create_observable_gauge(
            name="active_tasks",
            callbacks=[self._get_active_tasks],
            description="Number of currently processing tasks",
            unit="1"
        )

    def _get_queue_depth(self, options: CallbackOptions) -> Iterable[Observation]:
        """Callback to get current queue depth."""
        # This should read from actual queue
        queue_path = Path(f"/shared/tasks/{self.worker_name}/pending")
        if queue_path.exists():
            depth = len(list(queue_path.glob("*.json")))
            yield Observation(depth, {"worker": self.worker_name})

    def _get_active_tasks(self, options: CallbackOptions) -> Iterable[Observation]:
        """Callback to get active task count."""
        # This should read from actual processing state
        active_path = Path(f"/shared/tasks/{self.worker_name}/active")
        if active_path.exists():
            active = len(list(active_path.glob("*.json")))
            yield Observation(active, {"worker": self.worker_name})

    @contextmanager
    def trace_task(self, task_id: str, operation: str, **attributes):
        """Context manager for tracing task operations."""
        with self.tracer.start_as_current_span(
            name=operation,
            kind=SpanKind.SERVER,
            attributes={
                "task.id": task_id,
                "worker.name": self.worker_name,
                "operation.type": operation,
                **attributes
            }
        ) as span:
            try:
                # Set baggage for downstream propagation
                token = attach(baggage.set_baggage("task.id", task_id))
                attach(baggage.set_baggage("worker.name", self.worker_name))

                yield span

                span.set_status(Status(StatusCode.OK))

            except Exception as e:
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.record_exception(e)
                raise
            finally:
                detach(token)

    def create_trace_context(self, task_id: str) -> TraceContext:
        """Create trace context for file-based propagation."""
        span = trace.get_current_span()
        span_context = span.get_span_context()

        return TraceContext(
            trace_id=format(span_context.trace_id, '032x'),
            span_id=format(span_context.span_id, '016x'),
            parent_span_id=format(span.parent.span_id, '016x') if span.parent else None,
            correlation_id=str(uuid.uuid4()),
            worker_name=self.worker_name,
            task_id=task_id,
            timestamp=datetime.utcnow().isoformat(),
            baggage=dict(baggage.get_all())
        )

    def inject_trace_context(self, task_file: Path, context: TraceContext):
        """Inject trace context into task file."""
        if task_file.exists():
            with open(task_file, 'r') as f:
                task_data = json.load(f)

            task_data['_trace_context'] = asdict(context)

            with open(task_file, 'w') as f:
                json.dump(task_data, f, indent=2)

    def extract_trace_context(self, task_file: Path) -> Optional[TraceContext]:
        """Extract trace context from task file."""
        if task_file.exists():
            with open(task_file, 'r') as f:
                task_data = json.load(f)

            if '_trace_context' in task_data:
                return TraceContext(**task_data['_trace_context'])
        return None

    def continue_trace(self, context: TraceContext) -> Any:
        """Continue a trace from extracted context."""
        # Reconstruct the trace context
        carrier = context.to_headers()
        ctx = self.propagator.extract(carrier)
        return attach(ctx)


def traced_operation(operation_name: str = None, record_args: bool = False):
    """Decorator for tracing functions/methods."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            nonlocal operation_name
            if operation_name is None:
                operation_name = func.__name__

            tracer = trace.get_tracer(__name__)

            with tracer.start_as_current_span(
                name=operation_name,
                kind=SpanKind.INTERNAL
            ) as span:
                # Add function arguments as span attributes if requested
                if record_args:
                    span.set_attributes({
                        f"arg.{i}": str(arg)[:100] for i, arg in enumerate(args)
                    })
                    span.set_attributes({
                        f"kwarg.{k}": str(v)[:100] for k, v in kwargs.items()
                    })

                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise

        return wrapper
    return decorator


class TaskTracer:
    """Specialized tracer for task lifecycle events."""

    def __init__(self, obs_manager: ObservabilityManager):
        self.obs = obs_manager

    @traced_operation("task.create")
    def trace_task_creation(self, task_id: str, task_type: str, payload: Dict[str, Any]):
        """Trace task creation event."""
        span = trace.get_current_span()
        span.set_attributes({
            "task.id": task_id,
            "task.type": task_type,
            "task.payload_size": len(json.dumps(payload)),
            "task.created_at": datetime.utcnow().isoformat()
        })

        self.obs.task_created_counter.add(1, {
            "task_type": task_type,
            "worker": self.obs.worker_name
        })

        # Create and return trace context for propagation
        return self.obs.create_trace_context(task_id)

    @traced_operation("task.process")
    def trace_task_processing(self, task_id: str, context: Optional[TraceContext] = None):
        """Trace task processing with optional parent context."""
        token = None
        if context:
            token = self.obs.continue_trace(context)

        try:
            span = trace.get_current_span()
            span.set_attributes({
                "task.id": task_id,
                "task.started_at": datetime.utcnow().isoformat(),
                "worker": self.obs.worker_name
            })

            return span
        finally:
            if token:
                detach(token)

    @traced_operation("task.complete")
    def trace_task_completion(self, task_id: str, duration: float, success: bool = True):
        """Trace task completion event."""
        span = trace.get_current_span()
        span.set_attributes({
            "task.id": task_id,
            "task.duration_ms": duration * 1000,
            "task.success": success,
            "task.completed_at": datetime.utcnow().isoformat()
        })

        # Update metrics
        self.obs.task_duration_histogram.record(duration, {
            "worker": self.obs.worker_name,
            "success": str(success)
        })

        if success:
            self.obs.task_completed_counter.add(1, {"worker": self.obs.worker_name})
        else:
            self.obs.task_failed_counter.add(1, {"worker": self.obs.worker_name})

    @traced_operation("hook.trigger")
    def trace_hook_trigger(self, hook_name: str, trigger_file: str):
        """Trace hook trigger events."""
        span = trace.get_current_span()
        span.set_attributes({
            "hook.name": hook_name,
            "hook.trigger_file": trigger_file,
            "hook.triggered_at": datetime.utcnow().isoformat()
        })

    @traced_operation("pipe.write")
    def trace_pipe_write(self, pipe_name: str, message: str):
        """Trace named pipe write operations."""
        span = trace.get_current_span()
        span.set_attributes({
            "pipe.name": pipe_name,
            "pipe.message_size": len(message),
            "pipe.written_at": datetime.utcnow().isoformat()
        })


# Example usage in worker watcher
if __name__ == "__main__":
    # Initialize observability
    obs_manager = ObservabilityManager(
        service_name="agent-orchestrator",
        worker_name="marie",
        otlp_endpoint="localhost:4317"
    )

    task_tracer = TaskTracer(obs_manager)

    # Example: Trace task creation
    with obs_manager.trace_task("task-123", "process_document") as span:
        context = task_tracer.trace_task_creation(
            task_id="task-123",
            task_type="document_analysis",
            payload={"doc_id": "doc-456"}
        )

        # Save context to task file for propagation
        task_file = Path("/shared/tasks/marie/task-123.json")
        obs_manager.inject_trace_context(task_file, context)

        # Simulate processing
        time.sleep(0.1)

        # Complete task
        task_tracer.trace_task_completion("task-123", 0.1, success=True)