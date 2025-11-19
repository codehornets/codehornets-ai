"""Margin Analyzer Tool"""

from typing import Dict, Any
from datetime import datetime


class MarginAnalyzerTool:
    """Tool for analyzing profit margins."""

    def __init__(self):
        self.name = "Margin Analyzer"

    def analyze_margin(self, cost: float, price: float) -> Dict[str, Any]:
        """Analyze profit margin metrics."""
        margin = ((price - cost) / price * 100) if price > 0 else 0
        return {
            "margin_percentage": margin,
            "profit": price - cost,
            "markup": ((price - cost) / cost * 100) if cost > 0 else 0
        }
