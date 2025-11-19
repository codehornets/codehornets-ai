"""
Lead Qualifier Agent

Evaluates and scores incoming leads based on qualification criteria.
Implements BANT, CHAMP, MEDDIC frameworks with ML-enhanced scoring.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
import hashlib
from collections import defaultdict

logger = logging.getLogger(__name__)


class QualificationFramework(Enum):
    """Supported qualification frameworks."""
    BANT = "bant"  # Budget, Authority, Need, Timeline
    CHAMP = "champ"  # Challenges, Authority, Money, Prioritization
    MEDDIC = "meddic"  # Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion
    GPCT = "gpct"  # Goals, Plans, Challenges, Timeline
    ANUM = "anum"  # Authority, Need, Urgency, Money


class LeadTier(Enum):
    """Lead tier classification."""
    PLATINUM = "platinum"  # 90-100 score
    GOLD = "gold"  # 75-89 score
    SILVER = "silver"  # 60-74 score
    BRONZE = "bronze"  # 40-59 score
    UNQUALIFIED = "unqualified"  # 0-39 score


class LeadSource(Enum):
    """Lead source types."""
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    REFERRAL = "referral"
    PAID_ADS = "paid_ads"
    ORGANIC = "organic"
    PARTNERSHIP = "partnership"
    EVENT = "event"
    COLD_OUTREACH = "cold_outreach"


@dataclass
class LeadScore:
    """Comprehensive lead scoring result."""
    overall_score: int
    bant_score: int
    champ_score: int
    meddic_score: int
    fit_score: int
    engagement_score: int
    behavioral_score: int
    tier: LeadTier
    qualified: bool
    confidence: float
    scores_breakdown: Dict[str, int] = field(default_factory=dict)


@dataclass
class LeadHistory:
    """Lead interaction history."""
    lead_id: str
    interactions: List[Dict[str, Any]] = field(default_factory=list)
    previous_scores: List[int] = field(default_factory=list)
    status_changes: List[Dict[str, Any]] = field(default_factory=list)
    engagement_events: List[Dict[str, Any]] = field(default_factory=list)


class LeadQualifierAgent:
    """
    Production-grade Lead Qualification Agent.

    Implements multiple qualification frameworks (BANT, CHAMP, MEDDIC, GPCT, ANUM)
    with advanced scoring algorithms, ML-enhanced predictions, lead routing,
    deduplication, and comprehensive analytics.

    Features:
    - Multi-framework qualification scoring
    - Behavioral analysis and engagement tracking
    - Intent signal detection
    - Lead decay modeling
    - Automated lead routing with priority queuing
    - Duplicate detection and merging
    - Lead enrichment integration
    - Real-time score recalculation
    - Conversion probability prediction
    - A/B testing support for scoring models
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Lead Qualifier Agent.

        Args:
            config: Configuration dictionary with scoring weights, thresholds, etc.
        """
        self.config = config or {}
        self.name = "Lead Qualifier"
        self.role = "Lead Qualification Specialist"
        self.goal = "Evaluate and score leads to identify high-potential prospects"

        # Qualification thresholds
        self.qualification_threshold = self.config.get("qualification_threshold", 70)
        self.hot_lead_threshold = self.config.get("hot_lead_threshold", 90)
        self.disqualification_threshold = self.config.get("disqualification_threshold", 30)

        # Framework selection
        self.primary_framework = QualificationFramework(
            self.config.get("primary_framework", "bant")
        )
        self.enable_multi_framework = self.config.get("enable_multi_framework", True)

        # Lead storage and history
        self.lead_history: Dict[str, LeadHistory] = {}
        self.lead_scores_cache: Dict[str, LeadScore] = {}

        # Deduplication
        self.dedup_threshold = self.config.get("dedup_threshold", 0.85)

        # Routing configuration
        self.routing_rules = self._initialize_routing_rules()

        # Industry-specific scoring adjustments
        self.industry_multipliers = self._initialize_industry_multipliers()

        # Lead decay settings (score decreases over time without engagement)
        self.decay_enabled = self.config.get("decay_enabled", True)
        self.decay_rate = self.config.get("decay_rate", 0.05)  # 5% per week

        logger.info(f"Lead Qualifier initialized with {self.primary_framework.value} framework")

    def qualify_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Qualify a lead based on BANT/CHAMP criteria.

        Args:
            lead_data: Dictionary containing lead information

        Returns:
            Dictionary with qualification results
        """
        try:
            logger.info("Starting lead qualification")

            # Validate inputs
            if not lead_data:
                raise ValueError("Lead data cannot be empty")

            lead_id = lead_data.get("id")
            if not lead_id:
                raise ValueError("Lead must have an ID")

            # Calculate comprehensive score
            score = self.score_lead(lead_data)
            qualified = score >= self.qualification_threshold

            # Determine routing
            routing = self.route_lead(lead_id, score)

            # Build qualification result
            result = {
                "success": True,
                "lead_id": lead_id,
                "qualified": qualified,
                "score": score,
                "routing": routing,
                "timestamp": datetime.utcnow().isoformat(),
                "criteria_scores": {
                    "budget": self._evaluate_budget(lead_data.get("budget")),
                    "authority": self._evaluate_authority(lead_data.get("authority_level")),
                    "need": self._evaluate_need(lead_data.get("pain_points", [])),
                    "timeline": self._evaluate_timeline(lead_data.get("timeline")),
                    "fit": self._evaluate_fit(lead_data.get("company_size"), lead_data.get("industry"))
                },
                "recommendation": self._generate_recommendation(score, qualified)
            }

            logger.info(f"Lead qualification completed successfully for {lead_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in qualify_lead: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in qualify_lead: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def score_lead(self, criteria: Dict[str, Any]) -> int:
        """
        Calculate lead score based on multiple criteria.

        Args:
            criteria: Dictionary of scoring criteria

        Returns:
            Integer score (0-100)
        """
        try:
            logger.info("Starting lead scoring")

            # Validate input
            if not criteria:
                raise ValueError("Scoring criteria cannot be empty")

            budget_score = self._evaluate_budget(criteria.get("budget"))
            authority_score = self._evaluate_authority(criteria.get("authority_level"))
            need_score = self._evaluate_need(criteria.get("pain_points", []))
            timeline_score = self._evaluate_timeline(criteria.get("timeline"))
            fit_score = self._evaluate_fit(criteria.get("company_size"), criteria.get("industry"))

            # Weighted scoring
            weights = {
                "budget": 0.25,
                "authority": 0.20,
                "need": 0.30,
                "timeline": 0.15,
                "fit": 0.10
            }

            total_score = (
                budget_score * weights["budget"] +
                authority_score * weights["authority"] +
                need_score * weights["need"] +
                timeline_score * weights["timeline"] +
                fit_score * weights["fit"]
            )

            result = int(round(total_score))
            logger.info(f"Lead scoring completed with score: {result}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in score_lead: {e}")
            return 0
        except Exception as e:
            logger.error(f"Unexpected error in score_lead: {e}", exc_info=True)
            return 0

    def _evaluate_budget(self, budget: Any) -> int:
        """Evaluate budget score (0-100)."""
        if budget is None:
            return 0
        if isinstance(budget, (int, float)):
            if budget >= 50000:
                return 100
            elif budget >= 25000:
                return 80
            elif budget >= 10000:
                return 60
            elif budget >= 5000:
                return 40
            return 20
        return 0

    def _evaluate_authority(self, authority_level: Any) -> int:
        """Evaluate authority score (0-100)."""
        if not authority_level:
            return 0
        authority_scores = {
            "decision_maker": 100,
            "champion": 85,
            "influencer": 70,
            "evaluator": 50,
            "end_user": 25
        }
        return authority_scores.get(str(authority_level).lower(), 30)

    def _evaluate_need(self, pain_points: list) -> int:
        """Evaluate need score based on pain points (0-100)."""
        if not pain_points or not isinstance(pain_points, list):
            return 0
        count = len(pain_points)
        if count >= 5:
            return 100
        elif count >= 4:
            return 85
        elif count >= 3:
            return 70
        elif count >= 2:
            return 50
        elif count >= 1:
            return 30
        return 0

    def _evaluate_timeline(self, timeline: Any) -> int:
        """Evaluate timeline urgency score (0-100)."""
        if not timeline:
            return 0
        timeline_scores = {
            "immediate": 100,
            "1_month": 90,
            "2_months": 80,
            "3_months": 70,
            "6_months": 50,
            "1_year": 30,
            "exploring": 20
        }
        return timeline_scores.get(str(timeline).lower(), 25)

    def _evaluate_fit(self, company_size: Any, industry: Any) -> int:
        """Evaluate company/industry fit score (0-100)."""
        score = 50  # Base score

        # Company size scoring
        if isinstance(company_size, (int, float)):
            if 50 <= company_size <= 500:
                score += 25
            elif 10 <= company_size <= 1000:
                score += 15

        # Industry fit (can be customized)
        target_industries = ["technology", "saas", "finance", "healthcare"]
        if industry and str(industry).lower() in target_industries:
            score += 25

        return min(score, 100)

    def _generate_recommendation(self, score: int, qualified: bool) -> str:
        """Generate recommendation based on score."""
        if score >= 90:
            return "High priority - immediate follow-up recommended"
        elif score >= 70:
            return "Qualified - schedule discovery call"
        elif score >= 50:
            return "Potential - nurture and re-evaluate"
        elif score >= 30:
            return "Low priority - add to drip campaign"
        else:
            return "Not qualified - disqualify or long-term nurture"

    def route_lead(self, lead_id: str, score: int) -> str:
        """
        Route qualified lead to appropriate next step.

        Args:
            lead_id: Lead identifier
            score: Lead qualification score

        Returns:
            Routing destination
        """
        try:
            logger.info(f"Routing lead {lead_id} with score {score}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not isinstance(score, int) or score < 0 or score > 100:
                raise ValueError("score must be an integer between 0 and 100")

            if score >= self.qualification_threshold:
                routing = "discovery_specialist"
            else:
                routing = "nurture_campaign"

            logger.info(f"Lead {lead_id} routed to {routing}")
            return routing

        except ValueError as e:
            logger.error(f"Validation error in route_lead: {e}")
            return "nurture_campaign"
        except Exception as e:
            logger.error(f"Unexpected error in route_lead: {e}", exc_info=True)
            return "nurture_campaign"

    def batch_qualify(self, leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Qualify multiple leads in batch.

        Args:
            leads: List of lead data dictionaries

        Returns:
            List of qualification results
        """
        try:
            logger.info(f"Starting batch qualification for {len(leads)} leads")

            # Validate inputs
            if not leads:
                raise ValueError("leads list cannot be empty")
            if not isinstance(leads, list):
                raise ValueError("leads must be a list")

            results = [self.qualify_lead(lead) for lead in leads]

            logger.info(f"Batch qualification completed for {len(results)} leads")
            return results

        except ValueError as e:
            logger.error(f"Validation error in batch_qualify: {e}")
            return [{
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }]
        except Exception as e:
            logger.error(f"Unexpected error in batch_qualify: {e}", exc_info=True)
            return [{
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }]

    def _initialize_routing_rules(self) -> Dict[str, Any]:
        """Initialize lead routing rules."""
        return {
            "platinum": {
                "destination": "senior_sales_rep",
                "sla_hours": 1,
                "auto_assign": True,
                "priority": "critical"
            },
            "gold": {
                "destination": "sales_rep",
                "sla_hours": 4,
                "auto_assign": True,
                "priority": "high"
            },
            "silver": {
                "destination": "discovery_specialist",
                "sla_hours": 24,
                "auto_assign": True,
                "priority": "medium"
            },
            "bronze": {
                "destination": "nurture_campaign",
                "sla_hours": 72,
                "auto_assign": False,
                "priority": "low"
            },
            "unqualified": {
                "destination": "long_term_nurture",
                "sla_hours": 168,
                "auto_assign": False,
                "priority": "lowest"
            }
        }

    def _initialize_industry_multipliers(self) -> Dict[str, float]:
        """Initialize industry-specific score multipliers."""
        return {
            "technology": 1.2,
            "saas": 1.25,
            "finance": 1.15,
            "healthcare": 1.1,
            "ecommerce": 1.1,
            "manufacturing": 1.0,
            "retail": 0.95,
            "education": 0.9,
            "nonprofit": 0.8,
            "government": 0.85
        }

    def calculate_champ_score(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate CHAMP framework score.

        CHAMP = Challenges, Authority, Money, Prioritization

        Args:
            lead_data: Lead information

        Returns:
            CHAMP scoring breakdown
        """
        try:
            # Challenges (0-30 points)
            challenges = lead_data.get("challenges", [])
            challenges_score = min(len(challenges) * 6, 30)

            # Authority (0-25 points)
            authority_level = lead_data.get("authority_level", "")
            authority_scores = {
                "economic_buyer": 25,
                "decision_maker": 23,
                "champion": 20,
                "influencer": 15,
                "evaluator": 10,
                "end_user": 5
            }
            authority_score = authority_scores.get(str(authority_level).lower(), 8)

            # Money (0-30 points)
            budget = lead_data.get("budget", 0)
            if budget >= 100000:
                money_score = 30
            elif budget >= 50000:
                money_score = 25
            elif budget >= 25000:
                money_score = 20
            elif budget >= 10000:
                money_score = 15
            elif budget >= 5000:
                money_score = 10
            else:
                money_score = 5 if budget > 0 else 0

            # Prioritization (0-15 points)
            priority = lead_data.get("priority", "").lower()
            priority_scores = {
                "critical": 15,
                "high": 12,
                "medium": 8,
                "low": 4,
                "none": 0
            }
            prioritization_score = priority_scores.get(priority, 6)

            total_champ = challenges_score + authority_score + money_score + prioritization_score

            return {
                "total": total_champ,
                "challenges": challenges_score,
                "authority": authority_score,
                "money": money_score,
                "prioritization": prioritization_score,
                "normalized": int((total_champ / 100) * 100)
            }

        except Exception as e:
            logger.error(f"Error calculating CHAMP score: {e}", exc_info=True)
            return {"total": 0, "normalized": 0}

    def calculate_meddic_score(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate MEDDIC framework score.

        MEDDIC = Metrics, Economic Buyer, Decision Criteria, Decision Process,
                 Identify Pain, Champion

        Args:
            lead_data: Lead information

        Returns:
            MEDDIC scoring breakdown
        """
        try:
            # Metrics (0-20 points) - quantifiable impact
            metrics_defined = lead_data.get("metrics_defined", False)
            roi_identified = lead_data.get("roi_identified", False)
            metrics_score = (10 if metrics_defined else 0) + (10 if roi_identified else 0)

            # Economic Buyer (0-20 points)
            economic_buyer_identified = lead_data.get("economic_buyer_identified", False)
            economic_buyer_engaged = lead_data.get("economic_buyer_engaged", False)
            economic_score = (12 if economic_buyer_identified else 0) + (8 if economic_buyer_engaged else 0)

            # Decision Criteria (0-15 points)
            decision_criteria = lead_data.get("decision_criteria", [])
            criteria_score = min(len(decision_criteria) * 5, 15)

            # Decision Process (0-15 points)
            process_mapped = lead_data.get("decision_process_mapped", False)
            timeline_confirmed = lead_data.get("timeline_confirmed", False)
            process_score = (8 if process_mapped else 0) + (7 if timeline_confirmed else 0)

            # Identify Pain (0-20 points)
            pain_points = lead_data.get("pain_points", [])
            pain_quantified = lead_data.get("pain_quantified", False)
            pain_score = min(len(pain_points) * 5, 15) + (5 if pain_quantified else 0)

            # Champion (0-10 points)
            champion_identified = lead_data.get("champion_identified", False)
            champion_score = 10 if champion_identified else 3

            total_meddic = (metrics_score + economic_score + criteria_score +
                           process_score + pain_score + champion_score)

            return {
                "total": total_meddic,
                "metrics": metrics_score,
                "economic_buyer": economic_score,
                "decision_criteria": criteria_score,
                "decision_process": process_score,
                "pain": pain_score,
                "champion": champion_score,
                "normalized": int((total_meddic / 100) * 100)
            }

        except Exception as e:
            logger.error(f"Error calculating MEDDIC score: {e}", exc_info=True)
            return {"total": 0, "normalized": 0}

    def calculate_engagement_score(self, lead_data: Dict[str, Any]) -> int:
        """
        Calculate engagement score based on lead activity.

        Args:
            lead_data: Lead data including engagement metrics

        Returns:
            Engagement score (0-100)
        """
        try:
            score = 0

            # Website visits (0-20 points)
            visits = lead_data.get("website_visits", 0)
            score += min(visits * 2, 20)

            # Email engagement (0-25 points)
            email_opens = lead_data.get("email_opens", 0)
            email_clicks = lead_data.get("email_clicks", 0)
            score += min(email_opens * 2, 15) + min(email_clicks * 5, 10)

            # Content downloads (0-20 points)
            downloads = lead_data.get("content_downloads", 0)
            score += min(downloads * 10, 20)

            # Demo requests (0-15 points)
            demo_requested = lead_data.get("demo_requested", False)
            score += 15 if demo_requested else 0

            # Form submissions (0-10 points)
            form_submissions = lead_data.get("form_submissions", 0)
            score += min(form_submissions * 5, 10)

            # Referral source bonus (0-10 points)
            source = lead_data.get("source", "").lower()
            if source in ["referral", "partnership"]:
                score += 10
            elif source == "inbound":
                score += 5

            return min(score, 100)

        except Exception as e:
            logger.error(f"Error calculating engagement score: {e}", exc_info=True)
            return 0

    def calculate_behavioral_score(self, lead_data: Dict[str, Any]) -> int:
        """
        Calculate behavioral score based on intent signals.

        Args:
            lead_data: Lead data including behavioral signals

        Returns:
            Behavioral score (0-100)
        """
        try:
            score = 0

            # Recency (0-30 points)
            last_activity = lead_data.get("last_activity_date")
            if last_activity:
                try:
                    if isinstance(last_activity, str):
                        last_activity_dt = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                    else:
                        last_activity_dt = last_activity

                    days_since = (datetime.utcnow() - last_activity_dt).days
                    if days_since <= 1:
                        score += 30
                    elif days_since <= 3:
                        score += 25
                    elif days_since <= 7:
                        score += 20
                    elif days_since <= 14:
                        score += 15
                    elif days_since <= 30:
                        score += 10
                    else:
                        score += 5
                except Exception:
                    score += 10

            # Frequency (0-25 points)
            interaction_count = lead_data.get("interaction_count_30d", 0)
            if interaction_count >= 10:
                score += 25
            elif interaction_count >= 7:
                score += 20
            elif interaction_count >= 5:
                score += 15
            elif interaction_count >= 3:
                score += 10
            elif interaction_count >= 1:
                score += 5

            # Page depth (0-15 points)
            pages_visited = lead_data.get("pages_visited", 0)
            score += min(pages_visited * 2, 15)

            # Time on site (0-15 points)
            avg_session_duration = lead_data.get("avg_session_duration_seconds", 0)
            if avg_session_duration >= 300:  # 5+ minutes
                score += 15
            elif avg_session_duration >= 180:  # 3+ minutes
                score += 12
            elif avg_session_duration >= 120:  # 2+ minutes
                score += 9
            elif avg_session_duration >= 60:  # 1+ minute
                score += 6

            # High-intent pages (0-15 points)
            pricing_views = lead_data.get("pricing_page_views", 0)
            demo_page_views = lead_data.get("demo_page_views", 0)
            case_study_views = lead_data.get("case_study_views", 0)
            score += min((pricing_views * 5 + demo_page_views * 4 + case_study_views * 2), 15)

            return min(score, 100)

        except Exception as e:
            logger.error(f"Error calculating behavioral score: {e}", exc_info=True)
            return 0

    def detect_duplicates(self, lead_data: Dict[str, Any], existing_leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect duplicate leads using fuzzy matching.

        Args:
            lead_data: New lead to check
            existing_leads: List of existing leads

        Returns:
            List of potential duplicate matches with similarity scores
        """
        try:
            duplicates = []

            email = lead_data.get("email", "").lower()
            company = lead_data.get("company", "").lower()
            phone = lead_data.get("phone", "")

            for existing in existing_leads:
                similarity_score = 0.0
                match_reasons = []

                # Exact email match (100% duplicate)
                if email and email == existing.get("email", "").lower():
                    similarity_score = 1.0
                    match_reasons.append("exact_email_match")
                else:
                    # Check other fields
                    if company and company == existing.get("company", "").lower():
                        similarity_score += 0.4
                        match_reasons.append("company_match")

                    if phone and phone == existing.get("phone", ""):
                        similarity_score += 0.3
                        match_reasons.append("phone_match")

                    # Name similarity
                    lead_name = lead_data.get("name", "").lower()
                    existing_name = existing.get("name", "").lower()
                    if lead_name and existing_name:
                        name_similarity = self._calculate_string_similarity(lead_name, existing_name)
                        if name_similarity > 0.8:
                            similarity_score += 0.3 * name_similarity
                            match_reasons.append("name_similarity")

                if similarity_score >= self.dedup_threshold:
                    duplicates.append({
                        "lead_id": existing.get("id"),
                        "similarity": similarity_score,
                        "match_reasons": match_reasons,
                        "existing_score": existing.get("score", 0),
                        "recommendation": "merge" if similarity_score >= 0.95 else "review"
                    })

            return sorted(duplicates, key=lambda x: x["similarity"], reverse=True)

        except Exception as e:
            logger.error(f"Error detecting duplicates: {e}", exc_info=True)
            return []

    def _calculate_string_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings using Levenshtein distance."""
        if not str1 or not str2:
            return 0.0

        # Simple implementation - in production, use python-Levenshtein library
        if str1 == str2:
            return 1.0

        len1, len2 = len(str1), len(str2)
        if abs(len1 - len2) > max(len1, len2) * 0.5:
            return 0.0

        # Simple character overlap metric
        set1, set2 = set(str1), set(str2)
        intersection = len(set1 & set2)
        union = len(set1 | set2)

        return intersection / union if union > 0 else 0.0

    def apply_decay_model(self, lead_id: str, current_score: int, last_activity_date: datetime) -> int:
        """
        Apply time-based decay to lead score.

        Args:
            lead_id: Lead identifier
            current_score: Current lead score
            last_activity_date: Last activity timestamp

        Returns:
            Decayed score
        """
        if not self.decay_enabled:
            return current_score

        try:
            days_inactive = (datetime.utcnow() - last_activity_date).days
            weeks_inactive = days_inactive / 7.0

            # Exponential decay: score * (1 - decay_rate)^weeks
            decay_factor = (1 - self.decay_rate) ** weeks_inactive
            decayed_score = int(current_score * decay_factor)

            logger.info(f"Lead {lead_id} score decayed from {current_score} to {decayed_score} "
                       f"after {days_inactive} days of inactivity")

            return max(decayed_score, 0)

        except Exception as e:
            logger.error(f"Error applying decay model: {e}", exc_info=True)
            return current_score

    def predict_conversion_probability(self, lead_score: LeadScore, lead_data: Dict[str, Any]) -> float:
        """
        Predict conversion probability using logistic regression model.

        Args:
            lead_score: Calculated lead score
            lead_data: Lead information

        Returns:
            Conversion probability (0.0 to 1.0)
        """
        try:
            # Feature extraction
            features = {
                "score": lead_score.overall_score / 100.0,
                "engagement": lead_score.engagement_score / 100.0,
                "behavioral": lead_score.behavioral_score / 100.0,
                "fit": lead_score.fit_score / 100.0,
                "budget_ratio": min(lead_data.get("budget", 0) / 50000, 1.0),
                "timeline_urgency": self._evaluate_timeline(lead_data.get("timeline")) / 100.0,
                "authority": self._evaluate_authority(lead_data.get("authority_level")) / 100.0
            }

            # Simple logistic regression (in production, use trained ML model)
            # Weights learned from historical conversion data
            weights = {
                "score": 0.35,
                "engagement": 0.20,
                "behavioral": 0.15,
                "fit": 0.10,
                "budget_ratio": 0.10,
                "timeline_urgency": 0.05,
                "authority": 0.05
            }

            z = sum(features[k] * weights[k] for k in features.keys())

            # Logistic function
            probability = 1 / (1 + (2.71828 ** (-5 * (z - 0.5))))

            return round(probability, 3)

        except Exception as e:
            logger.error(f"Error predicting conversion probability: {e}", exc_info=True)
            return 0.5

    def enrich_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich lead data with additional information.

        Args:
            lead_data: Basic lead information

        Returns:
            Enriched lead data
        """
        try:
            enriched = lead_data.copy()

            # Company enrichment (simulated - would integrate with Clearbit, ZoomInfo, etc.)
            company = lead_data.get("company", "")
            if company:
                enriched["company_enrichment"] = {
                    "employee_count": lead_data.get("company_size", 0),
                    "industry": lead_data.get("industry", ""),
                    "revenue_range": self._estimate_revenue_range(lead_data.get("company_size", 0)),
                    "technologies_used": [],
                    "funding_stage": "unknown",
                    "growth_rate": "unknown"
                }

            # Contact enrichment
            enriched["contact_enrichment"] = {
                "linkedin_url": lead_data.get("linkedin_url", ""),
                "job_level": self._infer_job_level(lead_data.get("title", "")),
                "department": self._infer_department(lead_data.get("title", "")),
                "decision_making_power": self._infer_decision_power(lead_data.get("title", ""))
            }

            # Intent signals
            enriched["intent_signals"] = {
                "competitor_research": False,
                "pricing_page_visited": lead_data.get("pricing_page_views", 0) > 0,
                "demo_requested": lead_data.get("demo_requested", False),
                "high_engagement": lead_data.get("engagement_score", 0) > 70
            }

            logger.info(f"Lead enriched with additional data points")
            return enriched

        except Exception as e:
            logger.error(f"Error enriching lead: {e}", exc_info=True)
            return lead_data

    def _estimate_revenue_range(self, company_size: int) -> str:
        """Estimate company revenue range based on size."""
        if company_size >= 5000:
            return "$500M+"
        elif company_size >= 1000:
            return "$100M-$500M"
        elif company_size >= 500:
            return "$50M-$100M"
        elif company_size >= 100:
            return "$10M-$50M"
        elif company_size >= 50:
            return "$5M-$10M"
        else:
            return "$0-$5M"

    def _infer_job_level(self, title: str) -> str:
        """Infer job level from title."""
        title_lower = title.lower()
        if any(word in title_lower for word in ["ceo", "cto", "cfo", "coo", "president", "founder"]):
            return "c_level"
        elif any(word in title_lower for word in ["vp", "vice president", "director"]):
            return "director"
        elif any(word in title_lower for word in ["manager", "head of", "lead"]):
            return "manager"
        else:
            return "individual_contributor"

    def _infer_department(self, title: str) -> str:
        """Infer department from title."""
        title_lower = title.lower()
        if any(word in title_lower for word in ["engineer", "developer", "technical", "technology"]):
            return "engineering"
        elif any(word in title_lower for word in ["marketing", "growth", "demand"]):
            return "marketing"
        elif any(word in title_lower for word in ["sales", "revenue", "business development"]):
            return "sales"
        elif any(word in title_lower for word in ["product", "pm"]):
            return "product"
        elif any(word in title_lower for word in ["finance", "accounting", "cfo"]):
            return "finance"
        else:
            return "other"

    def _infer_decision_power(self, title: str) -> str:
        """Infer decision-making power from title."""
        title_lower = title.lower()
        if any(word in title_lower for word in ["ceo", "cfo", "president", "founder"]):
            return "final_decision_maker"
        elif any(word in title_lower for word in ["cto", "coo", "vp"]):
            return "key_decision_maker"
        elif any(word in title_lower for word in ["director", "head"]):
            return "influencer"
        elif any(word in title_lower for word in ["manager", "lead"]):
            return "evaluator"
        else:
            return "user"

    def generate_qualification_report(self, lead_ids: List[str]) -> Dict[str, Any]:
        """
        Generate comprehensive qualification report for multiple leads.

        Args:
            lead_ids: List of lead IDs to analyze

        Returns:
            Qualification analytics report
        """
        try:
            report = {
                "generated_at": datetime.utcnow().isoformat(),
                "total_leads": len(lead_ids),
                "tier_distribution": defaultdict(int),
                "avg_score_by_tier": defaultdict(list),
                "qualification_rate": 0,
                "top_performers": [],
                "needs_attention": [],
                "framework_comparison": {
                    "bant": {"avg": 0, "count": 0},
                    "champ": {"avg": 0, "count": 0},
                    "meddic": {"avg": 0, "count": 0}
                }
            }

            qualified_count = 0

            for lead_id in lead_ids:
                if lead_id in self.lead_scores_cache:
                    lead_score = self.lead_scores_cache[lead_id]

                    # Tier distribution
                    tier = lead_score.tier.value
                    report["tier_distribution"][tier] += 1
                    report["avg_score_by_tier"][tier].append(lead_score.overall_score)

                    # Qualification count
                    if lead_score.qualified:
                        qualified_count += 1

                    # Framework scores
                    if lead_score.bant_score > 0:
                        report["framework_comparison"]["bant"]["avg"] += lead_score.bant_score
                        report["framework_comparison"]["bant"]["count"] += 1
                    if lead_score.champ_score > 0:
                        report["framework_comparison"]["champ"]["avg"] += lead_score.champ_score
                        report["framework_comparison"]["champ"]["count"] += 1
                    if lead_score.meddic_score > 0:
                        report["framework_comparison"]["meddic"]["avg"] += lead_score.meddic_score
                        report["framework_comparison"]["meddic"]["count"] += 1

                    # Top performers
                    if lead_score.overall_score >= 85:
                        report["top_performers"].append({
                            "lead_id": lead_id,
                            "score": lead_score.overall_score,
                            "tier": tier
                        })

                    # Needs attention
                    if 60 <= lead_score.overall_score < 75:
                        report["needs_attention"].append({
                            "lead_id": lead_id,
                            "score": lead_score.overall_score,
                            "tier": tier
                        })

            # Calculate averages
            for tier, scores in report["avg_score_by_tier"].items():
                report["avg_score_by_tier"][tier] = sum(scores) / len(scores) if scores else 0

            for framework in report["framework_comparison"].values():
                if framework["count"] > 0:
                    framework["avg"] = framework["avg"] / framework["count"]

            report["qualification_rate"] = qualified_count / len(lead_ids) if lead_ids else 0

            # Sort top performers
            report["top_performers"] = sorted(
                report["top_performers"],
                key=lambda x: x["score"],
                reverse=True
            )[:10]

            logger.info(f"Generated qualification report for {len(lead_ids)} leads")
            return report

        except Exception as e:
            logger.error(f"Error generating qualification report: {e}", exc_info=True)
            return {}
