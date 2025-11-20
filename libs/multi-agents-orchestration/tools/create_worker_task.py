# #!/usr/bin/env python3
# """
# Worker task creator for CodeHornets AI orchestrator.
# Creates task files for worker agents to process.
# """

# import argparse
# import json
# import sys
# from datetime import datetime
# from pathlib import Path
# from typing import Dict, List, Optional
# import uuid

# SHARED_DIR = Path("/workspace/shared")
# TASKS_DIR = SHARED_DIR / "tasks"


# def get_timestamp() -> str:
#     """Get ISO-8601 formatted timestamp."""
#     return datetime.utcnow().isoformat() + "Z"


# def generate_task_id() -> str:
#     """Generate a unique task ID."""
#     return f"task-{uuid.uuid4().hex[:12]}"


# def create_task(
#     worker: str,
#     title: str,
#     description: str,
#     priority: str = "medium",
#     dependencies: Optional[List[str]] = None,
#     estimated_duration: str = "30m",
#     task_id: Optional[str] = None,
#     metadata: Optional[Dict] = None
# ) -> Dict:
#     """
#     Create a task for a worker agent.

#     Args:
#         worker: Worker name (marie, anga, or fabien)
#         title: Task title
#         description: Detailed task description
#         priority: Task priority (high, medium, low)
#         dependencies: List of task IDs this task depends on
#         estimated_duration: Estimated time to complete (e.g., "30m", "2h", "1d")
#         task_id: Optional custom task ID (auto-generated if not provided)
#         metadata: Optional additional metadata

#     Returns:
#         Task dictionary
#     """
#     if worker not in ["marie", "anga", "fabien"]:
#         raise ValueError(f"Invalid worker: {worker}. Must be one of: marie, anga, fabien")

#     if priority not in ["high", "medium", "low"]:
#         raise ValueError(f"Invalid priority: {priority}. Must be one of: high, medium, low")

#     if not task_id:
#         task_id = generate_task_id()

#     task = {
#         "task_id": task_id,
#         "title": title,
#         "description": description,
#         "priority": priority,
#         "dependencies": dependencies or [],
#         "estimated_duration": estimated_duration,
#         "created_at": get_timestamp(),
#         "status": "pending",
#         "assigned_to": worker,
#         "metadata": metadata or {}
#     }

#     return task


# def write_task_file(worker: str, task: Dict) -> Path:
#     """
#     Write a task to the worker's task directory.

#     Args:
#         worker: Worker name
#         task: Task dictionary

#     Returns:
#         Path to created task file
#     """
#     task_dir = TASKS_DIR / worker
#     task_dir.mkdir(parents=True, exist_ok=True)

#     # Create filename with timestamp and task_id
#     timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
#     task_id = task["task_id"]
#     filename = f"task_{timestamp}_{task_id}.json"
#     task_file = task_dir / filename

#     with open(task_file, "w") as f:
#         json.dump(task, f, indent=2)

#     return task_file


# def main():
#     """Main CLI interface."""
#     parser = argparse.ArgumentParser(
#         description="Create tasks for CodeHornets AI worker agents"
#     )
#     parser.add_argument(
#         "worker",
#         choices=["marie", "anga", "fabien"],
#         help="Worker agent to assign the task to"
#     )
#     parser.add_argument(
#         "title",
#         help="Task title"
#     )
#     parser.add_argument(
#         "description",
#         help="Detailed task description"
#     )
#     parser.add_argument(
#         "--priority",
#         choices=["high", "medium", "low"],
#         default="medium",
#         help="Task priority (default: medium)"
#     )
#     parser.add_argument(
#         "--dependencies",
#         nargs="*",
#         help="Task IDs this task depends on"
#     )
#     parser.add_argument(
#         "--duration",
#         default="30m",
#         help="Estimated duration (e.g., '30m', '2h', '1d')"
#     )
#     parser.add_argument(
#         "--task-id",
#         help="Custom task ID (auto-generated if not provided)"
#     )
#     parser.add_argument(
#         "--json",
#         action="store_true",
#         help="Output task as JSON"
#     )

#     args = parser.parse_args()

#     try:
#         # Create the task
#         task = create_task(
#             worker=args.worker,
#             title=args.title,
#             description=args.description,
#             priority=args.priority,
#             dependencies=args.dependencies,
#             estimated_duration=args.duration,
#             task_id=args.task_id
#         )

#         # Write to file
#         task_file = write_task_file(args.worker, task)

#         # Output
#         if args.json:
#             print(json.dumps(task, indent=2))
#         else:
#             print(f"✓ Task created successfully")
#             print(f"  Worker: {args.worker}")
#             print(f"  Task ID: {task['task_id']}")
#             print(f"  Title: {task['title']}")
#             print(f"  Priority: {task['priority']}")
#             print(f"  File: {task_file}")

#     except Exception as e:
#         print(f"✗ Error creating task: {e}", file=sys.stderr)
#         sys.exit(1)


# if __name__ == "__main__":
#     main()



#!/usr/bin/env python3
"""
Hook command: create a task + trigger for a worker.

Intended to be called from a Claude Code hook:

  "command": "python3 /tools/create_worker_task.py anga"

It *can* read the hook input JSON from stdin if you want in the future
(e.g. to pass the last response), but for a basic test we just ignore stdin.
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print("Usage: create_worker_task.py <worker_name>", file=sys.stderr)
        sys.exit(1)

    worker = sys.argv[1]

    # Paths come from docker-compose env
    trigger_root = Path(os.environ.get("TRIGGER_DIR", "/shared/triggers"))
    tasks_root = Path("/tasks")  # orchestrator has ./shared/tasks:/tasks

    worker_task_dir = tasks_root / worker
    worker_trigger_dir = trigger_root / worker

    worker_task_dir.mkdir(parents=True, exist_ok=True)
    worker_trigger_dir.mkdir(parents=True, exist_ok=True)

    # OPTIONAL: If you want to inspect the hook input, you can uncomment this:
    # try:
    #     hook_input = json.load(sys.stdin)
    # except Exception:
    #     hook_input = {}

    # Simple unique ID
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    task_id = f"from-orchestrator-{worker}-{ts}"

    task_payload = {
        "task_id": task_id,
        "from": "orchestrator",
        "worker": worker,
        "prompt": (
            "You are the worker agent '{worker}'. "
            "This task was triggered by the orchestrator Stop hook. "
            "For test purposes, just respond with a short message describing "
            "that you received the task and processed it successfully."
        ),
        "meta": {
            "source": "hooks-test",
            "timestamp": ts,
        },
    }

    task_path = worker_task_dir / f"{task_id}.json"
    task_path.write_text(json.dumps(task_payload, indent=2), encoding="utf-8")

    # Trigger file following your doc comment:
    # /shared/triggers/{worker}/task-{id}.trigger
    trigger_path = worker_trigger_dir / f"task-{task_id}.trigger"
    trigger_path.touch()

    print(
        f"[hook:create_worker_task] Created task {task_id} for {worker} at {task_path}",
        file=sys.stderr,
    )
    print(
        f"[hook:create_worker_task] Created trigger {trigger_path}",
        file=sys.stderr,
    )

    # Immediately wake the worker agent (event-driven notification)
    # Use automation container which has proper Docker permissions
    wake_message = f"New task created: {task_id}. Check /tasks/{worker}/ for details."
    try:
        result = subprocess.run(
            [
                "docker", "exec", "codehornets-svc-automation",
                "bash", "/tools/wake_worker.sh", worker, wake_message
            ],
            capture_output=True,
            text=True,
            timeout=15  # Prevent hanging if wake script has issues
        )

        if result.returncode == 0:
            print(
                f"[hook:create_worker_task] Successfully notified {worker} worker",
                file=sys.stderr,
            )
        else:
            # Log warning but don't fail task creation
            print(
                f"[hook:create_worker_task] Warning: Failed to wake {worker} worker "
                f"(exit code: {result.returncode}). Worker will detect task via polling.",
                file=sys.stderr,
            )
            if result.stderr:
                print(f"[hook:create_worker_task] Wake error: {result.stderr.strip()}", file=sys.stderr)

    except subprocess.TimeoutExpired:
        print(
            f"[hook:create_worker_task] Warning: wake_worker.sh timed out for {worker}. "
            f"Worker will detect task via polling.",
            file=sys.stderr,
        )
    except Exception as e:
        # Graceful degradation - task is created, just notification failed
        print(
            f"[hook:create_worker_task] Warning: Could not wake {worker} worker: {e}. "
            f"Worker will detect task via polling.",
            file=sys.stderr,
        )

    # Exit 0 so Claude Code treats this as a successful hook
    sys.exit(0)


if __name__ == "__main__":
    main()
