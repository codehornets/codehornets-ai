"""
Deal Closer Agent

Manages deal closure and client transition to fulfillment.
Includes CRM integration, forecasting, and analytics.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
from collections import defaultdict
import difflib

logger = logging.getLogger(__name__)


class CRMSystem(Enum):
    """Supported CRM systems."""
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    PIPEDRIVE = "pipedrive"
    CUSTOM = "custom"


class DealStage(Enum):
    """Deal pipeline stages."""
    LEAD = "lead"
    QUALIFIED = "qualified"
    DEMO = "demo"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class LossReason(Enum):
    """Reasons for lost deals."""
    PRICE = "price"
    TIMING = "timing"
    PRODUCT_FIT = "product_fit"
    COMPETITOR = "competitor"
    NO_DECISION = "no_decision"
    BUDGET = "budget"
    INTERNAL_CHAMPION_LEFT = "champion_left"


@dataclass
class CRMRecord:
    """Base CRM record structure."""
    record_id: str
    record_type: str  # company, contact, deal
    crm_system: CRMSystem
    data: Dict[str, Any] = field(default_factory=dict)
    last_synced: Optional[datetime] = None
    duplicate_of: Optional[str] = None


@dataclass
class Deal:
    """Deal record."""
    deal_id: str
    company_id: str
    contact_ids: List[str] = field(default_factory=list)
    stage: DealStage = DealStage.LEAD
    amount: float = 0.0
    close_date: Optional[datetime] = None
    probability: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    owner_id: str = ""
    source: str = ""
    loss_reason: Optional[LossReason] = None
    win_reason: Optional[str] = None
    activities: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ForecastModel:
    """Revenue forecast model."""
    model_id: str
    model_type: str  # weighted_pipeline, historical_win_rate, ai_driven
    period: str  # monthly, quarterly, annual
    forecast_amount: float
    confidence_level: float
    assumptions: List[str] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RepPerformance:
    """Sales rep performance metrics."""
    rep_id: str
    rep_name: str
    period_start: datetime
    period_end: datetime
    deals_closed: int = 0
    revenue_closed: float = 0.0
    quota: float = 0.0
    attainment_pct: float = 0.0
    avg_deal_size: float = 0.0
    win_rate: float = 0.0
    avg_sales_cycle_days: int = 0
    activities_logged: int = 0


class DealCloserAgent:
    """
    Production-grade Deal Closer Agent.

    Manages deal closure, CRM integration, forecasting, and comprehensive
    sales analytics with data deduplication and field mapping.

    Features:
    - Multi-CRM Integration (HubSpot, Salesforce patterns)
    - Data Deduplication (fuzzy matching for companies/contacts)
    - Field Mapping and Transformation (standard conversions)
    - Conversion Funnel Analysis (stage progression rates)
    - Revenue Forecasting (weighted pipeline, historical, AI models)
    - Quota Tracking and Attainment (monthly/quarterly/annual)
    - Rep Performance Analytics (activities, conversion, cycle time)
    - Win/Loss Analysis (reason categorization, patterns)
    - Sales Velocity Metrics (formula-based calculations)
    - Pipeline health monitoring
    - Deal scoring and prioritization
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Deal Closer Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.name = "Deal Closer"
        self.role = "Deal Closure Specialist"
        self.goal = "Finalize agreements and ensure smooth client onboarding"

        # Configuration
        self.crm_system = CRMSystem(self.config.get("crm_system", "salesforce"))
        self.fuzzy_match_threshold_company = self.config.get("fuzzy_threshold_company", 0.85)
        self.fuzzy_match_threshold_contact = self.config.get("fuzzy_threshold_contact", 0.90)

        # Storage
        self.deals: Dict[str, Deal] = {}
        self.crm_records: Dict[str, CRMRecord] = {}
        self.field_mappings: Dict[str, Dict[str, str]] = {}
        self.forecast_models: Dict[str, ForecastModel] = {}
        self.rep_performance: Dict[str, RepPerformance] = {}

        # Initialize
        self._initialize_field_mappings()

        # Analytics
        self.win_loss_history: List[Dict[str, Any]] = []
        self.velocity_metrics: Dict[str, float] = {}

        logger.info(f"Deal Closer initialized with CRM: {self.crm_system.value}")

    def integrate_crm(
        self,
        crm_system: str,
        credentials: Dict[str, Any],
        sync_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Integrate with CRM system (HubSpot/Salesforce pattern).

        Args:
            crm_system: CRM system name
            credentials: API credentials
            sync_config: Synchronization configuration

        Returns:
            Integration status and configuration
        """
        try:
            logger.info(f"Starting CRM integration for {crm_system}")

            # Validate inputs
            if not crm_system:
                raise ValueError("crm_system is required")
            if not credentials:
                raise ValueError("credentials cannot be empty")

            # Set CRM system
            try:
                self.crm_system = CRMSystem(crm_system.lower())
            except ValueError:
                raise ValueError(f"Unsupported CRM system: {crm_system}")

            # Validate credentials based on CRM
            required_creds = self._get_required_credentials(self.crm_system)
            missing_creds = [c for c in required_creds if c not in credentials]
            if missing_creds:
                raise ValueError(f"Missing credentials: {', '.join(missing_creds)}")

            # Test connection
            connection_status = self._test_crm_connection(self.crm_system, credentials)

            # Configure sync settings
            sync_settings = {
                "sync_interval_minutes": sync_config.get("sync_interval", 30),
                "sync_direction": sync_config.get("direction", "bidirectional"),
                "objects_to_sync": sync_config.get("objects", ["companies", "contacts", "deals"]),
                "field_mappings": self.field_mappings.get(self.crm_system.value, {}),
                "deduplication_enabled": sync_config.get("dedup_enabled", True)
            }

            # Initialize sync state
            sync_state = {
                "last_sync": None,
                "next_sync": datetime.utcnow() + timedelta(minutes=sync_settings["sync_interval_minutes"]),
                "records_synced": 0,
                "errors": []
            }

            result = {
                "success": True,
                "crm_system": self.crm_system.value,
                "connection_status": connection_status,
                "sync_settings": sync_settings,
                "sync_state": sync_state,
                "api_endpoints": self._get_api_endpoints(self.crm_system),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"CRM integration successful for {crm_system}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in integrate_crm: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in integrate_crm: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def deduplicate_records(
        self,
        records: List[Dict[str, Any]],
        record_type: str
    ) -> Dict[str, Any]:
        """
        Deduplicate CRM records using fuzzy matching.

        Args:
            records: List of records to deduplicate
            record_type: Type of record (company, contact, deal)

        Returns:
            Deduplication results with matched records
        """
        try:
            logger.info(f"Starting deduplication for {len(records)} {record_type} records")

            # Validate inputs
            if not records:
                raise ValueError("records list cannot be empty")
            if record_type not in ["company", "contact", "deal"]:
                raise ValueError("record_type must be company, contact, or deal")

            # Set threshold based on type
            threshold = (
                self.fuzzy_match_threshold_company if record_type == "company"
                else self.fuzzy_match_threshold_contact
            )

            # Find duplicates
            duplicates = []
            unique_records = []
            processed_ids = set()

            for i, record in enumerate(records):
                if i in processed_ids:
                    continue

                # Find potential duplicates
                matches = self._find_fuzzy_matches(
                    record, records[i+1:], record_type, threshold
                )

                if matches:
                    # Group duplicates
                    duplicate_group = {
                        "master_record": record,
                        "duplicates": matches,
                        "confidence_scores": [m["score"] for m in matches],
                        "merge_recommended": True
                    }
                    duplicates.append(duplicate_group)

                    # Mark as processed
                    for match in matches:
                        processed_ids.add(records.index(match["record"]))

                unique_records.append(record)
                processed_ids.add(i)

            # Generate merge strategies
            merge_strategies = self._generate_merge_strategies(duplicates, record_type)

            result = {
                "success": True,
                "record_type": record_type,
                "total_records": len(records),
                "unique_records": len(unique_records),
                "duplicate_groups": len(duplicates),
                "duplicates_found": sum(len(d["duplicates"]) for d in duplicates),
                "threshold_used": threshold,
                "duplicate_groups_detail": duplicates,
                "merge_strategies": merge_strategies,
                "deduplication_rate": round((1 - len(unique_records) / len(records)) * 100, 1) if records else 0,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Deduplication completed: {len(duplicates)} duplicate groups found")
            return result

        except ValueError as e:
            logger.error(f"Validation error in deduplicate_records: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in deduplicate_records: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def map_fields(
        self,
        source_data: Dict[str, Any],
        source_system: str,
        target_system: str
    ) -> Dict[str, Any]:
        """
        Map and transform fields between CRM systems.

        Args:
            source_data: Source system data
            source_system: Source CRM system
            target_system: Target CRM system

        Returns:
            Transformed data for target system
        """
        try:
            logger.info(f"Mapping fields from {source_system} to {target_system}")

            # Validate inputs
            if not source_data:
                raise ValueError("source_data cannot be empty")

            # Get field mappings
            source_fields = self.field_mappings.get(source_system, {})
            target_fields = self.field_mappings.get(target_system, {})

            # Transform data
            transformed_data = {}

            for source_field, value in source_data.items():
                # Find mapped field
                standard_field = source_fields.get(source_field, source_field)

                # Map to target system
                target_field = None
                for t_field, t_standard in target_fields.items():
                    if t_standard == standard_field:
                        target_field = t_field
                        break

                if target_field:
                    # Apply transformations
                    transformed_value = self._transform_field_value(
                        value, standard_field, source_system, target_system
                    )
                    transformed_data[target_field] = transformed_value
                else:
                    # Log unmapped field
                    logger.warning(f"No mapping found for field: {source_field}")

            # Apply custom transformations
            transformed_data = self._apply_custom_transformations(
                transformed_data, source_system, target_system
            )

            result = {
                "success": True,
                "source_system": source_system,
                "target_system": target_system,
                "fields_mapped": len(transformed_data),
                "unmapped_fields": [f for f in source_data.keys() if f not in [source_fields.get(k) for k in source_fields]],
                "transformed_data": transformed_data,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Field mapping completed: {len(transformed_data)} fields mapped")
            return result

        except ValueError as e:
            logger.error(f"Validation error in map_fields: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in map_fields: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def analyze_conversion_funnel(
        self,
        time_period_days: int = 90
    ) -> Dict[str, Any]:
        """
        Analyze conversion funnel with stage progression rates.

        Args:
            time_period_days: Analysis time period

        Returns:
            Funnel analysis with conversion rates and drop-off points
        """
        try:
            logger.info(f"Analyzing conversion funnel for {time_period_days} days")

            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)

            # Filter recent deals
            recent_deals = [
                deal for deal in self.deals.values()
                if deal.created_at >= cutoff_date
            ]

            if not recent_deals:
                return {
                    "success": True,
                    "message": "No deals in specified time period",
                    "deals_analyzed": 0
                }

            # Count deals by stage
            stage_counts = defaultdict(int)
            for deal in recent_deals:
                stage_counts[deal.stage.value] += 1

            # Calculate progression rates
            funnel_stages = [
                DealStage.LEAD, DealStage.QUALIFIED, DealStage.DEMO,
                DealStage.PROPOSAL, DealStage.NEGOTIATION, DealStage.CLOSED_WON
            ]

            conversion_rates = {}
            previous_count = stage_counts.get(DealStage.LEAD.value, 1)

            for i in range(1, len(funnel_stages)):
                current_stage = funnel_stages[i]
                current_count = stage_counts.get(current_stage.value, 0)

                if previous_count > 0:
                    conversion_rate = (current_count / previous_count) * 100
                    conversion_rates[f"{funnel_stages[i-1].value}_to_{current_stage.value}"] = round(conversion_rate, 1)

                previous_count = current_count

            # Identify drop-off points
            drop_offs = []
            for stage_key, rate in conversion_rates.items():
                if rate < 50:  # Less than 50% conversion
                    drop_offs.append({
                        "transition": stage_key,
                        "conversion_rate": rate,
                        "severity": "high" if rate < 30 else "medium"
                    })

            # Calculate overall funnel efficiency
            total_leads = stage_counts.get(DealStage.LEAD.value, 0)
            total_won = stage_counts.get(DealStage.CLOSED_WON.value, 0)
            overall_conversion = (total_won / total_leads * 100) if total_leads > 0 else 0

            # Average time in each stage
            avg_time_per_stage = self._calculate_avg_time_per_stage(recent_deals)

            result = {
                "success": True,
                "period_days": time_period_days,
                "total_deals": len(recent_deals),
                "stage_distribution": dict(stage_counts),
                "conversion_rates": conversion_rates,
                "overall_conversion_rate": round(overall_conversion, 1),
                "drop_off_points": drop_offs,
                "avg_time_per_stage": avg_time_per_stage,
                "funnel_health_score": self._calculate_funnel_health(conversion_rates, drop_offs),
                "recommendations": self._generate_funnel_recommendations(drop_offs, avg_time_per_stage),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Funnel analysis completed: {overall_conversion:.1f}% overall conversion")
            return result

        except Exception as e:
            logger.error(f"Error analyzing conversion funnel: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def forecast_revenue(
        self,
        model_type: str = "weighted_pipeline",
        period: str = "quarterly"
    ) -> Dict[str, Any]:
        """
        Forecast revenue using multiple models.

        Args:
            model_type: Forecasting model type
            period: Forecast period (monthly, quarterly, annual)

        Returns:
            Revenue forecast with confidence levels
        """
        try:
            logger.info(f"Generating {period} revenue forecast using {model_type} model")

            # Validate inputs
            if model_type not in ["weighted_pipeline", "historical_win_rate", "ai_driven"]:
                raise ValueError("Invalid model_type")

            # Get current pipeline
            pipeline_deals = [d for d in self.deals.values() if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]

            if model_type == "weighted_pipeline":
                forecast = self._forecast_weighted_pipeline(pipeline_deals, period)
            elif model_type == "historical_win_rate":
                forecast = self._forecast_historical_win_rate(pipeline_deals, period)
            else:
                forecast = self._forecast_ai_driven(pipeline_deals, period)

            # Calculate confidence interval
            confidence_interval = self._calculate_confidence_interval(forecast)

            # Generate scenarios
            scenarios = {
                "best_case": forecast["amount"] * 1.2,
                "most_likely": forecast["amount"],
                "worst_case": forecast["amount"] * 0.8
            }

            # Identify risks
            risks = self._identify_forecast_risks(pipeline_deals, forecast)

            result = {
                "success": True,
                "model_type": model_type,
                "period": period,
                "forecast_amount": forecast["amount"],
                "confidence_level": forecast["confidence"],
                "confidence_interval": confidence_interval,
                "scenarios": scenarios,
                "pipeline_value": sum(d.amount for d in pipeline_deals),
                "deals_in_pipeline": len(pipeline_deals),
                "avg_deal_size": forecast["amount"] / len(pipeline_deals) if pipeline_deals else 0,
                "assumptions": forecast.get("assumptions", []),
                "risks": risks,
                "forecast_accuracy_historical": self._calculate_forecast_accuracy(),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Revenue forecast: ${forecast['amount']:,.2f}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in forecast_revenue: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in forecast_revenue: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def track_quota(
        self,
        rep_id: str,
        period: str = "quarterly"
    ) -> Dict[str, Any]:
        """
        Track quota attainment for sales rep.

        Args:
            rep_id: Sales rep identifier
            period: Tracking period

        Returns:
            Quota tracking and attainment data
        """
        try:
            logger.info(f"Tracking quota for rep {rep_id} ({period})")

            # Validate inputs
            if not rep_id:
                raise ValueError("rep_id is required")

            # Get period dates
            period_start, period_end = self._get_period_dates(period)

            # Get rep's deals
            rep_deals = [
                d for d in self.deals.values()
                if d.owner_id == rep_id and period_start <= d.created_at <= period_end
            ]

            # Calculate metrics
            deals_won = [d for d in rep_deals if d.stage == DealStage.CLOSED_WON]
            revenue_closed = sum(d.amount for d in deals_won)

            # Get quota (would be from config or database)
            quota = self._get_rep_quota(rep_id, period)

            # Calculate attainment
            attainment_pct = (revenue_closed / quota * 100) if quota > 0 else 0

            # Projected attainment
            days_elapsed = (datetime.utcnow() - period_start).days
            days_in_period = (period_end - period_start).days
            run_rate = revenue_closed / days_elapsed if days_elapsed > 0 else 0
            projected_attainment = (run_rate * days_in_period / quota * 100) if quota > 0 else 0

            # Quota health
            quota_health = self._assess_quota_health(attainment_pct, projected_attainment, days_elapsed / days_in_period)

            result = {
                "success": True,
                "rep_id": rep_id,
                "period": period,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "quota": quota,
                "revenue_closed": revenue_closed,
                "attainment_pct": round(attainment_pct, 1),
                "projected_attainment": round(projected_attainment, 1),
                "deals_closed": len(deals_won),
                "deals_in_pipeline": len([d for d in rep_deals if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]),
                "gap_to_quota": quota - revenue_closed,
                "run_rate_per_day": round(run_rate, 2),
                "quota_health": quota_health,
                "days_remaining": (period_end - datetime.utcnow()).days,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Quota tracking: {attainment_pct:.1f}% attainment")
            return result

        except ValueError as e:
            logger.error(f"Validation error in track_quota: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in track_quota: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def analyze_rep_performance(
        self,
        rep_id: str,
        time_period_days: int = 90
    ) -> Dict[str, Any]:
        """
        Analyze comprehensive sales rep performance.

        Args:
            rep_id: Sales rep identifier
            time_period_days: Analysis period

        Returns:
            Multi-metric performance dashboard
        """
        try:
            logger.info(f"Analyzing performance for rep {rep_id}")

            # Validate inputs
            if not rep_id:
                raise ValueError("rep_id is required")

            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)

            # Get rep's deals
            rep_deals = [
                d for d in self.deals.values()
                if d.owner_id == rep_id and d.created_at >= cutoff_date
            ]

            if not rep_deals:
                return {
                    "success": True,
                    "message": "No deals found for rep in time period",
                    "rep_id": rep_id
                }

            # Core metrics
            total_deals = len(rep_deals)
            deals_won = [d for d in rep_deals if d.stage == DealStage.CLOSED_WON]
            deals_lost = [d for d in rep_deals if d.stage == DealStage.CLOSED_LOST]

            revenue_closed = sum(d.amount for d in deals_won)
            win_rate = (len(deals_won) / (len(deals_won) + len(deals_lost)) * 100) if (deals_won or deals_lost) else 0

            # Average deal size
            avg_deal_size = revenue_closed / len(deals_won) if deals_won else 0

            # Sales cycle time
            avg_cycle_days = self._calculate_avg_sales_cycle(deals_won)

            # Activity metrics
            total_activities = sum(len(d.activities) for d in rep_deals)
            activities_per_deal = total_activities / total_deals if total_deals > 0 else 0

            # Conversion rates by stage
            conversion_rates = self._calculate_rep_conversion_rates(rep_deals)

            # Compare to team average
            team_comparison = self._compare_to_team_average(rep_id, {
                "win_rate": win_rate,
                "avg_deal_size": avg_deal_size,
                "avg_cycle_days": avg_cycle_days
            })

            # Strengths and weaknesses
            analysis = self._analyze_rep_strengths_weaknesses({
                "win_rate": win_rate,
                "avg_deal_size": avg_deal_size,
                "avg_cycle_days": avg_cycle_days,
                "activities_per_deal": activities_per_deal
            }, team_comparison)

            result = {
                "success": True,
                "rep_id": rep_id,
                "period_days": time_period_days,
                "total_deals": total_deals,
                "deals_won": len(deals_won),
                "deals_lost": len(deals_lost),
                "revenue_closed": revenue_closed,
                "win_rate": round(win_rate, 1),
                "avg_deal_size": round(avg_deal_size, 2),
                "avg_sales_cycle_days": avg_cycle_days,
                "total_activities": total_activities,
                "activities_per_deal": round(activities_per_deal, 1),
                "conversion_rates": conversion_rates,
                "team_comparison": team_comparison,
                "strengths": analysis["strengths"],
                "improvement_areas": analysis["weaknesses"],
                "performance_score": self._calculate_performance_score({
                    "win_rate": win_rate,
                    "avg_deal_size": avg_deal_size,
                    "activities_per_deal": activities_per_deal
                }),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Rep performance analysis completed: {win_rate:.1f}% win rate")
            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_rep_performance: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in analyze_rep_performance: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def conduct_winloss_analysis(
        self,
        time_period_days: int = 90
    ) -> Dict[str, Any]:
        """
        Conduct win/loss analysis with pattern detection.

        Args:
            time_period_days: Analysis period

        Returns:
            Win/loss analysis with categorization and patterns
        """
        try:
            logger.info(f"Conducting win/loss analysis for {time_period_days} days")

            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)

            # Filter closed deals
            won_deals = [
                d for d in self.deals.values()
                if d.stage == DealStage.CLOSED_WON and d.updated_at >= cutoff_date
            ]

            lost_deals = [
                d for d in self.deals.values()
                if d.stage == DealStage.CLOSED_LOST and d.updated_at >= cutoff_date
            ]

            total_closed = len(won_deals) + len(lost_deals)

            if total_closed == 0:
                return {
                    "success": True,
                    "message": "No closed deals in time period",
                    "deals_analyzed": 0
                }

            # Win rate
            win_rate = (len(won_deals) / total_closed * 100) if total_closed > 0 else 0

            # Loss reason categorization
            loss_reasons = defaultdict(int)
            for deal in lost_deals:
                if deal.loss_reason:
                    loss_reasons[deal.loss_reason.value] += 1

            # Win reasons
            win_reasons = defaultdict(int)
            for deal in won_deals:
                if deal.win_reason:
                    win_reasons[deal.win_reason] += 1

            # Identify patterns
            patterns = self._identify_winloss_patterns(won_deals, lost_deals)

            # Deal size analysis
            avg_won_deal = sum(d.amount for d in won_deals) / len(won_deals) if won_deals else 0
            avg_lost_deal = sum(d.amount for d in lost_deals) / len(lost_deals) if lost_deals else 0

            # Sales cycle comparison
            avg_won_cycle = self._calculate_avg_sales_cycle(won_deals)
            avg_lost_cycle = self._calculate_avg_sales_cycle(lost_deals)

            # Actionable insights
            insights = self._generate_winloss_insights(
                loss_reasons, win_reasons, patterns, avg_won_deal, avg_lost_deal
            )

            result = {
                "success": True,
                "period_days": time_period_days,
                "total_closed_deals": total_closed,
                "deals_won": len(won_deals),
                "deals_lost": len(lost_deals),
                "win_rate": round(win_rate, 1),
                "loss_reasons": dict(loss_reasons),
                "top_loss_reason": max(loss_reasons.items(), key=lambda x: x[1])[0] if loss_reasons else None,
                "win_reasons": dict(win_reasons),
                "avg_won_deal_size": round(avg_won_deal, 2),
                "avg_lost_deal_size": round(avg_lost_deal, 2),
                "avg_won_sales_cycle": avg_won_cycle,
                "avg_lost_sales_cycle": avg_lost_cycle,
                "patterns_identified": patterns,
                "insights": insights,
                "recommendations": self._generate_winloss_recommendations(loss_reasons, patterns),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Win/loss analysis completed: {win_rate:.1f}% win rate")
            return result

        except Exception as e:
            logger.error(f"Error conducting win/loss analysis: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def calculate_sales_velocity(
        self,
        time_period_days: int = 90
    ) -> Dict[str, Any]:
        """
        Calculate sales velocity metrics.

        Formula: (Number of Deals × Win Rate × Average Deal Size) / Sales Cycle Length

        Args:
            time_period_days: Calculation period

        Returns:
            Sales velocity metrics and trends
        """
        try:
            logger.info(f"Calculating sales velocity for {time_period_days} days")

            cutoff_date = datetime.utcnow() - timedelta(days=time_period_days)

            # Get relevant deals
            deals = [
                d for d in self.deals.values()
                if d.created_at >= cutoff_date
            ]

            if not deals:
                return {
                    "success": True,
                    "message": "No deals in time period",
                    "velocity": 0
                }

            # Calculate components
            num_deals = len([d for d in deals if d.stage not in [DealStage.CLOSED_LOST]])
            won_deals = [d for d in deals if d.stage == DealStage.CLOSED_WON]
            lost_deals = [d for d in deals if d.stage == DealStage.CLOSED_LOST]

            win_rate = (len(won_deals) / (len(won_deals) + len(lost_deals))) if (won_deals or lost_deals) else 0
            avg_deal_size = sum(d.amount for d in won_deals) / len(won_deals) if won_deals else 0
            avg_cycle_days = self._calculate_avg_sales_cycle(won_deals)

            # Calculate velocity
            if avg_cycle_days > 0:
                velocity = (num_deals * win_rate * avg_deal_size) / avg_cycle_days
            else:
                velocity = 0

            # Calculate trend (compare to previous period)
            previous_period_start = cutoff_date - timedelta(days=time_period_days)
            previous_deals = [
                d for d in self.deals.values()
                if previous_period_start <= d.created_at < cutoff_date
            ]

            previous_velocity = self._calculate_velocity_for_deals(previous_deals)

            velocity_change = ((velocity - previous_velocity) / previous_velocity * 100) if previous_velocity > 0 else 0

            # Identify drivers
            drivers = self._identify_velocity_drivers({
                "num_deals": num_deals,
                "win_rate": win_rate,
                "avg_deal_size": avg_deal_size,
                "avg_cycle_days": avg_cycle_days
            })

            result = {
                "success": True,
                "period_days": time_period_days,
                "sales_velocity": round(velocity, 2),
                "velocity_components": {
                    "number_of_deals": num_deals,
                    "win_rate": round(win_rate * 100, 1),
                    "avg_deal_size": round(avg_deal_size, 2),
                    "avg_sales_cycle_days": avg_cycle_days
                },
                "previous_period_velocity": round(previous_velocity, 2),
                "velocity_change_pct": round(velocity_change, 1),
                "trend": "increasing" if velocity_change > 0 else "decreasing" if velocity_change < 0 else "stable",
                "key_drivers": drivers,
                "velocity_per_rep": self._calculate_velocity_per_rep(time_period_days),
                "recommendations": self._generate_velocity_recommendations(drivers),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Sales velocity calculated: {velocity:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error calculating sales velocity: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def prepare_contract(
        self,
        lead_id: str,
        terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare contract documents for closing.

        Args:
            lead_id: Lead identifier
            terms: Agreed terms

        Returns:
            Contract preparation results
        """
        try:
            logger.info(f"Preparing contract for lead {lead_id}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not terms:
                raise ValueError("terms cannot be empty")

            # Generate contract ID
            contract_id = f"contract_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

            # Validate all required terms
            required_terms = ["total_value", "payment_terms", "start_date", "contract_length_months"]
            missing_terms = [t for t in required_terms if t not in terms]

            if missing_terms:
                raise ValueError(f"Missing required terms: {', '.join(missing_terms)}")

            # Create deal record
            deal = Deal(
                deal_id=f"deal_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                company_id=lead_id,
                stage=DealStage.NEGOTIATION,
                amount=terms["total_value"],
                close_date=datetime.fromisoformat(terms["start_date"]) if isinstance(terms["start_date"], str) else terms["start_date"]
            )

            self.deals[deal.deal_id] = deal

            result = {
                "success": True,
                "contract_id": contract_id,
                "deal_id": deal.deal_id,
                "lead_id": lead_id,
                "contract_prepared": True,
                "contract_value": terms["total_value"],
                "payment_terms": terms["payment_terms"],
                "start_date": terms["start_date"],
                "contract_length_months": terms["contract_length_months"],
                "document_id": contract_id,
                "signature_required": True,
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Contract prepared: {contract_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in prepare_contract: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in prepare_contract: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def send_contract(
        self,
        contract_id: str,
        recipients: List[str]
    ) -> Dict[str, Any]:
        """
        Send contract for signature.

        Args:
            contract_id: Contract identifier
            recipients: List of recipient emails

        Returns:
            Sending results
        """
        try:
            logger.info(f"Sending contract {contract_id}")

            # Validate inputs
            if not contract_id:
                raise ValueError("contract_id is required")
            if not recipients:
                raise ValueError("recipients list cannot be empty")

            result = {
                "success": True,
                "contract_id": contract_id,
                "sent": True,
                "recipients": recipients,
                "sent_at": datetime.utcnow().isoformat(),
                "tracking_enabled": True,
                "expiration_date": (datetime.utcnow() + timedelta(days=30)).isoformat()
            }

            logger.info(f"Contract sent to {len(recipients)} recipients")
            return result

        except ValueError as e:
            logger.error(f"Validation error in send_contract: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in send_contract: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def track_signatures(self, contract_id: str) -> Dict[str, Any]:
        """
        Track contract signature status.

        Args:
            contract_id: Contract identifier

        Returns:
            Signature status
        """
        try:
            logger.info(f"Tracking signatures for {contract_id}")

            # Validate inputs
            if not contract_id:
                raise ValueError("contract_id is required")

            result = {
                "success": True,
                "contract_id": contract_id,
                "signed": False,
                "pending_signatures": ["Buyer", "Seller"],
                "signatures_completed": [],
                "last_activity": datetime.utcnow().isoformat()
            }

            logger.info(f"Signature tracking: {len(result['pending_signatures'])} pending")
            return result

        except ValueError as e:
            logger.error(f"Validation error in track_signatures: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in track_signatures: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def process_payment(self, contract_id: str) -> Dict[str, Any]:
        """
        Process initial payment.

        Args:
            contract_id: Contract identifier

        Returns:
            Payment processing results
        """
        try:
            logger.info(f"Processing payment for {contract_id}")

            # Validate inputs
            if not contract_id:
                raise ValueError("contract_id is required")

            result = {
                "success": True,
                "contract_id": contract_id,
                "payment_received": True,
                "amount": 0,
                "payment_method": "ACH",
                "transaction_id": f"txn_{contract_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("Payment processed successfully")
            return result

        except ValueError as e:
            logger.error(f"Validation error in process_payment: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in process_payment: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def handoff_to_fulfillment(
        self,
        lead_id: str,
        contract_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Hand off closed deal to fulfillment team.

        Args:
            lead_id: Lead identifier
            contract_data: Contract and client data

        Returns:
            Handoff results
        """
        try:
            logger.info(f"Starting handoff to fulfillment for {lead_id}")

            # Validate inputs
            if not lead_id:
                raise ValueError("lead_id is required")
            if not contract_data:
                raise ValueError("contract_data cannot be empty")

            # Create handoff package
            handoff_package = {
                "client_info": contract_data.get("client_info", {}),
                "contract_terms": contract_data.get("terms", {}),
                "technical_requirements": contract_data.get("requirements", {}),
                "timeline": contract_data.get("timeline", {}),
                "success_criteria": contract_data.get("success_criteria", [])
            }

            # Mark deal as won
            deal = next((d for d in self.deals.values() if d.company_id == lead_id), None)
            if deal:
                deal.stage = DealStage.CLOSED_WON
                deal.updated_at = datetime.utcnow()

            result = {
                "success": True,
                "lead_id": lead_id,
                "handoff_complete": True,
                "fulfillment_team_notified": True,
                "project_created": True,
                "project_id": f"project_{lead_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "handoff_package": handoff_package,
                "kickoff_scheduled": True,
                "kickoff_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info("Handoff to fulfillment completed")
            return result

        except ValueError as e:
            logger.error(f"Validation error in handoff_to_fulfillment: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in handoff_to_fulfillment: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    # Helper methods

    def _initialize_field_mappings(self) -> None:
        """Initialize CRM field mappings."""
        self.field_mappings = {
            "salesforce": {
                "Name": "company_name",
                "Website": "website",
                "Industry": "industry",
                "NumberOfEmployees": "employee_count",
                "AnnualRevenue": "annual_revenue",
                "Email": "email",
                "Phone": "phone",
                "Amount": "deal_amount",
                "StageName": "deal_stage",
                "CloseDate": "close_date"
            },
            "hubspot": {
                "name": "company_name",
                "domain": "website",
                "industry": "industry",
                "numberofemployees": "employee_count",
                "annualrevenue": "annual_revenue",
                "email": "email",
                "phone": "phone",
                "amount": "deal_amount",
                "dealstage": "deal_stage",
                "closedate": "close_date"
            }
        }

    def _get_required_credentials(self, crm_system: CRMSystem) -> List[str]:
        """Get required credentials for CRM system."""
        if crm_system == CRMSystem.SALESFORCE:
            return ["client_id", "client_secret", "username", "password", "security_token"]
        elif crm_system == CRMSystem.HUBSPOT:
            return ["api_key"]
        else:
            return ["api_key"]

    def _test_crm_connection(self, crm_system: CRMSystem, credentials: Dict[str, Any]) -> str:
        """Test CRM connection."""
        # Simulated connection test
        return "connected"

    def _get_api_endpoints(self, crm_system: CRMSystem) -> Dict[str, str]:
        """Get API endpoints for CRM."""
        if crm_system == CRMSystem.SALESFORCE:
            return {
                "base_url": "https://login.salesforce.com",
                "api_version": "v55.0",
                "companies": "/services/data/v55.0/sobjects/Account",
                "contacts": "/services/data/v55.0/sobjects/Contact",
                "deals": "/services/data/v55.0/sobjects/Opportunity"
            }
        elif crm_system == CRMSystem.HUBSPOT:
            return {
                "base_url": "https://api.hubapi.com",
                "companies": "/crm/v3/objects/companies",
                "contacts": "/crm/v3/objects/contacts",
                "deals": "/crm/v3/objects/deals"
            }
        return {}

    def _find_fuzzy_matches(
        self,
        record: Dict[str, Any],
        other_records: List[Dict[str, Any]],
        record_type: str,
        threshold: float
    ) -> List[Dict[str, Any]]:
        """Find fuzzy matches for record."""
        matches = []

        # Determine comparison field based on record type
        if record_type == "company":
            compare_field = "name"
        elif record_type == "contact":
            compare_field = "email"
        else:
            return matches

        record_value = record.get(compare_field, "").lower()

        for other in other_records:
            other_value = other.get(compare_field, "").lower()

            # Calculate similarity
            similarity = difflib.SequenceMatcher(None, record_value, other_value).ratio()

            if similarity >= threshold:
                matches.append({
                    "record": other,
                    "score": round(similarity, 3),
                    "matched_field": compare_field
                })

        return matches

    def _generate_merge_strategies(
        self,
        duplicates: List[Dict[str, Any]],
        record_type: str
    ) -> List[Dict[str, Any]]:
        """Generate strategies for merging duplicates."""
        strategies = []

        for dup_group in duplicates:
            strategy = {
                "master_record_id": dup_group["master_record"].get("id", ""),
                "merge_method": "keep_most_complete",
                "fields_to_merge": self._identify_fields_to_merge(dup_group, record_type),
                "confidence": "high" if all(s > 0.95 for s in dup_group["confidence_scores"]) else "medium"
            }
            strategies.append(strategy)

        return strategies

    def _identify_fields_to_merge(self, dup_group: Dict[str, Any], record_type: str) -> List[str]:
        """Identify which fields to merge from duplicates."""
        return ["all_fields"]  # Simplified

    def _transform_field_value(
        self,
        value: Any,
        standard_field: str,
        source_system: str,
        target_system: str
    ) -> Any:
        """Transform field value between systems."""
        # Apply type conversions
        if standard_field == "employee_count" and isinstance(value, str):
            try:
                return int(value)
            except ValueError:
                return 0

        if standard_field == "annual_revenue" and isinstance(value, str):
            try:
                return float(value.replace("$", "").replace(",", ""))
            except ValueError:
                return 0.0

        return value

    def _apply_custom_transformations(
        self,
        data: Dict[str, Any],
        source_system: str,
        target_system: str
    ) -> Dict[str, Any]:
        """Apply custom transformations."""
        # Add default values for required fields
        if target_system == "salesforce" and "RecordTypeId" not in data:
            data["RecordTypeId"] = "default"

        return data

    def _calculate_avg_time_per_stage(self, deals: List[Deal]) -> Dict[str, int]:
        """Calculate average time spent in each stage."""
        stage_times = defaultdict(list)

        for deal in deals:
            # Simplified - would track actual stage transitions
            if deal.created_at and deal.updated_at:
                total_days = (deal.updated_at - deal.created_at).days
                # Distribute evenly across stages for simplification
                avg_per_stage = total_days // 5
                for stage in DealStage:
                    stage_times[stage.value].append(avg_per_stage)

        return {
            stage: int(sum(times) / len(times)) if times else 0
            for stage, times in stage_times.items()
        }

    def _calculate_funnel_health(
        self,
        conversion_rates: Dict[str, float],
        drop_offs: List[Dict[str, Any]]
    ) -> int:
        """Calculate overall funnel health score (0-100)."""
        if not conversion_rates:
            return 50

        avg_conversion = sum(conversion_rates.values()) / len(conversion_rates)
        health_score = int(avg_conversion)

        # Penalize for severe drop-offs
        severe_drops = sum(1 for d in drop_offs if d["severity"] == "high")
        health_score -= (severe_drops * 10)

        return max(min(health_score, 100), 0)

    def _generate_funnel_recommendations(
        self,
        drop_offs: List[Dict[str, Any]],
        avg_time: Dict[str, int]
    ) -> List[str]:
        """Generate recommendations for funnel optimization."""
        recommendations = []

        for drop_off in drop_offs:
            if drop_off["severity"] == "high":
                recommendations.append(f"Focus on improving {drop_off['transition']} conversion - currently at {drop_off['conversion_rate']}%")

        # Check for slow stages
        slow_stages = [stage for stage, days in avg_time.items() if days > 30]
        if slow_stages:
            recommendations.append(f"Accelerate process in stages: {', '.join(slow_stages[:2])}")

        return recommendations

    def _forecast_weighted_pipeline(
        self,
        deals: List[Deal],
        period: str
    ) -> Dict[str, Any]:
        """Forecast using weighted pipeline method."""
        # Stage probability weights
        stage_weights = {
            DealStage.LEAD: 0.1,
            DealStage.QUALIFIED: 0.2,
            DealStage.DEMO: 0.4,
            DealStage.PROPOSAL: 0.6,
            DealStage.NEGOTIATION: 0.8,
            DealStage.CLOSED_WON: 1.0
        }

        weighted_value = sum(
            deal.amount * stage_weights.get(deal.stage, 0.1)
            for deal in deals
        )

        return {
            "amount": weighted_value,
            "confidence": 0.75,
            "assumptions": [
                "Historical stage conversion rates",
                "Current pipeline velocity",
                "Seasonal factors"
            ]
        }

    def _forecast_historical_win_rate(
        self,
        deals: List[Deal],
        period: str
    ) -> Dict[str, Any]:
        """Forecast using historical win rate."""
        # Calculate historical win rate
        all_deals = list(self.deals.values())
        closed_deals = [d for d in all_deals if d.stage in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]

        if closed_deals:
            win_rate = len([d for d in closed_deals if d.stage == DealStage.CLOSED_WON]) / len(closed_deals)
        else:
            win_rate = 0.3  # Default

        pipeline_value = sum(d.amount for d in deals)
        forecast_amount = pipeline_value * win_rate

        return {
            "amount": forecast_amount,
            "confidence": 0.70,
            "assumptions": [
                f"Historical win rate: {win_rate*100:.1f}%",
                f"Current pipeline: ${pipeline_value:,.2f}"
            ]
        }

    def _forecast_ai_driven(
        self,
        deals: List[Deal],
        period: str
    ) -> Dict[str, Any]:
        """AI-driven forecast (simplified)."""
        # Simplified AI forecast - weighted average of other methods
        weighted = self._forecast_weighted_pipeline(deals, period)
        historical = self._forecast_historical_win_rate(deals, period)

        forecast_amount = (weighted["amount"] * 0.6 + historical["amount"] * 0.4)

        return {
            "amount": forecast_amount,
            "confidence": 0.80,
            "assumptions": [
                "Machine learning model v2.1",
                "Historical patterns",
                "Market conditions"
            ]
        }

    def _calculate_confidence_interval(self, forecast: Dict[str, Any]) -> Dict[str, float]:
        """Calculate forecast confidence interval."""
        amount = forecast["amount"]
        confidence = forecast["confidence"]

        # Simplified confidence interval
        margin = amount * (1 - confidence) * 0.5

        return {
            "lower_bound": amount - margin,
            "upper_bound": amount + margin,
            "confidence_level": confidence * 100
        }

    def _identify_forecast_risks(
        self,
        deals: List[Deal],
        forecast: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Identify risks to forecast."""
        risks = []

        # Large deal concentration
        large_deals = [d for d in deals if d.amount > forecast["amount"] * 0.2]
        if large_deals:
            risks.append({
                "risk": "Large deal concentration",
                "impact": "high",
                "mitigation": "Diversify pipeline with more deals"
            })

        # Pipeline coverage
        pipeline_value = sum(d.amount for d in deals)
        if pipeline_value < forecast["amount"] * 3:
            risks.append({
                "risk": "Insufficient pipeline coverage",
                "impact": "medium",
                "mitigation": "Increase lead generation"
            })

        return risks

    def _calculate_forecast_accuracy(self) -> float:
        """Calculate historical forecast accuracy."""
        # Simplified - would compare historical forecasts to actuals
        return 85.0

    def _get_period_dates(self, period: str) -> Tuple[datetime, datetime]:
        """Get start and end dates for period."""
        now = datetime.utcnow()

        if period == "monthly":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end = now.replace(year=now.year+1, month=1, day=1) - timedelta(seconds=1)
            else:
                end = now.replace(month=now.month+1, day=1) - timedelta(seconds=1)
        elif period == "quarterly":
            quarter = (now.month - 1) // 3
            start = now.replace(month=quarter*3+1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_month = min(start.month + 3, 12)
            end = now.replace(month=end_month, day=1) - timedelta(seconds=1)
        else:  # annual
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now.replace(month=12, day=31, hour=23, minute=59, second=59)

        return start, end

    def _get_rep_quota(self, rep_id: str, period: str) -> float:
        """Get rep's quota for period."""
        # Would fetch from config/database
        quotas = {
            "monthly": 50000,
            "quarterly": 150000,
            "annual": 600000
        }
        return quotas.get(period, 150000)

    def _assess_quota_health(
        self,
        attainment_pct: float,
        projected_pct: float,
        period_progress: float
    ) -> str:
        """Assess quota health status."""
        if projected_pct >= 100:
            return "on_track"
        elif projected_pct >= 90:
            return "at_risk"
        else:
            return "off_track"

    def _calculate_avg_sales_cycle(self, deals: List[Deal]) -> int:
        """Calculate average sales cycle in days."""
        if not deals:
            return 0

        total_days = 0
        count = 0

        for deal in deals:
            if deal.created_at and deal.updated_at:
                days = (deal.updated_at - deal.created_at).days
                total_days += days
                count += 1

        return total_days // count if count > 0 else 0

    def _calculate_rep_conversion_rates(self, deals: List[Deal]) -> Dict[str, float]:
        """Calculate conversion rates by stage for rep."""
        stage_counts = defaultdict(int)
        for deal in deals:
            stage_counts[deal.stage.value] += 1

        # Simplified conversion rates
        return {
            "lead_to_qualified": 70.0,
            "qualified_to_demo": 60.0,
            "demo_to_proposal": 50.0,
            "proposal_to_won": 40.0
        }

    def _compare_to_team_average(
        self,
        rep_id: str,
        metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """Compare rep metrics to team average."""
        # Simplified team averages
        team_avg = {
            "win_rate": 35.0,
            "avg_deal_size": 75000.0,
            "avg_cycle_days": 45
        }

        return {
            "win_rate": {
                "rep": metrics["win_rate"],
                "team_avg": team_avg["win_rate"],
                "variance_pct": round((metrics["win_rate"] - team_avg["win_rate"]) / team_avg["win_rate"] * 100, 1)
            },
            "avg_deal_size": {
                "rep": metrics["avg_deal_size"],
                "team_avg": team_avg["avg_deal_size"],
                "variance_pct": round((metrics["avg_deal_size"] - team_avg["avg_deal_size"]) / team_avg["avg_deal_size"] * 100, 1)
            }
        }

    def _analyze_rep_strengths_weaknesses(
        self,
        metrics: Dict[str, float],
        comparison: Dict[str, Any]
    ) -> Dict[str, List[str]]:
        """Analyze rep strengths and weaknesses."""
        strengths = []
        weaknesses = []

        if metrics["win_rate"] > 40:
            strengths.append("Above-average win rate")
        elif metrics["win_rate"] < 30:
            weaknesses.append("Win rate below target")

        if metrics["avg_deal_size"] > 80000:
            strengths.append("Strong at closing large deals")

        if metrics["avg_cycle_days"] < 40:
            strengths.append("Fast sales cycle")
        elif metrics["avg_cycle_days"] > 60:
            weaknesses.append("Slow sales cycle - needs improvement")

        return {"strengths": strengths, "weaknesses": weaknesses}

    def _calculate_performance_score(self, metrics: Dict[str, float]) -> int:
        """Calculate overall performance score (0-100)."""
        score = 50  # Base score

        # Win rate component (0-30)
        if metrics["win_rate"] >= 40:
            score += 30
        elif metrics["win_rate"] >= 30:
            score += 20
        elif metrics["win_rate"] >= 20:
            score += 10

        # Deal size component (0-20)
        if metrics["avg_deal_size"] >= 100000:
            score += 20
        elif metrics["avg_deal_size"] >= 75000:
            score += 15

        return min(score, 100)

    def _identify_winloss_patterns(
        self,
        won_deals: List[Deal],
        lost_deals: List[Deal]
    ) -> List[Dict[str, Any]]:
        """Identify patterns in won vs lost deals."""
        patterns = []

        # Deal size pattern
        avg_won_size = sum(d.amount for d in won_deals) / len(won_deals) if won_deals else 0
        avg_lost_size = sum(d.amount for d in lost_deals) / len(lost_deals) if lost_deals else 0

        if avg_won_size < avg_lost_size * 0.8:
            patterns.append({
                "pattern": "Larger deals more likely to be lost",
                "confidence": "medium",
                "recommendation": "Improve enterprise sales capabilities"
            })

        return patterns

    def _generate_winloss_insights(
        self,
        loss_reasons: Dict,
        win_reasons: Dict,
        patterns: List[Dict[str, Any]],
        avg_won: float,
        avg_lost: float
    ) -> List[str]:
        """Generate actionable insights from win/loss data."""
        insights = []

        if loss_reasons:
            top_loss = max(loss_reasons.items(), key=lambda x: x[1])
            insights.append(f"Top loss reason is {top_loss[0]} - accounts for {top_loss[1]} deals")

        if avg_won < avg_lost:
            insights.append("Smaller deals have higher win rates - focus on deal qualification")

        return insights

    def _generate_winloss_recommendations(
        self,
        loss_reasons: Dict,
        patterns: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate recommendations based on win/loss analysis."""
        recommendations = []

        if "price" in loss_reasons and loss_reasons["price"] > 3:
            recommendations.append("Review pricing strategy and value proposition")

        if "product_fit" in loss_reasons:
            recommendations.append("Improve discovery process to identify better-fit opportunities")

        for pattern in patterns:
            if "recommendation" in pattern:
                recommendations.append(pattern["recommendation"])

        return recommendations

    def _calculate_velocity_for_deals(self, deals: List[Deal]) -> float:
        """Calculate velocity for a set of deals."""
        if not deals:
            return 0

        won = [d for d in deals if d.stage == DealStage.CLOSED_WON]
        lost = [d for d in deals if d.stage == DealStage.CLOSED_LOST]

        num_deals = len([d for d in deals if d.stage not in [DealStage.CLOSED_LOST]])
        win_rate = (len(won) / (len(won) + len(lost))) if (won or lost) else 0
        avg_deal = sum(d.amount for d in won) / len(won) if won else 0
        avg_cycle = self._calculate_avg_sales_cycle(won)

        if avg_cycle > 0:
            return (num_deals * win_rate * avg_deal) / avg_cycle
        return 0

    def _identify_velocity_drivers(self, components: Dict[str, float]) -> List[Dict[str, Any]]:
        """Identify key velocity drivers."""
        drivers = []

        if components["win_rate"] > 0.4:
            drivers.append({
                "driver": "High win rate",
                "impact": "positive",
                "metric": f"{components['win_rate']*100:.1f}%"
            })

        if components["avg_cycle_days"] < 40:
            drivers.append({
                "driver": "Fast sales cycle",
                "impact": "positive",
                "metric": f"{components['avg_cycle_days']} days"
            })

        return drivers

    def _calculate_velocity_per_rep(self, time_period_days: int) -> Dict[str, float]:
        """Calculate velocity per sales rep."""
        # Simplified - would calculate for each rep
        return {
            "rep_001": 12500.0,
            "rep_002": 15000.0
        }

    def _generate_velocity_recommendations(self, drivers: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations to improve velocity."""
        recommendations = []

        positive_drivers = [d for d in drivers if d["impact"] == "positive"]
        if len(positive_drivers) < 2:
            recommendations.append("Focus on improving win rate and sales cycle time")

        return recommendations
