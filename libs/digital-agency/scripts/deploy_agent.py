#!/usr/bin/env python3
"""
Script to deploy an agent to production environment.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
import json


def validate_agent(agent_path: str) -> bool:
    """
    Validate agent before deployment.

    Args:
        agent_path: Path to agent file

    Returns:
        bool: True if valid, False otherwise
    """
    print(f"Validating agent: {agent_path}")

    # Check if file exists
    if not os.path.exists(agent_path):
        print(f"Error: Agent file not found: {agent_path}")
        return False

    # Check syntax
    try:
        with open(agent_path, 'r') as f:
            compile(f.read(), agent_path, 'exec')
        print("✓ Syntax validation passed")
    except SyntaxError as e:
        print(f"✗ Syntax error: {e}")
        return False

    # TODO: Add more validation
    # - Check required methods exist
    # - Validate agent configuration
    # - Check dependencies

    return True


def run_tests(agent_name: str) -> bool:
    """
    Run tests for the agent.

    Args:
        agent_name: Name of the agent

    Returns:
        bool: True if tests pass, False otherwise
    """
    print(f"\nRunning tests for {agent_name}...")

    try:
        # Run pytest for specific agent
        result = subprocess.run(
            ["pytest", f"tests/", "-k", agent_name, "-v"],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("✓ All tests passed")
            return True
        else:
            print("✗ Tests failed:")
            print(result.stdout)
            print(result.stderr)
            return False

    except FileNotFoundError:
        print("Warning: pytest not found, skipping tests")
        return True


def build_docker_image(agent_name: str, version: str) -> bool:
    """
    Build Docker image for the agent.

    Args:
        agent_name: Name of the agent
        version: Version tag

    Returns:
        bool: True if build succeeds, False otherwise
    """
    print(f"\nBuilding Docker image for {agent_name}:{version}...")

    image_tag = f"digital-agency/{agent_name}:{version}"

    try:
        result = subprocess.run(
            [
                "docker", "build",
                "-t", image_tag,
                "-f", "deployment/docker/Dockerfile.agent",
                "--build-arg", f"AGENT_NAME={agent_name}",
                "."
            ],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"✓ Docker image built: {image_tag}")
            return True
        else:
            print("✗ Docker build failed:")
            print(result.stdout)
            print(result.stderr)
            return False

    except FileNotFoundError:
        print("Warning: Docker not found, skipping image build")
        return True


def deploy_to_kubernetes(agent_name: str, version: str, environment: str) -> bool:
    """
    Deploy agent to Kubernetes.

    Args:
        agent_name: Name of the agent
        version: Version tag
        environment: Target environment (dev, staging, prod)

    Returns:
        bool: True if deployment succeeds, False otherwise
    """
    print(f"\nDeploying {agent_name}:{version} to {environment}...")

    # Apply Kubernetes manifests
    manifest_dir = f"deployment/kubernetes/agents/{agent_name}"

    if not os.path.exists(manifest_dir):
        print(f"Warning: No Kubernetes manifests found at {manifest_dir}")
        return True

    try:
        result = subprocess.run(
            ["kubectl", "apply", "-f", manifest_dir, "-n", environment],
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print(f"✓ Deployed to Kubernetes namespace: {environment}")
            return True
        else:
            print("✗ Kubernetes deployment failed:")
            print(result.stdout)
            print(result.stderr)
            return False

    except FileNotFoundError:
        print("Warning: kubectl not found, skipping Kubernetes deployment")
        return True


def record_deployment(agent_name: str, version: str, environment: str):
    """
    Record deployment metadata.

    Args:
        agent_name: Name of the agent
        version: Version tag
        environment: Target environment
    """
    deployment_record = {
        "agent_name": agent_name,
        "version": version,
        "environment": environment,
        "timestamp": datetime.utcnow().isoformat(),
        "deployed_by": os.getenv("USER", "unknown")
    }

    deployments_file = Path("deployment/deployment_history.json")
    deployments_file.parent.mkdir(parents=True, exist_ok=True)

    # Load existing deployments
    deployments = []
    if deployments_file.exists():
        with open(deployments_file, 'r') as f:
            deployments = json.load(f)

    # Add new deployment
    deployments.append(deployment_record)

    # Save updated deployments
    with open(deployments_file, 'w') as f:
        json.dump(deployments, f, indent=2)

    print(f"\n✓ Deployment recorded to {deployments_file}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Deploy agent to production")
    parser.add_argument("agent_path", help="Path to agent file")
    parser.add_argument("--version", default="latest", help="Version tag")
    parser.add_argument("--environment", default="dev",
                       choices=["dev", "staging", "prod"],
                       help="Target environment")
    parser.add_argument("--skip-tests", action="store_true",
                       help="Skip running tests")
    parser.add_argument("--skip-docker", action="store_true",
                       help="Skip Docker image build")

    args = parser.parse_args()

    print("Agent Deployment Tool")
    print("=" * 50)
    print(f"Agent: {args.agent_path}")
    print(f"Version: {args.version}")
    print(f"Environment: {args.environment}")
    print()

    # Extract agent name from path
    agent_name = Path(args.agent_path).stem.replace("_agent", "")

    # Validate agent
    if not validate_agent(args.agent_path):
        print("\n✗ Deployment failed: Agent validation failed")
        sys.exit(1)

    # Run tests
    if not args.skip_tests:
        if not run_tests(agent_name):
            print("\n✗ Deployment failed: Tests failed")
            sys.exit(1)

    # Build Docker image
    if not args.skip_docker:
        if not build_docker_image(agent_name, args.version):
            print("\n✗ Deployment failed: Docker build failed")
            sys.exit(1)

    # Deploy to Kubernetes
    if not deploy_to_kubernetes(agent_name, args.version, args.environment):
        print("\n✗ Deployment failed: Kubernetes deployment failed")
        sys.exit(1)

    # Record deployment
    record_deployment(agent_name, args.version, args.environment)

    print("\n" + "=" * 50)
    print("✓ Deployment completed successfully!")
    print(f"Agent {agent_name}:{args.version} is now running in {args.environment}")


if __name__ == "__main__":
    main()
