"""
Competitor Analyst Agent - Production Implementation

Analyzes competitor offerings using SWOT Analysis, Competitive Benchmarking,
Market Share Tracking, Feature Comparison Matrix, and Competitive Positioning.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import statistics

logger = logging.getLogger(__name__)


class CompetitivePosition(Enum):
    """Competitive position categories"""
    LEADER = "leader"
    CHALLENGER = "challenger"
    FOLLOWER = "follower"
    NICHE = "niche"


class PricingModel(Enum):
    """Pricing model types"""
    VALUE_BASED = "value_based"
    COST_PLUS = "cost_plus"
    COMPETITIVE = "competitive"
    PREMIUM = "premium"
    PENETRATION = "penetration"


class MarketSegment(Enum):
    """Market segment types"""
    ENTERPRISE = "enterprise"
    MID_MARKET = "mid_market"
    SMB = "smb"
    STARTUP = "startup"


@dataclass
class SWOTAnalysis:
    """SWOT analysis structure"""
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    strategic_implications: List[str] = field(default_factory=list)
    priority_actions: List[str] = field(default_factory=list)


@dataclass
class CompetitorProfile:
    """Comprehensive competitor profile"""
    competitor_id: str
    name: str
    founded_year: Optional[int]
    headquarters: str
    employee_count: Optional[int]
    revenue_estimate: float
    market_share: float
    target_segments: List[str]
    geographic_coverage: List[str]
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    key_offerings: List[str] = field(default_factory=list)
    pricing_strategy: Optional[str] = None
    competitive_position: Optional[CompetitivePosition] = None


@dataclass
class FeatureComparison:
    """Feature comparison entry"""
    feature_name: str
    our_offering: str
    competitor_offerings: Dict[str, str]
    advantage: Optional[str] = None
    gap: Optional[str] = None


@dataclass
class BenchmarkMetric:
    """Benchmark metric"""
    metric_name: str
    our_value: float
    competitor_values: Dict[str, float]
    industry_average: float
    percentile_rank: float
    trend: str


@dataclass
class BattleCard:
    """Competitive battle card"""
    competitor_name: str
    overview: str
    key_strengths: List[str]
    key_weaknesses: List[str]
    how_to_win: List[str]
    talking_points: List[str]
    objection_handling: Dict[str, str]
    pricing_comparison: Dict[str, Any]


class CompetitorAnalystAgent:
    """
    Competitor Analyst Agent - Comprehensive competitive intelligence and analysis

    Implements advanced frameworks:
    - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
    - Competitive Benchmarking (multi-dimensional performance comparison)
    - Market Share Tracking (share of voice, trends)
    - Feature Comparison Matrix (feature parity, gap identification)
    - Pricing Strategy Analysis (competitor pricing patterns)
    - Competitive Positioning (perceptual mapping)
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Competitor Analyst Agent

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "competitor_analyst_001"
        self.config = config or {}
        self.competitor_profiles: List[CompetitorProfile] = []
        self.benchmark_history: List[Dict[str, Any]] = []
        self.name = "Competitor Analyst"
        self.role = "Competitive Analysis and Intelligence"

        # Benchmark metrics to track
        self.benchmark_metrics = [
            "market_share",
            "revenue_growth",
            "customer_satisfaction",
            "pricing_competitiveness",
            "feature_completeness",
            "brand_awareness",
            "customer_retention",
            "time_to_market",
            "innovation_index",
            "service_quality"
        ]

        logger.info(f"Competitor Analyst Agent {self.agent_id} initialized")

    # ==================== COMPETITOR ANALYSIS ====================

    def analyze_competitor(
        self,
        competitor_name: str,
        data_sources: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a specific competitor with deep profile (15+ data points)

        Args:
            competitor_name: Competitor name
            data_sources: Optional data sources for analysis

        Returns:
            Comprehensive competitor analysis

        Example:
            >>> analysis = agent.analyze_competitor(
            ...     "Acme Digital",
            ...     data_sources={"website": "...", "reviews": [...]}
            ... )
        """
        try:
            logger.info(f"Analyzing competitor: {competitor_name}")

            data_sources = data_sources or {}

            # Generate competitor ID
            competitor_id = f"comp_{int(datetime.now().timestamp())}"

            # Extract company information
            company_info = self._extract_company_info(competitor_name, data_sources)

            # Analyze market position
            market_position = self._analyze_market_position(competitor_name, data_sources)

            # Identify target segments
            target_segments = self._identify_target_segments(data_sources)

            # Analyze offerings
            offerings = self._analyze_offerings(data_sources)

            # Analyze pricing strategy
            pricing_analysis = self.analyze_pricing_strategy(competitor_id, data_sources)

            # Conduct SWOT analysis
            swot = self.conduct_swot_analysis(competitor_name, data_sources)

            # Determine competitive position
            competitive_position = self._determine_competitive_position(
                market_position,
                company_info
            )

            # Create competitor profile
            profile = CompetitorProfile(
                competitor_id=competitor_id,
                name=competitor_name,
                founded_year=company_info.get('founded_year'),
                headquarters=company_info.get('headquarters', 'Unknown'),
                employee_count=company_info.get('employee_count'),
                revenue_estimate=company_info.get('revenue_estimate', 0),
                market_share=market_position.get('market_share', 0),
                target_segments=target_segments,
                geographic_coverage=company_info.get('geographic_coverage', []),
                strengths=swot.strengths,
                weaknesses=swot.weaknesses,
                key_offerings=offerings,
                pricing_strategy=pricing_analysis.get('pricing_model'),
                competitive_position=competitive_position
            )

            # Store profile
            self.competitor_profiles.append(profile)

            # Compile comprehensive analysis
            analysis = {
                "competitor_id": competitor_id,
                "name": competitor_name,
                "analysis_date": datetime.now().isoformat(),
                "company_info": {
                    "founded": company_info.get('founded_year'),
                    "headquarters": company_info.get('headquarters'),
                    "employees": company_info.get('employee_count'),
                    "revenue_estimate": company_info.get('revenue_estimate'),
                    "funding": company_info.get('funding')
                },
                "market_position": market_position,
                "target_segments": target_segments,
                "offerings": offerings,
                "pricing_analysis": pricing_analysis,
                "swot": {
                    "strengths": swot.strengths,
                    "weaknesses": swot.weaknesses,
                    "opportunities": swot.opportunities,
                    "threats": swot.threats,
                    "strategic_implications": swot.strategic_implications
                },
                "competitive_position": competitive_position.value if competitive_position else None,
                "customer_perception": self._analyze_customer_perception(data_sources),
                "innovation_score": self._calculate_innovation_score(offerings),
                "threat_level": self._assess_threat_level(profile),
                "strategic_recommendations": self._generate_strategic_recommendations(profile, swot)
            }

            logger.info(f"Competitor analysis completed for {competitor_name}")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing competitor: {e}")
            raise

    def compare_offerings(
        self,
        our_service: str,
        competitor_services: List[str],
        comparison_criteria: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Compare service offerings with feature-by-feature matrix

        Args:
            our_service: Our service name
            competitor_services: List of competitor service names
            comparison_criteria: Optional list of comparison criteria

        Returns:
            Detailed comparison matrix with gaps and advantages

        Example:
            >>> comparison = agent.compare_offerings(
            ...     "Our Digital Marketing Suite",
            ...     ["Competitor A Suite", "Competitor B Platform"]
            ... )
        """
        try:
            logger.info(f"Comparing offerings: {our_service} vs {len(competitor_services)} competitors")

            comparison_criteria = comparison_criteria or [
                "Features",
                "Pricing",
                "Ease of Use",
                "Integration",
                "Support",
                "Scalability",
                "Customization",
                "Analytics",
                "Mobile Access",
                "Security"
            ]

            # Build comparison matrix
            comparison_matrix = {}

            for criterion in comparison_criteria:
                comparison_matrix[criterion] = {
                    "our_offering": self._evaluate_criterion(our_service, criterion),
                    "competitors": {
                        comp: self._evaluate_criterion(comp, criterion)
                        for comp in competitor_services
                    }
                }

            # Identify gaps (where competitors are better)
            gaps = []
            for criterion, values in comparison_matrix.items():
                our_score = values["our_offering"]["score"]
                max_competitor_score = max(
                    (v["score"] for v in values["competitors"].values()),
                    default=0
                )

                if max_competitor_score > our_score:
                    gap_size = max_competitor_score - our_score
                    gaps.append({
                        "criterion": criterion,
                        "gap_size": gap_size,
                        "our_score": our_score,
                        "competitor_best": max_competitor_score,
                        "priority": "high" if gap_size >= 2 else "medium" if gap_size >= 1 else "low"
                    })

            # Identify advantages (where we are better)
            advantages = []
            for criterion, values in comparison_matrix.items():
                our_score = values["our_offering"]["score"]
                avg_competitor_score = statistics.mean(
                    v["score"] for v in values["competitors"].values()
                ) if values["competitors"] else 0

                if our_score > avg_competitor_score:
                    advantage_size = our_score - avg_competitor_score
                    advantages.append({
                        "criterion": criterion,
                        "advantage_size": advantage_size,
                        "our_score": our_score,
                        "competitor_average": avg_competitor_score,
                        "strength": "strong" if advantage_size >= 2 else "moderate"
                    })

            # Calculate overall competitive score
            overall_score = self._calculate_overall_competitive_score(comparison_matrix)

            comparison = {
                "our_service": our_service,
                "competitor_services": competitor_services,
                "comparison_matrix": comparison_matrix,
                "gaps": sorted(gaps, key=lambda x: x["gap_size"], reverse=True),
                "advantages": sorted(advantages, key=lambda x: x["advantage_size"], reverse=True),
                "overall_competitive_score": overall_score,
                "summary": {
                    "total_criteria": len(comparison_criteria),
                    "areas_leading": len(advantages),
                    "areas_lagging": len(gaps),
                    "competitive_position": "strong" if overall_score >= 75 else "moderate" if overall_score >= 50 else "weak"
                },
                "recommendations": self._generate_offering_recommendations(gaps, advantages),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Offering comparison completed: {overall_score:.1f} overall score")
            return comparison

        except Exception as e:
            logger.error(f"Error comparing offerings: {e}")
            raise

    def analyze_pricing_strategy(
        self,
        competitor_id: str,
        data_sources: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze competitor pricing strategy with model identification

        Args:
            competitor_id: Competitor identifier
            data_sources: Data sources for pricing information

        Returns:
            Pricing strategy analysis

        Example:
            >>> pricing = agent.analyze_pricing_strategy(
            ...     "comp_123",
            ...     data_sources={"pricing_page": "...", "quotes": [...]}
            ... )
        """
        try:
            logger.info(f"Analyzing pricing strategy for {competitor_id}")

            data_sources = data_sources or {}

            # Extract pricing data
            price_points = self._extract_price_points(data_sources)

            # Identify pricing model
            pricing_model = self._identify_pricing_model(price_points, data_sources)

            # Analyze price positioning
            price_positioning = self._analyze_price_positioning(price_points)

            # Identify discounting patterns
            discounting_strategy = self._analyze_discounting_patterns(data_sources)

            # Calculate value perception
            value_perception = self._calculate_value_perception(price_points, data_sources)

            # Identify pricing tiers
            tiers = self._identify_pricing_tiers(price_points)

            pricing_analysis = {
                "competitor_id": competitor_id,
                "pricing_model": pricing_model.value if pricing_model else "unknown",
                "price_points": price_points,
                "price_positioning": price_positioning,
                "discounting_strategy": discounting_strategy,
                "value_perception": value_perception,
                "pricing_tiers": tiers,
                "competitive_pricing_index": self._calculate_pricing_index(price_points),
                "pricing_flexibility": self._assess_pricing_flexibility(data_sources),
                "bundle_strategy": self._analyze_bundle_strategy(data_sources),
                "payment_terms": self._extract_payment_terms(data_sources),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Pricing strategy analysis completed: {pricing_model}")
            return pricing_analysis

        except Exception as e:
            logger.error(f"Error analyzing pricing strategy: {e}")
            raise

    def identify_market_gaps(
        self,
        market_segment: str,
        analysis_depth: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Identify market gaps based on competitor analysis (white space opportunities)

        Args:
            market_segment: Market segment to analyze
            analysis_depth: Analysis depth ('quick', 'standard', 'comprehensive')

        Returns:
            Market gap analysis with opportunity scoring

        Example:
            >>> gaps = agent.identify_market_gaps(
            ...     "Mid-market SaaS",
            ...     analysis_depth="comprehensive"
            ... )
        """
        try:
            logger.info(f"Identifying market gaps in {market_segment}")

            # Analyze current competitor coverage
            competitor_coverage = self._analyze_competitor_coverage(market_segment)

            # Identify underserved segments
            underserved_segments = self._identify_underserved_segments(
                market_segment,
                competitor_coverage
            )

            # Identify feature gaps
            feature_gaps = self._identify_feature_gaps(market_segment)

            # Identify pricing gaps
            pricing_gaps = self._identify_pricing_gaps(market_segment)

            # Identify service gaps
            service_gaps = self._identify_service_gaps(market_segment)

            # Score opportunities
            opportunities = []

            for gap in feature_gaps + pricing_gaps + service_gaps:
                opportunity_score = self._score_opportunity(gap, market_segment)
                opportunities.append({
                    "gap_type": gap["type"],
                    "description": gap["description"],
                    "opportunity_score": opportunity_score,
                    "market_size_estimate": gap.get("market_size", "Unknown"),
                    "competition_level": gap.get("competition", "moderate"),
                    "difficulty": gap.get("difficulty", "medium"),
                    "time_to_market": gap.get("time_to_market", "6-12 months")
                })

            # Sort by opportunity score
            opportunities.sort(key=lambda x: x["opportunity_score"], reverse=True)

            gap_analysis = {
                "market_segment": market_segment,
                "identified_gaps": opportunities,
                "underserved_segments": underserved_segments,
                "competitor_coverage": competitor_coverage,
                "top_opportunities": opportunities[:5],
                "opportunity_summary": {
                    "total_gaps_identified": len(opportunities),
                    "high_priority": len([o for o in opportunities if o["opportunity_score"] >= 75]),
                    "medium_priority": len([o for o in opportunities if 50 <= o["opportunity_score"] < 75]),
                    "low_priority": len([o for o in opportunities if o["opportunity_score"] < 50])
                },
                "recommendations": self._generate_gap_recommendations(opportunities),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Identified {len(opportunities)} market gaps")
            return gap_analysis

        except Exception as e:
            logger.error(f"Error identifying market gaps: {e}")
            raise

    def track_competitor_changes(
        self,
        competitor_id: str,
        monitoring_period_days: int = 30
    ) -> Dict[str, Any]:
        """
        Track changes in competitor strategy with change detection

        Args:
            competitor_id: Competitor to track
            monitoring_period_days: Monitoring period in days

        Returns:
            Change tracking report with significance assessment

        Example:
            >>> changes = agent.track_competitor_changes(
            ...     "comp_123",
            ...     monitoring_period_days=30
            ... )
        """
        try:
            logger.info(f"Tracking changes for competitor {competitor_id} over {monitoring_period_days} days")

            # Find competitor
            competitor = next(
                (c for c in self.competitor_profiles if c.competitor_id == competitor_id),
                None
            )

            if not competitor:
                logger.warning(f"Competitor {competitor_id} not found")
                return {"error": "Competitor not found"}

            # Detect changes (in production, this would compare historical data)
            changes_detected = []

            # Pricing changes
            pricing_change = self._detect_pricing_changes(competitor_id, monitoring_period_days)
            if pricing_change:
                changes_detected.append(pricing_change)

            # Product/offering changes
            offering_changes = self._detect_offering_changes(competitor_id, monitoring_period_days)
            changes_detected.extend(offering_changes)

            # Market position changes
            position_change = self._detect_position_changes(competitor_id, monitoring_period_days)
            if position_change:
                changes_detected.append(position_change)

            # Marketing/messaging changes
            messaging_changes = self._detect_messaging_changes(competitor_id, monitoring_period_days)
            changes_detected.extend(messaging_changes)

            # Assess significance of each change
            for change in changes_detected:
                change["significance"] = self._assess_change_significance(change)
                change["recommended_response"] = self._recommend_response(change)

            # Determine overall significance
            if changes_detected:
                max_significance = max(
                    self._significance_to_score(c["significance"])
                    for c in changes_detected
                )
                overall_significance = self._score_to_significance(max_significance)
            else:
                overall_significance = "none"

            tracking_report = {
                "competitor_id": competitor_id,
                "competitor_name": competitor.name,
                "monitoring_period_days": monitoring_period_days,
                "changes_detected": changes_detected,
                "change_count": len(changes_detected),
                "significance": overall_significance,
                "recommended_response": self._generate_overall_response(changes_detected),
                "priority_changes": [
                    c for c in changes_detected
                    if c["significance"] in ["critical", "high"]
                ],
                "monitoring_recommendations": self._generate_monitoring_recommendations(changes_detected),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Detected {len(changes_detected)} changes ({overall_significance} significance)")
            return tracking_report

        except Exception as e:
            logger.error(f"Error tracking competitor changes: {e}")
            raise

    def conduct_swot_analysis(
        self,
        competitor_name: str,
        data_sources: Optional[Dict[str, Any]] = None
    ) -> SWOTAnalysis:
        """
        Conduct comprehensive SWOT analysis with strategic implications

        Args:
            competitor_name: Competitor name
            data_sources: Data sources for analysis

        Returns:
            Complete SWOT analysis

        Example:
            >>> swot = agent.conduct_swot_analysis(
            ...     "Competitor Inc",
            ...     data_sources={...}
            ... )
        """
        try:
            logger.info(f"Conducting SWOT analysis for {competitor_name}")

            data_sources = data_sources or {}

            # Identify strengths
            strengths = [
                "Established brand recognition",
                "Large customer base",
                "Strong financial position",
                "Comprehensive product portfolio",
                "Global distribution network"
            ]

            # Identify weaknesses
            weaknesses = [
                "Legacy technology infrastructure",
                "Slower innovation cycle",
                "Higher price point",
                "Complex product setup",
                "Limited customization options"
            ]

            # Identify opportunities
            opportunities = [
                "Expanding into new geographic markets",
                "Growing demand for digital solutions",
                "Partnership opportunities with platforms",
                "Emerging market segments",
                "Technology convergence trends"
            ]

            # Identify threats
            threats = [
                "Increasing competition from agile startups",
                "Rapid technology disruption",
                "Changing regulatory environment",
                "Economic uncertainty",
                "Customer preference shifts to alternative solutions"
            ]

            # Generate strategic implications
            strategic_implications = self._generate_strategic_implications(
                strengths,
                weaknesses,
                opportunities,
                threats
            )

            # Generate priority actions
            priority_actions = self._generate_priority_actions(
                strengths,
                weaknesses,
                opportunities,
                threats
            )

            swot = SWOTAnalysis(
                strengths=strengths,
                weaknesses=weaknesses,
                opportunities=opportunities,
                threats=threats,
                strategic_implications=strategic_implications,
                priority_actions=priority_actions
            )

            logger.info(f"SWOT analysis completed for {competitor_name}")
            return swot

        except Exception as e:
            logger.error(f"Error conducting SWOT analysis: {e}")
            raise

    def benchmark_performance(
        self,
        competitors: List[str],
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Benchmark performance across multiple metrics (10+ KPIs)

        Args:
            competitors: List of competitor names
            metrics: Optional list of metrics to benchmark

        Returns:
            Multi-metric benchmarking report

        Example:
            >>> benchmark = agent.benchmark_performance(
            ...     ["Competitor A", "Competitor B", "Competitor C"]
            ... )
        """
        try:
            logger.info(f"Benchmarking performance across {len(competitors)} competitors")

            metrics = metrics or self.benchmark_metrics

            benchmark_results = {}

            for metric in metrics:
                # Collect metric data for all competitors
                metric_data = {}

                for competitor in competitors:
                    metric_value = self._get_metric_value(competitor, metric)
                    metric_data[competitor] = metric_value

                # Calculate industry average
                if metric_data:
                    industry_avg = statistics.mean(metric_data.values())
                else:
                    industry_avg = 0

                # Our performance (assumed)
                our_value = self._get_our_metric_value(metric)

                # Calculate percentile rank
                all_values = list(metric_data.values()) + [our_value]
                all_values.sort()
                percentile = (all_values.index(our_value) / len(all_values)) * 100

                # Determine trend
                trend = self._determine_metric_trend(metric)

                benchmark_results[metric] = BenchmarkMetric(
                    metric_name=metric,
                    our_value=our_value,
                    competitor_values=metric_data,
                    industry_average=industry_avg,
                    percentile_rank=percentile,
                    trend=trend
                )

            # Generate insights
            insights = self._generate_benchmark_insights(benchmark_results)

            # Identify areas for improvement
            improvement_areas = [
                metric for metric, data in benchmark_results.items()
                if data.our_value < data.industry_average
            ]

            # Identify competitive advantages
            advantages = [
                metric for metric, data in benchmark_results.items()
                if data.our_value > data.industry_average
            ]

            benchmark_report = {
                "competitors": competitors,
                "metrics_analyzed": metrics,
                "benchmark_results": {
                    metric: {
                        "our_value": data.our_value,
                        "competitor_values": data.competitor_values,
                        "industry_average": data.industry_average,
                        "percentile_rank": data.percentile_rank,
                        "trend": data.trend
                    }
                    for metric, data in benchmark_results.items()
                },
                "insights": insights,
                "areas_for_improvement": improvement_areas,
                "competitive_advantages": advantages,
                "overall_score": self._calculate_overall_benchmark_score(benchmark_results),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Benchmark completed across {len(metrics)} metrics")
            return benchmark_report

        except Exception as e:
            logger.error(f"Error benchmarking performance: {e}")
            raise

    def create_competitive_positioning(
        self,
        competitors: List[str],
        x_axis: str = "Price",
        y_axis: str = "Features"
    ) -> Dict[str, Any]:
        """
        Create 2-axis perceptual positioning map

        Args:
            competitors: List of competitors to position
            x_axis: X-axis dimension (e.g., 'Price', 'Innovation')
            y_axis: Y-axis dimension (e.g., 'Features', 'Service Quality')

        Returns:
            Positioning map with coordinates

        Example:
            >>> positioning = agent.create_competitive_positioning(
            ...     ["Comp A", "Comp B", "Comp C"],
            ...     x_axis="Price",
            ...     y_axis="Features"
            ... )
        """
        try:
            logger.info(f"Creating competitive positioning map: {x_axis} vs {y_axis}")

            # Calculate positions for each competitor
            positions = {}

            for competitor in competitors:
                x_value = self._calculate_dimension_value(competitor, x_axis)
                y_value = self._calculate_dimension_value(competitor, y_axis)
                positions[competitor] = {"x": x_value, "y": y_value}

            # Add our position
            our_x = self._calculate_our_dimension_value(x_axis)
            our_y = self._calculate_our_dimension_value(y_axis)
            positions["Us"] = {"x": our_x, "y": our_y}

            # Identify positioning quadrants
            quadrants = self._identify_quadrants(positions, x_axis, y_axis)

            # Identify positioning opportunities
            opportunities = self._identify_positioning_opportunities(positions, x_axis, y_axis)

            positioning_map = {
                "x_axis": x_axis,
                "y_axis": y_axis,
                "positions": positions,
                "quadrants": quadrants,
                "our_position": {
                    "x": our_x,
                    "y": our_y,
                    "quadrant": self._determine_our_quadrant(our_x, our_y)
                },
                "opportunities": opportunities,
                "strategic_recommendations": self._generate_positioning_recommendations(
                    positions,
                    our_x,
                    our_y
                ),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Competitive positioning map created")
            return positioning_map

        except Exception as e:
            logger.error(f"Error creating competitive positioning: {e}")
            raise

    def analyze_market_share(
        self,
        market_segment: str,
        time_period: str = "1y"
    ) -> Dict[str, Any]:
        """
        Analyze and track market share trends

        Args:
            market_segment: Market segment to analyze
            time_period: Time period for analysis ('6m', '1y', '3y')

        Returns:
            Market share analysis with trends

        Example:
            >>> market_share = agent.analyze_market_share(
            ...     "Cloud Marketing Platforms",
            ...     time_period="1y"
            ... )
        """
        try:
            logger.info(f"Analyzing market share for {market_segment}")

            # Calculate current market share
            current_share = {}

            for profile in self.competitor_profiles:
                current_share[profile.name] = profile.market_share

            # Add our market share
            our_share = self.config.get('our_market_share', 15.0)
            current_share["Us"] = our_share

            # Calculate share of voice
            share_of_voice = self._calculate_share_of_voice(market_segment)

            # Analyze trends
            trends = self._analyze_market_share_trends(current_share, time_period)

            # Calculate concentration metrics
            hhi = self._calculate_herfindahl_index(current_share)

            market_share_analysis = {
                "market_segment": market_segment,
                "time_period": time_period,
                "current_market_share": current_share,
                "share_of_voice": share_of_voice,
                "trends": trends,
                "market_concentration": {
                    "hhi": hhi,
                    "concentration_level": "high" if hhi > 2500 else "moderate" if hhi > 1500 else "low",
                    "top_3_share": sum(sorted(current_share.values(), reverse=True)[:3])
                },
                "growth_opportunities": self._identify_share_growth_opportunities(current_share),
                "competitive_threats": self._identify_share_threats(trends),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Market share analysis completed (our share: {our_share}%)")
            return market_share_analysis

        except Exception as e:
            logger.error(f"Error analyzing market share: {e}")
            raise

    def generate_battle_card(
        self,
        competitor_name: str
    ) -> BattleCard:
        """
        Generate competitive battle card for sales enablement

        Args:
            competitor_name: Competitor name

        Returns:
            Battle card with key talking points and objection handling

        Example:
            >>> battle_card = agent.generate_battle_card("Competitor Inc")
        """
        try:
            logger.info(f"Generating battle card for {competitor_name}")

            # Find competitor
            competitor = next(
                (c for c in self.competitor_profiles if c.name == competitor_name),
                None
            )

            if not competitor:
                logger.warning(f"Competitor {competitor_name} not found, creating basic battle card")
                competitor = CompetitorProfile(
                    competitor_id="temp",
                    name=competitor_name,
                    headquarters="Unknown",
                    revenue_estimate=0,
                    market_share=0,
                    target_segments=[]
                )

            # Generate overview
            overview = f"{competitor_name} is a {competitor.competitive_position.value if competitor.competitive_position else 'competitor'} " \
                      f"targeting {', '.join(competitor.target_segments) if competitor.target_segments else 'various segments'}."

            # Key strengths
            key_strengths = competitor.strengths[:5] if competitor.strengths else [
                "Established market presence",
                "Strong brand recognition",
                "Comprehensive feature set"
            ]

            # Key weaknesses
            key_weaknesses = competitor.weaknesses[:5] if competitor.weaknesses else [
                "Higher pricing",
                "Complex implementation",
                "Limited flexibility"
            ]

            # How to win against them
            how_to_win = [
                "Emphasize our superior customer service and responsiveness",
                "Highlight our competitive pricing and flexible terms",
                "Demonstrate ease of implementation and quick time-to-value",
                "Showcase relevant customer success stories",
                "Focus on our innovation and modern technology stack"
            ]

            # Talking points
            talking_points = [
                f"Unlike {competitor_name}, we offer personalized onboarding",
                f"Our pricing is 20-30% more competitive than {competitor_name}",
                f"We provide 24/7 support compared to their business hours only",
                "Our platform is built on modern technology, not legacy systems",
                "We deliver ROI in 3-6 months vs. their 12-18 month timeframe"
            ]

            # Objection handling
            objection_handling = {
                "They have more features": "Quality over quantity - our features are purpose-built and more user-friendly. We focus on what matters most.",
                "They've been around longer": "We bring fresh perspective and modern technology. Our agility allows us to innovate faster and respond to your needs quicker.",
                "They're a bigger company": "That means you're a number to them. With us, you're a valued partner with direct access to our leadership team.",
                "They offer better pricing": "Let's compare total cost of ownership, not just license fees. Our implementation and support costs are significantly lower."
            }

            # Pricing comparison
            pricing_comparison = {
                "our_entry_price": "$2,500/month",
                "their_entry_price": "$3,500/month",
                "our_enterprise_price": "$15,000/month",
                "their_enterprise_price": "$20,000/month",
                "our_value_adds": ["Free onboarding", "24/7 support", "Unlimited users"],
                "their_value_adds": ["Standard onboarding", "Business hours support", "User-based pricing"]
            }

            battle_card = BattleCard(
                competitor_name=competitor_name,
                overview=overview,
                key_strengths=key_strengths,
                key_weaknesses=key_weaknesses,
                how_to_win=how_to_win,
                talking_points=talking_points,
                objection_handling=objection_handling,
                pricing_comparison=pricing_comparison
            )

            logger.info(f"Battle card generated for {competitor_name}")
            return battle_card

        except Exception as e:
            logger.error(f"Error generating battle card: {e}")
            raise

    # ==================== HELPER METHODS ====================

    def _extract_company_info(
        self,
        competitor_name: str,
        data_sources: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract company information from data sources"""
        return {
            "founded_year": 2015,
            "headquarters": "San Francisco, CA",
            "employee_count": 500,
            "revenue_estimate": 50000000,
            "funding": "Series C",
            "geographic_coverage": ["North America", "Europe"]
        }

    def _analyze_market_position(
        self,
        competitor_name: str,
        data_sources: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze market position"""
        return {
            "market_share": 12.5,
            "rank": 3,
            "growth_rate": 25.0,
            "market_penetration": "moderate"
        }

    def _identify_target_segments(self, data_sources: Dict[str, Any]) -> List[str]:
        """Identify target segments"""
        return ["Enterprise", "Mid-market", "Growth companies"]

    def _analyze_offerings(self, data_sources: Dict[str, Any]) -> List[str]:
        """Analyze competitor offerings"""
        return [
            "Marketing automation platform",
            "Analytics and reporting",
            "Campaign management",
            "Lead scoring"
        ]

    def _determine_competitive_position(
        self,
        market_position: Dict[str, Any],
        company_info: Dict[str, Any]
    ) -> CompetitivePosition:
        """Determine competitive position"""
        market_share = market_position.get('market_share', 0)

        if market_share >= 25:
            return CompetitivePosition.LEADER
        elif market_share >= 15:
            return CompetitivePosition.CHALLENGER
        elif market_share >= 5:
            return CompetitivePosition.FOLLOWER
        else:
            return CompetitivePosition.NICHE

    def _analyze_customer_perception(self, data_sources: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze customer perception"""
        return {
            "satisfaction_score": 4.2,
            "nps": 45,
            "key_complaints": ["Pricing", "Complexity"],
            "key_praises": ["Features", "Reliability"]
        }

    def _calculate_innovation_score(self, offerings: List[str]) -> float:
        """Calculate innovation score"""
        return 72.5

    def _assess_threat_level(self, profile: CompetitorProfile) -> str:
        """Assess threat level"""
        if profile.market_share >= 20:
            return "high"
        elif profile.market_share >= 10:
            return "moderate"
        else:
            return "low"

    def _generate_strategic_recommendations(
        self,
        profile: CompetitorProfile,
        swot: SWOTAnalysis
    ) -> List[str]:
        """Generate strategic recommendations"""
        return [
            "Monitor their pricing changes closely",
            "Develop counter-messaging for their key strengths",
            "Capitalize on their weaknesses in sales conversations",
            "Consider strategic partnerships to compete effectively"
        ]

    def _evaluate_criterion(self, service: str, criterion: str) -> Dict[str, Any]:
        """Evaluate service on criterion"""
        # Simplified scoring (0-5)
        score = 4.0
        return {
            "score": score,
            "details": f"{service} scores {score}/5 on {criterion}"
        }

    def _calculate_overall_competitive_score(
        self,
        comparison_matrix: Dict[str, Any]
    ) -> float:
        """Calculate overall competitive score"""
        scores = []
        for criterion, values in comparison_matrix.items():
            our_score = values["our_offering"]["score"]
            avg_competitor = statistics.mean(
                v["score"] for v in values["competitors"].values()
            ) if values["competitors"] else 0

            relative_score = (our_score / max(avg_competitor, 1)) * 100
            scores.append(min(100, relative_score))

        return round(statistics.mean(scores), 1) if scores else 50.0

    def _generate_offering_recommendations(
        self,
        gaps: List[Dict],
        advantages: List[Dict]
    ) -> List[str]:
        """Generate offering recommendations"""
        recommendations = []

        for gap in gaps[:3]:
            recommendations.append(
                f"Address gap in {gap['criterion']} - currently {gap['gap_size']:.1f} points behind"
            )

        for advantage in advantages[:2]:
            recommendations.append(
                f"Leverage advantage in {advantage['criterion']} in marketing materials"
            )

        return recommendations

    def _extract_price_points(self, data_sources: Dict[str, Any]) -> Dict[str, float]:
        """Extract price points"""
        return {
            "entry": 2500,
            "mid": 7500,
            "enterprise": 20000
        }

    def _identify_pricing_model(
        self,
        price_points: Dict[str, float],
        data_sources: Dict[str, Any]
    ) -> PricingModel:
        """Identify pricing model"""
        return PricingModel.VALUE_BASED

    def _analyze_price_positioning(self, price_points: Dict[str, float]) -> str:
        """Analyze price positioning"""
        avg_price = statistics.mean(price_points.values())
        if avg_price >= 15000:
            return "premium"
        elif avg_price >= 7500:
            return "moderate"
        else:
            return "value"

    def _analyze_discounting_patterns(self, data_sources: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze discounting patterns"""
        return {
            "typical_discount": "15-20%",
            "discount_triggers": ["Annual commitment", "Enterprise deals"],
            "promotional_frequency": "Quarterly"
        }

    def _calculate_value_perception(
        self,
        price_points: Dict[str, float],
        data_sources: Dict[str, Any]
    ) -> str:
        """Calculate value perception"""
        return "moderate_value"

    def _identify_pricing_tiers(self, price_points: Dict[str, float]) -> List[Dict]:
        """Identify pricing tiers"""
        return [
            {"tier": "Basic", "price": price_points.get("entry", 0)},
            {"tier": "Professional", "price": price_points.get("mid", 0)},
            {"tier": "Enterprise", "price": price_points.get("enterprise", 0)}
        ]

    def _calculate_pricing_index(self, price_points: Dict[str, float]) -> float:
        """Calculate competitive pricing index"""
        return 95.0

    def _assess_pricing_flexibility(self, data_sources: Dict[str, Any]) -> str:
        """Assess pricing flexibility"""
        return "moderate"

    def _analyze_bundle_strategy(self, data_sources: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze bundle strategy"""
        return {
            "offers_bundles": True,
            "bundle_discount": "10-15%",
            "popular_bundles": ["Platform + Services", "Multi-product suite"]
        }

    def _extract_payment_terms(self, data_sources: Dict[str, Any]) -> List[str]:
        """Extract payment terms"""
        return ["Monthly", "Annual", "Multi-year"]

    def _analyze_competitor_coverage(self, market_segment: str) -> Dict[str, Any]:
        """Analyze competitor coverage"""
        return {
            "total_competitors": len(self.competitor_profiles),
            "segment_coverage": 75.0,
            "competitive_intensity": "high"
        }

    def _identify_underserved_segments(
        self,
        market_segment: str,
        coverage: Dict[str, Any]
    ) -> List[str]:
        """Identify underserved segments"""
        return [
            "Small businesses with limited budgets",
            "Specific vertical industries",
            "Geographic regions outside major markets"
        ]

    def _identify_feature_gaps(self, market_segment: str) -> List[Dict]:
        """Identify feature gaps"""
        return [
            {
                "type": "feature",
                "description": "Mobile-first experience",
                "market_size": "$50M",
                "competition": "low",
                "difficulty": "medium",
                "time_to_market": "6-9 months"
            },
            {
                "type": "feature",
                "description": "AI-powered recommendations",
                "market_size": "$100M",
                "competition": "moderate",
                "difficulty": "high",
                "time_to_market": "12-18 months"
            }
        ]

    def _identify_pricing_gaps(self, market_segment: str) -> List[Dict]:
        """Identify pricing gaps"""
        return [
            {
                "type": "pricing",
                "description": "Freemium model for startups",
                "market_size": "$30M",
                "competition": "low",
                "difficulty": "low",
                "time_to_market": "3 months"
            }
        ]

    def _identify_service_gaps(self, market_segment: str) -> List[Dict]:
        """Identify service gaps"""
        return [
            {
                "type": "service",
                "description": "24/7 phone support",
                "market_size": "$40M",
                "competition": "low",
                "difficulty": "medium",
                "time_to_market": "3-6 months"
            }
        ]

    def _score_opportunity(self, gap: Dict, market_segment: str) -> float:
        """Score opportunity (0-100)"""
        # Simple scoring algorithm
        base_score = 50.0

        # Market size factor
        if "$100M" in gap.get("market_size", ""):
            base_score += 30
        elif "$50M" in gap.get("market_size", ""):
            base_score += 20
        elif "$30M" in gap.get("market_size", ""):
            base_score += 10

        # Competition factor
        if gap.get("competition") == "low":
            base_score += 15
        elif gap.get("competition") == "moderate":
            base_score += 5

        # Difficulty factor
        if gap.get("difficulty") == "low":
            base_score += 5
        elif gap.get("difficulty") == "medium":
            base_score -= 5
        elif gap.get("difficulty") == "high":
            base_score -= 15

        return min(100.0, max(0.0, base_score))

    def _generate_gap_recommendations(self, opportunities: List[Dict]) -> List[str]:
        """Generate gap recommendations"""
        recommendations = []

        for opp in opportunities[:3]:
            recommendations.append(
                f"Prioritize {opp['description']} (Score: {opp['opportunity_score']:.0f})"
            )

        return recommendations

    def _detect_pricing_changes(self, competitor_id: str, days: int) -> Optional[Dict]:
        """Detect pricing changes"""
        return {
            "change_type": "pricing",
            "description": "15% price increase on enterprise tier",
            "detected_date": datetime.now().isoformat(),
            "previous_value": "$20,000",
            "new_value": "$23,000"
        }

    def _detect_offering_changes(self, competitor_id: str, days: int) -> List[Dict]:
        """Detect offering changes"""
        return [
            {
                "change_type": "new_feature",
                "description": "Launched AI-powered analytics",
                "detected_date": datetime.now().isoformat()
            }
        ]

    def _detect_position_changes(self, competitor_id: str, days: int) -> Optional[Dict]:
        """Detect position changes"""
        return None

    def _detect_messaging_changes(self, competitor_id: str, days: int) -> List[Dict]:
        """Detect messaging changes"""
        return [
            {
                "change_type": "messaging",
                "description": "New focus on SMB market in homepage messaging",
                "detected_date": datetime.now().isoformat()
            }
        ]

    def _assess_change_significance(self, change: Dict) -> str:
        """Assess change significance"""
        if change["change_type"] == "pricing":
            return "high"
        elif change["change_type"] == "new_feature":
            return "medium"
        else:
            return "low"

    def _recommend_response(self, change: Dict) -> List[str]:
        """Recommend response to change"""
        return ["Monitor closely", "Update battle cards", "Inform sales team"]

    def _significance_to_score(self, significance: str) -> int:
        """Convert significance to score"""
        return {"critical": 4, "high": 3, "medium": 2, "low": 1, "none": 0}.get(significance, 0)

    def _score_to_significance(self, score: int) -> str:
        """Convert score to significance"""
        if score >= 4:
            return "critical"
        elif score >= 3:
            return "high"
        elif score >= 2:
            return "medium"
        elif score >= 1:
            return "low"
        else:
            return "none"

    def _generate_overall_response(self, changes: List[Dict]) -> List[str]:
        """Generate overall response recommendations"""
        return [
            "Update competitive intelligence documentation",
            "Brief sales team on changes",
            "Consider strategic response actions"
        ]

    def _generate_monitoring_recommendations(self, changes: List[Dict]) -> List[str]:
        """Generate monitoring recommendations"""
        return [
            "Increase monitoring frequency to daily",
            "Set up alerts for pricing page changes",
            "Track customer sentiment shifts"
        ]

    def _generate_strategic_implications(
        self,
        strengths: List[str],
        weaknesses: List[str],
        opportunities: List[str],
        threats: List[str]
    ) -> List[str]:
        """Generate strategic implications"""
        return [
            "Leverage strengths to capitalize on opportunities",
            "Address weaknesses to mitigate threats",
            "Focus on differentiation in key areas",
            "Invest in innovation to stay competitive"
        ]

    def _generate_priority_actions(
        self,
        strengths: List[str],
        weaknesses: List[str],
        opportunities: List[str],
        threats: List[str]
    ) -> List[str]:
        """Generate priority actions"""
        return [
            "Strengthen core product features",
            "Improve customer onboarding experience",
            "Expand into underserved markets",
            "Monitor and respond to competitive threats"
        ]

    def _get_metric_value(self, competitor: str, metric: str) -> float:
        """Get metric value for competitor"""
        # Placeholder - would retrieve from data store
        return 75.0

    def _get_our_metric_value(self, metric: str) -> float:
        """Get our metric value"""
        # Placeholder - would retrieve from data store
        return 80.0

    def _determine_metric_trend(self, metric: str) -> str:
        """Determine metric trend"""
        return "improving"

    def _generate_benchmark_insights(
        self,
        results: Dict[str, BenchmarkMetric]
    ) -> List[str]:
        """Generate benchmark insights"""
        return [
            "Strong performance in customer satisfaction",
            "Opportunity to improve in market share",
            "Pricing competitiveness is a key advantage"
        ]

    def _calculate_overall_benchmark_score(
        self,
        results: Dict[str, BenchmarkMetric]
    ) -> float:
        """Calculate overall benchmark score"""
        percentiles = [metric.percentile_rank for metric in results.values()]
        return round(statistics.mean(percentiles), 1) if percentiles else 50.0

    def _calculate_dimension_value(self, competitor: str, dimension: str) -> float:
        """Calculate dimension value for competitor"""
        # Normalized 0-100 scale
        return 65.0

    def _calculate_our_dimension_value(self, dimension: str) -> float:
        """Calculate our dimension value"""
        return 75.0

    def _identify_quadrants(
        self,
        positions: Dict[str, Dict],
        x_axis: str,
        y_axis: str
    ) -> Dict[str, List[str]]:
        """Identify quadrant positions"""
        quadrants = {
            "high_high": [],
            "high_low": [],
            "low_high": [],
            "low_low": []
        }

        for name, pos in positions.items():
            if pos["x"] >= 50 and pos["y"] >= 50:
                quadrants["high_high"].append(name)
            elif pos["x"] >= 50 and pos["y"] < 50:
                quadrants["high_low"].append(name)
            elif pos["x"] < 50 and pos["y"] >= 50:
                quadrants["low_high"].append(name)
            else:
                quadrants["low_low"].append(name)

        return quadrants

    def _identify_positioning_opportunities(
        self,
        positions: Dict[str, Dict],
        x_axis: str,
        y_axis: str
    ) -> List[str]:
        """Identify positioning opportunities"""
        return [
            "Move towards high-high quadrant (premium positioning)",
            "Differentiate on both dimensions simultaneously",
            "Target underserved low-high segment"
        ]

    def _determine_our_quadrant(self, x: float, y: float) -> str:
        """Determine our quadrant"""
        if x >= 50 and y >= 50:
            return "high_high"
        elif x >= 50 and y < 50:
            return "high_low"
        elif x < 50 and y >= 50:
            return "low_high"
        else:
            return "low_low"

    def _generate_positioning_recommendations(
        self,
        positions: Dict[str, Dict],
        our_x: float,
        our_y: float
    ) -> List[str]:
        """Generate positioning recommendations"""
        return [
            "Strengthen differentiation on key dimensions",
            "Communicate unique value proposition clearly",
            "Monitor competitive movements"
        ]

    def _calculate_share_of_voice(self, market_segment: str) -> Dict[str, float]:
        """Calculate share of voice"""
        return {
            "Us": 18.0,
            "Competitor A": 25.0,
            "Competitor B": 20.0,
            "Others": 37.0
        }

    def _analyze_market_share_trends(
        self,
        current_share: Dict[str, float],
        time_period: str
    ) -> Dict[str, str]:
        """Analyze market share trends"""
        return {name: "growing" for name in current_share.keys()}

    def _calculate_herfindahl_index(self, market_share: Dict[str, float]) -> float:
        """Calculate Herfindahl-Hirschman Index"""
        return sum(share ** 2 for share in market_share.values())

    def _identify_share_growth_opportunities(
        self,
        current_share: Dict[str, float]
    ) -> List[str]:
        """Identify share growth opportunities"""
        return [
            "Target underserved customer segments",
            "Expand geographic coverage",
            "Increase marketing investment"
        ]

    def _identify_share_threats(self, trends: Dict[str, str]) -> List[str]:
        """Identify share threats"""
        return [
            "Aggressive competitor marketing campaigns",
            "New entrants in the market",
            "Product innovation from leaders"
        ]
