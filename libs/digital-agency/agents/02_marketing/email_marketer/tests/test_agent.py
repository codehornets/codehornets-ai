"""Tests for Email Marketer Agent"""

import pytest
from ..agent import EmailMarketerAgent


class TestEmailMarketerAgent:
    def setup_method(self):
        self.agent = EmailMarketerAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "email_marketer_001"
        assert self.agent.name == "Email Marketer"
