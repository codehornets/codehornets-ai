"""Tests for Deal Closer Agent"""

import pytest
from ..agent import DealCloserAgent


class TestDealCloserAgent:
    """Test suite for Deal Closer Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = DealCloserAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Deal Closer"
        assert self.agent.role == "Deal Closure Specialist"

    def test_prepare_contract(self):
        """Test contract preparation."""
        terms = {"price": 50000, "term": "12 months"}
        result = self.agent.prepare_contract("lead_123", terms)
        assert "contract_prepared" in result
        assert result["lead_id"] == "lead_123"

    def test_send_contract(self):
        """Test contract sending."""
        recipients = ["client@example.com"]
        result = self.agent.send_contract("contract_123", recipients)
        assert "sent" in result
        assert result["recipients"] == recipients

    def test_track_signatures(self):
        """Test signature tracking."""
        result = self.agent.track_signatures("contract_123")
        assert "signed" in result
        assert "pending_signatures" in result

    def test_process_payment(self):
        """Test payment processing."""
        result = self.agent.process_payment("contract_123")
        assert "payment_received" in result
        assert "amount" in result

    def test_handoff_to_fulfillment(self):
        """Test fulfillment handoff."""
        contract_data = {"contract_id": "123", "terms": {}}
        result = self.agent.handoff_to_fulfillment("lead_123", contract_data)
        assert "handoff_complete" in result
        assert "project_created" in result
