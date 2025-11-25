"""Cost Calculator Tool"""

from typing import Dict, Any, List
from datetime import datetime


class CostCalculatorTool:
    """Tool for calculating service costs."""

    def __init__(self):
        self.name = "Cost Calculator"

    def calculate_total_cost(self, components: List[Dict[str, Any]]) -> float:
        """Calculate total cost from components."""
        return sum(c.get("cost", 0) for c in components)
