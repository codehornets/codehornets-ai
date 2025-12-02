#!/usr/bin/env python3
"""
Test script to validate PTY orchestrator fix for Claude CLI input submission.

This tests the character-by-character sending approach for Ink/React TUI apps.
"""

import os
import sys
import time
from pathlib import Path

# Add tools directory to path
sys.path.insert(0, str(Path(__file__).parent))

from pty_orchestrator import MultiAgentOrchestrator, AgentConfig

def test_basic_input():
    """Test basic input submission with the fixed approach"""
    print("=" * 60)
    print("  Testing PTY Input Fix")
    print("  Testing character-by-character sending for Claude CLI")
    print("=" * 60)
    print()

    orchestrator = MultiAgentOrchestrator()

    try:
        # Create workspace
        workspace = "/tmp/claude_test_workspace"
        os.makedirs(workspace, exist_ok=True)

        print("Starting Claude CLI agent...")
        print()

        # Start agent with custom config for faster testing
        test_agent = orchestrator.add_agent(
            "test",
            "claude",
            working_dir=workspace,
            char_delay=0.01,      # 10ms between characters
            submit_delay=0.3      # 300ms before Enter
        )

        print("\n" + "=" * 60)
        print("  Test 1: Simple 5-word response")
        print("=" * 60 + "\n")

        response1 = orchestrator.send_to("test",
            "Say hello in exactly 5 words"
        )

        print(f"\n{'=' * 60}")
        print("Response 1:")
        print(f"{'=' * 60}")
        print(response1)
        print()

        # Verify we got a real response, not just echo
        if len(response1.split()) >= 3 and "hello" in response1.lower():
            print("✅ Test 1 PASSED - Got real response from Claude")
        else:
            print("❌ Test 1 FAILED - Response looks like echo or empty")

        print("\n" + "=" * 60)
        print("  Test 2: Context preservation (follow-up)")
        print("=" * 60 + "\n")

        response2 = orchestrator.send_to("test",
            "Now say goodbye in exactly 3 words"
        )

        print(f"\n{'=' * 60}")
        print("Response 2:")
        print(f"{'=' * 60}")
        print(response2)
        print()

        if len(response2.split()) >= 2 and "goodbye" in response2.lower():
            print("✅ Test 2 PASSED - Context preserved, got real response")
        else:
            print("❌ Test 2 FAILED - Response looks like echo or empty")

        print("\n" + "=" * 60)
        print("  Test 3: Longer message")
        print("=" * 60 + "\n")

        response3 = orchestrator.send_to("test",
            "List three programming languages in a single sentence"
        )

        print(f"\n{'=' * 60}")
        print("Response 3:")
        print(f"{'=' * 60}")
        print(response3)
        print()

        if len(response3.split()) >= 5:
            print("✅ Test 3 PASSED - Got substantial response")
        else:
            print("❌ Test 3 FAILED - Response too short")

        print("\n" + "=" * 60)
        print("  All Tests Complete!")
        print("=" * 60)

        # Save conversation log
        orchestrator.save_log("/tmp/pty_test_results.json")

    except KeyboardInterrupt:
        print("\n\nTest interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        orchestrator._shutdown()


def test_timing_variations():
    """Test different timing configurations to find optimal values"""
    print("=" * 60)
    print("  Testing Timing Variations")
    print("=" * 60)
    print()

    timing_configs = [
        {"char_delay": 0.005, "submit_delay": 0.2},  # Fast
        {"char_delay": 0.01, "submit_delay": 0.3},   # Default
        {"char_delay": 0.02, "submit_delay": 0.5},   # Slow
    ]

    for i, config in enumerate(timing_configs, 1):
        print(f"\n{'=' * 60}")
        print(f"  Config {i}: char_delay={config['char_delay']}, submit_delay={config['submit_delay']}")
        print(f"{'=' * 60}\n")

        orchestrator = MultiAgentOrchestrator()

        try:
            workspace = f"/tmp/claude_timing_test_{i}"
            os.makedirs(workspace, exist_ok=True)

            agent = orchestrator.add_agent(
                f"timing_test_{i}",
                "claude",
                working_dir=workspace,
                **config
            )

            start = time.time()
            response = orchestrator.send_to(f"timing_test_{i}",
                "Say hello in exactly 3 words"
            )
            elapsed = time.time() - start

            success = len(response.split()) >= 2 and "hello" in response.lower()
            status = "✅ PASS" if success else "❌ FAIL"

            print(f"\n{status} - Time: {elapsed:.2f}s")
            print(f"Response: {response[:100]}")

        except Exception as e:
            print(f"❌ ERROR: {e}")
        finally:
            orchestrator._shutdown()
            time.sleep(2)  # Cool down between tests


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test PTY orchestrator fix")
    parser.add_argument("--test", choices=["basic", "timing", "all"], default="basic",
                       help="Test type: basic (simple test), timing (test variations), all (both)")

    args = parser.parse_args()

    if args.test in ["basic", "all"]:
        test_basic_input()

    if args.test in ["timing", "all"]:
        time.sleep(3)  # Cool down between test suites
        test_timing_variations()

    print("\n\nAll tests complete!")
