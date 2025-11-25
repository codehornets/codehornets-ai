"""Objection Classifier Tool"""

from typing import Dict, Any


class ObjectionClassifier:
    """Tool for classifying objections."""

    def __init__(self):
        self.name = "Objection Classifier"
        self.categories = ["price", "timing", "authority", "need", "trust", "product"]

    def classify(self, objection: str) -> Dict[str, Any]:
        """Classify an objection."""
        return {
            "category": "unknown",
            "subcategory": "",
            "severity": "medium",
            "confidence": 0.0,
        }

    def get_severity(self, objection: str) -> str:
        """Determine objection severity."""
        return "medium"
