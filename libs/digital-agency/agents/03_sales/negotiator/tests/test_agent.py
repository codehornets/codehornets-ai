"""Tests for Negotiator Agent"""

import pytest
from ..agent import NegotiatorAgent


class TestNegotiatorAgent:
    """Test suite for Negotiator Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = NegotiatorAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Negotiator"
        assert self.agent.role == "Negotiation Specialist"

    def test_analyze_constraints(self):
        """Test constraint analysis."""
        result = self.agent.analyze_constraints("lead_123")
        assert "budget_range" in result
        assert "timeline_constraints" in result
        assert "must_haves" in result

    def test_propose_terms(self):
        """Test terms proposal."""
        constraints = {"budget": 50000, "timeline": "3 months"}
        result = self.agent.propose_terms(constraints)
        assert "pricing" in result
        assert "payment_terms" in result
        assert "deliverables" in result

    def test_evaluate_counteroffer(self):
        """Test counteroffer evaluation."""
        offer = {"price": 45000, "terms": "net-60"}
        result = self.agent.evaluate_counteroffer(offer)
        assert "acceptable" in result
        assert "gaps" in result
        assert "counter_proposal" in result

    def test_finalize_agreement(self):
        """Test agreement finalization."""
        terms = {"price": 48000, "payment": "monthly", "term": "12 months"}
        result = self.agent.finalize_agreement(terms)
        assert "finalized" in result
        assert "ready_for_contract" in result
