"""
Content Creator Agent

Creates high-quality content for various marketing channels with SEO optimization,
readability scoring, content templates, and performance analytics.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import re
import math
import hashlib
from collections import Counter
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContentType(Enum):
    """Content type enumeration."""
    BLOG_POST = "blog_post"
    WHITEPAPER = "whitepaper"
    CASE_STUDY = "case_study"
    SOCIAL_MEDIA = "social_media"
    EMAIL = "email"
    LANDING_PAGE = "landing_page"
    VIDEO_SCRIPT = "video_script"
    INFOGRAPHIC = "infographic"
    EBOOK = "ebook"
    PRESS_RELEASE = "press_release"


class ReadabilityLevel(Enum):
    """Readability level classification."""
    VERY_EASY = "very_easy"
    EASY = "easy"
    FAIRLY_EASY = "fairly_easy"
    STANDARD = "standard"
    FAIRLY_DIFFICULT = "fairly_difficult"
    DIFFICULT = "difficult"
    VERY_DIFFICULT = "very_difficult"


class ContentCreatorAgent:
    """Content Creator Agent for creating optimized marketing content."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Content Creator Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.agent_id = "content_creator_001"
        self.config = config or {}
        self.content_library: List[Dict[str, Any]] = []
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.name = "Content Creator"
        self.role = "Content Creation and Marketing"
        self.performance_data: List[Dict[str, Any]] = []

        # Initialize content templates
        self._initialize_templates()

        logger.info(f"ContentCreatorAgent {self.agent_id} initialized")

    def _initialize_templates(self) -> None:
        """Initialize content templates for different types."""
        try:
            self.templates = {
                "blog_post": {
                    "structure": ["introduction", "main_points", "examples", "conclusion", "cta"],
                    "recommended_length": {"min": 800, "max": 2500},
                    "seo_requirements": {"keyword_density": 0.02, "headings": 3}
                },
                "whitepaper": {
                    "structure": ["executive_summary", "problem_statement", "solution",
                                 "methodology", "results", "conclusion", "references"],
                    "recommended_length": {"min": 3000, "max": 8000},
                    "seo_requirements": {"keyword_density": 0.015, "headings": 5}
                },
                "case_study": {
                    "structure": ["client_background", "challenge", "solution",
                                 "implementation", "results", "testimonial"],
                    "recommended_length": {"min": 1200, "max": 3000},
                    "seo_requirements": {"keyword_density": 0.018, "headings": 4}
                },
                "landing_page": {
                    "structure": ["hero", "value_proposition", "features", "benefits",
                                 "social_proof", "cta"],
                    "recommended_length": {"min": 500, "max": 1500},
                    "seo_requirements": {"keyword_density": 0.025, "headings": 2}
                },
                "email": {
                    "structure": ["subject_line", "preheader", "body", "cta", "signature"],
                    "recommended_length": {"min": 100, "max": 500},
                    "seo_requirements": {}
                }
            }
            logger.info("Content templates initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing templates: {str(e)}")
            raise

    def create_blog_post(
        self,
        topic: str,
        target_audience: str,
        keywords: List[str],
        tone: str = "professional",
        word_count: int = 1500
    ) -> Dict[str, Any]:
        """Create an SEO-optimized blog post.

        Args:
            topic: Blog post topic
            target_audience: Target audience description
            keywords: List of target keywords
            tone: Content tone (professional, casual, technical, friendly)
            word_count: Target word count

        Returns:
            Blog post data with optimization metadata
        """
        try:
            logger.info(f"Creating blog post on topic: {topic}")

            # Generate content structure
            outline = self._generate_blog_outline(topic, keywords, word_count)

            # Create title variations
            title_variations = self._generate_title_variations(topic, keywords)

            # Generate meta description
            meta_description = self._generate_meta_description(topic, keywords)

            # Calculate estimated reading time
            reading_time = self._calculate_reading_time(word_count)

            post = {
                "content_id": self._generate_content_id("blog"),
                "type": ContentType.BLOG_POST.value,
                "topic": topic,
                "target_audience": target_audience,
                "keywords": keywords,
                "title_variations": title_variations,
                "recommended_title": title_variations[0] if title_variations else "",
                "outline": outline,
                "meta_description": meta_description,
                "tone": tone,
                "target_word_count": word_count,
                "estimated_reading_time": reading_time,
                "seo_recommendations": self._get_seo_recommendations(
                    keywords, word_count, ContentType.BLOG_POST.value
                ),
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "last_modified": datetime.now().isoformat(),
                "performance_metrics": {
                    "views": 0,
                    "engagement_rate": 0.0,
                    "avg_time_on_page": 0,
                    "bounce_rate": 0.0
                }
            }

            self.content_library.append(post)
            logger.info(f"Blog post created successfully: {post['content_id']}")
            return post

        except Exception as e:
            logger.error(f"Error creating blog post: {str(e)}")
            return {"error": str(e), "status": "failed"}

    def _generate_blog_outline(
        self,
        topic: str,
        keywords: List[str],
        word_count: int
    ) -> List[Dict[str, Any]]:
        """Generate a structured blog outline.

        Args:
            topic: Blog topic
            keywords: Target keywords
            word_count: Target word count

        Returns:
            List of outline sections
        """
        try:
            sections_count = max(3, min(7, word_count // 300))
            words_per_section = word_count // (sections_count + 2)  # +2 for intro and conclusion

            outline = [
                {
                    "section": "Introduction",
                    "word_count": words_per_section,
                    "keywords": keywords[:2],
                    "purpose": "Hook reader, introduce topic, preview main points"
                }
            ]

            # Main content sections
            for i in range(sections_count):
                outline.append({
                    "section": f"Main Point {i+1}",
                    "word_count": words_per_section,
                    "keywords": [keywords[i % len(keywords)]],
                    "purpose": "Develop key argument with examples and data"
                })

            outline.append({
                "section": "Conclusion",
                "word_count": words_per_section,
                "keywords": keywords[:1],
                "purpose": "Summarize key points, provide actionable takeaways, CTA"
            })

            return outline

        except Exception as e:
            logger.error(f"Error generating outline: {str(e)}")
            return []

    def _generate_title_variations(
        self,
        topic: str,
        keywords: List[str]
    ) -> List[str]:
        """Generate multiple title variations for A/B testing.

        Args:
            topic: Content topic
            keywords: Target keywords

        Returns:
            List of title variations
        """
        try:
            primary_keyword = keywords[0] if keywords else topic

            title_templates = [
                f"The Complete Guide to {primary_keyword}",
                f"How to {topic}: A Step-by-Step Guide",
                f"{primary_keyword}: Everything You Need to Know",
                f"The Ultimate {primary_keyword} Strategy for 2025",
                f"{len(keywords) * 5 + 10} Proven {primary_keyword} Tips",
                f"Mastering {primary_keyword}: Expert Insights",
                f"Why {primary_keyword} Matters More Than Ever",
                f"The Future of {primary_keyword}: Trends and Predictions"
            ]

            return title_templates[:5]

        except Exception as e:
            logger.error(f"Error generating titles: {str(e)}")
            return [topic]

    def _generate_meta_description(
        self,
        topic: str,
        keywords: List[str]
    ) -> str:
        """Generate SEO-optimized meta description.

        Args:
            topic: Content topic
            keywords: Target keywords

        Returns:
            Meta description string
        """
        try:
            primary_keyword = keywords[0] if keywords else topic
            secondary_keyword = keywords[1] if len(keywords) > 1 else ""

            description = f"Discover expert insights on {primary_keyword}. "

            if secondary_keyword:
                description += f"Learn about {secondary_keyword} and "

            description += f"get actionable tips to improve your results. Read our comprehensive guide now."

            # Ensure it's within optimal length (150-160 characters)
            if len(description) > 160:
                description = description[:157] + "..."

            return description

        except Exception as e:
            logger.error(f"Error generating meta description: {str(e)}")
            return ""

    def calculate_readability_score(
        self,
        content: str
    ) -> Dict[str, Any]:
        """Calculate comprehensive readability metrics for content.

        Uses Flesch Reading Ease, Flesch-Kincaid Grade Level, and other metrics.

        Args:
            content: Text content to analyze

        Returns:
            Dictionary with readability scores and recommendations
        """
        try:
            logger.info("Calculating readability score")

            # Clean content
            content = re.sub(r'<[^>]+>', '', content)  # Remove HTML tags

            # Calculate basic metrics
            sentences = self._count_sentences(content)
            words = self._count_words(content)
            syllables = self._count_syllables(content)

            if sentences == 0 or words == 0:
                return {
                    "error": "Insufficient content for analysis",
                    "word_count": words
                }

            # Flesch Reading Ease Score
            flesch_reading_ease = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
            flesch_reading_ease = max(0, min(100, flesch_reading_ease))

            # Flesch-Kincaid Grade Level
            flesch_kincaid_grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
            flesch_kincaid_grade = max(0, flesch_kincaid_grade)

            # Classify readability level
            readability_level = self._classify_readability(flesch_reading_ease)

            # Calculate additional metrics
            avg_sentence_length = words / sentences
            avg_word_length = sum(len(word) for word in content.split()) / words
            complex_words = self._count_complex_words(content)

            # Generate recommendations
            recommendations = self._generate_readability_recommendations(
                flesch_reading_ease,
                avg_sentence_length,
                complex_words,
                words
            )

            result = {
                "flesch_reading_ease": round(flesch_reading_ease, 2),
                "flesch_kincaid_grade": round(flesch_kincaid_grade, 2),
                "readability_level": readability_level.value,
                "word_count": words,
                "sentence_count": sentences,
                "syllable_count": syllables,
                "avg_sentence_length": round(avg_sentence_length, 2),
                "avg_word_length": round(avg_word_length, 2),
                "complex_words_count": complex_words,
                "complex_words_percentage": round((complex_words / words) * 100, 2),
                "recommendations": recommendations,
                "overall_score": self._calculate_overall_readability_score(
                    flesch_reading_ease,
                    avg_sentence_length,
                    complex_words / words
                ),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Readability analysis complete. Score: {result['overall_score']}/100")
            return result

        except Exception as e:
            logger.error(f"Error calculating readability: {str(e)}")
            return {"error": str(e)}

    def _count_sentences(self, text: str) -> int:
        """Count sentences in text."""
        try:
            # Split on sentence-ending punctuation
            sentences = re.split(r'[.!?]+', text)
            return len([s for s in sentences if s.strip()])
        except Exception as e:
            logger.error(f"Error counting sentences: {str(e)}")
            return 0

    def _count_words(self, text: str) -> int:
        """Count words in text."""
        try:
            words = re.findall(r'\b\w+\b', text.lower())
            return len(words)
        except Exception as e:
            logger.error(f"Error counting words: {str(e)}")
            return 0

    def _count_syllables(self, text: str) -> int:
        """Count syllables in text using vowel groups."""
        try:
            words = re.findall(r'\b\w+\b', text.lower())
            total_syllables = 0

            for word in words:
                syllables = 0
                vowels = 'aeiouy'
                previous_was_vowel = False

                for char in word:
                    is_vowel = char in vowels
                    if is_vowel and not previous_was_vowel:
                        syllables += 1
                    previous_was_vowel = is_vowel

                # Adjust for silent 'e'
                if word.endswith('e'):
                    syllables -= 1

                # Ensure at least one syllable
                if syllables == 0:
                    syllables = 1

                total_syllables += syllables

            return total_syllables

        except Exception as e:
            logger.error(f"Error counting syllables: {str(e)}")
            return 0

    def _count_complex_words(self, text: str) -> int:
        """Count words with 3+ syllables."""
        try:
            words = re.findall(r'\b\w+\b', text.lower())
            complex_count = 0

            for word in words:
                if len(word) <= 2:
                    continue

                syllables = 0
                vowels = 'aeiouy'
                previous_was_vowel = False

                for char in word:
                    is_vowel = char in vowels
                    if is_vowel and not previous_was_vowel:
                        syllables += 1
                    previous_was_vowel = is_vowel

                if word.endswith('e'):
                    syllables -= 1

                if syllables >= 3:
                    complex_count += 1

            return complex_count

        except Exception as e:
            logger.error(f"Error counting complex words: {str(e)}")
            return 0

    def _classify_readability(self, flesch_score: float) -> ReadabilityLevel:
        """Classify readability level based on Flesch score."""
        if flesch_score >= 90:
            return ReadabilityLevel.VERY_EASY
        elif flesch_score >= 80:
            return ReadabilityLevel.EASY
        elif flesch_score >= 70:
            return ReadabilityLevel.FAIRLY_EASY
        elif flesch_score >= 60:
            return ReadabilityLevel.STANDARD
        elif flesch_score >= 50:
            return ReadabilityLevel.FAIRLY_DIFFICULT
        elif flesch_score >= 30:
            return ReadabilityLevel.DIFFICULT
        else:
            return ReadabilityLevel.VERY_DIFFICULT

    def _generate_readability_recommendations(
        self,
        flesch_score: float,
        avg_sentence_length: float,
        complex_words: int,
        total_words: int
    ) -> List[str]:
        """Generate recommendations to improve readability."""
        recommendations = []

        try:
            if flesch_score < 60:
                recommendations.append("Consider simplifying sentence structure for better readability")

            if avg_sentence_length > 25:
                recommendations.append("Break down long sentences into shorter ones (aim for 15-20 words)")

            complex_percentage = (complex_words / total_words) * 100 if total_words > 0 else 0
            if complex_percentage > 15:
                recommendations.append("Reduce complex vocabulary where possible")

            if flesch_score < 50:
                recommendations.append("Use more active voice and conversational tone")

            if not recommendations:
                recommendations.append("Content readability is good. Maintain current style.")

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")

        return recommendations

    def _calculate_overall_readability_score(
        self,
        flesch_score: float,
        avg_sentence_length: float,
        complex_word_ratio: float
    ) -> int:
        """Calculate overall readability score (0-100)."""
        try:
            # Weight different factors
            flesch_weight = 0.5
            sentence_weight = 0.3
            complexity_weight = 0.2

            # Normalize flesch score (already 0-100)
            flesch_component = flesch_score * flesch_weight

            # Sentence length score (optimal: 15-20 words)
            sentence_score = 100 - min(100, abs(avg_sentence_length - 17.5) * 4)
            sentence_component = sentence_score * sentence_weight

            # Complexity score (optimal: <10%)
            complexity_score = 100 - min(100, complex_word_ratio * 500)
            complexity_component = complexity_score * complexity_weight

            overall = flesch_component + sentence_component + complexity_component
            return int(max(0, min(100, overall)))

        except Exception as e:
            logger.error(f"Error calculating overall score: {str(e)}")
            return 0

    def optimize_content_seo(
        self,
        content_id: str,
        content_text: str,
        target_keywords: List[str],
        optimization_goals: List[str]
    ) -> Dict[str, Any]:
        """Optimize content for SEO with detailed analysis.

        Args:
            content_id: ID of content to optimize
            content_text: The actual content text
            target_keywords: Keywords to optimize for
            optimization_goals: List of optimization objectives

        Returns:
            Optimization report with suggestions
        """
        try:
            logger.info(f"Optimizing content {content_id} for SEO")

            # Analyze current state
            word_count = self._count_words(content_text)
            keyword_analysis = self._analyze_keyword_usage(content_text, target_keywords)
            heading_analysis = self._analyze_headings(content_text)
            internal_links = self._count_internal_links(content_text)
            external_links = self._count_external_links(content_text)
            image_count = self._count_images(content_text)

            # Calculate SEO score
            seo_score = self._calculate_seo_score(
                keyword_analysis,
                heading_analysis,
                word_count,
                internal_links,
                external_links,
                image_count
            )

            # Generate improvement suggestions
            suggestions = self._generate_seo_suggestions(
                keyword_analysis,
                heading_analysis,
                word_count,
                internal_links,
                external_links,
                image_count,
                optimization_goals
            )

            optimization_report = {
                "content_id": content_id,
                "seo_score": seo_score,
                "keyword_analysis": keyword_analysis,
                "heading_analysis": heading_analysis,
                "content_metrics": {
                    "word_count": word_count,
                    "internal_links": internal_links,
                    "external_links": external_links,
                    "images": image_count
                },
                "suggestions": suggestions,
                "priority_actions": self._prioritize_seo_actions(suggestions),
                "estimated_improvement": self._estimate_seo_improvement(seo_score, suggestions),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"SEO optimization complete. Score: {seo_score}/100")
            return optimization_report

        except Exception as e:
            logger.error(f"Error optimizing content: {str(e)}")
            return {"error": str(e)}

    def _analyze_keyword_usage(
        self,
        content: str,
        keywords: List[str]
    ) -> Dict[str, Any]:
        """Analyze keyword usage in content."""
        try:
            content_lower = content.lower()
            words = self._count_words(content)

            keyword_data = {}
            for keyword in keywords:
                keyword_lower = keyword.lower()
                count = content_lower.count(keyword_lower)
                density = (count / words * 100) if words > 0 else 0

                # Check keyword placement
                in_first_paragraph = keyword_lower in content_lower[:500]
                in_headings = self._keyword_in_headings(content, keyword)

                keyword_data[keyword] = {
                    "count": count,
                    "density": round(density, 2),
                    "in_first_paragraph": in_first_paragraph,
                    "in_headings": in_headings,
                    "optimal_density": density >= 1.0 and density <= 3.0
                }

            return keyword_data

        except Exception as e:
            logger.error(f"Error analyzing keywords: {str(e)}")
            return {}

    def _keyword_in_headings(self, content: str, keyword: str) -> bool:
        """Check if keyword appears in headings."""
        try:
            # Simple heading detection (looks for # in markdown or <h> in HTML)
            headings = re.findall(r'(?:^|\n)#{1,6}\s+([^\n]+)|<h[1-6][^>]*>([^<]+)</h[1-6]>', content, re.IGNORECASE)
            headings_text = ' '.join([h[0] or h[1] for h in headings]).lower()
            return keyword.lower() in headings_text
        except Exception as e:
            logger.error(f"Error checking headings: {str(e)}")
            return False

    def _analyze_headings(self, content: str) -> Dict[str, Any]:
        """Analyze heading structure."""
        try:
            h1_count = len(re.findall(r'(?:^|\n)#\s+|<h1[^>]*>', content))
            h2_count = len(re.findall(r'(?:^|\n)##\s+|<h2[^>]*>', content))
            h3_count = len(re.findall(r'(?:^|\n)###\s+|<h3[^>]*>', content))

            return {
                "h1_count": h1_count,
                "h2_count": h2_count,
                "h3_count": h3_count,
                "total_headings": h1_count + h2_count + h3_count,
                "has_single_h1": h1_count == 1,
                "hierarchy_valid": h1_count <= 1 and h2_count >= 1
            }
        except Exception as e:
            logger.error(f"Error analyzing headings: {str(e)}")
            return {}

    def _count_internal_links(self, content: str) -> int:
        """Count internal links in content."""
        try:
            # Simplified - looks for markdown links or <a> tags
            internal_patterns = [
                r'\[([^\]]+)\]\((?!http)',  # Markdown relative links
                r'<a[^>]+href=["\'](?!http)',  # HTML relative links
            ]
            count = 0
            for pattern in internal_patterns:
                count += len(re.findall(pattern, content))
            return count
        except Exception as e:
            logger.error(f"Error counting internal links: {str(e)}")
            return 0

    def _count_external_links(self, content: str) -> int:
        """Count external links in content."""
        try:
            external_patterns = [
                r'\[([^\]]+)\]\(https?://',  # Markdown external links
                r'<a[^>]+href=["\']https?://',  # HTML external links
            ]
            count = 0
            for pattern in external_patterns:
                count += len(re.findall(pattern, content))
            return count
        except Exception as e:
            logger.error(f"Error counting external links: {str(e)}")
            return 0

    def _count_images(self, content: str) -> int:
        """Count images in content."""
        try:
            image_patterns = [
                r'!\[([^\]]*)\]\(',  # Markdown images
                r'<img[^>]+>',  # HTML images
            ]
            count = 0
            for pattern in image_patterns:
                count += len(re.findall(pattern, content))
            return count
        except Exception as e:
            logger.error(f"Error counting images: {str(e)}")
            return 0

    def _calculate_seo_score(
        self,
        keyword_analysis: Dict[str, Any],
        heading_analysis: Dict[str, Any],
        word_count: int,
        internal_links: int,
        external_links: int,
        image_count: int
    ) -> int:
        """Calculate overall SEO score (0-100)."""
        try:
            score = 0

            # Keyword optimization (30 points)
            if keyword_analysis:
                optimal_keywords = sum(1 for k in keyword_analysis.values() if k.get('optimal_density', False))
                score += min(30, (optimal_keywords / len(keyword_analysis)) * 30)

            # Heading structure (20 points)
            if heading_analysis.get('has_single_h1', False):
                score += 10
            if heading_analysis.get('total_headings', 0) >= 3:
                score += 10

            # Content length (15 points)
            if word_count >= 800:
                score += min(15, (word_count / 2000) * 15)

            # Internal linking (15 points)
            score += min(15, internal_links * 3)

            # External linking (10 points)
            score += min(10, external_links * 2)

            # Images (10 points)
            score += min(10, image_count * 2)

            return int(min(100, score))

        except Exception as e:
            logger.error(f"Error calculating SEO score: {str(e)}")
            return 0

    def _generate_seo_suggestions(
        self,
        keyword_analysis: Dict[str, Any],
        heading_analysis: Dict[str, Any],
        word_count: int,
        internal_links: int,
        external_links: int,
        image_count: int,
        goals: List[str]
    ) -> List[Dict[str, str]]:
        """Generate actionable SEO suggestions."""
        suggestions = []

        try:
            # Keyword suggestions
            for keyword, data in keyword_analysis.items():
                if not data.get('optimal_density', False):
                    if data['density'] < 1.0:
                        suggestions.append({
                            "type": "keyword",
                            "priority": "high",
                            "suggestion": f"Increase usage of '{keyword}' (current density: {data['density']}%)"
                        })
                    elif data['density'] > 3.0:
                        suggestions.append({
                            "type": "keyword",
                            "priority": "medium",
                            "suggestion": f"Reduce usage of '{keyword}' to avoid keyword stuffing (current: {data['density']}%)"
                        })

                if not data.get('in_first_paragraph', False):
                    suggestions.append({
                        "type": "keyword",
                        "priority": "high",
                        "suggestion": f"Add '{keyword}' to the first paragraph"
                    })

                if not data.get('in_headings', False):
                    suggestions.append({
                        "type": "keyword",
                        "priority": "medium",
                        "suggestion": f"Include '{keyword}' in at least one heading"
                    })

            # Heading suggestions
            if not heading_analysis.get('has_single_h1', False):
                suggestions.append({
                    "type": "structure",
                    "priority": "high",
                    "suggestion": "Ensure exactly one H1 tag for the main title"
                })

            if heading_analysis.get('total_headings', 0) < 3:
                suggestions.append({
                    "type": "structure",
                    "priority": "medium",
                    "suggestion": "Add more subheadings to improve content structure"
                })

            # Content length
            if word_count < 800:
                suggestions.append({
                    "type": "content",
                    "priority": "high",
                    "suggestion": f"Expand content to at least 800 words (current: {word_count})"
                })

            # Linking
            if internal_links < 3:
                suggestions.append({
                    "type": "linking",
                    "priority": "medium",
                    "suggestion": f"Add more internal links (current: {internal_links})"
                })

            if external_links < 2:
                suggestions.append({
                    "type": "linking",
                    "priority": "low",
                    "suggestion": f"Add authoritative external links (current: {external_links})"
                })

            # Images
            if image_count == 0:
                suggestions.append({
                    "type": "media",
                    "priority": "medium",
                    "suggestion": "Add relevant images with alt text"
                })

        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")

        return suggestions

    def _prioritize_seo_actions(self, suggestions: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Prioritize SEO actions by impact."""
        try:
            priority_order = {"high": 0, "medium": 1, "low": 2}
            sorted_suggestions = sorted(
                suggestions,
                key=lambda x: priority_order.get(x.get('priority', 'low'), 2)
            )
            return sorted_suggestions[:5]  # Return top 5
        except Exception as e:
            logger.error(f"Error prioritizing actions: {str(e)}")
            return suggestions[:5]

    def _estimate_seo_improvement(self, current_score: int, suggestions: List[Dict[str, str]]) -> Dict[str, Any]:
        """Estimate potential SEO improvement."""
        try:
            high_priority = len([s for s in suggestions if s.get('priority') == 'high'])
            medium_priority = len([s for s in suggestions if s.get('priority') == 'medium'])

            potential_gain = (high_priority * 5) + (medium_priority * 3)
            estimated_score = min(100, current_score + potential_gain)

            return {
                "current_score": current_score,
                "estimated_score": estimated_score,
                "potential_gain": potential_gain,
                "effort_required": "low" if len(suggestions) <= 3 else "medium" if len(suggestions) <= 6 else "high"
            }
        except Exception as e:
            logger.error(f"Error estimating improvement: {str(e)}")
            return {}

    def create_whitepaper(
        self,
        subject: str,
        research_data: Dict[str, Any],
        industry: str = "general",
        target_audience: str = "professionals"
    ) -> Dict[str, Any]:
        """Create a comprehensive whitepaper.

        Args:
            subject: Whitepaper subject
            research_data: Research data and findings
            industry: Target industry
            target_audience: Target audience

        Returns:
            Whitepaper structure and metadata
        """
        try:
            logger.info(f"Creating whitepaper on: {subject}")

            template = self.templates.get("whitepaper", {})

            whitepaper = {
                "content_id": self._generate_content_id("whitepaper"),
                "type": ContentType.WHITEPAPER.value,
                "subject": subject,
                "industry": industry,
                "target_audience": target_audience,
                "research_data": research_data,
                "sections": self._generate_whitepaper_structure(subject, research_data),
                "recommended_length": template.get("recommended_length", {}),
                "design_specifications": {
                    "layout": "professional",
                    "color_scheme": "corporate",
                    "includes_charts": True,
                    "includes_data_tables": True
                },
                "distribution_channels": ["website", "email", "linkedin"],
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "estimated_completion_time": "3-5 days"
            }

            self.content_library.append(whitepaper)
            logger.info(f"Whitepaper created: {whitepaper['content_id']}")
            return whitepaper

        except Exception as e:
            logger.error(f"Error creating whitepaper: {str(e)}")
            return {"error": str(e)}

    def _generate_whitepaper_structure(
        self,
        subject: str,
        research_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate whitepaper structure."""
        try:
            return [
                {
                    "section": "Executive Summary",
                    "word_count": 300,
                    "purpose": "High-level overview of findings and recommendations"
                },
                {
                    "section": "Problem Statement",
                    "word_count": 500,
                    "purpose": "Define the challenge or opportunity"
                },
                {
                    "section": "Research Methodology",
                    "word_count": 400,
                    "purpose": "Explain research approach and data sources"
                },
                {
                    "section": "Findings and Analysis",
                    "word_count": 1500,
                    "purpose": "Present detailed findings with data visualization"
                },
                {
                    "section": "Solution Framework",
                    "word_count": 800,
                    "purpose": "Propose solutions based on research"
                },
                {
                    "section": "Implementation Roadmap",
                    "word_count": 600,
                    "purpose": "Outline steps for implementation"
                },
                {
                    "section": "Conclusion and Recommendations",
                    "word_count": 400,
                    "purpose": "Summarize key takeaways and next steps"
                }
            ]
        except Exception as e:
            logger.error(f"Error generating structure: {str(e)}")
            return []

    def plan_content_calendar(
        self,
        timeframe: str,
        channels: List[str],
        content_types: List[str],
        frequency: Dict[str, int]
    ) -> Dict[str, Any]:
        """Plan comprehensive content calendar.

        Args:
            timeframe: Calendar timeframe (e.g., "Q1 2025", "January 2025")
            channels: Distribution channels
            content_types: Types of content to create
            frequency: Publishing frequency per content type

        Returns:
            Content calendar with scheduled items
        """
        try:
            logger.info(f"Planning content calendar for: {timeframe}")

            start_date = datetime.now()
            days_in_period = self._parse_timeframe_days(timeframe)

            calendar_items = []
            item_id = 0

            for content_type in content_types:
                posts_per_period = frequency.get(content_type, 1)
                interval_days = days_in_period // posts_per_period

                for i in range(posts_per_period):
                    publish_date = start_date + timedelta(days=i * interval_days)

                    calendar_items.append({
                        "item_id": f"cal_{item_id}",
                        "content_type": content_type,
                        "scheduled_date": publish_date.isoformat(),
                        "channels": channels,
                        "status": "planned",
                        "assigned_to": None,
                        "priority": self._calculate_content_priority(content_type, i)
                    })
                    item_id += 1

            calendar = {
                "calendar_id": self._generate_content_id("calendar"),
                "timeframe": timeframe,
                "start_date": start_date.isoformat(),
                "end_date": (start_date + timedelta(days=days_in_period)).isoformat(),
                "channels": channels,
                "content_types": content_types,
                "scheduled_items": calendar_items,
                "total_items": len(calendar_items),
                "items_per_channel": self._calculate_items_per_channel(calendar_items, channels),
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Calendar created with {len(calendar_items)} items")
            return calendar

        except Exception as e:
            logger.error(f"Error planning calendar: {str(e)}")
            return {"error": str(e)}

    def _parse_timeframe_days(self, timeframe: str) -> int:
        """Parse timeframe string to days."""
        try:
            timeframe_lower = timeframe.lower()
            if 'month' in timeframe_lower:
                return 30
            elif 'quarter' in timeframe_lower or 'q1' in timeframe_lower or 'q2' in timeframe_lower:
                return 90
            elif 'year' in timeframe_lower:
                return 365
            elif 'week' in timeframe_lower:
                return 7
            else:
                return 30  # Default to month
        except Exception as e:
            logger.error(f"Error parsing timeframe: {str(e)}")
            return 30

    def _calculate_content_priority(self, content_type: str, sequence: int) -> str:
        """Calculate content priority."""
        try:
            high_priority_types = ["landing_page", "whitepaper", "case_study"]
            if content_type in high_priority_types:
                return "high"
            elif sequence == 0:
                return "high"
            else:
                return "medium" if sequence % 2 == 0 else "low"
        except Exception as e:
            logger.error(f"Error calculating priority: {str(e)}")
            return "medium"

    def _calculate_items_per_channel(
        self,
        items: List[Dict[str, Any]],
        channels: List[str]
    ) -> Dict[str, int]:
        """Calculate distribution of items per channel."""
        try:
            distribution = {channel: 0 for channel in channels}
            for item in items:
                for channel in item.get('channels', []):
                    if channel in distribution:
                        distribution[channel] += 1
            return distribution
        except Exception as e:
            logger.error(f"Error calculating distribution: {str(e)}")
            return {}

    def _calculate_reading_time(self, word_count: int) -> str:
        """Calculate estimated reading time."""
        try:
            # Average reading speed: 200-250 words per minute
            minutes = math.ceil(word_count / 225)
            if minutes == 1:
                return "1 minute"
            else:
                return f"{minutes} minutes"
        except Exception as e:
            logger.error(f"Error calculating reading time: {str(e)}")
            return "Unknown"

    def _get_seo_recommendations(
        self,
        keywords: List[str],
        word_count: int,
        content_type: str
    ) -> List[str]:
        """Get SEO recommendations for content."""
        try:
            recommendations = []

            primary_keyword = keywords[0] if keywords else ""

            recommendations.append(f"Include '{primary_keyword}' in the title and first paragraph")
            recommendations.append(f"Use '{primary_keyword}' naturally 2-3 times per 1000 words")
            recommendations.append("Include related keywords and synonyms throughout")
            recommendations.append("Use descriptive headings with keywords")
            recommendations.append("Add internal links to related content")
            recommendations.append("Optimize meta description with primary keyword")
            recommendations.append("Include alt text for all images")
            recommendations.append("Ensure mobile-friendly formatting")

            return recommendations

        except Exception as e:
            logger.error(f"Error getting recommendations: {str(e)}")
            return []

    def _generate_content_id(self, content_type: str) -> str:
        """Generate unique content ID."""
        try:
            timestamp = datetime.now().timestamp()
            unique_string = f"{content_type}_{timestamp}_{self.agent_id}"
            hash_object = hashlib.md5(unique_string.encode())
            return f"{content_type}_{hash_object.hexdigest()[:12]}"
        except Exception as e:
            logger.error(f"Error generating ID: {str(e)}")
            return f"{content_type}_{datetime.now().timestamp()}"

    def analyze_content_performance(
        self,
        content_id: str,
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze content performance metrics.

        Args:
            content_id: Content identifier
            metrics: Performance metrics (views, engagement, etc.)

        Returns:
            Performance analysis and recommendations
        """
        try:
            logger.info(f"Analyzing performance for content: {content_id}")

            views = metrics.get('views', 0)
            engagement_rate = metrics.get('engagement_rate', 0.0)
            avg_time = metrics.get('avg_time_on_page', 0)
            bounce_rate = metrics.get('bounce_rate', 0.0)

            # Calculate performance score
            performance_score = self._calculate_performance_score(
                views, engagement_rate, avg_time, bounce_rate
            )

            # Generate insights
            insights = self._generate_performance_insights(
                performance_score, views, engagement_rate, avg_time, bounce_rate
            )

            # Update performance data
            performance_data = {
                "content_id": content_id,
                "metrics": metrics,
                "performance_score": performance_score,
                "insights": insights,
                "recommendations": self._generate_performance_recommendations(insights),
                "timestamp": datetime.now().isoformat()
            }

            self.performance_data.append(performance_data)

            logger.info(f"Performance analysis complete. Score: {performance_score}/100")
            return performance_data

        except Exception as e:
            logger.error(f"Error analyzing performance: {str(e)}")
            return {"error": str(e)}

    def _calculate_performance_score(
        self,
        views: int,
        engagement_rate: float,
        avg_time: int,
        bounce_rate: float
    ) -> int:
        """Calculate overall performance score."""
        try:
            score = 0

            # Views (25 points)
            if views >= 10000:
                score += 25
            elif views >= 5000:
                score += 20
            elif views >= 1000:
                score += 15
            else:
                score += min(10, views / 100)

            # Engagement rate (25 points)
            score += min(25, engagement_rate * 250)

            # Time on page (25 points) - target: 3+ minutes
            score += min(25, (avg_time / 180) * 25)

            # Bounce rate (25 points) - lower is better
            score += max(0, 25 - (bounce_rate * 25))

            return int(min(100, score))

        except Exception as e:
            logger.error(f"Error calculating performance score: {str(e)}")
            return 0

    def _generate_performance_insights(
        self,
        score: int,
        views: int,
        engagement_rate: float,
        avg_time: int,
        bounce_rate: float
    ) -> List[str]:
        """Generate performance insights."""
        insights = []

        try:
            if score >= 80:
                insights.append("Excellent performance - content is resonating with audience")
            elif score >= 60:
                insights.append("Good performance - room for optimization")
            else:
                insights.append("Performance needs improvement")

            if engagement_rate < 0.05:
                insights.append("Low engagement rate - consider more compelling CTAs")

            if avg_time < 120:
                insights.append("Low time on page - content may not be engaging enough")

            if bounce_rate > 0.7:
                insights.append("High bounce rate - improve content relevance")

        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")

        return insights

    def _generate_performance_recommendations(self, insights: List[str]) -> List[str]:
        """Generate recommendations based on insights."""
        recommendations = []

        try:
            for insight in insights:
                if "engagement" in insight.lower():
                    recommendations.append("Add interactive elements and stronger CTAs")
                if "time on page" in insight.lower():
                    recommendations.append("Improve content structure and readability")
                if "bounce rate" in insight.lower():
                    recommendations.append("Enhance content relevance and internal linking")

            if not recommendations:
                recommendations.append("Continue monitoring and A/B testing")

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")

        return recommendations

    def get_content_statistics(self) -> Dict[str, Any]:
        """Get overall content statistics.

        Returns:
            Statistics about all content created
        """
        try:
            logger.info("Generating content statistics")

            total_content = len(self.content_library)
            content_by_type = Counter(item.get('type', 'unknown') for item in self.content_library)
            content_by_status = Counter(item.get('status', 'unknown') for item in self.content_library)

            stats = {
                "total_content_pieces": total_content,
                "content_by_type": dict(content_by_type),
                "content_by_status": dict(content_by_status),
                "performance_tracked": len(self.performance_data),
                "average_performance_score": self._calculate_average_performance(),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Statistics generated for {total_content} content pieces")
            return stats

        except Exception as e:
            logger.error(f"Error generating statistics: {str(e)}")
            return {"error": str(e)}

    def _calculate_average_performance(self) -> float:
        """Calculate average performance score."""
        try:
            if not self.performance_data:
                return 0.0

            scores = [item.get('performance_score', 0) for item in self.performance_data]
            return round(sum(scores) / len(scores), 2) if scores else 0.0

        except Exception as e:
            logger.error(f"Error calculating average: {str(e)}")
            return 0.0
