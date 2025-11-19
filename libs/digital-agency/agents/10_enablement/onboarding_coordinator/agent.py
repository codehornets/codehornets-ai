"""
Onboarding Coordinator Agent

Designs and executes comprehensive onboarding programs with milestone tracking,
first-90-days plans, and integration workflows for new team members.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import json
import hashlib
from dataclasses import dataclass, field, asdict
from collections import defaultdict


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OnboardingPhase(Enum):
    """Onboarding program phases"""
    PREBOARDING = "preboarding"          # Before day 1
    FIRST_DAY = "first_day"              # Day 1
    FIRST_WEEK = "first_week"            # Days 2-7
    FIRST_MONTH = "first_month"          # Days 8-30
    FIRST_QUARTER = "first_quarter"      # Days 31-90
    ONGOING = "ongoing"                   # Beyond 90 days


class MilestoneType(Enum):
    """Types of onboarding milestones"""
    ADMINISTRATIVE = "administrative"
    TECHNICAL_SETUP = "technical_setup"
    TRAINING = "training"
    RELATIONSHIP_BUILDING = "relationship_building"
    ROLE_SPECIFIC = "role_specific"
    CULTURAL = "cultural"
    PERFORMANCE = "performance"


class OnboardingStatus(Enum):
    """Onboarding progress status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    OVERDUE = "overdue"


class IntegrationType(Enum):
    """Types of integration activities"""
    SOCIAL = "social"
    PROFESSIONAL = "professional"
    CULTURAL = "cultural"
    TECHNICAL = "technical"


@dataclass
class OnboardingMilestone:
    """Individual onboarding milestone"""
    milestone_id: str
    title: str
    description: str
    milestone_type: MilestoneType
    phase: OnboardingPhase
    due_date: str
    completion_criteria: List[str]
    assigned_to: Optional[str] = None
    owner: Optional[str] = None  # Person responsible for completion
    resources: List[Dict[str, str]] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    status: OnboardingStatus = OnboardingStatus.NOT_STARTED
    completed_date: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class OnboardingChecklist:
    """Checklist for onboarding activities"""
    checklist_id: str
    title: str
    category: str
    items: List[Dict[str, Any]]
    completion_percentage: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class OnboardingProgram:
    """Complete onboarding program"""
    program_id: str
    role: str
    department: str
    duration_days: int
    milestones: List[OnboardingMilestone]
    checklists: List[OnboardingChecklist]
    success_criteria: Dict[str, Any]
    stakeholders: List[Dict[str, str]]
    version: str = "1.0"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class EmployeeOnboarding:
    """Individual employee onboarding journey"""
    onboarding_id: str
    employee_id: str
    employee_name: str
    role: str
    department: str
    program_id: str
    start_date: str
    manager: str
    buddy: Optional[str] = None
    mentor: Optional[str] = None
    milestones_completed: List[str] = field(default_factory=list)
    current_phase: OnboardingPhase = OnboardingPhase.PREBOARDING
    overall_progress: float = 0.0
    status: str = "active"  # active, completed, on_hold
    feedback_sessions: List[Dict[str, Any]] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class First90DaysPlan:
    """Structured first 90 days plan"""
    plan_id: str
    employee_id: str
    days_30_goals: List[str]
    days_60_goals: List[str]
    days_90_goals: List[str]
    learning_objectives: List[str]
    relationship_goals: List[Dict[str, str]]
    performance_metrics: Dict[str, Any]
    check_in_dates: List[str]
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class OnboardingCoordinatorAgent:
    """
    Onboarding Coordinator Agent responsible for employee onboarding and integration.

    Implements comprehensive onboarding with:
    - Structured onboarding workflows
    - Milestone tracking and management
    - First 90 days planning
    - Buddy/mentor matching
    - Cultural integration
    - Progress monitoring and feedback

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        history (List[Dict]): History of operations
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Onboarding Coordinator Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "onboarding_coordinator_001"
        self.config = config or {}
        self.history: List[Dict[str, Any]] = []
        self.name = "Onboarding Coordinator"
        self.role = "Employee Onboarding and Integration"

        # Onboarding repository
        self.programs: Dict[str, OnboardingProgram] = {}
        self.employee_onboardings: Dict[str, EmployeeOnboarding] = {}
        self.ninety_day_plans: Dict[str, First90DaysPlan] = {}

        # Templates by role
        self.role_templates: Dict[str, List[str]] = {
            "engineer": ["technical_setup", "code_review_training", "architecture_overview"],
            "designer": ["design_tools_setup", "brand_guidelines", "design_process"],
            "manager": ["leadership_training", "team_introduction", "process_overview"],
            "sales": ["crm_training", "product_overview", "sales_process"],
        }

        # Buddy/mentor pools
        self.buddy_pool: List[str] = []
        self.mentor_pool: List[str] = []

        logger.info(f"Onboarding Coordinator Agent {self.agent_id} initialized")

    def design_onboarding_program(
        self,
        role_type: str,
        department: str,
        duration_days: int = 90,
        custom_requirements: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Design comprehensive onboarding program for a role.

        Args:
            role_type: Job role
            department: Department name
            duration_days: Program duration
            custom_requirements: Custom requirements

        Returns:
            Dictionary containing onboarding program
        """
        try:
            logger.info(f"Designing onboarding program for {role_type}")

            program_id = self._generate_id(f"program_{role_type}_{department}")

            # Create phase-based milestones
            milestones = self._create_milestone_structure(
                role_type,
                department,
                duration_days,
                custom_requirements
            )

            # Create checklists
            checklists = self._create_onboarding_checklists(role_type, department)

            # Define success criteria
            success_criteria = self._define_success_criteria(role_type, duration_days)

            # Identify stakeholders
            stakeholders = self._identify_stakeholders(role_type, department)

            # Create program
            program = OnboardingProgram(
                program_id=program_id,
                role=role_type,
                department=department,
                duration_days=duration_days,
                milestones=milestones,
                checklists=checklists,
                success_criteria=success_criteria,
                stakeholders=stakeholders
            )

            # Store program
            self.programs[program_id] = program

            # Generate timeline
            timeline = self._generate_program_timeline(milestones, duration_days)

            # Create resource package
            resource_package = self._create_resource_package(role_type, department)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "program_id": program_id,
                    "program": asdict(program),
                    "milestones_count": len(milestones),
                    "timeline": timeline,
                    "resource_package": resource_package,
                    "estimated_preparation_time": self._estimate_prep_time(milestones)
                }
            }

            self._add_to_history("design_onboarding_program", result)
            logger.info(f"Onboarding program designed with {len(milestones)} milestones")

            return result

        except Exception as e:
            logger.error(f"Error designing onboarding program: {str(e)}")
            return self._error_response("design_onboarding_program", str(e))

    def create_first_90_days_plan(
        self,
        employee_id: str,
        employee_name: str,
        role: str,
        department: str,
        manager: str,
        start_date: str
    ) -> Dict[str, Any]:
        """
        Create detailed first 90 days plan for new employee.

        Args:
            employee_id: Employee identifier
            employee_name: Employee name
            role: Job role
            department: Department
            manager: Manager name
            start_date: Start date

        Returns:
            Dictionary containing 90-day plan
        """
        try:
            logger.info(f"Creating 90-day plan for {employee_name}")

            plan_id = self._generate_id(f"plan_90_{employee_id}")

            # Generate 30-60-90 goals
            days_30_goals = self._create_30_day_goals(role, department)
            days_60_goals = self._create_60_day_goals(role, department)
            days_90_goals = self._create_90_day_goals(role, department)

            # Define learning objectives
            learning_objectives = self._define_learning_objectives(role)

            # Set relationship goals
            relationship_goals = self._define_relationship_goals(role, department)

            # Define performance metrics
            performance_metrics = self._define_performance_metrics(role)

            # Schedule check-ins
            start_dt = datetime.fromisoformat(start_date)
            check_in_dates = [
                (start_dt + timedelta(days=7)).isoformat(),
                (start_dt + timedelta(days=30)).isoformat(),
                (start_dt + timedelta(days=60)).isoformat(),
                (start_dt + timedelta(days=90)).isoformat()
            ]

            # Create plan
            plan = First90DaysPlan(
                plan_id=plan_id,
                employee_id=employee_id,
                days_30_goals=days_30_goals,
                days_60_goals=days_60_goals,
                days_90_goals=days_90_goals,
                learning_objectives=learning_objectives,
                relationship_goals=relationship_goals,
                performance_metrics=performance_metrics,
                check_in_dates=check_in_dates
            )

            # Store plan
            self.ninety_day_plans[plan_id] = plan

            # Generate week-by-week breakdown
            weekly_breakdown = self._create_weekly_breakdown(plan, start_date)

            # Create success indicators
            success_indicators = self._create_success_indicators(role)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "plan_id": plan_id,
                    "plan": asdict(plan),
                    "weekly_breakdown": weekly_breakdown,
                    "success_indicators": success_indicators,
                    "manager_guidance": self._create_manager_guidance(role)
                }
            }

            self._add_to_history("create_first_90_days_plan", result)
            logger.info(f"90-day plan created for {employee_name}")

            return result

        except Exception as e:
            logger.error(f"Error creating 90-day plan: {str(e)}")
            return self._error_response("create_first_90_days_plan", str(e))

    def start_employee_onboarding(
        self,
        employee_id: str,
        employee_name: str,
        role: str,
        department: str,
        start_date: str,
        manager: str,
        program_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Start onboarding process for new employee.

        Args:
            employee_id: Employee identifier
            employee_name: Employee name
            role: Job role
            department: Department
            start_date: Start date
            manager: Manager name
            program_id: Onboarding program to use

        Returns:
            Dictionary containing onboarding details
        """
        try:
            logger.info(f"Starting onboarding for {employee_name}")

            onboarding_id = self._generate_id(f"onboarding_{employee_id}")

            # Find or create program
            if not program_id:
                # Create default program
                program_result = self.design_onboarding_program(role, department)
                program_id = program_result["data"]["program_id"]

            # Assign buddy
            buddy = self._assign_buddy(role, department)

            # Assign mentor (optional, for senior roles)
            mentor = self._assign_mentor(role) if self._needs_mentor(role) else None

            # Create employee onboarding
            employee_onboarding = EmployeeOnboarding(
                onboarding_id=onboarding_id,
                employee_id=employee_id,
                employee_name=employee_name,
                role=role,
                department=department,
                program_id=program_id,
                start_date=start_date,
                manager=manager,
                buddy=buddy,
                mentor=mentor
            )

            # Store onboarding
            self.employee_onboardings[onboarding_id] = employee_onboarding

            # Create first 90 days plan
            plan_result = self.create_first_90_days_plan(
                employee_id,
                employee_name,
                role,
                department,
                manager,
                start_date
            )

            # Generate preboarding activities
            preboarding = self._create_preboarding_activities(
                employee_name,
                role,
                start_date
            )

            # Create first day schedule
            first_day = self._create_first_day_schedule(
                employee_name,
                role,
                department,
                manager,
                buddy
            )

            # Setup communication plan
            communication_plan = self._setup_communication_plan(
                employee_name,
                start_date,
                manager,
                buddy
            )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "onboarding_id": onboarding_id,
                    "employee_onboarding": asdict(employee_onboarding),
                    "ninety_day_plan_id": plan_result["data"]["plan_id"],
                    "preboarding_activities": preboarding,
                    "first_day_schedule": first_day,
                    "communication_plan": communication_plan,
                    "buddy_info": self._get_buddy_info(buddy),
                    "mentor_info": self._get_mentor_info(mentor) if mentor else None
                }
            }

            self._add_to_history("start_employee_onboarding", result)
            logger.info(f"Onboarding started for {employee_name}")

            return result

        except Exception as e:
            logger.error(f"Error starting onboarding: {str(e)}")
            return self._error_response("start_employee_onboarding", str(e))

    def track_onboarding_progress(
        self,
        onboarding_id: str,
        milestone_updates: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Track and update onboarding progress.

        Args:
            onboarding_id: Onboarding identifier
            milestone_updates: Milestone status updates

        Returns:
            Dictionary containing progress report
        """
        try:
            logger.info(f"Tracking progress for onboarding {onboarding_id}")

            if onboarding_id not in self.employee_onboardings:
                raise ValueError(f"Onboarding {onboarding_id} not found")

            onboarding = self.employee_onboardings[onboarding_id]
            program = self.programs.get(onboarding.program_id)

            if not program:
                raise ValueError(f"Program {onboarding.program_id} not found")

            # Update milestones
            if milestone_updates:
                self._update_milestones(program, milestone_updates)

            # Calculate progress
            progress = self._calculate_progress(onboarding, program)

            # Update onboarding
            onboarding.overall_progress = progress["overall_percentage"]
            onboarding.milestones_completed = progress["completed_milestones"]
            onboarding.current_phase = self._determine_current_phase(
                onboarding.start_date,
                progress
            )

            # Identify blockers
            blockers = self._identify_blockers(program)

            # Generate recommendations
            recommendations = self._generate_progress_recommendations(
                onboarding,
                progress,
                blockers
            )

            # Check for milestone achievements
            achievements = self._check_achievements(onboarding, program)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "onboarding_id": onboarding_id,
                    "employee_name": onboarding.employee_name,
                    "current_phase": onboarding.current_phase.value,
                    "progress": progress,
                    "blockers": blockers,
                    "recommendations": recommendations,
                    "achievements": achievements,
                    "next_milestones": self._get_next_milestones(program, progress)
                }
            }

            self._add_to_history("track_onboarding_progress", result)
            logger.info(f"Progress tracked: {progress['overall_percentage']:.1f}%")

            return result

        except Exception as e:
            logger.error(f"Error tracking progress: {str(e)}")
            return self._error_response("track_onboarding_progress", str(e))

    def conduct_check_in(
        self,
        onboarding_id: str,
        check_in_type: str,
        feedback: Dict[str, Any],
        attendees: List[str]
    ) -> Dict[str, Any]:
        """
        Conduct onboarding check-in session.

        Args:
            onboarding_id: Onboarding identifier
            check_in_type: Type of check-in (weekly, 30_day, etc.)
            feedback: Feedback collected
            attendees: Meeting attendees

        Returns:
            Dictionary containing check-in results
        """
        try:
            logger.info(f"Conducting {check_in_type} check-in for {onboarding_id}")

            if onboarding_id not in self.employee_onboardings:
                raise ValueError(f"Onboarding {onboarding_id} not found")

            onboarding = self.employee_onboardings[onboarding_id]

            # Record feedback session
            feedback_session = {
                "session_id": self._generate_id(f"checkin_{check_in_type}"),
                "type": check_in_type,
                "date": datetime.now().isoformat(),
                "attendees": attendees,
                "feedback": feedback,
                "action_items": self._extract_action_items(feedback)
            }

            onboarding.feedback_sessions.append(feedback_session)

            # Analyze feedback
            sentiment = self._analyze_feedback_sentiment(feedback)

            # Identify concerns
            concerns = self._identify_concerns(feedback)

            # Generate action plan
            action_plan = self._create_action_plan(concerns, onboarding)

            # Update stakeholders
            stakeholder_updates = self._prepare_stakeholder_updates(
                onboarding,
                feedback_session,
                concerns
            )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "session_id": feedback_session["session_id"],
                    "check_in_type": check_in_type,
                    "sentiment_analysis": sentiment,
                    "concerns_identified": concerns,
                    "action_plan": action_plan,
                    "stakeholder_updates": stakeholder_updates,
                    "next_check_in": self._schedule_next_check_in(
                        check_in_type,
                        onboarding
                    )
                }
            }

            self._add_to_history("conduct_check_in", result)
            logger.info(f"Check-in completed with {len(concerns)} concerns identified")

            return result

        except Exception as e:
            logger.error(f"Error conducting check-in: {str(e)}")
            return self._error_response("conduct_check_in", str(e))

    def facilitate_integration(
        self,
        employee_id: str,
        integration_type: str,
        duration_weeks: int = 12
    ) -> Dict[str, Any]:
        """
        Facilitate cultural and social integration.

        Args:
            employee_id: Employee identifier
            integration_type: Type of integration
            duration_weeks: Integration period

        Returns:
            Dictionary containing integration plan
        """
        try:
            logger.info(f"Facilitating {integration_type} integration for {employee_id}")

            # Find onboarding
            onboarding = self._find_onboarding_by_employee(employee_id)

            if not onboarding:
                raise ValueError(f"No active onboarding found for {employee_id}")

            # Create integration activities
            activities = self._create_integration_activities(
                integration_type,
                onboarding.role,
                onboarding.department
            )

            # Schedule activities
            schedule = self._schedule_integration_activities(
                activities,
                onboarding.start_date,
                duration_weeks
            )

            # Identify connection opportunities
            connections = self._identify_connection_opportunities(
                onboarding.role,
                onboarding.department
            )

            # Create team introduction plan
            team_introductions = self._plan_team_introductions(
                onboarding.employee_name,
                onboarding.department
            )

            # Setup cultural immersion
            cultural_activities = self._setup_cultural_immersion(
                onboarding.employee_name
            )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "integration_type": integration_type,
                    "activities": activities,
                    "schedule": schedule,
                    "connection_opportunities": connections,
                    "team_introductions": team_introductions,
                    "cultural_activities": cultural_activities,
                    "success_metrics": self._define_integration_metrics()
                }
            }

            self._add_to_history("facilitate_integration", result)
            logger.info(f"Integration plan created with {len(activities)} activities")

            return result

        except Exception as e:
            logger.error(f"Error facilitating integration: {str(e)}")
            return self._error_response("facilitate_integration", str(e))

    def complete_onboarding(
        self,
        onboarding_id: str,
        final_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Complete onboarding process and transition to regular employment.

        Args:
            onboarding_id: Onboarding identifier
            final_assessment: Final onboarding assessment

        Returns:
            Dictionary containing completion report
        """
        try:
            logger.info(f"Completing onboarding {onboarding_id}")

            if onboarding_id not in self.employee_onboardings:
                raise ValueError(f"Onboarding {onboarding_id} not found")

            onboarding = self.employee_onboardings[onboarding_id]
            program = self.programs.get(onboarding.program_id)

            # Verify completion criteria
            completion_check = self._verify_completion_criteria(
                onboarding,
                program,
                final_assessment
            )

            if not completion_check["ready_to_complete"]:
                return {
                    "timestamp": datetime.now().isoformat(),
                    "status": "incomplete",
                    "data": {
                        "message": "Onboarding not ready to complete",
                        "missing_items": completion_check["missing_items"],
                        "recommendations": completion_check["recommendations"]
                    }
                }

            # Update status
            onboarding.status = "completed"

            # Generate completion report
            completion_report = self._generate_completion_report(
                onboarding,
                program,
                final_assessment
            )

            # Create transition plan
            transition_plan = self._create_transition_plan(onboarding)

            # Gather lessons learned
            lessons_learned = self._gather_lessons_learned(onboarding)

            # Thank and celebrate
            celebration_plan = self._create_celebration_plan(onboarding)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "onboarding_id": onboarding_id,
                    "completion_report": completion_report,
                    "transition_plan": transition_plan,
                    "lessons_learned": lessons_learned,
                    "celebration_plan": celebration_plan,
                    "ongoing_support": self._define_ongoing_support(onboarding)
                }
            }

            self._add_to_history("complete_onboarding", result)
            logger.info(f"Onboarding completed for {onboarding.employee_name}")

            return result

        except Exception as e:
            logger.error(f"Error completing onboarding: {str(e)}")
            return self._error_response("complete_onboarding", str(e))

    # Helper methods

    def _create_milestone_structure(
        self,
        role: str,
        department: str,
        duration_days: int,
        custom_requirements: Optional[List[str]]
    ) -> List[OnboardingMilestone]:
        """Create structured milestones for onboarding"""
        milestones = []

        # Preboarding phase
        milestones.extend(self._create_preboarding_milestones(role))

        # First day milestones
        milestones.extend(self._create_first_day_milestones(role, department))

        # First week milestones
        milestones.extend(self._create_first_week_milestones(role, department))

        # First month milestones
        milestones.extend(self._create_first_month_milestones(role, department))

        # First quarter milestones
        if duration_days >= 90:
            milestones.extend(self._create_first_quarter_milestones(role, department))

        # Add custom milestones
        if custom_requirements:
            milestones.extend(self._create_custom_milestones(custom_requirements))

        return milestones

    def _create_preboarding_milestones(self, role: str) -> List[OnboardingMilestone]:
        """Create preboarding milestones"""
        return [
            OnboardingMilestone(
                milestone_id=self._generate_id("pre_paperwork"),
                title="Complete Pre-Employment Paperwork",
                description="Submit all required documents before start date",
                milestone_type=MilestoneType.ADMINISTRATIVE,
                phase=OnboardingPhase.PREBOARDING,
                due_date=(datetime.now() - timedelta(days=3)).isoformat(),
                completion_criteria=["All forms submitted", "Background check completed"]
            ),
            OnboardingMilestone(
                milestone_id=self._generate_id("pre_equipment"),
                title="Equipment and Access Provisioning",
                description="Setup laptop, accounts, and system access",
                milestone_type=MilestoneType.TECHNICAL_SETUP,
                phase=OnboardingPhase.PREBOARDING,
                due_date=(datetime.now() - timedelta(days=1)).isoformat(),
                completion_criteria=["Laptop configured", "Email active", "System access granted"]
            )
        ]

    def _create_first_day_milestones(self, role: str, department: str) -> List[OnboardingMilestone]:
        """Create first day milestones"""
        return [
            OnboardingMilestone(
                milestone_id=self._generate_id("day1_welcome"),
                title="Welcome and Orientation",
                description="Official welcome and office tour",
                milestone_type=MilestoneType.CULTURAL,
                phase=OnboardingPhase.FIRST_DAY,
                due_date=datetime.now().isoformat(),
                completion_criteria=["Office tour completed", "Team introduced", "Workspace setup"]
            ),
            OnboardingMilestone(
                milestone_id=self._generate_id("day1_buddy"),
                title="Buddy Introduction",
                description="Meet and connect with assigned buddy",
                milestone_type=MilestoneType.RELATIONSHIP_BUILDING,
                phase=OnboardingPhase.FIRST_DAY,
                due_date=datetime.now().isoformat(),
                completion_criteria=["Buddy meeting held", "Communication channels established"]
            )
        ]

    def _create_first_week_milestones(self, role: str, department: str) -> List[OnboardingMilestone]:
        """Create first week milestones"""
        return [
            OnboardingMilestone(
                milestone_id=self._generate_id("week1_training"),
                title="Initial Training Sessions",
                description="Complete foundational training",
                milestone_type=MilestoneType.TRAINING,
                phase=OnboardingPhase.FIRST_WEEK,
                due_date=(datetime.now() + timedelta(days=5)).isoformat(),
                completion_criteria=["Core systems training", "Security training", "Tools overview"]
            ),
            OnboardingMilestone(
                milestone_id=self._generate_id("week1_meetings"),
                title="Key Stakeholder Meetings",
                description="Meet with key team members and stakeholders",
                milestone_type=MilestoneType.RELATIONSHIP_BUILDING,
                phase=OnboardingPhase.FIRST_WEEK,
                due_date=(datetime.now() + timedelta(days=5)).isoformat(),
                completion_criteria=["Manager 1:1", "Team meeting", "Department overview"]
            )
        ]

    def _create_first_month_milestones(self, role: str, department: str) -> List[OnboardingMilestone]:
        """Create first month milestones"""
        return [
            OnboardingMilestone(
                milestone_id=self._generate_id("month1_project"),
                title="First Project Assignment",
                description="Complete first meaningful project contribution",
                milestone_type=MilestoneType.ROLE_SPECIFIC,
                phase=OnboardingPhase.FIRST_MONTH,
                due_date=(datetime.now() + timedelta(days=30)).isoformat(),
                completion_criteria=["Project assigned", "Initial contribution made", "Feedback received"]
            ),
            OnboardingMilestone(
                milestone_id=self._generate_id("month1_review"),
                title="30-Day Review",
                description="First formal progress review",
                milestone_type=MilestoneType.PERFORMANCE,
                phase=OnboardingPhase.FIRST_MONTH,
                due_date=(datetime.now() + timedelta(days=30)).isoformat(),
                completion_criteria=["Review meeting held", "Feedback documented", "Goals adjusted"]
            )
        ]

    def _create_first_quarter_milestones(self, role: str, department: str) -> List[OnboardingMilestone]:
        """Create first quarter milestones"""
        return [
            OnboardingMilestone(
                milestone_id=self._generate_id("q1_mastery"),
                title="Role Mastery Demonstration",
                description="Demonstrate proficiency in core role responsibilities",
                milestone_type=MilestoneType.PERFORMANCE,
                phase=OnboardingPhase.FIRST_QUARTER,
                due_date=(datetime.now() + timedelta(days=90)).isoformat(),
                completion_criteria=["Core competencies achieved", "Independent work demonstrated"]
            ),
            OnboardingMilestone(
                milestone_id=self._generate_id("q1_final"),
                title="90-Day Review and Completion",
                description="Final onboarding review and transition",
                milestone_type=MilestoneType.PERFORMANCE,
                phase=OnboardingPhase.FIRST_QUARTER,
                due_date=(datetime.now() + timedelta(days=90)).isoformat(),
                completion_criteria=["All milestones completed", "Performance goals met", "Full team integration"]
            )
        ]

    def _create_custom_milestones(self, requirements: List[str]) -> List[OnboardingMilestone]:
        """Create custom milestones"""
        return [
            OnboardingMilestone(
                milestone_id=self._generate_id(f"custom_{i}"),
                title=req,
                description=f"Custom requirement: {req}",
                milestone_type=MilestoneType.ROLE_SPECIFIC,
                phase=OnboardingPhase.FIRST_MONTH,
                due_date=(datetime.now() + timedelta(days=30)).isoformat(),
                completion_criteria=[req]
            )
            for i, req in enumerate(requirements)
        ]

    def _create_onboarding_checklists(self, role: str, department: str) -> List[OnboardingChecklist]:
        """Create onboarding checklists"""
        return [
            OnboardingChecklist(
                checklist_id=self._generate_id("checklist_admin"),
                title="Administrative Setup",
                category="administrative",
                items=[
                    {"item": "Complete I-9 form", "completed": False},
                    {"item": "Setup direct deposit", "completed": False},
                    {"item": "Review benefits package", "completed": False},
                    {"item": "Sign NDA and policies", "completed": False}
                ]
            ),
            OnboardingChecklist(
                checklist_id=self._generate_id("checklist_tech"),
                title="Technical Setup",
                category="technical",
                items=[
                    {"item": "Laptop received and configured", "completed": False},
                    {"item": "Email account active", "completed": False},
                    {"item": "VPN access setup", "completed": False},
                    {"item": "Development tools installed", "completed": False}
                ]
            ),
            OnboardingChecklist(
                checklist_id=self._generate_id("checklist_training"),
                title="Training Completion",
                category="training",
                items=[
                    {"item": "Security training", "completed": False},
                    {"item": "Company overview", "completed": False},
                    {"item": "Role-specific training", "completed": False},
                    {"item": "Tool proficiency", "completed": False}
                ]
            )
        ]

    def _define_success_criteria(self, role: str, duration_days: int) -> Dict[str, Any]:
        """Define onboarding success criteria"""
        return {
            "milestone_completion": "100% of required milestones",
            "performance_goals": "Achieves 30/60/90 day goals",
            "integration": "Successfully integrated into team",
            "feedback_score": "4.0+ satisfaction rating",
            "retention": "Remains employed after onboarding period"
        }

    def _identify_stakeholders(self, role: str, department: str) -> List[Dict[str, str]]:
        """Identify onboarding stakeholders"""
        return [
            {"role": "Hiring Manager", "responsibility": "Overall success and performance"},
            {"role": "HR Coordinator", "responsibility": "Administrative and compliance"},
            {"role": "Buddy", "responsibility": "Day-to-day support and questions"},
            {"role": "IT Support", "responsibility": "Technical setup and access"},
            {"role": "Department Head", "responsibility": "Department integration"}
        ]

    def _generate_program_timeline(
        self,
        milestones: List[OnboardingMilestone],
        duration_days: int
    ) -> List[Dict[str, Any]]:
        """Generate visual timeline of program"""
        timeline = []

        phases = [OnboardingPhase.PREBOARDING, OnboardingPhase.FIRST_DAY,
                 OnboardingPhase.FIRST_WEEK, OnboardingPhase.FIRST_MONTH,
                 OnboardingPhase.FIRST_QUARTER]

        for phase in phases:
            phase_milestones = [m for m in milestones if m.phase == phase]

            if phase_milestones:
                timeline.append({
                    "phase": phase.value,
                    "milestone_count": len(phase_milestones),
                    "key_activities": [m.title for m in phase_milestones[:3]],
                    "duration": self._estimate_phase_duration(phase)
                })

        return timeline

    def _estimate_phase_duration(self, phase: OnboardingPhase) -> str:
        """Estimate phase duration"""
        duration_map = {
            OnboardingPhase.PREBOARDING: "1-2 weeks before start",
            OnboardingPhase.FIRST_DAY: "Day 1",
            OnboardingPhase.FIRST_WEEK: "Days 1-7",
            OnboardingPhase.FIRST_MONTH: "Days 8-30",
            OnboardingPhase.FIRST_QUARTER: "Days 31-90"
        }
        return duration_map.get(phase, "Variable")

    def _create_resource_package(self, role: str, department: str) -> Dict[str, List[str]]:
        """Create resource package"""
        return {
            "documentation": [
                "Employee Handbook",
                "Department Overview",
                "Role Playbook",
                "Company Values Guide"
            ],
            "training_materials": [
                f"{role} Training Curriculum",
                "Tools and Systems Guide",
                "Best Practices Documentation"
            ],
            "templates": [
                "Project Templates",
                "Communication Templates",
                "Reporting Templates"
            ]
        }

    def _estimate_prep_time(self, milestones: List[OnboardingMilestone]) -> Dict[str, float]:
        """Estimate preparation time"""
        return {
            "hr_hours": len([m for m in milestones if m.milestone_type == MilestoneType.ADMINISTRATIVE]) * 0.5,
            "it_hours": len([m for m in milestones if m.milestone_type == MilestoneType.TECHNICAL_SETUP]) * 1.0,
            "manager_hours": len([m for m in milestones if m.milestone_type in [MilestoneType.PERFORMANCE, MilestoneType.ROLE_SPECIFIC]]) * 1.5
        }

    def _create_30_day_goals(self, role: str, department: str) -> List[str]:
        """Create 30-day goals"""
        return [
            "Complete all administrative and technical setup",
            "Understand company mission, values, and culture",
            "Learn core tools and systems",
            "Build relationships with immediate team",
            "Shadow team members to understand workflows",
            "Complete initial training modules"
        ]

    def _create_60_day_goals(self, role: str, department: str) -> List[str]:
        """Create 60-day goals"""
        return [
            "Take ownership of first project or responsibility",
            "Demonstrate proficiency in 50% of core job functions",
            "Expand network beyond immediate team",
            "Contribute ideas in team meetings",
            "Identify one process improvement opportunity",
            "Complete role-specific training"
        ]

    def _create_90_day_goals(self, role: str, department: str) -> List[str]:
        """Create 90-day goals"""
        return [
            "Independently manage assigned responsibilities",
            "Demonstrate proficiency in 80%+ of core job functions",
            "Build cross-functional relationships",
            "Complete first significant project deliverable",
            "Provide input on team strategies",
            "Achieve full productivity in role"
        ]

    def _define_learning_objectives(self, role: str) -> List[str]:
        """Define learning objectives"""
        return [
            f"Master {role}-specific tools and technologies",
            "Understand department processes and workflows",
            "Learn company products and services",
            "Develop knowledge of industry and market",
            "Build expertise in assigned focus areas"
        ]

    def _define_relationship_goals(self, role: str, department: str) -> List[Dict[str, str]]:
        """Define relationship building goals"""
        return [
            {"stakeholder": "Manager", "goal": "Weekly 1:1s, clear communication"},
            {"stakeholder": "Team Members", "goal": "Build working relationships with all team members"},
            {"stakeholder": "Buddy", "goal": "Regular check-ins for support"},
            {"stakeholder": "Cross-functional", "goal": "Connect with key partners in other departments"},
            {"stakeholder": "Leadership", "goal": "Meet department and company leaders"}
        ]

    def _define_performance_metrics(self, role: str) -> Dict[str, Any]:
        """Define performance metrics"""
        return {
            "productivity": "Achieve 100% productivity by day 90",
            "quality": "Meet quality standards for deliverables",
            "collaboration": "Positive feedback from team",
            "learning_velocity": "Complete training on schedule",
            "cultural_fit": "Demonstrate company values"
        }

    def _create_weekly_breakdown(self, plan: First90DaysPlan, start_date: str) -> List[Dict[str, Any]]:
        """Create week-by-week breakdown"""
        start_dt = datetime.fromisoformat(start_date)
        breakdown = []

        week_focuses = [
            "Orientation and setup",
            "Learning core systems",
            "Building relationships",
            "First contributions",
            "Expanding responsibilities",
            "Project ownership",
            "Independent work",
            "Cross-functional exposure",
            "Advanced skills",
            "Process improvement",
            "Strategic thinking",
            "Full integration"
        ]

        for week in range(12):
            week_start = start_dt + timedelta(weeks=week)
            breakdown.append({
                "week": week + 1,
                "start_date": week_start.isoformat(),
                "focus": week_focuses[week] if week < len(week_focuses) else "Continued growth",
                "key_activities": self._get_week_activities(week + 1)
            })

        return breakdown[:13]  # 90 days ~ 13 weeks

    def _get_week_activities(self, week: int) -> List[str]:
        """Get activities for specific week"""
        if week == 1:
            return ["Complete setup", "Meet team", "Start training"]
        elif week <= 4:
            return ["Continue training", "Shadow team members", "Learn processes"]
        elif week <= 8:
            return ["Begin project work", "Contribute to team", "Build relationships"]
        else:
            return ["Own responsibilities", "Drive projects", "Mentor others"]

    def _create_success_indicators(self, role: str) -> List[Dict[str, str]]:
        """Create success indicators"""
        return [
            {"indicator": "Engagement", "measure": "Active participation in meetings and discussions"},
            {"indicator": "Autonomy", "measure": "Asks fewer clarifying questions over time"},
            {"indicator": "Impact", "measure": "Delivers meaningful contributions"},
            {"indicator": "Relationships", "measure": "Built connections across team"},
            {"indicator": "Satisfaction", "measure": "Positive feedback in check-ins"}
        ]

    def _create_manager_guidance(self, role: str) -> Dict[str, List[str]]:
        """Create manager guidance"""
        return {
            "first_30_days": [
                "Meet daily for first week",
                "Provide clear expectations and goals",
                "Introduce to key stakeholders",
                "Assign initial learning activities"
            ],
            "days_31_60": [
                "Transition to weekly 1:1s",
                "Assign first project",
                "Provide regular feedback",
                "Support relationship building"
            ],
            "days_61_90": [
                "Focus on autonomy",
                "Increase responsibility",
                "Conduct formal review",
                "Plan beyond onboarding"
            ]
        }

    def _assign_buddy(self, role: str, department: str) -> str:
        """Assign onboarding buddy"""
        # Simplified buddy assignment
        return f"buddy_{role}_{hashlib.md5(department.encode()).hexdigest()[:6]}"

    def _assign_mentor(self, role: str) -> str:
        """Assign mentor"""
        return f"mentor_{role}_{hashlib.md5(role.encode()).hexdigest()[:6]}"

    def _needs_mentor(self, role: str) -> bool:
        """Determine if role needs mentor"""
        senior_roles = ["manager", "senior", "lead", "principal", "director"]
        return any(level in role.lower() for level in senior_roles)

    def _create_preboarding_activities(
        self,
        employee_name: str,
        role: str,
        start_date: str
    ) -> List[Dict[str, Any]]:
        """Create preboarding activities"""
        return [
            {
                "activity": "Send welcome email",
                "owner": "HR",
                "due_date": (datetime.fromisoformat(start_date) - timedelta(days=7)).isoformat(),
                "status": "pending"
            },
            {
                "activity": "Provision equipment",
                "owner": "IT",
                "due_date": (datetime.fromisoformat(start_date) - timedelta(days=3)).isoformat(),
                "status": "pending"
            },
            {
                "activity": "Setup workspace",
                "owner": "Operations",
                "due_date": (datetime.fromisoformat(start_date) - timedelta(days=1)).isoformat(),
                "status": "pending"
            }
        ]

    def _create_first_day_schedule(
        self,
        employee_name: str,
        role: str,
        department: str,
        manager: str,
        buddy: str
    ) -> List[Dict[str, str]]:
        """Create first day schedule"""
        return [
            {"time": "9:00 AM", "activity": "Welcome and HR orientation", "location": "Conference Room A"},
            {"time": "10:30 AM", "activity": f"Meet with {manager} (Manager)", "location": "Manager's office"},
            {"time": "11:30 AM", "activity": "Office tour and introductions", "location": "Office"},
            {"time": "12:30 PM", "activity": f"Lunch with {buddy} (Buddy)", "location": "Cafeteria"},
            {"time": "2:00 PM", "activity": "IT setup and training", "location": "IT Department"},
            {"time": "3:30 PM", "activity": "Team meeting", "location": "Team area"},
            {"time": "4:30 PM", "activity": "First day wrap-up", "location": "Desk"}
        ]

    def _setup_communication_plan(
        self,
        employee_name: str,
        start_date: str,
        manager: str,
        buddy: str
    ) -> Dict[str, Any]:
        """Setup communication plan"""
        return {
            "manager_1on1s": {
                "frequency": "Daily for week 1, then weekly",
                "duration": "30 minutes",
                "focus": "Goals, questions, feedback"
            },
            "buddy_check_ins": {
                "frequency": "Daily for month 1, then as needed",
                "duration": "15 minutes",
                "focus": "Day-to-day questions and support"
            },
            "team_meetings": {
                "frequency": "As per team schedule",
                "focus": "Team collaboration and updates"
            },
            "hr_check_ins": {
                "frequency": "Week 1, Month 1, Month 3",
                "focus": "Administrative needs and feedback"
            }
        }

    def _get_buddy_info(self, buddy_id: str) -> Dict[str, str]:
        """Get buddy information"""
        return {
            "buddy_id": buddy_id,
            "name": f"Buddy for {buddy_id}",
            "role": "Team Member",
            "responsibilities": "Day-to-day support, answer questions, social integration"
        }

    def _get_mentor_info(self, mentor_id: str) -> Dict[str, str]:
        """Get mentor information"""
        return {
            "mentor_id": mentor_id,
            "name": f"Mentor for {mentor_id}",
            "role": "Senior Leader",
            "responsibilities": "Career guidance, strategic thinking, professional development"
        }

    def _find_onboarding_by_employee(self, employee_id: str) -> Optional[EmployeeOnboarding]:
        """Find active onboarding for employee"""
        for onboarding in self.employee_onboardings.values():
            if onboarding.employee_id == employee_id and onboarding.status == "active":
                return onboarding
        return None

    def _update_milestones(
        self,
        program: OnboardingProgram,
        updates: List[Dict[str, Any]]
    ) -> None:
        """Update milestone statuses"""
        for update in updates:
            milestone_id = update.get("milestone_id")
            new_status = update.get("status")

            for milestone in program.milestones:
                if milestone.milestone_id == milestone_id:
                    milestone.status = OnboardingStatus(new_status)
                    if new_status == "completed":
                        milestone.completed_date = datetime.now().isoformat()

    def _calculate_progress(
        self,
        onboarding: EmployeeOnboarding,
        program: OnboardingProgram
    ) -> Dict[str, Any]:
        """Calculate onboarding progress"""
        total_milestones = len(program.milestones)
        completed_milestones = [
            m.milestone_id for m in program.milestones
            if m.status == OnboardingStatus.COMPLETED
        ]

        progress_by_phase = {}
        for phase in OnboardingPhase:
            phase_milestones = [m for m in program.milestones if m.phase == phase]
            if phase_milestones:
                phase_completed = len([m for m in phase_milestones if m.status == OnboardingStatus.COMPLETED])
                progress_by_phase[phase.value] = {
                    "total": len(phase_milestones),
                    "completed": phase_completed,
                    "percentage": (phase_completed / len(phase_milestones)) * 100
                }

        return {
            "overall_percentage": (len(completed_milestones) / total_milestones) * 100 if total_milestones > 0 else 0,
            "completed_milestones": completed_milestones,
            "total_milestones": total_milestones,
            "progress_by_phase": progress_by_phase
        }

    def _determine_current_phase(
        self,
        start_date: str,
        progress: Dict[str, Any]
    ) -> OnboardingPhase:
        """Determine current onboarding phase"""
        start_dt = datetime.fromisoformat(start_date)
        days_since_start = (datetime.now() - start_dt).days

        if days_since_start < 0:
            return OnboardingPhase.PREBOARDING
        elif days_since_start == 0:
            return OnboardingPhase.FIRST_DAY
        elif days_since_start <= 7:
            return OnboardingPhase.FIRST_WEEK
        elif days_since_start <= 30:
            return OnboardingPhase.FIRST_MONTH
        elif days_since_start <= 90:
            return OnboardingPhase.FIRST_QUARTER
        else:
            return OnboardingPhase.ONGOING

    def _identify_blockers(self, program: OnboardingProgram) -> List[Dict[str, Any]]:
        """Identify onboarding blockers"""
        blockers = []

        for milestone in program.milestones:
            if milestone.status == OnboardingStatus.BLOCKED:
                blockers.append({
                    "milestone_id": milestone.milestone_id,
                    "title": milestone.title,
                    "phase": milestone.phase.value,
                    "owner": milestone.owner
                })
            elif milestone.status == OnboardingStatus.OVERDUE:
                blockers.append({
                    "milestone_id": milestone.milestone_id,
                    "title": milestone.title,
                    "phase": milestone.phase.value,
                    "due_date": milestone.due_date,
                    "type": "overdue"
                })

        return blockers

    def _generate_progress_recommendations(
        self,
        onboarding: EmployeeOnboarding,
        progress: Dict[str, Any],
        blockers: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate progress recommendations"""
        recommendations = []

        if progress["overall_percentage"] < 30:
            recommendations.append("Schedule catch-up session with manager")

        if len(blockers) > 0:
            recommendations.append(f"Address {len(blockers)} blocked/overdue items")

        if progress["overall_percentage"] > 75:
            recommendations.append("Begin planning transition to regular employment")

        return recommendations

    def _check_achievements(
        self,
        onboarding: EmployeeOnboarding,
        program: OnboardingProgram
    ) -> List[str]:
        """Check for milestone achievements"""
        achievements = []

        # Check phase completions
        for phase in OnboardingPhase:
            phase_milestones = [m for m in program.milestones if m.phase == phase]
            if phase_milestones:
                all_completed = all(m.status == OnboardingStatus.COMPLETED for m in phase_milestones)
                if all_completed:
                    achievements.append(f"Completed {phase.value} phase")

        return achievements

    def _get_next_milestones(
        self,
        program: OnboardingProgram,
        progress: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Get next upcoming milestones"""
        incomplete = [
            m for m in program.milestones
            if m.status != OnboardingStatus.COMPLETED
        ]

        # Sort by due date
        incomplete.sort(key=lambda m: m.due_date)

        return [
            {
                "milestone_id": m.milestone_id,
                "title": m.title,
                "due_date": m.due_date,
                "phase": m.phase.value
            }
            for m in incomplete[:5]  # Next 5
        ]

    def _extract_action_items(self, feedback: Dict[str, Any]) -> List[str]:
        """Extract action items from feedback"""
        action_items = []

        concerns = feedback.get("concerns", [])
        for concern in concerns:
            action_items.append(f"Address: {concern}")

        improvements = feedback.get("suggested_improvements", [])
        action_items.extend(improvements)

        return action_items

    def _analyze_feedback_sentiment(self, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze feedback sentiment"""
        satisfaction = feedback.get("satisfaction_score", 3)

        return {
            "overall_sentiment": "positive" if satisfaction >= 4 else "neutral" if satisfaction >= 3 else "negative",
            "satisfaction_score": satisfaction,
            "key_themes": feedback.get("positive_themes", []),
            "concerns": feedback.get("concerns", [])
        }

    def _identify_concerns(self, feedback: Dict[str, Any]) -> List[str]:
        """Identify concerns from feedback"""
        return feedback.get("concerns", [])

    def _create_action_plan(
        self,
        concerns: List[str],
        onboarding: EmployeeOnboarding
    ) -> List[Dict[str, str]]:
        """Create action plan for concerns"""
        return [
            {
                "concern": concern,
                "action": f"Address with {onboarding.manager}",
                "owner": "Manager",
                "due_date": (datetime.now() + timedelta(days=3)).isoformat()
            }
            for concern in concerns
        ]

    def _prepare_stakeholder_updates(
        self,
        onboarding: EmployeeOnboarding,
        feedback_session: Dict[str, Any],
        concerns: List[str]
    ) -> Dict[str, str]:
        """Prepare stakeholder updates"""
        return {
            "manager": f"Check-in completed. {len(concerns)} concerns to address.",
            "hr": f"Feedback recorded for {onboarding.employee_name}",
            "buddy": "Continue regular check-ins and support"
        }

    def _schedule_next_check_in(
        self,
        check_in_type: str,
        onboarding: EmployeeOnboarding
    ) -> Dict[str, str]:
        """Schedule next check-in"""
        next_check_in_map = {
            "weekly": 7,
            "30_day": 30,
            "60_day": 30,
            "90_day": 30
        }

        days = next_check_in_map.get(check_in_type, 7)

        return {
            "type": check_in_type,
            "date": (datetime.now() + timedelta(days=days)).isoformat(),
            "attendees": [onboarding.manager, onboarding.employee_name]
        }

    def _create_integration_activities(
        self,
        integration_type: str,
        role: str,
        department: str
    ) -> List[Dict[str, Any]]:
        """Create integration activities"""
        activities = []

        if integration_type == "social":
            activities = [
                {"activity": "Team lunch", "frequency": "Weekly", "duration": "1 hour"},
                {"activity": "Coffee chats", "frequency": "2x per week", "duration": "30 min"},
                {"activity": "Team social event", "frequency": "Monthly", "duration": "2 hours"}
            ]
        elif integration_type == "cultural":
            activities = [
                {"activity": "Values workshop", "frequency": "Once", "duration": "2 hours"},
                {"activity": "All-hands meeting", "frequency": "Monthly", "duration": "1 hour"},
                {"activity": "Culture ambassador session", "frequency": "Quarterly", "duration": "1 hour"}
            ]

        return activities

    def _schedule_integration_activities(
        self,
        activities: List[Dict[str, Any]],
        start_date: str,
        duration_weeks: int
    ) -> List[Dict[str, Any]]:
        """Schedule integration activities"""
        start_dt = datetime.fromisoformat(start_date)
        schedule = []

        for week in range(duration_weeks):
            week_activities = []
            for activity in activities:
                if self._should_schedule_activity(activity, week):
                    week_activities.append({
                        "week": week + 1,
                        "activity": activity["activity"],
                        "date": (start_dt + timedelta(weeks=week)).isoformat()
                    })

            if week_activities:
                schedule.extend(week_activities)

        return schedule

    def _should_schedule_activity(self, activity: Dict[str, Any], week: int) -> bool:
        """Determine if activity should be scheduled"""
        frequency = activity.get("frequency", "")

        if "Weekly" in frequency:
            return True
        elif "Monthly" in frequency:
            return week % 4 == 0
        elif "Once" in frequency:
            return week == 0

        return False

    def _identify_connection_opportunities(
        self,
        role: str,
        department: str
    ) -> List[Dict[str, str]]:
        """Identify connection opportunities"""
        return [
            {"group": "Department team", "purpose": "Core collaboration"},
            {"group": "Cross-functional partners", "purpose": "Project collaboration"},
            {"group": "Interest groups", "purpose": "Social connection"},
            {"group": "Mentorship program", "purpose": "Professional development"}
        ]

    def _plan_team_introductions(
        self,
        employee_name: str,
        department: str
    ) -> List[Dict[str, str]]:
        """Plan team introductions"""
        return [
            {"stakeholder": "Direct team", "method": "Team meeting", "timing": "Day 1"},
            {"stakeholder": "Department", "method": "Department all-hands", "timing": "Week 1"},
            {"stakeholder": "Leadership", "method": "1:1 meetings", "timing": "Month 1"},
            {"stakeholder": "Cross-functional", "method": "Project meetings", "timing": "Month 2"}
        ]

    def _setup_cultural_immersion(self, employee_name: str) -> List[str]:
        """Setup cultural immersion activities"""
        return [
            "Attend company all-hands meeting",
            "Participate in culture committee event",
            "Join employee resource group",
            "Shadow different departments",
            "Attend values workshop"
        ]

    def _define_integration_metrics(self) -> Dict[str, str]:
        """Define integration success metrics"""
        return {
            "relationship_building": "Connected with 10+ colleagues",
            "engagement": "Attended 3+ company events",
            "cultural_alignment": "Can articulate company values",
            "network_size": "Built cross-functional connections"
        }

    def _verify_completion_criteria(
        self,
        onboarding: EmployeeOnboarding,
        program: OnboardingProgram,
        final_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verify onboarding completion criteria"""
        missing_items = []

        # Check milestone completion
        incomplete_milestones = [
            m for m in program.milestones
            if m.status != OnboardingStatus.COMPLETED
        ]

        if incomplete_milestones:
            missing_items.append(f"{len(incomplete_milestones)} milestones incomplete")

        # Check assessment score
        if final_assessment.get("score", 0) < 80:
            missing_items.append("Final assessment score below threshold")

        # Check progress
        if onboarding.overall_progress < 90:
            missing_items.append(f"Overall progress at {onboarding.overall_progress}%")

        return {
            "ready_to_complete": len(missing_items) == 0,
            "missing_items": missing_items,
            "recommendations": ["Complete all outstanding items before finalizing"]
        }

    def _generate_completion_report(
        self,
        onboarding: EmployeeOnboarding,
        program: OnboardingProgram,
        final_assessment: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate onboarding completion report"""
        return {
            "employee": onboarding.employee_name,
            "role": onboarding.role,
            "start_date": onboarding.start_date,
            "completion_date": datetime.now().isoformat(),
            "duration_days": (datetime.now() - datetime.fromisoformat(onboarding.start_date)).days,
            "milestones_completed": len(onboarding.milestones_completed),
            "final_assessment_score": final_assessment.get("score", 0),
            "manager_feedback": final_assessment.get("manager_feedback", ""),
            "employee_feedback": final_assessment.get("employee_feedback", ""),
            "recommendation": "Successfully completed onboarding program"
        }

    def _create_transition_plan(self, onboarding: EmployeeOnboarding) -> Dict[str, List[str]]:
        """Create transition plan from onboarding"""
        return {
            "immediate_next_steps": [
                "Begin regular performance review cycle",
                "Set quarterly goals",
                "Join ongoing development programs"
            ],
            "ongoing_support": [
                "Continue manager 1:1s",
                "Access to mentorship program",
                "Professional development opportunities"
            ],
            "success_indicators": [
                "Achieving performance goals",
                "Positive peer feedback",
                "Growing in role"
            ]
        }

    def _gather_lessons_learned(self, onboarding: EmployeeOnboarding) -> Dict[str, List[str]]:
        """Gather lessons learned"""
        return {
            "what_went_well": [
                "Structured onboarding program",
                "Buddy system effective",
                "Clear milestones"
            ],
            "areas_for_improvement": [
                "Earlier technical setup",
                "More cross-functional exposure",
                "Additional training time"
            ],
            "recommendations": [
                "Continue current buddy approach",
                "Enhance preboarding process",
                "Add more hands-on learning"
            ]
        }

    def _create_celebration_plan(self, onboarding: EmployeeOnboarding) -> Dict[str, str]:
        """Create celebration plan"""
        return {
            "recognition": "Send completion certificate",
            "team_celebration": "Team lunch to celebrate",
            "manager_acknowledgment": "1:1 recognition meeting",
            "company_wide": "Announcement in company newsletter"
        }

    def _define_ongoing_support(self, onboarding: EmployeeOnboarding) -> List[str]:
        """Define ongoing support beyond onboarding"""
        return [
            "Quarterly performance reviews",
            "Annual development planning",
            "Ongoing training opportunities",
            "Mentorship program access",
            "Career pathing discussions"
        ]

    def _generate_id(self, prefix: str) -> str:
        """Generate unique identifier"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        hash_suffix = hashlib.md5(f"{prefix}{timestamp}".encode()).hexdigest()[:8]
        return f"{prefix}_{hash_suffix}"

    def _add_to_history(self, operation: str, result: Dict[str, Any]) -> None:
        """Add operation to history"""
        self.history.append({
            "operation": operation,
            "timestamp": datetime.now().isoformat(),
            "status": result.get("status"),
            "summary": str(result.get("data", {}))[:200]
        })

    def _error_response(self, operation: str, error: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "operation": operation,
            "error": error,
            "data": {}
        }

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
            "programs_created": len(self.programs),
            "active_onboardings": len([o for o in self.employee_onboardings.values() if o.status == "active"]),
            "completed_onboardings": len([o for o in self.employee_onboardings.values() if o.status == "completed"])
        }

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive agent statistics"""
        return {
            "programs": len(self.programs),
            "active_onboardings": len([o for o in self.employee_onboardings.values() if o.status == "active"]),
            "completed_onboardings": len([o for o in self.employee_onboardings.values() if o.status == "completed"]),
            "ninety_day_plans": len(self.ninety_day_plans),
            "average_completion_rate": self._calculate_avg_completion_rate()
        }

    def _calculate_avg_completion_rate(self) -> float:
        """Calculate average onboarding completion rate"""
        if not self.employee_onboardings:
            return 0.0

        total_progress = sum(o.overall_progress for o in self.employee_onboardings.values())
        return total_progress / len(self.employee_onboardings)
