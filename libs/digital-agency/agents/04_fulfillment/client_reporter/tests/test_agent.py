"""Tests for Client Reporter Agent"""

import pytest
from ..agent import ClientReporterAgent


class TestClientReporterAgent:
    """Test suite for Client Reporter Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = ClientReporterAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Client Reporter"
        assert self.agent.role == "Reporting & Analytics Specialist"

    def test_generate_progress_report(self):
        """Test progress report generation."""
        result = self.agent.generate_progress_report("proj_123")
        assert "report_id" in result
        assert "generated" in result

    def test_create_dashboard(self):
        """Test dashboard creation."""
        metrics = ["completion", "budget", "quality"]
        result = self.agent.create_dashboard("proj_123", metrics)
        assert "dashboard_id" in result
        assert result["metrics"] == metrics

    def test_compile_metrics(self):
        """Test metrics compilation."""
        result = self.agent.compile_metrics("proj_123")
        assert "metrics" in result
        assert "insights" in result

    def test_prepare_presentation(self):
        """Test presentation preparation."""
        result = self.agent.prepare_presentation("report_123")
        assert "presentation_id" in result
        assert "ready" in result
