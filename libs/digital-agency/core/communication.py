"""
Inter-agent messaging and communication system.

Provides a message bus for asynchronous communication between agents,
orchestrator, and other system components.
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import uuid4

from pydantic import BaseModel, Field

from .logger import get_logger


class MessageType(str, Enum):
    """Types of messages in the system."""

    # Task-related
    TASK_ASSIGNMENT = "task_assignment"
    TASK_COMPLETION = "task_completion"
    TASK_FAILURE = "task_failure"
    TASK_CANCELLATION = "task_cancellation"
    TASK_UPDATE = "task_update"

    # Agent-related
    AGENT_REGISTRATION = "agent_registration"
    AGENT_DEREGISTRATION = "agent_deregistration"
    STATUS_REQUEST = "status_request"
    STATUS_RESPONSE = "status_response"

    # Coordination
    REQUEST_ASSISTANCE = "request_assistance"
    PROVIDE_ASSISTANCE = "provide_assistance"
    HANDOFF = "handoff"
    COLLABORATION = "collaboration"

    # System
    SHUTDOWN = "shutdown"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    LOG = "log"

    # Custom
    CUSTOM = "custom"


class MessagePriority(str, Enum):
    """Message priority levels."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Message(BaseModel):
    """
    Represents a message in the system.

    Messages are used for all inter-component communication including
    task assignments, status updates, and agent coordination.
    """

    message_id: str = Field(default_factory=lambda: str(uuid4()))
    type: MessageType
    sender_id: str
    receiver_id: Optional[str] = None  # None for broadcast
    priority: MessagePriority = MessagePriority.NORMAL

    payload: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    correlation_id: Optional[str] = None  # For request-response patterns
    reply_to: Optional[str] = None  # Channel for replies

    def is_expired(self) -> bool:
        """Check if message has expired."""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary."""
        return self.model_dump()


class MessageSubscriber:
    """Represents a message subscriber."""

    def __init__(
        self,
        subscriber_id: str,
        callback: Callable[[Message], Any],
        topics: Optional[Set[str]] = None,
    ):
        """
        Initialize subscriber.

        Args:
            subscriber_id: Unique subscriber identifier
            callback: Callback function for message handling
            topics: Topics to subscribe to
        """
        self.subscriber_id = subscriber_id
        self.callback = callback
        self.topics = topics or set()

    async def handle_message(self, message: Message) -> None:
        """
        Handle incoming message.

        Args:
            message: Message to handle
        """
        if asyncio.iscoroutinefunction(self.callback):
            await self.callback(message)
        else:
            self.callback(message)


class MessageBus:
    """
    Asynchronous message bus for inter-agent communication.

    Implements pub-sub pattern for decoupled communication between
    agents and system components.
    """

    def __init__(self):
        """Initialize message bus."""
        self.logger = get_logger("message_bus")

        # Topic-based subscriptions
        self.subscribers: Dict[str, List[MessageSubscriber]] = {}

        # Message queue for each subscriber
        self.message_queues: Dict[str, asyncio.Queue] = {}

        # Message history for debugging
        self.message_history: List[Message] = []
        self.max_history_size = 1000

        self._running = False

    async def subscribe(
        self,
        topic: str,
        callback: Callable[[Message], Any],
        subscriber_id: Optional[str] = None,
    ) -> str:
        """
        Subscribe to a topic.

        Args:
            topic: Topic to subscribe to
            callback: Callback function for messages
            subscriber_id: Optional subscriber ID

        Returns:
            str: Subscriber ID
        """
        subscriber_id = subscriber_id or str(uuid4())

        subscriber = MessageSubscriber(
            subscriber_id=subscriber_id,
            callback=callback,
            topics={topic},
        )

        if topic not in self.subscribers:
            self.subscribers[topic] = []

        self.subscribers[topic].append(subscriber)

        self.logger.debug(f"Subscriber {subscriber_id} subscribed to topic: {topic}")

        return subscriber_id

    async def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        """
        Unsubscribe from a topic.

        Args:
            topic: Topic to unsubscribe from
            subscriber_id: Subscriber ID
        """
        if topic in self.subscribers:
            self.subscribers[topic] = [
                sub
                for sub in self.subscribers[topic]
                if sub.subscriber_id != subscriber_id
            ]

            if not self.subscribers[topic]:
                del self.subscribers[topic]

            self.logger.debug(
                f"Subscriber {subscriber_id} unsubscribed from topic: {topic}"
            )

    async def publish(
        self,
        message: Message,
        topic: Optional[str] = None,
    ) -> None:
        """
        Publish a message to subscribers.

        Args:
            message: Message to publish
            topic: Optional topic (defaults to message receiver_id)
        """
        # Skip expired messages
        if message.is_expired():
            self.logger.warning(f"Skipping expired message: {message.message_id}")
            return

        # Determine topic
        topic = topic or message.receiver_id or "broadcast"

        self.logger.debug(
            f"Publishing message {message.message_id} to topic: {topic}"
        )

        # Add to history
        self._add_to_history(message)

        # Get subscribers for topic
        subscribers = self.subscribers.get(topic, [])

        # Also include broadcast subscribers
        if topic != "broadcast":
            subscribers.extend(self.subscribers.get("broadcast", []))

        # Deliver to each subscriber
        for subscriber in subscribers:
            try:
                await subscriber.handle_message(message)
            except Exception as e:
                self.logger.error(
                    f"Error delivering message to {subscriber.subscriber_id}: {e}"
                )

    async def request(
        self,
        message: Message,
        timeout: float = 30.0,
    ) -> Optional[Message]:
        """
        Send a request and wait for a response.

        Args:
            message: Request message
            timeout: Timeout in seconds

        Returns:
            Optional[Message]: Response message or None
        """
        # Set up correlation ID for request-response
        correlation_id = str(uuid4())
        message.correlation_id = correlation_id

        # Create response queue
        response_queue: asyncio.Queue = asyncio.Queue()

        async def response_handler(response: Message):
            if response.correlation_id == correlation_id:
                await response_queue.put(response)

        # Subscribe to responses
        topic = f"response.{message.sender_id}"
        await self.subscribe(topic, response_handler)

        # Publish request
        await self.publish(message)

        try:
            # Wait for response
            response = await asyncio.wait_for(response_queue.get(), timeout=timeout)
            return response
        except asyncio.TimeoutError:
            self.logger.warning(
                f"Request timeout for message: {message.message_id}"
            )
            return None
        finally:
            # Cleanup
            await self.unsubscribe(topic, response_handler.__name__)

    async def broadcast(self, message: Message) -> None:
        """
        Broadcast message to all subscribers.

        Args:
            message: Message to broadcast
        """
        message.receiver_id = None
        await self.publish(message, topic="broadcast")

    def _add_to_history(self, message: Message) -> None:
        """Add message to history, maintaining max size."""
        self.message_history.append(message)

        # Trim history if too large
        if len(self.message_history) > self.max_history_size:
            self.message_history = self.message_history[-self.max_history_size :]

    def get_message_history(
        self,
        limit: Optional[int] = None,
        message_type: Optional[MessageType] = None,
    ) -> List[Message]:
        """
        Get message history.

        Args:
            limit: Maximum number of messages to return
            message_type: Filter by message type

        Returns:
            List[Message]: Message history
        """
        history = self.message_history

        # Filter by type if specified
        if message_type:
            history = [msg for msg in history if msg.type == message_type]

        # Apply limit
        if limit:
            history = history[-limit:]

        return history

    def get_stats(self) -> Dict[str, Any]:
        """
        Get message bus statistics.

        Returns:
            Dict: Statistics
        """
        return {
            "total_topics": len(self.subscribers),
            "total_subscribers": sum(
                len(subs) for subs in self.subscribers.values()
            ),
            "message_history_size": len(self.message_history),
            "topics": list(self.subscribers.keys()),
        }

    async def clear_history(self) -> None:
        """Clear message history."""
        self.message_history.clear()
        self.logger.info("Message history cleared")
