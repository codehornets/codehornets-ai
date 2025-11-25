"""
Training Specialist Agent

Develops and delivers training programs, learning paths, and skill development initiatives
using Bloom's Taxonomy, 70-20-10 framework, and evidence-based instructional design.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import json
import hashlib
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import re


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BloomLevel(Enum):
    """Bloom's Taxonomy cognitive levels"""
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"


class LearningModality(Enum):
    """Learning modalities based on 70-20-10 framework"""
    EXPERIENTIAL = "experiential"  # 70% - on-the-job
    SOCIAL = "social"              # 20% - coaching/mentoring
    FORMAL = "formal"              # 10% - courses/training


class DeliveryMethod(Enum):
    """Training delivery methods"""
    INSTRUCTOR_LED = "instructor_led"
    ELEARNING = "elearning"
    BLENDED = "blended"
    WORKSHOP = "workshop"
    WEBINAR = "webinar"
    MICROLEARNING = "microlearning"
    SIMULATION = "simulation"
    ON_THE_JOB = "on_the_job"


class AssessmentType(Enum):
    """Types of learning assessments"""
    FORMATIVE = "formative"        # During learning
    SUMMATIVE = "summative"        # End of learning
    DIAGNOSTIC = "diagnostic"      # Pre-learning
    PERFORMANCE = "performance"    # Applied skills
    PEER_REVIEW = "peer_review"    # Peer assessment


class SkillLevel(Enum):
    """Skill proficiency levels"""
    NOVICE = "novice"
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


@dataclass
class LearningObjective:
    """Learning objective with Bloom's taxonomy level"""
    objective_id: str
    description: str
    bloom_level: BloomLevel
    skill_area: str
    measurable_criteria: List[str]
    time_to_master: int  # hours
    prerequisites: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class TrainingModule:
    """Training module within a curriculum"""
    module_id: str
    title: str
    description: str
    learning_objectives: List[LearningObjective]
    modality: LearningModality
    delivery_method: DeliveryMethod
    duration_hours: float
    content_outline: List[str]
    resources: List[Dict[str, str]]
    assessments: List[Dict[str, Any]]
    sequence_order: int
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class TrainingCurriculum:
    """Complete training curriculum"""
    curriculum_id: str
    title: str
    description: str
    target_audience: str
    skill_level: SkillLevel
    modules: List[TrainingModule]
    total_duration_hours: float
    learning_path: List[str]  # Module IDs in sequence
    prerequisites: List[str]
    certification_available: bool
    version: str = "1.0"
    created_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class Assessment:
    """Learning assessment"""
    assessment_id: str
    title: str
    assessment_type: AssessmentType
    module_id: str
    questions: List[Dict[str, Any]]
    passing_score: float
    time_limit_minutes: Optional[int]
    max_attempts: int = 3
    bloom_levels_covered: List[BloomLevel] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class TrainingSession:
    """Scheduled training session"""
    session_id: str
    curriculum_id: str
    module_id: str
    facilitator: str
    participants: List[str]
    scheduled_start: str
    scheduled_end: str
    location: str
    delivery_method: DeliveryMethod
    capacity: int
    enrolled: int = 0
    status: str = "scheduled"  # scheduled, in_progress, completed, cancelled
    materials: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class TrainingEffectiveness:
    """Training effectiveness measurement (Kirkpatrick Model)"""
    measurement_id: str
    training_id: str
    participant_id: str
    level_1_reaction: Optional[float] = None  # Satisfaction (1-5)
    level_2_learning: Optional[float] = None  # Knowledge gain (%)
    level_3_behavior: Optional[float] = None  # Behavior change (1-5)
    level_4_results: Optional[Dict[str, Any]] = None  # Business impact
    measured_at: str = field(default_factory=lambda: datetime.now().isoformat())
    follow_up_dates: List[str] = field(default_factory=list)


class TrainingSpecialistAgent:
    """
    Training Specialist Agent responsible for training and development.

    Implements evidence-based instructional design using:
    - Bloom's Taxonomy for learning objectives
    - 70-20-10 framework for modality mix
    - Kirkpatrick Model for effectiveness measurement
    - ADDIE model for curriculum design

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        history (List[Dict]): History of operations
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Training Specialist Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "training_specialist_001"
        self.config = config or {}
        self.history: List[Dict[str, Any]] = []
        self.name = "Training Specialist"
        self.role = "Training and Development"

        # Training repository
        self.curricula: Dict[str, TrainingCurriculum] = {}
        self.modules: Dict[str, TrainingModule] = {}
        self.assessments: Dict[str, Assessment] = {}
        self.sessions: Dict[str, TrainingSession] = {}
        self.effectiveness_data: List[TrainingEffectiveness] = []

        # Skill taxonomy
        self.skill_taxonomy: Dict[str, List[str]] = {
            "technical": ["programming", "design", "data_analysis", "cloud", "devops"],
            "soft_skills": ["communication", "leadership", "teamwork", "problem_solving"],
            "business": ["strategy", "finance", "marketing", "sales", "operations"],
            "creative": ["design_thinking", "innovation", "storytelling", "branding"],
        }

        # Learning paths
        self.learning_paths: Dict[str, List[str]] = {}

        logger.info(f"Training Specialist Agent {self.agent_id} initialized")

    def assess_training_needs(
        self,
        department: str,
        skill_areas: List[str],
        current_competencies: Optional[Dict[str, float]] = None,
        target_competencies: Optional[Dict[str, float]] = None,
        business_goals: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Conduct comprehensive training needs assessment.

        Args:
            department: Department name
            skill_areas: Skills to assess
            current_competencies: Current skill levels (0-100)
            target_competencies: Target skill levels (0-100)
            business_goals: Business objectives to support

        Returns:
            Dictionary containing needs assessment results
        """
        try:
            logger.info(f"Assessing training needs for {department}")

            current_competencies = current_competencies or {}
            target_competencies = target_competencies or {}
            business_goals = business_goals or []

            # Calculate skill gaps
            skill_gaps = {}
            priority_areas = []

            for skill in skill_areas:
                current = current_competencies.get(skill, 0)
                target = target_competencies.get(skill, 70)  # Default target
                gap = target - current

                if gap > 0:
                    skill_gaps[skill] = {
                        "current_level": current,
                        "target_level": target,
                        "gap": gap,
                        "priority": self._calculate_priority(gap, business_goals, skill)
                    }

                    if gap >= 20:  # Significant gap
                        priority_areas.append(skill)

            # Recommend learning modalities using 70-20-10
            modality_recommendations = self._recommend_modalities(skill_gaps)

            # Estimate training investment
            investment = self._estimate_training_investment(skill_gaps)

            # Generate recommendations
            recommendations = self._generate_training_recommendations(
                skill_gaps,
                priority_areas,
                department
            )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "department": department,
                "data": {
                    "skill_gaps": skill_gaps,
                    "priority_areas": priority_areas,
                    "modality_recommendations": modality_recommendations,
                    "estimated_investment": investment,
                    "recommendations": recommendations,
                    "participants_estimated": self._estimate_participants(department)
                }
            }

            self._add_to_history("assess_training_needs", result)
            logger.info(f"Identified {len(skill_gaps)} skill gaps")

            return result

        except Exception as e:
            logger.error(f"Error assessing training needs: {str(e)}")
            return self._error_response("assess_training_needs", str(e))

    def design_curriculum(
        self,
        training_topic: str,
        target_audience: str,
        skill_level: str = "intermediate",
        duration_constraints: Optional[int] = None,
        learning_objectives_input: Optional[List[str]] = None,
        include_certification: bool = False
    ) -> Dict[str, Any]:
        """
        Design comprehensive training curriculum using ADDIE model.

        Args:
            training_topic: Main topic/skill area
            target_audience: Audience description
            skill_level: Target skill level
            duration_constraints: Maximum hours available
            learning_objectives_input: Custom learning objectives
            include_certification: Whether to include certification

        Returns:
            Dictionary containing curriculum design
        """
        try:
            logger.info(f"Designing curriculum for {training_topic}")

            curriculum_id = self._generate_id(f"curriculum_{training_topic}")

            # Define learning objectives using Bloom's taxonomy
            learning_objectives = self._define_learning_objectives(
                training_topic,
                skill_level,
                learning_objectives_input
            )

            # Design modules
            modules = self._design_modules(
                training_topic,
                learning_objectives,
                skill_level,
                duration_constraints
            )

            # Create learning path (module sequence)
            learning_path = self._create_learning_path(modules)

            # Calculate total duration
            total_duration = sum(m.duration_hours for m in modules)

            # Create curriculum
            curriculum = TrainingCurriculum(
                curriculum_id=curriculum_id,
                title=f"{training_topic.title()} Training Program",
                description=f"Comprehensive {skill_level}-level training for {target_audience}",
                target_audience=target_audience,
                skill_level=SkillLevel(skill_level),
                modules=modules,
                total_duration_hours=total_duration,
                learning_path=learning_path,
                prerequisites=self._identify_prerequisites(training_topic, skill_level),
                certification_available=include_certification,
                created_by=self.agent_id
            )

            # Store curriculum
            self.curricula[curriculum_id] = curriculum
            for module in modules:
                self.modules[module.module_id] = module

            # Generate assessments
            assessments = self._create_assessments(modules, curriculum_id)

            # Calculate 70-20-10 distribution
            modality_distribution = self._calculate_modality_distribution(modules)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "curriculum_id": curriculum_id,
                    "curriculum": asdict(curriculum),
                    "modules_count": len(modules),
                    "total_duration_hours": total_duration,
                    "learning_objectives_count": len(learning_objectives),
                    "assessments": [asdict(a) for a in assessments],
                    "modality_distribution": modality_distribution,
                    "completion_criteria": self._define_completion_criteria(curriculum),
                    "recommended_schedule": self._suggest_schedule(total_duration)
                }
            }

            self._add_to_history("design_curriculum", result)
            logger.info(f"Curriculum designed with {len(modules)} modules")

            return result

        except Exception as e:
            logger.error(f"Error designing curriculum: {str(e)}")
            return self._error_response("design_curriculum", str(e))

    def create_learning_path(
        self,
        role: str,
        skill_areas: List[str],
        time_horizon: str = "6_months",
        include_soft_skills: bool = True
    ) -> Dict[str, Any]:
        """
        Create personalized learning path for role development.

        Args:
            role: Job role/position
            skill_areas: Required skill areas
            time_horizon: Learning timeline
            include_soft_skills: Include soft skills

        Returns:
            Dictionary containing learning path
        """
        try:
            logger.info(f"Creating learning path for {role}")

            path_id = self._generate_id(f"path_{role}")

            # Map time horizon to months
            horizon_map = {
                "1_month": 1,
                "3_months": 3,
                "6_months": 6,
                "12_months": 12
            }
            months = horizon_map.get(time_horizon, 6)

            # Build skill progression
            skill_progression = self._build_skill_progression(
                skill_areas,
                include_soft_skills
            )

            # Create milestone-based path
            milestones = []
            current_month = 0

            for level, skills in skill_progression.items():
                milestone_duration = months // len(skill_progression)

                milestone = {
                    "milestone_id": self._generate_id(f"milestone_{level}"),
                    "level": level,
                    "skills": skills,
                    "month_start": current_month + 1,
                    "month_end": current_month + milestone_duration,
                    "curricula": [
                        self._find_or_create_curriculum(skill, level)
                        for skill in skills
                    ],
                    "assessments": [
                        f"assessment_{skill}_{level}"
                        for skill in skills
                    ]
                }

                milestones.append(milestone)
                current_month += milestone_duration

            # Calculate total learning hours
            total_hours = self._calculate_path_hours(milestones)

            # Generate recommended schedule
            schedule = self._generate_learning_schedule(milestones, months)

            # Store learning path
            self.learning_paths[path_id] = [m["milestone_id"] for m in milestones]

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "path_id": path_id,
                    "role": role,
                    "duration_months": months,
                    "milestones": milestones,
                    "total_learning_hours": total_hours,
                    "weekly_commitment_hours": round(total_hours / (months * 4), 1),
                    "schedule": schedule,
                    "progress_checkpoints": self._define_checkpoints(milestones)
                }
            }

            self._add_to_history("create_learning_path", result)
            logger.info(f"Learning path created with {len(milestones)} milestones")

            return result

        except Exception as e:
            logger.error(f"Error creating learning path: {str(e)}")
            return self._error_response("create_learning_path", str(e))

    def create_assessment(
        self,
        module_id: str,
        assessment_type: str,
        bloom_levels: Optional[List[str]] = None,
        question_count: int = 10,
        include_scenarios: bool = True
    ) -> Dict[str, Any]:
        """
        Create comprehensive assessment for learning module.

        Args:
            module_id: Module to assess
            assessment_type: Type of assessment
            bloom_levels: Cognitive levels to test
            question_count: Number of questions
            include_scenarios: Include scenario-based questions

        Returns:
            Dictionary containing assessment
        """
        try:
            logger.info(f"Creating assessment for module {module_id}")

            if module_id not in self.modules:
                raise ValueError(f"Module {module_id} not found")

            module = self.modules[module_id]
            assessment_id = self._generate_id(f"assessment_{module_id}")

            # Default to multiple Bloom levels if not specified
            if not bloom_levels:
                bloom_levels = ["understand", "apply", "analyze"]

            bloom_level_enums = [BloomLevel(level) for level in bloom_levels]

            # Generate questions based on Bloom's taxonomy
            questions = self._generate_assessment_questions(
                module,
                bloom_level_enums,
                question_count,
                include_scenarios
            )

            # Create assessment
            assessment = Assessment(
                assessment_id=assessment_id,
                title=f"{module.title} - {assessment_type.title()} Assessment",
                assessment_type=AssessmentType(assessment_type),
                module_id=module_id,
                questions=questions,
                passing_score=self._calculate_passing_score(assessment_type),
                time_limit_minutes=self._calculate_time_limit(question_count),
                bloom_levels_covered=bloom_level_enums
            )

            # Store assessment
            self.assessments[assessment_id] = assessment

            # Generate rubric
            rubric = self._create_assessment_rubric(assessment)

            # Create answer key (for internal use)
            answer_key = self._generate_answer_key(questions)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "assessment_id": assessment_id,
                    "assessment": asdict(assessment),
                    "rubric": rubric,
                    "question_distribution": self._analyze_question_distribution(questions),
                    "estimated_completion_time": assessment.time_limit_minutes,
                    "difficulty_level": self._calculate_difficulty(bloom_level_enums),
                    "answer_key": answer_key  # Only for instructors
                }
            }

            self._add_to_history("create_assessment", result)
            logger.info(f"Assessment created with {len(questions)} questions")

            return result

        except Exception as e:
            logger.error(f"Error creating assessment: {str(e)}")
            return self._error_response("create_assessment", str(e))

    def schedule_training_session(
        self,
        curriculum_id: str,
        module_id: str,
        facilitator: str,
        start_datetime: str,
        location: str,
        capacity: int = 20,
        delivery_method: str = "instructor_led"
    ) -> Dict[str, Any]:
        """
        Schedule training session.

        Args:
            curriculum_id: Curriculum ID
            module_id: Module to deliver
            facilitator: Instructor/facilitator name
            start_datetime: Session start time
            location: Physical or virtual location
            capacity: Maximum participants
            delivery_method: Delivery method

        Returns:
            Dictionary containing session details
        """
        try:
            logger.info(f"Scheduling training session for module {module_id}")

            if module_id not in self.modules:
                raise ValueError(f"Module {module_id} not found")

            module = self.modules[module_id]
            session_id = self._generate_id(f"session_{module_id}")

            # Calculate end time
            start_dt = datetime.fromisoformat(start_datetime)
            end_dt = start_dt + timedelta(hours=module.duration_hours)

            # Create session
            session = TrainingSession(
                session_id=session_id,
                curriculum_id=curriculum_id,
                module_id=module_id,
                facilitator=facilitator,
                participants=[],
                scheduled_start=start_datetime,
                scheduled_end=end_dt.isoformat(),
                location=location,
                delivery_method=DeliveryMethod(delivery_method),
                capacity=capacity,
                materials=self._prepare_session_materials(module)
            )

            # Store session
            self.sessions[session_id] = session

            # Generate facilitator guide
            facilitator_guide = self._create_facilitator_guide(module, session)

            # Create participant checklist
            participant_checklist = self._create_participant_checklist(module)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "session_id": session_id,
                    "session": asdict(session),
                    "facilitator_guide": facilitator_guide,
                    "participant_checklist": participant_checklist,
                    "pre_work": self._assign_pre_work(module),
                    "post_work": self._assign_post_work(module)
                }
            }

            self._add_to_history("schedule_training_session", result)
            logger.info(f"Session {session_id} scheduled")

            return result

        except Exception as e:
            logger.error(f"Error scheduling session: {str(e)}")
            return self._error_response("schedule_training_session", str(e))

    def measure_training_effectiveness(
        self,
        training_id: str,
        participants: List[str],
        kirkpatrick_levels: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Measure training effectiveness using Kirkpatrick's Four Levels.

        Args:
            training_id: Training session or curriculum ID
            participants: List of participant IDs
            kirkpatrick_levels: Levels to measure (1-4)

        Returns:
            Dictionary containing effectiveness metrics
        """
        try:
            logger.info(f"Measuring effectiveness for training {training_id}")

            kirkpatrick_levels = kirkpatrick_levels or [1, 2, 3, 4]

            effectiveness_results = {
                "training_id": training_id,
                "participants_count": len(participants),
                "measurement_date": datetime.now().isoformat(),
                "levels": {}
            }

            # Level 1: Reaction (participant satisfaction)
            if 1 in kirkpatrick_levels:
                level_1 = self._measure_reaction(training_id, participants)
                effectiveness_results["levels"]["level_1_reaction"] = level_1

            # Level 2: Learning (knowledge/skill acquisition)
            if 2 in kirkpatrick_levels:
                level_2 = self._measure_learning(training_id, participants)
                effectiveness_results["levels"]["level_2_learning"] = level_2

            # Level 3: Behavior (on-the-job application)
            if 3 in kirkpatrick_levels:
                level_3 = self._measure_behavior(training_id, participants)
                effectiveness_results["levels"]["level_3_behavior"] = level_3

            # Level 4: Results (business impact)
            if 4 in kirkpatrick_levels:
                level_4 = self._measure_results(training_id, participants)
                effectiveness_results["levels"]["level_4_results"] = level_4

            # Calculate overall effectiveness score
            overall_score = self._calculate_overall_effectiveness(
                effectiveness_results["levels"]
            )

            # Generate recommendations
            recommendations = self._generate_improvement_recommendations(
                effectiveness_results
            )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "effectiveness_results": effectiveness_results,
                    "overall_score": overall_score,
                    "recommendations": recommendations,
                    "follow_up_schedule": self._create_follow_up_schedule()
                }
            }

            self._add_to_history("measure_training_effectiveness", result)
            logger.info(f"Effectiveness measured: {overall_score:.1f}%")

            return result

        except Exception as e:
            logger.error(f"Error measuring effectiveness: {str(e)}")
            return self._error_response("measure_training_effectiveness", str(e))

    def deliver_microlearning(
        self,
        topic: str,
        duration_minutes: int = 5,
        target_bloom_level: str = "apply",
        format_type: str = "video"
    ) -> Dict[str, Any]:
        """
        Create microlearning content for just-in-time learning.

        Args:
            topic: Learning topic
            duration_minutes: Content duration
            target_bloom_level: Bloom's taxonomy level
            format_type: Content format

        Returns:
            Dictionary containing microlearning content
        """
        try:
            logger.info(f"Creating microlearning content for {topic}")

            content_id = self._generate_id(f"micro_{topic}")

            # Create focused learning objective
            objective = LearningObjective(
                objective_id=self._generate_id(f"obj_{topic}"),
                description=f"Apply {topic} in practical scenarios",
                bloom_level=BloomLevel(target_bloom_level),
                skill_area=topic,
                measurable_criteria=[
                    f"Demonstrate understanding of {topic}",
                    f"Apply {topic} to solve a problem"
                ],
                time_to_master=duration_minutes / 60
            )

            # Design microlearning content
            content = {
                "content_id": content_id,
                "topic": topic,
                "format": format_type,
                "duration_minutes": duration_minutes,
                "learning_objective": asdict(objective),
                "content_outline": self._create_micro_outline(topic, duration_minutes),
                "key_takeaways": self._extract_key_takeaways(topic),
                "practice_activity": self._create_micro_activity(topic),
                "assessment_question": self._create_quick_check(topic, target_bloom_level)
            }

            # Add to knowledge reinforcement schedule
            reinforcement = self._create_spaced_repetition_schedule(content_id)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "data": {
                    "microlearning_content": content,
                    "reinforcement_schedule": reinforcement,
                    "recommended_context": self._suggest_learning_context(topic)
                }
            }

            self._add_to_history("deliver_microlearning", result)
            logger.info(f"Microlearning content created: {content_id}")

            return result

        except Exception as e:
            logger.error(f"Error creating microlearning: {str(e)}")
            return self._error_response("deliver_microlearning", str(e))

    # Helper methods

    def _calculate_priority(
        self,
        gap: float,
        business_goals: List[str],
        skill: str
    ) -> str:
        """Calculate training priority level"""
        if gap >= 30 or any(goal.lower() in skill.lower() for goal in business_goals):
            return "critical"
        elif gap >= 20:
            return "high"
        elif gap >= 10:
            return "medium"
        return "low"

    def _recommend_modalities(self, skill_gaps: Dict[str, Any]) -> Dict[str, float]:
        """Recommend learning modality distribution using 70-20-10"""
        return {
            "experiential": 70,  # On-the-job learning
            "social": 20,        # Coaching and mentoring
            "formal": 10         # Structured training
        }

    def _estimate_training_investment(self, skill_gaps: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate training investment required"""
        total_hours = sum(gap["gap"] * 2 for gap in skill_gaps.values())  # 2 hours per gap point

        return {
            "total_training_hours": round(total_hours, 1),
            "estimated_cost_per_person": round(total_hours * 150, 2),  # $150/hour average
            "timeline_weeks": round(total_hours / 5, 1)  # 5 hours per week
        }

    def _generate_training_recommendations(
        self,
        skill_gaps: Dict[str, Any],
        priority_areas: List[str],
        department: str
    ) -> List[str]:
        """Generate training recommendations"""
        recommendations = []

        for skill in priority_areas[:3]:  # Top 3 priorities
            gap_info = skill_gaps[skill]
            recommendations.append(
                f"Implement {skill} training program (Gap: {gap_info['gap']}%)"
            )

        recommendations.append(f"Establish 70-20-10 learning approach for {department}")
        recommendations.append("Create role-based learning paths")

        return recommendations

    def _estimate_participants(self, department: str) -> int:
        """Estimate number of participants"""
        # Simplified estimation
        dept_sizes = {
            "engineering": 50,
            "sales": 30,
            "marketing": 25,
            "operations": 40
        }
        return dept_sizes.get(department.lower(), 20)

    def _define_learning_objectives(
        self,
        topic: str,
        skill_level: str,
        custom_objectives: Optional[List[str]]
    ) -> List[LearningObjective]:
        """Define learning objectives using Bloom's taxonomy"""
        objectives = []

        # Map skill level to Bloom levels
        level_mapping = {
            "novice": [BloomLevel.REMEMBER, BloomLevel.UNDERSTAND],
            "beginner": [BloomLevel.UNDERSTAND, BloomLevel.APPLY],
            "intermediate": [BloomLevel.APPLY, BloomLevel.ANALYZE],
            "advanced": [BloomLevel.ANALYZE, BloomLevel.EVALUATE],
            "expert": [BloomLevel.EVALUATE, BloomLevel.CREATE]
        }

        bloom_levels = level_mapping.get(skill_level, [BloomLevel.APPLY])

        for i, bloom_level in enumerate(bloom_levels):
            objective = LearningObjective(
                objective_id=self._generate_id(f"obj_{topic}_{i}"),
                description=f"{bloom_level.value.title()} key concepts in {topic}",
                bloom_level=bloom_level,
                skill_area=topic,
                measurable_criteria=[
                    f"Complete assessment at {bloom_level.value} level",
                    f"Demonstrate {bloom_level.value} through practical application"
                ],
                time_to_master=2 + i  # Progressive complexity
            )
            objectives.append(objective)

        return objectives

    def _design_modules(
        self,
        topic: str,
        learning_objectives: List[LearningObjective],
        skill_level: str,
        duration_constraints: Optional[int]
    ) -> List[TrainingModule]:
        """Design training modules"""
        modules = []

        # Module structure based on 70-20-10
        module_templates = [
            {
                "title": f"Introduction to {topic}",
                "modality": LearningModality.FORMAL,
                "delivery": DeliveryMethod.ELEARNING,
                "percentage": 10
            },
            {
                "title": f"{topic} - Collaborative Learning",
                "modality": LearningModality.SOCIAL,
                "delivery": DeliveryMethod.WORKSHOP,
                "percentage": 20
            },
            {
                "title": f"{topic} - Practical Application",
                "modality": LearningModality.EXPERIENTIAL,
                "delivery": DeliveryMethod.ON_THE_JOB,
                "percentage": 70
            }
        ]

        total_duration = duration_constraints or 40  # Default 40 hours

        for i, template in enumerate(module_templates):
            module_duration = (template["percentage"] / 100) * total_duration

            module = TrainingModule(
                module_id=self._generate_id(f"module_{topic}_{i}"),
                title=template["title"],
                description=f"{template['title']} module",
                learning_objectives=learning_objectives,
                modality=template["modality"],
                delivery_method=template["delivery"],
                duration_hours=module_duration,
                content_outline=self._create_content_outline(topic, template["modality"]),
                resources=self._gather_resources(topic),
                assessments=[],
                sequence_order=i
            )
            modules.append(module)

        return modules

    def _create_content_outline(
        self,
        topic: str,
        modality: LearningModality
    ) -> List[str]:
        """Create content outline based on modality"""
        if modality == LearningModality.FORMAL:
            return [
                f"Introduction to {topic}",
                "Core concepts and principles",
                "Key terminology",
                "Theoretical foundations",
                "Knowledge check"
            ]
        elif modality == LearningModality.SOCIAL:
            return [
                "Peer discussions",
                "Case study analysis",
                "Group problem-solving",
                "Expert Q&A session",
                "Collaborative project"
            ]
        else:  # EXPERIENTIAL
            return [
                "Real-world project assignment",
                "Hands-on practice",
                "Performance feedback",
                "Iterative improvement",
                "Final project presentation"
            ]

    def _gather_resources(self, topic: str) -> List[Dict[str, str]]:
        """Gather learning resources"""
        return [
            {"type": "reading", "title": f"{topic} - Core Concepts", "url": f"https://learning.example.com/{topic}"},
            {"type": "video", "title": f"{topic} Tutorial Series", "url": f"https://videos.example.com/{topic}"},
            {"type": "practice", "title": f"{topic} Lab Environment", "url": f"https://labs.example.com/{topic}"}
        ]

    def _create_learning_path(self, modules: List[TrainingModule]) -> List[str]:
        """Create optimal learning path"""
        # Sort by sequence order
        sorted_modules = sorted(modules, key=lambda m: m.sequence_order)
        return [m.module_id for m in sorted_modules]

    def _identify_prerequisites(self, topic: str, skill_level: str) -> List[str]:
        """Identify course prerequisites"""
        if skill_level in ["advanced", "expert"]:
            return [f"Intermediate {topic}", "Relevant industry experience"]
        elif skill_level == "intermediate":
            return [f"Basic {topic}"]
        return []

    def _create_assessments(
        self,
        modules: List[TrainingModule],
        curriculum_id: str
    ) -> List[Assessment]:
        """Create assessments for modules"""
        assessments = []

        for module in modules:
            assessment = Assessment(
                assessment_id=self._generate_id(f"assess_{module.module_id}"),
                title=f"{module.title} Assessment",
                assessment_type=AssessmentType.SUMMATIVE,
                module_id=module.module_id,
                questions=self._generate_assessment_questions(
                    module,
                    [obj.bloom_level for obj in module.learning_objectives],
                    10,
                    True
                ),
                passing_score=75.0,
                time_limit_minutes=30
            )
            assessments.append(assessment)
            self.assessments[assessment.assessment_id] = assessment

        return assessments

    def _generate_assessment_questions(
        self,
        module: TrainingModule,
        bloom_levels: List[BloomLevel],
        count: int,
        include_scenarios: bool
    ) -> List[Dict[str, Any]]:
        """Generate assessment questions based on Bloom's taxonomy"""
        questions = []
        questions_per_level = count // len(bloom_levels)

        for bloom_level in bloom_levels:
            for i in range(questions_per_level):
                question = {
                    "question_id": self._generate_id(f"q_{module.module_id}_{i}"),
                    "bloom_level": bloom_level.value,
                    "question_text": self._generate_question_text(module.title, bloom_level),
                    "question_type": self._select_question_type(bloom_level),
                    "points": self._assign_points(bloom_level),
                    "options": self._generate_options(bloom_level) if bloom_level in [BloomLevel.REMEMBER, BloomLevel.UNDERSTAND] else None,
                    "correct_answer": "answer_placeholder",
                    "explanation": f"This tests {bloom_level.value} level understanding"
                }
                questions.append(question)

        if include_scenarios and len(questions) < count:
            scenario_question = self._create_scenario_question(module)
            questions.append(scenario_question)

        return questions

    def _generate_question_text(self, topic: str, bloom_level: BloomLevel) -> str:
        """Generate question text based on Bloom level"""
        verbs = {
            BloomLevel.REMEMBER: "Define",
            BloomLevel.UNDERSTAND: "Explain",
            BloomLevel.APPLY: "Apply",
            BloomLevel.ANALYZE: "Analyze",
            BloomLevel.EVALUATE: "Evaluate",
            BloomLevel.CREATE: "Design"
        }
        verb = verbs.get(bloom_level, "Describe")
        return f"{verb} the key concepts of {topic}"

    def _select_question_type(self, bloom_level: BloomLevel) -> str:
        """Select appropriate question type"""
        if bloom_level in [BloomLevel.REMEMBER, BloomLevel.UNDERSTAND]:
            return "multiple_choice"
        elif bloom_level == BloomLevel.APPLY:
            return "practical_exercise"
        elif bloom_level == BloomLevel.ANALYZE:
            return "case_study"
        else:
            return "project_based"

    def _assign_points(self, bloom_level: BloomLevel) -> int:
        """Assign points based on complexity"""
        point_map = {
            BloomLevel.REMEMBER: 1,
            BloomLevel.UNDERSTAND: 2,
            BloomLevel.APPLY: 3,
            BloomLevel.ANALYZE: 4,
            BloomLevel.EVALUATE: 5,
            BloomLevel.CREATE: 6
        }
        return point_map.get(bloom_level, 3)

    def _generate_options(self, bloom_level: BloomLevel) -> List[str]:
        """Generate multiple choice options"""
        return ["Option A", "Option B", "Option C", "Option D"]

    def _create_scenario_question(self, module: TrainingModule) -> Dict[str, Any]:
        """Create scenario-based question"""
        return {
            "question_id": self._generate_id(f"scenario_{module.module_id}"),
            "bloom_level": "apply",
            "question_text": f"Given a real-world scenario involving {module.title}, how would you approach it?",
            "question_type": "scenario",
            "points": 10,
            "scenario_description": f"You are working on a project that requires {module.title}...",
            "required_deliverables": ["Analysis", "Recommendation", "Implementation plan"]
        }

    def _calculate_modality_distribution(
        self,
        modules: List[TrainingModule]
    ) -> Dict[str, float]:
        """Calculate 70-20-10 distribution"""
        total_hours = sum(m.duration_hours for m in modules)
        distribution = defaultdict(float)

        for module in modules:
            percentage = (module.duration_hours / total_hours) * 100
            distribution[module.modality.value] += percentage

        return dict(distribution)

    def _define_completion_criteria(self, curriculum: TrainingCurriculum) -> Dict[str, Any]:
        """Define curriculum completion criteria"""
        return {
            "required_modules": len(curriculum.modules),
            "minimum_attendance": "80%",
            "minimum_assessment_score": 75.0,
            "practical_projects": 1,
            "peer_reviews": 2
        }

    def _suggest_schedule(self, total_hours: float) -> Dict[str, Any]:
        """Suggest training schedule"""
        weeks = max(int(total_hours / 5), 4)  # At least 4 weeks

        return {
            "duration_weeks": weeks,
            "hours_per_week": round(total_hours / weeks, 1),
            "recommended_pace": "2-3 sessions per week",
            "buffer_time": "1 week for review and assessments"
        }

    def _build_skill_progression(
        self,
        skill_areas: List[str],
        include_soft_skills: bool
    ) -> Dict[str, List[str]]:
        """Build skill progression levels"""
        progression = {
            "foundation": [],
            "intermediate": [],
            "advanced": [],
            "mastery": []
        }

        for skill in skill_areas:
            progression["foundation"].append(f"{skill}_basics")
            progression["intermediate"].append(f"{skill}_practical")
            progression["advanced"].append(f"{skill}_advanced")
            progression["mastery"].append(f"{skill}_expert")

        if include_soft_skills:
            progression["foundation"].append("communication_basics")
            progression["intermediate"].append("collaboration")
            progression["advanced"].append("leadership")

        return progression

    def _find_or_create_curriculum(self, skill: str, level: str) -> str:
        """Find existing or create new curriculum"""
        curriculum_id = f"curriculum_{skill}_{level}"

        # Check if exists
        if curriculum_id not in self.curricula:
            # Would create curriculum here
            pass

        return curriculum_id

    def _calculate_path_hours(self, milestones: List[Dict[str, Any]]) -> float:
        """Calculate total learning path hours"""
        # Estimate 20 hours per milestone
        return len(milestones) * 20

    def _generate_learning_schedule(
        self,
        milestones: List[Dict[str, Any]],
        months: int
    ) -> List[Dict[str, Any]]:
        """Generate detailed learning schedule"""
        schedule = []

        for milestone in milestones:
            schedule.append({
                "period": f"Months {milestone['month_start']}-{milestone['month_end']}",
                "focus": milestone["level"],
                "activities": [
                    "Complete assigned modules",
                    "Practice exercises",
                    "Peer collaboration",
                    "Assessment"
                ]
            })

        return schedule

    def _define_checkpoints(self, milestones: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Define progress checkpoints"""
        return [
            {
                "checkpoint": f"Milestone {i+1}",
                "timing": f"Month {m['month_end']}",
                "criteria": ["Complete assessments", "Demonstrate skills", "Peer review"]
            }
            for i, m in enumerate(milestones)
        ]

    def _calculate_passing_score(self, assessment_type: str) -> float:
        """Calculate appropriate passing score"""
        score_map = {
            "diagnostic": 0.0,  # No passing score
            "formative": 60.0,
            "summative": 75.0,
            "performance": 80.0,
            "peer_review": 70.0
        }
        return score_map.get(assessment_type, 75.0)

    def _calculate_time_limit(self, question_count: int) -> int:
        """Calculate assessment time limit"""
        return question_count * 3  # 3 minutes per question

    def _create_assessment_rubric(self, assessment: Assessment) -> Dict[str, Any]:
        """Create assessment rubric"""
        return {
            "assessment_id": assessment.assessment_id,
            "total_points": len(assessment.questions) * 5,
            "grading_scale": {
                "A": "90-100%",
                "B": "80-89%",
                "C": "70-79%",
                "D": "60-69%",
                "F": "Below 60%"
            },
            "performance_levels": {
                "exemplary": "Demonstrates mastery",
                "proficient": "Meets expectations",
                "developing": "Needs improvement",
                "beginning": "Requires additional support"
            }
        }

    def _generate_answer_key(self, questions: List[Dict[str, Any]]) -> Dict[str, str]:
        """Generate answer key (internal use only)"""
        return {
            q["question_id"]: q.get("correct_answer", "See rubric")
            for q in questions
        }

    def _analyze_question_distribution(
        self,
        questions: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Analyze question distribution by Bloom level"""
        distribution = defaultdict(int)

        for q in questions:
            bloom_level = q.get("bloom_level", "unknown")
            distribution[bloom_level] += 1

        return dict(distribution)

    def _calculate_difficulty(self, bloom_levels: List[BloomLevel]) -> str:
        """Calculate overall difficulty level"""
        avg_level = sum(
            list(BloomLevel).index(level) for level in bloom_levels
        ) / len(bloom_levels)

        if avg_level < 2:
            return "beginner"
        elif avg_level < 4:
            return "intermediate"
        else:
            return "advanced"

    def _prepare_session_materials(self, module: TrainingModule) -> List[str]:
        """Prepare materials for training session"""
        return [
            f"{module.title} - Slide Deck",
            f"{module.title} - Participant Workbook",
            f"{module.title} - Exercise Files",
            "Assessment Materials",
            "Reference Guide"
        ]

    def _create_facilitator_guide(
        self,
        module: TrainingModule,
        session: TrainingSession
    ) -> Dict[str, Any]:
        """Create facilitator guide"""
        return {
            "session_overview": {
                "duration": module.duration_hours,
                "learning_objectives": [obj.description for obj in module.learning_objectives],
                "delivery_method": session.delivery_method.value
            },
            "session_outline": module.content_outline,
            "facilitation_tips": [
                "Encourage participant engagement",
                "Use real-world examples",
                "Check for understanding frequently"
            ],
            "timing_guide": self._create_timing_guide(module),
            "materials_checklist": session.materials
        }

    def _create_timing_guide(self, module: TrainingModule) -> List[Dict[str, Any]]:
        """Create timing guide for session"""
        total_minutes = module.duration_hours * 60
        sections = len(module.content_outline)
        minutes_per_section = total_minutes // sections

        guide = []
        current_time = 0

        for section in module.content_outline:
            guide.append({
                "section": section,
                "start_time": f"{current_time // 60}:{current_time % 60:02d}",
                "duration_minutes": minutes_per_section
            })
            current_time += minutes_per_section

        return guide

    def _create_participant_checklist(self, module: TrainingModule) -> List[str]:
        """Create participant checklist"""
        return [
            "Complete pre-work assignments",
            "Review learning objectives",
            "Prepare questions",
            "Bring required materials",
            "Complete post-session assessment"
        ]

    def _assign_pre_work(self, module: TrainingModule) -> List[Dict[str, str]]:
        """Assign pre-work for module"""
        return [
            {
                "task": f"Read: {module.title} Overview",
                "estimated_time": "30 minutes",
                "type": "reading"
            },
            {
                "task": "Complete diagnostic assessment",
                "estimated_time": "15 minutes",
                "type": "assessment"
            }
        ]

    def _assign_post_work(self, module: TrainingModule) -> List[Dict[str, str]]:
        """Assign post-work for module"""
        return [
            {
                "task": "Practice exercises",
                "estimated_time": "2 hours",
                "type": "practice"
            },
            {
                "task": "Submit reflection",
                "estimated_time": "30 minutes",
                "type": "reflection"
            }
        ]

    def _measure_reaction(self, training_id: str, participants: List[str]) -> Dict[str, Any]:
        """Measure Level 1: Reaction"""
        # Simulate survey results
        return {
            "average_satisfaction": 4.2,
            "response_rate": 85,
            "would_recommend": 80,
            "key_feedback": [
                "Excellent practical examples",
                "Well-paced delivery",
                "Would like more hands-on time"
            ]
        }

    def _measure_learning(self, training_id: str, participants: List[str]) -> Dict[str, Any]:
        """Measure Level 2: Learning"""
        return {
            "average_pre_score": 45.0,
            "average_post_score": 82.0,
            "knowledge_gain": 37.0,
            "competency_improvement": "82% of participants achieved proficiency"
        }

    def _measure_behavior(self, training_id: str, participants: List[str]) -> Dict[str, Any]:
        """Measure Level 3: Behavior"""
        return {
            "application_rate": 75,
            "manager_observed_change": 70,
            "sustained_after_30_days": 65,
            "barriers_identified": ["Time constraints", "Limited opportunities"]
        }

    def _measure_results(self, training_id: str, participants: List[str]) -> Dict[str, Any]:
        """Measure Level 4: Results"""
        return {
            "productivity_increase": 15,
            "quality_improvement": 20,
            "cost_reduction": 10,
            "roi_percentage": 250,
            "business_metrics": {
                "projects_completed": "+12%",
                "error_rate": "-25%",
                "time_to_completion": "-18%"
            }
        }

    def _calculate_overall_effectiveness(self, levels: Dict[str, Any]) -> float:
        """Calculate overall effectiveness score"""
        scores = []

        if "level_1_reaction" in levels:
            scores.append(levels["level_1_reaction"].get("average_satisfaction", 0) * 20)
        if "level_2_learning" in levels:
            scores.append(levels["level_2_learning"].get("knowledge_gain", 0))
        if "level_3_behavior" in levels:
            scores.append(levels["level_3_behavior"].get("application_rate", 0))
        if "level_4_results" in levels:
            scores.append(levels["level_4_results"].get("productivity_increase", 0) * 5)

        return sum(scores) / len(scores) if scores else 0

    def _generate_improvement_recommendations(
        self,
        effectiveness_results: Dict[str, Any]
    ) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []

        levels = effectiveness_results.get("levels", {})

        if "level_1_reaction" in levels:
            if levels["level_1_reaction"]["average_satisfaction"] < 4.0:
                recommendations.append("Improve training delivery and engagement")

        if "level_2_learning" in levels:
            if levels["level_2_learning"]["knowledge_gain"] < 30:
                recommendations.append("Enhance instructional methods and practice opportunities")

        if "level_3_behavior" in levels:
            if levels["level_3_behavior"]["application_rate"] < 70:
                recommendations.append("Add post-training support and reinforcement")

        return recommendations

    def _create_follow_up_schedule(self) -> List[Dict[str, str]]:
        """Create follow-up measurement schedule"""
        return [
            {"timing": "Immediately post-training", "measure": "Level 1 - Reaction"},
            {"timing": "End of training", "measure": "Level 2 - Learning"},
            {"timing": "30 days post-training", "measure": "Level 3 - Behavior"},
            {"timing": "90 days post-training", "measure": "Level 4 - Results"}
        ]

    def _create_micro_outline(self, topic: str, duration: int) -> List[str]:
        """Create microlearning content outline"""
        return [
            f"Quick intro: {topic} (1 min)",
            f"Key concept demonstration (2 min)",
            f"Practical application ({duration - 4} min)",
            "Quick check (1 min)"
        ]

    def _extract_key_takeaways(self, topic: str) -> List[str]:
        """Extract key takeaways"""
        return [
            f"Core principle of {topic}",
            f"When to apply {topic}",
            f"Common pitfall to avoid"
        ]

    def _create_micro_activity(self, topic: str) -> Dict[str, str]:
        """Create microlearning practice activity"""
        return {
            "activity": f"Apply {topic} to your current project",
            "time": "5 minutes",
            "deliverable": "Brief written reflection"
        }

    def _create_quick_check(self, topic: str, bloom_level: str) -> Dict[str, Any]:
        """Create quick knowledge check"""
        return {
            "question": f"How would you apply {topic} in this scenario?",
            "type": "scenario",
            "bloom_level": bloom_level,
            "time_limit": "2 minutes"
        }

    def _create_spaced_repetition_schedule(self, content_id: str) -> List[str]:
        """Create spaced repetition schedule"""
        now = datetime.now()
        return [
            (now + timedelta(days=1)).isoformat(),
            (now + timedelta(days=3)).isoformat(),
            (now + timedelta(days=7)).isoformat(),
            (now + timedelta(days=14)).isoformat(),
            (now + timedelta(days=30)).isoformat()
        ]

    def _suggest_learning_context(self, topic: str) -> str:
        """Suggest optimal learning context"""
        return f"Best consumed during actual {topic} work for immediate application"

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
            "summary": str(result.get("data", {}))[200]  # First 200 chars
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
            "curricula_created": len(self.curricula),
            "assessments_created": len(self.assessments),
            "sessions_scheduled": len(self.sessions)
        }

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive agent statistics"""
        return {
            "curricula": {
                "total": len(self.curricula),
                "by_level": self._count_by_attribute(self.curricula.values(), "skill_level")
            },
            "modules": {
                "total": len(self.modules),
                "by_modality": self._count_by_attribute(self.modules.values(), "modality")
            },
            "assessments": {
                "total": len(self.assessments),
                "by_type": self._count_by_attribute(self.assessments.values(), "assessment_type")
            },
            "sessions": {
                "total": len(self.sessions),
                "by_status": self._count_by_attribute(self.sessions.values(), "status")
            }
        }

    def _count_by_attribute(
        self,
        items: Any,
        attribute: str
    ) -> Dict[str, int]:
        """Count items by attribute value"""
        counts = defaultdict(int)
        for item in items:
            value = getattr(item, attribute, "unknown")
            if isinstance(value, Enum):
                value = value.value
            counts[str(value)] += 1
        return dict(counts)
