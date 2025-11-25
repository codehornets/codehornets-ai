"""Tests for Content Creator Agent"""

import pytest
from ..agent import ContentCreatorAgent


class TestContentCreatorAgent:
    def setup_method(self):
        self.agent = ContentCreatorAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "content_creator_001"
        assert self.agent.name == "Content Creator"

    def test_create_blog_post(self):
        result = self.agent.create_blog_post(
            topic="SEO Best Practices",
            target_audience="marketers",
            keywords=["SEO", "optimization"]
        )
        assert result["type"] == "blog_post"
        assert result["topic"] == "SEO Best Practices"
