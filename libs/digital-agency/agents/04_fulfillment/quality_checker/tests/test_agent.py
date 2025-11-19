"""Tests for Quality Checker Agent"""

import pytest
from ..agent import QualityCheckerAgent


class TestQualityCheckerAgent:
    """Test suite for Quality Checker Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = QualityCheckerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Quality Checker"
        assert self.agent.role == "Quality Assurance Specialist"

    def test_create_qa_checklist(self):
        """Test checklist creation."""
        checklist = self.agent.create_qa_checklist("website")
        assert isinstance(checklist, list)

    def test_perform_qa_review(self):
        """Test QA review."""
        result = self.agent.perform_qa_review("deliverable_123")
        assert "passed" in result
        assert "issues" in result

    def test_test_deliverable(self):
        """Test deliverable testing."""
        test_cases = [{"test": "functionality", "expected": "pass"}]
        result = self.agent.test_deliverable("deliverable_123", test_cases)
        assert "tests_passed" in result
        assert "tests_failed" in result

    def test_approve_quality(self):
        """Test quality approval."""
        result = self.agent.approve_quality("deliverable_123")
        assert "approved" in result
