#!/usr/bin/env python3
"""
Comprehensive audit script for agent domains 04, 05, and 06
"""
import os
import json
from pathlib import Path

# Define the expected agents for each domain
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

# Expected files and directories for each agent
EXPECTED_FILES = {
    "root": ["__init__.py", "agent.py", "config.yaml"],
    "dirs": ["tasks", "tools", "prompts", "tests"]
}

EXPECTED_SUBFILES = {
    "tasks": ["__init__.py"],  # Should have 3-5 task files
    "tools": ["__init__.py"],  # Should have tool files
    "prompts": [],  # Should have prompt files
    "tests": []  # Should have test files
}

def check_stub_implementation(file_path):
    """Check if a Python file contains stub implementation"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for stub indicators
        stub_indicators = [
            (content.count('pass') > 3, "Multiple 'pass' statements"),
            ('TODO' in content, "TODO comments"),
            ('NotImplementedError' in content, "NotImplementedError"),
            (len(content.strip()) < 100, "File too short (< 100 chars)"),
        ]

        issues = [msg for condition, msg in stub_indicators if condition]
        return issues
    except Exception as e:
        return [f"Error reading file: {str(e)}"]

def audit_agent(domain_path, agent_name):
    """Audit a single agent"""
    agent_path = domain_path / agent_name
    results = {
        "agent": agent_name,
        "exists": agent_path.exists(),
        "files": {},
        "dirs": {},
        "issues": [],
        "file_count": 0
    }

    if not agent_path.exists():
        results["issues"].append(f"Agent directory does not exist")
        return results

    # Check root files
    for file_name in EXPECTED_FILES["root"]:
        file_path = agent_path / file_name
        exists = file_path.exists()
        results["files"][file_name] = {
            "exists": exists,
            "size": file_path.stat().st_size if exists else 0,
            "stub_issues": []
        }

        if exists:
            results["file_count"] += 1
            if file_name.endswith('.py'):
                stub_issues = check_stub_implementation(file_path)
                results["files"][file_name]["stub_issues"] = stub_issues
        else:
            results["issues"].append(f"Missing {file_name}")

    # Check directories
    for dir_name in EXPECTED_FILES["dirs"]:
        dir_path = agent_path / dir_name
        exists = dir_path.exists()
        results["dirs"][dir_name] = {
            "exists": exists,
            "files": []
        }

        if exists:
            # List all files in directory
            files = list(dir_path.glob("*.py")) + list(dir_path.glob("*.txt")) + list(dir_path.glob("*.md"))
            results["dirs"][dir_name]["files"] = [f.name for f in files]
            results["file_count"] += len(files)

            # Check for __init__.py in tasks and tools
            if dir_name in ["tasks", "tools"]:
                init_path = dir_path / "__init__.py"
                if not init_path.exists():
                    results["issues"].append(f"Missing {dir_name}/__init__.py")

            # Check minimum file counts
            if dir_name == "tasks" and len([f for f in files if f.name != "__init__.py"]) < 3:
                results["issues"].append(f"tasks/ should have at least 3 task files")

            if dir_name == "tools" and len([f for f in files if f.name != "__init__.py"]) < 1:
                results["issues"].append(f"tools/ should have at least 1 tool file")
        else:
            results["issues"].append(f"Missing {dir_name}/ directory")

    return results

def audit_domain(base_path, domain_name, expected_agents):
    """Audit an entire domain"""
    domain_path = base_path / domain_name

    domain_results = {
        "domain": domain_name,
        "path": str(domain_path),
        "readme_exists": (domain_path / "README.md").exists(),
        "init_exists": (domain_path / "__init__.py").exists(),
        "agents": {},
        "total_files": 0,
        "total_issues": 0
    }

    for agent_name in expected_agents:
        agent_results = audit_agent(domain_path, agent_name)
        domain_results["agents"][agent_name] = agent_results
        domain_results["total_files"] += agent_results["file_count"]
        domain_results["total_issues"] += len(agent_results["issues"])

        # Add stub issues to total
        for file_name, file_info in agent_results["files"].items():
            if file_info.get("stub_issues"):
                domain_results["total_issues"] += len(file_info["stub_issues"])

    return domain_results

def main():
    base_path = Path("C:/workspace/@ornomedia-ai/digital-agency/agents")

    all_results = {
        "total_agents": 0,
        "total_files": 0,
        "total_issues": 0,
        "domains": {}
    }

    for domain_name, expected_agents in DOMAINS.items():
        print(f"\n{'='*80}")
        print(f"AUDITING: {domain_name}")
        print(f"{'='*80}")

        domain_results = audit_domain(base_path, domain_name, expected_agents)
        all_results["domains"][domain_name] = domain_results
        all_results["total_agents"] += len(expected_agents)
        all_results["total_files"] += domain_results["total_files"]
        all_results["total_issues"] += domain_results["total_issues"]

        # Print summary
        print(f"\nDomain: {domain_name}")
        print(f"README.md exists: {domain_results['readme_exists']}")
        print(f"__init__.py exists: {domain_results['init_exists']}")
        print(f"Total files: {domain_results['total_files']}")
        print(f"Total issues: {domain_results['total_issues']}")

        for agent_name, agent_results in domain_results["agents"].items():
            print(f"\n  Agent: {agent_name}")
            print(f"    Exists: {agent_results['exists']}")
            print(f"    Files: {agent_results['file_count']}")
            print(f"    Issues: {len(agent_results['issues'])}")

            if agent_results["issues"]:
                for issue in agent_results["issues"]:
                    print(f"      - {issue}")

            # Print stub issues
            for file_name, file_info in agent_results["files"].items():
                if file_info.get("stub_issues"):
                    print(f"      {file_name} stub issues:")
                    for stub_issue in file_info["stub_issues"]:
                        print(f"        - {stub_issue}")

    # Final summary
    print(f"\n{'='*80}")
    print(f"FINAL SUMMARY")
    print(f"{'='*80}")
    print(f"Total agents audited: {all_results['total_agents']}")
    print(f"Total files checked: {all_results['total_files']}")
    print(f"Total issues found: {all_results['total_issues']}")

    # Save results to JSON
    output_file = base_path / "audit_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2)

    print(f"\nDetailed results saved to: {output_file}")

    return all_results

if __name__ == "__main__":
    main()
