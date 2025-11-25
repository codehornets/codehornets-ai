"""
SEO Specialist Agent

Comprehensive SEO optimization with keyword research, backlink analysis, technical audits,
rank tracking, competitor analysis, and content optimization recommendations.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
import logging
import re
import math
import hashlib
from collections import Counter, defaultdict
from enum import Enum
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SearchIntent(Enum):
    """Search intent classification."""
    INFORMATIONAL = "informational"
    NAVIGATIONAL = "navigational"
    TRANSACTIONAL = "transactional"
    COMMERCIAL = "commercial"


class KeywordDifficulty(Enum):
    """Keyword difficulty levels."""
    VERY_EASY = "very_easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"


class SEOSpecialistAgent:
    """SEO Specialist Agent for comprehensive search engine optimization."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the SEO Specialist Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.agent_id = "seo_specialist_001"
        self.config = config or {}
        self.keywords: List[Dict[str, Any]] = []
        self.name = "SEO Specialist"
        self.role = "SEO Optimization"
        self.backlink_database: List[Dict[str, Any]] = []
        self.rank_history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        # SEO scoring weights
        self.seo_weights = {
            "title": 0.25,
            "meta_description": 0.15,
            "headings": 0.20,
            "content": 0.20,
            "images": 0.10,
            "internal_links": 0.05,
            "url_structure": 0.05
        }

        logger.info(f"SEOSpecialistAgent {self.agent_id} initialized")

    def calculate_keyword_difficulty(
        self,
        keyword: str,
        search_volume: int,
        competition_score: float,
        top_ranking_domains: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Calculate keyword difficulty with comprehensive scoring.

        Args:
            keyword: Target keyword
            search_volume: Monthly search volume
            competition_score: Competition score (0-1)
            top_ranking_domains: List of top 10 ranking domains with DA scores

        Returns:
            Keyword difficulty analysis with actionable metrics
        """
        try:
            logger.info(f"Calculating keyword difficulty for: {keyword}")

            # Base difficulty from search volume and competition
            volume_factor = min(search_volume / 10000, 1.0)  # Normalize to 0-1
            base_difficulty = (volume_factor * 0.4) + (competition_score * 0.6)

            # Analyze top ranking domains if provided
            domain_authority_factor = 0.0
            avg_content_length = 0
            avg_backlinks = 0

            if top_ranking_domains:
                total_da = sum(d.get("domain_authority", 0) for d in top_ranking_domains)
                avg_da = total_da / len(top_ranking_domains) if top_ranking_domains else 0
                domain_authority_factor = avg_da / 100

                total_content_length = sum(d.get("content_length", 0) for d in top_ranking_domains)
                avg_content_length = int(total_content_length / len(top_ranking_domains))

                total_backlinks = sum(d.get("backlinks", 0) for d in top_ranking_domains)
                avg_backlinks = int(total_backlinks / len(top_ranking_domains))

            # Final difficulty score (0-100)
            final_difficulty = min(
                (base_difficulty * 0.5 + domain_authority_factor * 0.5) * 100,
                100
            )

            # Classify difficulty
            if final_difficulty < 20:
                difficulty_level = KeywordDifficulty.VERY_EASY
            elif final_difficulty < 40:
                difficulty_level = KeywordDifficulty.EASY
            elif final_difficulty < 60:
                difficulty_level = KeywordDifficulty.MEDIUM
            elif final_difficulty < 80:
                difficulty_level = KeywordDifficulty.HARD
            else:
                difficulty_level = KeywordDifficulty.VERY_HARD

            # Calculate opportunity score
            opportunity_score = self._calculate_opportunity_score(
                search_volume, final_difficulty, competition_score
            )

            # Detect search intent
            intent = self._detect_search_intent(keyword)

            result = {
                "keyword": keyword,
                "search_volume": search_volume,
                "difficulty_score": round(final_difficulty, 2),
                "difficulty_level": difficulty_level.value,
                "competition_score": competition_score,
                "opportunity_score": round(opportunity_score, 2),
                "search_intent": intent.value,
                "avg_domain_authority": round(domain_authority_factor * 100, 2),
                "avg_content_length": avg_content_length,
                "avg_backlinks": avg_backlinks,
                "recommendations": self._generate_keyword_recommendations(
                    final_difficulty, search_volume, intent
                ),
                "timestamp": datetime.now().isoformat()
            }

            self.keywords.append(result)
            logger.info(f"Keyword difficulty calculated: {final_difficulty:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error calculating keyword difficulty: {str(e)}")
            raise

    def _calculate_opportunity_score(
        self,
        search_volume: int,
        difficulty: float,
        competition: float
    ) -> float:
        """Calculate keyword opportunity score."""
        # Higher volume, lower difficulty = better opportunity
        volume_normalized = min(search_volume / 10000, 1.0)
        difficulty_normalized = difficulty / 100

        opportunity = (
            (volume_normalized * 0.5) +
            ((1 - difficulty_normalized) * 0.3) +
            ((1 - competition) * 0.2)
        ) * 100

        return opportunity

    def _detect_search_intent(self, keyword: str) -> SearchIntent:
        """Detect search intent from keyword."""
        keyword_lower = keyword.lower()

        # Transactional indicators
        transactional_terms = ["buy", "price", "cheap", "deal", "discount", "order", "purchase"]
        if any(term in keyword_lower for term in transactional_terms):
            return SearchIntent.TRANSACTIONAL

        # Commercial indicators
        commercial_terms = ["best", "top", "review", "comparison", "vs", "alternative"]
        if any(term in keyword_lower for term in commercial_terms):
            return SearchIntent.COMMERCIAL

        # Navigational indicators
        navigational_terms = ["login", "sign in", "official", "website"]
        if any(term in keyword_lower for term in navigational_terms):
            return SearchIntent.NAVIGATIONAL

        # Default to informational
        return SearchIntent.INFORMATIONAL

    def _generate_keyword_recommendations(
        self,
        difficulty: float,
        volume: int,
        intent: SearchIntent
    ) -> List[str]:
        """Generate actionable keyword recommendations."""
        recommendations = []

        if difficulty > 70:
            recommendations.append("Consider targeting long-tail variations with lower competition")
            recommendations.append("Build domain authority before pursuing this keyword")

        if volume < 100:
            recommendations.append("Low search volume - verify demand before optimization")

        if intent == SearchIntent.TRANSACTIONAL:
            recommendations.append("Focus on conversion optimization - high buyer intent")
        elif intent == SearchIntent.INFORMATIONAL:
            recommendations.append("Create comprehensive, educational content")

        return recommendations

    def analyze_backlink_profile(
        self,
        url: str,
        backlinks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze backlink profile with Moz-style domain authority calculation.

        Args:
            url: Target URL to analyze
            backlinks: List of backlinks with metadata

        Returns:
            Comprehensive backlink analysis
        """
        try:
            logger.info(f"Analyzing backlink profile for: {url}")

            if not backlinks:
                return {
                    "url": url,
                    "total_backlinks": 0,
                    "domain_authority": 0,
                    "quality_score": 0,
                    "timestamp": datetime.now().isoformat()
                }

            # Calculate domain authority
            domain_authority = self._calculate_domain_authority(backlinks)

            # Analyze backlink quality
            quality_metrics = self._analyze_backlink_quality(backlinks)

            # Identify toxic backlinks
            toxic_backlinks = self._identify_toxic_backlinks(backlinks)

            # Get referring domains
            referring_domains = set(bl.get("source_domain", "") for bl in backlinks)

            # Calculate link velocity
            link_velocity = self._calculate_link_velocity(backlinks)

            # Anchor text distribution
            anchor_distribution = self._analyze_anchor_text_distribution(backlinks)

            result = {
                "url": url,
                "total_backlinks": len(backlinks),
                "referring_domains": len(referring_domains),
                "domain_authority": round(domain_authority, 2),
                "page_authority": round(domain_authority * 0.85, 2),  # Simplified PA
                "quality_score": round(quality_metrics["overall_quality"], 2),
                "quality_breakdown": quality_metrics,
                "toxic_backlinks": len(toxic_backlinks),
                "toxic_percentage": round(len(toxic_backlinks) / len(backlinks) * 100, 2),
                "link_velocity": link_velocity,
                "anchor_text_distribution": anchor_distribution,
                "top_referring_domains": self._get_top_referring_domains(backlinks, 10),
                "recommendations": self._generate_backlink_recommendations(
                    quality_metrics, toxic_backlinks, anchor_distribution
                ),
                "timestamp": datetime.now().isoformat()
            }

            self.backlink_database.append(result)
            logger.info(f"Backlink analysis completed. DA: {domain_authority:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing backlink profile: {str(e)}")
            raise

    def _calculate_domain_authority(self, backlinks: List[Dict[str, Any]]) -> float:
        """Calculate Moz-style domain authority score (0-100)."""
        # Factors: linking root domains, total links, link quality, spam score

        referring_domains = set(bl.get("source_domain", "") for bl in backlinks)
        num_domains = len(referring_domains)

        # Logarithmic scale for domains (like Moz)
        domain_factor = min(math.log10(num_domains + 1) / math.log10(1000), 1.0)

        # Quality factor from backlink attributes
        total_quality = 0
        for bl in backlinks:
            quality = 1.0
            if bl.get("dofollow", True):
                quality *= 1.5
            if bl.get("https", False):
                quality *= 1.1
            if not bl.get("nofollow", False):
                quality *= 1.2
            total_quality += quality

        avg_quality = total_quality / len(backlinks)
        quality_factor = min(avg_quality / 2, 1.0)

        # Link volume factor
        volume_factor = min(math.log10(len(backlinks) + 1) / math.log10(10000), 1.0)

        # Combined DA score
        da = (
            (domain_factor * 0.5) +
            (quality_factor * 0.3) +
            (volume_factor * 0.2)
        ) * 100

        return da

    def _analyze_backlink_quality(self, backlinks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze backlink quality metrics."""
        dofollow_count = sum(1 for bl in backlinks if bl.get("dofollow", True))
        https_count = sum(1 for bl in backlinks if bl.get("https", False))
        relevant_count = sum(1 for bl in backlinks if bl.get("relevance_score", 0) > 0.5)

        return {
            "overall_quality": (
                (dofollow_count / len(backlinks) * 0.4) +
                (https_count / len(backlinks) * 0.2) +
                (relevant_count / len(backlinks) * 0.4)
            ) * 100,
            "dofollow_percentage": round(dofollow_count / len(backlinks) * 100, 2),
            "https_percentage": round(https_count / len(backlinks) * 100, 2),
            "relevant_percentage": round(relevant_count / len(backlinks) * 100, 2)
        }

    def _identify_toxic_backlinks(self, backlinks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify potentially toxic backlinks."""
        toxic = []

        for bl in backlinks:
            toxicity_score = 0
            reasons = []

            # Check spam indicators
            if bl.get("spam_score", 0) > 7:
                toxicity_score += 30
                reasons.append("High spam score")

            # Check for suspicious anchor text
            anchor = bl.get("anchor_text", "").lower()
            if any(term in anchor for term in ["viagra", "casino", "poker", "pills"]):
                toxicity_score += 40
                reasons.append("Suspicious anchor text")

            # Check domain quality
            if bl.get("source_da", 0) < 10:
                toxicity_score += 20
                reasons.append("Low domain authority")

            if toxicity_score > 50:
                toxic.append({
                    "url": bl.get("source_url", ""),
                    "toxicity_score": toxicity_score,
                    "reasons": reasons
                })

        return toxic

    def _calculate_link_velocity(self, backlinks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate link acquisition velocity."""
        now = datetime.now()

        links_last_30d = sum(
            1 for bl in backlinks
            if (now - datetime.fromisoformat(bl.get("discovered_date", now.isoformat()))).days <= 30
        )

        links_last_90d = sum(
            1 for bl in backlinks
            if (now - datetime.fromisoformat(bl.get("discovered_date", now.isoformat()))).days <= 90
        )

        return {
            "links_last_30_days": links_last_30d,
            "links_last_90_days": links_last_90d,
            "avg_per_month": round(links_last_90d / 3, 2),
            "trend": "increasing" if links_last_30d > (links_last_90d / 3) else "stable"
        }

    def _analyze_anchor_text_distribution(self, backlinks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze anchor text distribution."""
        anchor_counts = Counter(bl.get("anchor_text", "").lower() for bl in backlinks)
        total = len(backlinks)

        # Classify anchor types
        branded = sum(1 for bl in backlinks if bl.get("anchor_type") == "branded")
        exact_match = sum(1 for bl in backlinks if bl.get("anchor_type") == "exact_match")
        partial_match = sum(1 for bl in backlinks if bl.get("anchor_type") == "partial_match")
        generic = sum(1 for bl in backlinks if bl.get("anchor_type") == "generic")

        return {
            "branded_percentage": round(branded / total * 100, 2),
            "exact_match_percentage": round(exact_match / total * 100, 2),
            "partial_match_percentage": round(partial_match / total * 100, 2),
            "generic_percentage": round(generic / total * 100, 2),
            "top_anchors": anchor_counts.most_common(10),
            "diversity_score": round(len(anchor_counts) / total * 100, 2)
        }

    def _get_top_referring_domains(
        self,
        backlinks: List[Dict[str, Any]],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top referring domains by quality."""
        domain_stats = defaultdict(lambda: {"count": 0, "da": 0, "quality": 0})

        for bl in backlinks:
            domain = bl.get("source_domain", "")
            domain_stats[domain]["count"] += 1
            domain_stats[domain]["da"] = max(domain_stats[domain]["da"], bl.get("source_da", 0))
            domain_stats[domain]["quality"] += bl.get("relevance_score", 0)

        # Sort by combined score
        sorted_domains = sorted(
            [
                {
                    "domain": domain,
                    "backlinks": stats["count"],
                    "domain_authority": stats["da"],
                    "avg_quality": round(stats["quality"] / stats["count"], 2)
                }
                for domain, stats in domain_stats.items()
            ],
            key=lambda x: x["domain_authority"] * x["backlinks"],
            reverse=True
        )

        return sorted_domains[:limit]

    def _generate_backlink_recommendations(
        self,
        quality_metrics: Dict[str, Any],
        toxic_backlinks: List[Dict[str, Any]],
        anchor_distribution: Dict[str, Any]
    ) -> List[str]:
        """Generate backlink profile recommendations."""
        recommendations = []

        if quality_metrics["overall_quality"] < 50:
            recommendations.append("Focus on acquiring high-quality, relevant backlinks")

        if len(toxic_backlinks) > 0:
            recommendations.append(f"Disavow {len(toxic_backlinks)} toxic backlinks")

        if anchor_distribution["exact_match_percentage"] > 30:
            recommendations.append("Diversify anchor text - high exact match ratio looks unnatural")

        if anchor_distribution["branded_percentage"] < 20:
            recommendations.append("Increase branded anchor text for natural link profile")

        return recommendations

    def audit_technical_seo(
        self,
        website_url: str,
        page_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Conduct comprehensive technical SEO audit.

        Args:
            website_url: Website URL to audit
            page_data: Page metadata (speed, mobile, schema, etc.)

        Returns:
            Technical SEO audit report
        """
        try:
            logger.info(f"Conducting technical SEO audit for: {website_url}")

            # Site speed analysis
            speed_score = self._analyze_site_speed(page_data.get("speed_metrics", {}))

            # Mobile friendliness
            mobile_score = self._analyze_mobile_friendliness(page_data.get("mobile_data", {}))

            # Schema markup validation
            schema_score = self._validate_schema_markup(page_data.get("schema", []))

            # SSL/HTTPS check
            https_score = 100 if website_url.startswith("https://") else 0

            # URL structure analysis
            url_score = self._analyze_url_structure(website_url)

            # Robots.txt and sitemap
            crawlability_score = self._check_crawlability(
                page_data.get("robots_txt", ""),
                page_data.get("sitemap_url", "")
            )

            # Overall technical score
            overall_score = (
                speed_score * 0.30 +
                mobile_score * 0.25 +
                schema_score * 0.15 +
                https_score * 0.10 +
                url_score * 0.10 +
                crawlability_score * 0.10
            )

            issues = []
            if speed_score < 70:
                issues.append({"severity": "high", "issue": "Slow page load time", "impact": "Rankings and user experience"})
            if mobile_score < 80:
                issues.append({"severity": "high", "issue": "Mobile usability problems", "impact": "Mobile rankings"})
            if schema_score < 50:
                issues.append({"severity": "medium", "issue": "Missing or invalid schema markup", "impact": "Rich snippet opportunities"})
            if https_score == 0:
                issues.append({"severity": "critical", "issue": "No HTTPS/SSL", "impact": "Security and rankings"})

            result = {
                "website_url": website_url,
                "overall_score": round(overall_score, 2),
                "technical_seo": {
                    "speed_score": round(speed_score, 2),
                    "mobile_score": round(mobile_score, 2),
                    "schema_score": round(schema_score, 2),
                    "https_score": https_score,
                    "url_score": round(url_score, 2),
                    "crawlability_score": round(crawlability_score, 2)
                },
                "issues_found": issues,
                "recommendations": self._generate_technical_recommendations(issues, overall_score),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Technical audit completed. Overall score: {overall_score:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error in technical SEO audit: {str(e)}")
            raise

    def _analyze_site_speed(self, speed_metrics: Dict[str, Any]) -> float:
        """Analyze site speed metrics."""
        # Core Web Vitals scoring
        lcp = speed_metrics.get("lcp", 4000)  # Largest Contentful Paint (ms)
        fid = speed_metrics.get("fid", 200)   # First Input Delay (ms)
        cls = speed_metrics.get("cls", 0.2)   # Cumulative Layout Shift

        # LCP score (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
        lcp_score = 100 if lcp < 2500 else (50 if lcp < 4000 else 0)

        # FID score (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
        fid_score = 100 if fid < 100 else (50 if fid < 300 else 0)

        # CLS score (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
        cls_score = 100 if cls < 0.1 else (50 if cls < 0.25 else 0)

        return (lcp_score + fid_score + cls_score) / 3

    def _analyze_mobile_friendliness(self, mobile_data: Dict[str, Any]) -> float:
        """Analyze mobile friendliness."""
        score = 100

        if not mobile_data.get("responsive", True):
            score -= 40
        if not mobile_data.get("viewport_configured", True):
            score -= 20
        if mobile_data.get("text_too_small", False):
            score -= 15
        if mobile_data.get("clickable_elements_too_close", False):
            score -= 15
        if mobile_data.get("content_wider_than_screen", False):
            score -= 10

        return max(score, 0)

    def _validate_schema_markup(self, schema_data: List[Dict[str, Any]]) -> float:
        """Validate schema markup."""
        if not schema_data:
            return 0

        valid_schemas = sum(1 for s in schema_data if s.get("valid", False))
        coverage_score = (len(schema_data) / 5) * 50  # Expect at least 5 schema types
        validity_score = (valid_schemas / len(schema_data)) * 50

        return min(coverage_score + validity_score, 100)

    def _analyze_url_structure(self, url: str) -> float:
        """Analyze URL structure for SEO."""
        score = 100
        parsed = urlparse(url)
        path = parsed.path

        # Check URL length
        if len(url) > 100:
            score -= 15

        # Check for keywords in URL
        if not any(char.isalpha() for char in path):
            score -= 20

        # Check for hyphens vs underscores
        if "_" in path:
            score -= 10

        # Check depth
        depth = len([p for p in path.split("/") if p])
        if depth > 3:
            score -= 15

        # Check for parameters
        if "?" in url and len(parsed.query) > 50:
            score -= 10

        return max(score, 0)

    def _check_crawlability(self, robots_txt: str, sitemap_url: str) -> float:
        """Check crawlability factors."""
        score = 100

        if not sitemap_url:
            score -= 40

        if not robots_txt:
            score -= 30
        elif "Disallow: /" in robots_txt:
            score -= 50

        return max(score, 0)

    def _generate_technical_recommendations(
        self,
        issues: List[Dict[str, Any]],
        overall_score: float
    ) -> List[str]:
        """Generate technical SEO recommendations."""
        recommendations = []

        for issue in issues:
            if issue["severity"] == "critical":
                recommendations.append(f"URGENT: {issue['issue']}")
            elif issue["severity"] == "high":
                recommendations.append(f"High Priority: {issue['issue']}")

        if overall_score < 50:
            recommendations.append("Conduct comprehensive technical SEO overhaul")

        return recommendations

    def track_keyword_rankings(
        self,
        keywords: List[str],
        current_positions: Dict[str, int],
        timeframe: str = "30d"
    ) -> Dict[str, Any]:
        """Track keyword rankings with SERP position monitoring.

        Args:
            keywords: List of keywords to track
            current_positions: Current SERP positions for keywords
            timeframe: Tracking timeframe

        Returns:
            Ranking tracking data with trends
        """
        try:
            logger.info(f"Tracking rankings for {len(keywords)} keywords")

            ranking_data = {}
            changes = {}

            for keyword in keywords:
                current_pos = current_positions.get(keyword, 0)

                # Get historical data
                history = self.rank_history.get(keyword, [])

                # Calculate change
                if history:
                    last_pos = history[-1]["position"]
                    change = last_pos - current_pos  # Positive = improvement
                else:
                    change = 0

                # Add to history
                history_entry = {
                    "position": current_pos,
                    "timestamp": datetime.now().isoformat(),
                    "change": change
                }
                self.rank_history[keyword].append(history_entry)

                # Calculate visibility score (position-weighted)
                visibility = self._calculate_visibility_score(current_pos)

                ranking_data[keyword] = {
                    "current_position": current_pos,
                    "previous_position": history[-1]["position"] if history else current_pos,
                    "change": change,
                    "visibility_score": visibility,
                    "status": "improving" if change > 0 else "declining" if change < 0 else "stable"
                }

                changes[keyword] = change

            # Overall performance metrics
            avg_position = sum(current_positions.values()) / len(current_positions) if current_positions else 0
            top_10_keywords = sum(1 for pos in current_positions.values() if pos <= 10)
            top_3_keywords = sum(1 for pos in current_positions.values() if pos <= 3)

            result = {
                "keywords": keywords,
                "timeframe": timeframe,
                "rankings": ranking_data,
                "changes": changes,
                "summary": {
                    "total_keywords": len(keywords),
                    "avg_position": round(avg_position, 2),
                    "top_10_count": top_10_keywords,
                    "top_3_count": top_3_keywords,
                    "improving_count": sum(1 for c in changes.values() if c > 0),
                    "declining_count": sum(1 for c in changes.values() if c < 0)
                },
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Ranking tracking completed. Avg position: {avg_position:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error tracking rankings: {str(e)}")
            raise

    def _calculate_visibility_score(self, position: int) -> float:
        """Calculate visibility score based on SERP position."""
        # CTR distribution approximation
        ctr_map = {
            1: 31.7, 2: 24.7, 3: 18.7, 4: 13.6, 5: 9.5,
            6: 6.3, 7: 4.2, 8: 3.2, 9: 2.6, 10: 2.1
        }

        if position <= 10:
            return ctr_map.get(position, 0)
        elif position <= 20:
            return 1.0
        else:
            return 0.3

    def analyze_competitor_keyword_gap(
        self,
        your_keywords: Set[str],
        competitor_keywords: Dict[str, Set[str]]
    ) -> Dict[str, Any]:
        """Analyze keyword gap between you and competitors.

        Args:
            your_keywords: Set of your ranking keywords
            competitor_keywords: Dict of competitor -> their keywords

        Returns:
            Keyword gap analysis with opportunities
        """
        try:
            logger.info(f"Analyzing keyword gap with {len(competitor_keywords)} competitors")

            # Find keywords competitors rank for but you don't
            all_competitor_keywords = set()
            for keywords in competitor_keywords.values():
                all_competitor_keywords.update(keywords)

            gap_keywords = all_competitor_keywords - your_keywords

            # Find keywords you rank for but competitors don't
            unique_keywords = your_keywords - all_competitor_keywords

            # Find common keywords
            common_keywords = your_keywords & all_competitor_keywords

            # Analyze competitor overlap
            competitor_overlap = {}
            for comp, keywords in competitor_keywords.items():
                overlap = keywords & your_keywords
                gap = keywords - your_keywords
                competitor_overlap[comp] = {
                    "overlap_count": len(overlap),
                    "gap_count": len(gap),
                    "overlap_percentage": round(len(overlap) / len(keywords) * 100, 2) if keywords else 0
                }

            # Prioritize gap keywords
            prioritized_gaps = self._prioritize_gap_keywords(gap_keywords, competitor_keywords)

            result = {
                "your_keyword_count": len(your_keywords),
                "competitor_keyword_count": len(all_competitor_keywords),
                "gap_keywords": list(gap_keywords),
                "gap_count": len(gap_keywords),
                "unique_keywords": list(unique_keywords),
                "unique_count": len(unique_keywords),
                "common_keywords": list(common_keywords),
                "common_count": len(common_keywords),
                "competitor_overlap": competitor_overlap,
                "prioritized_opportunities": prioritized_gaps[:20],
                "recommendations": self._generate_gap_recommendations(
                    len(gap_keywords), len(unique_keywords), len(common_keywords)
                ),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Gap analysis completed. Found {len(gap_keywords)} opportunities")
            return result

        except Exception as e:
            logger.error(f"Error analyzing keyword gap: {str(e)}")
            raise

    def _prioritize_gap_keywords(
        self,
        gap_keywords: Set[str],
        competitor_keywords: Dict[str, Set[str]]
    ) -> List[Dict[str, Any]]:
        """Prioritize gap keywords by opportunity."""
        keyword_scores = []

        for keyword in gap_keywords:
            # Count how many competitors rank for this keyword
            competitor_count = sum(1 for keywords in competitor_keywords.values() if keyword in keywords)

            # Higher competitor count = validated opportunity
            priority_score = competitor_count * 10

            keyword_scores.append({
                "keyword": keyword,
                "competitor_count": competitor_count,
                "priority_score": priority_score
            })

        return sorted(keyword_scores, key=lambda x: x["priority_score"], reverse=True)

    def _generate_gap_recommendations(
        self,
        gap_count: int,
        unique_count: int,
        common_count: int
    ) -> List[str]:
        """Generate keyword gap recommendations."""
        recommendations = []

        if gap_count > 100:
            recommendations.append(f"Large keyword gap detected ({gap_count} keywords) - prioritize content creation")

        if unique_count < 10:
            recommendations.append("Limited unique keywords - need to find untapped opportunities")

        if common_count > gap_count:
            recommendations.append("Good keyword coverage - focus on improving rankings for common keywords")

        return recommendations

    def score_on_page_seo(
        self,
        url: str,
        content: str,
        target_keyword: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score on-page SEO elements.

        Args:
            url: Page URL
            content: Page content (HTML or text)
            target_keyword: Target keyword
            metadata: Page metadata (title, description, headings, images)

        Returns:
            Comprehensive on-page SEO score
        """
        try:
            logger.info(f"Scoring on-page SEO for: {url}")

            # Score individual elements
            title_score = self._score_title(metadata.get("title", ""), target_keyword)
            meta_score = self._score_meta_description(metadata.get("description", ""), target_keyword)
            heading_score = self._score_headings(metadata.get("headings", []), target_keyword)
            content_score = self._score_content(content, target_keyword)
            image_score = self._score_images(metadata.get("images", []))
            internal_link_score = self._score_internal_links(metadata.get("internal_links", []))
            url_score = self._analyze_url_structure(url)

            # Calculate weighted overall score
            overall_score = (
                title_score * self.seo_weights["title"] +
                meta_score * self.seo_weights["meta_description"] +
                heading_score * self.seo_weights["headings"] +
                content_score * self.seo_weights["content"] +
                image_score * self.seo_weights["images"] +
                internal_link_score * self.seo_weights["internal_links"] +
                url_score * self.seo_weights["url_structure"]
            )

            result = {
                "url": url,
                "target_keyword": target_keyword,
                "overall_score": round(overall_score, 2),
                "component_scores": {
                    "title": round(title_score, 2),
                    "meta_description": round(meta_score, 2),
                    "headings": round(heading_score, 2),
                    "content": round(content_score, 2),
                    "images": round(image_score, 2),
                    "internal_links": round(internal_link_score, 2),
                    "url": round(url_score, 2)
                },
                "optimizations": self._generate_on_page_optimizations(
                    title_score, meta_score, heading_score, content_score,
                    image_score, internal_link_score
                ),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"On-page SEO scored: {overall_score:.2f}")
            return result

        except Exception as e:
            logger.error(f"Error scoring on-page SEO: {str(e)}")
            raise

    def _score_title(self, title: str, keyword: str) -> float:
        """Score title tag."""
        score = 100

        if not title:
            return 0

        # Check length
        if len(title) < 30 or len(title) > 60:
            score -= 20

        # Check keyword presence
        if keyword.lower() not in title.lower():
            score -= 40
        else:
            # Bonus for keyword at start
            if title.lower().startswith(keyword.lower()):
                score += 10

        return max(min(score, 100), 0)

    def _score_meta_description(self, description: str, keyword: str) -> float:
        """Score meta description."""
        score = 100

        if not description:
            return 0

        # Check length
        if len(description) < 120 or len(description) > 160:
            score -= 20

        # Check keyword presence
        if keyword.lower() not in description.lower():
            score -= 30

        # Check for call-to-action
        cta_terms = ["learn", "discover", "find out", "get", "download", "try"]
        if not any(term in description.lower() for term in cta_terms):
            score -= 10

        return max(score, 0)

    def _score_headings(self, headings: List[Dict[str, str]], keyword: str) -> float:
        """Score heading structure."""
        if not headings:
            return 0

        score = 100

        # Check H1 presence
        h1_tags = [h for h in headings if h.get("level") == "h1"]
        if not h1_tags:
            score -= 40
        elif len(h1_tags) > 1:
            score -= 20
        elif keyword.lower() not in h1_tags[0].get("text", "").lower():
            score -= 20

        # Check heading hierarchy
        levels = [int(h.get("level", "h1")[1]) for h in headings]
        if levels != sorted(levels):
            score -= 15

        # Check keyword in subheadings
        keyword_in_subheadings = sum(
            1 for h in headings
            if h.get("level") in ["h2", "h3"] and keyword.lower() in h.get("text", "").lower()
        )
        if keyword_in_subheadings == 0:
            score -= 15

        return max(score, 0)

    def _score_content(self, content: str, keyword: str) -> float:
        """Score content optimization."""
        if not content:
            return 0

        score = 100
        words = content.split()
        word_count = len(words)

        # Check content length
        if word_count < 300:
            score -= 30
        elif word_count > 2500:
            score -= 10

        # Check keyword density
        keyword_count = content.lower().count(keyword.lower())
        keyword_density = keyword_count / word_count if word_count > 0 else 0

        if keyword_density < 0.005:
            score -= 20
        elif keyword_density > 0.03:
            score -= 25  # Over-optimization

        # Check for related terms (LSI keywords)
        keyword_words = set(keyword.lower().split())
        content_words = set(w.lower() for w in words)
        if len(keyword_words & content_words) < len(keyword_words) * 0.8:
            score -= 15

        return max(score, 0)

    def _score_images(self, images: List[Dict[str, Any]]) -> float:
        """Score image optimization."""
        if not images:
            return 50  # Not critical

        score = 100
        images_with_alt = sum(1 for img in images if img.get("alt_text"))

        if images_with_alt == 0:
            score -= 50
        else:
            alt_coverage = images_with_alt / len(images)
            if alt_coverage < 0.8:
                score -= 30

        return max(score, 0)

    def _score_internal_links(self, internal_links: List[str]) -> float:
        """Score internal linking."""
        if not internal_links:
            return 50

        score = 100

        if len(internal_links) < 2:
            score -= 30
        elif len(internal_links) > 10:
            score -= 20

        return max(score, 0)

    def _generate_on_page_optimizations(
        self,
        title_score: float,
        meta_score: float,
        heading_score: float,
        content_score: float,
        image_score: float,
        internal_link_score: float
    ) -> List[str]:
        """Generate on-page optimization recommendations."""
        optimizations = []

        if title_score < 70:
            optimizations.append("Optimize title tag: include target keyword and keep 30-60 characters")

        if meta_score < 70:
            optimizations.append("Improve meta description: add keyword and call-to-action, 120-160 characters")

        if heading_score < 70:
            optimizations.append("Fix heading structure: use single H1 with keyword, logical H2-H3 hierarchy")

        if content_score < 70:
            optimizations.append("Enhance content: increase length to 800+ words, optimize keyword density to 0.5-2%")

        if image_score < 70:
            optimizations.append("Add alt text to all images with descriptive, keyword-rich text")

        if internal_link_score < 70:
            optimizations.append("Add 3-5 relevant internal links to related content")

        return optimizations

    def generate_content_optimization_report(
        self,
        url: str,
        content: str,
        target_keywords: List[str],
        competitor_content: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive content optimization recommendations.

        Args:
            url: Page URL
            content: Current content
            target_keywords: List of target keywords
            competitor_content: Optional competitor content analysis

        Returns:
            Detailed optimization recommendations
        """
        try:
            logger.info(f"Generating content optimization report for: {url}")

            recommendations = {
                "keyword_optimization": [],
                "content_structure": [],
                "competitive_analysis": [],
                "technical_improvements": []
            }

            # Analyze each keyword
            for keyword in target_keywords:
                keyword_density = content.lower().count(keyword.lower()) / len(content.split())

                if keyword_density < 0.01:
                    recommendations["keyword_optimization"].append(
                        f"Increase usage of '{keyword}' (current: {keyword_density:.2%})"
                    )
                elif keyword_density > 0.03:
                    recommendations["keyword_optimization"].append(
                        f"Reduce usage of '{keyword}' to avoid over-optimization (current: {keyword_density:.2%})"
                    )

            # Content structure recommendations
            word_count = len(content.split())
            if word_count < 1000:
                recommendations["content_structure"].append(
                    f"Expand content to at least 1000 words (current: {word_count})"
                )

            # Competitor analysis
            if competitor_content:
                avg_competitor_length = sum(
                    c.get("word_count", 0) for c in competitor_content
                ) / len(competitor_content)

                if word_count < avg_competitor_length * 0.8:
                    recommendations["competitive_analysis"].append(
                        f"Competitors average {int(avg_competitor_length)} words - consider expanding"
                    )

            result = {
                "url": url,
                "current_word_count": word_count,
                "target_keywords": target_keywords,
                "recommendations": recommendations,
                "priority_actions": self._prioritize_recommendations(recommendations),
                "estimated_impact": "high" if len(recommendations["keyword_optimization"]) > 3 else "medium",
                "timestamp": datetime.now().isoformat()
            }

            logger.info("Content optimization report generated")
            return result

        except Exception as e:
            logger.error(f"Error generating optimization report: {str(e)}")
            raise

    def _prioritize_recommendations(self, recommendations: Dict[str, List[str]]) -> List[str]:
        """Prioritize recommendations by impact."""
        priority = []

        # High impact items first
        priority.extend(recommendations.get("keyword_optimization", [])[:3])
        priority.extend(recommendations.get("technical_improvements", [])[:2])
        priority.extend(recommendations.get("content_structure", [])[:2])

        return priority[:5]

    def research_keywords(self, topic: str, intent: str = "informational") -> Dict[str, Any]:
        """Research keywords for a topic (enhanced legacy method)."""
        logger.info(f"Researching keywords for topic: {topic}")

        # Generate keyword variations
        base_keywords = self._generate_keyword_variations(topic)

        research = {
            "research_id": f"keyword_{datetime.now().timestamp()}",
            "topic": topic,
            "intent": intent,
            "keywords": base_keywords,
            "search_volume": {kw: self._estimate_search_volume(kw) for kw in base_keywords},
            "competition": {kw: self._estimate_competition(kw) for kw in base_keywords},
            "timestamp": datetime.now().isoformat()
        }

        self.keywords.append(research)
        return research

    def _generate_keyword_variations(self, topic: str) -> List[str]:
        """Generate keyword variations."""
        variations = [topic]

        # Add question formats
        question_words = ["what", "how", "why", "when", "where"]
        variations.extend([f"{qw} {topic}" for qw in question_words])

        # Add modifiers
        modifiers = ["best", "top", "guide", "tips", "tutorial"]
        variations.extend([f"{mod} {topic}" for mod in modifiers])

        return variations[:20]

    def _estimate_search_volume(self, keyword: str) -> int:
        """Estimate search volume (mock implementation)."""
        # In production, integrate with Google Keyword Planner API
        base_volume = len(keyword.split()) * 500
        return max(100, min(base_volume, 10000))

    def _estimate_competition(self, keyword: str) -> float:
        """Estimate competition score (mock implementation)."""
        # In production, use real competition data
        return min(len(keyword) / 50, 1.0)
