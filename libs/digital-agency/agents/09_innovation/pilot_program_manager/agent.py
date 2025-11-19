"""
Pilot Program Manager Agent - Validation Specialist

Plans, executes, and validates pilot programs for new initiatives using data-driven
decision frameworks including ICE scoring, RICE scoring, metrics tracking, and
statistical validation.

This agent serves as the Validation Specialist role, implementing:
- ICE Scoring (Impact × Confidence × Ease)
- RICE Scoring (Reach × Impact × Confidence / Effort)
- Value vs Effort Matrix (2×2 prioritization)
- Metric tracking with leading and lagging indicators
- Pivot/Persevere decision frameworks
- Risk assessment with Probability × Impact
- Go/No-Go criteria evaluation
- Statistical validation with confidence intervals
"""

from typing import Dict, List, Any, Optional, Tuple
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


class PilotStatus(Enum):
    """Pilot program lifecycle status"""
    PLANNING = "planning"
    APPROVED = "approved"
    RECRUITING = "recruiting"
    RUNNING = "running"
    MONITORING = "monitoring"
    COMPLETED = "completed"
    VALIDATED = "validated"
    FAILED = "failed"
    SCALED = "scaled"


class DecisionType(Enum):
    """Pivot/Persevere decision types"""
    PIVOT = "pivot"
    PERSEVERE = "persevere"
    SCALE = "scale"
    ITERATE = "iterate"
    TERMINATE = "terminate"


class RiskLevel(Enum):
    """Risk severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"


class MatrixQuadrant(Enum):
    """Value vs Effort Matrix quadrants"""
    QUICK_WINS = "quick_wins"  # High value, low effort
    BIG_BETS = "big_bets"  # High value, high effort
    FILL_INS = "fill_ins"  # Low value, low effort
    TIME_SINKS = "time_sinks"  # Low value, high effort


@dataclass
class ICEScore:
    """ICE scoring framework (Impact × Confidence × Ease)"""
    impact: float  # 1-10: Expected impact on key metrics
    confidence: float  # 1-10: Confidence in the estimate
    ease: float  # 1-10: Ease of implementation

    def calculate(self) -> float:
        """Calculate ICE score (average of three factors)"""
        return (self.impact + self.confidence + self.ease) / 3

    def to_dict(self) -> Dict[str, Any]:
        return {
            "impact": self.impact,
            "confidence": self.confidence,
            "ease": self.ease,
            "score": self.calculate()
        }


@dataclass
class RICEScore:
    """RICE scoring framework"""
    reach: float  # Number of people/events per time period
    impact: float  # Impact per person (0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive)
    confidence: float  # Confidence percentage (0-100)
    effort: float  # Person-months of work

    def calculate(self) -> float:
        """Calculate RICE score: (Reach × Impact × Confidence%) / Effort"""
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
class Risk:
    """Risk assessment item"""
    risk_id: str
    description: str
    probability: float  # 0-1
    impact: float  # 0-1
    category: str
    mitigation_plan: str
    owner: str
    status: str = "identified"

    def severity_score(self) -> float:
        """Calculate risk severity (Probability × Impact)"""
        return self.probability * self.impact

    def severity_level(self) -> RiskLevel:
        """Determine risk level based on severity"""
        severity = self.severity_score()
        if severity >= 0.75:
            return RiskLevel.CRITICAL
        elif severity >= 0.50:
            return RiskLevel.HIGH
        elif severity >= 0.25:
            return RiskLevel.MEDIUM
        elif severity >= 0.10:
            return RiskLevel.LOW
        else:
            return RiskLevel.MINIMAL

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_id": self.risk_id,
            "description": self.description,
            "probability": self.probability,
            "impact": self.impact,
            "severity_score": self.severity_score(),
            "severity_level": self.severity_level().value,
            "category": self.category,
            "mitigation_plan": self.mitigation_plan,
            "owner": self.owner,
            "status": self.status
        }


@dataclass
class Metric:
    """Pilot program metric"""
    metric_id: str
    name: str
    type: str  # leading or lagging
    category: str  # usage, engagement, revenue, retention, etc.
    baseline_value: float
    target_value: float
    current_value: Optional[float] = None
    unit: str = ""
    measurement_frequency: str = "daily"

    def progress_percentage(self) -> float:
        """Calculate progress towards target"""
        if self.current_value is None:
            return 0.0
        if self.target_value == self.baseline_value:
            return 100.0 if self.current_value >= self.target_value else 0.0

        progress = ((self.current_value - self.baseline_value) /
                   (self.target_value - self.baseline_value)) * 100
        return max(0.0, min(100.0, progress))

    def is_on_track(self) -> bool:
        """Check if metric is on track to meet target"""
        if self.current_value is None:
            return False
        return self.current_value >= self.target_value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_id": self.metric_id,
            "name": self.name,
            "type": self.type,
            "category": self.category,
            "baseline_value": self.baseline_value,
            "target_value": self.target_value,
            "current_value": self.current_value,
            "unit": self.unit,
            "progress_percentage": self.progress_percentage(),
            "is_on_track": self.is_on_track()
        }


@dataclass
class GoNoGoCheck:
    """Go/No-Go decision criteria check"""
    criterion_id: str
    criterion: str
    required: bool
    status: bool
    evidence: str
    checked_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "criterion_id": self.criterion_id,
            "criterion": self.criterion,
            "required": self.required,
            "status": status,
            "evidence": self.evidence,
            "checked_at": self.checked_at.isoformat()
        }


@dataclass
class PilotProgram:
    """Comprehensive pilot program specification"""
    pilot_id: str
    name: str
    description: str
    hypothesis: str
    objectives: List[str]
    status: PilotStatus
    ice_score: ICEScore
    rice_score: RICEScore
    value_effort_quadrant: MatrixQuadrant
    metrics: List[Metric]
    risks: List[Risk]
    participants: Dict[str, Any]
    timeline: Dict[str, Any]
    budget: Dict[str, float]
    success_criteria: Dict[str, Any]
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    decision: Optional[DecisionType] = None
    learnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pilot_id": self.pilot_id,
            "name": self.name,
            "description": self.description,
            "hypothesis": self.hypothesis,
            "objectives": self.objectives,
            "status": self.status.value,
            "ice_score": self.ice_score.to_dict(),
            "rice_score": self.rice_score.to_dict(),
            "value_effort_quadrant": self.value_effort_quadrant.value,
            "metrics": [m.to_dict() for m in self.metrics],
            "risks": [r.to_dict() for r in self.risks],
            "participants": self.participants,
            "timeline": self.timeline,
            "budget": self.budget,
            "success_criteria": self.success_criteria,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "decision": self.decision.value if self.decision else None,
            "learnings": self.learnings
        }


class PilotProgramManagerAgent:
    """
    Pilot Program Manager Agent - Validation Specialist

    Responsible for:
    - Planning and scoping pilot programs
    - ICE and RICE scoring for prioritization
    - Metrics tracking and dashboard creation
    - Risk assessment and mitigation
    - Go/No-Go decision frameworks
    - Pivot/Persevere analysis
    - Statistical validation

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        pilots (Dict[str, PilotProgram]): Active pilot programs
        metrics_data (Dict): Time-series metrics data
        history (List[Dict]): Operation history
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Pilot Program Manager / Validation Specialist Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "pilot_program_manager_001"
        self.config = config or {}
        self.name = "Validation Specialist"
        self.role = "Pilot Program Planning and Validation"

        # Core data structures
        self.pilots: Dict[str, PilotProgram] = {}
        self.metrics_data: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.history: List[Dict[str, Any]] = []

        # Configuration
        self.default_confidence_level = self.config.get("confidence_level", 0.95)
        self.min_sample_size = self.config.get("min_sample_size", 30)

        logger.info(f"Initialized {self.name} agent with ID: {self.agent_id}")

    def plan_pilot(
        self,
        program_name: str,
        hypothesis: str,
        objectives: List[str],
        scoring_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Plan pilot program with ICE and RICE scoring.

        Args:
            program_name: Name of the pilot program
            hypothesis: Hypothesis to test
            objectives: Program objectives
            scoring_data: Data for ICE and RICE scoring

        Returns:
            Dictionary containing pilot plan
        """
        try:
            logger.info(f"Planning pilot program: {program_name}")

            # Create ICE score
            ice = ICEScore(
                impact=scoring_data.get("impact", 5.0),
                confidence=scoring_data.get("confidence", 5.0),
                ease=scoring_data.get("ease", 5.0)
            )

            # Create RICE score
            rice = RICEScore(
                reach=scoring_data.get("reach", 100),
                impact=scoring_data.get("rice_impact", 1.0),
                confidence=scoring_data.get("rice_confidence", 50),
                effort=scoring_data.get("effort", 1.0)
            )

            # Determine value/effort quadrant
            quadrant = self._classify_value_effort_quadrant(
                ice.impact,
                ice.ease
            )

            # Define metrics
            metrics = self._define_pilot_metrics(scoring_data.get("metrics", []))

            # Assess risks
            risks = self._assess_pilot_risks(program_name, scoring_data.get("risks", []))

            # Create timeline
            duration_weeks = scoring_data.get("duration_weeks", 8)
            timeline = self._create_pilot_timeline(duration_weeks)

            # Estimate budget
            budget = self._estimate_pilot_budget(
                scoring_data.get("participants", 50),
                duration_weeks
            )

            # Define success criteria
            success_criteria = self._define_success_criteria(metrics)

            # Create pilot ID
            pilot_id = self._generate_id(f"pilot_{program_name}")

            # Create pilot program
            pilot = PilotProgram(
                pilot_id=pilot_id,
                name=program_name,
                description=scoring_data.get("description", ""),
                hypothesis=hypothesis,
                objectives=objectives,
                status=PilotStatus.PLANNING,
                ice_score=ice,
                rice_score=rice,
                value_effort_quadrant=quadrant,
                metrics=metrics,
                risks=risks,
                participants={
                    "target_size": scoring_data.get("participants", 50),
                    "recruited": 0,
                    "active": 0
                },
                timeline=timeline,
                budget=budget,
                success_criteria=success_criteria,
                created_at=datetime.now()
            )

            # Store pilot
            self.pilots[pilot_id] = pilot

            # Generate recommendations
            recommendations = self._generate_planning_recommendations(pilot)

            # Log operation
            operation = {
                "operation": "plan_pilot",
                "pilot_id": pilot_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Pilot planned: {pilot_id} - ICE: {ice.calculate():.1f}, RICE: {rice.calculate():.1f}")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "pilot": pilot.to_dict(),
                "prioritization": {
                    "ice_score": ice.calculate(),
                    "rice_score": rice.calculate(),
                    "quadrant": quadrant.value,
                    "priority_ranking": self._calculate_priority_rank(ice, rice)
                },
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error planning pilot: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def calculate_ice_score(
        self,
        impact: float,
        confidence: float,
        ease: float
    ) -> Dict[str, Any]:
        """
        Calculate ICE score for prioritization.

        Args:
            impact: Impact score (1-10)
            confidence: Confidence score (1-10)
            ease: Ease of implementation (1-10)

        Returns:
            Dictionary containing ICE score analysis
        """
        try:
            logger.info("Calculating ICE score")

            ice = ICEScore(impact=impact, confidence=confidence, ease=ease)
            score = ice.calculate()

            # Determine priority level
            if score >= 8:
                priority = "critical"
            elif score >= 6:
                priority = "high"
            elif score >= 4:
                priority = "medium"
            else:
                priority = "low"

            # Generate insights
            insights = []
            if impact >= 8:
                insights.append("High impact potential - prioritize execution")
            if confidence <= 3:
                insights.append("Low confidence - gather more data before proceeding")
            if ease >= 8:
                insights.append("Easy to implement - good quick win candidate")

            return {
                "status": "success",
                "ice_score": score,
                "components": ice.to_dict(),
                "priority": priority,
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating ICE score: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def calculate_rice_score(
        self,
        reach: float,
        impact: float,
        confidence: float,
        effort: float
    ) -> Dict[str, Any]:
        """
        Calculate RICE score for prioritization.

        Args:
            reach: Reach (number of people/events per period)
            impact: Impact per person (0.25, 0.5, 1, 2, or 3)
            confidence: Confidence percentage (0-100)
            effort: Effort in person-months

        Returns:
            Dictionary containing RICE score analysis
        """
        try:
            logger.info("Calculating RICE score")

            rice = RICEScore(reach=reach, impact=impact, confidence=confidence, effort=effort)
            score = rice.calculate()

            # Determine priority level
            if score >= 100:
                priority = "critical"
            elif score >= 50:
                priority = "high"
            elif score >= 20:
                priority = "medium"
            else:
                priority = "low"

            # Generate insights
            insights = []
            if reach >= 1000:
                insights.append("Large reach - significant market opportunity")
            if impact >= 2:
                insights.append("High impact per user - strong value proposition")
            if confidence <= 30:
                insights.append("Low confidence - validate assumptions first")
            if effort >= 6:
                insights.append("High effort required - ensure alignment with strategy")

            return {
                "status": "success",
                "rice_score": score,
                "components": rice.to_dict(),
                "priority": priority,
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating RICE score: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def create_value_effort_matrix(
        self,
        initiatives: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create 2×2 Value vs Effort prioritization matrix.

        Args:
            initiatives: List of initiatives with value and effort scores

        Returns:
            Dictionary containing matrix categorization
        """
        try:
            logger.info(f"Creating value/effort matrix for {len(initiatives)} initiatives")

            matrix = {
                "quick_wins": [],
                "big_bets": [],
                "fill_ins": [],
                "time_sinks": []
            }

            for initiative in initiatives:
                value = initiative.get("value", 5)
                effort = initiative.get("effort", 5)

                quadrant = self._classify_value_effort_quadrant(value, effort)

                matrix[quadrant.value].append({
                    "name": initiative.get("name", "Unknown"),
                    "value": value,
                    "effort": effort,
                    "description": initiative.get("description", "")
                })

            # Generate recommendations
            recommendations = []
            if matrix["quick_wins"]:
                recommendations.append(f"Prioritize {len(matrix['quick_wins'])} quick wins for immediate impact")
            if matrix["big_bets"]:
                recommendations.append(f"Carefully plan {len(matrix['big_bets'])} big bets - high value but resource intensive")
            if matrix["time_sinks"]:
                recommendations.append(f"Avoid {len(matrix['time_sinks'])} time sinks - low ROI")

            return {
                "status": "success",
                "matrix": matrix,
                "summary": {
                    "quick_wins": len(matrix["quick_wins"]),
                    "big_bets": len(matrix["big_bets"]),
                    "fill_ins": len(matrix["fill_ins"]),
                    "time_sinks": len(matrix["time_sinks"])
                },
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating value/effort matrix: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def track_metrics(
        self,
        pilot_id: str,
        metrics_update: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Track pilot program metrics and create dashboard.

        Args:
            pilot_id: Pilot program identifier
            metrics_update: Current metric values

        Returns:
            Dictionary containing metrics dashboard
        """
        try:
            logger.info(f"Tracking metrics for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]

            # Update metric values
            for metric in pilot.metrics:
                if metric.name in metrics_update:
                    metric.current_value = metrics_update[metric.name]

            # Store time-series data
            self.metrics_data[pilot_id].append({
                "timestamp": datetime.now().isoformat(),
                "metrics": metrics_update.copy()
            })

            # Calculate dashboard metrics
            dashboard = self._create_metrics_dashboard(pilot)

            # Check for alerts
            alerts = self._check_metric_alerts(pilot)

            # Log operation
            operation = {
                "operation": "track_metrics",
                "pilot_id": pilot_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Metrics tracked: {len(metrics_update)} metrics updated")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "dashboard": dashboard,
                "alerts": alerts,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error tracking metrics: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def evaluate_pivot_persevere(
        self,
        pilot_id: str,
        evidence: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate whether to pivot or persevere based on evidence.

        Args:
            pilot_id: Pilot program identifier
            evidence: Evidence data including metrics and feedback

        Returns:
            Dictionary containing decision recommendation
        """
        try:
            logger.info(f"Evaluating pivot/persevere for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]

            # Analyze metrics performance
            metrics_performance = self._analyze_metrics_performance(pilot)

            # Check success criteria
            criteria_met = self._check_success_criteria(pilot)

            # Calculate decision score
            decision_score = self._calculate_decision_score(
                metrics_performance,
                criteria_met,
                evidence
            )

            # Make recommendation
            decision = self._make_pivot_persevere_decision(decision_score, pilot)

            # Generate supporting rationale
            rationale = self._generate_decision_rationale(
                decision,
                metrics_performance,
                criteria_met
            )

            # Update pilot
            pilot.decision = decision

            # Log operation
            operation = {
                "operation": "evaluate_pivot_persevere",
                "pilot_id": pilot_id,
                "decision": decision.value,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Decision: {decision.value} (score: {decision_score:.2f})")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "decision": decision.value,
                "decision_score": decision_score,
                "confidence": criteria_met.get("confidence", 0.5),
                "metrics_performance": metrics_performance,
                "criteria_met": criteria_met,
                "rationale": rationale,
                "next_steps": self._generate_next_steps(decision),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error evaluating pivot/persevere: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def assess_risk(
        self,
        pilot_id: str,
        risk_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Assess risks using Probability × Impact matrix.

        Args:
            pilot_id: Pilot program identifier
            risk_data: Optional risk data to add/update

        Returns:
            Dictionary containing risk assessment
        """
        try:
            logger.info(f"Assessing risks for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]

            # Add new risks if provided
            if risk_data:
                for risk_item in risk_data:
                    risk = Risk(
                        risk_id=self._generate_id(f"risk_{pilot_id}"),
                        description=risk_item["description"],
                        probability=risk_item["probability"],
                        impact=risk_item["impact"],
                        category=risk_item.get("category", "operational"),
                        mitigation_plan=risk_item.get("mitigation_plan", ""),
                        owner=risk_item.get("owner", "unassigned")
                    )
                    pilot.risks.append(risk)

            # Categorize risks by severity
            risk_matrix = {
                "critical": [],
                "high": [],
                "medium": [],
                "low": [],
                "minimal": []
            }

            for risk in pilot.risks:
                risk_matrix[risk.severity_level().value].append(risk.to_dict())

            # Calculate overall risk score
            overall_risk = self._calculate_overall_risk(pilot.risks)

            # Generate mitigation priorities
            priorities = self._prioritize_risk_mitigation(pilot.risks)

            # Log operation
            operation = {
                "operation": "assess_risk",
                "pilot_id": pilot_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Risk assessment: {len(pilot.risks)} risks, overall score: {overall_risk:.2f}")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "risk_matrix": risk_matrix,
                "overall_risk_score": overall_risk,
                "risk_level": self._classify_risk_level(overall_risk),
                "mitigation_priorities": priorities,
                "summary": {
                    "total_risks": len(pilot.risks),
                    "critical": len(risk_matrix["critical"]),
                    "high": len(risk_matrix["high"]),
                    "medium": len(risk_matrix["medium"])
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error assessing risk: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def evaluate_go_nogo(
        self,
        pilot_id: str,
        criteria_checks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluate Go/No-Go decision criteria.

        Args:
            pilot_id: Pilot program identifier
            criteria_checks: List of criteria to check

        Returns:
            Dictionary containing Go/No-Go decision
        """
        try:
            logger.info(f"Evaluating Go/No-Go for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]

            # Process criteria checks
            checks = []
            required_passed = 0
            required_total = 0
            optional_passed = 0
            optional_total = 0

            for idx, criterion in enumerate(criteria_checks):
                check = GoNoGoCheck(
                    criterion_id=self._generate_id(f"check_{pilot_id}_{idx}"),
                    criterion=criterion["criterion"],
                    required=criterion.get("required", True),
                    status=criterion["status"],
                    evidence=criterion.get("evidence", ""),
                    checked_at=datetime.now()
                )

                checks.append(check)

                if check.required:
                    required_total += 1
                    if check.status:
                        required_passed += 1
                else:
                    optional_total += 1
                    if check.status:
                        optional_passed += 1

            # Make Go/No-Go decision
            all_required_passed = (required_passed == required_total) if required_total > 0 else True
            decision = "GO" if all_required_passed else "NO-GO"

            # Calculate confidence
            total_checks = required_total + optional_total
            total_passed = required_passed + optional_passed
            confidence = (total_passed / total_checks) if total_checks > 0 else 0.0

            # Generate recommendations
            recommendations = []
            if decision == "NO-GO":
                failed_required = [c for c in checks if c.required and not c.status]
                recommendations.append(f"Address {len(failed_required)} failed required criteria before proceeding")
            elif confidence < 0.8:
                recommendations.append("Consider addressing optional criteria to increase success probability")
            else:
                recommendations.append("All criteria met - proceed with pilot launch")

            # Log operation
            operation = {
                "operation": "evaluate_go_nogo",
                "pilot_id": pilot_id,
                "decision": decision,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Go/No-Go decision: {decision} (confidence: {confidence:.1%})")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "decision": decision,
                "confidence": confidence,
                "criteria_summary": {
                    "required_passed": required_passed,
                    "required_total": required_total,
                    "optional_passed": optional_passed,
                    "optional_total": optional_total
                },
                "criteria_checks": [c.to_dict() for c in checks],
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error evaluating Go/No-Go: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def validate_statistically(
        self,
        pilot_id: str,
        sample_data: Dict[str, List[float]],
        confidence_level: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Perform statistical validation with sample size and confidence intervals.

        Args:
            pilot_id: Pilot program identifier
            sample_data: Sample data for metrics
            confidence_level: Desired confidence level (default: 0.95)

        Returns:
            Dictionary containing statistical validation results
        """
        try:
            logger.info(f"Performing statistical validation for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]
            confidence_level = confidence_level or self.default_confidence_level

            validation_results = {}

            for metric_name, values in sample_data.items():
                if not values:
                    continue

                # Calculate statistics
                n = len(values)
                mean = statistics.mean(values)

                if n > 1:
                    stdev = statistics.stdev(values)

                    # Calculate confidence interval (simplified - assumes normal distribution)
                    # For proper implementation, use scipy.stats.t.interval
                    z_score = 1.96 if confidence_level == 0.95 else 2.58  # 95% or 99%
                    margin_of_error = z_score * (stdev / (n ** 0.5))

                    ci_lower = mean - margin_of_error
                    ci_upper = mean + margin_of_error
                else:
                    stdev = 0
                    ci_lower = mean
                    ci_upper = mean

                # Check if sample size is adequate
                adequate_sample = n >= self.min_sample_size

                # Find corresponding metric target
                target_value = None
                for metric in pilot.metrics:
                    if metric.name == metric_name:
                        target_value = metric.target_value
                        break

                # Determine if target is within confidence interval
                target_achievable = (target_value is not None and
                                   ci_lower <= target_value <= ci_upper) if target_value else None

                validation_results[metric_name] = {
                    "sample_size": n,
                    "adequate_sample": adequate_sample,
                    "mean": round(mean, 4),
                    "stdev": round(stdev, 4),
                    "confidence_interval": {
                        "lower": round(ci_lower, 4),
                        "upper": round(ci_upper, 4),
                        "level": confidence_level
                    },
                    "target_value": target_value,
                    "target_within_ci": target_achievable
                }

            # Overall validation assessment
            all_adequate = all(r["adequate_sample"] for r in validation_results.values())
            targets_achievable = sum(1 for r in validation_results.values()
                                   if r["target_within_ci"]) if validation_results else 0

            validation_status = "valid" if all_adequate else "insufficient_sample"

            # Log operation
            operation = {
                "operation": "validate_statistically",
                "pilot_id": pilot_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Statistical validation: {validation_status}, {len(validation_results)} metrics")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "validation_status": validation_status,
                "confidence_level": confidence_level,
                "metrics_validated": validation_results,
                "summary": {
                    "total_metrics": len(validation_results),
                    "adequate_samples": sum(1 for r in validation_results.values() if r["adequate_sample"]),
                    "targets_achievable": targets_achievable
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in statistical validation: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def coordinate_execution(
        self,
        pilot_id: str,
        execution_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Coordinate pilot program execution.

        Args:
            pilot_id: Pilot program identifier
            execution_params: Execution parameters

        Returns:
            Dictionary containing execution plan and status
        """
        try:
            logger.info(f"Coordinating execution for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]

            # Update status
            pilot.status = PilotStatus.RUNNING
            pilot.started_at = datetime.now()

            # Create execution plan
            execution_plan = {
                "kickoff": self._plan_kickoff(pilot),
                "weekly_reviews": self._plan_weekly_reviews(pilot),
                "data_collection": self._plan_data_collection(pilot),
                "stakeholder_updates": self._plan_stakeholder_updates(pilot)
            }

            # Setup monitoring
            monitoring = {
                "metrics_dashboard_url": f"/pilots/{pilot_id}/dashboard",
                "update_frequency": "daily",
                "alert_thresholds": self._define_alert_thresholds(pilot)
            }

            # Log operation
            operation = {
                "operation": "coordinate_execution",
                "pilot_id": pilot_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Pilot execution coordinated: {pilot_id}")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "execution_plan": execution_plan,
                "monitoring": monitoring,
                "started_at": pilot.started_at.isoformat(),
                "expected_completion": (pilot.started_at + timedelta(
                    days=pilot.timeline["total_days"]
                )).isoformat(),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error coordinating execution: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def track_progress(
        self,
        pilot_id: str
    ) -> Dict[str, Any]:
        """
        Track overall pilot progress.

        Args:
            pilot_id: Pilot program identifier

        Returns:
            Dictionary containing progress report
        """
        try:
            logger.info(f"Tracking progress for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]

            # Calculate timeline progress
            timeline_progress = self._calculate_timeline_progress(pilot)

            # Calculate metrics progress
            metrics_progress = self._calculate_metrics_progress(pilot)

            # Calculate participant progress
            participant_progress = self._calculate_participant_progress(pilot)

            # Calculate budget utilization
            budget_utilization = self._calculate_budget_utilization(pilot)

            # Overall health score
            health_score = self._calculate_pilot_health(
                timeline_progress,
                metrics_progress,
                participant_progress,
                budget_utilization
            )

            # Generate status report
            status_report = {
                "timeline": timeline_progress,
                "metrics": metrics_progress,
                "participants": participant_progress,
                "budget": budget_utilization,
                "health_score": health_score,
                "health_status": self._classify_health_status(health_score),
                "blockers": self._identify_blockers(pilot),
                "wins": self._identify_wins(pilot)
            }

            # Log operation
            operation = {
                "operation": "track_progress",
                "pilot_id": pilot_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Progress tracked: health score {health_score:.1f}/100")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "progress_report": status_report,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error tracking progress: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def evaluate_success(
        self,
        pilot_id: str,
        success_criteria: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate pilot program success against criteria.

        Args:
            pilot_id: Pilot program identifier
            success_criteria: Optional custom success criteria

        Returns:
            Dictionary containing success evaluation
        """
        try:
            logger.info(f"Evaluating success for pilot: {pilot_id}")

            if pilot_id not in self.pilots:
                raise ValueError(f"Pilot not found: {pilot_id}")

            pilot = self.pilots[pilot_id]
            criteria = success_criteria or pilot.success_criteria

            # Update status
            pilot.status = PilotStatus.COMPLETED
            pilot.completed_at = datetime.now()

            # Evaluate each criterion
            evaluation_results = self._evaluate_criteria(pilot, criteria)

            # Calculate overall success score
            success_score = self._calculate_success_score(evaluation_results)

            # Determine if pilot was successful
            threshold = criteria.get("success_threshold", 0.7)
            is_successful = success_score >= threshold

            # Extract learnings
            learnings = self._extract_pilot_learnings(pilot, evaluation_results)
            pilot.learnings = learnings

            # Generate final recommendation
            if is_successful:
                pilot.decision = DecisionType.SCALE
                recommendation = "Scale to full production"
            elif success_score >= 0.5:
                pilot.decision = DecisionType.ITERATE
                recommendation = "Iterate based on learnings"
            else:
                pilot.decision = DecisionType.TERMINATE
                recommendation = "Terminate - insufficient evidence of success"

            # Update status
            if is_successful:
                pilot.status = PilotStatus.VALIDATED
            else:
                pilot.status = PilotStatus.FAILED

            # Log operation
            operation = {
                "operation": "evaluate_success",
                "pilot_id": pilot_id,
                "success_score": success_score,
                "is_successful": is_successful,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Success evaluation: {success_score:.1%} - {pilot.decision.value}")

            return {
                "status": "success",
                "pilot_id": pilot_id,
                "is_successful": is_successful,
                "success_score": success_score,
                "evaluation_results": evaluation_results,
                "learnings": learnings,
                "decision": pilot.decision.value,
                "recommendation": recommendation,
                "next_steps": self._generate_next_steps(pilot.decision),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error evaluating success: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    # Helper methods

    def _generate_id(self, base: str) -> str:
        """Generate unique ID"""
        return hashlib.md5(f"{base}_{datetime.now().timestamp()}".encode()).hexdigest()[:16]

    def _classify_value_effort_quadrant(self, value: float, effort: float) -> MatrixQuadrant:
        """Classify initiative into value/effort quadrant"""
        # Assuming 1-10 scale, 5.5 is the midpoint
        high_value = value >= 5.5
        low_effort = effort < 5.5

        if high_value and low_effort:
            return MatrixQuadrant.QUICK_WINS
        elif high_value and not low_effort:
            return MatrixQuadrant.BIG_BETS
        elif not high_value and low_effort:
            return MatrixQuadrant.FILL_INS
        else:
            return MatrixQuadrant.TIME_SINKS

    def _define_pilot_metrics(self, metric_configs: List[Dict[str, Any]]) -> List[Metric]:
        """Define pilot program metrics"""
        metrics = []

        # Add configured metrics
        for idx, config in enumerate(metric_configs):
            metric = Metric(
                metric_id=self._generate_id(f"metric_{idx}"),
                name=config["name"],
                type=config.get("type", "leading"),
                category=config.get("category", "usage"),
                baseline_value=config["baseline"],
                target_value=config["target"],
                unit=config.get("unit", ""),
                measurement_frequency=config.get("frequency", "daily")
            )
            metrics.append(metric)

        # Add default metrics if none configured
        if not metrics:
            metrics = [
                Metric(
                    metric_id=self._generate_id("metric_usage"),
                    name="Daily Active Users",
                    type="leading",
                    category="usage",
                    baseline_value=0,
                    target_value=50,
                    unit="users"
                ),
                Metric(
                    metric_id=self._generate_id("metric_engagement"),
                    name="Engagement Rate",
                    type="leading",
                    category="engagement",
                    baseline_value=0.0,
                    target_value=0.30,
                    unit="%"
                ),
                Metric(
                    metric_id=self._generate_id("metric_retention"),
                    name="7-Day Retention",
                    type="lagging",
                    category="retention",
                    baseline_value=0.0,
                    target_value=0.50,
                    unit="%"
                )
            ]

        return metrics

    def _assess_pilot_risks(
        self,
        program_name: str,
        risk_configs: List[Dict[str, Any]]
    ) -> List[Risk]:
        """Assess pilot program risks"""
        risks = []

        for idx, config in enumerate(risk_configs):
            risk = Risk(
                risk_id=self._generate_id(f"risk_{program_name}_{idx}"),
                description=config["description"],
                probability=config.get("probability", 0.3),
                impact=config.get("impact", 0.5),
                category=config.get("category", "operational"),
                mitigation_plan=config.get("mitigation", "Monitor and respond as needed"),
                owner=config.get("owner", "program_manager")
            )
            risks.append(risk)

        # Add default risks
        if not risks:
            risks = [
                Risk(
                    risk_id=self._generate_id(f"risk_{program_name}_recruitment"),
                    description="Insufficient participant recruitment",
                    probability=0.3,
                    impact=0.7,
                    category="operational",
                    mitigation_plan="Expand recruitment channels, offer incentives",
                    owner="program_manager"
                ),
                Risk(
                    risk_id=self._generate_id(f"risk_{program_name}_technical"),
                    description="Technical issues affecting user experience",
                    probability=0.4,
                    impact=0.6,
                    category="technical",
                    mitigation_plan="Thorough testing, rapid response team",
                    owner="tech_lead"
                )
            ]

        return risks

    def _create_pilot_timeline(self, duration_weeks: int) -> Dict[str, Any]:
        """Create pilot timeline"""
        start_date = datetime.now()

        return {
            "start_date": start_date.isoformat(),
            "end_date": (start_date + timedelta(weeks=duration_weeks)).isoformat(),
            "duration_weeks": duration_weeks,
            "total_days": duration_weeks * 7,
            "phases": [
                {
                    "phase": "Setup",
                    "duration_days": 7,
                    "start": start_date.isoformat(),
                    "end": (start_date + timedelta(days=7)).isoformat()
                },
                {
                    "phase": "Recruitment",
                    "duration_days": 7,
                    "start": (start_date + timedelta(days=7)).isoformat(),
                    "end": (start_date + timedelta(days=14)).isoformat()
                },
                {
                    "phase": "Execution",
                    "duration_days": (duration_weeks - 3) * 7,
                    "start": (start_date + timedelta(days=14)).isoformat(),
                    "end": (start_date + timedelta(days=(duration_weeks - 1) * 7)).isoformat()
                },
                {
                    "phase": "Analysis",
                    "duration_days": 7,
                    "start": (start_date + timedelta(days=(duration_weeks - 1) * 7)).isoformat(),
                    "end": (start_date + timedelta(weeks=duration_weeks)).isoformat()
                }
            ]
        }

    def _estimate_pilot_budget(self, participants: int, duration_weeks: int) -> Dict[str, float]:
        """Estimate pilot budget"""
        # Simplified budget estimation
        participant_incentive = participants * 50  # $50 per participant
        tools_software = 500 * duration_weeks  # $500/week
        personnel = 2000 * duration_weeks  # $2000/week for staff
        contingency = (participant_incentive + tools_software + personnel) * 0.15

        return {
            "participant_incentives": participant_incentive,
            "tools_and_software": tools_software,
            "personnel": personnel,
            "contingency": contingency,
            "total": participant_incentive + tools_software + personnel + contingency,
            "currency": "USD"
        }

    def _define_success_criteria(self, metrics: List[Metric]) -> Dict[str, Any]:
        """Define success criteria for pilot"""
        return {
            "primary_metrics": [m.name for m in metrics if m.type == "lagging"],
            "secondary_metrics": [m.name for m in metrics if m.type == "leading"],
            "minimum_completion_rate": 0.80,
            "minimum_satisfaction_score": 7.0,
            "success_threshold": 0.70,
            "statistical_significance": 0.95
        }

    def _generate_planning_recommendations(self, pilot: PilotProgram) -> List[str]:
        """Generate planning recommendations"""
        recommendations = []

        # ICE-based recommendations
        if pilot.ice_score.calculate() >= 7:
            recommendations.append("High priority - fast-track approval and execution")
        elif pilot.ice_score.ease < 4:
            recommendations.append("Consider simplifying scope to improve feasibility")

        # RICE-based recommendations
        if pilot.rice_score.calculate() >= 50:
            recommendations.append("Strong business case - allocate sufficient resources")

        # Quadrant-based recommendations
        if pilot.value_effort_quadrant == MatrixQuadrant.QUICK_WINS:
            recommendations.append("Quick win opportunity - execute immediately")
        elif pilot.value_effort_quadrant == MatrixQuadrant.BIG_BETS:
            recommendations.append("Big bet - ensure executive sponsorship and adequate budget")
        elif pilot.value_effort_quadrant == MatrixQuadrant.TIME_SINKS:
            recommendations.append("Low ROI - reconsider or deprioritize")

        # Risk-based recommendations
        critical_risks = [r for r in pilot.risks if r.severity_level() == RiskLevel.CRITICAL]
        if critical_risks:
            recommendations.append(f"Mitigate {len(critical_risks)} critical risks before launch")

        return recommendations

    def _calculate_priority_rank(self, ice: ICEScore, rice: RICEScore) -> str:
        """Calculate priority ranking"""
        ice_score = ice.calculate()
        rice_score = rice.calculate()

        # Normalize RICE to 1-10 scale (log scale)
        import math
        rice_normalized = min(10, max(1, math.log10(rice_score + 1) * 3))

        # Combined score
        combined = (ice_score + rice_normalized) / 2

        if combined >= 8:
            return "P0 - Critical"
        elif combined >= 6:
            return "P1 - High"
        elif combined >= 4:
            return "P2 - Medium"
        else:
            return "P3 - Low"

    def _create_metrics_dashboard(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Create metrics dashboard data"""
        dashboard = {
            "pilot_id": pilot.pilot_id,
            "pilot_name": pilot.name,
            "status": pilot.status.value,
            "metrics": [m.to_dict() for m in pilot.metrics],
            "overall_progress": statistics.mean([m.progress_percentage() for m in pilot.metrics if m.current_value is not None]) if pilot.metrics else 0,
            "metrics_on_track": sum(1 for m in pilot.metrics if m.is_on_track()),
            "total_metrics": len(pilot.metrics)
        }

        return dashboard

    def _check_metric_alerts(self, pilot: PilotProgram) -> List[Dict[str, str]]:
        """Check for metric alerts"""
        alerts = []

        for metric in pilot.metrics:
            if metric.current_value is None:
                continue

            progress = metric.progress_percentage()

            if progress < 25:
                alerts.append({
                    "severity": "high",
                    "metric": metric.name,
                    "message": f"{metric.name} significantly below target ({progress:.0f}% progress)"
                })
            elif progress < 50:
                alerts.append({
                    "severity": "medium",
                    "metric": metric.name,
                    "message": f"{metric.name} below target ({progress:.0f}% progress)"
                })

        return alerts

    def _analyze_metrics_performance(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Analyze metrics performance"""
        metrics_with_values = [m for m in pilot.metrics if m.current_value is not None]

        if not metrics_with_values:
            return {"status": "no_data"}

        avg_progress = statistics.mean([m.progress_percentage() for m in metrics_with_values])
        on_track_count = sum(1 for m in metrics_with_values if m.is_on_track())

        return {
            "average_progress": avg_progress,
            "on_track_count": on_track_count,
            "total_metrics": len(metrics_with_values),
            "on_track_percentage": (on_track_count / len(metrics_with_values)) * 100,
            "status": "good" if avg_progress >= 70 else "moderate" if avg_progress >= 40 else "poor"
        }

    def _check_success_criteria(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Check success criteria"""
        criteria = pilot.success_criteria
        metrics_performance = self._analyze_metrics_performance(pilot)

        criteria_met = {
            "metrics_threshold": metrics_performance.get("on_track_percentage", 0) >= (criteria.get("success_threshold", 0.7) * 100),
            "completion_rate": True,  # Would be calculated from actual data
            "confidence": 0.75  # Simplified
        }

        return criteria_met

    def _calculate_decision_score(
        self,
        metrics_performance: Dict[str, Any],
        criteria_met: Dict[str, Any],
        evidence: Dict[str, Any]
    ) -> float:
        """Calculate decision score for pivot/persevere"""
        score = 0.0

        # Metrics weight: 50%
        if metrics_performance.get("status") == "good":
            score += 0.5
        elif metrics_performance.get("status") == "moderate":
            score += 0.25

        # Criteria weight: 30%
        if criteria_met.get("metrics_threshold"):
            score += 0.30

        # Evidence weight: 20%
        user_feedback = evidence.get("user_feedback_positive_ratio", 0.5)
        score += user_feedback * 0.20

        return score

    def _make_pivot_persevere_decision(self, score: float, pilot: PilotProgram) -> DecisionType:
        """Make pivot/persevere decision based on score"""
        if score >= 0.80:
            return DecisionType.SCALE
        elif score >= 0.60:
            return DecisionType.PERSEVERE
        elif score >= 0.40:
            return DecisionType.ITERATE
        elif score >= 0.20:
            return DecisionType.PIVOT
        else:
            return DecisionType.TERMINATE

    def _generate_decision_rationale(
        self,
        decision: DecisionType,
        metrics_performance: Dict[str, Any],
        criteria_met: Dict[str, Any]
    ) -> List[str]:
        """Generate rationale for decision"""
        rationale = []

        if decision == DecisionType.SCALE:
            rationale.append("Strong metrics performance across all KPIs")
            rationale.append("Success criteria exceeded")
            rationale.append("Ready for full-scale deployment")
        elif decision == DecisionType.PERSEVERE:
            rationale.append("Positive trends in key metrics")
            rationale.append("Most success criteria met")
            rationale.append("Continue with current approach")
        elif decision == DecisionType.ITERATE:
            rationale.append("Mixed results - some metrics on track")
            rationale.append("Learnings suggest path to improvement")
            rationale.append("Modify approach based on insights")
        elif decision == DecisionType.PIVOT:
            rationale.append("Metrics below expectations")
            rationale.append("Core assumptions need reassessment")
            rationale.append("Consider alternative approach")
        else:
            rationale.append("Insufficient evidence of viability")
            rationale.append("Resources better allocated elsewhere")
            rationale.append("Terminate and document learnings")

        return rationale

    def _generate_next_steps(self, decision: DecisionType) -> List[str]:
        """Generate next steps based on decision"""
        steps = {
            DecisionType.SCALE: [
                "Prepare scaling plan and resource requirements",
                "Communicate success to stakeholders",
                "Begin full deployment planning",
                "Set up production monitoring"
            ],
            DecisionType.PERSEVERE: [
                "Continue pilot as planned",
                "Monitor metrics closely",
                "Optimize based on learnings",
                "Plan for scale when targets met"
            ],
            DecisionType.ITERATE: [
                "Analyze underperforming areas",
                "Develop iteration plan",
                "Implement improvements",
                "Re-test with refined approach"
            ],
            DecisionType.PIVOT: [
                "Conduct root cause analysis",
                "Gather additional customer feedback",
                "Formulate alternative hypothesis",
                "Design new pilot test"
            ],
            DecisionType.TERMINATE: [
                "Document all learnings",
                "Communicate decision to stakeholders",
                "Archive pilot data",
                "Reallocate resources to other initiatives"
            ]
        }

        return steps.get(decision, ["Review decision and plan next actions"])

    def _calculate_overall_risk(self, risks: List[Risk]) -> float:
        """Calculate overall risk score"""
        if not risks:
            return 0.0

        # Weighted average based on severity
        total_severity = sum(r.severity_score() for r in risks)
        return total_severity / len(risks)

    def _prioritize_risk_mitigation(self, risks: List[Risk]) -> List[Dict[str, Any]]:
        """Prioritize risks for mitigation"""
        sorted_risks = sorted(risks, key=lambda r: r.severity_score(), reverse=True)

        return [
            {
                "risk_id": r.risk_id,
                "description": r.description,
                "severity": r.severity_level().value,
                "mitigation_plan": r.mitigation_plan,
                "owner": r.owner
            }
            for r in sorted_risks[:5]  # Top 5 risks
        ]

    def _classify_risk_level(self, overall_risk: float) -> str:
        """Classify overall risk level"""
        if overall_risk >= 0.75:
            return "critical"
        elif overall_risk >= 0.50:
            return "high"
        elif overall_risk >= 0.25:
            return "medium"
        else:
            return "low"

    def _plan_kickoff(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Plan pilot kickoff"""
        return {
            "date": pilot.timeline["start_date"],
            "agenda": [
                "Present pilot objectives and hypothesis",
                "Review success criteria and metrics",
                "Assign roles and responsibilities",
                "Review timeline and milestones",
                "Q&A and alignment"
            ],
            "attendees": ["pilot_team", "stakeholders", "participants_sample"]
        }

    def _plan_weekly_reviews(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Plan weekly review cadence"""
        return {
            "frequency": "weekly",
            "day": "Friday",
            "agenda": [
                "Review weekly metrics",
                "Discuss blockers and risks",
                "Plan next week activities",
                "Update stakeholders"
            ]
        }

    def _plan_data_collection(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Plan data collection approach"""
        return {
            "automated_metrics": [m.name for m in pilot.metrics],
            "surveys": "Weekly participant surveys",
            "interviews": "Bi-weekly participant interviews (5 participants)",
            "observation": "Daily usage observation and notes"
        }

    def _plan_stakeholder_updates(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Plan stakeholder update cadence"""
        return {
            "frequency": "bi-weekly",
            "format": "Email summary + dashboard link",
            "content": [
                "Metrics progress",
                "Key learnings",
                "Risks and mitigations",
                "Next steps"
            ]
        }

    def _define_alert_thresholds(self, pilot: PilotProgram) -> Dict[str, float]:
        """Define alert thresholds for monitoring"""
        return {
            "metric_below_target": 0.25,  # Alert if metric < 25% of target
            "participation_drop": 0.20,  # Alert if participation drops 20%
            "error_rate": 0.05,  # Alert if error rate > 5%
            "satisfaction_drop": 2.0  # Alert if satisfaction drops by 2 points
        }

    def _calculate_timeline_progress(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Calculate timeline progress"""
        if not pilot.started_at:
            return {"progress": 0, "status": "not_started"}

        now = datetime.now()
        total_days = pilot.timeline["total_days"]
        elapsed_days = (now - pilot.started_at).days

        progress = min(100, (elapsed_days / total_days) * 100)

        return {
            "progress_percentage": progress,
            "elapsed_days": elapsed_days,
            "remaining_days": max(0, total_days - elapsed_days),
            "status": "on_track" if progress <= 100 else "overdue"
        }

    def _calculate_metrics_progress(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Calculate metrics progress"""
        metrics_with_values = [m for m in pilot.metrics if m.current_value is not None]

        if not metrics_with_values:
            return {"progress": 0, "status": "no_data"}

        avg_progress = statistics.mean([m.progress_percentage() for m in metrics_with_values])

        return {
            "average_progress": avg_progress,
            "on_track": sum(1 for m in metrics_with_values if m.is_on_track()),
            "total": len(metrics_with_values),
            "status": "on_track" if avg_progress >= 70 else "at_risk" if avg_progress >= 40 else "off_track"
        }

    def _calculate_participant_progress(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Calculate participant recruitment/retention progress"""
        target = pilot.participants["target_size"]
        recruited = pilot.participants.get("recruited", 0)
        active = pilot.participants.get("active", recruited)

        recruitment_rate = (recruited / target) * 100 if target > 0 else 0
        retention_rate = (active / recruited) * 100 if recruited > 0 else 100

        return {
            "recruited": recruited,
            "target": target,
            "active": active,
            "recruitment_rate": recruitment_rate,
            "retention_rate": retention_rate,
            "status": "on_track" if recruitment_rate >= 80 else "at_risk"
        }

    def _calculate_budget_utilization(self, pilot: PilotProgram) -> Dict[str, Any]:
        """Calculate budget utilization"""
        total_budget = pilot.budget["total"]
        # In production, track actual spend
        estimated_spend = total_budget * 0.6  # Placeholder

        return {
            "total_budget": total_budget,
            "estimated_spend": estimated_spend,
            "utilization_rate": (estimated_spend / total_budget) * 100,
            "remaining": total_budget - estimated_spend,
            "status": "on_track"
        }

    def _calculate_pilot_health(
        self,
        timeline: Dict[str, Any],
        metrics: Dict[str, Any],
        participants: Dict[str, Any],
        budget: Dict[str, Any]
    ) -> float:
        """Calculate overall pilot health score"""
        scores = []

        # Timeline health (25%)
        if timeline.get("status") == "on_track":
            scores.append(100)
        elif timeline.get("progress_percentage", 0) <= 110:
            scores.append(75)
        else:
            scores.append(50)

        # Metrics health (40%)
        metrics_status = metrics.get("status", "no_data")
        if metrics_status == "on_track":
            scores.append(100)
        elif metrics_status == "at_risk":
            scores.append(60)
        else:
            scores.append(30)

        # Participants health (20%)
        if participants.get("status") == "on_track":
            scores.append(100)
        else:
            scores.append(60)

        # Budget health (15%)
        if budget.get("utilization_rate", 0) <= 100:
            scores.append(100)
        else:
            scores.append(50)

        # Weighted average
        weights = [0.25, 0.40, 0.20, 0.15]
        return sum(s * w for s, w in zip(scores, weights))

    def _classify_health_status(self, health_score: float) -> str:
        """Classify pilot health status"""
        if health_score >= 80:
            return "healthy"
        elif health_score >= 60:
            return "moderate"
        else:
            return "at_risk"

    def _identify_blockers(self, pilot: PilotProgram) -> List[str]:
        """Identify pilot blockers"""
        blockers = []

        # Check critical risks
        critical_risks = [r for r in pilot.risks if r.severity_level() == RiskLevel.CRITICAL]
        if critical_risks:
            for risk in critical_risks:
                blockers.append(f"Critical risk: {risk.description}")

        # Check metrics
        for metric in pilot.metrics:
            if metric.current_value is not None and metric.progress_percentage() < 25:
                blockers.append(f"Metric significantly underperforming: {metric.name}")

        return blockers

    def _identify_wins(self, pilot: PilotProgram) -> List[str]:
        """Identify pilot wins"""
        wins = []

        for metric in pilot.metrics:
            if metric.is_on_track():
                wins.append(f"{metric.name} on track: {metric.current_value}{metric.unit}")

        return wins

    def _evaluate_criteria(
        self,
        pilot: PilotProgram,
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate success criteria"""
        results = {}

        # Primary metrics
        primary_met = sum(
            1 for m in pilot.metrics
            if m.type == "lagging" and m.is_on_track()
        )
        primary_total = sum(1 for m in pilot.metrics if m.type == "lagging")
        results["primary_metrics"] = {
            "met": primary_met,
            "total": primary_total,
            "percentage": (primary_met / primary_total * 100) if primary_total > 0 else 0
        }

        # Secondary metrics
        secondary_met = sum(
            1 for m in pilot.metrics
            if m.type == "leading" and m.is_on_track()
        )
        secondary_total = sum(1 for m in pilot.metrics if m.type == "leading")
        results["secondary_metrics"] = {
            "met": secondary_met,
            "total": secondary_total,
            "percentage": (secondary_met / secondary_total * 100) if secondary_total > 0 else 0
        }

        return results

    def _calculate_success_score(self, evaluation_results: Dict[str, Any]) -> float:
        """Calculate overall success score"""
        primary_pct = evaluation_results["primary_metrics"]["percentage"] / 100
        secondary_pct = evaluation_results["secondary_metrics"]["percentage"] / 100

        # Weight primary metrics higher (70/30)
        return primary_pct * 0.7 + secondary_pct * 0.3

    def _extract_pilot_learnings(
        self,
        pilot: PilotProgram,
        evaluation_results: Dict[str, Any]
    ) -> List[str]:
        """Extract learnings from pilot"""
        learnings = []

        # Hypothesis validation
        success_score = self._calculate_success_score(evaluation_results)
        if success_score >= 0.7:
            learnings.append(f"Hypothesis validated: {pilot.hypothesis}")
        else:
            learnings.append(f"Hypothesis not validated: {pilot.hypothesis}")

        # Metric-specific learnings
        for metric in pilot.metrics:
            if metric.current_value is not None:
                if metric.is_on_track():
                    learnings.append(f"{metric.name} exceeded expectations ({metric.current_value}{metric.unit})")
                else:
                    learnings.append(f"{metric.name} below target - investigate drivers")

        # Risk learnings
        high_severity_risks = [r for r in pilot.risks if r.severity_score() >= 0.5]
        if high_severity_risks:
            learnings.append(f"Key risks materialized: {len(high_severity_risks)} high-severity events")

        return learnings

    def get_history_summary(self) -> Dict[str, Any]:
        """
        Get summary of operations history.

        Returns:
            Dictionary containing history summary
        """
        return {
            "total_operations": len(self.history),
            "recent_operations": self.history[-10:] if self.history else [],
            "agent_id": self.agent_id,
            "statistics": {
                "total_pilots": len(self.pilots),
                "active_pilots": len([p for p in self.pilots.values() if p.status == PilotStatus.RUNNING]),
                "completed_pilots": len([p for p in self.pilots.values() if p.status in [PilotStatus.COMPLETED, PilotStatus.VALIDATED]]),
                "successful_pilots": len([p for p in self.pilots.values() if p.status == PilotStatus.VALIDATED])
            }
        }
