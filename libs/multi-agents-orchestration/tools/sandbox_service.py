#!/usr/bin/env python3
"""
Sandbox Service - Secure code execution service
Watches for sandbox requests and executes them in isolated Docker containers
"""

import json
import time
import subprocess
import os
from pathlib import Path
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
REQUESTS_DIR = Path("/workspace/shared/sandbox-requests")
RESULTS_DIR = Path("/workspace/shared/sandbox-results")
PROCESSING_DIR = Path("/workspace/shared/sandbox-processing")
LOG_FILE = Path("/workspace/shared/watcher-logs/sandbox-service.log")

# Default limits
DEFAULT_TIMEOUT = 300  # 5 minutes
DEFAULT_MEMORY = "512m"
DEFAULT_CPU = "1.0"

# Allowed base images (whitelist)
ALLOWED_IMAGES = {
    "python:3.8", "python:3.9", "python:3.10", "python:3.11", "python:3.12",
    "node:14", "node:16", "node:18", "node:20",
    "ruby:3.0", "ruby:3.1", "ruby:3.2",
    "golang:1.19", "golang:1.20", "golang:1.21",
    "openjdk:11", "openjdk:17", "openjdk:21",
    "alpine:latest", "ubuntu:20.04", "ubuntu:22.04"
}

def log(message):
    """Log message with timestamp"""
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    log_msg = f"[{timestamp}] {message}"
    print(log_msg)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(log_msg + "\n")

def validate_request(request):
    """Validate sandbox request"""
    required_fields = ["request_id", "image", "command"]

    for field in required_fields:
        if field not in request:
            return False, f"Missing required field: {field}"

    if request["image"] not in ALLOWED_IMAGES:
        return False, f"Image not allowed: {request['image']}. Allowed: {', '.join(ALLOWED_IMAGES)}"

    return True, None

def execute_sandbox(request):
    """Execute code in sandbox container"""
    request_id = request["request_id"]
    image = request["image"]
    command = request["command"]
    timeout = request.get("timeout", DEFAULT_TIMEOUT)
    memory = request.get("memory_limit", DEFAULT_MEMORY)
    cpu = request.get("cpu_limit", DEFAULT_CPU)
    working_dir = request.get("working_dir", "/workspace")
    files = request.get("files", {})

    log(f"Executing sandbox request {request_id}")
    log(f"  Image: {image}")
    log(f"  Command: {command}")
    log(f"  Timeout: {timeout}s")

    # Create temporary directory for files
    temp_dir = PROCESSING_DIR / request_id
    temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Write files to temp directory
        for filename, content in files.items():
            file_path = temp_dir / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content)
            log(f"  Created file: {filename}")

        # Build docker command
        docker_cmd = [
            "docker", "run",
            "--rm",
            "--network", "none",  # No network access
            "--memory", memory,
            "--cpus", cpu,
            "-v", f"{temp_dir}:{working_dir}",
            "-w", working_dir,
            image,
            "sh", "-c", command
        ]

        log(f"  Running: {' '.join(docker_cmd)}")

        # Execute with timeout
        start_time = time.time()
        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        execution_time = time.time() - start_time

        log(f"  Completed in {execution_time:.2f}s")
        log(f"  Exit code: {result.returncode}")

        return {
            "success": result.returncode == 0,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "execution_time": execution_time
        }

    except subprocess.TimeoutExpired:
        log(f"  Timeout after {timeout}s")
        return {
            "success": False,
            "error": f"Execution timed out after {timeout} seconds",
            "stdout": "",
            "stderr": "",
            "execution_time": timeout
        }

    except Exception as e:
        log(f"  Error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "stdout": "",
            "stderr": "",
            "execution_time": 0
        }

    finally:
        # Cleanup temp directory
        try:
            import shutil
            shutil.rmtree(temp_dir)
            log(f"  Cleaned up temp directory")
        except Exception as e:
            log(f"  Warning: Could not cleanup temp directory: {e}")

def process_request(request_file):
    """Process a sandbox request"""
    try:
        # Read request
        with open(request_file, "r") as f:
            request = json.load(f)

        request_id = request.get("request_id", request_file.stem)
        log(f"Processing request: {request_id}")

        # Validate request
        valid, error = validate_request(request)
        if not valid:
            log(f"  Invalid request: {error}")
            result = {
                "request_id": request_id,
                "success": False,
                "error": error,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            # Execute sandbox
            exec_result = execute_sandbox(request)
            result = {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                **exec_result
            }

        # Write result
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        result_file = RESULTS_DIR / f"{request_id}.json"
        with open(result_file, "w") as f:
            json.dump(result, f, indent=2)

        log(f"  Result written to {result_file}")

        # Delete request file
        request_file.unlink()
        log(f"  Request file deleted")

    except Exception as e:
        log(f"Error processing request: {e}")
        import traceback
        log(traceback.format_exc())

class SandboxRequestHandler(FileSystemEventHandler):
    """Handle new sandbox requests"""

    def on_created(self, event):
        if event.is_directory:
            return

        if not event.src_path.endswith(".json"):
            return

        # Small delay to ensure file is fully written
        time.sleep(0.1)

        request_file = Path(event.src_path)
        process_request(request_file)

def main():
    """Main service loop"""
    log("=" * 60)
    log("Sandbox Service Starting")
    log("=" * 60)

    # Create directories
    REQUESTS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSING_DIR.mkdir(parents=True, exist_ok=True)

    log(f"Requests directory: {REQUESTS_DIR}")
    log(f"Results directory: {RESULTS_DIR}")
    log(f"Allowed images: {', '.join(ALLOWED_IMAGES)}")

    # Process any existing requests
    log("Processing existing requests...")
    existing_requests = list(REQUESTS_DIR.glob("*.json"))
    for request_file in existing_requests:
        log(f"Found existing request: {request_file.name}")
        process_request(request_file)

    # Start watching for new requests
    log("Starting file watcher...")
    event_handler = SandboxRequestHandler()
    observer = Observer()
    observer.schedule(event_handler, str(REQUESTS_DIR), recursive=False)
    observer.start()

    log("Sandbox Service Ready - Waiting for requests...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log("Shutting down...")
        observer.stop()

    observer.join()
    log("Sandbox Service Stopped")

if __name__ == "__main__":
    main()
