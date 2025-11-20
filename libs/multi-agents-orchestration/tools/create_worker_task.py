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
