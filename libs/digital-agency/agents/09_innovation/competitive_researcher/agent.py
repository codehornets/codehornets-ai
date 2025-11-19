"""
Competitive Researcher Agent - Innovation Scout

Monitors competitive landscape, identifies innovation trends, tracks technology radar,
and collects weak signals for strategic innovation opportunities.

This agent serves as the Innovation Scout role, implementing:
- Trend detection and pattern recognition
- Technology radar mapping (Thoughtworks-style)
- Weak signal collection and amplification
- Competitive intelligence gathering
- Innovation horizon scanning (H1, H2, H3)
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import hashlib
import json
import re
from collections import defaultdict, Counter


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TrendMaturity(Enum):
    """Trend maturity stages"""
    EMERGING = "emerging"
    GROWING = "growing"
    MAINSTREAM = "mainstream"
    DECLINING = "declining"
    OBSOLETE = "obsolete"


class TechnologyQuadrant(Enum):
    """Technology Radar quadrants (Thoughtworks-inspired)"""
    TECHNIQUES = "techniques"
    PLATFORMS = "platforms"
    TOOLS = "tools"
    LANGUAGES_FRAMEWORKS = "languages_frameworks"


class RadarRing(Enum):
    """Technology Radar rings"""
    ADOPT = "adopt"
    TRIAL = "trial"
    ASSESS = "assess"
    HOLD = "hold"


class InnovationHorizon(Enum):
    """McKinsey Three Horizons model"""
    H1_CORE = "h1_core"  # Current core business
    H2_EMERGING = "h2_emerging"  # Emerging opportunities
    H3_FUTURE = "h3_future"  # Future transformational bets


class SignalStrength(Enum):
    """Weak signal strength classification"""
    VERY_WEAK = 1
    WEAK = 2
    MODERATE = 3
    STRONG = 4
    VERY_STRONG = 5


@dataclass
class WeakSignal:
    """Represents a weak signal of emerging change"""
    signal_id: str
    title: str
    description: str
    source: str
    detected_at: datetime
    strength: SignalStrength
    relevance_score: float
    category: str
    tags: List[str] = field(default_factory=list)
    related_signals: List[str] = field(default_factory=list)
    verification_status: str = "unverified"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signal_id": self.signal_id,
            "title": self.title,
            "description": self.description,
            "source": self.source,
            "detected_at": self.detected_at.isoformat(),
            "strength": self.strength.value,
            "relevance_score": self.relevance_score,
            "category": self.category,
            "tags": self.tags,
            "related_signals": self.related_signals,
            "verification_status": self.verification_status
        }


@dataclass
class TechnologyRadarItem:
    """Technology radar item"""
    item_id: str
    name: str
    quadrant: TechnologyQuadrant
    ring: RadarRing
    description: str
    rationale: str
    first_seen: datetime
    last_updated: datetime
    movement: str = "new"  # new, moved_in, moved_out, no_change
    impact_assessment: Dict[str, Any] = field(default_factory=dict)
    adoption_barriers: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "item_id": self.item_id,
            "name": self.name,
            "quadrant": self.quadrant.value,
            "ring": self.ring.value,
            "description": self.description,
            "rationale": self.rationale,
            "first_seen": self.first_seen.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "movement": self.movement,
            "impact_assessment": self.impact_assessment,
            "adoption_barriers": self.adoption_barriers
        }


@dataclass
class InnovationTrend:
    """Innovation trend with comprehensive tracking"""
    trend_id: str
    name: str
    category: str
    maturity: TrendMaturity
    horizon: InnovationHorizon
    description: str
    first_detected: datetime
    momentum_score: float
    impact_score: float
    adoption_rate: float
    key_players: List[str] = field(default_factory=list)
    technologies: List[str] = field(default_factory=list)
    use_cases: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trend_id": self.trend_id,
            "name": self.name,
            "category": self.category,
            "maturity": self.maturity.value,
            "horizon": self.horizon.value,
            "description": self.description,
            "first_detected": self.first_detected.isoformat(),
            "momentum_score": self.momentum_score,
            "impact_score": self.impact_score,
            "adoption_rate": self.adoption_rate,
            "key_players": self.key_players,
            "technologies": self.technologies,
            "use_cases": self.use_cases,
            "metrics": self.metrics
        }


class CompetitiveResearcherAgent:
    """
    Competitive Researcher Agent - Innovation Scout

    Responsible for:
    - Innovation trend monitoring and detection
    - Technology radar management
    - Weak signal collection and amplification
    - Competitive intelligence gathering
    - Horizon scanning (H1, H2, H3)
    - Pattern recognition in innovation landscape

    Attributes:
        agent_id (str): Unique identifier for the agent
        config (Dict[str, Any]): Agent configuration parameters
        trends (Dict[str, InnovationTrend]): Tracked innovation trends
        radar_items (Dict[str, TechnologyRadarItem]): Technology radar items
        weak_signals (Dict[str, WeakSignal]): Collected weak signals
        competitors (Dict[str, Dict]): Competitor profiles
        history (List[Dict]): Operation history
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Competitive Researcher / Innovation Scout Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "innovation_scout_001"
        self.config = config or {}
        self.name = "Innovation Scout"
        self.role = "Innovation Trend Monitoring & Technology Radar"

        # Core data structures
        self.trends: Dict[str, InnovationTrend] = {}
        self.radar_items: Dict[str, TechnologyRadarItem] = {}
        self.weak_signals: Dict[str, WeakSignal] = {}
        self.competitors: Dict[str, Dict[str, Any]] = {}
        self.history: List[Dict[str, Any]] = []

        # Analytics
        self.signal_patterns: Dict[str, List[str]] = defaultdict(list)
        self.trend_clusters: Dict[str, Set[str]] = defaultdict(set)

        # Configuration
        self.signal_threshold = self.config.get("signal_threshold", 0.6)
        self.trend_update_interval = self.config.get("trend_update_interval", 7)  # days
        self.radar_update_frequency = self.config.get("radar_update_frequency", 90)  # days

        logger.info(f"Initialized {self.name} agent with ID: {self.agent_id}")

    def detect_trend(
        self,
        trend_data: Dict[str, Any],
        sources: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Detect and analyze innovation trends from multiple sources.

        Args:
            trend_data: Raw trend data containing signals and indicators
            sources: List of data sources for trend detection

        Returns:
            Dictionary containing trend detection results
        """
        try:
            logger.info("Starting trend detection analysis")

            # Extract trend characteristics
            trend_name = trend_data.get("name", "")
            category = trend_data.get("category", "technology")
            signals = trend_data.get("signals", [])

            if not trend_name:
                raise ValueError("Trend name is required")

            # Calculate trend scores
            momentum_score = self._calculate_momentum(signals)
            impact_score = self._calculate_impact(trend_data)
            adoption_rate = self._estimate_adoption_rate(signals)

            # Determine maturity and horizon
            maturity = self._assess_maturity(momentum_score, adoption_rate)
            horizon = self._classify_horizon(maturity, impact_score)

            # Create trend ID
            trend_id = self._generate_id(f"{trend_name}_{category}")

            # Create trend object
            trend = InnovationTrend(
                trend_id=trend_id,
                name=trend_name,
                category=category,
                maturity=maturity,
                horizon=horizon,
                description=trend_data.get("description", ""),
                first_detected=datetime.now(),
                momentum_score=momentum_score,
                impact_score=impact_score,
                adoption_rate=adoption_rate,
                key_players=trend_data.get("key_players", []),
                technologies=trend_data.get("technologies", []),
                use_cases=trend_data.get("use_cases", []),
                metrics={
                    "signal_count": len(signals),
                    "source_count": len(sources) if sources else 0,
                    "confidence": self._calculate_confidence(signals)
                }
            )

            # Store trend
            self.trends[trend_id] = trend

            # Update clusters
            self._update_trend_clusters(trend)

            # Log operation
            operation = {
                "operation": "detect_trend",
                "trend_id": trend_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "metrics": {
                    "momentum": momentum_score,
                    "impact": impact_score,
                    "adoption": adoption_rate
                }
            }
            self.history.append(operation)

            logger.info(f"Detected trend: {trend_name} (ID: {trend_id})")

            return {
                "status": "success",
                "trend_id": trend_id,
                "trend": trend.to_dict(),
                "analysis": {
                    "maturity_stage": maturity.value,
                    "innovation_horizon": horizon.value,
                    "momentum_score": momentum_score,
                    "impact_score": impact_score,
                    "adoption_rate": adoption_rate,
                    "confidence": trend.metrics["confidence"]
                },
                "recommendations": self._generate_trend_recommendations(trend),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error detecting trend: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def manage_technology_radar(
        self,
        action: str,
        item_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Manage technology radar items (add, update, move).

        Args:
            action: Action to perform (add, update, move, remove, get_radar)
            item_data: Technology item data

        Returns:
            Dictionary containing radar management results
        """
        try:
            logger.info(f"Managing technology radar: {action}")

            if action == "add":
                return self._add_radar_item(item_data)
            elif action == "update":
                return self._update_radar_item(item_data)
            elif action == "move":
                return self._move_radar_item(item_data)
            elif action == "remove":
                return self._remove_radar_item(item_data)
            elif action == "get_radar":
                return self._get_complete_radar()
            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            logger.error(f"Error managing technology radar: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def collect_weak_signal(
        self,
        signal_data: Dict[str, Any],
        auto_verify: bool = False
    ) -> Dict[str, Any]:
        """
        Collect and analyze weak signals of emerging change.

        Args:
            signal_data: Weak signal data
            auto_verify: Whether to automatically verify signal

        Returns:
            Dictionary containing signal collection results
        """
        try:
            logger.info("Collecting weak signal")

            # Validate signal data
            required_fields = ["title", "description", "source"]
            for field in required_fields:
                if field not in signal_data:
                    raise ValueError(f"Missing required field: {field}")

            # Calculate signal characteristics
            strength = self._assess_signal_strength(signal_data)
            relevance = self._calculate_signal_relevance(signal_data)

            # Generate signal ID
            signal_id = self._generate_id(f"{signal_data['title']}_{signal_data['source']}")

            # Create signal object
            signal = WeakSignal(
                signal_id=signal_id,
                title=signal_data["title"],
                description=signal_data["description"],
                source=signal_data["source"],
                detected_at=datetime.now(),
                strength=strength,
                relevance_score=relevance,
                category=signal_data.get("category", "unknown"),
                tags=signal_data.get("tags", []),
                verification_status="verified" if auto_verify else "unverified"
            )

            # Store signal
            self.weak_signals[signal_id] = signal

            # Pattern analysis
            patterns = self._analyze_signal_patterns(signal)

            # Find related signals
            related = self._find_related_signals(signal)
            signal.related_signals = related

            # Check if signal amplification is needed
            amplification = self._check_amplification_needed(signal, patterns)

            # Log operation
            operation = {
                "operation": "collect_weak_signal",
                "signal_id": signal_id,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Collected weak signal: {signal.title} (Strength: {strength.name})")

            return {
                "status": "success",
                "signal_id": signal_id,
                "signal": signal.to_dict(),
                "analysis": {
                    "strength": strength.name,
                    "relevance_score": relevance,
                    "patterns_detected": patterns,
                    "related_signals": related,
                    "amplification_needed": amplification
                },
                "recommendations": self._generate_signal_recommendations(signal),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error collecting weak signal: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def monitor_competitors(
        self,
        competitors: List[str],
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Monitor competitor activities and innovation initiatives.

        Args:
            competitors: List of competitor names/IDs
            focus_areas: Specific areas to monitor

        Returns:
            Dictionary containing competitive intelligence
        """
        try:
            logger.info(f"Monitoring {len(competitors)} competitors")

            focus_areas = focus_areas or [
                "product_innovation",
                "technology_adoption",
                "market_expansion",
                "partnerships",
                "investment"
            ]

            intelligence = {}

            for competitor in competitors:
                comp_id = self._generate_id(competitor)

                # Get or create competitor profile
                if comp_id not in self.competitors:
                    self.competitors[comp_id] = {
                        "name": competitor,
                        "created_at": datetime.now().isoformat(),
                        "activities": [],
                        "innovations": [],
                        "strengths": [],
                        "weaknesses": []
                    }

                # Analyze competitor activities
                analysis = self._analyze_competitor(comp_id, focus_areas)

                intelligence[competitor] = analysis

            # Comparative analysis
            comparative = self._comparative_analysis(intelligence)

            # Identify threats and opportunities
            threats = self._identify_threats(intelligence)
            opportunities = self._identify_opportunities(intelligence)

            # Log operation
            operation = {
                "operation": "monitor_competitors",
                "competitor_count": len(competitors),
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info(f"Completed competitor monitoring for {len(competitors)} competitors")

            return {
                "status": "success",
                "competitor_intelligence": intelligence,
                "comparative_analysis": comparative,
                "threats": threats,
                "opportunities": opportunities,
                "summary": {
                    "total_competitors": len(competitors),
                    "focus_areas": focus_areas,
                    "threats_identified": len(threats),
                    "opportunities_identified": len(opportunities)
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error monitoring competitors: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def scan_innovation_horizons(
        self,
        time_frames: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        """
        Scan innovation horizons (H1, H2, H3) for strategic planning.

        Args:
            time_frames: Custom time frames for horizons (months)

        Returns:
            Dictionary containing horizon scan results
        """
        try:
            logger.info("Scanning innovation horizons")

            # Default time frames (in months)
            time_frames = time_frames or {
                "h1": 12,  # 0-12 months
                "h2": 36,  # 12-36 months
                "h3": 60   # 36-60 months
            }

            horizons = {
                "h1_core": {
                    "timeframe": f"0-{time_frames['h1']} months",
                    "focus": "Core business optimization",
                    "trends": [],
                    "technologies": [],
                    "opportunities": []
                },
                "h2_emerging": {
                    "timeframe": f"{time_frames['h1']}-{time_frames['h2']} months",
                    "focus": "Emerging business opportunities",
                    "trends": [],
                    "technologies": [],
                    "opportunities": []
                },
                "h3_future": {
                    "timeframe": f"{time_frames['h2']}-{time_frames['h3']} months",
                    "focus": "Future transformational bets",
                    "trends": [],
                    "technologies": [],
                    "opportunities": []
                }
            }

            # Classify trends by horizon
            for trend in self.trends.values():
                horizon_key = trend.horizon.value
                if horizon_key in horizons:
                    horizons[horizon_key]["trends"].append(trend.to_dict())

            # Classify radar items by horizon
            for item in self.radar_items.values():
                horizon_key = self._map_radar_to_horizon(item)
                if horizon_key in horizons:
                    horizons[horizon_key]["technologies"].append(item.to_dict())

            # Identify opportunities per horizon
            for horizon_key in horizons.keys():
                horizons[horizon_key]["opportunities"] = self._identify_horizon_opportunities(
                    horizon_key,
                    horizons[horizon_key]
                )

            # Generate strategic recommendations
            recommendations = self._generate_horizon_recommendations(horizons)

            # Resource allocation suggestions
            allocation = self._suggest_resource_allocation(horizons)

            # Log operation
            operation = {
                "operation": "scan_innovation_horizons",
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            logger.info("Completed innovation horizons scan")

            return {
                "status": "success",
                "horizons": horizons,
                "recommendations": recommendations,
                "resource_allocation": allocation,
                "summary": {
                    "h1_items": len(horizons["h1_core"]["trends"]) + len(horizons["h1_core"]["technologies"]),
                    "h2_items": len(horizons["h2_emerging"]["trends"]) + len(horizons["h2_emerging"]["technologies"]),
                    "h3_items": len(horizons["h3_future"]["trends"]) + len(horizons["h3_future"]["technologies"]),
                    "total_opportunities": sum(len(h["opportunities"]) for h in horizons.values())
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error scanning innovation horizons: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def analyze_trends(
        self,
        market_segment: str,
        analysis_depth: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Analyze competitive trends in a specific market segment.

        Args:
            market_segment: Market segment to analyze
            analysis_depth: Analysis depth (quick, standard, comprehensive)

        Returns:
            Dictionary containing trend analysis results
        """
        try:
            logger.info(f"Analyzing trends for market segment: {market_segment}")

            # Filter trends by market segment
            relevant_trends = [
                trend for trend in self.trends.values()
                if market_segment.lower() in trend.category.lower() or
                market_segment.lower() in trend.name.lower()
            ]

            if not relevant_trends:
                logger.warning(f"No trends found for market segment: {market_segment}")
                relevant_trends = list(self.trends.values())[:5]  # Get top 5 trends

            # Perform analysis based on depth
            analysis = {
                "market_segment": market_segment,
                "trend_count": len(relevant_trends),
                "trends": []
            }

            for trend in relevant_trends:
                trend_analysis = {
                    "trend": trend.to_dict(),
                    "trajectory": self._analyze_trend_trajectory(trend),
                    "impact_areas": self._identify_impact_areas(trend)
                }

                if analysis_depth in ["standard", "comprehensive"]:
                    trend_analysis["adoption_curve"] = self._analyze_adoption_curve(trend)
                    trend_analysis["key_drivers"] = self._identify_key_drivers(trend)

                if analysis_depth == "comprehensive":
                    trend_analysis["ecosystem_map"] = self._map_trend_ecosystem(trend)
                    trend_analysis["future_scenarios"] = self._generate_scenarios(trend)

                analysis["trends"].append(trend_analysis)

            # Market insights
            analysis["market_insights"] = self._generate_market_insights(relevant_trends)

            # Log operation
            operation = {
                "operation": "analyze_trends",
                "market_segment": market_segment,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            self.history.append(operation)

            return {
                "status": "success",
                "analysis": analysis,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error analyzing trends: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    # Helper methods

    def _calculate_momentum(self, signals: List[Dict]) -> float:
        """Calculate trend momentum from signals"""
        if not signals:
            return 0.0

        # Analyze signal frequency and recency
        now = datetime.now()
        weighted_score = 0.0

        for signal in signals:
            # Recency weight (more recent = higher weight)
            if "timestamp" in signal:
                try:
                    sig_time = datetime.fromisoformat(signal["timestamp"])
                    days_ago = (now - sig_time).days
                    recency_weight = max(0, 1 - (days_ago / 365))
                except:
                    recency_weight = 0.5
            else:
                recency_weight = 0.5

            # Signal strength
            strength = signal.get("strength", 0.5)

            weighted_score += recency_weight * strength

        return min(1.0, weighted_score / len(signals))

    def _calculate_impact(self, trend_data: Dict[str, Any]) -> float:
        """Calculate potential impact score"""
        impact_factors = {
            "market_size": trend_data.get("market_size", 0.5),
            "disruption_potential": trend_data.get("disruption_potential", 0.5),
            "technology_readiness": trend_data.get("technology_readiness", 0.5),
            "adoption_barriers": 1 - len(trend_data.get("barriers", [])) * 0.1
        }

        return sum(impact_factors.values()) / len(impact_factors)

    def _estimate_adoption_rate(self, signals: List[Dict]) -> float:
        """Estimate current adoption rate"""
        if not signals:
            return 0.0

        adoption_indicators = sum(
            signal.get("adoption_indicator", 0.3)
            for signal in signals
        )

        return min(1.0, adoption_indicators / len(signals))

    def _assess_maturity(self, momentum: float, adoption: float) -> TrendMaturity:
        """Assess trend maturity stage"""
        combined_score = (momentum + adoption) / 2

        if combined_score < 0.2:
            return TrendMaturity.EMERGING
        elif combined_score < 0.4:
            return TrendMaturity.GROWING
        elif combined_score < 0.7:
            return TrendMaturity.MAINSTREAM
        elif combined_score < 0.9:
            return TrendMaturity.DECLINING
        else:
            return TrendMaturity.OBSOLETE

    def _classify_horizon(self, maturity: TrendMaturity, impact: float) -> InnovationHorizon:
        """Classify trend into innovation horizon"""
        if maturity in [TrendMaturity.MAINSTREAM, TrendMaturity.DECLINING]:
            return InnovationHorizon.H1_CORE
        elif maturity == TrendMaturity.GROWING:
            return InnovationHorizon.H2_EMERGING
        else:  # EMERGING
            return InnovationHorizon.H3_FUTURE if impact > 0.7 else InnovationHorizon.H2_EMERGING

    def _calculate_confidence(self, signals: List[Dict]) -> float:
        """Calculate confidence score based on signal quality"""
        if not signals:
            return 0.0

        quality_score = sum(
            signal.get("reliability", 0.5) * signal.get("verification", 0.5)
            for signal in signals
        )

        return min(1.0, quality_score / len(signals))

    def _update_trend_clusters(self, trend: InnovationTrend):
        """Update trend clustering based on similarity"""
        for tag in trend.technologies + [trend.category]:
            self.trend_clusters[tag].add(trend.trend_id)

    def _generate_trend_recommendations(self, trend: InnovationTrend) -> List[str]:
        """Generate actionable recommendations for a trend"""
        recommendations = []

        if trend.horizon == InnovationHorizon.H1_CORE:
            recommendations.append("Optimize existing capabilities around this trend")
            recommendations.append("Monitor for efficiency improvements")
        elif trend.horizon == InnovationHorizon.H2_EMERGING:
            recommendations.append("Develop pilot projects to test viability")
            recommendations.append("Build partnerships with key players")
        else:  # H3_FUTURE
            recommendations.append("Allocate research budget for exploration")
            recommendations.append("Monitor closely for maturity signals")

        if trend.momentum_score > 0.7:
            recommendations.append("Act quickly - momentum is high")

        if trend.impact_score > 0.8:
            recommendations.append("Prioritize due to high impact potential")

        return recommendations

    def _add_radar_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add new item to technology radar"""
        if not item_data or "name" not in item_data:
            raise ValueError("Item name is required")

        item_id = self._generate_id(item_data["name"])

        # Parse quadrant and ring
        quadrant = TechnologyQuadrant(item_data.get("quadrant", "tools"))
        ring = RadarRing(item_data.get("ring", "assess"))

        item = TechnologyRadarItem(
            item_id=item_id,
            name=item_data["name"],
            quadrant=quadrant,
            ring=ring,
            description=item_data.get("description", ""),
            rationale=item_data.get("rationale", ""),
            first_seen=datetime.now(),
            last_updated=datetime.now(),
            movement="new",
            impact_assessment=item_data.get("impact_assessment", {}),
            adoption_barriers=item_data.get("adoption_barriers", [])
        )

        self.radar_items[item_id] = item

        return {
            "status": "success",
            "item_id": item_id,
            "item": item.to_dict(),
            "timestamp": datetime.now().isoformat()
        }

    def _update_radar_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing radar item"""
        item_id = item_data.get("item_id")
        if not item_id or item_id not in self.radar_items:
            raise ValueError("Valid item_id required")

        item = self.radar_items[item_id]
        item.last_updated = datetime.now()
        item.movement = "no_change"

        # Update fields
        if "description" in item_data:
            item.description = item_data["description"]
        if "rationale" in item_data:
            item.rationale = item_data["rationale"]
        if "impact_assessment" in item_data:
            item.impact_assessment = item_data["impact_assessment"]

        return {
            "status": "success",
            "item_id": item_id,
            "item": item.to_dict(),
            "timestamp": datetime.now().isoformat()
        }

    def _move_radar_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Move item to different radar ring"""
        item_id = item_data.get("item_id")
        new_ring = item_data.get("new_ring")

        if not item_id or item_id not in self.radar_items:
            raise ValueError("Valid item_id required")
        if not new_ring:
            raise ValueError("new_ring required")

        item = self.radar_items[item_id]
        old_ring = item.ring
        item.ring = RadarRing(new_ring)
        item.last_updated = datetime.now()
        item.movement = "moved_in" if item.ring.value < old_ring.value else "moved_out"

        return {
            "status": "success",
            "item_id": item_id,
            "old_ring": old_ring.value,
            "new_ring": item.ring.value,
            "item": item.to_dict(),
            "timestamp": datetime.now().isoformat()
        }

    def _remove_radar_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove item from radar"""
        item_id = item_data.get("item_id")
        if not item_id or item_id not in self.radar_items:
            raise ValueError("Valid item_id required")

        item = self.radar_items.pop(item_id)

        return {
            "status": "success",
            "item_id": item_id,
            "removed_item": item.to_dict(),
            "timestamp": datetime.now().isoformat()
        }

    def _get_complete_radar(self) -> Dict[str, Any]:
        """Get complete technology radar"""
        radar_by_quadrant = {q.value: {r.value: [] for r in RadarRing} for q in TechnologyQuadrant}

        for item in self.radar_items.values():
            radar_by_quadrant[item.quadrant.value][item.ring.value].append(item.to_dict())

        return {
            "status": "success",
            "radar": radar_by_quadrant,
            "total_items": len(self.radar_items),
            "timestamp": datetime.now().isoformat()
        }

    def _assess_signal_strength(self, signal_data: Dict[str, Any]) -> SignalStrength:
        """Assess weak signal strength"""
        indicators = signal_data.get("indicators", [])
        sources = signal_data.get("sources", [])

        score = len(indicators) * 0.3 + len(sources) * 0.4

        if score < 1:
            return SignalStrength.VERY_WEAK
        elif score < 2:
            return SignalStrength.WEAK
        elif score < 3:
            return SignalStrength.MODERATE
        elif score < 4:
            return SignalStrength.STRONG
        else:
            return SignalStrength.VERY_STRONG

    def _calculate_signal_relevance(self, signal_data: Dict[str, Any]) -> float:
        """Calculate signal relevance to organization"""
        relevance_factors = {
            "strategic_alignment": signal_data.get("strategic_alignment", 0.5),
            "market_relevance": signal_data.get("market_relevance", 0.5),
            "capability_fit": signal_data.get("capability_fit", 0.5)
        }

        return sum(relevance_factors.values()) / len(relevance_factors)

    def _analyze_signal_patterns(self, signal: WeakSignal) -> List[str]:
        """Analyze patterns in weak signals"""
        patterns = []

        # Check for tag patterns
        for tag in signal.tags:
            if len(self.signal_patterns[tag]) >= 3:
                patterns.append(f"Recurring pattern: {tag}")

        # Update patterns
        for tag in signal.tags:
            self.signal_patterns[tag].append(signal.signal_id)

        return patterns

    def _find_related_signals(self, signal: WeakSignal) -> List[str]:
        """Find related weak signals"""
        related = []

        for other_id, other in self.weak_signals.items():
            if other_id == signal.signal_id:
                continue

            # Check tag overlap
            common_tags = set(signal.tags) & set(other.tags)
            if len(common_tags) >= 2:
                related.append(other_id)

            # Check category match
            elif signal.category == other.category:
                related.append(other_id)

        return related[:5]  # Top 5 related

    def _check_amplification_needed(self, signal: WeakSignal, patterns: List[str]) -> bool:
        """Check if signal needs amplification"""
        return (
            signal.strength.value >= SignalStrength.MODERATE.value and
            signal.relevance_score > self.signal_threshold and
            len(patterns) > 0
        )

    def _generate_signal_recommendations(self, signal: WeakSignal) -> List[str]:
        """Generate recommendations for weak signal"""
        recommendations = []

        if signal.strength.value <= SignalStrength.WEAK.value:
            recommendations.append("Monitor for strengthening indicators")
        else:
            recommendations.append("Verify signal through additional sources")

        if signal.relevance_score > 0.7:
            recommendations.append("Assess strategic implications")
            recommendations.append("Consider experimental response")

        if len(signal.related_signals) >= 3:
            recommendations.append("Investigate signal cluster - pattern emerging")

        return recommendations

    def _analyze_competitor(self, comp_id: str, focus_areas: List[str]) -> Dict[str, Any]:
        """Analyze competitor activities"""
        competitor = self.competitors[comp_id]

        analysis = {
            "name": competitor["name"],
            "focus_areas": {}
        }

        for area in focus_areas:
            analysis["focus_areas"][area] = {
                "activity_level": "moderate",  # Would be calculated from real data
                "innovations": [],
                "threats": [],
                "opportunities": []
            }

        return analysis

    def _comparative_analysis(self, intelligence: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comparative analysis across competitors"""
        return {
            "market_leaders": [],
            "innovation_leaders": [],
            "emerging_threats": [],
            "market_gaps": []
        }

    def _identify_threats(self, intelligence: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify competitive threats"""
        threats = []

        for competitor, data in intelligence.items():
            for area, info in data.get("focus_areas", {}).items():
                if info.get("activity_level") == "high":
                    threats.append({
                        "competitor": competitor,
                        "area": area,
                        "severity": "medium",
                        "description": f"High activity in {area}"
                    })

        return threats

    def _identify_opportunities(self, intelligence: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify opportunities from competitive analysis"""
        opportunities = []

        # Look for market gaps
        all_areas = set()
        for data in intelligence.values():
            all_areas.update(data.get("focus_areas", {}).keys())

        return opportunities

    def _map_radar_to_horizon(self, item: TechnologyRadarItem) -> str:
        """Map radar item to innovation horizon"""
        if item.ring == RadarRing.ADOPT:
            return "h1_core"
        elif item.ring == RadarRing.TRIAL:
            return "h2_emerging"
        else:  # ASSESS or HOLD
            return "h3_future"

    def _identify_horizon_opportunities(
        self,
        horizon_key: str,
        horizon_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify opportunities within a horizon"""
        opportunities = []

        # Analyze trends for opportunities
        for trend in horizon_data.get("trends", []):
            if trend.get("impact_score", 0) > 0.7:
                opportunities.append({
                    "type": "trend",
                    "name": trend.get("name"),
                    "description": f"High-impact trend in {horizon_key}",
                    "priority": "high" if trend.get("momentum_score", 0) > 0.7 else "medium"
                })

        return opportunities

    def _generate_horizon_recommendations(self, horizons: Dict[str, Any]) -> List[str]:
        """Generate strategic recommendations across horizons"""
        recommendations = []

        h1_count = len(horizons["h1_core"]["trends"])
        h2_count = len(horizons["h2_emerging"]["trends"])
        h3_count = len(horizons["h3_future"]["trends"])

        if h1_count < h2_count + h3_count:
            recommendations.append("Balance portfolio - strengthen core business (H1)")

        if h3_count == 0:
            recommendations.append("Invest in future bets (H3) for long-term transformation")

        if h2_count > h1_count:
            recommendations.append("Strong emerging pipeline - prepare scaling capabilities")

        return recommendations

    def _suggest_resource_allocation(self, horizons: Dict[str, Any]) -> Dict[str, float]:
        """Suggest resource allocation across horizons"""
        # McKinsey typical allocation: 70% H1, 20% H2, 10% H3
        return {
            "h1_core": 0.70,
            "h2_emerging": 0.20,
            "h3_future": 0.10,
            "rationale": "Balanced portfolio following McKinsey Three Horizons model"
        }

    def _analyze_trend_trajectory(self, trend: InnovationTrend) -> str:
        """Analyze trend trajectory"""
        if trend.momentum_score > 0.7:
            return "accelerating"
        elif trend.momentum_score > 0.4:
            return "steady"
        else:
            return "slowing"

    def _identify_impact_areas(self, trend: InnovationTrend) -> List[str]:
        """Identify areas impacted by trend"""
        impact_areas = []

        if trend.impact_score > 0.7:
            impact_areas.extend(["business_model", "operations", "customer_experience"])
        elif trend.impact_score > 0.5:
            impact_areas.extend(["operations", "technology"])
        else:
            impact_areas.append("technology")

        return impact_areas

    def _analyze_adoption_curve(self, trend: InnovationTrend) -> Dict[str, Any]:
        """Analyze adoption curve position"""
        if trend.adoption_rate < 0.025:
            stage = "innovators"
        elif trend.adoption_rate < 0.16:
            stage = "early_adopters"
        elif trend.adoption_rate < 0.50:
            stage = "early_majority"
        elif trend.adoption_rate < 0.84:
            stage = "late_majority"
        else:
            stage = "laggards"

        return {
            "stage": stage,
            "adoption_rate": trend.adoption_rate,
            "next_milestone": self._get_next_adoption_milestone(stage)
        }

    def _get_next_adoption_milestone(self, current_stage: str) -> str:
        """Get next adoption milestone"""
        milestones = {
            "innovators": "Reach early adopters (2.5%-16%)",
            "early_adopters": "Cross the chasm to early majority",
            "early_majority": "Achieve mainstream adoption",
            "late_majority": "Complete market saturation",
            "laggards": "Technology maturity"
        }
        return milestones.get(current_stage, "Unknown")

    def _identify_key_drivers(self, trend: InnovationTrend) -> List[str]:
        """Identify key drivers of the trend"""
        drivers = []

        if trend.technologies:
            drivers.append(f"Technology enablers: {', '.join(trend.technologies[:3])}")

        if trend.key_players:
            drivers.append(f"Market leaders: {', '.join(trend.key_players[:3])}")

        if trend.impact_score > 0.7:
            drivers.append("High market demand and impact potential")

        return drivers

    def _map_trend_ecosystem(self, trend: InnovationTrend) -> Dict[str, Any]:
        """Map the ecosystem around a trend"""
        return {
            "key_players": trend.key_players,
            "enabling_technologies": trend.technologies,
            "use_cases": trend.use_cases,
            "partnerships": [],
            "standards_bodies": [],
            "investment_activity": "moderate"
        }

    def _generate_scenarios(self, trend: InnovationTrend) -> List[Dict[str, str]]:
        """Generate future scenarios for trend"""
        scenarios = []

        # Optimistic scenario
        scenarios.append({
            "name": "Rapid Adoption",
            "likelihood": "medium",
            "description": f"{trend.name} achieves mainstream adoption within 2 years",
            "implications": "First-mover advantage critical"
        })

        # Baseline scenario
        scenarios.append({
            "name": "Steady Growth",
            "likelihood": "high",
            "description": f"{trend.name} grows steadily following current trajectory",
            "implications": "Measured investment approach viable"
        })

        # Pessimistic scenario
        scenarios.append({
            "name": "Stalled Momentum",
            "likelihood": "low",
            "description": f"{trend.name} faces adoption barriers and stalls",
            "implications": "Monitor closely, delay major commitments"
        })

        return scenarios

    def _generate_market_insights(self, trends: List[InnovationTrend]) -> Dict[str, Any]:
        """Generate market insights from trends"""
        if not trends:
            return {"message": "No trends available for analysis"}

        # Maturity distribution
        maturity_dist = Counter(trend.maturity.value for trend in trends)

        # Horizon distribution
        horizon_dist = Counter(trend.horizon.value for trend in trends)

        # Average scores
        avg_momentum = sum(t.momentum_score for t in trends) / len(trends)
        avg_impact = sum(t.impact_score for t in trends) / len(trends)

        return {
            "maturity_distribution": dict(maturity_dist),
            "horizon_distribution": dict(horizon_dist),
            "average_momentum": round(avg_momentum, 2),
            "average_impact": round(avg_impact, 2),
            "total_trends": len(trends),
            "high_impact_trends": len([t for t in trends if t.impact_score > 0.7])
        }

    def _generate_id(self, name: str) -> str:
        """Generate unique ID from name"""
        return hashlib.md5(f"{name}_{datetime.now().timestamp()}".encode()).hexdigest()[:16]

    def get_history_summary(self) -> Dict[str, Any]:
        """
        Get summary of operations history.

        Returns:
            Dictionary containing history summary
        """
        return {
            "total_operations": len(self.history),
            "recent_operations": self.history[-10:] if self.history else [],
            "agent_id": self.agent_id,
            "statistics": {
                "total_trends": len(self.trends),
                "total_signals": len(self.weak_signals),
                "radar_items": len(self.radar_items),
                "competitors_tracked": len(self.competitors)
            }
        }
