"""
Growth Strategist Agent

Develops growth strategies, performs TAM/SAM/SOM analysis, and creates growth forecasts.
Implements growth lever identification, market sizing, and strategic growth planning.
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


class GrowthLever(Enum):
    """Types of growth levers."""
    MARKET_PENETRATION = "market_penetration"
    MARKET_DEVELOPMENT = "market_development"
    PRODUCT_DEVELOPMENT = "product_development"
    DIVERSIFICATION = "diversification"
    ACQUISITION = "acquisition"
    PARTNERSHIP = "partnership"
    PRICING_OPTIMIZATION = "pricing_optimization"
    CUSTOMER_RETENTION = "customer_retention"
    UPSELL_CROSS_SELL = "upsell_cross_sell"


class GrowthStage(Enum):
    """Company growth stages."""
    STARTUP = "startup"
    GROWTH = "growth"
    EXPANSION = "expansion"
    MATURITY = "maturity"
    RENEWAL = "renewal"


class GrowthModel(Enum):
    """Growth modeling approaches."""
    LINEAR = "linear"
    EXPONENTIAL = "exponential"
    LOGARITHMIC = "logarithmic"
    S_CURVE = "s_curve"
    HYBRID = "hybrid"


@dataclass
class MarketSizing:
    """TAM/SAM/SOM market sizing."""
    tam: float  # Total Addressable Market
    sam: float  # Serviceable Addressable Market
    som: float  # Serviceable Obtainable Market
    methodology: str
    assumptions: List[str]
    confidence_level: str
    year: int


@dataclass
class GrowthForecast:
    """Growth forecast data."""
    forecast_id: str
    time_horizon_years: int
    revenue_projections: Dict[str, float]
    customer_projections: Dict[str, int]
    growth_rates: Dict[str, float]
    assumptions: List[str]
    confidence_intervals: Dict[str, Dict[str, float]]
    model_type: GrowthModel


@dataclass
class GrowthStrategy:
    """Complete growth strategy."""
    strategy_id: str
    strategy_name: str
    target_growth_rate: float
    time_horizon: int
    primary_levers: List[GrowthLever]
    market_sizing: MarketSizing
    forecast: GrowthForecast
    investment_required: float
    expected_roi: float
    risk_factors: List[Dict[str, Any]]
    success_metrics: Dict[str, Any]


class GrowthStrategistAgent:
    """
    Production-grade Growth Strategist Agent.

    Develops comprehensive growth strategies with sophisticated market
    sizing (TAM/SAM/SOM), growth modeling, lever identification, and
    scenario planning capabilities.

    Features:
    - TAM/SAM/SOM market sizing analysis
    - Growth lever identification and prioritization
    - Multi-year growth forecasting
    - Scenario planning and modeling
    - Growth stage assessment
    - Unit economics optimization
    - Customer acquisition strategy
    - Retention and expansion strategy
    - Market penetration analysis
    - Competitive growth benchmarking
    - Investment planning
    - Risk-adjusted growth projections
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Growth Strategist Agent.

        Args:
            config: Configuration dictionary with growth parameters
        """
        self.config = config or {}
        self.name = "Growth Strategist"
        self.role = "Strategic Growth Planning and Analysis"
        self.goal = "Develop and execute high-impact growth strategies"

        # Growth targets
        self.target_growth_rate = self.config.get("target_growth_rate", 0.30)  # 30%
        self.aggressive_growth_threshold = self.config.get("aggressive_threshold", 0.50)  # 50%

        # Market sizing parameters
        self.sam_ratio = self.config.get("sam_ratio", 0.30)  # SAM = 30% of TAM
        self.som_ratio = self.config.get("som_ratio", 0.10)  # SOM = 10% of SAM

        # Storage
        self.strategies: Dict[str, GrowthStrategy] = {}
        self.forecasts: Dict[str, GrowthForecast] = {}

        # Growth lever frameworks
        self.lever_frameworks = self._initialize_lever_frameworks()

        # Unit economics templates
        self.unit_economics = self._initialize_unit_economics()

        logger.info("Growth Strategist initialized successfully")

    def _initialize_lever_frameworks(self) -> Dict[str, Dict[str, Any]]:
        """Initialize growth lever frameworks."""
        return {
            "market_penetration": {
                "focus": "Increase share in existing markets",
                "tactics": [
                    "Competitive pricing",
                    "Increased marketing spend",
                    "Sales force expansion",
                    "Customer acquisition campaigns"
                ],
                "investment_level": "medium",
                "time_to_impact": "short",
                "risk_level": "low"
            },
            "market_development": {
                "focus": "Enter new geographic or segment markets",
                "tactics": [
                    "Geographic expansion",
                    "New segment targeting",
                    "Channel development",
                    "Localization"
                ],
                "investment_level": "high",
                "time_to_impact": "medium",
                "risk_level": "medium"
            },
            "product_development": {
                "focus": "Develop new products for existing markets",
                "tactics": [
                    "Product innovation",
                    "Feature enhancement",
                    "Product line extension",
                    "Platform development"
                ],
                "investment_level": "high",
                "time_to_impact": "long",
                "risk_level": "medium"
            },
            "customer_retention": {
                "focus": "Reduce churn and increase lifetime value",
                "tactics": [
                    "Customer success programs",
                    "Quality improvements",
                    "Loyalty programs",
                    "Engagement initiatives"
                ],
                "investment_level": "medium",
                "time_to_impact": "short",
                "risk_level": "low"
            },
            "upsell_cross_sell": {
                "focus": "Expand revenue from existing customers",
                "tactics": [
                    "Tiered pricing",
                    "Add-on products",
                    "Usage-based pricing",
                    "Account expansion programs"
                ],
                "investment_level": "low",
                "time_to_impact": "short",
                "risk_level": "low"
            }
        }

    def _initialize_unit_economics(self) -> Dict[str, float]:
        """Initialize unit economics templates."""
        return {
            "cac": 500,  # Customer Acquisition Cost
            "ltv": 2000,  # Lifetime Value
            "gross_margin": 0.70,
            "churn_rate": 0.05,  # 5% monthly
            "avg_deal_size": 10000,
            "sales_cycle_days": 60
        }

    def develop_growth_strategy(
        self, strategy_parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Develop comprehensive growth strategy.

        Args:
            strategy_parameters: Strategy development parameters

        Returns:
            Complete growth strategy with forecasts and recommendations
        """
        try:
            logger.info("Developing growth strategy")

            if not strategy_parameters:
                raise ValueError("strategy_parameters cannot be empty")

            # Assess current growth stage
            growth_stage = self._assess_growth_stage(strategy_parameters)

            # Perform TAM/SAM/SOM analysis
            market_sizing = self._perform_market_sizing(strategy_parameters)

            # Identify and prioritize growth levers
            growth_levers = self._identify_growth_levers(
                growth_stage, strategy_parameters
            )

            # Develop growth forecast
            forecast = self._develop_growth_forecast(
                market_sizing, growth_levers, strategy_parameters
            )

            # Optimize unit economics
            unit_economics = self._optimize_unit_economics(strategy_parameters)

            # Develop customer acquisition strategy
            acquisition_strategy = self._develop_acquisition_strategy(
                unit_economics, growth_levers
            )

            # Develop retention strategy
            retention_strategy = self._develop_retention_strategy(
                unit_economics, strategy_parameters
            )

            # Calculate investment requirements
            investment = self._calculate_investment_requirements(
                growth_levers, forecast, acquisition_strategy
            )

            # Assess risks
            risk_assessment = self._assess_growth_risks(
                growth_levers, market_sizing, forecast
            )

            # Define success metrics
            success_metrics = self._define_growth_metrics(forecast, growth_levers)

            # Generate scenarios
            scenarios = self._generate_growth_scenarios(
                market_sizing, growth_levers, strategy_parameters
            )

            result = {
                "success": True,
                "strategy_overview": {
                    "current_stage": growth_stage.value,
                    "target_growth_rate": self.target_growth_rate,
                    "time_horizon_years": strategy_parameters.get("time_horizon", 3)
                },
                "market_sizing": {
                    "tam": market_sizing.tam,
                    "sam": market_sizing.sam,
                    "som": market_sizing.som,
                    "methodology": market_sizing.methodology,
                    "confidence": market_sizing.confidence_level
                },
                "growth_levers": growth_levers,
                "forecast": self._serialize_forecast(forecast),
                "unit_economics": unit_economics,
                "acquisition_strategy": acquisition_strategy,
                "retention_strategy": retention_strategy,
                "investment_requirements": investment,
                "risk_assessment": risk_assessment,
                "success_metrics": success_metrics,
                "scenarios": scenarios,
                "recommendations": self._generate_strategy_recommendations(
                    growth_stage, growth_levers, risk_assessment
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("Growth strategy development completed")
            return result

        except ValueError as e:
            logger.error(f"Validation error in develop_growth_strategy: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in develop_growth_strategy: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _assess_growth_stage(self, parameters: Dict[str, Any]) -> GrowthStage:
        """Assess current growth stage of the company."""
        current_revenue = parameters.get("current_annual_revenue", 0)
        revenue_growth_rate = parameters.get("revenue_growth_rate", 0)
        years_in_business = parameters.get("years_in_business", 0)
        market_share = parameters.get("market_share", 0)

        # Stage determination logic
        if years_in_business < 2 or current_revenue < 1000000:
            return GrowthStage.STARTUP
        elif revenue_growth_rate > 0.50 and current_revenue < 10000000:
            return GrowthStage.GROWTH
        elif revenue_growth_rate > 0.20 or current_revenue < 50000000:
            return GrowthStage.EXPANSION
        elif market_share > 0.10 and revenue_growth_rate < 0.15:
            return GrowthStage.MATURITY
        else:
            return GrowthStage.RENEWAL

    def _perform_market_sizing(self, parameters: Dict[str, Any]) -> MarketSizing:
        """Perform TAM/SAM/SOM market sizing analysis."""
        # TAM calculation
        tam = self._calculate_tam(parameters)

        # SAM calculation (serviceable addressable market)
        sam = self._calculate_sam(tam, parameters)

        # SOM calculation (serviceable obtainable market)
        som = self._calculate_som(sam, parameters)

        # Methodology and assumptions
        methodology = self._determine_sizing_methodology(parameters)
        assumptions = self._document_sizing_assumptions(parameters)

        # Confidence assessment
        confidence = self._assess_sizing_confidence(parameters)

        return MarketSizing(
            tam=tam,
            sam=sam,
            som=som,
            methodology=methodology,
            assumptions=assumptions,
            confidence_level=confidence,
            year=datetime.utcnow().year
        )

    def _calculate_tam(self, parameters: Dict[str, Any]) -> float:
        """Calculate Total Addressable Market."""
        # Method 1: Top-down (if provided)
        if "tam" in parameters:
            return float(parameters["tam"])

        # Method 2: Bottom-up calculation
        total_potential_customers = parameters.get("total_potential_customers", 0)
        average_revenue_per_customer = parameters.get("average_revenue_per_customer", 0)

        if total_potential_customers and average_revenue_per_customer:
            return total_potential_customers * average_revenue_per_customer

        # Method 3: Value theory
        market_value_per_unit = parameters.get("market_value_per_unit", 0)
        total_units = parameters.get("total_addressable_units", 0)

        if market_value_per_unit and total_units:
            return market_value_per_unit * total_units

        # Default estimate
        return parameters.get("estimated_tam", 1000000000)

    def _calculate_sam(self, tam: float, parameters: Dict[str, Any]) -> float:
        """Calculate Serviceable Addressable Market."""
        # If explicitly provided
        if "sam" in parameters:
            return float(parameters["sam"])

        # Calculate based on targeting
        geographic_coverage = parameters.get("geographic_coverage_percentage", 1.0)
        segment_focus = parameters.get("segment_targeting_percentage", self.sam_ratio)

        sam = tam * geographic_coverage * segment_focus

        return sam

    def _calculate_som(self, sam: float, parameters: Dict[str, Any]) -> float:
        """Calculate Serviceable Obtainable Market."""
        # If explicitly provided
        if "som" in parameters:
            return float(parameters["som"])

        # Calculate based on realistic market share
        target_market_share = parameters.get("target_market_share", self.som_ratio)
        go_to_market_effectiveness = parameters.get("gtm_effectiveness", 1.0)

        som = sam * target_market_share * go_to_market_effectiveness

        return som

    def _determine_sizing_methodology(self, parameters: Dict[str, Any]) -> str:
        """Determine market sizing methodology used."""
        if "tam" in parameters and "sam" in parameters:
            return "top_down_with_targeting"
        elif "total_potential_customers" in parameters:
            return "bottom_up_customer_based"
        else:
            return "value_theory_estimation"

    def _document_sizing_assumptions(self, parameters: Dict[str, Any]) -> List[str]:
        """Document key assumptions in market sizing."""
        assumptions = []

        if parameters.get("geographic_coverage_percentage"):
            assumptions.append(
                f"Geographic coverage: {parameters['geographic_coverage_percentage'] * 100}%"
            )

        if parameters.get("segment_targeting_percentage"):
            assumptions.append(
                f"Segment targeting: {parameters['segment_targeting_percentage'] * 100}%"
            )

        if parameters.get("target_market_share"):
            assumptions.append(
                f"Target market share: {parameters['target_market_share'] * 100}%"
            )

        assumptions.append("Market size based on current year data")
        assumptions.append("Assumes stable market conditions")

        return assumptions

    def _assess_sizing_confidence(self, parameters: Dict[str, Any]) -> str:
        """Assess confidence level in market sizing."""
        data_quality_score = 0

        # Check data availability
        if "tam" in parameters:
            data_quality_score += 30
        if "total_potential_customers" in parameters:
            data_quality_score += 25
        if "market_research_available" in parameters:
            data_quality_score += 25
        if "competitive_data_available" in parameters:
            data_quality_score += 20

        if data_quality_score >= 70:
            return "high"
        elif data_quality_score >= 40:
            return "medium"
        else:
            return "low"

    def _identify_growth_levers(
        self, growth_stage: GrowthStage, parameters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify and prioritize growth levers."""
        levers = []

        # Stage-appropriate levers
        if growth_stage == GrowthStage.STARTUP:
            primary_levers = [
                GrowthLever.MARKET_PENETRATION,
                GrowthLever.PRODUCT_DEVELOPMENT,
                GrowthLever.CUSTOMER_RETENTION
            ]
        elif growth_stage == GrowthStage.GROWTH:
            primary_levers = [
                GrowthLever.MARKET_PENETRATION,
                GrowthLever.MARKET_DEVELOPMENT,
                GrowthLever.UPSELL_CROSS_SELL
            ]
        elif growth_stage == GrowthStage.EXPANSION:
            primary_levers = [
                GrowthLever.MARKET_DEVELOPMENT,
                GrowthLever.PRODUCT_DEVELOPMENT,
                GrowthLever.ACQUISITION
            ]
        else:
            primary_levers = [
                GrowthLever.DIVERSIFICATION,
                GrowthLever.CUSTOMER_RETENTION,
                GrowthLever.PRICING_OPTIMIZATION
            ]

        # Build lever details
        for lever in primary_levers:
            lever_key = lever.value
            framework = self.lever_frameworks.get(lever_key, {})

            impact_score = self._calculate_lever_impact(lever, parameters)
            feasibility_score = self._calculate_lever_feasibility(lever, parameters)
            priority_score = (impact_score + feasibility_score) / 2

            levers.append({
                "lever": lever.value,
                "description": framework.get("focus", ""),
                "tactics": framework.get("tactics", []),
                "impact_score": impact_score,
                "feasibility_score": feasibility_score,
                "priority_score": priority_score,
                "investment_level": framework.get("investment_level", "medium"),
                "time_to_impact": framework.get("time_to_impact", "medium"),
                "risk_level": framework.get("risk_level", "medium")
            })

        # Sort by priority
        levers.sort(key=lambda x: x["priority_score"], reverse=True)

        return levers

    def _calculate_lever_impact(
        self, lever: GrowthLever, parameters: Dict[str, Any]
    ) -> int:
        """Calculate potential impact score for a growth lever."""
        # Base impact scores by lever type
        base_impacts = {
            GrowthLever.MARKET_PENETRATION: 70,
            GrowthLever.MARKET_DEVELOPMENT: 80,
            GrowthLever.PRODUCT_DEVELOPMENT: 75,
            GrowthLever.CUSTOMER_RETENTION: 65,
            GrowthLever.UPSELL_CROSS_SELL: 60,
            GrowthLever.PRICING_OPTIMIZATION: 50,
            GrowthLever.ACQUISITION: 85,
            GrowthLever.PARTNERSHIP: 70,
            GrowthLever.DIVERSIFICATION: 70
        }

        base_score = base_impacts.get(lever, 60)

        # Adjust for context
        current_growth = parameters.get("revenue_growth_rate", 0)
        if current_growth < 0.10:  # Low growth = higher impact from levers
            base_score += 10

        return min(base_score, 100)

    def _calculate_lever_feasibility(
        self, lever: GrowthLever, parameters: Dict[str, Any]
    ) -> int:
        """Calculate feasibility score for a growth lever."""
        score = 50  # Base feasibility

        # Resource availability
        resources = parameters.get("resource_availability", "medium")
        if resources == "high":
            score += 20
        elif resources == "low":
            score -= 20

        # Market conditions
        market_conditions = parameters.get("market_conditions", "favorable")
        if market_conditions == "favorable":
            score += 15
        elif market_conditions == "challenging":
            score -= 15

        # Specific lever considerations
        if lever == GrowthLever.ACQUISITION:
            if parameters.get("acquisition_capital_available", False):
                score += 15
            else:
                score -= 25

        return max(0, min(score, 100))

    def _develop_growth_forecast(
        self,
        market_sizing: MarketSizing,
        growth_levers: List[Dict[str, Any]],
        parameters: Dict[str, Any]
    ) -> GrowthForecast:
        """Develop multi-year growth forecast."""
        current_revenue = parameters.get("current_annual_revenue", 1000000)
        time_horizon = parameters.get("time_horizon", 3)

        # Determine growth model
        growth_model = self._select_growth_model(parameters)

        # Project revenue
        revenue_projections = {}
        customer_projections = {}
        growth_rates = {}

        for year in range(1, time_horizon + 1):
            # Calculate year-over-year growth
            if growth_model == GrowthModel.LINEAR:
                growth_rate = self.target_growth_rate
            elif growth_model == GrowthModel.EXPONENTIAL:
                growth_rate = self.target_growth_rate * (1.1 ** (year - 1))
            elif growth_model == GrowthModel.S_CURVE:
                growth_rate = self._s_curve_growth(year, time_horizon)
            else:
                growth_rate = self.target_growth_rate

            # Apply lever impact
            lever_boost = self._calculate_lever_boost(growth_levers, year)
            adjusted_growth = growth_rate * (1 + lever_boost)

            # Project revenue
            if year == 1:
                projected_revenue = current_revenue * (1 + adjusted_growth)
            else:
                prev_revenue = revenue_projections[f"year_{year - 1}"]
                projected_revenue = prev_revenue * (1 + adjusted_growth)

            # Project customers
            avg_revenue_per_customer = parameters.get("average_revenue_per_customer", 10000)
            projected_customers = int(projected_revenue / avg_revenue_per_customer)

            revenue_projections[f"year_{year}"] = round(projected_revenue, 2)
            customer_projections[f"year_{year}"] = projected_customers
            growth_rates[f"year_{year}"] = round(adjusted_growth, 3)

        # Calculate confidence intervals
        confidence_intervals = self._calculate_confidence_intervals(
            revenue_projections, parameters
        )

        return GrowthForecast(
            forecast_id=f"forecast_{datetime.utcnow().strftime('%Y%m%d')}",
            time_horizon_years=time_horizon,
            revenue_projections=revenue_projections,
            customer_projections=customer_projections,
            growth_rates=growth_rates,
            assumptions=self._document_forecast_assumptions(growth_model, growth_levers),
            confidence_intervals=confidence_intervals,
            model_type=growth_model
        )

    def _select_growth_model(self, parameters: Dict[str, Any]) -> GrowthModel:
        """Select appropriate growth model."""
        growth_stage_str = parameters.get("growth_stage", "growth")

        if growth_stage_str == "startup":
            return GrowthModel.EXPONENTIAL
        elif growth_stage_str in ["growth", "expansion"]:
            return GrowthModel.S_CURVE
        else:
            return GrowthModel.LINEAR

    def _s_curve_growth(self, year: int, total_years: int) -> float:
        """Calculate S-curve growth rate."""
        # S-curve: slow start, rapid middle, slow end
        x = year / total_years
        # Sigmoid function
        growth = 1 / (1 + math.exp(-10 * (x - 0.5)))
        # Scale to target growth rate
        return self.target_growth_rate * growth

    def _calculate_lever_boost(self, growth_levers: List[Dict[str, Any]], year: int) -> float:
        """Calculate boost from growth levers."""
        boost = 0

        for lever in growth_levers[:3]:  # Top 3 levers
            time_to_impact = lever.get("time_to_impact", "medium")

            # Apply impact based on year and time to impact
            if time_to_impact == "short" and year >= 1:
                boost += 0.05
            elif time_to_impact == "medium" and year >= 2:
                boost += 0.08
            elif time_to_impact == "long" and year >= 3:
                boost += 0.10

        return min(boost, 0.25)  # Cap boost at 25%

    def _calculate_confidence_intervals(
        self, revenue_projections: Dict[str, float], parameters: Dict[str, Any]
    ) -> Dict[str, Dict[str, float]]:
        """Calculate confidence intervals for projections."""
        intervals = {}

        # Standard deviation increases with time horizon
        for year_key, revenue in revenue_projections.items():
            year_num = int(year_key.split("_")[1])

            # Uncertainty increases with time
            std_dev_percent = 0.10 * year_num  # 10% std dev per year

            intervals[year_key] = {
                "low": round(revenue * (1 - std_dev_percent), 2),
                "mid": round(revenue, 2),
                "high": round(revenue * (1 + std_dev_percent), 2)
            }

        return intervals

    def _document_forecast_assumptions(
        self, model: GrowthModel, levers: List[Dict[str, Any]]
    ) -> List[str]:
        """Document forecast assumptions."""
        assumptions = [
            f"Growth model: {model.value}",
            f"Target growth rate: {self.target_growth_rate * 100}%",
            f"Primary growth levers: {', '.join(l['lever'] for l in levers[:3])}"
        ]

        assumptions.append("Assumes stable market conditions")
        assumptions.append("Assumes successful execution of growth initiatives")
        assumptions.append("Does not account for major market disruptions")

        return assumptions

    def _optimize_unit_economics(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize unit economics for growth."""
        current_cac = parameters.get("cac", self.unit_economics["cac"])
        current_ltv = parameters.get("ltv", self.unit_economics["ltv"])
        current_margin = parameters.get("gross_margin", self.unit_economics["gross_margin"])

        # Calculate current ratios
        ltv_cac_ratio = current_ltv / current_cac if current_cac > 0 else 0

        # Optimization recommendations
        optimizations = []

        if ltv_cac_ratio < 3:
            optimizations.append("Improve LTV/CAC ratio - target 3:1 or higher")
            optimizations.append("Consider reducing CAC through organic channels")

        if current_margin < 0.70:
            optimizations.append("Improve gross margins through pricing or cost optimization")

        # Target economics
        target_cac = current_cac * 0.80  # 20% reduction target
        target_ltv = current_ltv * 1.30  # 30% improvement target

        return {
            "current": {
                "cac": current_cac,
                "ltv": current_ltv,
                "ltv_cac_ratio": round(ltv_cac_ratio, 2),
                "gross_margin": current_margin
            },
            "target": {
                "cac": target_cac,
                "ltv": target_ltv,
                "ltv_cac_ratio": round(target_ltv / target_cac, 2),
                "gross_margin": 0.75
            },
            "optimizations": optimizations,
            "payback_period_months": int(current_cac / (current_ltv / 36)) if current_ltv > 0 else 0
        }

    def _develop_acquisition_strategy(
        self, unit_economics: Dict[str, Any], growth_levers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Develop customer acquisition strategy."""
        target_cac = unit_economics["target"]["cac"]

        return {
            "target_cac": target_cac,
            "channels": [
                {
                    "channel": "Content Marketing",
                    "estimated_cac": target_cac * 0.60,
                    "allocation": 0.30
                },
                {
                    "channel": "Paid Search",
                    "estimated_cac": target_cac * 1.20,
                    "allocation": 0.25
                },
                {
                    "channel": "Direct Sales",
                    "estimated_cac": target_cac * 1.50,
                    "allocation": 0.25
                },
                {
                    "channel": "Partnerships",
                    "estimated_cac": target_cac * 0.80,
                    "allocation": 0.20
                }
            ],
            "optimization_priorities": [
                "Increase organic/referral traffic",
                "Improve conversion rates",
                "Optimize paid channel performance"
            ]
        }

    def _develop_retention_strategy(
        self, unit_economics: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Develop customer retention strategy."""
        current_churn = parameters.get("monthly_churn_rate", 0.05)
        target_churn = current_churn * 0.70  # 30% reduction

        return {
            "current_monthly_churn": current_churn,
            "target_monthly_churn": target_churn,
            "initiatives": [
                {
                    "initiative": "Customer Success Program",
                    "expected_churn_reduction": 0.01,
                    "investment": 50000
                },
                {
                    "initiative": "Product Improvements",
                    "expected_churn_reduction": 0.01,
                    "investment": 100000
                },
                {
                    "initiative": "Engagement Campaigns",
                    "expected_churn_reduction": 0.005,
                    "investment": 25000
                }
            ],
            "retention_rate_target": 1 - target_churn,
            "ltv_impact": f"+{int((1 / target_churn - 1 / current_churn) / (1 / current_churn) * 100)}%"
        }

    def _calculate_investment_requirements(
        self,
        growth_levers: List[Dict[str, Any]],
        forecast: GrowthForecast,
        acquisition_strategy: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate investment requirements for growth."""
        # Sales & Marketing
        year_1_revenue = forecast.revenue_projections.get("year_1", 0)
        sales_marketing = year_1_revenue * 0.40  # 40% of revenue

        # Product Development
        product_dev = 500000  # Base estimate

        # Operations & Infrastructure
        operations = year_1_revenue * 0.15

        # Growth initiatives
        initiatives = sum(
            100000 if lever["investment_level"] == "high" else
            50000 if lever["investment_level"] == "medium" else
            25000
            for lever in growth_levers[:3]
        )

        total_investment = sales_marketing + product_dev + operations + initiatives

        return {
            "sales_and_marketing": round(sales_marketing, 2),
            "product_development": round(product_dev, 2),
            "operations": round(operations, 2),
            "growth_initiatives": round(initiatives, 2),
            "total_year_1": round(total_investment, 2),
            "as_percentage_of_revenue": round(total_investment / year_1_revenue, 2) if year_1_revenue > 0 else 0
        }

    def _assess_growth_risks(
        self,
        growth_levers: List[Dict[str, Any]],
        market_sizing: MarketSizing,
        forecast: GrowthForecast
    ) -> Dict[str, Any]:
        """Assess risks to growth plan."""
        risks = []

        # Market sizing risk
        if market_sizing.confidence_level == "low":
            risks.append({
                "category": "market_sizing",
                "risk": "Low confidence in market size estimates",
                "severity": "high",
                "mitigation": "Conduct additional market research"
            })

        # Execution risk
        high_risk_levers = [l for l in growth_levers if l.get("risk_level") == "high"]
        if len(high_risk_levers) > 0:
            risks.append({
                "category": "execution",
                "risk": f"{len(high_risk_levers)} high-risk growth levers",
                "severity": "medium",
                "mitigation": "Develop detailed execution plans with milestones"
            })

        # Competitive risk
        risks.append({
            "category": "competitive",
            "risk": "Competitive response to growth initiatives",
            "severity": "medium",
            "mitigation": "Maintain competitive differentiation"
        })

        # Financial risk
        risks.append({
            "category": "financial",
            "risk": "Requires sustained investment with delayed returns",
            "severity": "medium",
            "mitigation": "Secure adequate funding and manage burn rate"
        })

        overall_risk_score = sum(
            3 if r["severity"] == "high" else 2 if r["severity"] == "medium" else 1
            for r in risks
        )

        return {
            "identified_risks": risks,
            "overall_risk_score": overall_risk_score,
            "risk_level": "high" if overall_risk_score >= 8 else "medium" if overall_risk_score >= 5 else "low"
        }

    def _define_growth_metrics(
        self, forecast: GrowthForecast, growth_levers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Define growth success metrics."""
        return {
            "revenue_metrics": {
                "annual_revenue_growth": {"target": f"{self.target_growth_rate * 100}%", "frequency": "monthly"},
                "quarterly_revenue": {"target": "on_track_to_annual", "frequency": "quarterly"}
            },
            "customer_metrics": {
                "customer_acquisition": {
                    "target": forecast.customer_projections.get("year_1", 0) // 12,
                    "frequency": "monthly"
                },
                "customer_churn": {"target": "< 5%", "frequency": "monthly"},
                "net_retention": {"target": "> 100%", "frequency": "quarterly"}
            },
            "efficiency_metrics": {
                "ltv_cac_ratio": {"target": "> 3:1", "frequency": "quarterly"},
                "magic_number": {"target": "> 0.75", "frequency": "quarterly"},
                "payback_period": {"target": "< 12 months", "frequency": "quarterly"}
            },
            "leading_indicators": [
                "Pipeline growth",
                "Trial conversion rate",
                "Product engagement metrics",
                "Marketing qualified leads"
            ]
        }

    def _generate_growth_scenarios(
        self,
        market_sizing: MarketSizing,
        growth_levers: List[Dict[str, Any]],
        parameters: Dict[str, Any]
    ) -> Dict[str, Dict[str, Any]]:
        """Generate growth scenarios (base, optimistic, pessimistic)."""
        base_revenue = parameters.get("current_annual_revenue", 1000000)

        scenarios = {}

        # Base case
        scenarios["base"] = {
            "description": "Expected scenario with planned execution",
            "year_1_revenue": round(base_revenue * (1 + self.target_growth_rate), 2),
            "year_3_revenue": round(base_revenue * ((1 + self.target_growth_rate) ** 3), 2),
            "assumptions": ["Successful execution of top 3 growth levers", "Stable market conditions"]
        }

        # Optimistic case
        optimistic_growth = self.target_growth_rate * 1.50
        scenarios["optimistic"] = {
            "description": "Best case with strong execution and favorable conditions",
            "year_1_revenue": round(base_revenue * (1 + optimistic_growth), 2),
            "year_3_revenue": round(base_revenue * ((1 + optimistic_growth) ** 3), 2),
            "assumptions": ["All growth levers exceed expectations", "Favorable market conditions", "Strong competitive position"]
        }

        # Pessimistic case
        pessimistic_growth = self.target_growth_rate * 0.50
        scenarios["pessimistic"] = {
            "description": "Conservative case with execution challenges",
            "year_1_revenue": round(base_revenue * (1 + pessimistic_growth), 2),
            "year_3_revenue": round(base_revenue * ((1 + pessimistic_growth) ** 3), 2),
            "assumptions": ["Execution delays", "Challenging market conditions", "Higher churn than expected"]
        }

        return scenarios

    def _generate_strategy_recommendations(
        self,
        growth_stage: GrowthStage,
        growth_levers: List[Dict[str, Any]],
        risk_assessment: Dict[str, Any]
    ) -> List[str]:
        """Generate strategic recommendations."""
        recommendations = []

        # Stage-specific
        if growth_stage == GrowthStage.STARTUP:
            recommendations.append("Focus on product-market fit and customer acquisition efficiency")
        elif growth_stage == GrowthStage.GROWTH:
            recommendations.append("Scale successful channels and expand market reach")
        elif growth_stage == GrowthStage.EXPANSION:
            recommendations.append("Diversify growth levers and enter new markets")

        # Lever-specific
        top_lever = growth_levers[0] if growth_levers else None
        if top_lever:
            recommendations.append(
                f"Prioritize {top_lever['lever'].replace('_', ' ')} as primary growth driver"
            )

        # Risk-based
        if risk_assessment["risk_level"] == "high":
            recommendations.append("Implement phased approach with regular risk reviews")

        # Always include
        recommendations.append("Track leading indicators and adjust strategy quarterly")
        recommendations.append("Maintain disciplined unit economics while scaling")

        return recommendations

    def _serialize_forecast(self, forecast: GrowthForecast) -> Dict[str, Any]:
        """Serialize forecast for output."""
        return {
            "forecast_id": forecast.forecast_id,
            "time_horizon_years": forecast.time_horizon_years,
            "revenue_projections": forecast.revenue_projections,
            "customer_projections": forecast.customer_projections,
            "growth_rates": forecast.growth_rates,
            "confidence_intervals": forecast.confidence_intervals,
            "model_type": forecast.model_type.value,
            "assumptions": forecast.assumptions
        }

    def calculate_tam_sam_som(
        self, market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate TAM/SAM/SOM for a given market.

        Args:
            market_data: Market parameters and data

        Returns:
            TAM/SAM/SOM calculation with methodology
        """
        try:
            logger.info("Calculating TAM/SAM/SOM")

            if not market_data:
                raise ValueError("market_data cannot be empty")

            # Perform sizing
            sizing = self._perform_market_sizing(market_data)

            # Additional analysis
            market_penetration_path = self._calculate_penetration_path(sizing)
            timeframe_analysis = self._analyze_timeframe_to_som(sizing, market_data)

            result = {
                "success": True,
                "tam": round(sizing.tam, 2),
                "sam": round(sizing.sam, 2),
                "som": round(sizing.som, 2),
                "ratios": {
                    "sam_to_tam": round(sizing.sam / sizing.tam, 3) if sizing.tam > 0 else 0,
                    "som_to_sam": round(sizing.som / sizing.sam, 3) if sizing.sam > 0 else 0,
                    "som_to_tam": round(sizing.som / sizing.tam, 3) if sizing.tam > 0 else 0
                },
                "methodology": sizing.methodology,
                "assumptions": sizing.assumptions,
                "confidence": sizing.confidence_level,
                "market_penetration_path": market_penetration_path,
                "timeframe_analysis": timeframe_analysis,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("TAM/SAM/SOM calculation completed")
            return result

        except ValueError as e:
            logger.error(f"Validation error in calculate_tam_sam_som: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in calculate_tam_sam_som: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _calculate_penetration_path(self, sizing: MarketSizing) -> Dict[str, float]:
        """Calculate market penetration path over time."""
        current_penetration = 0.01  # Start at 1%

        path = {}
        for year in range(1, 6):
            # Gradual penetration increase
            penetration = min(current_penetration * (1.5 ** year), sizing.som / sizing.tam)
            path[f"year_{year}"] = round(penetration, 4)

        return path

    def _analyze_timeframe_to_som(
        self, sizing: MarketSizing, market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze timeframe to reach SOM."""
        current_revenue = market_data.get("current_annual_revenue", 0)
        growth_rate = market_data.get("projected_growth_rate", self.target_growth_rate)

        # Calculate years to SOM
        if current_revenue > 0 and growth_rate > 0:
            years_to_som = math.log(sizing.som / current_revenue) / math.log(1 + growth_rate)
        else:
            years_to_som = 5  # Default estimate

        return {
            "estimated_years_to_som": round(years_to_som, 1),
            "annual_growth_rate_required": round(growth_rate, 3),
            "current_revenue": current_revenue,
            "target_som": sizing.som,
            "feasibility": "achievable" if years_to_som <= 5 else "ambitious" if years_to_som <= 8 else "very_ambitious"
        }
