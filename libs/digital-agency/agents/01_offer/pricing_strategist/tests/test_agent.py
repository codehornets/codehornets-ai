"""Tests for Pricing Strategist Agent"""

import pytest
from ..agent import PricingStrategistAgent


class TestPricingStrategistAgent:
    def setup_method(self):
        self.agent = PricingStrategistAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "pricing_strategist_001"
        assert self.agent.name == "Pricing Strategist"

    def test_calculate_profit_margin(self):
        result = self.agent.calculate_profit_margin(cost=1000, price=1500)
        assert result["margin_percentage"] > 0
        assert result["profit"] == 500
