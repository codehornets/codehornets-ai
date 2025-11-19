"""
Pricing Strategist Agent - Production Implementation

Comprehensive pricing strategy development with multiple models,
cost analysis, elasticity calculations, and optimization algorithms.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging
import statistics
import math

logger = logging.getLogger(__name__)


class PricingModel(Enum):
    """Pricing model types"""
    COST_PLUS = "cost_plus"
    VALUE_BASED = "value_based"
    COMPETITIVE = "competitive"
    DYNAMIC = "dynamic"
    PENETRATION = "penetration"
    SKIMMING = "skimming"
    PSYCHOLOGICAL = "psychological"
    BUNDLE = "bundle"


class PriceTier(Enum):
    """Price tier levels"""
    ECONOMY = "economy"
    STANDARD = "standard"
    PREMIUM = "premium"
    LUXURY = "luxury"


@dataclass
class CostBreakdown:
    """Detailed cost breakdown"""
    direct_labor: float
    indirect_labor: float
    materials: float
    overhead: float
    tools_software: float
    contractor_fees: float
    other_costs: float
    total_cost: float
    cost_per_hour: float
    markup_percentage: float


@dataclass
class PriceElasticity:
    """Price elasticity analysis"""
    elasticity_coefficient: float
    demand_change_percent: float
    price_change_percent: float
    elasticity_type: str  # elastic, inelastic, unit_elastic
    revenue_impact: float
    optimal_price_adjustment: float


@dataclass
class MarginAnalysis:
    """Profit margin analysis"""
    gross_margin: float
    gross_margin_percent: float
    contribution_margin: float
    contribution_margin_percent: float
    net_margin: float
    net_margin_percent: float
    breakeven_volume: float
    breakeven_revenue: float


@dataclass
class PricingRecommendation:
    """Pricing recommendation with rationale"""
    recommended_price: float
    price_range_min: float
    price_range_max: float
    pricing_model: PricingModel
    confidence_score: float
    rationale: List[str]
    competitive_position: str
    expected_margin: float
    risk_assessment: str


class PricingStrategistAgent:
    """
    Pricing Strategist Agent - Advanced pricing strategy and optimization

    Implements:
    - Cost-Plus Pricing (activity-based costing)
    - Value-Based Pricing (customer value estimation)
    - Competitive Pricing (market positioning)
    - Dynamic Pricing (demand-based)
    - Price Elasticity Analysis
    - Margin Optimization
    - Bundle Pricing
    - Psychological Pricing
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Pricing Strategist Agent

        Args:
            config: Configuration dictionary with pricing parameters
        """
        self.agent_id = "pricing_strategist_001"
        self.config = config or {}
        self.pricing_models: List[Dict[str, Any]] = []
        self.pricing_history: List[Dict[str, Any]] = []
        self.name = "Pricing Strategist"
        self.role = "Pricing Strategy and Cost Analysis"

        # Default configuration
        self.target_margin = self.config.get('target_margin', 0.40)  # 40% target margin
        self.overhead_rate = self.config.get('overhead_rate', 0.25)  # 25% overhead
        self.risk_buffer = self.config.get('risk_buffer', 0.10)  # 10% risk buffer

        logger.info(f"Pricing Strategist Agent {self.agent_id} initialized")

    # ==================== COST CALCULATION ====================

    def calculate_service_cost(
        self,
        service_id: str,
        components: List[Dict[str, Any]],
        methodology: str = "activity_based"
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive service cost using activity-based costing

        Args:
            service_id: Service identifier
            components: List of cost components with details
            methodology: Costing methodology (activity_based, absorption, variable)

        Returns:
            Detailed cost breakdown and analysis
        """
        try:
            logger.info(f"Calculating costs for service {service_id} using {methodology}")

            # Calculate direct costs
            direct_costs = self._calculate_direct_costs(components)

            # Calculate indirect costs
            indirect_costs = self._calculate_indirect_costs(direct_costs, components)

            # Apply overhead allocation
            overhead = self._allocate_overhead(direct_costs, indirect_costs)

            # Calculate total costs
            total_cost = (
                direct_costs['labor'] +
                direct_costs['materials'] +
                direct_costs['tools'] +
                direct_costs['contractors'] +
                indirect_costs['total'] +
                overhead['total']
            )

            # Build detailed breakdown
            cost_breakdown = CostBreakdown(
                direct_labor=direct_costs['labor'],
                indirect_labor=indirect_costs['support_labor'],
                materials=direct_costs['materials'],
                overhead=overhead['total'],
                tools_software=direct_costs['tools'],
                contractor_fees=direct_costs['contractors'],
                other_costs=indirect_costs['other'],
                total_cost=total_cost,
                cost_per_hour=self._calculate_hourly_cost(total_cost, components),
                markup_percentage=self.target_margin * 100
            )

            # Cost drivers analysis
            cost_drivers = self._identify_cost_drivers(components, cost_breakdown)

            # Cost optimization opportunities
            optimization_opportunities = self._identify_cost_optimization(
                cost_breakdown,
                cost_drivers
            )

            result = {
                "service_id": service_id,
                "methodology": methodology,
                "analysis_date": datetime.now().isoformat(),
                "cost_breakdown": {
                    "direct_labor": cost_breakdown.direct_labor,
                    "indirect_labor": cost_breakdown.indirect_labor,
                    "materials": cost_breakdown.materials,
                    "overhead": cost_breakdown.overhead,
                    "tools_software": cost_breakdown.tools_software,
                    "contractor_fees": cost_breakdown.contractor_fees,
                    "other_costs": cost_breakdown.other_costs,
                    "total_cost": cost_breakdown.total_cost,
                    "cost_per_hour": cost_breakdown.cost_per_hour
                },
                "cost_structure_percentages": {
                    "labor_percent": round((direct_costs['labor'] / total_cost * 100), 2) if total_cost > 0 else 0,
                    "materials_percent": round((direct_costs['materials'] / total_cost * 100), 2) if total_cost > 0 else 0,
                    "overhead_percent": round((overhead['total'] / total_cost * 100), 2) if total_cost > 0 else 0,
                    "other_percent": round(((indirect_costs['total'] + direct_costs['tools'] + direct_costs['contractors']) / total_cost * 100), 2) if total_cost > 0 else 0
                },
                "cost_drivers": cost_drivers,
                "optimization_opportunities": optimization_opportunities
            }

            self.pricing_history.append({
                "type": "cost_calculation",
                "service_id": service_id,
                "timestamp": datetime.now().isoformat(),
                "result": result
            })

            logger.info(f"Cost calculation completed for {service_id}: ${total_cost:,.2f}")
            return result

        except Exception as e:
            logger.error(f"Error calculating service cost: {e}")
            return {"error": str(e), "service_id": service_id, "status": "failed"}

    def _calculate_direct_costs(self, components: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate direct costs from components"""
        labor = 0.0
        materials = 0.0
        tools = 0.0
        contractors = 0.0

        for component in components:
            comp_type = component.get('type', '').lower()
            cost = component.get('cost', 0.0)

            if comp_type in ['labor', 'employee_time']:
                hours = component.get('hours', 0)
                rate = component.get('rate', 0)
                labor += hours * rate
            elif comp_type in ['material', 'materials', 'supplies']:
                materials += cost
            elif comp_type in ['tool', 'software', 'equipment']:
                tools += cost
            elif comp_type in ['contractor', 'freelancer', 'vendor']:
                contractors += cost
            else:
                materials += cost  # Default to materials

        return {
            "labor": labor,
            "materials": materials,
            "tools": tools,
            "contractors": contractors
        }

    def _calculate_indirect_costs(
        self,
        direct_costs: Dict[str, float],
        components: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate indirect costs"""
        # Support labor (management, admin) - typically 15-20% of direct labor
        support_labor_rate = 0.18
        support_labor = direct_costs['labor'] * support_labor_rate

        # Other indirect costs (utilities, insurance, etc.) - 5-10% of direct costs
        other_rate = 0.07
        total_direct = sum(direct_costs.values())
        other = total_direct * other_rate

        return {
            "support_labor": support_labor,
            "other": other,
            "total": support_labor + other
        }

    def _allocate_overhead(
        self,
        direct_costs: Dict[str, float],
        indirect_costs: Dict[str, float]
    ) -> Dict[str, float]:
        """Allocate overhead costs"""
        total_direct = sum(direct_costs.values())
        overhead_amount = total_direct * self.overhead_rate

        return {
            "total": overhead_amount,
            "rate": self.overhead_rate,
            "allocation_base": "direct_costs"
        }

    def _calculate_hourly_cost(
        self,
        total_cost: float,
        components: List[Dict[str, Any]]
    ) -> float:
        """Calculate cost per hour"""
        total_hours = sum(
            comp.get('hours', 0)
            for comp in components
            if comp.get('type', '').lower() in ['labor', 'employee_time']
        )

        if total_hours > 0:
            return total_cost / total_hours
        return 0.0

    def _identify_cost_drivers(
        self,
        components: List[Dict[str, Any]],
        cost_breakdown: CostBreakdown
    ) -> List[Dict[str, Any]]:
        """Identify key cost drivers"""
        drivers = []

        # Labor intensity
        labor_total = cost_breakdown.direct_labor + cost_breakdown.indirect_labor
        labor_percent = (labor_total / cost_breakdown.total_cost * 100) if cost_breakdown.total_cost > 0 else 0

        if labor_percent > 60:
            drivers.append({
                "driver": "Labor Intensive",
                "impact": "high",
                "percentage": round(labor_percent, 1),
                "recommendation": "Explore automation opportunities to reduce labor dependency"
            })

        # Material costs
        material_percent = (cost_breakdown.materials / cost_breakdown.total_cost * 100) if cost_breakdown.total_cost > 0 else 0

        if material_percent > 40:
            drivers.append({
                "driver": "Material Intensive",
                "impact": "high",
                "percentage": round(material_percent, 1),
                "recommendation": "Negotiate bulk discounts or explore alternative suppliers"
            })

        # Overhead burden
        overhead_percent = (cost_breakdown.overhead / cost_breakdown.total_cost * 100) if cost_breakdown.total_cost > 0 else 0

        if overhead_percent > 30:
            drivers.append({
                "driver": "High Overhead",
                "impact": "medium",
                "percentage": round(overhead_percent, 1),
                "recommendation": "Review overhead allocation and efficiency"
            })

        return drivers

    def _identify_cost_optimization(
        self,
        cost_breakdown: CostBreakdown,
        cost_drivers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify cost optimization opportunities"""
        opportunities = []

        # Labor optimization
        labor_total = cost_breakdown.direct_labor + cost_breakdown.indirect_labor
        if labor_total > cost_breakdown.total_cost * 0.5:
            potential_savings = labor_total * 0.15  # 15% improvement potential

            opportunities.append({
                "area": "Labor Efficiency",
                "current_cost": labor_total,
                "potential_savings": potential_savings,
                "savings_percent": 15.0,
                "actions": [
                    "Implement time tracking and productivity metrics",
                    "Standardize processes and create templates",
                    "Train team on efficient workflows",
                    "Consider automation for repetitive tasks"
                ]
            })

        # Material optimization
        if cost_breakdown.materials > cost_breakdown.total_cost * 0.3:
            potential_savings = cost_breakdown.materials * 0.10  # 10% improvement

            opportunities.append({
                "area": "Material Costs",
                "current_cost": cost_breakdown.materials,
                "potential_savings": potential_savings,
                "savings_percent": 10.0,
                "actions": [
                    "Negotiate volume discounts with suppliers",
                    "Explore alternative materials/suppliers",
                    "Implement just-in-time inventory",
                    "Reduce waste through better planning"
                ]
            })

        # Overhead optimization
        if cost_breakdown.overhead > cost_breakdown.total_cost * 0.25:
            potential_savings = cost_breakdown.overhead * 0.12

            opportunities.append({
                "area": "Overhead Reduction",
                "current_cost": cost_breakdown.overhead,
                "potential_savings": potential_savings,
                "savings_percent": 12.0,
                "actions": [
                    "Review and optimize facility costs",
                    "Consolidate tools and software licenses",
                    "Improve resource utilization",
                    "Implement cost allocation accuracy"
                ]
            })

        return opportunities

    # ==================== PRICING MODELS ====================

    def create_pricing_model(
        self,
        service_id: str,
        model_type: PricingModel,
        cost_data: Dict[str, Any],
        market_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create comprehensive pricing model

        Args:
            service_id: Service identifier
            model_type: Type of pricing model to create
            cost_data: Cost information
            market_data: Market and competitive data

        Returns:
            Complete pricing model with recommendations
        """
        try:
            logger.info(f"Creating {model_type.value} pricing model for {service_id}")

            market_data = market_data or {}

            if model_type == PricingModel.COST_PLUS:
                pricing_result = self._cost_plus_pricing(cost_data)
            elif model_type == PricingModel.VALUE_BASED:
                pricing_result = self._value_based_pricing(cost_data, market_data)
            elif model_type == PricingModel.COMPETITIVE:
                pricing_result = self._competitive_pricing(cost_data, market_data)
            elif model_type == PricingModel.DYNAMIC:
                pricing_result = self._dynamic_pricing(cost_data, market_data)
            elif model_type == PricingModel.PSYCHOLOGICAL:
                pricing_result = self._psychological_pricing(cost_data, market_data)
            elif model_type == PricingModel.BUNDLE:
                pricing_result = self._bundle_pricing(cost_data, market_data)
            else:
                pricing_result = self._cost_plus_pricing(cost_data)  # Default

            # Calculate margins for the recommended price
            margin_analysis = self.calculate_profit_margin(
                cost_data.get('total_cost', 0),
                pricing_result['recommended_price']
            )

            model = {
                "model_id": f"pricing_model_{datetime.now().timestamp()}",
                "service_id": service_id,
                "model_type": model_type.value,
                "created_at": datetime.now().isoformat(),
                "pricing_result": pricing_result,
                "margin_analysis": margin_analysis,
                "price_sensitivity": self._assess_price_sensitivity(market_data),
                "competitive_context": self._analyze_competitive_context(pricing_result, market_data)
            }

            self.pricing_models.append(model)

            self.pricing_history.append({
                "type": "pricing_model_creation",
                "service_id": service_id,
                "timestamp": datetime.now().isoformat(),
                "model": model
            })

            logger.info(f"Pricing model created: ${pricing_result['recommended_price']:,.2f}")
            return model

        except Exception as e:
            logger.error(f"Error creating pricing model: {e}")
            return {"error": str(e), "service_id": service_id, "status": "failed"}

    def _cost_plus_pricing(self, cost_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cost-plus pricing model"""
        total_cost = cost_data.get('total_cost', 0)
        target_margin = cost_data.get('target_margin', self.target_margin)

        # Calculate price with target margin
        price = total_cost / (1 - target_margin)

        # Calculate price range
        min_margin = 0.25  # Minimum 25% margin
        max_margin = 0.60  # Maximum 60% margin

        price_min = total_cost / (1 - min_margin)
        price_max = total_cost / (1 - max_margin)

        return {
            "recommended_price": round(price, 2),
            "price_range_min": round(price_min, 2),
            "price_range_max": round(price_max, 2),
            "methodology": "cost_plus",
            "markup_percent": round(target_margin * 100, 1),
            "rationale": [
                f"Cost-plus pricing with {target_margin*100:.0f}% target margin",
                f"Total cost: ${total_cost:,.2f}",
                f"Provides consistent margin across all sales"
            ]
        }

    def _value_based_pricing(
        self,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Value-based pricing model"""
        total_cost = cost_data.get('total_cost', 0)

        # Estimate customer value creation
        value_created = market_data.get('value_created', total_cost * 3)  # 3x cost default
        value_capture_rate = market_data.get('value_capture_rate', 0.35)  # Capture 35% of value

        # Calculate price based on value
        price = value_created * value_capture_rate

        # Ensure price covers cost with minimum margin
        min_price = total_cost / (1 - 0.25)  # Minimum 25% margin
        price = max(price, min_price)

        # Price range based on value capture scenarios
        conservative_price = value_created * 0.25
        aggressive_price = value_created * 0.50

        return {
            "recommended_price": round(price, 2),
            "price_range_min": round(max(conservative_price, min_price), 2),
            "price_range_max": round(aggressive_price, 2),
            "methodology": "value_based",
            "value_created": value_created,
            "value_capture_rate": value_capture_rate,
            "rationale": [
                f"Priced on customer value creation: ${value_created:,.2f}",
                f"Capturing {value_capture_rate*100:.0f}% of value created",
                f"Customer ROI: {((value_created - price) / price * 100):.0f}%"
            ]
        }

    def _competitive_pricing(
        self,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Competitive pricing model"""
        total_cost = cost_data.get('total_cost', 0)

        # Get competitor pricing data
        competitor_prices = market_data.get('competitor_prices', [total_cost * 1.5])
        avg_competitor_price = statistics.mean(competitor_prices) if competitor_prices else total_cost * 1.5

        # Determine positioning strategy
        positioning = market_data.get('positioning', 'at_market')  # at_market, above_market, below_market

        if positioning == 'premium' or positioning == 'above_market':
            multiplier = 1.15  # 15% above market
        elif positioning == 'economy' or positioning == 'below_market':
            multiplier = 0.90  # 10% below market
        else:  # at_market
            multiplier = 1.00

        price = avg_competitor_price * multiplier

        # Ensure minimum margin
        min_price = total_cost / (1 - 0.20)  # Minimum 20% margin
        price = max(price, min_price)

        return {
            "recommended_price": round(price, 2),
            "price_range_min": round(avg_competitor_price * 0.90, 2),
            "price_range_max": round(avg_competitor_price * 1.20, 2),
            "methodology": "competitive",
            "avg_competitor_price": round(avg_competitor_price, 2),
            "positioning": positioning,
            "price_vs_market": round(((price / avg_competitor_price - 1) * 100), 1),
            "rationale": [
                f"Market average price: ${avg_competitor_price:,.2f}",
                f"Positioning: {positioning}",
                f"Competitive advantage through {positioning} strategy"
            ]
        }

    def _dynamic_pricing(
        self,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Dynamic pricing model based on demand"""
        total_cost = cost_data.get('total_cost', 0)
        base_price = total_cost / (1 - self.target_margin)

        # Demand factors
        demand_level = market_data.get('demand_level', 1.0)  # 0.5 = low, 1.0 = normal, 1.5 = high
        capacity_utilization = market_data.get('capacity_utilization', 0.70)  # 70% utilization
        seasonality = market_data.get('seasonality_factor', 1.0)

        # Calculate dynamic price adjustments
        demand_multiplier = 0.8 + (demand_level * 0.4)  # Range: 0.8 to 1.4
        capacity_multiplier = 1.0 + ((capacity_utilization - 0.7) * 0.5)  # Adjust based on capacity

        dynamic_price = base_price * demand_multiplier * capacity_multiplier * seasonality

        # Price bounds
        price_floor = total_cost / (1 - 0.15)  # Never go below 15% margin
        price_ceiling = base_price * 1.5  # Never exceed 50% above base

        dynamic_price = max(price_floor, min(dynamic_price, price_ceiling))

        return {
            "recommended_price": round(dynamic_price, 2),
            "base_price": round(base_price, 2),
            "price_range_min": round(price_floor, 2),
            "price_range_max": round(price_ceiling, 2),
            "methodology": "dynamic",
            "demand_level": demand_level,
            "capacity_utilization": capacity_utilization,
            "seasonality_factor": seasonality,
            "price_adjustment": round(((dynamic_price / base_price - 1) * 100), 1),
            "rationale": [
                f"Base price: ${base_price:,.2f}",
                f"Demand adjustment: {((demand_multiplier - 1) * 100):+.0f}%",
                f"Capacity adjustment: {((capacity_multiplier - 1) * 100):+.0f}%",
                "Price optimized for current market conditions"
            ]
        }

    def _psychological_pricing(
        self,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Psychological pricing with charm pricing"""
        total_cost = cost_data.get('total_cost', 0)
        base_price = total_cost / (1 - self.target_margin)

        # Apply charm pricing (ending in 9, 99, or 95)
        def apply_charm_pricing(price: float) -> float:
            """Apply psychological pricing"""
            if price < 100:
                # Prices under $100: end in .99
                return math.floor(price) + 0.99
            elif price < 1000:
                # Prices $100-$1000: end in 99
                return math.floor(price / 10) * 10 - 1
            else:
                # Prices over $1000: end in 995 or 999
                return math.floor(price / 100) * 100 - 5

        charm_price = apply_charm_pricing(base_price)

        # Alternative: prestige pricing (round numbers for luxury)
        prestige_price = math.ceil(base_price / 100) * 100

        # Choose based on positioning
        positioning = market_data.get('positioning', 'standard')
        if positioning in ['premium', 'luxury']:
            recommended_price = prestige_price
            pricing_strategy = "prestige"
        else:
            recommended_price = charm_price
            pricing_strategy = "charm"

        return {
            "recommended_price": round(recommended_price, 2),
            "base_price": round(base_price, 2),
            "charm_price": round(charm_price, 2),
            "prestige_price": round(prestige_price, 2),
            "methodology": "psychological",
            "pricing_strategy": pricing_strategy,
            "rationale": [
                f"Base price adjusted to ${recommended_price:,.2f}",
                f"Using {pricing_strategy} pricing strategy",
                "Price point optimized for perceived value"
            ]
        }

    def _bundle_pricing(
        self,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Bundle pricing strategy"""
        total_cost = cost_data.get('total_cost', 0)

        # Individual service prices
        individual_prices = market_data.get('individual_prices', [total_cost / 3] * 3)
        total_individual_price = sum(individual_prices)

        # Bundle discount (typically 15-25%)
        bundle_discount_rate = market_data.get('bundle_discount', 0.20)
        bundle_price = total_individual_price * (1 - bundle_discount_rate)

        # Ensure profitability
        min_price = total_cost / (1 - 0.30)  # Minimum 30% margin
        bundle_price = max(bundle_price, min_price)

        return {
            "recommended_price": round(bundle_price, 2),
            "total_individual_price": round(total_individual_price, 2),
            "bundle_discount_percent": bundle_discount_rate * 100,
            "savings": round(total_individual_price - bundle_price, 2),
            "methodology": "bundle",
            "rationale": [
                f"Individual items total: ${total_individual_price:,.2f}",
                f"Bundle savings: ${total_individual_price - bundle_price:,.2f} ({bundle_discount_rate*100:.0f}%)",
                "Encourages larger purchase and customer commitment"
            ]
        }

    def _assess_price_sensitivity(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess market price sensitivity"""
        # Customer segment price sensitivity
        segment = market_data.get('customer_segment', 'mid_market')

        sensitivity_map = {
            'enterprise': {'level': 'low', 'description': 'Focus on value and ROI over price'},
            'mid_market': {'level': 'moderate', 'description': 'Balance of price and value'},
            'smb': {'level': 'high', 'description': 'Price-conscious with limited budget'},
            'startup': {'level': 'very_high', 'description': 'Highly price-sensitive'}
        }

        sensitivity = sensitivity_map.get(segment, sensitivity_map['mid_market'])

        return {
            "customer_segment": segment,
            "sensitivity_level": sensitivity['level'],
            "description": sensitivity['description'],
            "pricing_recommendations": self._get_sensitivity_recommendations(sensitivity['level'])
        }

    def _get_sensitivity_recommendations(self, sensitivity_level: str) -> List[str]:
        """Get recommendations based on price sensitivity"""
        recommendations_map = {
            'low': [
                "Emphasize value and outcomes over price",
                "Offer premium features and service levels",
                "Focus on ROI and business impact"
            ],
            'moderate': [
                "Balance competitive pricing with value differentiation",
                "Offer tiered pricing options",
                "Highlight cost-benefit analysis"
            ],
            'high': [
                "Maintain competitive pricing",
                "Offer flexible payment terms",
                "Provide clear value for money",
                "Consider volume discounts"
            ],
            'very_high': [
                "Lead with competitive pricing",
                "Offer starter packages and trials",
                "Show clear cost savings",
                "Flexible payment options essential"
            ]
        }

        return recommendations_map.get(sensitivity_level, recommendations_map['moderate'])

    def _analyze_competitive_context(
        self,
        pricing_result: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze competitive pricing context"""
        recommended_price = pricing_result.get('recommended_price', 0)
        competitor_prices = market_data.get('competitor_prices', [])

        if not competitor_prices:
            return {
                "position": "unknown",
                "percentile": None,
                "analysis": "Insufficient competitive data"
            }

        sorted_prices = sorted(competitor_prices)
        avg_price = statistics.mean(sorted_prices)
        median_price = statistics.median(sorted_prices)

        # Determine price position
        if recommended_price < sorted_prices[0]:
            position = "below_market"
        elif recommended_price > sorted_prices[-1]:
            position = "above_market"
        elif recommended_price < median_price:
            position = "lower_mid_market"
        elif recommended_price > median_price:
            position = "upper_mid_market"
        else:
            position = "at_market"

        # Calculate percentile
        below_count = sum(1 for p in sorted_prices if p < recommended_price)
        percentile = (below_count / len(sorted_prices) * 100) if sorted_prices else None

        return {
            "position": position,
            "percentile": round(percentile, 1) if percentile else None,
            "avg_competitor_price": round(avg_price, 2),
            "median_competitor_price": round(median_price, 2),
            "price_vs_avg": round(((recommended_price / avg_price - 1) * 100), 1) if avg_price > 0 else None,
            "analysis": f"Positioned at {position.replace('_', ' ')} ({percentile:.0f}th percentile)" if percentile else "Positioned at " + position.replace('_', ' ')
        }

    # ==================== COMPETITOR PRICING ANALYSIS ====================

    def analyze_competitor_pricing(
        self,
        service_category: str,
        competitor_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Analyze competitor pricing in service category

        Args:
            service_category: Category of service
            competitor_data: List of competitor pricing data

        Returns:
            Comprehensive competitive pricing analysis
        """
        try:
            logger.info(f"Analyzing competitor pricing for {service_category}")

            if not competitor_data:
                competitor_data = self._generate_sample_competitor_pricing(service_category)

            # Extract pricing data
            prices = [c.get('price', 0) for c in competitor_data if c.get('price', 0) > 0]

            if not prices:
                return {"error": "No valid pricing data", "status": "failed"}

            # Statistical analysis
            avg_price = statistics.mean(prices)
            median_price = statistics.median(prices)
            std_dev = statistics.stdev(prices) if len(prices) > 1 else 0
            min_price = min(prices)
            max_price = max(prices)

            # Price distribution
            price_quartiles = self._calculate_quartiles(prices)

            # Identify pricing strategies
            pricing_strategies = self._identify_competitor_strategies(competitor_data)

            # Market positioning analysis
            positioning_analysis = self._analyze_market_positioning(competitor_data, prices)

            # Pricing opportunities
            opportunities = self._identify_pricing_opportunities(
                avg_price,
                median_price,
                price_quartiles,
                competitor_data
            )

            analysis = {
                "service_category": service_category,
                "analysis_date": datetime.now().isoformat(),
                "price_statistics": {
                    "average_price": round(avg_price, 2),
                    "median_price": round(median_price, 2),
                    "std_deviation": round(std_dev, 2),
                    "min_price": round(min_price, 2),
                    "max_price": round(max_price, 2),
                    "price_range": round(max_price - min_price, 2),
                    "coefficient_of_variation": round((std_dev / avg_price * 100), 2) if avg_price > 0 else 0
                },
                "price_quartiles": price_quartiles,
                "competitor_count": len(competitor_data),
                "pricing_strategies": pricing_strategies,
                "market_positioning": positioning_analysis,
                "opportunities": opportunities
            }

            self.pricing_history.append({
                "type": "competitor_pricing_analysis",
                "category": service_category,
                "timestamp": datetime.now().isoformat(),
                "result": analysis
            })

            logger.info(f"Competitor pricing analysis completed: avg ${avg_price:,.2f}")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing competitor pricing: {e}")
            return {"error": str(e), "category": service_category, "status": "failed"}

    def _calculate_quartiles(self, prices: List[float]) -> Dict[str, float]:
        """Calculate price quartiles"""
        sorted_prices = sorted(prices)
        n = len(sorted_prices)

        q1_idx = n // 4
        q2_idx = n // 2
        q3_idx = (3 * n) // 4

        return {
            "q1": round(sorted_prices[q1_idx], 2),
            "q2_median": round(sorted_prices[q2_idx], 2),
            "q3": round(sorted_prices[q3_idx], 2),
            "iqr": round(sorted_prices[q3_idx] - sorted_prices[q1_idx], 2)
        }

    def _identify_competitor_strategies(
        self,
        competitor_data: List[Dict[str, Any]]
    ) -> Dict[str, List[str]]:
        """Identify competitor pricing strategies"""
        strategies = {
            "premium": [],
            "mid_market": [],
            "economy": [],
            "value": []
        }

        prices = [c.get('price', 0) for c in competitor_data]
        avg_price = statistics.mean(prices)

        for competitor in competitor_data:
            name = competitor.get('name', 'Unknown')
            price = competitor.get('price', 0)

            if price > avg_price * 1.25:
                strategies["premium"].append(name)
            elif price < avg_price * 0.75:
                strategies["economy"].append(name)
            elif competitor.get('positioning') == 'value':
                strategies["value"].append(name)
            else:
                strategies["mid_market"].append(name)

        return strategies

    def _analyze_market_positioning(
        self,
        competitor_data: List[Dict[str, Any]],
        prices: List[float]
    ) -> Dict[str, Any]:
        """Analyze market positioning"""
        avg_price = statistics.mean(prices)

        premium_count = sum(1 for p in prices if p > avg_price * 1.25)
        mid_market_count = sum(1 for p in prices if avg_price * 0.75 <= p <= avg_price * 1.25)
        economy_count = sum(1 for p in prices if p < avg_price * 0.75)

        total = len(prices)

        return {
            "premium_segment": {
                "count": premium_count,
                "percentage": round((premium_count / total * 100), 1) if total > 0 else 0,
                "avg_price": round(statistics.mean([p for p in prices if p > avg_price * 1.25]), 2) if premium_count > 0 else 0
            },
            "mid_market_segment": {
                "count": mid_market_count,
                "percentage": round((mid_market_count / total * 100), 1) if total > 0 else 0,
                "avg_price": round(statistics.mean([p for p in prices if avg_price * 0.75 <= p <= avg_price * 1.25]), 2) if mid_market_count > 0 else 0
            },
            "economy_segment": {
                "count": economy_count,
                "percentage": round((economy_count / total * 100), 1) if total > 0 else 0,
                "avg_price": round(statistics.mean([p for p in prices if p < avg_price * 0.75]), 2) if economy_count > 0 else 0
            }
        }

    def _identify_pricing_opportunities(
        self,
        avg_price: float,
        median_price: float,
        quartiles: Dict[str, float],
        competitor_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify pricing opportunities"""
        opportunities = []

        # Price gap analysis
        if abs(avg_price - median_price) > avg_price * 0.15:
            opportunities.append({
                "type": "price_gap",
                "description": "Significant gap between average and median pricing",
                "opportunity": "Market may support differentiated pricing tiers",
                "target_price_range": [round(median_price * 0.9, 2), round(median_price * 1.1, 2)]
            })

        # Underserved segments
        iqr = quartiles['iqr']
        if iqr > avg_price * 0.30:
            opportunities.append({
                "type": "wide_price_range",
                "description": "Wide price range indicates diverse customer needs",
                "opportunity": "Multiple pricing tiers could capture different segments",
                "recommended_tiers": [
                    {"tier": "economy", "price": round(quartiles['q1'] * 0.95, 2)},
                    {"tier": "standard", "price": round(median_price, 2)},
                    {"tier": "premium", "price": round(quartiles['q3'] * 1.05, 2)}
                ]
            })

        # Value positioning
        opportunities.append({
            "type": "value_positioning",
            "description": "Position between economy and mid-market for value play",
            "opportunity": "Offer superior features at competitive price",
            "target_price": round(avg_price * 0.90, 2),
            "strategy": "Price slightly below market average while emphasizing superior value"
        })

        return opportunities

    def _generate_sample_competitor_pricing(self, category: str) -> List[Dict[str, Any]]:
        """Generate sample competitor pricing data"""
        return [
            {"name": "Competitor A", "price": 8500, "positioning": "premium"},
            {"name": "Competitor B", "price": 6200, "positioning": "mid_market"},
            {"name": "Competitor C", "price": 4800, "positioning": "value"},
            {"name": "Competitor D", "price": 7100, "positioning": "mid_market"},
            {"name": "Competitor E", "price": 3500, "positioning": "economy"},
            {"name": "Competitor F", "price": 9200, "positioning": "premium"},
            {"name": "Competitor G", "price": 5900, "positioning": "value"}
        ]

    # ==================== MARGIN AND PROFIT ANALYSIS ====================

    def calculate_profit_margin(
        self,
        cost: float,
        price: float,
        additional_costs: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive profit margin and breakeven analysis

        Args:
            cost: Total cost
            price: Selling price
            additional_costs: Additional cost considerations

        Returns:
            Complete margin and breakeven analysis
        """
        try:
            additional_costs = additional_costs or {}

            # Basic margin calculations
            gross_profit = price - cost
            gross_margin_percent = (gross_profit / price * 100) if price > 0 else 0

            # Contribution margin (after variable costs)
            variable_costs = additional_costs.get('variable_costs', cost * 0.7)
            contribution_margin = price - variable_costs
            contribution_margin_percent = (contribution_margin / price * 100) if price > 0 else 0

            # Net margin (after all costs including fixed)
            fixed_costs = additional_costs.get('fixed_costs', cost * 0.3)
            net_profit = gross_profit - fixed_costs
            net_margin_percent = (net_profit / price * 100) if price > 0 else 0

            # Breakeven analysis
            if contribution_margin > 0:
                breakeven_units = fixed_costs / contribution_margin
                breakeven_revenue = breakeven_units * price
            else:
                breakeven_units = float('inf')
                breakeven_revenue = float('inf')

            # Markup calculation
            markup_percent = ((price - cost) / cost * 100) if cost > 0 else 0

            margin_analysis = {
                "price": price,
                "cost": cost,
                "gross_profit": round(gross_profit, 2),
                "gross_margin_percent": round(gross_margin_percent, 2),
                "contribution_margin": round(contribution_margin, 2),
                "contribution_margin_percent": round(contribution_margin_percent, 2),
                "net_profit": round(net_profit, 2),
                "net_margin_percent": round(net_margin_percent, 2),
                "markup_percent": round(markup_percent, 2),
                "breakeven_units": round(breakeven_units, 2) if breakeven_units != float('inf') else None,
                "breakeven_revenue": round(breakeven_revenue, 2) if breakeven_revenue != float('inf') else None,
                "margin_classification": self._classify_margin(gross_margin_percent)
            }

            return margin_analysis

        except Exception as e:
            logger.error(f"Error calculating profit margin: {e}")
            return {"error": str(e)}

    def _classify_margin(self, margin_percent: float) -> str:
        """Classify margin level"""
        if margin_percent >= 50:
            return "excellent"
        elif margin_percent >= 40:
            return "strong"
        elif margin_percent >= 30:
            return "good"
        elif margin_percent >= 20:
            return "acceptable"
        else:
            return "weak"

    # ==================== PRICE OPTIMIZATION ====================

    def optimize_pricing(
        self,
        service_id: str,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any],
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimize pricing using multiple factors and constraints

        Args:
            service_id: Service identifier
            cost_data: Cost information
            market_data: Market conditions and competitive data
            constraints: Pricing constraints (min_price, max_price, target_margin)

        Returns:
            Optimized pricing recommendation
        """
        try:
            logger.info(f"Optimizing pricing for service {service_id}")

            constraints = constraints or {}

            # Generate prices using different models
            models_to_test = [
                PricingModel.COST_PLUS,
                PricingModel.VALUE_BASED,
                PricingModel.COMPETITIVE,
                PricingModel.DYNAMIC
            ]

            model_results = []

            for model_type in models_to_test:
                try:
                    result = self.create_pricing_model(
                        service_id,
                        model_type,
                        cost_data,
                        market_data
                    )

                    if 'error' not in result:
                        model_results.append({
                            "model": model_type.value,
                            "price": result['pricing_result']['recommended_price'],
                            "margin": result['margin_analysis']['gross_margin_percent'],
                            "details": result
                        })
                except Exception as e:
                    logger.warning(f"Model {model_type.value} failed: {e}")
                    continue

            if not model_results:
                return {"error": "All pricing models failed", "status": "failed"}

            # Apply constraints
            min_price = constraints.get('min_price', cost_data.get('total_cost', 0) / 0.80)
            max_price = constraints.get('max_price', float('inf'))
            target_margin = constraints.get('target_margin', self.target_margin)

            # Filter valid prices
            valid_results = [
                r for r in model_results
                if min_price <= r['price'] <= max_price and r['margin'] >= target_margin * 100
            ]

            if not valid_results:
                # Relax constraints slightly if no valid results
                valid_results = [
                    r for r in model_results
                    if r['price'] >= min_price
                ]

            if not valid_results:
                valid_results = model_results  # Use all if still none

            # Score each price option
            scored_results = []
            for result in valid_results:
                score = self._score_pricing_option(
                    result['price'],
                    result['margin'],
                    cost_data,
                    market_data,
                    target_margin
                )

                scored_results.append({
                    **result,
                    "score": score
                })

            # Select optimal price
            best_option = max(scored_results, key=lambda x: x['score'])

            # Generate final recommendation
            recommendation = PricingRecommendation(
                recommended_price=best_option['price'],
                price_range_min=min(r['price'] for r in valid_results),
                price_range_max=max(r['price'] for r in valid_results),
                pricing_model=PricingModel(best_option['model']),
                confidence_score=best_option['score'],
                rationale=self._generate_optimization_rationale(best_option, model_results, constraints),
                competitive_position=self._determine_competitive_position(best_option['price'], market_data),
                expected_margin=best_option['margin'],
                risk_assessment=self._assess_pricing_risk(best_option, market_data)
            )

            result = {
                "service_id": service_id,
                "optimization_date": datetime.now().isoformat(),
                "recommended_price": recommendation.recommended_price,
                "price_range": {
                    "min": recommendation.price_range_min,
                    "max": recommendation.price_range_max
                },
                "selected_model": recommendation.pricing_model.value,
                "confidence_score": round(recommendation.confidence_score, 2),
                "expected_margin_percent": round(recommendation.expected_margin, 2),
                "competitive_position": recommendation.competitive_position,
                "risk_assessment": recommendation.risk_assessment,
                "rationale": recommendation.rationale,
                "models_evaluated": len(model_results),
                "all_model_results": [
                    {
                        "model": r['model'],
                        "price": r['price'],
                        "margin": r['margin'],
                        "score": r.get('score', 0)
                    }
                    for r in scored_results
                ]
            }

            self.pricing_history.append({
                "type": "price_optimization",
                "service_id": service_id,
                "timestamp": datetime.now().isoformat(),
                "result": result
            })

            logger.info(f"Pricing optimized: ${recommendation.recommended_price:,.2f} (confidence: {recommendation.confidence_score:.2f})")
            return result

        except Exception as e:
            logger.error(f"Error optimizing pricing: {e}")
            return {"error": str(e), "service_id": service_id, "status": "failed"}

    def _score_pricing_option(
        self,
        price: float,
        margin: float,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any],
        target_margin: float
    ) -> float:
        """Score a pricing option"""
        score = 0.0

        # Margin score (0-40 points)
        margin_ratio = margin / (target_margin * 100)
        margin_score = min(40, margin_ratio * 40)
        score += margin_score

        # Market competitiveness score (0-30 points)
        competitor_prices = market_data.get('competitor_prices', [])
        if competitor_prices:
            avg_competitor = statistics.mean(competitor_prices)
            # Optimal is within ±10% of market average
            price_diff_percent = abs((price / avg_competitor - 1) * 100)
            if price_diff_percent <= 10:
                competitiveness_score = 30
            elif price_diff_percent <= 20:
                competitiveness_score = 20
            elif price_diff_percent <= 30:
                competitiveness_score = 10
            else:
                competitiveness_score = 5

            score += competitiveness_score
        else:
            score += 15  # Neutral score if no competitive data

        # Value score (0-30 points)
        value_created = market_data.get('value_created', price * 2)
        customer_roi = ((value_created - price) / price) if price > 0 else 0
        if customer_roi >= 2.0:  # 200% ROI
            value_score = 30
        elif customer_roi >= 1.0:  # 100% ROI
            value_score = 20
        elif customer_roi >= 0.5:  # 50% ROI
            value_score = 10
        else:
            value_score = 5

        score += value_score

        return score

    def _generate_optimization_rationale(
        self,
        best_option: Dict[str, Any],
        all_results: List[Dict[str, Any]],
        constraints: Dict[str, Any]
    ) -> List[str]:
        """Generate rationale for pricing optimization"""
        rationale = []

        rationale.append(
            f"Selected {best_option['model']} pricing model with score of {best_option['score']:.1f}/100"
        )

        rationale.append(
            f"Expected margin: {best_option['margin']:.1f}%"
        )

        price_range = max(r['price'] for r in all_results) - min(r['price'] for r in all_results)
        rationale.append(
            f"Price range across models: ${price_range:,.2f} "
            f"({(price_range / best_option['price'] * 100):.1f}% variation)"
        )

        if constraints:
            rationale.append(
                f"Pricing optimized within specified constraints"
            )

        return rationale

    def _determine_competitive_position(self, price: float, market_data: Dict[str, Any]) -> str:
        """Determine competitive position"""
        competitor_prices = market_data.get('competitor_prices', [])

        if not competitor_prices:
            return "unknown"

        avg_price = statistics.mean(competitor_prices)

        if price < avg_price * 0.85:
            return "economy"
        elif price < avg_price * 0.95:
            return "value"
        elif price <= avg_price * 1.05:
            return "competitive"
        elif price <= avg_price * 1.20:
            return "premium"
        else:
            return "luxury"

    def _assess_pricing_risk(
        self,
        pricing_option: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> str:
        """Assess pricing risk"""
        price = pricing_option['price']
        margin = pricing_option['margin']

        risk_factors = []

        # Low margin risk
        if margin < 25:
            risk_factors.append("low_margin")

        # Competitive risk
        competitor_prices = market_data.get('competitor_prices', [])
        if competitor_prices:
            avg_price = statistics.mean(competitor_prices)
            if price > avg_price * 1.30:
                risk_factors.append("above_market")
            elif price < avg_price * 0.70:
                risk_factors.append("below_market")

        # Market sensitivity risk
        price_sensitivity = market_data.get('price_sensitivity', 'moderate')
        if price_sensitivity in ['high', 'very_high'] and margin > 40:
            risk_factors.append("high_sensitivity")

        if not risk_factors:
            return "low"
        elif len(risk_factors) == 1:
            return "moderate"
        else:
            return "high"

    # ==================== PRICE ELASTICITY ====================

    def calculate_price_elasticity(
        self,
        service_id: str,
        price_points: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate price elasticity of demand

        Args:
            service_id: Service identifier
            price_points: Historical price and demand data points

        Returns:
            Price elasticity analysis with recommendations
        """
        try:
            logger.info(f"Calculating price elasticity for {service_id}")

            if len(price_points) < 2:
                return {"error": "Need at least 2 price points", "status": "failed"}

            # Calculate elasticity between consecutive points
            elasticities = []

            for i in range(1, len(price_points)):
                prev_point = price_points[i-1]
                curr_point = price_points[i]

                prev_price = prev_point.get('price', 0)
                curr_price = curr_point.get('price', 0)
                prev_demand = prev_point.get('demand', 0)
                curr_demand = curr_point.get('demand', 0)

                if prev_price > 0 and prev_demand > 0:
                    price_change_percent = ((curr_price - prev_price) / prev_price) * 100
                    demand_change_percent = ((curr_demand - prev_demand) / prev_demand) * 100

                    if price_change_percent != 0:
                        elasticity = demand_change_percent / price_change_percent

                        elasticities.append({
                            "elasticity": elasticity,
                            "price_change": price_change_percent,
                            "demand_change": demand_change_percent,
                            "from_price": prev_price,
                            "to_price": curr_price
                        })

            if not elasticities:
                return {"error": "Could not calculate elasticity", "status": "failed"}

            # Average elasticity
            avg_elasticity = statistics.mean([e['elasticity'] for e in elasticities])

            # Classify elasticity
            if abs(avg_elasticity) > 1.0:
                elasticity_type = "elastic"
                interpretation = "Demand is sensitive to price changes"
            elif abs(avg_elasticity) < 1.0:
                elasticity_type = "inelastic"
                interpretation = "Demand is relatively insensitive to price changes"
            else:
                elasticity_type = "unit_elastic"
                interpretation = "Demand changes proportionally with price"

            # Calculate optimal price adjustment
            optimal_adjustment = self._calculate_optimal_price_adjustment(avg_elasticity)

            # Revenue impact analysis
            current_price = price_points[-1].get('price', 0)
            revenue_impact = self._estimate_revenue_impact(
                current_price,
                optimal_adjustment,
                avg_elasticity
            )

            result = {
                "service_id": service_id,
                "analysis_date": datetime.now().isoformat(),
                "elasticity_coefficient": round(avg_elasticity, 3),
                "elasticity_type": elasticity_type,
                "interpretation": interpretation,
                "data_points_analyzed": len(elasticities),
                "optimal_price_adjustment": optimal_adjustment,
                "revenue_impact_estimate": revenue_impact,
                "pricing_recommendations": self._get_elasticity_recommendations(
                    avg_elasticity,
                    elasticity_type
                ),
                "detailed_elasticities": [
                    {
                        "elasticity": round(e['elasticity'], 3),
                        "price_change_percent": round(e['price_change'], 2),
                        "demand_change_percent": round(e['demand_change'], 2),
                        "from_price": e['from_price'],
                        "to_price": e['to_price']
                    }
                    for e in elasticities
                ]
            }

            self.pricing_history.append({
                "type": "elasticity_analysis",
                "service_id": service_id,
                "timestamp": datetime.now().isoformat(),
                "result": result
            })

            logger.info(f"Price elasticity calculated: {avg_elasticity:.3f} ({elasticity_type})")
            return result

        except Exception as e:
            logger.error(f"Error calculating price elasticity: {e}")
            return {"error": str(e), "service_id": service_id, "status": "failed"}

    def _calculate_optimal_price_adjustment(self, elasticity: float) -> Dict[str, Any]:
        """Calculate optimal price adjustment based on elasticity"""
        if abs(elasticity) < 1.0:
            # Inelastic: can increase price
            direction = "increase"
            percent = 10.0
            rationale = "Demand is inelastic - price increase will boost revenue"
        elif abs(elasticity) > 2.0:
            # Highly elastic: consider decreasing price
            direction = "decrease"
            percent = 5.0
            rationale = "Demand is highly elastic - small price decrease could significantly boost volume"
        else:
            # Moderately elastic: maintain current pricing
            direction = "maintain"
            percent = 0.0
            rationale = "Demand elasticity is near unit elastic - maintain current pricing"

        return {
            "direction": direction,
            "percent": percent,
            "rationale": rationale
        }

    def _estimate_revenue_impact(
        self,
        current_price: float,
        adjustment: Dict[str, Any],
        elasticity: float
    ) -> Dict[str, Any]:
        """Estimate revenue impact of price change"""
        direction = adjustment['direction']
        percent = adjustment['percent']

        if direction == "maintain":
            return {
                "estimated_change_percent": 0,
                "estimated_change_amount": 0,
                "confidence": "high"
            }

        # Calculate expected demand change
        price_change = percent if direction == "increase" else -percent
        demand_change = elasticity * price_change

        # Revenue change = (1 + price_change%) * (1 + demand_change%) - 1
        revenue_multiplier = (1 + price_change / 100) * (1 + demand_change / 100)
        revenue_change_percent = (revenue_multiplier - 1) * 100

        return {
            "estimated_change_percent": round(revenue_change_percent, 2),
            "estimated_change_amount": "calculated_from_current_revenue",
            "confidence": "moderate" if abs(elasticity) < 0.5 or abs(elasticity) > 2.0 else "high"
        }

    def _get_elasticity_recommendations(
        self,
        elasticity: float,
        elasticity_type: str
    ) -> List[str]:
        """Get recommendations based on elasticity"""
        recommendations = []

        if elasticity_type == "inelastic":
            recommendations.extend([
                "Consider price increase to improve margins",
                "Focus on value communication over price competition",
                "Invest in product differentiation",
                "Customers are less price-sensitive - emphasize quality"
            ])
        elif elasticity_type == "elastic":
            recommendations.extend([
                "Be cautious with price increases",
                "Consider volume-based discounts",
                "Monitor competitive pricing closely",
                "Small price reductions could drive significant volume"
            ])
        else:  # unit elastic
            recommendations.extend([
                "Maintain competitive pricing balance",
                "Focus on non-price differentiation",
                "Monitor market conditions for pricing opportunities",
                "Revenue relatively stable across price changes"
            ])

        return recommendations

    # ==================== UTILITY METHODS ====================

    def get_pricing_summary(self) -> Dict[str, Any]:
        """Get summary of all pricing activities"""
        analysis_types = {}
        for item in self.pricing_history:
            analysis_type = item.get('type', 'unknown')
            analysis_types[analysis_type] = analysis_types.get(analysis_type, 0) + 1

        return {
            "total_analyses": len(self.pricing_history),
            "analyses_by_type": analysis_types,
            "pricing_models_created": len(self.pricing_models),
            "last_activity": self.pricing_history[-1] if self.pricing_history else None,
            "agent_id": self.agent_id
        }

    def recommend_pricing_strategy(
        self,
        service_id: str,
        cost_data: Dict[str, Any],
        market_data: Dict[str, Any],
        business_objectives: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Recommend overall pricing strategy based on business objectives

        Args:
            service_id: Service identifier
            cost_data: Cost information
            market_data: Market conditions
            business_objectives: Business goals (market_share, profit_max, penetration, etc.)

        Returns:
            Strategic pricing recommendation
        """
        try:
            logger.info(f"Recommending pricing strategy for {service_id}")

            objectives = business_objectives or {}
            primary_objective = objectives.get('primary', 'profit_maximization')

            # Map objectives to pricing strategies
            strategy_map = {
                'profit_maximization': [PricingModel.VALUE_BASED, PricingModel.COST_PLUS],
                'market_share': [PricingModel.COMPETITIVE, PricingModel.PENETRATION],
                'revenue_growth': [PricingModel.DYNAMIC, PricingModel.VALUE_BASED],
                'market_penetration': [PricingModel.PENETRATION, PricingModel.COMPETITIVE],
                'premium_positioning': [PricingModel.VALUE_BASED, PricingModel.PSYCHOLOGICAL],
                'volume_maximization': [PricingModel.COMPETITIVE, PricingModel.DYNAMIC]
            }

            recommended_models = strategy_map.get(
                primary_objective,
                [PricingModel.VALUE_BASED, PricingModel.COST_PLUS]
            )

            # Generate recommendations for each model
            recommendations = []
            for model in recommended_models:
                result = self.create_pricing_model(service_id, model, cost_data, market_data)
                if 'error' not in result:
                    recommendations.append(result)

            if not recommendations:
                return {"error": "Failed to generate recommendations", "status": "failed"}

            # Select primary recommendation
            primary_rec = recommendations[0]

            strategy = {
                "service_id": service_id,
                "primary_objective": primary_objective,
                "recommended_strategy": recommended_models[0].value,
                "primary_recommendation": {
                    "price": primary_rec['pricing_result']['recommended_price'],
                    "model": primary_rec['model_type'],
                    "expected_margin": primary_rec['margin_analysis']['gross_margin_percent'],
                    "rationale": primary_rec['pricing_result'].get('rationale', [])
                },
                "alternative_strategies": [
                    {
                        "price": rec['pricing_result']['recommended_price'],
                        "model": rec['model_type'],
                        "expected_margin": rec['margin_analysis']['gross_margin_percent']
                    }
                    for rec in recommendations[1:]
                ],
                "implementation_plan": self._create_implementation_plan(
                    primary_rec,
                    primary_objective
                ),
                "success_metrics": self._define_success_metrics(primary_objective),
                "risks_and_mitigations": self._identify_pricing_risks_and_mitigations(
                    primary_rec,
                    market_data
                )
            }

            logger.info(f"Pricing strategy recommended: {recommended_models[0].value}")
            return strategy

        except Exception as e:
            logger.error(f"Error recommending pricing strategy: {e}")
            return {"error": str(e), "service_id": service_id, "status": "failed"}

    def _create_implementation_plan(
        self,
        recommendation: Dict[str, Any],
        objective: str
    ) -> List[Dict[str, Any]]:
        """Create pricing implementation plan"""
        return [
            {
                "phase": "Preparation",
                "duration": "1-2 weeks",
                "activities": [
                    "Finalize pricing model and calculations",
                    "Prepare sales team materials and training",
                    "Update pricing in systems and materials",
                    "Set up monitoring and tracking"
                ]
            },
            {
                "phase": "Launch",
                "duration": "1 week",
                "activities": [
                    "Announce new pricing to internal teams",
                    "Update website and marketing materials",
                    "Brief sales team on positioning and objection handling",
                    "Begin customer communications"
                ]
            },
            {
                "phase": "Monitor",
                "duration": "Ongoing",
                "activities": [
                    "Track sales conversion rates",
                    "Monitor customer feedback and objections",
                    "Analyze competitive responses",
                    "Measure against success metrics"
                ]
            },
            {
                "phase": "Optimize",
                "duration": "Monthly review",
                "activities": [
                    "Review performance vs. targets",
                    "Adjust pricing if needed",
                    "Refine value messaging",
                    "Update competitive intelligence"
                ]
            }
        ]

    def _define_success_metrics(self, objective: str) -> List[Dict[str, Any]]:
        """Define success metrics based on objective"""
        metrics_map = {
            'profit_maximization': [
                {"metric": "Gross Profit Margin", "target": ">40%", "frequency": "Monthly"},
                {"metric": "Average Deal Size", "target": "+15% vs baseline", "frequency": "Monthly"},
                {"metric": "Win Rate", "target": ">30%", "frequency": "Weekly"}
            ],
            'market_share': [
                {"metric": "Market Share", "target": "+5 points YoY", "frequency": "Quarterly"},
                {"metric": "New Customer Acquisition", "target": "+25% vs prior period", "frequency": "Monthly"},
                {"metric": "Deal Volume", "target": "+30% vs baseline", "frequency": "Monthly"}
            ],
            'revenue_growth': [
                {"metric": "Revenue Growth Rate", "target": "+20% YoY", "frequency": "Monthly"},
                {"metric": "Average Revenue Per Customer", "target": "+10% vs baseline", "frequency": "Monthly"},
                {"metric": "Customer Lifetime Value", "target": "+15% vs baseline", "frequency": "Quarterly"}
            ]
        }

        return metrics_map.get(objective, metrics_map['profit_maximization'])

    def _identify_pricing_risks_and_mitigations(
        self,
        recommendation: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Identify pricing risks and mitigation strategies"""
        risks = []

        # Price sensitivity risk
        price = recommendation['pricing_result']['recommended_price']
        competitor_prices = market_data.get('competitor_prices', [])

        if competitor_prices:
            avg_competitor = statistics.mean(competitor_prices)
            if price > avg_competitor * 1.2:
                risks.append({
                    "risk": "Above-market pricing may reduce win rate",
                    "probability": "Medium",
                    "mitigation": "Emphasize value differentiation and ROI; offer flexible terms"
                })

        # Margin risk
        margin = recommendation['margin_analysis']['gross_margin_percent']
        if margin < 30:
            risks.append({
                "risk": "Low margins limit pricing flexibility",
                "probability": "Medium",
                "mitigation": "Focus on cost reduction; increase operational efficiency"
            })

        # Competitive response risk
        risks.append({
            "risk": "Competitors may respond with price reductions",
            "probability": "Medium",
            "mitigation": "Monitor competitive pricing; prepare value-based counter-positioning"
        })

        # Market acceptance risk
        risks.append({
            "risk": "Market may not accept new pricing",
            "probability": "Low-Medium",
            "mitigation": "Conduct customer testing; phase implementation; maintain pricing flexibility"
        })

        return risks
