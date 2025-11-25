"""Tests for Social Media Manager Agent"""

import pytest
from ..agent import SocialMediaManagerAgent


class TestSocialMediaManagerAgent:
    def setup_method(self):
        self.agent = SocialMediaManagerAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "social_media_manager_001"
        assert self.agent.name == "Social Media Manager"

    def test_create_post(self):
        result = self.agent.create_post(
            platform="instagram",
            content="Test post"
        )
        assert result["platform"] == "instagram"
