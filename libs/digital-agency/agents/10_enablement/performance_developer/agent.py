"""
Certification Designer Agent

Designs and manages professional certification programs with competency frameworks,
digital badges, skills validation, and credential management.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import json
import hashlib
import random
from dataclasses import dataclass, field, asdict
from collections import defaultdict


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SkillLevel(Enum):
    """Skill proficiency levels based on Dreyfus model"""
    NOVICE = "novice"
    ADVANCED_BEGINNER = "advanced_beginner"
    COMPETENT = "competent"
    PROFICIENT = "proficient"
    EXPERT = "expert"


class AssessmentFormat(Enum):
    """Assessment format types"""
    MULTIPLE_CHOICE = "multiple_choice"
    PRACTICAL_EXERCISE = "practical_exercise"
    PORTFOLIO_REVIEW = "portfolio_review"
    CASE_STUDY = "case_study"
    SIMULATION = "simulation"
    ORAL_EXAM = "oral_exam"
    WRITTEN_EXAM = "written_exam"


class BadgeType(Enum):
    """Digital badge types"""
    SKILL_BADGE = "skill_badge"
    CERTIFICATION = "certification"
    MICRO_CREDENTIAL = "micro_credential"
    ACHIEVEMENT = "achievement"
    COMPLETION = "completion"


class CertificationStatus(Enum):
    """Certification status"""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    PENDING = "pending"
    SUSPENDED = "suspended"


@dataclass
class Competency:
    """Competency definition with skill levels"""
    competency_id: str
    name: str
    description: str
    domain: str
    skill_level: SkillLevel
    prerequisites: List[str] = field(default_factory=list)
    behavioral_indicators: List[str] = field(default_factory=list)
    assessment_criteria: List[Dict[str, Any]] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class Assessment:
    """Assessment definition"""
    assessment_id: str
    title: str
    description: str
    format: AssessmentFormat
    competencies_assessed: List[str]
    questions: List[Dict[str, Any]]
    passing_score: float
    time_limit_minutes: int
    randomize_questions: bool
    max_attempts: int
    proctoring_required: bool
    rubric: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class DigitalBadge:
    """Digital badge following Open Badges standard"""
    badge_id: str
    name: str
    description: str
    image_url: str
    criteria_url: str
    issuer: Dict[str, str]
    badge_type: BadgeType
    competencies: List[str]
    validity_period_days: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class CertificationPath:
    """Certification path with prerequisites"""
    path_id: str
    name: str
    description: str
    target_role: str
    competencies_required: List[str]
    assessments_required: List[str]
    prerequisites: List[str] = field(default_factory=list)
    estimated_duration_hours: int = 0
    capstone_project: Optional[Dict[str, Any]] = None
    badge_awarded: Optional[str] = None
    renewal_period_months: int = 24
    continuing_education_required: bool = True
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class Credential:
    """Issued credential"""
    credential_id: str
    recipient_id: str
    certification_path_id: str
    badge_id: str
    status: CertificationStatus
    issue_date: str
    expiry_date: Optional[str] = None
    verification_url: str = ""
    continuing_education_credits: float = 0.0
    last_renewed: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class AssessmentResult:
    """Assessment result with scoring"""
    result_id: str
    assessment_id: str
    learner_id: str
    score: float
    passed: bool
    attempt_number: int
    time_taken_minutes: int
    answers: List[Dict[str, Any]]
    rubric_scores: Dict[str, float] = field(default_factory=dict)
    feedback: str = ""
    proctor_notes: str = ""
    completed_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ProctoringRules:
    """Exam proctoring configuration"""
    rules_id: str
    assessment_id: str
    time_limit_enforced: bool
    randomize_questions: bool
    randomize_answers: bool
    show_correct_answers: bool
    allow_review: bool
    passing_score: float
    max_attempts: int
    lockdown_browser: bool
    webcam_required: bool
    screen_recording: bool
    metadata: Dict[str, Any] = field(default_factory=dict)


class CertificationDesignerAgent:
    """
    Certification Designer Agent responsible for certification program design and management.

    Implements comprehensive certification programs with:
    - Competency frameworks (5-level Dreyfus model)
    - Multi-format assessments
    - Digital badge systems (Open Badges standard)
    - Certification paths with prerequisites
    - Skills validation and rubric scoring
    - Credential lifecycle management
    - Exam proctoring rules
    - Renewal and continuing education tracking
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Certification Designer Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "certification_designer_001"
        self.config = config or {}
        self.history: List[Dict[str, Any]] = []
        self.name = "Certification Designer"
        self.role = "Certification Program Design and Management"

        # Repositories
        self.competencies: Dict[str, Competency] = {}
        self.assessments: Dict[str, Assessment] = {}
        self.digital_badges: Dict[str, DigitalBadge] = {}
        self.certification_paths: Dict[str, CertificationPath] = {}
        self.credentials: Dict[str, Credential] = {}
        self.assessment_results: Dict[str, List[AssessmentResult]] = defaultdict(list)
        self.proctoring_rules: Dict[str, ProctoringRules] = {}

        # Analytics
        self.completion_rates: Dict[str, float] = {}
        self.average_scores: Dict[str, float] = {}

        logger.info(f"Initialized {self.name} agent: {self.agent_id}")

    def design_competency_framework(
        self,
        domain: str,
        role: str,
        skill_areas: List[str]
    ) -> Dict[str, Any]:
        """
        Design competency framework using 5-level Dreyfus model.

        Args:
            domain: Competency domain
            role: Target role
            skill_areas: List of skill areas to cover

        Returns:
            Dictionary containing framework design
        """
        try:
            logger.info(f"Designing competency framework for {role} in {domain}")

            framework_id = self._generate_id("framework")
            competencies_created = []

            # Create competencies for each skill area across all levels
            for skill_area in skill_areas:
                for level in SkillLevel:
                    competency = self._create_competency(
                        skill_area=skill_area,
                        level=level,
                        domain=domain,
                        role=role
                    )
                    self.competencies[competency.competency_id] = competency
                    competencies_created.append(competency.competency_id)

            # Build competency hierarchy
            hierarchy = self._build_competency_hierarchy(competencies_created)

            # Generate learning paths
            learning_paths = self._generate_learning_paths(competencies_created, skill_areas)

            # Calculate framework metrics
            metrics = self._calculate_framework_metrics(framework_id)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "framework_id": framework_id,
                "domain": domain,
                "role": role,
                "competencies_created": len(competencies_created),
                "competency_ids": competencies_created,
                "hierarchy": hierarchy,
                "learning_paths": learning_paths,
                "metrics": metrics,
                "recommendations": self._generate_framework_recommendations(metrics)
            }

            self._log_operation("design_competency_framework", result)
            return result

        except Exception as e:
            logger.error(f"Error designing competency framework: {str(e)}")
            return self._create_error_result(str(e))

    def create_assessment(
        self,
        title: str,
        format: AssessmentFormat,
        competencies: List[str],
        difficulty: str = "intermediate"
    ) -> Dict[str, Any]:
        """
        Create multi-format assessment.

        Args:
            title: Assessment title
            format: Assessment format
            competencies: List of competency IDs to assess
            difficulty: Difficulty level

        Returns:
            Dictionary containing assessment details
        """
        try:
            logger.info(f"Creating {format.value} assessment: {title}")

            # Generate questions based on format
            questions = self._generate_questions(format, competencies, difficulty)

            # Create rubric for scoring
            rubric = self._create_assessment_rubric(format, competencies)

            # Determine proctoring requirements
            proctoring_required = format in [
                AssessmentFormat.WRITTEN_EXAM,
                AssessmentFormat.ORAL_EXAM
            ]

            # Create assessment
            assessment = Assessment(
                assessment_id=self._generate_id("assessment"),
                title=title,
                description=f"{format.value} assessment covering {len(competencies)} competencies",
                format=format,
                competencies_assessed=competencies,
                questions=questions,
                passing_score=self._calculate_passing_score(format, difficulty),
                time_limit_minutes=self._calculate_time_limit(format, len(questions)),
                randomize_questions=True,
                max_attempts=3,
                proctoring_required=proctoring_required,
                rubric=rubric
            )

            self.assessments[assessment.assessment_id] = assessment

            # Configure proctoring rules
            proctoring = self._configure_proctoring(assessment)

            # Generate practice materials
            practice_materials = self._generate_practice_materials(assessment)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "assessment": asdict(assessment),
                "proctoring_rules": asdict(proctoring),
                "practice_materials": practice_materials,
                "estimated_completion_time": f"{assessment.time_limit_minutes} minutes",
                "preparation_tips": self._generate_preparation_tips(assessment)
            }

            self._log_operation("create_assessment", result)
            return result

        except Exception as e:
            logger.error(f"Error creating assessment: {str(e)}")
            return self._create_error_result(str(e))

    def issue_digital_badge(
        self,
        recipient_id: str,
        badge_name: str,
        competencies: List[str],
        badge_type: BadgeType = BadgeType.CERTIFICATION
    ) -> Dict[str, Any]:
        """
        Issue digital badge following Open Badges standard.

        Args:
            recipient_id: Recipient identifier
            badge_name: Badge name
            competencies: Competencies demonstrated
            badge_type: Type of badge

        Returns:
            Dictionary containing badge details
        """
        try:
            logger.info(f"Issuing {badge_type.value} badge to {recipient_id}")

            # Create or retrieve badge definition
            badge = self._create_badge_definition(badge_name, competencies, badge_type)

            # Generate Open Badges metadata
            open_badge_metadata = self._generate_open_badge_metadata(
                badge=badge,
                recipient_id=recipient_id
            )

            # Create credential
            credential = self._create_credential(
                recipient_id=recipient_id,
                badge_id=badge.badge_id
            )

            # Generate verification URL
            verification_url = self._generate_verification_url(credential)

            # Create badge assertion
            assertion = self._create_badge_assertion(
                badge=badge,
                recipient_id=recipient_id,
                verification_url=verification_url
            )

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "badge": asdict(badge),
                "credential_id": credential.credential_id,
                "recipient_id": recipient_id,
                "verification_url": verification_url,
                "open_badge_metadata": open_badge_metadata,
                "assertion": assertion,
                "social_sharing": self._generate_social_sharing_links(badge, credential)
            }

            self._log_operation("issue_digital_badge", result)
            return result

        except Exception as e:
            logger.error(f"Error issuing digital badge: {str(e)}")
            return self._create_error_result(str(e))

    def create_certification_path(
        self,
        name: str,
        target_role: str,
        competency_ids: List[str],
        include_capstone: bool = True
    ) -> Dict[str, Any]:
        """
        Create certification path with prerequisites and learning progression.

        Args:
            name: Certification path name
            target_role: Target role for certification
            competency_ids: Required competencies
            include_capstone: Whether to include capstone project

        Returns:
            Dictionary containing certification path details
        """
        try:
            logger.info(f"Creating certification path: {name}")

            # Determine prerequisites based on competency levels
            prerequisites = self._determine_prerequisites(competency_ids)

            # Create assessments for path
            assessments = self._create_path_assessments(competency_ids)

            # Design capstone project
            capstone = self._design_capstone_project(
                target_role, competency_ids
            ) if include_capstone else None

            # Create badge for path completion
            badge = self._create_badge_definition(
                name=f"{name} Certification",
                competencies=competency_ids,
                badge_type=BadgeType.CERTIFICATION
            )

            # Estimate duration
            duration = self._estimate_path_duration(competency_ids, assessments)

            # Create certification path
            path = CertificationPath(
                path_id=self._generate_id("path"),
                name=name,
                description=f"Certification path for {target_role}",
                target_role=target_role,
                competencies_required=competency_ids,
                assessments_required=[a["assessment_id"] for a in assessments],
                prerequisites=prerequisites,
                estimated_duration_hours=duration,
                capstone_project=capstone,
                badge_awarded=badge.badge_id,
                renewal_period_months=24,
                continuing_education_required=True
            )

            self.certification_paths[path.path_id] = path

            # Generate learning plan
            learning_plan = self._generate_learning_plan(path)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "certification_path": asdict(path),
                "badge": asdict(badge),
                "learning_plan": learning_plan,
                "prerequisites_map": self._create_prerequisites_map(path),
                "milestones": self._create_milestones(path),
                "estimated_completion": f"{duration} hours"
            }

            self._log_operation("create_certification_path", result)
            return result

        except Exception as e:
            logger.error(f"Error creating certification path: {str(e)}")
            return self._create_error_result(str(e))

    def validate_skills(
        self,
        learner_id: str,
        assessment_id: str,
        submission: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate skills using rubric-based scoring.

        Args:
            learner_id: Learner identifier
            assessment_id: Assessment identifier
            submission: Assessment submission data

        Returns:
            Dictionary containing validation results
        """
        try:
            logger.info(f"Validating skills for learner {learner_id}")

            if assessment_id not in self.assessments:
                raise ValueError(f"Assessment {assessment_id} not found")

            assessment = self.assessments[assessment_id]

            # Score submission using rubric
            rubric_scores = self._score_with_rubric(
                assessment=assessment,
                submission=submission
            )

            # Calculate overall score
            overall_score = self._calculate_overall_score(rubric_scores)

            # Determine pass/fail
            passed = overall_score >= assessment.passing_score

            # Generate detailed feedback
            feedback = self._generate_assessment_feedback(
                assessment=assessment,
                rubric_scores=rubric_scores,
                overall_score=overall_score
            )

            # Create assessment result
            attempt_number = len(self.assessment_results[learner_id]) + 1
            result_obj = AssessmentResult(
                result_id=self._generate_id("result"),
                assessment_id=assessment_id,
                learner_id=learner_id,
                score=overall_score,
                passed=passed,
                attempt_number=attempt_number,
                time_taken_minutes=submission.get("time_taken_minutes", 0),
                answers=submission.get("answers", []),
                rubric_scores=rubric_scores,
                feedback=feedback
            )

            self.assessment_results[learner_id].append(result_obj)

            # Update statistics
            self._update_assessment_statistics(assessment_id, overall_score, passed)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "assessment_result": asdict(result_obj),
                "competencies_validated": self._identify_validated_competencies(
                    assessment, rubric_scores
                ),
                "next_steps": self._suggest_next_steps(learner_id, passed, assessment),
                "performance_summary": self._create_performance_summary(rubric_scores)
            }

            self._log_operation("validate_skills", result)
            return result

        except Exception as e:
            logger.error(f"Error validating skills: {str(e)}")
            return self._create_error_result(str(e))

    def manage_credentials(
        self,
        operation: str,
        credential_id: Optional[str] = None,
        recipient_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Manage credential lifecycle (issue, renew, verify, revoke).

        Args:
            operation: Operation to perform (issue, renew, verify, revoke)
            credential_id: Credential identifier
            recipient_id: Recipient identifier

        Returns:
            Dictionary containing operation results
        """
        try:
            logger.info(f"Managing credentials: {operation}")

            result_data = {}

            if operation == "verify":
                if not credential_id:
                    raise ValueError("credential_id required for verification")
                result_data = self._verify_credential(credential_id)

            elif operation == "renew":
                if not credential_id:
                    raise ValueError("credential_id required for renewal")
                result_data = self._renew_credential(credential_id)

            elif operation == "revoke":
                if not credential_id:
                    raise ValueError("credential_id required for revocation")
                result_data = self._revoke_credential(credential_id)

            elif operation == "list":
                if not recipient_id:
                    raise ValueError("recipient_id required for listing")
                result_data = self._list_credentials(recipient_id)

            else:
                raise ValueError(f"Unknown operation: {operation}")

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "operation": operation,
                "data": result_data
            }

            self._log_operation("manage_credentials", result)
            return result

        except Exception as e:
            logger.error(f"Error managing credentials: {str(e)}")
            return self._create_error_result(str(e))

    def configure_proctoring(
        self,
        assessment_id: str,
        proctoring_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Configure exam proctoring rules.

        Args:
            assessment_id: Assessment identifier
            proctoring_config: Proctoring configuration

        Returns:
            Dictionary containing proctoring configuration
        """
        try:
            logger.info(f"Configuring proctoring for assessment {assessment_id}")

            if assessment_id not in self.assessments:
                raise ValueError(f"Assessment {assessment_id} not found")

            assessment = self.assessments[assessment_id]

            # Create proctoring rules
            rules = ProctoringRules(
                rules_id=self._generate_id("proctoring"),
                assessment_id=assessment_id,
                time_limit_enforced=proctoring_config.get("time_limit_enforced", True),
                randomize_questions=proctoring_config.get("randomize_questions", True),
                randomize_answers=proctoring_config.get("randomize_answers", True),
                show_correct_answers=proctoring_config.get("show_correct_answers", False),
                allow_review=proctoring_config.get("allow_review", True),
                passing_score=assessment.passing_score,
                max_attempts=proctoring_config.get("max_attempts", 3),
                lockdown_browser=proctoring_config.get("lockdown_browser", False),
                webcam_required=proctoring_config.get("webcam_required", False),
                screen_recording=proctoring_config.get("screen_recording", False)
            )

            self.proctoring_rules[assessment_id] = rules

            # Generate exam guidelines
            guidelines = self._generate_exam_guidelines(rules)

            # Create security measures
            security = self._create_security_measures(rules)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "proctoring_rules": asdict(rules),
                "exam_guidelines": guidelines,
                "security_measures": security,
                "technical_requirements": self._get_technical_requirements(rules)
            }

            self._log_operation("configure_proctoring", result)
            return result

        except Exception as e:
            logger.error(f"Error configuring proctoring: {str(e)}")
            return self._create_error_result(str(e))

    def track_renewal(
        self,
        credential_id: str,
        ce_credits: float,
        activity_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Track continuing education credits and renewal requirements.

        Args:
            credential_id: Credential identifier
            ce_credits: Continuing education credits earned
            activity_details: Details of CE activity

        Returns:
            Dictionary containing renewal tracking results
        """
        try:
            logger.info(f"Tracking renewal for credential {credential_id}")

            if credential_id not in self.credentials:
                raise ValueError(f"Credential {credential_id} not found")

            credential = self.credentials[credential_id]

            # Add CE credits
            credential.continuing_education_credits += ce_credits

            # Get certification path requirements
            path = self.certification_paths.get(credential.certification_path_id)
            if not path:
                raise ValueError(f"Certification path not found")

            # Calculate renewal requirements
            renewal_requirements = self._calculate_renewal_requirements(path)

            # Check if ready for renewal
            credits_needed = renewal_requirements["ce_credits_required"]
            current_credits = credential.continuing_education_credits
            ready_for_renewal = current_credits >= credits_needed

            # Calculate time to expiry
            time_to_expiry = self._calculate_time_to_expiry(credential)

            # Log CE activity
            ce_activity = {
                "activity_id": self._generate_id("ce_activity"),
                "credential_id": credential_id,
                "credits_earned": ce_credits,
                "activity_type": activity_details.get("type", "unknown"),
                "activity_name": activity_details.get("name", ""),
                "completion_date": datetime.now().isoformat()
            }

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "credential_id": credential_id,
                "ce_activity": ce_activity,
                "total_ce_credits": current_credits,
                "credits_required": credits_needed,
                "credits_remaining": max(0, credits_needed - current_credits),
                "ready_for_renewal": ready_for_renewal,
                "time_to_expiry": time_to_expiry,
                "renewal_requirements": renewal_requirements,
                "renewal_options": self._get_renewal_options(credential, path)
            }

            self._log_operation("track_renewal", result)
            return result

        except Exception as e:
            logger.error(f"Error tracking renewal: {str(e)}")
            return self._create_error_result(str(e))

    def _create_competency(
        self,
        skill_area: str,
        level: SkillLevel,
        domain: str,
        role: str
    ) -> Competency:
        """Create a competency definition"""
        behavioral_indicators = self._generate_behavioral_indicators(skill_area, level)
        assessment_criteria = self._generate_assessment_criteria(skill_area, level)

        competency = Competency(
            competency_id=self._generate_id("competency"),
            name=f"{skill_area} - {level.value.replace('_', ' ').title()}",
            description=f"{level.value.replace('_', ' ').title()} level {skill_area} for {role}",
            domain=domain,
            skill_level=level,
            behavioral_indicators=behavioral_indicators,
            assessment_criteria=assessment_criteria
        )

        # Add prerequisites (previous level)
        if level != SkillLevel.NOVICE:
            competency.prerequisites = [f"prerequisite_{skill_area}_{level.value}"]

        return competency

    def _generate_behavioral_indicators(self, skill_area: str, level: SkillLevel) -> List[str]:
        """Generate behavioral indicators for competency"""
        indicators_by_level = {
            SkillLevel.NOVICE: [
                f"Follows step-by-step instructions for {skill_area}",
                f"Recognizes basic {skill_area} concepts",
                f"Requires close supervision when performing {skill_area} tasks"
            ],
            SkillLevel.ADVANCED_BEGINNER: [
                f"Performs routine {skill_area} tasks independently",
                f"Recognizes recurring patterns in {skill_area}",
                f"Requires occasional guidance for complex {skill_area} situations"
            ],
            SkillLevel.COMPETENT: [
                f"Plans and executes {skill_area} tasks efficiently",
                f"Handles standard and complex {skill_area} situations",
                f"Makes informed decisions about {skill_area} approaches"
            ],
            SkillLevel.PROFICIENT: [
                f"Demonstrates deep understanding of {skill_area} principles",
                f"Adapts {skill_area} approaches to unique situations",
                f"Mentors others in {skill_area} development"
            ],
            SkillLevel.EXPERT: [
                f"Creates innovative {skill_area} solutions",
                f"Establishes {skill_area} standards and best practices",
                f"Recognized authority in {skill_area} domain"
            ]
        }
        return indicators_by_level.get(level, [])

    def _generate_assessment_criteria(self, skill_area: str, level: SkillLevel) -> List[Dict[str, Any]]:
        """Generate assessment criteria for competency"""
        return [
            {
                "criterion": f"Knowledge of {skill_area} concepts",
                "weight": 0.3,
                "measurement": "Written assessment"
            },
            {
                "criterion": f"Application of {skill_area} skills",
                "weight": 0.4,
                "measurement": "Practical exercise"
            },
            {
                "criterion": f"Problem-solving in {skill_area}",
                "weight": 0.3,
                "measurement": "Case study analysis"
            }
        ]

    def _build_competency_hierarchy(self, competency_ids: List[str]) -> Dict[str, Any]:
        """Build hierarchical competency structure"""
        hierarchy = {
            "levels": {level.value: [] for level in SkillLevel},
            "total_competencies": len(competency_ids),
            "progression_paths": []
        }

        for comp_id in competency_ids:
            if comp_id in self.competencies:
                comp = self.competencies[comp_id]
                hierarchy["levels"][comp.skill_level.value].append({
                    "competency_id": comp_id,
                    "name": comp.name,
                    "prerequisites": comp.prerequisites
                })

        return hierarchy

    def _generate_learning_paths(
        self,
        competency_ids: List[str],
        skill_areas: List[str]
    ) -> List[Dict[str, Any]]:
        """Generate learning paths through competencies"""
        paths = []

        for skill_area in skill_areas:
            path_competencies = [
                comp_id for comp_id in competency_ids
                if skill_area in self.competencies[comp_id].name
            ]

            paths.append({
                "skill_area": skill_area,
                "competencies": path_competencies,
                "estimated_duration": len(path_competencies) * 20,  # hours
                "progression": [level.value for level in SkillLevel]
            })

        return paths

    def _calculate_framework_metrics(self, framework_id: str) -> Dict[str, Any]:
        """Calculate competency framework metrics"""
        return {
            "total_competencies": len(self.competencies),
            "competencies_by_level": {
                level.value: sum(1 for c in self.competencies.values() if c.skill_level == level)
                for level in SkillLevel
            },
            "average_indicators_per_competency": (
                sum(len(c.behavioral_indicators) for c in self.competencies.values()) /
                len(self.competencies) if self.competencies else 0
            )
        }

    def _generate_framework_recommendations(self, metrics: Dict[str, Any]) -> List[str]:
        """Generate recommendations for framework improvement"""
        recommendations = []

        by_level = metrics.get("competencies_by_level", {})
        if by_level:
            max_count = max(by_level.values())
            min_count = min(by_level.values())

            if max_count > min_count * 2:
                recommendations.append("Consider balancing competencies across skill levels")

        avg_indicators = metrics.get("average_indicators_per_competency", 0)
        if avg_indicators < 3:
            recommendations.append("Add more behavioral indicators to improve clarity")

        return recommendations

    def _generate_questions(
        self,
        format: AssessmentFormat,
        competency_ids: List[str],
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """Generate assessment questions based on format"""
        questions = []
        question_count = self._get_question_count(format)

        for i in range(question_count):
            if format == AssessmentFormat.MULTIPLE_CHOICE:
                questions.append(self._create_mcq_question(competency_ids, difficulty, i))
            elif format == AssessmentFormat.PRACTICAL_EXERCISE:
                questions.append(self._create_practical_question(competency_ids, difficulty, i))
            elif format == AssessmentFormat.PORTFOLIO_REVIEW:
                questions.append(self._create_portfolio_question(competency_ids, i))
            elif format == AssessmentFormat.CASE_STUDY:
                questions.append(self._create_case_study_question(competency_ids, i))
            else:
                questions.append(self._create_generic_question(format, competency_ids, i))

        return questions

    def _get_question_count(self, format: AssessmentFormat) -> int:
        """Determine number of questions based on format"""
        counts = {
            AssessmentFormat.MULTIPLE_CHOICE: 20,
            AssessmentFormat.PRACTICAL_EXERCISE: 5,
            AssessmentFormat.PORTFOLIO_REVIEW: 3,
            AssessmentFormat.CASE_STUDY: 2,
            AssessmentFormat.SIMULATION: 3,
            AssessmentFormat.ORAL_EXAM: 8,
            AssessmentFormat.WRITTEN_EXAM: 10
        }
        return counts.get(format, 10)

    def _create_mcq_question(
        self,
        competency_ids: List[str],
        difficulty: str,
        index: int
    ) -> Dict[str, Any]:
        """Create multiple choice question"""
        return {
            "question_id": self._generate_id(f"q{index}"),
            "type": "multiple_choice",
            "question_text": f"Question {index + 1}: Which approach best demonstrates competency?",
            "options": [
                {"id": "A", "text": "Option A"},
                {"id": "B", "text": "Option B"},
                {"id": "C", "text": "Option C"},
                {"id": "D", "text": "Option D"}
            ],
            "correct_answer": "B",
            "points": 5,
            "competency_assessed": competency_ids[0] if competency_ids else None
        }

    def _create_practical_question(
        self,
        competency_ids: List[str],
        difficulty: str,
        index: int
    ) -> Dict[str, Any]:
        """Create practical exercise question"""
        return {
            "question_id": self._generate_id(f"practical{index}"),
            "type": "practical_exercise",
            "description": f"Practical Exercise {index + 1}: Demonstrate skill application",
            "task": "Complete the practical task following best practices",
            "deliverables": [
                "Working solution",
                "Documentation",
                "Test results"
            ],
            "points": 20,
            "competency_assessed": competency_ids[0] if competency_ids else None
        }

    def _create_portfolio_question(
        self,
        competency_ids: List[str],
        index: int
    ) -> Dict[str, Any]:
        """Create portfolio review question"""
        return {
            "question_id": self._generate_id(f"portfolio{index}"),
            "type": "portfolio_review",
            "description": f"Portfolio Item {index + 1}: Submit evidence of competency",
            "requirements": [
                "Project description",
                "Your role and contributions",
                "Outcomes and impact",
                "Reflection on learning"
            ],
            "points": 30,
            "competency_assessed": competency_ids[0] if competency_ids else None
        }

    def _create_case_study_question(
        self,
        competency_ids: List[str],
        index: int
    ) -> Dict[str, Any]:
        """Create case study question"""
        return {
            "question_id": self._generate_id(f"case{index}"),
            "type": "case_study",
            "description": f"Case Study {index + 1}: Analyze and solve",
            "scenario": "Review the scenario and provide analysis",
            "questions": [
                "What is the core problem?",
                "What approach would you take?",
                "What are the expected outcomes?"
            ],
            "points": 40,
            "competency_assessed": competency_ids[0] if competency_ids else None
        }

    def _create_generic_question(
        self,
        format: AssessmentFormat,
        competency_ids: List[str],
        index: int
    ) -> Dict[str, Any]:
        """Create generic question"""
        return {
            "question_id": self._generate_id(f"q{index}"),
            "type": format.value,
            "description": f"Question {index + 1}",
            "points": 10,
            "competency_assessed": competency_ids[0] if competency_ids else None
        }

    def _create_assessment_rubric(
        self,
        format: AssessmentFormat,
        competency_ids: List[str]
    ) -> Dict[str, Any]:
        """Create scoring rubric for assessment"""
        rubric = {
            "criteria": [],
            "total_points": 100,
            "grading_scale": {
                "A": {"min": 90, "max": 100},
                "B": {"min": 80, "max": 89},
                "C": {"min": 70, "max": 79},
                "D": {"min": 60, "max": 69},
                "F": {"min": 0, "max": 59}
            }
        }

        # Add criteria based on format
        if format == AssessmentFormat.PRACTICAL_EXERCISE:
            rubric["criteria"] = [
                {"name": "Correctness", "weight": 0.4, "max_points": 40},
                {"name": "Code Quality", "weight": 0.3, "max_points": 30},
                {"name": "Documentation", "weight": 0.2, "max_points": 20},
                {"name": "Best Practices", "weight": 0.1, "max_points": 10}
            ]
        elif format == AssessmentFormat.PORTFOLIO_REVIEW:
            rubric["criteria"] = [
                {"name": "Depth of Work", "weight": 0.35, "max_points": 35},
                {"name": "Quality", "weight": 0.35, "max_points": 35},
                {"name": "Reflection", "weight": 0.2, "max_points": 20},
                {"name": "Presentation", "weight": 0.1, "max_points": 10}
            ]
        else:
            rubric["criteria"] = [
                {"name": "Knowledge", "weight": 0.5, "max_points": 50},
                {"name": "Application", "weight": 0.5, "max_points": 50}
            ]

        return rubric

    def _calculate_passing_score(self, format: AssessmentFormat, difficulty: str) -> float:
        """Calculate passing score based on format and difficulty"""
        base_scores = {
            AssessmentFormat.MULTIPLE_CHOICE: 70.0,
            AssessmentFormat.PRACTICAL_EXERCISE: 75.0,
            AssessmentFormat.PORTFOLIO_REVIEW: 80.0,
            AssessmentFormat.CASE_STUDY: 75.0,
            AssessmentFormat.SIMULATION: 70.0,
            AssessmentFormat.ORAL_EXAM: 75.0,
            AssessmentFormat.WRITTEN_EXAM: 70.0
        }

        difficulty_adjustments = {
            "beginner": -5.0,
            "intermediate": 0.0,
            "advanced": 5.0
        }

        base = base_scores.get(format, 70.0)
        adjustment = difficulty_adjustments.get(difficulty, 0.0)

        return base + adjustment

    def _calculate_time_limit(self, format: AssessmentFormat, question_count: int) -> int:
        """Calculate time limit in minutes"""
        time_per_question = {
            AssessmentFormat.MULTIPLE_CHOICE: 2,
            AssessmentFormat.PRACTICAL_EXERCISE: 30,
            AssessmentFormat.PORTFOLIO_REVIEW: 60,
            AssessmentFormat.CASE_STUDY: 45,
            AssessmentFormat.SIMULATION: 20,
            AssessmentFormat.ORAL_EXAM: 10,
            AssessmentFormat.WRITTEN_EXAM: 15
        }

        per_question = time_per_question.get(format, 10)
        return question_count * per_question

    def _configure_proctoring(self, assessment: Assessment) -> ProctoringRules:
        """Configure proctoring rules for assessment"""
        rules = ProctoringRules(
            rules_id=self._generate_id("proctoring"),
            assessment_id=assessment.assessment_id,
            time_limit_enforced=True,
            randomize_questions=assessment.randomize_questions,
            randomize_answers=True,
            show_correct_answers=False,
            allow_review=True,
            passing_score=assessment.passing_score,
            max_attempts=assessment.max_attempts,
            lockdown_browser=assessment.proctoring_required,
            webcam_required=assessment.proctoring_required,
            screen_recording=assessment.proctoring_required
        )

        self.proctoring_rules[assessment.assessment_id] = rules
        return rules

    def _generate_practice_materials(self, assessment: Assessment) -> List[Dict[str, Any]]:
        """Generate practice materials for assessment"""
        return [
            {
                "type": "sample_questions",
                "count": min(5, len(assessment.questions)),
                "format": assessment.format.value
            },
            {
                "type": "study_guide",
                "competencies": assessment.competencies_assessed
            },
            {
                "type": "practice_test",
                "description": "Full-length practice assessment"
            }
        ]

    def _generate_preparation_tips(self, assessment: Assessment) -> List[str]:
        """Generate preparation tips for assessment"""
        tips = [
            f"Review all {len(assessment.competencies_assessed)} competencies covered in the assessment",
            f"Practice with sample {assessment.format.value} questions",
            f"Allow {assessment.time_limit_minutes} minutes to complete the assessment",
            f"Passing score is {assessment.passing_score}%"
        ]

        if assessment.proctoring_required:
            tips.append("Ensure you have a quiet environment with proper lighting for proctoring")

        return tips

    def _create_badge_definition(
        self,
        name: str,
        competencies: List[str],
        badge_type: BadgeType
    ) -> DigitalBadge:
        """Create or retrieve badge definition"""
        badge_id = self._generate_id("badge")

        # Check if badge already exists
        for badge in self.digital_badges.values():
            if badge.name == name:
                return badge

        # Create new badge
        badge = DigitalBadge(
            badge_id=badge_id,
            name=name,
            description=f"{badge_type.value.replace('_', ' ').title()}: {name}",
            image_url=f"https://badges.example.com/{badge_id}.png",
            criteria_url=f"https://certification.example.com/badges/{badge_id}/criteria",
            issuer={
                "name": "Digital Agency Certification Board",
                "url": "https://certification.example.com",
                "email": "certifications@example.com"
            },
            badge_type=badge_type,
            competencies=competencies,
            validity_period_days=730 if badge_type == BadgeType.CERTIFICATION else None
        )

        self.digital_badges[badge_id] = badge
        return badge

    def _generate_open_badge_metadata(
        self,
        badge: DigitalBadge,
        recipient_id: str
    ) -> Dict[str, Any]:
        """Generate Open Badges 2.0 metadata"""
        return {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "Assertion",
            "id": f"https://certification.example.com/assertions/{self._generate_id('assertion')}",
            "badge": {
                "@context": "https://w3id.org/openbadges/v2",
                "type": "BadgeClass",
                "id": badge.criteria_url,
                "name": badge.name,
                "description": badge.description,
                "image": badge.image_url,
                "criteria": {
                    "type": "Criteria",
                    "narrative": f"Demonstrated proficiency in {len(badge.competencies)} competencies"
                },
                "issuer": badge.issuer
            },
            "recipient": {
                "type": "email",
                "hashed": False,
                "identity": f"user_{recipient_id}@example.com"
            },
            "issuedOn": datetime.now().isoformat(),
            "verification": {
                "type": "hosted"
            }
        }

    def _create_credential(self, recipient_id: str, badge_id: str) -> Credential:
        """Create credential for badge recipient"""
        badge = self.digital_badges[badge_id]

        # Calculate expiry date
        expiry_date = None
        if badge.validity_period_days:
            expiry_date = (
                datetime.now() + timedelta(days=badge.validity_period_days)
            ).isoformat()

        credential = Credential(
            credential_id=self._generate_id("credential"),
            recipient_id=recipient_id,
            certification_path_id="default_path",
            badge_id=badge_id,
            status=CertificationStatus.ACTIVE,
            issue_date=datetime.now().isoformat(),
            expiry_date=expiry_date,
            verification_url="",
            continuing_education_credits=0.0
        )

        self.credentials[credential.credential_id] = credential
        return credential

    def _generate_verification_url(self, credential: Credential) -> str:
        """Generate verification URL for credential"""
        return f"https://certification.example.com/verify/{credential.credential_id}"

    def _create_badge_assertion(
        self,
        badge: DigitalBadge,
        recipient_id: str,
        verification_url: str
    ) -> Dict[str, Any]:
        """Create badge assertion"""
        return {
            "badge_name": badge.name,
            "recipient": recipient_id,
            "issued_on": datetime.now().isoformat(),
            "verification_url": verification_url,
            "competencies_demonstrated": badge.competencies,
            "badge_type": badge.badge_type.value
        }

    def _generate_social_sharing_links(
        self,
        badge: DigitalBadge,
        credential: Credential
    ) -> Dict[str, str]:
        """Generate social sharing links for badge"""
        badge_url = credential.verification_url
        message = f"I earned the {badge.name} badge!"

        return {
            "linkedin": f"https://www.linkedin.com/shareArticle?mini=true&url={badge_url}&title={message}",
            "twitter": f"https://twitter.com/intent/tweet?text={message}&url={badge_url}",
            "facebook": f"https://www.facebook.com/sharer/sharer.php?u={badge_url}"
        }

    def _determine_prerequisites(self, competency_ids: List[str]) -> List[str]:
        """Determine prerequisites for certification path"""
        prerequisites = []

        for comp_id in competency_ids:
            if comp_id in self.competencies:
                comp = self.competencies[comp_id]
                if comp.skill_level != SkillLevel.NOVICE:
                    prerequisites.extend(comp.prerequisites)

        return list(set(prerequisites))

    def _create_path_assessments(self, competency_ids: List[str]) -> List[Dict[str, Any]]:
        """Create assessments for certification path"""
        assessments = []

        # Group competencies by level
        by_level = defaultdict(list)
        for comp_id in competency_ids:
            if comp_id in self.competencies:
                comp = self.competencies[comp_id]
                by_level[comp.skill_level].append(comp_id)

        # Create assessment for each level
        for level, comps in by_level.items():
            assessments.append({
                "assessment_id": self._generate_id("path_assessment"),
                "level": level.value,
                "competencies": comps,
                "format": AssessmentFormat.MULTIPLE_CHOICE.value,
                "required": True
            })

        return assessments

    def _design_capstone_project(
        self,
        target_role: str,
        competency_ids: List[str]
    ) -> Dict[str, Any]:
        """Design capstone project for certification"""
        return {
            "project_id": self._generate_id("capstone"),
            "title": f"{target_role} Capstone Project",
            "description": "Comprehensive project demonstrating all competencies",
            "requirements": [
                "Apply all learned competencies",
                "Deliver working solution",
                "Present findings and results",
                "Reflect on learning journey"
            ],
            "deliverables": [
                "Project proposal",
                "Implementation",
                "Documentation",
                "Presentation"
            ],
            "evaluation_criteria": [
                {"criterion": "Technical Excellence", "weight": 0.4},
                {"criterion": "Completeness", "weight": 0.3},
                {"criterion": "Innovation", "weight": 0.2},
                {"criterion": "Presentation", "weight": 0.1}
            ],
            "estimated_hours": 40
        }

    def _estimate_path_duration(
        self,
        competency_ids: List[str],
        assessments: List[Dict[str, Any]]
    ) -> int:
        """Estimate total duration for certification path"""
        # Estimate 20 hours per competency
        competency_hours = len(competency_ids) * 20

        # Add assessment time
        assessment_hours = len(assessments) * 2

        return competency_hours + assessment_hours

    def _generate_learning_plan(self, path: CertificationPath) -> Dict[str, Any]:
        """Generate detailed learning plan for certification path"""
        return {
            "path_id": path.path_id,
            "total_duration": path.estimated_duration_hours,
            "phases": [
                {
                    "phase": "Foundation",
                    "duration_hours": path.estimated_duration_hours * 0.3,
                    "focus": "Core competencies"
                },
                {
                    "phase": "Application",
                    "duration_hours": path.estimated_duration_hours * 0.4,
                    "focus": "Practical skills"
                },
                {
                    "phase": "Mastery",
                    "duration_hours": path.estimated_duration_hours * 0.3,
                    "focus": "Advanced topics and capstone"
                }
            ],
            "recommended_pace": f"{path.estimated_duration_hours // 12} hours per week for 12 weeks"
        }

    def _create_prerequisites_map(self, path: CertificationPath) -> Dict[str, List[str]]:
        """Create map of prerequisites"""
        prereq_map = {}

        for comp_id in path.competencies_required:
            if comp_id in self.competencies:
                comp = self.competencies[comp_id]
                prereq_map[comp_id] = comp.prerequisites

        return prereq_map

    def _create_milestones(self, path: CertificationPath) -> List[Dict[str, Any]]:
        """Create milestones for certification path"""
        total_comps = len(path.competencies_required)

        return [
            {
                "milestone": "25% Complete",
                "competencies_completed": total_comps // 4,
                "reward": "Foundation badge"
            },
            {
                "milestone": "50% Complete",
                "competencies_completed": total_comps // 2,
                "reward": "Progress badge"
            },
            {
                "milestone": "75% Complete",
                "competencies_completed": total_comps * 3 // 4,
                "reward": "Advanced badge"
            },
            {
                "milestone": "100% Complete",
                "competencies_completed": total_comps,
                "reward": path.badge_awarded
            }
        ]

    def _score_with_rubric(
        self,
        assessment: Assessment,
        submission: Dict[str, Any]
    ) -> Dict[str, float]:
        """Score submission using rubric"""
        rubric_scores = {}
        rubric = assessment.rubric

        # Score each criterion
        for criterion in rubric.get("criteria", []):
            criterion_name = criterion["name"]
            max_points = criterion["max_points"]

            # Simulate scoring (in real system, would use actual evaluation logic)
            score = random.uniform(max_points * 0.6, max_points)
            rubric_scores[criterion_name] = round(score, 2)

        return rubric_scores

    def _calculate_overall_score(self, rubric_scores: Dict[str, float]) -> float:
        """Calculate overall score from rubric scores"""
        if not rubric_scores:
            return 0.0

        total = sum(rubric_scores.values())
        return round(total, 2)

    def _generate_assessment_feedback(
        self,
        assessment: Assessment,
        rubric_scores: Dict[str, float],
        overall_score: float
    ) -> str:
        """Generate detailed feedback for assessment"""
        feedback_parts = [
            f"Overall Score: {overall_score}%",
            f"Passing Score: {assessment.passing_score}%",
            ""
        ]

        # Add criterion-specific feedback
        feedback_parts.append("Criterion Scores:")
        for criterion, score in rubric_scores.items():
            feedback_parts.append(f"- {criterion}: {score}")

        feedback_parts.append("")

        # Add performance summary
        if overall_score >= 90:
            feedback_parts.append("Excellent work! You demonstrated strong mastery.")
        elif overall_score >= assessment.passing_score:
            feedback_parts.append("Good work! You met the requirements successfully.")
        else:
            feedback_parts.append("Additional study recommended in the following areas:")
            # List lowest scoring criteria
            lowest = sorted(rubric_scores.items(), key=lambda x: x[1])[:2]
            for criterion, _ in lowest:
                feedback_parts.append(f"- {criterion}")

        return "\n".join(feedback_parts)

    def _identify_validated_competencies(
        self,
        assessment: Assessment,
        rubric_scores: Dict[str, float]
    ) -> List[str]:
        """Identify which competencies were validated"""
        # Consider competency validated if scored above 70%
        validated = []

        for comp_id in assessment.competencies_assessed:
            # Simplified - in real system would map rubric scores to specific competencies
            validated.append(comp_id)

        return validated

    def _suggest_next_steps(
        self,
        learner_id: str,
        passed: bool,
        assessment: Assessment
    ) -> List[str]:
        """Suggest next steps for learner"""
        if passed:
            return [
                "Congratulations on passing!",
                "Proceed to the next assessment in your certification path",
                "Consider applying these skills in a real project"
            ]
        else:
            return [
                f"Review the feedback and focus on areas needing improvement",
                f"You have {assessment.max_attempts - 1} attempts remaining",
                "Use the practice materials to prepare for your next attempt"
            ]

    def _create_performance_summary(self, rubric_scores: Dict[str, float]) -> Dict[str, Any]:
        """Create performance summary from rubric scores"""
        if not rubric_scores:
            return {}

        scores_list = list(rubric_scores.values())

        return {
            "average_score": round(sum(scores_list) / len(scores_list), 2),
            "highest_criterion": max(rubric_scores.items(), key=lambda x: x[1])[0],
            "lowest_criterion": min(rubric_scores.items(), key=lambda x: x[1])[0],
            "score_distribution": rubric_scores
        }

    def _update_assessment_statistics(
        self,
        assessment_id: str,
        score: float,
        passed: bool
    ) -> None:
        """Update assessment statistics"""
        # Update completion rate
        if assessment_id not in self.completion_rates:
            self.completion_rates[assessment_id] = 0.0

        # Update average score
        if assessment_id not in self.average_scores:
            self.average_scores[assessment_id] = score
        else:
            # Running average
            current_avg = self.average_scores[assessment_id]
            self.average_scores[assessment_id] = (current_avg + score) / 2

    def _verify_credential(self, credential_id: str) -> Dict[str, Any]:
        """Verify credential authenticity"""
        if credential_id not in self.credentials:
            return {
                "valid": False,
                "message": "Credential not found"
            }

        credential = self.credentials[credential_id]

        # Check if expired
        if credential.expiry_date:
            expiry = datetime.fromisoformat(credential.expiry_date)
            if datetime.now() > expiry:
                return {
                    "valid": False,
                    "message": "Credential has expired",
                    "expiry_date": credential.expiry_date
                }

        # Check if revoked
        if credential.status == CertificationStatus.REVOKED:
            return {
                "valid": False,
                "message": "Credential has been revoked"
            }

        # Valid credential
        badge = self.digital_badges.get(credential.badge_id)

        return {
            "valid": True,
            "credential_id": credential_id,
            "recipient_id": credential.recipient_id,
            "badge_name": badge.name if badge else "Unknown",
            "issue_date": credential.issue_date,
            "expiry_date": credential.expiry_date,
            "status": credential.status.value
        }

    def _renew_credential(self, credential_id: str) -> Dict[str, Any]:
        """Renew expired or expiring credential"""
        if credential_id not in self.credentials:
            raise ValueError(f"Credential {credential_id} not found")

        credential = self.credentials[credential_id]

        # Update renewal date
        credential.last_renewed = datetime.now().isoformat()
        credential.status = CertificationStatus.ACTIVE

        # Extend expiry date
        if credential.expiry_date:
            badge = self.digital_badges.get(credential.badge_id)
            if badge and badge.validity_period_days:
                new_expiry = datetime.now() + timedelta(days=badge.validity_period_days)
                credential.expiry_date = new_expiry.isoformat()

        # Reset CE credits
        credential.continuing_education_credits = 0.0

        return {
            "credential_id": credential_id,
            "renewed": True,
            "new_expiry_date": credential.expiry_date,
            "next_renewal_date": self._calculate_next_renewal_date(credential)
        }

    def _revoke_credential(self, credential_id: str) -> Dict[str, Any]:
        """Revoke credential"""
        if credential_id not in self.credentials:
            raise ValueError(f"Credential {credential_id} not found")

        credential = self.credentials[credential_id]
        credential.status = CertificationStatus.REVOKED

        return {
            "credential_id": credential_id,
            "revoked": True,
            "revocation_date": datetime.now().isoformat()
        }

    def _list_credentials(self, recipient_id: str) -> Dict[str, Any]:
        """List all credentials for recipient"""
        recipient_credentials = [
            c for c in self.credentials.values()
            if c.recipient_id == recipient_id
        ]

        return {
            "recipient_id": recipient_id,
            "total_credentials": len(recipient_credentials),
            "credentials": [
                {
                    "credential_id": c.credential_id,
                    "badge_id": c.badge_id,
                    "status": c.status.value,
                    "issue_date": c.issue_date,
                    "expiry_date": c.expiry_date
                }
                for c in recipient_credentials
            ]
        }

    def _generate_exam_guidelines(self, rules: ProctoringRules) -> List[str]:
        """Generate exam guidelines based on proctoring rules"""
        guidelines = [
            f"Time limit: Strictly enforced" if rules.time_limit_enforced else "Time limit: Not enforced",
            f"Passing score: {rules.passing_score}%",
            f"Maximum attempts: {rules.max_attempts}"
        ]

        if rules.randomize_questions:
            guidelines.append("Questions will be randomized for each attempt")

        if rules.webcam_required:
            guidelines.append("Webcam must be enabled throughout the exam")

        if rules.lockdown_browser:
            guidelines.append("Secure browser required - other applications will be blocked")

        if rules.screen_recording:
            guidelines.append("Screen activity will be recorded")

        if not rules.show_correct_answers:
            guidelines.append("Correct answers will not be shown after submission")

        return guidelines

    def _create_security_measures(self, rules: ProctoringRules) -> Dict[str, Any]:
        """Create security measures for exam"""
        return {
            "identity_verification": rules.webcam_required,
            "browser_lockdown": rules.lockdown_browser,
            "screen_monitoring": rules.screen_recording,
            "question_randomization": rules.randomize_questions,
            "answer_randomization": rules.randomize_answers,
            "time_enforcement": rules.time_limit_enforced
        }

    def _get_technical_requirements(self, rules: ProctoringRules) -> Dict[str, Any]:
        """Get technical requirements for exam"""
        requirements = {
            "browser": "Latest version of Chrome, Firefox, or Safari",
            "internet": "Stable internet connection (minimum 5 Mbps)"
        }

        if rules.webcam_required:
            requirements["webcam"] = "Working webcam with minimum 720p resolution"

        if rules.lockdown_browser:
            requirements["software"] = "Secure browser installation required"

        return requirements

    def _calculate_renewal_requirements(self, path: CertificationPath) -> Dict[str, Any]:
        """Calculate renewal requirements for certification"""
        return {
            "renewal_period_months": path.renewal_period_months,
            "ce_credits_required": 40.0,  # Standard continuing education credits
            "assessment_required": path.continuing_education_required,
            "activities_accepted": [
                "Workshops and seminars",
                "Online courses",
                "Conference attendance",
                "Published articles or presentations"
            ]
        }

    def _calculate_time_to_expiry(self, credential: Credential) -> Dict[str, Any]:
        """Calculate time remaining until credential expires"""
        if not credential.expiry_date:
            return {
                "expires": False,
                "message": "This credential does not expire"
            }

        expiry = datetime.fromisoformat(credential.expiry_date)
        now = datetime.now()

        if now > expiry:
            return {
                "expired": True,
                "days_overdue": (now - expiry).days
            }

        days_remaining = (expiry - now).days

        return {
            "expired": False,
            "days_remaining": days_remaining,
            "expiry_date": credential.expiry_date,
            "renewal_recommended": days_remaining < 90
        }

    def _calculate_next_renewal_date(self, credential: Credential) -> str:
        """Calculate next renewal date"""
        if not credential.expiry_date:
            return "N/A - No expiration"

        expiry = datetime.fromisoformat(credential.expiry_date)
        # Recommend renewal 90 days before expiry
        renewal_date = expiry - timedelta(days=90)

        return renewal_date.isoformat()

    def _get_renewal_options(
        self,
        credential: Credential,
        path: CertificationPath
    ) -> List[Dict[str, Any]]:
        """Get renewal options for credential"""
        return [
            {
                "option": "Continuing Education",
                "description": "Complete required CE credits",
                "credits_required": 40.0,
                "current_credits": credential.continuing_education_credits
            },
            {
                "option": "Re-certification Exam",
                "description": "Pass updated certification exam",
                "passing_score": 75.0
            },
            {
                "option": "Portfolio Review",
                "description": "Submit portfolio demonstrating ongoing competency",
                "requirements": ["Recent project work", "Skills demonstration"]
            }
        ]

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
            "certification_stats": {
                "total_competencies": len(self.competencies),
                "total_assessments": len(self.assessments),
                "total_badges": len(self.digital_badges),
                "total_paths": len(self.certification_paths),
                "total_credentials": len(self.credentials)
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
            "design_competency_framework": f"Designed framework with {result.get('competencies_created', 0)} competencies",
            "create_assessment": f"Created {result.get('assessment', {}).get('format', 'unknown')} assessment",
            "issue_digital_badge": f"Issued {result.get('badge', {}).get('name', 'unknown')} badge",
            "create_certification_path": f"Created path: {result.get('certification_path', {}).get('name', 'unknown')}",
            "validate_skills": f"Validated skills for learner",
            "manage_credentials": f"Managed credentials: {result.get('operation', 'unknown')}",
            "configure_proctoring": f"Configured proctoring rules",
            "track_renewal": f"Tracked renewal for credential"
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
