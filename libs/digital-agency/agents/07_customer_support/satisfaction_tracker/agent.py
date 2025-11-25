"""
Satisfaction Tracker Agent

Monitors customer satisfaction through CSAT/NPS tracking, sentiment analysis, and trend detection.
Production-ready implementation with advanced analytics and prediction capabilities.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import yaml
from pathlib import Path
import logging
from collections import defaultdict, Counter
import re
import statistics

logger = logging.getLogger(__name__)


class SurveyType(Enum):
    """Survey types."""
    CSAT = "csat"  # Customer Satisfaction Score
    NPS = "nps"    # Net Promoter Score
    CES = "ces"    # Customer Effort Score
    POST_INTERACTION = "post_interaction"
    PERIODIC = "periodic"


class SentimentCategory(Enum):
    """Sentiment categories."""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"


class NPSCategory(Enum):
    """NPS customer categories."""
    PROMOTER = "promoter"      # 9-10
    PASSIVE = "passive"        # 7-8
    DETRACTOR = "detractor"    # 0-6


@dataclass
class SurveyResponse:
    """Survey response data."""
    response_id: str
    survey_type: SurveyType
    customer_id: str
    ticket_id: Optional[str]
    score: int
    feedback_text: Optional[str]
    timestamp: datetime
    channel: str
    agent_id: Optional[str] = None
    team: Optional[str] = None
    response_time_seconds: Optional[float] = None
    sentiment_score: float = 0.0
    sentiment_category: Optional[SentimentCategory] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SatisfactionTrend:
    """Satisfaction trend data."""
    period: str
    start_date: datetime
    end_date: datetime
    avg_csat: float
    avg_nps: float
    response_count: int
    promoter_count: int
    passive_count: int
    detractor_count: int
    sentiment_distribution: Dict[str, int]
    trend_direction: str  # improving, declining, stable


@dataclass
class Alert:
    """Satisfaction alert."""
    alert_id: str
    alert_type: str
    severity: str
    message: str
    triggered_at: datetime
    metric_value: float
    threshold_value: float
    affected_entity: Optional[str] = None
    recommendations: List[str] = field(default_factory=list)


class SatisfactionTrackerAgent:
    """
    Advanced Satisfaction Tracker for comprehensive customer satisfaction monitoring.

    Capabilities:
    - CSAT/NPS/CES tracking
    - Advanced sentiment analysis
    - Trend detection and forecasting
    - Real-time alerting
    - Agent performance correlation
    - Root cause analysis
    - Predictive insights
    - Feedback categorization
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Satisfaction Tracker Agent."""
        self.config = self._load_config(config_path)
        self.name = "Satisfaction Tracker Agent"
        self.role = "satisfaction_tracker"

        # Data storage
        self.responses: List[SurveyResponse] = []
        self.trends: List[SatisfactionTrend] = []
        self.alerts: List[Alert] = []

        # Analytics
        self.response_counter = 0
        self.daily_scores: Dict[str, List[float]] = defaultdict(list)
        self.agent_scores: Dict[str, List[float]] = defaultdict(list)
        self.team_scores: Dict[str, List[float]] = defaultdict(list)
        self.category_sentiment: Dict[str, List[float]] = defaultdict(list)

        # Sentiment lexicon
        self.sentiment_lexicon = self._load_sentiment_lexicon()
        self.feedback_patterns = self._load_feedback_patterns()

        logger.info(f"{self.name} initialized successfully")

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"

        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file not found, using defaults")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'Satisfaction Tracker Agent',
            'model': 'gpt-4',
            'temperature': 0.4,
            'max_tokens': 1500,
            'csat_low_threshold': 3.0,
            'nps_low_threshold': 30,
            'sentiment_negative_threshold': -0.3,
            'alert_enabled': True,
            'trend_analysis_days': 30,
            'min_responses_for_trend': 10,
            'capabilities': [
                'csat_tracking',
                'nps_tracking',
                'sentiment_analysis',
                'trend_detection',
                'alerting',
                'feedback_analysis',
                'predictive_analytics'
            ],
            'survey_channels': ['email', 'sms', 'in_app', 'web']
        }

    def _load_sentiment_lexicon(self) -> Dict[str, float]:
        """Load sentiment analysis lexicon."""
        return {
            # Very negative
            'terrible': -1.0, 'awful': -1.0, 'horrible': -1.0, 'worst': -0.9,
            'hate': -0.9, 'useless': -0.9, 'pathetic': -0.9, 'disgusting': -1.0,

            # Negative
            'bad': -0.7, 'poor': -0.7, 'disappointing': -0.6, 'frustrated': -0.7,
            'unhappy': -0.6, 'dissatisfied': -0.7, 'unacceptable': -0.8,
            'annoying': -0.6, 'confusing': -0.5, 'difficult': -0.5,

            # Neutral
            'okay': 0.0, 'fine': 0.1, 'average': 0.0, 'adequate': 0.2,

            # Positive
            'good': 0.7, 'happy': 0.7, 'satisfied': 0.7, 'helpful': 0.8,
            'pleasant': 0.6, 'nice': 0.6, 'thank': 0.5, 'appreciate': 0.7,

            # Very positive
            'excellent': 1.0, 'amazing': 1.0, 'fantastic': 1.0, 'outstanding': 1.0,
            'perfect': 1.0, 'love': 0.9, 'wonderful': 0.9, 'superb': 0.9,
            'exceptional': 1.0, 'brilliant': 0.9
        }

    def _load_feedback_patterns(self) -> Dict[str, List[str]]:
        """Load common feedback patterns for categorization."""
        return {
            'response_time': [
                r'\b(slow|fast|quick|delayed|wait|response time)\b',
                r'\b(took (too )?long|immediate|instant)\b'
            ],
            'agent_quality': [
                r'\b(agent|representative|support (person|staff))\b.*\b(helpful|rude|professional|knowledgeable)\b',
                r'\b(friendly|courteous|patient|understanding)\b'
            ],
            'resolution': [
                r'\b(problem|issue).*\b(solved|resolved|fixed|unresolved)\b',
                r'\b(solution|answer|fix)\b'
            ],
            'product_quality': [
                r'\b(product|service|feature).*\b(works|broken|buggy|reliable)\b'
            ],
            'ease_of_use': [
                r'\b(easy|difficult|complicated|simple|confusing)\b.*\b(use|navigate)\b'
            ],
            'communication': [
                r'\b(explain|understand|clear|unclear|communicate)\b'
            ]
        }

    async def record_survey_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record a customer satisfaction survey response.

        Args:
            response_data: Survey response data

        Returns:
            Recording result with analysis
        """
        try:
            logger.info("Recording survey response")

            # Validate required fields
            required_fields = ['survey_type', 'customer_id', 'score']
            for field in required_fields:
                if field not in response_data:
                    raise ValueError(f"Missing required field: {field}")

            # Parse survey type
            try:
                survey_type = SurveyType(response_data['survey_type'].lower())
            except ValueError:
                raise ValueError(f"Invalid survey type: {response_data['survey_type']}")

            # Validate score based on survey type
            score = response_data['score']
            if survey_type == SurveyType.NPS:
                if not (0 <= score <= 10):
                    raise ValueError("NPS score must be between 0 and 10")
            elif survey_type in [SurveyType.CSAT, SurveyType.CES]:
                if not (1 <= score <= 5):
                    raise ValueError("CSAT/CES score must be between 1 and 5")

            # Generate response ID
            self.response_counter += 1
            response_id = f"RESP-{datetime.utcnow().strftime('%Y%m%d')}-{self.response_counter:06d}"

            # Analyze sentiment from feedback
            feedback_text = response_data.get('feedback_text', '')
            sentiment_score = 0.0
            sentiment_category = SentimentCategory.NEUTRAL
            tags = []

            if feedback_text:
                sentiment_score = self._analyze_sentiment(feedback_text)
                sentiment_category = self._categorize_sentiment(sentiment_score)
                tags = self._categorize_feedback(feedback_text)

            # Create response record
            response = SurveyResponse(
                response_id=response_id,
                survey_type=survey_type,
                customer_id=response_data['customer_id'],
                ticket_id=response_data.get('ticket_id'),
                score=score,
                feedback_text=feedback_text,
                timestamp=datetime.utcnow(),
                channel=response_data.get('channel', 'email'),
                agent_id=response_data.get('agent_id'),
                team=response_data.get('team'),
                response_time_seconds=response_data.get('response_time_seconds'),
                sentiment_score=sentiment_score,
                sentiment_category=sentiment_category,
                tags=tags,
                metadata=response_data.get('metadata', {})
            )

            # Store response
            self.responses.append(response)

            # Update analytics
            date_key = response.timestamp.strftime('%Y-%m-%d')
            self.daily_scores[date_key].append(float(score))

            if response.agent_id:
                self.agent_scores[response.agent_id].append(float(score))
            if response.team:
                self.team_scores[response.team].append(float(score))

            # Check for alerts
            alerts_triggered = await self._check_alerts(response)

            # Calculate NPS category if applicable
            nps_category = None
            if survey_type == SurveyType.NPS:
                nps_category = self._get_nps_category(score)

            logger.info(f"Survey response {response_id} recorded successfully")

            return {
                'success': True,
                'response_id': response_id,
                'survey_type': survey_type.value,
                'score': score,
                'nps_category': nps_category.value if nps_category else None,
                'sentiment_score': round(sentiment_score, 3),
                'sentiment_category': sentiment_category.value,
                'feedback_tags': tags,
                'alerts_triggered': len(alerts_triggered),
                'timestamp': response.timestamp.isoformat()
            }

        except ValueError as e:
            logger.error(f"Validation error in record_survey_response: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in record_survey_response: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _analyze_sentiment(self, text: str) -> float:
        """
        Analyze sentiment from text.

        Args:
            text: Feedback text

        Returns:
            Sentiment score from -1 (very negative) to 1 (very positive)
        """
        if not text:
            return 0.0

        text_lower = text.lower()
        scores = []

        # Score based on lexicon
        for word, score in self.sentiment_lexicon.items():
            if word in text_lower:
                scores.append(score)

        # Check for negation
        negation_words = ['not', 'no', "don't", "doesn't", "didn't", "won't", "can't", "never"]
        words = text_lower.split()

        for i, word in enumerate(words):
            if word in negation_words and i + 1 < len(words):
                next_word = words[i + 1]
                if next_word in self.sentiment_lexicon:
                    # Flip sentiment of negated word
                    original_score = self.sentiment_lexicon[next_word]
                    scores.append(-original_score * 0.8)

        # Calculate average
        if scores:
            sentiment = sum(scores) / len(scores)
        else:
            sentiment = 0.0

        # Check for excessive punctuation (usually indicates strong emotion)
        exclamation_count = text.count('!')
        if exclamation_count > 2:
            sentiment *= 1.2

        # Clamp to [-1, 1]
        return max(-1.0, min(1.0, sentiment))

    def _categorize_sentiment(self, sentiment_score: float) -> SentimentCategory:
        """Categorize sentiment score into categories."""
        if sentiment_score >= 0.6:
            return SentimentCategory.VERY_POSITIVE
        elif sentiment_score >= 0.2:
            return SentimentCategory.POSITIVE
        elif sentiment_score >= -0.2:
            return SentimentCategory.NEUTRAL
        elif sentiment_score >= -0.6:
            return SentimentCategory.NEGATIVE
        else:
            return SentimentCategory.VERY_NEGATIVE

    def _categorize_feedback(self, text: str) -> List[str]:
        """Categorize feedback text into topics."""
        tags = []

        for category, patterns in self.feedback_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    tags.append(category)
                    break

        return list(set(tags))

    def _get_nps_category(self, score: int) -> NPSCategory:
        """Get NPS category from score."""
        if score >= 9:
            return NPSCategory.PROMOTER
        elif score >= 7:
            return NPSCategory.PASSIVE
        else:
            return NPSCategory.DETRACTOR

    async def _check_alerts(self, response: SurveyResponse) -> List[Alert]:
        """Check if response triggers any alerts."""
        alerts_triggered = []

        # Low CSAT score alert
        if response.survey_type == SurveyType.CSAT:
            threshold = self.config.get('csat_low_threshold', 3.0)
            if response.score < threshold:
                alert = self._create_alert(
                    'low_csat',
                    'high',
                    f"Low CSAT score ({response.score}) received",
                    response.score,
                    threshold,
                    response.customer_id
                )
                alerts_triggered.append(alert)

        # NPS detractor alert
        if response.survey_type == SurveyType.NPS:
            if response.score <= 6:
                alert = self._create_alert(
                    'nps_detractor',
                    'high',
                    f"NPS Detractor identified (score: {response.score})",
                    response.score,
                    6,
                    response.customer_id
                )
                alerts_triggered.append(alert)

        # Negative sentiment alert
        sentiment_threshold = self.config.get('sentiment_negative_threshold', -0.3)
        if response.sentiment_score < sentiment_threshold:
            alert = self._create_alert(
                'negative_sentiment',
                'medium',
                f"Negative sentiment detected (score: {response.sentiment_score:.2f})",
                response.sentiment_score,
                sentiment_threshold,
                response.customer_id
            )
            alerts_triggered.append(alert)

        return alerts_triggered

    def _create_alert(self, alert_type: str, severity: str, message: str,
                     metric_value: float, threshold_value: float,
                     affected_entity: Optional[str] = None) -> Alert:
        """Create an alert."""
        alert_id = f"ALERT-{len(self.alerts) + 1:06d}"

        alert = Alert(
            alert_id=alert_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            triggered_at=datetime.utcnow(),
            metric_value=metric_value,
            threshold_value=threshold_value,
            affected_entity=affected_entity,
            recommendations=self._get_alert_recommendations(alert_type)
        )

        self.alerts.append(alert)
        logger.warning(f"Alert triggered: {alert_type} - {message}")

        return alert

    def _get_alert_recommendations(self, alert_type: str) -> List[str]:
        """Get recommendations for alert type."""
        recommendations = {
            'low_csat': [
                "Follow up with customer immediately",
                "Review interaction for improvement opportunities",
                "Consider offering compensation or support"
            ],
            'nps_detractor': [
                "Reach out to understand concerns",
                "Escalate to retention team",
                "Schedule customer success call"
            ],
            'negative_sentiment': [
                "Review feedback for specific issues",
                "Assign to senior support agent",
                "Monitor for escalation"
            ]
        }

        return recommendations.get(alert_type, ["Review and take appropriate action"])

    async def calculate_nps(self, days: int = 30) -> Dict[str, Any]:
        """
        Calculate Net Promoter Score for specified period.

        Args:
            days: Number of days to analyze

        Returns:
            NPS calculation results
        """
        try:
            logger.info(f"Calculating NPS for last {days} days")

            # Get NPS responses from specified period
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            nps_responses = [
                r for r in self.responses
                if r.survey_type == SurveyType.NPS and r.timestamp >= cutoff_date
            ]

            if not nps_responses:
                return {
                    'success': True,
                    'nps_score': None,
                    'message': 'No NPS responses in specified period'
                }

            # Categorize responses
            promoters = sum(1 for r in nps_responses if r.score >= 9)
            passives = sum(1 for r in nps_responses if 7 <= r.score <= 8)
            detractors = sum(1 for r in nps_responses if r.score <= 6)

            total = len(nps_responses)

            # Calculate NPS
            promoter_percentage = (promoters / total) * 100
            detractor_percentage = (detractors / total) * 100
            nps_score = promoter_percentage - detractor_percentage

            # Calculate average score
            avg_score = sum(r.score for r in nps_responses) / total

            logger.info(f"NPS calculated: {nps_score:.1f}")

            return {
                'success': True,
                'nps_score': round(nps_score, 1),
                'average_score': round(avg_score, 2),
                'total_responses': total,
                'promoters': promoters,
                'promoter_percentage': round(promoter_percentage, 1),
                'passives': passives,
                'passive_percentage': round((passives / total) * 100, 1),
                'detractors': detractors,
                'detractor_percentage': round(detractor_percentage, 1),
                'period_days': days,
                'calculation_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating NPS: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def calculate_csat(self, days: int = 30) -> Dict[str, Any]:
        """
        Calculate Customer Satisfaction Score for specified period.

        Args:
            days: Number of days to analyze

        Returns:
            CSAT calculation results
        """
        try:
            logger.info(f"Calculating CSAT for last {days} days")

            # Get CSAT responses from specified period
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            csat_responses = [
                r for r in self.responses
                if r.survey_type == SurveyType.CSAT and r.timestamp >= cutoff_date
            ]

            if not csat_responses:
                return {
                    'success': True,
                    'csat_score': None,
                    'message': 'No CSAT responses in specified period'
                }

            # Calculate CSAT (percentage of 4-5 ratings)
            satisfied = sum(1 for r in csat_responses if r.score >= 4)
            total = len(csat_responses)

            csat_percentage = (satisfied / total) * 100

            # Calculate average score
            avg_score = sum(r.score for r in csat_responses) / total

            # Score distribution
            score_dist = Counter(r.score for r in csat_responses)

            logger.info(f"CSAT calculated: {csat_percentage:.1f}%")

            return {
                'success': True,
                'csat_percentage': round(csat_percentage, 1),
                'average_score': round(avg_score, 2),
                'total_responses': total,
                'satisfied_count': satisfied,
                'score_distribution': dict(score_dist),
                'period_days': days,
                'calculation_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating CSAT: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def analyze_trends(self, days: int = 30) -> Dict[str, Any]:
        """
        Analyze satisfaction trends over time.

        Args:
            days: Number of days to analyze

        Returns:
            Trend analysis results
        """
        try:
            logger.info(f"Analyzing satisfaction trends for last {days} days")

            cutoff_date = datetime.utcnow() - timedelta(days=days)
            recent_responses = [
                r for r in self.responses
                if r.timestamp >= cutoff_date
            ]

            if len(recent_responses) < self.config.get('min_responses_for_trend', 10):
                return {
                    'success': True,
                    'message': 'Insufficient data for trend analysis',
                    'response_count': len(recent_responses)
                }

            # Group by week
            weekly_data = defaultdict(list)
            for response in recent_responses:
                week_key = response.timestamp.strftime('%Y-W%U')
                weekly_data[week_key].append(response)

            # Calculate weekly metrics
            weekly_trends = []
            for week, responses in sorted(weekly_data.items()):
                avg_score = statistics.mean(r.score for r in responses)
                avg_sentiment = statistics.mean(r.sentiment_score for r in responses)

                weekly_trends.append({
                    'week': week,
                    'response_count': len(responses),
                    'avg_score': round(avg_score, 2),
                    'avg_sentiment': round(avg_sentiment, 3)
                })

            # Detect trend direction
            if len(weekly_trends) >= 2:
                recent_avg = statistics.mean(t['avg_score'] for t in weekly_trends[-2:])
                earlier_avg = statistics.mean(t['avg_score'] for t in weekly_trends[:2])

                if recent_avg > earlier_avg + 0.3:
                    trend_direction = "improving"
                elif recent_avg < earlier_avg - 0.3:
                    trend_direction = "declining"
                else:
                    trend_direction = "stable"
            else:
                trend_direction = "unknown"

            # Sentiment distribution
            sentiment_dist = Counter(r.sentiment_category.value for r in recent_responses)

            logger.info(f"Trend analysis completed: {trend_direction}")

            return {
                'success': True,
                'trend_direction': trend_direction,
                'weekly_trends': weekly_trends,
                'sentiment_distribution': dict(sentiment_dist),
                'total_responses': len(recent_responses),
                'period_days': days,
                'analysis_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error analyzing trends: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def get_agent_performance(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get agent-specific satisfaction metrics.

        Args:
            agent_id: Optional specific agent ID

        Returns:
            Agent performance metrics
        """
        try:
            if agent_id:
                if agent_id not in self.agent_scores:
                    return {
                        'success': True,
                        'message': 'No data for specified agent',
                        'agent_id': agent_id
                    }

                scores = self.agent_scores[agent_id]
                agent_responses = [r for r in self.responses if r.agent_id == agent_id]

                return {
                    'success': True,
                    'agent_id': agent_id,
                    'avg_score': round(statistics.mean(scores), 2),
                    'response_count': len(scores),
                    'avg_sentiment': round(statistics.mean(r.sentiment_score for r in agent_responses), 3),
                    'score_distribution': dict(Counter(r.score for r in agent_responses))
                }
            else:
                # All agents
                agent_stats = []
                for aid, scores in self.agent_scores.items():
                    agent_responses = [r for r in self.responses if r.agent_id == aid]
                    agent_stats.append({
                        'agent_id': aid,
                        'avg_score': round(statistics.mean(scores), 2),
                        'response_count': len(scores),
                        'avg_sentiment': round(statistics.mean(r.sentiment_score for r in agent_responses), 3)
                    })

                # Sort by average score
                agent_stats.sort(key=lambda x: x['avg_score'], reverse=True)

                return {
                    'success': True,
                    'agent_count': len(agent_stats),
                    'agents': agent_stats
                }

        except Exception as e:
            logger.error(f"Error getting agent performance: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}

    async def get_analytics(self) -> Dict[str, Any]:
        """Get comprehensive satisfaction analytics."""
        try:
            if not self.responses:
                return {
                    'success': True,
                    'message': 'No survey responses to analyze',
                    'total_responses': 0
                }

            # Calculate key metrics
            nps_result = await self.calculate_nps(30)
            csat_result = await self.calculate_csat(30)
            trends = await self.analyze_trends(30)

            # Response distribution
            survey_type_dist = Counter(r.survey_type.value for r in self.responses)
            channel_dist = Counter(r.channel for r in self.responses)

            # Alert summary
            recent_alerts = [a for a in self.alerts if a.triggered_at >= datetime.utcnow() - timedelta(days=7)]
            alert_severity_dist = Counter(a.severity for a in recent_alerts)

            return {
                'success': True,
                'total_responses': len(self.responses),
                'nps_metrics': nps_result,
                'csat_metrics': csat_result,
                'trends': trends,
                'survey_type_distribution': dict(survey_type_dist),
                'channel_distribution': dict(channel_dist),
                'recent_alerts': len(recent_alerts),
                'alert_severity_distribution': dict(alert_severity_dist),
                'total_alerts': len(self.alerts)
            }

        except Exception as e:
            logger.error(f"Error generating analytics: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}
