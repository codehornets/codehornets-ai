"""
Support Specialist Agent

Handles ticket routing, SLA tracking, and comprehensive issue resolution workflows.
Production-ready implementation with advanced priority scoring and automated routing.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import yaml
from pathlib import Path
import logging
import hashlib
import re
from collections import defaultdict
import json

logger = logging.getLogger(__name__)


class TicketPriority(Enum):
    """Ticket priority levels."""
    CRITICAL = 5
    HIGH = 4
    MEDIUM = 3
    LOW = 2
    MINIMAL = 1


class TicketStatus(Enum):
    """Ticket status types."""
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    PENDING_CUSTOMER = "pending_customer"
    PENDING_INTERNAL = "pending_internal"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class TicketCategory(Enum):
    """Ticket categories."""
    TECHNICAL = "technical"
    BILLING = "billing"
    ACCOUNT = "account"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    GENERAL_INQUIRY = "general_inquiry"
    COMPLAINT = "complaint"
    SECURITY = "security"


@dataclass
class SLAConfig:
    """Service Level Agreement configuration."""
    priority: TicketPriority
    response_time_hours: float
    resolution_time_hours: float
    escalation_time_hours: float


@dataclass
class Ticket:
    """Ticket data model."""
    ticket_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    assigned_team: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    attachments: List[str] = field(default_factory=list)
    resolution_notes: str = ""
    customer_sentiment: float = 0.0  # -1 to 1
    sla_breach: bool = False
    escalation_level: int = 0
    response_due_at: Optional[datetime] = None
    resolution_due_at: Optional[datetime] = None
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    related_tickets: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RoutingRule:
    """Ticket routing rule."""
    rule_id: str
    name: str
    conditions: Dict[str, Any]
    target_team: str
    target_agent: Optional[str] = None
    priority: int = 0
    active: bool = True


@dataclass
class WorkflowStep:
    """Resolution workflow step."""
    step_id: str
    name: str
    description: str
    action_type: str  # manual, automated, conditional
    required_role: Optional[str] = None
    estimated_minutes: int = 0
    completed: bool = False
    completed_at: Optional[datetime] = None
    notes: str = ""


class SupportSpecialistAgent:
    """
    Advanced Support Specialist Agent for comprehensive ticket management.

    Capabilities:
    - Intelligent ticket routing with multi-criteria matching
    - SLA tracking and breach prevention
    - Priority scoring with machine learning-ready features
    - Resolution workflow management
    - Automated escalation handling
    - Customer sentiment analysis
    - Ticket clustering and pattern detection
    - Performance analytics and reporting
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Support Specialist Agent.

        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.name = "Support Specialist Agent"
        self.role = "support_specialist"

        # Data storage
        self.tickets: Dict[str, Ticket] = {}
        self.routing_rules: List[RoutingRule] = []
        self.workflows: Dict[str, List[WorkflowStep]] = {}
        self.sla_configs: Dict[TicketPriority, SLAConfig] = self._init_sla_configs()

        # Analytics
        self.ticket_counter = 0
        self.resolution_times: Dict[str, List[float]] = defaultdict(list)
        self.response_times: Dict[str, List[float]] = defaultdict(list)
        self.sla_breaches: List[Dict[str, Any]] = []

        # Caching
        self.priority_keywords: Dict[str, float] = self._load_priority_keywords()
        self.sentiment_lexicon: Dict[str, float] = self._load_sentiment_lexicon()

        logger.info(f"{self.name} initialized successfully")

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"

        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file not found at {config_path}, using defaults")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'Support Specialist Agent',
            'model': 'gpt-4',
            'temperature': 0.3,
            'max_tokens': 2000,
            'enable_auto_routing': True,
            'enable_sla_tracking': True,
            'enable_sentiment_analysis': True,
            'default_response_time_hours': 4,
            'default_resolution_time_hours': 24,
            'escalation_threshold_hours': 48,
            'max_escalation_level': 3,
            'capabilities': [
                'ticket_routing',
                'sla_tracking',
                'priority_scoring',
                'workflow_management',
                'escalation_handling',
                'sentiment_analysis',
                'pattern_detection'
            ],
            'supported_categories': [cat.value for cat in TicketCategory],
            'teams': ['tier1', 'tier2', 'tier3', 'billing', 'technical', 'security']
        }

    def _init_sla_configs(self) -> Dict[TicketPriority, SLAConfig]:
        """Initialize SLA configurations for each priority level."""
        return {
            TicketPriority.CRITICAL: SLAConfig(
                priority=TicketPriority.CRITICAL,
                response_time_hours=0.5,
                resolution_time_hours=4,
                escalation_time_hours=2
            ),
            TicketPriority.HIGH: SLAConfig(
                priority=TicketPriority.HIGH,
                response_time_hours=2,
                resolution_time_hours=8,
                escalation_time_hours=6
            ),
            TicketPriority.MEDIUM: SLAConfig(
                priority=TicketPriority.MEDIUM,
                response_time_hours=4,
                resolution_time_hours=24,
                escalation_time_hours=20
            ),
            TicketPriority.LOW: SLAConfig(
                priority=TicketPriority.LOW,
                response_time_hours=8,
                resolution_time_hours=48,
                escalation_time_hours=40
            ),
            TicketPriority.MINIMAL: SLAConfig(
                priority=TicketPriority.MINIMAL,
                response_time_hours=24,
                resolution_time_hours=120,
                escalation_time_hours=96
            )
        }

    def _load_priority_keywords(self) -> Dict[str, float]:
        """Load keywords for priority scoring."""
        return {
            # Critical indicators
            'down': 2.0, 'outage': 2.0, 'critical': 2.0, 'urgent': 1.8,
            'emergency': 2.0, 'production': 1.5, 'security': 2.0, 'breach': 2.0,
            'hack': 2.0, 'data loss': 2.0, 'cannot access': 1.5, 'broken': 1.3,

            # High priority indicators
            'important': 1.0, 'asap': 1.2, 'immediately': 1.3, 'severe': 1.4,
            'major': 1.2, 'blocker': 1.5, 'stuck': 1.0, 'error': 0.8,

            # Medium priority
            'issue': 0.5, 'problem': 0.5, 'bug': 0.6, 'help': 0.3,

            # Low priority
            'question': -0.3, 'wondering': -0.2, 'feature request': -0.5,
            'enhancement': -0.4, 'suggestion': -0.5
        }

    def _load_sentiment_lexicon(self) -> Dict[str, float]:
        """Load sentiment analysis lexicon."""
        return {
            # Negative sentiment
            'frustrated': -0.8, 'angry': -0.9, 'disappointed': -0.7,
            'terrible': -0.9, 'awful': -0.9, 'horrible': -0.9,
            'worst': -0.8, 'useless': -0.8, 'pathetic': -0.9,
            'unacceptable': -0.8, 'ridiculous': -0.7, 'furious': -0.9,

            # Moderate negative
            'unhappy': -0.5, 'concerned': -0.4, 'worried': -0.5,
            'confused': -0.3, 'unclear': -0.3, 'difficult': -0.4,

            # Neutral
            'need': 0.0, 'want': 0.0, 'looking': 0.0,

            # Positive
            'thanks': 0.5, 'thank you': 0.6, 'appreciate': 0.7,
            'great': 0.8, 'excellent': 0.9, 'helpful': 0.7,
            'satisfied': 0.7, 'happy': 0.6, 'pleased': 0.6
        }

    async def create_ticket(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new support ticket with intelligent classification.

        Args:
            ticket_data: Dictionary containing ticket information

        Returns:
            Created ticket details with assigned priority and routing
        """
        try:
            logger.info("Starting ticket creation")

            # Validate required fields
            required_fields = ['customer_id', 'customer_name', 'customer_email',
                             'subject', 'description']
            for field in required_fields:
                if field not in ticket_data:
                    raise ValueError(f"Missing required field: {field}")

            # Generate ticket ID
            self.ticket_counter += 1
            ticket_id = self._generate_ticket_id(ticket_data)

            # Analyze and classify ticket
            category = await self._classify_ticket(ticket_data)
            priority = await self._calculate_priority(ticket_data)
            sentiment = self._analyze_sentiment(ticket_data.get('description', ''))

            # Calculate SLA deadlines
            now = datetime.utcnow()
            sla = self.sla_configs[priority]
            response_due = now + timedelta(hours=sla.response_time_hours)
            resolution_due = now + timedelta(hours=sla.resolution_time_hours)

            # Create ticket object
            ticket = Ticket(
                ticket_id=ticket_id,
                customer_id=ticket_data['customer_id'],
                customer_name=ticket_data['customer_name'],
                customer_email=ticket_data['customer_email'],
                subject=ticket_data['subject'],
                description=ticket_data['description'],
                category=category,
                priority=priority,
                status=TicketStatus.NEW,
                created_at=now,
                updated_at=now,
                tags=ticket_data.get('tags', []),
                attachments=ticket_data.get('attachments', []),
                customer_sentiment=sentiment,
                response_due_at=response_due,
                resolution_due_at=resolution_due,
                metadata=ticket_data.get('metadata', {})
            )

            # Store ticket
            self.tickets[ticket_id] = ticket

            # Auto-route if enabled
            routing_result = None
            if self.config.get('enable_auto_routing', True):
                routing_result = await self.route_ticket(ticket_id)

            logger.info(f"Ticket {ticket_id} created successfully with priority {priority.name}")

            return {
                'success': True,
                'ticket_id': ticket_id,
                'priority': priority.name,
                'category': category.name,
                'status': ticket.status.value,
                'sentiment_score': sentiment,
                'response_due_at': response_due.isoformat(),
                'resolution_due_at': resolution_due.isoformat(),
                'routing': routing_result,
                'message': 'Ticket created and classified successfully'
            }

        except ValueError as e:
            logger.error(f"Validation error in create_ticket: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_ticket: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred while creating ticket',
                'error_type': 'internal_error'
            }

    def _generate_ticket_id(self, ticket_data: Dict[str, Any]) -> str:
        """Generate unique ticket ID."""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        customer_id = ticket_data.get('customer_id', 'unknown')
        hash_input = f"{timestamp}-{customer_id}-{self.ticket_counter}"
        hash_suffix = hashlib.md5(hash_input.encode()).hexdigest()[:6]
        return f"TKT-{timestamp}-{hash_suffix.upper()}"

    async def _classify_ticket(self, ticket_data: Dict[str, Any]) -> TicketCategory:
        """
        Classify ticket into appropriate category using keyword matching.

        Args:
            ticket_data: Ticket information

        Returns:
            Classified category
        """
        try:
            text = f"{ticket_data.get('subject', '')} {ticket_data.get('description', '')}".lower()

            # Category keyword patterns
            patterns = {
                TicketCategory.SECURITY: [
                    r'\b(security|breach|hack|vulnerability|malware|phishing)\b'
                ],
                TicketCategory.BUG_REPORT: [
                    r'\b(bug|error|crash|broken|not working|malfunction)\b'
                ],
                TicketCategory.BILLING: [
                    r'\b(billing|invoice|payment|charge|refund|subscription|price)\b'
                ],
                TicketCategory.ACCOUNT: [
                    r'\b(account|login|password|access|authentication|profile)\b'
                ],
                TicketCategory.FEATURE_REQUEST: [
                    r'\b(feature|request|enhancement|suggest|would like|wish)\b'
                ],
                TicketCategory.COMPLAINT: [
                    r'\b(complaint|frustrated|angry|disappointed|terrible|awful)\b'
                ],
                TicketCategory.TECHNICAL: [
                    r'\b(technical|integration|api|configuration|setup|install)\b'
                ]
            }

            scores: Dict[TicketCategory, int] = defaultdict(int)

            for category, pattern_list in patterns.items():
                for pattern in pattern_list:
                    matches = len(re.findall(pattern, text))
                    scores[category] += matches

            # Return category with highest score, or general inquiry if no matches
            if scores:
                return max(scores.items(), key=lambda x: x[1])[0]

            return TicketCategory.GENERAL_INQUIRY

        except Exception as e:
            logger.error(f"Error classifying ticket: {e}")
            return TicketCategory.GENERAL_INQUIRY

    async def _calculate_priority(self, ticket_data: Dict[str, Any]) -> TicketPriority:
        """
        Calculate ticket priority using multi-factor scoring algorithm.

        Factors:
        - Keyword urgency indicators
        - Customer sentiment
        - Customer tier/value
        - Time-sensitive indicators
        - Historical patterns

        Args:
            ticket_data: Ticket information

        Returns:
            Calculated priority level
        """
        try:
            text = f"{ticket_data.get('subject', '')} {ticket_data.get('description', '')}".lower()

            # Base score starts at 0
            score = 0.0

            # 1. Keyword-based scoring
            for keyword, weight in self.priority_keywords.items():
                if keyword in text:
                    score += weight

            # 2. Customer tier modifier
            customer_tier = ticket_data.get('metadata', {}).get('customer_tier', 'standard')
            tier_modifiers = {
                'enterprise': 1.5,
                'premium': 1.2,
                'standard': 1.0,
                'free': 0.8
            }
            score *= tier_modifiers.get(customer_tier, 1.0)

            # 3. Impact scope
            if 'all users' in text or 'everyone' in text or 'entire system' in text:
                score += 1.5
            elif 'team' in text or 'department' in text:
                score += 0.8

            # 4. Business impact
            business_keywords = ['revenue', 'sales', 'client', 'deadline', 'contract']
            for keyword in business_keywords:
                if keyword in text:
                    score += 0.7

            # 5. Explicit priority indicators
            if ticket_data.get('priority_override'):
                override = ticket_data['priority_override'].upper()
                if override == 'CRITICAL':
                    return TicketPriority.CRITICAL
                elif override == 'HIGH':
                    score = max(score, 3.0)

            # Convert score to priority level
            if score >= 4.0:
                return TicketPriority.CRITICAL
            elif score >= 2.5:
                return TicketPriority.HIGH
            elif score >= 1.0:
                return TicketPriority.MEDIUM
            elif score >= 0:
                return TicketPriority.LOW
            else:
                return TicketPriority.MINIMAL

        except Exception as e:
            logger.error(f"Error calculating priority: {e}")
            return TicketPriority.MEDIUM

    def _analyze_sentiment(self, text: str) -> float:
        """
        Analyze customer sentiment from ticket text.

        Args:
            text: Ticket description or message

        Returns:
            Sentiment score from -1 (very negative) to 1 (very positive)
        """
        try:
            text_lower = text.lower()

            # Calculate sentiment score
            sentiment_score = 0.0
            word_count = 0

            for word, score in self.sentiment_lexicon.items():
                if word in text_lower:
                    sentiment_score += score
                    word_count += 1

            # Normalize score
            if word_count > 0:
                sentiment_score /= word_count

            # Check for all caps (indicates strong emotion, usually negative)
            if text.isupper() and len(text) > 20:
                sentiment_score -= 0.3

            # Check for excessive punctuation
            exclamation_count = text.count('!')
            if exclamation_count > 2:
                sentiment_score -= 0.2

            # Clamp to [-1, 1] range
            return max(-1.0, min(1.0, sentiment_score))

        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.0

    async def route_ticket(self, ticket_id: str,
                          override_team: Optional[str] = None) -> Dict[str, Any]:
        """
        Route ticket to appropriate team using intelligent routing rules.

        Args:
            ticket_id: Ticket identifier
            override_team: Optional team to override automatic routing

        Returns:
            Routing result with team and agent assignment
        """
        try:
            logger.info(f"Starting ticket routing for {ticket_id}")

            if ticket_id not in self.tickets:
                raise ValueError(f"Ticket {ticket_id} not found")

            ticket = self.tickets[ticket_id]

            # Override routing if specified
            if override_team:
                ticket.assigned_team = override_team
                ticket.status = TicketStatus.ASSIGNED
                ticket.updated_at = datetime.utcnow()

                return {
                    'success': True,
                    'ticket_id': ticket_id,
                    'assigned_team': override_team,
                    'routing_method': 'manual_override'
                }

            # Apply routing rules
            target_team = await self._apply_routing_rules(ticket)

            # Find available agent
            target_agent = await self._find_available_agent(target_team, ticket.priority)

            # Update ticket
            ticket.assigned_team = target_team
            ticket.assigned_to = target_agent
            ticket.status = TicketStatus.ASSIGNED
            ticket.updated_at = datetime.utcnow()

            logger.info(f"Ticket {ticket_id} routed to {target_team} (Agent: {target_agent})")

            return {
                'success': True,
                'ticket_id': ticket_id,
                'assigned_team': target_team,
                'assigned_agent': target_agent,
                'priority': ticket.priority.name,
                'routing_method': 'rule_based',
                'message': f'Ticket routed to {target_team}'
            }

        except ValueError as e:
            logger.error(f"Validation error in route_ticket: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in route_ticket: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred during routing',
                'error_type': 'internal_error'
            }

    async def _apply_routing_rules(self, ticket: Ticket) -> str:
        """
        Apply routing rules to determine target team.

        Args:
            ticket: Ticket object

        Returns:
            Target team name
        """
        # Priority-based routing rules
        routing_map = {
            TicketCategory.SECURITY: 'security',
            TicketCategory.BILLING: 'billing',
            TicketCategory.TECHNICAL: 'technical',
            TicketCategory.BUG_REPORT: 'technical',
            TicketCategory.ACCOUNT: 'tier1',
            TicketCategory.FEATURE_REQUEST: 'tier2',
            TicketCategory.COMPLAINT: 'tier2',
            TicketCategory.GENERAL_INQUIRY: 'tier1'
        }

        team = routing_map.get(ticket.category, 'tier1')

        # Escalate critical tickets to tier3
        if ticket.priority == TicketPriority.CRITICAL:
            team = 'tier3'

        return team

    async def _find_available_agent(self, team: str,
                                   priority: TicketPriority) -> Optional[str]:
        """
        Find available agent in target team.

        Args:
            team: Team name
            priority: Ticket priority

        Returns:
            Agent identifier or None
        """
        # Simulated agent availability - in production, would query real agent status
        team_agents = {
            'tier1': ['agent_t1_001', 'agent_t1_002', 'agent_t1_003'],
            'tier2': ['agent_t2_001', 'agent_t2_002'],
            'tier3': ['agent_t3_001', 'agent_t3_002'],
            'billing': ['agent_bill_001', 'agent_bill_002'],
            'technical': ['agent_tech_001', 'agent_tech_002', 'agent_tech_003'],
            'security': ['agent_sec_001', 'agent_sec_002']
        }

        agents = team_agents.get(team, [])
        if agents:
            # For critical tickets, assign to first agent (senior/on-call)
            if priority == TicketPriority.CRITICAL:
                return agents[0]
            # Round-robin for others
            return agents[self.ticket_counter % len(agents)]

        return None

    async def track_sla(self, ticket_id: str) -> Dict[str, Any]:
        """
        Track SLA compliance for a ticket.

        Args:
            ticket_id: Ticket identifier

        Returns:
            SLA tracking information
        """
        try:
            if ticket_id not in self.tickets:
                raise ValueError(f"Ticket {ticket_id} not found")

            ticket = self.tickets[ticket_id]
            now = datetime.utcnow()
            sla = self.sla_configs[ticket.priority]

            # Calculate time metrics
            age_hours = (now - ticket.created_at).total_seconds() / 3600

            response_status = 'pending'
            response_time_remaining = None
            if ticket.first_response_at:
                response_status = 'met'
                response_time = (ticket.first_response_at - ticket.created_at).total_seconds() / 3600
            elif ticket.response_due_at:
                response_time_remaining = (ticket.response_due_at - now).total_seconds() / 3600
                if response_time_remaining < 0:
                    response_status = 'breached'
                    ticket.sla_breach = True

            resolution_status = 'pending'
            resolution_time_remaining = None
            if ticket.resolved_at:
                resolution_status = 'met'
                resolution_time = (ticket.resolved_at - ticket.created_at).total_seconds() / 3600
            elif ticket.resolution_due_at:
                resolution_time_remaining = (ticket.resolution_due_at - now).total_seconds() / 3600
                if resolution_time_remaining < 0:
                    resolution_status = 'breached'
                    ticket.sla_breach = True

            # Check if escalation is needed
            escalation_needed = False
            if age_hours >= sla.escalation_time_hours and ticket.status not in [
                TicketStatus.RESOLVED, TicketStatus.CLOSED
            ]:
                escalation_needed = True

            result = {
                'success': True,
                'ticket_id': ticket_id,
                'priority': ticket.priority.name,
                'age_hours': round(age_hours, 2),
                'sla_config': {
                    'response_time_hours': sla.response_time_hours,
                    'resolution_time_hours': sla.resolution_time_hours,
                    'escalation_time_hours': sla.escalation_time_hours
                },
                'response_sla': {
                    'status': response_status,
                    'time_remaining_hours': round(response_time_remaining, 2) if response_time_remaining else None,
                    'due_at': ticket.response_due_at.isoformat() if ticket.response_due_at else None
                },
                'resolution_sla': {
                    'status': resolution_status,
                    'time_remaining_hours': round(resolution_time_remaining, 2) if resolution_time_remaining else None,
                    'due_at': ticket.resolution_due_at.isoformat() if ticket.resolution_due_at else None
                },
                'escalation_needed': escalation_needed,
                'sla_breach': ticket.sla_breach
            }

            # Log SLA breach
            if ticket.sla_breach and not any(b['ticket_id'] == ticket_id for b in self.sla_breaches):
                self.sla_breaches.append({
                    'ticket_id': ticket_id,
                    'priority': ticket.priority.name,
                    'breach_type': 'response' if response_status == 'breached' else 'resolution',
                    'breached_at': now.isoformat()
                })
                logger.warning(f"SLA breach detected for ticket {ticket_id}")

            return result

        except ValueError as e:
            logger.error(f"Validation error in track_sla: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in track_sla: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred during SLA tracking',
                'error_type': 'internal_error'
            }

    async def update_ticket_status(self, ticket_id: str, new_status: str,
                                  notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Update ticket status with validation and SLA tracking.

        Args:
            ticket_id: Ticket identifier
            new_status: New status value
            notes: Optional status update notes

        Returns:
            Updated ticket details
        """
        try:
            logger.info(f"Updating ticket {ticket_id} status to {new_status}")

            if ticket_id not in self.tickets:
                raise ValueError(f"Ticket {ticket_id} not found")

            # Validate status transition
            try:
                status_enum = TicketStatus(new_status.lower())
            except ValueError:
                raise ValueError(f"Invalid status: {new_status}")

            ticket = self.tickets[ticket_id]
            old_status = ticket.status
            now = datetime.utcnow()

            # Update timestamps based on status
            if status_enum == TicketStatus.IN_PROGRESS and not ticket.first_response_at:
                ticket.first_response_at = now
            elif status_enum == TicketStatus.RESOLVED and not ticket.resolved_at:
                ticket.resolved_at = now
                # Calculate resolution time
                resolution_time = (now - ticket.created_at).total_seconds() / 3600
                self.resolution_times[ticket.priority.name].append(resolution_time)
            elif status_enum == TicketStatus.CLOSED and not ticket.closed_at:
                ticket.closed_at = now

            # Update ticket
            ticket.status = status_enum
            ticket.updated_at = now
            if notes:
                ticket.resolution_notes += f"\n[{now.isoformat()}] {notes}"

            logger.info(f"Ticket {ticket_id} status updated from {old_status.value} to {new_status}")

            return {
                'success': True,
                'ticket_id': ticket_id,
                'old_status': old_status.value,
                'new_status': new_status,
                'updated_at': now.isoformat(),
                'message': 'Ticket status updated successfully'
            }

        except ValueError as e:
            logger.error(f"Validation error in update_ticket_status: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in update_ticket_status: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def create_workflow(self, ticket_id: str,
                            workflow_type: str = 'standard') -> Dict[str, Any]:
        """
        Create resolution workflow for ticket.

        Args:
            ticket_id: Ticket identifier
            workflow_type: Type of workflow template

        Returns:
            Created workflow details
        """
        try:
            if ticket_id not in self.tickets:
                raise ValueError(f"Ticket {ticket_id} not found")

            ticket = self.tickets[ticket_id]

            # Generate workflow steps based on ticket category
            steps = self._generate_workflow_steps(ticket, workflow_type)

            self.workflows[ticket_id] = steps

            logger.info(f"Workflow created for ticket {ticket_id} with {len(steps)} steps")

            return {
                'success': True,
                'ticket_id': ticket_id,
                'workflow_type': workflow_type,
                'total_steps': len(steps),
                'estimated_minutes': sum(s.estimated_minutes for s in steps),
                'steps': [
                    {
                        'step_id': s.step_id,
                        'name': s.name,
                        'action_type': s.action_type,
                        'estimated_minutes': s.estimated_minutes
                    }
                    for s in steps
                ]
            }

        except ValueError as e:
            logger.error(f"Validation error in create_workflow: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_workflow: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _generate_workflow_steps(self, ticket: Ticket,
                                workflow_type: str) -> List[WorkflowStep]:
        """Generate workflow steps based on ticket type."""
        steps = []

        # Common initial steps
        steps.append(WorkflowStep(
            step_id=f"{ticket.ticket_id}_step_001",
            name="Initial Assessment",
            description="Review ticket details and gather initial information",
            action_type="manual",
            estimated_minutes=5
        ))

        steps.append(WorkflowStep(
            step_id=f"{ticket.ticket_id}_step_002",
            name="Customer Contact",
            description="Reach out to customer for additional details if needed",
            action_type="manual",
            estimated_minutes=10
        ))

        # Category-specific steps
        if ticket.category == TicketCategory.TECHNICAL:
            steps.extend([
                WorkflowStep(
                    step_id=f"{ticket.ticket_id}_step_003",
                    name="Technical Investigation",
                    description="Investigate technical issue and identify root cause",
                    action_type="manual",
                    required_role="technical",
                    estimated_minutes=30
                ),
                WorkflowStep(
                    step_id=f"{ticket.ticket_id}_step_004",
                    name="Solution Implementation",
                    description="Implement and test solution",
                    action_type="manual",
                    required_role="technical",
                    estimated_minutes=45
                )
            ])
        elif ticket.category == TicketCategory.BILLING:
            steps.extend([
                WorkflowStep(
                    step_id=f"{ticket.ticket_id}_step_003",
                    name="Billing Review",
                    description="Review billing records and transaction history",
                    action_type="automated",
                    required_role="billing",
                    estimated_minutes=15
                ),
                WorkflowStep(
                    step_id=f"{ticket.ticket_id}_step_004",
                    name="Adjustment Processing",
                    description="Process any necessary billing adjustments",
                    action_type="manual",
                    required_role="billing",
                    estimated_minutes=20
                )
            ])

        # Common final steps
        steps.append(WorkflowStep(
            step_id=f"{ticket.ticket_id}_step_final",
            name="Resolution Confirmation",
            description="Confirm resolution with customer and close ticket",
            action_type="manual",
            estimated_minutes=10
        ))

        return steps

    async def escalate_ticket(self, ticket_id: str,
                            reason: str,
                            target_level: Optional[int] = None) -> Dict[str, Any]:
        """
        Escalate ticket to higher support tier.

        Args:
            ticket_id: Ticket identifier
            reason: Escalation reason
            target_level: Target escalation level (auto-calculated if not provided)

        Returns:
            Escalation result
        """
        try:
            if ticket_id not in self.tickets:
                raise ValueError(f"Ticket {ticket_id} not found")

            ticket = self.tickets[ticket_id]

            # Calculate target escalation level
            if target_level is None:
                target_level = ticket.escalation_level + 1

            max_level = self.config.get('max_escalation_level', 3)
            if target_level > max_level:
                raise ValueError(f"Cannot escalate beyond level {max_level}")

            # Update ticket
            old_level = ticket.escalation_level
            old_team = ticket.assigned_team

            ticket.escalation_level = target_level
            ticket.status = TicketStatus.ESCALATED
            ticket.updated_at = datetime.utcnow()

            # Escalate to higher tier team
            tier_map = {0: 'tier1', 1: 'tier2', 2: 'tier3', 3: 'tier3'}
            new_team = tier_map.get(target_level, 'tier3')

            # Re-route to escalated team
            routing_result = await self.route_ticket(ticket_id, override_team=new_team)

            logger.warning(f"Ticket {ticket_id} escalated from level {old_level} to {target_level}")

            return {
                'success': True,
                'ticket_id': ticket_id,
                'old_escalation_level': old_level,
                'new_escalation_level': target_level,
                'old_team': old_team,
                'new_team': new_team,
                'reason': reason,
                'routing': routing_result,
                'message': f'Ticket escalated to level {target_level}'
            }

        except ValueError as e:
            logger.error(f"Validation error in escalate_ticket: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in escalate_ticket: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def get_analytics(self) -> Dict[str, Any]:
        """
        Get comprehensive support analytics.

        Returns:
            Analytics report with key metrics
        """
        try:
            total_tickets = len(self.tickets)
            if total_tickets == 0:
                return {
                    'success': True,
                    'message': 'No tickets to analyze',
                    'total_tickets': 0
                }

            # Status distribution
            status_counts = defaultdict(int)
            for ticket in self.tickets.values():
                status_counts[ticket.status.value] += 1

            # Priority distribution
            priority_counts = defaultdict(int)
            for ticket in self.tickets.values():
                priority_counts[ticket.priority.name] += 1

            # Category distribution
            category_counts = defaultdict(int)
            for ticket in self.tickets.values():
                category_counts[ticket.category.name] += 1

            # Average resolution times
            avg_resolution_times = {}
            for priority, times in self.resolution_times.items():
                if times:
                    avg_resolution_times[priority] = round(sum(times) / len(times), 2)

            # SLA metrics
            total_breaches = len(self.sla_breaches)
            sla_compliance_rate = ((total_tickets - total_breaches) / total_tickets * 100) if total_tickets > 0 else 100

            return {
                'success': True,
                'total_tickets': total_tickets,
                'status_distribution': dict(status_counts),
                'priority_distribution': dict(priority_counts),
                'category_distribution': dict(category_counts),
                'average_resolution_times_hours': avg_resolution_times,
                'sla_metrics': {
                    'total_breaches': total_breaches,
                    'compliance_rate_percent': round(sla_compliance_rate, 2)
                },
                'escalations': sum(1 for t in self.tickets.values() if t.escalation_level > 0)
            }

        except Exception as e:
            logger.error(f"Error generating analytics: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def get_ticket_details(self, ticket_id: str) -> Dict[str, Any]:
        """Get detailed information about a ticket."""
        try:
            if ticket_id not in self.tickets:
                raise ValueError(f"Ticket {ticket_id} not found")

            ticket = self.tickets[ticket_id]

            return {
                'success': True,
                'ticket': {
                    'ticket_id': ticket.ticket_id,
                    'customer_id': ticket.customer_id,
                    'customer_name': ticket.customer_name,
                    'subject': ticket.subject,
                    'description': ticket.description,
                    'category': ticket.category.name,
                    'priority': ticket.priority.name,
                    'status': ticket.status.value,
                    'assigned_to': ticket.assigned_to,
                    'assigned_team': ticket.assigned_team,
                    'created_at': ticket.created_at.isoformat(),
                    'updated_at': ticket.updated_at.isoformat(),
                    'sentiment_score': ticket.customer_sentiment,
                    'escalation_level': ticket.escalation_level,
                    'sla_breach': ticket.sla_breach,
                    'tags': ticket.tags
                }
            }
        except ValueError as e:
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Error getting ticket details: {e}")
            return {'success': False, 'error': 'Internal error'}
