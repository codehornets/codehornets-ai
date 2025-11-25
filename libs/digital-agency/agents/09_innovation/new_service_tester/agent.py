"""
New Service Tester Agent - Prototype Builder

Builds and tests prototypes for new service offerings using rapid prototyping methodologies.
Implements MVP scoping, Design Sprint framework, pretotyping patterns, and user testing.

This agent serves as the Prototype Builder role, implementing:
- MVP scoping with MoSCoW and RICE prioritization
- Build planning with resource estimation
- Design Sprint framework (5-day structure)
- Pretotyping patterns (Fake Door, Landing Page, Video, Concierge)
- User testing frameworks (usability, A/B testing)
- Feedback collection and synthesis
- Iteration cycles with time-boxing
- Technical feasibility assessment
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import hashlib
import json
import statistics
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FeaturePriority(Enum):
    """MoSCoW prioritization levels"""
    MUST_HAVE = "must_have"
    SHOULD_HAVE = "should_have"
    COULD_HAVE = "could_have"
    WONT_HAVE = "wont_have"


class PretotypeType(Enum):
    """Pretotyping pattern types"""
    FAKE_DOOR = "fake_door"
    LANDING_PAGE = "landing_page"
    EXPLAINER_VIDEO = "explainer_video"
    CONCIERGE = "concierge"
    WIZARD_OF_OZ = "wizard_of_oz"
    MECHANICAL_TURK = "mechanical_turk"
    PINOCCHIO = "pinocchio"
    MINIMUM_VIABLE_PRODUCT = "mvp"


class PrototypeStatus(Enum):
    """Prototype development status"""
    SCOPING = "scoping"
    DESIGNING = "designing"
    BUILDING = "building"
    TESTING = "testing"
    ITERATING = "iterating"
    VALIDATED = "validated"
    FAILED = "failed"
    ARCHIVED = "archived"


class TestingMethod(Enum):
    """User testing methodologies"""
    USABILITY_TEST = "usability_test"
    AB_TEST = "ab_test"
    MULTIVARIATE_TEST = "multivariate_test"
    GUERRILLA_TEST = "guerrilla_test"
    REMOTE_TEST = "remote_test"
    MODERATED_TEST = "moderated_test"
    UNMODERATED_TEST = "unmoderated_test"
    FIVE_SECOND_TEST = "five_second_test"


class FeasibilityLevel(Enum):
    """Technical feasibility assessment levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


@dataclass
class RICEScore:
    """RICE prioritization scoring"""
    reach: float  # Number of users/customers affected per time period
    impact: float  # Impact per user (0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive)
    confidence: float  # Confidence level (0-100%)
    effort: float  # Person-months required

    def calculate(self) -> float:
        """Calculate RICE score: (Reach × Impact × Confidence) / Effort"""
        if self.effort <= 0:
            return 0.0
        return (self.reach * self.impact * (self.confidence / 100)) / self.effort

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reach": self.reach,
            "impact": self.impact,
            "confidence": self.confidence,
            "effort": self.effort,
            "score": self.calculate()
        }


@dataclass
class Feature:
    """Feature specification with prioritization"""
    feature_id: str
    name: str
    description: str
    priority: FeaturePriority
    rice_score: RICEScore
    user_story: str
    acceptance_criteria: List[str]
    dependencies: List[str] = field(default_factory=list)
    estimated_effort_hours: float = 0.0
    technical_complexity: str = "medium"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feature_id": self.feature_id,
            "name": self.name,
            "description": self.description,
            "priority": self.priority.value,
            "rice_score": self.rice_score.to_dict(),
            "user_story": self.user_story,
            "acceptance_criteria": self.acceptance_criteria,
            "dependencies": self.dependencies,
            "estimated_effort_hours": self.estimated_effort_hours,
            "technical_complexity": self.technical_complexity
        }


@dataclass
class DesignSprintDay:
    """Design Sprint daily structure"""
    day_number: int
    name: str
    objectives: List[str]
    activities: List[Dict[str, Any]]
    deliverables: List[str]
    participants: List[str]
    duration_hours: float
    completed: bool = False
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "day_number": self.day_number,
            "name": self.name,
            "objectives": self.objectives,
            "activities": self.activities,
            "deliverables": self.deliverables,
            "participants": self.participants,
            "duration_hours": self.duration_hours,
            "completed": self.completed,
            "notes": self.notes
        }


@dataclass
class UserTestResult:
    """User testing session result"""
    test_id: str
    method: TestingMethod
    participant_id: str
    conducted_at: datetime
    tasks_completed: int
    tasks_total: int
    success_rate: float
    time_on_task_seconds: List[float]
    errors_encountered: List[str]
    satisfaction_score: float  # 1-10
    feedback: str
    observations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_id": self.test_id,
            "method": self.method.value,
            "participant_id": self.participant_id,
            "conducted_at": self.conducted_at.isoformat(),
            "tasks_completed": self.tasks_completed,
            "tasks_total": self.tasks_total,
            "success_rate": self.success_rate,
            "average_time_on_task": statistics.mean(self.time_on_task_seconds) if self.time_on_task_seconds else 0,
            "errors_encountered": self.errors_encountered,
            "satisfaction_score": self.satisfaction_score,
            "feedback": self.feedback,
            "observations": self.observations
        }


@dataclass
class FeedbackItem:
    """User feedback item"""
    feedback_id: str
    source: str
    participant_id: str
    collected_at: datetime
    category: str  # feature_request, bug, usability, satisfaction, other
    sentiment: str  # positive, negative, neutral
    content: str
    priority: int  # 1-5
    actionable: bool
    addressed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feedback_id": self.feedback_id,
            "source": self.source,
            "participant_id": self.participant_id,
            "collected_at": self.collected_at.isoformat(),
            "category": self.category,
            "sentiment": self.sentiment,
            "content": self.content,
            "priority": self.priority,
            "actionable": self.actionable,
            "addressed": self.addressed
        }


@dataclass
class IterationCycle:
    """Build-Measure-Learn iteration cycle"""
    cycle_id: str
    cycle_number: int
    started_at: datetime
    time_box_days: int
    objectives: List[str]
    features_implemented: List[str]
    tests_conducted: int
    key_learnings: List[str]
    metrics_achieved: Dict[str, float]
    next_actions: List[str]
    completed_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cycle_id": self.cycle_id,
            "cycle_number": self.cycle_number,
            "started_at": self.started_at.isoformat(),
            "time_box_days": self.time_box_days,
            "objectives": self.objectives,
            "features_implemented": self.features_implemented,
            "tests_conducted": self.tests_conducted,
            "key_learnings": self.key_learnings,
            "metrics_achieved": self.metrics_achieved,
            "next_actions": self.next_actions,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


@dataclass
class Prototype:
    """Comprehensive prototype specification"""
    prototype_id: str
    name: str
    description: str
    type: PretotypeType
    status: PrototypeStatus
    target_users: str
    problem_statement: str
    value_proposition: str
    features: List[Feature]
    mvp_scope: Dict[str, Any]
    design_sprint: List[DesignSprintDay]
    build_plan: Dict[str, Any]
    test_results: List[UserTestResult]
    feedback_items: List[FeedbackItem]
    iteration_cycles: List[IterationCycle]
    feasibility_assessment: Dict[str, Any]
    created_at: datetime
    last_updated: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "prototype_id": self.prototype_id,
            "name": self.name,
            "description": self.description,
            "type": self.type.value,
            "status": self.status.value,
            "target_users": self.target_users,
            "problem_statement": self.problem_statement,
            "value_proposition": self.value_proposition,
            "features": [f.to_dict() for f in self.features],
            "mvp_scope": self.mvp_scope,
            "design_sprint": [d.to_dict() for d in self.design_sprint],
            "build_plan": self.build_plan,
            "test_results": [t.to_dict() for t in self.test_results],
            "feedback_items": [f.to_dict() for f in self.feedback_items],
            "iteration_cycles": [i.to_dict() for i in self.iteration_cycles],
            "feasibility_assessment": self.feasibility_assessment,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat()
        }


class NewServiceTesterAgent:
    """
    Prototype Builder Agent - New Service Tester

    Implements rapid prototyping methodologies to validate new service concepts
    through MVP development, user testing, and iterative refinement.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Prototype Builder Agent"""
        self.agent_id = "new_service_tester_001"
        self.config = config or {}
        self.name = "Prototype Builder"
        self.role = "Service Prototyping and Validation"

        # Storage
        self.prototypes: Dict[str, Prototype] = {}
        self.features: Dict[str, Feature] = {}
        self.test_results: Dict[str, List[UserTestResult]] = defaultdict(list)
        self.feedback_repository: List[FeedbackItem] = []

        # Metrics
        self.metrics = {
            "prototypes_created": 0,
            "tests_conducted": 0,
            "feedback_collected": 0,
            "iterations_completed": 0,
            "successful_validations": 0
        }

        logger.info(f"Initialized {self.name} agent: {self.agent_id}")

    def scope_mvp(
        self,
        service_name: str,
        problem_statement: str,
        target_users: str,
        proposed_features: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Scope an MVP using MoSCoW and RICE prioritization

        Args:
            service_name: Name of the service
            problem_statement: Problem being solved
            target_users: Target user segment
            proposed_features: List of proposed features with details

        Returns:
            MVP scope with prioritized features
        """
        try:
            logger.info(f"Scoping MVP for service: {service_name}")

            # Create features with RICE scoring
            features = []
            for idx, feature_data in enumerate(proposed_features):
                rice = RICEScore(
                    reach=feature_data.get('reach', 100),
                    impact=feature_data.get('impact', 1.0),
                    confidence=feature_data.get('confidence', 50),
                    effort=feature_data.get('effort', 1.0)
                )

                # Determine MoSCoW priority based on RICE score
                rice_score = rice.calculate()
                if rice_score >= 100:
                    priority = FeaturePriority.MUST_HAVE
                elif rice_score >= 50:
                    priority = FeaturePriority.SHOULD_HAVE
                elif rice_score >= 20:
                    priority = FeaturePriority.COULD_HAVE
                else:
                    priority = FeaturePriority.WONT_HAVE

                feature = Feature(
                    feature_id=self._generate_id(f"feature_{service_name}_{idx}"),
                    name=feature_data['name'],
                    description=feature_data.get('description', ''),
                    priority=priority,
                    rice_score=rice,
                    user_story=feature_data.get('user_story', ''),
                    acceptance_criteria=feature_data.get('acceptance_criteria', []),
                    dependencies=feature_data.get('dependencies', []),
                    estimated_effort_hours=feature_data.get('effort_hours', 8.0),
                    technical_complexity=feature_data.get('complexity', 'medium')
                )

                features.append(feature)
                self.features[feature.feature_id] = feature

            # Sort by RICE score
            features.sort(key=lambda f: f.rice_score.calculate(), reverse=True)

            # Build MVP scope
            mvp_features = [f for f in features if f.priority in
                          [FeaturePriority.MUST_HAVE, FeaturePriority.SHOULD_HAVE]]

            total_effort = sum(f.estimated_effort_hours for f in mvp_features)

            scope = {
                "service_name": service_name,
                "problem_statement": problem_statement,
                "target_users": target_users,
                "mvp_features": [f.to_dict() for f in mvp_features],
                "future_features": [f.to_dict() for f in features
                                  if f.priority in [FeaturePriority.COULD_HAVE, FeaturePriority.WONT_HAVE]],
                "total_features": len(mvp_features),
                "estimated_effort_hours": total_effort,
                "estimated_duration_weeks": total_effort / 40,  # Assuming 40 hour work week
                "prioritization_method": "RICE + MoSCoW",
                "scoped_at": datetime.now().isoformat()
            }

            logger.info(f"MVP scoped: {len(mvp_features)} features, {total_effort} hours estimated")
            return scope

        except Exception as e:
            logger.error(f"Error scoping MVP: {str(e)}")
            raise

    def plan_build(
        self,
        prototype_id: str,
        mvp_scope: Dict[str, Any],
        team_capacity: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Create build plan with resource estimation

        Args:
            prototype_id: Prototype identifier
            mvp_scope: MVP scope from scope_mvp()
            team_capacity: Available team capacity by role

        Returns:
            Detailed build plan
        """
        try:
            logger.info(f"Planning build for prototype: {prototype_id}")

            # Parse features
            features = mvp_scope.get('mvp_features', [])
            total_hours = mvp_scope.get('estimated_effort_hours', 0)

            # Resource allocation
            roles_required = {
                'designer': total_hours * 0.2,
                'frontend_dev': total_hours * 0.35,
                'backend_dev': total_hours * 0.35,
                'tester': total_hours * 0.1
            }

            # Calculate timeline based on capacity
            timeline_days = {}
            bottleneck_days = 0

            for role, hours_needed in roles_required.items():
                hours_available = team_capacity.get(role, 8) * 5  # hours per week
                if hours_available > 0:
                    weeks_needed = hours_needed / hours_available
                    days_needed = weeks_needed * 5
                    timeline_days[role] = days_needed
                    bottleneck_days = max(bottleneck_days, days_needed)

            # Build phases
            phases = [
                {
                    "phase": "Design & Specification",
                    "duration_days": bottleneck_days * 0.25,
                    "deliverables": ["Wireframes", "User flows", "Technical spec"],
                    "resources": ["designer", "backend_dev"]
                },
                {
                    "phase": "Development",
                    "duration_days": bottleneck_days * 0.5,
                    "deliverables": ["Frontend implementation", "Backend APIs", "Integration"],
                    "resources": ["frontend_dev", "backend_dev"]
                },
                {
                    "phase": "Testing & Refinement",
                    "duration_days": bottleneck_days * 0.15,
                    "deliverables": ["Test cases", "Bug fixes", "Performance tuning"],
                    "resources": ["tester", "frontend_dev", "backend_dev"]
                },
                {
                    "phase": "User Testing Prep",
                    "duration_days": bottleneck_days * 0.1,
                    "deliverables": ["Test scripts", "Participant recruitment", "Environment setup"],
                    "resources": ["tester", "designer"]
                }
            ]

            # Risk assessment
            risks = []
            if bottleneck_days > 60:
                risks.append("Timeline exceeds 3 months - consider reducing scope")
            if any(team_capacity.get(role, 0) < 4 for role in roles_required.keys()):
                risks.append("Limited team capacity may delay delivery")

            build_plan = {
                "prototype_id": prototype_id,
                "features_count": len(features),
                "total_effort_hours": total_hours,
                "resource_requirements": roles_required,
                "timeline_by_role": timeline_days,
                "estimated_duration_days": bottleneck_days,
                "phases": phases,
                "milestones": self._generate_milestones(phases),
                "risks": risks,
                "dependencies": self._extract_dependencies(features),
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Build plan created: {bottleneck_days:.1f} days, {len(phases)} phases")
            return build_plan

        except Exception as e:
            logger.error(f"Error planning build: {str(e)}")
            raise

    def create_design_sprint(
        self,
        prototype_id: str,
        challenge: str,
        participants: List[str]
    ) -> Dict[str, Any]:
        """
        Create 5-day Design Sprint structure (Google Ventures methodology)

        Args:
            prototype_id: Prototype identifier
            challenge: Design challenge to solve
            participants: List of participant names/roles

        Returns:
            Design Sprint plan
        """
        try:
            logger.info(f"Creating Design Sprint for: {challenge}")

            # Day 1: Map
            day1 = DesignSprintDay(
                day_number=1,
                name="Map",
                objectives=[
                    "Define long-term goal",
                    "Map out the problem",
                    "Interview experts",
                    "Choose target"
                ],
                activities=[
                    {"time": "10:00-11:00", "activity": "Set long-term goal and sprint questions"},
                    {"time": "11:00-12:00", "activity": "Map the problem space"},
                    {"time": "13:00-15:00", "activity": "Ask the experts (HMW notes)"},
                    {"time": "15:00-16:00", "activity": "Organize HMW notes"},
                    {"time": "16:00-17:00", "activity": "Choose target for sprint"}
                ],
                deliverables=["Problem map", "Sprint questions", "Target area"],
                participants=participants,
                duration_hours=7
            )

            # Day 2: Sketch
            day2 = DesignSprintDay(
                day_number=2,
                name="Sketch",
                objectives=[
                    "Review existing ideas",
                    "Sketch individually",
                    "Generate solutions",
                    "Create detailed concepts"
                ],
                activities=[
                    {"time": "10:00-11:00", "activity": "Lightning demos of existing solutions"},
                    {"time": "11:00-12:00", "activity": "Divide or swarm strategy"},
                    {"time": "13:00-14:00", "activity": "Four-step sketch: Notes"},
                    {"time": "14:00-15:00", "activity": "Four-step sketch: Ideas"},
                    {"time": "15:00-16:00", "activity": "Four-step sketch: Crazy 8s"},
                    {"time": "16:00-17:00", "activity": "Four-step sketch: Solution sketch"}
                ],
                deliverables=["Lightning demo notes", "Solution sketches"],
                participants=participants,
                duration_hours=7
            )

            # Day 3: Decide
            day3 = DesignSprintDay(
                day_number=3,
                name="Decide",
                objectives=[
                    "Critique solutions",
                    "Make decisions",
                    "Create storyboard",
                    "Plan prototype"
                ],
                activities=[
                    {"time": "10:00-11:00", "activity": "Sticky decision (museum review)"},
                    {"time": "11:00-12:00", "activity": "Heat map voting"},
                    {"time": "13:00-14:00", "activity": "Speed critique of top solutions"},
                    {"time": "14:00-15:00", "activity": "Straw poll and supervote"},
                    {"time": "15:00-17:00", "activity": "Create storyboard"}
                ],
                deliverables=["Winning solution", "Storyboard"],
                participants=participants,
                duration_hours=7
            )

            # Day 4: Prototype
            day4 = DesignSprintDay(
                day_number=4,
                name="Prototype",
                objectives=[
                    "Build realistic prototype",
                    "Prepare for testing",
                    "Recruit test participants",
                    "Finalize test script"
                ],
                activities=[
                    {"time": "10:00-12:00", "activity": "Assign roles and begin prototyping"},
                    {"time": "13:00-16:00", "activity": "Build prototype (tools: Figma, InVision, etc)"},
                    {"time": "16:00-17:00", "activity": "Trial run and rehearsal"}
                ],
                deliverables=["Working prototype", "Test script", "Test participants confirmed"],
                participants=participants,
                duration_hours=7
            )

            # Day 5: Test
            day5 = DesignSprintDay(
                day_number=5,
                name="Test",
                objectives=[
                    "Conduct user interviews",
                    "Observe and learn",
                    "Identify patterns",
                    "Plan next steps"
                ],
                activities=[
                    {"time": "09:00-12:00", "activity": "Conduct 5 user interviews (1 hour each)"},
                    {"time": "13:00-15:00", "activity": "Debrief and pattern identification"},
                    {"time": "15:00-16:00", "activity": "Synthesize learnings"},
                    {"time": "16:00-17:00", "activity": "Plan next steps (iterate/pivot/build)"}
                ],
                deliverables=["Test recordings", "Pattern notes", "Next steps plan"],
                participants=participants,
                duration_hours=8
            )

            sprint_plan = {
                "prototype_id": prototype_id,
                "challenge": challenge,
                "sprint_days": [
                    day1.to_dict(),
                    day2.to_dict(),
                    day3.to_dict(),
                    day4.to_dict(),
                    day5.to_dict()
                ],
                "total_duration_days": 5,
                "participants": participants,
                "materials_needed": [
                    "Whiteboard and markers",
                    "Sticky notes (multiple colors)",
                    "Dot stickers for voting",
                    "Timer",
                    "Prototyping tools (Figma, Sketch, etc)",
                    "Video recording equipment"
                ],
                "created_at": datetime.now().isoformat()
            }

            logger.info("Design Sprint plan created: 5 days structured")
            return sprint_plan

        except Exception as e:
            logger.error(f"Error creating Design Sprint: {str(e)}")
            raise

    def create_pretotype(
        self,
        service_name: str,
        pretotype_type: PretotypeType,
        hypothesis: str,
        target_users: str
    ) -> Dict[str, Any]:
        """
        Create pretotype using specified pattern

        Args:
            service_name: Name of service
            pretotype_type: Type of pretotype pattern
            hypothesis: Hypothesis to test
            target_users: Target user segment

        Returns:
            Pretotype specification
        """
        try:
            logger.info(f"Creating {pretotype_type.value} pretotype for {service_name}")

            pretotype_specs = {
                PretotypeType.FAKE_DOOR: {
                    "description": "Create fake feature announcement to gauge interest",
                    "implementation": [
                        "Add UI element for new feature",
                        "Track click-through rate",
                        "Show 'coming soon' message on click",
                        "Collect email signups for interest"
                    ],
                    "metrics": ["Click-through rate", "Email signups", "User feedback"],
                    "duration_days": 7,
                    "cost": "Low"
                },
                PretotypeType.LANDING_PAGE: {
                    "description": "Create landing page to validate demand",
                    "implementation": [
                        "Design compelling landing page",
                        "Include value proposition and CTA",
                        "Set up analytics tracking",
                        "Run targeted ads",
                        "Collect email signups"
                    ],
                    "metrics": ["Page visits", "Conversion rate", "Email signups", "Ad CTR"],
                    "duration_days": 14,
                    "cost": "Low-Medium"
                },
                PretotypeType.EXPLAINER_VIDEO: {
                    "description": "Create video explaining concept to gauge interest",
                    "implementation": [
                        "Script video explaining value proposition",
                        "Create simple animation or screen recording",
                        "Publish on YouTube/Vimeo",
                        "Share with target audience",
                        "Track views, engagement, comments"
                    ],
                    "metrics": ["Video views", "Watch time", "Likes/comments", "CTA clicks"],
                    "duration_days": 10,
                    "cost": "Low-Medium"
                },
                PretotypeType.CONCIERGE: {
                    "description": "Manually deliver service to early customers",
                    "implementation": [
                        "Recruit 5-10 early customers",
                        "Deliver service manually",
                        "Document workflow and pain points",
                        "Gather continuous feedback",
                        "Refine process before automation"
                    ],
                    "metrics": ["Customer satisfaction", "Time per transaction", "Repeat usage", "Willingness to pay"],
                    "duration_days": 30,
                    "cost": "Medium-High"
                },
                PretotypeType.WIZARD_OF_OZ: {
                    "description": "Create appearance of automation while manually processing",
                    "implementation": [
                        "Build simple frontend interface",
                        "Process requests manually behind scenes",
                        "Maintain illusion of automation",
                        "Measure user engagement",
                        "Identify automation priorities"
                    ],
                    "metrics": ["Task completion rate", "User satisfaction", "Processing time", "Feature usage"],
                    "duration_days": 21,
                    "cost": "Medium"
                }
            }

            spec = pretotype_specs.get(pretotype_type, {})

            prototype_id = self._generate_id(f"pretotype_{service_name}")

            pretotype = {
                "prototype_id": prototype_id,
                "service_name": service_name,
                "type": pretotype_type.value,
                "hypothesis": hypothesis,
                "target_users": target_users,
                "description": spec.get("description", ""),
                "implementation_steps": spec.get("implementation", []),
                "success_metrics": spec.get("metrics", []),
                "estimated_duration_days": spec.get("duration_days", 14),
                "estimated_cost": spec.get("cost", "Medium"),
                "validation_criteria": self._define_validation_criteria(pretotype_type),
                "created_at": datetime.now().isoformat()
            }

            self.metrics["prototypes_created"] += 1
            logger.info(f"Pretotype created: {prototype_id}")

            return pretotype

        except Exception as e:
            logger.error(f"Error creating pretotype: {str(e)}")
            raise

    def conduct_user_testing(
        self,
        prototype_id: str,
        method: TestingMethod,
        test_tasks: List[Dict[str, Any]],
        num_participants: int = 5
    ) -> Dict[str, Any]:
        """
        Conduct user testing session

        Args:
            prototype_id: Prototype identifier
            method: Testing methodology
            test_tasks: List of tasks for users to complete
            num_participants: Number of test participants

        Returns:
            Testing session results
        """
        try:
            logger.info(f"Conducting {method.value} with {num_participants} participants")

            # Simulate test results (in production, would collect real data)
            test_results = []

            for i in range(num_participants):
                participant_id = f"P{i+1:03d}"

                # Simulate task completion
                tasks_completed = sum(1 for task in test_tasks
                                    if self._simulate_task_completion())
                success_rate = tasks_completed / len(test_tasks) if test_tasks else 0

                # Simulate timing data
                time_on_task = [
                    self._simulate_task_time(task.get('expected_duration', 60))
                    for task in test_tasks
                ]

                # Simulate errors
                error_rate = 1 - success_rate
                num_errors = int(error_rate * len(test_tasks) * 2)
                errors = [f"Error {j+1}: Simulated error" for j in range(num_errors)]

                # Simulate satisfaction score
                satisfaction = min(10, max(1, 5 + (success_rate * 5) + (self._random_adjustment())))

                result = UserTestResult(
                    test_id=self._generate_id(f"test_{prototype_id}_{participant_id}"),
                    method=method,
                    participant_id=participant_id,
                    conducted_at=datetime.now(),
                    tasks_completed=tasks_completed,
                    tasks_total=len(test_tasks),
                    success_rate=success_rate,
                    time_on_task_seconds=time_on_task,
                    errors_encountered=errors,
                    satisfaction_score=satisfaction,
                    feedback=f"Simulated feedback from {participant_id}",
                    observations=[f"Observation {j+1}" for j in range(2)]
                )

                test_results.append(result)
                self.test_results[prototype_id].append(result)

            # Aggregate results
            avg_success_rate = statistics.mean([r.success_rate for r in test_results])
            avg_satisfaction = statistics.mean([r.satisfaction_score for r in test_results])
            total_errors = sum(len(r.errors_encountered) for r in test_results)

            testing_summary = {
                "prototype_id": prototype_id,
                "method": method.value,
                "participants": num_participants,
                "tasks_tested": len(test_tasks),
                "test_results": [r.to_dict() for r in test_results],
                "aggregate_metrics": {
                    "average_success_rate": avg_success_rate,
                    "average_satisfaction": avg_satisfaction,
                    "total_errors": total_errors,
                    "error_rate": total_errors / (num_participants * len(test_tasks)) if test_tasks else 0
                },
                "insights": self._generate_testing_insights(test_results),
                "recommendations": self._generate_testing_recommendations(avg_success_rate, avg_satisfaction),
                "conducted_at": datetime.now().isoformat()
            }

            self.metrics["tests_conducted"] += 1
            logger.info(f"Testing completed: {avg_success_rate:.1%} success rate, {avg_satisfaction:.1f}/10 satisfaction")

            return testing_summary

        except Exception as e:
            logger.error(f"Error conducting user testing: {str(e)}")
            raise

    def collect_feedback(
        self,
        prototype_id: str,
        source: str,
        feedback_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Collect and synthesize user feedback

        Args:
            prototype_id: Prototype identifier
            source: Feedback source (survey, interview, observation, etc)
            feedback_data: List of feedback items

        Returns:
            Feedback synthesis
        """
        try:
            logger.info(f"Collecting feedback from {source} for {prototype_id}")

            feedback_items = []

            for idx, item in enumerate(feedback_data):
                feedback = FeedbackItem(
                    feedback_id=self._generate_id(f"feedback_{prototype_id}_{idx}"),
                    source=source,
                    participant_id=item.get('participant_id', f"P{idx+1}"),
                    collected_at=datetime.now(),
                    category=item.get('category', 'other'),
                    sentiment=item.get('sentiment', 'neutral'),
                    content=item.get('content', ''),
                    priority=item.get('priority', 3),
                    actionable=item.get('actionable', True)
                )

                feedback_items.append(feedback)
                self.feedback_repository.append(feedback)

            # Synthesize feedback
            sentiment_counts = defaultdict(int)
            category_counts = defaultdict(int)
            actionable_items = []

            for item in feedback_items:
                sentiment_counts[item.sentiment] += 1
                category_counts[item.category] += 1
                if item.actionable and item.priority >= 3:
                    actionable_items.append(item.to_dict())

            synthesis = {
                "prototype_id": prototype_id,
                "source": source,
                "total_feedback_items": len(feedback_items),
                "sentiment_distribution": dict(sentiment_counts),
                "category_distribution": dict(category_counts),
                "actionable_items": actionable_items,
                "themes": self._extract_feedback_themes(feedback_items),
                "priority_actions": sorted(actionable_items,
                                         key=lambda x: x['priority'],
                                         reverse=True)[:5],
                "collected_at": datetime.now().isoformat()
            }

            self.metrics["feedback_collected"] += len(feedback_items)
            logger.info(f"Feedback collected: {len(feedback_items)} items, {len(actionable_items)} actionable")

            return synthesis

        except Exception as e:
            logger.error(f"Error collecting feedback: {str(e)}")
            raise

    def create_iteration_cycle(
        self,
        prototype_id: str,
        cycle_number: int,
        objectives: List[str],
        time_box_days: int = 14
    ) -> Dict[str, Any]:
        """
        Create build-measure-learn iteration cycle with time-boxing

        Args:
            prototype_id: Prototype identifier
            cycle_number: Iteration cycle number
            objectives: Objectives for this iteration
            time_box_days: Time box duration in days

        Returns:
            Iteration cycle plan
        """
        try:
            logger.info(f"Creating iteration cycle {cycle_number} for {prototype_id}")

            cycle_id = self._generate_id(f"cycle_{prototype_id}_{cycle_number}")
            start_date = datetime.now()
            end_date = start_date + timedelta(days=time_box_days)

            # Define cycle phases
            build_days = time_box_days * 0.5
            measure_days = time_box_days * 0.3
            learn_days = time_box_days * 0.2

            phases = [
                {
                    "phase": "BUILD",
                    "duration_days": build_days,
                    "start_date": start_date.isoformat(),
                    "end_date": (start_date + timedelta(days=build_days)).isoformat(),
                    "activities": [
                        "Implement prioritized features",
                        "Fix critical bugs from previous cycle",
                        "Prepare test environment",
                        "Update documentation"
                    ]
                },
                {
                    "phase": "MEASURE",
                    "duration_days": measure_days,
                    "start_date": (start_date + timedelta(days=build_days)).isoformat(),
                    "end_date": (start_date + timedelta(days=build_days + measure_days)).isoformat(),
                    "activities": [
                        "Deploy to test environment",
                        "Conduct user testing",
                        "Collect analytics data",
                        "Gather qualitative feedback"
                    ]
                },
                {
                    "phase": "LEARN",
                    "duration_days": learn_days,
                    "start_date": (start_date + timedelta(days=build_days + measure_days)).isoformat(),
                    "end_date": end_date.isoformat(),
                    "activities": [
                        "Analyze test results",
                        "Synthesize feedback",
                        "Identify validated learnings",
                        "Plan next iteration"
                    ]
                }
            ]

            cycle_plan = {
                "cycle_id": cycle_id,
                "prototype_id": prototype_id,
                "cycle_number": cycle_number,
                "objectives": objectives,
                "time_box_days": time_box_days,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "phases": phases,
                "success_criteria": {
                    "features_delivered": len(objectives),
                    "test_coverage": 80,
                    "user_satisfaction_target": 7.0,
                    "critical_bugs": 0
                },
                "risks": [
                    "Scope creep beyond time box",
                    "Insufficient user testing participants",
                    "Technical blockers"
                ],
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Iteration cycle created: {time_box_days} days, {len(phases)} phases")
            return cycle_plan

        except Exception as e:
            logger.error(f"Error creating iteration cycle: {str(e)}")
            raise

    def assess_technical_feasibility(
        self,
        service_name: str,
        technical_requirements: List[str],
        existing_infrastructure: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assess technical feasibility of prototype

        Args:
            service_name: Name of service
            technical_requirements: List of technical requirements
            existing_infrastructure: Current infrastructure capabilities

        Returns:
            Feasibility assessment
        """
        try:
            logger.info(f"Assessing technical feasibility for {service_name}")

            # Assess each requirement
            requirement_assessments = []

            for req in technical_requirements:
                # Determine feasibility based on requirement complexity
                complexity_keywords = {
                    'high': ['machine learning', 'blockchain', 'real-time', 'distributed'],
                    'medium': ['api', 'integration', 'database', 'authentication'],
                    'low': ['ui', 'frontend', 'static', 'simple']
                }

                complexity = 'medium'
                for level, keywords in complexity_keywords.items():
                    if any(keyword in req.lower() for keyword in keywords):
                        complexity = level
                        break

                # Determine if existing infrastructure supports it
                has_support = any(
                    capability in req.lower()
                    for capability in existing_infrastructure.keys()
                )

                if complexity == 'low' or has_support:
                    feasibility = FeasibilityLevel.HIGH
                elif complexity == 'medium':
                    feasibility = FeasibilityLevel.MEDIUM
                else:
                    feasibility = FeasibilityLevel.LOW

                requirement_assessments.append({
                    "requirement": req,
                    "complexity": complexity,
                    "feasibility": feasibility.value,
                    "existing_support": has_support,
                    "effort_estimate": self._estimate_requirement_effort(complexity),
                    "risks": self._identify_requirement_risks(req, complexity)
                })

            # Overall assessment
            feasibility_scores = {
                FeasibilityLevel.HIGH: 3,
                FeasibilityLevel.MEDIUM: 2,
                FeasibilityLevel.LOW: 1
            }

            avg_feasibility_score = statistics.mean([
                feasibility_scores[FeasibilityLevel[a['feasibility'].upper()]]
                for a in requirement_assessments
            ])

            if avg_feasibility_score >= 2.5:
                overall_feasibility = FeasibilityLevel.HIGH
            elif avg_feasibility_score >= 1.5:
                overall_feasibility = FeasibilityLevel.MEDIUM
            else:
                overall_feasibility = FeasibilityLevel.LOW

            assessment = {
                "service_name": service_name,
                "overall_feasibility": overall_feasibility.value,
                "feasibility_score": avg_feasibility_score,
                "requirements_assessed": len(technical_requirements),
                "requirement_details": requirement_assessments,
                "infrastructure_gaps": self._identify_infrastructure_gaps(
                    requirement_assessments,
                    existing_infrastructure
                ),
                "recommendations": self._generate_feasibility_recommendations(
                    overall_feasibility,
                    requirement_assessments
                ),
                "estimated_technical_effort_weeks": sum(
                    a['effort_estimate'] for a in requirement_assessments
                ) / 40,  # Convert hours to weeks
                "assessed_at": datetime.now().isoformat()
            }

            logger.info(f"Feasibility assessment: {overall_feasibility.value} ({avg_feasibility_score:.1f}/3)")
            return assessment

        except Exception as e:
            logger.error(f"Error assessing technical feasibility: {str(e)}")
            raise

    def complete_iteration(
        self,
        cycle_id: str,
        features_implemented: List[str],
        key_learnings: List[str],
        metrics_achieved: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Complete iteration cycle and capture learnings

        Args:
            cycle_id: Iteration cycle identifier
            features_implemented: List of implemented features
            key_learnings: Key learnings from cycle
            metrics_achieved: Metrics achieved

        Returns:
            Iteration completion summary
        """
        try:
            logger.info(f"Completing iteration cycle: {cycle_id}")

            # Calculate iteration metrics
            planned_features = len(features_implemented)  # Simplified
            velocity = planned_features / 2  # Features per week (assuming 2-week sprint)

            # Determine next actions based on learnings
            next_actions = self._determine_next_actions(key_learnings, metrics_achieved)

            completion_summary = {
                "cycle_id": cycle_id,
                "completed_at": datetime.now().isoformat(),
                "features_implemented": features_implemented,
                "features_count": len(features_implemented),
                "key_learnings": key_learnings,
                "metrics_achieved": metrics_achieved,
                "velocity": velocity,
                "next_actions": next_actions,
                "success_assessment": self._assess_iteration_success(metrics_achieved),
                "retrospective": {
                    "what_went_well": self._extract_positives(key_learnings),
                    "what_needs_improvement": self._extract_improvements(key_learnings),
                    "action_items": next_actions[:3]  # Top 3 actions
                }
            }

            self.metrics["iterations_completed"] += 1
            logger.info(f"Iteration completed: {len(features_implemented)} features, velocity {velocity:.1f}")

            return completion_summary

        except Exception as e:
            logger.error(f"Error completing iteration: {str(e)}")
            raise

    def get_prototype_metrics(self, prototype_id: str) -> Dict[str, Any]:
        """Get comprehensive metrics for a prototype"""
        try:
            test_results = self.test_results.get(prototype_id, [])

            if not test_results:
                return {
                    "prototype_id": prototype_id,
                    "tests_conducted": 0,
                    "message": "No test data available"
                }

            avg_success_rate = statistics.mean([r.success_rate for r in test_results])
            avg_satisfaction = statistics.mean([r.satisfaction_score for r in test_results])

            return {
                "prototype_id": prototype_id,
                "tests_conducted": len(test_results),
                "total_participants": len(test_results),
                "average_success_rate": avg_success_rate,
                "average_satisfaction": avg_satisfaction,
                "total_errors": sum(len(r.errors_encountered) for r in test_results),
                "feedback_items": len([f for f in self.feedback_repository
                                      if prototype_id in f.feedback_id]),
                "validation_status": "validated" if avg_success_rate >= 0.7 and avg_satisfaction >= 7.0 else "needs_improvement"
            }

        except Exception as e:
            logger.error(f"Error getting prototype metrics: {str(e)}")
            return {"error": str(e)}

    def get_agent_metrics(self) -> Dict[str, Any]:
        """Get overall agent performance metrics"""
        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "metrics": self.metrics,
            "prototypes_in_progress": len([p for p in self.prototypes.values()
                                          if p.status not in [PrototypeStatus.VALIDATED,
                                                            PrototypeStatus.FAILED,
                                                            PrototypeStatus.ARCHIVED]]),
            "average_test_success_rate": self._calculate_average_metric("success_rate"),
            "average_user_satisfaction": self._calculate_average_metric("satisfaction_score"),
            "timestamp": datetime.now().isoformat()
        }

    # Helper methods

    def _generate_id(self, base: str) -> str:
        """Generate unique ID"""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{base}_{timestamp}".encode()).hexdigest()[:12]

    def _generate_milestones(self, phases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate milestones from phases"""
        milestones = []
        for idx, phase in enumerate(phases):
            milestones.append({
                "milestone": f"M{idx+1}: {phase['phase']} Complete",
                "phase": phase['phase'],
                "deliverables": phase.get('deliverables', [])
            })
        return milestones

    def _extract_dependencies(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract feature dependencies"""
        dependencies = []
        for feature in features:
            if feature.get('dependencies'):
                dependencies.append({
                    "feature": feature['name'],
                    "depends_on": feature['dependencies']
                })
        return dependencies

    def _define_validation_criteria(self, pretotype_type: PretotypeType) -> Dict[str, Any]:
        """Define validation criteria for pretotype"""
        base_criteria = {
            "minimum_engagement": 100,
            "target_conversion_rate": 0.05,
            "minimum_feedback_items": 20
        }

        type_specific = {
            PretotypeType.FAKE_DOOR: {"minimum_clicks": 50, "signup_rate": 0.10},
            PretotypeType.LANDING_PAGE: {"page_visits": 500, "conversion_rate": 0.05},
            PretotypeType.CONCIERGE: {"customer_satisfaction": 8.0, "repeat_usage": 0.60}
        }

        return {**base_criteria, **type_specific.get(pretotype_type, {})}

    def _simulate_task_completion(self) -> bool:
        """Simulate task completion (70% success rate)"""
        import random
        return random.random() < 0.7

    def _simulate_task_time(self, expected_duration: float) -> float:
        """Simulate task completion time"""
        import random
        return expected_duration * (0.8 + random.random() * 0.4)  # 80-120% of expected

    def _random_adjustment(self) -> float:
        """Random adjustment for satisfaction score"""
        import random
        return (random.random() - 0.5) * 2  # -1 to +1

    def _generate_testing_insights(self, results: List[UserTestResult]) -> List[str]:
        """Generate insights from test results"""
        insights = []

        avg_success = statistics.mean([r.success_rate for r in results])
        if avg_success < 0.7:
            insights.append("Success rate below 70% - significant usability issues detected")

        avg_satisfaction = statistics.mean([r.satisfaction_score for r in results])
        if avg_satisfaction < 7.0:
            insights.append("User satisfaction below target - consider design improvements")

        total_errors = sum(len(r.errors_encountered) for r in results)
        if total_errors > len(results) * 2:
            insights.append("High error rate - review error handling and user guidance")

        return insights or ["Testing results within acceptable parameters"]

    def _generate_testing_recommendations(
        self,
        success_rate: float,
        satisfaction: float
    ) -> List[str]:
        """Generate recommendations based on testing results"""
        recommendations = []

        if success_rate < 0.5:
            recommendations.append("Major redesign recommended - consider returning to design phase")
        elif success_rate < 0.7:
            recommendations.append("Iterate on key user flows - conduct additional usability testing")

        if satisfaction < 6.0:
            recommendations.append("Investigate user pain points through follow-up interviews")
        elif satisfaction < 8.0:
            recommendations.append("Identify and address top 3 user complaints")

        if not recommendations:
            recommendations.append("Proceed to next iteration - results are positive")

        return recommendations

    def _extract_feedback_themes(self, feedback_items: List[FeedbackItem]) -> List[str]:
        """Extract common themes from feedback"""
        # Simplified theme extraction
        categories = defaultdict(int)
        for item in feedback_items:
            categories[item.category] += 1

        themes = [
            f"{category}: {count} mentions"
            for category, count in sorted(categories.items(),
                                        key=lambda x: x[1],
                                        reverse=True)[:5]
        ]

        return themes

    def _estimate_requirement_effort(self, complexity: str) -> float:
        """Estimate effort in hours for requirement"""
        effort_map = {
            'low': 8,
            'medium': 40,
            'high': 120
        }
        return effort_map.get(complexity, 40)

    def _identify_requirement_risks(self, requirement: str, complexity: str) -> List[str]:
        """Identify risks for requirement"""
        risks = []

        if complexity == 'high':
            risks.append("High complexity may extend timeline")
            risks.append("May require specialized expertise")

        if any(keyword in requirement.lower() for keyword in ['integration', 'third-party']):
            risks.append("Dependency on external systems")

        if 'real-time' in requirement.lower():
            risks.append("Performance and scalability challenges")

        return risks or ["No significant risks identified"]

    def _identify_infrastructure_gaps(
        self,
        assessments: List[Dict[str, Any]],
        infrastructure: Dict[str, Any]
    ) -> List[str]:
        """Identify infrastructure gaps"""
        gaps = []

        unsupported = [
            a['requirement']
            for a in assessments
            if not a['existing_support'] and a['feasibility'] != 'high'
        ]

        if unsupported:
            gaps.append(f"Missing infrastructure for: {', '.join(unsupported[:3])}")

        high_complexity = [
            a['requirement']
            for a in assessments
            if a['complexity'] == 'high'
        ]

        if high_complexity:
            gaps.append(f"High complexity items requiring investment: {len(high_complexity)}")

        return gaps or ["No significant infrastructure gaps"]

    def _generate_feasibility_recommendations(
        self,
        overall_feasibility: FeasibilityLevel,
        assessments: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate feasibility recommendations"""
        recommendations = []

        if overall_feasibility == FeasibilityLevel.HIGH:
            recommendations.append("Proceed with prototype development")
            recommendations.append("Prioritize high-feasibility features for MVP")
        elif overall_feasibility == FeasibilityLevel.MEDIUM:
            recommendations.append("Conduct technical spike for medium-feasibility items")
            recommendations.append("Consider phased approach starting with proven technologies")
        else:
            recommendations.append("Significant technical challenges identified")
            recommendations.append("Consider alternative approaches or technology choices")
            recommendations.append("Evaluate build vs buy vs partner options")

        return recommendations

    def _determine_next_actions(
        self,
        learnings: List[str],
        metrics: Dict[str, float]
    ) -> List[str]:
        """Determine next actions based on learnings"""
        actions = []

        # Analyze metrics
        if metrics.get('success_rate', 0) < 0.7:
            actions.append("Improve user flow based on usability findings")

        if metrics.get('satisfaction', 0) < 7.0:
            actions.append("Address top user pain points")

        # Default actions
        actions.extend([
            "Plan next iteration cycle",
            "Prioritize backlog based on learnings",
            "Update prototype based on feedback"
        ])

        return actions[:5]  # Top 5 actions

    def _assess_iteration_success(self, metrics: Dict[str, float]) -> str:
        """Assess iteration success"""
        success_indicators = 0
        total_indicators = 0

        if 'success_rate' in metrics:
            total_indicators += 1
            if metrics['success_rate'] >= 0.7:
                success_indicators += 1

        if 'satisfaction' in metrics:
            total_indicators += 1
            if metrics['satisfaction'] >= 7.0:
                success_indicators += 1

        if total_indicators == 0:
            return "insufficient_data"

        success_ratio = success_indicators / total_indicators

        if success_ratio >= 0.8:
            return "highly_successful"
        elif success_ratio >= 0.6:
            return "successful"
        elif success_ratio >= 0.4:
            return "mixed_results"
        else:
            return "needs_improvement"

    def _extract_positives(self, learnings: List[str]) -> List[str]:
        """Extract positive learnings"""
        positive_keywords = ['success', 'good', 'improved', 'better', 'positive']
        return [
            learning for learning in learnings
            if any(keyword in learning.lower() for keyword in positive_keywords)
        ] or ["Iteration completed successfully"]

    def _extract_improvements(self, learnings: List[str]) -> List[str]:
        """Extract improvement areas"""
        negative_keywords = ['issue', 'problem', 'challenge', 'difficult', 'failed']
        return [
            learning for learning in learnings
            if any(keyword in learning.lower() for keyword in negative_keywords)
        ] or ["Continue iterating on user experience"]

    def _calculate_average_metric(self, metric_name: str) -> float:
        """Calculate average for a metric across all test results"""
        all_results = [r for results in self.test_results.values() for r in results]

        if not all_results:
            return 0.0

        if metric_name == "success_rate":
            return statistics.mean([r.success_rate for r in all_results])
        elif metric_name == "satisfaction_score":
            return statistics.mean([r.satisfaction_score for r in all_results])

        return 0.0
