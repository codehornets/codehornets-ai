"""Tests for Brand Designer Agent"""

import pytest
from ..agent import BrandDesignerAgent


class TestBrandDesignerAgent:
    def setup_method(self):
        self.agent = BrandDesignerAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "brand_designer_001"
        assert self.agent.name == "Brand Designer"
