#!/usr/bin/env python3
"""
Complete inventory of all files in the three domains
"""
from pathlib import Path
import json

DOMAINS = {
    "04_fulfillment": [
        "project_manager", "account_manager", "creative_producer",
        "quality_checker", "client_reporter", "delivery_coordinator"
    ],
    "05_feedback_loop": [
        "analytics_specialist", "client_feedback_manager", "process_optimizer",
        "market_intelligence_analyst", "strategy_advisor", "knowledge_manager"
    ],
    "06_operations": [
        "finance_manager", "legal_coordinator", "hr_specialist",
        "it_support", "office_manager", "compliance_officer"
    ]
}

def inventory_agent(domain_path, agent_name):
    """Complete inventory of an agent"""
    agent_path = domain_path / agent_name

    inventory = {
        "agent": agent_name,
        "path": str(agent_path),
        "files": [],
        "directories": {},
        "total_files": 0
    }

    if not agent_path.exists():
        return inventory

    # List all files and directories
    for item in agent_path.rglob("*"):
        if item.is_file():
            rel_path = item.relative_to(agent_path)
            inventory["files"].append(str(rel_path))
            inventory["total_files"] += 1

            # Categorize by directory
            if rel_path.parent != Path("."):
                dir_name = str(rel_path.parent.parts[0])
                if dir_name not in inventory["directories"]:
                    inventory["directories"][dir_name] = []
                inventory["directories"][dir_name].append(rel_path.name)

    return inventory

def main():
    base_path = Path("C:/workspace/@ornomedia-ai/digital-agency/agents")

    print("="*80)
    print("COMPLETE FILE INVENTORY")
    print("="*80)

    full_inventory = {
        "total_agents": 0,
        "total_files": 0,
        "domains": {}
    }

    for domain_name, expected_agents in DOMAINS.items():
        print(f"\n{'='*80}")
        print(f"DOMAIN: {domain_name}")
        print(f"{'='*80}")

        domain_path = base_path / domain_name

        domain_inventory = {
            "agents": {},
            "total_files": 0
        }

        # Check domain-level files
        domain_readme = domain_path / "README.md"
        domain_init = domain_path / "__init__.py"

        print(f"\nDomain-level files:")
        print(f"  README.md: {'YES' if domain_readme.exists() else 'NO'}")
        print(f"  __init__.py: {'YES' if domain_init.exists() else 'NO'}")

        if domain_readme.exists():
            domain_inventory["total_files"] += 1
        if domain_init.exists():
            domain_inventory["total_files"] += 1

        for agent_name in expected_agents:
            agent_inv = inventory_agent(domain_path, agent_name)
            domain_inventory["agents"][agent_name] = agent_inv
            domain_inventory["total_files"] += agent_inv["total_files"]
            full_inventory["total_agents"] += 1

            print(f"\n{agent_name}:")
            print(f"  Total files: {agent_inv['total_files']}")

            # Print directory breakdown
            for dir_name, files in sorted(agent_inv["directories"].items()):
                print(f"  {dir_name}/: {len(files)} files")
                for file_name in sorted(files):
                    print(f"    - {file_name}")

            # Print root files
            root_files = [f for f in agent_inv["files"] if "/" not in f and "\\" not in f]
            if root_files:
                print(f"  Root files: {len(root_files)}")
                for file_name in sorted(root_files):
                    print(f"    - {file_name}")

        full_inventory["domains"][domain_name] = domain_inventory
        full_inventory["total_files"] += domain_inventory["total_files"]

        print(f"\n{domain_name} Summary:")
        print(f"  Total files: {domain_inventory['total_files']}")

    # Save to JSON
    output_file = base_path / "complete_inventory.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(full_inventory, f, indent=2)

    print(f"\n{'='*80}")
    print(f"FINAL INVENTORY SUMMARY")
    print(f"{'='*80}")
    print(f"Total agents: {full_inventory['total_agents']}")
    print(f"Total files: {full_inventory['total_files']}")
    print(f"\nInventory saved to: {output_file}")

    # Print per-domain breakdown
    print(f"\nPer-domain breakdown:")
    for domain_name, domain_data in full_inventory["domains"].items():
        print(f"  {domain_name}: {domain_data['total_files']} files")

if __name__ == "__main__":
    main()
