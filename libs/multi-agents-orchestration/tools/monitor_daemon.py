#!/usr/bin/env python3
"""
Monitor Daemon - CodeHornets AI System Observer

Continuously monitors the multi-agent system and generates recaps using a local LLM.
Runs every 30 seconds for system health monitoring and automated archiving.

Note: Task notification is now handled immediately via wake_worker.sh when tasks are created.
This daemon focuses on: archiving completed tasks, system health reporting, and periodic recaps.
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import subprocess
import shutil

# Paths
SHARED_DIR = Path("/workspace/shared")
TASKS_DIR = SHARED_DIR / "tasks"
RESULTS_DIR = SHARED_DIR / "results"
HEARTBEAT_DIR = SHARED_DIR / "heartbeats"
TRIGGERS_DIR = SHARED_DIR / "triggers"
ARCHIVE_DIR = SHARED_DIR / "archive"
LOGS_DIR = SHARED_DIR / "watcher-logs"
MONITOR_LOG = LOGS_DIR / "monitor-daemon.log"

WORKERS = ["marie", "anga", "fabien"]

def log(message: str):
    """Log message with timestamp."""
    timestamp = datetime.now().isoformat()
    log_line = f"[{timestamp}] {message}"
    print(log_line, flush=True)

    # Also write to log file
    MONITOR_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(MONITOR_LOG, "a") as f:
        f.write(log_line + "\n")


# Removed: auto_wake_worker() - Workers are now notified immediately via wake_worker.sh
# when tasks are created. This daemon no longer needs to poll for new tasks and wake workers.


def auto_archive_completed_tasks() -> int:
    """
    Automatically archive tasks that have completed results.
    Returns count of tasks archived.
    """
    archived_count = 0

    for worker in WORKERS:
        tasks_dir = TASKS_DIR / worker
        results_dir = RESULTS_DIR / worker

        if not tasks_dir.exists():
            continue

        # Find all tasks
        task_files = list(tasks_dir.glob("*.json"))

        for task_file in task_files:
            task_id = task_file.stem
            # Result files use the same naming as task files (no -result suffix)
            result_file = results_dir / f"{task_id}.json"

            # Only archive if result exists
            if result_file.exists():
                try:
                    # Read result to determine status
                    with open(result_file, "r") as f:
                        result_data = json.load(f)

                    result_status = result_data.get("status", "unknown")

                    # Determine archive status
                    if result_status in ["complete", "completed", "success"]:
                        archive_status = "success"
                    elif result_status in ["failed", "error"]:
                        archive_status = "failed"
                    else:
                        continue  # Skip unknown status

                    # Read task
                    with open(task_file, "r") as f:
                        task_data = json.load(f)

                    # Create archive directory
                    archive_dir = ARCHIVE_DIR / worker / archive_status
                    archive_dir.mkdir(parents=True, exist_ok=True)

                    # Archive task and result with consistent naming
                    archive_task_file = archive_dir / f"{task_id}.json"
                    archive_result_file = archive_dir / f"{task_id}-result.json"

                    task_data["archived_at"] = datetime.now().isoformat()
                    task_data["archive_status"] = archive_status
                    result_data["archived_at"] = datetime.now().isoformat()

                    with open(archive_task_file, "w") as f:
                        json.dump(task_data, f, indent=2)

                    with open(archive_result_file, "w") as f:
                        json.dump(result_data, f, indent=2)

                    # Remove from active queue
                    task_file.unlink()
                    result_file.unlink()

                    log(f"📦 Archived {task_id} for {worker} as {archive_status}")
                    archived_count += 1

                except Exception as e:
                    log(f"⚠️  Error archiving {task_id}: {e}")

    return archived_count


# Removed: create_worker_notification() - Workers are now notified immediately when tasks
# are created via the wake_worker.sh script. Polling-based notification is no longer needed.


def count_files_in_dir(directory: Path, pattern: str = "*") -> int:
    """Count files matching pattern in directory."""
    if not directory.exists():
        return 0
    return len(list(directory.glob(pattern)))


def read_json_file(path: Path) -> Optional[Dict]:
    """Read and parse JSON file."""
    try:
        if not path.exists():
            return None
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        log(f"Error reading {path}: {e}")
        return None


def get_system_snapshot() -> Dict:
    """Collect current system state."""
    snapshot = {
        "timestamp": datetime.now().isoformat(),
        "heartbeats": {},
        "tasks": {},
        "results": {},
        "triggers": {},
        "system_health": "unknown"
    }

    # Collect heartbeats
    for worker in WORKERS + ["orchestrator"]:
        heartbeat_file = HEARTBEAT_DIR / f"{worker}.json"
        heartbeat = read_json_file(heartbeat_file)
        if heartbeat:
            snapshot["heartbeats"][worker] = {
                "status": heartbeat.get("status", "unknown"),
                "last_updated": heartbeat.get("last_updated", "never"),
                "current_task": heartbeat.get("current_task"),
                "tasks_completed": heartbeat.get("tasks_completed", 0)
            }
        else:
            snapshot["heartbeats"][worker] = {"status": "no_heartbeat"}

    # Count pending tasks per worker
    for worker in WORKERS:
        task_dir = TASKS_DIR / worker
        snapshot["tasks"][worker] = count_files_in_dir(task_dir, "*.json")

    # Count results per worker
    for worker in WORKERS:
        result_dir = RESULTS_DIR / worker
        snapshot["results"][worker] = count_files_in_dir(result_dir, "*.json")

    # Count triggers
    for entity in WORKERS + ["orchestrator"]:
        trigger_dir = TRIGGERS_DIR / entity
        snapshot["triggers"][entity] = count_files_in_dir(trigger_dir, "*.trigger")

    # Determine overall system health
    active_workers = sum(1 for w in WORKERS if snapshot["heartbeats"].get(w, {}).get("status") == "active")
    if active_workers == len(WORKERS):
        snapshot["system_health"] = "healthy"
    elif active_workers > 0:
        snapshot["system_health"] = "degraded"
    else:
        snapshot["system_health"] = "down"

    return snapshot


def format_snapshot_for_llm(snapshot: Dict) -> str:
    """Format snapshot data for LLM analysis."""
    lines = [
        "=== CodeHornets AI System Status ===",
        f"Time: {snapshot['timestamp']}",
        f"System Health: {snapshot['system_health'].upper()}",
        "",
        "--- Worker Heartbeats ---"
    ]

    for worker, hb in snapshot["heartbeats"].items():
        status = hb.get("status", "unknown")
        current_task = hb.get("current_task", "none")
        completed = hb.get("tasks_completed", 0)
        lines.append(f"{worker}: {status} | Current: {current_task} | Completed: {completed}")

    lines.extend([
        "",
        "--- Pending Tasks ---"
    ])

    total_tasks = 0
    for worker, count in snapshot["tasks"].items():
        lines.append(f"{worker}: {count} task(s)")
        total_tasks += count

    lines.extend([
        f"Total: {total_tasks} pending task(s)",
        "",
        "--- Completed Results ---"
    ])

    total_results = 0
    for worker, count in snapshot["results"].items():
        lines.append(f"{worker}: {count} result(s)")
        total_results += count

    lines.append(f"Total: {total_results} result(s)")

    return "\n".join(lines)


def call_local_llm(prompt: str, model: str = "llama3.2:1b") -> Optional[str]:
    """
    Call local LLM (Ollama) for analysis via HTTP API.
    Falls back to simple analysis if Ollama is not available.
    """
    import requests

    # Try Ollama API (host machine or ollama service)
    ollama_urls = [
        "http://host.docker.internal:11434",  # Docker Desktop (Mac/Windows)
        "http://172.17.0.1:11434",            # Linux docker0 bridge
        "http://ollama:11434",                # If ollama service exists
        "http://localhost:11434"              # Direct localhost
    ]

    for base_url in ollama_urls:
        try:
            response = requests.post(
                f"{base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()

        except requests.exceptions.RequestException:
            continue
        except Exception as e:
            continue

    # Ollama not available
    return None


def generate_recap(snapshot: Dict) -> str:
    """Generate a recap of the system state."""
    snapshot_text = format_snapshot_for_llm(snapshot)

    # Try LLM analysis
    llm_prompt = f"""Analyze this multi-agent system status and provide a brief 2-sentence recap:

{snapshot_text}

Focus on: system health, task flow (pending → processing → completed), and any issues."""

    llm_recap = call_local_llm(llm_prompt)

    if llm_recap:
        return f"{snapshot_text}\n\n--- AI Recap ---\n{llm_recap}"
    else:
        # Simple rule-based recap
        health = snapshot["system_health"]
        total_tasks = sum(snapshot["tasks"].values())
        total_results = sum(snapshot["results"].values())

        simple_recap = []

        if health == "healthy":
            simple_recap.append("✓ All workers are active.")
        elif health == "degraded":
            inactive = [w for w in WORKERS if snapshot["heartbeats"].get(w, {}).get("status") != "active"]
            simple_recap.append(f"⚠ Some workers inactive: {', '.join(inactive)}")
        else:
            simple_recap.append("✗ System appears down - no active workers.")

        if total_tasks > 0:
            simple_recap.append(f"📋 {total_tasks} task(s) pending.")

        if total_results > 0:
            simple_recap.append(f"✓ {total_results} result(s) available.")

        return f"{snapshot_text}\n\n--- Recap ---\n{' '.join(simple_recap)}"


def main():
    """Main monitoring loop - runs every 30 seconds for health monitoring and archiving."""
    log("Monitor Daemon started")
    log("Monitoring interval: 30 seconds (optimized for event-driven architecture)")
    log("Workers are notified immediately via wake_worker.sh when tasks are created")
    log("")

    iteration = 0

    try:
        while True:
            iteration += 1

            # Collect snapshot
            snapshot = get_system_snapshot()

            # Archive completed tasks on every iteration (now every 30 seconds)
            archived = auto_archive_completed_tasks()
            if archived > 0:
                log(f"📦 Archived {archived} completed task(s)")

            # Generate detailed recap every 10 iterations (5 minutes)
            if iteration % 10 == 0:
                log("=" * 80)
                log(f"SYSTEM RECAP (Iteration {iteration} - {iteration * 30}s)")
                log("=" * 80)
                recap = generate_recap(snapshot)
                log(recap)
                log("=" * 80)
            else:
                # Quick status log every 30 seconds
                health = snapshot["system_health"]
                total_tasks = sum(snapshot["tasks"].values())
                total_results = sum(snapshot["results"].values())
                active_workers = sum(1 for w in WORKERS if snapshot["heartbeats"].get(w, {}).get("status") == "active")
                log(f"[{iteration}] Health: {health} | Active: {active_workers}/{len(WORKERS)} | Tasks: {total_tasks} | Results: {total_results}")

            # Sleep for 30 seconds (optimized from 3 seconds)
            time.sleep(30)

    except KeyboardInterrupt:
        log("Monitor Daemon stopped by user")
    except Exception as e:
        log(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
