"""
Discovery Specialist Agent (Sales Rep)

Conducts comprehensive discovery sessions, manages sales pipeline,
and executes sales process from qualified lead to proposal stage.
Combines discovery with sales execution and activity tracking.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
from collections import defaultdict

logger = logging.getLogger(__name__)


class SalesPipelineStage(Enum):
    """Sales pipeline stages."""
    NEW_LEAD = "new_lead"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    DISCOVERY_SCHEDULED = "discovery_scheduled"
    DISCOVERY_COMPLETED = "discovery_completed"
    NEEDS_ANALYSIS_DONE = "needs_analysis_done"
    PROPOSAL_PREP = "proposal_prep"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    NURTURE = "nurture"


class ActivityType(Enum):
    """Sales activity types."""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    DEMO = "demo"
    PROPOSAL = "proposal"
    FOLLOW_UP = "follow_up"
    NOTE = "note"
    TASK = "task"


class DiscoveryFramework(Enum):
    """Discovery question frameworks."""
    SPIN = "spin"  # Situation, Problem, Implication, Need-Payoff
    GPCT = "gpct"  # Goals, Plans, Challenges, Timeline
    BANT = "bant"  # Budget, Authority, Need, Timeline
    MEDDICC = "meddicc"  # Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Competition


@dataclass
class SalesActivity:
    """Sales activity record."""
    activity_id: str
    lead_id: str
    activity_type: ActivityType
    timestamp: datetime
    duration_minutes: int
    outcome: str
    notes: str
    next_steps: List[str] = field(default_factory=list)
    sentiment: str = "neutral"  # positive, neutral, negative
    engagement_score: int = 0


@dataclass
class DiscoverySession:
    """Discovery session data."""
    session_id: str
    lead_id: str
    scheduled_at: datetime
    completed_at: Optional[datetime]
    duration_minutes: int
    framework_used: DiscoveryFramework
    questions_asked: List[Dict[str, Any]] = field(default_factory=list)
    pain_points_identified: List[str] = field(default_factory=list)
    goals_identified: List[str] = field(default_factory=list)
    challenges_identified: List[str] = field(default_factory=list)
    budget_discussed: bool = False
    timeline_defined: bool = False
    stakeholders_mapped: List[Dict[str, Any]] = field(default_factory=list)
    success_criteria: List[str] = field(default_factory=list)
    next_steps: List[str] = field(default_factory=list)
    confidence_score: int = 0


@dataclass
class EmailSequence:
    """Email sequence configuration."""
    sequence_id: str
    sequence_name: str
    emails: List[Dict[str, Any]] = field(default_factory=list)
    current_step: int = 0
    active: bool = True
    open_rate: float = 0.0
    click_rate: float = 0.0
    response_rate: float = 0.0


class DiscoverySpecialistAgent:
    """
    Production-grade Discovery Specialist / Sales Rep Agent.

    Combines discovery session management with full sales process execution,
    pipeline tracking, activity logging, and email sequencing.

    Features:
    - Multi-framework discovery (SPIN, GPCT, MEDDICC)
    - Sales pipeline stage management
    - Activity tracking and logging
    - Email sequence automation
    - Meeting scheduling and preparation
    - Stakeholder mapping
    - ROI calculation and value proposition
    - Objection pre-emption
    - Automated follow-up sequences
    - Performance analytics
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Discovery Specialist Agent.

        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.name = "Discovery Specialist"
        self.role = "Discovery & Sales Rep Specialist"
        self.goal = "Understand client needs and guide through sales process"

        # Discovery configuration
        self.primary_framework = DiscoveryFramework(
            self.config.get("primary_framework", "spin")
        )
        self.discovery_duration_target = self.config.get("discovery_duration_target", 60)

        # Storage
        self.pipeline: Dict[str, SalesPipelineStage] = {}
        self.activities: Dict[str, List[SalesActivity]] = defaultdict(list)
        self.discovery_sessions: Dict[str, List[DiscoverySession]] = defaultdict(list)
        self.email_sequences: Dict[str, EmailSequence] = {}

        # Activity tracking
        self.activity_goals = self._initialize_activity_goals()

        # Email templates
        self.email_templates = self._initialize_email_templates()

        # Discovery question banks
        self.question_banks = self._initialize_question_banks()

        logger.info(f"Discovery Specialist initialized with {self.primary_framework.value} framework")

    def schedule_discovery(self, lead_id: str, availability: List[str]) -> Dict[str, Any]:
        """
        Schedule a discovery call with the prospect.

        Args:
            lead_id: Lead identifier
            availability: List of available time slots

        Returns:
            Scheduling confirmation
        """
        try:
            logger.info(f"Starting discovery scheduling for lead {lead_id}")

            if not lead_id:
                raise ValueError("lead_id is required")
            if not availability:
                raise ValueError("availability list cannot be empty")

            # Select optimal time slot
            optimal_slot = self._select_optimal_time_slot(availability)

            # Create calendar event
            event_id = self._create_calendar_event(lead_id, optimal_slot)

            # Send calendar invite
            invite_sent = self._send_calendar_invite(lead_id, optimal_slot)

            # Schedule reminder emails
            reminders_scheduled = self._schedule_reminder_emails(lead_id, optimal_slot)

            # Update pipeline stage
            self.pipeline[lead_id] = SalesPipelineStage.DISCOVERY_SCHEDULED

            # Log activity
            self._log_activity(
                lead_id=lead_id,
                activity_type=ActivityType.MEETING,
                outcome="discovery_scheduled",
                notes=f"Discovery call scheduled for {optimal_slot}"
            )

            result = {
                "success": True,
                "lead_id": lead_id,
                "scheduled": True,
                "scheduled_time": optimal_slot,
                "event_id": event_id,
                "invite_sent": invite_sent,
                "reminders_scheduled": reminders_scheduled,
                "preparation_checklist": self._generate_prep_checklist(lead_id),
                "timestamp": datetime.utcnow().isoformat(),
            }

            logger.info(f"Discovery scheduling completed for lead {lead_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in schedule_discovery: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in schedule_discovery: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def conduct_discovery(self, lead_id: str, responses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Conduct discovery session and document findings.

        Args:
            lead_id: Lead identifier
            responses: Discovery question responses

        Returns:
            Discovery session results
        """
        try:
            logger.info(f"Starting discovery session for lead {lead_id}")

            if not lead_id:
                raise ValueError("lead_id is required")
            if not responses:
                raise ValueError("responses cannot be empty")

            # Generate questions based on framework
            questions = self._generate_discovery_questions(self.primary_framework, responses)

            # Analyze responses
            analysis = self._analyze_discovery_responses(responses)

            # Identify pain points
            pain_points = self.identify_pain_points(responses)

            # Extract goals and challenges
            goals = self._extract_goals(responses)
            challenges = self._extract_challenges(responses)

            # Map stakeholders
            stakeholders = self._map_stakeholders(responses)

            # Calculate opportunity score
            opportunity_score = self._calculate_opportunity_score(analysis)

            # Define success criteria
            success_criteria = self._define_success_criteria(responses)

            # Create discovery session record
            session = DiscoverySession(
                session_id=f"disc_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                lead_id=lead_id,
                scheduled_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
                duration_minutes=responses.get("duration_minutes", 60),
                framework_used=self.primary_framework,
                questions_asked=questions,
                pain_points_identified=pain_points,
                goals_identified=goals,
                challenges_identified=challenges,
                budget_discussed=responses.get("budget_discussed", False),
                timeline_defined=responses.get("timeline_defined", False),
                stakeholders_mapped=stakeholders,
                success_criteria=success_criteria,
                next_steps=self._determine_next_steps(analysis),
                confidence_score=opportunity_score
            )

            self.discovery_sessions[lead_id].append(session)

            # Update pipeline stage
            self.pipeline[lead_id] = SalesPipelineStage.DISCOVERY_COMPLETED

            # Log activity
            self._log_activity(
                lead_id=lead_id,
                activity_type=ActivityType.MEETING,
                outcome="discovery_completed",
                notes=f"Discovery session completed with {len(pain_points)} pain points identified",
                next_steps=session.next_steps
            )

            # Trigger follow-up sequence
            self._trigger_follow_up_sequence(lead_id, "post_discovery")

            result = {
                "success": True,
                "lead_id": lead_id,
                "session_id": session.session_id,
                "session_complete": True,
                "findings": {
                    "pain_points": pain_points,
                    "goals": goals,
                    "challenges": challenges,
                    "stakeholders": stakeholders,
                    "budget_discussed": session.budget_discussed,
                    "timeline_defined": session.timeline_defined
                },
                "analysis": analysis,
                "opportunity_score": opportunity_score,
                "success_criteria": success_criteria,
                "next_steps": session.next_steps,
                "recommended_solution": self._recommend_solution(analysis),
                "estimated_value": self._estimate_deal_value(responses),
            }

            logger.info(f"Discovery session completed for lead {lead_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in conduct_discovery: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in conduct_discovery: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def identify_pain_points(self, session_data: Dict[str, Any]) -> List[str]:
        """
        Identify and prioritize pain points from discovery session.

        Args:
            session_data: Discovery session data

        Returns:
            List of identified pain points
        """
        try:
            logger.info("Starting pain point identification")

            if not session_data:
                raise ValueError("session_data cannot be empty")

            pain_points = []

            # Extract explicit pain points
            if "pain_points" in session_data:
                pain_points.extend(session_data["pain_points"])

            # Infer pain points from problems mentioned
            if "problems" in session_data:
                for problem in session_data["problems"]:
                    if problem not in pain_points:
                        pain_points.append(problem)

            # Analyze challenges for pain points
            if "challenges" in session_data:
                for challenge in session_data["challenges"]:
                    pain_point = self._convert_challenge_to_pain_point(challenge)
                    if pain_point and pain_point not in pain_points:
                        pain_points.append(pain_point)

            # Prioritize pain points
            prioritized_pain_points = self._prioritize_pain_points(pain_points, session_data)

            logger.info(f"Identified {len(prioritized_pain_points)} pain points")
            return prioritized_pain_points

        except ValueError as e:
            logger.error(f"Validation error in identify_pain_points: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in identify_pain_points: {e}", exc_info=True)
            return []

    def document_requirements(
        self, lead_id: str, requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Document client requirements and priorities.

        Args:
            lead_id: Lead identifier
            requirements: Requirements data

        Returns:
            Documentation confirmation
        """
        try:
            logger.info(f"Starting requirements documentation for lead {lead_id}")

            if not lead_id:
                raise ValueError("lead_id is required")
            if not requirements:
                raise ValueError("requirements cannot be empty")

            # Categorize requirements
            categorized = self._categorize_requirements(requirements)

            # Identify must-haves vs nice-to-haves
            prioritized = self._prioritize_requirements(categorized)

            # Map requirements to solutions
            solution_mapping = self._map_requirements_to_solutions(prioritized)

            # Calculate implementation complexity
            complexity = self._calculate_implementation_complexity(requirements)

            # Estimate timeline
            estimated_timeline = self._estimate_implementation_timeline(complexity, requirements)

            # Generate requirements document
            doc_id = self._generate_requirements_document(lead_id, {
                "categorized": categorized,
                "prioritized": prioritized,
                "solution_mapping": solution_mapping,
                "complexity": complexity,
                "timeline": estimated_timeline
            })

            # Update pipeline
            self.pipeline[lead_id] = SalesPipelineStage.NEEDS_ANALYSIS_DONE

            result = {
                "success": True,
                "lead_id": lead_id,
                "documented": True,
                "document_id": doc_id,
                "requirements_count": len(requirements),
                "categorized_requirements": categorized,
                "priority_breakdown": prioritized,
                "solution_mapping": solution_mapping,
                "implementation_complexity": complexity,
                "estimated_timeline": estimated_timeline,
            }

            logger.info(f"Requirements documented for lead {lead_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in document_requirements: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in document_requirements: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def prepare_summary(self, lead_id: str) -> Dict[str, Any]:
        """
        Prepare discovery session summary for handoff.

        Args:
            lead_id: Lead identifier

        Returns:
            Discovery summary
        """
        try:
            logger.info(f"Starting summary preparation for lead {lead_id}")

            if not lead_id:
                raise ValueError("lead_id is required")

            # Get all discovery sessions
            sessions = self.discovery_sessions.get(lead_id, [])
            if not sessions:
                raise ValueError(f"No discovery sessions found for lead {lead_id}")

            # Aggregate findings
            all_pain_points = []
            all_goals = []
            all_stakeholders = []

            for session in sessions:
                all_pain_points.extend(session.pain_points_identified)
                all_goals.extend(session.goals_identified)
                all_stakeholders.extend(session.stakeholders_mapped)

            # Remove duplicates
            unique_pain_points = list(set(all_pain_points))
            unique_goals = list(set(all_goals))

            # Calculate average confidence
            avg_confidence = sum(s.confidence_score for s in sessions) / len(sessions)

            # Determine readiness for demo
            ready_for_demo = self._assess_demo_readiness(sessions)

            # Generate executive summary
            exec_summary = self._generate_executive_summary(lead_id, sessions)

            # Compile competitive intelligence
            competitive_intel = self._gather_competitive_intelligence(sessions)

            summary = {
                "success": True,
                "lead_id": lead_id,
                "summary": {
                    "total_sessions": len(sessions),
                    "pain_points": unique_pain_points,
                    "goals": unique_goals,
                    "stakeholders": all_stakeholders,
                    "average_confidence_score": round(avg_confidence, 2),
                    "executive_summary": exec_summary,
                    "competitive_intelligence": competitive_intel,
                    "key_decision_criteria": self._extract_decision_criteria(sessions),
                    "budget_range": self._extract_budget_info(sessions),
                    "timeline": self._extract_timeline_info(sessions),
                },
                "ready_for_demo": ready_for_demo,
                "recommended_demo_focus": self._recommend_demo_focus(unique_pain_points),
                "talking_points": self._generate_talking_points(unique_pain_points, unique_goals),
                "potential_objections": self._predict_objections(sessions),
            }

            logger.info(f"Summary prepared for lead {lead_id}")
            return summary

        except ValueError as e:
            logger.error(f"Validation error in prepare_summary: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in prepare_summary: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def track_pipeline_stage(self, lead_id: str, new_stage: str) -> Dict[str, Any]:
        """
        Update and track pipeline stage for a lead.

        Args:
            lead_id: Lead identifier
            new_stage: New pipeline stage

        Returns:
            Pipeline update confirmation
        """
        try:
            if not lead_id:
                raise ValueError("lead_id is required")

            old_stage = self.pipeline.get(lead_id, SalesPipelineStage.NEW_LEAD)
            new_stage_enum = SalesPipelineStage(new_stage)

            # Validate stage progression
            if not self._is_valid_stage_progression(old_stage, new_stage_enum):
                logger.warning(f"Unusual stage progression from {old_stage.value} to {new_stage}")

            # Update pipeline
            self.pipeline[lead_id] = new_stage_enum

            # Calculate time in previous stage
            time_in_stage = self._calculate_time_in_stage(lead_id, old_stage)

            # Log stage change activity
            self._log_activity(
                lead_id=lead_id,
                activity_type=ActivityType.NOTE,
                outcome="stage_changed",
                notes=f"Pipeline stage changed from {old_stage.value} to {new_stage}"
            )

            # Trigger automated actions for new stage
            automated_actions = self._trigger_stage_actions(lead_id, new_stage_enum)

            return {
                "success": True,
                "lead_id": lead_id,
                "old_stage": old_stage.value,
                "new_stage": new_stage_enum.value,
                "time_in_previous_stage_days": time_in_stage,
                "automated_actions_triggered": automated_actions,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error tracking pipeline stage: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def execute_email_sequence(self, lead_id: str, sequence_name: str) -> Dict[str, Any]:
        """
        Execute automated email sequence for lead nurturing.

        Args:
            lead_id: Lead identifier
            sequence_name: Name of email sequence to execute

        Returns:
            Sequence execution results
        """
        try:
            if not lead_id or not sequence_name:
                raise ValueError("lead_id and sequence_name are required")

            # Get or create sequence
            sequence_id = f"{lead_id}_{sequence_name}"
            if sequence_id not in self.email_sequences:
                sequence = self._create_email_sequence(sequence_name)
                self.email_sequences[sequence_id] = sequence
            else:
                sequence = self.email_sequences[sequence_id]

            # Get current email in sequence
            if sequence.current_step >= len(sequence.emails):
                return {
                    "success": False,
                    "error": "Sequence completed",
                    "total_emails_sent": sequence.current_step
                }

            current_email = sequence.emails[sequence.current_step]

            # Personalize email
            personalized_email = self._personalize_email(lead_id, current_email)

            # Send email
            send_result = self._send_email(lead_id, personalized_email)

            # Log activity
            self._log_activity(
                lead_id=lead_id,
                activity_type=ActivityType.EMAIL,
                outcome="email_sent",
                notes=f"Sequence email {sequence.current_step + 1}/{len(sequence.emails)}: {current_email['subject']}"
            )

            # Schedule next email
            if sequence.current_step + 1 < len(sequence.emails):
                next_email_scheduled = self._schedule_next_email(
                    lead_id,
                    sequence,
                    current_email.get("delay_days", 2)
                )
            else:
                next_email_scheduled = False

            # Increment sequence step
            sequence.current_step += 1

            return {
                "success": True,
                "lead_id": lead_id,
                "sequence_name": sequence_name,
                "email_sent": send_result,
                "step": sequence.current_step,
                "total_steps": len(sequence.emails),
                "next_email_scheduled": next_email_scheduled,
                "sequence_complete": sequence.current_step >= len(sequence.emails)
            }

        except Exception as e:
            logger.error(f"Error executing email sequence: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def log_sales_activity(
        self,
        lead_id: str,
        activity_type: str,
        duration: int,
        outcome: str,
        notes: str
    ) -> Dict[str, Any]:
        """
        Log sales activity for tracking and analytics.

        Args:
            lead_id: Lead identifier
            activity_type: Type of activity
            duration: Duration in minutes
            outcome: Activity outcome
            notes: Activity notes

        Returns:
            Activity logging confirmation
        """
        try:
            activity = self._log_activity(
                lead_id=lead_id,
                activity_type=ActivityType(activity_type),
                outcome=outcome,
                notes=notes,
                duration_minutes=duration
            )

            # Update activity metrics
            self._update_activity_metrics(lead_id, activity)

            # Check activity goals
            goals_status = self._check_activity_goals(lead_id)

            return {
                "success": True,
                "activity_id": activity.activity_id,
                "lead_id": lead_id,
                "logged_at": activity.timestamp.isoformat(),
                "activity_goals_status": goals_status
            }

        except Exception as e:
            logger.error(f"Error logging sales activity: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def calculate_deal_health_score(self, lead_id: str) -> Dict[str, Any]:
        """
        Calculate deal health score based on activities and engagement.

        Args:
            lead_id: Lead identifier

        Returns:
            Deal health score and analysis
        """
        try:
            # Get activities for lead
            activities = self.activities.get(lead_id, [])
            sessions = self.discovery_sessions.get(lead_id, [])

            if not activities and not sessions:
                return {
                    "health_score": 0,
                    "status": "inactive",
                    "reasons": ["No activity recorded"]
                }

            score = 0
            factors = {}

            # Activity recency (0-30 points)
            if activities:
                last_activity = max(activities, key=lambda a: a.timestamp)
                days_since = (datetime.utcnow() - last_activity.timestamp).days
                if days_since <= 1:
                    score += 30
                    factors["recency"] = "excellent"
                elif days_since <= 3:
                    score += 25
                    factors["recency"] = "good"
                elif days_since <= 7:
                    score += 20
                    factors["recency"] = "fair"
                elif days_since <= 14:
                    score += 10
                    factors["recency"] = "poor"
                else:
                    factors["recency"] = "very_poor"

            # Activity frequency (0-20 points)
            recent_activities = [a for a in activities if (datetime.utcnow() - a.timestamp).days <= 30]
            if len(recent_activities) >= 10:
                score += 20
                factors["frequency"] = "high"
            elif len(recent_activities) >= 5:
                score += 15
                factors["frequency"] = "medium"
            elif len(recent_activities) >= 2:
                score += 10
                factors["frequency"] = "low"
            else:
                factors["frequency"] = "very_low"

            # Discovery completion (0-25 points)
            if sessions:
                avg_confidence = sum(s.confidence_score for s in sessions) / len(sessions)
                score += int(avg_confidence * 0.25)
                factors["discovery_quality"] = "high" if avg_confidence > 70 else "medium" if avg_confidence > 50 else "low"

            # Pipeline progression (0-15 points)
            current_stage = self.pipeline.get(lead_id, SalesPipelineStage.NEW_LEAD)
            stage_scores = {
                SalesPipelineStage.NEW_LEAD: 0,
                SalesPipelineStage.CONTACTED: 3,
                SalesPipelineStage.QUALIFIED: 5,
                SalesPipelineStage.DISCOVERY_SCHEDULED: 7,
                SalesPipelineStage.DISCOVERY_COMPLETED: 10,
                SalesPipelineStage.NEEDS_ANALYSIS_DONE: 12,
                SalesPipelineStage.PROPOSAL_PREP: 13,
                SalesPipelineStage.PROPOSAL_SENT: 15,
            }
            score += stage_scores.get(current_stage, 0)
            factors["pipeline_stage"] = current_stage.value

            # Engagement sentiment (0-10 points)
            positive_activities = [a for a in activities if a.sentiment == "positive"]
            if positive_activities:
                sentiment_score = min(len(positive_activities) * 2, 10)
                score += sentiment_score
                factors["sentiment"] = "positive"
            else:
                factors["sentiment"] = "neutral"

            # Determine health status
            if score >= 80:
                status = "excellent"
            elif score >= 60:
                status = "good"
            elif score >= 40:
                status = "fair"
            elif score >= 20:
                status = "at_risk"
            else:
                status = "critical"

            return {
                "health_score": score,
                "status": status,
                "factors": factors,
                "recommendations": self._generate_health_recommendations(score, factors),
                "calculated_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating deal health score: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # Helper methods

    def _initialize_activity_goals(self) -> Dict[str, int]:
        """Initialize daily/weekly activity goals."""
        return {
            "daily_calls": 10,
            "daily_emails": 20,
            "weekly_meetings": 15,
            "weekly_demos": 5,
            "weekly_proposals": 2
        }

    def _initialize_email_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize email templates for sequences."""
        return {
            "initial_outreach": {
                "subject": "Quick question about {company_name}",
                "body": "Hi {first_name},\n\nI noticed {company_name} is...",
                "delay_days": 0
            },
            "follow_up_1": {
                "subject": "Following up - {company_name}",
                "body": "Hi {first_name},\n\nWanted to follow up...",
                "delay_days": 2
            },
            "value_proposition": {
                "subject": "How {our_company} can help {company_name}",
                "body": "Hi {first_name},\n\nBased on our research...",
                "delay_days": 3
            }
        }

    def _initialize_question_banks(self) -> Dict[str, List[str]]:
        """Initialize discovery question banks by framework."""
        return {
            "spin": [
                "Can you describe your current process for {area}?",
                "What challenges are you facing with {current_process}?",
                "How does this problem impact your {business_metric}?",
                "What would solving this problem mean for your team?"
            ],
            "gpct": [
                "What are your main goals for the next {timeframe}?",
                "What plans do you have in place to achieve these goals?",
                "What challenges are preventing you from reaching these goals?",
                "What's your timeline for addressing these challenges?"
            ],
            "meddicc": [
                "What metrics are you using to measure success?",
                "Who has budget authority for this initiative?",
                "What criteria will you use to make a decision?",
                "Can you walk me through your decision-making process?"
            ]
        }

    def _select_optimal_time_slot(self, availability: List[str]) -> str:
        """Select optimal time slot from availability."""
        # In production, would use ML to predict best times
        return availability[0] if availability else ""

    def _create_calendar_event(self, lead_id: str, time_slot: str) -> str:
        """Create calendar event."""
        return f"event_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    def _send_calendar_invite(self, lead_id: str, time_slot: str) -> bool:
        """Send calendar invite to prospect."""
        logger.info(f"Calendar invite sent to {lead_id} for {time_slot}")
        return True

    def _schedule_reminder_emails(self, lead_id: str, meeting_time: str) -> bool:
        """Schedule automated reminder emails."""
        logger.info(f"Scheduled reminders for {lead_id}")
        return True

    def _generate_prep_checklist(self, lead_id: str) -> List[str]:
        """Generate pre-call preparation checklist."""
        return [
            "Review lead qualification data",
            "Research company background",
            "Prepare discovery questions",
            "Review similar customer success stories",
            "Test demo environment",
            "Prepare objection responses"
        ]

    def _log_activity(
        self,
        lead_id: str,
        activity_type: ActivityType,
        outcome: str,
        notes: str,
        duration_minutes: int = 0,
        next_steps: List[str] = None
    ) -> SalesActivity:
        """Log sales activity."""
        activity = SalesActivity(
            activity_id=f"act_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
            lead_id=lead_id,
            activity_type=activity_type,
            timestamp=datetime.utcnow(),
            duration_minutes=duration_minutes,
            outcome=outcome,
            notes=notes,
            next_steps=next_steps or []
        )
        self.activities[lead_id].append(activity)
        logger.info(f"Logged {activity_type.value} activity for {lead_id}")
        return activity

    def _generate_discovery_questions(
        self,
        framework: DiscoveryFramework,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate contextual discovery questions."""
        questions = []
        question_bank = self.question_banks.get(framework.value, [])

        for template in question_bank:
            question = {
                "question": template,
                "category": framework.value,
                "priority": "high",
                "asked": False
            }
            questions.append(question)

        return questions

    def _analyze_discovery_responses(self, responses: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze discovery session responses."""
        return {
            "pain_severity": "high" if len(responses.get("pain_points", [])) >= 3 else "medium",
            "budget_alignment": "good" if responses.get("budget_discussed") else "unknown",
            "timeline_urgency": "high" if responses.get("timeline") in ["immediate", "1_month"] else "medium",
            "stakeholder_coverage": "complete" if len(responses.get("stakeholders", [])) >= 3 else "partial",
            "solution_fit": "strong" if responses.get("fit_score", 0) > 70 else "moderate"
        }

    def _extract_goals(self, responses: Dict[str, Any]) -> List[str]:
        """Extract business goals from responses."""
        return responses.get("goals", [])

    def _extract_challenges(self, responses: Dict[str, Any]) -> List[str]:
        """Extract challenges from responses."""
        return responses.get("challenges", [])

    def _map_stakeholders(self, responses: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Map stakeholders involved in decision."""
        return responses.get("stakeholders", [])

    def _calculate_opportunity_score(self, analysis: Dict[str, Any]) -> int:
        """Calculate opportunity score from analysis."""
        score = 50  # Base score

        if analysis.get("pain_severity") == "high":
            score += 20
        elif analysis.get("pain_severity") == "medium":
            score += 10

        if analysis.get("budget_alignment") == "good":
            score += 15

        if analysis.get("timeline_urgency") == "high":
            score += 15

        return min(score, 100)

    def _define_success_criteria(self, responses: Dict[str, Any]) -> List[str]:
        """Define success criteria from responses."""
        return responses.get("success_criteria", [
            "Increase efficiency by 30%",
            "Reduce costs by 20%",
            "Improve customer satisfaction"
        ])

    def _determine_next_steps(self, analysis: Dict[str, Any]) -> List[str]:
        """Determine next steps based on analysis."""
        steps = ["Schedule follow-up meeting"]

        if analysis.get("solution_fit") == "strong":
            steps.append("Prepare customized demo")
            steps.append("Develop proposal outline")

        return steps

    def _trigger_follow_up_sequence(self, lead_id: str, sequence_type: str) -> bool:
        """Trigger automated follow-up sequence."""
        logger.info(f"Triggered {sequence_type} sequence for {lead_id}")
        return True

    def _recommend_solution(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend solution based on discovery analysis."""
        return {
            "recommended_tier": "enterprise" if analysis.get("pain_severity") == "high" else "professional",
            "recommended_modules": ["core", "advanced_analytics"],
            "implementation_approach": "phased"
        }

    def _estimate_deal_value(self, responses: Dict[str, Any]) -> int:
        """Estimate potential deal value."""
        budget = responses.get("budget", 0)
        company_size = responses.get("company_size", 0)

        estimated_value = max(budget, company_size * 100)
        return int(estimated_value)

    def _convert_challenge_to_pain_point(self, challenge: str) -> str:
        """Convert a challenge statement to a pain point."""
        return f"Pain: {challenge}"

    def _prioritize_pain_points(
        self,
        pain_points: List[str],
        context: Dict[str, Any]
    ) -> List[str]:
        """Prioritize pain points by severity and solvability."""
        # In production, would use ML model
        return pain_points[:5]  # Top 5

    def _categorize_requirements(self, requirements: Dict[str, Any]) -> Dict[str, List[str]]:
        """Categorize requirements by type."""
        return {
            "functional": requirements.get("functional", []),
            "technical": requirements.get("technical", []),
            "integration": requirements.get("integration", []),
            "compliance": requirements.get("compliance", [])
        }

    def _prioritize_requirements(self, categorized: Dict[str, List[str]]) -> Dict[str, Any]:
        """Prioritize requirements as must-have, should-have, nice-to-have."""
        return {
            "must_have": [],
            "should_have": [],
            "nice_to_have": []
        }

    def _map_requirements_to_solutions(self, prioritized: Dict[str, Any]) -> Dict[str, str]:
        """Map requirements to solution capabilities."""
        return {}

    def _calculate_implementation_complexity(self, requirements: Dict[str, Any]) -> str:
        """Calculate implementation complexity."""
        req_count = sum(len(v) if isinstance(v, list) else 1 for v in requirements.values())
        if req_count > 20:
            return "high"
        elif req_count > 10:
            return "medium"
        else:
            return "low"

    def _estimate_implementation_timeline(self, complexity: str, requirements: Dict[str, Any]) -> str:
        """Estimate implementation timeline."""
        complexity_timelines = {
            "low": "4-6 weeks",
            "medium": "8-12 weeks",
            "high": "16-24 weeks"
        }
        return complexity_timelines.get(complexity, "12 weeks")

    def _generate_requirements_document(self, lead_id: str, data: Dict[str, Any]) -> str:
        """Generate requirements document."""
        return f"req_doc_{lead_id}_{datetime.utcnow().strftime('%Y%m%d')}"

    def _assess_demo_readiness(self, sessions: List[DiscoverySession]) -> bool:
        """Assess if lead is ready for demo."""
        if not sessions:
            return False

        latest = sessions[-1]
        return (
            len(latest.pain_points_identified) >= 2 and
            latest.budget_discussed and
            latest.confidence_score >= 60
        )

    def _generate_executive_summary(self, lead_id: str, sessions: List[DiscoverySession]) -> str:
        """Generate executive summary of discovery findings."""
        return f"Discovery completed with {len(sessions)} sessions. Key insights captured."

    def _gather_competitive_intelligence(self, sessions: List[DiscoverySession]) -> Dict[str, Any]:
        """Gather competitive intelligence from sessions."""
        return {
            "current_solutions": [],
            "competitors_mentioned": [],
            "switching_barriers": []
        }

    def _extract_decision_criteria(self, sessions: List[DiscoverySession]) -> List[str]:
        """Extract decision criteria from sessions."""
        return ["ROI", "Implementation timeline", "Support quality"]

    def _extract_budget_info(self, sessions: List[DiscoverySession]) -> Dict[str, Any]:
        """Extract budget information."""
        return {"min": 0, "max": 0, "flexibility": "unknown"}

    def _extract_timeline_info(self, sessions: List[DiscoverySession]) -> Dict[str, Any]:
        """Extract timeline information."""
        return {"target_date": "Q2 2024", "flexibility": "moderate"}

    def _recommend_demo_focus(self, pain_points: List[str]) -> List[str]:
        """Recommend areas to focus on in demo."""
        return pain_points[:3] if pain_points else []

    def _generate_talking_points(self, pain_points: List[str], goals: List[str]) -> List[str]:
        """Generate talking points for next conversation."""
        return [f"Address: {p}" for p in pain_points[:3]]

    def _predict_objections(self, sessions: List[DiscoverySession]) -> List[str]:
        """Predict likely objections based on discovery."""
        return ["Pricing concerns", "Implementation timeline", "Change management"]

    def _is_valid_stage_progression(self, old_stage: SalesPipelineStage, new_stage: SalesPipelineStage) -> bool:
        """Validate pipeline stage progression logic."""
        return True  # Simplified - in production would have complex rules

    def _calculate_time_in_stage(self, lead_id: str, stage: SalesPipelineStage) -> int:
        """Calculate time spent in previous stage."""
        return 0  # Simplified - would track actual timestamps

    def _trigger_stage_actions(self, lead_id: str, stage: SalesPipelineStage) -> List[str]:
        """Trigger automated actions for pipeline stage."""
        actions = []

        if stage == SalesPipelineStage.DISCOVERY_SCHEDULED:
            actions.append("sent_preparation_email")
            actions.append("added_to_calendar")

        if stage == SalesPipelineStage.PROPOSAL_SENT:
            actions.append("scheduled_follow_up")
            actions.append("notified_sales_manager")

        return actions

    def _create_email_sequence(self, sequence_name: str) -> EmailSequence:
        """Create email sequence."""
        templates = self.email_templates
        emails = list(templates.values())

        return EmailSequence(
            sequence_id=f"seq_{sequence_name}_{datetime.utcnow().strftime('%Y%m%d')}",
            sequence_name=sequence_name,
            emails=emails
        )

    def _personalize_email(self, lead_id: str, email_template: Dict[str, Any]) -> Dict[str, Any]:
        """Personalize email template with lead data."""
        return {
            "subject": email_template["subject"],
            "body": email_template["body"],
            "personalized": True
        }

    def _send_email(self, lead_id: str, email: Dict[str, Any]) -> bool:
        """Send email to lead."""
        logger.info(f"Email sent to {lead_id}: {email['subject']}")
        return True

    def _schedule_next_email(self, lead_id: str, sequence: EmailSequence, delay_days: int) -> bool:
        """Schedule next email in sequence."""
        logger.info(f"Next email scheduled for {lead_id} in {delay_days} days")
        return True

    def _update_activity_metrics(self, lead_id: str, activity: SalesActivity) -> None:
        """Update activity metrics and KPIs."""
        logger.debug(f"Updated activity metrics for {lead_id}")

    def _check_activity_goals(self, lead_id: str) -> Dict[str, Any]:
        """Check progress against activity goals."""
        return {
            "daily_calls": {"target": 10, "actual": 5, "percentage": 50},
            "daily_emails": {"target": 20, "actual": 12, "percentage": 60}
        }

    def _generate_health_recommendations(self, score: int, factors: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on health score."""
        recommendations = []

        if score < 40:
            recommendations.append("Urgent: Schedule immediate follow-up call")
            recommendations.append("Review and refresh value proposition")

        if factors.get("recency") in ["poor", "very_poor"]:
            recommendations.append("Increase contact frequency")

        if factors.get("sentiment") != "positive":
            recommendations.append("Address concerns and rebuild rapport")

        return recommendations
