"""
Service Designer Agent - Production Implementation

Creates and optimizes service packages using Service Blueprint Methodology,
Service Tiering Logic, Customer Journey Mapping, and Resource Allocation.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import statistics
import math

logger = logging.getLogger(__name__)


class ServiceTier(Enum):
    """Service tier levels"""
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"


class JourneyStage(Enum):
    """Customer journey stages"""
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    PURCHASE = "purchase"
    RETENTION = "retention"
    ADVOCACY = "advocacy"


class ResourceType(Enum):
    """Resource types for service delivery"""
    HUMAN = "human"
    TECHNOLOGY = "technology"
    INFRASTRUCTURE = "infrastructure"
    PARTNER = "partner"


class ComplexityLevel(Enum):
    """Service complexity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class ServiceDeliverable:
    """Service deliverable definition"""
    deliverable_id: str
    name: str
    description: str
    category: str
    effort_hours: float
    dependencies: List[str] = field(default_factory=list)
    quality_criteria: List[str] = field(default_factory=list)
    timeline_days: int = 0
    resources_required: List[str] = field(default_factory=list)


@dataclass
class ServiceBlueprint:
    """Service blueprint with customer actions and backstage processes"""
    customer_actions: List[str]
    frontstage_interactions: List[str]
    backstage_processes: List[str]
    support_processes: List[str]
    physical_evidence: List[str]
    touchpoints: Dict[str, List[str]]


@dataclass
class ServiceTierDefinition:
    """Service tier configuration"""
    tier_level: ServiceTier
    name: str
    description: str
    features: List[str]
    deliverables: List[str]
    pricing_range: Tuple[float, float]
    target_segment: str
    response_time_sla: str
    support_level: str
    customization_allowed: bool


@dataclass
class JourneyTouchpoint:
    """Customer journey touchpoint"""
    stage: JourneyStage
    touchpoint_name: str
    channel: str
    customer_action: str
    service_response: str
    pain_points: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)
    emotion: str = "neutral"


@dataclass
class ResourceAllocation:
    """Resource allocation for service delivery"""
    resource_id: str
    resource_type: ResourceType
    resource_name: str
    skill_level: str
    capacity_percentage: float
    allocated_hours: float
    cost_per_hour: float
    availability_start: datetime
    availability_end: datetime


@dataclass
class ServiceComplexityScore:
    """Service complexity assessment"""
    total_score: float
    deliverables_score: float
    resources_score: float
    timeline_score: float
    dependencies_score: float
    risk_score: float
    complexity_level: ComplexityLevel
    breakdown: Dict[str, float]


class ServiceDesignerAgent:
    """
    Service Designer Agent - Comprehensive service package design and optimization

    Implements advanced frameworks:
    - Service Blueprint Methodology
    - Service Tiering Logic
    - Customer Journey Mapping (5 stages)
    - Service Complexity Scoring
    - Resource Allocation Algorithms
    - Deliverable Estimation
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Service Designer Agent

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "service_designer_001"
        self.config = config or {}
        self.service_catalog: List[Dict[str, Any]] = []
        self.name = "Service Designer"
        self.role = "Service Package Design and Optimization"

        # Complexity scoring weights
        self.complexity_weights = {
            'deliverables': 0.30,
            'resources': 0.25,
            'timeline': 0.20,
            'dependencies': 0.15,
            'risk': 0.10
        }

        # Standard service tiers configuration
        self.tier_templates = self._initialize_tier_templates()

        logger.info(f"Service Designer Agent {self.agent_id} initialized")

    # ==================== SERVICE PACKAGE DESIGN ====================

    def design_service_package(
        self,
        service_name: str,
        target_audience: str,
        objectives: List[str],
        requirements: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Design a comprehensive service package with all components

        Args:
            service_name: Name of the service
            target_audience: Target audience for the service
            objectives: List of service objectives
            requirements: Additional requirements and constraints

        Returns:
            Complete service package design

        Example:
            >>> package = agent.design_service_package(
            ...     "Digital Transformation Consulting",
            ...     "Mid-market enterprises",
            ...     ["Modernize infrastructure", "Improve efficiency"]
            ... )
        """
        try:
            logger.info(f"Designing service package: {service_name}")

            requirements = requirements or {}

            # Generate service ID
            service_id = f"service_{int(datetime.now().timestamp())}"

            # Define deliverables based on objectives
            deliverables = self._generate_deliverables(objectives, requirements)

            # Create service blueprint
            blueprint = self._create_service_blueprint(service_name, deliverables)

            # Estimate timeline
            timeline = self._estimate_service_timeline(deliverables)

            # Determine required resources
            resources = self._determine_resources(deliverables, requirements)

            # Calculate complexity
            complexity = self.calculate_service_complexity(
                deliverables=len(deliverables),
                resources=resources,
                timeline_days=timeline['total_days']
            )

            # Define success metrics
            success_metrics = self._define_success_metrics(objectives)

            # Create package
            package = {
                "service_id": service_id,
                "name": service_name,
                "target_audience": target_audience,
                "objectives": objectives,
                "deliverables": [d.__dict__ for d in deliverables],
                "blueprint": {
                    "customer_actions": blueprint.customer_actions,
                    "frontstage_interactions": blueprint.frontstage_interactions,
                    "backstage_processes": blueprint.backstage_processes,
                    "support_processes": blueprint.support_processes,
                    "physical_evidence": blueprint.physical_evidence,
                    "touchpoints": blueprint.touchpoints
                },
                "timeline": timeline,
                "resources_required": [r.__dict__ if hasattr(r, '__dict__') else r for r in resources],
                "complexity": {
                    "score": complexity.total_score,
                    "level": complexity.complexity_level.value,
                    "breakdown": complexity.breakdown
                },
                "success_metrics": success_metrics,
                "created_at": datetime.now().isoformat(),
                "status": "designed"
            }

            self.service_catalog.append(package)
            logger.info(f"Service package {service_id} designed successfully")

            return package

        except Exception as e:
            logger.error(f"Error designing service package: {e}")
            raise

    def create_service_tiers(
        self,
        base_service: str,
        tier_count: int = 3,
        customization: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create tiered service offerings (Basic, Pro, Enterprise)

        Args:
            base_service: Base service name
            tier_count: Number of tiers (default: 3)
            customization: Custom tier configurations

        Returns:
            Tiered service structure with feature differentiation

        Example:
            >>> tiers = agent.create_service_tiers(
            ...     "Social Media Management",
            ...     tier_count=3
            ... )
        """
        try:
            logger.info(f"Creating {tier_count} service tiers for {base_service}")

            customization = customization or {}

            # Base features that all tiers include
            base_features = customization.get('base_features', [
                "Initial consultation",
                "Service onboarding",
                "Monthly reporting"
            ])

            tiers_list = []

            if tier_count >= 1:
                # Basic Tier
                basic_tier = ServiceTierDefinition(
                    tier_level=ServiceTier.BASIC,
                    name=f"{base_service} - Basic",
                    description="Essential features for getting started",
                    features=base_features + [
                        "Standard delivery timeline",
                        "Email support (48h response)",
                        "Basic analytics",
                        "Monthly check-ins"
                    ],
                    deliverables=["Core deliverable package"],
                    pricing_range=(1000.0, 3000.0),
                    target_segment="Small businesses, startups",
                    response_time_sla="48 hours",
                    support_level="Email only",
                    customization_allowed=False
                )
                tiers_list.append(basic_tier)

            if tier_count >= 2:
                # Professional Tier
                pro_tier = ServiceTierDefinition(
                    tier_level=ServiceTier.PROFESSIONAL,
                    name=f"{base_service} - Professional",
                    description="Advanced features for growing organizations",
                    features=base_features + [
                        "Priority delivery timeline",
                        "Email + Chat support (24h response)",
                        "Advanced analytics & insights",
                        "Bi-weekly check-ins",
                        "Quarterly strategy sessions",
                        "Limited customization",
                        "Dedicated account manager"
                    ],
                    deliverables=["Enhanced deliverable package", "Custom reports"],
                    pricing_range=(3000.0, 8000.0),
                    target_segment="Growing companies, mid-market",
                    response_time_sla="24 hours",
                    support_level="Email + Chat",
                    customization_allowed=True
                )
                tiers_list.append(pro_tier)

            if tier_count >= 3:
                # Enterprise Tier
                enterprise_tier = ServiceTierDefinition(
                    tier_level=ServiceTier.ENTERPRISE,
                    name=f"{base_service} - Enterprise",
                    description="Premium features with full customization",
                    features=base_features + [
                        "Expedited delivery timeline",
                        "24/7 priority support (4h response)",
                        "Real-time analytics & custom dashboards",
                        "Weekly strategy sessions",
                        "Full customization",
                        "Dedicated team",
                        "SLA guarantees",
                        "White-glove service",
                        "API access",
                        "Integration support"
                    ],
                    deliverables=[
                        "Premium deliverable package",
                        "Custom integration",
                        "Dedicated resources"
                    ],
                    pricing_range=(8000.0, 25000.0),
                    target_segment="Enterprise organizations",
                    response_time_sla="4 hours",
                    support_level="24/7 Priority",
                    customization_allowed=True
                )
                tiers_list.append(enterprise_tier)

            # Create feature comparison matrix
            feature_matrix = self._create_feature_matrix(tiers_list)

            # Calculate value progression
            value_progression = self._calculate_value_progression(tiers_list)

            tier_structure = {
                "base_service": base_service,
                "tier_count": tier_count,
                "tiers": [
                    {
                        "level": tier.tier_level.value,
                        "name": tier.name,
                        "description": tier.description,
                        "features": tier.features,
                        "deliverables": tier.deliverables,
                        "pricing_range": {
                            "min": tier.pricing_range[0],
                            "max": tier.pricing_range[1]
                        },
                        "target_segment": tier.target_segment,
                        "sla": tier.response_time_sla,
                        "support": tier.support_level,
                        "customization": tier.customization_allowed
                    }
                    for tier in tiers_list
                ],
                "feature_matrix": feature_matrix,
                "value_progression": value_progression,
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Created {tier_count} tiers for {base_service}")
            return tier_structure

        except Exception as e:
            logger.error(f"Error creating service tiers: {e}")
            raise

    def map_customer_journey(
        self,
        service_id: str,
        persona: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Map customer journey across 5 stages with touchpoints

        Args:
            service_id: Service identifier
            persona: Customer persona information

        Returns:
            Complete customer journey map with touchpoints and opportunities

        Example:
            >>> journey = agent.map_customer_journey(
            ...     "service_123",
            ...     persona={"name": "Marketing Director", "pain_points": [...]}
            ... )
        """
        try:
            logger.info(f"Mapping customer journey for service {service_id}")

            persona = persona or {}

            # Define touchpoints for each stage
            touchpoints = []

            # Stage 1: Awareness
            awareness_touchpoints = [
                JourneyTouchpoint(
                    stage=JourneyStage.AWARENESS,
                    touchpoint_name="Website Visit",
                    channel="Website",
                    customer_action="Discovers service through search/referral",
                    service_response="Clear value proposition on homepage",
                    pain_points=["Information overload", "Unclear differentiation"],
                    opportunities=["SEO optimization", "Clear messaging"],
                    emotion="curious"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.AWARENESS,
                    touchpoint_name="Content Download",
                    channel="Content Marketing",
                    customer_action="Downloads whitepaper/guide",
                    service_response="Automated email sequence begins",
                    pain_points=["Too much content requested"],
                    opportunities=["Lead nurturing", "Education"],
                    emotion="interested"
                )
            ]
            touchpoints.extend(awareness_touchpoints)

            # Stage 2: Consideration
            consideration_touchpoints = [
                JourneyTouchpoint(
                    stage=JourneyStage.CONSIDERATION,
                    touchpoint_name="Consultation Request",
                    channel="Sales",
                    customer_action="Schedules discovery call",
                    service_response="Needs assessment questionnaire sent",
                    pain_points=["Complex scheduling", "Long wait times"],
                    opportunities=["Instant scheduling", "Preparation materials"],
                    emotion="evaluating"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.CONSIDERATION,
                    touchpoint_name="Proposal Review",
                    channel="Sales",
                    customer_action="Reviews custom proposal",
                    service_response="Detailed proposal with case studies",
                    pain_points=["Unclear pricing", "Generic proposals"],
                    opportunities=["Interactive pricing", "Personalization"],
                    emotion="comparing"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.CONSIDERATION,
                    touchpoint_name="Reference Check",
                    channel="Customer Success",
                    customer_action="Speaks with current clients",
                    service_response="Curated reference connections",
                    pain_points=["Lack of relevant references"],
                    opportunities=["Reference program", "Case studies"],
                    emotion="validating"
                )
            ]
            touchpoints.extend(consideration_touchpoints)

            # Stage 3: Purchase
            purchase_touchpoints = [
                JourneyTouchpoint(
                    stage=JourneyStage.PURCHASE,
                    touchpoint_name="Contract Signing",
                    channel="Legal/Sales",
                    customer_action="Reviews and signs agreement",
                    service_response="Streamlined digital contract process",
                    pain_points=["Complex legal terms", "Slow process"],
                    opportunities=["E-signature", "Plain language contracts"],
                    emotion="committed"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.PURCHASE,
                    touchpoint_name="Onboarding Kickoff",
                    channel="Operations",
                    customer_action="Attends kickoff meeting",
                    service_response="Welcome package and timeline shared",
                    pain_points=["Information dump", "Unclear next steps"],
                    opportunities=["Phased onboarding", "Clear roadmap"],
                    emotion="optimistic"
                )
            ]
            touchpoints.extend(purchase_touchpoints)

            # Stage 4: Retention
            retention_touchpoints = [
                JourneyTouchpoint(
                    stage=JourneyStage.RETENTION,
                    touchpoint_name="Regular Check-ins",
                    channel="Account Management",
                    customer_action="Participates in status reviews",
                    service_response="Proactive performance reporting",
                    pain_points=["Reactive support", "Lack of insights"],
                    opportunities=["Predictive analytics", "Proactive recommendations"],
                    emotion="satisfied"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.RETENTION,
                    touchpoint_name="Support Interaction",
                    channel="Customer Support",
                    customer_action="Submits support ticket",
                    service_response="Rapid resolution with root cause analysis",
                    pain_points=["Slow response", "Repeating information"],
                    opportunities=["Self-service portal", "AI assistance"],
                    emotion="frustrated_then_relieved"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.RETENTION,
                    touchpoint_name="Renewal Discussion",
                    channel="Account Management",
                    customer_action="Reviews service performance",
                    service_response="ROI analysis and expansion options",
                    pain_points=["Unclear value delivered"],
                    opportunities=["Value reporting", "Expansion planning"],
                    emotion="evaluating"
                )
            ]
            touchpoints.extend(retention_touchpoints)

            # Stage 5: Advocacy
            advocacy_touchpoints = [
                JourneyTouchpoint(
                    stage=JourneyStage.ADVOCACY,
                    touchpoint_name="Review Request",
                    channel="Marketing",
                    customer_action="Writes testimonial/review",
                    service_response="Recognition and thank you gift",
                    pain_points=["Too much effort required"],
                    opportunities=["Guided templates", "Video testimonials"],
                    emotion="proud"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.ADVOCACY,
                    touchpoint_name="Referral Program",
                    channel="Sales",
                    customer_action="Refers new clients",
                    service_response="Referral incentives and tracking",
                    pain_points=["No incentive", "Complex process"],
                    opportunities=["Automated referral system", "Rewards"],
                    emotion="engaged"
                ),
                JourneyTouchpoint(
                    stage=JourneyStage.ADVOCACY,
                    touchpoint_name="Case Study Participation",
                    channel="Marketing",
                    customer_action="Agrees to case study",
                    service_response="Professional case study production",
                    pain_points=["Time commitment", "Approval process"],
                    opportunities=["Streamlined process", "Co-marketing"],
                    emotion="collaborative"
                )
            ]
            touchpoints.extend(advocacy_touchpoints)

            # Analyze pain points and opportunities by stage
            stage_analysis = self._analyze_journey_stages(touchpoints)

            # Calculate journey health score
            health_score = self._calculate_journey_health(touchpoints)

            journey_map = {
                "service_id": service_id,
                "persona": persona,
                "stages": {
                    stage.value: {
                        "touchpoints": [
                            {
                                "name": tp.touchpoint_name,
                                "channel": tp.channel,
                                "customer_action": tp.customer_action,
                                "service_response": tp.service_response,
                                "pain_points": tp.pain_points,
                                "opportunities": tp.opportunities,
                                "emotion": tp.emotion
                            }
                            for tp in touchpoints if tp.stage == stage
                        ]
                    }
                    for stage in JourneyStage
                },
                "stage_analysis": stage_analysis,
                "health_score": health_score,
                "total_touchpoints": len(touchpoints),
                "total_pain_points": sum(len(tp.pain_points) for tp in touchpoints),
                "total_opportunities": sum(len(tp.opportunities) for tp in touchpoints),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Customer journey mapped with {len(touchpoints)} touchpoints")
            return journey_map

        except Exception as e:
            logger.error(f"Error mapping customer journey: {e}")
            raise

    def calculate_service_complexity(
        self,
        deliverables: int,
        resources: List[Any],
        timeline_days: int,
        dependencies: Optional[List[str]] = None,
        risk_factors: Optional[List[str]] = None
    ) -> ServiceComplexityScore:
        """
        Calculate service complexity using weighted scoring algorithm

        Weights: Deliverables 30%, Resources 25%, Timeline 20%, Dependencies 15%, Risk 10%

        Args:
            deliverables: Number of deliverables
            resources: Resource requirements
            timeline_days: Timeline in days
            dependencies: External dependencies
            risk_factors: Risk factors

        Returns:
            Comprehensive complexity score and assessment

        Example:
            >>> complexity = agent.calculate_service_complexity(
            ...     deliverables=15,
            ...     resources=[...],
            ...     timeline_days=90
            ... )
        """
        try:
            logger.info("Calculating service complexity")

            dependencies = dependencies or []
            risk_factors = risk_factors or []

            # Score deliverables (0-100)
            # More deliverables = higher complexity
            deliverables_score = min(100, (deliverables / 20) * 100)

            # Score resources (0-100)
            # More resources and diversity = higher complexity
            resource_count = len(resources)
            resource_types = len(set(
                r.resource_type.value if hasattr(r, 'resource_type') else 'unknown'
                for r in resources
            ))
            resources_score = min(100, (resource_count / 15) * 60 + (resource_types / 4) * 40)

            # Score timeline (0-100)
            # Longer timeline = higher complexity (but plateaus)
            timeline_score = min(100, (timeline_days / 180) * 100)

            # Score dependencies (0-100)
            dependencies_score = min(100, (len(dependencies) / 10) * 100)

            # Score risk (0-100)
            risk_score = min(100, (len(risk_factors) / 8) * 100)

            # Calculate weighted total
            total_score = (
                deliverables_score * self.complexity_weights['deliverables'] +
                resources_score * self.complexity_weights['resources'] +
                timeline_score * self.complexity_weights['timeline'] +
                dependencies_score * self.complexity_weights['dependencies'] +
                risk_score * self.complexity_weights['risk']
            )

            # Determine complexity level
            if total_score < 30:
                complexity_level = ComplexityLevel.LOW
            elif total_score < 55:
                complexity_level = ComplexityLevel.MEDIUM
            elif total_score < 75:
                complexity_level = ComplexityLevel.HIGH
            else:
                complexity_level = ComplexityLevel.VERY_HIGH

            breakdown = {
                "deliverables": round(deliverables_score, 2),
                "resources": round(resources_score, 2),
                "timeline": round(timeline_score, 2),
                "dependencies": round(dependencies_score, 2),
                "risk": round(risk_score, 2)
            }

            complexity = ServiceComplexityScore(
                total_score=round(total_score, 2),
                deliverables_score=deliverables_score,
                resources_score=resources_score,
                timeline_score=timeline_score,
                dependencies_score=dependencies_score,
                risk_score=risk_score,
                complexity_level=complexity_level,
                breakdown=breakdown
            )

            logger.info(f"Complexity calculated: {complexity_level.value} ({total_score:.1f})")
            return complexity

        except Exception as e:
            logger.error(f"Error calculating service complexity: {e}")
            raise

    def bundle_services(
        self,
        services: List[str],
        bundling_strategy: str = "complementary"
    ) -> Dict[str, Any]:
        """
        Bundle services for cross-sell and upsell optimization

        Args:
            services: List of service IDs to bundle
            bundling_strategy: Strategy - 'complementary', 'sequential', 'value'

        Returns:
            Optimized service bundle with pricing and recommendations
        """
        try:
            logger.info(f"Bundling {len(services)} services with {bundling_strategy} strategy")

            # Get service details
            service_details = [
                s for s in self.service_catalog
                if s['service_id'] in services
            ]

            if len(service_details) != len(services):
                logger.warning("Some services not found in catalog")

            # Calculate bundle discount
            if bundling_strategy == "complementary":
                discount_pct = 15.0
            elif bundling_strategy == "sequential":
                discount_pct = 10.0
            elif bundling_strategy == "value":
                discount_pct = 20.0
            else:
                discount_pct = 12.0

            # Identify synergies
            synergies = self._identify_service_synergies(service_details)

            # Calculate combined metrics
            total_deliverables = sum(
                len(s.get('deliverables', [])) for s in service_details
            )

            # Recommend bundle name
            if len(service_details) >= 2:
                bundle_name = f"{service_details[0].get('name', 'Service')} + " \
                             f"{service_details[1].get('name', 'Service')} Bundle"
            else:
                bundle_name = "Custom Service Bundle"

            bundle = {
                "bundle_id": f"bundle_{int(datetime.now().timestamp())}",
                "name": bundle_name,
                "services": services,
                "bundling_strategy": bundling_strategy,
                "discount_percentage": discount_pct,
                "synergies": synergies,
                "combined_deliverables": total_deliverables,
                "cross_sell_opportunities": self._identify_cross_sell(service_details),
                "upsell_path": self._identify_upsell_path(service_details),
                "recommended_tier": "professional",
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Bundle created with {discount_pct}% discount")
            return bundle

        except Exception as e:
            logger.error(f"Error bundling services: {e}")
            raise

    def optimize_service_delivery(
        self,
        service_id: str,
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimize service delivery with resource constraints

        Args:
            service_id: Service to optimize
            constraints: Resource and timeline constraints

        Returns:
            Optimization recommendations and resource allocation
        """
        try:
            logger.info(f"Optimizing service delivery for {service_id}")

            constraints = constraints or {}

            # Find service
            service = next(
                (s for s in self.service_catalog if s['service_id'] == service_id),
                None
            )

            if not service:
                raise ValueError(f"Service {service_id} not found")

            # Analyze current resource allocation
            current_resources = service.get('resources_required', [])

            # Identify bottlenecks
            bottlenecks = self._identify_bottlenecks(service, constraints)

            # Optimize resource allocation
            optimized_allocation = self._optimize_resource_allocation(
                current_resources,
                constraints
            )

            # Calculate efficiency gains
            efficiency_gains = self._calculate_efficiency_gains(
                current_resources,
                optimized_allocation
            )

            # Generate recommendations
            recommendations = [
                "Parallelize independent deliverables to reduce timeline",
                "Allocate senior resources to critical path items",
                "Implement automation for repetitive tasks",
                "Use templates to standardize deliverables",
                "Cross-train team members for flexibility"
            ]

            optimization = {
                "service_id": service_id,
                "bottlenecks": bottlenecks,
                "optimized_allocation": optimized_allocation,
                "efficiency_gains": efficiency_gains,
                "recommendations": recommendations,
                "expected_timeline_reduction": "15-20%",
                "expected_cost_reduction": "10-15%",
                "timestamp": datetime.now().isoformat()
            }

            logger.info("Service delivery optimization completed")
            return optimization

        except Exception as e:
            logger.error(f"Error optimizing service delivery: {e}")
            raise

    def generate_service_roadmap(
        self,
        service_id: str,
        phases: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate phased service delivery roadmap with milestones

        Args:
            service_id: Service identifier
            phases: Number of delivery phases (auto-calculated if None)

        Returns:
            Detailed service roadmap with phases and milestones
        """
        try:
            logger.info(f"Generating service roadmap for {service_id}")

            # Find service
            service = next(
                (s for s in self.service_catalog if s['service_id'] == service_id),
                None
            )

            if not service:
                raise ValueError(f"Service {service_id} not found")

            deliverables = service.get('deliverables', [])
            timeline_days = service.get('timeline', {}).get('total_days', 90)

            # Auto-calculate phases if not specified
            if phases is None:
                phases = min(4, max(2, len(deliverables) // 3))

            # Create phases
            phase_list = []
            deliverables_per_phase = len(deliverables) // phases

            for i in range(phases):
                phase_num = i + 1
                phase_deliverables = deliverables[
                    i * deliverables_per_phase:(i + 1) * deliverables_per_phase
                ]

                # Add remaining to last phase
                if i == phases - 1:
                    phase_deliverables = deliverables[i * deliverables_per_phase:]

                phase_duration = timeline_days // phases
                phase_start = i * phase_duration

                phase = {
                    "phase_number": phase_num,
                    "name": f"Phase {phase_num}",
                    "start_day": phase_start,
                    "duration_days": phase_duration,
                    "deliverables": [d.get('name', '') for d in phase_deliverables] if phase_deliverables else [],
                    "milestones": [
                        f"Phase {phase_num} Kickoff",
                        f"Phase {phase_num} Review",
                        f"Phase {phase_num} Completion"
                    ],
                    "key_activities": self._generate_phase_activities(phase_num, phases)
                }

                phase_list.append(phase)

            roadmap = {
                "service_id": service_id,
                "total_duration_days": timeline_days,
                "phase_count": phases,
                "phases": phase_list,
                "critical_milestones": [
                    {"name": "Project Kickoff", "day": 0},
                    {"name": "Mid-Project Review", "day": timeline_days // 2},
                    {"name": "Final Delivery", "day": timeline_days}
                ],
                "dependencies": self._map_phase_dependencies(phase_list),
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Roadmap generated with {phases} phases")
            return roadmap

        except Exception as e:
            logger.error(f"Error generating service roadmap: {e}")
            raise

    def estimate_deliverables(
        self,
        deliverable_descriptions: List[str],
        complexity_hints: Optional[Dict[str, str]] = None
    ) -> List[ServiceDeliverable]:
        """
        Estimate effort and timeline for deliverables

        Args:
            deliverable_descriptions: List of deliverable descriptions
            complexity_hints: Optional complexity indicators

        Returns:
            List of deliverable estimates with effort and timeline
        """
        try:
            logger.info(f"Estimating {len(deliverable_descriptions)} deliverables")

            complexity_hints = complexity_hints or {}
            deliverables = []

            for idx, description in enumerate(deliverable_descriptions):
                deliverable_id = f"deliv_{int(datetime.now().timestamp())}_{idx}"

                # Estimate based on keywords
                effort_hours = self._estimate_effort(description, complexity_hints.get(description))
                timeline_days = self._estimate_timeline(effort_hours)

                # Categorize deliverable
                category = self._categorize_deliverable(description)

                deliverable = ServiceDeliverable(
                    deliverable_id=deliverable_id,
                    name=description,
                    description=f"Deliverable: {description}",
                    category=category,
                    effort_hours=effort_hours,
                    dependencies=[],
                    quality_criteria=self._define_quality_criteria(category),
                    timeline_days=timeline_days,
                    resources_required=self._determine_deliverable_resources(category)
                )

                deliverables.append(deliverable)

            logger.info(f"Estimated {len(deliverables)} deliverables")
            return deliverables

        except Exception as e:
            logger.error(f"Error estimating deliverables: {e}")
            raise

    def allocate_resources(
        self,
        service_id: str,
        available_resources: List[Dict[str, Any]],
        start_date: datetime
    ) -> List[ResourceAllocation]:
        """
        Allocate resources with skill matching and capacity planning

        Args:
            service_id: Service requiring resources
            available_resources: Pool of available resources
            start_date: Project start date

        Returns:
            Optimized resource allocation plan
        """
        try:
            logger.info(f"Allocating resources for service {service_id}")

            # Find service
            service = next(
                (s for s in self.service_catalog if s['service_id'] == service_id),
                None
            )

            if not service:
                raise ValueError(f"Service {service_id} not found")

            required_resources = service.get('resources_required', [])
            timeline_days = service.get('timeline', {}).get('total_days', 90)

            allocations = []

            for req_resource in required_resources:
                # Match available resources
                matched = self._match_resource_skills(req_resource, available_resources)

                if matched:
                    allocation = ResourceAllocation(
                        resource_id=matched.get('resource_id', f"res_{len(allocations)}"),
                        resource_type=ResourceType.HUMAN,
                        resource_name=matched.get('name', 'Team Member'),
                        skill_level=matched.get('skill_level', 'intermediate'),
                        capacity_percentage=75.0,
                        allocated_hours=req_resource.get('hours', 40),
                        cost_per_hour=matched.get('rate', 100.0),
                        availability_start=start_date,
                        availability_end=start_date + timedelta(days=timeline_days)
                    )
                    allocations.append(allocation)

            logger.info(f"Allocated {len(allocations)} resources")
            return allocations

        except Exception as e:
            logger.error(f"Error allocating resources: {e}")
            raise

    def validate_service_design(
        self,
        service_id: str
    ) -> Dict[str, Any]:
        """
        Validate service design for feasibility and profitability

        Args:
            service_id: Service to validate

        Returns:
            Validation results with pass/fail and recommendations
        """
        try:
            logger.info(f"Validating service design {service_id}")

            # Find service
            service = next(
                (s for s in self.service_catalog if s['service_id'] == service_id),
                None
            )

            if not service:
                raise ValueError(f"Service {service_id} not found")

            validation_results = {
                "service_id": service_id,
                "validation_date": datetime.now().isoformat(),
                "checks": {},
                "overall_status": "pass",
                "issues": [],
                "recommendations": []
            }

            # Check 1: Deliverables defined
            deliverables = service.get('deliverables', [])
            if len(deliverables) >= 3:
                validation_results["checks"]["deliverables"] = "pass"
            else:
                validation_results["checks"]["deliverables"] = "fail"
                validation_results["issues"].append("Insufficient deliverables defined")
                validation_results["overall_status"] = "fail"

            # Check 2: Resources allocated
            resources = service.get('resources_required', [])
            if len(resources) >= 1:
                validation_results["checks"]["resources"] = "pass"
            else:
                validation_results["checks"]["resources"] = "warning"
                validation_results["recommendations"].append("Consider resource requirements")

            # Check 3: Timeline realistic
            timeline = service.get('timeline', {}).get('total_days', 0)
            if 14 <= timeline <= 365:
                validation_results["checks"]["timeline"] = "pass"
            else:
                validation_results["checks"]["timeline"] = "warning"
                validation_results["recommendations"].append("Review timeline feasibility")

            # Check 4: Complexity assessed
            complexity = service.get('complexity', {})
            if complexity:
                validation_results["checks"]["complexity"] = "pass"
            else:
                validation_results["checks"]["complexity"] = "warning"

            # Check 5: Success metrics defined
            metrics = service.get('success_metrics', [])
            if len(metrics) >= 3:
                validation_results["checks"]["success_metrics"] = "pass"
            else:
                validation_results["checks"]["success_metrics"] = "warning"
                validation_results["recommendations"].append("Define clear success metrics")

            logger.info(f"Validation completed: {validation_results['overall_status']}")
            return validation_results

        except Exception as e:
            logger.error(f"Error validating service design: {e}")
            raise

    # ==================== HELPER METHODS ====================

    def _initialize_tier_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize standard tier templates"""
        return {
            "basic": {
                "support_sla": "48h",
                "customization": False,
                "price_multiplier": 1.0
            },
            "professional": {
                "support_sla": "24h",
                "customization": True,
                "price_multiplier": 2.5
            },
            "enterprise": {
                "support_sla": "4h",
                "customization": True,
                "price_multiplier": 5.0
            }
        }

    def _generate_deliverables(
        self,
        objectives: List[str],
        requirements: Dict[str, Any]
    ) -> List[ServiceDeliverable]:
        """Generate deliverables based on objectives"""
        deliverables = []

        for idx, objective in enumerate(objectives):
            deliverable = ServiceDeliverable(
                deliverable_id=f"deliv_{idx}_{int(datetime.now().timestamp())}",
                name=f"Deliverable for: {objective}",
                description=f"Achieve objective: {objective}",
                category="strategic",
                effort_hours=40.0,
                timeline_days=14
            )
            deliverables.append(deliverable)

        return deliverables

    def _create_service_blueprint(
        self,
        service_name: str,
        deliverables: List[ServiceDeliverable]
    ) -> ServiceBlueprint:
        """Create service blueprint"""
        return ServiceBlueprint(
            customer_actions=[
                "Initial inquiry",
                "Requirements discussion",
                "Proposal review",
                "Contract signing",
                "Onboarding participation"
            ],
            frontstage_interactions=[
                "Sales consultation",
                "Kickoff meeting",
                "Progress reviews",
                "Deliverable presentations"
            ],
            backstage_processes=[
                "Resource allocation",
                "Quality assurance",
                "Documentation",
                "Internal reviews"
            ],
            support_processes=[
                "CRM tracking",
                "Project management",
                "Time tracking",
                "Invoicing"
            ],
            physical_evidence=[
                "Proposal documents",
                "Deliverable files",
                "Reports and dashboards",
                "Meeting notes"
            ],
            touchpoints={
                "digital": ["Email", "Project portal", "Video calls"],
                "in_person": ["Kickoff meeting", "Final presentation"],
                "automated": ["Status updates", "Reminders"]
            }
        )

    def _estimate_service_timeline(
        self,
        deliverables: List[ServiceDeliverable]
    ) -> Dict[str, Any]:
        """Estimate service timeline"""
        total_days = sum(d.timeline_days for d in deliverables)

        return {
            "total_days": max(total_days, 14),  # Minimum 2 weeks
            "phases": len(deliverables) // 3 + 1,
            "buffer_percentage": 20,
            "estimated_start": datetime.now().isoformat(),
            "estimated_end": (datetime.now() + timedelta(days=total_days)).isoformat()
        }

    def _determine_resources(
        self,
        deliverables: List[ServiceDeliverable],
        requirements: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Determine required resources"""
        resources = [
            {"role": "Project Manager", "hours": 40, "skill_level": "senior"},
            {"role": "Specialist", "hours": 80, "skill_level": "expert"},
            {"role": "Analyst", "hours": 60, "skill_level": "intermediate"}
        ]
        return resources

    def _define_success_metrics(self, objectives: List[str]) -> List[Dict[str, Any]]:
        """Define success metrics for objectives"""
        return [
            {"metric": "Objective completion rate", "target": "100%", "measurement": "percentage"},
            {"metric": "Client satisfaction score", "target": "4.5/5", "measurement": "rating"},
            {"metric": "On-time delivery", "target": "95%", "measurement": "percentage"},
            {"metric": "Budget variance", "target": "<10%", "measurement": "percentage"}
        ]

    def _create_feature_matrix(
        self,
        tiers: List[ServiceTierDefinition]
    ) -> Dict[str, Dict[str, bool]]:
        """Create feature comparison matrix"""
        all_features = set()
        for tier in tiers:
            all_features.update(tier.features)

        matrix = {}
        for feature in all_features:
            matrix[feature] = {
                tier.tier_level.value: feature in tier.features
                for tier in tiers
            }

        return matrix

    def _calculate_value_progression(
        self,
        tiers: List[ServiceTierDefinition]
    ) -> Dict[str, Any]:
        """Calculate value progression across tiers"""
        return {
            "feature_growth": [len(tier.features) for tier in tiers],
            "price_growth": [tier.pricing_range[1] for tier in tiers],
            "value_ratio": "progressive"
        }

    def _analyze_journey_stages(
        self,
        touchpoints: List[JourneyTouchpoint]
    ) -> Dict[str, Any]:
        """Analyze journey stages"""
        analysis = {}

        for stage in JourneyStage:
            stage_touchpoints = [tp for tp in touchpoints if tp.stage == stage]
            analysis[stage.value] = {
                "touchpoint_count": len(stage_touchpoints),
                "total_pain_points": sum(len(tp.pain_points) for tp in stage_touchpoints),
                "total_opportunities": sum(len(tp.opportunities) for tp in stage_touchpoints),
                "primary_emotion": stage_touchpoints[0].emotion if stage_touchpoints else "neutral"
            }

        return analysis

    def _calculate_journey_health(self, touchpoints: List[JourneyTouchpoint]) -> float:
        """Calculate overall journey health score"""
        total_pain_points = sum(len(tp.pain_points) for tp in touchpoints)
        total_opportunities = sum(len(tp.opportunities) for tp in touchpoints)

        # Health score: fewer pain points and more opportunities = better
        if total_pain_points == 0:
            return 100.0

        health_score = max(0, 100 - (total_pain_points * 5) + (total_opportunities * 3))
        return min(100.0, health_score)

    def _identify_service_synergies(
        self,
        services: List[Dict[str, Any]]
    ) -> List[str]:
        """Identify synergies between services"""
        return [
            "Shared client discovery process",
            "Combined reporting and analytics",
            "Cross-functional team utilization",
            "Unified project management"
        ]

    def _identify_cross_sell(self, services: List[Dict[str, Any]]) -> List[str]:
        """Identify cross-sell opportunities"""
        return [
            "Add analytics package to base service",
            "Include ongoing support subscription",
            "Offer training and enablement"
        ]

    def _identify_upsell_path(self, services: List[Dict[str, Any]]) -> List[str]:
        """Identify upsell path"""
        return [
            "Basic → Professional tier upgrade",
            "Add premium features",
            "Extend scope or timeline"
        ]

    def _identify_bottlenecks(
        self,
        service: Dict[str, Any],
        constraints: Dict[str, Any]
    ) -> List[str]:
        """Identify delivery bottlenecks"""
        return [
            "Resource availability constraints",
            "Dependencies on external parties",
            "Sequential deliverables (no parallelization)"
        ]

    def _optimize_resource_allocation(
        self,
        current_resources: List[Any],
        constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Optimize resource allocation"""
        return [
            {"resource": "Senior Consultant", "allocation": "60%", "optimized_from": "80%"},
            {"resource": "Analyst", "allocation": "100%", "optimized_from": "75%"}
        ]

    def _calculate_efficiency_gains(
        self,
        current: List[Any],
        optimized: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate efficiency gains"""
        return {
            "time_saved_days": 12,
            "cost_saved_percentage": 15,
            "resource_utilization_improvement": 22
        }

    def _generate_phase_activities(self, phase_num: int, total_phases: int) -> List[str]:
        """Generate activities for a phase"""
        if phase_num == 1:
            return ["Discovery", "Planning", "Resource onboarding"]
        elif phase_num == total_phases:
            return ["Final delivery", "Quality review", "Client handoff"]
        else:
            return ["Execution", "Progress review", "Adjustments"]

    def _map_phase_dependencies(self, phases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map dependencies between phases"""
        dependencies = []
        for i in range(len(phases) - 1):
            dependencies.append({
                "from_phase": phases[i]["phase_number"],
                "to_phase": phases[i + 1]["phase_number"],
                "type": "finish-to-start"
            })
        return dependencies

    def _estimate_effort(self, description: str, complexity_hint: Optional[str]) -> float:
        """Estimate effort hours for a deliverable"""
        base_hours = 40.0

        if complexity_hint == "high":
            return base_hours * 2
        elif complexity_hint == "low":
            return base_hours * 0.5

        # Keyword-based estimation
        if any(word in description.lower() for word in ["complex", "comprehensive", "strategic"]):
            return base_hours * 1.5
        elif any(word in description.lower() for word in ["simple", "basic", "standard"]):
            return base_hours * 0.75

        return base_hours

    def _estimate_timeline(self, effort_hours: float) -> int:
        """Estimate timeline days from effort hours"""
        # Assume 6 productive hours per day
        return max(1, int(math.ceil(effort_hours / 6)))

    def _categorize_deliverable(self, description: str) -> str:
        """Categorize deliverable type"""
        description_lower = description.lower()

        if any(word in description_lower for word in ["strategy", "plan", "roadmap"]):
            return "strategic"
        elif any(word in description_lower for word in ["design", "creative", "visual"]):
            return "creative"
        elif any(word in description_lower for word in ["analysis", "research", "data"]):
            return "analytical"
        elif any(word in description_lower for word in ["development", "build", "implementation"]):
            return "technical"
        else:
            return "general"

    def _define_quality_criteria(self, category: str) -> List[str]:
        """Define quality criteria by category"""
        criteria_map = {
            "strategic": ["Alignment with objectives", "Actionable recommendations", "Stakeholder approval"],
            "creative": ["Brand consistency", "Visual appeal", "Client feedback"],
            "analytical": ["Data accuracy", "Insight quality", "Actionable findings"],
            "technical": ["Code quality", "Performance benchmarks", "Test coverage"],
            "general": ["Completeness", "Timely delivery", "Client satisfaction"]
        }
        return criteria_map.get(category, criteria_map["general"])

    def _determine_deliverable_resources(self, category: str) -> List[str]:
        """Determine required resources by category"""
        resource_map = {
            "strategic": ["Strategy Consultant", "Business Analyst"],
            "creative": ["Designer", "Creative Director"],
            "analytical": ["Data Analyst", "Researcher"],
            "technical": ["Developer", "Technical Lead"],
            "general": ["Project Manager", "Specialist"]
        }
        return resource_map.get(category, resource_map["general"])

    def _match_resource_skills(
        self,
        required: Dict[str, Any],
        available: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Match resource based on skills"""
        required_role = required.get('role', '')

        for resource in available:
            if resource.get('role') == required_role:
                return resource

        # Return first available if no exact match
        return available[0] if available else None

    def get_service_catalog(self) -> List[Dict[str, Any]]:
        """
        Get complete service catalog

        Returns:
            List of all designed services
        """
        return self.service_catalog
