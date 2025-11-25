"""
Tool Evaluator Agent - Portfolio Manager

Evaluates software tools, platforms, and technologies for agency adoption using
structured frameworks including portfolio balancing, prioritization scoring,
innovation pipeline management, and ROI tracking.

This agent serves as the Portfolio Manager role, implementing:
- Portfolio Balancing (H1/H2/H3 distribution: 70/20/10 resource allocation)
- Prioritization Scoring (Strategic Fit 30% + ROI 25% + Risk 20% + Resources 25%)
- Innovation Pipeline (Stage-gate process: Ideation → Validation → Development → Launch)
- ROI Tracking (Costs vs Benefits by project)
- Innovation Accounting (Validated learning metrics)
- Portfolio Visualization (bubble charts: risk/reward/resource)
- Strategic Alignment Scoring
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


class Horizon(Enum):
    """Innovation horizon classification"""
    H1_CORE = "h1_core"  # Core business - 70% resources
    H2_EMERGING = "h2_emerging"  # Emerging opportunities - 20% resources
    H3_FUTURE = "h3_future"  # Future bets - 10% resources


class PipelineStage(Enum):
    """Innovation pipeline stage-gate process"""
    IDEATION = "ideation"
    VALIDATION = "validation"
    DEVELOPMENT = "development"
    LAUNCH = "launch"
    SCALE = "scale"
    SUNSET = "sunset"


class InitiativeStatus(Enum):
    """Initiative lifecycle status"""
    PROPOSED = "proposed"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    SCALED = "scaled"


class ToolCategory(Enum):
    """Tool category classification"""
    CRM = "crm"
    PROJECT_MANAGEMENT = "project_management"
    ANALYTICS = "analytics"
    COMMUNICATION = "communication"
    DEVELOPMENT = "development"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    HR = "hr"
    FINANCE = "finance"


@dataclass
class PrioritizationScore:
    """Multi-factor prioritization scoring"""
    strategic_fit: float  # 0-100, weight 30%
    roi_potential: float  # 0-100, weight 25%
    risk_level: float  # 0-100 (inverse), weight 20%
    resource_availability: float  # 0-100, weight 25%

    def calculate(self) -> float:
        """Calculate weighted prioritization score"""
        return (
            self.strategic_fit * 0.30 +
            self.roi_potential * 0.25 +
            (100 - self.risk_level) * 0.20 +
            self.resource_availability * 0.25
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategic_fit": self.strategic_fit,
            "roi_potential": self.roi_potential,
            "risk_level": self.risk_level,
            "resource_availability": self.resource_availability,
            "total_score": self.calculate()
        }


@dataclass
class ROIMetrics:
    """ROI tracking metrics"""
    initial_cost: float
    ongoing_costs_annual: float
    implementation_costs: float
    expected_benefits_annual: float
    time_to_value_months: int
    confidence_level: float  # 0-1

    def calculate_roi(self) -> float:
        """Calculate ROI percentage"""
        total_investment = self.initial_cost + self.implementation_costs
        if total_investment == 0:
            return 0.0

        net_benefit = self.expected_benefits_annual - self.ongoing_costs_annual
        return (net_benefit / total_investment) * 100

    def calculate_payback_period(self) -> float:
        """Calculate payback period in months"""
        total_investment = self.initial_cost + self.implementation_costs
        monthly_benefit = (self.expected_benefits_annual - self.ongoing_costs_annual) / 12

        if monthly_benefit <= 0:
            return float('inf')

        return total_investment / monthly_benefit

    def calculate_npv(self, years: int = 3, discount_rate: float = 0.10) -> float:
        """Calculate Net Present Value"""
        total_investment = self.initial_cost + self.implementation_costs
        annual_cash_flow = self.expected_benefits_annual - self.ongoing_costs_annual

        npv = -total_investment
        for year in range(1, years + 1):
            npv += annual_cash_flow / ((1 + discount_rate) ** year)

        return npv

    def to_dict(self) -> Dict[str, Any]:
        return {
            "initial_cost": self.initial_cost,
            "ongoing_costs_annual": self.ongoing_costs_annual,
            "implementation_costs": self.implementation_costs,
            "expected_benefits_annual": self.expected_benefits_annual,
            "time_to_value_months": self.time_to_value_months,
            "confidence_level": self.confidence_level,
            "roi_percentage": self.calculate_roi(),
            "payback_period_months": self.calculate_payback_period(),
            "npv_3yr": self.calculate_npv()
        }


@dataclass
class InnovationMetrics:
    """Innovation accounting metrics (validated learning)"""
    metric_id: str
    metric_name: str
    baseline_value: float
    current_value: float
    target_value: float
    measurement_unit: str
    is_validated: bool = False
    validation_date: Optional[datetime] = None

    def progress_percentage(self) -> float:
        """Calculate progress towards target"""
        if self.target_value == self.baseline_value:
            return 100.0 if self.current_value >= self.target_value else 0.0

        progress = ((self.current_value - self.baseline_value) /
                   (self.target_value - self.baseline_value)) * 100
        return max(0.0, min(100.0, progress))

    def is_on_track(self) -> bool:
        """Check if metric is on track"""
        return self.current_value >= self.target_value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_id": self.metric_id,
            "metric_name": self.metric_name,
            "baseline_value": self.baseline_value,
            "current_value": self.current_value,
            "target_value": self.target_value,
            "measurement_unit": self.measurement_unit,
            "progress_percentage": self.progress_percentage(),
            "is_on_track": self.is_on_track(),
            "is_validated": self.is_validated,
            "validation_date": self.validation_date.isoformat() if self.validation_date else None
        }


@dataclass
class ToolEvaluation:
    """Comprehensive tool evaluation"""
    evaluation_id: str
    tool_name: str
    category: ToolCategory
    vendor: str
    evaluation_date: datetime
    scores: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    overall_rating: float
    recommendation: str
    evaluated_by: str
    criteria: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evaluation_id": self.evaluation_id,
            "tool_name": self.tool_name,
            "category": self.category.value,
            "vendor": self.vendor,
            "evaluation_date": self.evaluation_date.isoformat(),
            "scores": self.scores,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "overall_rating": self.overall_rating,
            "recommendation": self.recommendation,
            "evaluated_by": self.evaluated_by,
            "criteria": self.criteria
        }


@dataclass
class Initiative:
    """Innovation initiative"""
    initiative_id: str
    name: str
    description: str
    horizon: Horizon
    pipeline_stage: PipelineStage
    status: InitiativeStatus
    priority_score: PrioritizationScore
    roi_metrics: ROIMetrics
    innovation_metrics: List[InnovationMetrics]
    strategic_alignment: float  # 0-100
    resource_allocation: Dict[str, float]
    owner: str
    created_at: datetime
    last_updated: datetime
    gate_criteria: Dict[str, bool] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "initiative_id": self.initiative_id,
            "name": self.name,
            "description": self.description,
            "horizon": self.horizon.value,
            "pipeline_stage": self.pipeline_stage.value,
            "status": self.status.value,
            "priority_score": self.priority_score.to_dict(),
            "roi_metrics": self.roi_metrics.to_dict(),
            "innovation_metrics": [m.to_dict() for m in self.innovation_metrics],
            "strategic_alignment": self.strategic_alignment,
            "resource_allocation": self.resource_allocation,
            "owner": self.owner,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "gate_criteria": self.gate_criteria
        }


class ToolEvaluatorAgent:
    """
    Tool Evaluator Agent - Portfolio Manager

    Responsible for:
    - Portfolio balancing across innovation horizons (H1/H2/H3)
    - Multi-factor prioritization scoring
    - Innovation pipeline management with stage-gates
    - ROI tracking and financial analysis
    - Innovation accounting and learning metrics
    - Portfolio visualization and reporting
    - Strategic alignment assessment

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        initiatives (Dict[str, Initiative]): Portfolio initiatives
        evaluations (Dict[str, ToolEvaluation]): Tool evaluations
        history (List[Dict]): Operation history
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Tool Evaluator / Portfolio Manager Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "tool_evaluator_001"
        self.config = config or {}
        self.name = "Portfolio Manager"
        self.role = "Innovation Portfolio Management"

        # Core data structures
        self.initiatives: Dict[str, Initiative] = {}
        self.evaluations: Dict[str, ToolEvaluation] = {}
        self.history: List[Dict[str, Any]] = []

        # Portfolio configuration
        self.target_allocation = self.config.get("target_allocation", {
            "h1_core": 0.70,
            "h2_emerging": 0.20,
            "h3_future": 0.10
        })

        logger.info(f"Initialized {self.name} agent with ID: {self.agent_id}")

    def balance_portfolio(
        self,
        total_resources: float,
        current_initiatives: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Balance portfolio across innovation horizons (H1/H2/H3).

        Args:
            total_resources: Total available resources (budget, FTE, etc.)
            current_initiatives: Optional list of initiative IDs to rebalance

        Returns:
            Dictionary containing balanced portfolio allocation
        """
        try:
            logger.info(f"Balancing portfolio with {total_resources} total resources")

            # Get initiatives to balance
            if current_initiatives:
                initiatives = [self.initiatives[iid] for iid in current_initiatives
                             if iid in self.initiatives]
            else:
                initiatives = list(self.initiatives.values())

            # Group by horizon
            horizon_groups = {
                Horizon.H1_CORE: [],
                Horizon.H2_EMERGING: [],
                Horizon.H3_FUTURE: []
            }

            for initiative in initiatives:
                if initiative.status not in [InitiativeStatus.CANCELLED, InitiativeStatus.COMPLETED]:
                    horizon_groups[initiative.horizon].append(initiative)

            # Calculate current allocation
            current_allocation = {}
            total_allocated = sum(
                sum(init.resource_allocation.values())
                for init_list in horizon_groups.values()
                for init in init_list
            )

            for horizon, init_list in horizon_groups.items():
                allocated = sum(
                    sum(init.resource_allocation.values())
                    for init in init_list
                )
                current_allocation[horizon.value] = {
                    "amount": allocated,
                    "percentage": (allocated / total_allocated * 100) if total_allocated > 0 else 0,
                    "initiative_count": len(init_list)
                }

            # Calculate target allocation
            target_allocation = {
                "h1_core": {
                    "amount": total_resources * self.target_allocation["h1_core"],
                    "percentage": self.target_allocation["h1_core"] * 100,
                    "target": self.target_allocation["h1_core"]
                },
                "h2_emerging": {
                    "amount": total_resources * self.target_allocation["h2_emerging"],
                    "percentage": self.target_allocation["h2_emerging"] * 100,
                    "target": self.target_allocation["h2_emerging"]
                },
                "h3_future": {
                    "amount": total_resources * self.target_allocation["h3_future"],
                    "percentage": self.target_allocation["h3_future"] * 100,
                    "target": self.target_allocation["h3_future"]
                }
            }

            # Calculate variance
            variance = {}
            for horizon_key in target_allocation.keys():
                current_pct = current_allocation.get(horizon_key, {}).get("percentage", 0)
                target_pct = target_allocation[horizon_key]["percentage"]
                variance[horizon_key] = target_pct - current_pct

            # Generate rebalancing recommendations
            recommendations = self._generate_rebalancing_recommendations(
                current_allocation,
                target_allocation,
                variance,
                horizon_groups
            )

            # Log operation
            operation = {
                "operation": "balance_portfolio",
                "total_resources": total_resources,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info("Portfolio balancing complete")

            return {
                "status": "success",
                "total_resources": total_resources,
                "current_allocation": current_allocation,
                "target_allocation": target_allocation,
                "variance": variance,
                "recommendations": recommendations,
                "is_balanced": all(abs(v) < 5 for v in variance.values()),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error balancing portfolio: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def calculate_priority_score(
        self,
        initiative_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate multi-factor weighted prioritization score.

        Args:
            initiative_data: Initiative data with scoring factors

        Returns:
            Dictionary containing prioritization analysis
        """
        try:
            logger.info("Calculating priority score")

            # Create prioritization score
            priority = PrioritizationScore(
                strategic_fit=initiative_data.get("strategic_fit", 50),
                roi_potential=initiative_data.get("roi_potential", 50),
                risk_level=initiative_data.get("risk_level", 50),
                resource_availability=initiative_data.get("resource_availability", 50)
            )

            total_score = priority.calculate()

            # Determine priority level
            if total_score >= 80:
                priority_level = "P0 - Critical"
            elif total_score >= 65:
                priority_level = "P1 - High"
            elif total_score >= 50:
                priority_level = "P2 - Medium"
            else:
                priority_level = "P3 - Low"

            # Generate insights
            insights = []
            if priority.strategic_fit >= 80:
                insights.append("Strong strategic alignment - high priority for execution")
            if priority.roi_potential >= 80:
                insights.append("Excellent ROI potential - strong business case")
            if priority.risk_level >= 70:
                insights.append("High risk level - implement risk mitigation strategies")
            if priority.resource_availability <= 30:
                insights.append("Limited resources - may need to defer or phase approach")

            return {
                "status": "success",
                "priority_score": total_score,
                "priority_level": priority_level,
                "components": priority.to_dict(),
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating priority score: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def manage_pipeline(
        self,
        initiative_id: str,
        action: str,
        gate_criteria: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Manage innovation pipeline with stage-gate process.

        Args:
            initiative_id: Initiative identifier
            action: Action (evaluate_gate, advance_stage, hold, kill)
            gate_criteria: Optional gate criteria evaluation

        Returns:
            Dictionary containing pipeline management results
        """
        try:
            logger.info(f"Managing pipeline for initiative: {initiative_id}")

            if initiative_id not in self.initiatives:
                raise ValueError(f"Initiative not found: {initiative_id}")

            initiative = self.initiatives[initiative_id]

            if action == "evaluate_gate":
                result = self._evaluate_stage_gate(initiative, gate_criteria or {})
            elif action == "advance_stage":
                result = self._advance_pipeline_stage(initiative)
            elif action == "hold":
                result = self._hold_initiative(initiative)
            elif action == "kill":
                result = self._kill_initiative(initiative)
            else:
                raise ValueError(f"Unknown action: {action}")

            # Log operation
            operation = {
                "operation": "manage_pipeline",
                "initiative_id": initiative_id,
                "action": action,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Pipeline management complete: {action}")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "action": action,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error managing pipeline: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def track_roi(
        self,
        initiative_id: str,
        actual_metrics: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Track ROI and financial metrics for initiative.

        Args:
            initiative_id: Initiative identifier
            actual_metrics: Optional actual metrics vs projections

        Returns:
            Dictionary containing ROI tracking results
        """
        try:
            logger.info(f"Tracking ROI for initiative: {initiative_id}")

            if initiative_id not in self.initiatives:
                raise ValueError(f"Initiative not found: {initiative_id}")

            initiative = self.initiatives[initiative_id]
            roi_metrics = initiative.roi_metrics

            # Calculate financial metrics
            roi_percentage = roi_metrics.calculate_roi()
            payback_period = roi_metrics.calculate_payback_period()
            npv = roi_metrics.calculate_npv()

            # Calculate variance if actual metrics provided
            variance = {}
            if actual_metrics:
                for key, actual_value in actual_metrics.items():
                    if hasattr(roi_metrics, key):
                        projected_value = getattr(roi_metrics, key)
                        variance[key] = {
                            "projected": projected_value,
                            "actual": actual_value,
                            "variance": actual_value - projected_value,
                            "variance_percentage": ((actual_value - projected_value) / projected_value * 100)
                                                 if projected_value != 0 else 0
                        }

            # Assess financial health
            health_status = self._assess_financial_health(roi_percentage, payback_period, npv)

            # Generate insights
            insights = self._generate_roi_insights(roi_metrics, variance)

            # Log operation
            operation = {
                "operation": "track_roi",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"ROI tracked: {roi_percentage:.1f}% ROI, {payback_period:.1f} month payback")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "initiative_name": initiative.name,
                "roi_metrics": roi_metrics.to_dict(),
                "variance_analysis": variance,
                "health_status": health_status,
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error tracking ROI: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def measure_innovation_accounting(
        self,
        initiative_id: str,
        metric_updates: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Measure innovation accounting (validated learning metrics).

        Args:
            initiative_id: Initiative identifier
            metric_updates: Current metric values

        Returns:
            Dictionary containing innovation accounting results
        """
        try:
            logger.info(f"Measuring innovation accounting for: {initiative_id}")

            if initiative_id not in self.initiatives:
                raise ValueError(f"Initiative not found: {initiative_id}")

            initiative = self.initiatives[initiative_id]

            # Update metrics
            for metric in initiative.innovation_metrics:
                if metric.metric_name in metric_updates:
                    metric.current_value = metric_updates[metric.metric_name]

                    # Check if validated
                    if metric.is_on_track() and not metric.is_validated:
                        metric.is_validated = True
                        metric.validation_date = datetime.now()

            # Calculate learning metrics
            total_metrics = len(initiative.innovation_metrics)
            validated_metrics = sum(1 for m in initiative.innovation_metrics if m.is_validated)
            on_track_metrics = sum(1 for m in initiative.innovation_metrics if m.is_on_track())
            avg_progress = statistics.mean([m.progress_percentage()
                                          for m in initiative.innovation_metrics])

            # Determine validation status
            validation_rate = (validated_metrics / total_metrics * 100) if total_metrics > 0 else 0

            if validation_rate >= 75:
                validation_status = "highly_validated"
            elif validation_rate >= 50:
                validation_status = "validated"
            elif validation_rate >= 25:
                validation_status = "partially_validated"
            else:
                validation_status = "unvalidated"

            # Generate learnings
            learnings = self._extract_innovation_learnings(initiative)

            # Log operation
            operation = {
                "operation": "measure_innovation_accounting",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Innovation accounting: {validation_rate:.0f}% validated")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "metrics": [m.to_dict() for m in initiative.innovation_metrics],
                "summary": {
                    "total_metrics": total_metrics,
                    "validated_metrics": validated_metrics,
                    "on_track_metrics": on_track_metrics,
                    "average_progress": avg_progress,
                    "validation_rate": validation_rate
                },
                "validation_status": validation_status,
                "learnings": learnings,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error measuring innovation accounting: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def visualize_portfolio(
        self,
        visualization_type: str = "bubble_chart"
    ) -> Dict[str, Any]:
        """
        Generate portfolio visualization data (bubble charts: risk/reward/resource).

        Args:
            visualization_type: Type of visualization (bubble_chart, matrix, pipeline)

        Returns:
            Dictionary containing visualization data
        """
        try:
            logger.info(f"Generating portfolio visualization: {visualization_type}")

            active_initiatives = [
                init for init in self.initiatives.values()
                if init.status not in [InitiativeStatus.CANCELLED, InitiativeStatus.COMPLETED]
            ]

            if visualization_type == "bubble_chart":
                visualization = self._create_bubble_chart_data(active_initiatives)
            elif visualization_type == "matrix":
                visualization = self._create_matrix_visualization(active_initiatives)
            elif visualization_type == "pipeline":
                visualization = self._create_pipeline_visualization(active_initiatives)
            else:
                raise ValueError(f"Unknown visualization type: {visualization_type}")

            # Log operation
            operation = {
                "operation": "visualize_portfolio",
                "visualization_type": visualization_type,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Portfolio visualization generated: {len(active_initiatives)} initiatives")

            return {
                "status": "success",
                "visualization_type": visualization_type,
                "data": visualization,
                "initiative_count": len(active_initiatives),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error generating visualization: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def score_strategic_alignment(
        self,
        initiative_id: str,
        strategic_objectives: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Score strategic alignment of initiative against objectives.

        Args:
            initiative_id: Initiative identifier
            strategic_objectives: List of strategic objectives with weights

        Returns:
            Dictionary containing strategic alignment analysis
        """
        try:
            logger.info(f"Scoring strategic alignment for: {initiative_id}")

            if initiative_id not in self.initiatives:
                raise ValueError(f"Initiative not found: {initiative_id}")

            initiative = self.initiatives[initiative_id]

            # Calculate alignment scores
            alignment_scores = []
            total_weight = sum(obj.get("weight", 1.0) for obj in strategic_objectives)

            for objective in strategic_objectives:
                obj_name = objective["name"]
                weight = objective.get("weight", 1.0)

                # Score alignment (0-100)
                alignment = objective.get("alignment_score", 50)

                weighted_score = alignment * (weight / total_weight)
                alignment_scores.append({
                    "objective": obj_name,
                    "weight": weight,
                    "alignment_score": alignment,
                    "weighted_score": weighted_score
                })

            # Calculate overall alignment
            overall_alignment = sum(score["weighted_score"] for score in alignment_scores)

            # Update initiative
            initiative.strategic_alignment = overall_alignment
            initiative.last_updated = datetime.now()

            # Determine alignment level
            if overall_alignment >= 80:
                alignment_level = "Highly Aligned"
            elif overall_alignment >= 60:
                alignment_level = "Aligned"
            elif overall_alignment >= 40:
                alignment_level = "Partially Aligned"
            else:
                alignment_level = "Misaligned"

            # Generate recommendations
            recommendations = self._generate_alignment_recommendations(
                overall_alignment,
                alignment_scores
            )

            # Log operation
            operation = {
                "operation": "score_strategic_alignment",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Strategic alignment: {overall_alignment:.1f}/100 - {alignment_level}")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "initiative_name": initiative.name,
                "overall_alignment": overall_alignment,
                "alignment_level": alignment_level,
                "objective_scores": alignment_scores,
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error scoring strategic alignment: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def optimize_resource_allocation(
        self,
        total_resources: float,
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimize resource allocation across portfolio based on priorities.

        Args:
            total_resources: Total available resources
            constraints: Optional resource constraints

        Returns:
            Dictionary containing optimized allocation plan
        """
        try:
            logger.info(f"Optimizing resource allocation: {total_resources} total")

            constraints = constraints or {}

            # Get active initiatives sorted by priority
            active_initiatives = [
                init for init in self.initiatives.values()
                if init.status in [InitiativeStatus.APPROVED, InitiativeStatus.IN_PROGRESS]
            ]

            # Sort by priority score
            sorted_initiatives = sorted(
                active_initiatives,
                key=lambda i: i.priority_score.calculate(),
                reverse=True
            )

            # Allocate resources
            allocation_plan = []
            remaining_resources = total_resources
            h1_allocated = 0
            h2_allocated = 0
            h3_allocated = 0

            for initiative in sorted_initiatives:
                # Calculate requested resources
                requested = sum(initiative.resource_allocation.values())

                # Check horizon constraints
                if initiative.horizon == Horizon.H1_CORE:
                    h1_limit = total_resources * self.target_allocation["h1_core"]
                    if h1_allocated + requested > h1_limit:
                        requested = max(0, h1_limit - h1_allocated)
                elif initiative.horizon == Horizon.H2_EMERGING:
                    h2_limit = total_resources * self.target_allocation["h2_emerging"]
                    if h2_allocated + requested > h2_limit:
                        requested = max(0, h2_limit - h2_allocated)
                else:  # H3_FUTURE
                    h3_limit = total_resources * self.target_allocation["h3_future"]
                    if h3_allocated + requested > h3_limit:
                        requested = max(0, h3_limit - h3_allocated)

                # Allocate
                allocated = min(requested, remaining_resources)

                if allocated > 0:
                    allocation_plan.append({
                        "initiative_id": initiative.initiative_id,
                        "initiative_name": initiative.name,
                        "horizon": initiative.horizon.value,
                        "priority_score": initiative.priority_score.calculate(),
                        "requested": requested,
                        "allocated": allocated,
                        "allocation_percentage": (allocated / total_resources) * 100
                    })

                    remaining_resources -= allocated

                    if initiative.horizon == Horizon.H1_CORE:
                        h1_allocated += allocated
                    elif initiative.horizon == Horizon.H2_EMERGING:
                        h2_allocated += allocated
                    else:
                        h3_allocated += allocated

            # Calculate allocation summary
            allocation_summary = {
                "total_resources": total_resources,
                "allocated": total_resources - remaining_resources,
                "unallocated": remaining_resources,
                "by_horizon": {
                    "h1_core": {
                        "allocated": h1_allocated,
                        "percentage": (h1_allocated / total_resources) * 100,
                        "target_percentage": self.target_allocation["h1_core"] * 100
                    },
                    "h2_emerging": {
                        "allocated": h2_allocated,
                        "percentage": (h2_allocated / total_resources) * 100,
                        "target_percentage": self.target_allocation["h2_emerging"] * 100
                    },
                    "h3_future": {
                        "allocated": h3_allocated,
                        "percentage": (h3_allocated / total_resources) * 100,
                        "target_percentage": self.target_allocation["h3_future"] * 100
                    }
                }
            }

            # Generate optimization insights
            insights = self._generate_allocation_insights(allocation_plan, allocation_summary)

            # Log operation
            operation = {
                "operation": "optimize_resource_allocation",
                "total_resources": total_resources,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Resource allocation optimized: {len(allocation_plan)} initiatives funded")

            return {
                "status": "success",
                "allocation_plan": allocation_plan,
                "allocation_summary": allocation_summary,
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error optimizing resource allocation: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def evaluate_tool(
        self,
        tool_name: str,
        category: str,
        evaluation_criteria: List[str],
        scores: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a software tool against defined criteria.

        Args:
            tool_name: Name of the tool to evaluate
            category: Tool category
            evaluation_criteria: List of criteria to evaluate
            scores: Optional pre-calculated scores

        Returns:
            Dictionary containing evaluation results
        """
        try:
            logger.info(f"Evaluating tool: {tool_name}")

            # Generate or use provided scores
            if scores is None:
                scores = {criterion: 50.0 for criterion in evaluation_criteria}

            # Calculate overall rating
            overall_rating = statistics.mean(scores.values()) if scores else 0.0

            # Identify strengths and weaknesses
            strengths = [
                criterion for criterion, score in scores.items()
                if score >= 70
            ]
            weaknesses = [
                criterion for criterion, score in scores.items()
                if score < 50
            ]

            # Generate recommendation
            if overall_rating >= 75:
                recommendation = "Strongly Recommended"
            elif overall_rating >= 60:
                recommendation = "Recommended"
            elif overall_rating >= 45:
                recommendation = "Consider with Reservations"
            else:
                recommendation = "Not Recommended"

            # Create evaluation
            evaluation_id = self._generate_id(f"eval_{tool_name}")

            evaluation = ToolEvaluation(
                evaluation_id=evaluation_id,
                tool_name=tool_name,
                category=ToolCategory(category),
                vendor=scores.get("vendor", "Unknown"),
                evaluation_date=datetime.now(),
                scores=scores,
                strengths=strengths,
                weaknesses=weaknesses,
                overall_rating=overall_rating,
                recommendation=recommendation,
                evaluated_by=self.agent_id,
                criteria=evaluation_criteria
            )

            # Store evaluation
            self.evaluations[evaluation_id] = evaluation

            # Log operation
            operation = {
                "operation": "evaluate_tool",
                "tool_name": tool_name,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Tool evaluated: {tool_name} - {overall_rating:.1f}/100 ({recommendation})")

            return {
                "status": "success",
                "evaluation_id": evaluation_id,
                "evaluation": evaluation.to_dict(),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error evaluating tool: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def conduct_comparative_analysis(
        self,
        tools: List[str],
        comparison_factors: List[str]
    ) -> Dict[str, Any]:
        """
        Conduct comparative analysis of multiple tools.

        Args:
            tools: List of tool names to compare
            comparison_factors: Factors to compare

        Returns:
            Dictionary containing comparative analysis
        """
        try:
            logger.info(f"Conducting comparative analysis of {len(tools)} tools")

            # Get evaluations for tools
            tool_evaluations = {}
            for tool in tools:
                # Find matching evaluation
                matching = [
                    ev for ev in self.evaluations.values()
                    if ev.tool_name.lower() == tool.lower()
                ]
                if matching:
                    tool_evaluations[tool] = matching[0]

            # Build comparison matrix
            comparison_matrix = {}
            for tool, evaluation in tool_evaluations.items():
                comparison_matrix[tool] = {
                    factor: evaluation.scores.get(factor, 0)
                    for factor in comparison_factors
                }

            # Determine winner by factor
            winner_by_factor = {}
            for factor in comparison_factors:
                max_score = 0
                winner = None
                for tool, scores in comparison_matrix.items():
                    if scores.get(factor, 0) > max_score:
                        max_score = scores[factor]
                        winner = tool
                winner_by_factor[factor] = {
                    "winner": winner,
                    "score": max_score
                }

            # Overall recommendation
            overall_scores = {
                tool: statistics.mean(scores.values()) if scores else 0
                for tool, scores in comparison_matrix.items()
            }

            overall_winner = max(overall_scores.items(), key=lambda x: x[1])[0] if overall_scores else None

            # Best value calculation
            best_value = self._calculate_best_value(tool_evaluations)

            # Log operation
            operation = {
                "operation": "conduct_comparative_analysis",
                "tools_compared": len(tools),
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Comparative analysis complete: {overall_winner} recommended")

            return {
                "status": "success",
                "tools_compared": tools,
                "comparison_factors": comparison_factors,
                "comparison_matrix": comparison_matrix,
                "winner_by_factor": winner_by_factor,
                "overall_recommendation": overall_winner,
                "overall_scores": overall_scores,
                "best_value": best_value,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in comparative analysis: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def create_initiative(
        self,
        name: str,
        description: str,
        horizon: str,
        priority_data: Dict[str, float],
        roi_data: Dict[str, float],
        owner: str
    ) -> Dict[str, Any]:
        """
        Create new innovation initiative.

        Args:
            name: Initiative name
            description: Initiative description
            horizon: Innovation horizon (h1_core, h2_emerging, h3_future)
            priority_data: Priority scoring data
            roi_data: ROI metrics data
            owner: Initiative owner

        Returns:
            Dictionary containing created initiative
        """
        try:
            logger.info(f"Creating initiative: {name}")

            # Create initiative ID
            initiative_id = self._generate_id(f"initiative_{name}")

            # Create priority score
            priority_score = PrioritizationScore(
                strategic_fit=priority_data.get("strategic_fit", 50),
                roi_potential=priority_data.get("roi_potential", 50),
                risk_level=priority_data.get("risk_level", 50),
                resource_availability=priority_data.get("resource_availability", 50)
            )

            # Create ROI metrics
            roi_metrics = ROIMetrics(
                initial_cost=roi_data.get("initial_cost", 0),
                ongoing_costs_annual=roi_data.get("ongoing_costs_annual", 0),
                implementation_costs=roi_data.get("implementation_costs", 0),
                expected_benefits_annual=roi_data.get("expected_benefits_annual", 0),
                time_to_value_months=roi_data.get("time_to_value_months", 6),
                confidence_level=roi_data.get("confidence_level", 0.7)
            )

            # Create initiative
            initiative = Initiative(
                initiative_id=initiative_id,
                name=name,
                description=description,
                horizon=Horizon(horizon),
                pipeline_stage=PipelineStage.IDEATION,
                status=InitiativeStatus.PROPOSED,
                priority_score=priority_score,
                roi_metrics=roi_metrics,
                innovation_metrics=[],
                strategic_alignment=50.0,
                resource_allocation={},
                owner=owner,
                created_at=datetime.now(),
                last_updated=datetime.now()
            )

            # Store initiative
            self.initiatives[initiative_id] = initiative

            # Log operation
            operation = {
                "operation": "create_initiative",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Initiative created: {initiative_id}")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "initiative": initiative.to_dict(),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating initiative: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    # Helper methods

    def _generate_id(self, base: str) -> str:
        """Generate unique ID"""
        return hashlib.md5(f"{base}_{datetime.now().timestamp()}".encode()).hexdigest()[:16]

    def _generate_rebalancing_recommendations(
        self,
        current: Dict[str, Any],
        target: Dict[str, Any],
        variance: Dict[str, float],
        horizon_groups: Dict[Horizon, List[Initiative]]
    ) -> List[str]:
        """Generate portfolio rebalancing recommendations"""
        recommendations = []

        for horizon_key, var in variance.items():
            if var > 5:
                recommendations.append(
                    f"Increase {horizon_key} allocation by {var:.1f}% "
                    f"(current: {current.get(horizon_key, {}).get('percentage', 0):.1f}%, "
                    f"target: {target[horizon_key]['percentage']:.1f}%)"
                )
            elif var < -5:
                recommendations.append(
                    f"Decrease {horizon_key} allocation by {abs(var):.1f}% "
                    f"(current: {current.get(horizon_key, {}).get('percentage', 0):.1f}%, "
                    f"target: {target[horizon_key]['percentage']:.1f}%)"
                )

        if not recommendations:
            recommendations.append("Portfolio is well-balanced - maintain current allocation")

        return recommendations

    def _evaluate_stage_gate(
        self,
        initiative: Initiative,
        gate_criteria: Dict[str, bool]
    ) -> Dict[str, Any]:
        """Evaluate stage gate criteria"""
        initiative.gate_criteria = gate_criteria

        criteria_met = sum(1 for passed in gate_criteria.values() if passed)
        criteria_total = len(gate_criteria)

        can_advance = all(gate_criteria.values())

        return {
            "stage": initiative.pipeline_stage.value,
            "criteria_met": criteria_met,
            "criteria_total": criteria_total,
            "can_advance": can_advance,
            "gate_criteria": gate_criteria
        }

    def _advance_pipeline_stage(self, initiative: Initiative) -> Dict[str, Any]:
        """Advance initiative to next pipeline stage"""
        stage_order = [
            PipelineStage.IDEATION,
            PipelineStage.VALIDATION,
            PipelineStage.DEVELOPMENT,
            PipelineStage.LAUNCH,
            PipelineStage.SCALE
        ]

        current_index = stage_order.index(initiative.pipeline_stage)
        if current_index < len(stage_order) - 1:
            old_stage = initiative.pipeline_stage
            initiative.pipeline_stage = stage_order[current_index + 1]
            initiative.last_updated = datetime.now()

            if initiative.pipeline_stage == PipelineStage.DEVELOPMENT:
                initiative.status = InitiativeStatus.IN_PROGRESS
            elif initiative.pipeline_stage == PipelineStage.SCALE:
                initiative.status = InitiativeStatus.SCALED

            return {
                "action": "advanced",
                "old_stage": old_stage.value,
                "new_stage": initiative.pipeline_stage.value
            }
        else:
            return {
                "action": "no_change",
                "message": "Already at final stage"
            }

    def _hold_initiative(self, initiative: Initiative) -> Dict[str, Any]:
        """Put initiative on hold"""
        initiative.status = InitiativeStatus.ON_HOLD
        initiative.last_updated = datetime.now()

        return {
            "action": "held",
            "status": initiative.status.value
        }

    def _kill_initiative(self, initiative: Initiative) -> Dict[str, Any]:
        """Cancel initiative"""
        initiative.status = InitiativeStatus.CANCELLED
        initiative.last_updated = datetime.now()

        return {
            "action": "cancelled",
            "status": initiative.status.value
        }

    def _assess_financial_health(
        self,
        roi_percentage: float,
        payback_period: float,
        npv: float
    ) -> str:
        """Assess financial health of initiative"""
        score = 0

        if roi_percentage >= 50:
            score += 3
        elif roi_percentage >= 25:
            score += 2
        elif roi_percentage >= 10:
            score += 1

        if payback_period <= 12:
            score += 3
        elif payback_period <= 24:
            score += 2
        elif payback_period <= 36:
            score += 1

        if npv > 100000:
            score += 3
        elif npv > 50000:
            score += 2
        elif npv > 0:
            score += 1

        if score >= 7:
            return "excellent"
        elif score >= 5:
            return "good"
        elif score >= 3:
            return "fair"
        else:
            return "poor"

    def _generate_roi_insights(
        self,
        roi_metrics: ROIMetrics,
        variance: Dict[str, Any]
    ) -> List[str]:
        """Generate ROI insights"""
        insights = []

        roi = roi_metrics.calculate_roi()
        payback = roi_metrics.calculate_payback_period()

        if roi >= 100:
            insights.append("Exceptional ROI - strong financial performance")
        elif roi >= 50:
            insights.append("Strong ROI - good investment")
        elif roi < 20:
            insights.append("Low ROI - review business case")

        if payback <= 12:
            insights.append("Quick payback period - low financial risk")
        elif payback >= 36:
            insights.append("Long payback period - consider phased approach")

        if variance:
            significant_variances = [
                k for k, v in variance.items()
                if abs(v.get("variance_percentage", 0)) > 20
            ]
            if significant_variances:
                insights.append(f"Significant variance in: {', '.join(significant_variances)}")

        return insights

    def _extract_innovation_learnings(self, initiative: Initiative) -> List[str]:
        """Extract validated learnings from initiative"""
        learnings = []

        validated = [m for m in initiative.innovation_metrics if m.is_validated]
        for metric in validated:
            learnings.append(
                f"Validated: {metric.metric_name} achieved {metric.current_value} "
                f"(target: {metric.target_value})"
            )

        not_validated = [m for m in initiative.innovation_metrics if not m.is_validated]
        if not_validated:
            learnings.append(f"{len(not_validated)} metrics not yet validated - continue learning")

        return learnings

    def _create_bubble_chart_data(self, initiatives: List[Initiative]) -> Dict[str, Any]:
        """Create bubble chart visualization data"""
        bubbles = []

        for init in initiatives:
            bubbles.append({
                "initiative_id": init.initiative_id,
                "name": init.name,
                "x": init.roi_metrics.calculate_roi(),  # X-axis: ROI
                "y": init.priority_score.calculate(),  # Y-axis: Priority
                "size": sum(init.resource_allocation.values()),  # Bubble size: Resources
                "horizon": init.horizon.value,
                "stage": init.pipeline_stage.value
            })

        return {
            "chart_type": "bubble",
            "x_axis": "ROI (%)",
            "y_axis": "Priority Score",
            "size": "Resource Allocation",
            "data": bubbles
        }

    def _create_matrix_visualization(self, initiatives: List[Initiative]) -> Dict[str, Any]:
        """Create 2x2 matrix visualization"""
        matrix = {
            "high_value_low_effort": [],
            "high_value_high_effort": [],
            "low_value_low_effort": [],
            "low_value_high_effort": []
        }

        for init in initiatives:
            value = init.priority_score.calculate()
            effort = sum(init.resource_allocation.values())

            high_value = value >= 60
            high_effort = effort >= 50

            if high_value and not high_effort:
                quadrant = "high_value_low_effort"
            elif high_value and high_effort:
                quadrant = "high_value_high_effort"
            elif not high_value and not high_effort:
                quadrant = "low_value_low_effort"
            else:
                quadrant = "low_value_high_effort"

            matrix[quadrant].append({
                "initiative_id": init.initiative_id,
                "name": init.name,
                "value": value,
                "effort": effort
            })

        return {
            "chart_type": "matrix",
            "data": matrix
        }

    def _create_pipeline_visualization(self, initiatives: List[Initiative]) -> Dict[str, Any]:
        """Create pipeline funnel visualization"""
        pipeline = {stage.value: [] for stage in PipelineStage}

        for init in initiatives:
            pipeline[init.pipeline_stage.value].append({
                "initiative_id": init.initiative_id,
                "name": init.name,
                "priority": init.priority_score.calculate()
            })

        stage_counts = {stage: len(inits) for stage, inits in pipeline.items()}

        return {
            "chart_type": "pipeline",
            "data": pipeline,
            "stage_counts": stage_counts
        }

    def _generate_alignment_recommendations(
        self,
        overall_alignment: float,
        alignment_scores: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate strategic alignment recommendations"""
        recommendations = []

        if overall_alignment >= 80:
            recommendations.append("Strongly aligned with strategy - prioritize for execution")
        elif overall_alignment < 40:
            recommendations.append("Low strategic alignment - reconsider or realign initiative")

        # Find weakest alignments
        weak_alignments = [
            score for score in alignment_scores
            if score["alignment_score"] < 50
        ]

        if weak_alignments:
            objectives = [score["objective"] for score in weak_alignments]
            recommendations.append(
                f"Improve alignment with: {', '.join(objectives)}"
            )

        return recommendations

    def _generate_allocation_insights(
        self,
        allocation_plan: List[Dict[str, Any]],
        allocation_summary: Dict[str, Any]
    ) -> List[str]:
        """Generate resource allocation insights"""
        insights = []

        # Check horizon balance
        h1_pct = allocation_summary["by_horizon"]["h1_core"]["percentage"]
        h2_pct = allocation_summary["by_horizon"]["h2_emerging"]["percentage"]
        h3_pct = allocation_summary["by_horizon"]["h3_future"]["percentage"]

        h1_target = allocation_summary["by_horizon"]["h1_core"]["target_percentage"]
        h2_target = allocation_summary["by_horizon"]["h2_emerging"]["target_percentage"]
        h3_target = allocation_summary["by_horizon"]["h3_future"]["target_percentage"]

        if abs(h1_pct - h1_target) > 5:
            insights.append(f"H1 allocation {h1_pct:.1f}% vs target {h1_target:.1f}%")
        if abs(h2_pct - h2_target) > 5:
            insights.append(f"H2 allocation {h2_pct:.1f}% vs target {h2_target:.1f}%")
        if abs(h3_pct - h3_target) > 5:
            insights.append(f"H3 allocation {h3_pct:.1f}% vs target {h3_target:.1f}%")

        # Check unallocated resources
        unallocated_pct = (allocation_summary["unallocated"] /
                          allocation_summary["total_resources"]) * 100

        if unallocated_pct > 10:
            insights.append(f"{unallocated_pct:.1f}% of resources unallocated - consider additional initiatives")

        # High priority initiatives
        high_priority = [
            init for init in allocation_plan
            if init["priority_score"] >= 75
        ]

        if high_priority:
            insights.append(f"{len(high_priority)} high-priority initiatives funded")

        return insights

    def _calculate_best_value(self, tool_evaluations: Dict[str, ToolEvaluation]) -> Optional[str]:
        """Calculate best value tool (quality vs cost)"""
        if not tool_evaluations:
            return None

        best_value = None
        best_score = 0

        for tool, evaluation in tool_evaluations.items():
            # Simple value calculation: rating / (cost_score if available)
            cost_score = evaluation.scores.get("cost", 50)
            if cost_score > 0:
                value_score = evaluation.overall_rating / cost_score
                if value_score > best_score:
                    best_score = value_score
                    best_value = tool

        return best_value

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
                "total_initiatives": len(self.initiatives),
                "active_initiatives": len([i for i in self.initiatives.values()
                                          if i.status == InitiativeStatus.IN_PROGRESS]),
                "total_evaluations": len(self.evaluations),
                "portfolio_size": sum(sum(i.resource_allocation.values())
                                    for i in self.initiatives.values())
            }
        }
