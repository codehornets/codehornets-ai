#!/usr/bin/env python3
"""
Hook Watcher - Filesystem-based Hook Activation System

Monitors file triggers and named pipes to enable hooks-based agent communication.
Integrates with Claude Code hooks system for event-driven workflows.

Features:
  - File-based triggers (inotify on Linux)
  - Named pipes for bidirectional IPC
  - Redis pub/sub for cluster-wide events (optional)
  - Heartbeat monitoring
  - Graceful shutdown

Usage:
    python3 hook_watcher.py <worker_name> [--trigger-dir DIR] [--pipe-dir DIR]

Environment Variables:
    TRIGGER_DIR: /shared/triggers (default)
    PIPE_DIR: /shared/pipes (default)
    REDIS_URL: redis://host:port (optional)
    HEARTBEAT_DIR: /shared/heartbeats
    HEARTBEAT_INTERVAL: 10 (seconds)
"""

import os
import sys
import json
import time
import signal
import argparse
import logging
from pathlib import Path
from datetime import datetime
from threading import Thread, Event
from queue import Queue, Empty

# Optional imports
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class HeartbeatWorker(Thread):
    """Sends periodic heartbeats to indicate watcher is alive"""

    def __init__(self, worker_name, interval=10):
        super().__init__(daemon=True)
        self.worker_name = worker_name
        self.interval = interval
        self.heartbeat_dir = Path(os.getenv("HEARTBEAT_DIR", "/shared/heartbeats"))
        self.heartbeat_dir.mkdir(parents=True, exist_ok=True)
        self.heartbeat_file = self.heartbeat_dir / f"{worker_name}-watcher.json"
        self.shutdown = Event()

    def run(self):
        """Heartbeat loop"""
        while not self.shutdown.is_set():
            try:
                heartbeat = {
                    "worker": self.worker_name,
                    "component": "hook_watcher",
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "alive"
                }

                # Atomic write
                temp_file = self.heartbeat_file.with_suffix('.tmp')
                temp_file.write_text(json.dumps(heartbeat, indent=2))
                temp_file.rename(self.heartbeat_file)

            except Exception as e:
                logger.warning(f"Heartbeat error: {e}")

            self.shutdown.wait(self.interval)


class TriggerEventHandler(FileSystemEventHandler):
    """Handles filesystem events for trigger files"""

    def __init__(self, hook_watcher):
        self.watcher = hook_watcher

    def on_created(self, event):
        """Trigger file created"""
        if not event.is_directory and event.src_path.endswith('.trigger'):
            self.watcher.handle_trigger(Path(event.src_path))

    def on_modified(self, event):
        """Trigger file modified (for some filesystems)"""
        if not event.is_directory and event.src_path.endswith('.trigger'):
            self.watcher.handle_trigger(Path(event.src_path))


class HookWatcher:
    """
    Filesystem-based hook activation system.

    Watches trigger files and named pipes to enable hooks-based communication
    between agents. Integrates with Claude Code hooks system.
    """

    def __init__(self, worker_name, trigger_dir=None, pipe_dir=None):
        self.worker_name = worker_name
        self.trigger_dir = Path(trigger_dir or os.getenv("TRIGGER_DIR", "/shared/triggers")) / worker_name
        self.pipe_dir = Path(pipe_dir or os.getenv("PIPE_DIR", "/shared/pipes"))

        # Ensure directories exist
        self.trigger_dir.mkdir(parents=True, exist_ok=True)
        self.pipe_dir.mkdir(parents=True, exist_ok=True)

        # Named pipes
        self.control_pipe = self.pipe_dir / f"{worker_name}-control"
        self.status_pipe = self.pipe_dir / f"{worker_name}-status"

        # State
        self.trigger_queue = Queue()
        self.shutdown = Event()
        self.redis_client = None

        # Statistics
        self.triggers_processed = 0
        self.start_time = time.time()

        # Heartbeat
        self.heartbeat = HeartbeatWorker(worker_name)
        self.heartbeat.start()

        # Signal handlers
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        signal.signal(signal.SIGINT, self.handle_shutdown)

        logger.info(f"✨ {self.worker_name}: Hook watcher initialized")
        logger.info(f"   Trigger directory: {self.trigger_dir}")
        logger.info(f"   Control pipe: {self.control_pipe}")
        logger.info(f"   Status pipe: {self.status_pipe}")

    def handle_shutdown(self, signum, frame):
        """Graceful shutdown"""
        logger.info(f"🛑 {self.worker_name}: Shutdown signal received")
        self.shutdown.set()
        self.heartbeat.shutdown.set()

        # Print stats
        uptime = time.time() - self.start_time
        logger.info(f"📊 Final stats:")
        logger.info(f"   - Uptime: {uptime:.1f}s")
        logger.info(f"   - Triggers processed: {self.triggers_processed}")

        sys.exit(0)

    def setup_redis(self):
        """Setup Redis pub/sub (optional)"""
        redis_url = os.getenv("REDIS_URL")
        if not redis_url or not REDIS_AVAILABLE:
            return False

        try:
            self.redis_client = redis.from_url(redis_url, socket_timeout=5)
            self.redis_client.ping()
            logger.info(f"✅ Redis connected: {redis_url}")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}")
            return False

    def handle_trigger(self, trigger_path: Path):
        """Process trigger file"""
        try:
            trigger_name = trigger_path.stem
            logger.info(f"🔔 Trigger detected: {trigger_name}")

            # Read trigger metadata (optional)
            trigger_data = {}
            if trigger_path.stat().st_size > 0:
                try:
                    trigger_data = json.loads(trigger_path.read_text())
                except json.JSONDecodeError:
                    pass

            # Extract trigger type from filename
            # Format: {type}-{id}.trigger (e.g., task-001.trigger, result-001.trigger)
            parts = trigger_name.split('-', 1)
            trigger_type = parts[0] if len(parts) > 0 else "unknown"
            trigger_id = parts[1] if len(parts) > 1 else ""

            # Publish to Redis (if available)
            if self.redis_client:
                try:
                    event = {
                        "worker": self.worker_name,
                        "type": trigger_type,
                        "id": trigger_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        **trigger_data
                    }
                    self.redis_client.publish(f"hooks:{self.worker_name}", json.dumps(event))
                    logger.debug(f"📡 Published to Redis: hooks:{self.worker_name}")
                except Exception as e:
                    logger.warning(f"⚠️ Redis publish failed: {e}")

            # Write to status pipe (non-blocking)
            if self.status_pipe.exists():
                try:
                    with open(self.status_pipe, 'w', opener=lambda path, flags: os.open(path, flags | os.O_NONBLOCK)) as pipe:
                        pipe.write(json.dumps({
                            "event": "trigger",
                            "type": trigger_type,
                            "id": trigger_id,
                            "timestamp": datetime.utcnow().isoformat()
                        }) + '\n')
                        pipe.flush()
                    logger.debug(f"📤 Status sent to pipe")
                except (BlockingIOError, OSError) as e:
                    logger.debug(f"Pipe write skipped: {e}")

            # Clean up trigger file
            trigger_path.unlink(missing_ok=True)
            self.triggers_processed += 1

            logger.info(f"✅ Trigger processed: {trigger_name} (total: {self.triggers_processed})")

        except Exception as e:
            logger.error(f"❌ Error processing trigger {trigger_path}: {e}")

    def watch_control_pipe(self):
        """Monitor control pipe for commands (blocking read in thread)"""
        logger.info(f"🎧 Listening on control pipe: {self.control_pipe}")

        try:
            while not self.shutdown.is_set():
                try:
                    with open(self.control_pipe, 'r') as pipe:
                        while not self.shutdown.is_set():
                            line = pipe.readline()
                            if line:
                                try:
                                    command = json.loads(line.strip())
                                    logger.info(f"📥 Control command: {command}")
                                    # Handle commands (future: pause, resume, reload, etc.)
                                    self.handle_control_command(command)
                                except json.JSONDecodeError:
                                    logger.warning(f"Invalid control command: {line}")
                except FileNotFoundError:
                    logger.debug("Control pipe not found, retrying...")
                    time.sleep(5)
                except Exception as e:
                    logger.error(f"Control pipe error: {e}")
                    time.sleep(5)
        except Exception as e:
            logger.error(f"Control pipe thread failed: {e}")

    def handle_control_command(self, command: dict):
        """Handle control commands from pipe"""
        cmd_type = command.get('command')

        if cmd_type == 'status':
            # Return current status
            status = {
                "worker": self.worker_name,
                "uptime": time.time() - self.start_time,
                "triggers_processed": self.triggers_processed,
                "status": "running"
            }
            logger.info(f"Status: {status}")

        elif cmd_type == 'reload':
            logger.info("Reload requested (not implemented)")

        elif cmd_type == 'shutdown':
            logger.info("Shutdown requested via control pipe")
            self.shutdown.set()

        else:
            logger.warning(f"Unknown command: {cmd_type}")

    def watch_triggers_inotify(self):
        """Watch trigger directory with inotify (Linux)"""
        if not WATCHDOG_AVAILABLE:
            logger.error("❌ watchdog not installed, falling back to polling")
            self.watch_triggers_polling()
            return

        observer = Observer()
        observer.schedule(TriggerEventHandler(self), str(self.trigger_dir), recursive=False)
        observer.start()

        logger.info(f"🎧 inotify listener active on {self.trigger_dir}")
        logger.info(f"💤 Idle (0% CPU until trigger arrives)")

        try:
            while not self.shutdown.is_set():
                observer.join(1)
        except KeyboardInterrupt:
            pass
        finally:
            observer.stop()
            observer.join()

    def watch_triggers_polling(self):
        """Fallback: polling mode"""
        logger.info(f"🔄 Polling mode (checking every 0.5s)")

        try:
            while not self.shutdown.is_set():
                # Scan for trigger files
                for trigger_file in self.trigger_dir.glob("*.trigger"):
                    self.handle_trigger(trigger_file)

                time.sleep(0.5)  # Poll interval
        except Exception as e:
            logger.error(f"Polling failed: {e}")

    def start(self):
        """Start hook watcher"""
        logger.info(f"🚀 {self.worker_name}: Starting hook watcher")

        # Setup Redis (optional)
        self.setup_redis()

        # Start control pipe listener in background
        control_thread = Thread(target=self.watch_control_pipe, daemon=True)
        control_thread.start()

        # Watch triggers (main thread)
        if WATCHDOG_AVAILABLE:
            self.watch_triggers_inotify()
        else:
            self.watch_triggers_polling()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Hook Watcher - Filesystem-based Hook System")
    parser.add_argument("worker_name", help="Worker name (marie, anga, fabien)")
    parser.add_argument("--trigger-dir", help="Trigger directory")
    parser.add_argument("--pipe-dir", help="Pipe directory")

    args = parser.parse_args()

    logger.info("═" * 60)
    logger.info(f"  Hook Watcher v1.0")
    logger.info(f"  Worker: {args.worker_name}")
    logger.info("═" * 60)

    watcher = HookWatcher(
        args.worker_name,
        trigger_dir=args.trigger_dir,
        pipe_dir=args.pipe_dir
    )
    watcher.start()


if __name__ == "__main__":
    main()
