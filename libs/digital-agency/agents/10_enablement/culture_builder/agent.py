"""
Mentor Matcher Agent

Designs and manages mentorship programs with intelligent matching algorithms,
compatibility scoring, relationship tracking, and program effectiveness measurement.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import json
import hashlib
import math
from dataclasses import dataclass, field, asdict
from collections import defaultdict


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProgramType(Enum):
    """Mentorship program types"""
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    PEER = "peer"
    REVERSE = "reverse"
    FLASH = "flash"


class MentorshipStatus(Enum):
    """Mentorship relationship status"""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    PENDING = "pending"


class GoalCategory(Enum):
    """Mentorship goal categories"""
    SKILL_DEVELOPMENT = "skill_development"
    CAREER_ADVANCEMENT = "career_advancement"
    LEADERSHIP = "leadership"
    NETWORKING = "networking"
    PERSONAL_GROWTH = "personal_growth"


class FeedbackType(Enum):
    """Feedback mechanism types"""
    PULSE_SURVEY = "pulse_survey"
    QUARTERLY_REVIEW = "quarterly_review"
    DEGREE_360 = "360_degree"
    CHECK_IN = "check_in"
    EXIT_SURVEY = "exit_survey"


@dataclass
class MentorProfile:
    """Mentor profile with skills and experience"""
    mentor_id: str
    name: str
    role: str
    department: str
    years_experience: int
    expertise_areas: List[str]
    skills: List[str]
    interests: List[str]
    personality_traits: Dict[str, float]  # e.g., {"openness": 0.8, "conscientiousness": 0.9}
    availability_hours_per_month: int
    max_mentees: int
    current_mentees: int = 0
    mentoring_experience_years: int = 0
    preferred_program_types: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class MenteeProfile:
    """Mentee profile with goals and interests"""
    mentee_id: str
    name: str
    role: str
    department: str
    years_experience: int
    development_areas: List[str]
    skills: List[str]
    interests: List[str]
    personality_traits: Dict[str, float]
    goals: List[str]
    availability_hours_per_month: int
    preferred_mentor_attributes: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class MatchingCriteria:
    """Criteria for mentor-mentee matching"""
    criteria_id: str
    skills_weight: float = 0.30
    experience_weight: float = 0.25
    interests_weight: float = 0.20
    personality_weight: float = 0.15
    availability_weight: float = 0.10
    department_preference: Optional[str] = None
    min_experience_gap: int = 2  # years
    max_matches_per_run: int = 10


@dataclass
class MentorshipMatch:
    """Matched mentor-mentee pair"""
    match_id: str
    mentor_id: str
    mentee_id: str
    compatibility_score: float
    matching_factors: Dict[str, float]
    program_type: ProgramType
    status: MentorshipStatus
    start_date: str
    end_date: Optional[str] = None
    goals: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class MentorshipGoal:
    """SMART goal for mentorship"""
    goal_id: str
    match_id: str
    category: GoalCategory
    description: str
    specific: str
    measurable: str
    achievable: str
    relevant: str
    time_bound: str
    progress: float = 0.0
    status: str = "in_progress"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class RelationshipMetrics:
    """Metrics tracking mentorship relationship"""
    match_id: str
    total_meetings: int
    meeting_frequency_days: float
    goals_set: int
    goals_completed: int
    last_meeting_date: Optional[str] = None
    engagement_score: float = 0.0
    satisfaction_score: float = 0.0
    progress_rate: float = 0.0


@dataclass
class FeedbackResponse:
    """Feedback response from participant"""
    response_id: str
    match_id: str
    respondent_id: str
    respondent_type: str  # mentor or mentee
    feedback_type: FeedbackType
    responses: Dict[str, Any]
    satisfaction_rating: float
    would_recommend: bool
    comments: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ProgramStructure:
    """Mentorship program structure"""
    program_id: str
    name: str
    program_type: ProgramType
    duration_months: int
    meeting_frequency: str  # e.g., "bi-weekly", "monthly"
    required_meetings: int
    curriculum: List[Dict[str, Any]]
    resources: List[str] = field(default_factory=list)
    success_criteria: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class MentorMatcherAgent:
    """
    Mentor Matcher Agent responsible for mentorship program design and management.

    Implements comprehensive mentorship programs with:
    - Multi-factor matching algorithm (skills, experience, interests, personality, availability)
    - Cosine similarity for compatibility scoring
    - Program structure design (1-on-1, group, peer mentoring)
    - Relationship tracking (meetings, goals, progress)
    - SMART goal framework
    - 360-degree feedback and pulse surveys
    - Program effectiveness measurement
    - Mentor training resources
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Mentor Matcher Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "mentor_matcher_001"
        self.config = config or {}
        self.history: List[Dict[str, Any]] = []
        self.name = "Mentor Matcher"
        self.role = "Mentorship Program Design and Management"

        # Repositories
        self.mentors: Dict[str, MentorProfile] = {}
        self.mentees: Dict[str, MenteeProfile] = {}
        self.matches: Dict[str, MentorshipMatch] = {}
        self.goals: Dict[str, MentorshipGoal] = {}
        self.relationship_metrics: Dict[str, RelationshipMetrics] = {}
        self.feedback_responses: List[FeedbackResponse] = []
        self.programs: Dict[str, ProgramStructure] = {}

        # Analytics
        self.matching_history: List[Dict[str, Any]] = []
        self.effectiveness_metrics: Dict[str, Any] = {}

        logger.info(f"Initialized {self.name} agent: {self.agent_id}")

    def match_mentor_mentee(
        self,
        mentee_id: str,
        matching_criteria: Optional[MatchingCriteria] = None
    ) -> Dict[str, Any]:
        """
        Match mentee with most compatible mentor using multi-factor algorithm.

        Args:
            mentee_id: Mentee identifier
            matching_criteria: Optional matching criteria configuration

        Returns:
            Dictionary containing matching results
        """
        try:
            logger.info(f"Matching mentor for mentee {mentee_id}")

            if mentee_id not in self.mentees:
                raise ValueError(f"Mentee {mentee_id} not found")

            mentee = self.mentees[mentee_id]
            criteria = matching_criteria or MatchingCriteria(
                criteria_id=self._generate_id("criteria")
            )

            # Find all available mentors
            available_mentors = self._find_available_mentors()

            if not available_mentors:
                return {
                    "timestamp": datetime.now().isoformat(),
                    "status": "error",
                    "error": "No available mentors found"
                }

            # Calculate compatibility scores
            scored_mentors = []
            for mentor in available_mentors:
                score, factors = self._calculate_compatibility(
                    mentor=mentor,
                    mentee=mentee,
                    criteria=criteria
                )

                scored_mentors.append({
                    "mentor": mentor,
                    "score": score,
                    "factors": factors
                })

            # Sort by compatibility score
            scored_mentors.sort(key=lambda x: x["score"], reverse=True)

            # Get top matches
            top_matches = scored_mentors[:criteria.max_matches_per_run]

            # Create match with best mentor
            if top_matches:
                best_match = top_matches[0]
                match = self._create_match(
                    mentor=best_match["mentor"],
                    mentee=mentee,
                    compatibility_score=best_match["score"],
                    matching_factors=best_match["factors"]
                )

                # Log matching event
                self.matching_history.append({
                    "timestamp": datetime.now().isoformat(),
                    "mentee_id": mentee_id,
                    "mentor_id": best_match["mentor"].mentor_id,
                    "score": best_match["score"]
                })

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "match": asdict(match) if top_matches else None,
                "top_candidates": [
                    {
                        "mentor_id": m["mentor"].mentor_id,
                        "mentor_name": m["mentor"].name,
                        "compatibility_score": m["score"],
                        "matching_factors": m["factors"]
                    }
                    for m in top_matches
                ],
                "total_candidates": len(scored_mentors),
                "matching_analysis": self._analyze_matching_results(top_matches)
            }

            self._log_operation("match_mentor_mentee", result)
            return result

        except Exception as e:
            logger.error(f"Error matching mentor-mentee: {str(e)}")
            return self._create_error_result(str(e))

    def calculate_compatibility(
        self,
        mentor_id: str,
        mentee_id: str
    ) -> Dict[str, Any]:
        """
        Calculate compatibility score using cosine similarity.

        Args:
            mentor_id: Mentor identifier
            mentee_id: Mentee identifier

        Returns:
            Dictionary containing compatibility analysis
        """
        try:
            logger.info(f"Calculating compatibility between {mentor_id} and {mentee_id}")

            if mentor_id not in self.mentors:
                raise ValueError(f"Mentor {mentor_id} not found")
            if mentee_id not in self.mentees:
                raise ValueError(f"Mentee {mentee_id} not found")

            mentor = self.mentors[mentor_id]
            mentee = self.mentees[mentee_id]

            # Create default criteria
            criteria = MatchingCriteria(criteria_id=self._generate_id("criteria"))

            # Calculate compatibility
            score, factors = self._calculate_compatibility(mentor, mentee, criteria)

            # Generate detailed breakdown
            breakdown = self._generate_compatibility_breakdown(mentor, mentee, factors)

            # Calculate feature vectors for cosine similarity
            mentor_vector = self._create_feature_vector(mentor, is_mentor=True)
            mentee_vector = self._create_feature_vector(mentee, is_mentor=False)
            cosine_score = self._cosine_similarity(mentor_vector, mentee_vector)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "mentor_id": mentor_id,
                "mentee_id": mentee_id,
                "overall_score": score,
                "cosine_similarity": cosine_score,
                "factor_scores": factors,
                "breakdown": breakdown,
                "recommendation": self._generate_compatibility_recommendation(score)
            }

            self._log_operation("calculate_compatibility", result)
            return result

        except Exception as e:
            logger.error(f"Error calculating compatibility: {str(e)}")
            return self._create_error_result(str(e))

    def design_program_structure(
        self,
        program_name: str,
        program_type: ProgramType,
        duration_months: int = 6
    ) -> Dict[str, Any]:
        """
        Design mentorship program structure.

        Args:
            program_name: Program name
            program_type: Type of mentorship program
            duration_months: Program duration in months

        Returns:
            Dictionary containing program structure
        """
        try:
            logger.info(f"Designing {program_type.value} program: {program_name}")

            # Determine meeting frequency
            meeting_frequency = self._determine_meeting_frequency(program_type)

            # Calculate required meetings
            required_meetings = self._calculate_required_meetings(
                duration_months,
                meeting_frequency
            )

            # Design curriculum
            curriculum = self._design_curriculum(program_type, duration_months)

            # Compile resources
            resources = self._compile_program_resources(program_type)

            # Define success criteria
            success_criteria = self._define_success_criteria(program_type)

            # Create program structure
            program = ProgramStructure(
                program_id=self._generate_id("program"),
                name=program_name,
                program_type=program_type,
                duration_months=duration_months,
                meeting_frequency=meeting_frequency,
                required_meetings=required_meetings,
                curriculum=curriculum,
                resources=resources,
                success_criteria=success_criteria
            )

            self.programs[program.program_id] = program

            # Generate implementation guide
            implementation_guide = self._create_implementation_guide(program)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "program": asdict(program),
                "implementation_guide": implementation_guide,
                "estimated_time_commitment": self._estimate_time_commitment(program),
                "recommended_cohort_size": self._recommend_cohort_size(program_type)
            }

            self._log_operation("design_program_structure", result)
            return result

        except Exception as e:
            logger.error(f"Error designing program structure: {str(e)}")
            return self._create_error_result(str(e))

    def track_relationship(
        self,
        match_id: str,
        activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Track mentorship relationship interactions and progress.

        Args:
            match_id: Match identifier
            activity_data: Activity data (meetings, goals, etc.)

        Returns:
            Dictionary containing tracking results
        """
        try:
            logger.info(f"Tracking relationship for match {match_id}")

            if match_id not in self.matches:
                raise ValueError(f"Match {match_id} not found")

            match = self.matches[match_id]

            # Get or create metrics
            if match_id not in self.relationship_metrics:
                self.relationship_metrics[match_id] = RelationshipMetrics(
                    match_id=match_id,
                    total_meetings=0,
                    meeting_frequency_days=0.0,
                    goals_set=0,
                    goals_completed=0
                )

            metrics = self.relationship_metrics[match_id]

            # Update metrics based on activity
            self._update_relationship_metrics(metrics, activity_data)

            # Calculate engagement score
            engagement_score = self._calculate_engagement_score(metrics, match)

            # Calculate progress rate
            progress_rate = self._calculate_progress_rate(metrics)

            # Generate insights
            insights = self._generate_relationship_insights(metrics, match)

            # Create action items
            action_items = self._create_relationship_action_items(metrics, insights)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "match_id": match_id,
                "metrics": asdict(metrics),
                "engagement_score": engagement_score,
                "progress_rate": progress_rate,
                "insights": insights,
                "action_items": action_items,
                "health_status": self._assess_relationship_health(metrics, match)
            }

            self._log_operation("track_relationship", result)
            return result

        except Exception as e:
            logger.error(f"Error tracking relationship: {str(e)}")
            return self._create_error_result(str(e))

    def set_mentorship_goals(
        self,
        match_id: str,
        goal_descriptions: List[str]
    ) -> Dict[str, Any]:
        """
        Set SMART goals for mentorship relationship.

        Args:
            match_id: Match identifier
            goal_descriptions: List of goal descriptions

        Returns:
            Dictionary containing goals
        """
        try:
            logger.info(f"Setting mentorship goals for match {match_id}")

            if match_id not in self.matches:
                raise ValueError(f"Match {match_id} not found")

            match = self.matches[match_id]
            smart_goals = []

            # Create SMART goals from descriptions
            for description in goal_descriptions:
                goal = self._create_smart_goal(
                    match_id=match_id,
                    description=description
                )
                self.goals[goal.goal_id] = goal
                smart_goals.append(goal)
                match.goals.append(goal.goal_id)

            # Update metrics
            if match_id in self.relationship_metrics:
                self.relationship_metrics[match_id].goals_set = len(match.goals)

            # Create goal tracking plan
            tracking_plan = self._create_goal_tracking_plan(smart_goals)

            # Generate milestones
            milestones = self._generate_goal_milestones(smart_goals, match)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "match_id": match_id,
                "goals": [asdict(g) for g in smart_goals],
                "tracking_plan": tracking_plan,
                "milestones": milestones,
                "success_metrics": self._define_goal_success_metrics(smart_goals)
            }

            self._log_operation("set_mentorship_goals", result)
            return result

        except Exception as e:
            logger.error(f"Error setting mentorship goals: {str(e)}")
            return self._create_error_result(str(e))

    def collect_feedback(
        self,
        match_id: str,
        feedback_type: FeedbackType,
        respondent_id: str,
        responses: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Collect feedback through surveys and reviews.

        Args:
            match_id: Match identifier
            feedback_type: Type of feedback
            respondent_id: Person providing feedback
            responses: Feedback responses

        Returns:
            Dictionary containing feedback results
        """
        try:
            logger.info(f"Collecting {feedback_type.value} feedback for match {match_id}")

            if match_id not in self.matches:
                raise ValueError(f"Match {match_id} not found")

            match = self.matches[match_id]

            # Determine respondent type
            respondent_type = (
                "mentor" if respondent_id == match.mentor_id else "mentee"
            )

            # Create feedback response
            feedback = FeedbackResponse(
                response_id=self._generate_id("feedback"),
                match_id=match_id,
                respondent_id=respondent_id,
                respondent_type=respondent_type,
                feedback_type=feedback_type,
                responses=responses,
                satisfaction_rating=responses.get("satisfaction_rating", 0.0),
                would_recommend=responses.get("would_recommend", False),
                comments=responses.get("comments", "")
            )

            self.feedback_responses.append(feedback)

            # Analyze feedback
            analysis = self._analyze_feedback(feedback, match)

            # Generate recommendations
            recommendations = self._generate_feedback_recommendations(analysis)

            # Update relationship metrics
            if match_id in self.relationship_metrics:
                self.relationship_metrics[match_id].satisfaction_score = (
                    feedback.satisfaction_rating
                )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "feedback": asdict(feedback),
                "analysis": analysis,
                "recommendations": recommendations,
                "sentiment": self._analyze_sentiment(feedback.comments)
            }

            self._log_operation("collect_feedback", result)
            return result

        except Exception as e:
            logger.error(f"Error collecting feedback: {str(e)}")
            return self._create_error_result(str(e))

    def measure_effectiveness(
        self,
        program_id: Optional[str] = None,
        time_period_months: int = 6
    ) -> Dict[str, Any]:
        """
        Measure program effectiveness with outcomes tracking.

        Args:
            program_id: Optional program identifier for specific analysis
            time_period_months: Time period for analysis

        Returns:
            Dictionary containing effectiveness metrics
        """
        try:
            logger.info(f"Measuring program effectiveness")

            # Filter matches by program and time period
            relevant_matches = self._filter_matches_by_period(
                program_id,
                time_period_months
            )

            if not relevant_matches:
                return {
                    "timestamp": datetime.now().isoformat(),
                    "status": "error",
                    "error": "No matches found for analysis period"
                }

            # Calculate outcome metrics
            outcomes = self._calculate_outcome_metrics(relevant_matches)

            # Calculate satisfaction metrics
            satisfaction = self._calculate_satisfaction_metrics(relevant_matches)

            # Calculate career progression
            career_progression = self._analyze_career_progression(relevant_matches)

            # Calculate retention and engagement
            engagement = self._calculate_engagement_metrics(relevant_matches)

            # Generate overall effectiveness score
            effectiveness_score = self._calculate_effectiveness_score(
                outcomes,
                satisfaction,
                career_progression,
                engagement
            )

            # Compare to benchmarks
            benchmarks = self._compare_to_benchmarks(effectiveness_score)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "period_months": time_period_months,
                "total_matches_analyzed": len(relevant_matches),
                "effectiveness_score": effectiveness_score,
                "outcomes": outcomes,
                "satisfaction": satisfaction,
                "career_progression": career_progression,
                "engagement": engagement,
                "benchmarks": benchmarks,
                "recommendations": self._generate_effectiveness_recommendations(
                    effectiveness_score
                )
            }

            self._log_operation("measure_effectiveness", result)
            return result

        except Exception as e:
            logger.error(f"Error measuring effectiveness: {str(e)}")
            return self._create_error_result(str(e))

    def provide_training_resources(
        self,
        mentor_id: str,
        training_type: str = "onboarding"
    ) -> Dict[str, Any]:
        """
        Provide mentor training resources and onboarding.

        Args:
            mentor_id: Mentor identifier
            training_type: Type of training (onboarding, advanced, refresh)

        Returns:
            Dictionary containing training resources
        """
        try:
            logger.info(f"Providing {training_type} training for mentor {mentor_id}")

            if mentor_id not in self.mentors:
                raise ValueError(f"Mentor {mentor_id} not found")

            mentor = self.mentors[mentor_id]

            # Generate training curriculum
            curriculum = self._generate_training_curriculum(training_type)

            # Compile resources
            resources = self._compile_training_resources(training_type)

            # Create best practices guide
            best_practices = self._create_best_practices_guide()

            # Generate skill development plan
            skill_plan = self._create_mentor_skill_plan(mentor, training_type)

            # Create assessment
            assessment = self._create_mentor_assessment(training_type)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "mentor_id": mentor_id,
                "training_type": training_type,
                "curriculum": curriculum,
                "resources": resources,
                "best_practices": best_practices,
                "skill_development_plan": skill_plan,
                "assessment": assessment,
                "estimated_time": self._estimate_training_time(training_type)
            }

            self._log_operation("provide_training_resources", result)
            return result

        except Exception as e:
            logger.error(f"Error providing training resources: {str(e)}")
            return self._create_error_result(str(e))

    def _find_available_mentors(self) -> List[MentorProfile]:
        """Find mentors with available capacity"""
        available = []
        for mentor in self.mentors.values():
            if mentor.current_mentees < mentor.max_mentees:
                available.append(mentor)
        return available

    def _calculate_compatibility(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile,
        criteria: MatchingCriteria
    ) -> Tuple[float, Dict[str, float]]:
        """Calculate compatibility score with weighted factors"""
        factors = {}

        # Skills match (30%)
        skills_score = self._calculate_skills_match(mentor, mentee)
        factors["skills"] = skills_score * criteria.skills_weight

        # Experience match (25%)
        experience_score = self._calculate_experience_match(mentor, mentee, criteria)
        factors["experience"] = experience_score * criteria.experience_weight

        # Interests match (20%)
        interests_score = self._calculate_interests_match(mentor, mentee)
        factors["interests"] = interests_score * criteria.interests_weight

        # Personality match (15%)
        personality_score = self._calculate_personality_match(mentor, mentee)
        factors["personality"] = personality_score * criteria.personality_weight

        # Availability match (10%)
        availability_score = self._calculate_availability_match(mentor, mentee)
        factors["availability"] = availability_score * criteria.availability_weight

        # Total weighted score
        total_score = sum(factors.values())

        return round(total_score * 100, 2), factors

    def _calculate_skills_match(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile
    ) -> float:
        """Calculate skills overlap using Jaccard similarity"""
        mentor_skills = set(mentor.expertise_areas + mentor.skills)
        mentee_needs = set(mentee.development_areas + mentee.skills)

        if not mentor_skills or not mentee_needs:
            return 0.0

        # Check how many mentee development areas the mentor can address
        overlap = mentor_skills & mentee_needs
        union = mentor_skills | mentee_needs

        jaccard = len(overlap) / len(union) if union else 0.0

        # Bonus for exact development area matches
        dev_matches = len(set(mentor.expertise_areas) & set(mentee.development_areas))
        bonus = min(dev_matches * 0.15, 0.3)

        return min(jaccard + bonus, 1.0)

    def _calculate_experience_match(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile,
        criteria: MatchingCriteria
    ) -> float:
        """Calculate experience level compatibility"""
        experience_gap = mentor.years_experience - mentee.years_experience

        # Check minimum gap requirement
        if experience_gap < criteria.min_experience_gap:
            return 0.3  # Penalty for insufficient gap

        # Optimal gap is 5-10 years
        if 5 <= experience_gap <= 10:
            return 1.0
        elif 3 <= experience_gap <= 15:
            return 0.8
        elif experience_gap > 15:
            return 0.6  # May be too large a gap
        else:
            return 0.5

    def _calculate_interests_match(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile
    ) -> float:
        """Calculate shared interests"""
        if not mentor.interests or not mentee.interests:
            return 0.5  # Neutral if no interests specified

        mentor_interests = set(mentor.interests)
        mentee_interests = set(mentee.interests)

        overlap = mentor_interests & mentee_interests
        total = mentor_interests | mentee_interests

        if not total:
            return 0.5

        return len(overlap) / len(total)

    def _calculate_personality_match(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile
    ) -> float:
        """Calculate personality compatibility using trait similarity"""
        if not mentor.personality_traits or not mentee.personality_traits:
            return 0.5  # Neutral if no personality data

        # Calculate average difference in trait values
        common_traits = set(mentor.personality_traits.keys()) & set(
            mentee.personality_traits.keys()
        )

        if not common_traits:
            return 0.5

        total_diff = 0.0
        for trait in common_traits:
            diff = abs(
                mentor.personality_traits[trait] - mentee.personality_traits[trait]
            )
            total_diff += diff

        avg_diff = total_diff / len(common_traits)

        # Convert difference to similarity (0 diff = 1.0 similarity, 1.0 diff = 0.0 similarity)
        similarity = 1.0 - avg_diff

        return similarity

    def _calculate_availability_match(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile
    ) -> float:
        """Calculate availability compatibility"""
        # Check if schedules can accommodate each other
        min_required = 4  # hours per month minimum

        if mentor.availability_hours_per_month < min_required:
            return 0.3
        if mentee.availability_hours_per_month < min_required:
            return 0.3

        # Calculate overlap potential
        min_available = min(
            mentor.availability_hours_per_month,
            mentee.availability_hours_per_month
        )

        if min_available >= 8:
            return 1.0
        elif min_available >= 6:
            return 0.8
        elif min_available >= 4:
            return 0.6
        else:
            return 0.4

    def _create_match(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile,
        compatibility_score: float,
        matching_factors: Dict[str, float]
    ) -> MentorshipMatch:
        """Create mentorship match"""
        match = MentorshipMatch(
            match_id=self._generate_id("match"),
            mentor_id=mentor.mentor_id,
            mentee_id=mentee.mentee_id,
            compatibility_score=compatibility_score,
            matching_factors=matching_factors,
            program_type=ProgramType.ONE_ON_ONE,
            status=MentorshipStatus.ACTIVE,
            start_date=datetime.now().isoformat()
        )

        # Update mentor's current mentees count
        mentor.current_mentees += 1

        # Store match
        self.matches[match.match_id] = match

        return match

    def _analyze_matching_results(
        self,
        top_matches: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze matching results"""
        if not top_matches:
            return {}

        scores = [m["score"] for m in top_matches]

        return {
            "average_score": round(sum(scores) / len(scores), 2),
            "highest_score": max(scores),
            "lowest_score": min(scores),
            "score_range": max(scores) - min(scores),
            "quality_rating": "excellent" if min(scores) > 75 else
                            "good" if min(scores) > 60 else "fair"
        }

    def _create_feature_vector(
        self,
        profile: Any,
        is_mentor: bool
    ) -> List[float]:
        """Create feature vector for cosine similarity calculation"""
        vector = []

        # Skills (normalized count)
        if is_mentor:
            vector.append(len(profile.expertise_areas + profile.skills) / 20.0)
        else:
            vector.append(len(profile.development_areas + profile.skills) / 20.0)

        # Experience (normalized years)
        vector.append(profile.years_experience / 30.0)

        # Interests (normalized count)
        vector.append(len(profile.interests) / 10.0)

        # Personality traits (average)
        if profile.personality_traits:
            avg_trait = sum(profile.personality_traits.values()) / len(
                profile.personality_traits
            )
            vector.append(avg_trait)
        else:
            vector.append(0.5)

        # Availability (normalized hours)
        vector.append(profile.availability_hours_per_month / 20.0)

        return vector

    def _cosine_similarity(
        self,
        vector1: List[float],
        vector2: List[float]
    ) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(vector1) != len(vector2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vector1, vector2))
        magnitude1 = math.sqrt(sum(a * a for a in vector1))
        magnitude2 = math.sqrt(sum(b * b for b in vector2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    def _generate_compatibility_breakdown(
        self,
        mentor: MentorProfile,
        mentee: MenteeProfile,
        factors: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate detailed compatibility breakdown"""
        return {
            "skills_analysis": {
                "score": factors.get("skills", 0),
                "mentor_expertise": mentor.expertise_areas,
                "mentee_needs": mentee.development_areas,
                "overlap": list(
                    set(mentor.expertise_areas) & set(mentee.development_areas)
                )
            },
            "experience_analysis": {
                "score": factors.get("experience", 0),
                "mentor_years": mentor.years_experience,
                "mentee_years": mentee.years_experience,
                "gap": mentor.years_experience - mentee.years_experience
            },
            "interests_analysis": {
                "score": factors.get("interests", 0),
                "shared_interests": list(set(mentor.interests) & set(mentee.interests))
            },
            "personality_analysis": {
                "score": factors.get("personality", 0),
                "compatibility_notes": "Based on personality trait alignment"
            },
            "availability_analysis": {
                "score": factors.get("availability", 0),
                "mentor_hours": mentor.availability_hours_per_month,
                "mentee_hours": mentee.availability_hours_per_month
            }
        }

    def _generate_compatibility_recommendation(self, score: float) -> str:
        """Generate recommendation based on compatibility score"""
        if score >= 80:
            return "Excellent match - Highly recommended to proceed"
        elif score >= 70:
            return "Good match - Recommended to proceed"
        elif score >= 60:
            return "Fair match - Consider proceeding with clear expectations"
        elif score >= 50:
            return "Moderate match - Proceed with caution and regular check-ins"
        else:
            return "Low compatibility - Consider alternative matches"

    def _determine_meeting_frequency(self, program_type: ProgramType) -> str:
        """Determine recommended meeting frequency"""
        frequencies = {
            ProgramType.ONE_ON_ONE: "bi-weekly",
            ProgramType.GROUP: "monthly",
            ProgramType.PEER: "weekly",
            ProgramType.REVERSE: "bi-weekly",
            ProgramType.FLASH: "one-time"
        }
        return frequencies.get(program_type, "bi-weekly")

    def _calculate_required_meetings(
        self,
        duration_months: int,
        frequency: str
    ) -> int:
        """Calculate required number of meetings"""
        if frequency == "weekly":
            return duration_months * 4
        elif frequency == "bi-weekly":
            return duration_months * 2
        elif frequency == "monthly":
            return duration_months
        elif frequency == "one-time":
            return 1
        else:
            return duration_months * 2

    def _design_curriculum(
        self,
        program_type: ProgramType,
        duration_months: int
    ) -> List[Dict[str, Any]]:
        """Design program curriculum"""
        curriculum = []

        # Phase 1: Kickoff and Goal Setting (Month 1)
        curriculum.append({
            "phase": "Kickoff",
            "month": 1,
            "topics": [
                "Introduction and relationship building",
                "Goal setting and expectations",
                "Communication preferences",
                "Success metrics definition"
            ],
            "activities": [
                "Icebreaker activities",
                "SMART goal workshop",
                "Agreement creation"
            ]
        })

        # Phase 2: Active Development (Months 2-5)
        mid_phase_count = max(1, duration_months - 2)
        for i in range(mid_phase_count):
            curriculum.append({
                "phase": f"Development - Month {i + 2}",
                "month": i + 2,
                "topics": [
                    "Skill building",
                    "Challenge discussion",
                    "Progress review"
                ],
                "activities": [
                    "Skill practice",
                    "Case study discussion",
                    "Feedback session"
                ]
            })

        # Phase 3: Closure (Final month)
        curriculum.append({
            "phase": "Closure",
            "month": duration_months,
            "topics": [
                "Goal achievement review",
                "Lessons learned",
                "Future planning",
                "Relationship closure"
            ],
            "activities": [
                "Final assessment",
                "Celebration of achievements",
                "Network building"
            ]
        })

        return curriculum

    def _compile_program_resources(self, program_type: ProgramType) -> List[str]:
        """Compile program resources"""
        resources = [
            "Mentorship agreement template",
            "Goal setting worksheet",
            "Meeting agenda templates",
            "Progress tracking tools",
            "Communication guidelines",
            "Conflict resolution guide"
        ]

        if program_type == ProgramType.GROUP:
            resources.extend([
                "Group facilitation guide",
                "Virtual meeting best practices"
            ])

        if program_type == ProgramType.PEER:
            resources.extend([
                "Peer mentoring guidelines",
                "Reciprocal learning framework"
            ])

        return resources

    def _define_success_criteria(self, program_type: ProgramType) -> Dict[str, Any]:
        """Define success criteria for program"""
        return {
            "completion_rate": 0.80,  # 80% completion rate
            "satisfaction_score": 4.0,  # out of 5
            "goals_achieved": 0.75,  # 75% of goals achieved
            "engagement_score": 0.70,  # 70% engagement
            "would_recommend": 0.85  # 85% would recommend
        }

    def _create_implementation_guide(
        self,
        program: ProgramStructure
    ) -> Dict[str, Any]:
        """Create implementation guide"""
        return {
            "preparation_phase": {
                "duration": "2-4 weeks",
                "activities": [
                    "Recruit mentors and mentees",
                    "Conduct orientation sessions",
                    "Complete matching process",
                    "Schedule kickoff meetings"
                ]
            },
            "launch_phase": {
                "duration": "Month 1",
                "activities": [
                    "Kickoff meetings",
                    "Goal setting sessions",
                    "Agreement finalization"
                ]
            },
            "monitoring_phase": {
                "duration": f"Months 2-{program.duration_months - 1}",
                "activities": [
                    "Regular check-ins",
                    "Progress tracking",
                    "Issue resolution",
                    "Mid-program surveys"
                ]
            },
            "closure_phase": {
                "duration": f"Month {program.duration_months}",
                "activities": [
                    "Final assessments",
                    "Celebration events",
                    "Program evaluation",
                    "Continuous engagement planning"
                ]
            }
        }

    def _estimate_time_commitment(self, program: ProgramStructure) -> Dict[str, str]:
        """Estimate time commitment for program"""
        meeting_time = program.required_meetings * 1  # 1 hour per meeting

        return {
            "mentor_hours_total": f"{meeting_time + 10} hours",
            "mentee_hours_total": f"{meeting_time + 5} hours",
            "monthly_average": f"{(meeting_time / program.duration_months):.1f} hours"
        }

    def _recommend_cohort_size(self, program_type: ProgramType) -> int:
        """Recommend cohort size"""
        sizes = {
            ProgramType.ONE_ON_ONE: 20,
            ProgramType.GROUP: 40,
            ProgramType.PEER: 30,
            ProgramType.REVERSE: 15,
            ProgramType.FLASH: 50
        }
        return sizes.get(program_type, 20)

    def _update_relationship_metrics(
        self,
        metrics: RelationshipMetrics,
        activity_data: Dict[str, Any]
    ) -> None:
        """Update relationship metrics with new activity"""
        if "meeting_held" in activity_data and activity_data["meeting_held"]:
            metrics.total_meetings += 1
            metrics.last_meeting_date = datetime.now().isoformat()

            # Update meeting frequency
            if metrics.total_meetings > 1 and metrics.last_meeting_date:
                # Simplified frequency calculation
                metrics.meeting_frequency_days = 14.0  # Placeholder

        if "goal_completed" in activity_data and activity_data["goal_completed"]:
            metrics.goals_completed += 1

    def _calculate_engagement_score(
        self,
        metrics: RelationshipMetrics,
        match: MentorshipMatch
    ) -> float:
        """Calculate engagement score"""
        score = 0.0

        # Meeting attendance (40%)
        if metrics.total_meetings >= 4:
            score += 0.4
        elif metrics.total_meetings >= 2:
            score += 0.2

        # Goal progress (30%)
        if metrics.goals_set > 0:
            goal_ratio = metrics.goals_completed / metrics.goals_set
            score += goal_ratio * 0.3

        # Recent activity (30%)
        if metrics.last_meeting_date:
            last_meeting = datetime.fromisoformat(metrics.last_meeting_date)
            days_since = (datetime.now() - last_meeting).days

            if days_since < 14:
                score += 0.3
            elif days_since < 30:
                score += 0.2
            elif days_since < 60:
                score += 0.1

        return round(score * 100, 2)

    def _calculate_progress_rate(self, metrics: RelationshipMetrics) -> float:
        """Calculate progress rate"""
        if metrics.goals_set == 0:
            return 0.0

        return round(
            (metrics.goals_completed / metrics.goals_set) * 100,
            2
        )

    def _generate_relationship_insights(
        self,
        metrics: RelationshipMetrics,
        match: MentorshipMatch
    ) -> List[str]:
        """Generate insights about relationship"""
        insights = []

        # Meeting frequency insight
        if metrics.total_meetings < 2:
            insights.append(
                "Low meeting frequency - encourage more regular interactions"
            )
        elif metrics.total_meetings >= 6:
            insights.append("Strong meeting cadence maintained")

        # Goal progress insight
        progress = self._calculate_progress_rate(metrics)
        if progress >= 75:
            insights.append("Excellent goal achievement progress")
        elif progress >= 50:
            insights.append("Good progress on goals")
        elif progress < 25 and metrics.goals_set > 0:
            insights.append("Goal achievement needs attention")

        # Engagement insight
        engagement = self._calculate_engagement_score(metrics, match)
        if engagement >= 70:
            insights.append("High engagement levels")
        elif engagement < 50:
            insights.append("Engagement could be improved")

        return insights

    def _create_relationship_action_items(
        self,
        metrics: RelationshipMetrics,
        insights: List[str]
    ) -> List[str]:
        """Create action items based on metrics"""
        actions = []

        if metrics.total_meetings < 2:
            actions.append("Schedule next meeting within 2 weeks")

        if metrics.goals_set == 0:
            actions.append("Set SMART goals for the mentorship")

        if metrics.goals_set > 0 and metrics.goals_completed == 0:
            actions.append("Review goal progress and create action plan")

        if not metrics.last_meeting_date:
            actions.append("Schedule kickoff meeting")

        return actions

    def _assess_relationship_health(
        self,
        metrics: RelationshipMetrics,
        match: MentorshipMatch
    ) -> str:
        """Assess overall relationship health"""
        engagement = self._calculate_engagement_score(metrics, match)
        progress = self._calculate_progress_rate(metrics)

        avg_score = (engagement + progress) / 2

        if avg_score >= 75:
            return "Excellent"
        elif avg_score >= 60:
            return "Good"
        elif avg_score >= 40:
            return "Fair"
        else:
            return "Needs Attention"

    def _create_smart_goal(
        self,
        match_id: str,
        description: str
    ) -> MentorshipGoal:
        """Create SMART goal from description"""
        # Parse description and create SMART components
        goal = MentorshipGoal(
            goal_id=self._generate_id("goal"),
            match_id=match_id,
            category=GoalCategory.SKILL_DEVELOPMENT,
            description=description,
            specific=f"Specific: {description}",
            measurable="Measurable: Track progress through regular assessments",
            achievable="Achievable: Within mentorship timeframe",
            relevant="Relevant: Aligned with career development",
            time_bound="Time-bound: Complete within 3-6 months"
        )

        return goal

    def _create_goal_tracking_plan(
        self,
        goals: List[MentorshipGoal]
    ) -> Dict[str, Any]:
        """Create goal tracking plan"""
        return {
            "total_goals": len(goals),
            "review_frequency": "bi-weekly",
            "tracking_method": "Progress checkpoints",
            "milestones": [
                {"checkpoint": "30 days", "expected_progress": "25%"},
                {"checkpoint": "60 days", "expected_progress": "50%"},
                {"checkpoint": "90 days", "expected_progress": "75%"},
                {"checkpoint": "120 days", "expected_progress": "100%"}
            ]
        }

    def _generate_goal_milestones(
        self,
        goals: List[MentorshipGoal],
        match: MentorshipMatch
    ) -> List[Dict[str, Any]]:
        """Generate milestones for goals"""
        milestones = []

        for i, goal in enumerate(goals):
            milestones.append({
                "goal_id": goal.goal_id,
                "milestone_1": {
                    "name": "Initial Assessment",
                    "deadline": "Week 2",
                    "description": "Baseline assessment and action plan"
                },
                "milestone_2": {
                    "name": "Mid-point Check",
                    "deadline": "Week 6",
                    "description": "Progress review and adjustments"
                },
                "milestone_3": {
                    "name": "Final Achievement",
                    "deadline": "Week 12",
                    "description": "Goal completion and validation"
                }
            })

        return milestones

    def _define_goal_success_metrics(
        self,
        goals: List[MentorshipGoal]
    ) -> Dict[str, Any]:
        """Define success metrics for goals"""
        return {
            "completion_target": "75% of goals achieved",
            "quality_standard": "Goals meet SMART criteria",
            "progress_tracking": "Weekly progress updates",
            "assessment_method": "Mentor and mentee joint evaluation"
        }

    def _analyze_feedback(
        self,
        feedback: FeedbackResponse,
        match: MentorshipMatch
    ) -> Dict[str, Any]:
        """Analyze feedback response"""
        return {
            "satisfaction_level": (
                "Very Satisfied" if feedback.satisfaction_rating >= 4.5 else
                "Satisfied" if feedback.satisfaction_rating >= 3.5 else
                "Neutral" if feedback.satisfaction_rating >= 2.5 else
                "Dissatisfied"
            ),
            "recommendation_likelihood": (
                "High" if feedback.would_recommend else "Low"
            ),
            "sentiment_score": self._analyze_sentiment(feedback.comments),
            "key_themes": self._extract_key_themes(feedback.responses)
        }

    def _generate_feedback_recommendations(
        self,
        analysis: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations from feedback"""
        recommendations = []

        if analysis["satisfaction_level"] in ["Dissatisfied", "Neutral"]:
            recommendations.append("Schedule intervention meeting to address concerns")

        if analysis["recommendation_likelihood"] == "Low":
            recommendations.append("Investigate barriers to positive experience")

        if analysis["sentiment_score"] < 0:
            recommendations.append("Immediate follow-up required")

        return recommendations

    def _analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of text (simplified)"""
        if not text:
            return 0.0

        positive_words = ["great", "excellent", "helpful", "valuable", "amazing"]
        negative_words = ["poor", "bad", "disappointing", "unhelpful", "waste"]

        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)

        if positive_count + negative_count == 0:
            return 0.0

        return (positive_count - negative_count) / (positive_count + negative_count)

    def _extract_key_themes(self, responses: Dict[str, Any]) -> List[str]:
        """Extract key themes from responses"""
        themes = []

        if "helpful_aspects" in responses:
            themes.append(f"Helpful: {responses['helpful_aspects']}")

        if "improvement_areas" in responses:
            themes.append(f"Improve: {responses['improvement_areas']}")

        return themes

    def _filter_matches_by_period(
        self,
        program_id: Optional[str],
        months: int
    ) -> List[MentorshipMatch]:
        """Filter matches by time period"""
        cutoff_date = datetime.now() - timedelta(days=months * 30)
        filtered = []

        for match in self.matches.values():
            match_date = datetime.fromisoformat(match.start_date)
            if match_date >= cutoff_date:
                filtered.append(match)

        return filtered

    def _calculate_outcome_metrics(
        self,
        matches: List[MentorshipMatch]
    ) -> Dict[str, Any]:
        """Calculate outcome metrics"""
        total = len(matches)
        completed = sum(
            1 for m in matches if m.status == MentorshipStatus.COMPLETED
        )
        active = sum(1 for m in matches if m.status == MentorshipStatus.ACTIVE)

        total_goals = 0
        completed_goals = 0

        for match in matches:
            if match.match_id in self.relationship_metrics:
                metrics = self.relationship_metrics[match.match_id]
                total_goals += metrics.goals_set
                completed_goals += metrics.goals_completed

        return {
            "total_matches": total,
            "completed_matches": completed,
            "active_matches": active,
            "completion_rate": round((completed / total * 100) if total > 0 else 0, 2),
            "total_goals_set": total_goals,
            "goals_achieved": completed_goals,
            "goal_achievement_rate": round(
                (completed_goals / total_goals * 100) if total_goals > 0 else 0,
                2
            )
        }

    def _calculate_satisfaction_metrics(
        self,
        matches: List[MentorshipMatch]
    ) -> Dict[str, Any]:
        """Calculate satisfaction metrics"""
        match_ids = {m.match_id for m in matches}
        relevant_feedback = [
            f for f in self.feedback_responses
            if f.match_id in match_ids
        ]

        if not relevant_feedback:
            return {
                "average_satisfaction": 0.0,
                "recommendation_rate": 0.0,
                "responses_count": 0
            }

        avg_satisfaction = sum(
            f.satisfaction_rating for f in relevant_feedback
        ) / len(relevant_feedback)

        recommend_count = sum(1 for f in relevant_feedback if f.would_recommend)

        return {
            "average_satisfaction": round(avg_satisfaction, 2),
            "recommendation_rate": round(
                (recommend_count / len(relevant_feedback) * 100),
                2
            ),
            "responses_count": len(relevant_feedback)
        }

    def _analyze_career_progression(
        self,
        matches: List[MentorshipMatch]
    ) -> Dict[str, Any]:
        """Analyze career progression of mentees"""
        # Simplified - in real system would track actual career changes
        return {
            "promotions": 0,
            "role_changes": 0,
            "skill_certifications": 0,
            "progression_rate": 0.0,
            "note": "Career progression tracking requires external HR data integration"
        }

    def _calculate_engagement_metrics(
        self,
        matches: List[MentorshipMatch]
    ) -> Dict[str, Any]:
        """Calculate engagement metrics"""
        total_meetings = 0
        active_relationships = 0

        for match in matches:
            if match.match_id in self.relationship_metrics:
                metrics = self.relationship_metrics[match.match_id]
                total_meetings += metrics.total_meetings

                if metrics.total_meetings >= 2:
                    active_relationships += 1

        return {
            "total_meetings": total_meetings,
            "average_meetings_per_match": round(
                total_meetings / len(matches) if matches else 0,
                2
            ),
            "active_relationship_rate": round(
                (active_relationships / len(matches) * 100) if matches else 0,
                2
            )
        }

    def _calculate_effectiveness_score(
        self,
        outcomes: Dict[str, Any],
        satisfaction: Dict[str, Any],
        career_progression: Dict[str, Any],
        engagement: Dict[str, Any]
    ) -> float:
        """Calculate overall effectiveness score"""
        # Weighted average of key metrics
        score = 0.0

        # Completion rate (25%)
        score += (outcomes.get("completion_rate", 0) / 100) * 0.25

        # Goal achievement (25%)
        score += (outcomes.get("goal_achievement_rate", 0) / 100) * 0.25

        # Satisfaction (25%)
        score += (satisfaction.get("average_satisfaction", 0) / 5) * 0.25

        # Engagement (25%)
        score += (engagement.get("active_relationship_rate", 0) / 100) * 0.25

        return round(score * 100, 2)

    def _compare_to_benchmarks(
        self,
        effectiveness_score: float
    ) -> Dict[str, Any]:
        """Compare to industry benchmarks"""
        benchmarks = {
            "industry_average": 70.0,
            "top_quartile": 85.0,
            "minimum_acceptable": 60.0
        }

        if effectiveness_score >= benchmarks["top_quartile"]:
            performance = "Exceeds Expectations"
        elif effectiveness_score >= benchmarks["industry_average"]:
            performance = "Meets Expectations"
        elif effectiveness_score >= benchmarks["minimum_acceptable"]:
            performance = "Below Expectations"
        else:
            performance = "Needs Improvement"

        return {
            "benchmarks": benchmarks,
            "your_score": effectiveness_score,
            "performance_rating": performance,
            "gap_to_industry_average": round(
                effectiveness_score - benchmarks["industry_average"],
                2
            )
        }

    def _generate_effectiveness_recommendations(
        self,
        effectiveness_score: float
    ) -> List[str]:
        """Generate recommendations for improvement"""
        recommendations = []

        if effectiveness_score < 60:
            recommendations.extend([
                "Review and redesign matching algorithm",
                "Enhance mentor training program",
                "Implement more frequent check-ins"
            ])
        elif effectiveness_score < 75:
            recommendations.extend([
                "Improve goal-setting framework",
                "Increase program support resources",
                "Gather more frequent feedback"
            ])
        else:
            recommendations.extend([
                "Document and share best practices",
                "Consider expanding program",
                "Recognize top-performing matches"
            ])

        return recommendations

    def _generate_training_curriculum(self, training_type: str) -> List[Dict[str, Any]]:
        """Generate mentor training curriculum"""
        if training_type == "onboarding":
            return [
                {
                    "module": "Introduction to Mentorship",
                    "duration": "30 minutes",
                    "topics": [
                        "Role of a mentor",
                        "Benefits of mentoring",
                        "Program overview"
                    ]
                },
                {
                    "module": "Effective Communication",
                    "duration": "45 minutes",
                    "topics": [
                        "Active listening",
                        "Asking powerful questions",
                        "Providing feedback"
                    ]
                },
                {
                    "module": "Goal Setting",
                    "duration": "30 minutes",
                    "topics": [
                        "SMART goals framework",
                        "Collaborative goal setting",
                        "Progress tracking"
                    ]
                },
                {
                    "module": "Building the Relationship",
                    "duration": "30 minutes",
                    "topics": [
                        "Establishing trust",
                        "Setting boundaries",
                        "Cultural sensitivity"
                    ]
                }
            ]
        else:
            return [
                {
                    "module": "Advanced Mentoring Techniques",
                    "duration": "60 minutes",
                    "topics": [
                        "Coaching vs mentoring",
                        "Difficult conversations",
                        "Career navigation"
                    ]
                }
            ]

    def _compile_training_resources(self, training_type: str) -> List[Dict[str, str]]:
        """Compile training resources"""
        return [
            {
                "type": "Guide",
                "title": "Mentor Handbook",
                "description": "Comprehensive guide to effective mentoring"
            },
            {
                "type": "Video",
                "title": "Mentoring Best Practices",
                "description": "Video series on mentoring techniques"
            },
            {
                "type": "Worksheet",
                "title": "First Meeting Prep",
                "description": "Template for preparing first mentor-mentee meeting"
            },
            {
                "type": "Checklist",
                "title": "Mentor Readiness",
                "description": "Self-assessment checklist"
            }
        ]

    def _create_best_practices_guide(self) -> Dict[str, List[str]]:
        """Create best practices guide"""
        return {
            "do": [
                "Listen actively and empathetically",
                "Set clear expectations early",
                "Maintain regular meeting schedule",
                "Focus on mentee's goals",
                "Share experiences and lessons learned",
                "Provide honest, constructive feedback"
            ],
            "dont": [
                "Dominate the conversation",
                "Make decisions for your mentee",
                "Cancel meetings frequently",
                "Share confidential information",
                "Assume you know all the answers"
            ]
        }

    def _create_mentor_skill_plan(
        self,
        mentor: MentorProfile,
        training_type: str
    ) -> Dict[str, Any]:
        """Create skill development plan for mentor"""
        return {
            "current_level": "intermediate" if mentor.mentoring_experience_years > 2 else "beginner",
            "target_level": "advanced",
            "skills_to_develop": [
                "Active listening",
                "Powerful questioning",
                "Feedback delivery",
                "Goal facilitation"
            ],
            "development_activities": [
                "Complete onboarding training",
                "Practice sessions with peers",
                "Shadow experienced mentor",
                "Quarterly skill assessments"
            ]
        }

    def _create_mentor_assessment(self, training_type: str) -> Dict[str, Any]:
        """Create mentor assessment"""
        return {
            "assessment_name": f"Mentor {training_type.title()} Assessment",
            "format": "quiz",
            "questions": 10,
            "passing_score": 80,
            "topics_covered": [
                "Mentorship fundamentals",
                "Communication skills",
                "Goal setting",
                "Relationship management"
            ]
        }

    def _estimate_training_time(self, training_type: str) -> str:
        """Estimate training time"""
        if training_type == "onboarding":
            return "2-3 hours"
        elif training_type == "advanced":
            return "1-2 hours"
        else:
            return "30-60 minutes"

    def get_history_summary(self) -> Dict[str, Any]:
        """
        Get summary of operations history.

        Returns:
            Dictionary containing history summary
        """
        return {
            "total_operations": len(self.history),
            "recent_operations": self.history[-5:] if self.history else [],
            "agent_id": self.agent_id,
            "mentorship_stats": {
                "total_mentors": len(self.mentors),
                "total_mentees": len(self.mentees),
                "total_matches": len(self.matches),
                "active_matches": sum(
                    1 for m in self.matches.values()
                    if m.status == MentorshipStatus.ACTIVE
                ),
                "total_goals": len(self.goals),
                "total_programs": len(self.programs)
            }
        }

    def _log_operation(self, operation: str, result: Dict[str, Any]) -> None:
        """Log operation to history"""
        self.history.append({
            "operation": operation,
            "timestamp": datetime.now().isoformat(),
            "status": result.get("status", "unknown"),
            "summary": self._create_operation_summary(operation, result)
        })

    def _create_operation_summary(self, operation: str, result: Dict[str, Any]) -> str:
        """Create operation summary"""
        summaries = {
            "match_mentor_mentee": f"Matched mentor-mentee pair",
            "calculate_compatibility": f"Calculated compatibility score",
            "design_program_structure": f"Designed program structure",
            "track_relationship": f"Tracked relationship metrics",
            "set_mentorship_goals": f"Set mentorship goals",
            "collect_feedback": f"Collected feedback",
            "measure_effectiveness": f"Measured program effectiveness",
            "provide_training_resources": f"Provided training resources"
        }

        return summaries.get(operation, f"Performed {operation}")

    def _create_error_result(self, error: str) -> Dict[str, Any]:
        """Create error result"""
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": error,
            "data": {}
        }

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID"""
        timestamp = datetime.now().isoformat()
        unique_string = f"{prefix}_{timestamp}_{id(self)}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:12]
