"""
Third-party integrations module.

Provides client implementations for external services including
Claude AI, HubSpot, Google services, Slack, and various CRMs.
"""

from .claude_client import ClaudeClient, ClaudeMessage, ClaudeResponse
from .hubspot_client import HubSpotClient, HubSpotContact, HubSpotDeal
from .google_client import GoogleClient, GoogleSheetsClient, GoogleDriveClient
from .slack_client import SlackClient, SlackMessage
from .crm_client import CRMClient, CRMProvider

__all__ = [
    "ClaudeClient",
    "ClaudeMessage",
    "ClaudeResponse",
    "HubSpotClient",
    "HubSpotContact",
    "HubSpotDeal",
    "GoogleClient",
    "GoogleSheetsClient",
    "GoogleDriveClient",
    "SlackClient",
    "SlackMessage",
    "CRMClient",
    "CRMProvider",
]
