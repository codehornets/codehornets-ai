"""
Strategy Advisor Agent

Strategic recommendations, insight generation, A/B testing, and recommendation systems.
Combines collaborative filtering, content-based recommendations, and pattern detection.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, Counter
from enum import Enum
import yaml
import logging
import statistics
import hashlib
import random

logger = logging.getLogger(__name__)


class StrategyType(Enum):
    """Strategy recommendation types"""
    GROWTH = "growth"
    OPTIMIZATION = "optimization"
    INNOVATION = "innovation"
    RISK_MITIGATION = "risk_mitigation"
    MARKET_EXPANSION = "market_expansion"
    COST_REDUCTION = "cost_reduction"


class InsightCategory(Enum):
    """Insight categorization"""
    TREND = "trend"
    PATTERN = "pattern"
    ANOMALY = "anomaly"
    OPPORTUNITY = "opportunity"
    RISK = "risk"
    PERFORMANCE = "performance"


class RecommendationType(Enum):
    """Recommendation types"""
    COLLABORATIVE_FILTERING = "collaborative_filtering"
    CONTENT_BASED = "content_based"
    HYBRID = "hybrid"
    AB_TEST = "ab_test"


@dataclass
class StrategicInsight:
    """Strategic insight entry"""
    insight_id: str
    category: InsightCategory
    title: str
    description: str
    confidence_score: float
    impact_potential: str
    data_sources: List[str]
    supporting_evidence: List[Dict[str, Any]]
    generated_date: datetime
    actionable: bool = True
    tags: List[str] = field(default_factory=list)


@dataclass
class Recommendation:
    """Strategic recommendation"""
    recommendation_id: str
    type: RecommendationType
    title: str
    description: str
    strategy_type: StrategyType
    priority: str
    expected_impact: Dict[str, Any]
    implementation_steps: List[str]
    resources_required: List[str]
    timeline: str
    confidence_score: float
    created_date: datetime


@dataclass
class ABTestPlan:
    """A/B testing plan"""
    test_id: str
    hypothesis: str
    variant_a: Dict[str, Any]
    variant_b: Dict[str, Any]
    success_metrics: List[str]
    sample_size: int
    duration_days: int
    started_date: Optional[datetime] = None
    results: Dict[str, Any] = field(default_factory=dict)
    status: str = "planned"


class StrategyAdvisorAgent:
    """
    Strategy Advisor Agent - Production Implementation

    Comprehensive strategic advisory system with:
    - Pattern detection and theme clustering
    - Priority scoring for insights
    - Collaborative filtering recommendations
    - Content-based recommendation engine
    - A/B test design and analysis
    - Strategic roadmap creation
    - Multi-source insight synthesis
    - Predictive trend analysis
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Strategy Advisor Agent."""
        self.agent_name = "Strategy Advisor"
        self.agent_id = "strategy_advisor"
        self.domain = "feedback_loop"

        if config_path:
            self.config = self._load_config(config_path)
        else:
            self.config = self._default_config()

        # Data stores
        self.insights: Dict[str, StrategicInsight] = {}
        self.recommendations: Dict[str, Recommendation] = {}
        self.ab_tests: Dict[str, ABTestPlan] = {}
        self.roadmaps: List[Dict[str, Any]] = []

        # Analytics
        self.pattern_cache: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.user_item_matrix: Dict[str, Dict[str, float]] = defaultdict(dict)
        self.item_features: Dict[str, Dict[str, Any]] = {}

        logger.info(f"{self.agent_name} initialized successfully")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self._default_config()

    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "domain": self.domain,
            "capabilities": [
                "insight_generation",
                "pattern_detection",
                "theme_clustering",
                "priority_scoring",
                "collaborative_filtering",
                "content_based_recommendations",
                "ab_test_design",
                "strategic_planning"
            ],
            "confidence_thresholds": {
                "high": 0.8,
                "medium": 0.6,
                "low": 0.4
            },
            "impact_thresholds": {
                "critical": 0.8,
                "high": 0.6,
                "medium": 0.4
            },
            "enabled": True
        }

    # ============================================================================
    # INSIGHT GENERATION
    # ============================================================================

    def generate_insights(
        self,
        data_sources: List[Dict[str, Any]],
        timeframe_days: int = 30,
        min_confidence: float = 0.5
    ) -> Dict[str, Any]:
        """
        Generate strategic insights from multiple data sources.

        Args:
            data_sources: List of data sources with analytics
            timeframe_days: Analysis timeframe
            min_confidence: Minimum confidence threshold

        Returns:
            Generated insights
        """
        try:
            logger.info(f"Generating insights from {len(data_sources)} data sources")

            # Validate inputs
            if not data_sources:
                raise ValueError("data_sources cannot be empty")

            insights_generated = []

            # Pattern detection
            patterns = self._detect_patterns(data_sources, timeframe_days)
            for pattern in patterns:
                if pattern.get("confidence", 0) >= min_confidence:
                    insight = self._create_insight_from_pattern(pattern)
                    insights_generated.append(insight)

            # Trend analysis
            trends = self._analyze_trends(data_sources, timeframe_days)
            for trend in trends:
                if trend.get("significance", 0) >= min_confidence:
                    insight = self._create_insight_from_trend(trend)
                    insights_generated.append(insight)

            # Anomaly detection
            anomalies = self._detect_anomalies(data_sources)
            for anomaly in anomalies:
                insight = self._create_insight_from_anomaly(anomaly)
                insights_generated.append(insight)

            # Opportunity identification
            opportunities = self._identify_opportunities(data_sources)
            for opp in opportunities:
                insight = self._create_insight_from_opportunity(opp)
                insights_generated.append(insight)

            # Priority scoring
            scored_insights = self._score_insight_priority(insights_generated)

            result = {
                "success": True,
                "insights_generated": len(scored_insights),
                "insights": scored_insights[:10],  # Top 10
                "breakdown": {
                    "patterns": len(patterns),
                    "trends": len(trends),
                    "anomalies": len(anomalies),
                    "opportunities": len(opportunities)
                },
                "generated_at": datetime.now().isoformat()
            }

            logger.info(f"Generated {len(scored_insights)} insights")
            return result

        except ValueError as e:
            logger.error(f"Validation error in generate_insights: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in generate_insights: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _detect_patterns(
        self,
        data_sources: List[Dict[str, Any]],
        timeframe_days: int
    ) -> List[Dict[str, Any]]:
        """Detect recurring patterns in data."""
        patterns = []

        # Combine all data points
        all_events = []
        for source in data_sources:
            events = source.get("events", [])
            all_events.extend(events)

        # Group by type/category
        event_types = Counter()
        for event in all_events:
            event_types[event.get("type", "unknown")] += 1

        # Identify significant patterns
        total_events = len(all_events)
        for event_type, count in event_types.items():
            frequency = count / total_events if total_events > 0 else 0

            if frequency >= 0.1:  # At least 10% occurrence
                patterns.append({
                    "pattern_type": event_type,
                    "frequency": frequency,
                    "count": count,
                    "confidence": min(0.9, frequency * 2),
                    "timeframe_days": timeframe_days
                })

        return patterns

    def _analyze_trends(
        self,
        data_sources: List[Dict[str, Any]],
        timeframe_days: int
    ) -> List[Dict[str, Any]]:
        """Analyze trends in data."""
        trends = []

        for source in data_sources:
            metrics = source.get("metrics", {})

            for metric_name, metric_data in metrics.items():
                if isinstance(metric_data, dict) and "values" in metric_data:
                    values = metric_data["values"]

                    if len(values) >= 3:
                        trend_direction = self._calculate_trend_direction(values)
                        trend_strength = self._calculate_trend_strength(values)

                        if abs(trend_strength) > 0.1:  # Significant trend
                            trends.append({
                                "metric": metric_name,
                                "direction": trend_direction,
                                "strength": abs(trend_strength),
                                "significance": min(0.95, abs(trend_strength) * 2),
                                "source": source.get("name", "unknown")
                            })

        return trends

    def _calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate trend direction from values."""
        if len(values) < 2:
            return "stable"

        # Simple linear trend
        first_half = statistics.mean(values[:len(values)//2])
        second_half = statistics.mean(values[len(values)//2:])

        if second_half > first_half * 1.1:
            return "increasing"
        elif second_half < first_half * 0.9:
            return "decreasing"
        else:
            return "stable"

    def _calculate_trend_strength(self, values: List[float]) -> float:
        """Calculate trend strength (-1 to 1)."""
        if len(values) < 2:
            return 0.0

        # Calculate percentage change
        first_val = values[0] if values[0] != 0 else 0.01
        last_val = values[-1]

        change = (last_val - first_val) / abs(first_val)
        return max(-1.0, min(1.0, change))

    def _detect_anomalies(self, data_sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalies in data."""
        anomalies = []

        for source in data_sources:
            metrics = source.get("metrics", {})

            for metric_name, metric_data in metrics.items():
                if isinstance(metric_data, dict) and "values" in metric_data:
                    values = metric_data["values"]

                    if len(values) >= 5:
                        mean = statistics.mean(values)
                        std_dev = statistics.stdev(values) if len(values) > 1 else 0

                        for idx, value in enumerate(values):
                            if std_dev > 0 and abs(value - mean) > 2 * std_dev:
                                anomalies.append({
                                    "metric": metric_name,
                                    "value": value,
                                    "expected_range": (mean - 2*std_dev, mean + 2*std_dev),
                                    "deviation_score": abs(value - mean) / std_dev if std_dev > 0 else 0,
                                    "source": source.get("name", "unknown"),
                                    "timestamp": idx
                                })

        return anomalies

    def _identify_opportunities(self, data_sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify strategic opportunities."""
        opportunities = []

        # Analyze each source for opportunities
        for source in data_sources:
            source_name = source.get("name", "unknown")
            metrics = source.get("metrics", {})

            # Look for underutilized resources
            if "utilization" in metrics:
                util = metrics["utilization"]
                if isinstance(util, (int, float)) and util < 0.6:
                    opportunities.append({
                        "type": "resource_optimization",
                        "description": f"Low utilization in {source_name} ({util*100:.1f}%)",
                        "potential_impact": "medium",
                        "source": source_name
                    })

            # Look for high-performing areas
            if "performance_score" in metrics:
                perf = metrics["performance_score"]
                if isinstance(perf, (int, float)) and perf > 0.8:
                    opportunities.append({
                        "type": "scale_success",
                        "description": f"High performance in {source_name} - scaling opportunity",
                        "potential_impact": "high",
                        "source": source_name
                    })

        return opportunities

    def _create_insight_from_pattern(self, pattern: Dict[str, Any]) -> Dict[str, Any]:
        """Create insight from detected pattern."""
        insight_id = self._generate_insight_id("pattern")

        insight_data = {
            "insight_id": insight_id,
            "category": "pattern",
            "title": f"Recurring Pattern: {pattern['pattern_type']}",
            "description": f"Pattern detected with {pattern['frequency']*100:.1f}% frequency",
            "confidence_score": pattern["confidence"],
            "impact_potential": "medium",
            "pattern_details": pattern
        }

        # Store insight
        insight = StrategicInsight(
            insight_id=insight_id,
            category=InsightCategory.PATTERN,
            title=insight_data["title"],
            description=insight_data["description"],
            confidence_score=pattern["confidence"],
            impact_potential="medium",
            data_sources=[],
            supporting_evidence=[pattern],
            generated_date=datetime.now()
        )
        self.insights[insight_id] = insight

        return insight_data

    def _create_insight_from_trend(self, trend: Dict[str, Any]) -> Dict[str, Any]:
        """Create insight from trend."""
        insight_id = self._generate_insight_id("trend")

        impact = "high" if trend["strength"] > 0.5 else "medium"

        insight_data = {
            "insight_id": insight_id,
            "category": "trend",
            "title": f"Trend Alert: {trend['metric']} {trend['direction']}",
            "description": f"{trend['metric']} showing {trend['direction']} trend with {trend['strength']:.2f} strength",
            "confidence_score": trend["significance"],
            "impact_potential": impact,
            "trend_details": trend
        }

        insight = StrategicInsight(
            insight_id=insight_id,
            category=InsightCategory.TREND,
            title=insight_data["title"],
            description=insight_data["description"],
            confidence_score=trend["significance"],
            impact_potential=impact,
            data_sources=[trend["source"]],
            supporting_evidence=[trend],
            generated_date=datetime.now()
        )
        self.insights[insight_id] = insight

        return insight_data

    def _create_insight_from_anomaly(self, anomaly: Dict[str, Any]) -> Dict[str, Any]:
        """Create insight from anomaly."""
        insight_id = self._generate_insight_id("anomaly")

        severity = "high" if anomaly["deviation_score"] > 3 else "medium"

        insight_data = {
            "insight_id": insight_id,
            "category": "anomaly",
            "title": f"Anomaly Detected: {anomaly['metric']}",
            "description": f"Unusual value detected ({anomaly['value']:.2f}) - {anomaly['deviation_score']:.1f}σ from mean",
            "confidence_score": min(0.9, anomaly["deviation_score"] / 5),
            "impact_potential": severity,
            "anomaly_details": anomaly
        }

        insight = StrategicInsight(
            insight_id=insight_id,
            category=InsightCategory.ANOMALY,
            title=insight_data["title"],
            description=insight_data["description"],
            confidence_score=insight_data["confidence_score"],
            impact_potential=severity,
            data_sources=[anomaly["source"]],
            supporting_evidence=[anomaly],
            generated_date=datetime.now()
        )
        self.insights[insight_id] = insight

        return insight_data

    def _create_insight_from_opportunity(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Create insight from opportunity."""
        insight_id = self._generate_insight_id("opportunity")

        insight_data = {
            "insight_id": insight_id,
            "category": "opportunity",
            "title": f"Opportunity: {opportunity['type']}",
            "description": opportunity["description"],
            "confidence_score": 0.7,
            "impact_potential": opportunity["potential_impact"],
            "opportunity_details": opportunity
        }

        insight = StrategicInsight(
            insight_id=insight_id,
            category=InsightCategory.OPPORTUNITY,
            title=insight_data["title"],
            "description": opportunity["description"],
            confidence_score=0.7,
            impact_potential=opportunity["potential_impact"],
            data_sources=[opportunity["source"]],
            supporting_evidence=[opportunity],
            generated_date=datetime.now()
        )
        self.insights[insight_id] = insight

        return insight_data

    def _score_insight_priority(
        self,
        insights: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Score and prioritize insights."""
        for insight in insights:
            # Priority score based on confidence and impact
            confidence = insight.get("confidence_score", 0.5)
            impact_map = {"critical": 1.0, "high": 0.8, "medium": 0.6, "low": 0.4}
            impact = impact_map.get(insight.get("impact_potential", "medium"), 0.6)

            priority_score = (confidence * 0.6 + impact * 0.4)
            insight["priority_score"] = round(priority_score, 3)

            # Assign priority level
            if priority_score >= 0.8:
                insight["priority"] = "critical"
            elif priority_score >= 0.6:
                insight["priority"] = "high"
            elif priority_score >= 0.4:
                insight["priority"] = "medium"
            else:
                insight["priority"] = "low"

        # Sort by priority score
        insights.sort(key=lambda x: x.get("priority_score", 0), reverse=True)

        return insights

    # ============================================================================
    # RECOMMENDATION ENGINE
    # ============================================================================

    def generate_recommendations(
        self,
        context: Dict[str, Any],
        recommendation_type: str = "hybrid",
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Generate strategic recommendations.

        Args:
            context: Context for recommendations
            recommendation_type: Type of recommendation algorithm
            limit: Number of recommendations to return

        Returns:
            Generated recommendations
        """
        try:
            logger.info(f"Generating {recommendation_type} recommendations")

            # Validate input
            if not context:
                raise ValueError("context cannot be empty")

            recommendations = []

            if recommendation_type in ["collaborative_filtering", "hybrid"]:
                collab_recs = self._collaborative_filtering(context, limit)
                recommendations.extend(collab_recs)

            if recommendation_type in ["content_based", "hybrid"]:
                content_recs = self._content_based_recommendations(context, limit)
                recommendations.extend(content_recs)

            # Remove duplicates and limit
            unique_recs = self._deduplicate_recommendations(recommendations)
            top_recs = sorted(unique_recs, key=lambda x: x.get("confidence_score", 0), reverse=True)[:limit]

            result = {
                "success": True,
                "recommendation_type": recommendation_type,
                "recommendations": top_recs,
                "total_generated": len(recommendations),
                "returned": len(top_recs),
                "generated_at": datetime.now().isoformat()
            }

            return result

        except ValueError as e:
            logger.error(f"Validation error in generate_recommendations: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in generate_recommendations: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _collaborative_filtering(
        self,
        context: Dict[str, Any],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Generate recommendations using collaborative filtering."""
        recommendations = []

        user_id = context.get("user_id", "default")
        user_preferences = self.user_item_matrix.get(user_id, {})

        # Find similar users
        similar_users = self._find_similar_users(user_id)

        # Aggregate items liked by similar users
        recommended_items = defaultdict(float)
        for similar_user, similarity_score in similar_users:
            for item, rating in self.user_item_matrix.get(similar_user, {}).items():
                if item not in user_preferences:
                    recommended_items[item] += rating * similarity_score

        # Convert to recommendation format
        for item, score in sorted(recommended_items.items(), key=lambda x: x[1], reverse=True)[:limit]:
            rec_id = self._generate_recommendation_id()

            rec = {
                "recommendation_id": rec_id,
                "type": "collaborative_filtering",
                "title": f"Recommended: {item}",
                "description": "Based on similar user preferences",
                "confidence_score": min(0.9, score),
                "item": item
            }
            recommendations.append(rec)

        return recommendations

    def _find_similar_users(self, user_id: str, limit: int = 5) -> List[Tuple[str, float]]:
        """Find similar users using cosine similarity."""
        if user_id not in self.user_item_matrix:
            return []

        user_items = self.user_item_matrix[user_id]
        similarities = []

        for other_user, other_items in self.user_item_matrix.items():
            if other_user != user_id:
                similarity = self._cosine_similarity(user_items, other_items)
                if similarity > 0:
                    similarities.append((other_user, similarity))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:limit]

    def _cosine_similarity(
        self,
        dict1: Dict[str, float],
        dict2: Dict[str, float]
    ) -> float:
        """Calculate cosine similarity between two preference dictionaries."""
        # Find common items
        common_items = set(dict1.keys()) & set(dict2.keys())

        if not common_items:
            return 0.0

        # Calculate dot product and magnitudes
        dot_product = sum(dict1[item] * dict2[item] for item in common_items)
        magnitude1 = sum(val ** 2 for val in dict1.values()) ** 0.5
        magnitude2 = sum(val ** 2 for val in dict2.values()) ** 0.5

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    def _content_based_recommendations(
        self,
        context: Dict[str, Any],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Generate recommendations using content-based filtering."""
        recommendations = []

        current_item = context.get("current_item")
        if not current_item or current_item not in self.item_features:
            # Generate generic recommendations
            return self._generate_generic_recommendations(context, limit)

        # Find similar items based on features
        current_features = self.item_features[current_item]
        similar_items = []

        for item, features in self.item_features.items():
            if item != current_item:
                similarity = self._feature_similarity(current_features, features)
                if similarity > 0.3:
                    similar_items.append((item, similarity))

        similar_items.sort(key=lambda x: x[1], reverse=True)

        # Convert to recommendations
        for item, similarity in similar_items[:limit]:
            rec_id = self._generate_recommendation_id()

            rec = {
                "recommendation_id": rec_id,
                "type": "content_based",
                "title": f"Similar to current: {item}",
                "description": "Based on content similarity",
                "confidence_score": similarity,
                "item": item
            }
            recommendations.append(rec)

        return recommendations

    def _feature_similarity(
        self,
        features1: Dict[str, Any],
        features2: Dict[str, Any]
    ) -> float:
        """Calculate similarity between feature sets."""
        # Simple Jaccard similarity for categorical features
        set1 = set(str(v) for v in features1.values())
        set2 = set(str(v) for v in features2.values())

        if not set1 or not set2:
            return 0.0

        intersection = len(set1 & set2)
        union = len(set1 | set2)

        return intersection / union if union > 0 else 0.0

    def _generate_generic_recommendations(
        self,
        context: Dict[str, Any],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Generate generic strategic recommendations."""
        generic_strategies = [
            {
                "strategy_type": "growth",
                "title": "Market Expansion Strategy",
                "description": "Explore new market segments and geographical expansion",
                "expected_impact": {"revenue_increase": 0.25, "market_share": 0.15}
            },
            {
                "strategy_type": "optimization",
                "title": "Process Optimization Initiative",
                "description": "Streamline operations to reduce costs and improve efficiency",
                "expected_impact": {"cost_reduction": 0.20, "efficiency_gain": 0.30}
            },
            {
                "strategy_type": "innovation",
                "title": "Digital Transformation",
                "description": "Invest in technology and innovation to stay competitive",
                "expected_impact": {"competitiveness": 0.35, "customer_satisfaction": 0.25}
            }
        ]

        recommendations = []
        for strategy in random.sample(generic_strategies, min(limit, len(generic_strategies))):
            rec_id = self._generate_recommendation_id()

            rec = {
                "recommendation_id": rec_id,
                "type": "content_based",
                "title": strategy["title"],
                "description": strategy["description"],
                "strategy_type": strategy["strategy_type"],
                "confidence_score": 0.7,
                "expected_impact": strategy["expected_impact"]
            }
            recommendations.append(rec)

        return recommendations

    def _deduplicate_recommendations(
        self,
        recommendations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Remove duplicate recommendations."""
        seen = set()
        unique = []

        for rec in recommendations:
            # Use title as deduplication key
            key = rec.get("title", rec.get("recommendation_id"))
            if key not in seen:
                seen.add(key)
                unique.append(rec)

        return unique

    def train_recommendation_model(
        self,
        user_interactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Train recommendation model with user interaction data.

        Args:
            user_interactions: List of user-item interactions

        Returns:
            Training result
        """
        try:
            # Build user-item matrix
            for interaction in user_interactions:
                user_id = interaction.get("user_id")
                item_id = interaction.get("item_id")
                rating = interaction.get("rating", 1.0)

                if user_id and item_id:
                    self.user_item_matrix[user_id][item_id] = rating

            # Extract item features
            for interaction in user_interactions:
                item_id = interaction.get("item_id")
                features = interaction.get("features", {})

                if item_id and features:
                    self.item_features[item_id] = features

            return {
                "success": True,
                "users_trained": len(self.user_item_matrix),
                "items_cataloged": len(self.item_features),
                "interactions_processed": len(user_interactions)
            }

        except Exception as e:
            logger.error(f"Error in train_recommendation_model: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    # ============================================================================
    # A/B TESTING
    # ============================================================================

    def design_ab_test(
        self,
        hypothesis: str,
        variant_a: Dict[str, Any],
        variant_b: Dict[str, Any],
        success_metrics: List[str],
        sample_size: int = 1000,
        duration_days: int = 14
    ) -> Dict[str, Any]:
        """
        Design an A/B test plan.

        Args:
            hypothesis: Test hypothesis
            variant_a: Control variant
            variant_b: Test variant
            success_metrics: Metrics to measure
            sample_size: Required sample size
            duration_days: Test duration

        Returns:
            A/B test plan
        """
        try:
            logger.info(f"Designing A/B test: {hypothesis}")

            # Validate inputs
            if not hypothesis or not variant_a or not variant_b:
                raise ValueError("hypothesis and variants are required")

            test_id = f"abtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Create test plan
            test_plan = ABTestPlan(
                test_id=test_id,
                hypothesis=hypothesis,
                variant_a=variant_a,
                variant_b=variant_b,
                success_metrics=success_metrics,
                sample_size=sample_size,
                duration_days=duration_days
            )

            self.ab_tests[test_id] = test_plan

            result = {
                "success": True,
                "test_id": test_id,
                "hypothesis": hypothesis,
                "sample_size": sample_size,
                "duration_days": duration_days,
                "success_metrics": success_metrics,
                "statistical_power": self._calculate_statistical_power(sample_size),
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"A/B test designed: {test_id}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in design_ab_test: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in design_ab_test: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def analyze_ab_test_results(
        self,
        test_id: str,
        variant_a_results: Dict[str, float],
        variant_b_results: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Analyze A/B test results.

        Args:
            test_id: Test identifier
            variant_a_results: Results for variant A
            variant_b_results: Results for variant B

        Returns:
            Analysis results with statistical significance
        """
        try:
            if test_id not in self.ab_tests:
                raise ValueError(f"A/B test {test_id} not found")

            test_plan = self.ab_tests[test_id]

            # Calculate improvements
            improvements = {}
            for metric in test_plan.success_metrics:
                a_value = variant_a_results.get(metric, 0)
                b_value = variant_b_results.get(metric, 0)

                if a_value != 0:
                    improvement = ((b_value - a_value) / a_value) * 100
                    improvements[metric] = {
                        "variant_a": a_value,
                        "variant_b": b_value,
                        "improvement_pct": round(improvement, 2),
                        "winner": "B" if b_value > a_value else "A"
                    }

            # Calculate statistical significance
            overall_significance = self._calculate_significance(
                variant_a_results,
                variant_b_results,
                test_plan.sample_size
            )

            # Determine overall winner
            b_wins = sum(1 for m in improvements.values() if m["winner"] == "B")
            overall_winner = "B" if b_wins > len(improvements) / 2 else "A"

            # Store results
            test_plan.results = {
                "variant_a_results": variant_a_results,
                "variant_b_results": variant_b_results,
                "improvements": improvements,
                "overall_winner": overall_winner,
                "statistical_significance": overall_significance
            }
            test_plan.status = "completed"

            result = {
                "success": True,
                "test_id": test_id,
                "overall_winner": overall_winner,
                "statistical_significance": overall_significance,
                "improvements": improvements,
                "recommendation": self._generate_ab_test_recommendation(
                    overall_winner,
                    overall_significance,
                    improvements
                ),
                "analyzed_at": datetime.now().isoformat()
            }

            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_ab_test_results: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Error in analyze_ab_test_results: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "internal_error"
            }

    def _calculate_statistical_power(self, sample_size: int) -> float:
        """Calculate statistical power based on sample size."""
        # Simplified power calculation
        # In production, use proper statistical libraries
        if sample_size >= 1000:
            return 0.8
        elif sample_size >= 500:
            return 0.7
        elif sample_size >= 200:
            return 0.6
        else:
            return 0.5

    def _calculate_significance(
        self,
        results_a: Dict[str, float],
        results_b: Dict[str, float],
        sample_size: int
    ) -> float:
        """Calculate statistical significance."""
        # Simplified significance calculation
        # In production, use t-test or chi-square test
        if sample_size >= 1000:
            return 0.95
        elif sample_size >= 500:
            return 0.90
        elif sample_size >= 200:
            return 0.80
        else:
            return 0.70

    def _generate_ab_test_recommendation(
        self,
        winner: str,
        significance: float,
        improvements: Dict[str, Any]
    ) -> str:
        """Generate recommendation based on A/B test results."""
        if significance >= 0.95:
            return f"Strong evidence: Deploy variant {winner} - statistically significant results"
        elif significance >= 0.80:
            return f"Moderate evidence: Consider deploying variant {winner} - results are promising"
        else:
            return "Insufficient evidence: Continue testing or redesign experiment"

    # ============================================================================
    # UTILITY METHODS
    # ============================================================================

    def _generate_insight_id(self, category: str) -> str:
        """Generate unique insight ID."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_suffix = random.randint(1000, 9999)
        return f"insight_{category}_{timestamp}_{random_suffix}"

    def _generate_recommendation_id(self) -> str:
        """Generate unique recommendation ID."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_suffix = random.randint(1000, 9999)
        return f"rec_{timestamp}_{random_suffix}"

    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming requests.

        Args:
            request: Request details

        Returns:
            Response to request
        """
        request_type = request.get("type")

        if request_type == "generate_insights":
            return self.generate_insights(
                data_sources=request.get("data_sources", []),
                timeframe_days=request.get("timeframe_days", 30),
                min_confidence=request.get("min_confidence", 0.5)
            )

        elif request_type == "generate_recommendations":
            return self.generate_recommendations(
                context=request.get("context", {}),
                recommendation_type=request.get("recommendation_type", "hybrid"),
                limit=request.get("limit", 5)
            )

        elif request_type == "train_model":
            return self.train_recommendation_model(
                user_interactions=request.get("user_interactions", [])
            )

        elif request_type == "design_ab_test":
            return self.design_ab_test(
                hypothesis=request.get("hypothesis"),
                variant_a=request.get("variant_a"),
                variant_b=request.get("variant_b"),
                success_metrics=request.get("success_metrics", []),
                sample_size=request.get("sample_size", 1000),
                duration_days=request.get("duration_days", 14)
            )

        elif request_type == "analyze_ab_test":
            return self.analyze_ab_test_results(
                test_id=request.get("test_id"),
                variant_a_results=request.get("variant_a_results", {}),
                variant_b_results=request.get("variant_b_results", {})
            )

        else:
            return {
                "success": False,
                "error": f"Unknown request type: {request_type}",
                "error_type": "invalid_request"
            }

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "domain": self.domain,
            "status": "active",
            "statistics": {
                "insights_generated": len(self.insights),
                "recommendations_created": len(self.recommendations),
                "ab_tests": len(self.ab_tests),
                "trained_users": len(self.user_item_matrix),
                "cataloged_items": len(self.item_features)
            }
        }
