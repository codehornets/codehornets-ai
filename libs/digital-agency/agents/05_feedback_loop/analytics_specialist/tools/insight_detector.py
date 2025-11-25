"""Insight Detection Tool"""

from typing import Dict, Any, List
from datetime import datetime


class InsightDetector:
    """
    Tool for detecting insights and patterns in analytics data.
    """

    def __init__(self):
        """Initialize the insight detector."""
        self.insights = []
        self.patterns = []

    def detect_trends(self, data: List[Dict[str, Any]],
                     metric_name: str) -> List[Dict[str, Any]]:
        """
        Detect trends in metric data.

        Args:
            data: Metric data points
            metric_name: Name of the metric

        Returns:
            List of detected trends
        """
        trends = []

        if len(data) < 2:
            return trends

        # Simple trend detection
        values = [d.get("value", 0) for d in data]
        avg_change = (values[-1] - values[0]) / len(values)

        if avg_change > 0:
            trend_type = "increasing"
        elif avg_change < 0:
            trend_type = "decreasing"
        else:
            trend_type = "stable"

        trends.append({
            "metric": metric_name,
            "trend_type": trend_type,
            "change_rate": avg_change,
            "confidence": 0.75,
            "detected_at": datetime.now().isoformat()
        })

        return trends

    def detect_anomalies(self, data: List[Dict[str, Any]],
                        threshold: float = 2.0) -> List[Dict[str, Any]]:
        """
        Detect anomalies in data.

        Args:
            data: Data points to analyze
            threshold: Standard deviation threshold

        Returns:
            List of detected anomalies
        """
        anomalies = []

        if len(data) < 3:
            return anomalies

        values = [d.get("value", 0) for d in data]
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5

        for i, point in enumerate(data):
            value = point.get("value", 0)
            z_score = abs((value - mean) / std_dev) if std_dev > 0 else 0

            if z_score > threshold:
                anomalies.append({
                    "index": i,
                    "value": value,
                    "z_score": z_score,
                    "severity": "high" if z_score > 3 else "medium",
                    "detected_at": datetime.now().isoformat()
                })

        return anomalies

    def generate_insights(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate actionable insights from context.

        Args:
            context: Analysis context

        Returns:
            List of insights
        """
        insights = [
            {
                "insight_id": f"insight_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "type": "performance",
                "description": "Performance insight based on data analysis",
                "priority": "high",
                "actionable": True,
                "recommendations": [
                    "Review current strategy",
                    "Implement optimization"
                ],
                "confidence": 0.8,
                "generated_at": datetime.now().isoformat()
            }
        ]

        self.insights.extend(insights)

        return insights

    def compare_periods(self, period1_data: List[Dict[str, Any]],
                       period2_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compare metrics between two time periods.

        Args:
            period1_data: Data from first period
            period2_data: Data from second period

        Returns:
            Comparison results
        """
        if not period1_data or not period2_data:
            return {"error": "Insufficient data for comparison"}

        values1 = [d.get("value", 0) for d in period1_data]
        values2 = [d.get("value", 0) for d in period2_data]

        avg1 = sum(values1) / len(values1)
        avg2 = sum(values2) / len(values2)

        change = avg2 - avg1
        change_percent = (change / avg1 * 100) if avg1 != 0 else 0

        return {
            "period1_avg": avg1,
            "period2_avg": avg2,
            "absolute_change": change,
            "percent_change": change_percent,
            "direction": "increase" if change > 0 else "decrease" if change < 0 else "no change"
        }
