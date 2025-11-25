"""
Batch Agent Completion Script

This script completes all agent implementations across all domains.
"""

import os
from pathlib import Path

# Define the base agents directory
BASE_DIR = Path(r"C:\workspace\@ornomedia-ai\digital-agency\agents")

# Define all agents per domain
DOMAINS = {
    "07_customer_support": [
        "technical_support",
        "help_desk_agent",
        "bug_tracker",
        "documentation_specialist",
        "user_training_coordinator",
        "community_manager"
    ],
    "08_leadership": [
        "ceo_strategy_director",
        "operations_director",
        "decision_support_analyst",  # Already completed
        "board_relations_manager",
        "vision_architect",
        "performance_manager"
    ],
    "09_innovation": [
        "new_service_tester",
        "tool_evaluator",
        "market_experimenter",
        "process_innovator",
        "competitive_researcher",
        "pilot_program_manager"
    ],
    "10_enablement": [
        "recruiting_specialist",
        "onboarding_coordinator",
        "training_specialist",
        "culture_builder",
        "performance_developer",
        "knowledge_curator"
    ]
}

def check_structure():
    """Check if all required files exist."""
    report = {
        "total_agents": 0,
        "agents_checked": [],
        "missing_files": []
    }

    for domain, agents in DOMAINS.items():
        domain_path = BASE_DIR / domain
        print(f"\nChecking {domain}...")

        for agent in agents:
            report["total_agents"] += 1
            agent_path = domain_path / agent

            required_files = [
                "__init__.py",
                "agent.py",
                "config.yaml",
                "tasks/__init__.py",
                "tools/__init__.py",
                "prompts/system_prompt.txt",
                "prompts/system_prompt.md",
                "tests/test_agent.py"
            ]

            status = {"agent": f"{domain}/{agent}", "files": {}}

            for file in required_files:
                file_path = agent_path / file
                exists = file_path.exists()
                status["files"][file] = exists

                if not exists:
                    report["missing_files"].append(f"{domain}/{agent}/{file}")

            report["agents_checked"].append(status)

    return report

if __name__ == "__main__":
    print("=" * 80)
    print("AGENT STRUCTURE AUDIT")
    print("=" * 80)

    report = check_structure()

    print(f"\n\nTotal agents checked: {report['total_agents']}")
    print(f"Missing files: {len(report['missing_files'])}")

    if report['missing_files']:
        print("\nMissing files:")
        for file in report['missing_files'][:20]:  # Show first 20
            print(f"  - {file}")

    print("\n" + "=" * 80)
