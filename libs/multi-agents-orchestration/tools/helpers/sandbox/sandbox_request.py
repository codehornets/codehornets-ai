#!/usr/bin/env python3
"""
Helper script for agents to submit sandbox requests
Usage: python sandbox_request.py --image python:3.11 --command "python script.py"
"""

import json
import uuid
import time
import argparse
from pathlib import Path
from datetime import datetime

# Directories (relative to agent workspace)
REQUESTS_DIR = Path("/workspace/shared/sandbox-requests") if Path("/workspace/shared").exists() else Path("./shared/sandbox-requests")
RESULTS_DIR = Path("/workspace/shared/sandbox-results") if Path("/workspace/shared").exists() else Path("./shared/sandbox-results")

def submit_request(image, command, files=None, timeout=300, memory="512m", cpu="1.0", wait=True):
    """
    Submit a sandbox execution request

    Args:
        image: Docker image to use (e.g., "python:3.11", "node:18")
        command: Command to execute
        files: Dict of filename -> content to create in sandbox
        timeout: Maximum execution time in seconds
        memory: Memory limit (e.g., "512m", "1g")
        cpu: CPU limit (e.g., "0.5", "1.0")
        wait: Wait for result if True

    Returns:
        Result dict if wait=True, else request_id
    """
    request_id = f"sandbox-{uuid.uuid4()}"

    request = {
        "request_id": request_id,
        "image": image,
        "command": command,
        "files": files or {},
        "timeout": timeout,
        "memory_limit": memory,
        "cpu_limit": cpu,
        "submitted_at": datetime.utcnow().isoformat()
    }

    # Create directories if they don't exist
    REQUESTS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Write request
    request_file = REQUESTS_DIR / f"{request_id}.json"
    with open(request_file, "w") as f:
        json.dump(request, f, indent=2)

    print(f"✓ Sandbox request submitted: {request_id}")
    print(f"  Image: {image}")
    print(f"  Command: {command}")

    if not wait:
        return request_id

    # Wait for result
    print("  Waiting for result...", end="", flush=True)
    result_file = RESULTS_DIR / f"{request_id}.json"

    max_wait = timeout + 30  # Extra 30 seconds for overhead
    start_time = time.time()

    while time.time() - start_time < max_wait:
        if result_file.exists():
            print(" Done!")
            with open(result_file, "r") as f:
                result = json.load(f)

            # Clean up result file
            result_file.unlink()

            return result

        time.sleep(0.5)
        print(".", end="", flush=True)

    print(" Timeout!")
    return {
        "success": False,
        "error": f"No result received after {max_wait} seconds"
    }

def main():
    parser = argparse.ArgumentParser(description="Submit sandbox execution request")
    parser.add_argument("--image", required=True, help="Docker image (e.g., python:3.11)")
    parser.add_argument("--command", required=True, help="Command to execute")
    parser.add_argument("--file", action="append", nargs=2, metavar=("NAME", "CONTENT"),
                        help="Add file: --file script.py 'print(42)'")
    parser.add_argument("--timeout", type=int, default=300, help="Timeout in seconds")
    parser.add_argument("--memory", default="512m", help="Memory limit (e.g., 512m, 1g)")
    parser.add_argument("--cpu", default="1.0", help="CPU limit (e.g., 0.5, 1.0)")
    parser.add_argument("--no-wait", action="store_true", help="Don't wait for result")
    parser.add_argument("--json", action="store_true", help="Output JSON result")

    args = parser.parse_args()

    # Build files dict
    files = {}
    if args.file:
        for name, content in args.file:
            files[name] = content

    # Submit request
    result = submit_request(
        image=args.image,
        command=args.command,
        files=files,
        timeout=args.timeout,
        memory=args.memory,
        cpu=args.cpu,
        wait=not args.no_wait
    )

    if args.json:
        print(json.dumps(result, indent=2))
    elif isinstance(result, str):
        # request_id (no-wait mode)
        print(f"\nRequest ID: {result}")
        print(f"Check result at: {RESULTS_DIR}/{result}.json")
    else:
        # Full result
        print(f"\n{'='*60}")
        print(f"Sandbox Result: {result['request_id']}")
        print(f"{'='*60}")

        if result.get("success"):
            print("✓ Success")
        else:
            print(f"✗ Failed: {result.get('error', 'Unknown error')}")

        if "exit_code" in result:
            print(f"\nExit Code: {result['exit_code']}")

        if result.get("stdout"):
            print(f"\n--- STDOUT ---")
            print(result["stdout"])

        if result.get("stderr"):
            print(f"\n--- STDERR ---")
            print(result["stderr"])

        if "execution_time" in result:
            print(f"\nExecution Time: {result['execution_time']:.2f}s")

if __name__ == "__main__":
    main()
