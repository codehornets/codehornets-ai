#!/usr/bin/env python3
"""
Agent Activation Wrapper - Event-Driven Worker System

Zero CPU when idle, instant wakeup on task arrival.
Supports inotify (Linux) and Redis pub/sub activation.

Usage:
    python3 activation_wrapper.py <worker_name> [--mode inotify|redis]

Environment Variables:
    ACTIVATION_MODE: inotify (default) or redis
    REDIS_URL: redis://host:port (for redis mode)
    TASK_DIR: /tasks (default)
    RESULT_DIR: /results (default)
    HEARTBEAT_INTERVAL: 10 (seconds)
"""

import os
import sys
import subprocess
import signal
import json
import time
import argparse
import shutil
from pathlib import Path
from datetime import datetime
from queue import Queue, Empty
from threading import Thread, Lock
import enum

# Optional imports (install if needed)
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("⚠️ watchdog not available, install with: pip install watchdog")

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️ redis not available, install with: pip install redis")


class TaskState(enum.Enum):
    """Task lifecycle states"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class HeartbeatWorker(Thread):
    """Sends periodic heartbeats to indicate worker is alive"""

    def __init__(self, worker_name, interval=10):
        super().__init__(daemon=True)
        self.worker_name = worker_name
        self.interval = interval
        self.heartbeat_dir = Path(os.getenv("HEARTBEAT_DIR", "/shared/heartbeats"))
        self.heartbeat_dir.mkdir(parents=True, exist_ok=True)
        self.heartbeat_file = self.heartbeat_dir / f"{worker_name}.json"
        self.shutdown = False
        self.activator = None  # Set by parent

    def run(self):
        """Heartbeat loop"""
        while not self.shutdown:
            try:
                heartbeat = {
                    "worker": self.worker_name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "current_task": getattr(self.activator, 'current_task', None),
                    "queue_size": self.activator.task_queue.qsize() if self.activator else 0,
                    "status": "alive"
                }

                # Atomic write
                temp_file = self.heartbeat_file.with_suffix('.tmp')
                temp_file.write_text(json.dumps(heartbeat, indent=2))
                shutil.move(str(temp_file), str(self.heartbeat_file))

            except Exception as e:
                print(f"⚠️ Heartbeat error: {e}")

            time.sleep(self.interval)


class AgentActivator:
    """
    Event-driven agent activation system.

    Listens for task files and executes them with Claude CLI subprocess.
    Supports both inotify (filesystem events) and Redis pub/sub.
    """

    def __init__(self, worker_name, mode='inotify'):
        self.worker_name = worker_name
        self.mode = mode

        # Directories
        self.task_dir = Path(os.getenv("TASK_DIR", "/tasks"))
        self.result_dir = Path(os.getenv("RESULT_DIR", "/results"))
        self.result_dir.mkdir(parents=True, exist_ok=True)

        # State
        self.task_queue = Queue()
        self.current_task = None
        self.state_lock = Lock()
        self.task_states = {}  # task_id -> TaskState
        self.claude_process = None
        self.shutdown = False

        # Metrics
        self.tasks_processed = 0
        self.tasks_failed = 0
        self.start_time = time.time()

        # Heartbeat
        self.heartbeat = HeartbeatWorker(worker_name)
        self.heartbeat.activator = self
        self.heartbeat.start()

        # Signal handlers
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        signal.signal(signal.SIGINT, self.handle_shutdown)

        print(f"✨ {self.worker_name}: Activator initialized (mode: {self.mode})")

    def handle_shutdown(self, signum, frame):
        """Graceful shutdown on SIGTERM/SIGINT"""
        print(f"\n🛑 {self.worker_name}: Shutdown signal received")
        self.shutdown = True
        self.heartbeat.shutdown = True

        if self.claude_process and self.claude_process.poll() is None:
            print(f"⏳ Waiting for current task to complete...")
            try:
                self.claude_process.wait(timeout=50)
                print(f"✅ Current task completed")
            except subprocess.TimeoutExpired:
                print(f"⚠️ Timeout, killing current task")
                self.claude_process.kill()

        # Print final stats
        uptime = time.time() - self.start_time
        print(f"📊 Final stats:")
        print(f"   - Uptime: {uptime:.1f}s")
        print(f"   - Tasks processed: {self.tasks_processed}")
        print(f"   - Tasks failed: {self.tasks_failed}")
        print(f"   - Queue remaining: {self.task_queue.qsize()}")

        sys.exit(0)

    def queue_task(self, task_path):
        """Add task to queue (thread-safe)"""
        try:
            task_path = Path(task_path)

            # Ignore temp files
            if task_path.name.startswith('.tmp_'):
                return

            if not task_path.exists():
                print(f"⚠️ Task file disappeared: {task_path}")
                return

            task_data = json.loads(task_path.read_text())
            task_id = task_data.get('task_id', task_path.stem)

            with self.state_lock:
                if task_id not in self.task_states:
                    self.task_states[task_id] = TaskState.PENDING
                    self.task_queue.put((task_id, task_path))
                    print(f"📥 {self.worker_name}: Queued {task_id} (queue: {self.task_queue.qsize()})")
                else:
                    print(f"⚠️ {self.worker_name}: Duplicate task {task_id} ignored")

        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in {task_path}: {e}")
        except Exception as e:
            print(f"❌ Error queueing task: {e}")

    def process_task(self, task_id, task_path):
        """Execute a single task with Claude CLI"""
        start_time = time.time()

        try:
            print(f"🔔 {self.worker_name}: Processing {task_id}")

            with self.state_lock:
                self.task_states[task_id] = TaskState.PROCESSING
                self.current_task = task_id

            # Read task
            task_data = json.loads(Path(task_path).read_text())
            description = task_data.get('description', '')
            timeout = task_data.get('timeout', 600)

            # Execute with Claude CLI
            self.claude_process = subprocess.Popen(
                ["claude", "-p", description],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(self.task_dir.parent)
            )

            try:
                stdout, stderr = self.claude_process.communicate(timeout=timeout)
                exit_code = self.claude_process.returncode

                # Write result atomically
                result = {
                    "task_id": task_id,
                    "worker": self.worker_name,
                    "status": "completed" if exit_code == 0 else "failed",
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code,
                    "duration_seconds": time.time() - start_time,
                    "timestamp": datetime.utcnow().isoformat()
                }

                # Atomic write
                result_temp = self.result_dir / f".tmp_{task_id}.json"
                result_temp.write_text(json.dumps(result, indent=2))
                result_final = self.result_dir / f"{task_id}.json"
                shutil.move(str(result_temp), str(result_final))

                # Clean up task file
                Path(task_path).unlink(missing_ok=True)

                with self.state_lock:
                    self.task_states[task_id] = TaskState.COMPLETED
                    self.current_task = None

                self.tasks_processed += 1
                duration = time.time() - start_time
                print(f"✅ {self.worker_name}: Completed {task_id} ({duration:.1f}s)")

            except subprocess.TimeoutExpired:
                print(f"⏰ {self.worker_name}: Task {task_id} timed out ({timeout}s)")
                self.claude_process.kill()

                with self.state_lock:
                    self.task_states[task_id] = TaskState.FAILED
                    self.current_task = None

                self.tasks_failed += 1

        except Exception as e:
            print(f"❌ {self.worker_name}: Task {task_id} failed: {e}")

            with self.state_lock:
                self.task_states[task_id] = TaskState.FAILED
                self.current_task = None

            self.tasks_failed += 1

        finally:
            self.claude_process = None

    def process_queue(self):
        """Worker thread that processes queue sequentially"""
        print(f"🔄 {self.worker_name}: Queue processor started")

        while not self.shutdown:
            try:
                task_id, task_path = self.task_queue.get(timeout=1)

                if not Path(task_path).exists():
                    print(f"⚠️ Task file disappeared: {task_path}")
                    continue

                self.process_task(task_id, task_path)
                self.task_queue.task_done()

            except Empty:
                continue  # Timeout, retry
            except Exception as e:
                print(f"❌ Queue processor error: {e}")
                continue

    def run_inotify(self):
        """inotify-based activation (Linux filesystem events)"""
        if not WATCHDOG_AVAILABLE:
            print("❌ watchdog not installed, falling back to polling")
            self.run_polling()
            return

        class TaskWatcher(FileSystemEventHandler):
            def __init__(self, activator):
                self.activator = activator

            def on_created(self, event):
                if not event.is_directory and event.src_path.endswith('.json'):
                    self.activator.queue_task(event.src_path)

        # Start worker thread
        worker_thread = Thread(target=self.process_queue, daemon=True)
        worker_thread.start()

        # Start filesystem watcher
        observer = Observer()
        observer.schedule(TaskWatcher(self), str(self.task_dir), recursive=False)
        observer.start()

        print(f"🎧 {self.worker_name}: inotify listener active on {self.task_dir}")
        print(f"💤 {self.worker_name}: Idle (0% CPU until task arrives)")

        try:
            while not self.shutdown:
                observer.join(1)
        except KeyboardInterrupt:
            pass
        finally:
            observer.stop()
            observer.join()
            worker_thread.join(timeout=5)

    def run_redis(self):
        """Redis pub/sub activation"""
        if not REDIS_AVAILABLE:
            print("❌ redis not installed, falling back to inotify")
            self.run_inotify()
            return

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

        try:
            r = redis.from_url(redis_url, socket_timeout=5)
            r.ping()  # Test connection
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            print(f"⚠️ Falling back to inotify")
            self.run_inotify()
            return

        # Start worker thread
        worker_thread = Thread(target=self.process_queue, daemon=True)
        worker_thread.start()

        # Subscribe to activation channel
        pubsub = r.pubsub()
        channel = f"activate:{self.worker_name}"
        pubsub.subscribe(channel)

        print(f"🎧 {self.worker_name}: Redis listener on '{channel}'")
        print(f"💤 {self.worker_name}: Idle (0% CPU until signal)")

        try:
            for message in pubsub.listen():
                if self.shutdown:
                    break

                if message['type'] == 'message':
                    task_path = message['data'].decode()
                    if Path(task_path).exists():
                        self.queue_task(task_path)
                    else:
                        print(f"⚠️ Signaled task missing: {task_path}")

        except redis.ConnectionError as e:
            print(f"❌ Redis connection lost: {e}")
            print(f"⚠️ Falling back to inotify")
            self.run_inotify()

        finally:
            pubsub.unsubscribe(channel)
            worker_thread.join(timeout=5)

    def run_polling(self):
        """Fallback: polling mode (least efficient)"""
        print(f"🔄 {self.worker_name}: Polling mode (checking every 1s)")

        # Start worker thread
        worker_thread = Thread(target=self.process_queue, daemon=True)
        worker_thread.start()

        try:
            while not self.shutdown:
                # Scan for new tasks
                for task_file in self.task_dir.glob("*.json"):
                    if not task_file.name.startswith('.tmp_'):
                        self.queue_task(task_file)

                time.sleep(1)  # Poll interval

        finally:
            worker_thread.join(timeout=5)

    def start(self):
        """Start activation system"""
        print(f"🚀 {self.worker_name}: Starting in {self.mode} mode")

        if self.mode == "redis":
            self.run_redis()
        elif self.mode == "inotify":
            self.run_inotify()
        elif self.mode == "polling":
            self.run_polling()
        else:
            print(f"❌ Unknown mode: {self.mode}")
            sys.exit(1)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Agent Activation Wrapper")
    parser.add_argument("worker_name", help="Worker name (marie, anga, fabien)")
    parser.add_argument("--mode", choices=['inotify', 'redis', 'polling'],
                       default=os.getenv("ACTIVATION_MODE", "inotify"),
                       help="Activation mode")

    args = parser.parse_args()

    print("═" * 60)
    print(f"  Agent Activation Wrapper v1.0")
    print(f"  Worker: {args.worker_name}")
    print(f"  Mode: {args.mode}")
    print("═" * 60)

    activator = AgentActivator(args.worker_name, args.mode)
    activator.start()


if __name__ == "__main__":
    main()
