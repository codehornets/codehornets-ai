#!/usr/bin/env python3
"""
PTY Client - Send messages to running PTY agents from another terminal.

Uses a simple file-based protocol to communicate with pty_orchestrator.py

Usage:
    # From another terminal:
    python tools/pty_client.py send marie "Evaluate Emma Rodriguez"
    python tools/pty_client.py status
    python tools/pty_client.py list
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

# Shared communication directory
COMM_DIR = Path("/tmp/pty_orchestrator")
COMMANDS_FILE = COMM_DIR / "commands.json"
RESPONSES_DIR = COMM_DIR / "responses"
STATUS_FILE = COMM_DIR / "status.json"


def ensure_dirs():
    """Create communication directories"""
    COMM_DIR.mkdir(exist_ok=True)
    RESPONSES_DIR.mkdir(exist_ok=True)


def send_command(agent: str, message: str) -> str:
    """Send a command to an agent and wait for response"""
    ensure_dirs()

    command_id = f"cmd_{int(time.time() * 1000)}"
    command = {
        "id": command_id,
        "agent": agent,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

    # Write command
    cmd_file = COMM_DIR / f"{command_id}.cmd"
    cmd_file.write_text(json.dumps(command))
    print(f"📤 Sent command {command_id} to {agent}")

    # Wait for response
    response_file = RESPONSES_DIR / f"{command_id}.json"
    print(f"⏳ Waiting for response...")

    timeout = 120  # 2 minutes
    start = time.time()
    while time.time() - start < timeout:
        if response_file.exists():
            response = json.loads(response_file.read_text())
            print(f"\n📥 Response from {agent}:")
            print("=" * 60)
            print(response.get("content", "No content"))
            print("=" * 60)
            return response.get("content", "")
        time.sleep(1)
        print(".", end="", flush=True)

    print(f"\n❌ Timeout waiting for response")
    return ""


def get_status():
    """Get orchestrator status"""
    if STATUS_FILE.exists():
        status = json.loads(STATUS_FILE.read_text())
        print(json.dumps(status, indent=2))
    else:
        print("❌ No orchestrator running (status file not found)")


def list_agents():
    """List available agents"""
    if STATUS_FILE.exists():
        status = json.loads(STATUS_FILE.read_text())
        print("Available agents:")
        for agent in status.get("agents", []):
            print(f"  - {agent}")
    else:
        print("❌ No orchestrator running")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "send" and len(sys.argv) >= 4:
        agent = sys.argv[2]
        message = " ".join(sys.argv[3:])
        send_command(agent, message)

    elif cmd == "status":
        get_status()

    elif cmd == "list":
        list_agents()

    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
