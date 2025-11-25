"""
Slack client.

Provides interface for Slack API including messaging, notifications,
and channel management.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from pydantic import BaseModel
import httpx

from config.settings import get_settings
from config.api_keys import get_api_key_manager
from core.logger import get_logger


class SlackMessage(BaseModel):
    """Represents a Slack message."""

    text: str
    channel: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    blocks: Optional[List[Dict[str, Any]]] = None
    thread_ts: Optional[str] = None


class SlackClient:
    """
    Client for Slack API.

    Provides methods for sending messages, managing channels,
    and interacting with Slack workspace.
    """

    def __init__(
        self,
        bot_token: Optional[str] = None,
        webhook_url: Optional[str] = None,
    ):
        """
        Initialize Slack client.

        Args:
            bot_token: Slack bot token
            webhook_url: Incoming webhook URL
        """
        self.settings = get_settings()
        self.logger = get_logger("slack_client")

        # Get credentials
        key_manager = get_api_key_manager()

        self.bot_token = bot_token or key_manager.get_key("slack")
        self.webhook_url = webhook_url or self.settings.slack_webhook_url
        self.default_channel = self.settings.slack_channel

        # Initialize client
        if self.bot_token:
            self.client = WebClient(token=self.bot_token)
        else:
            self.client = None

    def send_message(
        self,
        message: SlackMessage,
    ) -> Optional[str]:
        """
        Send a message to Slack.

        Args:
            message: Message to send

        Returns:
            Optional[str]: Message timestamp
        """
        if not self.client:
            self.logger.warning("Slack client not initialized")
            return None

        try:
            channel = message.channel or self.default_channel

            response = self.client.chat_postMessage(
                channel=channel,
                text=message.text,
                attachments=message.attachments,
                blocks=message.blocks,
                thread_ts=message.thread_ts,
            )

            self.logger.info(f"Message sent to {channel}")
            return response["ts"]

        except SlackApiError as e:
            self.logger.error(f"Failed to send message: {e.response['error']}")
            return None

    async def send_webhook_message(
        self,
        text: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        blocks: Optional[List[Dict[str, Any]]] = None,
    ) -> bool:
        """
        Send message via webhook.

        Args:
            text: Message text
            attachments: Message attachments
            blocks: Message blocks

        Returns:
            bool: Success status
        """
        if not self.webhook_url:
            self.logger.warning("Webhook URL not configured")
            return False

        try:
            payload = {
                "text": text,
                "attachments": attachments,
                "blocks": blocks,
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            async with httpx.AsyncClient() as client:
                response = await client.post(self.webhook_url, json=payload)
                response.raise_for_status()

            self.logger.info("Webhook message sent successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send webhook message: {e}")
            return False

    def send_notification(
        self,
        title: str,
        message: str,
        level: str = "info",
        channel: Optional[str] = None,
    ) -> Optional[str]:
        """
        Send a formatted notification.

        Args:
            title: Notification title
            message: Notification message
            level: Severity level (info, warning, error, success)
            channel: Channel to send to

        Returns:
            Optional[str]: Message timestamp
        """
        # Color coding by level
        colors = {
            "info": "#36a64f",
            "warning": "#ff9900",
            "error": "#ff0000",
            "success": "#00ff00",
        }

        attachments = [
            {
                "color": colors.get(level, "#808080"),
                "title": title,
                "text": message,
                "footer": "Digital Agency AI Platform",
                "ts": int(datetime.utcnow().timestamp()),
            }
        ]

        slack_message = SlackMessage(
            text=title,
            channel=channel,
            attachments=attachments,
        )

        return self.send_message(slack_message)

    def upload_file(
        self,
        file_path: str,
        channels: Optional[List[str]] = None,
        title: Optional[str] = None,
        comment: Optional[str] = None,
    ) -> bool:
        """
        Upload file to Slack.

        Args:
            file_path: Path to file
            channels: Channels to share file in
            title: File title
            comment: File comment

        Returns:
            bool: Success status
        """
        if not self.client:
            self.logger.warning("Slack client not initialized")
            return False

        try:
            channels_str = ",".join(channels or [self.default_channel])

            response = self.client.files_upload(
                channels=channels_str,
                file=file_path,
                title=title,
                initial_comment=comment,
            )

            self.logger.info(f"File uploaded: {response['file']['id']}")
            return True

        except SlackApiError as e:
            self.logger.error(f"Failed to upload file: {e.response['error']}")
            return False

    def list_channels(self) -> List[Dict[str, Any]]:
        """
        List all channels.

        Returns:
            List[Dict]: Channel information
        """
        if not self.client:
            self.logger.warning("Slack client not initialized")
            return []

        try:
            response = self.client.conversations_list()
            channels = response["channels"]

            self.logger.info(f"Found {len(channels)} channels")
            return channels

        except SlackApiError as e:
            self.logger.error(f"Failed to list channels: {e.response['error']}")
            return []
