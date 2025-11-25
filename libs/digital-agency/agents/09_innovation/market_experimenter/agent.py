"""
Market Experimenter Agent - Experiment Designer

Designs and executes market experiments to test new approaches and strategies.
Implements Lean Startup methodology, hypothesis formulation, and experiment design.

This agent serves as the Experiment Designer role, implementing:
- Hypothesis formulation and testing
- Experiment design (A/B tests, MVPs, pilots)
- Success criteria definition
- Statistical analysis and learning loops
- Build-Measure-Learn cycles
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


class ExperimentType(Enum):
    """Types of experiments"""
    AB_TEST = "ab_test"
    MULTIVARIATE = "multivariate"
    SPLIT_TEST = "split_test"
    PILOT_PROGRAM = "pilot_program"
    MVP_TEST = "mvp_test"
    SMOKE_TEST = "smoke_test"
    CONCIERGE = "concierge"
    WIZARD_OF_OZ = "wizard_of_oz"


class ExperimentStatus(Enum):
    """Experiment lifecycle status"""
    DRAFT = "draft"
    DESIGNED = "designed"
    APPROVED = "approved"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ANALYZED = "analyzed"


class HypothesisType(Enum):
    """Types of hypotheses"""
    PROBLEM = "problem"
    SOLUTION = "solution"
    VALUE = "value"
    GROWTH = "growth"
    RETENTION = "retention"
    MONETIZATION = "monetization"


class Decision(Enum):
    """Experiment decision outcomes"""
    PIVOT = "pivot"
    PERSEVERE = "persevere"
    ITERATE = "iterate"
    SCALE = "scale"
    KILL = "kill"


@dataclass
class Hypothesis:
    """Represents a testable hypothesis"""
    hypothesis_id: str
    type: HypothesisType
    statement: str
    assumptions: List[str]
    target_metric: str
    baseline_value: float
    target_value: float
    confidence_level: float
    created_at: datetime
    validated: bool = False
    validation_results: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hypothesis_id": self.hypothesis_id,
            "type": self.type.value,
            "statement": self.statement,
            "assumptions": self.assumptions,
            "target_metric": self.target_metric,
            "baseline_value": self.baseline_value,
            "target_value": self.target_value,
            "confidence_level": self.confidence_level,
            "created_at": self.created_at.isoformat(),
            "validated": self.validated,
            "validation_results": self.validation_results
        }


@dataclass
class SuccessCriteria:
    """Success criteria for experiments"""
    primary_metric: str
    primary_target: float
    secondary_metrics: Dict[str, float]
    minimum_sample_size: int
    confidence_level: float
    statistical_power: float
    minimum_detectable_effect: float
    guardrail_metrics: Dict[str, Tuple[float, float]]  # metric: (min, max)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "primary_metric": self.primary_metric,
            "primary_target": self.primary_target,
            "secondary_metrics": self.secondary_metrics,
            "minimum_sample_size": self.minimum_sample_size,
            "confidence_level": self.confidence_level,
            "statistical_power": self.statistical_power,
            "minimum_detectable_effect": self.minimum_detectable_effect,
            "guardrail_metrics": {k: list(v) for k, v in self.guardrail_metrics.items()}
        }


@dataclass
class Experiment:
    """Comprehensive experiment design"""
    experiment_id: str
    name: str
    type: ExperimentType
    hypothesis: Hypothesis
    success_criteria: SuccessCriteria
    status: ExperimentStatus
    design: Dict[str, Any]
    variants: List[Dict[str, Any]]
    duration_days: int
    sample_allocation: Dict[str, float]
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    results: Dict[str, Any] = field(default_factory=dict)
    learnings: List[str] = field(default_factory=list)
    decision: Optional[Decision] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "experiment_id": self.experiment_id,
            "name": self.name,
            "type": self.type.value,
            "hypothesis": self.hypothesis.to_dict(),
            "success_criteria": self.success_criteria.to_dict(),
            "status": self.status.value,
            "design": self.design,
            "variants": self.variants,
            "duration_days": self.duration_days,
            "sample_allocation": self.sample_allocation,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "results": self.results,
            "learnings": self.learnings,
            "decision": self.decision.value if self.decision else None
        }


class MarketExperimenterAgent:
    """
    Market Experimenter Agent - Experiment Designer

    Responsible for:
    - Hypothesis formulation and testing
    - Experiment design and planning
    - Success criteria definition
    - Statistical analysis
    - Build-Measure-Learn cycles
    - Experiment portfolio management

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        experiments (Dict[str, Experiment]): Active experiments
        hypotheses (Dict[str, Hypothesis]): Hypothesis library
        learnings (List[Dict]): Learning repository
        history (List[Dict]): Operation history
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Market Experimenter / Experiment Designer Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "experiment_designer_001"
        self.config = config or {}
        self.name = "Experiment Designer"
        self.role = "Market Experimentation & Hypothesis Testing"

        # Core data structures
        self.experiments: Dict[str, Experiment] = {}
        self.hypotheses: Dict[str, Hypothesis] = {}
        self.learnings: List[Dict[str, Any]] = []
        self.history: List[Dict[str, Any]] = []

        # Analytics
        self.experiment_metrics: Dict[str, List[float]] = defaultdict(list)

        # Configuration
        self.default_confidence = self.config.get("default_confidence", 0.95)
        self.default_power = self.config.get("default_power", 0.80)
        self.min_sample_size = self.config.get("min_sample_size", 100)

        logger.info(f"Initialized {self.name} agent with ID: {self.agent_id}")

    def formulate_hypothesis(
        self,
        hypothesis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Formulate a testable hypothesis using structured format.

        Args:
            hypothesis_data: Hypothesis information including statement, assumptions, metrics

        Returns:
            Dictionary containing hypothesis formulation results
        """
        try:
            logger.info("Formulating hypothesis")

            # Validate required fields
            required = ["statement", "target_metric", "baseline_value", "target_value"]
            for field in required:
                if field not in hypothesis_data:
                    raise ValueError(f"Missing required field: {field}")

            # Parse hypothesis type
            hyp_type = HypothesisType(hypothesis_data.get("type", "value"))

            # Generate ID
            hyp_id = self._generate_id(hypothesis_data["statement"])

            # Create hypothesis
            hypothesis = Hypothesis(
                hypothesis_id=hyp_id,
                type=hyp_type,
                statement=hypothesis_data["statement"],
                assumptions=hypothesis_data.get("assumptions", []),
                target_metric=hypothesis_data["target_metric"],
                baseline_value=hypothesis_data["baseline_value"],
                target_value=hypothesis_data["target_value"],
                confidence_level=hypothesis_data.get("confidence_level", self.default_confidence),
                created_at=datetime.now()
            )

            # Store hypothesis
            self.hypotheses[hyp_id] = hypothesis

            # Generate testing recommendations
            recommendations = self._generate_hypothesis_recommendations(hypothesis)

            # Estimate required sample size
            sample_size = self._calculate_sample_size(hypothesis)

            # Log operation
            operation = {
                "operation": "formulate_hypothesis",
                "hypothesis_id": hyp_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Formulated hypothesis: {hyp_id}")

            return {
                "status": "success",
                "hypothesis_id": hyp_id,
                "hypothesis": hypothesis.to_dict(),
                "testing_recommendations": recommendations,
                "estimated_sample_size": sample_size,
                "estimated_duration_days": self._estimate_duration(sample_size),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error formulating hypothesis: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def design_experiment(
        self,
        experiment_name: str,
        hypothesis_id: str,
        experiment_type: str,
        design_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Design a comprehensive experiment to test hypothesis.

        Args:
            experiment_name: Name of the experiment
            hypothesis_id: ID of hypothesis to test
            experiment_type: Type of experiment (ab_test, mvp_test, etc.)
            design_params: Additional design parameters

        Returns:
            Dictionary containing experiment design
        """
        try:
            logger.info(f"Designing experiment: {experiment_name}")

            # Validate hypothesis exists
            if hypothesis_id not in self.hypotheses:
                raise ValueError(f"Hypothesis not found: {hypothesis_id}")

            hypothesis = self.hypotheses[hypothesis_id]
            exp_type = ExperimentType(experiment_type)
            design_params = design_params or {}

            # Define success criteria
            success_criteria = self._define_success_criteria(hypothesis, design_params)

            # Design experiment variants
            variants = self._design_variants(exp_type, design_params)

            # Calculate sample allocation
            allocation = self._calculate_allocation(variants, design_params)

            # Estimate duration
            duration = self._calculate_duration(success_criteria, design_params)

            # Generate experiment design
            design = self._create_experiment_design(exp_type, hypothesis, design_params)

            # Create experiment ID
            exp_id = self._generate_id(f"{experiment_name}_{hypothesis_id}")

            # Create experiment object
            experiment = Experiment(
                experiment_id=exp_id,
                name=experiment_name,
                type=exp_type,
                hypothesis=hypothesis,
                success_criteria=success_criteria,
                status=ExperimentStatus.DESIGNED,
                design=design,
                variants=variants,
                duration_days=duration,
                sample_allocation=allocation,
                created_at=datetime.now()
            )

            # Store experiment
            self.experiments[exp_id] = experiment

            # Generate implementation plan
            impl_plan = self._generate_implementation_plan(experiment)

            # Risk assessment
            risks = self._assess_experiment_risks(experiment)

            # Log operation
            operation = {
                "operation": "design_experiment",
                "experiment_id": exp_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Designed experiment: {exp_id}")

            return {
                "status": "success",
                "experiment_id": exp_id,
                "experiment": experiment.to_dict(),
                "implementation_plan": impl_plan,
                "risk_assessment": risks,
                "estimated_cost": self._estimate_cost(experiment),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error designing experiment: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def execute_experiment(
        self,
        experiment_id: str,
        execution_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a designed experiment.

        Args:
            experiment_id: ID of experiment to execute
            execution_params: Execution parameters

        Returns:
            Dictionary containing execution status
        """
        try:
            logger.info(f"Executing experiment: {experiment_id}")

            if experiment_id not in self.experiments:
                raise ValueError(f"Experiment not found: {experiment_id}")

            experiment = self.experiments[experiment_id]

            # Validate experiment is ready
            if experiment.status not in [ExperimentStatus.DESIGNED, ExperimentStatus.APPROVED]:
                raise ValueError(f"Experiment not ready for execution: {experiment.status.value}")

            # Update status
            experiment.status = ExperimentStatus.RUNNING
            experiment.started_at = datetime.now()

            # Initialize tracking
            tracking = self._initialize_tracking(experiment)

            # Setup monitoring
            monitoring = self._setup_monitoring(experiment)

            # Generate execution checklist
            checklist = self._generate_execution_checklist(experiment)

            # Log operation
            operation = {
                "operation": "execute_experiment",
                "experiment_id": experiment_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Experiment execution started: {experiment_id}")

            return {
                "status": "success",
                "experiment_id": experiment_id,
                "started_at": experiment.started_at.isoformat(),
                "expected_end": (experiment.started_at + timedelta(days=experiment.duration_days)).isoformat(),
                "tracking": tracking,
                "monitoring": monitoring,
                "execution_checklist": checklist,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error executing experiment: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def analyze_results(
        self,
        experiment_id: str,
        results_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze experiment results and make recommendations.

        Args:
            experiment_id: ID of experiment to analyze
            results_data: Raw results data

        Returns:
            Dictionary containing analysis results and recommendations
        """
        try:
            logger.info(f"Analyzing experiment results: {experiment_id}")

            if experiment_id not in self.experiments:
                raise ValueError(f"Experiment not found: {experiment_id}")

            experiment = self.experiments[experiment_id]

            # Update experiment status
            experiment.status = ExperimentStatus.COMPLETED
            experiment.completed_at = datetime.now()
            experiment.results = results_data

            # Statistical analysis
            statistical_results = self._perform_statistical_analysis(experiment, results_data)

            # Evaluate against success criteria
            success_evaluation = self._evaluate_success_criteria(experiment, statistical_results)

            # Extract learnings
            learnings = self._extract_learnings(experiment, statistical_results)
            experiment.learnings = learnings

            # Make decision recommendation
            decision = self._make_decision(experiment, success_evaluation, statistical_results)
            experiment.decision = decision

            # Update hypothesis validation
            self._update_hypothesis_validation(experiment, success_evaluation)

            # Store learnings
            self._store_learnings(experiment, learnings)

            # Generate next actions
            next_actions = self._generate_next_actions(experiment, decision)

            # Update status
            experiment.status = ExperimentStatus.ANALYZED

            # Log operation
            operation = {
                "operation": "analyze_results",
                "experiment_id": experiment_id,
                "decision": decision.value,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Analysis complete for experiment: {experiment_id} - Decision: {decision.value}")

            return {
                "status": "success",
                "experiment_id": experiment_id,
                "statistical_analysis": statistical_results,
                "success_evaluation": success_evaluation,
                "learnings": learnings,
                "decision": decision.value,
                "decision_confidence": success_evaluation.get("confidence", 0.0),
                "next_actions": next_actions,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error analyzing results: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def optimize_strategy(
        self,
        strategy_id: str,
        performance_data: Dict[str, Any],
        optimization_goals: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Optimize marketing strategy based on experiment learnings.

        Args:
            strategy_id: Strategy identifier
            performance_data: Current performance metrics
            optimization_goals: Specific optimization goals

        Returns:
            Dictionary containing optimization recommendations
        """
        try:
            logger.info(f"Optimizing strategy: {strategy_id}")

            optimization_goals = optimization_goals or ["conversion", "engagement", "retention"]

            # Analyze historical experiments
            relevant_experiments = self._find_relevant_experiments(strategy_id)

            # Extract insights from experiments
            insights = self._aggregate_insights(relevant_experiments)

            # Identify optimization opportunities
            opportunities = self._identify_optimization_opportunities(
                performance_data,
                insights,
                optimization_goals
            )

            # Prioritize opportunities
            prioritized = self._prioritize_opportunities(opportunities)

            # Generate optimization roadmap
            roadmap = self._create_optimization_roadmap(prioritized)

            # Suggest new experiments
            experiment_suggestions = self._suggest_experiments(opportunities)

            # Log operation
            operation = {
                "operation": "optimize_strategy",
                "strategy_id": strategy_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Strategy optimization complete: {strategy_id}")

            return {
                "status": "success",
                "strategy_id": strategy_id,
                "insights": insights,
                "opportunities": prioritized,
                "optimization_roadmap": roadmap,
                "experiment_suggestions": experiment_suggestions,
                "estimated_impact": self._estimate_optimization_impact(prioritized),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error optimizing strategy: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def build_measure_learn(
        self,
        idea: Dict[str, Any],
        iteration: int = 1
    ) -> Dict[str, Any]:
        """
        Execute a Build-Measure-Learn cycle (Lean Startup methodology).

        Args:
            idea: Idea/concept to test
            iteration: Current iteration number

        Returns:
            Dictionary containing BML cycle results
        """
        try:
            logger.info(f"Starting Build-Measure-Learn cycle - Iteration {iteration}")

            # BUILD: Define MVP
            mvp = self._define_mvp(idea, iteration)

            # MEASURE: Define metrics
            metrics = self._define_learning_metrics(idea, iteration)

            # LEARN: Define learning objectives
            learning_objectives = self._define_learning_objectives(idea, iteration)

            # Create experiment plan
            experiment_plan = {
                "build": mvp,
                "measure": metrics,
                "learn": learning_objectives,
                "iteration": iteration,
                "timeline": self._estimate_bml_timeline(mvp),
                "resources": self._estimate_bml_resources(mvp)
            }

            # Success criteria for this cycle
            cycle_success = self._define_cycle_success(metrics, iteration)

            # Risk mitigation
            risks = self._identify_bml_risks(mvp, iteration)

            # Log operation
            operation = {
                "operation": "build_measure_learn",
                "iteration": iteration,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"BML cycle plan created - Iteration {iteration}")

            return {
                "status": "success",
                "iteration": iteration,
                "experiment_plan": experiment_plan,
                "success_criteria": cycle_success,
                "risks": risks,
                "next_iteration_triggers": self._define_next_iteration_triggers(metrics),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in Build-Measure-Learn cycle: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    # Helper methods

    def _generate_id(self, name: str) -> str:
        """Generate unique ID"""
        return hashlib.md5(f"{name}_{datetime.now().timestamp()}".encode()).hexdigest()[:16]

    def _generate_hypothesis_recommendations(self, hypothesis: Hypothesis) -> List[str]:
        """Generate testing recommendations for hypothesis"""
        recommendations = []

        if hypothesis.type == HypothesisType.PROBLEM:
            recommendations.extend([
                "Conduct customer interviews to validate problem existence",
                "Use surveys to measure problem severity",
                "Analyze existing data for problem indicators"
            ])
        elif hypothesis.type == HypothesisType.SOLUTION:
            recommendations.extend([
                "Build MVP or prototype for solution testing",
                "Conduct usability tests with target users",
                "Run pilot program with early adopters"
            ])
        elif hypothesis.type == HypothesisType.VALUE:
            recommendations.extend([
                "Design A/B test for value proposition",
                "Test pricing models",
                "Measure conversion rates and willingness to pay"
            ])

        # Add sample size recommendation
        recommendations.append(f"Target minimum sample size: {self._calculate_sample_size(hypothesis)}")

        return recommendations

    def _calculate_sample_size(self, hypothesis: Hypothesis) -> int:
        """Calculate required sample size for hypothesis test"""
        # Simplified sample size calculation
        # In production, use proper statistical power analysis
        effect_size = abs(hypothesis.target_value - hypothesis.baseline_value) / hypothesis.baseline_value

        if effect_size > 0.20:  # Large effect
            return max(self.min_sample_size, 100)
        elif effect_size > 0.10:  # Medium effect
            return max(self.min_sample_size, 300)
        else:  # Small effect
            return max(self.min_sample_size, 1000)

    def _estimate_duration(self, sample_size: int) -> int:
        """Estimate experiment duration in days"""
        # Assume 50 samples per day as baseline
        daily_rate = self.config.get("daily_sample_rate", 50)
        return max(7, int(sample_size / daily_rate))

    def _define_success_criteria(
        self,
        hypothesis: Hypothesis,
        design_params: Dict[str, Any]
    ) -> SuccessCriteria:
        """Define comprehensive success criteria"""
        return SuccessCriteria(
            primary_metric=hypothesis.target_metric,
            primary_target=hypothesis.target_value,
            secondary_metrics=design_params.get("secondary_metrics", {}),
            minimum_sample_size=self._calculate_sample_size(hypothesis),
            confidence_level=hypothesis.confidence_level,
            statistical_power=self.default_power,
            minimum_detectable_effect=design_params.get("mde", 0.05),
            guardrail_metrics=design_params.get("guardrails", {})
        )

    def _design_variants(
        self,
        exp_type: ExperimentType,
        design_params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Design experiment variants"""
        variants = []

        if exp_type == ExperimentType.AB_TEST:
            variants.append({
                "id": "control",
                "name": "Control",
                "description": "Current experience",
                "changes": []
            })
            variants.append({
                "id": "treatment",
                "name": "Treatment",
                "description": design_params.get("treatment_description", "Modified experience"),
                "changes": design_params.get("changes", [])
            })
        elif exp_type == ExperimentType.MULTIVARIATE:
            # Multiple variants
            num_variants = design_params.get("num_variants", 3)
            for i in range(num_variants):
                variants.append({
                    "id": f"variant_{i}",
                    "name": f"Variant {i}",
                    "description": f"Test variant {i}",
                    "changes": []
                })
        else:
            variants.append({
                "id": "test",
                "name": "Test",
                "description": "Experimental variant",
                "changes": []
            })

        return variants

    def _calculate_allocation(
        self,
        variants: List[Dict[str, Any]],
        design_params: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate traffic allocation across variants"""
        allocation = design_params.get("allocation")

        if allocation:
            return allocation

        # Equal allocation by default
        per_variant = 1.0 / len(variants)
        return {v["id"]: per_variant for v in variants}

    def _calculate_duration(
        self,
        success_criteria: SuccessCriteria,
        design_params: Dict[str, Any]
    ) -> int:
        """Calculate experiment duration"""
        if "duration_days" in design_params:
            return design_params["duration_days"]

        return self._estimate_duration(success_criteria.minimum_sample_size)

    def _create_experiment_design(
        self,
        exp_type: ExperimentType,
        hypothesis: Hypothesis,
        design_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create detailed experiment design"""
        return {
            "type": exp_type.value,
            "hypothesis": hypothesis.statement,
            "methodology": self._get_methodology(exp_type),
            "randomization": design_params.get("randomization", "user_level"),
            "targeting": design_params.get("targeting", "all_users"),
            "exclusions": design_params.get("exclusions", []),
            "data_collection": design_params.get("data_collection", {}),
            "analysis_plan": self._create_analysis_plan(hypothesis)
        }

    def _get_methodology(self, exp_type: ExperimentType) -> str:
        """Get methodology description for experiment type"""
        methodologies = {
            ExperimentType.AB_TEST: "Randomized controlled trial with two variants",
            ExperimentType.MULTIVARIATE: "Factorial design testing multiple variables",
            ExperimentType.MVP_TEST: "Minimum viable product validation",
            ExperimentType.SMOKE_TEST: "Interest validation without building product",
            ExperimentType.CONCIERGE: "Manual service delivery to test value",
            ExperimentType.WIZARD_OF_OZ: "Simulated automation for user experience testing"
        }
        return methodologies.get(exp_type, "Custom experiment design")

    def _create_analysis_plan(self, hypothesis: Hypothesis) -> Dict[str, Any]:
        """Create statistical analysis plan"""
        return {
            "primary_analysis": f"Compare {hypothesis.target_metric} between variants",
            "statistical_test": "Two-sample t-test",
            "confidence_level": hypothesis.confidence_level,
            "adjustment": "Bonferroni correction for multiple comparisons",
            "segmentation": ["user_type", "platform", "geography"]
        }

    def _generate_implementation_plan(self, experiment: Experiment) -> Dict[str, Any]:
        """Generate implementation plan for experiment"""
        return {
            "phases": [
                {
                    "phase": "Setup",
                    "duration_days": 3,
                    "tasks": [
                        "Configure tracking",
                        "Implement variants",
                        "Set up monitoring",
                        "QA testing"
                    ]
                },
                {
                    "phase": "Ramp",
                    "duration_days": 2,
                    "tasks": [
                        "Start with 10% traffic",
                        "Monitor for issues",
                        "Ramp to full allocation"
                    ]
                },
                {
                    "phase": "Run",
                    "duration_days": experiment.duration_days,
                    "tasks": [
                        "Monitor daily metrics",
                        "Check data quality",
                        "Respond to anomalies"
                    ]
                },
                {
                    "phase": "Analysis",
                    "duration_days": 3,
                    "tasks": [
                        "Extract data",
                        "Perform statistical analysis",
                        "Create report"
                    ]
                }
            ],
            "total_duration": experiment.duration_days + 8
        }

    def _assess_experiment_risks(self, experiment: Experiment) -> List[Dict[str, Any]]:
        """Assess risks associated with experiment"""
        risks = []

        # Sample size risk
        if experiment.success_criteria.minimum_sample_size > 1000:
            risks.append({
                "risk": "Large sample size required",
                "severity": "medium",
                "mitigation": "Extend duration or increase traffic allocation"
            })

        # Duration risk
        if experiment.duration_days > 30:
            risks.append({
                "risk": "Long experiment duration",
                "severity": "low",
                "mitigation": "Consider sequential testing approach"
            })

        # Complexity risk
        if len(experiment.variants) > 3:
            risks.append({
                "risk": "Multiple variants increase complexity",
                "severity": "medium",
                "mitigation": "Ensure clear documentation and monitoring"
            })

        return risks

    def _estimate_cost(self, experiment: Experiment) -> Dict[str, float]:
        """Estimate experiment cost"""
        setup_cost = 1000  # Base setup cost
        daily_cost = 50  # Daily running cost
        analysis_cost = 500  # Analysis cost

        total_cost = setup_cost + (experiment.duration_days * daily_cost) + analysis_cost

        return {
            "setup": setup_cost,
            "running": experiment.duration_days * daily_cost,
            "analysis": analysis_cost,
            "total": total_cost,
            "currency": "USD"
        }

    def _initialize_tracking(self, experiment: Experiment) -> Dict[str, Any]:
        """Initialize experiment tracking"""
        return {
            "metrics_tracked": [experiment.success_criteria.primary_metric] +
                             list(experiment.success_criteria.secondary_metrics.keys()),
            "tracking_frequency": "real-time",
            "dashboard_url": f"/experiments/{experiment.experiment_id}/dashboard",
            "data_pipeline": "configured"
        }

    def _setup_monitoring(self, experiment: Experiment) -> Dict[str, Any]:
        """Setup experiment monitoring"""
        return {
            "alerts": [
                {"metric": "data_quality", "threshold": 0.95},
                {"metric": "sample_ratio_mismatch", "threshold": 0.05},
                {"metric": "guardrail_violation", "threshold": 1}
            ],
            "reporting_frequency": "daily",
            "stakeholder_updates": "weekly"
        }

    def _generate_execution_checklist(self, experiment: Experiment) -> List[Dict[str, Any]]:
        """Generate execution checklist"""
        return [
            {"task": "Verify tracking implementation", "required": True, "completed": False},
            {"task": "Conduct QA testing", "required": True, "completed": False},
            {"task": "Set up monitoring alerts", "required": True, "completed": False},
            {"task": "Brief stakeholders", "required": True, "completed": False},
            {"task": "Prepare rollback plan", "required": True, "completed": False},
            {"task": "Document experiment", "required": True, "completed": False}
        ]

    def _perform_statistical_analysis(
        self,
        experiment: Experiment,
        results_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform statistical analysis on results"""
        analysis = {
            "sample_size": results_data.get("sample_size", 0),
            "primary_metric_results": {},
            "secondary_metric_results": {},
            "statistical_significance": False,
            "confidence_interval": {},
            "effect_size": 0.0
        }

        # Analyze primary metric
        primary_metric = experiment.success_criteria.primary_metric
        if primary_metric in results_data.get("metrics", {}):
            metric_data = results_data["metrics"][primary_metric]
            analysis["primary_metric_results"] = {
                "metric": primary_metric,
                "control_value": metric_data.get("control", 0),
                "treatment_value": metric_data.get("treatment", 0),
                "lift": self._calculate_lift(
                    metric_data.get("control", 0),
                    metric_data.get("treatment", 0)
                ),
                "p_value": metric_data.get("p_value", 1.0)
            }

            # Determine significance
            p_value = metric_data.get("p_value", 1.0)
            significance_level = 1 - experiment.success_criteria.confidence_level
            analysis["statistical_significance"] = p_value < significance_level

        return analysis

    def _calculate_lift(self, control: float, treatment: float) -> float:
        """Calculate percentage lift"""
        if control == 0:
            return 0.0
        return ((treatment - control) / control) * 100

    def _evaluate_success_criteria(
        self,
        experiment: Experiment,
        statistical_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate results against success criteria"""
        evaluation = {
            "success": False,
            "criteria_met": [],
            "criteria_missed": [],
            "confidence": 0.0
        }

        # Check primary metric
        primary_results = statistical_results.get("primary_metric_results", {})
        target = experiment.success_criteria.primary_target
        actual = primary_results.get("treatment_value", 0)

        if actual >= target and statistical_results.get("statistical_significance"):
            evaluation["criteria_met"].append("Primary metric target achieved")
            evaluation["success"] = True
            evaluation["confidence"] = experiment.success_criteria.confidence_level
        else:
            evaluation["criteria_missed"].append("Primary metric target not achieved")

        # Check sample size
        if statistical_results.get("sample_size", 0) >= experiment.success_criteria.minimum_sample_size:
            evaluation["criteria_met"].append("Minimum sample size achieved")
        else:
            evaluation["criteria_missed"].append("Insufficient sample size")

        return evaluation

    def _extract_learnings(
        self,
        experiment: Experiment,
        statistical_results: Dict[str, Any]
    ) -> List[str]:
        """Extract learnings from experiment"""
        learnings = []

        # Primary learning
        if statistical_results.get("statistical_significance"):
            lift = statistical_results["primary_metric_results"].get("lift", 0)
            learnings.append(
                f"Treatment variant improved {experiment.success_criteria.primary_metric} by {lift:.1f}%"
            )
        else:
            learnings.append(
                f"No significant impact on {experiment.success_criteria.primary_metric}"
            )

        # Hypothesis validation
        if experiment.hypothesis.validated:
            learnings.append(f"Hypothesis validated: {experiment.hypothesis.statement}")
        else:
            learnings.append(f"Hypothesis not validated: {experiment.hypothesis.statement}")

        # Additional insights
        learnings.append(f"Experiment type {experiment.type.value} was appropriate for this test")

        return learnings

    def _make_decision(
        self,
        experiment: Experiment,
        success_evaluation: Dict[str, Any],
        statistical_results: Dict[str, Any]
    ) -> Decision:
        """Make decision based on experiment results"""
        if success_evaluation.get("success"):
            # Strong positive result
            lift = statistical_results["primary_metric_results"].get("lift", 0)
            if lift > 20:
                return Decision.SCALE
            else:
                return Decision.PERSEVERE
        else:
            # Not successful
            if len(experiment.learnings) > 0:
                return Decision.ITERATE  # We learned something, try again
            else:
                # Check if hypothesis is fundamentally flawed
                if not statistical_results.get("statistical_significance"):
                    return Decision.PIVOT
                else:
                    return Decision.KILL

    def _update_hypothesis_validation(
        self,
        experiment: Experiment,
        success_evaluation: Dict[str, Any]
    ):
        """Update hypothesis validation status"""
        hypothesis = experiment.hypothesis
        hypothesis.validated = success_evaluation.get("success", False)
        hypothesis.validation_results = success_evaluation

    def _store_learnings(self, experiment: Experiment, learnings: List[str]):
        """Store learnings in knowledge base"""
        learning_entry = {
            "experiment_id": experiment.experiment_id,
            "experiment_name": experiment.name,
            "hypothesis_type": experiment.hypothesis.type.value,
            "learnings": learnings,
            "decision": experiment.decision.value if experiment.decision else None,
            "timestamp": datetime.now().isoformat()
        }
        self.learnings.append(learning_entry)

    def _generate_next_actions(
        self,
        experiment: Experiment,
        decision: Decision
    ) -> List[str]:
        """Generate recommended next actions"""
        actions = []

        if decision == Decision.SCALE:
            actions.extend([
                "Deploy treatment to 100% of users",
                "Monitor for sustained impact",
                "Document best practices",
                "Share learnings across organization"
            ])
        elif decision == Decision.PERSEVERE:
            actions.extend([
                "Continue with current approach",
                "Design follow-up experiments to optimize",
                "Monitor long-term trends"
            ])
        elif decision == Decision.ITERATE:
            actions.extend([
                "Analyze why hypothesis wasn't validated",
                "Refine hypothesis based on learnings",
                "Design improved experiment",
                "Test with modified approach"
            ])
        elif decision == Decision.PIVOT:
            actions.extend([
                "Reconsider fundamental assumptions",
                "Explore alternative approaches",
                "Conduct additional customer research",
                "Formulate new hypothesis"
            ])
        else:  # KILL
            actions.extend([
                "Discontinue this line of experimentation",
                "Document learnings",
                "Reallocate resources to more promising opportunities"
            ])

        return actions

    def _find_relevant_experiments(self, strategy_id: str) -> List[Experiment]:
        """Find experiments relevant to strategy"""
        # In production, filter by strategy tags/categories
        return [exp for exp in self.experiments.values()
                if exp.status == ExperimentStatus.ANALYZED]

    def _aggregate_insights(self, experiments: List[Experiment]) -> Dict[str, Any]:
        """Aggregate insights from multiple experiments"""
        insights = {
            "total_experiments": len(experiments),
            "successful_experiments": len([e for e in experiments if e.decision in [Decision.SCALE, Decision.PERSEVERE]]),
            "common_learnings": [],
            "success_patterns": []
        }

        # Extract common patterns
        all_learnings = []
        for exp in experiments:
            all_learnings.extend(exp.learnings)

        # Simple frequency analysis
        insights["common_learnings"] = list(set(all_learnings))[:5]

        return insights

    def _identify_optimization_opportunities(
        self,
        performance_data: Dict[str, Any],
        insights: Dict[str, Any],
        goals: List[str]
    ) -> List[Dict[str, Any]]:
        """Identify optimization opportunities"""
        opportunities = []

        for goal in goals:
            current_value = performance_data.get(goal, 0)
            opportunities.append({
                "metric": goal,
                "current_value": current_value,
                "improvement_potential": "medium",
                "confidence": "medium",
                "effort": "medium"
            })

        return opportunities

    def _prioritize_opportunities(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Prioritize optimization opportunities"""
        # Simple prioritization: high potential, low effort
        return sorted(opportunities,
                     key=lambda x: (x["improvement_potential"], x["effort"]),
                     reverse=True)

    def _create_optimization_roadmap(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create optimization roadmap"""
        return {
            "phases": [
                {
                    "phase": "Quick Wins",
                    "duration": "1-2 months",
                    "opportunities": opportunities[:2]
                },
                {
                    "phase": "Strategic Improvements",
                    "duration": "3-6 months",
                    "opportunities": opportunities[2:4]
                },
                {
                    "phase": "Transformational Changes",
                    "duration": "6-12 months",
                    "opportunities": opportunities[4:]
                }
            ]
        }

    def _suggest_experiments(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Suggest new experiments based on opportunities"""
        suggestions = []

        for opp in opportunities[:3]:  # Top 3 opportunities
            suggestions.append({
                "suggested_experiment": f"Test optimization for {opp['metric']}",
                "hypothesis": f"Optimizing {opp['metric']} will improve overall performance",
                "experiment_type": "ab_test",
                "estimated_duration": "2-4 weeks"
            })

        return suggestions

    def _estimate_optimization_impact(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Estimate impact of optimization"""
        return {
            "potential_lift": "15-30%",
            "confidence": "medium",
            "timeframe": "3-6 months"
        }

    def _define_mvp(self, idea: Dict[str, Any], iteration: int) -> Dict[str, Any]:
        """Define minimum viable product for iteration"""
        return {
            "features": idea.get("core_features", [])[:iteration * 2],
            "scope": "minimal",
            "build_time_days": 7 * iteration,
            "description": f"Iteration {iteration} MVP focusing on core value proposition"
        }

    def _define_learning_metrics(
        self,
        idea: Dict[str, Any],
        iteration: int
    ) -> Dict[str, Any]:
        """Define metrics for learning"""
        base_metrics = ["user_engagement", "feature_usage", "satisfaction"]

        return {
            "primary": base_metrics[min(iteration - 1, len(base_metrics) - 1)],
            "secondary": base_metrics,
            "learning_questions": [
                f"Does the solution solve the problem for iteration {iteration}?"
            ]
        }

    def _define_learning_objectives(
        self,
        idea: Dict[str, Any],
        iteration: int
    ) -> List[str]:
        """Define learning objectives for iteration"""
        objectives = [
            f"Validate core assumption #{iteration}",
            "Understand user behavior patterns",
            "Identify key success factors",
            "Discover unexpected use cases"
        ]
        return objectives

    def _estimate_bml_timeline(self, mvp: Dict[str, Any]) -> Dict[str, int]:
        """Estimate BML cycle timeline"""
        return {
            "build_days": mvp.get("build_time_days", 14),
            "measure_days": 7,
            "learn_days": 3,
            "total_days": mvp.get("build_time_days", 14) + 10
        }

    def _estimate_bml_resources(self, mvp: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate resources for BML cycle"""
        return {
            "team_size": 3,
            "budget": mvp.get("build_time_days", 14) * 500,
            "tools_needed": ["analytics", "prototyping", "user_testing"]
        }

    def _define_cycle_success(
        self,
        metrics: Dict[str, Any],
        iteration: int
    ) -> Dict[str, Any]:
        """Define success criteria for BML cycle"""
        return {
            "learning_achieved": True,
            "metrics_collected": metrics,
            "decision_ready": True,
            "minimum_users": 50 * iteration
        }

    def _identify_bml_risks(
        self,
        mvp: Dict[str, Any],
        iteration: int
    ) -> List[Dict[str, Any]]:
        """Identify risks in BML cycle"""
        return [
            {
                "risk": "Insufficient user engagement",
                "mitigation": "Recruit beta testers proactively",
                "severity": "medium"
            },
            {
                "risk": "Scope creep during build",
                "mitigation": "Strict feature prioritization",
                "severity": "high"
            }
        ]

    def _define_next_iteration_triggers(
        self,
        metrics: Dict[str, Any]
    ) -> List[str]:
        """Define triggers for next iteration"""
        return [
            "Validation of current hypothesis",
            "Achievement of learning objectives",
            "Clear direction for improvement",
            f"Minimum sample size for {metrics.get('primary', 'primary metric')}"
        ]

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
                "total_experiments": len(self.experiments),
                "total_hypotheses": len(self.hypotheses),
                "total_learnings": len(self.learnings),
                "running_experiments": len([e for e in self.experiments.values()
                                           if e.status == ExperimentStatus.RUNNING]),
                "completed_experiments": len([e for e in self.experiments.values()
                                            if e.status == ExperimentStatus.COMPLETED])
            }
        }
