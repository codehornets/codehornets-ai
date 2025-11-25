#!/usr/bin/env python3
"""
Installation Verification Script

Checks that all components are properly installed and configured.
"""

import sys
import os
from pathlib import Path


def check_python_version():
    """Check Python version is 3.10+"""
    version = sys.version_info
    print(f"🐍 Python Version: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print("   ❌ Python 3.10+ required")
        return False
    print("   ✅ Python version OK")
    return True


def check_dependencies():
    """Check required dependencies are installed"""
    print("\n📦 Checking Dependencies...")

    dependencies = [
        ('fastapi', 'FastAPI'),
        ('uvicorn', 'Uvicorn'),
        ('pydantic', 'Pydantic'),
        ('celery', 'Celery'),
        ('redis', 'Redis'),
        ('yaml', 'PyYAML'),
    ]

    all_ok = True
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"   ✅ {name}")
        except ImportError:
            print(f"   ❌ {name} not installed")
            all_ok = False

    return all_ok


def check_directory_structure():
    """Check required directories exist"""
    print("\n📁 Checking Directory Structure...")

    base_path = Path(__file__).parent.parent

    required_dirs = [
        'api/core',
        'api/routes',
        'api/schemas',
        'api/middleware',
        'api/tasks',
        'agents',
    ]

    all_ok = True
    for dir_path in required_dirs:
        full_path = base_path / dir_path
        if full_path.exists():
            print(f"   ✅ {dir_path}")
        else:
            print(f"   ❌ {dir_path} missing")
            all_ok = False

    return all_ok


def check_agent_discovery():
    """Check agent discovery works"""
    print("\n🔍 Checking Agent Discovery...")

    try:
        # Add parent to path
        sys.path.insert(0, str(Path(__file__).parent.parent))

        from api.core import AgentDiscovery

        discovery = AgentDiscovery()
        discovery.discover_agents()

        domains = discovery.list_domains()
        total_agents = sum(len(agents) for agents in discovery.agents_catalog.values())

        print(f"   ✅ Found {total_agents} agents across {len(domains)} domains")

        for domain in domains:
            agents = discovery.list_agents_in_domain(domain)
            print(f"      • {domain}: {len(agents)} agents")

        return True

    except Exception as e:
        print(f"   ❌ Agent discovery failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_api_imports():
    """Check API modules can be imported"""
    print("\n🔌 Checking API Imports...")

    try:
        sys.path.insert(0, str(Path(__file__).parent.parent))

        from api.core import AgentExecutor, AgentDiscovery
        from api.core.exceptions import AgentNotFoundError
        from api.schemas.agent_execution_schemas import AgentExecuteRequest

        print("   ✅ Core modules")
        print("   ✅ Schemas")
        print("   ✅ Exceptions")

        return True

    except Exception as e:
        print(f"   ❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_env_file():
    """Check .env file exists"""
    print("\n⚙️  Checking Configuration...")

    env_file = Path(__file__).parent / '.env'
    env_example = Path(__file__).parent / '.env.example'

    if env_file.exists():
        print("   ✅ .env file exists")
        return True
    elif env_example.exists():
        print("   ⚠️  .env file not found, but .env.example exists")
        print("      Copy .env.example to .env and configure")
        return True
    else:
        print("   ❌ .env file missing")
        return False


def check_redis_connection():
    """Check Redis connection (optional)"""
    print("\n🔴 Checking Redis Connection (optional)...")

    try:
        import redis

        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

        # Parse Redis URL
        if 'redis://' in redis_url:
            parts = redis_url.split('://')[-1]
            if '@' in parts:
                auth, host_port = parts.split('@')
                password = auth.split(':')[-1] if ':' in auth else None
                host_port = host_port.split('/')[0]
            else:
                password = None
                host_port = parts.split('/')[0]

            if ':' in host_port:
                host, port = host_port.split(':')
            else:
                host, port = host_port, 6379
        else:
            host, port, password = 'localhost', 6379, None

        r = redis.Redis(host=host, port=int(port), password=password, socket_connect_timeout=2)
        r.ping()

        print(f"   ✅ Redis connected ({host}:{port})")
        return True

    except Exception as e:
        print(f"   ⚠️  Redis not available: {e}")
        print("      (This is OK for basic API functionality)")
        return True  # Don't fail on Redis


def main():
    """Run all checks"""
    print("=" * 60)
    print("Digital Agency API - Installation Verification")
    print("=" * 60)

    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Directory Structure", check_directory_structure),
        ("Environment Config", check_env_file),
        ("API Imports", check_api_imports),
        ("Agent Discovery", check_agent_discovery),
        ("Redis Connection", check_redis_connection),
    ]

    results = []

    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} check crashed: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")

    print(f"\n{passed}/{total} checks passed")

    if passed == total:
        print("\n🎉 All checks passed! Installation verified.")
        print("\nNext steps:")
        print("  1. Start the API: ./start.sh or make dev")
        print("  2. Visit http://localhost:8000/docs")
        print("  3. Try the Quick Start guide: QUICKSTART.md")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please review the errors above.")
        print("\nTroubleshooting:")
        print("  1. Install dependencies: pip install -r requirements.txt")
        print("  2. Copy .env.example to .env")
        print("  3. Check Python version (3.10+ required)")
        return 1


if __name__ == '__main__':
    sys.exit(main())
