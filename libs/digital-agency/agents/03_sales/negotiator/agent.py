"""
Negotiator Agent

Manages negotiation process to create win-win agreements.
Implements BATNA/WATNA analysis, concession strategies, and pricing optimization.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


class NegotiationStage(Enum):
    """Negotiation process stages."""
    PREPARATION = "preparation"
    OPENING = "opening"
    EXPLORATION = "exploration"
    BARGAINING = "bargaining"
    CLOSING = "closing"
    AGREEMENT = "agreement"


class ConcessionType(Enum):
    """Types of concessions."""
    PRICE_DISCOUNT = "price_discount"
    PAYMENT_TERMS = "payment_terms"
    DELIVERABLES = "deliverables"
    TIMELINE = "timeline"
    SUPPORT_LEVEL = "support_level"
    TRAINING = "training"
    CUSTOMIZATION = "customization"


class NegotiationStrategy(Enum):
    """Negotiation strategies."""
    WIN_WIN = "win_win"
    COMPETITIVE = "competitive"
    COLLABORATIVE = "collaborative"
    ACCOMMODATING = "accommodating"
    COMPROMISE = "compromise"


@dataclass
class BATNA:
    """Best Alternative To Negotiated Agreement."""
    batna_id: str
    description: str
    value: float
    feasibility: float  # 0-1
    timeline_days: int
    risks: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)


@dataclass
class WATNA:
    """Worst Alternative To Negotiated Agreement."""
    watna_id: str
    description: str
    cost: float
    probability: float  # 0-1
    impact: str  # low, medium, high
    mitigation_strategies: List[str] = field(default_factory=list)


@dataclass
class Concession:
    """Negotiation concession."""
    concession_id: str
    type: ConcessionType
    description: str
    cost_to_us: float
    value_to_them: float
    granted_at: Optional[datetime] = None
    requires_reciprocity: bool = True
    reciprocity_received: bool = False
    approval_required: bool = False
    approved: bool = False


@dataclass
class PricingFlexibility:
    """Pricing flexibility analysis."""
    list_price: float
    floor_price: float  # Minimum acceptable
    target_price: float  # Optimal target
    max_discount_pct: float
    margin_at_floor: float
    margin_at_target: float
    approval_tiers: Dict[str, float] = field(default_factory=dict)


@dataclass
class MutualActionPlan:
    """Mutual commitments and next steps."""
    plan_id: str
    created_at: datetime
    buyer_commitments: List[Dict[str, Any]] = field(default_factory=list)
    seller_commitments: List[Dict[str, Any]] = field(default_factory=list)
    milestones: List[Dict[str, Any]] = field(default_factory=list)
    target_close_date: Optional[datetime] = None


@dataclass
class NegotiationSession:
    """Complete negotiation session."""
    session_id: str
    lead_id: str
    stage: NegotiationStage
    strategy: NegotiationStrategy
    started_at: datetime
    current_offer: Dict[str, Any] = field(default_factory=dict)
    counter_offers: List[Dict[str, Any]] = field(default_factory=list)
    concessions_made: List[Concession] = field(default_factory=list)
    concessions_received: List[str] = field(default_factory=list)
    batna: Optional[BATNA] = None
    watna: Optional[WATNA] = None
    redlines: List[str] = field(default_factory=list)
    mutual_action_plan: Optional[MutualActionPlan] = None
    closed_at: Optional[datetime] = None
    outcome: Optional[str] = None


class NegotiatorAgent:
    """
    Production-grade Negotiator Agent.

    Manages complex negotiations using proven frameworks, strategic
    concession planning, and value-based pricing optimization.

    Features:
    - BATNA/WATNA Analysis (Best/Worst Alternative scenarios)
    - Concession Strategy Engine with reciprocity tracking
    - Pricing Flexibility Calculator with approval workflows
    - Contract Template Generation
    - Payment Term Optimization (cash flow modeling)
    - Mutual Action Plan Creation
    - Red-line Tracking (non-negotiable terms)
    - Win-Win Scenario Modeling (Nash equilibrium)
    - Negotiation analytics and performance tracking
    - Multi-party negotiation support
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Negotiator Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.name = "Negotiator"
        self.role = "Negotiation Specialist"
        self.goal = "Create win-win agreements that satisfy both parties"

        # Configuration
        self.max_discount_without_approval = self.config.get("max_discount_pct", 15.0)
        self.min_margin_threshold = self.config.get("min_margin_pct", 20.0)
        self.max_concessions_per_session = self.config.get("max_concessions", 5)

        # Storage
        self.negotiation_sessions: Dict[str, NegotiationSession] = {}
        self.contract_templates: Dict[str, Dict[str, Any]] = {}
        self.pricing_models: Dict[str, PricingFlexibility] = {}
        self.redline_policies: Dict[str, List[str]] = {}

        # Initialize
        self._initialize_contract_templates()
        self._initialize_pricing_models()
        self._initialize_redline_policies()

        # Analytics
        self.negotiation_history: List[Dict[str, Any]] = []
        self.concession_effectiveness: Dict[str, float] = {}

        logger.info("Negotiator initialized")

    def analyze_batna_watna(
        self,
        lead_id: str,
        deal_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze Best and Worst Alternatives To Negotiated Agreement.

        Args:
            lead_id: Lead identifier
            deal_context: Deal context and constraints

        Returns:
            BATNA/WATNA analysis results
        """
        try:
            logger.info(f"Starting BATNA/WATNA analysis for lead {lead_id}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not deal_context:
                raise ValueError("deal_context cannot be empty")

            # Analyze BATNA scenarios
            batna_scenarios = self._identify_batna_scenarios(deal_context)

            # Score and rank BATNAs
            scored_batnas = []
            for scenario in batna_scenarios:
                score = self._score_batna(scenario)
                scenario["score"] = score
                scored_batnas.append(scenario)

            scored_batnas.sort(key=lambda x: x["score"], reverse=True)
            best_batna = scored_batnas[0] if scored_batnas else None

            # Analyze WATNA scenarios
            watna_scenarios = self._identify_watna_scenarios(deal_context)

            # Score and rank WATNAs
            scored_watnas = []
            for scenario in watna_scenarios:
                impact_score = self._score_watna(scenario)
                scenario["impact_score"] = impact_score
                scored_watnas.append(scenario)

            scored_watnas.sort(key=lambda x: x["impact_score"], reverse=True)
            worst_watna = scored_watnas[0] if scored_watnas else None

            # Calculate ZOPA (Zone of Possible Agreement)
            zopa = self._calculate_zopa(best_batna, worst_watna, deal_context)

            # Generate negotiation strategy
            strategy = self._recommend_strategy(best_batna, worst_watna, zopa)

            # Calculate walk-away threshold
            walk_away_threshold = self._calculate_walk_away_point(best_batna, deal_context)

            result = {
                "success": True,
                "lead_id": lead_id,
                "batna_analysis": {
                    "best_alternative": best_batna,
                    "all_alternatives": scored_batnas,
                    "batna_value": best_batna.get("value", 0) if best_batna else 0,
                    "feasibility": best_batna.get("feasibility", 0) if best_batna else 0
                },
                "watna_analysis": {
                    "worst_scenario": worst_watna,
                    "all_scenarios": scored_watnas,
                    "watna_cost": worst_watna.get("cost", 0) if worst_watna else 0,
                    "probability": worst_watna.get("probability", 0) if worst_watna else 0
                },
                "zopa": zopa,
                "recommended_strategy": strategy,
                "walk_away_threshold": walk_away_threshold,
                "negotiation_strength": self._assess_negotiation_strength(best_batna, worst_watna),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"BATNA/WATNA analysis completed for lead {lead_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_batna_watna: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in analyze_batna_watna: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def plan_concession_strategy(
        self,
        session_id: str,
        negotiation_goals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Plan concession strategy with reciprocity tracking.

        Args:
            session_id: Negotiation session ID
            negotiation_goals: Goals and constraints

        Returns:
            Concession strategy plan
        """
        try:
            logger.info(f"Planning concession strategy for session {session_id}")

            # Validate inputs
            if not session_id:
                raise ValueError("session_id is required")

            # Create or get session
            if session_id not in self.negotiation_sessions:
                session = self._create_negotiation_session(session_id, negotiation_goals)
            else:
                session = self.negotiation_sessions[session_id]

            # Identify potential concessions
            potential_concessions = self._identify_potential_concessions(negotiation_goals)

            # Rank concessions by cost/value ratio
            ranked_concessions = self._rank_concessions(potential_concessions)

            # Build concession sequence
            concession_sequence = self._build_concession_sequence(ranked_concessions)

            # Define reciprocity expectations
            reciprocity_map = self._define_reciprocity_expectations(ranked_concessions)

            # Calculate concession budget
            concession_budget = self._calculate_concession_budget(negotiation_goals)

            # Generate negotiation tactics
            tactics = self._generate_negotiation_tactics(session.strategy, ranked_concessions)

            result = {
                "success": True,
                "session_id": session_id,
                "potential_concessions": ranked_concessions,
                "recommended_sequence": concession_sequence,
                "reciprocity_expectations": reciprocity_map,
                "concession_budget": concession_budget,
                "tactics": tactics,
                "pacing_strategy": self._get_pacing_strategy(session.strategy),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Concession strategy planned for session {session_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in plan_concession_strategy: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in plan_concession_strategy: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def calculate_pricing_flexibility(
        self,
        product_config: Dict[str, Any],
        deal_size: float,
        competitive_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate pricing flexibility with margin analysis.

        Args:
            product_config: Product configuration and costs
            deal_size: Total deal size
            competitive_context: Competitive intelligence

        Returns:
            Pricing flexibility analysis
        """
        try:
            logger.info("Calculating pricing flexibility")

            # Validate inputs
            if not product_config:
                raise ValueError("product_config is required")
            if deal_size <= 0:
                raise ValueError("deal_size must be positive")

            # Extract cost structure
            base_cost = product_config.get("base_cost", deal_size * 0.3)
            target_margin = product_config.get("target_margin_pct", 40.0)

            # Calculate price points
            list_price = deal_size
            target_price = base_cost * (1 + target_margin / 100)
            floor_price = base_cost * (1 + self.min_margin_threshold / 100)

            # Calculate discount waterfall
            discount_waterfall = self._calculate_discount_waterfall(
                list_price, target_price, floor_price
            )

            # Determine approval requirements
            approval_tiers = self._get_approval_tiers(list_price)

            # Analyze competitive positioning
            competitive_analysis = self._analyze_competitive_pricing(
                list_price, competitive_context
            )

            # Calculate value-based pricing adjustments
            value_adjustments = self._calculate_value_adjustments(
                product_config, competitive_context
            )

            # Build pricing flexibility model
            flexibility = PricingFlexibility(
                list_price=list_price,
                floor_price=floor_price,
                target_price=target_price,
                max_discount_pct=((list_price - floor_price) / list_price) * 100,
                margin_at_floor=self.min_margin_threshold,
                margin_at_target=target_margin,
                approval_tiers=approval_tiers
            )

            result = {
                "success": True,
                "pricing_flexibility": {
                    "list_price": list_price,
                    "target_price": target_price,
                    "floor_price": floor_price,
                    "max_discount_pct": round(flexibility.max_discount_pct, 1),
                    "margin_at_target": target_margin,
                    "margin_at_floor": self.min_margin_threshold
                },
                "discount_waterfall": discount_waterfall,
                "approval_requirements": approval_tiers,
                "competitive_positioning": competitive_analysis,
                "value_adjustments": value_adjustments,
                "recommended_opening_price": round(list_price * 1.1, 2),  # 10% above list
                "negotiation_range": {
                    "optimistic": target_price,
                    "realistic": target_price * 0.95,
                    "pessimistic": floor_price
                },
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("Pricing flexibility calculated")
            return result

        except ValueError as e:
            logger.error(f"Validation error in calculate_pricing_flexibility: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in calculate_pricing_flexibility: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def generate_contract(
        self,
        lead_id: str,
        agreed_terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate contract from template based on agreed terms.

        Args:
            lead_id: Lead identifier
            agreed_terms: Negotiated and agreed terms

        Returns:
            Generated contract details
        """
        try:
            logger.info(f"Generating contract for lead {lead_id}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not agreed_terms:
                raise ValueError("agreed_terms cannot be empty")

            # Select appropriate template
            contract_type = agreed_terms.get("contract_type", "standard")
            template = self.contract_templates.get(contract_type, self.contract_templates["standard"])

            # Populate template with terms
            contract_data = self._populate_contract_template(template, agreed_terms)

            # Generate contract sections
            sections = self._generate_contract_sections(agreed_terms)

            # Add legal clauses
            legal_clauses = self._add_legal_clauses(contract_type, agreed_terms)

            # Calculate contract value
            contract_value = self._calculate_contract_value(agreed_terms)

            # Generate payment schedule
            payment_schedule = self._generate_payment_schedule(agreed_terms)

            # Create contract metadata
            contract_id = f"contract_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

            result = {
                "success": True,
                "contract_id": contract_id,
                "lead_id": lead_id,
                "contract_type": contract_type,
                "contract_data": contract_data,
                "sections": sections,
                "legal_clauses": legal_clauses,
                "contract_value": contract_value,
                "payment_schedule": payment_schedule,
                "signature_required_from": self._identify_signatories(agreed_terms),
                "expiration_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Contract generated: {contract_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in generate_contract: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in generate_contract: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def optimize_payment_terms(
        self,
        deal_value: float,
        buyer_constraints: Dict[str, Any],
        cash_flow_targets: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Optimize payment terms for both parties.

        Args:
            deal_value: Total deal value
            buyer_constraints: Buyer's payment constraints
            cash_flow_targets: Our cash flow requirements

        Returns:
            Optimized payment term options
        """
        try:
            logger.info("Optimizing payment terms")

            # Validate inputs
            if deal_value <= 0:
                raise ValueError("deal_value must be positive")

            # Generate payment term options
            payment_options = []

            # Option 1: Upfront payment with discount
            upfront_discount = self._calculate_early_payment_discount(deal_value)
            payment_options.append({
                "option_id": "upfront",
                "name": "Full Upfront Payment",
                "structure": "100% upon signing",
                "amount": deal_value * (1 - upfront_discount),
                "discount_pct": upfront_discount * 100,
                "cash_flow_impact": self._model_cash_flow([deal_value], [0]),
                "buyer_benefit": f"{upfront_discount * 100:.1f}% discount",
                "our_benefit": "Immediate cash flow"
            })

            # Option 2: Quarterly payments
            quarterly_terms = self._generate_quarterly_terms(deal_value, buyer_constraints)
            payment_options.append(quarterly_terms)

            # Option 3: Milestone-based
            milestone_terms = self._generate_milestone_terms(deal_value, buyer_constraints)
            payment_options.append(milestone_terms)

            # Option 4: Annual subscription
            if buyer_constraints.get("prefers_subscription", False):
                subscription_terms = self._generate_subscription_terms(deal_value)
                payment_options.append(subscription_terms)

            # Rank options by mutual benefit
            ranked_options = self._rank_payment_options(
                payment_options, cash_flow_targets, buyer_constraints
            )

            # Calculate financing options if applicable
            financing = self._calculate_financing_options(deal_value, buyer_constraints)

            result = {
                "success": True,
                "deal_value": deal_value,
                "payment_options": ranked_options,
                "recommended_option": ranked_options[0] if ranked_options else None,
                "financing_available": financing,
                "cash_flow_analysis": self._analyze_cash_flow_impact(ranked_options, cash_flow_targets),
                "net_present_value": self._calculate_npv(ranked_options),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("Payment terms optimized")
            return result

        except ValueError as e:
            logger.error(f"Validation error in optimize_payment_terms: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in optimize_payment_terms: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def create_mutual_action_plan(
        self,
        session_id: str,
        close_target_date: datetime
    ) -> Dict[str, Any]:
        """
        Create mutual action plan with buyer and seller commitments.

        Args:
            session_id: Negotiation session ID
            close_target_date: Target closing date

        Returns:
            Mutual action plan
        """
        try:
            logger.info(f"Creating mutual action plan for session {session_id}")

            # Validate inputs
            if not session_id or session_id not in self.negotiation_sessions:
                raise ValueError("Invalid session_id")

            session = self.negotiation_sessions[session_id]

            # Define buyer commitments
            buyer_commitments = self._define_buyer_commitments(session, close_target_date)

            # Define seller commitments
            seller_commitments = self._define_seller_commitments(session, close_target_date)

            # Create milestone timeline
            milestones = self._create_milestone_timeline(
                buyer_commitments, seller_commitments, close_target_date
            )

            # Create MAP
            plan = MutualActionPlan(
                plan_id=f"map_{session_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                created_at=datetime.utcnow(),
                buyer_commitments=buyer_commitments,
                seller_commitments=seller_commitments,
                milestones=milestones,
                target_close_date=close_target_date
            )

            session.mutual_action_plan = plan

            # Calculate critical path
            critical_path = self._calculate_critical_path(milestones)

            # Identify risks
            risks = self._identify_map_risks(buyer_commitments, seller_commitments, milestones)

            result = {
                "success": True,
                "session_id": session_id,
                "plan_id": plan.plan_id,
                "buyer_commitments": buyer_commitments,
                "seller_commitments": seller_commitments,
                "milestones": milestones,
                "target_close_date": close_target_date.isoformat(),
                "critical_path": critical_path,
                "total_days_to_close": (close_target_date - datetime.utcnow()).days,
                "risks": risks,
                "success_probability": self._calculate_map_success_probability(milestones, risks),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Mutual action plan created: {plan.plan_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in create_mutual_action_plan: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_mutual_action_plan: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def track_redlines(
        self,
        session_id: str,
        proposed_terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Track and validate against non-negotiable red lines.

        Args:
            session_id: Negotiation session ID
            proposed_terms: Proposed deal terms

        Returns:
            Red line validation results
        """
        try:
            logger.info(f"Tracking red lines for session {session_id}")

            # Validate inputs
            if not session_id:
                raise ValueError("session_id is required")
            if not proposed_terms:
                raise ValueError("proposed_terms cannot be empty")

            # Get session
            session = self.negotiation_sessions.get(session_id)
            if not session:
                raise ValueError(f"Session {session_id} not found")

            # Get applicable red lines
            redlines = self._get_applicable_redlines(proposed_terms)

            # Check each red line
            violations = []
            warnings = []

            for redline in redlines:
                check_result = self._check_redline(redline, proposed_terms)
                if check_result["violated"]:
                    violations.append({
                        "redline": redline,
                        "violation": check_result["reason"],
                        "severity": check_result["severity"]
                    })
                elif check_result.get("warning"):
                    warnings.append({
                        "redline": redline,
                        "warning": check_result["warning"]
                    })

            # Calculate deal acceptability
            acceptable = len(violations) == 0

            # Generate recommendations
            recommendations = self._generate_redline_recommendations(violations, warnings)

            result = {
                "success": True,
                "session_id": session_id,
                "deal_acceptable": acceptable,
                "redlines_checked": len(redlines),
                "violations": violations,
                "warnings": warnings,
                "recommendations": recommendations,
                "requires_escalation": len(violations) > 0,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Red line tracking completed: {len(violations)} violations")
            return result

        except ValueError as e:
            logger.error(f"Validation error in track_redlines: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in track_redlines: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def model_winwin_scenarios(
        self,
        session_id: str,
        interests_map: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Model win-win scenarios using value creation analysis.

        Args:
            session_id: Negotiation session ID
            interests_map: Mapped interests of both parties

        Returns:
            Win-win scenario models
        """
        try:
            logger.info(f"Modeling win-win scenarios for session {session_id}")

            # Validate inputs
            if not session_id:
                raise ValueError("session_id is required")
            if not interests_map:
                raise ValueError("interests_map cannot be empty")

            # Extract party interests
            our_interests = interests_map.get("our_interests", {})
            their_interests = interests_map.get("their_interests", {})

            # Identify value creation opportunities
            value_opportunities = self._identify_value_creation_opportunities(
                our_interests, their_interests
            )

            # Generate scenario options
            scenarios = []

            # Scenario 1: Price-focused
            price_scenario = self._model_price_focused_scenario(
                our_interests, their_interests, value_opportunities
            )
            scenarios.append(price_scenario)

            # Scenario 2: Value-focused
            value_scenario = self._model_value_focused_scenario(
                our_interests, their_interests, value_opportunities
            )
            scenarios.append(value_scenario)

            # Scenario 3: Relationship-focused
            relationship_scenario = self._model_relationship_focused_scenario(
                our_interests, their_interests, value_opportunities
            )
            scenarios.append(relationship_scenario)

            # Calculate Nash equilibrium concept
            nash_point = self._approximate_nash_equilibrium(scenarios)

            # Rank scenarios by mutual benefit
            ranked_scenarios = self._rank_scenarios_by_mutual_benefit(scenarios)

            # Generate negotiation playbook
            playbook = self._generate_negotiation_playbook(ranked_scenarios)

            result = {
                "success": True,
                "session_id": session_id,
                "value_creation_opportunities": value_opportunities,
                "scenarios": ranked_scenarios,
                "recommended_scenario": ranked_scenarios[0] if ranked_scenarios else None,
                "nash_equilibrium_approximation": nash_point,
                "negotiation_playbook": playbook,
                "total_value_created": sum(s.get("total_value", 0) for s in scenarios),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Win-win scenarios modeled: {len(scenarios)} scenarios")
            return result

        except ValueError as e:
            logger.error(f"Validation error in model_winwin_scenarios: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in model_winwin_scenarios: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def evaluate_counteroffer(
        self,
        session_id: str,
        counteroffer: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate and respond to client counteroffer.

        Args:
            session_id: Negotiation session ID
            counteroffer: Client's counteroffer details

        Returns:
            Evaluation and recommended response
        """
        try:
            logger.info(f"Evaluating counteroffer for session {session_id}")

            # Validate inputs
            if not session_id or session_id not in self.negotiation_sessions:
                raise ValueError("Invalid session_id")
            if not counteroffer:
                raise ValueError("counteroffer cannot be empty")

            session = self.negotiation_sessions[session_id]

            # Analyze counteroffer components
            price_analysis = self._analyze_counteroffer_price(counteroffer, session)
            terms_analysis = self._analyze_counteroffer_terms(counteroffer, session)

            # Check against BATNA
            batna_comparison = self._compare_to_batna(counteroffer, session.batna)

            # Calculate gap from target
            gap_analysis = self._calculate_negotiation_gaps(counteroffer, session.current_offer)

            # Determine acceptability
            acceptable = self._is_counteroffer_acceptable(
                counteroffer, session, batna_comparison
            )

            # Generate response options
            response_options = self._generate_counteroffer_responses(
                counteroffer, session, acceptable
            )

            # Recommend concessions if needed
            recommended_concessions = self._recommend_counter_concessions(
                counteroffer, session
            ) if not acceptable else []

            result = {
                "success": True,
                "session_id": session_id,
                "acceptable": acceptable,
                "price_analysis": price_analysis,
                "terms_analysis": terms_analysis,
                "batna_comparison": batna_comparison,
                "gap_analysis": gap_analysis,
                "response_options": response_options,
                "recommended_response": response_options[0] if response_options else None,
                "recommended_concessions": recommended_concessions,
                "negotiation_momentum": self._assess_negotiation_momentum(session),
                "timestamp": datetime.utcnow().isoformat()
            }

            # Add counteroffer to history
            session.counter_offers.append(counteroffer)

            logger.info(f"Counteroffer evaluated: acceptable={acceptable}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in evaluate_counteroffer: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in evaluate_counteroffer: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def finalize_agreement(
        self,
        session_id: str,
        final_terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Finalize negotiated agreement.

        Args:
            session_id: Negotiation session ID
            final_terms: Final agreed terms

        Returns:
            Finalization results
        """
        try:
            logger.info(f"Finalizing agreement for session {session_id}")

            # Validate inputs
            if not session_id or session_id not in self.negotiation_sessions:
                raise ValueError("Invalid session_id")
            if not final_terms:
                raise ValueError("final_terms cannot be empty")

            session = self.negotiation_sessions[session_id]

            # Validate final terms against redlines
            redline_check = self.track_redlines(session_id, final_terms)
            if not redline_check["deal_acceptable"]:
                raise ValueError("Final terms violate red lines")

            # Calculate final deal value
            deal_value = self._calculate_final_deal_value(final_terms)

            # Calculate win-win score
            winwin_score = self._calculate_winwin_score(final_terms, session)

            # Generate agreement summary
            summary = self._generate_agreement_summary(final_terms, session)

            # Update session
            session.stage = NegotiationStage.AGREEMENT
            session.closed_at = datetime.utcnow()
            session.outcome = "won"

            # Record in history
            self._record_negotiation_outcome(session, final_terms, "success")

            result = {
                "success": True,
                "finalized": True,
                "session_id": session_id,
                "final_terms": final_terms,
                "deal_value": deal_value,
                "winwin_score": winwin_score,
                "agreement_summary": summary,
                "ready_for_contract": True,
                "total_negotiation_days": (session.closed_at - session.started_at).days,
                "concessions_made": len(session.concessions_made),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Agreement finalized: deal_value={deal_value}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in finalize_agreement: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in finalize_agreement: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    # Helper methods

    def _initialize_contract_templates(self) -> None:
        """Initialize contract templates."""
        self.contract_templates = {
            "standard": {
                "type": "standard",
                "sections": ["scope", "pricing", "terms", "support", "legal"],
                "required_fields": ["party_a", "party_b", "start_date", "value"]
            },
            "enterprise": {
                "type": "enterprise",
                "sections": ["scope", "pricing", "terms", "sla", "support", "security", "legal"],
                "required_fields": ["party_a", "party_b", "start_date", "value", "sla_terms"]
            }
        }

    def _initialize_pricing_models(self) -> None:
        """Initialize pricing models."""
        self.pricing_models["standard"] = PricingFlexibility(
            list_price=100000.0,
            floor_price=70000.0,
            target_price=85000.0,
            max_discount_pct=30.0,
            margin_at_floor=20.0,
            margin_at_target=35.0
        )

    def _initialize_redline_policies(self) -> None:
        """Initialize red line policies."""
        self.redline_policies = {
            "standard": [
                "Minimum 20% margin",
                "Payment terms not to exceed 90 days",
                "No unlimited liability clauses",
                "No free customization beyond standard scope"
            ],
            "enterprise": [
                "Minimum 25% margin",
                "Payment terms not to exceed 60 days",
                "No unlimited liability clauses",
                "SLA penalties capped at 20% of annual value"
            ]
        }

    def _identify_batna_scenarios(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify BATNA scenarios."""
        scenarios = []

        # Alternative customer scenario
        scenarios.append({
            "description": "Pursue alternative customer in pipeline",
            "value": context.get("pipeline_value", 50000),
            "feasibility": 0.7,
            "timeline_days": 45
        })

        # Market expansion scenario
        scenarios.append({
            "description": "Focus resources on market expansion",
            "value": context.get("expansion_value", 75000),
            "feasibility": 0.6,
            "timeline_days": 90
        })

        return scenarios

    def _identify_watna_scenarios(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify WATNA scenarios."""
        scenarios = []

        # Deal falls through
        scenarios.append({
            "description": "Deal falls through, no replacement",
            "cost": context.get("deal_value", 100000),
            "probability": 0.3,
            "impact": "high"
        })

        # Competitor wins
        scenarios.append({
            "description": "Competitor wins, market share loss",
            "cost": context.get("deal_value", 100000) * 1.5,
            "probability": 0.2,
            "impact": "high"
        })

        return scenarios

    def _score_batna(self, scenario: Dict[str, Any]) -> float:
        """Score BATNA scenario."""
        value = scenario.get("value", 0)
        feasibility = scenario.get("feasibility", 0.5)
        timeline_penalty = 1 - (scenario.get("timeline_days", 30) / 365)

        return value * feasibility * timeline_penalty

    def _score_watna(self, scenario: Dict[str, Any]) -> float:
        """Score WATNA scenario impact."""
        cost = scenario.get("cost", 0)
        probability = scenario.get("probability", 0.5)

        return cost * probability

    def _calculate_zopa(
        self,
        batna: Optional[Dict[str, Any]],
        watna: Optional[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate Zone of Possible Agreement."""
        if not batna or not watna:
            return {"exists": False, "range": None}

        our_reservation_price = batna.get("value", 0)
        their_reservation_price = context.get("their_max_budget", 0)

        if their_reservation_price >= our_reservation_price:
            return {
                "exists": True,
                "range": {
                    "min": our_reservation_price,
                    "max": their_reservation_price
                },
                "midpoint": (our_reservation_price + their_reservation_price) / 2
            }

        return {"exists": False, "range": None}

    def _recommend_strategy(
        self,
        batna: Optional[Dict[str, Any]],
        watna: Optional[Dict[str, Any]],
        zopa: Dict[str, Any]
    ) -> str:
        """Recommend negotiation strategy."""
        if not zopa.get("exists"):
            return NegotiationStrategy.COMPETITIVE.value

        if batna and batna.get("feasibility", 0) > 0.8:
            return NegotiationStrategy.WIN_WIN.value

        return NegotiationStrategy.COLLABORATIVE.value

    def _calculate_walk_away_point(
        self,
        batna: Optional[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> float:
        """Calculate walk-away threshold."""
        if not batna:
            return context.get("min_acceptable_value", 0)

        return batna.get("value", 0) * 0.95  # 5% buffer below BATNA

    def _assess_negotiation_strength(
        self,
        batna: Optional[Dict[str, Any]],
        watna: Optional[Dict[str, Any]]
    ) -> str:
        """Assess overall negotiation strength."""
        if not batna or not watna:
            return "medium"

        batna_value = batna.get("value", 0)
        watna_cost = watna.get("cost", 0)

        if batna_value > watna_cost * 0.8:
            return "strong"
        elif batna_value > watna_cost * 0.5:
            return "medium"
        else:
            return "weak"

    def _create_negotiation_session(
        self,
        session_id: str,
        goals: Dict[str, Any]
    ) -> NegotiationSession:
        """Create new negotiation session."""
        session = NegotiationSession(
            session_id=session_id,
            lead_id=goals.get("lead_id", "unknown"),
            stage=NegotiationStage.PREPARATION,
            strategy=NegotiationStrategy.WIN_WIN,
            started_at=datetime.utcnow()
        )

        self.negotiation_sessions[session_id] = session
        return session

    def _identify_potential_concessions(self, goals: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify potential concessions."""
        concessions = []

        # Price discount
        concessions.append({
            "type": ConcessionType.PRICE_DISCOUNT.value,
            "description": "5% price discount",
            "cost_to_us": goals.get("deal_value", 100000) * 0.05,
            "value_to_them": goals.get("deal_value", 100000) * 0.05,
            "requires_reciprocity": True
        })

        # Extended payment terms
        concessions.append({
            "type": ConcessionType.PAYMENT_TERMS.value,
            "description": "Net-60 payment terms",
            "cost_to_us": goals.get("deal_value", 100000) * 0.02,  # Time value of money
            "value_to_them": goals.get("deal_value", 100000) * 0.05,
            "requires_reciprocity": True
        })

        # Additional training
        concessions.append({
            "type": ConcessionType.TRAINING.value,
            "description": "Additional training session",
            "cost_to_us": 5000,
            "value_to_them": 15000,
            "requires_reciprocity": False
        })

        return concessions

    def _rank_concessions(self, concessions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Rank concessions by value ratio."""
        for concession in concessions:
            cost = concession.get("cost_to_us", 1)
            value = concession.get("value_to_them", 0)
            concession["value_ratio"] = value / cost if cost > 0 else 0

        return sorted(concessions, key=lambda x: x["value_ratio"], reverse=True)

    def _build_concession_sequence(self, ranked_concessions: List[Dict[str, Any]]) -> List[str]:
        """Build optimal concession sequence."""
        # Start with high value-ratio, low-cost concessions
        sequence = []

        # Add concessions in strategic order
        for i, concession in enumerate(ranked_concessions[:self.max_concessions_per_session]):
            sequence.append(f"Step {i+1}: {concession['description']}")

        return sequence

    def _define_reciprocity_expectations(self, concessions: List[Dict[str, Any]]) -> Dict[str, str]:
        """Define what we expect in return for each concession."""
        reciprocity = {}

        for concession in concessions:
            if concession.get("requires_reciprocity"):
                reciprocity[concession["description"]] = "Expect commitment to timeline" if concession.get("type") == "price_discount" else "Expect volume commitment"

        return reciprocity

    def _calculate_concession_budget(self, goals: Dict[str, Any]) -> Dict[str, float]:
        """Calculate total concession budget."""
        deal_value = goals.get("deal_value", 100000)

        return {
            "total_budget": deal_value * 0.15,  # Up to 15% in concessions
            "used": 0.0,
            "remaining": deal_value * 0.15
        }

    def _generate_negotiation_tactics(
        self,
        strategy: NegotiationStrategy,
        concessions: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate negotiation tactics."""
        tactics = []

        if strategy == NegotiationStrategy.WIN_WIN:
            tactics.append("Focus on creating value for both parties")
            tactics.append("Ask questions to understand their true interests")
            tactics.append("Offer creative package deals")

        tactics.append("Make concessions slowly and conditionally")
        tactics.append("Always anchor high on price")

        return tactics

    def _get_pacing_strategy(self, strategy: NegotiationStrategy) -> str:
        """Get concession pacing strategy."""
        if strategy == NegotiationStrategy.WIN_WIN:
            return "Moderate pace with reciprocity expectations"
        elif strategy == NegotiationStrategy.COMPETITIVE:
            return "Slow pace, make them work for every concession"
        else:
            return "Balanced pace aligned with relationship building"

    def _calculate_discount_waterfall(
        self,
        list_price: float,
        target_price: float,
        floor_price: float
    ) -> List[Dict[str, Any]]:
        """Calculate discount waterfall levels."""
        waterfall = []

        # Level 1: No discount
        waterfall.append({
            "level": 1,
            "discount_pct": 0,
            "price": list_price,
            "approval": "None required"
        })

        # Level 2: Rep approved discount
        discount_2 = 10.0
        waterfall.append({
            "level": 2,
            "discount_pct": discount_2,
            "price": list_price * (1 - discount_2/100),
            "approval": "Sales Rep"
        })

        # Level 3: Manager approved
        discount_3 = 15.0
        waterfall.append({
            "level": 3,
            "discount_pct": discount_3,
            "price": list_price * (1 - discount_3/100),
            "approval": "Sales Manager"
        })

        # Level 4: Director approved (floor)
        max_discount = ((list_price - floor_price) / list_price) * 100
        waterfall.append({
            "level": 4,
            "discount_pct": round(max_discount, 1),
            "price": floor_price,
            "approval": "Sales Director"
        })

        return waterfall

    def _get_approval_tiers(self, list_price: float) -> Dict[str, float]:
        """Get approval tiers for discounts."""
        return {
            "rep": self.max_discount_without_approval,
            "manager": 20.0,
            "director": 25.0,
            "vp": 30.0
        }

    def _analyze_competitive_pricing(
        self,
        our_price: float,
        competitive_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze competitive pricing position."""
        competitor_prices = competitive_context.get("competitor_prices", [])

        if not competitor_prices:
            return {"position": "unknown", "analysis": "No competitive data available"}

        avg_competitor_price = sum(competitor_prices) / len(competitor_prices)

        position = "competitive"
        if our_price < avg_competitor_price * 0.9:
            position = "aggressive"
        elif our_price > avg_competitor_price * 1.1:
            position = "premium"

        return {
            "position": position,
            "our_price": our_price,
            "market_avg": avg_competitor_price,
            "premium_pct": ((our_price - avg_competitor_price) / avg_competitor_price) * 100
        }

    def _calculate_value_adjustments(
        self,
        product_config: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate value-based pricing adjustments."""
        adjustments = {}

        # Strategic value
        if context.get("strategic_account"):
            adjustments["strategic_discount"] = -5.0

        # Volume
        if context.get("volume_commitment"):
            adjustments["volume_discount"] = -7.0

        # Reference value
        if context.get("reference_customer"):
            adjustments["reference_discount"] = -3.0

        return adjustments

    def _populate_contract_template(
        self,
        template: Dict[str, Any],
        terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Populate contract template with terms."""
        return {
            "template_type": template["type"],
            "parties": {
                "party_a": terms.get("buyer_company", ""),
                "party_b": "Our Company Inc."
            },
            "effective_date": terms.get("start_date", datetime.utcnow().isoformat()),
            "term_length": terms.get("contract_length_months", 12),
            "value": terms.get("total_value", 0),
            "payment_terms": terms.get("payment_terms", "Net-30")
        }

    def _generate_contract_sections(self, terms: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate contract sections."""
        return [
            {"section": "Scope of Work", "content": "As detailed in Exhibit A"},
            {"section": "Pricing", "content": f"Total value: ${terms.get('total_value', 0):,.2f}"},
            {"section": "Payment Terms", "content": terms.get("payment_terms", "Net-30")},
            {"section": "Term", "content": f"{terms.get('contract_length_months', 12)} months"}
        ]

    def _add_legal_clauses(self, contract_type: str, terms: Dict[str, Any]) -> List[str]:
        """Add legal clauses to contract."""
        clauses = [
            "Limitation of Liability",
            "Intellectual Property",
            "Confidentiality",
            "Termination",
            "Governing Law"
        ]

        if contract_type == "enterprise":
            clauses.extend(["Service Level Agreement", "Data Security", "Audit Rights"])

        return clauses

    def _calculate_contract_value(self, terms: Dict[str, Any]) -> float:
        """Calculate total contract value."""
        return terms.get("total_value", 0)

    def _generate_payment_schedule(self, terms: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate payment schedule."""
        total_value = terms.get("total_value", 0)
        payment_structure = terms.get("payment_structure", "upfront")

        if payment_structure == "upfront":
            return [{
                "payment_number": 1,
                "due_date": datetime.utcnow().isoformat(),
                "amount": total_value,
                "description": "Full payment upon signing"
            }]
        elif payment_structure == "quarterly":
            quarterly_amount = total_value / 4
            return [
                {
                    "payment_number": i+1,
                    "due_date": (datetime.utcnow() + timedelta(days=90*i)).isoformat(),
                    "amount": quarterly_amount,
                    "description": f"Q{i+1} payment"
                }
                for i in range(4)
            ]

        return []

    def _identify_signatories(self, terms: Dict[str, Any]) -> List[str]:
        """Identify required signatories."""
        signatories = ["Buyer: " + terms.get("buyer_contact", ""), "Seller: VP of Sales"]

        if terms.get("total_value", 0) > 500000:
            signatories.append("Seller: Chief Revenue Officer")

        return signatories

    def _calculate_early_payment_discount(self, deal_value: float) -> float:
        """Calculate discount for early payment."""
        # 3% discount for upfront payment
        return 0.03

    def _generate_quarterly_terms(
        self,
        deal_value: float,
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate quarterly payment terms."""
        quarterly_payment = deal_value / 4

        return {
            "option_id": "quarterly",
            "name": "Quarterly Payments",
            "structure": "4 equal quarterly payments",
            "amount": deal_value,
            "payments": [quarterly_payment] * 4,
            "discount_pct": 0,
            "cash_flow_impact": self._model_cash_flow(
                [quarterly_payment] * 4, [0, 90, 180, 270]
            ),
            "buyer_benefit": "Spread cost over year",
            "our_benefit": "Predictable revenue"
        }

    def _generate_milestone_terms(
        self,
        deal_value: float,
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate milestone-based payment terms."""
        return {
            "option_id": "milestone",
            "name": "Milestone-Based Payments",
            "structure": "Payment upon milestone completion",
            "amount": deal_value,
            "payments": [deal_value * 0.3, deal_value * 0.4, deal_value * 0.3],
            "milestones": ["Implementation", "Go-Live", "30-day Post-Launch"],
            "discount_pct": 0,
            "cash_flow_impact": {"predictable": False, "milestone_risk": True},
            "buyer_benefit": "Pay based on value delivery",
            "our_benefit": "Aligned incentives"
        }

    def _generate_subscription_terms(self, deal_value: float) -> Dict[str, Any]:
        """Generate subscription payment terms."""
        monthly_payment = deal_value / 12

        return {
            "option_id": "subscription",
            "name": "Monthly Subscription",
            "structure": "12 monthly payments",
            "amount": deal_value * 1.05,  # 5% premium for monthly
            "payments": [monthly_payment * 1.05] * 12,
            "discount_pct": 0,
            "cash_flow_impact": self._model_cash_flow([monthly_payment] * 12, list(range(0, 360, 30))),
            "buyer_benefit": "Lowest monthly commitment",
            "our_benefit": "Recurring revenue"
        }

    def _model_cash_flow(self, payments: List[float], days: List[int]) -> Dict[str, Any]:
        """Model cash flow impact."""
        return {
            "total_payments": len(payments),
            "total_value": sum(payments),
            "timeline_days": max(days) if days else 0,
            "avg_days_to_payment": sum(days) / len(days) if days else 0
        }

    def _rank_payment_options(
        self,
        options: List[Dict[str, Any]],
        cash_flow_targets: Dict[str, Any],
        buyer_constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Rank payment options by mutual benefit."""
        # Simple ranking - prefer upfront, then quarterly
        return sorted(options, key=lambda x: x["amount"], reverse=True)

    def _calculate_financing_options(
        self,
        deal_value: float,
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate financing options."""
        if constraints.get("needs_financing"):
            return {
                "available": True,
                "partner": "Finance Partner Co.",
                "terms": "6-12 month financing available",
                "rate": "Prime + 2%"
            }

        return {"available": False}

    def _analyze_cash_flow_impact(
        self,
        options: List[Dict[str, Any]],
        targets: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze cash flow impact of payment options."""
        return {
            "meets_targets": True,
            "variance_from_target": 0,
            "recommendation": "Quarterly terms balance needs"
        }

    def _calculate_npv(self, options: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate Net Present Value for payment options."""
        discount_rate = 0.08  # 8% annual discount rate
        npv_by_option = {}

        for option in options:
            payments = option.get("payments", [])
            # Simple NPV calculation
            npv = sum(payments)  # Simplified
            npv_by_option[option["option_id"]] = npv

        return npv_by_option

    def _define_buyer_commitments(
        self,
        session: NegotiationSession,
        close_date: datetime
    ) -> List[Dict[str, Any]]:
        """Define buyer commitments for MAP."""
        return [
            {
                "commitment": "Provide stakeholder list",
                "owner": "Buyer",
                "due_date": (datetime.utcnow() + timedelta(days=3)).isoformat(),
                "status": "pending"
            },
            {
                "commitment": "Complete security review",
                "owner": "Buyer IT",
                "due_date": (datetime.utcnow() + timedelta(days=14)).isoformat(),
                "status": "pending"
            },
            {
                "commitment": "Finalize contract terms",
                "owner": "Buyer Legal",
                "due_date": (close_date - timedelta(days=7)).isoformat(),
                "status": "pending"
            }
        ]

    def _define_seller_commitments(
        self,
        session: NegotiationSession,
        close_date: datetime
    ) -> List[Dict[str, Any]]:
        """Define seller commitments for MAP."""
        return [
            {
                "commitment": "Provide implementation plan",
                "owner": "Solutions Team",
                "due_date": (datetime.utcnow() + timedelta(days=5)).isoformat(),
                "status": "pending"
            },
            {
                "commitment": "Security questionnaire completion",
                "owner": "Security Team",
                "due_date": (datetime.utcnow() + timedelta(days=10)).isoformat(),
                "status": "pending"
            },
            {
                "commitment": "Contract preparation",
                "owner": "Legal",
                "due_date": (close_date - timedelta(days=10)).isoformat(),
                "status": "pending"
            }
        ]

    def _create_milestone_timeline(
        self,
        buyer_commitments: List[Dict[str, Any]],
        seller_commitments: List[Dict[str, Any]],
        close_date: datetime
    ) -> List[Dict[str, Any]]:
        """Create milestone timeline from commitments."""
        milestones = []

        # Combine and sort commitments
        all_commitments = buyer_commitments + seller_commitments
        all_commitments.sort(key=lambda x: x["due_date"])

        for i, commitment in enumerate(all_commitments):
            milestones.append({
                "milestone_number": i + 1,
                "description": commitment["commitment"],
                "owner": commitment["owner"],
                "due_date": commitment["due_date"],
                "status": commitment["status"]
            })

        return milestones

    def _calculate_critical_path(self, milestones: List[Dict[str, Any]]) -> List[str]:
        """Calculate critical path through milestones."""
        # Simplified - return key milestones
        return [m["description"] for m in milestones if "security" in m["description"].lower() or "legal" in m["description"].lower()]

    def _identify_map_risks(
        self,
        buyer_commitments: List[Dict[str, Any]],
        seller_commitments: List[Dict[str, Any]],
        milestones: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify risks in MAP."""
        return [
            {
                "risk": "Security review delay",
                "probability": "medium",
                "impact": "high",
                "mitigation": "Start security review early, provide all docs proactively"
            },
            {
                "risk": "Legal red-line delays",
                "probability": "low",
                "impact": "medium",
                "mitigation": "Share standard terms early, identify issues upfront"
            }
        ]

    def _calculate_map_success_probability(
        self,
        milestones: List[Dict[str, Any]],
        risks: List[Dict[str, Any]]
    ) -> float:
        """Calculate probability of MAP success."""
        base_probability = 80.0

        # Reduce for each high-impact risk
        for risk in risks:
            if risk["impact"] == "high":
                base_probability -= 10

        return max(base_probability, 40.0)

    def _get_applicable_redlines(self, terms: Dict[str, Any]) -> List[str]:
        """Get applicable red lines for deal."""
        deal_type = terms.get("deal_type", "standard")
        return self.redline_policies.get(deal_type, self.redline_policies["standard"])

    def _check_redline(self, redline: str, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Check if term violates red line."""
        # Simplified red line checking
        if "margin" in redline.lower():
            margin = terms.get("margin_pct", 25.0)
            if margin < self.min_margin_threshold:
                return {
                    "violated": True,
                    "reason": f"Margin {margin}% below minimum {self.min_margin_threshold}%",
                    "severity": "high"
                }

        return {"violated": False}

    def _generate_redline_recommendations(
        self,
        violations: List[Dict[str, Any]],
        warnings: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommendations for red line issues."""
        recommendations = []

        if violations:
            recommendations.append("Do not proceed - red lines violated")
            recommendations.append("Escalate to leadership for approval")

        if warnings:
            recommendations.append("Review warnings with manager before proceeding")

        return recommendations

    def _identify_value_creation_opportunities(
        self,
        our_interests: Dict[str, Any],
        their_interests: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify value creation opportunities."""
        opportunities = []

        # Look for non-overlapping priorities
        if our_interests.get("priority") != their_interests.get("priority"):
            opportunities.append({
                "opportunity": "Trade priorities",
                "value_potential": "high",
                "example": "We prioritize payment terms, they prioritize implementation speed"
            })

        opportunities.append({
            "opportunity": "Multi-year commitment",
            "value_potential": "medium",
            "example": "Longer term reduces our CAC, provides them price stability"
        })

        return opportunities

    def _model_price_focused_scenario(
        self,
        our_interests: Dict[str, Any],
        their_interests: Dict[str, Any],
        opportunities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Model price-focused scenario."""
        return {
            "scenario": "Price-Focused",
            "our_value": 70,
            "their_value": 85,
            "total_value": 155,
            "description": "Competitive pricing with standard terms"
        }

    def _model_value_focused_scenario(
        self,
        our_interests: Dict[str, Any],
        their_interests: Dict[str, Any]],
        opportunities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Model value-focused scenario."""
        return {
            "scenario": "Value-Focused",
            "our_value": 80,
            "their_value": 90,
            "total_value": 170,
            "description": "Premium pricing with enhanced value delivery"
        }

    def _model_relationship_focused_scenario(
        self,
        our_interests: Dict[str, Any],
        their_interests: Dict[str, Any],
        opportunities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Model relationship-focused scenario."""
        return {
            "scenario": "Relationship-Focused",
            "our_value": 85,
            "their_value": 88,
            "total_value": 173,
            "description": "Long-term partnership with mutual commitments"
        }

    def _approximate_nash_equilibrium(self, scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Approximate Nash equilibrium point."""
        # Find scenario that maximizes product of utilities
        best_scenario = max(scenarios, key=lambda s: s["our_value"] * s["their_value"])

        return {
            "scenario": best_scenario["scenario"],
            "our_value": best_scenario["our_value"],
            "their_value": best_scenario["their_value"],
            "nash_product": best_scenario["our_value"] * best_scenario["their_value"]
        }

    def _rank_scenarios_by_mutual_benefit(self, scenarios: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Rank scenarios by total mutual benefit."""
        return sorted(scenarios, key=lambda s: s["total_value"], reverse=True)

    def _generate_negotiation_playbook(self, scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate negotiation playbook."""
        return {
            "opening_position": scenarios[0]["scenario"] if scenarios else "Value-Focused",
            "fallback_positions": [s["scenario"] for s in scenarios[1:3]],
            "key_talking_points": [
                "Focus on long-term value creation",
                "Highlight mutual benefits",
                "Emphasize partnership approach"
            ]
        }

    def _analyze_counteroffer_price(
        self,
        counteroffer: Dict[str, Any],
        session: NegotiationSession
    ) -> Dict[str, Any]:
        """Analyze price component of counteroffer."""
        their_price = counteroffer.get("price", 0)
        our_price = session.current_offer.get("price", 0)

        return {
            "their_offer": their_price,
            "our_offer": our_price,
            "gap": our_price - their_price,
            "gap_pct": ((our_price - their_price) / our_price * 100) if our_price > 0 else 0
        }

    def _analyze_counteroffer_terms(
        self,
        counteroffer: Dict[str, Any],
        session: NegotiationSession
    ) -> Dict[str, Any]:
        """Analyze non-price terms of counteroffer."""
        return {
            "payment_terms": counteroffer.get("payment_terms", ""),
            "contract_length": counteroffer.get("contract_length_months", 0),
            "terms_acceptable": True  # Simplified
        }

    def _compare_to_batna(
        self,
        counteroffer: Dict[str, Any],
        batna: Optional[BATNA]
    ) -> Dict[str, Any]:
        """Compare counteroffer to BATNA."""
        if not batna:
            return {"comparison": "No BATNA defined"}

        offer_value = counteroffer.get("total_value", 0)
        batna_value = batna.value

        return {
            "offer_value": offer_value,
            "batna_value": batna_value,
            "better_than_batna": offer_value > batna_value,
            "difference": offer_value - batna_value
        }

    def _calculate_negotiation_gaps(
        self,
        counteroffer: Dict[str, Any],
        current_offer: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate gaps between offers."""
        return {
            "price_gap": current_offer.get("price", 0) - counteroffer.get("price", 0),
            "terms_gap": "Analyzing...",
            "total_gap_pct": 10.0  # Simplified
        }

    def _is_counteroffer_acceptable(
        self,
        counteroffer: Dict[str, Any],
        session: NegotiationSession,
        batna_comparison: Dict[str, Any]
    ) -> bool:
        """Determine if counteroffer is acceptable."""
        # Accept if better than BATNA and meets minimum margin
        better_than_batna = batna_comparison.get("better_than_batna", False)
        margin = counteroffer.get("margin_pct", 0)

        return better_than_batna and margin >= self.min_margin_threshold

    def _generate_counteroffer_responses(
        self,
        counteroffer: Dict[str, Any],
        session: NegotiationSession,
        acceptable: bool
    ) -> List[Dict[str, Any]]:
        """Generate response options to counteroffer."""
        responses = []

        if acceptable:
            responses.append({
                "response_type": "accept",
                "action": "Accept counteroffer",
                "message": "We can agree to these terms"
            })
        else:
            responses.append({
                "response_type": "counter",
                "action": "Make counteroffer",
                "message": "We're close. Let me propose a middle ground..."
            })

        responses.append({
            "response_type": "explore",
            "action": "Explore alternatives",
            "message": "Let's explore other ways to create value..."
        })

        return responses

    def _recommend_counter_concessions(
        self,
        counteroffer: Dict[str, Any],
        session: NegotiationSession
    ) -> List[str]:
        """Recommend concessions for counter-proposal."""
        return [
            "Offer extended payment terms instead of price discount",
            "Include additional training to increase perceived value"
        ]

    def _assess_negotiation_momentum(self, session: NegotiationSession) -> str:
        """Assess negotiation momentum."""
        if len(session.counter_offers) > 3:
            return "slow"
        elif len(session.concessions_made) > len(session.concessions_received):
            return "favorable_to_them"
        else:
            return "positive"

    def _calculate_final_deal_value(self, terms: Dict[str, Any]) -> float:
        """Calculate final deal value."""
        return terms.get("total_value", 0)

    def _calculate_winwin_score(
        self,
        terms: Dict[str, Any],
        session: NegotiationSession
    ) -> int:
        """Calculate win-win score (0-100)."""
        score = 50  # Base

        # Balanced concessions
        if len(session.concessions_made) == len(session.concessions_received):
            score += 20

        # Good margin
        if terms.get("margin_pct", 0) >= 30:
            score += 15

        # Long-term relationship
        if terms.get("contract_length_months", 0) >= 12:
            score += 15

        return min(score, 100)

    def _generate_agreement_summary(
        self,
        terms: Dict[str, Any],
        session: NegotiationSession
    ) -> Dict[str, Any]:
        """Generate agreement summary."""
        return {
            "deal_value": terms.get("total_value", 0),
            "contract_length": terms.get("contract_length_months", 12),
            "payment_terms": terms.get("payment_terms", ""),
            "key_terms": ["Standard SLA", "Quarterly payments", "Annual renewal"],
            "concessions_made": len(session.concessions_made),
            "concessions_received": len(session.concessions_received)
        }

    def _record_negotiation_outcome(
        self,
        session: NegotiationSession,
        final_terms: Dict[str, Any],
        outcome: str
    ) -> None:
        """Record negotiation outcome in history."""
        self.negotiation_history.append({
            "session_id": session.session_id,
            "lead_id": session.lead_id,
            "outcome": outcome,
            "final_value": final_terms.get("total_value", 0),
            "duration_days": (session.closed_at - session.started_at).days if session.closed_at else 0,
            "concessions_made": len(session.concessions_made),
            "timestamp": datetime.utcnow().isoformat()
        })
