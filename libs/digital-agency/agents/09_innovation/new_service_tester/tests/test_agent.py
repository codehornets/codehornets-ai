"""
Tests for New Service Tester Agent
"""

import pytest
from ..agent import NewServiceTesterAgent


class TestNewServiceTesterAgent:
    """Test suite for New Service Tester Agent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = NewServiceTesterAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id == "new_service_tester_001"
        assert self.agent.name == "New Service Tester"
        assert self.agent.role == "Service Testing and Validation"
        assert isinstance(self.agent.test_history, list)

    def test_design_pilot_program(self):
        """Test pilot program design"""
        result = self.agent.design_pilot_program(
            service_name="AI Content Creation",
            target_audience="Small Businesses"
        )

        assert result["service_name"] == "AI Content Creation"
        assert result["target_audience"] == "Small Businesses"
        assert "timestamp" in result
        assert "test_objectives" in result
        assert len(self.agent.test_history) == 1

    def test_conduct_service_test(self):
        """Test service testing"""
        test_params = {"duration": "2_weeks", "participants": 10}
        result = self.agent.conduct_service_test(
            service_id="service_001",
            test_parameters=test_params
        )

        assert result["service_id"] == "service_001"
        assert result["parameters"] == test_params
        assert result["status"] == "completed"

    def test_gather_feedback(self):
        """Test feedback gathering"""
        result = self.agent.gather_feedback(
            pilot_id="pilot_001",
            feedback_sources=["surveys", "interviews"]
        )

        assert result["pilot_id"] == "pilot_001"
        assert "surveys" in result["sources"]
        assert "positive_feedback" in result

    def test_validate_service_readiness(self):
        """Test service readiness validation"""
        result = self.agent.validate_service_readiness(service_id="service_001")

        assert result["service_id"] == "service_001"
        assert "readiness_status" in result
        assert "gaps_identified" in result

    def test_get_test_summary(self):
        """Test getting test summary"""
        self.agent.design_pilot_program("Test Service", "Test Audience")
        summary = self.agent.get_test_summary()

        assert summary["total_tests"] == 1
        assert summary["agent_id"] == self.agent.agent_id
