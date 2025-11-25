#!/usr/bin/env python3
"""
Deep audit script to check for stub implementations in agent files
"""
import os
import re
from pathlib import Path

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

def analyze_python_file(file_path):
    """Deep analysis of Python file for stub implementations"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')

        # Count various indicators
        metrics = {
            "total_lines": len(lines),
            "code_lines": len([l for l in lines if l.strip() and not l.strip().startswith('#')]),
            "pass_count": content.count('pass'),
            "todo_count": content.count('TODO') + content.count('FIXME'),
            "raise_not_implemented": content.count('NotImplementedError'),
            "function_count": len(re.findall(r'def\s+\w+', content)),
            "class_count": len(re.findall(r'class\s+\w+', content)),
            "docstring_count": len(re.findall(r'"""[\s\S]*?"""', content)),
            "import_count": len(re.findall(r'^import |^from ', content, re.MULTILINE)),
            "try_except_count": content.count('try:'),
            "validation_count": len(re.findall(r'if\s+not\s+\w+|raise\s+ValueError|raise\s+TypeError', content)),
        }

        # Detect stub patterns
        issues = []

        # Check for minimal implementation
        if metrics["code_lines"] < 50:
            issues.append(f"Very short implementation ({metrics['code_lines']} code lines)")

        # Check for excessive pass statements
        if metrics["pass_count"] > 2:
            issues.append(f"Multiple pass statements ({metrics['pass_count']})")

        # Check for TODOs
        if metrics["todo_count"] > 0:
            issues.append(f"Contains TODO/FIXME ({metrics['todo_count']})")

        # Check for NotImplementedError
        if metrics["raise_not_implemented"] > 0:
            issues.append(f"Contains NotImplementedError ({metrics['raise_not_implemented']})")

        # Check for lack of error handling
        if metrics["function_count"] > 3 and metrics["try_except_count"] == 0:
            issues.append(f"No error handling ({metrics['function_count']} functions, 0 try/except)")

        # Check for lack of validation
        if metrics["code_lines"] > 20 and metrics["validation_count"] < 2:
            issues.append(f"Minimal validation ({metrics['validation_count']} checks)")

        return {
            "metrics": metrics,
            "issues": issues,
            "quality_score": calculate_quality_score(metrics, issues)
        }

    except Exception as e:
        return {
            "metrics": {},
            "issues": [f"Error analyzing file: {str(e)}"],
            "quality_score": 0
        }

def calculate_quality_score(metrics, issues):
    """Calculate a quality score (0-100)"""
    score = 100

    # Deduct points for issues
    score -= len(issues) * 10

    # Deduct for short files
    if metrics["code_lines"] < 50:
        score -= 20
    elif metrics["code_lines"] < 100:
        score -= 10

    # Add points for good practices
    if metrics["try_except_count"] > 0:
        score += 5
    if metrics["docstring_count"] > 2:
        score += 5
    if metrics["validation_count"] > 2:
        score += 5

    return max(0, min(100, score))

def audit_agent_deep(domain_path, agent_name):
    """Deep audit of a single agent"""
    agent_path = domain_path / agent_name

    results = {
        "agent": agent_name,
        "files": {}
    }

    # Check agent.py
    agent_file = agent_path / "agent.py"
    if agent_file.exists():
        results["files"]["agent.py"] = analyze_python_file(agent_file)

    # Check task files
    tasks_dir = agent_path / "tasks"
    if tasks_dir.exists():
        task_files = list(tasks_dir.glob("*.py"))
        task_files = [f for f in task_files if f.name != "__init__.py"]

        results["files"]["tasks"] = {
            "count": len(task_files),
            "files": {}
        }

        for task_file in task_files:
            results["files"]["tasks"]["files"][task_file.name] = analyze_python_file(task_file)

    # Check tool files
    tools_dir = agent_path / "tools"
    if tools_dir.exists():
        tool_files = list(tools_dir.glob("*.py"))
        tool_files = [f for f in tool_files if f.name != "__init__.py"]

        results["files"]["tools"] = {
            "count": len(tool_files),
            "files": {}
        }

        for tool_file in tool_files:
            results["files"]["tools"]["files"][tool_file.name] = analyze_python_file(tool_file)

    return results

def main():
    base_path = Path("C:/workspace/@ornomedia-ai/digital-agency/agents")

    print("="*80)
    print("DEEP IMPLEMENTATION AUDIT")
    print("="*80)

    summary = {
        "total_agents": 0,
        "total_files_analyzed": 0,
        "total_issues": 0,
        "avg_quality_score": 0,
        "domains": {}
    }

    for domain_name, expected_agents in DOMAINS.items():
        print(f"\n{'='*80}")
        print(f"DOMAIN: {domain_name}")
        print(f"{'='*80}")

        domain_path = base_path / domain_name
        domain_summary = {
            "agents": {},
            "total_issues": 0,
            "avg_quality": 0
        }

        quality_scores = []

        for agent_name in expected_agents:
            print(f"\n  Analyzing: {agent_name}")

            agent_results = audit_agent_deep(domain_path, agent_name)
            domain_summary["agents"][agent_name] = agent_results
            summary["total_agents"] += 1

            # Print agent.py analysis
            if "agent.py" in agent_results["files"]:
                analysis = agent_results["files"]["agent.py"]
                metrics = analysis["metrics"]
                issues = analysis["issues"]
                quality = analysis["quality_score"]
                quality_scores.append(quality)

                print(f"    agent.py:")
                print(f"      Lines: {metrics.get('code_lines', 0)}")
                print(f"      Functions: {metrics.get('function_count', 0)}")
                print(f"      Classes: {metrics.get('class_count', 0)}")
                print(f"      Error handling: {metrics.get('try_except_count', 0)} try/except blocks")
                print(f"      Validation: {metrics.get('validation_count', 0)} checks")
                print(f"      Quality Score: {quality}/100")

                summary["total_files_analyzed"] += 1

                if issues:
                    print(f"      Issues:")
                    for issue in issues:
                        print(f"        - {issue}")
                        summary["total_issues"] += 1
                        domain_summary["total_issues"] += 1

            # Print task files summary
            if "tasks" in agent_results["files"]:
                tasks_info = agent_results["files"]["tasks"]
                print(f"    tasks/: {tasks_info['count']} files")

                for task_file, analysis in tasks_info["files"].items():
                    quality_scores.append(analysis["quality_score"])
                    summary["total_files_analyzed"] += 1

                    if analysis["issues"]:
                        print(f"      {task_file}: {len(analysis['issues'])} issues")
                        summary["total_issues"] += len(analysis["issues"])
                        domain_summary["total_issues"] += len(analysis["issues"])

            # Print tool files summary
            if "tools" in agent_results["files"]:
                tools_info = agent_results["files"]["tools"]
                print(f"    tools/: {tools_info['count']} files")

                for tool_file, analysis in tools_info["files"].items():
                    quality_scores.append(analysis["quality_score"])
                    summary["total_files_analyzed"] += 1

                    if analysis["issues"]:
                        print(f"      {tool_file}: {len(analysis['issues'])} issues")
                        summary["total_issues"] += len(analysis["issues"])
                        domain_summary["total_issues"] += len(analysis["issues"])

        # Domain summary
        domain_summary["avg_quality"] = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        summary["domains"][domain_name] = domain_summary

        print(f"\n  Domain Summary:")
        print(f"    Total Issues: {domain_summary['total_issues']}")
        print(f"    Avg Quality Score: {domain_summary['avg_quality']:.1f}/100")

    # Final summary
    all_quality_scores = []
    for domain_data in summary["domains"].values():
        for agent_data in domain_data["agents"].values():
            if "agent.py" in agent_data["files"]:
                all_quality_scores.append(agent_data["files"]["agent.py"]["quality_score"])

    summary["avg_quality_score"] = sum(all_quality_scores) / len(all_quality_scores) if all_quality_scores else 0

    print(f"\n{'='*80}")
    print(f"FINAL SUMMARY")
    print(f"{'='*80}")
    print(f"Total agents analyzed: {summary['total_agents']}")
    print(f"Total files analyzed: {summary['total_files_analyzed']}")
    print(f"Total issues found: {summary['total_issues']}")
    print(f"Average quality score: {summary['avg_quality_score']:.1f}/100")

    return summary

if __name__ == "__main__":
    main()
