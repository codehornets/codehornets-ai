"""
Social Media Manager Agent

Manages social media presence with posting schedules, engagement analysis,
hashtag research, platform optimization, and performance tracking.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import re
import hashlib
from collections import Counter, defaultdict
from enum import Enum
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SocialPlatform(Enum):
    """Social media platforms."""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"


class PostType(Enum):
    """Types of social media posts."""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"
    LIVE = "live"
    POLL = "poll"


class EngagementType(Enum):
    """Types of engagement actions."""
    LIKE = "like"
    COMMENT = "comment"
    SHARE = "share"
    SAVE = "save"
    CLICK = "click"
    FOLLOW = "follow"


class SocialMediaManagerAgent:
    """Social Media Manager Agent for comprehensive social media management."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Social Media Manager Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.agent_id = "social_media_manager_001"
        self.config = config or {}
        self.posts: List[Dict[str, Any]] = []
        self.schedules: List[Dict[str, Any]] = []
        self.hashtag_database: Dict[str, Dict[str, Any]] = {}
        self.engagement_data: List[Dict[str, Any]] = []
        self.name = "Social Media Manager"
        self.role = "Social Media Management"

        # Platform-specific optimal posting times (hour of day)
        self.optimal_times = {
            SocialPlatform.FACEBOOK.value: [9, 13, 15],
            SocialPlatform.INSTAGRAM.value: [11, 14, 19],
            SocialPlatform.TWITTER.value: [8, 12, 17],
            SocialPlatform.LINKEDIN.value: [8, 12, 17],
            SocialPlatform.TIKTOK.value: [15, 18, 21],
            SocialPlatform.YOUTUBE.value: [14, 18, 20],
            SocialPlatform.PINTEREST.value: [20, 21, 22]
        }

        # Platform character limits
        self.character_limits = {
            SocialPlatform.TWITTER.value: 280,
            SocialPlatform.FACEBOOK.value: 63206,
            SocialPlatform.INSTAGRAM.value: 2200,
            SocialPlatform.LINKEDIN.value: 3000,
            SocialPlatform.TIKTOK.value: 2200
        }

        logger.info(f"SocialMediaManagerAgent {self.agent_id} initialized")

    def create_post(
        self,
        platform: str,
        content: str,
        media: List[str] = None,
        post_type: str = "text",
        hashtags: List[str] = None,
        mentions: List[str] = None
    ) -> Dict[str, Any]:
        """Create a comprehensive social media post.

        Args:
            platform: Social media platform
            content: Post content/caption
            media: List of media URLs
            post_type: Type of post
            hashtags: List of hashtags (without #)
            mentions: List of user mentions

        Returns:
            Post data with optimization suggestions
        """
        try:
            logger.info(f"Creating {post_type} post for {platform}")

            # Validate platform
            if platform not in [p.value for p in SocialPlatform]:
                logger.warning(f"Unknown platform: {platform}")

            # Validate content length
            char_limit = self.character_limits.get(platform, 10000)
            content_validation = self._validate_content_length(content, char_limit)

            # Optimize hashtags
            if hashtags:
                optimized_hashtags = self._optimize_hashtags(hashtags, platform)
            else:
                optimized_hashtags = self._suggest_hashtags(content, platform)

            # Calculate engagement prediction
            engagement_prediction = self._predict_engagement(
                platform, post_type, content, len(media) if media else 0, len(optimized_hashtags)
            )

            # Determine optimal posting time
            optimal_time = self._get_optimal_posting_time(platform)

            post = {
                "post_id": self._generate_post_id(),
                "platform": platform,
                "content": content,
                "content_validation": content_validation,
                "media": media or [],
                "media_count": len(media) if media else 0,
                "post_type": post_type,
                "hashtags": optimized_hashtags,
                "mentions": mentions or [],
                "scheduled_time": None,
                "optimal_posting_time": optimal_time,
                "engagement_prediction": engagement_prediction,
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "performance_metrics": {
                    "impressions": 0,
                    "reach": 0,
                    "engagement_rate": 0.0,
                    "likes": 0,
                    "comments": 0,
                    "shares": 0,
                    "saves": 0,
                    "clicks": 0
                }
            }

            self.posts.append(post)
            logger.info(f"Post created successfully: {post['post_id']}")
            return post

        except Exception as e:
            logger.error(f"Error creating post: {str(e)}")
            return {"error": str(e), "status": "failed"}

    def _validate_content_length(self, content: str, char_limit: int) -> Dict[str, Any]:
        """Validate content length for platform."""
        try:
            content_length = len(content)
            is_valid = content_length <= char_limit

            return {
                "length": content_length,
                "limit": char_limit,
                "is_valid": is_valid,
                "remaining": char_limit - content_length if is_valid else 0,
                "warning": f"Content exceeds limit by {content_length - char_limit} characters" if not is_valid else None
            }
        except Exception as e:
            logger.error(f"Error validating content: {str(e)}")
            return {}

    def _optimize_hashtags(self, hashtags: List[str], platform: str) -> List[str]:
        """Optimize hashtags for the platform."""
        try:
            # Platform-specific hashtag limits
            limits = {
                SocialPlatform.INSTAGRAM.value: 30,
                SocialPlatform.TWITTER.value: 2,
                SocialPlatform.LINKEDIN.value: 5,
                SocialPlatform.FACEBOOK.value: 3,
                SocialPlatform.TIKTOK.value: 8
            }

            max_hashtags = limits.get(platform, 10)

            # Clean hashtags
            cleaned = [h.strip().lstrip('#').replace(' ', '') for h in hashtags]

            # Remove duplicates while preserving order
            seen = set()
            unique_hashtags = []
            for tag in cleaned:
                if tag.lower() not in seen and tag:
                    seen.add(tag.lower())
                    unique_hashtags.append(tag)

            # Limit to platform maximum
            return unique_hashtags[:max_hashtags]

        except Exception as e:
            logger.error(f"Error optimizing hashtags: {str(e)}")
            return hashtags

    def _suggest_hashtags(self, content: str, platform: str) -> List[str]:
        """Suggest hashtags based on content."""
        try:
            # Extract keywords from content
            words = re.findall(r'\b\w{4,}\b', content.lower())
            word_freq = Counter(words)

            # Get most common words
            common_words = [word for word, _ in word_freq.most_common(5)]

            # Add generic popular hashtags based on platform
            platform_hashtags = {
                SocialPlatform.INSTAGRAM.value: ["instagood", "photooftheday"],
                SocialPlatform.LINKEDIN.value: ["business", "professional"],
                SocialPlatform.TWITTER.value: ["trending"],
                SocialPlatform.TIKTOK.value: ["fyp", "viral"]
            }

            suggested = common_words + platform_hashtags.get(platform, [])
            return self._optimize_hashtags(suggested, platform)

        except Exception as e:
            logger.error(f"Error suggesting hashtags: {str(e)}")
            return []

    def research_hashtags(
        self,
        topic: str,
        platform: str,
        competition_level: str = "medium"
    ) -> Dict[str, Any]:
        """Research hashtags for a topic.

        Args:
            topic: Topic or niche
            platform: Social media platform
            competition_level: Desired competition level (low, medium, high)

        Returns:
            Hashtag research data with recommendations
        """
        try:
            logger.info(f"Researching hashtags for topic: {topic} on {platform}")

            # Generate hashtag variations
            base_tags = self._generate_hashtag_variations(topic)

            # Simulate hashtag metrics (in production, would fetch from API)
            hashtag_data = []
            for tag in base_tags:
                metrics = self._simulate_hashtag_metrics(tag, platform, competition_level)
                hashtag_data.append(metrics)

            # Sort by score
            hashtag_data.sort(key=lambda x: x['score'], reverse=True)

            # Categorize hashtags
            categorized = self._categorize_hashtags(hashtag_data)

            research = {
                "research_id": self._generate_post_id(),
                "topic": topic,
                "platform": platform,
                "total_hashtags_analyzed": len(hashtag_data),
                "recommended_hashtags": [h['tag'] for h in hashtag_data[:15]],
                "hashtag_data": hashtag_data,
                "categorized": categorized,
                "mixing_strategy": self._create_hashtag_mix_strategy(categorized),
                "timestamp": datetime.now().isoformat()
            }

            # Store in database
            self.hashtag_database[research["research_id"]] = research

            logger.info(f"Hashtag research complete: {len(hashtag_data)} hashtags analyzed")
            return research

        except Exception as e:
            logger.error(f"Error researching hashtags: {str(e)}")
            return {"error": str(e)}

    def _generate_hashtag_variations(self, topic: str) -> List[str]:
        """Generate hashtag variations for a topic."""
        try:
            topic_clean = topic.strip().replace(' ', '')
            variations = [topic_clean]

            # Add common variations
            prefixes = ['daily', 'love', 'best', 'top', 'my']
            suffixes = ['gram', 'life', 'love', 'goals', 'inspiration']

            for prefix in prefixes:
                variations.append(f"{prefix}{topic_clean}")

            for suffix in suffixes:
                variations.append(f"{topic_clean}{suffix}")

            # Add related terms (simplified - in production would use NLP)
            related_terms = self._get_related_terms(topic)
            variations.extend(related_terms)

            return list(set(variations[:30]))

        except Exception as e:
            logger.error(f"Error generating variations: {str(e)}")
            return [topic]

    def _get_related_terms(self, topic: str) -> List[str]:
        """Get related terms for a topic."""
        # Simplified - in production would use semantic analysis
        topic_lower = topic.lower()
        related_map = {
            'fitness': ['gym', 'workout', 'health', 'wellness', 'training'],
            'food': ['cooking', 'recipe', 'foodie', 'delicious', 'yummy'],
            'travel': ['wanderlust', 'adventure', 'explore', 'vacation', 'tourism'],
            'fashion': ['style', 'outfit', 'ootd', 'trendy', 'fashionista'],
            'business': ['entrepreneur', 'startup', 'marketing', 'success', 'leadership']
        }

        for key, values in related_map.items():
            if key in topic_lower:
                return values

        return []

    def _simulate_hashtag_metrics(
        self,
        tag: str,
        platform: str,
        competition_level: str
    ) -> Dict[str, Any]:
        """Simulate hashtag metrics."""
        try:
            # Simulate post count based on tag length and competition
            base_posts = len(tag) * 100000

            if competition_level == "low":
                posts = base_posts * random.uniform(0.1, 0.3)
            elif competition_level == "high":
                posts = base_posts * random.uniform(2.0, 5.0)
            else:
                posts = base_posts * random.uniform(0.5, 1.5)

            # Calculate difficulty score
            difficulty = min(100, (posts / 1000000) * 100)

            # Calculate engagement rate (inversely related to difficulty)
            engagement_rate = max(0.1, 5.0 - (difficulty / 25))

            # Calculate overall score
            score = (engagement_rate * 0.6) + ((100 - difficulty) * 0.4)

            return {
                "tag": tag,
                "posts": int(posts),
                "difficulty": round(difficulty, 2),
                "engagement_rate": round(engagement_rate, 2),
                "score": round(score, 2),
                "competition": competition_level
            }

        except Exception as e:
            logger.error(f"Error simulating metrics: {str(e)}")
            return {}

    def _categorize_hashtags(self, hashtag_data: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Categorize hashtags by difficulty."""
        try:
            categorized = {
                "high_volume": [],
                "medium_volume": [],
                "niche": []
            }

            for data in hashtag_data:
                difficulty = data.get('difficulty', 50)
                tag = data.get('tag', '')

                if difficulty > 70:
                    categorized["high_volume"].append(tag)
                elif difficulty > 30:
                    categorized["medium_volume"].append(tag)
                else:
                    categorized["niche"].append(tag)

            return categorized

        except Exception as e:
            logger.error(f"Error categorizing hashtags: {str(e)}")
            return {}

    def _create_hashtag_mix_strategy(self, categorized: Dict[str, List[str]]) -> Dict[str, Any]:
        """Create hashtag mixing strategy."""
        try:
            return {
                "strategy": "balanced",
                "recommended_mix": {
                    "high_volume": "2-3 hashtags (broad reach)",
                    "medium_volume": "5-7 hashtags (targeted reach)",
                    "niche": "8-10 hashtags (engaged audience)"
                },
                "total_recommended": "15-20 hashtags per post",
                "rationale": "Mix ensures both reach and engagement"
            }
        except Exception as e:
            logger.error(f"Error creating strategy: {str(e)}")
            return {}

    def schedule_posts(
        self,
        posts: List[Dict[str, Any]],
        start_date: datetime,
        frequency: str = "daily",
        platforms: List[str] = None
    ) -> Dict[str, Any]:
        """Schedule social media posts with optimal timing.

        Args:
            posts: List of post data
            start_date: Start date for scheduling
            frequency: Posting frequency (daily, twice_daily, weekly)
            platforms: Specific platforms to schedule for

        Returns:
            Schedule data with optimal timing
        """
        try:
            logger.info(f"Scheduling {len(posts)} posts starting {start_date}")

            schedule_items = []
            current_date = start_date

            frequency_intervals = {
                "daily": 1,
                "twice_daily": 0.5,
                "every_other_day": 2,
                "weekly": 7,
                "twice_weekly": 3.5
            }

            interval_days = frequency_intervals.get(frequency, 1)

            for i, post in enumerate(posts):
                platform = post.get('platform', 'facebook')

                # Get optimal hour for platform
                optimal_hours = self.optimal_times.get(platform, [12])
                selected_hour = optimal_hours[i % len(optimal_hours)]

                # Calculate scheduled time
                scheduled_time = current_date.replace(hour=selected_hour, minute=0, second=0)

                schedule_item = {
                    "schedule_id": f"sched_{i}_{self._generate_post_id()}",
                    "post_id": post.get('post_id'),
                    "platform": platform,
                    "scheduled_time": scheduled_time.isoformat(),
                    "optimal_time": True,
                    "status": "scheduled",
                    "auto_publish": self.config.get('auto_publish', False)
                }

                schedule_items.append(schedule_item)

                # Increment date
                if frequency == "twice_daily" and i % 2 == 1:
                    current_date += timedelta(days=1)
                else:
                    current_date += timedelta(days=interval_days)

            schedule = {
                "schedule_id": self._generate_post_id(),
                "start_date": start_date.isoformat(),
                "frequency": frequency,
                "platforms": platforms or list(set(p.get('platform') for p in posts)),
                "total_posts": len(posts),
                "scheduled_items": schedule_items,
                "status": "active",
                "created_at": datetime.now().isoformat()
            }

            self.schedules.append(schedule)
            logger.info(f"Schedule created with {len(schedule_items)} items")
            return schedule

        except Exception as e:
            logger.error(f"Error scheduling posts: {str(e)}")
            return {"error": str(e)}

    def _get_optimal_posting_time(self, platform: str) -> str:
        """Get optimal posting time for platform."""
        try:
            hours = self.optimal_times.get(platform, [12])
            selected_hour = random.choice(hours)

            # Get next occurrence of this hour
            now = datetime.now()
            next_time = now.replace(hour=selected_hour, minute=0, second=0, microsecond=0)

            if next_time < now:
                next_time += timedelta(days=1)

            return next_time.isoformat()

        except Exception as e:
            logger.error(f"Error getting optimal time: {str(e)}")
            return datetime.now().isoformat()

    def _predict_engagement(
        self,
        platform: str,
        post_type: str,
        content: str,
        media_count: int,
        hashtag_count: int
    ) -> Dict[str, Any]:
        """Predict post engagement using heuristics.

        Args:
            platform: Social platform
            post_type: Type of post
            content: Post content
            media_count: Number of media items
            hashtag_count: Number of hashtags

        Returns:
            Engagement prediction data
        """
        try:
            # Base engagement rate by platform
            base_rates = {
                SocialPlatform.INSTAGRAM.value: 1.5,
                SocialPlatform.FACEBOOK.value: 0.8,
                SocialPlatform.TWITTER.value: 0.5,
                SocialPlatform.LINKEDIN.value: 2.0,
                SocialPlatform.TIKTOK.value: 5.0
            }

            base_rate = base_rates.get(platform, 1.0)

            # Post type multipliers
            type_multipliers = {
                PostType.VIDEO.value: 1.5,
                PostType.CAROUSEL.value: 1.3,
                PostType.IMAGE.value: 1.2,
                PostType.STORY.value: 1.1,
                PostType.TEXT.value: 0.8
            }

            type_multiplier = type_multipliers.get(post_type, 1.0)

            # Content factors
            word_count = len(content.split())
            has_question = '?' in content
            has_cta = any(word in content.lower() for word in ['click', 'link', 'shop', 'buy', 'learn'])

            # Calculate multipliers
            content_multiplier = 1.0
            if 20 <= word_count <= 100:
                content_multiplier += 0.2
            if has_question:
                content_multiplier += 0.15
            if has_cta:
                content_multiplier += 0.1

            # Media multiplier
            media_multiplier = 1.0 + (min(media_count, 5) * 0.1)

            # Hashtag multiplier
            optimal_hashtags = {
                SocialPlatform.INSTAGRAM.value: 11,
                SocialPlatform.TWITTER.value: 2,
                SocialPlatform.LINKEDIN.value: 5
            }.get(platform, 5)

            hashtag_multiplier = 1.0
            if hashtag_count > 0:
                hashtag_effectiveness = 1 - abs(hashtag_count - optimal_hashtags) / optimal_hashtags
                hashtag_multiplier = 1.0 + (max(0, hashtag_effectiveness) * 0.3)

            # Calculate final prediction
            predicted_rate = base_rate * type_multiplier * content_multiplier * media_multiplier * hashtag_multiplier

            # Calculate reach prediction (assuming follower base of 10000)
            follower_base = self.config.get('follower_base', 10000)
            predicted_reach = int(follower_base * (predicted_rate / 100) * random.uniform(0.8, 1.2))
            predicted_engagements = int(predicted_reach * (predicted_rate / 100))

            return {
                "predicted_engagement_rate": round(predicted_rate, 2),
                "predicted_reach": predicted_reach,
                "predicted_engagements": predicted_engagements,
                "confidence": "medium",
                "factors": {
                    "base_rate": base_rate,
                    "type_multiplier": type_multiplier,
                    "content_multiplier": round(content_multiplier, 2),
                    "media_multiplier": round(media_multiplier, 2),
                    "hashtag_multiplier": round(hashtag_multiplier, 2)
                }
            }

        except Exception as e:
            logger.error(f"Error predicting engagement: {str(e)}")
            return {}

    def analyze_engagement(
        self,
        platform: str,
        timeframe: str = "30d",
        post_ids: List[str] = None
    ) -> Dict[str, Any]:
        """Analyze engagement metrics across posts.

        Args:
            platform: Social media platform
            timeframe: Analysis timeframe
            post_ids: Specific post IDs to analyze

        Returns:
            Comprehensive engagement analysis
        """
        try:
            logger.info(f"Analyzing engagement for {platform} over {timeframe}")

            # Filter posts
            if post_ids:
                analyzed_posts = [p for p in self.posts if p.get('post_id') in post_ids]
            else:
                analyzed_posts = [p for p in self.posts if p.get('platform') == platform]

            if not analyzed_posts:
                return {"error": "No posts found for analysis"}

            # Calculate aggregate metrics
            total_impressions = sum(p.get('performance_metrics', {}).get('impressions', 0) for p in analyzed_posts)
            total_reach = sum(p.get('performance_metrics', {}).get('reach', 0) for p in analyzed_posts)
            total_engagements = sum(
                p.get('performance_metrics', {}).get('likes', 0) +
                p.get('performance_metrics', {}).get('comments', 0) +
                p.get('performance_metrics', {}).get('shares', 0)
                for p in analyzed_posts
            )

            avg_engagement_rate = sum(
                p.get('performance_metrics', {}).get('engagement_rate', 0)
                for p in analyzed_posts
            ) / len(analyzed_posts) if analyzed_posts else 0

            # Best performing posts
            sorted_by_engagement = sorted(
                analyzed_posts,
                key=lambda x: x.get('performance_metrics', {}).get('engagement_rate', 0),
                reverse=True
            )

            best_posts = sorted_by_engagement[:5]

            # Analyze best posting times
            posting_time_analysis = self._analyze_posting_times(analyzed_posts)

            # Content type performance
            content_type_performance = self._analyze_content_types(analyzed_posts)

            # Hashtag performance
            hashtag_performance = self._analyze_hashtag_performance(analyzed_posts)

            analysis = {
                "analysis_id": self._generate_post_id(),
                "platform": platform,
                "timeframe": timeframe,
                "posts_analyzed": len(analyzed_posts),
                "aggregate_metrics": {
                    "total_impressions": total_impressions,
                    "total_reach": total_reach,
                    "total_engagements": total_engagements,
                    "average_engagement_rate": round(avg_engagement_rate, 2)
                },
                "best_performing_posts": [
                    {
                        "post_id": p.get('post_id'),
                        "content": p.get('content', '')[:100],
                        "engagement_rate": p.get('performance_metrics', {}).get('engagement_rate', 0)
                    }
                    for p in best_posts
                ],
                "posting_time_insights": posting_time_analysis,
                "content_type_performance": content_type_performance,
                "hashtag_performance": hashtag_performance,
                "recommendations": self._generate_engagement_recommendations(
                    posting_time_analysis,
                    content_type_performance,
                    avg_engagement_rate
                ),
                "timestamp": datetime.now().isoformat()
            }

            self.engagement_data.append(analysis)
            logger.info(f"Engagement analysis complete. Avg rate: {avg_engagement_rate:.2f}%")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing engagement: {str(e)}")
            return {"error": str(e)}

    def _analyze_posting_times(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by posting time."""
        try:
            hourly_performance = defaultdict(list)

            for post in posts:
                created_at = post.get('created_at')
                if created_at:
                    hour = datetime.fromisoformat(created_at).hour
                    engagement_rate = post.get('performance_metrics', {}).get('engagement_rate', 0)
                    hourly_performance[hour].append(engagement_rate)

            # Calculate average per hour
            avg_by_hour = {
                hour: round(sum(rates) / len(rates), 2) if rates else 0
                for hour, rates in hourly_performance.items()
            }

            # Find best hours
            sorted_hours = sorted(avg_by_hour.items(), key=lambda x: x[1], reverse=True)
            best_hours = [hour for hour, _ in sorted_hours[:3]]

            return {
                "average_by_hour": avg_by_hour,
                "best_hours": best_hours,
                "recommendation": f"Post between {min(best_hours)}-{max(best_hours)} for best engagement"
            }

        except Exception as e:
            logger.error(f"Error analyzing posting times: {str(e)}")
            return {}

    def _analyze_content_types(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by content type."""
        try:
            type_performance = defaultdict(list)

            for post in posts:
                post_type = post.get('post_type', 'unknown')
                engagement_rate = post.get('performance_metrics', {}).get('engagement_rate', 0)
                type_performance[post_type].append(engagement_rate)

            # Calculate averages
            avg_by_type = {
                ptype: round(sum(rates) / len(rates), 2) if rates else 0
                for ptype, rates in type_performance.items()
            }

            # Find best type
            best_type = max(avg_by_type.items(), key=lambda x: x[1]) if avg_by_type else ("unknown", 0)

            return {
                "average_by_type": avg_by_type,
                "best_performing_type": best_type[0],
                "best_type_engagement": best_type[1]
            }

        except Exception as e:
            logger.error(f"Error analyzing content types: {str(e)}")
            return {}

    def _analyze_hashtag_performance(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze hashtag effectiveness."""
        try:
            all_hashtags = []
            for post in posts:
                hashtags = post.get('hashtags', [])
                engagement = post.get('performance_metrics', {}).get('engagement_rate', 0)

                for hashtag in hashtags:
                    all_hashtags.append({
                        'tag': hashtag,
                        'engagement': engagement
                    })

            # Calculate average engagement per hashtag
            hashtag_stats = defaultdict(list)
            for item in all_hashtags:
                hashtag_stats[item['tag']].append(item['engagement'])

            avg_by_hashtag = {
                tag: round(sum(engagements) / len(engagements), 2)
                for tag, engagements in hashtag_stats.items()
            }

            # Find top performing hashtags
            sorted_hashtags = sorted(avg_by_hashtag.items(), key=lambda x: x[1], reverse=True)
            top_hashtags = sorted_hashtags[:10]

            return {
                "total_unique_hashtags": len(avg_by_hashtag),
                "top_performing_hashtags": [{"tag": tag, "avg_engagement": eng} for tag, eng in top_hashtags],
                "recommendation": f"Focus on top performers: {', '.join([t[0] for t in top_hashtags[:5]])}"
            }

        except Exception as e:
            logger.error(f"Error analyzing hashtags: {str(e)}")
            return {}

    def _generate_engagement_recommendations(
        self,
        posting_time_analysis: Dict[str, Any],
        content_type_performance: Dict[str, Any],
        avg_engagement_rate: float
    ) -> List[str]:
        """Generate recommendations based on engagement analysis."""
        recommendations = []

        try:
            # Posting time recommendations
            best_hours = posting_time_analysis.get('best_hours', [])
            if best_hours:
                recommendations.append(
                    f"Schedule posts during peak hours: {', '.join([f'{h}:00' for h in best_hours])}"
                )

            # Content type recommendations
            best_type = content_type_performance.get('best_performing_type')
            if best_type:
                recommendations.append(f"Increase {best_type} posts for better engagement")

            # Overall performance
            if avg_engagement_rate < 1.0:
                recommendations.append("Engagement is low - consider more interactive content and stronger CTAs")
            elif avg_engagement_rate < 2.0:
                recommendations.append("Moderate engagement - experiment with different content formats")
            else:
                recommendations.append("Strong engagement - maintain current strategy while testing new approaches")

            # General best practices
            recommendations.append("Use consistent branding across posts")
            recommendations.append("Respond to comments within 1 hour for maximum engagement boost")
            recommendations.append("Test different caption lengths to find optimal for your audience")

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")

        return recommendations

    def create_content_calendar(
        self,
        platforms: List[str],
        posts_per_week: int,
        weeks: int = 4,
        themes: List[str] = None
    ) -> Dict[str, Any]:
        """Create a comprehensive social media content calendar.

        Args:
            platforms: List of platforms
            posts_per_week: Number of posts per week
            weeks: Number of weeks to plan
            themes: Weekly themes

        Returns:
            Content calendar with scheduled posts
        """
        try:
            logger.info(f"Creating content calendar for {weeks} weeks")

            calendar_items = []
            start_date = datetime.now()

            post_types = [PostType.IMAGE.value, PostType.VIDEO.value, PostType.CAROUSEL.value, PostType.TEXT.value]
            themes = themes or ["Monday Motivation", "Tip Tuesday", "Behind The Scenes", "Feature Friday"]

            for week in range(weeks):
                week_theme = themes[week % len(themes)] if themes else f"Week {week + 1}"

                for post_num in range(posts_per_week):
                    # Calculate post date
                    days_offset = (week * 7) + (post_num * (7 // posts_per_week))
                    post_date = start_date + timedelta(days=days_offset)

                    # Select platform (rotate through)
                    platform = platforms[post_num % len(platforms)]

                    # Select post type
                    post_type = post_types[post_num % len(post_types)]

                    # Get optimal time
                    optimal_hours = self.optimal_times.get(platform, [12])
                    hour = optimal_hours[post_num % len(optimal_hours)]

                    scheduled_time = post_date.replace(hour=hour, minute=0, second=0)

                    calendar_item = {
                        "item_id": f"cal_{week}_{post_num}",
                        "week": week + 1,
                        "theme": week_theme,
                        "platform": platform,
                        "post_type": post_type,
                        "scheduled_date": scheduled_time.isoformat(),
                        "status": "planned",
                        "content_placeholder": f"{week_theme} - {post_type} post",
                        "assigned_to": None
                    }

                    calendar_items.append(calendar_item)

            # Generate statistics
            platform_distribution = Counter(item['platform'] for item in calendar_items)
            type_distribution = Counter(item['post_type'] for item in calendar_items)

            calendar = {
                "calendar_id": self._generate_post_id(),
                "start_date": start_date.isoformat(),
                "end_date": (start_date + timedelta(weeks=weeks)).isoformat(),
                "weeks": weeks,
                "platforms": platforms,
                "posts_per_week": posts_per_week,
                "total_posts": len(calendar_items),
                "calendar_items": calendar_items,
                "distribution": {
                    "by_platform": dict(platform_distribution),
                    "by_type": dict(type_distribution)
                },
                "themes": themes,
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Content calendar created with {len(calendar_items)} posts")
            return calendar

        except Exception as e:
            logger.error(f"Error creating content calendar: {str(e)}")
            return {"error": str(e)}

    def analyze_competitor(
        self,
        competitor_name: str,
        platform: str,
        sample_posts: int = 20
    ) -> Dict[str, Any]:
        """Analyze competitor's social media strategy.

        Args:
            competitor_name: Competitor name
            platform: Platform to analyze
            sample_posts: Number of recent posts to analyze

        Returns:
            Competitor analysis with insights
        """
        try:
            logger.info(f"Analyzing competitor: {competitor_name} on {platform}")

            # Simulate competitor data (in production, would fetch from API)
            competitor_data = self._simulate_competitor_data(competitor_name, platform, sample_posts)

            # Analyze posting frequency
            posting_frequency = self._calculate_posting_frequency(competitor_data['posts'])

            # Analyze content strategy
            content_strategy = self._analyze_content_strategy(competitor_data['posts'])

            # Analyze engagement patterns
            engagement_patterns = self._analyze_engagement_patterns(competitor_data['posts'])

            # Generate insights
            insights = self._generate_competitor_insights(
                posting_frequency,
                content_strategy,
                engagement_patterns
            )

            analysis = {
                "analysis_id": self._generate_post_id(),
                "competitor": competitor_name,
                "platform": platform,
                "posts_analyzed": sample_posts,
                "follower_count": competitor_data['followers'],
                "posting_frequency": posting_frequency,
                "content_strategy": content_strategy,
                "engagement_patterns": engagement_patterns,
                "strengths": insights['strengths'],
                "opportunities": insights['opportunities'],
                "recommendations": insights['recommendations'],
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Competitor analysis complete for {competitor_name}")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing competitor: {str(e)}")
            return {"error": str(e)}

    def _simulate_competitor_data(
        self,
        competitor_name: str,
        platform: str,
        sample_posts: int
    ) -> Dict[str, Any]:
        """Simulate competitor data."""
        try:
            posts = []
            for i in range(sample_posts):
                post = {
                    "post_id": f"comp_{i}",
                    "platform": platform,
                    "post_type": random.choice([t.value for t in PostType]),
                    "engagement_rate": random.uniform(1.0, 5.0),
                    "likes": random.randint(100, 5000),
                    "comments": random.randint(10, 500),
                    "shares": random.randint(5, 200),
                    "created_at": (datetime.now() - timedelta(days=i * 2)).isoformat()
                }
                posts.append(post)

            return {
                "followers": random.randint(10000, 100000),
                "posts": posts
            }

        except Exception as e:
            logger.error(f"Error simulating data: {str(e)}")
            return {"followers": 0, "posts": []}

    def _calculate_posting_frequency(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate posting frequency from posts."""
        try:
            if not posts:
                return {}

            # Calculate posts per week
            date_range = (datetime.now() - datetime.fromisoformat(posts[-1]['created_at'])).days
            weeks = max(1, date_range / 7)
            posts_per_week = len(posts) / weeks

            return {
                "posts_per_week": round(posts_per_week, 1),
                "total_posts": len(posts),
                "date_range_days": date_range,
                "consistency": "high" if posts_per_week >= 7 else "medium" if posts_per_week >= 3 else "low"
            }

        except Exception as e:
            logger.error(f"Error calculating frequency: {str(e)}")
            return {}

    def _analyze_content_strategy(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze content strategy from posts."""
        try:
            type_distribution = Counter(p.get('post_type') for p in posts)

            return {
                "content_mix": dict(type_distribution),
                "primary_content_type": type_distribution.most_common(1)[0][0] if type_distribution else "unknown",
                "diversity_score": len(type_distribution) / len(PostType) * 100 if type_distribution else 0
            }

        except Exception as e:
            logger.error(f"Error analyzing strategy: {str(e)}")
            return {}

    def _analyze_engagement_patterns(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze engagement patterns."""
        try:
            avg_engagement = sum(p.get('engagement_rate', 0) for p in posts) / len(posts) if posts else 0

            return {
                "average_engagement_rate": round(avg_engagement, 2),
                "best_performing_type": max(
                    posts,
                    key=lambda x: x.get('engagement_rate', 0)
                ).get('post_type') if posts else "unknown",
                "engagement_trend": "increasing" if avg_engagement > 2.0 else "stable"
            }

        except Exception as e:
            logger.error(f"Error analyzing patterns: {str(e)}")
            return {}

    def _generate_competitor_insights(
        self,
        posting_frequency: Dict[str, Any],
        content_strategy: Dict[str, Any],
        engagement_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate insights from competitor analysis."""
        try:
            strengths = []
            opportunities = []
            recommendations = []

            # Analyze frequency
            ppw = posting_frequency.get('posts_per_week', 0)
            if ppw >= 7:
                strengths.append("High posting frequency maintains audience engagement")
            elif ppw < 3:
                opportunities.append("Low posting frequency - you can out-post them")

            # Analyze content mix
            primary_type = content_strategy.get('primary_content_type')
            if primary_type:
                strengths.append(f"Focus on {primary_type} content shows clear strategy")
                recommendations.append(f"Consider creating more {primary_type} to compete")

            # Analyze engagement
            eng_rate = engagement_patterns.get('average_engagement_rate', 0)
            if eng_rate > 3.0:
                strengths.append("Strong engagement indicates highly resonant content")
                recommendations.append("Study their top posts to identify winning formulas")
            else:
                opportunities.append("Moderate engagement leaves room to capture audience")

            return {
                "strengths": strengths,
                "opportunities": opportunities,
                "recommendations": recommendations
            }

        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return {"strengths": [], "opportunities": [], "recommendations": []}

    def _generate_post_id(self) -> str:
        """Generate unique post ID."""
        try:
            timestamp = datetime.now().timestamp()
            unique_string = f"post_{timestamp}_{self.agent_id}_{random.randint(1000, 9999)}"
            hash_object = hashlib.md5(unique_string.encode())
            return f"post_{hash_object.hexdigest()[:12]}"
        except Exception as e:
            logger.error(f"Error generating ID: {str(e)}")
            return f"post_{datetime.now().timestamp()}"

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get overall performance summary.

        Returns:
            Summary of all social media activities
        """
        try:
            logger.info("Generating performance summary")

            platform_stats = defaultdict(lambda: {"posts": 0, "total_engagement": 0})

            for post in self.posts:
                platform = post.get('platform', 'unknown')
                platform_stats[platform]["posts"] += 1
                platform_stats[platform]["total_engagement"] += post.get('performance_metrics', {}).get('engagement_rate', 0)

            # Calculate averages
            for platform in platform_stats:
                posts_count = platform_stats[platform]["posts"]
                if posts_count > 0:
                    platform_stats[platform]["avg_engagement"] = round(
                        platform_stats[platform]["total_engagement"] / posts_count, 2
                    )

            summary = {
                "total_posts": len(self.posts),
                "total_schedules": len(self.schedules),
                "hashtag_research_count": len(self.hashtag_database),
                "platforms_active": list(platform_stats.keys()),
                "platform_statistics": dict(platform_stats),
                "engagement_analyses": len(self.engagement_data),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Summary generated: {summary['total_posts']} posts across {len(platform_stats)} platforms")
            return summary

        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {"error": str(e)}
