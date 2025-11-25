#!/usr/bin/env python3
"""
Memory-Powered AI Demo

Demonstrates the memory system working across multiple sessions
to show continuous learning and improvement.
"""

import sys
import os
import json
from pathlib import Path

# Add memory-system to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'core'))

from memory_system import (
    OrchestratorMemory,
    MarieMemory,
    AngaMemory,
    FabienMemory,
    SharedMemory,
    TaskMasterMemory
)


def print_section(title):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}\n")


def demo_orchestrator_learning():
    """Demonstrate orchestrator learning delegation patterns."""
    print_section("ORCHESTRATOR MEMORY DEMO")

    # Create orchestrator with memory
    orchestrator = OrchestratorMemory(memory_dir="./demo_memories/orchestrator")

    print("Session 1: First delegation (no memory)")
    print("-" * 40)

    # First delegation - no memory to guide
    orchestrator.store_delegation(
        user_request="Evaluate dance students",
        workers_assigned=["marie"],
        task_description="Student evaluation task",
        success=True,
        execution_time=180.0,
        user_satisfaction=0.9
    )
    print("✓ Stored: dance evaluation → marie (success, 180s, 90% satisfaction)")

    # Second delegation - similar task
    orchestrator.store_delegation(
        user_request="Review student dance progress",
        workers_assigned=["marie"],
        task_description="Progress review task",
        success=True,
        execution_time=165.0,
        user_satisfaction=0.95
    )
    print("✓ Stored: progress review → marie (success, 165s, 95% satisfaction)")

    print("\nSession 2: Learning from history")
    print("-" * 40)

    # Get recommendation based on memory
    recommendation = orchestrator.plan_delegation(
        user_request="Assess intermediate students",
        available_workers=["marie", "anga", "fabien"]
    )

    print(f"Request: 'Assess intermediate students'")
    print(f"Category detected: {recommendation['category']}")
    print(f"Recommended workers: {recommendation['recommended_workers']}")
    print(f"Confidence: {recommendation['confidence']:.1%}")
    print(f"\nSimilar past cases:")
    for case in recommendation['similar_cases']:
        print(f"  - {case['workers']} (success={case['success']})")

    # Show worker statistics
    print("\nWorker Performance Statistics:")
    print("-" * 40)
    for worker in ["marie", "anga", "fabien"]:
        stats = orchestrator.get_worker_statistics(worker)
        if stats['total_tasks'] > 0:
            print(f"{worker.capitalize()}:")
            print(f"  Total tasks: {stats['total_tasks']}")
            print(f"  Success rate: {stats['success_rate']:.1%}")
            print(f"  Avg satisfaction: {stats['avg_satisfaction']:.2f}")

    # Save memory
    orchestrator.save()
    print("\n✓ Memory saved to disk")


def demo_marie_student_memory():
    """Demonstrate Marie remembering student progress."""
    print_section("MARIE'S STUDENT MEMORY DEMO")

    marie = MarieMemory(memory_dir="./demo_memories/marie")

    print("Session 1: Initial student evaluation")
    print("-" * 40)

    # Marie evaluates a student
    marie.remember_student(
        student_name="Emma",
        assessment={
            'technique': 7.5,
            'flexibility': 8.0,
            'strength': 6.5,
            'musicality': 8.5
        }
    )
    print("✓ Marie evaluated Emma:")
    print("  - Technique: 7.5/10")
    print("  - Flexibility: 8.0/10")
    print("  - Strength: 6.5/10 (needs improvement)")
    print("  - Musicality: 8.5/10")

    # Evaluate another student
    marie.remember_student(
        student_name="Lucas",
        assessment={
            'technique': 8.5,
            'flexibility': 7.0,
            'strength': 8.0,
            'musicality': 7.5
        }
    )
    print("\n✓ Marie evaluated Lucas:")
    print("  - Technique: 8.5/10")
    print("  - Flexibility: 7.0/10")
    print("  - Strength: 8.0/10")
    print("  - Musicality: 7.5/10")

    print("\nSession 2: Personalized recommendations")
    print("-" * 40)

    # Get recommendations for Emma
    emma_recs = marie.recommend_exercises("Emma")
    print(f"\nRecommendations for Emma:")
    print(f"  Focus areas: {emma_recs['focus_areas']}")
    print(f"  Past assessments: {emma_recs['past_assessments']}")

    # Get recommendations for Lucas
    lucas_recs = marie.recommend_exercises("Lucas")
    print(f"\nRecommendations for Lucas:")
    print(f"  Focus areas: {lucas_recs['focus_areas']}")
    print(f"  Past assessments: {lucas_recs['past_assessments']}")

    marie.save()
    print("\n✓ Marie's memory saved")


def demo_anga_code_memory():
    """Demonstrate Anga learning code patterns."""
    print_section("ANGA'S CODE REVIEW MEMORY DEMO")

    anga = AngaMemory(memory_dir="./demo_memories/anga")

    print("Session 1: Finding code issues")
    print("-" * 40)

    # Anga finds issues
    issues = [
        ("auth.py", "sql_injection", "CRITICAL", False),
        ("api.py", "missing_validation", "HIGH", False),
        ("auth.py", "xss_vulnerability", "HIGH", False),
        ("utils.py", "hardcoded_secret", "CRITICAL", False)
    ]

    for file, issue_type, severity, fixed in issues:
        anga.remember_code_issue(file, issue_type, severity, fixed)
        print(f"✓ Found {issue_type} in {file} ({severity})")

    print("\nSession 2: Identifying high-risk areas")
    print("-" * 40)

    # Get high-risk areas
    high_risk = anga.get_high_risk_areas()
    print("High-risk files (by issue count):")
    for area in high_risk[:3]:
        print(f"  - {area['file']}: {area['issue_count']} issues")

    # Get review focus suggestions
    focus = anga.suggest_review_focus()
    print("\nSuggested review focus:")
    for file, count in focus['high_risk_files'][:3]:
        print(f"  - {file}: {count} issues")

    print("\nCommon issue types:")
    for issue, count in focus['common_issues'][:3]:
        print(f"  - {issue}: {count} occurrences")

    anga.save()
    print("\n✓ Anga's memory saved")


def demo_fabien_campaign_memory():
    """Demonstrate Fabien learning campaign effectiveness."""
    print_section("FABIEN'S CAMPAIGN MEMORY DEMO")

    fabien = FabienMemory(memory_dir="./demo_memories/fabien")

    print("Session 1: Running campaigns")
    print("-" * 40)

    # Record campaigns
    campaigns = [
        ("social_media", {"engagement_rate": 0.08}, True),
        ("email", {"engagement_rate": 0.04}, False),
        ("social_media", {"engagement_rate": 0.09}, True),
        ("content", {"engagement_rate": 0.06}, True),
        ("influencer", {"engagement_rate": 0.12}, True)
    ]

    for campaign_type, metrics, success in campaigns:
        fabien.remember_campaign(campaign_type, metrics, success)
        status = "✓" if success else "✗"
        print(f"{status} {campaign_type}: {metrics['engagement_rate']:.1%} engagement")

    print("\nSession 2: Campaign recommendations")
    print("-" * 40)

    # Get recommendation
    rec = fabien.recommend_campaign_type()
    print(f"Best performing campaign type: {rec['recommended_type']}")

    print("\nEffectiveness scores:")
    for ctype, score in sorted(rec['effectiveness_scores'].items(),
                              key=lambda x: x[1], reverse=True):
        print(f"  - {ctype}: {score:.2f}")

    # Get audience insights
    insights = fabien.get_audience_insights()
    print(f"\nAudience insights:")
    print(f"  Most successful type: {insights['most_successful_type']}")
    print(f"  Success count: {insights['successful_campaign_count']}/{insights['total_campaigns']}")

    fabien.save()
    print("\n✓ Fabien's memory saved")


def demo_shared_memory():
    """Demonstrate cross-agent shared memory."""
    print_section("SHARED MEMORY DEMO")

    shared = SharedMemory(memory_dir="./demo_memories/shared")

    print("Cross-agent learning")
    print("-" * 40)

    # Marie discovers user prefers detailed reports
    shared.update_user_preference(
        "detail_level",
        0.9,
        source_agent="marie",
        weight=1.0
    )
    print("✓ Marie observed: User prefers detailed reports (0.9)")

    # Anga accesses this preference
    detail_level = shared.get_user_preference("detail_level")
    print(f"✓ Anga retrieved: detail_level = {detail_level}")
    print("  → Anga will now also provide detailed reports")

    # Record collaboration
    shared.record_collaboration(
        agents=["marie", "fabien"],
        task_description="Student recital promotion",
        success=True,
        insights="Marie's student data helped Fabien create targeted campaign"
    )
    print("\n✓ Collaboration recorded: marie + fabien (success)")

    # Share a learning
    shared.share_learning(
        learning_type="user_communication",
        insight="User responds best to bullet-point summaries",
        source_agent="anga",
        applicable_to=["marie", "fabien"],
        confidence=0.85
    )
    print("✓ Anga shared learning with Marie and Fabien")

    # Get insights
    summary = shared.get_insights_summary()
    print(f"\nShared memory summary:")
    print(f"  User preferences: {summary['user_preferences_count']}")
    print(f"  Project events: {summary['project_events_count']}")
    print(f"  Shared learnings: {summary['shared_learnings_count']}")
    print(f"  Collaborations: {summary['collaborations_count']}")

    shared.save()
    print("\n✓ Shared memory saved")


def demo_taskmaster_integration():
    """Demonstrate Task Master AI memory integration."""
    print_section("TASK MASTER MEMORY DEMO")

    tm = TaskMasterMemory(memory_dir="./demo_memories/taskmaster")

    print("Recording task executions")
    print("-" * 40)

    # Record task executions
    tasks = [
        ("1.1", "Implement user authentication", "authentication", "jwt_approach", True, 240.0, "medium"),
        ("1.2", "Add input validation", "security", "zod_validation", True, 120.0, "low"),
        ("2.1", "Refactor auth module", "refactoring", "extract_functions", True, 180.0, "medium"),
        ("2.2", "Add unit tests", "testing", "jest_tests", True, 150.0, "low"),
        ("3.1", "Implement OAuth", "authentication", "passport_strategy", False, 300.0, "high")
    ]

    for task_id, desc, category, approach, success, time, complexity in tasks:
        tm.record_task_execution(
            task_id, desc, category, approach, success, time, complexity
        )
        status = "✓" if success else "✗"
        print(f"{status} Task {task_id}: {desc} ({approach}, {time}s)")

    print("\nGetting task suggestions")
    print("-" * 40)

    # Get suggestion for new auth task
    suggestion = tm.suggest_approach(
        "Add two-factor authentication",
        "authentication"
    )

    print(f"Task: 'Add two-factor authentication'")
    print(f"Category: {suggestion['recommended_approach']}")
    print(f"Confidence: {suggestion['confidence']:.1%}")

    if suggestion['similar_tasks']:
        print("\nSimilar past tasks:")
        for task in suggestion['similar_tasks'][:3]:
            status = "✓" if task['success'] else "✗"
            print(f"  {status} {task['task_id']}: {task['approach']}")

    # Get category insights
    print("\nCategory insights: authentication")
    print("-" * 40)
    insights = tm.get_category_insights("authentication")
    print(f"  Total tasks: {insights['total_tasks']}")
    print(f"  Success rate: {insights['success_rate']:.1%}")
    print(f"  Avg time: {insights['avg_execution_time']:.1f}s")
    print(f"  Best approach: {insights['most_successful_approach']}")

    tm.save()
    print("\n✓ TaskMaster memory saved")


def demo_full_scenario():
    """Demonstrate a complete multi-session scenario."""
    print_section("FULL MULTI-SESSION SCENARIO")

    print("Scenario: Dance School Management System")
    print("=" * 60)

    print("\n📅 Week 1 - Initial Setup")
    print("-" * 40)

    orchestrator = OrchestratorMemory(memory_dir="./demo_memories/orchestrator")
    marie = MarieMemory(memory_dir="./demo_memories/marie")
    shared = SharedMemory(memory_dir="./demo_memories/shared")

    # User asks for student evaluation
    print("\n👤 User: 'Evaluate all intermediate students'")

    # Orchestrator delegates to Marie (no memory yet)
    print("🤖 Orchestrator: Delegating to Marie (first time, no history)")
    orchestrator.store_delegation(
        "Evaluate all intermediate students",
        ["marie"],
        "Student evaluation",
        True,
        240.0,
        0.9
    )

    # Marie evaluates students
    print("💃 Marie: Evaluating students...")
    marie.remember_student("Sophie", {
        'technique': 8.0, 'flexibility': 7.5,
        'strength': 7.0, 'musicality': 8.5
    })
    print("   ✓ Evaluated Sophie")

    # Marie notes user preference
    shared.update_user_preference("detail_level", 0.9, "marie")
    print("   ✓ Marie noted: User prefers detailed reports")

    print("\n📅 Week 2 - Building Memory")
    print("-" * 40)

    # Similar request
    print("\n👤 User: 'How are the intermediate students doing?'")

    # Orchestrator now has memory
    recommendation = orchestrator.plan_delegation(
        "How are the intermediate students doing?",
        ["marie", "anga", "fabien"]
    )
    print(f"🤖 Orchestrator: Using memory!")
    print(f"   → Detected category: {recommendation['category']}")
    print(f"   → Recommended: {recommendation['recommended_workers']}")
    print(f"   → Confidence: {recommendation['confidence']:.1%} (based on past success)")

    # Marie uses her memory
    print("💃 Marie: Retrieving student history...")
    history = marie.get_student_history("Sophie")
    print(f"   ✓ Found {len(history)} past assessment(s) for Sophie")
    print("   ✓ Providing progress comparison (memory-enabled!)")

    # Update shared preference
    detail = shared.get_user_preference("detail_level")
    print(f"   ✓ Using shared preference: detail_level={detail}")

    print("\n📅 Week 4 - Full Autonomy")
    print("-" * 40)

    print("\n👤 User: 'Student check-in'")

    # Orchestrator is now experienced
    rec = orchestrator.plan_delegation("Student check-in", ["marie", "anga", "fabien"])
    print(f"🤖 Orchestrator: High confidence delegation!")
    print(f"   → Confidence: {rec['confidence']:.1%}")
    print(f"   → Similar cases: {len(rec['similar_cases'])} precedents")
    print("   → Optimal approach learned from history")

    # Marie is now autonomous
    print("💃 Marie: Autonomous student management")
    recs = marie.recommend_exercises("Sophie")
    print(f"   ✓ Generated personalized recommendations")
    print(f"   ✓ Based on {recs['past_assessments']} assessment(s)")
    print(f"   ✓ Focus areas identified: {recs['focus_areas']}")

    print("\n✨ Result: Near-autonomous operation achieved!")
    print("   - Orchestrator learned optimal delegation")
    print("   - Marie remembers all students")
    print("   - Shared preferences respected")
    print("   - Minimal user input needed")

    # Save all memories
    orchestrator.save()
    marie.save()
    shared.save()
    print("\n💾 All memories saved for future sessions")


def main():
    """Run all demos."""
    print("\n" + "=" * 60)
    print("  MEMORY-POWERED AI DEMONSTRATION")
    print("=" * 60)

    # Create demo directory
    Path("./demo_memories").mkdir(exist_ok=True)

    # Run demos
    demo_orchestrator_learning()
    demo_marie_student_memory()
    demo_anga_code_memory()
    demo_fabien_campaign_memory()
    demo_shared_memory()
    demo_taskmaster_integration()
    demo_full_scenario()

    print_section("DEMO COMPLETE")
    print("✓ All memory systems demonstrated")
    print("✓ Memory files saved to ./demo_memories/")
    print("\nKey Takeaways:")
    print("  1. Agents learn from every interaction")
    print("  2. Memory enables personalization")
    print("  3. Cross-agent learning through shared memory")
    print("  4. Continuous improvement across sessions")
    print("  5. Near-autonomous operation after sufficient experience")

    print("\n📚 Next Steps:")
    print("  - Review memory files in ./demo_memories/")
    print("  - Integrate into your multi-agent system")
    print("  - Watch agents improve over time!")


if __name__ == "__main__":
    main()
