"""
Objection Handler Agent

Identifies, categorizes, and addresses sales objections effectively.
Implements proven frameworks and evidence-based responses.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
from collections import defaultdict
import re

logger = logging.getLogger(__name__)


class ObjectionType(Enum):
    """Types of sales objections."""
    PRICE = "price"
    PRODUCT = "product"
    TIMING = "timing"
    COMPETITION = "competition"
    TRUST = "trust"
    AUTHORITY = "authority"
    NEED = "need"


class ResponseFramework(Enum):
    """Objection handling frameworks."""
    FEEL_FELT_FOUND = "feel_felt_found"
    BOOMERANG = "boomerang"
    QUESTION_METHOD = "question_method"
    ACKNOWLEDGMENT = "acknowledgment"
    CLARIFICATION = "clarification"
    REFRAME = "reframe"
    ISOLATE = "isolate"


class ObjectionSeverity(Enum):
    """Severity levels for objections."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EvidenceType(Enum):
    """Types of supporting evidence."""
    CASE_STUDY = "case_study"
    TESTIMONIAL = "testimonial"
    ROI_DATA = "roi_data"
    SOCIAL_PROOF = "social_proof"
    DEMO = "demo"
    TRIAL = "trial"
    COMPARISON = "comparison"


@dataclass
class Objection:
    """Structured objection data."""
    objection_id: str
    lead_id: str
    type: ObjectionType
    severity: ObjectionSeverity
    statement: str
    context: str
    raised_at: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    framework_used: Optional[ResponseFramework] = None
    response: str = ""
    evidence_provided: List[str] = field(default_factory=list)
    follow_up_required: bool = False
    escalated: bool = False
    resolution_notes: str = ""


@dataclass
class BattleCard:
    """Competitive battle card."""
    competitor_name: str
    competitor_id: str
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    our_advantages: List[str] = field(default_factory=list)
    talking_points: List[str] = field(default_factory=list)
    common_objections: List[str] = field(default_factory=list)
    win_strategies: List[str] = field(default_factory=list)
    pricing_comparison: Dict[str, Any] = field(default_factory=dict)
    feature_comparison: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WinbackStrategy:
    """Strategy for winning back lost deals."""
    strategy_id: str
    lost_reason: str
    wait_period_days: int
    approach: str
    messaging: List[str] = field(default_factory=list)
    triggers: List[str] = field(default_factory=list)
    success_rate: float = 0.0
    recommended_offer: Dict[str, Any] = field(default_factory=dict)


class ObjectionHandlerAgent:
    """
    Production-grade Objection Handler Agent.

    Systematically identifies, categorizes, and addresses sales objections
    using proven frameworks, evidence-based responses, and strategic escalation.

    Features:
    - Multi-type objection categorization (Price, Product, Timing, Competition, Trust)
    - Framework-based responses (Feel-Felt-Found, Boomerang, Question Method, etc.)
    - Comprehensive evidence database (case studies, testimonials, ROI data)
    - Smart escalation logic for complex objections
    - Pattern analysis across objections
    - Win-back strategies for lost deals
    - Competitive battle cards
    - Objection tracking and resolution metrics
    - Context-aware response generation
    - Severity assessment and prioritization
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Objection Handler Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.name = "Objection Handler"
        self.role = "Objection Handling Specialist"
        self.goal = "Address concerns and build confidence in the solution"

        # Configuration
        self.auto_escalate_threshold = self.config.get("auto_escalate_threshold", "critical")
        self.max_resolution_attempts = self.config.get("max_resolution_attempts", 3)
        self.evidence_min_relevance = self.config.get("evidence_min_relevance", 0.7)

        # Storage
        self.objections: Dict[str, Objection] = {}
        self.lead_objections: Dict[str, List[str]] = defaultdict(list)
        self.evidence_database: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.battle_cards: Dict[str, BattleCard] = {}
        self.winback_strategies: Dict[str, WinbackStrategy] = {}
        self.objection_patterns: Dict[str, Dict[str, Any]] = defaultdict(dict)

        # Initialize databases
        self._initialize_evidence_database()
        self._initialize_battle_cards()
        self._initialize_winback_strategies()

        # Analytics
        self.resolution_history: List[Dict[str, Any]] = []
        self.pattern_trends: Dict[str, List[float]] = defaultdict(list)

        logger.info("Objection Handler initialized")

    def identify_objection(self, statement: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Identify and categorize an objection from customer statement.

        Args:
            statement: Customer statement containing objection
            context: Context information (lead_id, stage, previous objections, etc.)

        Returns:
            Objection analysis with categorization and severity
        """
        try:
            logger.info("Starting objection identification")

            # Validate inputs
            if not statement:
                raise ValueError("statement cannot be empty")
            if not isinstance(statement, str):
                raise ValueError("statement must be a string")

            lead_id = context.get("lead_id", "unknown")

            # Categorize objection type
            objection_type = self.categorize_objection(statement)

            # Assess severity
            severity = self._assess_severity(statement, context)

            # Extract key phrases
            key_phrases = self._extract_key_phrases(statement)

            # Check for hidden objections
            hidden_objections = self._detect_hidden_objections(statement, context)

            # Determine urgency
            urgency = self._calculate_urgency(severity, context)

            # Create objection record
            objection_id = f"obj_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            objection = Objection(
                objection_id=objection_id,
                lead_id=lead_id,
                type=objection_type,
                severity=severity,
                statement=statement,
                context=json.dumps(context),
                raised_at=datetime.utcnow()
            )

            self.objections[objection_id] = objection
            self.lead_objections[lead_id].append(objection_id)

            result = {
                "success": True,
                "objection_id": objection_id,
                "lead_id": lead_id,
                "objection_type": objection_type.value,
                "severity": severity.value,
                "urgency": urgency,
                "key_phrases": key_phrases,
                "hidden_objections": hidden_objections,
                "requires_immediate_response": urgency == "high",
                "recommended_framework": self._recommend_framework(objection_type, severity),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Objection identified: {objection_type.value} (severity: {severity.value})")
            return result

        except ValueError as e:
            logger.error(f"Validation error in identify_objection: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in identify_objection: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def categorize_objection(self, statement: str) -> ObjectionType:
        """
        Categorize objection into one of 5 primary types.

        Args:
            statement: Customer objection statement

        Returns:
            Objection type classification
        """
        try:
            statement_lower = statement.lower()

            # Price objections
            price_keywords = ["expensive", "cost", "price", "budget", "afford", "cheaper", "discount"]
            if any(keyword in statement_lower for keyword in price_keywords):
                return ObjectionType.PRICE

            # Product objections
            product_keywords = ["feature", "functionality", "doesn't work", "missing", "lacking", "capability"]
            if any(keyword in statement_lower for keyword in product_keywords):
                return ObjectionType.PRODUCT

            # Timing objections
            timing_keywords = ["not ready", "later", "next quarter", "next year", "timing", "too soon", "too early"]
            if any(keyword in statement_lower for keyword in timing_keywords):
                return ObjectionType.TIMING

            # Competition objections
            competition_keywords = ["competitor", "alternative", "using", "already have", "satisfied with"]
            if any(keyword in statement_lower for keyword in competition_keywords):
                return ObjectionType.COMPETITION

            # Trust objections
            trust_keywords = ["trust", "risk", "proven", "track record", "references", "uncertain", "concerned"]
            if any(keyword in statement_lower for keyword in trust_keywords):
                return ObjectionType.TRUST

            # Authority objections
            authority_keywords = ["decision maker", "approval", "boss", "team", "need to discuss"]
            if any(keyword in statement_lower for keyword in authority_keywords):
                return ObjectionType.AUTHORITY

            # Default to need objection
            return ObjectionType.NEED

        except Exception as e:
            logger.error(f"Error categorizing objection: {e}", exc_info=True)
            return ObjectionType.NEED

    def select_response_framework(
        self,
        objection_type: ObjectionType,
        severity: ObjectionSeverity,
        context: Dict[str, Any]
    ) -> ResponseFramework:
        """
        Select appropriate response framework based on context.

        Args:
            objection_type: Type of objection
            severity: Severity level
            context: Situational context

        Returns:
            Recommended response framework
        """
        try:
            # Price objections - use Feel-Felt-Found or Reframe
            if objection_type == ObjectionType.PRICE:
                if severity in [ObjectionSeverity.HIGH, ObjectionSeverity.CRITICAL]:
                    return ResponseFramework.FEEL_FELT_FOUND
                return ResponseFramework.REFRAME

            # Product objections - use Question Method or Clarification
            elif objection_type == ObjectionType.PRODUCT:
                return ResponseFramework.QUESTION_METHOD

            # Timing objections - use Isolate or Boomerang
            elif objection_type == ObjectionType.TIMING:
                return ResponseFramework.ISOLATE

            # Competition objections - use Acknowledgment
            elif objection_type == ObjectionType.COMPETITION:
                return ResponseFramework.ACKNOWLEDGMENT

            # Trust objections - use Feel-Felt-Found
            elif objection_type == ObjectionType.TRUST:
                return ResponseFramework.FEEL_FELT_FOUND

            # Authority objections - use Question Method
            elif objection_type == ObjectionType.AUTHORITY:
                return ResponseFramework.QUESTION_METHOD

            # Default
            return ResponseFramework.ACKNOWLEDGMENT

        except Exception as e:
            logger.error(f"Error selecting framework: {e}", exc_info=True)
            return ResponseFramework.ACKNOWLEDGMENT

    def handle_objection(
        self,
        objection_id: str,
        framework: Optional[ResponseFramework] = None
    ) -> Dict[str, Any]:
        """
        Handle objection using selected framework.

        Args:
            objection_id: Objection identifier
            framework: Optional specific framework to use

        Returns:
            Response with framework application and evidence
        """
        try:
            logger.info(f"Starting objection handling for {objection_id}")

            # Validate inputs
            if not objection_id or objection_id not in self.objections:
                raise ValueError(f"Invalid objection_id: {objection_id}")

            objection = self.objections[objection_id]

            # Select framework if not provided
            if not framework:
                framework = self.select_response_framework(
                    objection.type,
                    objection.severity,
                    json.loads(objection.context)
                )

            # Generate response using framework
            response = self._apply_framework(objection, framework)

            # Retrieve supporting evidence
            evidence = self.retrieve_evidence(
                objection_type=objection.type,
                context=json.loads(objection.context)
            )

            # Build complete response
            complete_response = self._build_complete_response(
                response=response,
                evidence=evidence,
                framework=framework
            )

            # Update objection record
            objection.framework_used = framework
            objection.response = complete_response["response_text"]
            objection.evidence_provided = [e["id"] for e in evidence]

            # Determine if follow-up needed
            follow_up_needed = self._requires_follow_up(objection, response)

            # Check if escalation needed
            should_escalate = self._should_escalate(objection)

            result = {
                "success": True,
                "objection_id": objection_id,
                "framework_used": framework.value,
                "response": complete_response,
                "evidence": evidence,
                "follow_up_required": follow_up_needed,
                "escalation_recommended": should_escalate,
                "next_steps": self._generate_next_steps(objection, follow_up_needed),
                "confidence_score": self._calculate_response_confidence(objection, evidence),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Objection handled using {framework.value}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in handle_objection: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in handle_objection: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def retrieve_evidence(
        self,
        objection_type: ObjectionType,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant evidence to support objection response.

        Args:
            objection_type: Type of objection
            context: Context for relevance matching

        Returns:
            List of relevant evidence items
        """
        try:
            evidence_list = []

            # Get evidence for this objection type
            type_evidence = self.evidence_database.get(objection_type.value, [])

            # Calculate relevance scores
            for evidence in type_evidence:
                relevance_score = self._calculate_evidence_relevance(evidence, context)

                if relevance_score >= self.evidence_min_relevance:
                    evidence_with_score = evidence.copy()
                    evidence_with_score["relevance_score"] = relevance_score
                    evidence_list.append(evidence_with_score)

            # Sort by relevance
            evidence_list.sort(key=lambda x: x["relevance_score"], reverse=True)

            # Return top 3 most relevant
            return evidence_list[:3]

        except Exception as e:
            logger.error(f"Error retrieving evidence: {e}", exc_info=True)
            return []

    def escalate_objection(
        self,
        objection_id: str,
        reason: str,
        escalate_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Escalate complex objection to senior team.

        Args:
            objection_id: Objection identifier
            reason: Escalation reason
            escalate_to: Optional specific person/team to escalate to

        Returns:
            Escalation confirmation and details
        """
        try:
            logger.info(f"Starting objection escalation for {objection_id}")

            # Validate inputs
            if not objection_id or objection_id not in self.objections:
                raise ValueError(f"Invalid objection_id: {objection_id}")
            if not reason:
                raise ValueError("reason is required")

            objection = self.objections[objection_id]

            # Determine escalation target
            if not escalate_to:
                escalate_to = self._determine_escalation_target(objection)

            # Create escalation record
            escalation = {
                "escalation_id": f"esc_{objection_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "objection_id": objection_id,
                "lead_id": objection.lead_id,
                "reason": reason,
                "escalated_to": escalate_to,
                "escalated_at": datetime.utcnow().isoformat(),
                "priority": "high" if objection.severity == ObjectionSeverity.CRITICAL else "medium",
                "context": {
                    "objection_type": objection.type.value,
                    "severity": objection.severity.value,
                    "statement": objection.statement,
                    "previous_attempts": len([e for e in objection.evidence_provided])
                }
            }

            # Update objection status
            objection.escalated = True
            objection.resolution_notes += f"\nEscalated to {escalate_to} on {datetime.utcnow().isoformat()}: {reason}"

            # Generate escalation briefing
            briefing = self._generate_escalation_briefing(objection, reason)

            result = {
                "success": True,
                "escalated": True,
                "escalation_id": escalation["escalation_id"],
                "assigned_to": escalate_to,
                "reason": reason,
                "priority": escalation["priority"],
                "briefing": briefing,
                "recommended_actions": self._recommend_escalation_actions(objection),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Objection escalated to {escalate_to}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in escalate_objection: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in escalate_objection: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def analyze_patterns(
        self,
        time_period_days: int = 30,
        segment_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze objection patterns across leads and time.

        Args:
            time_period_days: Analysis time window
            segment_by: Optional segmentation (industry, company_size, etc.)

        Returns:
            Pattern analysis report
        """
        try:
            logger.info(f"Starting pattern analysis for {time_period_days} days")

            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)

            # Filter recent objections
            recent_objections = [
                obj for obj in self.objections.values()
                if obj.raised_at >= cutoff_date
            ]

            if not recent_objections:
                return {
                    "success": True,
                    "message": "No objections in specified time period",
                    "objections_analyzed": 0
                }

            # Type distribution
            type_distribution = defaultdict(int)
            for obj in recent_objections:
                type_distribution[obj.type.value] += 1

            # Severity distribution
            severity_distribution = defaultdict(int)
            for obj in recent_objections:
                severity_distribution[obj.severity.value] += 1

            # Resolution rate by type
            resolution_rates = {}
            for obj_type in ObjectionType:
                type_objs = [o for o in recent_objections if o.type == obj_type]
                if type_objs:
                    resolved = sum(1 for o in type_objs if o.resolved)
                    resolution_rates[obj_type.value] = round((resolved / len(type_objs)) * 100, 1)

            # Framework effectiveness
            framework_effectiveness = self._analyze_framework_effectiveness(recent_objections)

            # Time to resolution
            avg_resolution_time = self._calculate_avg_resolution_time(recent_objections)

            # Common phrases
            common_phrases = self._extract_common_phrases(recent_objections)

            # Trending objections
            trending = self._identify_trending_objections(recent_objections)

            result = {
                "success": True,
                "period_days": time_period_days,
                "total_objections": len(recent_objections),
                "type_distribution": dict(type_distribution),
                "severity_distribution": dict(severity_distribution),
                "resolution_rates": resolution_rates,
                "framework_effectiveness": framework_effectiveness,
                "average_resolution_time_hours": avg_resolution_time,
                "common_phrases": common_phrases,
                "trending_objections": trending,
                "recommendations": self._generate_pattern_recommendations(
                    type_distribution, resolution_rates, framework_effectiveness
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Pattern analysis completed: {len(recent_objections)} objections analyzed")
            return result

        except Exception as e:
            logger.error(f"Error analyzing patterns: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def create_battle_card(
        self,
        competitor_name: str,
        competitor_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create competitive battle card.

        Args:
            competitor_name: Competitor name
            competitor_data: Competitive intelligence data

        Returns:
            Battle card creation result
        """
        try:
            logger.info(f"Creating battle card for {competitor_name}")

            # Validate inputs
            if not competitor_name:
                raise ValueError("competitor_name is required")
            if not competitor_data:
                raise ValueError("competitor_data cannot be empty")

            competitor_id = competitor_name.lower().replace(" ", "_")

            # Extract data
            strengths = competitor_data.get("strengths", [])
            weaknesses = competitor_data.get("weaknesses", [])
            our_advantages = competitor_data.get("our_advantages", [])

            # Generate talking points
            talking_points = self._generate_competitive_talking_points(
                strengths, weaknesses, our_advantages
            )

            # Identify common objections
            common_objections = self._identify_competitor_objections(competitor_name)

            # Build win strategies
            win_strategies = self._build_win_strategies(weaknesses, our_advantages)

            # Create battle card
            battle_card = BattleCard(
                competitor_name=competitor_name,
                competitor_id=competitor_id,
                strengths=strengths,
                weaknesses=weaknesses,
                our_advantages=our_advantages,
                talking_points=talking_points,
                common_objections=common_objections,
                win_strategies=win_strategies,
                pricing_comparison=competitor_data.get("pricing", {}),
                feature_comparison=competitor_data.get("features", {})
            )

            self.battle_cards[competitor_id] = battle_card

            result = {
                "success": True,
                "competitor_id": competitor_id,
                "competitor_name": competitor_name,
                "battle_card": {
                    "strengths": strengths,
                    "weaknesses": weaknesses,
                    "our_advantages": our_advantages,
                    "talking_points": talking_points,
                    "win_strategies": win_strategies,
                    "common_objections": common_objections
                },
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Battle card created for {competitor_name}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in create_battle_card: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_battle_card: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def recommend_winback_strategy(
        self,
        lead_id: str,
        lost_reason: str,
        deal_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Recommend win-back strategy for lost deal.

        Args:
            lead_id: Lead identifier
            lost_reason: Reason deal was lost
            deal_context: Deal context and history

        Returns:
            Win-back strategy recommendation
        """
        try:
            logger.info(f"Generating win-back strategy for lead {lead_id}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not lost_reason:
                raise ValueError("lost_reason is required")

            # Match to existing strategy or create new
            strategy = self._match_winback_strategy(lost_reason)

            # Calculate optimal wait period
            wait_period = self._calculate_winback_wait_period(lost_reason, deal_context)

            # Generate messaging
            messaging = self._generate_winback_messaging(lost_reason, deal_context)

            # Identify triggers
            triggers = self._identify_winback_triggers(lost_reason, deal_context)

            # Build recommended offer
            offer = self._build_winback_offer(lost_reason, deal_context)

            # Calculate probability
            success_probability = self._calculate_winback_probability(
                lost_reason, deal_context, strategy
            )

            result = {
                "success": True,
                "lead_id": lead_id,
                "lost_reason": lost_reason,
                "strategy": {
                    "wait_period_days": wait_period,
                    "approach": strategy.approach if strategy else "personalized_outreach",
                    "messaging": messaging,
                    "triggers": triggers,
                    "recommended_offer": offer,
                    "success_probability": success_probability
                },
                "timeline": self._generate_winback_timeline(wait_period, messaging),
                "key_considerations": self._get_winback_considerations(lost_reason),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Win-back strategy generated with {success_probability}% probability")
            return result

        except ValueError as e:
            logger.error(f"Validation error in recommend_winback_strategy: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in recommend_winback_strategy: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def track_objections(self, lead_id: str) -> Dict[str, Any]:
        """
        Track all objections for a specific lead.

        Args:
            lead_id: Lead identifier

        Returns:
            Objection tracking summary
        """
        try:
            logger.info(f"Tracking objections for lead {lead_id}")

            # Get all objections for lead
            objection_ids = self.lead_objections.get(lead_id, [])

            if not objection_ids:
                return {
                    "success": True,
                    "lead_id": lead_id,
                    "total_objections": 0,
                    "message": "No objections recorded for this lead"
                }

            objections = [self.objections[oid] for oid in objection_ids]

            # Categorize by type
            by_type = defaultdict(int)
            for obj in objections:
                by_type[obj.type.value] += 1

            # Calculate resolution metrics
            total = len(objections)
            resolved = sum(1 for obj in objections if obj.resolved)
            pending = total - resolved

            # Identify critical objections
            critical_objections = [
                {
                    "objection_id": obj.objection_id,
                    "type": obj.type.value,
                    "severity": obj.severity.value,
                    "statement": obj.statement,
                    "raised_at": obj.raised_at.isoformat()
                }
                for obj in objections
                if obj.severity == ObjectionSeverity.CRITICAL and not obj.resolved
            ]

            result = {
                "success": True,
                "lead_id": lead_id,
                "total_objections": total,
                "resolved": resolved,
                "pending": pending,
                "resolution_rate": round((resolved / total * 100), 1) if total > 0 else 0,
                "objections_by_type": dict(by_type),
                "critical_objections": critical_objections,
                "objections": [
                    {
                        "objection_id": obj.objection_id,
                        "type": obj.type.value,
                        "severity": obj.severity.value,
                        "statement": obj.statement,
                        "resolved": obj.resolved,
                        "raised_at": obj.raised_at.isoformat()
                    }
                    for obj in objections
                ],
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Tracked {total} objections for lead {lead_id}")
            return result

        except Exception as e:
            logger.error(f"Error tracking objections: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def resolve_objection(
        self,
        objection_id: str,
        resolution_notes: str
    ) -> Dict[str, Any]:
        """
        Mark objection as resolved.

        Args:
            objection_id: Objection identifier
            resolution_notes: Notes about resolution

        Returns:
            Resolution confirmation
        """
        try:
            if not objection_id or objection_id not in self.objections:
                raise ValueError(f"Invalid objection_id: {objection_id}")

            objection = self.objections[objection_id]
            objection.resolved = True
            objection.resolved_at = datetime.utcnow()
            objection.resolution_notes = resolution_notes

            # Record in history
            self.resolution_history.append({
                "objection_id": objection_id,
                "type": objection.type.value,
                "severity": objection.severity.value,
                "framework_used": objection.framework_used.value if objection.framework_used else None,
                "resolution_time_hours": (objection.resolved_at - objection.raised_at).total_seconds() / 3600,
                "resolved_at": objection.resolved_at.isoformat()
            })

            return {
                "success": True,
                "objection_id": objection_id,
                "resolved": True,
                "resolution_notes": resolution_notes,
                "resolution_time_hours": round((objection.resolved_at - objection.raised_at).total_seconds() / 3600, 2),
                "timestamp": datetime.utcnow().isoformat()
            }

        except ValueError as e:
            logger.error(f"Validation error in resolve_objection: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error resolving objection: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    # Helper methods

    def _initialize_evidence_database(self) -> None:
        """Initialize evidence database with case studies, testimonials, ROI data."""
        # Price objection evidence
        self.evidence_database[ObjectionType.PRICE.value] = [
            {
                "id": "roi_001",
                "type": EvidenceType.ROI_DATA.value,
                "title": "Average ROI: 340% in 12 months",
                "content": "Customers see average 340% ROI within first year through efficiency gains",
                "industry": "all",
                "company_size": "all",
                "impact_metrics": {"roi": 340, "payback_months": 4.5}
            },
            {
                "id": "case_price_001",
                "type": EvidenceType.CASE_STUDY.value,
                "title": "TechCorp reduces costs by 45%",
                "content": "TechCorp saved $500K annually, achieving full ROI in 3 months",
                "industry": "technology",
                "company_size": "medium",
                "impact_metrics": {"savings": 500000, "roi_months": 3}
            }
        ]

        # Product objection evidence
        self.evidence_database[ObjectionType.PRODUCT.value] = [
            {
                "id": "demo_001",
                "type": EvidenceType.DEMO.value,
                "title": "Live feature demonstration",
                "content": "See the feature in action with your use case",
                "industry": "all",
                "company_size": "all"
            },
            {
                "id": "trial_001",
                "type": EvidenceType.TRIAL.value,
                "title": "30-day free trial",
                "content": "Test all features risk-free for 30 days",
                "industry": "all",
                "company_size": "all"
            }
        ]

        # Trust objection evidence
        self.evidence_database[ObjectionType.TRUST.value] = [
            {
                "id": "social_001",
                "type": EvidenceType.SOCIAL_PROOF.value,
                "title": "5000+ satisfied customers",
                "content": "Trusted by 5000+ companies including Fortune 500",
                "industry": "all",
                "company_size": "all"
            },
            {
                "id": "testimonial_001",
                "type": EvidenceType.TESTIMONIAL.value,
                "title": "Customer testimonials",
                "content": "4.8/5 average rating from verified customers",
                "industry": "all",
                "company_size": "all"
            }
        ]

    def _initialize_battle_cards(self) -> None:
        """Initialize competitive battle cards."""
        self.battle_cards["competitor_a"] = BattleCard(
            competitor_name="Competitor A",
            competitor_id="competitor_a",
            strengths=["Market leader", "Large feature set", "Enterprise focus"],
            weaknesses=["Complex implementation", "High cost", "Poor support response time"],
            our_advantages=["50% faster implementation", "Better pricing", "24/7 support", "Higher customer satisfaction"],
            talking_points=[
                "While they're feature-rich, customers report 6-month implementation vs our 2-week average",
                "Our support response time is 2 hours vs their 24+ hours",
                "We offer 30% cost savings with comparable features"
            ],
            common_objections=["They have more features", "They're the market leader"],
            win_strategies=[
                "Focus on implementation speed and ease of use",
                "Highlight support quality and responsiveness",
                "Demonstrate TCO advantage"
            ]
        )

    def _initialize_winback_strategies(self) -> None:
        """Initialize win-back strategies for common loss reasons."""
        self.winback_strategies["price"] = WinbackStrategy(
            strategy_id="wb_price_001",
            lost_reason="price",
            wait_period_days=60,
            approach="value_reframe",
            messaging=[
                "New ROI calculator shows 340% return",
                "Flexible payment terms now available",
                "Cost comparison with hidden costs of alternatives"
            ],
            triggers=["Budget refresh", "Competitor price increase", "Feature gap discovery"],
            success_rate=0.25
        )

        self.winback_strategies["timing"] = WinbackStrategy(
            strategy_id="wb_timing_001",
            lost_reason="timing",
            wait_period_days=90,
            approach="timing_trigger",
            messaging=[
                "Checking in as Q2 approaches",
                "New features since our last conversation",
                "Limited-time implementation discount"
            ],
            triggers=["Quarter start", "Fiscal year", "Industry event"],
            success_rate=0.35
        )

    def _assess_severity(self, statement: str, context: Dict[str, Any]) -> ObjectionSeverity:
        """Assess objection severity."""
        statement_lower = statement.lower()

        # Critical indicators
        critical_keywords = ["deal breaker", "absolutely not", "impossible", "never", "unacceptable"]
        if any(keyword in statement_lower for keyword in critical_keywords):
            return ObjectionSeverity.CRITICAL

        # High severity indicators
        high_keywords = ["major concern", "serious issue", "significant problem"]
        if any(keyword in statement_lower for keyword in high_keywords):
            return ObjectionSeverity.HIGH

        # Check context - late stage objections are more severe
        stage = context.get("stage", "")
        if stage in ["proposal", "negotiation", "closing"]:
            return ObjectionSeverity.HIGH

        # Medium severity
        medium_keywords = ["concerned", "worried", "hesitant"]
        if any(keyword in statement_lower for keyword in medium_keywords):
            return ObjectionSeverity.MEDIUM

        return ObjectionSeverity.LOW

    def _extract_key_phrases(self, statement: str) -> List[str]:
        """Extract key phrases from objection statement."""
        # Simple extraction - in production, use NLP
        phrases = []
        if "too expensive" in statement.lower():
            phrases.append("too expensive")
        if "budget" in statement.lower():
            phrases.append("budget constraint")
        if "competitor" in statement.lower():
            phrases.append("competitive alternative")
        return phrases

    def _detect_hidden_objections(self, statement: str, context: Dict[str, Any]) -> List[str]:
        """Detect hidden objections behind stated ones."""
        hidden = []

        # Timing objections often hide budget or authority issues
        if "not ready" in statement.lower() or "later" in statement.lower():
            hidden.append("Possible budget or authority concern")

        # Feature requests may hide competitive evaluation
        if "feature" in statement.lower() or "missing" in statement.lower():
            hidden.append("Possible competitive comparison")

        return hidden

    def _calculate_urgency(self, severity: ObjectionSeverity, context: Dict[str, Any]) -> str:
        """Calculate objection urgency."""
        if severity == ObjectionSeverity.CRITICAL:
            return "high"
        elif severity == ObjectionSeverity.HIGH:
            return "high"
        elif context.get("stage") in ["proposal", "closing"]:
            return "medium"
        else:
            return "low"

    def _recommend_framework(self, objection_type: ObjectionType, severity: ObjectionSeverity) -> str:
        """Recommend initial framework."""
        framework = self.select_response_framework(objection_type, severity, {})
        return framework.value

    def _apply_framework(self, objection: Objection, framework: ResponseFramework) -> Dict[str, Any]:
        """Apply response framework to generate response."""
        statement = objection.statement

        if framework == ResponseFramework.FEEL_FELT_FOUND:
            return {
                "framework": "Feel-Felt-Found",
                "response_structure": [
                    f"I understand how you feel about {objection.type.value}",
                    "Other clients felt the same way initially",
                    "What they found was that the value far exceeded the initial concern"
                ],
                "tone": "empathetic"
            }

        elif framework == ResponseFramework.BOOMERANG:
            return {
                "framework": "Boomerang",
                "response_structure": [
                    f"That's exactly why you should consider our solution",
                    "This concern highlights the problem we solve"
                ],
                "tone": "confident"
            }

        elif framework == ResponseFramework.QUESTION_METHOD:
            return {
                "framework": "Question Method",
                "response_structure": [
                    "Can you help me understand more about this concern?",
                    "What specifically would you need to see to feel confident?",
                    "Is this the only concern, or are there others?"
                ],
                "tone": "curious"
            }

        elif framework == ResponseFramework.ACKNOWLEDGMENT:
            return {
                "framework": "Acknowledgment",
                "response_structure": [
                    "I appreciate you sharing this concern",
                    "Let me address this directly",
                    "Here's how we handle this..."
                ],
                "tone": "respectful"
            }

        else:
            return {
                "framework": framework.value,
                "response_structure": ["Acknowledge", "Address", "Advance"],
                "tone": "professional"
            }

    def _build_complete_response(
        self,
        response: Dict[str, Any],
        evidence: List[Dict[str, Any]],
        framework: ResponseFramework
    ) -> Dict[str, Any]:
        """Build complete response with framework and evidence."""
        response_text = " ".join(response.get("response_structure", []))

        # Add evidence
        if evidence:
            evidence_text = "\n\nSupporting evidence:\n"
            for e in evidence:
                evidence_text += f"- {e.get('title', '')}: {e.get('content', '')}\n"
            response_text += evidence_text

        return {
            "framework": framework.value,
            "response_text": response_text,
            "tone": response.get("tone", "professional"),
            "evidence_count": len(evidence)
        }

    def _requires_follow_up(self, objection: Objection, response: Dict[str, Any]) -> bool:
        """Determine if follow-up is required."""
        # High severity objections always need follow-up
        if objection.severity in [ObjectionSeverity.HIGH, ObjectionSeverity.CRITICAL]:
            return True

        # Competition objections need follow-up
        if objection.type == ObjectionType.COMPETITION:
            return True

        return False

    def _should_escalate(self, objection: Objection) -> bool:
        """Determine if objection should be escalated."""
        # Critical severity always escalates
        if objection.severity == ObjectionSeverity.CRITICAL:
            return True

        # Multiple unresolved objections for same lead
        lead_objections = [self.objections[oid] for oid in self.lead_objections[objection.lead_id]]
        unresolved = sum(1 for o in lead_objections if not o.resolved)
        if unresolved >= self.max_resolution_attempts:
            return True

        return False

    def _generate_next_steps(self, objection: Objection, follow_up_needed: bool) -> List[str]:
        """Generate next steps for objection handling."""
        steps = []

        if follow_up_needed:
            steps.append("Schedule follow-up call to address in detail")

        if objection.type == ObjectionType.PRICE:
            steps.append("Send ROI calculator and case studies")

        if objection.type == ObjectionType.PRODUCT:
            steps.append("Offer demo or trial")

        if objection.type == ObjectionType.TRUST:
            steps.append("Provide references and testimonials")

        return steps

    def _calculate_response_confidence(self, objection: Objection, evidence: List[Dict[str, Any]]) -> int:
        """Calculate confidence score for response (0-100)."""
        confidence = 50  # Base score

        # Evidence quality
        if len(evidence) >= 2:
            confidence += 20
        elif len(evidence) >= 1:
            confidence += 10

        # Severity adjustment
        if objection.severity == ObjectionSeverity.LOW:
            confidence += 20
        elif objection.severity == ObjectionSeverity.MEDIUM:
            confidence += 10

        return min(confidence, 100)

    def _determine_escalation_target(self, objection: Objection) -> str:
        """Determine who to escalate to."""
        if objection.type == ObjectionType.PRICE:
            return "Sales Manager"
        elif objection.type == ObjectionType.PRODUCT:
            return "Solutions Engineer"
        elif objection.type == ObjectionType.COMPETITION:
            return "Sales Director"
        else:
            return "Senior Account Executive"

    def _generate_escalation_briefing(self, objection: Objection, reason: str) -> Dict[str, Any]:
        """Generate briefing for escalation recipient."""
        return {
            "summary": f"{objection.type.value.title()} objection requiring senior attention",
            "objection_statement": objection.statement,
            "severity": objection.severity.value,
            "context": objection.context,
            "reason_for_escalation": reason,
            "previous_attempts": len(objection.evidence_provided),
            "recommended_approach": f"Consider custom {objection.type.value} solution"
        }

    def _recommend_escalation_actions(self, objection: Objection) -> List[str]:
        """Recommend actions for escalated objection."""
        actions = ["Review full lead context and history"]

        if objection.type == ObjectionType.PRICE:
            actions.append("Consider custom pricing or payment terms")
        elif objection.type == ObjectionType.PRODUCT:
            actions.append("Explore custom feature development timeline")
        elif objection.type == ObjectionType.COMPETITION:
            actions.append("Executive-level competitive positioning call")

        return actions

    def _analyze_framework_effectiveness(self, objections: List[Objection]) -> Dict[str, Any]:
        """Analyze which frameworks are most effective."""
        framework_stats = defaultdict(lambda: {"used": 0, "resolved": 0})

        for obj in objections:
            if obj.framework_used:
                framework_stats[obj.framework_used.value]["used"] += 1
                if obj.resolved:
                    framework_stats[obj.framework_used.value]["resolved"] += 1

        effectiveness = {}
        for framework, stats in framework_stats.items():
            if stats["used"] > 0:
                effectiveness[framework] = {
                    "resolution_rate": round((stats["resolved"] / stats["used"]) * 100, 1),
                    "times_used": stats["used"]
                }

        return effectiveness

    def _calculate_avg_resolution_time(self, objections: List[Objection]) -> float:
        """Calculate average time to resolve objections."""
        resolved_objs = [o for o in objections if o.resolved and o.resolved_at]

        if not resolved_objs:
            return 0.0

        total_hours = sum(
            (o.resolved_at - o.raised_at).total_seconds() / 3600
            for o in resolved_objs
        )

        return round(total_hours / len(resolved_objs), 1)

    def _extract_common_phrases(self, objections: List[Objection]) -> List[Dict[str, Any]]:
        """Extract common phrases from objections."""
        phrase_frequency = defaultdict(int)

        for obj in objections:
            # Simple phrase extraction
            if "expensive" in obj.statement.lower():
                phrase_frequency["too expensive"] += 1
            if "budget" in obj.statement.lower():
                phrase_frequency["budget concerns"] += 1
            if "competitor" in obj.statement.lower():
                phrase_frequency["competitor mention"] += 1

        return [
            {"phrase": phrase, "frequency": count}
            for phrase, count in sorted(phrase_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

    def _identify_trending_objections(self, objections: List[Objection]) -> List[str]:
        """Identify trending objections over time."""
        # Simple trend detection - count recent vs older
        midpoint = len(objections) // 2
        recent = objections[midpoint:]
        older = objections[:midpoint]

        recent_types = defaultdict(int)
        older_types = defaultdict(int)

        for obj in recent:
            recent_types[obj.type.value] += 1
        for obj in older:
            older_types[obj.type.value] += 1

        trending = []
        for obj_type in recent_types:
            if recent_types[obj_type] > older_types.get(obj_type, 0) * 1.5:
                trending.append(f"{obj_type} (increasing)")

        return trending

    def _generate_pattern_recommendations(
        self,
        type_distribution: Dict,
        resolution_rates: Dict,
        framework_effectiveness: Dict
    ) -> List[str]:
        """Generate recommendations based on patterns."""
        recommendations = []

        # Check for low resolution rates
        for obj_type, rate in resolution_rates.items():
            if rate < 50:
                recommendations.append(f"Focus on improving {obj_type} objection handling - current resolution rate is {rate}%")

        # Check for dominant objection type
        if type_distribution:
            max_type = max(type_distribution.items(), key=lambda x: x[1])
            if max_type[1] > sum(type_distribution.values()) * 0.4:
                recommendations.append(f"Address root cause of frequent {max_type[0]} objections")

        return recommendations

    def _calculate_evidence_relevance(self, evidence: Dict[str, Any], context: Dict[str, Any]) -> float:
        """Calculate evidence relevance score."""
        score = 0.5  # Base relevance

        # Industry match
        if evidence.get("industry") == context.get("industry", ""):
            score += 0.3
        elif evidence.get("industry") == "all":
            score += 0.1

        # Company size match
        if evidence.get("company_size") == context.get("company_size", ""):
            score += 0.2
        elif evidence.get("company_size") == "all":
            score += 0.1

        return min(score, 1.0)

    def _generate_competitive_talking_points(
        self,
        strengths: List[str],
        weaknesses: List[str],
        our_advantages: List[str]
    ) -> List[str]:
        """Generate competitive talking points."""
        points = []

        for weakness in weaknesses[:2]:
            points.append(f"While they {weakness.lower()}, we offer a better alternative")

        for advantage in our_advantages[:3]:
            points.append(f"Our key differentiator: {advantage}")

        return points

    def _identify_competitor_objections(self, competitor_name: str) -> List[str]:
        """Identify common objections when competing against this competitor."""
        return [
            f"{competitor_name} has more market share",
            f"{competitor_name} has been around longer",
            f"We're already using {competitor_name}"
        ]

    def _build_win_strategies(self, weaknesses: List[str], our_advantages: List[str]) -> List[str]:
        """Build strategies to win against competitor."""
        strategies = []

        for advantage in our_advantages[:3]:
            strategies.append(f"Emphasize {advantage}")

        for weakness in weaknesses[:2]:
            strategies.append(f"Highlight how we address {weakness}")

        return strategies

    def _match_winback_strategy(self, lost_reason: str) -> Optional[WinbackStrategy]:
        """Match lost reason to win-back strategy."""
        reason_lower = lost_reason.lower()

        if "price" in reason_lower or "budget" in reason_lower:
            return self.winback_strategies.get("price")
        elif "timing" in reason_lower or "not ready" in reason_lower:
            return self.winback_strategies.get("timing")

        return None

    def _calculate_winback_wait_period(self, lost_reason: str, context: Dict[str, Any]) -> int:
        """Calculate optimal wait period before win-back attempt."""
        reason_lower = lost_reason.lower()

        if "price" in reason_lower:
            return 60  # 2 months for budget cycles
        elif "timing" in reason_lower:
            return 90  # 3 months
        elif "competitor" in reason_lower:
            return 120  # 4 months to let competitor implementation issues surface
        else:
            return 45  # Default 1.5 months

    def _generate_winback_messaging(self, lost_reason: str, context: Dict[str, Any]) -> List[str]:
        """Generate win-back messaging."""
        messages = []

        if "price" in lost_reason.lower():
            messages.append("New flexible payment options available")
            messages.append("Updated ROI analysis with your numbers")

        elif "timing" in lost_reason.lower():
            messages.append("Checking in as timing may be better now")
            messages.append("New features that address your needs")

        else:
            messages.append("Following up on our previous conversation")
            messages.append("New capabilities since we last spoke")

        return messages

    def _identify_winback_triggers(self, lost_reason: str, context: Dict[str, Any]) -> List[str]:
        """Identify triggers for win-back outreach."""
        triggers = []

        if "price" in lost_reason.lower():
            triggers.extend(["Budget refresh cycle", "Competitor price increase"])

        if "timing" in lost_reason.lower():
            triggers.extend(["Quarter start", "Fiscal year start"])

        triggers.extend(["Product update", "Industry event", "Competitive intelligence"])

        return triggers

    def _build_winback_offer(self, lost_reason: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Build recommended win-back offer."""
        offer = {}

        if "price" in lost_reason.lower():
            offer = {
                "discount": "15% first year",
                "payment_terms": "Quarterly payments",
                "trial": "Extended 60-day trial"
            }
        elif "product" in lost_reason.lower():
            offer = {
                "pilot": "Pilot program for missing features",
                "roadmap": "Expedited feature development",
                "trial": "30-day trial of new capabilities"
            }
        else:
            offer = {
                "meeting": "Executive briefing on improvements",
                "demo": "Updated product demo"
            }

        return offer

    def _calculate_winback_probability(
        self,
        lost_reason: str,
        context: Dict[str, Any],
        strategy: Optional[WinbackStrategy]
    ) -> float:
        """Calculate probability of win-back success."""
        base_probability = 20.0  # Base 20%

        if strategy:
            base_probability = strategy.success_rate * 100

        # Adjust based on context
        if context.get("engagement_level") == "high":
            base_probability += 10

        if "competitor" not in lost_reason.lower():
            base_probability += 5  # Easier if not lost to competitor

        return round(min(base_probability, 95.0), 1)

    def _generate_winback_timeline(self, wait_period: int, messaging: List[str]) -> List[Dict[str, Any]]:
        """Generate win-back timeline."""
        timeline = []

        timeline.append({
            "day": wait_period,
            "action": "Initial win-back outreach",
            "message": messaging[0] if messaging else "Follow-up email"
        })

        timeline.append({
            "day": wait_period + 7,
            "action": "Follow-up call",
            "message": "Phone call to discuss new developments"
        })

        timeline.append({
            "day": wait_period + 14,
            "action": "Value-add touchpoint",
            "message": messaging[1] if len(messaging) > 1 else "Share relevant case study"
        })

        return timeline

    def _get_winback_considerations(self, lost_reason: str) -> List[str]:
        """Get key considerations for win-back attempt."""
        considerations = [
            "Ensure sufficient time has passed for perspective change",
            "Research any changes in their situation",
            "Prepare new value proposition"
        ]

        if "competitor" in lost_reason.lower():
            considerations.append("Monitor competitor satisfaction and identify gaps")

        return considerations
