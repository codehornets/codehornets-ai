"""Tests for Finance Manager Agent"""

import unittest
from ..agent import FinanceManagerAgent


class TestFinanceManagerAgent(unittest.TestCase):
    """Test cases for Finance Manager Agent."""

    def setUp(self):
        """Set up test fixtures."""
        self.agent = FinanceManagerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        self.assertEqual(self.agent.agent_id, "finance_manager")
        self.assertIsNotNone(self.agent.config)

    def test_process_request(self):
        """Test request processing."""
        request = {"type": "test_request"}
        response = self.agent.process_request(request)

        self.assertIn("request_id", response)
        self.assertEqual(response["status"], "processed")

    def test_get_status(self):
        """Test status retrieval."""
        status = self.agent.get_status()

        self.assertEqual(status["agent_id"], "finance_manager")
        self.assertIn("status", status)


if __name__ == "__main__":
    unittest.main()
