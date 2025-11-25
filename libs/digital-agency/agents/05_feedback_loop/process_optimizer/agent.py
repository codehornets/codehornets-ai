"""
Process Optimizer Agent

Continuous improvement management with PDCA cycles, process analysis,
bottleneck identification, and impact measurement.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, Counter
from enum import Enum
import yaml
import logging
import statistics
import hashlib

logger = logging.getLogger(__name__)


class ProcessStatus(Enum):
    """Process improvement status"""
    IDENTIFIED = "identified"
    ANALYZING = "analyzing"
    PLANNING = "planning"
    IMPLEMENTING = "implementing"
    MONITORING = "monitoring"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


class ImprovementPriority(Enum):
    """Improvement priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PDCAPhase(Enum):
    """PDCA cycle phases"""
    PLAN = "plan"
    DO = "do"
    CHECK = "check"
    ACT = "act"


class ImprovementType(Enum):
    """Types of improvements"""
    EFFICIENCY = "efficiency"
    QUALITY = "quality"
    COST_REDUCTION = "cost_reduction"
    TIME_REDUCTION = "time_reduction"
    AUTOMATION = "automation"
    STANDARDIZATION = "standardization"
    ELIMINATION = "elimination"


@dataclass
class ProcessBottleneck:
    """Process bottleneck identification"""
    bottleneck_id: str
    process_name: str
    description: str
    identified_date: datetime
    severity: str
    impact_score: float
    affected_metrics: List[str]
    root_causes: List[str] = field(default_factory=list)
    resolution_status: str = "open"


@dataclass
class ImprovementInitiative:
    """Process improvement initiative"""
    initiative_id: str
    title: str
    description: str
    improvement_type: ImprovementType
    priority: ImprovementPriority
    status: ProcessStatus
    created_date: datetime
    target_completion: datetime
    owner: str
    affected_processes: List[str]
    expected_impact: Dict[str, Any]
    actual_impact: Dict[str, Any] = field(default_factory=dict)
    pdca_cycles: List[Dict[str, Any]] = field(default_factory=list)
    kpis: Dict[str, float] = field(default_factory=dict)


@dataclass
class PDCACycle:
    """PDCA cycle tracking"""
    cycle_id: str
    initiative_id: str
    phase: PDCAPhase
    started_date: datetime
    completed_date: Optional[datetime] = None
    plan_details: Dict[str, Any] = field(default_factory=dict)
    do_actions: List[Dict[str, Any]] = field(default_factory=list)
    check_results: Dict[str, Any] = field(default_factory=dict)
    act_decisions: List[Dict[str, Any]] = field(default_factory=list)


class ProcessOptimizerAgent:
    """
    Process Optimizer Agent - Production Implementation

    Comprehensive continuous improvement system with:
    - PDCA cycle management
    - Process analysis and bottleneck identification
    - Impact measurement and tracking
    - KPI monitoring and trending
    - Workflow optimization recommendations
    - Best practice documentation
    - ROI calculation
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Process Optimizer Agent."""
        self.agent_name = "Process Optimizer"
        self.agent_id = "process_optimizer"
        self.domain = "feedback_loop"

        if config_path:
            self.config = self._load_config(config_path)
        else:
            self.config = self._default_config()

        # Data stores
        self.initiatives: Dict[str, ImprovementInitiative] = {}
        self.bottlenecks: Dict[str, ProcessBottleneck] = {}
        self.pdca_cycles: Dict[str, PDCACycle] = {}
        self.process_metrics: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.best_practices: List[Dict[str, Any]] = []

        # Tracking
        self.impact_measurements: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.kpi_history: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)

        logger.info(f"{self.agent_name} initialized successfully")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self._default_config()

    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "domain": self.domain,
            "capabilities": [
                "process_analysis",
                "bottleneck_identification",
                "pdca_management",
                "impact_measurement",
                "kpi_tracking",
                "workflow_optimization",
                "best_practice_documentation"
            ],
            "impact_thresholds": {
                "high_impact": 0.25,
                "medium_impact": 0.10,
                "low_impact": 0.05
            },
            "severity_thresholds": {
                "critical": 0.8,
                "high": 0.6,
                "medium": 0.4
            },
            "enabled": True
        }

    # ============================================================================
    # PROCESS ANALYSIS
    # ============================================================================

    def analyze_process(
        self,
        process_name: str,
        process_data: Dict[str, Any],
        metrics: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a process for inefficiencies and bottlenecks.

        Args:
            process_name: Name of the process
            process_data: Process flow and configuration data
            metrics: Current process metrics

        Returns:
            Analysis results with identified issues
        """
        try:
            logger.info(f"Analyzing process: {process_name}")

            # Validate inputs
            if not process_name or not process_data:
                raise ValueError("process_name and process_data are required")

            analysis_id = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Perform analysis
            steps = process_data.get("steps", [])
            step_analysis = self._analyze_process_steps(steps, metrics or {})

            # Identify bottlenecks
            bottlenecks = self._identify_bottlenecks(process_name, step_analysis)

            # Calculate efficiency score
            efficiency_score = self._calculate_efficiency_score(step_analysis, metrics or {})

            # Generate recommendations
            recommendations = self._generate_process_recommendations(
                process_name,
                step_analysis,
                bottlenecks
            )

            # Store process metrics
            self.process_metrics[process_name].append({
                "timestamp": datetime.now().isoformat(),
                "efficiency_score": efficiency_score,
                "step_count": len(steps),
                "bottleneck_count": len(bottlenecks),
                "metrics": metrics
            })

            result = {
                "success": True,
                "analysis_id": analysis_id,
                "process_name": process_name,
                "efficiency_score": efficiency_score,
                "total_steps": len(steps),
                "bottlenecks_identified": len(bottlenecks),
                "bottlenecks": bottlenecks,
                "step_analysis": step_analysis,
                "recommendations": recommendations,
                "analyzed_at": datetime.now().isoformat()
            }

            logger.info(f"Process analysis completed: {analysis_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_process: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in analyze_process: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _analyze_process_steps(
        self,
        steps: List[Dict[str, Any]],
        metrics: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Analyze individual process steps."""
        step_analysis = []

        for idx, step in enumerate(steps):
            step_name = step.get("name", f"Step {idx + 1}")
            duration = step.get("duration", 0)
            complexity = step.get("complexity", "medium")
            automation_level = step.get("automation_level", 0)

            analysis = {
                "step_id": idx,
                "step_name": step_name,
                "duration": duration,
                "complexity": complexity,
                "automation_level": automation_level,
                "optimization_potential": self._calculate_optimization_potential(
                    duration, complexity, automation_level
                ),
                "is_bottleneck": duration > metrics.get("avg_step_duration", 30) * 2
            }

            step_analysis.append(analysis)

        return step_analysis

    def _calculate_optimization_potential(
        self,
        duration: float,
        complexity: str,
        automation_level: float
    ) -> float:
        """Calculate optimization potential for a step."""
        # Higher duration and lower automation = higher potential
        complexity_weights = {"low": 0.5, "medium": 1.0, "high": 1.5}
        complexity_factor = complexity_weights.get(complexity, 1.0)

        potential = (duration / 60.0) * complexity_factor * (1.0 - automation_level)
        return min(1.0, potential)

    def _identify_bottlenecks(
        self,
        process_name: str,
        step_analysis: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify bottlenecks in the process."""
        bottlenecks = []

        for step in step_analysis:
            if step["is_bottleneck"] or step["optimization_potential"] > 0.7:
                bottleneck_id = self._generate_bottleneck_id(process_name, step["step_name"])

                bottleneck = {
                    "bottleneck_id": bottleneck_id,
                    "step_name": step["step_name"],
                    "duration": step["duration"],
                    "optimization_potential": step["optimization_potential"],
                    "severity": self._determine_bottleneck_severity(step)
                }

                # Store bottleneck
                self.bottlenecks[bottleneck_id] = ProcessBottleneck(
                    bottleneck_id=bottleneck_id,
                    process_name=process_name,
                    description=f"Bottleneck in {step['step_name']}",
                    identified_date=datetime.now(),
                    severity=bottleneck["severity"],
                    impact_score=step["optimization_potential"],
                    affected_metrics=["duration", "efficiency"]
                )

                bottlenecks.append(bottleneck)

        return bottlenecks

    def _determine_bottleneck_severity(self, step: Dict[str, Any]) -> str:
        """Determine bottleneck severity."""
        potential = step["optimization_potential"]
        thresholds = self.config.get("severity_thresholds", {})

        if potential >= thresholds.get("critical", 0.8):
            return "critical"
        elif potential >= thresholds.get("high", 0.6):
            return "high"
        elif potential >= thresholds.get("medium", 0.4):
            return "medium"
        else:
            return "low"

    def _calculate_efficiency_score(
        self,
        step_analysis: List[Dict[str, Any]],
        metrics: Dict[str, float]
    ) -> float:
        """Calculate overall process efficiency score (0-1)."""
        if not step_analysis:
            return 0.0

        # Average automation level
        avg_automation = statistics.mean(
            [step["automation_level"] for step in step_analysis]
        )

        # Inverse of optimization potential
        avg_optimization_potential = statistics.mean(
            [step["optimization_potential"] for step in step_analysis]
        )

        efficiency = (avg_automation + (1 - avg_optimization_potential)) / 2
        return round(efficiency, 3)

    def _generate_process_recommendations(
        self,
        process_name: str,
        step_analysis: List[Dict[str, Any]],
        bottlenecks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate process optimization recommendations."""
        recommendations = []

        # Bottleneck recommendations
        for bottleneck in bottlenecks:
            recommendations.append({
                "type": "bottleneck_resolution",
                "priority": bottleneck["severity"],
                "description": f"Optimize {bottleneck['step_name']} to reduce processing time",
                "expected_impact": "high" if bottleneck["severity"] in ["critical", "high"] else "medium"
            })

        # Automation recommendations
        low_automation_steps = [
            step for step in step_analysis
            if step["automation_level"] < 0.3 and step["complexity"] != "high"
        ]

        if len(low_automation_steps) >= 3:
            recommendations.append({
                "type": "automation",
                "priority": "high",
                "description": f"Automate {len(low_automation_steps)} manual steps",
                "expected_impact": "high"
            })

        return recommendations

    # ============================================================================
    # IMPROVEMENT INITIATIVES
    # ============================================================================

    def create_improvement_initiative(
        self,
        title: str,
        description: str,
        improvement_type: str,
        priority: str,
        owner: str,
        affected_processes: List[str],
        expected_impact: Dict[str, Any],
        target_days: int = 30
    ) -> Dict[str, Any]:
        """
        Create a new improvement initiative.

        Args:
            title: Initiative title
            description: Detailed description
            improvement_type: Type of improvement
            priority: Initiative priority
            owner: Initiative owner
            affected_processes: List of affected processes
            expected_impact: Expected impact metrics
            target_days: Target completion in days

        Returns:
            Initiative creation result
        """
        try:
            logger.info(f"Creating improvement initiative: {title}")

            # Validate inputs
            if not title or not description:
                raise ValueError("title and description are required")

            # Generate initiative ID
            initiative_id = self._generate_initiative_id(title)

            # Parse enums
            try:
                imp_type = ImprovementType(improvement_type.lower())
            except ValueError:
                imp_type = ImprovementType.EFFICIENCY

            try:
                imp_priority = ImprovementPriority(priority.lower())
            except ValueError:
                imp_priority = ImprovementPriority.MEDIUM

            # Create initiative
            initiative = ImprovementInitiative(
                initiative_id=initiative_id,
                title=title,
                description=description,
                improvement_type=imp_type,
                priority=imp_priority,
                status=ProcessStatus.IDENTIFIED,
                created_date=datetime.now(),
                target_completion=datetime.now() + timedelta(days=target_days),
                owner=owner,
                affected_processes=affected_processes,
                expected_impact=expected_impact
            )

            # Store initiative
            self.initiatives[initiative_id] = initiative

            # Start first PDCA cycle
            pdca_cycle = self._start_pdca_cycle(initiative_id)

            result = {
                "success": True,
                "initiative_id": initiative_id,
                "title": title,
                "improvement_type": improvement_type,
                "priority": priority,
                "owner": owner,
                "target_completion": initiative.target_completion.isoformat(),
                "pdca_cycle_id": pdca_cycle["cycle_id"],
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Initiative {initiative_id} created successfully")
            return result

        except ValueError as e:
            logger.error(f"Validation error in create_improvement_initiative: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in create_improvement_initiative: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def update_initiative_status(
        self,
        initiative_id: str,
        status: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update initiative status.

        Args:
            initiative_id: Initiative identifier
            status: New status
            notes: Optional status notes

        Returns:
            Update result
        """
        try:
            if initiative_id not in self.initiatives:
                raise ValueError(f"Initiative {initiative_id} not found")

            initiative = self.initiatives[initiative_id]

            # Update status
            try:
                new_status = ProcessStatus(status.lower())
                initiative.status = new_status
            except ValueError:
                raise ValueError(f"Invalid status: {status}")

            result = {
                "success": True,
                "initiative_id": initiative_id,
                "previous_status": initiative.status.value,
                "new_status": status,
                "updated_at": datetime.now().isoformat()
            }

            if notes:
                result["notes"] = notes

            logger.info(f"Initiative {initiative_id} status updated to {status}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in update_initiative_status: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in update_initiative_status: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    # ============================================================================
    # PDCA CYCLE MANAGEMENT
    # ============================================================================

    def _start_pdca_cycle(self, initiative_id: str) -> Dict[str, Any]:
        """Start a new PDCA cycle for an initiative."""
        cycle_id = f"pdca_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        cycle = PDCACycle(
            cycle_id=cycle_id,
            initiative_id=initiative_id,
            phase=PDCAPhase.PLAN,
            started_date=datetime.now()
        )

        self.pdca_cycles[cycle_id] = cycle

        # Add to initiative tracking
        if initiative_id in self.initiatives:
            self.initiatives[initiative_id].pdca_cycles.append({
                "cycle_id": cycle_id,
                "started_date": datetime.now().isoformat()
            })

        return {
            "cycle_id": cycle_id,
            "initiative_id": initiative_id,
            "phase": "plan",
            "started_date": datetime.now().isoformat()
        }

    def update_pdca_phase(
        self,
        cycle_id: str,
        phase: str,
        phase_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update PDCA cycle phase with data.

        Args:
            cycle_id: PDCA cycle identifier
            phase: Current phase (plan, do, check, act)
            phase_data: Phase-specific data

        Returns:
            Update result
        """
        try:
            if cycle_id not in self.pdca_cycles:
                raise ValueError(f"PDCA cycle {cycle_id} not found")

            cycle = self.pdca_cycles[cycle_id]

            # Update phase
            try:
                pdca_phase = PDCAPhase(phase.lower())
            except ValueError:
                raise ValueError(f"Invalid phase: {phase}")

            cycle.phase = pdca_phase

            # Store phase-specific data
            if phase == "plan":
                cycle.plan_details = phase_data
            elif phase == "do":
                cycle.do_actions.append(phase_data)
            elif phase == "check":
                cycle.check_results = phase_data
            elif phase == "act":
                cycle.act_decisions.append(phase_data)

            # If completing ACT phase, complete the cycle
            if phase == "act":
                cycle.completed_date = datetime.now()

            result = {
                "success": True,
                "cycle_id": cycle_id,
                "phase": phase,
                "updated_at": datetime.now().isoformat(),
                "cycle_complete": cycle.completed_date is not None
            }

            logger.info(f"PDCA cycle {cycle_id} updated to phase: {phase}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in update_pdca_phase: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in update_pdca_phase: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def get_pdca_cycle_status(self, cycle_id: str) -> Dict[str, Any]:
        """
        Get current PDCA cycle status.

        Args:
            cycle_id: PDCA cycle identifier

        Returns:
            Cycle status and details
        """
        try:
            if cycle_id not in self.pdca_cycles:
                raise ValueError(f"PDCA cycle {cycle_id} not found")

            cycle = self.pdca_cycles[cycle_id]

            return {
                "success": True,
                "cycle_id": cycle_id,
                "initiative_id": cycle.initiative_id,
                "current_phase": cycle.phase.value,
                "started_date": cycle.started_date.isoformat(),
                "completed_date": cycle.completed_date.isoformat() if cycle.completed_date else None,
                "is_complete": cycle.completed_date is not None,
                "plan_details": cycle.plan_details,
                "do_actions": cycle.do_actions,
                "check_results": cycle.check_results,
                "act_decisions": cycle.act_decisions
            }

        except ValueError as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in get_pdca_cycle_status: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    # ============================================================================
    # IMPACT MEASUREMENT
    # ============================================================================

    def measure_impact(
        self,
        initiative_id: str,
        metrics: Dict[str, float],
        measurement_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Measure the impact of an improvement initiative.

        Args:
            initiative_id: Initiative identifier
            metrics: Current metric values
            measurement_date: Date of measurement

        Returns:
            Impact measurement results
        """
        try:
            if initiative_id not in self.initiatives:
                raise ValueError(f"Initiative {initiative_id} not found")

            initiative = self.initiatives[initiative_id]
            measure_date = measurement_date or datetime.now()

            # Calculate impact vs expected
            expected_impact = initiative.expected_impact
            impact_analysis = {}

            for metric, expected_value in expected_impact.items():
                actual_value = metrics.get(metric, 0)

                if isinstance(expected_value, (int, float)):
                    # Calculate percentage improvement
                    if expected_value != 0:
                        impact_pct = ((actual_value - expected_value) / abs(expected_value)) * 100
                    else:
                        impact_pct = 0

                    impact_analysis[metric] = {
                        "expected": expected_value,
                        "actual": actual_value,
                        "impact_percentage": round(impact_pct, 2),
                        "meets_target": actual_value >= expected_value
                    }

            # Update initiative with actual impact
            initiative.actual_impact = metrics

            # Store measurement
            measurement_record = {
                "measurement_id": f"measure_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "initiative_id": initiative_id,
                "metrics": metrics,
                "impact_analysis": impact_analysis,
                "measurement_date": measure_date.isoformat()
            }

            self.impact_measurements[initiative_id].append(measurement_record)

            # Calculate overall impact score
            overall_impact = self._calculate_overall_impact(impact_analysis)

            result = {
                "success": True,
                "initiative_id": initiative_id,
                "measurement_id": measurement_record["measurement_id"],
                "overall_impact_score": overall_impact,
                "impact_analysis": impact_analysis,
                "recommendation": self._generate_impact_recommendation(overall_impact),
                "measured_at": measure_date.isoformat()
            }

            logger.info(f"Impact measured for initiative {initiative_id}: {overall_impact}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in measure_impact: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in measure_impact: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _calculate_overall_impact(self, impact_analysis: Dict[str, Any]) -> float:
        """Calculate overall impact score."""
        if not impact_analysis:
            return 0.0

        target_met_count = sum(
            1 for metric_data in impact_analysis.values()
            if metric_data.get("meets_target", False)
        )

        impact_score = target_met_count / len(impact_analysis)
        return round(impact_score, 3)

    def _generate_impact_recommendation(self, impact_score: float) -> str:
        """Generate recommendation based on impact score."""
        thresholds = self.config.get("impact_thresholds", {})

        if impact_score >= thresholds.get("high_impact", 0.75):
            return "Continue current approach - showing strong positive impact"
        elif impact_score >= thresholds.get("medium_impact", 0.50):
            return "Moderate impact - consider adjustments to improve results"
        elif impact_score >= thresholds.get("low_impact", 0.25):
            return "Low impact - re-evaluate approach and make significant changes"
        else:
            return "Minimal impact - consider discontinuing or major restructuring"

    # ============================================================================
    # KPI TRACKING
    # ============================================================================

    def track_kpi(
        self,
        kpi_name: str,
        value: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Track a KPI value over time.

        Args:
            kpi_name: KPI identifier
            value: KPI value
            context: Optional context data

        Returns:
            Tracking result
        """
        try:
            timestamp = datetime.now()

            # Store KPI value
            self.kpi_history[kpi_name].append((timestamp, value))

            # Calculate trend
            trend = self._calculate_kpi_trend(kpi_name)

            result = {
                "success": True,
                "kpi_name": kpi_name,
                "value": value,
                "timestamp": timestamp.isoformat(),
                "trend": trend,
                "context": context or {}
            }

            return result

        except Exception as e:
            logger.error(f"Error in track_kpi: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def get_kpi_analytics(
        self,
        kpi_name: str,
        timeframe_days: int = 30
    ) -> Dict[str, Any]:
        """
        Get analytics for a KPI.

        Args:
            kpi_name: KPI identifier
            timeframe_days: Analysis timeframe in days

        Returns:
            KPI analytics
        """
        try:
            if kpi_name not in self.kpi_history:
                raise ValueError(f"KPI {kpi_name} not found")

            # Filter by timeframe
            cutoff_date = datetime.now() - timedelta(days=timeframe_days)
            recent_values = [
                (ts, val) for ts, val in self.kpi_history[kpi_name]
                if ts >= cutoff_date
            ]

            if not recent_values:
                return {
                    "success": False,
                    "error": "No data in specified timeframe",
                    "error_type": "insufficient_data"
                }

            values = [val for _, val in recent_values]

            analytics = {
                "success": True,
                "kpi_name": kpi_name,
                "timeframe_days": timeframe_days,
                "data_points": len(values),
                "current_value": values[-1],
                "average": statistics.mean(values),
                "median": statistics.median(values),
                "std_deviation": statistics.stdev(values) if len(values) > 1 else 0,
                "min": min(values),
                "max": max(values),
                "trend": self._calculate_kpi_trend(kpi_name),
                "change_percentage": self._calculate_change_percentage(values)
            }

            return analytics

        except ValueError as e:
            logger.error(f"Validation error in get_kpi_analytics: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in get_kpi_analytics: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _calculate_kpi_trend(self, kpi_name: str) -> str:
        """Calculate KPI trend direction."""
        if kpi_name not in self.kpi_history:
            return "unknown"

        history = self.kpi_history[kpi_name]
        if len(history) < 2:
            return "stable"

        # Compare recent vs older values
        recent = [val for _, val in history[-5:]]
        older = [val for _, val in history[-10:-5]] if len(history) >= 10 else recent

        if not older:
            return "stable"

        avg_recent = statistics.mean(recent)
        avg_older = statistics.mean(older)

        if avg_recent > avg_older * 1.05:
            return "increasing"
        elif avg_recent < avg_older * 0.95:
            return "decreasing"
        else:
            return "stable"

    def _calculate_change_percentage(self, values: List[float]) -> float:
        """Calculate percentage change from first to last value."""
        if len(values) < 2 or values[0] == 0:
            return 0.0

        change = ((values[-1] - values[0]) / abs(values[0])) * 100
        return round(change, 2)

    # ============================================================================
    # BEST PRACTICES
    # ============================================================================

    def document_best_practice(
        self,
        title: str,
        description: str,
        category: str,
        process_area: str,
        benefits: List[str],
        implementation_steps: List[str]
    ) -> Dict[str, Any]:
        """
        Document a best practice.

        Args:
            title: Practice title
            description: Detailed description
            category: Practice category
            process_area: Applicable process area
            benefits: List of benefits
            implementation_steps: Implementation steps

        Returns:
            Documentation result
        """
        try:
            practice_id = f"bp_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            best_practice = {
                "practice_id": practice_id,
                "title": title,
                "description": description,
                "category": category,
                "process_area": process_area,
                "benefits": benefits,
                "implementation_steps": implementation_steps,
                "documented_date": datetime.now().isoformat()
            }

            self.best_practices.append(best_practice)

            return {
                "success": True,
                "practice_id": practice_id,
                "title": title,
                "category": category,
                "documented_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in document_best_practice: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    # ============================================================================
    # REPORTING AND ANALYTICS
    # ============================================================================

    def generate_improvement_report(
        self,
        timeframe_days: int = 30
    ) -> Dict[str, Any]:
        """
        Generate comprehensive improvement report.

        Args:
            timeframe_days: Report timeframe in days

        Returns:
            Improvement report
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=timeframe_days)

            # Filter initiatives by timeframe
            recent_initiatives = [
                init for init in self.initiatives.values()
                if init.created_date >= cutoff_date
            ]

            # Calculate statistics
            total_initiatives = len(recent_initiatives)
            completed = len([i for i in recent_initiatives if i.status == ProcessStatus.COMPLETED])
            in_progress = len([i for i in recent_initiatives if i.status == ProcessStatus.IMPLEMENTING])

            # Bottleneck analysis
            recent_bottlenecks = [
                bn for bn in self.bottlenecks.values()
                if bn.identified_date >= cutoff_date
            ]

            # Impact summary
            impact_summary = self._calculate_impact_summary(recent_initiatives)

            report = {
                "success": True,
                "report_period": {
                    "start_date": cutoff_date.isoformat(),
                    "end_date": datetime.now().isoformat(),
                    "days": timeframe_days
                },
                "initiative_summary": {
                    "total": total_initiatives,
                    "completed": completed,
                    "in_progress": in_progress,
                    "completion_rate": (completed / total_initiatives * 100) if total_initiatives > 0 else 0
                },
                "bottleneck_summary": {
                    "total_identified": len(recent_bottlenecks),
                    "by_severity": Counter(bn.severity for bn in recent_bottlenecks)
                },
                "impact_summary": impact_summary,
                "top_improvements": self._get_top_improvements(recent_initiatives),
                "recommendations": self._generate_improvement_recommendations(recent_initiatives),
                "generated_at": datetime.now().isoformat()
            }

            return report

        except Exception as e:
            logger.error(f"Error in generate_improvement_report: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _calculate_impact_summary(
        self,
        initiatives: List[ImprovementInitiative]
    ) -> Dict[str, Any]:
        """Calculate summary of initiative impacts."""
        total_impact_scores = []

        for initiative in initiatives:
            if initiative.initiative_id in self.impact_measurements:
                measurements = self.impact_measurements[initiative.initiative_id]
                if measurements:
                    # Get latest measurement
                    latest = measurements[-1]
                    impact_score = self._calculate_overall_impact(
                        latest.get("impact_analysis", {})
                    )
                    total_impact_scores.append(impact_score)

        if total_impact_scores:
            return {
                "average_impact": statistics.mean(total_impact_scores),
                "initiatives_measured": len(total_impact_scores),
                "high_impact_count": sum(1 for score in total_impact_scores if score >= 0.75)
            }
        else:
            return {
                "average_impact": 0,
                "initiatives_measured": 0,
                "high_impact_count": 0
            }

    def _get_top_improvements(
        self,
        initiatives: List[ImprovementInitiative],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get top performing improvements."""
        improvements_with_impact = []

        for initiative in initiatives:
            if initiative.initiative_id in self.impact_measurements:
                measurements = self.impact_measurements[initiative.initiative_id]
                if measurements:
                    latest = measurements[-1]
                    impact_score = self._calculate_overall_impact(
                        latest.get("impact_analysis", {})
                    )

                    improvements_with_impact.append({
                        "initiative_id": initiative.initiative_id,
                        "title": initiative.title,
                        "impact_score": impact_score,
                        "improvement_type": initiative.improvement_type.value
                    })

        # Sort by impact score
        improvements_with_impact.sort(key=lambda x: x["impact_score"], reverse=True)

        return improvements_with_impact[:limit]

    def _generate_improvement_recommendations(
        self,
        initiatives: List[ImprovementInitiative]
    ) -> List[Dict[str, Any]]:
        """Generate strategic improvement recommendations."""
        recommendations = []

        # Check for stalled initiatives
        stalled = [
            i for i in initiatives
            if i.status in [ProcessStatus.ON_HOLD, ProcessStatus.PLANNING]
            and (datetime.now() - i.created_date).days > 30
        ]

        if stalled:
            recommendations.append({
                "type": "initiative_management",
                "priority": "high",
                "description": f"Review {len(stalled)} stalled initiatives for continuation or closure",
                "affected_count": len(stalled)
            })

        return recommendations

    # ============================================================================
    # UTILITY METHODS
    # ============================================================================

    def _generate_initiative_id(self, title: str) -> str:
        """Generate unique initiative ID."""
        hash_input = f"{title}_{datetime.now().isoformat()}"
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()[:12]
        return f"init_{hash_value}"

    def _generate_bottleneck_id(self, process_name: str, step_name: str) -> str:
        """Generate unique bottleneck ID."""
        hash_input = f"{process_name}_{step_name}_{datetime.now().isoformat()}"
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()[:12]
        return f"bn_{hash_value}"

    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming requests.

        Args:
            request: Request details

        Returns:
            Response to request
        """
        request_type = request.get("type")

        if request_type == "analyze_process":
            return self.analyze_process(
                process_name=request.get("process_name"),
                process_data=request.get("process_data"),
                metrics=request.get("metrics")
            )

        elif request_type == "create_initiative":
            return self.create_improvement_initiative(
                title=request.get("title"),
                description=request.get("description"),
                improvement_type=request.get("improvement_type"),
                priority=request.get("priority"),
                owner=request.get("owner"),
                affected_processes=request.get("affected_processes", []),
                expected_impact=request.get("expected_impact", {}),
                target_days=request.get("target_days", 30)
            )

        elif request_type == "update_pdca":
            return self.update_pdca_phase(
                cycle_id=request.get("cycle_id"),
                phase=request.get("phase"),
                phase_data=request.get("phase_data", {})
            )

        elif request_type == "measure_impact":
            return self.measure_impact(
                initiative_id=request.get("initiative_id"),
                metrics=request.get("metrics", {})
            )

        elif request_type == "track_kpi":
            return self.track_kpi(
                kpi_name=request.get("kpi_name"),
                value=request.get("value"),
                context=request.get("context")
            )

        elif request_type == "generate_report":
            return self.generate_improvement_report(
                timeframe_days=request.get("timeframe_days", 30)
            )

        else:
            return {
                "success": False,
                "error": f"Unknown request type: {request_type}",
                "error_type": "invalid_request"
            }

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "domain": self.domain,
            "status": "active",
            "statistics": {
                "total_initiatives": len(self.initiatives),
                "active_initiatives": len([i for i in self.initiatives.values()
                                          if i.status not in [ProcessStatus.COMPLETED, ProcessStatus.ON_HOLD]]),
                "bottlenecks_identified": len(self.bottlenecks),
                "pdca_cycles": len(self.pdca_cycles),
                "best_practices": len(self.best_practices)
            }
        }
