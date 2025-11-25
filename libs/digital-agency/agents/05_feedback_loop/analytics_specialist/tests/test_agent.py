"""Tests for Analytics Specialist Agent"""

import unittest
from datetime import datetime
from ..agent import AnalyticsSpecialistAgent


class TestAnalyticsSpecialistAgent(unittest.TestCase):
    """Test cases for Analytics Specialist Agent."""

    def setUp(self):
        """Set up test fixtures."""
        self.agent = AnalyticsSpecialistAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        self.assertEqual(self.agent.agent_name, "Analytics Specialist")
        self.assertEqual(self.agent.agent_id, "analytics_specialist")
        self.assertEqual(self.agent.domain, "feedback_loop")
        self.assertIsNotNone(self.agent.config)

    def test_track_metrics(self):
        """Test metric tracking functionality."""
        metric_data = {
            "traffic": 10000,
            "bounce_rate": 0.35,
            "conversion_rate": 0.05
        }

        result = self.agent.track_metrics("web", metric_data)

        self.assertIn("metric_id", result)
        self.assertEqual(result["type"], "web")
        self.assertEqual(result["message"], "Metrics tracked successfully")

    def test_analyze_performance(self):
        """Test performance analysis."""
        # First track some metrics
        metric_data = {"traffic": 10000}
        track_result = self.agent.track_metrics("web", metric_data)
        metric_id = track_result["metric_id"]

        # Analyze the metrics
        analysis = self.agent.analyze_performance([metric_id], "trend")

        self.assertIn("analysis_id", analysis)
        self.assertEqual(analysis["type"], "trend")
        self.assertIn("findings", analysis)

    def test_generate_report(self):
        """Test report generation."""
        report = self.agent.generate_report(
            "performance",
            ["web_analytics", "campaign_data"],
            format="standard"
        )

        self.assertIn("report_id", report)
        self.assertEqual(report["type"], "performance")
        self.assertEqual(report["format"], "standard")
        self.assertIn("sections", report)

    def test_identify_insights(self):
        """Test insight identification."""
        insights = self.agent.identify_insights(
            "web_traffic",
            "last_30_days"
        )

        self.assertIsInstance(insights, list)
        self.assertGreater(len(insights), 0)
        self.assertIn("insight_id", insights[0])
        self.assertIn("description", insights[0])

    def test_get_recommendations(self):
        """Test recommendation generation."""
        context = {
            "metric_type": "campaign",
            "performance": "declining"
        }

        recommendations = self.agent.get_recommendations(context)

        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)
        self.assertIn("recommendation_id", recommendations[0])

    def test_process_request_track_metrics(self):
        """Test processing track metrics request."""
        request = {
            "type": "track_metrics",
            "metric_type": "campaign",
            "data": {"impressions": 50000, "clicks": 2500}
        }

        response = self.agent.process_request(request)

        self.assertIn("metric_id", response)
        self.assertEqual(response["type"], "campaign")

    def test_process_request_analyze(self):
        """Test processing analyze request."""
        # Track metrics first
        track_request = {
            "type": "track_metrics",
            "metric_type": "web",
            "data": {"traffic": 10000}
        }
        track_response = self.agent.process_request(track_request)

        # Analyze metrics
        analyze_request = {
            "type": "analyze",
            "metric_ids": [track_response["metric_id"]],
            "analysis_type": "trend"
        }

        response = self.agent.process_request(analyze_request)

        self.assertIn("analysis_id", response)

    def test_process_request_report(self):
        """Test processing report request."""
        request = {
            "type": "report",
            "report_type": "campaign",
            "data_sources": ["google_ads", "facebook_ads"],
            "format": "executive"
        }

        response = self.agent.process_request(request)

        self.assertIn("report_id", response)
        self.assertEqual(response["format"], "executive")

    def test_process_request_insights(self):
        """Test processing insights request."""
        request = {
            "type": "insights",
            "data_scope": "web_traffic",
            "timeframe": "last_7_days"
        }

        response = self.agent.process_request(request)

        self.assertIn("insights", response)
        self.assertIsInstance(response["insights"], list)

    def test_process_request_unknown_type(self):
        """Test processing unknown request type."""
        request = {
            "type": "unknown_operation"
        }

        response = self.agent.process_request(request)

        self.assertIn("error", response)


if __name__ == "__main__":
    unittest.main()
