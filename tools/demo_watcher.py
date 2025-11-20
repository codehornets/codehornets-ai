#!/usr/bin/env python3
"""
Demo script for watcher system.

Creates sample tasks and demonstrates the complete workflow.

Usage:
    python demo_watcher.py --setup     # Create directory structure
    python demo_watcher.py --task      # Create sample task
    python demo_watcher.py --batch 10  # Create batch of tasks
    python demo_watcher.py --status    # Show system status
"""

import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from typing import List


def setup_directories(base_path: Path = Path("/tmp/watcher_demo")):
    """Create demo directory structure."""
    print("Setting up demo directories...")

    dirs = [
        base_path / "tasks" / "marie",
        base_path / "tasks" / "anga",
        base_path / "tasks" / "fabien",
        base_path / "triggers" / "marie",
        base_path / "triggers" / "anga",
        base_path / "triggers" / "fabien",
        base_path / "triggers" / "orchestrator",
        base_path / "results" / "marie",
        base_path / "results" / "anga",
        base_path / "results" / "fabien",
        base_path / "heartbeats",
        base_path / "dlq" / "marie",
        base_path / "dlq" / "anga",
        base_path / "dlq" / "fabien",
    ]

    for directory in dirs:
        directory.mkdir(parents=True, exist_ok=True)

    print(f"✅ Directories created at: {base_path}")
    print("\nExport environment variable:")
    print(f'export TASK_DIR="{base_path}/tasks"')
    print(f'export TRIGGER_DIR="{base_path}/triggers"')
    print(f'export RESULT_DIR="{base_path}/results"')
    print(f'export HEARTBEAT_DIR="{base_path}/heartbeats"')
    print(f'export DLQ_DIR="{base_path}/dlq"')


def create_task(
    worker: str,
    task_id: str,
    description: str,
    base_path: Path = Path("/tmp/watcher_demo"),
):
    """Create a sample task file."""
    task_dir = base_path / "tasks" / worker
    task_file = task_dir / f"{task_id}.json"

    task_data = {
        "task_id": task_id,
        "worker": worker,
        "description": description,
        "created_at": datetime.utcnow().isoformat(),
        "timeout": 60,
        "priority": "normal",
        "metadata": {
            "demo": True,
            "source": "demo_watcher.py",
        },
    }

    task_file.write_text(json.dumps(task_data, indent=2))
    print(f"✅ Created task: {task_file}")
    return task_file


def create_batch_tasks(
    worker: str, count: int, base_path: Path = Path("/tmp/watcher_demo")
):
    """Create a batch of sample tasks."""
    print(f"Creating {count} tasks for {worker}...")

    tasks: List[Path] = []
    for i in range(count):
        task_id = f"batch-{worker}-{i:03d}-{int(time.time())}"
        description = f"Demo task {i+1} of {count} for {worker}"

        task_file = create_task(worker, task_id, description, base_path)
        tasks.append(task_file)

    print(f"✅ Created {len(tasks)} tasks")
    return tasks


def show_status(base_path: Path = Path("/tmp/watcher_demo")):
    """Show system status."""
    print("\n" + "=" * 70)
    print("WATCHER SYSTEM STATUS")
    print("=" * 70)

    workers = ["marie", "anga", "fabien"]

    # Task queue status
    print("\n📋 TASK QUEUES:")
    for worker in workers:
        task_dir = base_path / "tasks" / worker
        task_count = len(list(task_dir.glob("*.json"))) if task_dir.exists() else 0
        print(f"  {worker:10s}: {task_count:3d} pending tasks")

    # Result status
    print("\n✅ RESULTS:")
    for worker in workers:
        result_dir = base_path / "results" / worker
        result_count = (
            len(list(result_dir.glob("*.json"))) if result_dir.exists() else 0
        )
        print(f"  {worker:10s}: {result_count:3d} completed tasks")

    # DLQ status
    print("\n❌ DEAD LETTER QUEUE:")
    for worker in workers:
        dlq_dir = base_path / "dlq" / worker
        dlq_count = len(list(dlq_dir.glob("*.json"))) if dlq_dir.exists() else 0
        print(f"  {worker:10s}: {dlq_count:3d} failed tasks")

    # Worker health
    print("\n💓 WORKER HEALTH:")
    for worker in workers:
        heartbeat_file = base_path / "heartbeats" / f"{worker}.json"

        if heartbeat_file.exists():
            try:
                heartbeat = json.loads(heartbeat_file.read_text())
                status = heartbeat.get("status", "unknown")
                timestamp = heartbeat.get("timestamp", "")
                queue_size = heartbeat.get("queue_size", 0)

                print(f"  {worker:10s}: {status:8s} (queue: {queue_size})")
                print(f"               Last seen: {timestamp}")
            except Exception as e:
                print(f"  {worker:10s}: ERROR - {e}")
        else:
            print(f"  {worker:10s}: OFFLINE")

    print("\n" + "=" * 70)


def show_example_usage():
    """Show example usage instructions."""
    print("\n" + "=" * 70)
    print("EXAMPLE USAGE")
    print("=" * 70)

    print("\n1. Setup directories:")
    print("   python demo_watcher.py --setup")

    print("\n2. Export environment variables:")
    print('   export TASK_DIR="/tmp/watcher_demo/tasks"')
    print('   export TRIGGER_DIR="/tmp/watcher_demo/triggers"')
    print('   export RESULT_DIR="/tmp/watcher_demo/results"')
    print('   export HEARTBEAT_DIR="/tmp/watcher_demo/heartbeats"')
    print('   export DLQ_DIR="/tmp/watcher_demo/dlq"')

    print("\n3. Start workers (in separate terminals):")
    print("   python worker_watcher.py marie")
    print("   python worker_watcher.py anga")
    print("   python worker_watcher.py fabien")

    print("\n4. Start orchestrator listener:")
    print("   python orchestrator_listener.py")

    print("\n5. Create sample task:")
    print('   python demo_watcher.py --task marie "Analyze student progress"')

    print("\n6. Create batch tasks:")
    print("   python demo_watcher.py --batch 10 --worker marie")

    print("\n7. Monitor status:")
    print("   python demo_watcher.py --status")

    print("\n8. Watch for completions:")
    print("   watch -n 1 'python demo_watcher.py --status'")

    print("\n" + "=" * 70)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Demo script for watcher system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("--setup", action="store_true", help="Setup directory structure")
    parser.add_argument("--task", nargs=2, metavar=("WORKER", "DESCRIPTION"), help="Create single task")
    parser.add_argument("--batch", type=int, metavar="COUNT", help="Create batch of tasks")
    parser.add_argument("--worker", default="marie", help="Worker for batch tasks (default: marie)")
    parser.add_argument("--status", action="store_true", help="Show system status")
    parser.add_argument("--base-path", type=Path, default=Path("/tmp/watcher_demo"), help="Base path for demo")
    parser.add_argument("--examples", action="store_true", help="Show example usage")

    args = parser.parse_args()

    # Show examples
    if args.examples:
        show_example_usage()
        return

    # Setup directories
    if args.setup:
        setup_directories(args.base_path)
        return

    # Create single task
    if args.task:
        worker, description = args.task
        task_id = f"demo-{worker}-{int(time.time())}"
        create_task(worker, task_id, description, args.base_path)
        return

    # Create batch tasks
    if args.batch:
        create_batch_tasks(args.worker, args.batch, args.base_path)
        return

    # Show status
    if args.status:
        show_status(args.base_path)
        return

    # No arguments - show help
    parser.print_help()
    print("\nTip: Run with --examples to see detailed usage instructions")


if __name__ == "__main__":
    main()
