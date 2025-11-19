"""
Ads Manager Agent

Manages advertising campaigns with advanced optimization algorithms including CTR prediction,
budget allocation, A/B testing, audience segmentation, and bid strategy optimization.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import math
import hashlib
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AdPlatform(Enum):
    """Advertising platform enumeration."""
    FACEBOOK = "facebook"
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    PINTEREST = "pinterest"
    SNAPCHAT = "snapchat"


class BidStrategy(Enum):
    """Bid strategy types."""
    CPC = "cpc"  # Cost Per Click
    CPM = "cpm"  # Cost Per Mille (1000 impressions)
    CPA = "cpa"  # Cost Per Acquisition
    ROAS = "roas"  # Return on Ad Spend
    TARGET_COST = "target_cost"
    MAXIMIZE_CONVERSIONS = "maximize_conversions"


class CampaignObjective(Enum):
    """Campaign objective types."""
    AWARENESS = "awareness"
    TRAFFIC = "traffic"
    ENGAGEMENT = "engagement"
    LEADS = "leads"
    CONVERSIONS = "conversions"
    SALES = "sales"
    APP_INSTALLS = "app_installs"
    VIDEO_VIEWS = "video_views"


class AudienceSegmentType(Enum):
    """Audience segmentation types."""
    DEMOGRAPHIC = "demographic"
    BEHAVIORAL = "behavioral"
    PSYCHOGRAPHIC = "psychographic"
    GEOGRAPHIC = "geographic"
    CUSTOM = "custom"
    LOOKALIKE = "lookalike"


class AdsManagerAgent:
    """Ads Manager Agent for managing and optimizing advertising campaigns."""

    # Platform-specific CTR baselines
    PLATFORM_CTR_BASELINES = {
        AdPlatform.FACEBOOK: 0.009,  # 0.9%
        AdPlatform.GOOGLE: 0.0317,  # 3.17%
        AdPlatform.LINKEDIN: 0.0039,  # 0.39%
        AdPlatform.TWITTER: 0.0086,  # 0.86%
        AdPlatform.INSTAGRAM: 0.0058,  # 0.58%
        AdPlatform.TIKTOK: 0.0152,  # 1.52%
        AdPlatform.PINTEREST: 0.0027,  # 0.27%
        AdPlatform.SNAPCHAT: 0.0055,  # 0.55%
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Ads Manager Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.agent_id = "ads_manager_001"
        self.config = config or {}
        self.campaigns: List[Dict[str, Any]] = []
        self.name = "Ads Manager"
        self.role = "Advertising Campaign Management"
        self.performance_history: List[Dict[str, Any]] = []
        self.audience_segments: Dict[str, Dict[str, Any]] = {}
        self.ab_tests: List[Dict[str, Any]] = []

        logger.info(f"AdsManagerAgent {self.agent_id} initialized")

    def create_campaign(
        self,
        platform: str,
        budget: float,
        objective: str,
        target_audience: Optional[Dict[str, Any]] = None,
        duration_days: int = 30
    ) -> Dict[str, Any]:
        """Create an advertising campaign.

        Args:
            platform: Advertising platform
            budget: Total campaign budget
            objective: Campaign objective
            target_audience: Target audience parameters
            duration_days: Campaign duration in days

        Returns:
            Campaign details
        """
        try:
            # Validate platform
            platform_enum = AdPlatform(platform.lower())
            objective_enum = CampaignObjective(objective.lower())

            campaign_id = f"campaign_{hashlib.md5(f'{platform}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            # Calculate daily budget
            daily_budget = budget / duration_days

            campaign = {
                "campaign_id": campaign_id,
                "platform": platform_enum.value,
                "budget": budget,
                "daily_budget": daily_budget,
                "spent": 0.0,
                "objective": objective_enum.value,
                "target_audience": target_audience or {},
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "start_date": datetime.now().isoformat(),
                "end_date": (datetime.now() + timedelta(days=duration_days)).isoformat(),
                "duration_days": duration_days,
                "metrics": {
                    "impressions": 0,
                    "clicks": 0,
                    "conversions": 0,
                    "revenue": 0.0
                }
            }

            self.campaigns.append(campaign)
            logger.info(f"Campaign {campaign_id} created for {platform_enum.value}")

            return campaign

        except ValueError as e:
            logger.error(f"Invalid platform or objective: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating campaign: {e}")
            raise

    def predict_ctr(
        self,
        platform: str,
        ad_creative_score: float,
        audience_relevance: float,
        ad_position: int = 1,
        historical_ctr: Optional[float] = None
    ) -> Dict[str, Any]:
        """Predict Click-Through Rate using multi-factor model.

        Args:
            platform: Advertising platform
            ad_creative_score: Creative quality score (0-100)
            audience_relevance: Audience relevance score (0-100)
            ad_position: Ad position (1-10)
            historical_ctr: Historical CTR if available

        Returns:
            CTR prediction with confidence interval
        """
        try:
            platform_enum = AdPlatform(platform.lower())
            baseline_ctr = self.PLATFORM_CTR_BASELINES[platform_enum]

            # Normalize inputs
            creative_factor = ad_creative_score / 100.0
            relevance_factor = audience_relevance / 100.0

            # Position decay factor (exponential decay)
            position_factor = math.exp(-0.15 * (ad_position - 1))

            # CTR prediction formula
            predicted_ctr = baseline_ctr * (
                1.0 +
                (creative_factor - 0.5) * 0.8 +  # Creative impact
                (relevance_factor - 0.5) * 1.2 +  # Relevance impact
                (position_factor - 0.5) * 0.6     # Position impact
            )

            # Apply historical CTR if available (weighted average)
            if historical_ctr is not None and historical_ctr > 0:
                predicted_ctr = 0.6 * predicted_ctr + 0.4 * historical_ctr

            # Ensure CTR is within reasonable bounds
            predicted_ctr = max(0.0001, min(0.20, predicted_ctr))

            # Calculate confidence interval (95%)
            standard_error = predicted_ctr * 0.15  # 15% standard error
            confidence_interval = {
                "lower": max(0.0001, predicted_ctr - 1.96 * standard_error),
                "upper": min(0.20, predicted_ctr + 1.96 * standard_error)
            }

            result = {
                "platform": platform_enum.value,
                "predicted_ctr": round(predicted_ctr, 5),
                "predicted_ctr_percentage": round(predicted_ctr * 100, 2),
                "baseline_ctr": baseline_ctr,
                "confidence_interval": {
                    "lower": round(confidence_interval["lower"], 5),
                    "upper": round(confidence_interval["upper"], 5)
                },
                "factors": {
                    "creative_score": ad_creative_score,
                    "audience_relevance": audience_relevance,
                    "ad_position": ad_position,
                    "position_factor": round(position_factor, 3)
                },
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"CTR predicted for {platform_enum.value}: {predicted_ctr:.4%}")
            return result

        except Exception as e:
            logger.error(f"Error predicting CTR: {e}")
            raise

    def allocate_budget(
        self,
        total_budget: float,
        campaigns: List[Dict[str, Any]],
        optimization_goal: str = "roi"
    ) -> Dict[str, Any]:
        """Allocate budget across campaigns using ROI-based optimization.

        Args:
            total_budget: Total budget to allocate
            campaigns: List of campaign performance data
            optimization_goal: Optimization goal (roi, conversions, revenue)

        Returns:
            Budget allocation recommendations
        """
        try:
            if not campaigns:
                raise ValueError("No campaigns provided for budget allocation")

            allocations = []
            total_score = 0.0

            # Calculate performance scores
            for campaign in campaigns:
                if optimization_goal == "roi":
                    # ROI = (Revenue - Cost) / Cost
                    cost = campaign.get("spent", 1.0)
                    revenue = campaign.get("revenue", 0.0)
                    score = (revenue - cost) / cost if cost > 0 else 0.0
                elif optimization_goal == "conversions":
                    score = campaign.get("conversions", 0.0)
                elif optimization_goal == "revenue":
                    score = campaign.get("revenue", 0.0)
                else:
                    score = campaign.get("impressions", 0.0)

                # Apply recency weight (favor recent performance)
                days_old = (datetime.now() - datetime.fromisoformat(
                    campaign.get("created_at", datetime.now().isoformat())
                )).days
                recency_weight = math.exp(-0.05 * days_old)

                weighted_score = max(0, score * recency_weight)
                total_score += weighted_score

                allocations.append({
                    "campaign_id": campaign.get("campaign_id"),
                    "campaign_name": campaign.get("name", "Unknown"),
                    "score": weighted_score,
                    "current_budget": campaign.get("budget", 0.0),
                    "current_spent": campaign.get("spent", 0.0)
                })

            # Allocate budget proportionally to scores
            if total_score > 0:
                for allocation in allocations:
                    allocation["recommended_budget"] = (
                        allocation["score"] / total_score
                    ) * total_budget
                    allocation["budget_change"] = (
                        allocation["recommended_budget"] - allocation["current_budget"]
                    )
                    allocation["budget_change_percentage"] = (
                        (allocation["budget_change"] / allocation["current_budget"] * 100)
                        if allocation["current_budget"] > 0 else 0.0
                    )
            else:
                # Equal distribution if no performance data
                equal_budget = total_budget / len(campaigns)
                for allocation in allocations:
                    allocation["recommended_budget"] = equal_budget
                    allocation["budget_change"] = equal_budget - allocation["current_budget"]

            result = {
                "total_budget": total_budget,
                "optimization_goal": optimization_goal,
                "allocations": sorted(
                    allocations,
                    key=lambda x: x["recommended_budget"],
                    reverse=True
                ),
                "total_allocated": sum(a["recommended_budget"] for a in allocations),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Budget allocated across {len(campaigns)} campaigns")
            return result

        except Exception as e:
            logger.error(f"Error allocating budget: {e}")
            raise

    def design_ab_test(
        self,
        test_name: str,
        variants: List[Dict[str, Any]],
        target_metric: str,
        baseline_ctr: float = 0.02,
        min_detectable_effect: float = 0.1,
        significance_level: float = 0.05,
        power: float = 0.8
    ) -> Dict[str, Any]:
        """Design A/B test with sample size calculation.

        Args:
            test_name: Name of the test
            variants: List of test variants
            target_metric: Metric to optimize (ctr, conversion_rate, etc)
            baseline_ctr: Baseline conversion rate
            min_detectable_effect: Minimum detectable effect (10% = 0.1)
            significance_level: Significance level (alpha)
            power: Statistical power (1 - beta)

        Returns:
            Test design with sample size requirements
        """
        try:
            # Calculate required sample size per variant
            # Using formula for proportions
            p1 = baseline_ctr
            p2 = baseline_ctr * (1 + min_detectable_effect)
            p_avg = (p1 + p2) / 2

            # Z-scores for alpha and beta
            z_alpha = 1.96  # for alpha = 0.05 (two-tailed)
            z_beta = 0.84   # for power = 0.8

            # Sample size calculation
            numerator = (z_alpha + z_beta) ** 2 * 2 * p_avg * (1 - p_avg)
            denominator = (p2 - p1) ** 2
            sample_size_per_variant = math.ceil(numerator / denominator)

            # Calculate test duration estimates
            estimated_daily_traffic = self.config.get("daily_traffic", 1000)
            traffic_per_variant = estimated_daily_traffic / len(variants)
            days_required = math.ceil(sample_size_per_variant / traffic_per_variant)

            test_id = f"abtest_{hashlib.md5(f'{test_name}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            test_design = {
                "test_id": test_id,
                "test_name": test_name,
                "variants": variants,
                "num_variants": len(variants),
                "target_metric": target_metric,
                "parameters": {
                    "baseline_rate": baseline_ctr,
                    "min_detectable_effect": min_detectable_effect,
                    "significance_level": significance_level,
                    "power": power
                },
                "sample_size": {
                    "per_variant": sample_size_per_variant,
                    "total": sample_size_per_variant * len(variants)
                },
                "duration": {
                    "days_required": days_required,
                    "estimated_start": datetime.now().isoformat(),
                    "estimated_end": (datetime.now() + timedelta(days=days_required)).isoformat()
                },
                "traffic_allocation": {
                    variant.get("name", f"Variant {i}"): round(100 / len(variants), 2)
                    for i, variant in enumerate(variants)
                },
                "status": "planned",
                "created_at": datetime.now().isoformat()
            }

            self.ab_tests.append(test_design)
            logger.info(f"A/B test designed: {test_name}, sample size: {sample_size_per_variant} per variant")

            return test_design

        except Exception as e:
            logger.error(f"Error designing A/B test: {e}")
            raise

    def analyze_test_results(
        self,
        test_id: str,
        variant_results: List[Dict[str, Any]],
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        """Analyze A/B test results with statistical significance testing.

        Args:
            test_id: Test identifier
            variant_results: Results for each variant
            confidence_level: Confidence level for significance testing

        Returns:
            Statistical analysis with winner determination
        """
        try:
            if len(variant_results) < 2:
                raise ValueError("At least 2 variants required for comparison")

            # Calculate metrics for each variant
            analyzed_variants = []
            for variant in variant_results:
                impressions = variant.get("impressions", 0)
                clicks = variant.get("clicks", 0)
                conversions = variant.get("conversions", 0)

                ctr = clicks / impressions if impressions > 0 else 0
                conversion_rate = conversions / clicks if clicks > 0 else 0

                analyzed_variants.append({
                    "name": variant.get("name"),
                    "impressions": impressions,
                    "clicks": clicks,
                    "conversions": conversions,
                    "ctr": ctr,
                    "conversion_rate": conversion_rate
                })

            # Perform pairwise z-tests (comparing all variants to control)
            control = analyzed_variants[0]
            comparisons = []

            for i, variant in enumerate(analyzed_variants[1:], 1):
                # Z-test for proportions
                p1 = control["ctr"]
                p2 = variant["ctr"]
                n1 = control["impressions"]
                n2 = variant["impressions"]

                # Pooled proportion
                p_pooled = (control["clicks"] + variant["clicks"]) / (n1 + n2) if (n1 + n2) > 0 else 0

                # Standard error
                se = math.sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2)) if (n1 > 0 and n2 > 0) else 1

                # Z-score
                z_score = (p2 - p1) / se if se > 0 else 0

                # P-value (two-tailed)
                from math import erf
                p_value = 2 * (1 - 0.5 * (1 + erf(abs(z_score) / math.sqrt(2))))

                # Determine significance
                is_significant = p_value < (1 - confidence_level)

                # Calculate lift
                lift = ((p2 - p1) / p1 * 100) if p1 > 0 else 0

                comparisons.append({
                    "control": control["name"],
                    "variant": variant["name"],
                    "control_ctr": round(p1, 5),
                    "variant_ctr": round(p2, 5),
                    "lift_percentage": round(lift, 2),
                    "z_score": round(z_score, 4),
                    "p_value": round(p_value, 6),
                    "is_significant": is_significant,
                    "confidence_level": confidence_level
                })

            # Determine winner
            best_variant = max(analyzed_variants, key=lambda x: x["ctr"])
            significant_improvements = [c for c in comparisons if c["is_significant"] and c["lift_percentage"] > 0]

            result = {
                "test_id": test_id,
                "variants": analyzed_variants,
                "comparisons": comparisons,
                "winner": {
                    "variant": best_variant["name"],
                    "ctr": round(best_variant["ctr"], 5),
                    "is_significant": len(significant_improvements) > 0
                },
                "recommendations": self._generate_test_recommendations(comparisons, analyzed_variants),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Test {test_id} analyzed, winner: {best_variant['name']}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing test results: {e}")
            raise

    def _generate_test_recommendations(
        self,
        comparisons: List[Dict[str, Any]],
        variants: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []

        significant_count = sum(1 for c in comparisons if c["is_significant"])

        if significant_count == 0:
            recommendations.append("No statistically significant differences found. Consider running test longer or increasing sample size.")
        else:
            best_lift = max(comparisons, key=lambda x: x["lift_percentage"])
            if best_lift["is_significant"]:
                recommendations.append(
                    f"Implement {best_lift['variant']} - shows {best_lift['lift_percentage']:.1f}% lift with statistical significance."
                )

        # Check for low CTR across all variants
        avg_ctr = sum(v["ctr"] for v in variants) / len(variants)
        if avg_ctr < 0.01:
            recommendations.append("Overall CTR is low across all variants. Consider revising ad creative or targeting.")

        return recommendations

    def segment_audience(
        self,
        segment_name: str,
        segment_type: str,
        criteria: Dict[str, Any],
        estimated_size: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create audience segment with scoring.

        Args:
            segment_name: Name of the segment
            segment_type: Type of segmentation
            criteria: Segmentation criteria
            estimated_size: Estimated audience size

        Returns:
            Segment details with quality score
        """
        try:
            segment_type_enum = AudienceSegmentType(segment_type.lower())

            segment_id = f"segment_{hashlib.md5(f'{segment_name}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            # Calculate segment quality score
            quality_score = self._calculate_segment_quality(criteria, segment_type_enum)

            segment = {
                "segment_id": segment_id,
                "name": segment_name,
                "type": segment_type_enum.value,
                "criteria": criteria,
                "estimated_size": estimated_size or self._estimate_segment_size(criteria),
                "quality_score": quality_score,
                "created_at": datetime.now().isoformat(),
                "status": "active"
            }

            self.audience_segments[segment_id] = segment
            logger.info(f"Audience segment created: {segment_name}, quality score: {quality_score}")

            return segment

        except ValueError as e:
            logger.error(f"Invalid segment type: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating audience segment: {e}")
            raise

    def _calculate_segment_quality(
        self,
        criteria: Dict[str, Any],
        segment_type: AudienceSegmentType
    ) -> float:
        """Calculate quality score for audience segment."""
        score = 50.0  # Base score

        # Specificity score (more criteria = higher specificity)
        num_criteria = len(criteria)
        specificity_score = min(30, num_criteria * 5)
        score += specificity_score

        # Type-specific bonuses
        if segment_type == AudienceSegmentType.BEHAVIORAL:
            score += 10  # Behavioral is highly valuable
        elif segment_type == AudienceSegmentType.PSYCHOGRAPHIC:
            score += 15  # Psychographic is most valuable

        # Demographic completeness
        if segment_type == AudienceSegmentType.DEMOGRAPHIC:
            demographic_fields = ["age", "gender", "income", "education", "location"]
            completeness = sum(1 for field in demographic_fields if field in criteria)
            score += (completeness / len(demographic_fields)) * 20

        return min(100, max(0, score))

    def _estimate_segment_size(self, criteria: Dict[str, Any]) -> int:
        """Estimate audience segment size based on criteria."""
        # Simple estimation based on specificity
        base_size = 1000000
        reduction_factor = len(criteria) * 0.2
        estimated_size = int(base_size * math.exp(-reduction_factor))
        return max(1000, estimated_size)

    def optimize_bid_strategy(
        self,
        campaign_id: str,
        current_bid: float,
        target_cpa: Optional[float] = None,
        target_roas: Optional[float] = None,
        performance_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Optimize bid strategy based on performance data.

        Args:
            campaign_id: Campaign identifier
            current_bid: Current bid amount
            target_cpa: Target cost per acquisition
            target_roas: Target return on ad spend
            performance_data: Historical performance data

        Returns:
            Bid optimization recommendations
        """
        try:
            performance_data = performance_data or {}

            # Get current metrics
            current_cpa = performance_data.get("cpa", 0.0)
            current_roas = performance_data.get("roas", 0.0)
            conversion_rate = performance_data.get("conversion_rate", 0.02)

            recommendations = []
            recommended_bid = current_bid

            # CPA-based optimization
            if target_cpa is not None and current_cpa > 0:
                if current_cpa > target_cpa * 1.1:  # 10% over target
                    # Decrease bid
                    bid_adjustment = -((current_cpa - target_cpa) / target_cpa) * 0.5
                    recommended_bid = current_bid * (1 + bid_adjustment)
                    recommendations.append(
                        f"Decrease bid by {abs(bid_adjustment)*100:.1f}% to meet CPA target"
                    )
                elif current_cpa < target_cpa * 0.8:  # 20% under target
                    # Increase bid to gain more volume
                    bid_adjustment = ((target_cpa - current_cpa) / target_cpa) * 0.3
                    recommended_bid = current_bid * (1 + bid_adjustment)
                    recommendations.append(
                        f"Increase bid by {bid_adjustment*100:.1f}% to maximize volume within CPA target"
                    )

            # ROAS-based optimization
            if target_roas is not None and current_roas > 0:
                if current_roas < target_roas * 0.9:  # 10% below target
                    # Decrease bid to improve efficiency
                    bid_adjustment = -((target_roas - current_roas) / target_roas) * 0.4
                    recommended_bid = current_bid * (1 + bid_adjustment)
                    recommendations.append(
                        f"Decrease bid to improve ROAS efficiency"
                    )
                elif current_roas > target_roas * 1.2:  # 20% above target
                    # Increase bid for more volume
                    bid_adjustment = 0.15
                    recommended_bid = current_bid * (1 + bid_adjustment)
                    recommendations.append(
                        f"Increase bid to scale while maintaining ROAS target"
                    )

            # Ensure bid is within reasonable bounds
            min_bid = current_bid * 0.5
            max_bid = current_bid * 2.0
            recommended_bid = max(min_bid, min(max_bid, recommended_bid))

            # Determine recommended strategy
            if target_cpa is not None:
                strategy = BidStrategy.CPA
            elif target_roas is not None:
                strategy = BidStrategy.ROAS
            else:
                strategy = BidStrategy.CPC

            result = {
                "campaign_id": campaign_id,
                "current_bid": current_bid,
                "recommended_bid": round(recommended_bid, 2),
                "bid_change": round(recommended_bid - current_bid, 2),
                "bid_change_percentage": round((recommended_bid - current_bid) / current_bid * 100, 2),
                "recommended_strategy": strategy.value,
                "current_performance": {
                    "cpa": current_cpa,
                    "roas": current_roas,
                    "conversion_rate": conversion_rate
                },
                "targets": {
                    "target_cpa": target_cpa,
                    "target_roas": target_roas
                },
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Bid strategy optimized for campaign {campaign_id}")
            return result

        except Exception as e:
            logger.error(f"Error optimizing bid strategy: {e}")
            raise

    def calculate_roas(
        self,
        campaign_id: str,
        revenue: float,
        ad_spend: float,
        additional_costs: Optional[float] = None
    ) -> Dict[str, Any]:
        """Calculate Return on Ad Spend (ROAS).

        Args:
            campaign_id: Campaign identifier
            revenue: Revenue generated
            ad_spend: Advertising spend
            additional_costs: Additional costs (shipping, processing, etc.)

        Returns:
            ROAS calculation with profitability metrics
        """
        try:
            total_costs = ad_spend + (additional_costs or 0)

            if total_costs == 0:
                raise ValueError("Total costs cannot be zero")

            roas = revenue / ad_spend
            roi = ((revenue - total_costs) / total_costs) * 100
            profit = revenue - total_costs
            profit_margin = (profit / revenue * 100) if revenue > 0 else 0

            # Determine performance rating
            if roas >= 4.0:
                rating = "Excellent"
            elif roas >= 2.5:
                rating = "Good"
            elif roas >= 1.5:
                rating = "Fair"
            elif roas >= 1.0:
                rating = "Break-even"
            else:
                rating = "Poor"

            result = {
                "campaign_id": campaign_id,
                "revenue": revenue,
                "ad_spend": ad_spend,
                "additional_costs": additional_costs or 0,
                "total_costs": total_costs,
                "roas": round(roas, 2),
                "roi_percentage": round(roi, 2),
                "profit": round(profit, 2),
                "profit_margin_percentage": round(profit_margin, 2),
                "rating": rating,
                "breakeven_revenue": total_costs,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"ROAS calculated for campaign {campaign_id}: {roas:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error calculating ROAS: {e}")
            raise

    def monitor_campaign_pacing(
        self,
        campaign_id: str,
        budget: float,
        spent: float,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """Monitor campaign budget pacing.

        Args:
            campaign_id: Campaign identifier
            budget: Total campaign budget
            spent: Amount spent so far
            start_date: Campaign start date
            end_date: Campaign end date

        Returns:
            Pacing analysis with recommendations
        """
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            now = datetime.now()

            # Calculate time progress
            total_duration = (end - start).total_seconds()
            elapsed = (now - start).total_seconds()
            remaining = (end - now).total_seconds()

            if total_duration <= 0:
                raise ValueError("Invalid campaign duration")

            time_progress_pct = (elapsed / total_duration) * 100
            budget_progress_pct = (spent / budget) * 100 if budget > 0 else 0

            # Calculate pacing metrics
            expected_spend = budget * (elapsed / total_duration)
            spend_variance = spent - expected_spend
            spend_variance_pct = (spend_variance / expected_spend * 100) if expected_spend > 0 else 0

            # Determine pacing status
            if spend_variance_pct > 15:
                pacing_status = "overpacing"
                alert_level = "high"
            elif spend_variance_pct > 5:
                pacing_status = "slightly_overpacing"
                alert_level = "medium"
            elif spend_variance_pct < -15:
                pacing_status = "underpacing"
                alert_level = "high"
            elif spend_variance_pct < -5:
                pacing_status = "slightly_underpacing"
                alert_level = "medium"
            else:
                pacing_status = "on_pace"
                alert_level = "low"

            # Calculate daily budget recommendations
            remaining_budget = budget - spent
            remaining_days = max(1, remaining / (24 * 3600))
            recommended_daily_budget = remaining_budget / remaining_days

            # Generate recommendations
            recommendations = []
            if pacing_status == "overpacing":
                recommendations.append("Reduce daily budget to avoid early budget depletion")
                recommendations.append(f"Recommended daily budget: ${recommended_daily_budget:.2f}")
            elif pacing_status == "underpacing":
                recommendations.append("Increase daily budget to fully utilize campaign budget")
                recommendations.append(f"Recommended daily budget: ${recommended_daily_budget:.2f}")
                recommendations.append("Consider expanding targeting or increasing bids")

            result = {
                "campaign_id": campaign_id,
                "budget": budget,
                "spent": spent,
                "remaining_budget": remaining_budget,
                "time_progress_percentage": round(time_progress_pct, 2),
                "budget_progress_percentage": round(budget_progress_pct, 2),
                "expected_spend": round(expected_spend, 2),
                "spend_variance": round(spend_variance, 2),
                "spend_variance_percentage": round(spend_variance_pct, 2),
                "pacing_status": pacing_status,
                "alert_level": alert_level,
                "recommended_daily_budget": round(recommended_daily_budget, 2),
                "days_remaining": round(remaining_days, 1),
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Campaign pacing monitored: {campaign_id}, status: {pacing_status}")
            return result

        except Exception as e:
            logger.error(f"Error monitoring campaign pacing: {e}")
            raise

    def optimize_ad_creative(
        self,
        campaign_id: str,
        creatives: List[Dict[str, Any]],
        performance_threshold: float = 0.02
    ) -> Dict[str, Any]:
        """Optimize ad creative based on performance.

        Args:
            campaign_id: Campaign identifier
            creatives: List of creative variants with performance data
            performance_threshold: Minimum acceptable CTR

        Returns:
            Creative optimization recommendations
        """
        try:
            analyzed_creatives = []

            for creative in creatives:
                impressions = creative.get("impressions", 0)
                clicks = creative.get("clicks", 0)
                conversions = creative.get("conversions", 0)
                spend = creative.get("spend", 0)

                ctr = clicks / impressions if impressions > 0 else 0
                cvr = conversions / clicks if clicks > 0 else 0
                cpc = spend / clicks if clicks > 0 else 0
                cpa = spend / conversions if conversions > 0 else 0

                # Calculate performance score
                performance_score = (
                    (ctr / performance_threshold) * 40 +  # CTR weight
                    (cvr / 0.05) * 30 +  # CVR weight (assuming 5% baseline)
                    min(20, (1 / cpa) * 100) if cpa > 0 else 0  # CPA weight
                )

                status = "keep" if ctr >= performance_threshold else "pause"

                analyzed_creatives.append({
                    "creative_id": creative.get("creative_id"),
                    "name": creative.get("name"),
                    "impressions": impressions,
                    "clicks": clicks,
                    "conversions": conversions,
                    "ctr": round(ctr, 5),
                    "cvr": round(cvr, 5),
                    "cpc": round(cpc, 2),
                    "cpa": round(cpa, 2),
                    "performance_score": round(min(100, performance_score), 2),
                    "status": status
                })

            # Sort by performance score
            analyzed_creatives.sort(key=lambda x: x["performance_score"], reverse=True)

            # Generate recommendations
            top_performers = [c for c in analyzed_creatives if c["performance_score"] >= 70]
            poor_performers = [c for c in analyzed_creatives if c["performance_score"] < 40]

            recommendations = []
            if top_performers:
                recommendations.append(
                    f"Allocate more budget to top {len(top_performers)} performing creative(s)"
                )
            if poor_performers:
                recommendations.append(
                    f"Pause or replace {len(poor_performers)} poor performing creative(s)"
                )

            # Identify best elements
            best_creative = analyzed_creatives[0] if analyzed_creatives else None

            result = {
                "campaign_id": campaign_id,
                "total_creatives": len(creatives),
                "creatives": analyzed_creatives,
                "best_creative": best_creative,
                "top_performers": top_performers,
                "poor_performers": poor_performers,
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Ad creative optimized for campaign {campaign_id}")
            return result

        except Exception as e:
            logger.error(f"Error optimizing ad creative: {e}")
            raise

    def create_ad_creative(
        self,
        campaign_id: str,
        creative_type: str,
        headline: str,
        description: str,
        call_to_action: str,
        image_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create ad creative for campaign.

        Args:
            campaign_id: Campaign identifier
            creative_type: Type of creative (image, video, carousel, etc)
            headline: Ad headline
            description: Ad description
            call_to_action: Call to action text
            image_url: URL to creative image

        Returns:
            Creative details
        """
        try:
            creative_id = f"creative_{hashlib.md5(f'{campaign_id}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            # Validate headline and description lengths
            if len(headline) > 100:
                raise ValueError("Headline exceeds maximum length of 100 characters")
            if len(description) > 300:
                raise ValueError("Description exceeds maximum length of 300 characters")

            creative = {
                "creative_id": creative_id,
                "campaign_id": campaign_id,
                "type": creative_type,
                "content": {
                    "headline": headline,
                    "description": description,
                    "call_to_action": call_to_action,
                    "image_url": image_url
                },
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "metrics": {
                    "impressions": 0,
                    "clicks": 0,
                    "conversions": 0
                }
            }

            logger.info(f"Ad creative created: {creative_id}")
            return creative

        except Exception as e:
            logger.error(f"Error creating ad creative: {e}")
            raise

    def analyze_performance(
        self,
        campaign_id: str,
        metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Analyze campaign performance with detailed metrics.

        Args:
            campaign_id: Campaign identifier
            metrics: Campaign metrics

        Returns:
            Performance analysis
        """
        try:
            # Find campaign
            campaign = next((c for c in self.campaigns if c["campaign_id"] == campaign_id), None)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")

            metrics = metrics or campaign.get("metrics", {})

            impressions = metrics.get("impressions", 0)
            clicks = metrics.get("clicks", 0)
            conversions = metrics.get("conversions", 0)
            revenue = metrics.get("revenue", 0.0)
            spent = campaign.get("spent", 0.0)

            # Calculate key metrics
            ctr = clicks / impressions if impressions > 0 else 0
            cvr = conversions / clicks if clicks > 0 else 0
            cpc = spent / clicks if clicks > 0 else 0
            cpa = spent / conversions if conversions > 0 else 0
            roas = revenue / spent if spent > 0 else 0

            # Get platform baseline
            platform = AdPlatform(campaign.get("platform", "facebook"))
            baseline_ctr = self.PLATFORM_CTR_BASELINES[platform]

            # Calculate performance vs baseline
            ctr_vs_baseline = ((ctr - baseline_ctr) / baseline_ctr * 100) if baseline_ctr > 0 else 0

            # Generate insights
            insights = []
            if ctr > baseline_ctr * 1.5:
                insights.append("CTR significantly above platform average - excellent creative performance")
            elif ctr < baseline_ctr * 0.5:
                insights.append("CTR below platform average - consider revising ad creative or targeting")

            if roas >= 4.0:
                insights.append("Excellent ROAS - consider scaling campaign budget")
            elif roas < 1.0:
                insights.append("ROAS below break-even - review targeting and bidding strategy")

            # Generate recommendations
            recommendations = []
            if ctr < baseline_ctr:
                recommendations.append("Test new ad creatives to improve CTR")
            if cvr < 0.02:
                recommendations.append("Optimize landing page to improve conversion rate")
            if cpc > 2.0:
                recommendations.append("Review bid strategy to reduce cost per click")

            result = {
                "campaign_id": campaign_id,
                "platform": platform.value,
                "metrics": {
                    "impressions": impressions,
                    "clicks": clicks,
                    "conversions": conversions,
                    "revenue": revenue,
                    "spent": spent,
                    "ctr": round(ctr, 5),
                    "cvr": round(cvr, 5),
                    "cpc": round(cpc, 2),
                    "cpa": round(cpa, 2),
                    "roas": round(roas, 2)
                },
                "benchmarks": {
                    "platform_avg_ctr": baseline_ctr,
                    "ctr_vs_baseline_percentage": round(ctr_vs_baseline, 2)
                },
                "insights": insights,
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Performance analyzed for campaign {campaign_id}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing performance: {e}")
            raise

    def get_campaign_summary(self, campaign_id: str) -> Dict[str, Any]:
        """Get comprehensive campaign summary.

        Args:
            campaign_id: Campaign identifier

        Returns:
            Campaign summary
        """
        try:
            campaign = next((c for c in self.campaigns if c["campaign_id"] == campaign_id), None)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")

            return {
                "campaign": campaign,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting campaign summary: {e}")
            raise
