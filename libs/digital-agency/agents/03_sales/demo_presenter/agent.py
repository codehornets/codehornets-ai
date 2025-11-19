"""
Demo Presenter Agent

Delivers customized product demonstrations aligned with client needs.
Implements engagement tracking, scenario building, and analytics.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
from collections import defaultdict

logger = logging.getLogger(__name__)


class DemoType(Enum):
    """Demo presentation types."""
    DISCOVERY_DEMO = "discovery_demo"
    TECHNICAL_DEMO = "technical_demo"
    EXECUTIVE_DEMO = "executive_demo"
    POC_DEMO = "poc_demo"
    CUSTOM_DEMO = "custom_demo"


class IndustryVertical(Enum):
    """Industry verticals for demo customization."""
    SAAS = "saas"
    ECOMMERCE = "ecommerce"
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    TECHNOLOGY = "technology"
    EDUCATION = "education"


class InteractionType(Enum):
    """Types of demo interactions."""
    QUESTION = "question"
    OBJECTION = "objection"
    POSITIVE_REACTION = "positive_reaction"
    FEATURE_REQUEST = "feature_request"
    CONCERN = "concern"
    COMPARISON = "comparison"


@dataclass
class DemoScenario:
    """Demo scenario configuration."""
    scenario_id: str
    scenario_name: str
    industry: IndustryVertical
    use_case: str
    pain_points_addressed: List[str] = field(default_factory=list)
    features_showcased: List[str] = field(default_factory=list)
    duration_minutes: int = 15
    complexity_level: str = "medium"  # low, medium, high
    success_metrics: List[str] = field(default_factory=list)
    competitive_differentiators: List[str] = field(default_factory=list)


@dataclass
class EngagementMetrics:
    """Demo engagement metrics."""
    demo_id: str
    attendees_count: int
    questions_asked: int
    interaction_rate: float  # interactions per minute
    time_on_features: Dict[str, int] = field(default_factory=dict)  # feature -> seconds
    attention_score: int = 0  # 0-100
    sentiment_score: int = 0  # -100 to 100
    feature_interest_scores: Dict[str, int] = field(default_factory=dict)


@dataclass
class DemoSession:
    """Complete demo session record."""
    session_id: str
    lead_id: str
    demo_type: DemoType
    scheduled_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_minutes: int
    scenarios_presented: List[DemoScenario] = field(default_factory=list)
    attendees: List[Dict[str, Any]] = field(default_factory=list)
    interactions: List[Dict[str, Any]] = field(default_factory=list)
    engagement_metrics: Optional[EngagementMetrics] = None
    objections_raised: List[str] = field(default_factory=list)
    next_steps: List[str] = field(default_factory=list)
    success_stories_shared: List[str] = field(default_factory=list)
    follow_up_scheduled: bool = False


class DemoPresenterAgent:
    """
    Production-grade Demo Presenter Agent.

    Delivers highly customized product demonstrations with real-time
    engagement tracking, scenario building, competitive positioning,
    and comprehensive analytics.

    Features:
    - Industry-specific demo scenario generation
    - Real-time engagement scoring
    - Screen sharing analytics and heatmaps
    - Question/objection tracking during demos
    - Competitive differentiation highlighting
    - Success story matching (industry, size, use case)
    - Automated follow-up sequence generation
    - Feature usage analytics
    - Sentiment analysis during presentation
    - ROI calculator integration
    - Interactive Q&A management
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Demo Presenter Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.name = "Demo Presenter"
        self.role = "Product Demo Specialist"
        self.goal = "Showcase solutions that address client needs effectively"

        # Demo configuration
        self.default_demo_duration = self.config.get("default_demo_duration", 45)
        self.max_scenarios_per_demo = self.config.get("max_scenarios", 3)
        self.engagement_threshold = self.config.get("engagement_threshold", 60)

        # Storage
        self.demo_sessions: Dict[str, DemoSession] = {}
        self.scenario_library: Dict[str, DemoScenario] = {}
        self.success_stories: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.competitive_battlecards: Dict[str, Dict[str, Any]] = {}

        # Initialize libraries
        self._initialize_scenario_library()
        self._initialize_success_stories()
        self._initialize_competitive_battlecards()

        # Analytics
        self.feature_engagement_history: Dict[str, List[int]] = defaultdict(list)
        self.demo_performance_history: List[Dict[str, Any]] = []

        logger.info("Demo Presenter initialized")

    def prepare_demo(
        self, lead_id: str, requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare customized demo based on client requirements.

        Args:
            lead_id: Lead identifier
            requirements: Client requirements from discovery

        Returns:
            Demo preparation results
        """
        try:
            logger.info(f"Starting demo preparation for lead {lead_id}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not requirements:
                raise ValueError("requirements cannot be empty")
            if not isinstance(requirements, dict):
                raise ValueError("requirements must be a dictionary")

            # Extract key information
            industry = requirements.get("industry", "technology")
            pain_points = requirements.get("pain_points", [])
            company_size = requirements.get("company_size", 0)
            use_case = requirements.get("primary_use_case", "general")
            attendees = requirements.get("attendees", [])

            # Build custom scenarios
            scenarios = self.build_demo_scenarios(
                industry=industry,
                pain_points=pain_points,
                use_case=use_case,
                company_size=company_size
            )

            # Select relevant success stories
            success_stories = self.match_success_stories(
                industry=industry,
                company_size=company_size,
                use_case=use_case
            )

            # Identify competitive differentiators
            differentiators = self._identify_differentiators(
                requirements.get("competitors_mentioned", [])
            )

            # Generate demo script
            demo_script = self._generate_demo_script(
                scenarios=scenarios,
                pain_points=pain_points,
                attendees=attendees
            )

            # Prepare Q&A response bank
            qa_bank = self._prepare_qa_bank(
                industry=industry,
                pain_points=pain_points
            )

            # Create demo session
            demo_type = self._determine_demo_type(attendees)
            session = DemoSession(
                session_id=f"demo_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                lead_id=lead_id,
                demo_type=demo_type,
                scheduled_at=datetime.utcnow() + timedelta(hours=24),
                started_at=None,
                completed_at=None,
                duration_minutes=self.default_demo_duration,
                scenarios_presented=scenarios,
                attendees=attendees,
                success_stories_shared=[s["id"] for s in success_stories]
            )

            self.demo_sessions[session.session_id] = session

            result = {
                "success": True,
                "lead_id": lead_id,
                "session_id": session.session_id,
                "demo_prepared": True,
                "scenarios": [
                    {
                        "name": s.scenario_name,
                        "duration": s.duration_minutes,
                        "features": s.features_showcased,
                        "pain_points": s.pain_points_addressed
                    }
                    for s in scenarios
                ],
                "demo_script": demo_script,
                "success_stories": success_stories,
                "competitive_differentiators": differentiators,
                "qa_preparation": qa_bank,
                "estimated_duration": sum(s.duration_minutes for s in scenarios),
                "pre_demo_checklist": self._generate_pre_demo_checklist(),
                "timestamp": datetime.utcnow().isoformat(),
            }

            logger.info(f"Demo preparation completed for lead {lead_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in prepare_demo: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in prepare_demo: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def deliver_demo(
        self, session_id: str, demo_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deliver the product demonstration with real-time tracking.

        Args:
            session_id: Demo session identifier
            demo_data: Demo execution data and interactions

        Returns:
            Demo delivery results with engagement metrics
        """
        try:
            logger.info(f"Starting demo delivery for session {session_id}")

            # Validate inputs
            if not session_id:
                raise ValueError("session_id is required")
            if not demo_data:
                raise ValueError("demo_data cannot be empty")
            if not isinstance(demo_data, dict):
                raise ValueError("demo_data must be a dictionary")

            # Get session
            if session_id not in self.demo_sessions:
                raise ValueError(f"Demo session {session_id} not found")

            session = self.demo_sessions[session_id]

            # Update session timing
            session.started_at = datetime.utcnow()

            # Track interactions during demo
            interactions = demo_data.get("interactions", [])
            for interaction in interactions:
                self._track_interaction(session, interaction)

            # Calculate engagement metrics
            engagement_metrics = self.calculate_engagement_score(
                session_id=session_id,
                interactions=interactions,
                attendees_count=len(session.attendees),
                duration_minutes=demo_data.get("duration_minutes", session.duration_minutes)
            )

            session.engagement_metrics = engagement_metrics

            # Analyze feature usage
            feature_analytics = self._analyze_feature_usage(
                demo_data.get("screen_activity", {}),
                demo_data.get("feature_interactions", [])
            )

            # Generate heatmap data
            heatmap_data = self._generate_engagement_heatmap(
                interactions=interactions,
                duration=demo_data.get("duration_minutes", 45)
            )

            # Extract questions and objections
            questions = [i for i in interactions if i.get("type") == "question"]
            objections = [i for i in interactions if i.get("type") == "objection"]
            session.objections_raised = [o.get("content", "") for o in objections]

            # Assess demo success
            success_assessment = self._assess_demo_success(
                engagement_metrics=engagement_metrics,
                objections=objections,
                questions=questions
            )

            # Complete session
            session.completed_at = datetime.utcnow()

            # Generate recommendations
            recommendations = self._generate_post_demo_recommendations(
                session=session,
                success_assessment=success_assessment
            )

            result = {
                "success": True,
                "session_id": session_id,
                "lead_id": session.lead_id,
                "demo_delivered": True,
                "engagement_metrics": {
                    "overall_score": engagement_metrics.attention_score,
                    "questions_asked": engagement_metrics.questions_asked,
                    "interaction_rate": engagement_metrics.interaction_rate,
                    "sentiment_score": engagement_metrics.sentiment_score,
                    "attention_score": engagement_metrics.attention_score
                },
                "feature_analytics": feature_analytics,
                "engagement_heatmap": heatmap_data,
                "questions_summary": {
                    "total": len(questions),
                    "categories": self._categorize_questions(questions)
                },
                "objections_summary": {
                    "total": len(objections),
                    "types": self._categorize_objections(objections)
                },
                "success_assessment": success_assessment,
                "recommendations": recommendations,
                "next_steps": self._determine_next_steps(success_assessment),
                "timestamp": datetime.utcnow().isoformat()
            }

            # Store performance history
            self._record_demo_performance(session, success_assessment)

            logger.info(f"Demo delivery completed for session {session_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in deliver_demo: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in deliver_demo: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def build_demo_scenarios(
        self,
        industry: str,
        pain_points: List[str],
        use_case: str,
        company_size: int
    ) -> List[DemoScenario]:
        """
        Build industry-specific demo scenarios.

        Args:
            industry: Target industry
            pain_points: Client pain points
            use_case: Primary use case
            company_size: Company size for context

        Returns:
            List of customized demo scenarios
        """
        try:
            scenarios = []

            # Get industry-specific scenarios from library
            industry_scenarios = [
                s for s in self.scenario_library.values()
                if s.industry.value == industry.lower()
            ]

            # Match scenarios to pain points
            for scenario in industry_scenarios[:self.max_scenarios_per_demo]:
                # Calculate scenario relevance
                relevance_score = self._calculate_scenario_relevance(
                    scenario=scenario,
                    pain_points=pain_points,
                    use_case=use_case
                )

                if relevance_score > 0.5:
                    scenarios.append(scenario)

            # If no matches, use default scenarios
            if not scenarios:
                scenarios = self._get_default_scenarios(use_case)

            # Adjust complexity based on company size
            for scenario in scenarios:
                if company_size > 1000:
                    scenario.complexity_level = "high"
                elif company_size > 100:
                    scenario.complexity_level = "medium"
                else:
                    scenario.complexity_level = "low"

            logger.info(f"Built {len(scenarios)} demo scenarios for {industry}")
            return scenarios

        except Exception as e:
            logger.error(f"Error building demo scenarios: {e}", exc_info=True)
            return self._get_default_scenarios("general")

    def calculate_engagement_score(
        self,
        session_id: str,
        interactions: List[Dict[str, Any]],
        attendees_count: int,
        duration_minutes: int
    ) -> EngagementMetrics:
        """
        Calculate comprehensive engagement score.

        Args:
            session_id: Demo session ID
            interactions: List of interactions during demo
            attendees_count: Number of attendees
            duration_minutes: Demo duration

        Returns:
            Engagement metrics
        """
        try:
            questions_asked = len([i for i in interactions if i.get("type") == "question"])
            interaction_rate = len(interactions) / duration_minutes if duration_minutes > 0 else 0

            # Calculate attention score (0-100)
            attention_score = 50  # Base score

            # Interaction frequency bonus (0-30 points)
            if interaction_rate >= 1.0:  # 1+ interaction per minute
                attention_score += 30
            elif interaction_rate >= 0.5:
                attention_score += 20
            elif interaction_rate >= 0.25:
                attention_score += 10

            # Questions asked bonus (0-20 points)
            questions_per_attendee = questions_asked / attendees_count if attendees_count > 0 else 0
            if questions_per_attendee >= 2:
                attention_score += 20
            elif questions_per_attendee >= 1:
                attention_score += 15
            elif questions_per_attendee >= 0.5:
                attention_score += 10

            # Calculate sentiment score
            sentiment_score = self._calculate_sentiment_score(interactions)

            # Analyze time on features
            time_on_features = self._extract_time_on_features(interactions)

            # Calculate feature interest scores
            feature_interest = self._calculate_feature_interest(interactions)

            metrics = EngagementMetrics(
                demo_id=session_id,
                attendees_count=attendees_count,
                questions_asked=questions_asked,
                interaction_rate=round(interaction_rate, 2),
                time_on_features=time_on_features,
                attention_score=min(attention_score, 100),
                sentiment_score=sentiment_score,
                feature_interest_scores=feature_interest
            )

            logger.info(f"Calculated engagement score: {metrics.attention_score}")
            return metrics

        except Exception as e:
            logger.error(f"Error calculating engagement score: {e}", exc_info=True)
            return EngagementMetrics(
                demo_id=session_id,
                attendees_count=attendees_count,
                questions_asked=0,
                interaction_rate=0.0
            )

    def match_success_stories(
        self,
        industry: str,
        company_size: int,
        use_case: str
    ) -> List[Dict[str, Any]]:
        """
        Match relevant success stories to demo context.

        Args:
            industry: Target industry
            company_size: Company size
            use_case: Primary use case

        Returns:
            List of matched success stories
        """
        try:
            matched_stories = []

            # Get industry-specific success stories
            industry_stories = self.success_stories.get(industry.lower(), [])

            for story in industry_stories:
                match_score = 0

                # Industry match (automatic)
                match_score += 40

                # Size match (0-30 points)
                story_size = story.get("company_size", 0)
                size_diff = abs(company_size - story_size)
                if size_diff < company_size * 0.2:  # Within 20%
                    match_score += 30
                elif size_diff < company_size * 0.5:  # Within 50%
                    match_score += 20
                elif size_diff < company_size:
                    match_score += 10

                # Use case match (0-30 points)
                if use_case.lower() in story.get("use_cases", []):
                    match_score += 30
                elif any(uc in story.get("use_cases", []) for uc in ["general", "multi_purpose"]):
                    match_score += 15

                story["match_score"] = match_score
                if match_score >= 50:  # Threshold for inclusion
                    matched_stories.append(story)

            # Sort by match score
            matched_stories.sort(key=lambda x: x["match_score"], reverse=True)

            logger.info(f"Matched {len(matched_stories)} success stories")
            return matched_stories[:3]  # Top 3 matches

        except Exception as e:
            logger.error(f"Error matching success stories: {e}", exc_info=True)
            return []

    def collect_feedback(self, session_id: str, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect feedback during and after demo.

        Args:
            session_id: Demo session identifier
            feedback_data: Feedback data from attendees

        Returns:
            Collected feedback analysis
        """
        try:
            logger.info(f"Starting feedback collection for session {session_id}")

            # Validate inputs
            if not session_id:
                raise ValueError("session_id is required")
            if session_id not in self.demo_sessions:
                raise ValueError(f"Session {session_id} not found")

            session = self.demo_sessions[session_id]

            # Extract feedback components
            overall_rating = feedback_data.get("overall_rating", 0)
            feature_ratings = feedback_data.get("feature_ratings", {})
            concerns = feedback_data.get("concerns", [])
            positive_feedback = feedback_data.get("positive_feedback", [])
            improvement_suggestions = feedback_data.get("improvements", [])

            # Analyze feedback sentiment
            sentiment_analysis = {
                "overall_sentiment": "positive" if overall_rating >= 4 else "neutral" if overall_rating >= 3 else "negative",
                "concern_severity": self._assess_concern_severity(concerns),
                "feature_satisfaction": self._analyze_feature_satisfaction(feature_ratings),
                "net_promoter_score": feedback_data.get("nps_score", 0)
            }

            # Identify action items
            action_items = self._generate_feedback_action_items(
                concerns=concerns,
                improvements=improvement_suggestions,
                feature_ratings=feature_ratings
            )

            result = {
                "success": True,
                "session_id": session_id,
                "lead_id": session.lead_id,
                "feedback_collected": True,
                "overall_rating": overall_rating,
                "sentiment_analysis": sentiment_analysis,
                "concerns": concerns,
                "positive_feedback": positive_feedback,
                "feature_ratings": feature_ratings,
                "action_items": action_items,
                "follow_up_required": len(concerns) > 0 or overall_rating < 4,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Feedback collection completed for session {session_id}")
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

    def generate_follow_up_sequence(
        self, session_id: str, demo_outcome: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate automated follow-up sequence based on demo outcome.

        Args:
            session_id: Demo session identifier
            demo_outcome: Demo results and engagement data

        Returns:
            Follow-up sequence configuration
        """
        try:
            if not session_id or session_id not in self.demo_sessions:
                raise ValueError("Invalid session_id")

            session = self.demo_sessions[session_id]
            engagement_score = demo_outcome.get("engagement_score", 0)

            # Determine sequence type based on engagement
            if engagement_score >= 80:
                sequence_type = "hot_lead"
                timeline = [0, 1, 3]  # Same day, next day, 3 days
            elif engagement_score >= 60:
                sequence_type = "warm_lead"
                timeline = [0, 2, 5, 10]  # Days
            else:
                sequence_type = "cold_lead"
                timeline = [1, 7, 14, 30]  # Days

            # Build sequence emails
            emails = []
            for i, day_offset in enumerate(timeline):
                email = {
                    "sequence_step": i + 1,
                    "delay_days": day_offset,
                    "subject": self._generate_email_subject(sequence_type, i + 1, session),
                    "content": self._generate_email_content(sequence_type, i + 1, session, demo_outcome),
                    "includes_resources": i == 0,  # First email includes resources
                    "call_to_action": self._generate_cta(sequence_type, i + 1)
                }
                emails.append(email)

            # Add resources to first email
            resources = self._compile_demo_resources(
                features_shown=demo_outcome.get("features_shown", []),
                questions_asked=[i for i in session.interactions if i.get("type") == "question"]
            )

            result = {
                "success": True,
                "session_id": session_id,
                "sequence_type": sequence_type,
                "total_emails": len(emails),
                "timeline_days": timeline,
                "emails": emails,
                "resources_included": resources,
                "next_step_recommendation": self._get_next_step_recommendation(engagement_score),
                "auto_schedule_call": engagement_score >= 70
            }

            return result

        except Exception as e:
            logger.error(f"Error generating follow-up sequence: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def analyze_demo_performance(self, time_period_days: int = 30) -> Dict[str, Any]:
        """
        Analyze demo performance across multiple sessions.

        Args:
            time_period_days: Number of days to analyze

        Returns:
            Performance analytics report
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)

            # Filter recent demos
            recent_demos = [
                session for session in self.demo_sessions.values()
                if session.started_at and session.started_at >= cutoff_date
            ]

            if not recent_demos:
                return {
                    "success": True,
                    "message": "No demos in specified time period",
                    "demos_analyzed": 0
                }

            # Calculate aggregate metrics
            total_demos = len(recent_demos)
            avg_engagement = sum(
                s.engagement_metrics.attention_score for s in recent_demos
                if s.engagement_metrics
            ) / total_demos

            # Feature performance
            feature_performance = defaultdict(lambda: {"views": 0, "avg_interest": 0})
            for session in recent_demos:
                if session.engagement_metrics:
                    for feature, score in session.engagement_metrics.feature_interest_scores.items():
                        feature_performance[feature]["views"] += 1
                        feature_performance[feature]["avg_interest"] += score

            for feature in feature_performance:
                views = feature_performance[feature]["views"]
                feature_performance[feature]["avg_interest"] /= views

            # Conversion correlation
            conversion_by_engagement = {
                "high_engagement": {"count": 0, "converted": 0},
                "medium_engagement": {"count": 0, "converted": 0},
                "low_engagement": {"count": 0, "converted": 0}
            }

            # Common objections
            all_objections = []
            for session in recent_demos:
                all_objections.extend(session.objections_raised)

            objection_frequency = defaultdict(int)
            for objection in all_objections:
                objection_frequency[objection] += 1

            report = {
                "success": True,
                "period_days": time_period_days,
                "total_demos": total_demos,
                "average_engagement_score": round(avg_engagement, 1),
                "feature_performance": dict(feature_performance),
                "top_performing_features": sorted(
                    feature_performance.items(),
                    key=lambda x: x[1]["avg_interest"],
                    reverse=True
                )[:5],
                "common_objections": sorted(
                    objection_frequency.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:5],
                "conversion_correlation": conversion_by_engagement,
                "recommendations": self._generate_performance_recommendations(
                    avg_engagement, feature_performance, objection_frequency
                )
            }

            return report

        except Exception as e:
            logger.error(f"Error analyzing demo performance: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # Helper methods

    def _initialize_scenario_library(self) -> None:
        """Initialize library of demo scenarios."""
        scenarios = [
            DemoScenario(
                scenario_id="saas_onboarding",
                scenario_name="Customer Onboarding Automation",
                industry=IndustryVertical.SAAS,
                use_case="customer_success",
                pain_points_addressed=["Manual onboarding", "Time to value"],
                features_showcased=["Automated workflows", "Templates", "Analytics"],
                duration_minutes=15,
                competitive_differentiators=["AI-powered personalization", "Sub-hour setup"]
            ),
            DemoScenario(
                scenario_id="ecommerce_conversion",
                scenario_name="Conversion Rate Optimization",
                industry=IndustryVertical.ECOMMERCE,
                use_case="sales_optimization",
                pain_points_addressed=["Cart abandonment", "Low conversion"],
                features_showcased=["Smart recommendations", "A/B testing", "Personalization"],
                duration_minutes=20
            ),
            DemoScenario(
                scenario_id="finance_compliance",
                scenario_name="Regulatory Compliance Automation",
                industry=IndustryVertical.FINANCE,
                use_case="compliance",
                pain_points_addressed=["Manual compliance", "Audit risks"],
                features_showcased=["Auto-compliance", "Audit trail", "Reporting"],
                duration_minutes=25
            )
        ]

        for scenario in scenarios:
            self.scenario_library[scenario.scenario_id] = scenario

    def _initialize_success_stories(self) -> None:
        """Initialize success story database."""
        stories = {
            "saas": [
                {
                    "id": "story_saas_001",
                    "company_name": "TechFlow Inc",
                    "company_size": 250,
                    "industry": "saas",
                    "use_cases": ["customer_success", "onboarding"],
                    "results": "Reduced onboarding time by 60%, increased activation by 40%",
                    "quote": "Game changer for our customer success team"
                }
            ],
            "ecommerce": [
                {
                    "id": "story_ecom_001",
                    "company_name": "ShopFast",
                    "company_size": 150,
                    "industry": "ecommerce",
                    "use_cases": ["sales_optimization", "conversion"],
                    "results": "Increased conversion rate by 35%, average order value up 25%",
                    "quote": "ROI achieved in first month"
                }
            ]
        }

        for industry, story_list in stories.items():
            self.success_stories[industry].extend(story_list)

    def _initialize_competitive_battlecards(self) -> None:
        """Initialize competitive battle cards."""
        self.competitive_battlecards = {
            "competitor_a": {
                "name": "Competitor A",
                "strengths": ["Market leader", "Enterprise features"],
                "weaknesses": ["Complex setup", "High cost", "Poor support"],
                "our_differentiators": ["Faster implementation", "Better pricing", "24/7 support"]
            },
            "competitor_b": {
                "name": "Competitor B",
                "strengths": ["Low price", "Simple UI"],
                "weaknesses": ["Limited features", "No integrations", "Scalability issues"],
                "our_differentiators": ["Full feature set", "100+ integrations", "Enterprise scale"]
            }
        }

    def _identify_differentiators(self, competitors: List[str]) -> List[str]:
        """Identify competitive differentiators."""
        differentiators = []
        for competitor in competitors:
            battlecard = self.competitive_battlecards.get(competitor.lower().replace(" ", "_"), {})
            differentiators.extend(battlecard.get("our_differentiators", []))
        return list(set(differentiators))[:5]

    def _generate_demo_script(
        self,
        scenarios: List[DemoScenario],
        pain_points: List[str],
        attendees: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate demo script outline."""
        return {
            "opening": "Thank you for joining. Today we'll show you how we solve [pain_points]",
            "agenda": [s.scenario_name for s in scenarios],
            "key_talking_points": pain_points[:3],
            "closing": "Next steps and Q&A",
            "estimated_duration": sum(s.duration_minutes for s in scenarios)
        }

    def _prepare_qa_bank(self, industry: str, pain_points: List[str]) -> Dict[str, str]:
        """Prepare Q&A response bank."""
        return {
            "pricing": "Our pricing is based on usage and scales with your needs...",
            "implementation": "Typical implementation takes 2-4 weeks with our team...",
            "integrations": "We integrate with 100+ popular tools including...",
            "support": "24/7 support via chat, email, and phone..."
        }

    def _generate_pre_demo_checklist(self) -> List[str]:
        """Generate pre-demo checklist."""
        return [
            "Test demo environment",
            "Prepare scenario data",
            "Review attendee profiles",
            "Load success stories",
            "Test screen sharing",
            "Prepare backup scenarios"
        ]

    def _determine_demo_type(self, attendees: List[Dict[str, Any]]) -> DemoType:
        """Determine appropriate demo type."""
        if any(a.get("role", "").lower() in ["ceo", "cto", "cfo"] for a in attendees):
            return DemoType.EXECUTIVE_DEMO
        elif any("engineer" in a.get("role", "").lower() for a in attendees):
            return DemoType.TECHNICAL_DEMO
        else:
            return DemoType.DISCOVERY_DEMO

    def _track_interaction(self, session: DemoSession, interaction: Dict[str, Any]) -> None:
        """Track interaction during demo."""
        session.interactions.append({
            "timestamp": datetime.utcnow().isoformat(),
            "type": interaction.get("type"),
            "content": interaction.get("content"),
            "attendee": interaction.get("attendee")
        })

    def _analyze_feature_usage(
        self,
        screen_activity: Dict[str, Any],
        feature_interactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze feature usage during demo."""
        feature_time = defaultdict(int)
        for interaction in feature_interactions:
            feature = interaction.get("feature", "unknown")
            duration = interaction.get("duration_seconds", 0)
            feature_time[feature] += duration

        return {
            "total_features_shown": len(feature_time),
            "time_per_feature": dict(feature_time),
            "most_time_spent": max(feature_time.items(), key=lambda x: x[1])[0] if feature_time else None
        }

    def _generate_engagement_heatmap(
        self,
        interactions: List[Dict[str, Any]],
        duration: int
    ) -> Dict[str, Any]:
        """Generate engagement heatmap data."""
        # Divide demo into 5-minute segments
        segments = duration // 5
        segment_interactions = [0] * segments

        for interaction in interactions:
            # Simplified - would use actual timestamps
            segment = min(len(segment_interactions) - 1, len(segment_interactions) // 2)
            segment_interactions[segment] += 1

        return {
            "segments": segments,
            "interactions_per_segment": segment_interactions,
            "peak_engagement_segment": segment_interactions.index(max(segment_interactions)) if segment_interactions else 0
        }

    def _categorize_questions(self, questions: List[Dict[str, Any]]) -> Dict[str, int]:
        """Categorize questions by topic."""
        categories = defaultdict(int)
        for q in questions:
            content = q.get("content", "").lower()
            if "price" in content or "cost" in content:
                categories["pricing"] += 1
            elif "integrate" in content or "api" in content:
                categories["integration"] += 1
            elif "implement" in content or "setup" in content:
                categories["implementation"] += 1
            else:
                categories["general"] += 1
        return dict(categories)

    def _categorize_objections(self, objections: List[Dict[str, Any]]) -> Dict[str, int]:
        """Categorize objections by type."""
        categories = defaultdict(int)
        for obj in objections:
            content = obj.get("content", "").lower()
            if "price" in content or "expensive" in content:
                categories["pricing"] += 1
            elif "complex" in content or "difficult" in content:
                categories["complexity"] += 1
            elif "time" in content:
                categories["timeline"] += 1
            else:
                categories["other"] += 1
        return dict(categories)

    def _assess_demo_success(
        self,
        engagement_metrics: EngagementMetrics,
        objections: List[Dict[str, Any]],
        questions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Assess overall demo success."""
        success_score = engagement_metrics.attention_score

        # Penalize for unresolved objections
        if len(objections) > 3:
            success_score -= 10

        # Bonus for high question rate
        if engagement_metrics.questions_asked >= engagement_metrics.attendees_count * 2:
            success_score += 10

        return {
            "overall_score": min(max(success_score, 0), 100),
            "success_level": "high" if success_score >= 75 else "medium" if success_score >= 50 else "low",
            "key_positives": ["High engagement", "Good questions"] if success_score >= 75 else [],
            "areas_for_improvement": ["Address objections better"] if len(objections) > 2 else []
        }

    def _generate_post_demo_recommendations(
        self,
        session: DemoSession,
        success_assessment: Dict[str, Any]
    ) -> List[str]:
        """Generate post-demo recommendations."""
        recommendations = []

        if success_assessment["success_level"] == "high":
            recommendations.append("Schedule proposal meeting within 48 hours")
            recommendations.append("Send executive summary and ROI calculator")
        elif success_assessment["success_level"] == "medium":
            recommendations.append("Address remaining questions via email")
            recommendations.append("Schedule technical deep-dive if needed")
        else:
            recommendations.append("Re-assess fit and qualification")
            recommendations.append("Consider different approach or use case")

        return recommendations

    def _determine_next_steps(self, success_assessment: Dict[str, Any]) -> List[str]:
        """Determine next steps based on demo outcome."""
        if success_assessment["success_level"] == "high":
            return ["Send proposal", "Schedule decision call", "Prepare contract"]
        elif success_assessment["success_level"] == "medium":
            return ["Follow up on questions", "Share additional resources", "Schedule check-in"]
        else:
            return ["Nurture sequence", "Re-qualify", "Share case studies"]

    def _record_demo_performance(self, session: DemoSession, success_assessment: Dict[str, Any]) -> None:
        """Record demo performance for analytics."""
        self.demo_performance_history.append({
            "session_id": session.session_id,
            "date": session.completed_at.isoformat() if session.completed_at else "",
            "success_score": success_assessment["overall_score"],
            "engagement_score": session.engagement_metrics.attention_score if session.engagement_metrics else 0
        })

    def _calculate_scenario_relevance(
        self,
        scenario: DemoScenario,
        pain_points: List[str],
        use_case: str
    ) -> float:
        """Calculate how relevant a scenario is to client needs."""
        relevance = 0.0

        # Pain point match
        matching_pains = sum(1 for p in pain_points if p in scenario.pain_points_addressed)
        relevance += (matching_pains / max(len(pain_points), 1)) * 0.6

        # Use case match
        if use_case.lower() in scenario.use_case.lower():
            relevance += 0.4

        return relevance

    def _get_default_scenarios(self, use_case: str) -> List[DemoScenario]:
        """Get default scenarios when no specific match."""
        return list(self.scenario_library.values())[:2]

    def _calculate_sentiment_score(self, interactions: List[Dict[str, Any]]) -> int:
        """Calculate sentiment score from interactions."""
        positive = sum(1 for i in interactions if i.get("type") == "positive_reaction")
        negative = sum(1 for i in interactions if i.get("type") in ["objection", "concern"])
        total = len(interactions) if interactions else 1

        return int(((positive - negative) / total) * 100)

    def _extract_time_on_features(self, interactions: List[Dict[str, Any]]) -> Dict[str, int]:
        """Extract time spent on each feature."""
        time_map = {}
        for interaction in interactions:
            if "feature" in interaction and "duration" in interaction:
                feature = interaction["feature"]
                time_map[feature] = time_map.get(feature, 0) + interaction["duration"]
        return time_map

    def _calculate_feature_interest(self, interactions: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate interest score for each feature."""
        interest = defaultdict(int)
        for interaction in interactions:
            feature = interaction.get("feature")
            if feature:
                if interaction.get("type") == "question":
                    interest[feature] += 10
                elif interaction.get("type") == "positive_reaction":
                    interest[feature] += 5
        return dict(interest)

    def _assess_concern_severity(self, concerns: List[str]) -> str:
        """Assess severity of concerns."""
        if len(concerns) >= 3:
            return "high"
        elif len(concerns) >= 1:
            return "medium"
        return "low"

    def _analyze_feature_satisfaction(self, feature_ratings: Dict[str, int]) -> Dict[str, Any]:
        """Analyze feature satisfaction ratings."""
        if not feature_ratings:
            return {"average": 0, "top_rated": [], "needs_improvement": []}

        avg_rating = sum(feature_ratings.values()) / len(feature_ratings)
        top_rated = [f for f, r in feature_ratings.items() if r >= 4]
        needs_improvement = [f for f, r in feature_ratings.items() if r < 3]

        return {
            "average": round(avg_rating, 1),
            "top_rated": top_rated,
            "needs_improvement": needs_improvement
        }

    def _generate_feedback_action_items(
        self,
        concerns: List[str],
        improvements: List[str],
        feature_ratings: Dict[str, int]
    ) -> List[str]:
        """Generate action items from feedback."""
        actions = []

        if concerns:
            actions.append(f"Address {len(concerns)} concerns raised")

        low_rated = [f for f, r in feature_ratings.items() if r < 3]
        if low_rated:
            actions.append(f"Follow up on features needing improvement: {', '.join(low_rated[:2])}")

        return actions

    def _generate_email_subject(self, sequence_type: str, step: int, session: DemoSession) -> str:
        """Generate email subject for follow-up."""
        subjects = {
            "hot_lead": {
                1: "Great demo today - Next steps",
                2: "Your custom proposal is ready",
                3: "Let's finalize the details"
            },
            "warm_lead": {
                1: "Thanks for attending the demo",
                2: "Additional resources from our demo",
                3: "Checking in - any questions?",
                4: "Would you like to schedule a follow-up?"
            }
        }
        return subjects.get(sequence_type, {}).get(step, "Following up on our demo")

    def _generate_email_content(
        self,
        sequence_type: str,
        step: int,
        session: DemoSession,
        demo_outcome: Dict[str, Any]
    ) -> str:
        """Generate email content for follow-up."""
        return f"Thank you for attending our demo. Based on our conversation about {', '.join(session.scenarios_presented[0].pain_points_addressed[:2])}, we believe our solution can help..."

    def _generate_cta(self, sequence_type: str, step: int) -> str:
        """Generate call-to-action."""
        if sequence_type == "hot_lead":
            return "Schedule a call to finalize details"
        return "Reply with questions or schedule a follow-up"

    def _compile_demo_resources(
        self,
        features_shown: List[str],
        questions_asked: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Compile relevant resources to share."""
        return [
            {"type": "case_study", "title": "Similar customer success story"},
            {"type": "documentation", "title": "Feature guide"},
            {"type": "video", "title": "Product walkthrough"}
        ]

    def _get_next_step_recommendation(self, engagement_score: int) -> str:
        """Get next step recommendation."""
        if engagement_score >= 80:
            return "Schedule proposal meeting immediately"
        elif engagement_score >= 60:
            return "Send additional resources and schedule follow-up"
        else:
            return "Continue nurture sequence"

    def _generate_performance_recommendations(
        self,
        avg_engagement: float,
        feature_performance: Dict,
        objection_frequency: Dict
    ) -> List[str]:
        """Generate recommendations based on performance analysis."""
        recommendations = []

        if avg_engagement < 60:
            recommendations.append("Consider shorter, more focused demos")

        if objection_frequency:
            top_objection = max(objection_frequency.items(), key=lambda x: x[1])[0]
            recommendations.append(f"Proactively address common objection: {top_objection}")

        return recommendations
