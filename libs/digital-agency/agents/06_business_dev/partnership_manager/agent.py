"""
Partnership Manager Agent

Identifies, evaluates, and manages strategic partnerships.
Implements partner scoring, agreement tracking, and performance metrics.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
import hashlib
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


class PartnershipType(Enum):
    """Types of partnerships."""
    TECHNOLOGY = "technology"
    CHANNEL = "channel"
    STRATEGIC = "strategic"
    RESELLER = "reseller"
    REFERRAL = "referral"
    INTEGRATION = "integration"
    CO_MARKETING = "co_marketing"
    JOINT_VENTURE = "joint_venture"
    AFFILIATE = "affiliate"


class PartnerTier(Enum):
    """Partner tier classification."""
    PLATINUM = "platinum"  # Strategic, high-value
    GOLD = "gold"  # High-performing
    SILVER = "silver"  # Growing partners
    BRONZE = "bronze"  # New/developing
    PROSPECT = "prospect"  # Potential partners


class PartnerStatus(Enum):
    """Partnership lifecycle status."""
    PROSPECT = "prospect"
    EVALUATION = "evaluation"
    NEGOTIATION = "negotiation"
    ACTIVE = "active"
    PAUSED = "paused"
    CHURNED = "churned"
    REJECTED = "rejected"


class AgreementType(Enum):
    """Partnership agreement types."""
    MOU = "mou"  # Memorandum of Understanding
    NDA = "nda"  # Non-Disclosure Agreement
    MSA = "msa"  # Master Service Agreement
    RESELLER = "reseller"
    REFERRAL = "referral"
    REVENUE_SHARE = "revenue_share"
    LICENSING = "licensing"
    JOINT_VENTURE = "joint_venture"


@dataclass
class PartnerScore:
    """Comprehensive partner scoring result."""
    overall_score: int
    strategic_fit: int
    revenue_potential: int
    technical_compatibility: int
    market_alignment: int
    relationship_strength: int
    risk_score: int
    tier: PartnerTier
    confidence: float
    scores_breakdown: Dict[str, int] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)


@dataclass
class PartnershipAgreement:
    """Partnership agreement details."""
    agreement_id: str
    partner_id: str
    agreement_type: AgreementType
    start_date: datetime
    end_date: Optional[datetime]
    terms: Dict[str, Any]
    revenue_model: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    renewal_terms: Dict[str, Any]
    status: str
    signed_date: Optional[datetime] = None


@dataclass
class PartnerPerformance:
    """Partner performance metrics."""
    partner_id: str
    period_start: datetime
    period_end: datetime
    revenue_generated: float
    leads_referred: int
    deals_closed: int
    customer_satisfaction: float
    engagement_score: int
    roi: float
    growth_rate: float
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PartnerProfile:
    """Complete partner profile."""
    partner_id: str
    name: str
    partnership_type: PartnershipType
    tier: PartnerTier
    status: PartnerStatus
    score: int
    industry: str
    geography: List[str]
    company_size: int
    annual_revenue: float
    technologies: List[str]
    target_markets: List[str]
    capabilities: List[str]
    contacts: List[Dict[str, Any]]
    agreements: List[str]
    performance_history: List[PartnerPerformance]
    created_at: datetime
    last_updated: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


class PartnershipManagerAgent:
    """
    Production-grade Partnership Manager Agent.

    Identifies, evaluates, and manages strategic partnerships with advanced
    scoring algorithms, agreement tracking, performance monitoring, and
    relationship management capabilities.

    Features:
    - Multi-dimensional partner scoring
    - Partnership opportunity identification
    - Agreement lifecycle management
    - Performance tracking and analytics
    - Partner tier management
    - Revenue attribution modeling
    - Relationship health monitoring
    - Risk assessment and mitigation
    - Partner enablement tracking
    - ROI calculation and reporting
    - Automated partner matching
    - Ecosystem mapping integration
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Partnership Manager Agent.

        Args:
            config: Configuration dictionary with scoring weights, thresholds, etc.
        """
        self.config = config or {}
        self.name = "Partnership Manager"
        self.role = "Strategic Partnership Manager"
        self.goal = "Identify, evaluate, and manage high-value strategic partnerships"

        # Scoring thresholds
        self.platinum_threshold = self.config.get("platinum_threshold", 90)
        self.gold_threshold = self.config.get("gold_threshold", 75)
        self.silver_threshold = self.config.get("silver_threshold", 60)
        self.bronze_threshold = self.config.get("bronze_threshold", 40)

        # Partner storage
        self.partners: Dict[str, PartnerProfile] = {}
        self.agreements: Dict[str, PartnershipAgreement] = {}
        self.performance_data: Dict[str, List[PartnerPerformance]] = defaultdict(list)

        # Scoring weights
        self.scoring_weights = self._initialize_scoring_weights()

        # Revenue models
        self.revenue_models = self._initialize_revenue_models()

        # Partner matching criteria
        self.matching_criteria = self._initialize_matching_criteria()

        # Performance benchmarks
        self.performance_benchmarks = self._initialize_performance_benchmarks()

        logger.info("Partnership Manager initialized successfully")

    def _initialize_scoring_weights(self) -> Dict[str, float]:
        """Initialize partner scoring weights."""
        return self.config.get("scoring_weights", {
            "strategic_fit": 0.25,
            "revenue_potential": 0.25,
            "technical_compatibility": 0.20,
            "market_alignment": 0.15,
            "relationship_strength": 0.10,
            "risk_factor": 0.05
        })

    def _initialize_revenue_models(self) -> Dict[str, Dict[str, Any]]:
        """Initialize common revenue sharing models."""
        return {
            "revenue_share": {
                "type": "percentage",
                "default_split": {"partner": 0.20, "company": 0.80},
                "tiers": {
                    "platinum": 0.30,
                    "gold": 0.25,
                    "silver": 0.20,
                    "bronze": 0.15
                }
            },
            "referral_fee": {
                "type": "fixed_percentage",
                "default_rate": 0.10,
                "recurring": False
            },
            "reseller": {
                "type": "discount",
                "default_discount": 0.30,
                "volume_tiers": {
                    "10+": 0.35,
                    "50+": 0.40,
                    "100+": 0.45
                }
            }
        }

    def _initialize_matching_criteria(self) -> Dict[str, Any]:
        """Initialize partner matching criteria."""
        return {
            "industry_alignment": ["technology", "saas", "digital", "consulting"],
            "min_company_size": 10,
            "min_annual_revenue": 1000000,
            "geographic_overlap_required": True,
            "technology_compatibility_threshold": 0.7,
            "cultural_fit_threshold": 0.6
        }

    def _initialize_performance_benchmarks(self) -> Dict[str, Dict[str, float]]:
        """Initialize performance benchmarks by tier."""
        return {
            "platinum": {
                "min_quarterly_revenue": 100000,
                "min_leads_per_quarter": 50,
                "min_conversion_rate": 0.15,
                "min_engagement_score": 85,
                "min_customer_satisfaction": 4.5
            },
            "gold": {
                "min_quarterly_revenue": 50000,
                "min_leads_per_quarter": 25,
                "min_conversion_rate": 0.12,
                "min_engagement_score": 75,
                "min_customer_satisfaction": 4.0
            },
            "silver": {
                "min_quarterly_revenue": 20000,
                "min_leads_per_quarter": 10,
                "min_conversion_rate": 0.10,
                "min_engagement_score": 65,
                "min_customer_satisfaction": 3.5
            },
            "bronze": {
                "min_quarterly_revenue": 5000,
                "min_leads_per_quarter": 5,
                "min_conversion_rate": 0.08,
                "min_engagement_score": 50,
                "min_customer_satisfaction": 3.0
            }
        }

    def score_partner(self, partner_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score a potential or existing partner across multiple dimensions.

        Args:
            partner_data: Dictionary containing partner information

        Returns:
            Dictionary with comprehensive scoring results
        """
        try:
            logger.info("Starting partner scoring")

            if not partner_data:
                raise ValueError("Partner data cannot be empty")

            partner_id = partner_data.get("id") or partner_data.get("partner_id")
            if not partner_id:
                raise ValueError("Partner must have an ID")

            # Calculate individual dimension scores
            strategic_fit = self._score_strategic_fit(partner_data)
            revenue_potential = self._score_revenue_potential(partner_data)
            technical_compatibility = self._score_technical_compatibility(partner_data)
            market_alignment = self._score_market_alignment(partner_data)
            relationship_strength = self._score_relationship_strength(partner_data)
            risk_score = self._score_risk(partner_data)

            # Calculate weighted overall score
            weights = self.scoring_weights
            overall_score = int(round(
                strategic_fit * weights["strategic_fit"] +
                revenue_potential * weights["revenue_potential"] +
                technical_compatibility * weights["technical_compatibility"] +
                market_alignment * weights["market_alignment"] +
                relationship_strength * weights["relationship_strength"] -
                risk_score * weights["risk_factor"]
            ))

            # Ensure score is within bounds
            overall_score = max(0, min(100, overall_score))

            # Determine tier
            tier = self._determine_tier(overall_score)

            # Calculate confidence
            confidence = self._calculate_confidence(partner_data)

            # Generate recommendations
            recommendations = self._generate_recommendations(
                overall_score, tier, partner_data
            )

            result = {
                "success": True,
                "partner_id": partner_id,
                "overall_score": overall_score,
                "tier": tier.value,
                "confidence": confidence,
                "scores": {
                    "strategic_fit": strategic_fit,
                    "revenue_potential": revenue_potential,
                    "technical_compatibility": technical_compatibility,
                    "market_alignment": market_alignment,
                    "relationship_strength": relationship_strength,
                    "risk_score": risk_score
                },
                "recommendations": recommendations,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Partner scoring completed: {partner_id} scored {overall_score}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in score_partner: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in score_partner: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _score_strategic_fit(self, partner_data: Dict[str, Any]) -> int:
        """Score strategic fit (0-100)."""
        score = 0

        # Industry alignment
        industry = partner_data.get("industry", "").lower()
        target_industries = self.matching_criteria.get("industry_alignment", [])
        if industry in target_industries:
            score += 25

        # Business model compatibility
        partnership_type = partner_data.get("partnership_type", "")
        if partnership_type in ["strategic", "joint_venture", "technology"]:
            score += 25

        # Vision and goals alignment
        goals = partner_data.get("strategic_goals", [])
        if len(goals) >= 3:
            score += 20

        # Cultural fit
        cultural_fit = partner_data.get("cultural_fit_score", 0)
        score += int(cultural_fit * 0.30)

        return min(score, 100)

    def _score_revenue_potential(self, partner_data: Dict[str, Any]) -> int:
        """Score revenue potential (0-100)."""
        score = 0

        # Annual revenue size
        annual_revenue = partner_data.get("annual_revenue", 0)
        if annual_revenue >= 50000000:
            score += 30
        elif annual_revenue >= 10000000:
            score += 25
        elif annual_revenue >= 1000000:
            score += 20
        elif annual_revenue >= 100000:
            score += 10

        # Market reach
        geographies = partner_data.get("geographies", [])
        score += min(len(geographies) * 5, 20)

        # Customer base size
        customer_count = partner_data.get("customer_count", 0)
        if customer_count >= 10000:
            score += 25
        elif customer_count >= 1000:
            score += 20
        elif customer_count >= 100:
            score += 15

        # Growth rate
        growth_rate = partner_data.get("growth_rate", 0)
        score += min(int(growth_rate * 25), 25)

        return min(score, 100)

    def _score_technical_compatibility(self, partner_data: Dict[str, Any]) -> int:
        """Score technical compatibility (0-100)."""
        score = 50  # Base score

        # Technology stack overlap
        our_tech = set(self.config.get("our_technologies", []))
        partner_tech = set(partner_data.get("technologies", []))

        if our_tech and partner_tech:
            overlap = len(our_tech & partner_tech)
            total = len(our_tech | partner_tech)
            if total > 0:
                compatibility = overlap / total
                score += int(compatibility * 30)

        # Integration capabilities
        has_api = partner_data.get("has_api", False)
        if has_api:
            score += 10

        # Technical support quality
        tech_support_score = partner_data.get("tech_support_rating", 0)
        score += int(tech_support_score * 10)

        return min(score, 100)

    def _score_market_alignment(self, partner_data: Dict[str, Any]) -> int:
        """Score market alignment (0-100)."""
        score = 0

        # Target market overlap
        our_markets = set(self.config.get("target_markets", []))
        partner_markets = set(partner_data.get("target_markets", []))

        if our_markets and partner_markets:
            overlap = len(our_markets & partner_markets)
            score += min(overlap * 15, 40)

        # Geographic alignment
        our_geos = set(self.config.get("geographies", []))
        partner_geos = set(partner_data.get("geographies", []))

        if our_geos and partner_geos:
            geo_overlap = len(our_geos & partner_geos)
            score += min(geo_overlap * 10, 30)

        # Market position
        market_position = partner_data.get("market_position", "").lower()
        position_scores = {
            "leader": 30,
            "challenger": 25,
            "niche": 20,
            "emerging": 15
        }
        score += position_scores.get(market_position, 10)

        return min(score, 100)

    def _score_relationship_strength(self, partner_data: Dict[str, Any]) -> int:
        """Score relationship strength (0-100)."""
        score = 0

        # Existing relationship duration
        relationship_months = partner_data.get("relationship_duration_months", 0)
        score += min(relationship_months * 2, 25)

        # Number of touchpoints
        touchpoints = partner_data.get("touchpoint_count", 0)
        score += min(touchpoints * 3, 25)

        # Executive engagement
        has_executive_sponsor = partner_data.get("has_executive_sponsor", False)
        if has_executive_sponsor:
            score += 20

        # Past collaboration success
        past_projects = partner_data.get("successful_projects", 0)
        score += min(past_projects * 10, 30)

        return min(score, 100)

    def _score_risk(self, partner_data: Dict[str, Any]) -> int:
        """Score risk factors (0-100, higher = more risk)."""
        risk_score = 0

        # Financial stability risk
        debt_ratio = partner_data.get("debt_ratio", 0)
        if debt_ratio > 0.7:
            risk_score += 25
        elif debt_ratio > 0.5:
            risk_score += 15

        # Competitive risk
        is_competitor = partner_data.get("is_competitor", False)
        if is_competitor:
            risk_score += 30

        # Reputation risk
        reputation_score = partner_data.get("reputation_score", 100)
        if reputation_score < 50:
            risk_score += 25
        elif reputation_score < 70:
            risk_score += 15

        # Dependency risk
        customer_concentration = partner_data.get("customer_concentration", 0)
        if customer_concentration > 0.5:
            risk_score += 20

        return min(risk_score, 100)

    def _determine_tier(self, score: int) -> PartnerTier:
        """Determine partner tier based on score."""
        if score >= self.platinum_threshold:
            return PartnerTier.PLATINUM
        elif score >= self.gold_threshold:
            return PartnerTier.GOLD
        elif score >= self.silver_threshold:
            return PartnerTier.SILVER
        elif score >= self.bronze_threshold:
            return PartnerTier.BRONZE
        else:
            return PartnerTier.PROSPECT

    def _calculate_confidence(self, partner_data: Dict[str, Any]) -> float:
        """Calculate confidence score for the assessment."""
        # Based on data completeness
        required_fields = [
            "industry", "annual_revenue", "customer_count",
            "technologies", "geographies", "partnership_type"
        ]

        present_fields = sum(1 for field in required_fields if partner_data.get(field))
        confidence = present_fields / len(required_fields)

        # Adjust for data recency
        last_updated = partner_data.get("last_updated")
        if last_updated:
            try:
                updated_date = datetime.fromisoformat(last_updated)
                days_old = (datetime.utcnow() - updated_date).days
                if days_old > 180:
                    confidence *= 0.7
                elif days_old > 90:
                    confidence *= 0.85
            except:
                pass

        return round(confidence, 2)

    def _generate_recommendations(
        self, score: int, tier: PartnerTier, partner_data: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []

        if score >= 90:
            recommendations.append("High priority - initiate strategic partnership discussion")
            recommendations.append("Schedule executive-level meeting")
        elif score >= 75:
            recommendations.append("Strong candidate - proceed with partnership evaluation")
            recommendations.append("Conduct technical compatibility assessment")
        elif score >= 60:
            recommendations.append("Potential partner - continue relationship building")
        else:
            recommendations.append("Low priority - monitor for future opportunities")

        # Specific recommendations based on weak areas
        if partner_data.get("revenue_potential_score", 100) < 60:
            recommendations.append("Evaluate revenue upside potential before commitment")

        if partner_data.get("technical_compatibility_score", 100) < 60:
            recommendations.append("Conduct thorough technical integration assessment")

        if partner_data.get("risk_score", 0) > 50:
            recommendations.append("Implement risk mitigation strategies")

        return recommendations

    def create_agreement(
        self,
        partner_id: str,
        agreement_type: str,
        terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new partnership agreement.

        Args:
            partner_id: Partner identifier
            agreement_type: Type of agreement
            terms: Agreement terms and conditions

        Returns:
            Agreement creation result
        """
        try:
            logger.info(f"Creating agreement for partner {partner_id}")

            if not partner_id:
                raise ValueError("partner_id is required")
            if not agreement_type:
                raise ValueError("agreement_type is required")
            if not terms:
                raise ValueError("terms are required")

            # Generate agreement ID
            agreement_id = self._generate_agreement_id(partner_id, agreement_type)

            # Validate agreement type
            try:
                agreement_type_enum = AgreementType(agreement_type.lower())
            except ValueError:
                raise ValueError(f"Invalid agreement type: {agreement_type}")

            # Extract agreement details
            start_date = datetime.fromisoformat(terms.get("start_date")) if terms.get("start_date") else datetime.utcnow()
            end_date_str = terms.get("end_date")
            end_date = datetime.fromisoformat(end_date_str) if end_date_str else None

            # Create agreement
            agreement = PartnershipAgreement(
                agreement_id=agreement_id,
                partner_id=partner_id,
                agreement_type=agreement_type_enum,
                start_date=start_date,
                end_date=end_date,
                terms=terms,
                revenue_model=self._extract_revenue_model(terms),
                performance_metrics=self._extract_performance_metrics(terms),
                renewal_terms=terms.get("renewal_terms", {}),
                status="draft"
            )

            # Store agreement
            self.agreements[agreement_id] = agreement

            result = {
                "success": True,
                "agreement_id": agreement_id,
                "partner_id": partner_id,
                "agreement_type": agreement_type,
                "status": "draft",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat() if end_date else None,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Agreement created successfully: {agreement_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in create_agreement: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_agreement: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _generate_agreement_id(self, partner_id: str, agreement_type: str) -> str:
        """Generate unique agreement ID."""
        timestamp = datetime.utcnow().isoformat()
        raw_id = f"{partner_id}_{agreement_type}_{timestamp}"
        return hashlib.sha256(raw_id.encode()).hexdigest()[:16]

    def _extract_revenue_model(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Extract revenue model from agreement terms."""
        revenue_model = terms.get("revenue_model", {})

        if not revenue_model:
            # Set default based on agreement type
            revenue_model = {
                "type": "revenue_share",
                "details": self.revenue_models.get("revenue_share", {})
            }

        return revenue_model

    def _extract_performance_metrics(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Extract performance metrics from agreement terms."""
        return terms.get("performance_metrics", {
            "min_quarterly_revenue": 0,
            "min_leads_per_quarter": 0,
            "min_conversion_rate": 0,
            "review_frequency": "quarterly"
        })

    def track_performance(
        self,
        partner_id: str,
        period_start: str,
        period_end: str,
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Track partner performance for a given period.

        Args:
            partner_id: Partner identifier
            period_start: Period start date (ISO format)
            period_end: Period end date (ISO format)
            metrics: Performance metrics

        Returns:
            Performance tracking result
        """
        try:
            logger.info(f"Tracking performance for partner {partner_id}")

            if not partner_id:
                raise ValueError("partner_id is required")
            if not metrics:
                raise ValueError("metrics are required")

            # Parse dates
            start_date = datetime.fromisoformat(period_start)
            end_date = datetime.fromisoformat(period_end)

            # Calculate derived metrics
            revenue_generated = metrics.get("revenue_generated", 0)
            leads_referred = metrics.get("leads_referred", 0)
            deals_closed = metrics.get("deals_closed", 0)

            # Calculate conversion rate
            conversion_rate = deals_closed / leads_referred if leads_referred > 0 else 0

            # Calculate ROI
            investment = metrics.get("partner_investment", 0)
            roi = (revenue_generated - investment) / investment if investment > 0 else 0

            # Calculate engagement score
            engagement_score = self._calculate_engagement_score(metrics)

            # Get previous performance for growth calculation
            growth_rate = self._calculate_growth_rate(partner_id, revenue_generated)

            # Create performance record
            performance = PartnerPerformance(
                partner_id=partner_id,
                period_start=start_date,
                period_end=end_date,
                revenue_generated=revenue_generated,
                leads_referred=leads_referred,
                deals_closed=deals_closed,
                customer_satisfaction=metrics.get("customer_satisfaction", 0),
                engagement_score=engagement_score,
                roi=roi,
                growth_rate=growth_rate,
                metrics={
                    **metrics,
                    "conversion_rate": conversion_rate
                }
            )

            # Store performance data
            self.performance_data[partner_id].append(performance)

            # Evaluate against benchmarks
            tier = self._get_partner_tier(partner_id)
            benchmark_comparison = self._compare_to_benchmarks(performance, tier)

            result = {
                "success": True,
                "partner_id": partner_id,
                "period": f"{period_start} to {period_end}",
                "performance": {
                    "revenue_generated": revenue_generated,
                    "leads_referred": leads_referred,
                    "deals_closed": deals_closed,
                    "conversion_rate": round(conversion_rate, 3),
                    "roi": round(roi, 2),
                    "engagement_score": engagement_score,
                    "growth_rate": round(growth_rate, 2),
                    "customer_satisfaction": metrics.get("customer_satisfaction", 0)
                },
                "benchmark_comparison": benchmark_comparison,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Performance tracked successfully for {partner_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in track_performance: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in track_performance: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _calculate_engagement_score(self, metrics: Dict[str, Any]) -> int:
        """Calculate partner engagement score (0-100)."""
        score = 0

        # Activity metrics
        meetings_held = metrics.get("meetings_held", 0)
        score += min(meetings_held * 5, 25)

        # Marketing activities
        co_marketing_activities = metrics.get("co_marketing_activities", 0)
        score += min(co_marketing_activities * 10, 25)

        # Training completion
        training_completion = metrics.get("training_completion_rate", 0)
        score += int(training_completion * 25)

        # Portal usage
        portal_logins = metrics.get("portal_logins", 0)
        score += min(portal_logins * 2, 25)

        return min(score, 100)

    def _calculate_growth_rate(self, partner_id: str, current_revenue: float) -> float:
        """Calculate revenue growth rate."""
        if partner_id not in self.performance_data:
            return 0.0

        history = self.performance_data[partner_id]
        if not history:
            return 0.0

        # Compare to previous period
        if len(history) >= 1:
            previous_revenue = history[-1].revenue_generated
            if previous_revenue > 0:
                return (current_revenue - previous_revenue) / previous_revenue

        return 0.0

    def _get_partner_tier(self, partner_id: str) -> str:
        """Get partner tier."""
        if partner_id in self.partners:
            return self.partners[partner_id].tier.value
        return "bronze"

    def _compare_to_benchmarks(
        self, performance: PartnerPerformance, tier: str
    ) -> Dict[str, Any]:
        """Compare performance to tier benchmarks."""
        benchmarks = self.performance_benchmarks.get(tier, {})

        comparison = {
            "tier": tier,
            "meets_benchmarks": True,
            "details": {}
        }

        # Check each benchmark
        if benchmarks:
            # Revenue
            min_revenue = benchmarks.get("min_quarterly_revenue", 0)
            revenue_met = performance.revenue_generated >= min_revenue
            comparison["details"]["revenue"] = {
                "actual": performance.revenue_generated,
                "benchmark": min_revenue,
                "met": revenue_met
            }

            # Leads
            min_leads = benchmarks.get("min_leads_per_quarter", 0)
            leads_met = performance.leads_referred >= min_leads
            comparison["details"]["leads"] = {
                "actual": performance.leads_referred,
                "benchmark": min_leads,
                "met": leads_met
            }

            # Engagement
            min_engagement = benchmarks.get("min_engagement_score", 0)
            engagement_met = performance.engagement_score >= min_engagement
            comparison["details"]["engagement"] = {
                "actual": performance.engagement_score,
                "benchmark": min_engagement,
                "met": engagement_met
            }

            # Overall
            comparison["meets_benchmarks"] = revenue_met and leads_met and engagement_met

        return comparison

    def identify_opportunities(
        self, market_data: Dict[str, Any], criteria: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Identify partnership opportunities based on market data and criteria.

        Args:
            market_data: Market and competitive intelligence data
            criteria: Optional specific criteria for opportunity identification

        Returns:
            Partnership opportunity recommendations
        """
        try:
            logger.info("Identifying partnership opportunities")

            if not market_data:
                raise ValueError("market_data cannot be empty")

            criteria = criteria or self.matching_criteria

            # Extract potential partners
            potential_partners = market_data.get("companies", [])
            market_trends = market_data.get("trends", [])
            competitive_gaps = market_data.get("competitive_gaps", [])

            opportunities = []

            # Analyze each potential partner
            for company in potential_partners:
                opportunity_score = self._score_opportunity(company, criteria, market_trends)

                if opportunity_score >= 60:  # Threshold for viable opportunity
                    opportunities.append({
                        "company": company.get("name"),
                        "opportunity_score": opportunity_score,
                        "partnership_type": self._suggest_partnership_type(company),
                        "strategic_rationale": self._generate_rationale(
                            company, competitive_gaps
                        ),
                        "estimated_value": self._estimate_partnership_value(company),
                        "risk_level": self._assess_opportunity_risk(company),
                        "recommended_actions": self._suggest_next_steps(company, opportunity_score)
                    })

            # Sort by opportunity score
            opportunities.sort(key=lambda x: x["opportunity_score"], reverse=True)

            result = {
                "success": True,
                "opportunities_found": len(opportunities),
                "top_opportunities": opportunities[:10],
                "market_insights": {
                    "trending_partnership_types": self._identify_trending_types(market_trends),
                    "competitive_gaps": competitive_gaps,
                    "growth_areas": market_data.get("growth_areas", [])
                },
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Identified {len(opportunities)} partnership opportunities")
            return result

        except ValueError as e:
            logger.error(f"Validation error in identify_opportunities: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in identify_opportunities: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _score_opportunity(
        self, company: Dict[str, Any], criteria: Dict[str, Any], trends: List[str]
    ) -> int:
        """Score partnership opportunity (0-100)."""
        score = 0

        # Market position
        market_share = company.get("market_share", 0)
        score += int(market_share * 30)

        # Growth trajectory
        growth_rate = company.get("growth_rate", 0)
        score += min(int(growth_rate * 50), 25)

        # Strategic fit
        if company.get("industry") in criteria.get("industry_alignment", []):
            score += 20

        # Trend alignment
        company_focus = set(company.get("focus_areas", []))
        trend_set = set(trends)
        if company_focus & trend_set:
            score += 15

        # Complementary capabilities
        has_complementary = company.get("complementary_capabilities", False)
        if has_complementary:
            score += 10

        return min(score, 100)

    def _suggest_partnership_type(self, company: Dict[str, Any]) -> str:
        """Suggest optimal partnership type."""
        capabilities = company.get("capabilities", [])

        if "technology" in capabilities or "api" in capabilities:
            return "technology"
        elif "distribution" in capabilities or "channel" in capabilities:
            return "channel"
        elif "marketing" in capabilities:
            return "co_marketing"
        else:
            return "strategic"

    def _generate_rationale(
        self, company: Dict[str, Any], competitive_gaps: List[str]
    ) -> str:
        """Generate strategic rationale for partnership."""
        rationale_parts = []

        # Gap filling
        company_strengths = set(company.get("strengths", []))
        gaps_set = set(competitive_gaps)

        if company_strengths & gaps_set:
            rationale_parts.append("Fills critical competitive gaps")

        # Market expansion
        new_markets = company.get("markets", [])
        if new_markets:
            rationale_parts.append(f"Expands market reach to {len(new_markets)} new segments")

        # Technology enhancement
        if company.get("has_unique_technology"):
            rationale_parts.append("Provides unique technology capabilities")

        return "; ".join(rationale_parts) if rationale_parts else "General strategic alignment"

    def _estimate_partnership_value(self, company: Dict[str, Any]) -> Dict[str, float]:
        """Estimate potential partnership value."""
        customer_base = company.get("customer_count", 0)
        avg_deal_size = company.get("avg_deal_size", 0)

        # Conservative estimate: 5% of partner's customer base
        potential_customers = customer_base * 0.05
        estimated_annual_value = potential_customers * avg_deal_size

        return {
            "estimated_annual_revenue": round(estimated_annual_value, 2),
            "potential_customer_reach": int(potential_customers),
            "confidence_level": "medium"
        }

    def _assess_opportunity_risk(self, company: Dict[str, Any]) -> str:
        """Assess risk level of opportunity."""
        risk_factors = 0

        # Financial risk
        if company.get("financial_health_score", 100) < 60:
            risk_factors += 1

        # Competitive risk
        if company.get("competes_in_same_space", False):
            risk_factors += 1

        # Execution risk
        if company.get("has_partnership_experience", True) is False:
            risk_factors += 1

        if risk_factors >= 2:
            return "high"
        elif risk_factors == 1:
            return "medium"
        else:
            return "low"

    def _suggest_next_steps(self, company: Dict[str, Any], score: int) -> List[str]:
        """Suggest next steps for pursuing opportunity."""
        steps = []

        if score >= 80:
            steps.append("Schedule executive introduction call")
            steps.append("Prepare partnership proposal")
        elif score >= 70:
            steps.append("Conduct initial outreach")
            steps.append("Request partnership deck")
        else:
            steps.append("Add to watchlist")
            steps.append("Monitor for triggering events")

        # Always include due diligence
        steps.append("Conduct partnership due diligence")

        return steps

    def _identify_trending_types(self, trends: List[str]) -> List[str]:
        """Identify trending partnership types from market trends."""
        type_mapping = {
            "ai": "technology",
            "integration": "technology",
            "distribution": "channel",
            "marketing": "co_marketing",
            "ecosystem": "strategic"
        }

        trending_types = set()
        for trend in trends:
            trend_lower = trend.lower()
            for keyword, ptype in type_mapping.items():
                if keyword in trend_lower:
                    trending_types.add(ptype)

        return list(trending_types)

    def generate_performance_report(
        self, partner_id: str, period_days: int = 90
    ) -> Dict[str, Any]:
        """
        Generate comprehensive performance report for a partner.

        Args:
            partner_id: Partner identifier
            period_days: Number of days to include in report

        Returns:
            Comprehensive performance report
        """
        try:
            logger.info(f"Generating performance report for {partner_id}")

            if not partner_id:
                raise ValueError("partner_id is required")

            # Get partner performance history
            if partner_id not in self.performance_data:
                raise ValueError(f"No performance data found for partner {partner_id}")

            performance_history = self.performance_data[partner_id]

            # Filter to specified period
            cutoff_date = datetime.utcnow() - timedelta(days=period_days)
            recent_performance = [
                p for p in performance_history
                if p.period_end >= cutoff_date
            ]

            if not recent_performance:
                raise ValueError(f"No performance data in last {period_days} days")

            # Calculate aggregate metrics
            total_revenue = sum(p.revenue_generated for p in recent_performance)
            total_leads = sum(p.leads_referred for p in recent_performance)
            total_deals = sum(p.deals_closed for p in recent_performance)
            avg_satisfaction = sum(p.customer_satisfaction for p in recent_performance) / len(recent_performance)
            avg_engagement = sum(p.engagement_score for p in recent_performance) / len(recent_performance)

            # Calculate trends
            revenue_trend = self._calculate_trend([p.revenue_generated for p in recent_performance])

            # Get partner info
            partner_tier = self._get_partner_tier(partner_id)

            result = {
                "success": True,
                "partner_id": partner_id,
                "report_period": f"Last {period_days} days",
                "summary": {
                    "total_revenue": round(total_revenue, 2),
                    "total_leads": total_leads,
                    "total_deals": total_deals,
                    "conversion_rate": round(total_deals / total_leads, 3) if total_leads > 0 else 0,
                    "avg_customer_satisfaction": round(avg_satisfaction, 2),
                    "avg_engagement_score": round(avg_engagement, 1)
                },
                "trends": {
                    "revenue_trend": revenue_trend,
                    "performance_trajectory": "improving" if revenue_trend > 0 else "declining"
                },
                "tier_status": {
                    "current_tier": partner_tier,
                    "tier_recommendation": self._recommend_tier_change(
                        partner_id, recent_performance
                    )
                },
                "recommendations": self._generate_performance_recommendations(
                    partner_id, recent_performance
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Performance report generated for {partner_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in generate_performance_report: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in generate_performance_report: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate trend using simple linear regression."""
        if len(values) < 2:
            return 0.0

        n = len(values)
        x = list(range(n))

        # Calculate means
        x_mean = sum(x) / n
        y_mean = sum(values) / n

        # Calculate slope
        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0

        slope = numerator / denominator
        return round(slope, 2)

    def _recommend_tier_change(
        self, partner_id: str, performance: List[PartnerPerformance]
    ) -> Dict[str, Any]:
        """Recommend tier change based on performance."""
        current_tier = self._get_partner_tier(partner_id)

        # Get latest performance
        latest = performance[-1] if performance else None
        if not latest:
            return {"action": "maintain", "current_tier": current_tier}

        # Check against next tier benchmarks
        tier_order = ["bronze", "silver", "gold", "platinum"]
        current_index = tier_order.index(current_tier)

        # Check if eligible for upgrade
        if current_index < len(tier_order) - 1:
            next_tier = tier_order[current_index + 1]
            next_benchmarks = self.performance_benchmarks.get(next_tier, {})

            meets_next = (
                latest.revenue_generated >= next_benchmarks.get("min_quarterly_revenue", float('inf')) and
                latest.leads_referred >= next_benchmarks.get("min_leads_per_quarter", float('inf')) and
                latest.engagement_score >= next_benchmarks.get("min_engagement_score", float('inf'))
            )

            if meets_next:
                return {
                    "action": "upgrade",
                    "current_tier": current_tier,
                    "recommended_tier": next_tier,
                    "reason": "Consistently exceeds current tier benchmarks"
                }

        # Check if should be downgraded
        current_benchmarks = self.performance_benchmarks.get(current_tier, {})
        meets_current = (
            latest.revenue_generated >= current_benchmarks.get("min_quarterly_revenue", 0) and
            latest.leads_referred >= current_benchmarks.get("min_leads_per_quarter", 0)
        )

        if not meets_current and current_index > 0:
            prev_tier = tier_order[current_index - 1]
            return {
                "action": "downgrade",
                "current_tier": current_tier,
                "recommended_tier": prev_tier,
                "reason": "Not meeting current tier benchmarks"
            }

        return {"action": "maintain", "current_tier": current_tier}

    def _generate_performance_recommendations(
        self, partner_id: str, performance: List[PartnerPerformance]
    ) -> List[str]:
        """Generate recommendations based on performance."""
        recommendations = []

        if not performance:
            return ["Insufficient performance data"]

        latest = performance[-1]

        # Revenue recommendations
        if latest.revenue_generated < 10000:
            recommendations.append("Increase co-marketing activities to drive revenue")

        # Lead quality recommendations
        if latest.deals_closed / latest.leads_referred < 0.1 if latest.leads_referred > 0 else True:
            recommendations.append("Improve lead qualification process")

        # Engagement recommendations
        if latest.engagement_score < 60:
            recommendations.append("Schedule partner enablement training")
            recommendations.append("Increase partner communication frequency")

        # Growth recommendations
        if latest.growth_rate < 0:
            recommendations.append("Review partnership value proposition")
            recommendations.append("Consider additional incentives or support")

        return recommendations if recommendations else ["Partner performing well - maintain current strategy"]
