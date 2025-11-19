#!/usr/bin/env python3
"""
Script to scaffold a new agent with proper structure.
"""

import os
import sys
from pathlib import Path
from datetime import datetime


AGENT_TEMPLATE = """\"\"\"
{agent_name} agent implementation.
Domain: {domain}
\"\"\"

import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class {class_name}:
    \"\"\"
    {description}
    \"\"\"

    def __init__(self, model: str = "gpt-4", temperature: float = 0.7):
        \"\"\"
        Initialize {agent_name} agent.

        Args:
            model: LLM model to use
            temperature: Model temperature
        \"\"\"
        self.agent_id = "{agent_id}"
        self.name = "{agent_name}"
        self.domain = "{domain}"
        self.model = model
        self.temperature = temperature
        self.capabilities = {capabilities}
        self.tools = {tools}
        self.status = "active"
        self.created_at = datetime.utcnow()

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        \"\"\"
        Execute a task assigned to this agent.

        Args:
            task: Task data including type and input

        Returns:
            Dict containing task result
        \"\"\"
        logger.info(f"Agent {{self.agent_id}} executing task: {{task.get('type')}}")

        try:
            # TODO: Implement task execution logic
            result = {{
                "success": True,
                "output": "Task completed successfully",
                "data": {{}},
                "completed_at": datetime.utcnow().isoformat()
            }}

            return result

        except Exception as e:
            logger.error(f"Task execution failed: {{e}}")
            return {{
                "success": False,
                "error": str(e),
                "completed_at": datetime.utcnow().isoformat()
            }}

    def get_capabilities(self) -> List[str]:
        \"\"\"Get agent capabilities.\"\"\"
        return self.capabilities

    def get_status(self) -> Dict[str, Any]:
        \"\"\"Get agent status.\"\"\"
        return {{
            "agent_id": self.agent_id,
            "name": self.name,
            "domain": self.domain,
            "status": self.status,
            "uptime_seconds": (datetime.utcnow() - self.created_at).seconds
        }}
"""


def create_agent(agent_name: str, domain: str, capabilities: List[str],
                tools: List[str], description: str, output_dir: str = None):
    """
    Create a new agent file with proper structure.

    Args:
        agent_name: Name of the agent
        domain: Domain the agent operates in
        capabilities: List of agent capabilities
        tools: List of tools the agent can use
        description: Agent description
        output_dir: Output directory (defaults to domains/)
    """
    # Generate class name from agent name
    class_name = ''.join(word.capitalize() for word in agent_name.split())
    if not class_name.endswith('Agent'):
        class_name += 'Agent'

    # Generate agent ID
    agent_id = f"{domain}_{agent_name.lower().replace(' ', '_')}_{int(datetime.utcnow().timestamp())}"

    # Generate file content
    content = AGENT_TEMPLATE.format(
        agent_name=agent_name,
        domain=domain,
        class_name=class_name,
        description=description,
        agent_id=agent_id,
        capabilities=capabilities,
        tools=tools
    )

    # Determine output path
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "domains" / domain / "agents"

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate filename
    filename = f"{agent_name.lower().replace(' ', '_')}_agent.py"
    output_path = output_dir / filename

    # Write file
    with open(output_path, 'w') as f:
        f.write(content)

    print(f"Created agent: {output_path}")
    print(f"Agent ID: {agent_id}")
    print(f"Class name: {class_name}")
    print(f"\nNext steps:")
    print(f"1. Implement task execution logic in {filename}")
    print(f"2. Add agent to domain __init__.py")
    print(f"3. Create tests in tests/unit/test_{filename}")
    print(f"4. Update documentation")


def main():
    """Main entry point."""
    print("Agent Scaffolding Tool")
    print("=" * 50)

    # Get agent details
    agent_name = input("Agent name (e.g., 'Campaign Creator'): ").strip()
    domain = input("Domain (e.g., 'marketing', 'sales'): ").strip()
    description = input("Description: ").strip()

    # Get capabilities
    print("\nEnter capabilities (one per line, empty line to finish):")
    capabilities = []
    while True:
        capability = input("  - ").strip()
        if not capability:
            break
        capabilities.append(capability)

    # Get tools
    print("\nEnter tools (one per line, empty line to finish):")
    tools = []
    while True:
        tool = input("  - ").strip()
        if not tool:
            break
        tools.append(tool)

    # Create agent
    create_agent(
        agent_name=agent_name,
        domain=domain,
        capabilities=capabilities,
        tools=tools,
        description=description
    )


if __name__ == "__main__":
    main()
