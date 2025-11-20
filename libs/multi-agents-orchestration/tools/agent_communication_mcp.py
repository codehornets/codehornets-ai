#!/usr/bin/env python3
"""
[DEPRECATED - DO NOT USE FOR AGENT COMMUNICATION]

This MCP server is DEPRECATED for inter-agent communication.
Agents should use the bash scripts directly instead:
  - /tools/send_agent_message.sh - For sending messages between agents
  - /tools/check_agent_activity.sh - For checking agent status

IMPORTANT: This MCP server is NOT used by agents anymore. All inter-agent
communication is handled through bash scripts that use docker attach + expect
to communicate with persistent Claude sessions.

The MCP tools below (send_message_to_agent, list_available_agents,
check_agent_status) are maintained for backwards compatibility only.
DO NOT rely on them for new implementations.

For actual agent communication, use:
  bash /tools/send_agent_message.sh <agent> "message"

This file may be removed in future versions.
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# MCP Server protocol implementation
def send_message(target_agent: str, message: str, from_agent: str = "unknown") -> Dict[str, Any]:
    """
    Send a message to another agent using the send_agent_message.sh script.

    Args:
        target_agent: The agent to send the message to (marie, anga, fabien, orchestrator)
        message: The message content to send
        from_agent: The agent sending the message (for logging)

    Returns:
        Dictionary with status and result information
    """
    valid_agents = ["marie", "anga", "fabien", "orchestrator"]

    if target_agent not in valid_agents:
        return {
            "success": False,
            "error": f"Invalid target agent: {target_agent}. Must be one of: {', '.join(valid_agents)}",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    # Format the message with sender information
    formatted_message = f"[Message from {from_agent}]: {message}"

    try:
        # Call send_agent_message.sh via automation container which has Docker access
        # The automation container has expect and Docker socket access
        result = subprocess.run(
            [
                "docker", "exec", "codehornets-svc-automation",
                "bash", "/tools/send_agent_message.sh",
                target_agent,
                formatted_message
            ],
            capture_output=True,
            text=True,
            timeout=30
        )

        success = result.returncode == 0

        return {
            "success": success,
            "target_agent": target_agent,
            "from_agent": from_agent,
            "message_sent": message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "output": result.stdout if success else None,
            "error": result.stderr if not success else None
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Message sending timed out after 30 seconds",
            "target_agent": target_agent,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to send message: {str(e)}",
            "target_agent": target_agent,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


def list_available_agents() -> Dict[str, Any]:
    """
    List all available agents in the system with their specializations.

    Returns:
        Dictionary with agent information
    """
    agents = {
        "orchestrator": {
            "name": "Orchestrator",
            "emoji": "🎯",
            "role": "Task coordinator and delegator",
            "specialization": "Task decomposition, delegation, result aggregation",
            "container": "codehornets-orchestrator"
        },
        "marie": {
            "name": "Marie",
            "emoji": "🩰",
            "role": "Dance Teacher Assistant",
            "specialization": "Student evaluations, class documentation, choreography organization",
            "container": "codehornets-worker-marie"
        },
        "anga": {
            "name": "Anga",
            "emoji": "💻",
            "role": "Coding Assistant",
            "specialization": "Software development, code reviews, architecture design, testing",
            "container": "codehornets-worker-anga"
        },
        "fabien": {
            "name": "Fabien",
            "emoji": "📈",
            "role": "Marketing Assistant",
            "specialization": "Campaign creation, content marketing, social media, SEO",
            "container": "codehornets-worker-fabien"
        }
    }

    # Check which agents are currently running
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            timeout=5
        )
        running_containers = result.stdout.strip().split("\n")

        for agent_id, agent_info in agents.items():
            agent_info["status"] = "online" if agent_info["container"] in running_containers else "offline"
    except:
        for agent_info in agents.values():
            agent_info["status"] = "unknown"

    return {
        "success": True,
        "agents": agents,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


def check_agent_status(agent_name: str) -> Dict[str, Any]:
    """
    Check the current status of a specific agent by reading its heartbeat.

    Args:
        agent_name: The agent to check (marie, anga, fabien, orchestrator)

    Returns:
        Dictionary with agent status information
    """
    valid_agents = ["marie", "anga", "fabien", "orchestrator"]

    if agent_name not in valid_agents:
        return {
            "success": False,
            "error": f"Invalid agent: {agent_name}. Must be one of: {', '.join(valid_agents)}"
        }

    heartbeat_file = Path(f"/shared/heartbeats/{agent_name}.json")

    try:
        if heartbeat_file.exists():
            with open(heartbeat_file, 'r') as f:
                heartbeat_data = json.load(f)

            return {
                "success": True,
                "agent": agent_name,
                "heartbeat": heartbeat_data,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            return {
                "success": True,
                "agent": agent_name,
                "status": "no_heartbeat",
                "message": f"Agent {agent_name} has not published a heartbeat yet",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to read heartbeat: {str(e)}",
            "agent": agent_name,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


# MCP Server Protocol
def handle_mcp_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle MCP protocol requests."""
    method = request.get("method")
    params = request.get("params", {})

    if method == "tools/list":
        return {
            "tools": [
                {
                    "name": "send_message_to_agent",
                    "description": "Send a message to another agent in the system. The message will be delivered and automatically submitted to the target agent.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "target_agent": {
                                "type": "string",
                                "description": "The agent to send the message to",
                                "enum": ["marie", "anga", "fabien", "orchestrator"]
                            },
                            "message": {
                                "type": "string",
                                "description": "The message content to send"
                            },
                            "from_agent": {
                                "type": "string",
                                "description": "Your agent name (for logging)",
                                "default": "unknown"
                            }
                        },
                        "required": ["target_agent", "message"]
                    }
                },
                {
                    "name": "list_available_agents",
                    "description": "Get a list of all available agents in the system with their specializations and current status.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                },
                {
                    "name": "check_agent_status",
                    "description": "Check the current status and heartbeat of a specific agent.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "agent_name": {
                                "type": "string",
                                "description": "The agent to check status for",
                                "enum": ["marie", "anga", "fabien", "orchestrator"]
                            }
                        },
                        "required": ["agent_name"]
                    }
                }
            ]
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if tool_name == "send_message_to_agent":
            result = send_message(
                target_agent=arguments.get("target_agent"),
                message=arguments.get("message"),
                from_agent=arguments.get("from_agent", "unknown")
            )
            return {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }
                ]
            }

        elif tool_name == "list_available_agents":
            result = list_available_agents()
            return {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }
                ]
            }

        elif tool_name == "check_agent_status":
            result = check_agent_status(arguments.get("agent_name"))
            return {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }
                ]
            }

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    else:
        return {"error": f"Unknown method: {method}"}


def main():
    """Main MCP server loop."""
    print("CodeHornets AI Inter-Agent Communication MCP Server starting...", file=sys.stderr)

    # Read MCP requests from stdin
    for line in sys.stdin:
        try:
            request = json.loads(line)
            response = handle_mcp_request(request)
            print(json.dumps(response))
            sys.stdout.flush()
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({"error": f"Server error: {str(e)}"}))
            sys.stdout.flush()


if __name__ == "__main__":
    main()
