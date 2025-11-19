"""
Knowledge Base Curator Agent

Manages knowledge base articles, search optimization, content gap analysis, and article quality.
Production-ready implementation with advanced search algorithms and content intelligence.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import yaml
from pathlib import Path
import logging
import re
from collections import defaultdict, Counter
import hashlib
import math

logger = logging.getLogger(__name__)


class ArticleStatus(Enum):
    """Article status types."""
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    OUTDATED = "outdated"


class ArticleCategory(Enum):
    """Article categories."""
    GETTING_STARTED = "getting_started"
    HOW_TO = "how_to"
    TROUBLESHOOTING = "troubleshooting"
    FAQ = "faq"
    BEST_PRACTICES = "best_practices"
    API_DOCUMENTATION = "api_documentation"
    RELEASE_NOTES = "release_notes"
    TUTORIAL = "tutorial"


class ContentQuality(Enum):
    """Content quality levels."""
    EXCELLENT = 5
    GOOD = 4
    ACCEPTABLE = 3
    NEEDS_IMPROVEMENT = 2
    POOR = 1


@dataclass
class Article:
    """Knowledge base article."""
    article_id: str
    title: str
    content: str
    category: ArticleCategory
    status: ArticleStatus
    author: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    related_articles: List[str] = field(default_factory=list)
    view_count: int = 0
    helpful_count: int = 0
    not_helpful_count: int = 0
    search_count: int = 0
    avg_time_on_page: float = 0.0
    quality_score: float = 0.0
    readability_score: float = 0.0
    completeness_score: float = 0.0
    version: int = 1
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchQuery:
    """Search query record."""
    query_id: str
    query_text: str
    user_id: str
    timestamp: datetime
    results_count: int
    clicked_articles: List[str] = field(default_factory=list)
    no_results: bool = False
    search_time_ms: float = 0.0


@dataclass
class ContentGap:
    """Identified content gap."""
    gap_id: str
    topic: str
    search_queries: List[str]
    frequency: int
    priority_score: float
    suggested_title: str
    suggested_category: ArticleCategory
    identified_at: datetime


@dataclass
class ArticleVersion:
    """Article version history."""
    version_id: str
    article_id: str
    version_number: int
    content: str
    author: str
    change_summary: str
    created_at: datetime


class KnowledgeBaseCuratorAgent:
    """
    Advanced Knowledge Base Curator for content management and optimization.

    Capabilities:
    - Article management with versioning
    - Advanced search with TF-IDF ranking
    - Content quality analysis
    - Readability scoring
    - Content gap identification
    - Search optimization
    - Related article suggestions
    - Analytics and insights
    - A/B testing for article effectiveness
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Knowledge Base Curator Agent.

        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.name = "Knowledge Base Curator Agent"
        self.role = "knowledge_base_curator"

        # Content storage
        self.articles: Dict[str, Article] = {}
        self.article_versions: Dict[str, List[ArticleVersion]] = defaultdict(list)
        self.search_queries: List[SearchQuery] = []
        self.content_gaps: Dict[str, ContentGap] = {}

        # Search optimization
        self.inverted_index: Dict[str, Set[str]] = defaultdict(set)
        self.document_frequencies: Dict[str, int] = defaultdict(int)
        self.stop_words = self._load_stop_words()

        # Analytics
        self.article_counter = 0
        self.search_counter = 0
        self.popular_searches: Counter = Counter()
        self.failed_searches: List[str] = []

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
            'agent_name': 'Knowledge Base Curator Agent',
            'model': 'gpt-4',
            'temperature': 0.5,
            'max_tokens': 2000,
            'min_quality_score': 3.0,
            'min_readability_score': 60.0,
            'enable_auto_tagging': True,
            'enable_related_articles': True,
            'max_search_results': 10,
            'content_gap_threshold': 5,
            'outdated_threshold_days': 180,
            'capabilities': [
                'article_management',
                'search_optimization',
                'quality_analysis',
                'content_gap_detection',
                'version_control',
                'analytics'
            ],
            'supported_formats': ['markdown', 'html', 'plain_text'],
            'languages': ['en']
        }

    def _load_stop_words(self) -> Set[str]:
        """Load common stop words for search optimization."""
        return {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
            'what', 'when', 'where', 'who', 'which', 'why', 'how'
        }

    async def create_article(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new knowledge base article.

        Args:
            article_data: Article information

        Returns:
            Created article details
        """
        try:
            logger.info("Starting article creation")

            # Validate required fields
            required_fields = ['title', 'content', 'category', 'author']
            for field in required_fields:
                if field not in article_data:
                    raise ValueError(f"Missing required field: {field}")

            # Generate article ID
            self.article_counter += 1
            article_id = self._generate_article_id(article_data)

            # Parse category
            try:
                category = ArticleCategory(article_data['category'].lower())
            except ValueError:
                raise ValueError(f"Invalid category: {article_data['category']}")

            # Extract keywords and tags
            keywords = self._extract_keywords(
                article_data['title'],
                article_data['content']
            )

            tags = article_data.get('tags', [])
            if self.config.get('enable_auto_tagging', True):
                auto_tags = self._generate_tags(article_data['content'])
                tags.extend(auto_tags)
                tags = list(set(tags))  # Remove duplicates

            # Analyze content quality
            quality_metrics = self._analyze_content_quality(
                article_data['title'],
                article_data['content']
            )

            # Create article
            now = datetime.utcnow()
            article = Article(
                article_id=article_id,
                title=article_data['title'],
                content=article_data['content'],
                category=category,
                status=ArticleStatus(article_data.get('status', 'draft')),
                author=article_data['author'],
                created_at=now,
                updated_at=now,
                tags=tags,
                keywords=keywords,
                quality_score=quality_metrics['quality_score'],
                readability_score=quality_metrics['readability_score'],
                completeness_score=quality_metrics['completeness_score'],
                metadata=article_data.get('metadata', {})
            )

            # Store article
            self.articles[article_id] = article

            # Create initial version
            self._create_version(article_id, article_data['content'],
                               article_data['author'], "Initial version")

            # Update search index if published
            if article.status == ArticleStatus.PUBLISHED:
                self._index_article(article)

            logger.info(f"Article {article_id} created successfully")

            return {
                'success': True,
                'article_id': article_id,
                'title': article.title,
                'status': article.status.value,
                'quality_metrics': quality_metrics,
                'keywords': keywords,
                'tags': tags,
                'message': 'Article created successfully'
            }

        except ValueError as e:
            logger.error(f"Validation error in create_article: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_article: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _generate_article_id(self, article_data: Dict[str, Any]) -> str:
        """Generate unique article ID."""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        title_hash = hashlib.md5(article_data['title'].encode()).hexdigest()[:6]
        return f"KB-{timestamp}-{title_hash.upper()}"

    def _extract_keywords(self, title: str, content: str) -> List[str]:
        """
        Extract important keywords from article content.

        Args:
            title: Article title
            content: Article content

        Returns:
            List of extracted keywords
        """
        # Combine title and content, giving title more weight
        text = f"{title} {title} {content}".lower()

        # Tokenize
        words = re.findall(r'\b\w+\b', text)

        # Remove stop words and short words
        filtered_words = [
            w for w in words
            if w not in self.stop_words and len(w) > 3
        ]

        # Count frequencies
        word_counts = Counter(filtered_words)

        # Get top keywords
        top_keywords = [word for word, count in word_counts.most_common(15)]

        return top_keywords

    def _generate_tags(self, content: str) -> List[str]:
        """
        Auto-generate tags based on content analysis.

        Args:
            content: Article content

        Returns:
            List of generated tags
        """
        tags = []
        content_lower = content.lower()

        # Technology tags
        tech_patterns = {
            'api': r'\bapi\b',
            'rest': r'\brest\b',
            'authentication': r'\b(auth|authentication|login)\b',
            'database': r'\b(database|sql|mongodb)\b',
            'security': r'\b(security|encryption|ssl)\b',
            'integration': r'\b(integration|webhook)\b',
            'mobile': r'\b(mobile|ios|android)\b',
            'web': r'\b(web|browser|frontend)\b',
            'backend': r'\b(backend|server)\b',
            'deployment': r'\b(deploy|deployment|hosting)\b'
        }

        for tag, pattern in tech_patterns.items():
            if re.search(pattern, content_lower):
                tags.append(tag)

        # Difficulty level tags
        if any(word in content_lower for word in ['beginner', 'basic', 'introduction', 'getting started']):
            tags.append('beginner')
        elif any(word in content_lower for word in ['advanced', 'expert', 'complex']):
            tags.append('advanced')
        else:
            tags.append('intermediate')

        return tags

    def _analyze_content_quality(self, title: str, content: str) -> Dict[str, float]:
        """
        Analyze content quality using multiple metrics.

        Args:
            title: Article title
            content: Article content

        Returns:
            Quality metrics
        """
        # 1. Readability score (Flesch Reading Ease approximation)
        readability = self._calculate_readability(content)

        # 2. Completeness score
        completeness = self._calculate_completeness(content)

        # 3. Structure score
        structure = self._calculate_structure_score(content)

        # 4. Title quality
        title_quality = self._calculate_title_quality(title)

        # Overall quality score (weighted average)
        quality_score = (
            readability * 0.3 +
            completeness * 0.3 +
            structure * 0.2 +
            title_quality * 0.2
        )

        # Normalize to 1-5 scale
        quality_score = min(5.0, max(1.0, quality_score / 20))

        return {
            'quality_score': round(quality_score, 2),
            'readability_score': round(readability, 2),
            'completeness_score': round(completeness, 2),
            'structure_score': round(structure, 2),
            'title_quality': round(title_quality, 2)
        }

    def _calculate_readability(self, content: str) -> float:
        """
        Calculate readability score (simplified Flesch Reading Ease).

        Args:
            content: Article content

        Returns:
            Readability score (0-100)
        """
        # Count sentences (approximate)
        sentences = len(re.findall(r'[.!?]+', content))
        if sentences == 0:
            sentences = 1

        # Count words
        words = len(re.findall(r'\b\w+\b', content))
        if words == 0:
            return 0.0

        # Count syllables (very rough approximation)
        syllables = sum(self._count_syllables(word) for word in re.findall(r'\b\w+\b', content))

        # Flesch Reading Ease formula
        avg_words_per_sentence = words / sentences
        avg_syllables_per_word = syllables / words

        score = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables_per_word

        # Clamp to 0-100
        return max(0.0, min(100.0, score))

    def _count_syllables(self, word: str) -> int:
        """Approximate syllable count for a word."""
        word = word.lower()
        count = 0
        vowels = 'aeiouy'
        previous_was_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                count += 1
            previous_was_vowel = is_vowel

        # Adjust for silent e
        if word.endswith('e'):
            count -= 1

        # Ensure at least one syllable
        return max(1, count)

    def _calculate_completeness(self, content: str) -> float:
        """
        Calculate content completeness score.

        Args:
            content: Article content

        Returns:
            Completeness score (0-100)
        """
        score = 0.0

        # Length check (aim for 300-2000 words)
        word_count = len(re.findall(r'\b\w+\b', content))
        if 300 <= word_count <= 2000:
            score += 30
        elif word_count > 2000:
            score += 25
        elif word_count > 150:
            score += 15

        # Has headings/sections
        if re.search(r'#+\s+\w+|<h[1-6]>', content):
            score += 20

        # Has code examples
        if '```' in content or '<code>' in content or '    ' in content:
            score += 15

        # Has lists
        if re.search(r'^\s*[-*\d]+\.\s+', content, re.MULTILINE):
            score += 10

        # Has images/diagrams
        if re.search(r'!\[.*?\]|<img', content):
            score += 10

        # Has links
        if re.search(r'\[.*?\]\(.*?\)|<a ', content):
            score += 10

        # Has conclusion/summary
        if re.search(r'\b(conclusion|summary|in summary|to summarize)\b', content, re.IGNORECASE):
            score += 5

        return min(100.0, score)

    def _calculate_structure_score(self, content: str) -> float:
        """
        Calculate content structure score.

        Args:
            content: Article content

        Returns:
            Structure score (0-100)
        """
        score = 0.0

        # Has introduction
        lines = content.split('\n')
        if len(lines) > 0 and len(lines[0]) > 50:
            score += 20

        # Proper heading hierarchy
        headings = re.findall(r'^(#+)\s+', content, re.MULTILINE)
        if headings:
            score += 20
            # Check if hierarchy is logical
            heading_levels = [len(h) for h in headings]
            if heading_levels == sorted(heading_levels):
                score += 10

        # Paragraph length (not too long)
        paragraphs = content.split('\n\n')
        avg_para_length = sum(len(p.split()) for p in paragraphs) / len(paragraphs) if paragraphs else 0
        if 50 <= avg_para_length <= 150:
            score += 20

        # Has examples or explanations
        if any(keyword in content.lower() for keyword in ['example', 'for instance', 'such as']):
            score += 15

        # Has actionable content
        if any(keyword in content.lower() for keyword in ['step', 'follow', 'click', 'select', 'enter']):
            score += 15

        return min(100.0, score)

    def _calculate_title_quality(self, title: str) -> float:
        """
        Calculate title quality score.

        Args:
            title: Article title

        Returns:
            Title quality score (0-100)
        """
        score = 0.0

        # Length check (aim for 5-10 words)
        word_count = len(title.split())
        if 5 <= word_count <= 10:
            score += 40
        elif 3 <= word_count <= 12:
            score += 25

        # Starts with action word
        action_words = ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'complete']
        if any(title.lower().startswith(word) for word in action_words):
            score += 30

        # Contains specific keywords
        if any(keyword in title.lower() for keyword in ['complete', 'guide', 'tutorial', 'step-by-step']):
            score += 15

        # Not all caps
        if not title.isupper():
            score += 15

        return min(100.0, score)

    def _index_article(self, article: Article):
        """
        Add article to search index.

        Args:
            article: Article to index
        """
        # Tokenize content
        text = f"{article.title} {article.content} {' '.join(article.tags)}".lower()
        words = re.findall(r'\b\w+\b', text)

        # Filter and index
        for word in words:
            if word not in self.stop_words and len(word) > 2:
                self.inverted_index[word].add(article.article_id)
                self.document_frequencies[word] += 1

    def _create_version(self, article_id: str, content: str, author: str, change_summary: str):
        """Create article version."""
        article = self.articles[article_id]
        version = ArticleVersion(
            version_id=f"{article_id}_V{article.version}",
            article_id=article_id,
            version_number=article.version,
            content=content,
            author=author,
            change_summary=change_summary,
            created_at=datetime.utcnow()
        )

        self.article_versions[article_id].append(version)

    async def search_articles(self, query: str, user_id: str = "anonymous",
                            max_results: Optional[int] = None) -> Dict[str, Any]:
        """
        Search knowledge base articles using TF-IDF ranking.

        Args:
            query: Search query
            user_id: User identifier
            max_results: Maximum number of results

        Returns:
            Search results with ranked articles
        """
        try:
            start_time = datetime.utcnow()
            logger.info(f"Searching articles for query: {query}")

            if not query or not query.strip():
                raise ValueError("Search query cannot be empty")

            # Tokenize query
            query_lower = query.lower()
            query_words = [
                w for w in re.findall(r'\b\w+\b', query_lower)
                if w not in self.stop_words and len(w) > 2
            ]

            if not query_words:
                raise ValueError("Query contains no searchable terms")

            # Find matching articles using inverted index
            candidate_articles = set()
            for word in query_words:
                if word in self.inverted_index:
                    candidate_articles.update(self.inverted_index[word])

            # Score articles using TF-IDF
            scored_articles = []
            total_docs = len([a for a in self.articles.values() if a.status == ArticleStatus.PUBLISHED])

            for article_id in candidate_articles:
                article = self.articles.get(article_id)
                if article and article.status == ArticleStatus.PUBLISHED:
                    score = self._calculate_tfidf_score(query_words, article, total_docs)
                    scored_articles.append((article_id, score))

            # Sort by score
            scored_articles.sort(key=lambda x: x[1], reverse=True)

            # Limit results
            if max_results is None:
                max_results = self.config.get('max_search_results', 10)

            top_results = scored_articles[:max_results]

            # Track search
            search_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._track_search(query, user_id, len(top_results), search_time)

            # Update article search counts
            for article_id, score in top_results:
                self.articles[article_id].search_count += 1

            # Format results
            results = [
                {
                    'article_id': article_id,
                    'title': self.articles[article_id].title,
                    'category': self.articles[article_id].category.value,
                    'excerpt': self._generate_excerpt(self.articles[article_id].content, query_words),
                    'relevance_score': round(score, 3),
                    'tags': self.articles[article_id].tags,
                    'view_count': self.articles[article_id].view_count,
                    'helpful_count': self.articles[article_id].helpful_count
                }
                for article_id, score in top_results
            ]

            logger.info(f"Search completed: {len(results)} results in {search_time:.2f}ms")

            return {
                'success': True,
                'query': query,
                'results_count': len(results),
                'search_time_ms': round(search_time, 2),
                'results': results
            }

        except ValueError as e:
            logger.error(f"Validation error in search_articles: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in search_articles: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _calculate_tfidf_score(self, query_words: List[str], article: Article,
                              total_docs: int) -> float:
        """
        Calculate TF-IDF score for article.

        Args:
            query_words: Query terms
            article: Article to score
            total_docs: Total number of documents

        Returns:
            TF-IDF score
        """
        score = 0.0

        # Create article word frequency
        article_text = f"{article.title} {article.content}".lower()
        article_words = re.findall(r'\b\w+\b', article_text)
        article_word_freq = Counter(article_words)

        for word in query_words:
            # Term frequency in article
            tf = article_word_freq.get(word, 0)

            if tf > 0:
                # Inverse document frequency
                df = self.document_frequencies.get(word, 0)
                if df > 0:
                    idf = math.log(total_docs / df)
                else:
                    idf = 0

                # TF-IDF score for this term
                term_score = tf * idf

                # Boost for title matches
                if word in article.title.lower():
                    term_score *= 2.0

                # Boost for tag matches
                if word in [t.lower() for t in article.tags]:
                    term_score *= 1.5

                score += term_score

        # Normalize by article length
        if len(article_words) > 0:
            score /= math.log(len(article_words) + 1)

        # Boost by quality score
        score *= (article.quality_score / 5.0)

        return score

    def _generate_excerpt(self, content: str, query_words: List[str], max_length: int = 200) -> str:
        """
        Generate relevant excerpt from content.

        Args:
            content: Article content
            query_words: Query terms to highlight
            max_length: Maximum excerpt length

        Returns:
            Excerpt string
        """
        # Find best matching paragraph
        paragraphs = content.split('\n\n')
        best_para = ""
        best_score = 0

        for para in paragraphs:
            para_lower = para.lower()
            score = sum(1 for word in query_words if word in para_lower)
            if score > best_score:
                best_score = score
                best_para = para

        # Truncate if needed
        if len(best_para) > max_length:
            best_para = best_para[:max_length] + "..."

        return best_para.strip()

    def _track_search(self, query: str, user_id: str, results_count: int, search_time_ms: float):
        """Track search query for analytics."""
        self.search_counter += 1
        query_id = f"SEARCH-{self.search_counter:06d}"

        search_query = SearchQuery(
            query_id=query_id,
            query_text=query,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            results_count=results_count,
            no_results=(results_count == 0),
            search_time_ms=search_time_ms
        )

        self.search_queries.append(search_query)
        self.popular_searches[query] += 1

        if results_count == 0:
            self.failed_searches.append(query)

    async def identify_content_gaps(self) -> Dict[str, Any]:
        """
        Identify content gaps based on failed searches and user queries.

        Returns:
            Identified content gaps with recommendations
        """
        try:
            logger.info("Starting content gap analysis")

            gaps = []

            # Analyze failed searches
            if len(self.failed_searches) >= self.config.get('content_gap_threshold', 5):
                failed_query_counts = Counter(self.failed_searches)

                for query, frequency in failed_query_counts.most_common(10):
                    if frequency >= 3:
                        # Calculate priority
                        priority_score = frequency * 10.0

                        # Suggest category
                        suggested_category = self._suggest_category_for_query(query)

                        # Suggest title
                        suggested_title = self._suggest_title_for_query(query)

                        gap_id = f"GAP-{len(self.content_gaps) + 1:04d}"

                        gap = ContentGap(
                            gap_id=gap_id,
                            topic=query,
                            search_queries=[query],
                            frequency=frequency,
                            priority_score=priority_score,
                            suggested_title=suggested_title,
                            suggested_category=suggested_category,
                            identified_at=datetime.utcnow()
                        )

                        self.content_gaps[gap_id] = gap
                        gaps.append({
                            'gap_id': gap_id,
                            'topic': query,
                            'frequency': frequency,
                            'priority_score': round(priority_score, 2),
                            'suggested_title': suggested_title,
                            'suggested_category': suggested_category.value
                        })

            # Analyze popular searches that lead to low-quality articles
            for query, count in self.popular_searches.most_common(20):
                # Find articles clicked for this query
                relevant_searches = [s for s in self.search_queries if s.query_text == query]

                if relevant_searches:
                    clicked_articles = []
                    for search in relevant_searches:
                        clicked_articles.extend(search.clicked_articles)

                    if clicked_articles:
                        # Check quality of clicked articles
                        avg_quality = sum(
                            self.articles[aid].quality_score
                            for aid in clicked_articles
                            if aid in self.articles
                        ) / len(clicked_articles)

                        if avg_quality < self.config.get('min_quality_score', 3.0):
                            gaps.append({
                                'topic': query,
                                'issue': 'low_quality_content',
                                'frequency': count,
                                'avg_quality': round(avg_quality, 2),
                                'recommendation': 'Improve existing content quality'
                            })

            logger.info(f"Content gap analysis completed: {len(gaps)} gaps identified")

            return {
                'success': True,
                'gaps_count': len(gaps),
                'gaps': gaps,
                'total_failed_searches': len(self.failed_searches),
                'analysis_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in identify_content_gaps: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def _suggest_category_for_query(self, query: str) -> ArticleCategory:
        """Suggest article category based on query."""
        query_lower = query.lower()

        if any(word in query_lower for word in ['how to', 'how do', 'tutorial']):
            return ArticleCategory.HOW_TO
        elif any(word in query_lower for word in ['error', 'problem', 'not working', 'fix']):
            return ArticleCategory.TROUBLESHOOTING
        elif any(word in query_lower for word in ['what is', 'explain', 'faq']):
            return ArticleCategory.FAQ
        elif any(word in query_lower for word in ['api', 'endpoint', 'integration']):
            return ArticleCategory.API_DOCUMENTATION
        elif any(word in query_lower for word in ['start', 'begin', 'setup']):
            return ArticleCategory.GETTING_STARTED
        else:
            return ArticleCategory.HOW_TO

    def _suggest_title_for_query(self, query: str) -> str:
        """Suggest article title based on query."""
        # Capitalize first letter of each word
        title = ' '.join(word.capitalize() for word in query.split())

        # Add "How to" prefix if appropriate
        if not any(title.lower().startswith(prefix) for prefix in ['how', 'what', 'why', 'when', 'where']):
            title = f"How to {title}"

        return title

    async def update_article(self, article_id: str, updates: Dict[str, Any],
                           author: str, change_summary: str) -> Dict[str, Any]:
        """
        Update an existing article.

        Args:
            article_id: Article identifier
            updates: Fields to update
            author: Author making the update
            change_summary: Summary of changes

        Returns:
            Update result
        """
        try:
            if article_id not in self.articles:
                raise ValueError(f"Article {article_id} not found")

            article = self.articles[article_id]

            # Create new version before updating
            if 'content' in updates:
                article.version += 1
                self._create_version(article_id, updates['content'], author, change_summary)

            # Update fields
            if 'title' in updates:
                article.title = updates['title']
            if 'content' in updates:
                article.content = updates['content']
                # Re-analyze quality
                quality_metrics = self._analyze_content_quality(article.title, article.content)
                article.quality_score = quality_metrics['quality_score']
                article.readability_score = quality_metrics['readability_score']
                article.completeness_score = quality_metrics['completeness_score']
            if 'status' in updates:
                article.status = ArticleStatus(updates['status'])
            if 'tags' in updates:
                article.tags = updates['tags']

            article.updated_at = datetime.utcnow()

            # Re-index if published
            if article.status == ArticleStatus.PUBLISHED:
                self._index_article(article)

            logger.info(f"Article {article_id} updated successfully")

            return {
                'success': True,
                'article_id': article_id,
                'version': article.version,
                'updated_at': article.updated_at.isoformat(),
                'message': 'Article updated successfully'
            }

        except ValueError as e:
            return {'success': False, 'error': str(e), 'error_type': 'validation_error'}
        except Exception as e:
            logger.error(f"Error updating article: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error', 'error_type': 'internal_error'}

    async def get_analytics(self) -> Dict[str, Any]:
        """Get comprehensive knowledge base analytics."""
        try:
            total_articles = len(self.articles)

            if total_articles == 0:
                return {
                    'success': True,
                    'message': 'No articles to analyze',
                    'total_articles': 0
                }

            # Status distribution
            status_counts = defaultdict(int)
            for article in self.articles.values():
                status_counts[article.status.value] += 1

            # Category distribution
            category_counts = defaultdict(int)
            for article in self.articles.values():
                category_counts[article.category.value] += 1

            # Quality metrics
            avg_quality = sum(a.quality_score for a in self.articles.values()) / total_articles
            avg_readability = sum(a.readability_score for a in self.articles.values()) / total_articles

            # Most viewed articles
            most_viewed = sorted(
                self.articles.values(),
                key=lambda a: a.view_count,
                reverse=True
            )[:5]

            # Most helpful articles
            most_helpful = sorted(
                self.articles.values(),
                key=lambda a: a.helpful_count,
                reverse=True
            )[:5]

            return {
                'success': True,
                'total_articles': total_articles,
                'status_distribution': dict(status_counts),
                'category_distribution': dict(category_counts),
                'quality_metrics': {
                    'average_quality_score': round(avg_quality, 2),
                    'average_readability_score': round(avg_readability, 2)
                },
                'search_metrics': {
                    'total_searches': len(self.search_queries),
                    'failed_searches': len(self.failed_searches),
                    'popular_searches': dict(self.popular_searches.most_common(10))
                },
                'most_viewed_articles': [
                    {'article_id': a.article_id, 'title': a.title, 'views': a.view_count}
                    for a in most_viewed
                ],
                'most_helpful_articles': [
                    {'article_id': a.article_id, 'title': a.title, 'helpful_count': a.helpful_count}
                    for a in most_helpful
                ],
                'content_gaps': len(self.content_gaps)
            }

        except Exception as e:
            logger.error(f"Error generating analytics: {e}", exc_info=True)
            return {'success': False, 'error': 'Internal error'}
