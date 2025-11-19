"""Tests for Compliance Officer Agent"""

import unittest
from ..agent import ComplianceOfficerAgent


class TestComplianceOfficerAgent(unittest.TestCase):
    """Test cases for Compliance Officer Agent."""

    def setUp(self):
        """Set up test fixtures."""
        self.agent = ComplianceOfficerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        self.assertEqual(self.agent.agent_id, "compliance_officer")
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

        self.assertEqual(status["agent_id"], "compliance_officer")
        self.assertIn("status", status)


if __name__ == "__main__":
    unittest.main()
