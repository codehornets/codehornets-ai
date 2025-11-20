#!/usr/bin/env python3
"""
Archive completed tasks based on their result status.
Moves tasks from active queue to archive with status marking.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
import shutil

# Paths
SHARED_DIR = Path("/workspace/shared") if Path("/workspace/shared").exists() else Path("shared")
TASKS_DIR = SHARED_DIR / "tasks"
RESULTS_DIR = SHARED_DIR / "results"
ARCHIVE_DIR = SHARED_DIR / "archive"

WORKERS = ["marie", "anga", "fabien"]

def log(message: str):
    """Log with timestamp."""
    print(f"[{datetime.now().isoformat()}] {message}", flush=True)


def archive_task(worker: str, task_id: str, status: str = "completed") -> bool:
    """
    Archive a completed task.

    Args:
        worker: Worker name (marie, anga, fabien)
        task_id: Task ID to archive
        status: Status (success, failed, completed)

    Returns:
        True if archived successfully
    """
    try:
        task_file = TASKS_DIR / worker / f"{task_id}.json"
        result_file = RESULTS_DIR / worker / f"{task_id}-result.json"

        if not task_file.exists():
            log(f"Task file not found: {task_file}")
            return False

        # Read task
        with open(task_file, "r") as f:
            task_data = json.load(f)

        # Read result if exists
        result_data = None
        if result_file.exists():
            with open(result_file, "r") as f:
                result_data = json.load(f)

        # Determine final status
        final_status = status
        if result_data:
            result_status = result_data.get("status", "unknown")
            if result_status in ["complete", "completed", "success"]:
                final_status = "success"
            elif result_status in ["failed", "error"]:
                final_status = "failed"

        # Create archive directories
        archive_worker_dir = ARCHIVE_DIR / worker / final_status
        archive_worker_dir.mkdir(parents=True, exist_ok=True)

        # Archive task
        archive_task_file = archive_worker_dir / f"{task_id}.json"
        task_data["archived_at"] = datetime.now().isoformat()
        task_data["archive_status"] = final_status

        with open(archive_task_file, "w") as f:
            json.dump(task_data, f, indent=2)

        # Archive result if exists
        if result_data:
            archive_result_file = archive_worker_dir / f"{task_id}-result.json"
            result_data["archived_at"] = datetime.now().isoformat()

            with open(archive_result_file, "w") as f:
                json.dump(result_data, f, indent=2)

        # Remove from active queue
        task_file.unlink()
        log(f"✓ Archived task {task_id} for {worker} as {final_status}")

        return True

    except Exception as e:
        log(f"✗ Error archiving task {task_id}: {e}")
        return False


def archive_completed_tasks(worker: str = None) -> dict:
    """
    Archive all completed tasks for a worker or all workers.

    Args:
        worker: Specific worker name, or None for all workers

    Returns:
        Dict with archive statistics
    """
    stats = {
        "total": 0,
        "success": 0,
        "failed": 0,
        "by_worker": {}
    }

    workers_to_check = [worker] if worker else WORKERS

    for w in workers_to_check:
        worker_stats = {"total": 0, "success": 0, "failed": 0}

        tasks_dir = TASKS_DIR / w
        results_dir = RESULTS_DIR / w

        if not tasks_dir.exists():
            continue

        # Find all tasks
        task_files = list(tasks_dir.glob("*.json"))

        for task_file in task_files:
            task_id = task_file.stem
            result_file = results_dir / f"{task_id}-result.json"

            # Only archive if result exists
            if result_file.exists():
                with open(result_file, "r") as f:
                    result_data = json.load(f)

                result_status = result_data.get("status", "unknown")

                if result_status in ["complete", "completed", "success"]:
                    status = "success"
                elif result_status in ["failed", "error"]:
                    status = "failed"
                else:
                    continue  # Skip unknown status

                if archive_task(w, task_id, status):
                    worker_stats["total"] += 1
                    worker_stats[status] += 1

        if worker_stats["total"] > 0:
            stats["by_worker"][w] = worker_stats
            stats["total"] += worker_stats["total"]
            stats["success"] += worker_stats["success"]
            stats["failed"] += worker_stats["failed"]

    return stats


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Archive completed tasks")
    parser.add_argument("worker", nargs="?", help="Worker name (marie, anga, fabien) or omit for all")
    parser.add_argument("--task-id", help="Specific task ID to archive")
    parser.add_argument("--status", choices=["success", "failed", "completed"],
                        default="completed", help="Archive status")
    parser.add_argument("--auto", action="store_true",
                        help="Automatically archive all completed tasks")

    args = parser.parse_args()

    if args.task_id and args.worker:
        # Archive specific task
        success = archive_task(args.worker, args.task_id, args.status)
        sys.exit(0 if success else 1)

    elif args.auto or args.worker:
        # Archive all completed tasks
        stats = archive_completed_tasks(args.worker)

        log("Archive Statistics:")
        log(f"  Total: {stats['total']} tasks")
        log(f"  Success: {stats['success']}")
        log(f"  Failed: {stats['failed']}")

        for worker, worker_stats in stats.get("by_worker", {}).items():
            log(f"  {worker}: {worker_stats['total']} tasks "
                f"({worker_stats['success']} success, {worker_stats['failed']} failed)")

        sys.exit(0)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
