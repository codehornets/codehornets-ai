"""Response Generator Tool"""

from typing import Dict, Any


class ResponseGenerator:
    """Tool for generating objection responses."""

    def __init__(self):
        self.name = "Response Generator"

    def generate(self, objection: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Generate response to objection."""
        return ""

    def get_template(self, category: str) -> str:
        """Get response template for category."""
        templates = {
            "price": "I understand budget is a concern. Let's discuss the ROI...",
            "timing": "I hear that timing is important. Can we explore...",
        }
        return templates.get(category, "")
