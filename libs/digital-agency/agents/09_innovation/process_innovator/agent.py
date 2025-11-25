"""
Process Innovator Agent - Adoption Catalyst

Drives organizational change and innovation adoption using structured change management
frameworks including ADKAR, Rogers' Diffusion of Innovation, stakeholder analysis,
and adoption metrics tracking.

This agent serves as the Adoption Catalyst role, implementing:
- ADKAR Model (Awareness, Desire, Knowledge, Ability, Reinforcement - scored 1-5)
- Rogers' Diffusion Curve (Innovators 2.5%, Early Adopters 13.5%, Early Majority 34%, Late Majority 34%, Laggards 16%)
- Change Readiness Assessment (Organizational + Individual dimensions)
- Resistance Management (Stakeholder analysis, mitigation strategies)
- Power/Interest Matrix (Manage Closely, Keep Satisfied, Keep Informed, Monitor)
- Change Impact Assessment (Scope, Depth, Breadth scoring)
- Adoption Metrics (Usage rate, proficiency, satisfaction)
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


class AdopterCategory(Enum):
    """Rogers' Diffusion of Innovation adopter categories"""
    INNOVATORS = "innovators"  # 2.5%
    EARLY_ADOPTERS = "early_adopters"  # 13.5%
    EARLY_MAJORITY = "early_majority"  # 34%
    LATE_MAJORITY = "late_majority"  # 34%
    LAGGARDS = "laggards"  # 16%


class ChangePhase(Enum):
    """Change management phases"""
    AWARENESS = "awareness"
    UNDERSTANDING = "understanding"
    ACCEPTANCE = "acceptance"
    ADOPTION = "adoption"
    INSTITUTIONALIZATION = "institutionalization"


class StakeholderQuadrant(Enum):
    """Power/Interest matrix quadrants"""
    MANAGE_CLOSELY = "manage_closely"  # High power, high interest
    KEEP_SATISFIED = "keep_satisfied"  # High power, low interest
    KEEP_INFORMED = "keep_informed"  # Low power, high interest
    MONITOR = "monitor"  # Low power, low interest


class ResistanceLevel(Enum):
    """Resistance to change levels"""
    CHAMPION = "champion"
    SUPPORTER = "supporter"
    NEUTRAL = "neutral"
    RESISTANT = "resistant"
    HOSTILE = "hostile"


@dataclass
class ADKARScore:
    """ADKAR change management model scoring (1-5 scale)"""
    awareness: float  # Awareness of need for change
    desire: float  # Desire to participate and support change
    knowledge: float  # Knowledge of how to change
    ability: float  # Ability to implement required skills
    reinforcement: float  # Reinforcement to sustain change

    def calculate_overall(self) -> float:
        """Calculate overall ADKAR score"""
        return (self.awareness + self.desire + self.knowledge +
                self.ability + self.reinforcement) / 5

    def identify_gaps(self) -> List[str]:
        """Identify ADKAR gaps (scores < 3)"""
        gaps = []
        if self.awareness < 3:
            gaps.append("awareness")
        if self.desire < 3:
            gaps.append("desire")
        if self.knowledge < 3:
            gaps.append("knowledge")
        if self.ability < 3:
            gaps.append("ability")
        if self.reinforcement < 3:
            gaps.append("reinforcement")
        return gaps

    def readiness_level(self) -> str:
        """Determine change readiness level"""
        overall = self.calculate_overall()
        if overall >= 4:
            return "ready"
        elif overall >= 3:
            return "moderately_ready"
        else:
            return "not_ready"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "awareness": self.awareness,
            "desire": self.desire,
            "knowledge": self.knowledge,
            "ability": self.ability,
            "reinforcement": self.reinforcement,
            "overall_score": self.calculate_overall(),
            "readiness_level": self.readiness_level(),
            "gaps": self.identify_gaps()
        }


@dataclass
class DiffusionMetrics:
    """Rogers' Diffusion of Innovation metrics"""
    total_population: int
    current_adopters: int
    adoption_rate: float  # Current adoption percentage

    def classify_adopters(self) -> Dict[str, Any]:
        """Classify adopters by category based on adoption rate"""
        # Rogers' distribution
        categories = {
            "innovators": {"threshold": 2.5, "color": "#FF6B6B"},
            "early_adopters": {"threshold": 16.0, "color": "#4ECDC4"},  # 2.5 + 13.5
            "early_majority": {"threshold": 50.0, "color": "#45B7D1"},  # 16 + 34
            "late_majority": {"threshold": 84.0, "color": "#96CEB4"},  # 50 + 34
            "laggards": {"threshold": 100.0, "color": "#FFEAA7"}  # 84 + 16
        }

        current_category = None
        for category, data in categories.items():
            if self.adoption_rate <= data["threshold"]:
                current_category = category
                break

        return {
            "current_category": current_category or "laggards",
            "adoption_rate": self.adoption_rate,
            "categories": categories
        }

    def project_adoption(self, weeks: int = 12) -> List[Dict[str, Any]]:
        """Project adoption curve using S-curve model"""
        projections = []

        # Simplified S-curve projection
        for week in range(weeks):
            # Logistic growth model parameters
            k = 100  # Max adoption
            r = 0.1  # Growth rate
            t = week

            projected = k / (1 + ((k - self.adoption_rate) / self.adoption_rate) * (2.71828 ** (-r * t)))

            projections.append({
                "week": week + 1,
                "projected_adoption_rate": min(100, projected),
                "projected_adopters": int((projected / 100) * self.total_population)
            })

        return projections

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_population": self.total_population,
            "current_adopters": self.current_adopters,
            "adoption_rate": self.adoption_rate,
            "classification": self.classify_adopters()
        }


@dataclass
class ChangeReadinessAssessment:
    """Multi-dimensional change readiness assessment"""
    organizational_factors: Dict[str, float]  # Leadership support, resources, culture (0-10)
    individual_factors: Dict[str, float]  # Skills, motivation, communication (0-10)
    change_factors: Dict[str, float]  # Complexity, scope, timing (0-10)

    def calculate_organizational_score(self) -> float:
        """Calculate organizational readiness score"""
        if not self.organizational_factors:
            return 0.0
        return statistics.mean(self.organizational_factors.values())

    def calculate_individual_score(self) -> float:
        """Calculate individual readiness score"""
        if not self.individual_factors:
            return 0.0
        return statistics.mean(self.individual_factors.values())

    def calculate_change_score(self) -> float:
        """Calculate change favorability score"""
        if not self.change_factors:
            return 0.0
        return statistics.mean(self.change_factors.values())

    def calculate_overall_readiness(self) -> float:
        """Calculate overall readiness (weighted average)"""
        org_score = self.calculate_organizational_score()
        ind_score = self.calculate_individual_score()
        change_score = self.calculate_change_score()

        # Weight: 40% org, 40% individual, 20% change
        return org_score * 0.4 + ind_score * 0.4 + change_score * 0.2

    def identify_barriers(self) -> List[Dict[str, Any]]:
        """Identify readiness barriers (scores < 6)"""
        barriers = []

        for factor, score in self.organizational_factors.items():
            if score < 6:
                barriers.append({
                    "dimension": "organizational",
                    "factor": factor,
                    "score": score,
                    "gap": 6 - score
                })

        for factor, score in self.individual_factors.items():
            if score < 6:
                barriers.append({
                    "dimension": "individual",
                    "factor": factor,
                    "score": score,
                    "gap": 6 - score
                })

        for factor, score in self.change_factors.items():
            if score < 6:
                barriers.append({
                    "dimension": "change",
                    "factor": factor,
                    "score": score,
                    "gap": 6 - score
                })

        return sorted(barriers, key=lambda x: x["gap"], reverse=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "organizational_factors": self.organizational_factors,
            "individual_factors": self.individual_factors,
            "change_factors": self.change_factors,
            "organizational_score": self.calculate_organizational_score(),
            "individual_score": self.calculate_individual_score(),
            "change_score": self.calculate_change_score(),
            "overall_readiness": self.calculate_overall_readiness(),
            "barriers": self.identify_barriers()
        }


@dataclass
class Stakeholder:
    """Stakeholder for change initiative"""
    stakeholder_id: str
    name: str
    role: str
    power_level: float  # 0-10
    interest_level: float  # 0-10
    resistance_level: ResistanceLevel
    influence_network: List[str] = field(default_factory=list)
    engagement_strategy: str = ""

    def get_quadrant(self) -> StakeholderQuadrant:
        """Determine power/interest matrix quadrant"""
        high_power = self.power_level >= 5
        high_interest = self.interest_level >= 5

        if high_power and high_interest:
            return StakeholderQuadrant.MANAGE_CLOSELY
        elif high_power and not high_interest:
            return StakeholderQuadrant.KEEP_SATISFIED
        elif not high_power and high_interest:
            return StakeholderQuadrant.KEEP_INFORMED
        else:
            return StakeholderQuadrant.MONITOR

    def priority_score(self) -> float:
        """Calculate stakeholder priority score"""
        # Power and interest weighted
        base_score = (self.power_level * 0.6 + self.interest_level * 0.4)

        # Adjust for resistance
        resistance_multiplier = {
            ResistanceLevel.CHAMPION: 1.2,
            ResistanceLevel.SUPPORTER: 1.1,
            ResistanceLevel.NEUTRAL: 1.0,
            ResistanceLevel.RESISTANT: 0.8,
            ResistanceLevel.HOSTILE: 0.6
        }

        return base_score * resistance_multiplier[self.resistance_level]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stakeholder_id": self.stakeholder_id,
            "name": self.name,
            "role": self.role,
            "power_level": self.power_level,
            "interest_level": self.interest_level,
            "resistance_level": self.resistance_level.value,
            "quadrant": self.get_quadrant().value,
            "priority_score": self.priority_score(),
            "influence_network": self.influence_network,
            "engagement_strategy": self.engagement_strategy
        }


@dataclass
class ChangeImpactAssessment:
    """Change impact assessment using Scope, Depth, Breadth"""
    scope: float  # 0-10: Number of processes/systems affected
    depth: float  # 0-10: Degree of change required
    breadth: float  # 0-10: Number of people affected

    def calculate_overall_impact(self) -> float:
        """Calculate overall change impact"""
        return (self.scope + self.depth + self.breadth) / 3

    def impact_level(self) -> str:
        """Determine impact level"""
        impact = self.calculate_overall_impact()
        if impact >= 8:
            return "transformational"
        elif impact >= 6:
            return "major"
        elif impact >= 4:
            return "moderate"
        else:
            return "minor"

    def estimate_duration(self) -> Dict[str, Any]:
        """Estimate change duration based on impact"""
        impact = self.calculate_overall_impact()

        # Simple duration estimation
        if impact >= 8:
            weeks = 52  # 1 year
        elif impact >= 6:
            weeks = 26  # 6 months
        elif impact >= 4:
            weeks = 12  # 3 months
        else:
            weeks = 4  # 1 month

        return {
            "estimated_weeks": weeks,
            "estimated_months": weeks / 4,
            "phases": {
                "planning": weeks * 0.2,
                "execution": weeks * 0.5,
                "reinforcement": weeks * 0.3
            }
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scope": self.scope,
            "depth": self.depth,
            "breadth": self.breadth,
            "overall_impact": self.calculate_overall_impact(),
            "impact_level": self.impact_level(),
            "duration_estimate": self.estimate_duration()
        }


@dataclass
class AdoptionMetrics:
    """Adoption tracking metrics"""
    metric_id: str
    metric_name: str
    metric_type: str  # usage, proficiency, satisfaction
    baseline: float
    current: float
    target: float
    unit: str
    measured_at: datetime

    def progress_percentage(self) -> float:
        """Calculate progress towards target"""
        if self.target == self.baseline:
            return 100.0 if self.current >= self.target else 0.0

        progress = ((self.current - self.baseline) /
                   (self.target - self.baseline)) * 100
        return max(0.0, min(100.0, progress))

    def is_on_track(self) -> bool:
        """Check if metric is on track"""
        return self.current >= self.target

    def trend(self) -> str:
        """Determine metric trend"""
        if self.current >= self.target:
            return "exceeding"
        elif self.current >= self.baseline:
            return "improving"
        else:
            return "declining"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_id": self.metric_id,
            "metric_name": self.metric_name,
            "metric_type": self.metric_type,
            "baseline": self.baseline,
            "current": self.current,
            "target": self.target,
            "unit": self.unit,
            "progress_percentage": self.progress_percentage(),
            "is_on_track": self.is_on_track(),
            "trend": self.trend(),
            "measured_at": self.measured_at.isoformat()
        }


@dataclass
class ChangeInitiative:
    """Comprehensive change initiative"""
    initiative_id: str
    name: str
    description: str
    change_type: str
    phase: ChangePhase
    adkar_scores: ADKARScore
    diffusion_metrics: DiffusionMetrics
    readiness_assessment: ChangeReadinessAssessment
    stakeholders: List[Stakeholder]
    impact_assessment: ChangeImpactAssessment
    adoption_metrics: List[AdoptionMetrics]
    communication_plan: Dict[str, Any]
    training_plan: Dict[str, Any]
    created_at: datetime
    start_date: Optional[datetime] = None
    target_completion: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "initiative_id": self.initiative_id,
            "name": self.name,
            "description": self.description,
            "change_type": self.change_type,
            "phase": self.phase.value,
            "adkar_scores": self.adkar_scores.to_dict(),
            "diffusion_metrics": self.diffusion_metrics.to_dict(),
            "readiness_assessment": self.readiness_assessment.to_dict(),
            "stakeholders": [s.to_dict() for s in self.stakeholders],
            "impact_assessment": self.impact_assessment.to_dict(),
            "adoption_metrics": [m.to_dict() for m in self.adoption_metrics],
            "communication_plan": self.communication_plan,
            "training_plan": self.training_plan,
            "created_at": self.created_at.isoformat(),
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "target_completion": self.target_completion.isoformat() if self.target_completion else None
        }


class ProcessInnovatorAgent:
    """
    Process Innovator Agent - Adoption Catalyst

    Responsible for:
    - ADKAR assessment and gap analysis
    - Rogers' Diffusion Curve mapping
    - Change readiness evaluation
    - Stakeholder analysis and engagement
    - Resistance management
    - Change impact assessment
    - Adoption metrics tracking
    - Communication and training planning

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        initiatives (Dict[str, ChangeInitiative]): Active change initiatives
        history (List[Dict]): Operation history
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Process Innovator / Adoption Catalyst Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "process_innovator_001"
        self.config = config or {}
        self.name = "Adoption Catalyst"
        self.role = "Change Management and Innovation Adoption"

        # Core data structures
        self.initiatives: Dict[str, ChangeInitiative] = {}
        self.history: List[Dict[str, Any]] = []

        # Rogers' diffusion thresholds
        self.diffusion_thresholds = {
            "innovators": 2.5,
            "early_adopters": 16.0,
            "early_majority": 50.0,
            "late_majority": 84.0,
            "laggards": 100.0
        }

        logger.info(f"Initialized {self.name} agent with ID: {self.agent_id}")

    def assess_adkar(
        self,
        initiative_id: str,
        assessment_data: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Assess ADKAR change readiness with 5-component scoring (1-5 scale).

        Args:
            initiative_id: Change initiative identifier
            assessment_data: ADKAR component scores

        Returns:
            Dictionary containing ADKAR assessment results
        """
        try:
            logger.info(f"Assessing ADKAR for initiative: {initiative_id}")

            # Create ADKAR score
            adkar = ADKARScore(
                awareness=assessment_data.get("awareness", 3.0),
                desire=assessment_data.get("desire", 3.0),
                knowledge=assessment_data.get("knowledge", 3.0),
                ability=assessment_data.get("ability", 3.0),
                reinforcement=assessment_data.get("reinforcement", 3.0)
            )

            # Identify gaps and generate interventions
            gaps = adkar.identify_gaps()
            interventions = self._generate_adkar_interventions(gaps)

            # Determine readiness
            readiness = adkar.readiness_level()

            # Calculate risk
            risk_level = self._calculate_change_risk(adkar)

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].adkar_scores = adkar

            # Log operation
            operation = {
                "operation": "assess_adkar",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"ADKAR assessment complete: {readiness}, score: {adkar.calculate_overall():.2f}/5")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "adkar_scores": adkar.to_dict(),
                "gaps": gaps,
                "interventions": interventions,
                "readiness": readiness,
                "risk_level": risk_level,
                "recommendations": self._generate_adkar_recommendations(adkar),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error assessing ADKAR: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def map_diffusion_curve(
        self,
        initiative_id: str,
        population_size: int,
        current_adopters: int
    ) -> Dict[str, Any]:
        """
        Map adopters to Rogers' Diffusion Curve categories.

        Args:
            initiative_id: Change initiative identifier
            population_size: Total target population
            current_adopters: Current number of adopters

        Returns:
            Dictionary containing diffusion curve analysis
        """
        try:
            logger.info(f"Mapping diffusion curve for initiative: {initiative_id}")

            # Calculate adoption rate
            adoption_rate = (current_adopters / population_size * 100) if population_size > 0 else 0

            # Create diffusion metrics
            diffusion = DiffusionMetrics(
                total_population=population_size,
                current_adopters=current_adopters,
                adoption_rate=adoption_rate
            )

            # Classify current stage
            classification = diffusion.classify_adopters()

            # Project future adoption
            projections = diffusion.project_adoption(weeks=12)

            # Determine strategy for current category
            category_strategy = self._get_diffusion_strategy(classification["current_category"])

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].diffusion_metrics = diffusion

            # Log operation
            operation = {
                "operation": "map_diffusion_curve",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Diffusion curve mapped: {classification['current_category']}, {adoption_rate:.1f}% adoption")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "diffusion_metrics": diffusion.to_dict(),
                "current_category": classification["current_category"],
                "adoption_rate": adoption_rate,
                "projections": projections,
                "category_strategy": category_strategy,
                "next_milestone": self._identify_next_milestone(adoption_rate),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error mapping diffusion curve: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def assess_change_readiness(
        self,
        initiative_id: str,
        organizational_factors: Dict[str, float],
        individual_factors: Dict[str, float],
        change_factors: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Assess organizational and individual change readiness.

        Args:
            initiative_id: Change initiative identifier
            organizational_factors: Organizational readiness factors (0-10)
            individual_factors: Individual readiness factors (0-10)
            change_factors: Change characteristics (0-10)

        Returns:
            Dictionary containing readiness assessment
        """
        try:
            logger.info(f"Assessing change readiness for initiative: {initiative_id}")

            # Create readiness assessment
            readiness = ChangeReadinessAssessment(
                organizational_factors=organizational_factors,
                individual_factors=individual_factors,
                change_factors=change_factors
            )

            # Calculate scores
            overall_readiness = readiness.calculate_overall_readiness()

            # Identify barriers
            barriers = readiness.identify_barriers()

            # Generate action plan
            action_plan = self._create_readiness_action_plan(barriers)

            # Determine go/no-go recommendation
            go_nogo = self._determine_go_nogo(overall_readiness, barriers)

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].readiness_assessment = readiness

            # Log operation
            operation = {
                "operation": "assess_change_readiness",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Change readiness assessed: {overall_readiness:.1f}/10")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "readiness_assessment": readiness.to_dict(),
                "overall_readiness": overall_readiness,
                "barriers": barriers,
                "action_plan": action_plan,
                "go_nogo_recommendation": go_nogo,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error assessing change readiness: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def analyze_resistance(
        self,
        initiative_id: str,
        resistance_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze resistance patterns and generate mitigation strategies.

        Args:
            initiative_id: Change initiative identifier
            resistance_data: Resistance data by individual/group

        Returns:
            Dictionary containing resistance analysis
        """
        try:
            logger.info(f"Analyzing resistance for initiative: {initiative_id}")

            # Categorize resistance
            resistance_distribution = {
                "champion": 0,
                "supporter": 0,
                "neutral": 0,
                "resistant": 0,
                "hostile": 0
            }

            for item in resistance_data:
                level = item.get("resistance_level", "neutral")
                resistance_distribution[level] = resistance_distribution.get(level, 0) + 1

            total = sum(resistance_distribution.values())

            # Calculate percentages
            resistance_percentages = {
                level: (count / total * 100) if total > 0 else 0
                for level, count in resistance_distribution.items()
            }

            # Calculate overall resistance score (higher = more resistance)
            weights = {
                "champion": -2,
                "supporter": -1,
                "neutral": 0,
                "resistant": 2,
                "hostile": 3
            }

            resistance_score = sum(
                resistance_distribution[level] * weight
                for level, weight in weights.items()
            ) / total if total > 0 else 0

            # Generate mitigation strategies
            strategies = self._generate_resistance_strategies(
                resistance_distribution,
                resistance_score
            )

            # Identify key influencers to engage
            influencers = self._identify_key_influencers(resistance_data)

            # Log operation
            operation = {
                "operation": "analyze_resistance",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Resistance analyzed: score {resistance_score:.2f}")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "resistance_distribution": resistance_distribution,
                "resistance_percentages": resistance_percentages,
                "resistance_score": resistance_score,
                "resistance_level": self._classify_resistance_level(resistance_score),
                "mitigation_strategies": strategies,
                "key_influencers": influencers,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error analyzing resistance: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def create_stakeholder_matrix(
        self,
        initiative_id: str,
        stakeholder_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create Power/Interest stakeholder matrix.

        Args:
            initiative_id: Change initiative identifier
            stakeholder_data: Stakeholder power and interest data

        Returns:
            Dictionary containing stakeholder matrix
        """
        try:
            logger.info(f"Creating stakeholder matrix for initiative: {initiative_id}")

            # Create stakeholder objects
            stakeholders = []
            for data in stakeholder_data:
                stakeholder = Stakeholder(
                    stakeholder_id=self._generate_id(f"stakeholder_{data['name']}"),
                    name=data["name"],
                    role=data.get("role", ""),
                    power_level=data.get("power", 5),
                    interest_level=data.get("interest", 5),
                    resistance_level=ResistanceLevel(data.get("resistance", "neutral")),
                    influence_network=data.get("influence_network", [])
                )

                # Assign engagement strategy based on quadrant
                stakeholder.engagement_strategy = self._assign_engagement_strategy(
                    stakeholder.get_quadrant()
                )

                stakeholders.append(stakeholder)

            # Organize by quadrant
            matrix = {
                "manage_closely": [],
                "keep_satisfied": [],
                "keep_informed": [],
                "monitor": []
            }

            for stakeholder in stakeholders:
                quadrant = stakeholder.get_quadrant().value
                matrix[quadrant].append(stakeholder.to_dict())

            # Prioritize stakeholders
            prioritized = sorted(stakeholders, key=lambda s: s.priority_score(), reverse=True)

            # Generate engagement plan
            engagement_plan = self._create_stakeholder_engagement_plan(stakeholders)

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].stakeholders = stakeholders

            # Log operation
            operation = {
                "operation": "create_stakeholder_matrix",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Stakeholder matrix created: {len(stakeholders)} stakeholders")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "stakeholder_matrix": matrix,
                "prioritized_stakeholders": [s.to_dict() for s in prioritized[:10]],
                "engagement_plan": engagement_plan,
                "summary": {
                    "total_stakeholders": len(stakeholders),
                    "manage_closely": len(matrix["manage_closely"]),
                    "keep_satisfied": len(matrix["keep_satisfied"]),
                    "keep_informed": len(matrix["keep_informed"]),
                    "monitor": len(matrix["monitor"])
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating stakeholder matrix: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def assess_change_impact(
        self,
        initiative_id: str,
        scope: float,
        depth: float,
        breadth: float
    ) -> Dict[str, Any]:
        """
        Assess change impact using Scope, Depth, Breadth dimensions.

        Args:
            initiative_id: Change initiative identifier
            scope: Number of processes/systems affected (0-10)
            depth: Degree of change required (0-10)
            breadth: Number of people affected (0-10)

        Returns:
            Dictionary containing impact assessment
        """
        try:
            logger.info(f"Assessing change impact for initiative: {initiative_id}")

            # Create impact assessment
            impact = ChangeImpactAssessment(
                scope=scope,
                depth=depth,
                breadth=breadth
            )

            # Calculate overall impact
            overall_impact = impact.calculate_overall_impact()
            impact_level = impact.impact_level()

            # Estimate duration and resources
            duration = impact.estimate_duration()
            resources = self._estimate_change_resources(impact)

            # Identify risks
            risks = self._identify_change_risks(impact)

            # Generate success factors
            success_factors = self._define_success_factors(impact_level)

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].impact_assessment = impact

            # Log operation
            operation = {
                "operation": "assess_change_impact",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Change impact assessed: {impact_level} ({overall_impact:.1f}/10)")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "impact_assessment": impact.to_dict(),
                "overall_impact": overall_impact,
                "impact_level": impact_level,
                "duration_estimate": duration,
                "resource_estimate": resources,
                "risks": risks,
                "success_factors": success_factors,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error assessing change impact: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def track_adoption_metrics(
        self,
        initiative_id: str,
        metrics_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Track adoption metrics (usage, proficiency, satisfaction).

        Args:
            initiative_id: Change initiative identifier
            metrics_data: Adoption metrics data

        Returns:
            Dictionary containing adoption dashboard
        """
        try:
            logger.info(f"Tracking adoption metrics for initiative: {initiative_id}")

            # Create/update adoption metrics
            adoption_metrics = []
            for data in metrics_data:
                metric = AdoptionMetrics(
                    metric_id=self._generate_id(f"metric_{data['name']}"),
                    metric_name=data["name"],
                    metric_type=data.get("type", "usage"),
                    baseline=data.get("baseline", 0),
                    current=data.get("current", 0),
                    target=data.get("target", 100),
                    unit=data.get("unit", "%"),
                    measured_at=datetime.now()
                )
                adoption_metrics.append(metric)

            # Calculate summary statistics
            avg_progress = statistics.mean([m.progress_percentage() for m in adoption_metrics])
            on_track_count = sum(1 for m in adoption_metrics if m.is_on_track())

            # Categorize metrics by type
            metrics_by_type = {
                "usage": [],
                "proficiency": [],
                "satisfaction": []
            }

            for metric in adoption_metrics:
                if metric.metric_type in metrics_by_type:
                    metrics_by_type[metric.metric_type].append(metric.to_dict())

            # Determine adoption health
            health_status = self._assess_adoption_health(avg_progress, on_track_count, len(adoption_metrics))

            # Generate interventions if needed
            interventions = []
            if health_status != "healthy":
                interventions = self._generate_adoption_interventions(adoption_metrics)

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].adoption_metrics = adoption_metrics

            # Log operation
            operation = {
                "operation": "track_adoption_metrics",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Adoption metrics tracked: {avg_progress:.1f}% average progress")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "metrics": [m.to_dict() for m in adoption_metrics],
                "metrics_by_type": metrics_by_type,
                "summary": {
                    "total_metrics": len(adoption_metrics),
                    "average_progress": avg_progress,
                    "on_track_count": on_track_count,
                    "on_track_percentage": (on_track_count / len(adoption_metrics) * 100) if adoption_metrics else 0
                },
                "health_status": health_status,
                "interventions": interventions,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error tracking adoption metrics: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def design_communication_plan(
        self,
        initiative_id: str,
        target_audiences: List[str],
        change_phases: List[str]
    ) -> Dict[str, Any]:
        """
        Design comprehensive communication plan with channels and messaging.

        Args:
            initiative_id: Change initiative identifier
            target_audiences: Target audience segments
            change_phases: Phases of change to communicate

        Returns:
            Dictionary containing communication plan
        """
        try:
            logger.info(f"Designing communication plan for initiative: {initiative_id}")

            # Create communication plan structure
            communication_plan = {
                "objectives": self._define_communication_objectives(),
                "audiences": {},
                "channels": self._define_communication_channels(),
                "cadence": self._define_communication_cadence(),
                "messages_by_phase": {}
            }

            # Define audience-specific strategies
            for audience in target_audiences:
                communication_plan["audiences"][audience] = {
                    "key_messages": self._craft_audience_messages(audience),
                    "preferred_channels": self._select_audience_channels(audience),
                    "frequency": self._determine_communication_frequency(audience)
                }

            # Define phase-specific messaging
            for phase in change_phases:
                communication_plan["messages_by_phase"][phase] = {
                    "key_messages": self._craft_phase_messages(phase),
                    "communication_goals": self._define_phase_goals(phase),
                    "success_metrics": self._define_phase_metrics(phase)
                }

            # Create communication calendar
            calendar = self._create_communication_calendar(
                target_audiences,
                change_phases,
                12  # weeks
            )

            # Define feedback mechanisms
            feedback_mechanisms = self._define_feedback_mechanisms()

            # Update initiative if exists
            if initiative_id in self.initiatives:
                self.initiatives[initiative_id].communication_plan = communication_plan

            # Log operation
            operation = {
                "operation": "design_communication_plan",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Communication plan designed: {len(target_audiences)} audiences, {len(change_phases)} phases")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "communication_plan": communication_plan,
                "communication_calendar": calendar,
                "feedback_mechanisms": feedback_mechanisms,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error designing communication plan: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def create_change_initiative(
        self,
        name: str,
        description: str,
        change_type: str,
        population_size: int
    ) -> Dict[str, Any]:
        """
        Create new change initiative.

        Args:
            name: Initiative name
            description: Initiative description
            change_type: Type of change (process, technology, culture, etc.)
            population_size: Target population size

        Returns:
            Dictionary containing created initiative
        """
        try:
            logger.info(f"Creating change initiative: {name}")

            # Generate initiative ID
            initiative_id = self._generate_id(f"initiative_{name}")

            # Initialize ADKAR with baseline scores
            adkar = ADKARScore(
                awareness=3.0,
                desire=3.0,
                knowledge=3.0,
                ability=3.0,
                reinforcement=3.0
            )

            # Initialize diffusion metrics
            diffusion = DiffusionMetrics(
                total_population=population_size,
                current_adopters=0,
                adoption_rate=0.0
            )

            # Initialize readiness assessment
            readiness = ChangeReadinessAssessment(
                organizational_factors={},
                individual_factors={},
                change_factors={}
            )

            # Initialize impact assessment
            impact = ChangeImpactAssessment(
                scope=5.0,
                depth=5.0,
                breadth=5.0
            )

            # Create initiative
            initiative = ChangeInitiative(
                initiative_id=initiative_id,
                name=name,
                description=description,
                change_type=change_type,
                phase=ChangePhase.AWARENESS,
                adkar_scores=adkar,
                diffusion_metrics=diffusion,
                readiness_assessment=readiness,
                stakeholders=[],
                impact_assessment=impact,
                adoption_metrics=[],
                communication_plan={},
                training_plan={},
                created_at=datetime.now()
            )

            # Store initiative
            self.initiatives[initiative_id] = initiative

            # Log operation
            operation = {
                "operation": "create_change_initiative",
                "initiative_id": initiative_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Change initiative created: {initiative_id}")

            return {
                "status": "success",
                "initiative_id": initiative_id,
                "initiative": initiative.to_dict(),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating change initiative: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    # Helper methods

    def _generate_id(self, base: str) -> str:
        """Generate unique ID"""
        return hashlib.md5(f"{base}_{datetime.now().timestamp()}".encode()).hexdigest()[:16]

    def _generate_adkar_interventions(self, gaps: List[str]) -> Dict[str, List[str]]:
        """Generate interventions for ADKAR gaps"""
        interventions = {}

        intervention_map = {
            "awareness": [
                "Communicate the business case for change",
                "Share data and evidence for why change is needed",
                "Conduct town halls and leadership presentations",
                "Create urgency through competitive analysis"
            ],
            "desire": [
                "Address WIIFM (What's In It For Me)",
                "Engage influential change champions",
                "Showcase early wins and success stories",
                "Provide incentives and recognition for adopters"
            ],
            "knowledge": [
                "Develop comprehensive training programs",
                "Create job aids and reference materials",
                "Establish mentoring and coaching programs",
                "Provide hands-on practice opportunities"
            ],
            "ability": [
                "Offer additional practice time",
                "Provide one-on-one coaching support",
                "Simplify processes and tools",
                "Remove barriers to skill application"
            ],
            "reinforcement": [
                "Recognize and reward adoption behaviors",
                "Monitor and celebrate milestones",
                "Address backsliding immediately",
                "Embed changes in performance metrics"
            ]
        }

        for gap in gaps:
            interventions[gap] = intervention_map.get(gap, [])

        return interventions

    def _calculate_change_risk(self, adkar: ADKARScore) -> str:
        """Calculate change risk level based on ADKAR scores"""
        overall = adkar.calculate_overall()

        if overall >= 4:
            return "low"
        elif overall >= 3:
            return "medium"
        else:
            return "high"

    def _generate_adkar_recommendations(self, adkar: ADKARScore) -> List[str]:
        """Generate recommendations based on ADKAR assessment"""
        recommendations = []

        gaps = adkar.identify_gaps()

        if not gaps:
            recommendations.append("ADKAR scores are strong - proceed with change implementation")
        else:
            recommendations.append(f"Address {len(gaps)} ADKAR gaps before proceeding: {', '.join(gaps)}")

        if adkar.awareness < 3:
            recommendations.append("Priority: Increase awareness through communication campaign")
        if adkar.desire < 3:
            recommendations.append("Priority: Build desire by addressing stakeholder concerns")
        if adkar.knowledge < 3:
            recommendations.append("Priority: Develop and deliver training programs")
        if adkar.ability < 3:
            recommendations.append("Priority: Provide hands-on practice and coaching")
        if adkar.reinforcement < 3:
            recommendations.append("Priority: Implement recognition and reward systems")

        return recommendations

    def _get_diffusion_strategy(self, category: str) -> Dict[str, Any]:
        """Get adoption strategy for diffusion curve category"""
        strategies = {
            "innovators": {
                "focus": "Identify and engage innovators",
                "tactics": [
                    "Recruit tech-savvy early adopters",
                    "Provide beta access and pilot opportunities",
                    "Gather feedback for refinement",
                    "Create ambassadors for next phase"
                ],
                "messaging": "Be part of cutting-edge innovation"
            },
            "early_adopters": {
                "focus": "Leverage early adopters as champions",
                "tactics": [
                    "Showcase early wins and success stories",
                    "Empower champions to influence peers",
                    "Refine based on early feedback",
                    "Build momentum for mainstream adoption"
                ],
                "messaging": "Join the leaders driving change"
            },
            "early_majority": {
                "focus": "Build credibility and reduce risk",
                "tactics": [
                    "Highlight proven benefits and ROI",
                    "Provide comprehensive training and support",
                    "Share peer testimonials and case studies",
                    "Simplify adoption process"
                ],
                "messaging": "Proven solution delivering results"
            },
            "late_majority": {
                "focus": "Make adoption inevitable and easy",
                "tactics": [
                    "Emphasize widespread adoption",
                    "Provide extensive hand-holding",
                    "Make old way unavailable",
                    "Offer generous support"
                ],
                "messaging": "Everyone is using this - join them"
            },
            "laggards": {
                "focus": "Make change mandatory and supportive",
                "tactics": [
                    "Mandate adoption with deadline",
                    "Provide intensive one-on-one support",
                    "Remove alternative options",
                    "Recognize completion"
                ],
                "messaging": "Required change with full support"
            }
        }

        return strategies.get(category, strategies["early_majority"])

    def _identify_next_milestone(self, adoption_rate: float) -> Dict[str, Any]:
        """Identify next adoption milestone"""
        if adoption_rate < 2.5:
            return {
                "milestone": "Innovators (2.5%)",
                "gap": 2.5 - adoption_rate,
                "focus": "Recruit early tech adopters"
            }
        elif adoption_rate < 16.0:
            return {
                "milestone": "Early Adopters (16%)",
                "gap": 16.0 - adoption_rate,
                "focus": "Build champion network"
            }
        elif adoption_rate < 50.0:
            return {
                "milestone": "Early Majority (50%)",
                "gap": 50.0 - adoption_rate,
                "focus": "Drive mainstream adoption"
            }
        elif adoption_rate < 84.0:
            return {
                "milestone": "Late Majority (84%)",
                "gap": 84.0 - adoption_rate,
                "focus": "Reach resisters"
            }
        else:
            return {
                "milestone": "Full Adoption (100%)",
                "gap": 100.0 - adoption_rate,
                "focus": "Complete laggards"
            }

    def _create_readiness_action_plan(self, barriers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create action plan to address readiness barriers"""
        action_plan = []

        for barrier in barriers[:5]:  # Top 5 barriers
            action = {
                "barrier": barrier["factor"],
                "dimension": barrier["dimension"],
                "current_score": barrier["score"],
                "target_score": 8.0,
                "gap": barrier["gap"],
                "actions": self._get_barrier_actions(barrier["dimension"], barrier["factor"]),
                "owner": "change_leader",
                "timeline": "2-4 weeks"
            }
            action_plan.append(action)

        return action_plan

    def _get_barrier_actions(self, dimension: str, factor: str) -> List[str]:
        """Get specific actions for barrier"""
        # Simplified action mapping
        if dimension == "organizational":
            return [
                f"Secure executive sponsorship for {factor}",
                f"Allocate dedicated resources to improve {factor}",
                f"Communicate importance of {factor} to organization"
            ]
        elif dimension == "individual":
            return [
                f"Provide training to build {factor}",
                f"Create support resources for {factor}",
                f"Recognize and reward improvements in {factor}"
            ]
        else:
            return [
                f"Simplify {factor} to reduce complexity",
                f"Adjust timing of {factor} for better acceptance",
                f"Communicate rationale for {factor}"
            ]

    def _determine_go_nogo(self, overall_readiness: float, barriers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Determine go/no-go recommendation"""
        critical_barriers = [b for b in barriers if b["score"] < 4]

        if overall_readiness >= 7 and len(critical_barriers) == 0:
            recommendation = "GO"
            rationale = "Strong readiness across all dimensions"
        elif overall_readiness >= 5 and len(critical_barriers) <= 2:
            recommendation = "GO WITH MITIGATION"
            rationale = f"Moderate readiness - address {len(critical_barriers)} critical barriers"
        else:
            recommendation = "NO-GO"
            rationale = f"Insufficient readiness - {len(critical_barriers)} critical barriers must be resolved"

        return {
            "recommendation": recommendation,
            "rationale": rationale,
            "overall_readiness": overall_readiness,
            "critical_barriers": len(critical_barriers),
            "conditions": self._define_go_conditions(critical_barriers) if recommendation == "GO WITH MITIGATION" else []
        }

    def _define_go_conditions(self, critical_barriers: List[Dict[str, Any]]) -> List[str]:
        """Define conditions for conditional go"""
        return [
            f"Improve {barrier['factor']} to minimum score of 6"
            for barrier in critical_barriers
        ]

    def _generate_resistance_strategies(
        self,
        distribution: Dict[str, int],
        resistance_score: float
    ) -> List[Dict[str, str]]:
        """Generate resistance mitigation strategies"""
        strategies = []

        # Address hostile and resistant groups
        if distribution.get("hostile", 0) > 0:
            strategies.append({
                "target": "Hostile stakeholders",
                "strategy": "One-on-one engagement to understand concerns",
                "tactics": "Listen actively, address specific concerns, provide reassurance"
            })

        if distribution.get("resistant", 0) > 0:
            strategies.append({
                "target": "Resistant stakeholders",
                "strategy": "Increase involvement and influence",
                "tactics": "Invite input, pilot with volunteers, showcase quick wins"
            })

        # Leverage champions and supporters
        if distribution.get("champion", 0) > 0:
            strategies.append({
                "target": "Champions",
                "strategy": "Empower as change agents",
                "tactics": "Provide tools and visibility, amplify their voice, recognize contributions"
            })

        if distribution.get("supporter", 0) > 0:
            strategies.append({
                "target": "Supporters",
                "strategy": "Convert to active champions",
                "tactics": "Provide leadership opportunities, build confidence, expand influence"
            })

        # Overall strategy based on score
        if resistance_score > 1:
            strategies.append({
                "target": "Overall organization",
                "strategy": "Major resistance mitigation required",
                "tactics": "Slow down, gather feedback, adjust approach, build coalitions"
            })
        elif resistance_score > 0:
            strategies.append({
                "target": "Overall organization",
                "strategy": "Moderate resistance management",
                "tactics": "Continue communication, address concerns, celebrate progress"
            })

        return strategies

    def _classify_resistance_level(self, score: float) -> str:
        """Classify overall resistance level"""
        if score > 2:
            return "high_resistance"
        elif score > 0:
            return "moderate_resistance"
        elif score > -1:
            return "neutral"
        else:
            return "supportive"

    def _identify_key_influencers(self, resistance_data: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Identify key influencers to engage"""
        influencers = []

        for item in resistance_data:
            if item.get("influence_score", 0) >= 7:
                influencers.append({
                    "name": item.get("name", "Unknown"),
                    "influence_score": item.get("influence_score", 0),
                    "resistance_level": item.get("resistance_level", "neutral"),
                    "engagement_priority": "high" if item.get("resistance_level") in ["resistant", "hostile"] else "medium"
                })

        return sorted(influencers, key=lambda x: x["influence_score"], reverse=True)[:10]

    def _assign_engagement_strategy(self, quadrant: StakeholderQuadrant) -> str:
        """Assign engagement strategy based on quadrant"""
        strategies = {
            StakeholderQuadrant.MANAGE_CLOSELY: "Close partnership - involve in planning and decision-making",
            StakeholderQuadrant.KEEP_SATISFIED: "Regular briefings - keep informed of major decisions",
            StakeholderQuadrant.KEEP_INFORMED: "Regular updates - leverage as advocates and champions",
            StakeholderQuadrant.MONITOR: "Periodic updates - monitor for changes in interest/power"
        }

        return strategies[quadrant]

    def _create_stakeholder_engagement_plan(self, stakeholders: List[Stakeholder]) -> Dict[str, Any]:
        """Create comprehensive stakeholder engagement plan"""
        plan = {
            "high_priority": [],
            "medium_priority": [],
            "low_priority": []
        }

        for stakeholder in stakeholders:
            quadrant = stakeholder.get_quadrant()
            priority = stakeholder.priority_score()

            entry = {
                "name": stakeholder.name,
                "quadrant": quadrant.value,
                "strategy": stakeholder.engagement_strategy,
                "frequency": self._determine_engagement_frequency(quadrant),
                "channels": self._determine_engagement_channels(quadrant)
            }

            if priority >= 7:
                plan["high_priority"].append(entry)
            elif priority >= 4:
                plan["medium_priority"].append(entry)
            else:
                plan["low_priority"].append(entry)

        return plan

    def _determine_engagement_frequency(self, quadrant: StakeholderQuadrant) -> str:
        """Determine engagement frequency by quadrant"""
        frequencies = {
            StakeholderQuadrant.MANAGE_CLOSELY: "Weekly",
            StakeholderQuadrant.KEEP_SATISFIED: "Bi-weekly",
            StakeholderQuadrant.KEEP_INFORMED: "Monthly",
            StakeholderQuadrant.MONITOR: "Quarterly"
        }

        return frequencies[quadrant]

    def _determine_engagement_channels(self, quadrant: StakeholderQuadrant) -> List[str]:
        """Determine engagement channels by quadrant"""
        channels = {
            StakeholderQuadrant.MANAGE_CLOSELY: ["1:1 meetings", "steering committee", "direct email"],
            StakeholderQuadrant.KEEP_SATISFIED: ["executive briefings", "email updates", "quarterly reviews"],
            StakeholderQuadrant.KEEP_INFORMED: ["newsletters", "town halls", "team meetings"],
            StakeholderQuadrant.MONITOR: ["email updates", "intranet posts"]
        }

        return channels[quadrant]

    def _estimate_change_resources(self, impact: ChangeImpactAssessment) -> Dict[str, Any]:
        """Estimate resources needed for change"""
        overall_impact = impact.calculate_overall_impact()

        # Resource estimation based on impact
        if overall_impact >= 8:
            fte = 5
            budget = 500000
        elif overall_impact >= 6:
            fte = 3
            budget = 200000
        elif overall_impact >= 4:
            fte = 2
            budget = 75000
        else:
            fte = 1
            budget = 25000

        return {
            "dedicated_fte": fte,
            "estimated_budget": budget,
            "currency": "USD",
            "breakdown": {
                "communication": budget * 0.25,
                "training": budget * 0.40,
                "tools_and_systems": budget * 0.25,
                "contingency": budget * 0.10
            }
        }

    def _identify_change_risks(self, impact: ChangeImpactAssessment) -> List[Dict[str, str]]:
        """Identify risks based on change impact"""
        risks = []

        if impact.scope >= 7:
            risks.append({
                "risk": "Process disruption",
                "mitigation": "Phased rollout with parallel running"
            })

        if impact.depth >= 7:
            risks.append({
                "risk": "Skill gaps and performance dips",
                "mitigation": "Comprehensive training and extended support period"
            })

        if impact.breadth >= 7:
            risks.append({
                "risk": "Change fatigue and resistance",
                "mitigation": "Strong communication and champion network"
            })

        if impact.calculate_overall_impact() >= 8:
            risks.append({
                "risk": "Business continuity impact",
                "mitigation": "Detailed contingency planning and rollback procedures"
            })

        return risks

    def _define_success_factors(self, impact_level: str) -> List[str]:
        """Define critical success factors by impact level"""
        base_factors = [
            "Executive sponsorship and visible support",
            "Clear communication of vision and benefits",
            "Adequate resources and budget",
            "Engaged change champion network"
        ]

        if impact_level == "transformational":
            base_factors.extend([
                "Dedicated full-time change management team",
                "Comprehensive training and support infrastructure",
                "Phased implementation with measurable milestones",
                "Active resistance management program"
            ])
        elif impact_level == "major":
            base_factors.extend([
                "Dedicated change management resources",
                "Structured training program",
                "Regular stakeholder engagement"
            ])

        return base_factors

    def _assess_adoption_health(
        self,
        avg_progress: float,
        on_track_count: int,
        total_metrics: int
    ) -> str:
        """Assess adoption health status"""
        on_track_pct = (on_track_count / total_metrics * 100) if total_metrics > 0 else 0

        if avg_progress >= 80 and on_track_pct >= 75:
            return "healthy"
        elif avg_progress >= 60 and on_track_pct >= 50:
            return "moderate"
        else:
            return "at_risk"

    def _generate_adoption_interventions(self, metrics: List[AdoptionMetrics]) -> List[Dict[str, str]]:
        """Generate interventions for underperforming adoption metrics"""
        interventions = []

        for metric in metrics:
            if not metric.is_on_track():
                if metric.metric_type == "usage":
                    interventions.append({
                        "metric": metric.metric_name,
                        "intervention": "Usage campaign",
                        "actions": "Gamification, reminders, remove barriers to access"
                    })
                elif metric.metric_type == "proficiency":
                    interventions.append({
                        "metric": metric.metric_name,
                        "intervention": "Additional training",
                        "actions": "Refresher sessions, job aids, 1:1 coaching"
                    })
                elif metric.metric_type == "satisfaction":
                    interventions.append({
                        "metric": metric.metric_name,
                        "intervention": "Address pain points",
                        "actions": "Gather feedback, prioritize fixes, communicate improvements"
                    })

        return interventions

    def _define_communication_objectives(self) -> List[str]:
        """Define communication objectives"""
        return [
            "Build awareness of change need and benefits",
            "Generate desire and excitement for change",
            "Provide knowledge and understanding of what's changing",
            "Address concerns and resistance proactively",
            "Celebrate wins and maintain momentum"
        ]

    def _define_communication_channels(self) -> Dict[str, Dict[str, str]]:
        """Define available communication channels"""
        return {
            "email": {"reach": "high", "engagement": "low", "best_for": "updates"},
            "town_halls": {"reach": "medium", "engagement": "high", "best_for": "vision_and_qa"},
            "team_meetings": {"reach": "medium", "engagement": "high", "best_for": "discussion"},
            "intranet": {"reach": "high", "engagement": "low", "best_for": "reference"},
            "videos": {"reach": "high", "engagement": "medium", "best_for": "storytelling"},
            "1:1_meetings": {"reach": "low", "engagement": "very_high", "best_for": "resistance"}
        }

    def _define_communication_cadence(self) -> Dict[str, str]:
        """Define communication cadence by phase"""
        return {
            "awareness": "Weekly",
            "understanding": "Bi-weekly",
            "acceptance": "Weekly",
            "adoption": "Daily during rollout",
            "institutionalization": "Monthly"
        }

    def _craft_audience_messages(self, audience: str) -> List[str]:
        """Craft key messages for audience"""
        # Simplified message mapping
        return [
            f"How this change benefits {audience}",
            f"What {audience} needs to do differently",
            f"Support available for {audience}"
        ]

    def _select_audience_channels(self, audience: str) -> List[str]:
        """Select best channels for audience"""
        # Simplified channel selection
        return ["email", "team_meetings", "intranet"]

    def _determine_communication_frequency(self, audience: str) -> str:
        """Determine communication frequency for audience"""
        return "Bi-weekly"

    def _craft_phase_messages(self, phase: str) -> List[str]:
        """Craft messages for change phase"""
        messages = {
            "awareness": ["Why we're changing", "Business case and urgency"],
            "understanding": ["What's changing", "How it works"],
            "acceptance": ["Benefits to you", "Address concerns"],
            "adoption": ["How to start", "Support available"],
            "institutionalization": ["Celebrate success", "Continuous improvement"]
        }

        return messages.get(phase, ["Key message 1", "Key message 2"])

    def _define_phase_goals(self, phase: str) -> List[str]:
        """Define communication goals for phase"""
        goals = {
            "awareness": ["80% aware of change", "60% understand why"],
            "understanding": ["70% understand what's changing", "50% know impact on them"],
            "acceptance": ["60% supportive of change", "40% ready to adopt"],
            "adoption": ["Target adoption rate achieved", "90% trained"],
            "institutionalization": ["Change embedded in processes", "Recognition of success"]
        }

        return goals.get(phase, ["Phase goal 1", "Phase goal 2"])

    def _define_phase_metrics(self, phase: str) -> List[str]:
        """Define success metrics for communication phase"""
        return ["Message reach", "Engagement rate", "Sentiment score"]

    def _create_communication_calendar(
        self,
        audiences: List[str],
        phases: List[str],
        weeks: int
    ) -> List[Dict[str, Any]]:
        """Create communication calendar"""
        calendar = []

        for week in range(1, weeks + 1):
            # Simplified calendar generation
            if week % 2 == 1:  # Odd weeks
                calendar.append({
                    "week": week,
                    "activity": "Email update",
                    "audience": "All employees",
                    "content": "Weekly progress update"
                })

            if week % 4 == 0:  # Every 4 weeks
                calendar.append({
                    "week": week,
                    "activity": "Town hall",
                    "audience": "All employees",
                    "content": "Monthly review and Q&A"
                })

        return calendar

    def _define_feedback_mechanisms(self) -> Dict[str, str]:
        """Define feedback collection mechanisms"""
        return {
            "surveys": "Monthly pulse surveys on change sentiment",
            "focus_groups": "Bi-weekly focus groups with representative sample",
            "town_halls": "Open Q&A at monthly town halls",
            "suggestion_box": "Anonymous feedback channel",
            "champion_network": "Regular feedback from change champions"
        }

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
                                          if i.phase != ChangePhase.INSTITUTIONALIZATION])
            }
        }
