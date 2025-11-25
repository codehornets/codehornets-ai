"""
Trend Analyzer Tool

Tool for analyzing trends and patterns in market data.
"""

from typing import Dict, Any, List
from datetime import datetime


class TrendAnalyzerTool:
    """
    Tool for analyzing trends and identifying patterns in market data.

    Uses statistical analysis and pattern recognition.
    """

    def __init__(self):
        """Initialize the Trend Analyzer Tool."""
        self.name = "Trend Analyzer"
        self.analysis_methods = ["moving_average", "regression", "seasonal_decomposition"]

    def identify_trends(self, data: List[Dict[str, Any]], metric: str) -> Dict[str, Any]:
        """
        Identify trends in time-series data.

        Args:
            data: Time-series data points
            metric: Metric to analyze

        Returns:
            Dictionary containing trend analysis
        """
        if not data or not metric:
            raise ValueError("Data and metric are required")

        values = [d.get(metric, 0) for d in data if metric in d]
        if len(values) < 2:
            raise ValueError("At least 2 data points required for trend analysis")

        # Calculate trend direction
        trend_direction = self._calculate_trend_direction(values)
        trend_strength = self._calculate_trend_strength(values)

        # Detect patterns
        patterns = self._detect_patterns(values)

        # Find anomalies
        anomalies = self._find_anomalies(values, data)

        analysis = {
            "metric": metric,
            "data_points": len(data),
            "timestamp": datetime.now().isoformat(),
            "trend_direction": trend_direction,
            "trend_strength": trend_strength,
            "patterns": patterns,
            "anomalies": anomalies,
            "statistics": {
                "mean": sum(values) / len(values) if values else 0,
                "min": min(values) if values else 0,
                "max": max(values) if values else 0,
                "change_percent": self._calculate_change_percent(values)
            }
        }

        return analysis

    def _calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate trend direction."""
        if len(values) < 2:
            return "insufficient_data"

        # Simple linear regression approach
        n = len(values)
        x_mean = (n - 1) / 2
        y_mean = sum(values) / n

        numerator = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return "stable"

        slope = numerator / denominator

        if slope > 0.05:
            return "upward"
        elif slope < -0.05:
            return "downward"
        else:
            return "stable"

    def _calculate_trend_strength(self, values: List[float]) -> float:
        """Calculate trend strength (0.0-1.0)."""
        if len(values) < 2:
            return 0.0

        # Calculate coefficient of variation
        mean = sum(values) / len(values)
        if mean == 0:
            return 0.0

        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5
        cv = std_dev / mean

        # Normalize to 0-1 scale (inverse - lower CV means stronger trend)
        strength = max(0, min(1, 1 - cv))
        return round(strength, 3)

    def _detect_patterns(self, values: List[float]) -> List[str]:
        """Detect common patterns in data."""
        patterns = []

        if len(values) < 3:
            return patterns

        # Check for consistent growth
        if all(values[i] < values[i+1] for i in range(len(values)-1)):
            patterns.append("consistent_growth")

        # Check for consistent decline
        if all(values[i] > values[i+1] for i in range(len(values)-1)):
            patterns.append("consistent_decline")

        # Check for volatility
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5
        if std_dev / mean > 0.3:
            patterns.append("high_volatility")

        # Check for cyclical pattern
        if self._is_cyclical(values):
            patterns.append("cyclical")

        return patterns

    def _is_cyclical(self, values: List[float]) -> bool:
        """Check if data shows cyclical pattern."""
        if len(values) < 6:
            return False

        # Simple peak/trough detection
        peaks = 0
        troughs = 0
        for i in range(1, len(values) - 1):
            if values[i] > values[i-1] and values[i] > values[i+1]:
                peaks += 1
            elif values[i] < values[i-1] and values[i] < values[i+1]:
                troughs += 1

        return peaks >= 2 and troughs >= 2

    def _find_anomalies(self, values: List[float], data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find anomalies in data."""
        if len(values) < 3:
            return []

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5

        anomalies = []
        threshold = 2 * std_dev

        for i, value in enumerate(values):
            if abs(value - mean) > threshold:
                anomalies.append({
                    "index": i,
                    "value": value,
                    "deviation": abs(value - mean),
                    "type": "high" if value > mean else "low",
                    "timestamp": data[i].get("timestamp") if i < len(data) else None
                })

        return anomalies

    def _calculate_change_percent(self, values: List[float]) -> float:
        """Calculate percentage change from first to last value."""
        if len(values) < 2 or values[0] == 0:
            return 0.0
        return round(((values[-1] - values[0]) / values[0]) * 100, 2)

    def detect_seasonality(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Detect seasonal patterns in data.

        Args:
            data: Time-series data

        Returns:
            Dictionary containing seasonality analysis
        """
        seasonality = {
            "timestamp": datetime.now().isoformat(),
            "seasonal_pattern": None,
            "cycle_length": None,
            "peak_periods": [],
            "trough_periods": [],
            "strength": None
        }

        return seasonality

    def forecast_trend(self, historical_data: List[Dict[str, Any]], periods: int = 6) -> Dict[str, Any]:
        """
        Forecast future trend based on historical data.

        Args:
            historical_data: Historical data points
            periods: Number of periods to forecast

        Returns:
            Dictionary containing forecast
        """
        forecast = {
            "timestamp": datetime.now().isoformat(),
            "periods": periods,
            "predictions": [],
            "confidence_intervals": {},
            "method_used": None
        }

        return forecast
