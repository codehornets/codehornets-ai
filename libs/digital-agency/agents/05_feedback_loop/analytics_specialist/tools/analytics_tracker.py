"""Analytics Tracking Tool"""

from typing import Dict, Any, List
from datetime import datetime


class AnalyticsTracker:
    """
    Tool for tracking and managing analytics data.
    """

    def __init__(self):
        """Initialize the analytics tracker."""
        self.metrics_store = {}
        self.event_log = []

    def track_event(self, event_name: str, properties: Dict[str, Any]) -> str:
        """
        Track an analytics event.

        Args:
            event_name: Name of the event
            properties: Event properties

        Returns:
            Event ID
        """
        event_id = f"evt_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        event = {
            "event_id": event_id,
            "name": event_name,
            "properties": properties,
            "timestamp": datetime.now().isoformat()
        }

        self.event_log.append(event)

        return event_id

    def track_metric(self, metric_name: str, value: float,
                    tags: Dict[str, str] = None) -> str:
        """
        Track a metric value.

        Args:
            metric_name: Name of the metric
            value: Metric value
            tags: Optional tags for the metric

        Returns:
            Metric ID
        """
        metric_id = f"metric_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if metric_name not in self.metrics_store:
            self.metrics_store[metric_name] = []

        self.metrics_store[metric_name].append({
            "metric_id": metric_id,
            "value": value,
            "tags": tags or {},
            "timestamp": datetime.now().isoformat()
        })

        return metric_id

    def get_metrics(self, metric_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve metric values.

        Args:
            metric_name: Name of the metric
            limit: Maximum number of values to return

        Returns:
            List of metric values
        """
        if metric_name not in self.metrics_store:
            return []

        return self.metrics_store[metric_name][-limit:]

    def calculate_aggregate(self, metric_name: str, function: str = "avg") -> float:
        """
        Calculate aggregate metric value.

        Args:
            metric_name: Name of the metric
            function: Aggregation function (avg, sum, min, max)

        Returns:
            Aggregated value
        """
        metrics = self.get_metrics(metric_name)

        if not metrics:
            return 0.0

        values = [m["value"] for m in metrics]

        if function == "avg":
            return sum(values) / len(values)
        elif function == "sum":
            return sum(values)
        elif function == "min":
            return min(values)
        elif function == "max":
            return max(values)
        else:
            return 0.0
