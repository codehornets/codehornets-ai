"""Issue tracking tool."""

from typing import Dict, Any, List


class IssueTracker:
    """Tool for tracking software issues and bugs."""

    def __init__(self):
        self.name = "Issue Tracker"
        self.issues = {}

    def create_issue(self, issue_data: Dict[str, Any]) -> str:
        """Create a new issue."""
        issue_id = f"ISS-{len(self.issues) + 1:05d}"
        self.issues[issue_id] = {**issue_data, 'id': issue_id}
        return issue_id

    def get_issue(self, issue_id: str) -> Dict[str, Any]:
        """Retrieve issue by ID."""
        return self.issues.get(issue_id, {})

    def update_issue(self, issue_id: str, updates: Dict[str, Any]) -> bool:
        """Update issue information."""
        if issue_id in self.issues:
            self.issues[issue_id].update(updates)
            return True
        return False

    def list_by_status(self, status: str) -> List[Dict[str, Any]]:
        """List issues by status."""
        return [i for i in self.issues.values() if i.get('status') == status]
