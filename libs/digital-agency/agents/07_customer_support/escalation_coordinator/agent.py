"""
Escalation Coordinator Agent

Manages ticket escalations, priority scoring, routing rules, and SLA breach handling.
Production-ready implementation with intelligent escalation algorithms.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import yaml
from pathlib import Path
import logging
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


class EscalationLevel(Enum):
    """Escalation levels."""
    TIER1 = 1
    TIER2 = 2
    TIER3 = 3
    MANAGER = 4
    DIRECTOR = 5
    EXECUTIVE = 6


class EscalationReason(Enum):
    """Escalation reasons."""
    SLA_BREACH = "sla_breach"
    COMPLEXITY = "complexity"
    CUSTOMER_REQUEST = "customer_request"
    REPEATED_CONTACT = "repeated_contact"
    HIGH_VALUE_CUSTOMER = "high_value_customer"
    CRITICAL_ISSUE = "critical_issue"
    UNRESOLVED = "unresolved"
    NEGATIVE_SENTIMENT = "negative_sentiment"


class EscalationStatus(Enum):
    """Escalation status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


@dataclass
class EscalationRule:
    """Escalation routing rule."""
    rule_id: str
    name: str
    trigger_conditions: Dict[str, Any]
    target_level: EscalationLevel
    target_team: str
    priority_boost: int
    auto_escalate: bool
    notify_stakeholders: List[str]
    active: bool = True


@dataclass
class EscalationTicket:
    """Escalated ticket."""
    escalation_id: str
    original_ticket_id: str
    current_level: EscalationLevel
    escalation_reason: EscalationReason
    created_at: datetime
    updated_at: datetime
    status: EscalationStatus
    assigned_to: Optional[str] = None
    assigned_team: Optional[str] = None
    escalation_path: List[Dict[str, Any]] = field(default_factory=list)
    resolution_notes: str = ""
    customer_impact_score: float = 0.0
    business_impact_score: float = 0.0
    urgency_score: float = 0.0
    total_priority_score: float = 0.0
    sla_extended_hours: float = 0.0
    stakeholders_notified: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StakeholderNotification:
    """Stakeholder notification record."""
    notification_id: str
    escalation_id: str
    stakeholder: str
    notification_type: str
    sent_at: datetime
    channel: str


class EscalationCoordinatorAgent:
    """
    Advanced Escalation Coordinator for intelligent ticket escalation management.

    Capabilities:
    - Multi-factor priority scoring
    - Dynamic routing rules
    - SLA escalation management
    - Stakeholder notification
    - Escalation path tracking
    - Impact analysis
    - Performance analytics
    - Predictive escalation detection
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Escalation Coordinator Agent."""
        self.config = self._load_config(config_path)
        self.name = "Escalation Coordinator Agent"
        self.role = "escalation_coordinator"

        # Data storage
        self.escalations: Dict[str, EscalationTicket] = {}
        self.escalation_rules: List[EscalationRule] = []
        self.notifications: List[StakeholderNotification] = []

        # Analytics
        self.escalation_counter = 0
        self.escalation_times: Dict[str, List[float]] = defaultdict(list)
        self.resolution_rates: Dict[EscalationLevel, float] = {}

        # Initialize default rules
        self._initialize_default_rules()

        logger.info(f"{self.name} initialized successfully")

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"

        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file not found, using defaults")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'Escalation Coordinator Agent',
            'model': 'gpt-4',
            'temperature': 0.3,
            'max_tokens': 1500,
            'auto_escalate_enabled': True,
            'sla_breach_auto_escalate': True,
            'max_escalation_level': 6,
            'priority_score_threshold': 75.0,
            'high_value_customer_threshold': 50000,
            'repeated_contact_threshold': 3,
            'capabilities': [
                'priority_scoring',
                'routing_management',
                'sla_monitoring',
                'stakeholder_notification',
                'impact_analysis',
                'predictive_escalation'
            ],
            'notification_channels': ['email', 'sms', 'slack', 'teams']
        }

    def _initialize_default_rules(self):
        """Initialize default escalation rules."""
        default_rules = [
            EscalationRule(
                rule_id="rule_sla_breach",
                name="SLA Breach Auto-Escalation",
                trigger_conditions={'sla_breach': True},
                target_level=EscalationLevel.TIER2,
                target_team="tier2_escalations",
                priority_boost=20,
                auto_escalate=True,
                notify_stakeholders=['team_lead', 'support_manager']
            ),
            EscalationRule(
                rule_id="rule_high_value",
                name="High Value Customer Escalation",
                trigger_conditions={'customer_value': '>=50000'},
                target_level=EscalationLevel.TIER3,
                target_team="vip_support",
                priority_boost=30,
                auto_escalate=True,
                notify_stakeholders=['account_manager', 'support_director']
            ),
            EscalationRule(
                rule_id="rule_critical_severity",
                name="Critical Severity Escalation",
                trigger_conditions={'severity': 'critical'},
                target_level=EscalationLevel.MANAGER,
                target_team="critical_response",
                priority_boost=50,
                auto_escalate=True,
                notify_stakeholders=['support_manager', 'engineering_lead', 'director']
            ),
            EscalationRule(
                rule_id="rule_repeated_contact",
                name="Repeated Contact Escalation",
                trigger_conditions={'contact_count': '>=3'},
                target_level=EscalationLevel.TIER2,
                target_team="tier2",
                priority_boost=15,
                auto_escalate=True,
                notify_stakeholders=['team_lead']
            )
        ]

        self.escalation_rules.extend(default_rules)

    async def calculate_priority_score(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive priority score using multiple factors.

        Args:
            ticket_data: Ticket information

        Returns:
            Priority scoring results
        """
        try:
            logger.info(f"Calculating priority score for ticket {ticket_data.get('ticket_id')}")

            # 1. Customer Impact Score (0-100)
            customer_impact = self._calculate_customer_impact(ticket_data)

            # 2. Business Impact Score (0-100)
            business_impact = self._calculate_business_impact(ticket_data)

            # 3. Urgency Score (0-100)
            urgency = self._calculate_urgency(ticket_data)

            # 4. Complexity Score (0-100)
            complexity = self._calculate_complexity(ticket_data)

            # 5. Customer Value Score (0-100)
            customer_value = self._calculate_customer_value(ticket_data)

            # Weighted total priority score
            weights = {
                'customer_impact': 0.25,
                'business_impact': 0.20,
                'urgency': 0.25,
                'complexity': 0.15,
                'customer_value': 0.15
            }

            total_score = (
                customer_impact * weights['customer_impact'] +
                business_impact * weights['business_impact'] +
                urgency * weights['urgency'] +
                complexity * weights['complexity'] +
                customer_value * weights['customer_value']
            )

            # Determine recommended escalation level
            recommended_level = self._determine_escalation_level(total_score, ticket_data)

            # Check if auto-escalation is needed
            auto_escalate = total_score >= self.config.get('priority_score_threshold', 75.0)

            logger.info(f"Priority score calculated: {total_score:.2f}")

            return {
                'success': True,
                'ticket_id': ticket_data.get('ticket_id'),
                'total_priority_score': round(total_score, 2),
                'component_scores': {
                    'customer_impact': round(customer_impact, 2),
                    'business_impact': round(business_impact, 2),
                    'urgency': round(urgency, 2),
                    'complexity': round(complexity, 2),
                    'customer_value': round(customer_value, 2)
                },
                'recommended_escalation_level': recommended_level.value,
                'auto_escalate_recommended': auto_escalate,
                'scoring_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating priority score: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _calculate_customer_impact(self, ticket_data: Dict[str, Any]) -> float:
        """Calculate customer impact score (0-100)."""
        score = 0.0

        # Number of affected users
        affected_users = ticket_data.get('affected_users', 1)
        if affected_users == 1:
            score += 20
        elif affected_users <= 10:
            score += 40
        elif affected_users <= 100:
            score += 70
        else:
            score += 100

        # Severity of impact
        severity = ticket_data.get('severity', 'medium').lower()
        severity_scores = {
            'critical': 100,
            'high': 75,
            'medium': 50,
            'low': 25
        }
        score = (score + severity_scores.get(severity, 50)) / 2

        return min(100.0, score)

    def _calculate_business_impact(self, ticket_data: Dict[str, Any]) -> float:
        """Calculate business impact score (0-100)."""
        score = 0.0

        # Revenue impact
        revenue_impact = ticket_data.get('revenue_impact', 0)
        if revenue_impact > 100000:
            score += 100
        elif revenue_impact > 50000:
            score += 80
        elif revenue_impact > 10000:
            score += 60
        elif revenue_impact > 1000:
            score += 40
        else:
            score += 20

        # Customer type
        customer_tier = ticket_data.get('customer_tier', 'standard').lower()
        tier_scores = {
            'enterprise': 100,
            'premium': 75,
            'standard': 50,
            'free': 25
        }
        score = (score + tier_scores.get(customer_tier, 50)) / 2

        # Contract at risk
        if ticket_data.get('contract_at_risk', False):
            score = min(100, score * 1.5)

        return min(100.0, score)

    def _calculate_urgency(self, ticket_data: Dict[str, Any]) -> float:
        """Calculate urgency score (0-100)."""
        score = 0.0

        # Time sensitivity
        sla_remaining = ticket_data.get('sla_time_remaining_hours', 24)
        if sla_remaining <= 0:
            score += 100
        elif sla_remaining <= 1:
            score += 90
        elif sla_remaining <= 4:
            score += 70
        elif sla_remaining <= 8:
            score += 50
        else:
            score += 30

        # Age of ticket
        age_hours = ticket_data.get('age_hours', 0)
        if age_hours > 48:
            score = min(100, score + 30)
        elif age_hours > 24:
            score = min(100, score + 15)

        # Customer sentiment
        sentiment = ticket_data.get('customer_sentiment', 0.0)
        if sentiment < -0.5:
            score = min(100, score + 20)

        return min(100.0, score)

    def _calculate_complexity(self, ticket_data: Dict[str, Any]) -> float:
        """Calculate complexity score (0-100)."""
        score = 50.0  # Base complexity

        # Number of previous escalations
        escalation_count = ticket_data.get('escalation_count', 0)
        score += min(30, escalation_count * 10)

        # Number of touches/interactions
        interaction_count = ticket_data.get('interaction_count', 1)
        if interaction_count > 10:
            score += 20
        elif interaction_count > 5:
            score += 10

        # Technical complexity indicators
        if ticket_data.get('requires_engineering', False):
            score += 30
        if ticket_data.get('cross_team_required', False):
            score += 20

        return min(100.0, score)

    def _calculate_customer_value(self, ticket_data: Dict[str, Any]) -> float:
        """Calculate customer value score (0-100)."""
        lifetime_value = ticket_data.get('customer_lifetime_value', 0)

        if lifetime_value >= 100000:
            return 100.0
        elif lifetime_value >= 50000:
            return 80.0
        elif lifetime_value >= 25000:
            return 60.0
        elif lifetime_value >= 10000:
            return 40.0
        elif lifetime_value >= 1000:
            return 20.0
        else:
            return 10.0

    def _determine_escalation_level(self, priority_score: float,
                                   ticket_data: Dict[str, Any]) -> EscalationLevel:
        """Determine appropriate escalation level based on priority score."""
        if priority_score >= 90 or ticket_data.get('severity') == 'critical':
            return EscalationLevel.EXECUTIVE
        elif priority_score >= 80:
            return EscalationLevel.DIRECTOR
        elif priority_score >= 70:
            return EscalationLevel.MANAGER
        elif priority_score >= 60:
            return EscalationLevel.TIER3
        elif priority_score >= 40:
            return EscalationLevel.TIER2
        else:
            return EscalationLevel.TIER1

    async def create_escalation(self, ticket_id: str,
                               reason: EscalationReason,
                               ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new escalation for a ticket.

        Args:
            ticket_id: Original ticket ID
            reason: Escalation reason
            ticket_data: Ticket information

        Returns:
            Escalation details
        """
        try:
            logger.info(f"Creating escalation for ticket {ticket_id}")

            # Calculate priority scores
            priority_result = await self.calculate_priority_score(ticket_data)

            if not priority_result.get('success'):
                raise ValueError("Failed to calculate priority score")

            # Generate escalation ID
            self.escalation_counter += 1
            escalation_id = f"ESC-{datetime.utcnow().strftime('%Y%m%d')}-{self.escalation_counter:05d}"

            # Determine escalation level
            recommended_level = EscalationLevel(priority_result['recommended_escalation_level'])

            # Create escalation
            now = datetime.utcnow()
            escalation = EscalationTicket(
                escalation_id=escalation_id,
                original_ticket_id=ticket_id,
                current_level=recommended_level,
                escalation_reason=reason,
                created_at=now,
                updated_at=now,
                status=EscalationStatus.PENDING,
                customer_impact_score=priority_result['component_scores']['customer_impact'],
                business_impact_score=priority_result['component_scores']['business_impact'],
                urgency_score=priority_result['component_scores']['urgency'],
                total_priority_score=priority_result['total_priority_score']
            )

            # Add initial path entry
            escalation.escalation_path.append({
                'timestamp': now.isoformat(),
                'level': recommended_level.value,
                'action': 'escalation_created',
                'reason': reason.value
            })

            # Apply routing rules
            routing_result = await self._apply_escalation_routing(escalation, ticket_data)
            escalation.assigned_team = routing_result.get('target_team')
            escalation.assigned_to = routing_result.get('assigned_agent')

            # Store escalation
            self.escalations[escalation_id] = escalation

            # Notify stakeholders
            notification_result = await self._notify_stakeholders(escalation, ticket_data)

            logger.info(f"Escalation {escalation_id} created at level {recommended_level.name}")

            return {
                'success': True,
                'escalation_id': escalation_id,
                'original_ticket_id': ticket_id,
                'escalation_level': recommended_level.name,
                'escalation_reason': reason.value,
                'priority_score': priority_result['total_priority_score'],
                'assigned_team': escalation.assigned_team,
                'assigned_to': escalation.assigned_to,
                'stakeholders_notified': notification_result.get('notified', []),
                'created_at': now.isoformat()
            }

        except ValueError as e:
            logger.error(f"Validation error in create_escalation: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_escalation: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def _apply_escalation_routing(self, escalation: EscalationTicket,
                                       ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply routing rules to determine target team and agent."""
        # Find matching rules
        matched_rules = []
        for rule in self.escalation_rules:
            if rule.active and self._evaluate_rule_conditions(rule, ticket_data):
                matched_rules.append(rule)

        # Use highest priority matching rule
        if matched_rules:
            best_rule = max(matched_rules, key=lambda r: r.priority_boost)
            return {
                'target_team': best_rule.target_team,
                'assigned_agent': None,  # Would be assigned by team
                'rule_applied': best_rule.rule_id
            }

        # Default routing based on level
        level_routing = {
            EscalationLevel.TIER1: 'tier1',
            EscalationLevel.TIER2: 'tier2',
            EscalationLevel.TIER3: 'tier3',
            EscalationLevel.MANAGER: 'support_management',
            EscalationLevel.DIRECTOR: 'executive_support',
            EscalationLevel.EXECUTIVE: 'executive_support'
        }

        return {
            'target_team': level_routing.get(escalation.current_level, 'tier2'),
            'assigned_agent': None,
            'rule_applied': 'default_routing'
        }

    def _evaluate_rule_conditions(self, rule: EscalationRule,
                                  ticket_data: Dict[str, Any]) -> bool:
        """Evaluate if rule conditions match ticket data."""
        conditions = rule.trigger_conditions

        for key, condition in conditions.items():
            ticket_value = ticket_data.get(key)

            # Boolean condition
            if isinstance(condition, bool):
                if ticket_value != condition:
                    return False

            # String comparison with operator
            elif isinstance(condition, str) and condition.startswith(('>=', '<=', '>', '<', '==')):
                operator = condition[:2] if condition[:2] in ['>=', '<=', '=='] else condition[0]
                threshold = float(condition[len(operator):])

                if ticket_value is None:
                    return False

                if operator == '>=' and not (ticket_value >= threshold):
                    return False
                elif operator == '<=' and not (ticket_value <= threshold):
                    return False
                elif operator == '>' and not (ticket_value > threshold):
                    return False
                elif operator == '<' and not (ticket_value < threshold):
                    return False
                elif operator == '==' and not (ticket_value == threshold):
                    return False

            # Direct equality
            elif ticket_value != condition:
                return False

        return True

    async def _notify_stakeholders(self, escalation: EscalationTicket,
                                  ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send notifications to relevant stakeholders."""
        notified = []

        # Find applicable rules
        for rule in self.escalation_rules:
            if rule.active and self._evaluate_rule_conditions(rule, ticket_data):
                for stakeholder in rule.notify_stakeholders:
                    notification_id = f"NOTIF-{len(self.notifications) + 1:06d}"

                    notification = StakeholderNotification(
                        notification_id=notification_id,
                        escalation_id=escalation.escalation_id,
                        stakeholder=stakeholder,
                        notification_type='escalation_created',
                        sent_at=datetime.utcnow(),
                        channel='email'  # Default channel
                    )

                    self.notifications.append(notification)
                    notified.append(stakeholder)
                    escalation.stakeholders_notified.append(stakeholder)

        return {
            'success': True,
            'notified': list(set(notified)),
            'notification_count': len(notified)
        }

    async def escalate_further(self, escalation_id: str,
                              reason: str) -> Dict[str, Any]:
        """
        Escalate to next level.

        Args:
            escalation_id: Escalation ID
            reason: Reason for further escalation

        Returns:
            Escalation update result
        """
        try:
            if escalation_id not in self.escalations:
                raise ValueError(f"Escalation {escalation_id} not found")

            escalation = self.escalations[escalation_id]

            # Determine next level
            current_value = escalation.current_level.value
            max_level = self.config.get('max_escalation_level', 6)

            if current_value >= max_level:
                raise ValueError(f"Already at maximum escalation level")

            next_level = EscalationLevel(current_value + 1)

            # Update escalation
            old_level = escalation.current_level
            escalation.current_level = next_level
            escalation.updated_at = datetime.utcnow()

            # Add to escalation path
            escalation.escalation_path.append({
                'timestamp': datetime.utcnow().isoformat(),
                'level': next_level.value,
                'action': 'escalated_further',
                'reason': reason,
                'from_level': old_level.value
            })

            logger.warning(f"Escalation {escalation_id} escalated from {old_level.name} to {next_level.name}")

            return {
                'success': True,
                'escalation_id': escalation_id,
                'old_level': old_level.name,
                'new_level': next_level.name,
                'reason': reason,
                'updated_at': escalation.updated_at.isoformat()
            }

        except ValueError as e:
            return {'success': False, 'error': str(e), 'error_type': 'validation_error'}
        except Exception as e:
            logger.error(f"Error escalating further: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}

    async def resolve_escalation(self, escalation_id: str,
                                resolution_notes: str) -> Dict[str, Any]:
        """
        Resolve an escalation.

        Args:
            escalation_id: Escalation ID
            resolution_notes: Resolution notes

        Returns:
            Resolution result
        """
        try:
            if escalation_id not in self.escalations:
                raise ValueError(f"Escalation {escalation_id} not found")

            escalation = self.escalations[escalation_id]

            # Update escalation
            escalation.status = EscalationStatus.RESOLVED
            escalation.resolution_notes = resolution_notes
            escalation.updated_at = datetime.utcnow()

            # Calculate resolution time
            resolution_time = (escalation.updated_at - escalation.created_at).total_seconds() / 3600
            self.escalation_times[escalation.current_level.name].append(resolution_time)

            # Add to escalation path
            escalation.escalation_path.append({
                'timestamp': datetime.utcnow().isoformat(),
                'level': escalation.current_level.value,
                'action': 'resolved',
                'resolution_time_hours': round(resolution_time, 2)
            })

            logger.info(f"Escalation {escalation_id} resolved in {resolution_time:.2f} hours")

            return {
                'success': True,
                'escalation_id': escalation_id,
                'status': 'resolved',
                'resolution_time_hours': round(resolution_time, 2),
                'resolved_at': escalation.updated_at.isoformat()
            }

        except ValueError as e:
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Error resolving escalation: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}

    async def get_analytics(self) -> Dict[str, Any]:
        """Get comprehensive escalation analytics."""
        try:
            total_escalations = len(self.escalations)

            if total_escalations == 0:
                return {
                    'success': True,
                    'message': 'No escalations to analyze',
                    'total_escalations': 0
                }

            # Status distribution
            status_counts = defaultdict(int)
            for esc in self.escalations.values():
                status_counts[esc.status.value] += 1

            # Level distribution
            level_counts = defaultdict(int)
            for esc in self.escalations.values():
                level_counts[esc.current_level.name] += 1

            # Reason distribution
            reason_counts = defaultdict(int)
            for esc in self.escalations.values():
                reason_counts[esc.escalation_reason.value] += 1

            # Average resolution times
            avg_resolution_times = {}
            for level, times in self.escalation_times.items():
                if times:
                    avg_resolution_times[level] = round(sum(times) / len(times), 2)

            # Average priority score
            avg_priority = sum(e.total_priority_score for e in self.escalations.values()) / total_escalations

            return {
                'success': True,
                'total_escalations': total_escalations,
                'status_distribution': dict(status_counts),
                'level_distribution': dict(level_counts),
                'reason_distribution': dict(reason_counts),
                'average_priority_score': round(avg_priority, 2),
                'average_resolution_times_hours': avg_resolution_times,
                'total_notifications_sent': len(self.notifications)
            }

        except Exception as e:
            logger.error(f"Error generating analytics: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}
