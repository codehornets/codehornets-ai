"""Tests for SEO Specialist Agent"""

import pytest
from ..agent import SEOSpecialistAgent


class TestSEOSpecialistAgent:
    def setup_method(self):
        self.agent = SEOSpecialistAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "seo_specialist_001"
        assert self.agent.name == "SEO Specialist"

    def test_research_keywords(self):
        result = self.agent.research_keywords(topic="digital marketing")
        assert result["topic"] == "digital marketing"
