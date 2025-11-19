"""
Tests for Market Researcher Agent
"""

import pytest
from datetime import datetime
from ..agent import MarketResearcherAgent


class TestMarketResearcherAgent:
    """Test suite for Market Researcher Agent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = MarketResearcherAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id == "market_researcher_001"
        assert self.agent.name == "Market Researcher"
        assert isinstance(self.agent.research_history, list)

    def test_analyze_market_trends(self):
        """Test market trend analysis"""
        result = self.agent.analyze_market_trends(
            industry="digital_marketing",
            timeframe="6m"
        )

        assert result["industry"] == "digital_marketing"
        assert result["timeframe"] == "6m"
        assert "trends" in result
        assert "opportunities" in result
        assert "threats" in result

    def test_identify_target_audience(self):
        """Test target audience identification"""
        result = self.agent.identify_target_audience(
            service_type="seo_services"
        )

        assert result["service_type"] == "seo_services"
        assert "segments" in result
        assert "demographics" in result
        assert "pain_points" in result

    def test_conduct_competitive_landscape(self):
        """Test competitive landscape analysis"""
        result = self.agent.conduct_competitive_landscape(
            market_segment="social_media_management"
        )

        assert result["segment"] == "social_media_management"
        assert "competitors" in result
        assert "market_leaders" in result
        assert "gaps" in result

    def test_analyze_demand(self):
        """Test demand analysis"""
        result = self.agent.analyze_demand(
            service_category="content_marketing"
        )

        assert result["category"] == "content_marketing"
        assert "demand_level" in result
        assert "growth_rate" in result

    def test_research_history_tracking(self):
        """Test that research history is tracked"""
        initial_count = len(self.agent.research_history)

        self.agent.analyze_market_trends(industry="tech", timeframe="3m")

        assert len(self.agent.research_history) == initial_count + 1

    def test_get_research_summary(self):
        """Test research summary generation"""
        self.agent.analyze_market_trends(industry="tech", timeframe="3m")

        summary = self.agent.get_research_summary()

        assert "total_research_items" in summary
        assert "latest_research" in summary
        assert summary["agent_id"] == self.agent.agent_id
