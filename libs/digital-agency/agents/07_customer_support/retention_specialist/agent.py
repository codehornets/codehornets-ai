"""
Retention Specialist Agent

Manages customer retention through churn prediction, intervention campaigns, and win-back strategies.
Production-ready implementation with machine learning-ready features and predictive analytics.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import yaml
from pathlib import Path
import logging
from collections import defaultdict, Counter
import math
import statistics

logger = logging.getLogger(__name__)


class ChurnRiskLevel(Enum):
    """Churn risk levels."""
    CRITICAL = "critical"      # 80-100%
    HIGH = "high"              # 60-80%
    MEDIUM = "medium"          # 40-60%
    LOW = "low"                # 20-40%
    MINIMAL = "minimal"        # 0-20%


class CustomerStatus(Enum):
    """Customer status types."""
    ACTIVE = "active"
    AT_RISK = "at_risk"
    CHURNED = "churned"
    RECOVERED = "recovered"


class InterventionType(Enum):
    """Intervention types."""
    PROACTIVE_OUTREACH = "proactive_outreach"
    DISCOUNT_OFFER = "discount_offer"
    FEATURE_UPGRADE = "feature_upgrade"
    DEDICATED_SUPPORT = "dedicated_support"
    TRAINING_SESSION = "training_session"
    SUCCESS_REVIEW = "success_review"
    WIN_BACK_CAMPAIGN = "win_back_campaign"


class CampaignStatus(Enum):
    """Campaign status."""
    PLANNED = "planned"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class CustomerProfile:
    """Customer retention profile."""
    customer_id: str
    status: CustomerStatus
    churn_risk_score: float
    churn_risk_level: ChurnRiskLevel
    lifetime_value: float
    tenure_days: int
    engagement_score: float
    satisfaction_score: float
    support_ticket_count: int
    last_interaction_days: int
    payment_issues: int
    feature_usage_score: float
    risk_factors: List[str] = field(default_factory=list)
    recommended_interventions: List[InterventionType] = field(default_factory=list)
    last_assessed: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Intervention:
    """Retention intervention record."""
    intervention_id: str
    customer_id: str
    intervention_type: InterventionType
    created_at: datetime
    executed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "pending"
    success: Optional[bool] = None
    cost: float = 0.0
    notes: str = ""
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetentionCampaign:
    """Retention campaign."""
    campaign_id: str
    name: str
    campaign_type: InterventionType
    target_segment: str
    status: CampaignStatus
    start_date: datetime
    end_date: Optional[datetime]
    target_customers: List[str]
    contacted_count: int = 0
    responded_count: int = 0
    converted_count: int = 0
    total_cost: float = 0.0
    roi: float = 0.0
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ChurnPrediction:
    """Churn prediction result."""
    customer_id: str
    prediction_date: datetime
    churn_probability: float
    risk_level: ChurnRiskLevel
    predicted_churn_date: Optional[datetime]
    confidence: float
    contributing_factors: Dict[str, float]


class RetentionSpecialistAgent:
    """
    Advanced Retention Specialist for customer churn prevention and win-back.

    Capabilities:
    - ML-ready churn prediction
    - Multi-factor risk scoring
    - Automated intervention triggering
    - Campaign management
    - Win-back strategy execution
    - ROI tracking
    - A/B testing support
    - Predictive lifetime value
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Retention Specialist Agent."""
        self.config = self._load_config(config_path)
        self.name = "Retention Specialist Agent"
        self.role = "retention_specialist"

        # Data storage
        self.customer_profiles: Dict[str, CustomerProfile] = {}
        self.interventions: List[Intervention] = []
        self.campaigns: Dict[str, RetentionCampaign] = {}
        self.churn_predictions: List[ChurnPrediction] = []

        # Analytics
        self.intervention_counter = 0
        self.campaign_counter = 0
        self.churn_prevented_count = 0
        self.total_retention_value = 0.0

        # Feature weights for churn prediction
        self.churn_weights = self._initialize_churn_weights()

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
            'agent_name': 'Retention Specialist Agent',
            'model': 'gpt-4',
            'temperature': 0.4,
            'max_tokens': 1500,
            'churn_risk_threshold': 0.6,
            'high_value_customer_threshold': 10000,
            'auto_intervention_enabled': True,
            'min_engagement_score': 30.0,
            'max_inactive_days': 30,
            'capabilities': [
                'churn_prediction',
                'risk_assessment',
                'intervention_management',
                'campaign_orchestration',
                'win_back_strategies',
                'ltv_prediction',
                'roi_tracking'
            ],
            'intervention_costs': {
                'proactive_outreach': 10,
                'discount_offer': 50,
                'feature_upgrade': 100,
                'dedicated_support': 200,
                'training_session': 150,
                'success_review': 75,
                'win_back_campaign': 100
            }
        }

    def _initialize_churn_weights(self) -> Dict[str, float]:
        """Initialize feature weights for churn prediction model."""
        return {
            'engagement_score': 0.25,
            'satisfaction_score': 0.20,
            'last_interaction_days': 0.15,
            'support_ticket_frequency': 0.10,
            'payment_issues': 0.15,
            'feature_usage': 0.10,
            'tenure': 0.05
        }

    async def predict_churn_risk(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict customer churn risk using multi-factor analysis.

        Args:
            customer_data: Customer information and metrics

        Returns:
            Churn prediction with risk score and factors
        """
        try:
            logger.info(f"Predicting churn risk for customer {customer_data.get('customer_id')}")

            customer_id = customer_data.get('customer_id')
            if not customer_id:
                raise ValueError("customer_id is required")

            # Calculate individual risk factors
            risk_factors = self._calculate_risk_factors(customer_data)

            # Calculate weighted churn probability
            churn_probability = self._calculate_churn_probability(risk_factors)

            # Determine risk level
            risk_level = self._determine_risk_level(churn_probability)

            # Identify key contributing factors
            contributing_factors = self._identify_key_factors(risk_factors)

            # Predict churn date if high risk
            predicted_churn_date = None
            if churn_probability > 0.6:
                predicted_churn_date = self._predict_churn_date(customer_data, churn_probability)

            # Calculate confidence based on data completeness
            confidence = self._calculate_prediction_confidence(customer_data)

            # Recommend interventions
            recommended_interventions = self._recommend_interventions(
                churn_probability,
                risk_factors,
                customer_data
            )

            # Create prediction record
            prediction = ChurnPrediction(
                customer_id=customer_id,
                prediction_date=datetime.utcnow(),
                churn_probability=churn_probability,
                risk_level=risk_level,
                predicted_churn_date=predicted_churn_date,
                confidence=confidence,
                contributing_factors=contributing_factors
            )

            self.churn_predictions.append(prediction)

            # Update customer profile
            await self._update_customer_profile(customer_id, customer_data, prediction)

            logger.info(f"Churn risk predicted: {churn_probability:.2%} ({risk_level.value})")

            return {
                'success': True,
                'customer_id': customer_id,
                'churn_probability': round(churn_probability, 4),
                'risk_level': risk_level.value,
                'confidence': round(confidence, 3),
                'contributing_factors': {k: round(v, 3) for k, v in contributing_factors.items()},
                'predicted_churn_date': predicted_churn_date.isoformat() if predicted_churn_date else None,
                'recommended_interventions': [i.value for i in recommended_interventions],
                'prediction_timestamp': datetime.utcnow().isoformat()
            }

        except ValueError as e:
            logger.error(f"Validation error in predict_churn_risk: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in predict_churn_risk: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _calculate_risk_factors(self, customer_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate individual risk factor scores (0-1 scale)."""
        risk_factors = {}

        # Engagement score (inverse - low engagement = high risk)
        engagement = customer_data.get('engagement_score', 50.0)
        risk_factors['engagement_score'] = max(0, 1 - (engagement / 100))

        # Satisfaction score (inverse)
        satisfaction = customer_data.get('satisfaction_score', 3.0)
        risk_factors['satisfaction_score'] = max(0, 1 - (satisfaction / 5))

        # Last interaction (days since last contact)
        last_interaction_days = customer_data.get('last_interaction_days', 0)
        max_days = self.config.get('max_inactive_days', 30)
        risk_factors['last_interaction_days'] = min(1.0, last_interaction_days / max_days)

        # Support ticket frequency (too many = frustrated)
        ticket_count = customer_data.get('support_ticket_count', 0)
        tenure_days = customer_data.get('tenure_days', 365)
        tickets_per_month = (ticket_count / max(tenure_days, 1)) * 30
        risk_factors['support_ticket_frequency'] = min(1.0, tickets_per_month / 5)

        # Payment issues
        payment_issues = customer_data.get('payment_issues', 0)
        risk_factors['payment_issues'] = min(1.0, payment_issues / 3)

        # Feature usage (inverse)
        feature_usage = customer_data.get('feature_usage_score', 50.0)
        risk_factors['feature_usage'] = max(0, 1 - (feature_usage / 100))

        # Tenure (newer customers higher risk)
        tenure_days = customer_data.get('tenure_days', 0)
        risk_factors['tenure'] = max(0, 1 - min(1.0, tenure_days / 365))

        return risk_factors

    def _calculate_churn_probability(self, risk_factors: Dict[str, float]) -> float:
        """Calculate weighted churn probability."""
        probability = 0.0

        for factor, risk_score in risk_factors.items():
            weight = self.churn_weights.get(factor, 0.1)
            probability += risk_score * weight

        # Apply sigmoid function for smooth probability curve
        probability = 1 / (1 + math.exp(-5 * (probability - 0.5)))

        return min(1.0, max(0.0, probability))

    def _determine_risk_level(self, churn_probability: float) -> ChurnRiskLevel:
        """Determine risk level from probability."""
        if churn_probability >= 0.8:
            return ChurnRiskLevel.CRITICAL
        elif churn_probability >= 0.6:
            return ChurnRiskLevel.HIGH
        elif churn_probability >= 0.4:
            return ChurnRiskLevel.MEDIUM
        elif churn_probability >= 0.2:
            return ChurnRiskLevel.LOW
        else:
            return ChurnRiskLevel.MINIMAL

    def _identify_key_factors(self, risk_factors: Dict[str, float]) -> Dict[str, float]:
        """Identify top contributing risk factors."""
        weighted_factors = {}

        for factor, risk_score in risk_factors.items():
            weight = self.churn_weights.get(factor, 0.1)
            weighted_factors[factor] = risk_score * weight

        # Sort by contribution
        sorted_factors = dict(sorted(weighted_factors.items(), key=lambda x: x[1], reverse=True))

        # Return top 5 factors
        return dict(list(sorted_factors.items())[:5])

    def _predict_churn_date(self, customer_data: Dict[str, Any],
                           churn_probability: float) -> datetime:
        """Predict approximate churn date based on risk velocity."""
        # Simple heuristic: higher risk = sooner churn
        if churn_probability >= 0.9:
            days_until_churn = 7
        elif churn_probability >= 0.8:
            days_until_churn = 14
        elif churn_probability >= 0.7:
            days_until_churn = 30
        else:
            days_until_churn = 60

        # Adjust based on engagement decline rate
        engagement = customer_data.get('engagement_score', 50.0)
        if engagement < 20:
            days_until_churn = int(days_until_churn * 0.5)

        return datetime.utcnow() + timedelta(days=days_until_churn)

    def _calculate_prediction_confidence(self, customer_data: Dict[str, Any]) -> float:
        """Calculate confidence in prediction based on data quality."""
        required_fields = [
            'engagement_score', 'satisfaction_score', 'last_interaction_days',
            'support_ticket_count', 'payment_issues', 'feature_usage_score', 'tenure_days'
        ]

        available_count = sum(1 for field in required_fields if field in customer_data)
        confidence = available_count / len(required_fields)

        return confidence

    def _recommend_interventions(self, churn_probability: float,
                                 risk_factors: Dict[str, float],
                                 customer_data: Dict[str, Any]) -> List[InterventionType]:
        """Recommend appropriate interventions based on risk profile."""
        interventions = []

        # Critical risk - multiple interventions
        if churn_probability >= 0.8:
            interventions.extend([
                InterventionType.DEDICATED_SUPPORT,
                InterventionType.SUCCESS_REVIEW,
                InterventionType.DISCOUNT_OFFER
            ])

        # High risk
        elif churn_probability >= 0.6:
            interventions.extend([
                InterventionType.PROACTIVE_OUTREACH,
                InterventionType.SUCCESS_REVIEW
            ])

            # Add specific interventions based on risk factors
            if risk_factors.get('feature_usage', 0) > 0.5:
                interventions.append(InterventionType.TRAINING_SESSION)

            if customer_data.get('lifetime_value', 0) > self.config.get('high_value_customer_threshold', 10000):
                interventions.append(InterventionType.FEATURE_UPGRADE)

        # Medium risk
        elif churn_probability >= 0.4:
            interventions.append(InterventionType.PROACTIVE_OUTREACH)

            if risk_factors.get('satisfaction_score', 0) > 0.6:
                interventions.append(InterventionType.SUCCESS_REVIEW)

        # Low risk - monitoring only
        else:
            # No immediate intervention, continue monitoring
            pass

        return interventions

    async def _update_customer_profile(self, customer_id: str,
                                      customer_data: Dict[str, Any],
                                      prediction: ChurnPrediction):
        """Update or create customer retention profile."""
        # Determine customer status
        if customer_data.get('churned', False):
            status = CustomerStatus.CHURNED
        elif prediction.churn_probability >= 0.6:
            status = CustomerStatus.AT_RISK
        else:
            status = CustomerStatus.ACTIVE

        # Create or update profile
        profile = CustomerProfile(
            customer_id=customer_id,
            status=status,
            churn_risk_score=prediction.churn_probability,
            churn_risk_level=prediction.risk_level,
            lifetime_value=customer_data.get('lifetime_value', 0.0),
            tenure_days=customer_data.get('tenure_days', 0),
            engagement_score=customer_data.get('engagement_score', 0.0),
            satisfaction_score=customer_data.get('satisfaction_score', 0.0),
            support_ticket_count=customer_data.get('support_ticket_count', 0),
            last_interaction_days=customer_data.get('last_interaction_days', 0),
            payment_issues=customer_data.get('payment_issues', 0),
            feature_usage_score=customer_data.get('feature_usage_score', 0.0),
            risk_factors=[k for k, v in prediction.contributing_factors.items() if v > 0.5],
            recommended_interventions=self._recommend_interventions(
                prediction.churn_probability,
                dict(prediction.contributing_factors),
                customer_data
            )
        )

        self.customer_profiles[customer_id] = profile

    async def create_intervention(self, customer_id: str,
                                 intervention_type: InterventionType,
                                 auto_execute: bool = False) -> Dict[str, Any]:
        """
        Create retention intervention for customer.

        Args:
            customer_id: Customer identifier
            intervention_type: Type of intervention
            auto_execute: Whether to execute immediately

        Returns:
            Intervention details
        """
        try:
            logger.info(f"Creating intervention for customer {customer_id}")

            # Generate intervention ID
            self.intervention_counter += 1
            intervention_id = f"INTV-{datetime.utcnow().strftime('%Y%m%d')}-{self.intervention_counter:05d}"

            # Get intervention cost
            cost = self.config.get('intervention_costs', {}).get(
                intervention_type.value, 50
            )

            # Create intervention
            intervention = Intervention(
                intervention_id=intervention_id,
                customer_id=customer_id,
                intervention_type=intervention_type,
                created_at=datetime.utcnow(),
                cost=cost
            )

            if auto_execute:
                intervention.executed_at = datetime.utcnow()
                intervention.status = "executed"

            self.interventions.append(intervention)

            logger.info(f"Intervention {intervention_id} created")

            return {
                'success': True,
                'intervention_id': intervention_id,
                'customer_id': customer_id,
                'intervention_type': intervention_type.value,
                'cost': cost,
                'status': intervention.status,
                'created_at': intervention.created_at.isoformat()
            }

        except Exception as e:
            logger.error(f"Error creating intervention: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create retention campaign targeting specific segment.

        Args:
            campaign_data: Campaign configuration

        Returns:
            Campaign details
        """
        try:
            logger.info("Creating retention campaign")

            # Validate required fields
            required_fields = ['name', 'campaign_type', 'target_segment']
            for field in required_fields:
                if field not in campaign_data:
                    raise ValueError(f"Missing required field: {field}")

            # Generate campaign ID
            self.campaign_counter += 1
            campaign_id = f"CAMP-{datetime.utcnow().strftime('%Y%m%d')}-{self.campaign_counter:04d}"

            # Parse campaign type
            try:
                campaign_type = InterventionType(campaign_data['campaign_type'])
            except ValueError:
                raise ValueError(f"Invalid campaign type: {campaign_data['campaign_type']}")

            # Identify target customers
            target_customers = await self._identify_target_customers(
                campaign_data['target_segment'],
                campaign_data.get('criteria', {})
            )

            # Create campaign
            campaign = RetentionCampaign(
                campaign_id=campaign_id,
                name=campaign_data['name'],
                campaign_type=campaign_type,
                target_segment=campaign_data['target_segment'],
                status=CampaignStatus.PLANNED,
                start_date=campaign_data.get('start_date', datetime.utcnow()),
                end_date=campaign_data.get('end_date'),
                target_customers=target_customers
            )

            self.campaigns[campaign_id] = campaign

            logger.info(f"Campaign {campaign_id} created with {len(target_customers)} targets")

            return {
                'success': True,
                'campaign_id': campaign_id,
                'name': campaign.name,
                'campaign_type': campaign_type.value,
                'target_customer_count': len(target_customers),
                'status': campaign.status.value,
                'start_date': campaign.start_date.isoformat()
            }

        except ValueError as e:
            logger.error(f"Validation error in create_campaign: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_campaign: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def _identify_target_customers(self, segment: str,
                                        criteria: Dict[str, Any]) -> List[str]:
        """Identify customers matching target segment criteria."""
        target_customers = []

        for customer_id, profile in self.customer_profiles.items():
            match = False

            # Segment-based targeting
            if segment == "at_risk":
                match = profile.churn_risk_level in [ChurnRiskLevel.HIGH, ChurnRiskLevel.CRITICAL]
            elif segment == "high_value_at_risk":
                match = (profile.churn_risk_level in [ChurnRiskLevel.HIGH, ChurnRiskLevel.CRITICAL] and
                        profile.lifetime_value >= self.config.get('high_value_customer_threshold', 10000))
            elif segment == "churned":
                match = profile.status == CustomerStatus.CHURNED
            elif segment == "low_engagement":
                match = profile.engagement_score < self.config.get('min_engagement_score', 30.0)

            # Apply additional criteria
            if match and criteria:
                if 'min_lifetime_value' in criteria:
                    match = match and profile.lifetime_value >= criteria['min_lifetime_value']
                if 'min_tenure_days' in criteria:
                    match = match and profile.tenure_days >= criteria['min_tenure_days']

            if match:
                target_customers.append(customer_id)

        return target_customers

    async def execute_win_back_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """
        Execute win-back campaign for churned customers.

        Args:
            campaign_id: Campaign identifier

        Returns:
            Execution results
        """
        try:
            if campaign_id not in self.campaigns:
                raise ValueError(f"Campaign {campaign_id} not found")

            campaign = self.campaigns[campaign_id]

            # Update campaign status
            campaign.status = CampaignStatus.ACTIVE

            # Create interventions for target customers
            interventions_created = 0
            for customer_id in campaign.target_customers:
                result = await self.create_intervention(
                    customer_id,
                    campaign.campaign_type,
                    auto_execute=True
                )

                if result.get('success'):
                    interventions_created += 1
                    campaign.contacted_count += 1

            # Calculate campaign cost
            intervention_cost = self.config.get('intervention_costs', {}).get(
                campaign.campaign_type.value, 50
            )
            campaign.total_cost = interventions_created * intervention_cost

            logger.info(f"Win-back campaign {campaign_id} executed: {interventions_created} interventions")

            return {
                'success': True,
                'campaign_id': campaign_id,
                'interventions_created': interventions_created,
                'total_cost': campaign.total_cost,
                'status': campaign.status.value
            }

        except ValueError as e:
            return {'success': False, 'error': str(e), 'error_type': 'validation_error'}
        except Exception as e:
            logger.error(f"Error executing campaign: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}

    async def calculate_ltv_prediction(self, customer_id: str,
                                      customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict customer lifetime value.

        Args:
            customer_id: Customer identifier
            customer_data: Customer metrics

        Returns:
            LTV prediction
        """
        try:
            # Current LTV
            current_ltv = customer_data.get('lifetime_value', 0.0)

            # Monthly revenue
            monthly_revenue = customer_data.get('monthly_revenue', 0.0)

            # Churn probability
            churn_prob = customer_data.get('churn_probability', 0.5)

            # Predicted remaining lifetime (months)
            if churn_prob > 0:
                avg_remaining_months = (1 / churn_prob) * 12
            else:
                avg_remaining_months = 60  # Default 5 years

            # Predicted LTV
            predicted_ltv = current_ltv + (monthly_revenue * avg_remaining_months)

            # Confidence based on data quality
            confidence = 0.7 if monthly_revenue > 0 else 0.4

            return {
                'success': True,
                'customer_id': customer_id,
                'current_ltv': round(current_ltv, 2),
                'predicted_ltv': round(predicted_ltv, 2),
                'predicted_remaining_value': round(predicted_ltv - current_ltv, 2),
                'predicted_remaining_months': round(avg_remaining_months, 1),
                'confidence': confidence,
                'prediction_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calculating LTV: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}

    async def get_analytics(self) -> Dict[str, Any]:
        """Get comprehensive retention analytics."""
        try:
            total_customers = len(self.customer_profiles)

            if total_customers == 0:
                return {
                    'success': True,
                    'message': 'No customer profiles to analyze',
                    'total_customers': 0
                }

            # Risk distribution
            risk_dist = Counter(p.churn_risk_level.value for p in self.customer_profiles.values())

            # Status distribution
            status_dist = Counter(p.status.value for p in self.customer_profiles.values())

            # Average churn risk
            avg_churn_risk = statistics.mean(p.churn_risk_score for p in self.customer_profiles.values())

            # Intervention metrics
            total_interventions = len(self.interventions)
            successful_interventions = sum(1 for i in self.interventions if i.success == True)
            intervention_success_rate = (successful_interventions / total_interventions * 100) if total_interventions > 0 else 0

            # Campaign metrics
            total_campaigns = len(self.campaigns)
            active_campaigns = sum(1 for c in self.campaigns.values() if c.status == CampaignStatus.ACTIVE)

            # Calculate total retention value
            retention_value = sum(
                p.lifetime_value for p in self.customer_profiles.values()
                if p.status == CustomerStatus.ACTIVE
            )

            return {
                'success': True,
                'total_customers': total_customers,
                'risk_level_distribution': dict(risk_dist),
                'status_distribution': dict(status_dist),
                'average_churn_risk': round(avg_churn_risk, 3),
                'at_risk_customers': sum(1 for p in self.customer_profiles.values()
                                        if p.churn_risk_level in [ChurnRiskLevel.HIGH, ChurnRiskLevel.CRITICAL]),
                'intervention_metrics': {
                    'total_interventions': total_interventions,
                    'successful_interventions': successful_interventions,
                    'success_rate_percent': round(intervention_success_rate, 2)
                },
                'campaign_metrics': {
                    'total_campaigns': total_campaigns,
                    'active_campaigns': active_campaigns
                },
                'retention_value': round(retention_value, 2),
                'churn_prevented_count': self.churn_prevented_count
            }

        except Exception as e:
            logger.error(f"Error generating analytics: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}
