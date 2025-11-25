"""
Market Expander Agent

Analyzes market expansion opportunities and develops market entry strategies.
Implements market analysis, expansion roadmaps, and risk assessment frameworks.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
import math
from collections import defaultdict

logger = logging.getLogger(__name__)


class MarketType(Enum):
    """Types of markets."""
    GEOGRAPHIC = "geographic"
    VERTICAL = "vertical"
    SEGMENT = "segment"
    CHANNEL = "channel"
    PRODUCT = "product"


class ExpansionStrategy(Enum):
    """Market expansion strategies."""
    ORGANIC_GROWTH = "organic_growth"
    PARTNERSHIP = "partnership"
    ACQUISITION = "acquisition"
    FRANCHISING = "franchising"
    LICENSING = "licensing"
    JOINT_VENTURE = "joint_venture"
    GREENFIELD = "greenfield"
    DIGITAL_FIRST = "digital_first"


class MarketMaturity(Enum):
    """Market maturity levels."""
    EMERGING = "emerging"
    GROWING = "growing"
    MATURE = "mature"
    DECLINING = "declining"


class RiskLevel(Enum):
    """Risk assessment levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class MarketOpportunity:
    """Market expansion opportunity."""
    opportunity_id: str
    market_name: str
    market_type: MarketType
    attractiveness_score: int
    market_size: float
    growth_rate: float
    competition_level: str
    entry_barriers: List[str]
    required_investment: float
    time_to_market: int
    estimated_revenue: Dict[str, float]
    risk_level: RiskLevel
    recommended_strategy: ExpansionStrategy


@dataclass
class MarketAnalysis:
    """Comprehensive market analysis."""
    market_id: str
    market_name: str
    tam: float  # Total Addressable Market
    sam: float  # Serviceable Addressable Market
    som: float  # Serviceable Obtainable Market
    cagr: float  # Compound Annual Growth Rate
    market_maturity: MarketMaturity
    key_trends: List[str]
    competitive_landscape: Dict[str, Any]
    regulatory_environment: Dict[str, Any]
    customer_segments: List[Dict[str, Any]]
    entry_barriers: List[Dict[str, Any]]
    success_factors: List[str]


@dataclass
class ExpansionRoadmap:
    """Market expansion roadmap."""
    roadmap_id: str
    target_market: str
    strategy: ExpansionStrategy
    phases: List[Dict[str, Any]]
    timeline_months: int
    total_investment: float
    revenue_projections: Dict[str, float]
    key_milestones: List[Dict[str, Any]]
    success_metrics: Dict[str, Any]
    risk_mitigation: List[Dict[str, Any]]


class MarketExpanderAgent:
    """
    Production-grade Market Expander Agent.

    Analyzes market expansion opportunities, develops entry strategies,
    and creates comprehensive roadmaps with TAM/SAM/SOM analysis,
    competitive assessment, and risk evaluation.

    Features:
    - TAM/SAM/SOM market sizing
    - Market attractiveness scoring
    - Competitive landscape analysis
    - Entry strategy recommendation
    - Expansion roadmap generation
    - Risk assessment and mitigation
    - Investment planning
    - Revenue forecasting
    - Success factor identification
    - Regulatory compliance analysis
    - Cultural adaptation planning
    - Go-to-market strategy
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Market Expander Agent.

        Args:
            config: Configuration dictionary with market data, thresholds, etc.
        """
        self.config = config or {}
        self.name = "Market Expander"
        self.role = "Market Expansion Strategist"
        self.goal = "Identify and execute high-value market expansion opportunities"

        # Market sizing parameters
        self.sam_percentage = self.config.get("sam_percentage", 0.30)  # 30% of TAM
        self.som_percentage = self.config.get("som_percentage", 0.10)  # 10% of SAM

        # Scoring thresholds
        self.high_attractiveness_threshold = self.config.get("high_attractiveness", 80)
        self.medium_attractiveness_threshold = self.config.get("medium_attractiveness", 60)

        # Risk thresholds
        self.risk_thresholds = {
            "low": 30,
            "medium": 60,
            "high": 80
        }

        # Investment parameters
        self.investment_ranges = self._initialize_investment_ranges()

        # Market data
        self.market_analyses: Dict[str, MarketAnalysis] = {}
        self.opportunities: Dict[str, MarketOpportunity] = {}
        self.roadmaps: Dict[str, ExpansionRoadmap] = {}

        # Competitive intensity factors
        self.competition_factors = self._initialize_competition_factors()

        # Success factors by market type
        self.success_factors = self._initialize_success_factors()

        logger.info("Market Expander initialized successfully")

    def _initialize_investment_ranges(self) -> Dict[str, Dict[str, float]]:
        """Initialize typical investment ranges by strategy."""
        return {
            "organic_growth": {"min": 50000, "max": 200000},
            "partnership": {"min": 25000, "max": 150000},
            "acquisition": {"min": 500000, "max": 5000000},
            "joint_venture": {"min": 100000, "max": 1000000},
            "licensing": {"min": 20000, "max": 100000},
            "digital_first": {"min": 30000, "max": 150000}
        }

    def _initialize_competition_factors(self) -> Dict[str, float]:
        """Initialize competitive intensity scoring factors."""
        return {
            "monopoly": 0.2,
            "oligopoly": 0.5,
            "competitive": 0.7,
            "fragmented": 0.4
        }

    def _initialize_success_factors(self) -> Dict[str, List[str]]:
        """Initialize critical success factors by market type."""
        return {
            "geographic": [
                "Local partnerships",
                "Cultural adaptation",
                "Regulatory compliance",
                "Local talent acquisition"
            ],
            "vertical": [
                "Industry expertise",
                "Vertical-specific solutions",
                "Reference customers",
                "Compliance knowledge"
            ],
            "segment": [
                "Segment understanding",
                "Tailored value proposition",
                "Appropriate pricing",
                "Effective positioning"
            ],
            "channel": [
                "Channel partner relationships",
                "Channel enablement",
                "Incentive alignment",
                "Go-to-market efficiency"
            ]
        }

    def analyze_market(
        self, market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Conduct comprehensive market analysis including TAM/SAM/SOM.

        Args:
            market_data: Market information and parameters

        Returns:
            Comprehensive market analysis results
        """
        try:
            logger.info("Starting market analysis")

            if not market_data:
                raise ValueError("market_data cannot be empty")

            market_name = market_data.get("market_name")
            if not market_name:
                raise ValueError("market_name is required")

            # Calculate market sizing
            tam = self._calculate_tam(market_data)
            sam = self._calculate_sam(tam, market_data)
            som = self._calculate_som(sam, market_data)

            # Calculate growth rate (CAGR)
            cagr = market_data.get("growth_rate", 0)

            # Determine market maturity
            maturity = self._determine_market_maturity(market_data)

            # Analyze competitive landscape
            competitive_landscape = self._analyze_competition(market_data)

            # Identify entry barriers
            entry_barriers = self._identify_entry_barriers(market_data)

            # Extract key trends
            key_trends = market_data.get("trends", [])

            # Identify customer segments
            customer_segments = self._segment_customers(market_data)

            # Assess regulatory environment
            regulatory_environment = self._assess_regulatory_environment(market_data)

            # Identify success factors
            market_type = market_data.get("market_type", "geographic")
            success_factors = self.success_factors.get(market_type, [])

            # Calculate market attractiveness
            attractiveness_score = self._calculate_market_attractiveness(
                tam, sam, som, cagr, competitive_landscape,
                entry_barriers, maturity
            )

            result = {
                "success": True,
                "market_name": market_name,
                "market_sizing": {
                    "tam": round(tam, 2),
                    "sam": round(sam, 2),
                    "som": round(som, 2),
                    "tam_description": "Total Addressable Market",
                    "sam_description": "Serviceable Addressable Market",
                    "som_description": "Serviceable Obtainable Market"
                },
                "growth_metrics": {
                    "cagr": round(cagr, 2),
                    "maturity": maturity.value,
                    "growth_phase": self._determine_growth_phase(cagr, maturity)
                },
                "attractiveness_score": attractiveness_score,
                "attractiveness_rating": self._rate_attractiveness(attractiveness_score),
                "competitive_landscape": competitive_landscape,
                "entry_barriers": entry_barriers,
                "customer_segments": customer_segments,
                "regulatory_environment": regulatory_environment,
                "key_trends": key_trends,
                "success_factors": success_factors,
                "recommendation": self._generate_market_recommendation(
                    attractiveness_score, entry_barriers, competitive_landscape
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Market analysis completed for {market_name}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_market: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in analyze_market: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _calculate_tam(self, market_data: Dict[str, Any]) -> float:
        """Calculate Total Addressable Market."""
        # Method 1: Direct TAM if provided
        if "tam" in market_data:
            return float(market_data["tam"])

        # Method 2: Calculate from market size and price
        total_customers = market_data.get("total_potential_customers", 0)
        average_revenue_per_customer = market_data.get("arpc", 0)

        if total_customers and average_revenue_per_customer:
            return total_customers * average_revenue_per_customer

        # Method 3: Geographic calculation
        population = market_data.get("population", 0)
        penetration_rate = market_data.get("market_penetration_rate", 0.01)
        arpc = market_data.get("arpc", 0)

        if population and penetration_rate and arpc:
            return population * penetration_rate * arpc

        # Default fallback
        return market_data.get("estimated_market_size", 0)

    def _calculate_sam(self, tam: float, market_data: Dict[str, Any]) -> float:
        """Calculate Serviceable Addressable Market."""
        # If SAM explicitly provided
        if "sam" in market_data:
            return float(market_data["sam"])

        # Calculate based on our target segment
        sam_percentage = market_data.get("sam_percentage", self.sam_percentage)

        # Adjust for geographic coverage
        geographic_coverage = market_data.get("geographic_coverage", 1.0)

        # Adjust for segment focus
        segment_focus = market_data.get("segment_focus", 1.0)

        sam = tam * sam_percentage * geographic_coverage * segment_focus

        return sam

    def _calculate_som(self, sam: float, market_data: Dict[str, Any]) -> float:
        """Calculate Serviceable Obtainable Market."""
        # If SOM explicitly provided
        if "som" in market_data:
            return float(market_data["som"])

        # Calculate based on realistic market share
        som_percentage = market_data.get("som_percentage", self.som_percentage)

        # Adjust for competitive intensity
        competition_level = market_data.get("competition_level", "competitive")
        competition_factor = self.competition_factors.get(competition_level, 0.5)

        # Adjust for our competitive advantages
        competitive_advantages = len(market_data.get("competitive_advantages", []))
        advantage_multiplier = 1 + (competitive_advantages * 0.1)

        som = sam * som_percentage * competition_factor * advantage_multiplier

        return som

    def _determine_market_maturity(self, market_data: Dict[str, Any]) -> MarketMaturity:
        """Determine market maturity stage."""
        # If explicitly provided
        if "maturity" in market_data:
            return MarketMaturity(market_data["maturity"])

        # Determine from growth rate
        growth_rate = market_data.get("growth_rate", 0)

        if growth_rate > 0.30:  # 30%+
            return MarketMaturity.EMERGING
        elif growth_rate > 0.15:  # 15-30%
            return MarketMaturity.GROWING
        elif growth_rate > 0:  # 0-15%
            return MarketMaturity.MATURE
        else:
            return MarketMaturity.DECLINING

    def _analyze_competition(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze competitive landscape."""
        competitors = market_data.get("competitors", [])
        competition_level = market_data.get("competition_level", "competitive")

        # Calculate market concentration (HHI - Herfindahl-Hirschman Index)
        market_shares = [c.get("market_share", 0) for c in competitors]
        hhi = sum(share ** 2 for share in market_shares) * 10000

        # Determine concentration level
        if hhi < 1500:
            concentration = "unconcentrated"
        elif hhi < 2500:
            concentration = "moderately_concentrated"
        else:
            concentration = "highly_concentrated"

        # Identify top competitors
        top_competitors = sorted(
            competitors,
            key=lambda x: x.get("market_share", 0),
            reverse=True
        )[:5]

        return {
            "competition_level": competition_level,
            "number_of_competitors": len(competitors),
            "market_concentration": concentration,
            "hhi": round(hhi, 2),
            "top_competitors": [
                {
                    "name": c.get("name"),
                    "market_share": c.get("market_share"),
                    "strengths": c.get("strengths", [])
                }
                for c in top_competitors
            ],
            "competitive_intensity": self._calculate_competitive_intensity(
                len(competitors), hhi, market_data
            )
        }

    def _calculate_competitive_intensity(
        self, num_competitors: int, hhi: float, market_data: Dict[str, Any]
    ) -> str:
        """Calculate overall competitive intensity."""
        intensity_score = 0

        # Number of competitors
        if num_competitors > 20:
            intensity_score += 30
        elif num_competitors > 10:
            intensity_score += 20
        elif num_competitors > 5:
            intensity_score += 10

        # Market concentration
        if hhi < 1500:
            intensity_score += 25
        elif hhi < 2500:
            intensity_score += 15

        # Growth rate competition
        growth_rate = market_data.get("growth_rate", 0)
        if growth_rate < 0.05:  # Low growth = intense competition
            intensity_score += 25

        # Entry activity
        new_entrants = market_data.get("new_entrants_per_year", 0)
        intensity_score += min(new_entrants * 5, 20)

        if intensity_score >= 70:
            return "very_high"
        elif intensity_score >= 50:
            return "high"
        elif intensity_score >= 30:
            return "moderate"
        else:
            return "low"

    def _identify_entry_barriers(self, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify market entry barriers."""
        barriers = []

        # Capital requirements
        required_investment = market_data.get("required_investment", 0)
        if required_investment > 1000000:
            barriers.append({
                "type": "capital",
                "severity": "high",
                "description": f"High capital requirement: ${required_investment:,.0f}"
            })

        # Regulatory barriers
        regulatory_complexity = market_data.get("regulatory_complexity", "low")
        if regulatory_complexity in ["high", "very_high"]:
            barriers.append({
                "type": "regulatory",
                "severity": regulatory_complexity,
                "description": "Complex regulatory environment"
            })

        # Brand loyalty
        brand_loyalty = market_data.get("brand_loyalty", "low")
        if brand_loyalty in ["high", "very_high"]:
            barriers.append({
                "type": "brand_loyalty",
                "severity": brand_loyalty,
                "description": "Strong existing brand loyalty"
            })

        # Technology barriers
        if market_data.get("technology_intensive", False):
            barriers.append({
                "type": "technology",
                "severity": "medium",
                "description": "Significant technology requirements"
            })

        # Network effects
        if market_data.get("network_effects", False):
            barriers.append({
                "type": "network_effects",
                "severity": "high",
                "description": "Strong network effects favor incumbents"
            })

        # Economies of scale
        if market_data.get("economies_of_scale_important", False):
            barriers.append({
                "type": "economies_of_scale",
                "severity": "medium",
                "description": "Incumbents have scale advantages"
            })

        return barriers

    def _segment_customers(self, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify and profile customer segments."""
        segments = market_data.get("customer_segments", [])

        enriched_segments = []
        for segment in segments:
            enriched_segments.append({
                "name": segment.get("name"),
                "size": segment.get("size", 0),
                "growth_rate": segment.get("growth_rate", 0),
                "pain_points": segment.get("pain_points", []),
                "buying_behavior": segment.get("buying_behavior", {}),
                "value_drivers": segment.get("value_drivers", []),
                "accessibility": self._assess_segment_accessibility(segment)
            })

        return enriched_segments

    def _assess_segment_accessibility(self, segment: Dict[str, Any]) -> str:
        """Assess how accessible a customer segment is."""
        score = 0

        # Distribution channels
        if segment.get("has_existing_channels", False):
            score += 30

        # Marketing reach
        if segment.get("marketing_reach", "low") == "high":
            score += 25

        # Decision-making complexity
        if segment.get("buying_complexity", "high") == "low":
            score += 25

        # Price sensitivity
        if segment.get("price_sensitivity", "high") == "low":
            score += 20

        if score >= 70:
            return "highly_accessible"
        elif score >= 50:
            return "accessible"
        elif score >= 30:
            return "moderately_accessible"
        else:
            return "difficult"

    def _assess_regulatory_environment(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess regulatory environment and compliance requirements."""
        return {
            "complexity": market_data.get("regulatory_complexity", "medium"),
            "key_regulations": market_data.get("key_regulations", []),
            "licensing_required": market_data.get("licensing_required", False),
            "compliance_cost": market_data.get("compliance_cost", 0),
            "time_to_compliance": market_data.get("time_to_compliance_months", 0),
            "regulatory_risk": self._assess_regulatory_risk(market_data)
        }

    def _assess_regulatory_risk(self, market_data: Dict[str, Any]) -> str:
        """Assess regulatory risk level."""
        complexity = market_data.get("regulatory_complexity", "medium")
        changing = market_data.get("regulatory_environment_changing", False)

        if complexity == "very_high" or (complexity == "high" and changing):
            return "high"
        elif complexity == "high" or (complexity == "medium" and changing):
            return "medium"
        else:
            return "low"

    def _calculate_market_attractiveness(
        self,
        tam: float,
        sam: float,
        som: float,
        cagr: float,
        competitive_landscape: Dict[str, Any],
        entry_barriers: List[Dict[str, Any]],
        maturity: MarketMaturity
    ) -> int:
        """Calculate overall market attractiveness score (0-100)."""
        score = 0

        # Market size (30 points)
        if som > 10000000:  # $10M+
            score += 30
        elif som > 5000000:  # $5M+
            score += 25
        elif som > 1000000:  # $1M+
            score += 20
        elif som > 500000:  # $500K+
            score += 15
        else:
            score += 10

        # Growth rate (25 points)
        growth_score = min(int(cagr * 100), 25)
        score += growth_score

        # Market maturity (15 points)
        maturity_scores = {
            MarketMaturity.EMERGING: 15,
            MarketMaturity.GROWING: 12,
            MarketMaturity.MATURE: 8,
            MarketMaturity.DECLINING: 3
        }
        score += maturity_scores.get(maturity, 8)

        # Competitive intensity (20 points)
        intensity = competitive_landscape.get("competitive_intensity", "moderate")
        intensity_scores = {
            "low": 20,
            "moderate": 15,
            "high": 10,
            "very_high": 5
        }
        score += intensity_scores.get(intensity, 10)

        # Entry barriers (10 points) - fewer/lower barriers = higher score
        barrier_severity_score = sum(
            1 for b in entry_barriers
            if b.get("severity") in ["high", "very_high"]
        )
        barrier_points = max(0, 10 - (barrier_severity_score * 2))
        score += barrier_points

        return min(score, 100)

    def _determine_growth_phase(self, cagr: float, maturity: MarketMaturity) -> str:
        """Determine market growth phase."""
        if maturity == MarketMaturity.EMERGING:
            return "rapid_expansion"
        elif maturity == MarketMaturity.GROWING and cagr > 0.20:
            return "accelerating_growth"
        elif maturity == MarketMaturity.GROWING:
            return "steady_growth"
        elif maturity == MarketMaturity.MATURE and cagr > 0.05:
            return "mature_growth"
        elif maturity == MarketMaturity.MATURE:
            return "stable"
        else:
            return "declining"

    def _rate_attractiveness(self, score: int) -> str:
        """Rate market attractiveness."""
        if score >= self.high_attractiveness_threshold:
            return "highly_attractive"
        elif score >= self.medium_attractiveness_threshold:
            return "attractive"
        elif score >= 40:
            return "moderately_attractive"
        else:
            return "unattractive"

    def _generate_market_recommendation(
        self,
        attractiveness_score: int,
        entry_barriers: List[Dict[str, Any]],
        competitive_landscape: Dict[str, Any]
    ) -> str:
        """Generate market entry recommendation."""
        if attractiveness_score >= 80:
            if len(entry_barriers) <= 2:
                return "Highly recommended - pursue aggressively"
            else:
                return "Recommended with strategic planning for barrier mitigation"
        elif attractiveness_score >= 60:
            intensity = competitive_landscape.get("competitive_intensity", "moderate")
            if intensity in ["low", "moderate"]:
                return "Recommended - develop detailed entry strategy"
            else:
                return "Consider with differentiation strategy"
        elif attractiveness_score >= 40:
            return "Monitor - wait for better timing or changed conditions"
        else:
            return "Not recommended - focus on more attractive opportunities"

    def develop_expansion_roadmap(
        self,
        target_market: str,
        strategy: str,
        timeline_months: int,
        investment_budget: float
    ) -> Dict[str, Any]:
        """
        Develop comprehensive market expansion roadmap.

        Args:
            target_market: Target market identifier
            strategy: Expansion strategy to use
            timeline_months: Timeline for expansion
            investment_budget: Available investment budget

        Returns:
            Detailed expansion roadmap
        """
        try:
            logger.info(f"Developing expansion roadmap for {target_market}")

            if not target_market:
                raise ValueError("target_market is required")
            if not strategy:
                raise ValueError("strategy is required")
            if timeline_months <= 0:
                raise ValueError("timeline_months must be positive")

            # Validate strategy
            try:
                strategy_enum = ExpansionStrategy(strategy.lower())
            except ValueError:
                raise ValueError(f"Invalid expansion strategy: {strategy}")

            # Generate roadmap phases
            phases = self._generate_roadmap_phases(
                strategy_enum, timeline_months, investment_budget
            )

            # Define milestones
            milestones = self._define_milestones(strategy_enum, timeline_months)

            # Project revenue
            revenue_projections = self._project_revenue(
                target_market, strategy_enum, timeline_months
            )

            # Calculate investment allocation
            investment_allocation = self._allocate_investment(
                investment_budget, phases
            )

            # Define success metrics
            success_metrics = self._define_success_metrics(strategy_enum)

            # Identify risks and mitigation
            risk_mitigation = self._identify_risks_and_mitigation(
                target_market, strategy_enum
            )

            result = {
                "success": True,
                "target_market": target_market,
                "strategy": strategy,
                "timeline_months": timeline_months,
                "phases": phases,
                "milestones": milestones,
                "investment": {
                    "total_budget": investment_budget,
                    "allocation": investment_allocation
                },
                "revenue_projections": revenue_projections,
                "success_metrics": success_metrics,
                "risk_mitigation": risk_mitigation,
                "key_dependencies": self._identify_key_dependencies(strategy_enum),
                "go_to_market_approach": self._define_gtm_approach(strategy_enum),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Expansion roadmap developed for {target_market}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in develop_expansion_roadmap: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in develop_expansion_roadmap: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _generate_roadmap_phases(
        self,
        strategy: ExpansionStrategy,
        timeline_months: int,
        budget: float
    ) -> List[Dict[str, Any]]:
        """Generate roadmap phases."""
        if strategy == ExpansionStrategy.ORGANIC_GROWTH:
            return self._organic_growth_phases(timeline_months)
        elif strategy == ExpansionStrategy.PARTNERSHIP:
            return self._partnership_phases(timeline_months)
        elif strategy == ExpansionStrategy.ACQUISITION:
            return self._acquisition_phases(timeline_months)
        elif strategy == ExpansionStrategy.DIGITAL_FIRST:
            return self._digital_first_phases(timeline_months)
        else:
            return self._generic_phases(timeline_months)

    def _organic_growth_phases(self, timeline_months: int) -> List[Dict[str, Any]]:
        """Generate organic growth phases."""
        phase_duration = timeline_months // 4

        return [
            {
                "phase": 1,
                "name": "Market Research & Planning",
                "duration_months": phase_duration,
                "activities": [
                    "Conduct market research",
                    "Identify target customers",
                    "Develop value proposition",
                    "Create go-to-market plan"
                ],
                "deliverables": ["Market analysis report", "GTM strategy", "Budget plan"]
            },
            {
                "phase": 2,
                "name": "Infrastructure Setup",
                "duration_months": phase_duration,
                "activities": [
                    "Establish local presence",
                    "Hire initial team",
                    "Set up operations",
                    "Build partnerships"
                ],
                "deliverables": ["Local office", "Core team", "Operational processes"]
            },
            {
                "phase": 3,
                "name": "Market Entry & Pilot",
                "duration_months": phase_duration,
                "activities": [
                    "Launch pilot program",
                    "Acquire initial customers",
                    "Test and refine offering",
                    "Build case studies"
                ],
                "deliverables": ["Pilot results", "Customer testimonials", "Refined offering"]
            },
            {
                "phase": 4,
                "name": "Scale & Optimize",
                "duration_months": phase_duration,
                "activities": [
                    "Scale marketing efforts",
                    "Expand team",
                    "Optimize operations",
                    "Build brand presence"
                ],
                "deliverables": ["Scaled operations", "Market share growth", "Profitability"]
            }
        ]

    def _partnership_phases(self, timeline_months: int) -> List[Dict[str, Any]]:
        """Generate partnership-based expansion phases."""
        phase_duration = timeline_months // 3

        return [
            {
                "phase": 1,
                "name": "Partner Identification & Selection",
                "duration_months": phase_duration,
                "activities": [
                    "Identify potential partners",
                    "Evaluate partner fit",
                    "Initiate discussions",
                    "Negotiate terms"
                ],
                "deliverables": ["Partner shortlist", "Partnership agreement"]
            },
            {
                "phase": 2,
                "name": "Partnership Activation",
                "duration_months": phase_duration,
                "activities": [
                    "Enable partner",
                    "Co-develop offerings",
                    "Launch joint GTM",
                    "Support partner sales"
                ],
                "deliverables": ["Enabled partner", "Joint offerings", "Initial deals"]
            },
            {
                "phase": 3,
                "name": "Partnership Growth",
                "duration_months": phase_duration,
                "activities": [
                    "Scale partner activities",
                    "Add more partners",
                    "Optimize collaboration",
                    "Measure and improve"
                ],
                "deliverables": ["Partner network", "Revenue growth", "Market presence"]
            }
        ]

    def _acquisition_phases(self, timeline_months: int) -> List[Dict[str, Any]]:
        """Generate acquisition-based expansion phases."""
        return [
            {
                "phase": 1,
                "name": "Target Identification & Due Diligence",
                "duration_months": 3,
                "activities": [
                    "Identify acquisition targets",
                    "Conduct due diligence",
                    "Valuation analysis",
                    "Negotiate deal terms"
                ],
                "deliverables": ["Target analysis", "Due diligence report", "LOI"]
            },
            {
                "phase": 2,
                "name": "Transaction & Integration Planning",
                "duration_months": 2,
                "activities": [
                    "Finalize acquisition",
                    "Develop integration plan",
                    "Communicate to stakeholders",
                    "Prepare for Day 1"
                ],
                "deliverables": ["Closed deal", "Integration plan", "Communication plan"]
            },
            {
                "phase": 3,
                "name": "Integration & Optimization",
                "duration_months": max(6, timeline_months - 5),
                "activities": [
                    "Integrate operations",
                    "Align cultures",
                    "Realize synergies",
                    "Optimize performance"
                ],
                "deliverables": ["Integrated operations", "Synergies realized", "Growth trajectory"]
            }
        ]

    def _digital_first_phases(self, timeline_months: int) -> List[Dict[str, Any]]:
        """Generate digital-first expansion phases."""
        phase_duration = timeline_months // 3

        return [
            {
                "phase": 1,
                "name": "Digital Infrastructure",
                "duration_months": phase_duration,
                "activities": [
                    "Localize digital presence",
                    "Set up payment systems",
                    "Ensure compliance",
                    "Build local SEO"
                ],
                "deliverables": ["Localized website", "Payment integration", "SEO foundation"]
            },
            {
                "phase": 2,
                "name": "Digital Marketing Launch",
                "duration_months": phase_duration,
                "activities": [
                    "Launch paid campaigns",
                    "Content marketing",
                    "Social media presence",
                    "Influencer partnerships"
                ],
                "deliverables": ["Active campaigns", "Content library", "Social presence"]
            },
            {
                "phase": 3,
                "name": "Scale & Optimize",
                "duration_months": phase_duration,
                "activities": [
                    "Scale successful channels",
                    "Optimize conversion",
                    "Expand offerings",
                    "Build community"
                ],
                "deliverables": ["Optimized funnel", "Market traction", "Customer base"]
            }
        ]

    def _generic_phases(self, timeline_months: int) -> List[Dict[str, Any]]:
        """Generate generic expansion phases."""
        phase_duration = timeline_months // 3

        return [
            {
                "phase": 1,
                "name": "Preparation",
                "duration_months": phase_duration,
                "activities": ["Research", "Planning", "Resource allocation"],
                "deliverables": ["Entry strategy", "Resource plan"]
            },
            {
                "phase": 2,
                "name": "Execution",
                "duration_months": phase_duration,
                "activities": ["Market entry", "Initial operations", "Customer acquisition"],
                "deliverables": ["Market presence", "Initial customers"]
            },
            {
                "phase": 3,
                "name": "Growth",
                "duration_months": phase_duration,
                "activities": ["Scale operations", "Expand reach", "Optimize performance"],
                "deliverables": ["Market share", "Profitability"]
            }
        ]

    def _define_milestones(
        self, strategy: ExpansionStrategy, timeline_months: int
    ) -> List[Dict[str, Any]]:
        """Define key milestones."""
        milestones = []

        # Month 1: Kickoff
        milestones.append({
            "milestone": "Expansion Kickoff",
            "month": 1,
            "description": "Official start of market expansion initiative",
            "success_criteria": ["Team assembled", "Budget approved", "Plan finalized"]
        })

        # Quarter 1: Foundation
        milestones.append({
            "milestone": "Foundation Complete",
            "month": 3,
            "description": "Basic infrastructure and planning complete",
            "success_criteria": ["Research complete", "Strategy approved", "Resources secured"]
        })

        # Mid-point: Market Entry
        mid_point = timeline_months // 2
        milestones.append({
            "milestone": "Market Entry",
            "month": mid_point,
            "description": "Official entry into target market",
            "success_criteria": ["First customers acquired", "Operations running", "Team in place"]
        })

        # 75% point: Traction
        traction_point = int(timeline_months * 0.75)
        milestones.append({
            "milestone": "Market Traction",
            "month": traction_point,
            "description": "Demonstrated market traction and growth",
            "success_criteria": ["Revenue targets met", "Customer base growing", "Positive feedback"]
        })

        # Final: Success
        milestones.append({
            "milestone": "Expansion Success",
            "month": timeline_months,
            "description": "Successful market establishment",
            "success_criteria": ["Revenue goals achieved", "Market presence established", "Profitable operations"]
        })

        return milestones

    def _project_revenue(
        self, target_market: str, strategy: ExpansionStrategy, timeline_months: int
    ) -> Dict[str, float]:
        """Project revenue over expansion timeline."""
        # Get market data if available
        market_data = self.market_analyses.get(target_market)

        # Base revenue assumptions
        year1_target = 100000  # Conservative first year
        growth_rate = 1.5  # 50% year-over-year growth

        projections = {}

        for year in range(1, min(6, (timeline_months // 12) + 2)):
            if year == 1:
                # Ramp-up in first year
                quarterly_rev = year1_target / 4
                projections[f"Year_{year}_Q1"] = quarterly_rev * 0.25
                projections[f"Year_{year}_Q2"] = quarterly_rev * 0.50
                projections[f"Year_{year}_Q3"] = quarterly_rev * 0.75
                projections[f"Year_{year}_Q4"] = quarterly_rev * 1.0
                projections[f"Year_{year}_Total"] = year1_target
            else:
                annual_target = year1_target * (growth_rate ** (year - 1))
                projections[f"Year_{year}_Total"] = round(annual_target, 2)

        return projections

    def _allocate_investment(
        self, total_budget: float, phases: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Allocate investment across budget categories."""
        return {
            "market_research": round(total_budget * 0.10, 2),
            "infrastructure": round(total_budget * 0.25, 2),
            "marketing": round(total_budget * 0.30, 2),
            "sales": round(total_budget * 0.15, 2),
            "operations": round(total_budget * 0.10, 2),
            "contingency": round(total_budget * 0.10, 2)
        }

    def _define_success_metrics(self, strategy: ExpansionStrategy) -> Dict[str, Any]:
        """Define success metrics for expansion."""
        return {
            "revenue_metrics": {
                "year_1_revenue_target": 100000,
                "year_2_revenue_target": 250000,
                "customer_acquisition_cost_max": 500,
                "customer_lifetime_value_min": 2000
            },
            "market_metrics": {
                "market_share_year_1": 0.01,
                "market_share_year_2": 0.03,
                "brand_awareness_target": 0.15
            },
            "operational_metrics": {
                "time_to_first_customer_days": 90,
                "customer_satisfaction_min": 4.0,
                "net_promoter_score_min": 30
            }
        }

    def _identify_risks_and_mitigation(
        self, target_market: str, strategy: ExpansionStrategy
    ) -> List[Dict[str, Any]]:
        """Identify risks and mitigation strategies."""
        return [
            {
                "risk": "Market timing risk",
                "impact": "high",
                "probability": "medium",
                "mitigation": "Conduct thorough market validation; maintain flexibility to adjust timing"
            },
            {
                "risk": "Competitive response",
                "impact": "medium",
                "probability": "high",
                "mitigation": "Develop strong differentiation; build customer loyalty quickly"
            },
            {
                "risk": "Cultural misalignment",
                "impact": "medium",
                "probability": "medium",
                "mitigation": "Hire local talent; invest in cultural training; adapt offerings"
            },
            {
                "risk": "Regulatory challenges",
                "impact": "high",
                "probability": "low",
                "mitigation": "Engage legal experts early; build compliance into process"
            },
            {
                "risk": "Resource constraints",
                "impact": "medium",
                "probability": "medium",
                "mitigation": "Secure adequate funding; build phased approach; prioritize ruthlessly"
            }
        ]

    def _identify_key_dependencies(self, strategy: ExpansionStrategy) -> List[str]:
        """Identify key dependencies for success."""
        common_dependencies = [
            "Adequate funding secured",
            "Leadership commitment and support",
            "Access to target market data"
        ]

        strategy_specific = {
            ExpansionStrategy.PARTNERSHIP: [
                "Strong partner identified and committed",
                "Aligned incentives and goals"
            ],
            ExpansionStrategy.ACQUISITION: [
                "Suitable acquisition target available",
                "Integration capabilities in place"
            ],
            ExpansionStrategy.DIGITAL_FIRST: [
                "Digital infrastructure ready",
                "Digital marketing expertise"
            ],
            ExpansionStrategy.ORGANIC_GROWTH: [
                "Local talent available",
                "Distribution channels accessible"
            ]
        }

        return common_dependencies + strategy_specific.get(strategy, [])

    def _define_gtm_approach(self, strategy: ExpansionStrategy) -> Dict[str, Any]:
        """Define go-to-market approach."""
        return {
            "primary_channels": self._get_primary_channels(strategy),
            "customer_acquisition_strategy": self._get_acquisition_strategy(strategy),
            "pricing_approach": "market_based",
            "positioning": "value_leader",
            "key_messaging": [
                "Proven solution",
                "Local expertise",
                "Customer success focus"
            ]
        }

    def _get_primary_channels(self, strategy: ExpansionStrategy) -> List[str]:
        """Get primary go-to-market channels."""
        if strategy == ExpansionStrategy.DIGITAL_FIRST:
            return ["Digital marketing", "Social media", "Content marketing", "SEO/SEM"]
        elif strategy == ExpansionStrategy.PARTNERSHIP:
            return ["Partner channels", "Co-marketing", "Partner sales"]
        else:
            return ["Direct sales", "Digital marketing", "Events", "Referrals"]

    def _get_acquisition_strategy(self, strategy: ExpansionStrategy) -> str:
        """Get customer acquisition strategy."""
        if strategy == ExpansionStrategy.DIGITAL_FIRST:
            return "Inbound digital marketing with conversion optimization"
        elif strategy == ExpansionStrategy.PARTNERSHIP:
            return "Partner-driven customer acquisition"
        else:
            return "Hybrid approach combining outbound and inbound"

    def assess_expansion_risk(
        self, target_market: str, strategy: str
    ) -> Dict[str, Any]:
        """
        Assess comprehensive risk for market expansion.

        Args:
            target_market: Target market identifier
            strategy: Expansion strategy

        Returns:
            Comprehensive risk assessment
        """
        try:
            logger.info(f"Assessing expansion risk for {target_market}")

            if not target_market:
                raise ValueError("target_market is required")

            # Risk categories
            market_risk = self._assess_market_risk(target_market)
            financial_risk = self._assess_financial_risk(target_market, strategy)
            operational_risk = self._assess_operational_risk(strategy)
            competitive_risk = self._assess_competitive_risk(target_market)
            regulatory_risk = self._assess_regulatory_risk_detailed(target_market)

            # Calculate overall risk score
            risk_scores = {
                "market": market_risk["score"],
                "financial": financial_risk["score"],
                "operational": operational_risk["score"],
                "competitive": competitive_risk["score"],
                "regulatory": regulatory_risk["score"]
            }

            overall_risk_score = sum(risk_scores.values()) / len(risk_scores)

            # Determine risk level
            if overall_risk_score >= self.risk_thresholds["high"]:
                risk_level = RiskLevel.VERY_HIGH
            elif overall_risk_score >= self.risk_thresholds["medium"]:
                risk_level = RiskLevel.HIGH
            elif overall_risk_score >= self.risk_thresholds["low"]:
                risk_level = RiskLevel.MEDIUM
            else:
                risk_level = RiskLevel.LOW

            result = {
                "success": True,
                "target_market": target_market,
                "overall_risk_score": round(overall_risk_score, 1),
                "risk_level": risk_level.value,
                "risk_breakdown": {
                    "market_risk": market_risk,
                    "financial_risk": financial_risk,
                    "operational_risk": operational_risk,
                    "competitive_risk": competitive_risk,
                    "regulatory_risk": regulatory_risk
                },
                "critical_risks": self._identify_critical_risks(risk_scores),
                "mitigation_priorities": self._prioritize_mitigation(risk_scores),
                "go_no_go_recommendation": self._make_risk_recommendation(
                    risk_level, risk_scores
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Risk assessment completed for {target_market}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in assess_expansion_risk: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in assess_expansion_risk: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _assess_market_risk(self, target_market: str) -> Dict[str, Any]:
        """Assess market-specific risks."""
        # Placeholder - would pull from market data
        return {
            "score": 45,
            "level": "medium",
            "factors": [
                "Market volatility",
                "Demand uncertainty",
                "Economic conditions"
            ]
        }

    def _assess_financial_risk(self, target_market: str, strategy: str) -> Dict[str, Any]:
        """Assess financial risks."""
        return {
            "score": 50,
            "level": "medium",
            "factors": [
                "Investment size",
                "ROI uncertainty",
                "Cash flow timing"
            ]
        }

    def _assess_operational_risk(self, strategy: str) -> Dict[str, Any]:
        """Assess operational risks."""
        return {
            "score": 40,
            "level": "medium",
            "factors": [
                "Execution complexity",
                "Resource availability",
                "Timeline feasibility"
            ]
        }

    def _assess_competitive_risk(self, target_market: str) -> Dict[str, Any]:
        """Assess competitive risks."""
        return {
            "score": 55,
            "level": "medium",
            "factors": [
                "Incumbent advantages",
                "Competitive response",
                "Market share capture difficulty"
            ]
        }

    def _assess_regulatory_risk_detailed(self, target_market: str) -> Dict[str, Any]:
        """Assess regulatory risks in detail."""
        return {
            "score": 35,
            "level": "low",
            "factors": [
                "Regulatory compliance requirements",
                "Policy changes",
                "Licensing complexity"
            ]
        }

    def _identify_critical_risks(self, risk_scores: Dict[str, int]) -> List[str]:
        """Identify critical risks requiring immediate attention."""
        critical = []
        for category, score in risk_scores.items():
            if score >= 70:
                critical.append(f"Critical: {category.replace('_', ' ').title()} risk is very high")
        return critical if critical else ["No critical risks identified"]

    def _prioritize_mitigation(self, risk_scores: Dict[str, int]) -> List[str]:
        """Prioritize risk mitigation efforts."""
        sorted_risks = sorted(risk_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            f"Priority {i+1}: Address {risk[0].replace('_', ' ')} risk (score: {risk[1]})"
            for i, risk in enumerate(sorted_risks[:3])
        ]

    def _make_risk_recommendation(
        self, risk_level: RiskLevel, risk_scores: Dict[str, int]
    ) -> str:
        """Make go/no-go recommendation based on risk."""
        if risk_level == RiskLevel.VERY_HIGH:
            return "NO-GO: Risk level too high - recommend postponing or reconsidering"
        elif risk_level == RiskLevel.HIGH:
            return "CONDITIONAL GO: Proceed only with comprehensive risk mitigation plan"
        elif risk_level == RiskLevel.MEDIUM:
            return "GO with CAUTION: Acceptable risk with proper management"
        else:
            return "GO: Risk level acceptable - proceed with standard risk management"
