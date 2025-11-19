"""Tests for Ads Manager Agent"""

import pytest
from ..agent import AdsManagerAgent


class TestAdsManagerAgent:
    def setup_method(self):
        self.agent = AdsManagerAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "ads_manager_001"
        assert self.agent.name == "Ads Manager"

    def test_create_campaign(self):
        result = self.agent.create_campaign(
            platform="google_ads",
            budget=1000.0,
            objective="conversions"
        )
        assert result["platform"] == "google_ads"
