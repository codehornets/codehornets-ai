#!/usr/bin/env python3
"""
Script to test an agent interactively.
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import importlib.util


def load_agent_class(agent_path: str):
    """
    Dynamically load agent class from file.

    Args:
        agent_path: Path to agent file

    Returns:
        Agent class
    """
    spec = importlib.util.spec_from_file_location("agent_module", agent_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    # Find agent class (assumes it ends with 'Agent')
    for name in dir(module):
        if name.endswith('Agent') and not name.startswith('_'):
            return getattr(module, name)

    raise ValueError("No agent class found in file")


def test_agent_initialization(AgentClass):
    """Test agent initialization."""
    print("\n1. Testing agent initialization...")

    try:
        agent = AgentClass()
        print(f"   ✓ Agent initialized: {agent.name}")
        print(f"   Domain: {agent.domain}")
        print(f"   Capabilities: {', '.join(agent.capabilities)}")
        return agent
    except Exception as e:
        print(f"   ✗ Initialization failed: {e}")
        return None


def test_agent_status(agent):
    """Test getting agent status."""
    print("\n2. Testing get_status()...")

    try:
        status = agent.get_status()
        print(f"   ✓ Status retrieved:")
        print(f"   {json.dumps(status, indent=6)}")
        return True
    except Exception as e:
        print(f"   ✗ get_status() failed: {e}")
        return False


def test_agent_capabilities(agent):
    """Test getting agent capabilities."""
    print("\n3. Testing get_capabilities()...")

    try:
        capabilities = agent.get_capabilities()
        print(f"   ✓ Capabilities: {', '.join(capabilities)}")
        return True
    except Exception as e:
        print(f"   ✗ get_capabilities() failed: {e}")
        return False


def test_task_execution(agent, task_data: dict = None):
    """Test task execution."""
    print("\n4. Testing task execution...")

    if task_data is None:
        task_data = {
            "task_id": f"test_task_{int(datetime.utcnow().timestamp())}",
            "type": "test",
            "description": "Test task execution",
            "input": {}
        }

    print(f"   Task: {json.dumps(task_data, indent=6)}")

    try:
        result = agent.execute_task(task_data)
        print(f"   ✓ Task executed:")
        print(f"   {json.dumps(result, indent=6)}")
        return result.get('success', False)
    except Exception as e:
        print(f"   ✗ Task execution failed: {e}")
        return False


def interactive_test(agent):
    """Run interactive test session."""
    print("\n" + "=" * 50)
    print("Interactive Test Mode")
    print("=" * 50)
    print("Enter task data as JSON (or 'quit' to exit)")

    while True:
        print("\nTask input:")
        user_input = input("> ").strip()

        if user_input.lower() in ['quit', 'exit', 'q']:
            break

        try:
            task_data = json.loads(user_input)
            result = agent.execute_task(task_data)
            print("\nResult:")
            print(json.dumps(result, indent=2))
        except json.JSONDecodeError:
            print("Error: Invalid JSON input")
        except Exception as e:
            print(f"Error: {e}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Test agent interactively")
    parser.add_argument("agent_path", help="Path to agent file")
    parser.add_argument("--interactive", "-i", action="store_true",
                       help="Run in interactive mode")
    parser.add_argument("--task", "-t", help="Task data as JSON string")

    args = parser.parse_args()

    print("Agent Testing Tool")
    print("=" * 50)
    print(f"Agent: {args.agent_path}\n")

    # Load agent class
    try:
        AgentClass = load_agent_class(args.agent_path)
        print(f"Loaded agent class: {AgentClass.__name__}")
    except Exception as e:
        print(f"Failed to load agent: {e}")
        sys.exit(1)

    # Initialize agent
    agent = test_agent_initialization(AgentClass)
    if not agent:
        sys.exit(1)

    # Run tests
    test_agent_status(agent)
    test_agent_capabilities(agent)

    # Test task execution
    if args.task:
        try:
            task_data = json.loads(args.task)
            test_task_execution(agent, task_data)
        except json.JSONDecodeError:
            print(f"Error: Invalid task JSON: {args.task}")
    else:
        test_task_execution(agent)

    # Interactive mode
    if args.interactive:
        interactive_test(agent)

    print("\n" + "=" * 50)
    print("Testing complete!")


if __name__ == "__main__":
    main()
