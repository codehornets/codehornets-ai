"""
Bug Tracker Agent

Tracks, categorizes, and manages software bugs and issues through their lifecycle.
"""

from typing import Dict, List, Any, Optional
import yaml
from pathlib import Path


class BugTrackerAgent:
    """
    Agent responsible for bug tracking and issue management.

    Capabilities:
    - Track and categorize bugs
    - Prioritize issues
    - Manage bug lifecycle
    - Generate bug reports
    - Track resolution progress
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Bug Tracker Agent."""
        self.config = self._load_config(config_path)
        self.name = "Bug Tracker Agent"
        self.role = "bug_tracker"
        self.active_bugs = []

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'Bug Tracker Agent',
            'model': 'gpt-4',
            'temperature': 0.3,
            'capabilities': ['bug_tracking', 'issue_management', 'reporting']
        }

    async def create_bug_report(self, bug_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new bug report."""
        bug = {
            'id': f"BUG-{len(self.active_bugs) + 1:05d}",
            'title': bug_data.get('title'),
            'severity': bug_data.get('severity', 'medium'),
            'status': 'open',
            'created_at': 'timestamp'
        }
        self.active_bugs.append(bug)
        return bug

    async def categorize_bug(self, bug_id: str) -> Dict[str, Any]:
        """Categorize a bug based on its characteristics."""
        return {'bug_id': bug_id, 'category': 'functionality', 'subcategory': 'ui'}

    async def prioritize_bugs(self) -> List[Dict[str, Any]]:
        """Prioritize bugs based on severity and impact."""
        return sorted(self.active_bugs, key=lambda x: x.get('severity'), reverse=True)

    def get_status(self) -> Dict[str, Any]:
        """Get current tracker status."""
        return {
            'agent': self.name,
            'active_bugs': len(self.active_bugs),
            'status': 'active'
        }
