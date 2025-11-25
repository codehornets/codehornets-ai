"""
Chatbot Manager Agent

Manages chatbot configuration, intent recognition, conversation flows, and training data.
Production-ready implementation with NLP capabilities and conversation state management.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import yaml
from pathlib import Path
import logging
import re
from collections import defaultdict, Counter
import json
import hashlib

logger = logging.getLogger(__name__)


class IntentType(Enum):
    """Chatbot intent types."""
    GREETING = "greeting"
    FAREWELL = "farewell"
    HELP = "help"
    PRODUCT_INQUIRY = "product_inquiry"
    PRICING = "pricing"
    TECHNICAL_SUPPORT = "technical_support"
    ACCOUNT_QUESTION = "account_question"
    BILLING_QUESTION = "billing_question"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    COMPLAINT = "complaint"
    ESCALATION_REQUEST = "escalation_request"
    UNKNOWN = "unknown"


class ConversationState(Enum):
    """Conversation states."""
    INITIATED = "initiated"
    ACTIVE = "active"
    GATHERING_INFO = "gathering_info"
    WAITING_INPUT = "waiting_input"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    ABANDONED = "abandoned"
    CLOSED = "closed"


class ResponseType(Enum):
    """Response types."""
    TEXT = "text"
    QUICK_REPLY = "quick_reply"
    CARD = "card"
    CAROUSEL = "carousel"
    FORM = "form"
    HANDOFF = "handoff"


@dataclass
class Intent:
    """Intent definition."""
    intent_id: str
    name: str
    intent_type: IntentType
    training_phrases: List[str]
    patterns: List[str]
    responses: List[str]
    context_required: List[str] = field(default_factory=list)
    parameters: List[str] = field(default_factory=list)
    confidence_threshold: float = 0.7
    follow_up_intents: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Entity:
    """Named entity for extraction."""
    entity_type: str
    value: str
    confidence: float
    start_pos: int
    end_pos: int
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ConversationFlow:
    """Conversation flow definition."""
    flow_id: str
    name: str
    entry_intent: str
    steps: List[Dict[str, Any]]
    fallback_responses: List[str]
    max_turns: int = 10
    timeout_minutes: int = 30
    active: bool = True


@dataclass
class Message:
    """Chat message."""
    message_id: str
    conversation_id: str
    sender: str  # user or bot
    text: str
    timestamp: datetime
    intent: Optional[IntentType] = None
    entities: List[Entity] = field(default_factory=list)
    confidence: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Conversation:
    """Conversation session."""
    conversation_id: str
    user_id: str
    channel: str
    state: ConversationState
    started_at: datetime
    updated_at: datetime
    messages: List[Message] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    current_intent: Optional[IntentType] = None
    satisfaction_score: Optional[float] = None
    resolved: bool = False
    escalated: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TrainingExample:
    """Training data example."""
    text: str
    intent: IntentType
    entities: List[Dict[str, Any]] = field(default_factory=list)
    confidence: float = 1.0
    source: str = "manual"
    created_at: datetime = field(default_factory=datetime.utcnow)


class ChatbotManagerAgent:
    """
    Advanced Chatbot Manager for intelligent conversation handling.

    Capabilities:
    - Intent recognition using pattern matching and NLP
    - Entity extraction from user messages
    - Conversation flow management
    - Context-aware responses
    - Multi-turn conversation handling
    - Training data management and optimization
    - Performance analytics and insights
    - A/B testing for response optimization
    - Sentiment tracking
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Chatbot Manager Agent.

        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.name = "Chatbot Manager Agent"
        self.role = "chatbot_manager"

        # Intent and entity storage
        self.intents: Dict[str, Intent] = {}
        self.flows: Dict[str, ConversationFlow] = {}
        self.training_data: List[TrainingExample] = []

        # Conversation management
        self.conversations: Dict[str, Conversation] = {}
        self.conversation_counter = 0

        # Analytics
        self.intent_counts: Dict[str, int] = defaultdict(int)
        self.unrecognized_phrases: List[str] = []
        self.response_feedback: Dict[str, List[int]] = defaultdict(list)

        # Initialize default intents
        self._initialize_default_intents()
        self._initialize_default_flows()

        logger.info(f"{self.name} initialized successfully")

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"

        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file not found at {config_path}, using defaults")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'Chatbot Manager Agent',
            'model': 'gpt-4',
            'temperature': 0.7,
            'max_tokens': 500,
            'min_confidence_threshold': 0.6,
            'enable_learning': True,
            'enable_context_tracking': True,
            'session_timeout_minutes': 30,
            'max_conversation_turns': 20,
            'fallback_to_human_threshold': 3,
            'capabilities': [
                'intent_recognition',
                'entity_extraction',
                'conversation_management',
                'training_data_management',
                'flow_optimization',
                'sentiment_analysis'
            ],
            'supported_channels': ['web', 'mobile', 'slack', 'teams', 'whatsapp'],
            'languages': ['en', 'es', 'fr', 'de']
        }

    def _initialize_default_intents(self):
        """Initialize default intents with training data."""
        default_intents = [
            Intent(
                intent_id="intent_greeting",
                name="Greeting",
                intent_type=IntentType.GREETING,
                training_phrases=[
                    "hello", "hi", "hey", "good morning", "good afternoon",
                    "good evening", "greetings", "hi there", "hey there"
                ],
                patterns=[r"\b(hi|hello|hey|greetings)\b"],
                responses=[
                    "Hello! How can I help you today?",
                    "Hi there! What can I assist you with?",
                    "Greetings! How may I help you?"
                ]
            ),
            Intent(
                intent_id="intent_farewell",
                name="Farewell",
                intent_type=IntentType.FAREWELL,
                training_phrases=[
                    "bye", "goodbye", "see you", "take care", "have a nice day",
                    "thanks bye", "that's all", "nothing else"
                ],
                patterns=[r"\b(bye|goodbye|see you|take care)\b"],
                responses=[
                    "Goodbye! Have a great day!",
                    "Thank you for chatting with us. Take care!",
                    "See you later! Feel free to reach out anytime."
                ]
            ),
            Intent(
                intent_id="intent_help",
                name="Help Request",
                intent_type=IntentType.HELP,
                training_phrases=[
                    "help", "i need help", "can you help", "help me",
                    "i have a problem", "i need assistance", "support"
                ],
                patterns=[r"\b(help|assist|support|problem)\b"],
                responses=[
                    "I'm here to help! What do you need assistance with?",
                    "Of course! Please tell me more about your issue.",
                    "I'd be happy to help. What's the problem?"
                ]
            ),
            Intent(
                intent_id="intent_product_inquiry",
                name="Product Inquiry",
                intent_type=IntentType.PRODUCT_INQUIRY,
                training_phrases=[
                    "what products do you have", "show me products",
                    "what do you sell", "product information",
                    "tell me about your products", "product catalog"
                ],
                patterns=[r"\b(product|catalog|offering|service)\b"],
                responses=[
                    "We offer a range of products including... What specific product are you interested in?",
                    "I can help you find the right product. What are you looking for?",
                    "Our product catalog includes... Would you like details on any specific item?"
                ]
            ),
            Intent(
                intent_id="intent_pricing",
                name="Pricing Inquiry",
                intent_type=IntentType.PRICING,
                training_phrases=[
                    "how much does it cost", "what's the price", "pricing",
                    "cost information", "price list", "how much is",
                    "subscription cost", "plan pricing"
                ],
                patterns=[r"\b(price|cost|pricing|how much|subscription)\b"],
                responses=[
                    "Our pricing varies by plan. What specific product or service are you interested in?",
                    "I can provide pricing details. Which plan are you considering?",
                    "Let me help you with pricing information. What would you like to know about?"
                ]
            ),
            Intent(
                intent_id="intent_technical_support",
                name="Technical Support",
                intent_type=IntentType.TECHNICAL_SUPPORT,
                training_phrases=[
                    "not working", "technical issue", "error message",
                    "something is broken", "bug", "system error",
                    "can't login", "won't load"
                ],
                patterns=[r"\b(error|bug|broken|not working|issue|problem)\b"],
                responses=[
                    "I'm sorry you're experiencing technical difficulties. Can you describe the issue?",
                    "Let me help you troubleshoot. What exactly is happening?",
                    "I understand there's a technical problem. Please provide more details."
                ]
            ),
            Intent(
                intent_id="intent_escalation",
                name="Escalation Request",
                intent_type=IntentType.ESCALATION_REQUEST,
                training_phrases=[
                    "speak to a human", "talk to representative", "human agent",
                    "connect me to someone", "i want to speak to a person",
                    "transfer me", "agent please"
                ],
                patterns=[r"\b(human|agent|representative|person|someone)\b"],
                responses=[
                    "I'll connect you with a human agent right away.",
                    "Let me transfer you to one of our team members.",
                    "I'll escalate this to a human agent who can assist you better."
                ]
            )
        ]

        for intent in default_intents:
            self.intents[intent.intent_id] = intent
            # Create training examples
            for phrase in intent.training_phrases:
                self.training_data.append(TrainingExample(
                    text=phrase,
                    intent=intent.intent_type,
                    source="default"
                ))

    def _initialize_default_flows(self):
        """Initialize default conversation flows."""
        # Technical support flow
        tech_support_flow = ConversationFlow(
            flow_id="flow_tech_support",
            name="Technical Support Flow",
            entry_intent="intent_technical_support",
            steps=[
                {
                    "step": 1,
                    "prompt": "What product or feature is experiencing the issue?",
                    "collect": "affected_product"
                },
                {
                    "step": 2,
                    "prompt": "Can you describe what happens when you encounter the error?",
                    "collect": "error_description"
                },
                {
                    "step": 3,
                    "prompt": "When did this issue start?",
                    "collect": "issue_timeline"
                },
                {
                    "step": 4,
                    "action": "provide_solution_or_escalate"
                }
            ],
            fallback_responses=[
                "I'm not sure I understand. Could you rephrase that?",
                "Let me connect you with a technical specialist who can help."
            ]
        )

        self.flows[tech_support_flow.flow_id] = tech_support_flow

    async def recognize_intent(self, message_text: str,
                              context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Recognize user intent from message text.

        Args:
            message_text: User's message
            context: Optional conversation context

        Returns:
            Recognized intent with confidence score
        """
        try:
            logger.info("Starting intent recognition")

            if not message_text or not message_text.strip():
                raise ValueError("Message text cannot be empty")

            message_lower = message_text.lower().strip()

            # Match against known intents
            intent_scores: Dict[str, float] = {}

            for intent_id, intent in self.intents.items():
                score = self._calculate_intent_score(message_lower, intent)
                if score > 0:
                    intent_scores[intent_id] = score

            # Get best match
            if intent_scores:
                best_intent_id = max(intent_scores, key=intent_scores.get)
                best_score = intent_scores[best_intent_id]
                best_intent = self.intents[best_intent_id]

                threshold = self.config.get('min_confidence_threshold', 0.6)

                if best_score >= threshold:
                    # Extract entities
                    entities = self._extract_entities(message_text)

                    # Track intent
                    self.intent_counts[best_intent.intent_type.value] += 1

                    logger.info(f"Intent recognized: {best_intent.name} (confidence: {best_score:.2f})")

                    return {
                        'success': True,
                        'intent_id': best_intent_id,
                        'intent_type': best_intent.intent_type.value,
                        'intent_name': best_intent.name,
                        'confidence': round(best_score, 3),
                        'entities': [
                            {
                                'type': e.entity_type,
                                'value': e.value,
                                'confidence': e.confidence
                            }
                            for e in entities
                        ],
                        'requires_context': best_intent.context_required,
                        'follow_up_intents': best_intent.follow_up_intents
                    }

            # Intent not recognized with confidence
            self.unrecognized_phrases.append(message_text)
            logger.warning(f"Intent not recognized for: {message_text[:50]}")

            return {
                'success': True,
                'intent_id': None,
                'intent_type': IntentType.UNKNOWN.value,
                'intent_name': 'Unknown',
                'confidence': 0.0,
                'entities': [],
                'message': 'Intent not recognized with sufficient confidence'
            }

        except ValueError as e:
            logger.error(f"Validation error in recognize_intent: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in recognize_intent: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _calculate_intent_score(self, message: str, intent: Intent) -> float:
        """
        Calculate intent match score using multiple techniques.

        Args:
            message: User message (lowercase)
            intent: Intent to match against

        Returns:
            Confidence score 0-1
        """
        scores = []

        # 1. Exact phrase matching
        for phrase in intent.training_phrases:
            if phrase.lower() in message:
                # Boost score if phrase matches exactly
                if phrase.lower() == message:
                    scores.append(1.0)
                else:
                    scores.append(0.8)

        # 2. Pattern matching
        for pattern in intent.patterns:
            if re.search(pattern, message, re.IGNORECASE):
                scores.append(0.7)

        # 3. Word overlap scoring
        intent_words = set()
        for phrase in intent.training_phrases:
            intent_words.update(phrase.lower().split())

        message_words = set(message.split())
        if intent_words and message_words:
            overlap = len(intent_words & message_words)
            total = len(intent_words | message_words)
            if total > 0:
                jaccard_score = overlap / total
                scores.append(jaccard_score * 0.6)

        return max(scores) if scores else 0.0

    def _extract_entities(self, text: str) -> List[Entity]:
        """
        Extract named entities from text.

        Args:
            text: Input text

        Returns:
            List of extracted entities
        """
        entities = []

        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        for match in re.finditer(email_pattern, text):
            entities.append(Entity(
                entity_type="email",
                value=match.group(),
                confidence=0.95,
                start_pos=match.start(),
                end_pos=match.end()
            ))

        # Phone number extraction
        phone_pattern = r'\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
        for match in re.finditer(phone_pattern, text):
            entities.append(Entity(
                entity_type="phone",
                value=match.group(),
                confidence=0.9,
                start_pos=match.start(),
                end_pos=match.end()
            ))

        # URL extraction
        url_pattern = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)'
        for match in re.finditer(url_pattern, text):
            entities.append(Entity(
                entity_type="url",
                value=match.group(),
                confidence=0.95,
                start_pos=match.start(),
                end_pos=match.end()
            ))

        # Date extraction (simple patterns)
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
        for match in re.finditer(date_pattern, text):
            entities.append(Entity(
                entity_type="date",
                value=match.group(),
                confidence=0.85,
                start_pos=match.start(),
                end_pos=match.end()
            ))

        # Currency amounts
        currency_pattern = r'\$\s?\d+(?:,\d{3})*(?:\.\d{2})?'
        for match in re.finditer(currency_pattern, text):
            entities.append(Entity(
                entity_type="currency",
                value=match.group(),
                confidence=0.9,
                start_pos=match.start(),
                end_pos=match.end()
            ))

        return entities

    async def start_conversation(self, user_id: str, channel: str = "web",
                                initial_message: Optional[str] = None) -> Dict[str, Any]:
        """
        Start a new conversation session.

        Args:
            user_id: User identifier
            channel: Communication channel
            initial_message: Optional initial user message

        Returns:
            Conversation session details
        """
        try:
            logger.info(f"Starting conversation for user {user_id}")

            # Generate conversation ID
            self.conversation_counter += 1
            conv_id = self._generate_conversation_id(user_id)

            # Create conversation
            conversation = Conversation(
                conversation_id=conv_id,
                user_id=user_id,
                channel=channel,
                state=ConversationState.INITIATED,
                started_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            self.conversations[conv_id] = conversation

            # Process initial message if provided
            response_text = "Hello! How can I help you today?"
            intent_result = None

            if initial_message:
                result = await self.process_message(conv_id, initial_message)
                if result.get('success'):
                    response_text = result.get('response', response_text)
                    intent_result = result.get('intent')

            logger.info(f"Conversation {conv_id} started successfully")

            return {
                'success': True,
                'conversation_id': conv_id,
                'user_id': user_id,
                'channel': channel,
                'state': conversation.state.value,
                'response': response_text,
                'intent': intent_result,
                'started_at': conversation.started_at.isoformat()
            }

        except ValueError as e:
            logger.error(f"Validation error in start_conversation: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in start_conversation: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _generate_conversation_id(self, user_id: str) -> str:
        """Generate unique conversation ID."""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        hash_input = f"{timestamp}-{user_id}-{self.conversation_counter}"
        hash_suffix = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        return f"CONV-{timestamp}-{hash_suffix.upper()}"

    async def process_message(self, conversation_id: str,
                             message_text: str) -> Dict[str, Any]:
        """
        Process user message and generate response.

        Args:
            conversation_id: Conversation session ID
            message_text: User's message

        Returns:
            Bot response with intent and entities
        """
        try:
            logger.info(f"Processing message for conversation {conversation_id}")

            if conversation_id not in self.conversations:
                raise ValueError(f"Conversation {conversation_id} not found")

            conversation = self.conversations[conversation_id]

            # Check if conversation is active
            if conversation.state == ConversationState.CLOSED:
                raise ValueError("Conversation is closed")

            # Recognize intent
            intent_result = await self.recognize_intent(
                message_text,
                context=conversation.context
            )

            # Create message record
            message_id = f"{conversation_id}_MSG_{len(conversation.messages) + 1}"
            user_message = Message(
                message_id=message_id,
                conversation_id=conversation_id,
                sender="user",
                text=message_text,
                timestamp=datetime.utcnow(),
                intent=IntentType(intent_result.get('intent_type', 'unknown')) if intent_result.get('intent_type') else None,
                entities=[],
                confidence=intent_result.get('confidence', 0.0)
            )

            conversation.messages.append(user_message)

            # Update conversation state
            conversation.state = ConversationState.ACTIVE
            conversation.updated_at = datetime.utcnow()
            if intent_result.get('intent_type'):
                conversation.current_intent = IntentType(intent_result['intent_type'])

            # Generate response
            response_text = await self._generate_response(conversation, intent_result)

            # Create bot message
            bot_message = Message(
                message_id=f"{message_id}_RESP",
                conversation_id=conversation_id,
                sender="bot",
                text=response_text,
                timestamp=datetime.utcnow()
            )

            conversation.messages.append(bot_message)

            # Check for escalation
            should_escalate = self._should_escalate_conversation(conversation)

            logger.info(f"Message processed for conversation {conversation_id}")

            return {
                'success': True,
                'conversation_id': conversation_id,
                'intent': intent_result,
                'response': response_text,
                'state': conversation.state.value,
                'should_escalate': should_escalate,
                'message_count': len(conversation.messages)
            }

        except ValueError as e:
            logger.error(f"Validation error in process_message: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in process_message: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def _generate_response(self, conversation: Conversation,
                                intent_result: Dict[str, Any]) -> str:
        """
        Generate appropriate response based on intent.

        Args:
            conversation: Current conversation
            intent_result: Recognized intent information

        Returns:
            Response text
        """
        intent_id = intent_result.get('intent_id')

        # Check for escalation request
        if intent_result.get('intent_type') == IntentType.ESCALATION_REQUEST.value:
            conversation.escalated = True
            return "I'll connect you with a human agent right away. Please hold on."

        # Get response from intent
        if intent_id and intent_id in self.intents:
            intent = self.intents[intent_id]
            # Rotate through responses
            response_idx = len(conversation.messages) % len(intent.responses)
            return intent.responses[response_idx]

        # Unknown intent - use fallback
        fallback_count = sum(1 for m in conversation.messages
                           if m.sender == "bot" and "not sure" in m.text.lower())

        if fallback_count >= self.config.get('fallback_to_human_threshold', 3):
            conversation.escalated = True
            return "I'm having trouble understanding. Let me connect you with a human agent who can better assist you."

        fallback_responses = [
            "I'm not sure I understand. Could you please rephrase that?",
            "I didn't quite get that. Can you provide more details?",
            "I want to make sure I help you correctly. Could you explain that differently?"
        ]

        return fallback_responses[fallback_count % len(fallback_responses)]

    def _should_escalate_conversation(self, conversation: Conversation) -> bool:
        """
        Determine if conversation should be escalated to human agent.

        Args:
            conversation: Conversation to evaluate

        Returns:
            True if escalation recommended
        """
        # Already escalated
        if conversation.escalated:
            return True

        # Check for escalation intent
        if conversation.current_intent == IntentType.ESCALATION_REQUEST:
            return True

        # Too many unknown intents
        unknown_count = sum(1 for m in conversation.messages
                          if m.sender == "user" and m.confidence < 0.3)
        if unknown_count >= 3:
            return True

        # Conversation too long
        max_turns = self.config.get('max_conversation_turns', 20)
        if len(conversation.messages) >= max_turns:
            return True

        # Negative sentiment
        recent_messages = conversation.messages[-5:]
        negative_indicators = ['frustrated', 'angry', 'terrible', 'awful', 'useless']
        for msg in recent_messages:
            if msg.sender == "user":
                if any(indicator in msg.text.lower() for indicator in negative_indicators):
                    return True

        return False

    async def add_training_data(self, examples: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Add training examples to improve intent recognition.

        Args:
            examples: List of training examples with text and intent

        Returns:
            Training data addition result
        """
        try:
            logger.info(f"Adding {len(examples)} training examples")

            added_count = 0
            errors = []

            for idx, example in enumerate(examples):
                try:
                    # Validate example
                    if 'text' not in example or 'intent' not in example:
                        errors.append(f"Example {idx}: Missing required fields")
                        continue

                    # Create training example
                    intent_type = IntentType(example['intent'])

                    training_ex = TrainingExample(
                        text=example['text'],
                        intent=intent_type,
                        entities=example.get('entities', []),
                        confidence=example.get('confidence', 1.0),
                        source=example.get('source', 'user_provided')
                    )

                    self.training_data.append(training_ex)
                    added_count += 1

                    # Update intent training phrases
                    for intent_id, intent in self.intents.items():
                        if intent.intent_type == intent_type:
                            if example['text'] not in intent.training_phrases:
                                intent.training_phrases.append(example['text'])

                except ValueError as e:
                    errors.append(f"Example {idx}: {str(e)}")

            logger.info(f"Added {added_count} training examples successfully")

            return {
                'success': True,
                'added_count': added_count,
                'total_training_examples': len(self.training_data),
                'errors': errors if errors else None
            }

        except Exception as e:
            logger.error(f"Unexpected error in add_training_data: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def optimize_intents(self) -> Dict[str, Any]:
        """
        Optimize intent recognition based on conversation history.

        Returns:
            Optimization results
        """
        try:
            logger.info("Starting intent optimization")

            optimizations = []

            # 1. Identify frequently unrecognized phrases
            if len(self.unrecognized_phrases) >= 10:
                phrase_counts = Counter(self.unrecognized_phrases)
                common_unrecognized = phrase_counts.most_common(5)

                optimizations.append({
                    'type': 'unrecognized_patterns',
                    'count': len(self.unrecognized_phrases),
                    'top_phrases': [phrase for phrase, count in common_unrecognized],
                    'recommendation': 'Consider adding these as new intents or training phrases'
                })

            # 2. Intent performance analysis
            if self.intent_counts:
                total_intents = sum(self.intent_counts.values())
                intent_distribution = {
                    intent: (count / total_intents * 100)
                    for intent, count in self.intent_counts.items()
                }

                optimizations.append({
                    'type': 'intent_distribution',
                    'total_recognized': total_intents,
                    'distribution': {k: round(v, 2) for k, v in intent_distribution.items()},
                    'recommendation': 'Review low-frequency intents for consolidation'
                })

            # 3. Response effectiveness
            low_performing_intents = []
            for intent_id, feedback_scores in self.response_feedback.items():
                if feedback_scores:
                    avg_score = sum(feedback_scores) / len(feedback_scores)
                    if avg_score < 3.0:  # Below satisfactory
                        low_performing_intents.append({
                            'intent_id': intent_id,
                            'avg_score': round(avg_score, 2),
                            'sample_count': len(feedback_scores)
                        })

            if low_performing_intents:
                optimizations.append({
                    'type': 'low_performing_responses',
                    'intents': low_performing_intents,
                    'recommendation': 'Update responses for better user satisfaction'
                })

            logger.info(f"Intent optimization completed with {len(optimizations)} recommendations")

            return {
                'success': True,
                'optimization_count': len(optimizations),
                'optimizations': optimizations,
                'total_training_examples': len(self.training_data)
            }

        except Exception as e:
            logger.error(f"Error in optimize_intents: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def get_conversation_analytics(self) -> Dict[str, Any]:
        """
        Get comprehensive conversation analytics.

        Returns:
            Analytics report
        """
        try:
            total_conversations = len(self.conversations)

            if total_conversations == 0:
                return {
                    'success': True,
                    'message': 'No conversations to analyze',
                    'total_conversations': 0
                }

            # State distribution
            state_counts = defaultdict(int)
            for conv in self.conversations.values():
                state_counts[conv.state.value] += 1

            # Resolution metrics
            resolved_count = sum(1 for c in self.conversations.values() if c.resolved)
            escalated_count = sum(1 for c in self.conversations.values() if c.escalated)

            # Average conversation length
            avg_messages = sum(len(c.messages) for c in self.conversations.values()) / total_conversations

            # Intent distribution
            intent_dist = dict(self.intent_counts)

            # Channel distribution
            channel_counts = defaultdict(int)
            for conv in self.conversations.values():
                channel_counts[conv.channel] += 1

            return {
                'success': True,
                'total_conversations': total_conversations,
                'state_distribution': dict(state_counts),
                'resolution_metrics': {
                    'resolved': resolved_count,
                    'escalated': escalated_count,
                    'resolution_rate': round(resolved_count / total_conversations * 100, 2)
                },
                'average_messages_per_conversation': round(avg_messages, 2),
                'intent_distribution': intent_dist,
                'channel_distribution': dict(channel_counts),
                'total_intents_configured': len(self.intents),
                'total_training_examples': len(self.training_data),
                'unrecognized_phrases_count': len(self.unrecognized_phrases)
            }

        except Exception as e:
            logger.error(f"Error in get_conversation_analytics: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def export_training_data(self, format: str = 'json') -> Dict[str, Any]:
        """
        Export training data in specified format.

        Args:
            format: Export format (json, csv)

        Returns:
            Exported training data
        """
        try:
            if format == 'json':
                data = [
                    {
                        'text': ex.text,
                        'intent': ex.intent.value,
                        'entities': ex.entities,
                        'confidence': ex.confidence,
                        'source': ex.source,
                        'created_at': ex.created_at.isoformat()
                    }
                    for ex in self.training_data
                ]

                return {
                    'success': True,
                    'format': 'json',
                    'count': len(data),
                    'data': data
                }
            else:
                raise ValueError(f"Unsupported format: {format}")

        except ValueError as e:
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Error exporting training data: {e}")
            return {'success': False, 'error': 'Internal error'}
