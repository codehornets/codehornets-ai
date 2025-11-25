"""
Client Feedback Manager Agent

Comprehensive feedback collection, sentiment analysis, and insight generation system.
Handles multi-channel feedback collection, NLP-based sentiment analysis, and actionable insights.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, Counter
from enum import Enum
import yaml
import json
import re
import logging
import hashlib
import statistics
from pathlib import Path

logger = logging.getLogger(__name__)


class FeedbackChannel(Enum):
    """Feedback collection channels"""
    EMAIL = "email"
    SURVEY = "survey"
    CHAT = "chat"
    PHONE = "phone"
    SOCIAL_MEDIA = "social_media"
    IN_APP = "in_app"
    REVIEW_SITE = "review_site"
    MEETING = "meeting"
    SUPPORT_TICKET = "support_ticket"


class SentimentScore(Enum):
    """Sentiment classification"""
    VERY_POSITIVE = 5
    POSITIVE = 4
    NEUTRAL = 3
    NEGATIVE = 2
    VERY_NEGATIVE = 1


class FeedbackPriority(Enum):
    """Feedback priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FeedbackCategory(Enum):
    """Feedback categorization"""
    PRODUCT = "product"
    SERVICE = "service"
    SUPPORT = "support"
    PRICING = "pricing"
    DELIVERY = "delivery"
    COMMUNICATION = "communication"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    GENERAL = "general"


@dataclass
class FeedbackItem:
    """Individual feedback entry"""
    feedback_id: str
    client_id: str
    channel: FeedbackChannel
    content: str
    timestamp: datetime
    category: Optional[FeedbackCategory] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[SentimentScore] = None
    priority: Optional[FeedbackPriority] = None
    tags: List[str] = field(default_factory=list)
    emotions: List[str] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    is_processed: bool = False
    action_items: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class SurveyTemplate:
    """Survey design template"""
    survey_id: str
    title: str
    description: str
    questions: List[Dict[str, Any]]
    target_audience: str
    schedule: Optional[Dict[str, Any]] = None
    response_goal: Optional[int] = None
    active: bool = True


class ClientFeedbackManagerAgent:
    """
    Client Feedback Manager Agent - Production Implementation

    Comprehensive feedback management system with:
    - Multi-channel feedback collection
    - Advanced NLP sentiment analysis
    - Emotion and topic extraction
    - Survey design and management
    - Response tracking and analytics
    - Insight generation and pattern detection
    - Automated action item creation
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Client Feedback Manager Agent."""
        self.agent_name = "Client Feedback Manager"
        self.agent_id = "client_feedback_manager"
        self.domain = "feedback_loop"

        if config_path:
            self.config = self._load_config(config_path)
        else:
            self.config = self._default_config()

        # Data stores
        self.feedback_items: Dict[str, FeedbackItem] = {}
        self.surveys: Dict[str, SurveyTemplate] = {}
        self.survey_responses: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.action_plans: Dict[str, Dict[str, Any]] = {}
        self.insights: List[Dict[str, Any]] = []

        # Analytics tracking
        self.response_tracking: Dict[str, Dict[str, Any]] = {}
        self.client_sentiment_history: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)

        # NLP components
        self._initialize_nlp_components()

        logger.info(f"{self.agent_name} initialized successfully")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self._default_config()

    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "domain": self.domain,
            "capabilities": [
                "multi_channel_collection",
                "sentiment_analysis",
                "emotion_detection",
                "topic_extraction",
                "survey_management",
                "response_tracking",
                "insight_generation",
                "action_planning"
            ],
            "sentiment_thresholds": {
                "very_positive": 0.6,
                "positive": 0.2,
                "neutral": -0.2,
                "negative": -0.6
            },
            "priority_rules": {
                "critical_keywords": ["urgent", "broken", "down", "critical", "severe"],
                "high_sentiment_threshold": -0.5
            },
            "enabled": True
        }

    def _initialize_nlp_components(self):
        """Initialize NLP components for text analysis."""
        # Sentiment lexicon (expandable with real NLP libraries)
        self.positive_words = {
            'excellent', 'amazing', 'great', 'fantastic', 'wonderful', 'love',
            'perfect', 'best', 'outstanding', 'superb', 'brilliant', 'awesome',
            'satisfied', 'happy', 'pleased', 'delighted', 'impressed', 'good'
        }

        self.negative_words = {
            'terrible', 'awful', 'bad', 'horrible', 'worst', 'hate', 'poor',
            'disappointing', 'frustrated', 'angry', 'upset', 'unsatisfied',
            'broken', 'failed', 'error', 'problem', 'issue', 'difficult'
        }

        self.emotion_keywords = {
            'joy': ['happy', 'delighted', 'pleased', 'excited', 'thrilled'],
            'anger': ['angry', 'furious', 'frustrated', 'annoyed', 'irritated'],
            'sadness': ['sad', 'disappointed', 'unhappy', 'dissatisfied'],
            'fear': ['worried', 'concerned', 'anxious', 'nervous'],
            'surprise': ['surprised', 'amazed', 'shocked', 'unexpected'],
            'trust': ['confident', 'reliable', 'trustworthy', 'dependable']
        }

        self.topic_patterns = {
            'pricing': r'\b(price|cost|expensive|cheap|afford|pricing|fee|charge)\b',
            'performance': r'\b(slow|fast|speed|performance|responsive|lag)\b',
            'support': r'\b(support|help|service|assist|response time)\b',
            'features': r'\b(feature|functionality|capability|option)\b',
            'usability': r'\b(easy|difficult|user.?friendly|intuitive|complex)\b',
            'quality': r'\b(quality|reliable|stable|buggy|glitch)\b'
        }

    # ============================================================================
    # FEEDBACK COLLECTION
    # ============================================================================

    def collect_feedback(
        self,
        client_id: str,
        content: str,
        channel: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Collect feedback from any channel.

        Args:
            client_id: Client identifier
            content: Feedback content
            channel: Collection channel
            metadata: Additional metadata

        Returns:
            Collection result with feedback ID
        """
        try:
            logger.info(f"Collecting feedback from client {client_id} via {channel}")

            # Validate inputs
            if not client_id or not content:
                raise ValueError("client_id and content are required")

            if not content.strip():
                raise ValueError("Feedback content cannot be empty")

            # Parse channel
            try:
                feedback_channel = FeedbackChannel(channel.lower())
            except ValueError:
                feedback_channel = FeedbackChannel.EMAIL
                logger.warning(f"Unknown channel {channel}, defaulting to EMAIL")

            # Generate feedback ID
            feedback_id = self._generate_feedback_id(client_id, content)

            # Create feedback item
            feedback_item = FeedbackItem(
                feedback_id=feedback_id,
                client_id=client_id,
                channel=feedback_channel,
                content=content,
                timestamp=datetime.now(),
                metadata=metadata or {}
            )

            # Perform initial analysis
            self._analyze_feedback_item(feedback_item)

            # Store feedback
            self.feedback_items[feedback_id] = feedback_item

            # Update client sentiment history
            if feedback_item.sentiment_score is not None:
                self.client_sentiment_history[client_id].append(
                    (feedback_item.timestamp, feedback_item.sentiment_score)
                )

            result = {
                "success": True,
                "feedback_id": feedback_id,
                "client_id": client_id,
                "channel": channel,
                "sentiment": feedback_item.sentiment_label.name if feedback_item.sentiment_label else None,
                "sentiment_score": feedback_item.sentiment_score,
                "priority": feedback_item.priority.value if feedback_item.priority else None,
                "category": feedback_item.category.value if feedback_item.category else None,
                "timestamp": feedback_item.timestamp.isoformat(),
                "requires_action": len(feedback_item.action_items) > 0
            }

            logger.info(f"Feedback {feedback_id} collected successfully")
            return result

        except ValueError as e:
            logger.error(f"Validation error in collect_feedback: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in collect_feedback: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def batch_collect_feedback(
        self,
        feedback_batch: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Collect multiple feedback items in batch.

        Args:
            feedback_batch: List of feedback items

        Returns:
            Batch collection results
        """
        try:
            logger.info(f"Batch collecting {len(feedback_batch)} feedback items")

            results = {
                "success": True,
                "total": len(feedback_batch),
                "processed": 0,
                "failed": 0,
                "feedback_ids": [],
                "errors": []
            }

            for item in feedback_batch:
                result = self.collect_feedback(
                    client_id=item.get("client_id"),
                    content=item.get("content"),
                    channel=item.get("channel", "email"),
                    metadata=item.get("metadata")
                )

                if result.get("success"):
                    results["processed"] += 1
                    results["feedback_ids"].append(result["feedback_id"])
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "client_id": item.get("client_id"),
                        "error": result.get("error")
                    })

            logger.info(f"Batch collection completed: {results['processed']} successful, {results['failed']} failed")
            return results

        except Exception as e:
            logger.error(f"Error in batch_collect_feedback: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    # ============================================================================
    # SENTIMENT ANALYSIS
    # ============================================================================

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Perform sentiment analysis on text.

        Args:
            text: Text to analyze

        Returns:
            Sentiment analysis results
        """
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")

            # Calculate sentiment score
            sentiment_score = self._calculate_sentiment_score(text)

            # Classify sentiment
            sentiment_label = self._classify_sentiment(sentiment_score)

            # Detect emotions
            emotions = self._detect_emotions(text)

            # Extract topics
            topics = self._extract_topics(text)

            # Calculate confidence
            confidence = self._calculate_confidence(text, sentiment_score)

            result = {
                "success": True,
                "sentiment_score": sentiment_score,
                "sentiment_label": sentiment_label.name,
                "emotions": emotions,
                "topics": topics,
                "confidence": confidence,
                "analysis_timestamp": datetime.now().isoformat()
            }

            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_sentiment: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in analyze_sentiment: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _calculate_sentiment_score(self, text: str) -> float:
        """
        Calculate sentiment score using lexicon-based approach.

        Score range: -1.0 (very negative) to +1.0 (very positive)
        """
        words = re.findall(r'\b\w+\b', text.lower())

        if not words:
            return 0.0

        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)

        # Calculate base score
        total_sentiment_words = positive_count + negative_count
        if total_sentiment_words == 0:
            return 0.0

        score = (positive_count - negative_count) / len(words)

        # Apply intensity modifiers
        if 'very' in words or 'extremely' in words:
            score *= 1.5
        if 'not' in words or "n't" in text:
            score *= -0.8

        # Normalize to [-1, 1]
        return max(-1.0, min(1.0, score * 10))

    def _classify_sentiment(self, score: float) -> SentimentScore:
        """Classify sentiment score into categorical label."""
        thresholds = self.config.get("sentiment_thresholds", {})

        if score >= thresholds.get("very_positive", 0.6):
            return SentimentScore.VERY_POSITIVE
        elif score >= thresholds.get("positive", 0.2):
            return SentimentScore.POSITIVE
        elif score >= thresholds.get("neutral", -0.2):
            return SentimentScore.NEUTRAL
        elif score >= thresholds.get("negative", -0.6):
            return SentimentScore.NEGATIVE
        else:
            return SentimentScore.VERY_NEGATIVE

    def _detect_emotions(self, text: str) -> List[str]:
        """Detect emotions in text."""
        text_lower = text.lower()
        detected_emotions = []

        for emotion, keywords in self.emotion_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_emotions.append(emotion)

        return detected_emotions

    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics from text using pattern matching."""
        text_lower = text.lower()
        detected_topics = []

        for topic, pattern in self.topic_patterns.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                detected_topics.append(topic)

        return detected_topics

    def _calculate_confidence(self, text: str, sentiment_score: float) -> float:
        """Calculate confidence score for sentiment analysis."""
        words = re.findall(r'\b\w+\b', text.lower())
        sentiment_words = sum(
            1 for word in words
            if word in self.positive_words or word in self.negative_words
        )

        # Base confidence on proportion of sentiment words
        if not words:
            return 0.0

        word_confidence = sentiment_words / len(words)
        score_confidence = abs(sentiment_score)

        return (word_confidence + score_confidence) / 2

    def _analyze_feedback_item(self, feedback_item: FeedbackItem):
        """Perform comprehensive analysis on feedback item."""
        # Sentiment analysis
        sentiment_result = self.analyze_sentiment(feedback_item.content)

        if sentiment_result.get("success"):
            feedback_item.sentiment_score = sentiment_result["sentiment_score"]
            feedback_item.sentiment_label = SentimentScore[sentiment_result["sentiment_label"]]
            feedback_item.emotions = sentiment_result["emotions"]
            feedback_item.topics = sentiment_result["topics"]

        # Categorize feedback
        feedback_item.category = self._categorize_feedback(feedback_item)

        # Assign priority
        feedback_item.priority = self._assign_priority(feedback_item)

        # Generate action items
        feedback_item.action_items = self._generate_action_items(feedback_item)

        feedback_item.is_processed = True

    def _categorize_feedback(self, feedback_item: FeedbackItem) -> FeedbackCategory:
        """Categorize feedback based on content and topics."""
        content_lower = feedback_item.content.lower()

        # Use topic extraction results
        if 'pricing' in feedback_item.topics:
            return FeedbackCategory.PRICING
        if 'support' in feedback_item.topics:
            return FeedbackCategory.SUPPORT
        if 'features' in feedback_item.topics:
            return FeedbackCategory.FEATURE_REQUEST

        # Keyword-based categorization
        if any(word in content_lower for word in ['bug', 'error', 'broken', 'crash']):
            return FeedbackCategory.BUG_REPORT
        if any(word in content_lower for word in ['feature', 'add', 'wish', 'would like']):
            return FeedbackCategory.FEATURE_REQUEST
        if any(word in content_lower for word in ['support', 'help', 'assist']):
            return FeedbackCategory.SUPPORT

        return FeedbackCategory.GENERAL

    def _assign_priority(self, feedback_item: FeedbackItem) -> FeedbackPriority:
        """Assign priority based on sentiment, keywords, and category."""
        priority_rules = self.config.get("priority_rules", {})
        content_lower = feedback_item.content.lower()

        # Critical keywords
        critical_keywords = priority_rules.get("critical_keywords", [])
        if any(keyword in content_lower for keyword in critical_keywords):
            return FeedbackPriority.CRITICAL

        # Sentiment-based priority
        if feedback_item.sentiment_score is not None:
            threshold = priority_rules.get("high_sentiment_threshold", -0.5)
            if feedback_item.sentiment_score < threshold:
                return FeedbackPriority.HIGH

        # Category-based priority
        if feedback_item.category == FeedbackCategory.BUG_REPORT:
            return FeedbackPriority.HIGH

        # Default priority
        if feedback_item.sentiment_score and feedback_item.sentiment_score < 0:
            return FeedbackPriority.MEDIUM

        return FeedbackPriority.LOW

    def _generate_action_items(self, feedback_item: FeedbackItem) -> List[Dict[str, Any]]:
        """Generate automated action items based on feedback analysis."""
        action_items = []

        # Critical priority items
        if feedback_item.priority == FeedbackPriority.CRITICAL:
            action_items.append({
                "action": "immediate_escalation",
                "description": "Escalate to senior management immediately",
                "assignee": "customer_success_manager",
                "deadline": (datetime.now() + timedelta(hours=2)).isoformat()
            })

        # Bug reports
        if feedback_item.category == FeedbackCategory.BUG_REPORT:
            action_items.append({
                "action": "create_ticket",
                "description": "Create technical support ticket",
                "assignee": "technical_support",
                "deadline": (datetime.now() + timedelta(days=1)).isoformat()
            })

        # Negative sentiment
        if feedback_item.sentiment_score and feedback_item.sentiment_score < -0.3:
            action_items.append({
                "action": "client_outreach",
                "description": "Reach out to client for follow-up",
                "assignee": "account_manager",
                "deadline": (datetime.now() + timedelta(days=2)).isoformat()
            })

        return action_items

    # ============================================================================
    # SURVEY MANAGEMENT
    # ============================================================================

    def create_survey(
        self,
        title: str,
        description: str,
        questions: List[Dict[str, Any]],
        target_audience: str,
        response_goal: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a new survey template.

        Args:
            title: Survey title
            description: Survey description
            questions: List of survey questions
            target_audience: Target audience description
            response_goal: Target number of responses

        Returns:
            Survey creation result
        """
        try:
            logger.info(f"Creating survey: {title}")

            # Validate inputs
            if not title or not questions:
                raise ValueError("title and questions are required")

            if not isinstance(questions, list) or len(questions) == 0:
                raise ValueError("questions must be a non-empty list")

            # Generate survey ID
            survey_id = f"survey_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Create survey template
            survey = SurveyTemplate(
                survey_id=survey_id,
                title=title,
                description=description,
                questions=questions,
                target_audience=target_audience,
                response_goal=response_goal,
                active=True
            )

            # Store survey
            self.surveys[survey_id] = survey

            result = {
                "success": True,
                "survey_id": survey_id,
                "title": title,
                "question_count": len(questions),
                "target_audience": target_audience,
                "response_goal": response_goal,
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Survey {survey_id} created successfully")
            return result

        except ValueError as e:
            logger.error(f"Validation error in create_survey: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in create_survey: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def record_survey_response(
        self,
        survey_id: str,
        respondent_id: str,
        responses: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Record a survey response.

        Args:
            survey_id: Survey identifier
            respondent_id: Respondent identifier
            responses: Survey responses

        Returns:
            Recording result
        """
        try:
            if survey_id not in self.surveys:
                raise ValueError(f"Survey {survey_id} not found")

            response_record = {
                "response_id": f"resp_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "survey_id": survey_id,
                "respondent_id": respondent_id,
                "responses": responses,
                "timestamp": datetime.now().isoformat()
            }

            self.survey_responses[survey_id].append(response_record)

            # Update response tracking
            self._update_response_tracking(survey_id)

            return {
                "success": True,
                "response_id": response_record["response_id"],
                "survey_id": survey_id,
                "timestamp": response_record["timestamp"]
            }

        except ValueError as e:
            logger.error(f"Validation error in record_survey_response: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in record_survey_response: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def get_survey_analytics(self, survey_id: str) -> Dict[str, Any]:
        """
        Get analytics for a survey.

        Args:
            survey_id: Survey identifier

        Returns:
            Survey analytics
        """
        try:
            if survey_id not in self.surveys:
                raise ValueError(f"Survey {survey_id} not found")

            survey = self.surveys[survey_id]
            responses = self.survey_responses.get(survey_id, [])

            analytics = {
                "success": True,
                "survey_id": survey_id,
                "title": survey.title,
                "response_count": len(responses),
                "response_goal": survey.response_goal,
                "completion_rate": self._calculate_completion_rate(survey_id),
                "response_rate": len(responses) / survey.response_goal if survey.response_goal else None,
                "question_analytics": self._analyze_survey_questions(survey_id),
                "generated_at": datetime.now().isoformat()
            }

            return analytics

        except ValueError as e:
            logger.error(f"Validation error in get_survey_analytics: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in get_survey_analytics: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _update_response_tracking(self, survey_id: str):
        """Update response tracking metrics."""
        responses = self.survey_responses.get(survey_id, [])

        self.response_tracking[survey_id] = {
            "total_responses": len(responses),
            "last_response": responses[-1]["timestamp"] if responses else None,
            "updated_at": datetime.now().isoformat()
        }

    def _calculate_completion_rate(self, survey_id: str) -> float:
        """Calculate survey completion rate."""
        # Simplified - in production, track partial vs complete responses
        responses = self.survey_responses.get(survey_id, [])
        if not responses:
            return 0.0

        # Assume all recorded responses are complete
        return 1.0

    def _analyze_survey_questions(self, survey_id: str) -> List[Dict[str, Any]]:
        """Analyze individual survey questions."""
        survey = self.surveys[survey_id]
        responses = self.survey_responses.get(survey_id, [])

        question_analytics = []

        for idx, question in enumerate(survey.questions):
            question_key = question.get("id", f"q{idx}")
            question_responses = [
                r["responses"].get(question_key)
                for r in responses
                if question_key in r["responses"]
            ]

            analytics = {
                "question_id": question_key,
                "question_text": question.get("text"),
                "response_count": len(question_responses),
                "response_rate": len(question_responses) / len(responses) if responses else 0
            }

            # Type-specific analytics
            if question.get("type") == "rating":
                numeric_responses = [r for r in question_responses if isinstance(r, (int, float))]
                if numeric_responses:
                    analytics["average_rating"] = statistics.mean(numeric_responses)
                    analytics["median_rating"] = statistics.median(numeric_responses)

            elif question.get("type") in ["text", "open_ended"]:
                # Sentiment analysis on text responses
                text_responses = [r for r in question_responses if isinstance(r, str)]
                if text_responses:
                    sentiments = [
                        self.analyze_sentiment(resp)["sentiment_score"]
                        for resp in text_responses
                        if self.analyze_sentiment(resp).get("success")
                    ]
                    if sentiments:
                        analytics["average_sentiment"] = statistics.mean(sentiments)

            question_analytics.append(analytics)

        return question_analytics

    # ============================================================================
    # INSIGHT GENERATION
    # ============================================================================

    def generate_insights(
        self,
        timeframe_days: int = 30,
        min_feedback_count: int = 10
    ) -> Dict[str, Any]:
        """
        Generate insights from collected feedback.

        Args:
            timeframe_days: Number of days to analyze
            min_feedback_count: Minimum feedback items required

        Returns:
            Generated insights
        """
        try:
            logger.info(f"Generating insights for last {timeframe_days} days")

            # Filter feedback by timeframe
            cutoff_date = datetime.now() - timedelta(days=timeframe_days)
            recent_feedback = [
                fb for fb in self.feedback_items.values()
                if fb.timestamp >= cutoff_date
            ]

            if len(recent_feedback) < min_feedback_count:
                logger.warning(f"Insufficient feedback: {len(recent_feedback)} < {min_feedback_count}")
                return {
                    "success": False,
                    "error": f"Insufficient feedback data ({len(recent_feedback)} items)",
                    "error_type": "insufficient_data"
                }

            # Generate comprehensive insights
            insights = {
                "success": True,
                "timeframe_days": timeframe_days,
                "feedback_analyzed": len(recent_feedback),
                "generated_at": datetime.now().isoformat(),
                "sentiment_overview": self._analyze_sentiment_trends(recent_feedback),
                "topic_analysis": self._analyze_topic_distribution(recent_feedback),
                "priority_breakdown": self._analyze_priority_distribution(recent_feedback),
                "channel_performance": self._analyze_channel_performance(recent_feedback),
                "client_health": self._analyze_client_health(),
                "actionable_insights": self._generate_actionable_insights(recent_feedback),
                "recommendations": self._generate_recommendations(recent_feedback)
            }

            # Store insights
            self.insights.append(insights)

            logger.info("Insights generated successfully")
            return insights

        except Exception as e:
            logger.error(f"Error in generate_insights: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _analyze_sentiment_trends(self, feedback_items: List[FeedbackItem]) -> Dict[str, Any]:
        """Analyze sentiment trends."""
        sentiments = [fb.sentiment_score for fb in feedback_items if fb.sentiment_score is not None]

        if not sentiments:
            return {"error": "No sentiment data available"}

        sentiment_labels = [fb.sentiment_label.name for fb in feedback_items if fb.sentiment_label]
        label_distribution = Counter(sentiment_labels)

        return {
            "average_sentiment": statistics.mean(sentiments),
            "median_sentiment": statistics.median(sentiments),
            "sentiment_std": statistics.stdev(sentiments) if len(sentiments) > 1 else 0,
            "distribution": dict(label_distribution),
            "positive_ratio": sum(1 for s in sentiments if s > 0) / len(sentiments),
            "negative_ratio": sum(1 for s in sentiments if s < 0) / len(sentiments)
        }

    def _analyze_topic_distribution(self, feedback_items: List[FeedbackItem]) -> Dict[str, Any]:
        """Analyze topic distribution."""
        all_topics = []
        for fb in feedback_items:
            all_topics.extend(fb.topics)

        topic_counts = Counter(all_topics)
        total_topics = sum(topic_counts.values())

        return {
            "total_topics": len(topic_counts),
            "top_topics": topic_counts.most_common(5),
            "topic_distribution": {
                topic: {
                    "count": count,
                    "percentage": (count / total_topics * 100) if total_topics > 0 else 0
                }
                for topic, count in topic_counts.items()
            }
        }

    def _analyze_priority_distribution(self, feedback_items: List[FeedbackItem]) -> Dict[str, Any]:
        """Analyze priority distribution."""
        priorities = [fb.priority.value for fb in feedback_items if fb.priority]
        priority_counts = Counter(priorities)

        return {
            "distribution": dict(priority_counts),
            "critical_count": priority_counts.get("critical", 0),
            "high_count": priority_counts.get("high", 0),
            "requires_immediate_attention": priority_counts.get("critical", 0) + priority_counts.get("high", 0)
        }

    def _analyze_channel_performance(self, feedback_items: List[FeedbackItem]) -> Dict[str, Any]:
        """Analyze feedback by channel."""
        channel_data = defaultdict(lambda: {"count": 0, "sentiments": []})

        for fb in feedback_items:
            channel = fb.channel.value
            channel_data[channel]["count"] += 1
            if fb.sentiment_score is not None:
                channel_data[channel]["sentiments"].append(fb.sentiment_score)

        channel_performance = {}
        for channel, data in channel_data.items():
            performance = {
                "feedback_count": data["count"],
                "percentage": (data["count"] / len(feedback_items) * 100) if feedback_items else 0
            }

            if data["sentiments"]:
                performance["average_sentiment"] = statistics.mean(data["sentiments"])

            channel_performance[channel] = performance

        return channel_performance

    def _analyze_client_health(self) -> Dict[str, Any]:
        """Analyze overall client health based on sentiment history."""
        client_health_scores = {}

        for client_id, history in self.client_sentiment_history.items():
            if not history:
                continue

            recent_sentiments = [score for _, score in history[-10:]]  # Last 10 feedbacks

            if recent_sentiments:
                avg_sentiment = statistics.mean(recent_sentiments)
                trend = "improving" if len(recent_sentiments) > 1 and recent_sentiments[-1] > recent_sentiments[0] else "declining"

                client_health_scores[client_id] = {
                    "average_sentiment": avg_sentiment,
                    "trend": trend,
                    "feedback_count": len(recent_sentiments),
                    "health_status": self._determine_health_status(avg_sentiment)
                }

        return {
            "total_clients": len(client_health_scores),
            "healthy_clients": sum(1 for c in client_health_scores.values() if c["health_status"] == "healthy"),
            "at_risk_clients": sum(1 for c in client_health_scores.values() if c["health_status"] == "at_risk"),
            "client_scores": client_health_scores
        }

    def _determine_health_status(self, avg_sentiment: float) -> str:
        """Determine client health status from average sentiment."""
        if avg_sentiment >= 0.3:
            return "healthy"
        elif avg_sentiment >= -0.3:
            return "neutral"
        else:
            return "at_risk"

    def _generate_actionable_insights(self, feedback_items: List[FeedbackItem]) -> List[Dict[str, Any]]:
        """Generate actionable insights from patterns."""
        insights = []

        # Identify recurring issues
        topic_counts = Counter()
        for fb in feedback_items:
            topic_counts.update(fb.topics)

        for topic, count in topic_counts.most_common(3):
            if count >= 5:
                insights.append({
                    "type": "recurring_topic",
                    "topic": topic,
                    "occurrence_count": count,
                    "recommendation": f"Address recurring {topic} concerns",
                    "priority": "high" if count >= 10 else "medium"
                })

        # Identify sentiment deterioration
        negative_feedback = [fb for fb in feedback_items if fb.sentiment_score and fb.sentiment_score < -0.3]
        if len(negative_feedback) > len(feedback_items) * 0.3:
            insights.append({
                "type": "sentiment_alert",
                "negative_percentage": len(negative_feedback) / len(feedback_items) * 100,
                "recommendation": "Investigate causes of negative sentiment spike",
                "priority": "critical"
            })

        return insights

    def _generate_recommendations(self, feedback_items: List[FeedbackItem]) -> List[Dict[str, Any]]:
        """Generate strategic recommendations."""
        recommendations = []

        # Channel recommendations
        channel_counts = Counter(fb.channel.value for fb in feedback_items)
        if channel_counts:
            top_channel = channel_counts.most_common(1)[0][0]
            recommendations.append({
                "type": "channel_optimization",
                "recommendation": f"Focus on {top_channel} channel - highest feedback volume",
                "expected_impact": "high"
            })

        # Response time recommendations
        action_items = [item for fb in feedback_items for item in fb.action_items]
        if len(action_items) > 10:
            recommendations.append({
                "type": "process_improvement",
                "recommendation": "Implement automated action item routing",
                "expected_impact": "medium"
            })

        return recommendations

    # ============================================================================
    # UTILITY METHODS
    # ============================================================================

    def _generate_feedback_id(self, client_id: str, content: str) -> str:
        """Generate unique feedback ID."""
        hash_input = f"{client_id}_{content}_{datetime.now().isoformat()}"
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()[:12]
        return f"fb_{hash_value}"

    def get_feedback_summary(self, client_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get feedback summary.

        Args:
            client_id: Optional client ID to filter by

        Returns:
            Feedback summary
        """
        feedback_list = list(self.feedback_items.values())

        if client_id:
            feedback_list = [fb for fb in feedback_list if fb.client_id == client_id]

        return {
            "total_feedback": len(feedback_list),
            "by_channel": Counter(fb.channel.value for fb in feedback_list),
            "by_priority": Counter(fb.priority.value for fb in feedback_list if fb.priority),
            "by_category": Counter(fb.category.value for fb in feedback_list if fb.category),
            "average_sentiment": statistics.mean(
                [fb.sentiment_score for fb in feedback_list if fb.sentiment_score is not None]
            ) if any(fb.sentiment_score is not None for fb in feedback_list) else None
        }

    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming requests.

        Args:
            request: Request details

        Returns:
            Response to request
        """
        request_type = request.get("type")

        if request_type == "collect_feedback":
            return self.collect_feedback(
                client_id=request.get("client_id"),
                content=request.get("content"),
                channel=request.get("channel", "email"),
                metadata=request.get("metadata")
            )

        elif request_type == "batch_collect":
            return self.batch_collect_feedback(request.get("feedback_batch", []))

        elif request_type == "analyze_sentiment":
            return self.analyze_sentiment(request.get("text"))

        elif request_type == "create_survey":
            return self.create_survey(
                title=request.get("title"),
                description=request.get("description"),
                questions=request.get("questions"),
                target_audience=request.get("target_audience"),
                response_goal=request.get("response_goal")
            )

        elif request_type == "generate_insights":
            return self.generate_insights(
                timeframe_days=request.get("timeframe_days", 30),
                min_feedback_count=request.get("min_feedback_count", 10)
            )

        elif request_type == "get_summary":
            return self.get_feedback_summary(request.get("client_id"))

        else:
            return {
                "success": False,
                "error": f"Unknown request type: {request_type}",
                "error_type": "invalid_request"
            }

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "domain": self.domain,
            "status": "active",
            "statistics": {
                "total_feedback": len(self.feedback_items),
                "active_surveys": len([s for s in self.surveys.values() if s.active]),
                "insights_generated": len(self.insights),
                "action_plans": len(self.action_plans)
            }
        }
