"""
Knowledge Curator Agent

Manages organizational knowledge through taxonomy design, content curation,
search optimization, knowledge graphs, and intelligent recommendations.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import json
import hashlib
import re
import math
from dataclasses import dataclass, field, asdict
from collections import defaultdict, Counter


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContentType(Enum):
    """Types of knowledge content"""
    DOCUMENTATION = "documentation"
    ARTICLE = "article"
    TUTORIAL = "tutorial"
    VIDEO = "video"
    GUIDE = "guide"
    BEST_PRACTICE = "best_practice"
    CASE_STUDY = "case_study"
    FAQ = "faq"
    REFERENCE = "reference"


class ContentStatus(Enum):
    """Content lifecycle status"""
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"


class QualityDimension(Enum):
    """Quality assessment dimensions"""
    ACCURACY = "accuracy"
    COMPLETENESS = "completeness"
    CLARITY = "clarity"
    RELEVANCE = "relevance"
    TIMELINESS = "timeliness"
    USABILITY = "usability"


class SearchAlgorithm(Enum):
    """Search ranking algorithms"""
    TFIDF = "tfidf"
    BM25 = "bm25"
    VECTOR_SIMILARITY = "vector_similarity"


@dataclass
class TaxonomyNode:
    """Node in hierarchical taxonomy"""
    node_id: str
    name: str
    description: str
    parent_id: Optional[str]
    level: int
    children: List[str] = field(default_factory=list)
    associated_content: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class KnowledgeDocument:
    """Knowledge document with metadata"""
    document_id: str
    title: str
    content: str
    content_type: ContentType
    status: ContentStatus
    author: str
    tags: List[str]
    categories: List[str]
    quality_score: float = 0.0
    view_count: int = 0
    helpful_votes: int = 0
    version: str = "1.0"
    last_reviewed: Optional[str] = None
    expiry_date: Optional[str] = None
    related_documents: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class QualityAssessment:
    """Content quality assessment"""
    assessment_id: str
    document_id: str
    overall_score: float
    dimension_scores: Dict[str, float]
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
    assessed_by: str
    assessed_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class KnowledgeGraphEntity:
    """Entity in knowledge graph"""
    entity_id: str
    entity_type: str
    name: str
    description: str
    attributes: Dict[str, Any]
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class KnowledgeGraphRelationship:
    """Relationship between entities"""
    relationship_id: str
    source_entity_id: str
    target_entity_id: str
    relationship_type: str
    strength: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class SearchQuery:
    """Search query with context"""
    query_id: str
    query_text: str
    user_id: str
    filters: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class SearchResult:
    """Search result with ranking"""
    result_id: str
    document_id: str
    title: str
    snippet: str
    relevance_score: float
    rank: int
    matched_terms: List[str] = field(default_factory=list)


class KnowledgeCuratorAgent:
    """
    Knowledge Curator Agent responsible for knowledge management and documentation.

    Implements comprehensive knowledge management with:
    - Hierarchical taxonomy design and management
    - Content curation with quality scoring
    - Advanced search optimization (TF-IDF, BM25)
    - Knowledge graph construction
    - Document classification
    - Content lifecycle management
    - Usage analytics and recommendations
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Knowledge Curator Agent.

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "knowledge_curator_001"
        self.config = config or {}
        self.history: List[Dict[str, Any]] = []
        self.name = "Knowledge Curator"
        self.role = "Knowledge Management and Documentation"

        # Knowledge repositories
        self.taxonomy: Dict[str, TaxonomyNode] = {}
        self.documents: Dict[str, KnowledgeDocument] = {}
        self.quality_assessments: Dict[str, QualityAssessment] = {}
        self.knowledge_graph_entities: Dict[str, KnowledgeGraphEntity] = {}
        self.knowledge_graph_relationships: List[KnowledgeGraphRelationship] = []

        # Search indices
        self.inverted_index: Dict[str, Set[str]] = defaultdict(set)
        self.document_frequencies: Dict[str, int] = {}
        self.document_lengths: Dict[str, int] = {}

        # Analytics
        self.search_history: List[SearchQuery] = []
        self.content_usage: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "views": 0,
            "searches": 0,
            "helpful_votes": 0,
            "last_accessed": None
        })

    def organize_knowledge(self, knowledge_domain: str) -> Dict[str, Any]:
        """
        Organize knowledge assets with taxonomy design.

        Args:
            knowledge_domain: Domain to organize

        Returns:
            Dictionary containing taxonomy structure
        """
        try:
            logger.info(f"Organizing knowledge for domain: {knowledge_domain}")

            # Design taxonomy structure
            taxonomy = self._design_taxonomy(knowledge_domain)

            # Classify existing content
            classifications = self._classify_content(taxonomy)

            # Build knowledge graph
            graph_stats = self._build_knowledge_graph(knowledge_domain)

            # Generate organization metrics
            metrics = self._calculate_organization_metrics()

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "domain": knowledge_domain,
                "taxonomy": taxonomy,
                "classifications": classifications,
                "knowledge_graph": graph_stats,
                "metrics": metrics,
                "recommendations": self._generate_organization_recommendations(metrics)
            }

            self._log_operation("organize_knowledge", result)
            return result

        except Exception as e:
            logger.error(f"Error organizing knowledge: {str(e)}")
            return self._create_error_result(str(e))

    def create_documentation(self, topic: str, target_audience: str) -> Dict[str, Any]:
        """
        Create documentation with quality assessment.

        Args:
            topic: Documentation topic
            target_audience: Target audience for the documentation

        Returns:
            Dictionary containing documentation details
        """
        try:
            logger.info(f"Creating documentation for topic: {topic}")

            # Generate document structure
            document = self._generate_document_structure(topic, target_audience)

            # Assess quality
            quality_assessment = self._assess_quality(document)

            # Add to search index
            self._index_document(document)

            # Identify related content
            related = self._find_related_content(document)

            # Generate metadata
            metadata = self._generate_metadata(document, quality_assessment)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "document": asdict(document),
                "quality_assessment": asdict(quality_assessment),
                "related_content": related,
                "metadata": metadata,
                "next_review_date": self._calculate_next_review_date(document)
            }

            self._log_operation("create_documentation", result)
            return result

        except Exception as e:
            logger.error(f"Error creating documentation: {str(e)}")
            return self._create_error_result(str(e))

    def maintain_wiki(self, wiki_section: str) -> Dict[str, Any]:
        """
        Maintain knowledge wiki with lifecycle management.

        Args:
            wiki_section: Wiki section to maintain

        Returns:
            Dictionary containing maintenance results
        """
        try:
            logger.info(f"Maintaining wiki section: {wiki_section}")

            # Review content lifecycle
            lifecycle_status = self._review_content_lifecycle(wiki_section)

            # Update outdated content
            updates = self._identify_content_updates(lifecycle_status)

            # Archive deprecated content
            archived = self._archive_deprecated_content(lifecycle_status)

            # Generate version history
            version_history = self._generate_version_history(wiki_section)

            # Calculate maintenance metrics
            metrics = self._calculate_maintenance_metrics(wiki_section)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "section": wiki_section,
                "lifecycle_status": lifecycle_status,
                "updates_needed": updates,
                "archived_items": archived,
                "version_history": version_history,
                "metrics": metrics,
                "maintenance_plan": self._create_maintenance_plan(metrics)
            }

            self._log_operation("maintain_wiki", result)
            return result

        except Exception as e:
            logger.error(f"Error maintaining wiki: {str(e)}")
            return self._create_error_result(str(e))

    def facilitate_sharing(self, knowledge_type: str) -> Dict[str, Any]:
        """
        Facilitate knowledge sharing with recommendations.

        Args:
            knowledge_type: Type of knowledge to share

        Returns:
            Dictionary containing sharing facilitation results
        """
        try:
            logger.info(f"Facilitating knowledge sharing for type: {knowledge_type}")

            # Generate recommendations
            recommendations = self._generate_content_recommendations(knowledge_type)

            # Analyze usage patterns
            usage_analytics = self._analyze_usage_patterns(knowledge_type)

            # Optimize search
            search_optimization = self._optimize_search_ranking()

            # Identify knowledge gaps
            gaps = self._identify_knowledge_gaps(knowledge_type)

            # Create sharing strategy
            strategy = self._create_sharing_strategy(recommendations, gaps)

            result = {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "knowledge_type": knowledge_type,
                "recommendations": recommendations,
                "usage_analytics": usage_analytics,
                "search_optimization": search_optimization,
                "knowledge_gaps": gaps,
                "sharing_strategy": strategy
            }

            self._log_operation("facilitate_sharing", result)
            return result

        except Exception as e:
            logger.error(f"Error facilitating sharing: {str(e)}")
            return self._create_error_result(str(e))

    def search_knowledge(
        self,
        query: str,
        algorithm: SearchAlgorithm = SearchAlgorithm.BM25,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search knowledge base with advanced ranking.

        Args:
            query: Search query
            algorithm: Search algorithm to use
            filters: Optional filters

        Returns:
            Dictionary containing search results
        """
        try:
            logger.info(f"Searching knowledge base: {query}")

            # Create search query object
            search_query = SearchQuery(
                query_id=self._generate_id("query"),
                query_text=query,
                user_id="current_user",
                filters=filters or {}
            )

            # Execute search
            if algorithm == SearchAlgorithm.TFIDF:
                results = self._search_tfidf(search_query)
            elif algorithm == SearchAlgorithm.BM25:
                results = self._search_bm25(search_query)
            else:
                results = self._search_vector_similarity(search_query)

            # Track search
            self.search_history.append(search_query)

            # Update analytics
            for result in results:
                self.content_usage[result.document_id]["searches"] += 1

            return {
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "query": query,
                "algorithm": algorithm.value,
                "results": [asdict(r) for r in results],
                "total_results": len(results),
                "suggestions": self._generate_search_suggestions(query)
            }

        except Exception as e:
            logger.error(f"Error searching knowledge: {str(e)}")
            return self._create_error_result(str(e))

    def _design_taxonomy(self, domain: str) -> Dict[str, Any]:
        """Design hierarchical taxonomy for knowledge domain"""
        taxonomy_id = self._generate_id("taxonomy")

        # Create root node
        root = TaxonomyNode(
            node_id=f"{taxonomy_id}_root",
            name=domain,
            description=f"Root taxonomy for {domain}",
            parent_id=None,
            level=0
        )
        self.taxonomy[root.node_id] = root

        # Create level 1 categories
        categories = self._generate_categories(domain)
        for i, category in enumerate(categories):
            cat_node = TaxonomyNode(
                node_id=f"{taxonomy_id}_cat_{i}",
                name=category["name"],
                description=category["description"],
                parent_id=root.node_id,
                level=1
            )
            self.taxonomy[cat_node.node_id] = cat_node
            root.children.append(cat_node.node_id)

            # Create level 2 subcategories
            for j, subcategory in enumerate(category.get("subcategories", [])):
                subcat_node = TaxonomyNode(
                    node_id=f"{taxonomy_id}_subcat_{i}_{j}",
                    name=subcategory,
                    description=f"{subcategory} in {category['name']}",
                    parent_id=cat_node.node_id,
                    level=2
                )
                self.taxonomy[subcat_node.node_id] = subcat_node
                cat_node.children.append(subcat_node.node_id)

        return {
            "taxonomy_id": taxonomy_id,
            "root_node": root.node_id,
            "total_nodes": len(self.taxonomy),
            "max_depth": 2,
            "structure": self._get_taxonomy_structure(root.node_id)
        }

    def _generate_categories(self, domain: str) -> List[Dict[str, Any]]:
        """Generate categories for domain"""
        # Domain-specific category generation
        categories = [
            {
                "name": "Getting Started",
                "description": "Foundational knowledge and basics",
                "subcategories": ["Overview", "Prerequisites", "Quick Start"]
            },
            {
                "name": "Core Concepts",
                "description": "Essential concepts and principles",
                "subcategories": ["Fundamentals", "Key Principles", "Best Practices"]
            },
            {
                "name": "Technical Guides",
                "description": "Technical implementation guides",
                "subcategories": ["Setup", "Configuration", "Integration"]
            },
            {
                "name": "Advanced Topics",
                "description": "Advanced concepts and techniques",
                "subcategories": ["Optimization", "Scaling", "Troubleshooting"]
            },
            {
                "name": "Reference",
                "description": "Reference materials and documentation",
                "subcategories": ["API Reference", "Command Reference", "Glossary"]
            }
        ]
        return categories

    def _classify_content(self, taxonomy: Dict[str, Any]) -> Dict[str, Any]:
        """Classify existing content into taxonomy"""
        classifications = {
            "total_classified": 0,
            "by_category": defaultdict(int),
            "unclassified": [],
            "multi_category": []
        }

        for doc_id, document in self.documents.items():
            # Classify based on content analysis
            categories = self._predict_categories(document)

            if not categories:
                classifications["unclassified"].append(doc_id)
            elif len(categories) > 1:
                classifications["multi_category"].append({
                    "document_id": doc_id,
                    "categories": categories
                })

            for category in categories:
                classifications["by_category"][category] += 1
                # Update taxonomy node
                for node in self.taxonomy.values():
                    if node.name == category:
                        node.associated_content.append(doc_id)

            classifications["total_classified"] += 1

        return dict(classifications)

    def _predict_categories(self, document: KnowledgeDocument) -> List[str]:
        """Predict categories for document"""
        categories = []

        # Use tags and existing categories
        if document.tags:
            categories.extend(document.tags[:2])

        if document.categories:
            categories.extend(document.categories[:2])

        # Content-based classification
        content_lower = document.content.lower()

        if any(term in content_lower for term in ["introduction", "overview", "getting started"]):
            categories.append("Getting Started")
        elif any(term in content_lower for term in ["advanced", "optimization", "performance"]):
            categories.append("Advanced Topics")
        elif any(term in content_lower for term in ["api", "reference", "command"]):
            categories.append("Reference")
        else:
            categories.append("Core Concepts")

        return list(set(categories))

    def _build_knowledge_graph(self, domain: str) -> Dict[str, Any]:
        """Build knowledge graph with entities and relationships"""
        # Extract entities from documents
        entities_count = 0
        relationships_count = 0

        for doc_id, document in self.documents.items():
            # Extract entities
            entities = self._extract_entities(document)
            for entity in entities:
                entity_obj = KnowledgeGraphEntity(
                    entity_id=self._generate_id("entity"),
                    entity_type=entity["type"],
                    name=entity["name"],
                    description=entity.get("description", ""),
                    attributes={"source_document": doc_id}
                )
                self.knowledge_graph_entities[entity_obj.entity_id] = entity_obj
                entities_count += 1

        # Extract relationships
        entity_list = list(self.knowledge_graph_entities.values())
        for i, entity1 in enumerate(entity_list):
            for entity2 in entity_list[i+1:]:
                # Check for relationships
                relationship = self._detect_relationship(entity1, entity2)
                if relationship:
                    rel_obj = KnowledgeGraphRelationship(
                        relationship_id=self._generate_id("rel"),
                        source_entity_id=entity1.entity_id,
                        target_entity_id=entity2.entity_id,
                        relationship_type=relationship["type"],
                        strength=relationship["strength"]
                    )
                    self.knowledge_graph_relationships.append(rel_obj)
                    relationships_count += 1

        return {
            "entities_count": entities_count,
            "relationships_count": relationships_count,
            "graph_density": self._calculate_graph_density(),
            "central_entities": self._find_central_entities()[:5]
        }

    def _extract_entities(self, document: KnowledgeDocument) -> List[Dict[str, Any]]:
        """Extract entities from document"""
        entities = []

        # Extract from title
        entities.append({
            "type": "topic",
            "name": document.title,
            "description": document.title
        })

        # Extract from tags
        for tag in document.tags:
            entities.append({
                "type": "tag",
                "name": tag,
                "description": f"Tag: {tag}"
            })

        # Extract from categories
        for category in document.categories:
            entities.append({
                "type": "category",
                "name": category,
                "description": f"Category: {category}"
            })

        return entities

    def _detect_relationship(
        self,
        entity1: KnowledgeGraphEntity,
        entity2: KnowledgeGraphEntity
    ) -> Optional[Dict[str, Any]]:
        """Detect relationship between entities"""
        # Check for common attributes
        common_attrs = set(entity1.attributes.keys()) & set(entity2.attributes.keys())

        if common_attrs:
            return {
                "type": "related_to",
                "strength": len(common_attrs) / max(len(entity1.attributes), len(entity2.attributes))
            }

        # Check for type-based relationships
        if entity1.entity_type == "topic" and entity2.entity_type == "tag":
            return {
                "type": "tagged_with",
                "strength": 0.7
            }

        return None

    def _calculate_graph_density(self) -> float:
        """Calculate knowledge graph density"""
        n = len(self.knowledge_graph_entities)
        if n < 2:
            return 0.0

        max_edges = n * (n - 1) / 2
        actual_edges = len(self.knowledge_graph_relationships)

        return actual_edges / max_edges if max_edges > 0 else 0.0

    def _find_central_entities(self) -> List[Dict[str, Any]]:
        """Find most central entities in knowledge graph"""
        # Calculate degree centrality
        degree_count = defaultdict(int)

        for rel in self.knowledge_graph_relationships:
            degree_count[rel.source_entity_id] += 1
            degree_count[rel.target_entity_id] += 1

        # Sort by degree
        sorted_entities = sorted(degree_count.items(), key=lambda x: x[1], reverse=True)

        return [
            {
                "entity_id": entity_id,
                "name": self.knowledge_graph_entities[entity_id].name,
                "connections": count
            }
            for entity_id, count in sorted_entities[:10]
        ]

    def _generate_document_structure(
        self,
        topic: str,
        target_audience: str
    ) -> KnowledgeDocument:
        """Generate document structure"""
        document = KnowledgeDocument(
            document_id=self._generate_id("doc"),
            title=f"{topic} - Documentation",
            content=self._generate_content(topic, target_audience),
            content_type=ContentType.DOCUMENTATION,
            status=ContentStatus.DRAFT,
            author="knowledge_curator",
            tags=self._generate_tags(topic),
            categories=self._suggest_categories(topic)
        )

        self.documents[document.document_id] = document
        return document

    def _generate_content(self, topic: str, audience: str) -> str:
        """Generate content based on topic and audience"""
        sections = [
            f"# {topic}",
            "",
            "## Overview",
            f"This documentation covers {topic} for {audience}.",
            "",
            "## Key Concepts",
            f"- Understanding {topic} fundamentals",
            "- Best practices and guidelines",
            "- Common use cases",
            "",
            "## Getting Started",
            "1. Prerequisites",
            "2. Setup instructions",
            "3. Basic examples",
            "",
            "## Advanced Topics",
            f"- Advanced {topic} techniques",
            "- Optimization strategies",
            "- Troubleshooting",
            "",
            "## References",
            "- Related documentation",
            "- External resources"
        ]

        return "\n".join(sections)

    def _generate_tags(self, topic: str) -> List[str]:
        """Generate relevant tags"""
        tags = [topic.lower()]

        # Add common tags based on topic
        if "api" in topic.lower():
            tags.extend(["api", "reference", "technical"])
        elif "guide" in topic.lower():
            tags.extend(["guide", "tutorial", "howto"])
        else:
            tags.extend(["documentation", "reference"])

        return tags[:5]

    def _suggest_categories(self, topic: str) -> List[str]:
        """Suggest categories for topic"""
        categories = []

        topic_lower = topic.lower()

        if any(term in topic_lower for term in ["introduction", "overview", "basics"]):
            categories.append("Getting Started")
        if any(term in topic_lower for term in ["advanced", "optimization"]):
            categories.append("Advanced Topics")
        if any(term in topic_lower for term in ["api", "reference"]):
            categories.append("Reference")
        if any(term in topic_lower for term in ["guide", "tutorial"]):
            categories.append("Technical Guides")

        if not categories:
            categories.append("Core Concepts")

        return categories[:2]

    def _assess_quality(self, document: KnowledgeDocument) -> QualityAssessment:
        """Assess document quality across multiple dimensions"""
        dimension_scores = {}

        # Accuracy (based on references and citations)
        dimension_scores["accuracy"] = self._assess_accuracy(document)

        # Completeness (based on content length and structure)
        dimension_scores["completeness"] = self._assess_completeness(document)

        # Clarity (based on readability metrics)
        dimension_scores["clarity"] = self._assess_clarity(document)

        # Relevance (based on tags and categories)
        dimension_scores["relevance"] = self._assess_relevance(document)

        # Timeliness (based on creation/update dates)
        dimension_scores["timeliness"] = self._assess_timeliness(document)

        # Usability (based on structure and formatting)
        dimension_scores["usability"] = self._assess_usability(document)

        # Calculate overall score
        overall_score = sum(dimension_scores.values()) / len(dimension_scores)

        # Update document quality score
        document.quality_score = overall_score

        assessment = QualityAssessment(
            assessment_id=self._generate_id("qa"),
            document_id=document.document_id,
            overall_score=overall_score,
            dimension_scores=dimension_scores,
            strengths=self._identify_strengths(dimension_scores),
            weaknesses=self._identify_weaknesses(dimension_scores),
            improvement_suggestions=self._generate_improvement_suggestions(dimension_scores),
            assessed_by="knowledge_curator"
        )

        self.quality_assessments[assessment.assessment_id] = assessment
        return assessment

    def _assess_accuracy(self, document: KnowledgeDocument) -> float:
        """Assess content accuracy"""
        score = 70.0  # Base score

        # Check for citations or references
        if "reference" in document.content.lower() or "source" in document.content.lower():
            score += 15.0

        # Check for data or statistics
        if re.search(r'\d+%|\d+\.\d+', document.content):
            score += 10.0

        # Check for dates (indicating current information)
        if re.search(r'\d{4}', document.content):
            score += 5.0

        return min(score, 100.0)

    def _assess_completeness(self, document: KnowledgeDocument) -> float:
        """Assess content completeness"""
        score = 60.0  # Base score

        # Check content length
        content_length = len(document.content)
        if content_length > 1000:
            score += 20.0
        elif content_length > 500:
            score += 10.0

        # Check for sections
        section_count = document.content.count("##")
        score += min(section_count * 5, 20.0)

        return min(score, 100.0)

    def _assess_clarity(self, document: KnowledgeDocument) -> float:
        """Assess content clarity"""
        score = 75.0  # Base score

        # Check for code examples
        if "```" in document.content or "`" in document.content:
            score += 10.0

        # Check for lists
        if "-" in document.content or re.search(r'\d+\.', document.content):
            score += 10.0

        # Penalize very long paragraphs (poor readability)
        paragraphs = document.content.split("\n\n")
        avg_para_length = sum(len(p) for p in paragraphs) / len(paragraphs) if paragraphs else 0
        if avg_para_length > 500:
            score -= 5.0

        return min(score, 100.0)

    def _assess_relevance(self, document: KnowledgeDocument) -> float:
        """Assess content relevance"""
        score = 70.0  # Base score

        # Check tags
        if len(document.tags) >= 3:
            score += 15.0

        # Check categories
        if len(document.categories) >= 1:
            score += 15.0

        return min(score, 100.0)

    def _assess_timeliness(self, document: KnowledgeDocument) -> float:
        """Assess content timeliness"""
        score = 80.0  # Base score

        # Check last review date
        if document.last_reviewed:
            last_review = datetime.fromisoformat(document.last_reviewed)
            days_since_review = (datetime.now() - last_review).days

            if days_since_review > 365:
                score -= 30.0
            elif days_since_review > 180:
                score -= 15.0

        return max(score, 0.0)

    def _assess_usability(self, document: KnowledgeDocument) -> float:
        """Assess content usability"""
        score = 75.0  # Base score

        # Check for headings
        if "#" in document.content:
            score += 10.0

        # Check for table of contents or navigation
        if "table of contents" in document.content.lower():
            score += 10.0

        # Check for examples
        if "example" in document.content.lower():
            score += 5.0

        return min(score, 100.0)

    def _identify_strengths(self, dimension_scores: Dict[str, float]) -> List[str]:
        """Identify quality strengths"""
        strengths = []

        for dimension, score in dimension_scores.items():
            if score >= 85.0:
                strengths.append(f"Excellent {dimension}")

        return strengths

    def _identify_weaknesses(self, dimension_scores: Dict[str, float]) -> List[str]:
        """Identify quality weaknesses"""
        weaknesses = []

        for dimension, score in dimension_scores.items():
            if score < 70.0:
                weaknesses.append(f"Needs improvement in {dimension}")

        return weaknesses

    def _generate_improvement_suggestions(self, dimension_scores: Dict[str, float]) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []

        if dimension_scores.get("accuracy", 100) < 80:
            suggestions.append("Add more references and citations")

        if dimension_scores.get("completeness", 100) < 80:
            suggestions.append("Expand content with more details and examples")

        if dimension_scores.get("clarity", 100) < 80:
            suggestions.append("Improve readability with better structure and examples")

        if dimension_scores.get("timeliness", 100) < 80:
            suggestions.append("Review and update content to ensure currency")

        return suggestions

    def _index_document(self, document: KnowledgeDocument) -> None:
        """Add document to search index"""
        # Tokenize content
        tokens = self._tokenize(document.content + " " + document.title)

        # Update inverted index
        for token in tokens:
            self.inverted_index[token].add(document.document_id)

        # Update document frequencies
        unique_tokens = set(tokens)
        for token in unique_tokens:
            self.document_frequencies[token] = self.document_frequencies.get(token, 0) + 1

        # Store document length
        self.document_lengths[document.document_id] = len(tokens)

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text for indexing"""
        # Convert to lowercase and split
        text = text.lower()

        # Remove special characters except spaces
        text = re.sub(r'[^\w\s]', ' ', text)

        # Split and filter
        tokens = [t for t in text.split() if len(t) > 2]

        return tokens

    def _search_tfidf(self, query: SearchQuery) -> List[SearchResult]:
        """Search using TF-IDF ranking"""
        query_tokens = self._tokenize(query.query_text)
        doc_scores = defaultdict(float)
        total_docs = len(self.documents)

        for token in query_tokens:
            if token in self.inverted_index:
                # Calculate IDF
                df = self.document_frequencies.get(token, 0)
                idf = math.log((total_docs + 1) / (df + 1))

                # Calculate TF for each document
                for doc_id in self.inverted_index[token]:
                    if doc_id in self.documents:
                        doc = self.documents[doc_id]
                        doc_tokens = self._tokenize(doc.content + " " + doc.title)
                        tf = doc_tokens.count(token) / len(doc_tokens) if doc_tokens else 0

                        # TF-IDF score
                        doc_scores[doc_id] += tf * idf

        # Create results
        results = self._create_search_results(doc_scores, query_tokens)
        return results

    def _search_bm25(self, query: SearchQuery) -> List[SearchResult]:
        """Search using BM25 ranking"""
        query_tokens = self._tokenize(query.query_text)
        doc_scores = defaultdict(float)
        total_docs = len(self.documents)

        # BM25 parameters
        k1 = 1.5
        b = 0.75

        # Calculate average document length
        avg_doc_length = (
            sum(self.document_lengths.values()) / len(self.document_lengths)
            if self.document_lengths else 0
        )

        for token in query_tokens:
            if token in self.inverted_index:
                # Calculate IDF
                df = self.document_frequencies.get(token, 0)
                idf = math.log((total_docs - df + 0.5) / (df + 0.5) + 1)

                # Calculate BM25 for each document
                for doc_id in self.inverted_index[token]:
                    if doc_id in self.documents:
                        doc = self.documents[doc_id]
                        doc_tokens = self._tokenize(doc.content + " " + doc.title)
                        tf = doc_tokens.count(token)
                        doc_length = self.document_lengths.get(doc_id, 0)

                        # BM25 score
                        numerator = tf * (k1 + 1)
                        denominator = tf + k1 * (1 - b + b * (doc_length / avg_doc_length))
                        doc_scores[doc_id] += idf * (numerator / denominator)

        # Create results
        results = self._create_search_results(doc_scores, query_tokens)
        return results

    def _search_vector_similarity(self, query: SearchQuery) -> List[SearchResult]:
        """Search using vector similarity (simplified)"""
        # Fallback to BM25 for this implementation
        return self._search_bm25(query)

    def _create_search_results(
        self,
        doc_scores: Dict[str, float],
        query_tokens: List[str]
    ) -> List[SearchResult]:
        """Create search results from scores"""
        results = []

        # Sort by score
        sorted_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)

        for rank, (doc_id, score) in enumerate(sorted_docs[:20], 1):
            if doc_id in self.documents:
                doc = self.documents[doc_id]

                # Create snippet
                snippet = self._create_snippet(doc, query_tokens)

                result = SearchResult(
                    result_id=self._generate_id("result"),
                    document_id=doc_id,
                    title=doc.title,
                    snippet=snippet,
                    relevance_score=score,
                    rank=rank,
                    matched_terms=query_tokens
                )
                results.append(result)

        return results

    def _create_snippet(self, document: KnowledgeDocument, query_tokens: List[str]) -> str:
        """Create search result snippet"""
        content = document.content

        # Find first occurrence of query term
        for token in query_tokens:
            idx = content.lower().find(token.lower())
            if idx != -1:
                # Extract context around match
                start = max(0, idx - 50)
                end = min(len(content), idx + 150)
                snippet = content[start:end]

                if start > 0:
                    snippet = "..." + snippet
                if end < len(content):
                    snippet = snippet + "..."

                return snippet

        # Default to first 200 characters
        return content[:200] + "..." if len(content) > 200 else content

    def _find_related_content(self, document: KnowledgeDocument) -> List[Dict[str, Any]]:
        """Find related content"""
        related = []

        # Find documents with similar tags
        for doc_id, doc in self.documents.items():
            if doc_id != document.document_id:
                # Calculate similarity based on tags
                common_tags = set(document.tags) & set(doc.tags)
                if common_tags:
                    similarity = len(common_tags) / max(len(document.tags), len(doc.tags))
                    related.append({
                        "document_id": doc_id,
                        "title": doc.title,
                        "similarity": similarity,
                        "common_tags": list(common_tags)
                    })

        # Sort by similarity
        related.sort(key=lambda x: x["similarity"], reverse=True)
        return related[:5]

    def _generate_metadata(
        self,
        document: KnowledgeDocument,
        quality_assessment: QualityAssessment
    ) -> Dict[str, Any]:
        """Generate document metadata"""
        return {
            "word_count": len(document.content.split()),
            "estimated_reading_time": f"{max(1, len(document.content.split()) // 200)} minutes",
            "quality_score": quality_assessment.overall_score,
            "last_updated": document.updated_at,
            "content_type": document.content_type.value,
            "status": document.status.value
        }

    def _calculate_next_review_date(self, document: KnowledgeDocument) -> str:
        """Calculate next review date based on content type"""
        review_intervals = {
            ContentType.DOCUMENTATION: 90,  # days
            ContentType.TUTORIAL: 180,
            ContentType.REFERENCE: 365,
            ContentType.GUIDE: 120,
            ContentType.BEST_PRACTICE: 90
        }

        interval = review_intervals.get(document.content_type, 180)
        next_review = datetime.now() + timedelta(days=interval)

        return next_review.isoformat()

    def _review_content_lifecycle(self, section: str) -> Dict[str, Any]:
        """Review content lifecycle status"""
        lifecycle_status = {
            "needs_review": [],
            "needs_update": [],
            "deprecated": [],
            "healthy": []
        }

        for doc_id, doc in self.documents.items():
            if section in doc.categories or section in doc.tags:
                # Check last review date
                if doc.last_reviewed:
                    days_since_review = (
                        datetime.now() - datetime.fromisoformat(doc.last_reviewed)
                    ).days

                    if days_since_review > 180:
                        lifecycle_status["needs_review"].append({
                            "document_id": doc_id,
                            "title": doc.title,
                            "days_since_review": days_since_review
                        })
                else:
                    lifecycle_status["needs_review"].append({
                        "document_id": doc_id,
                        "title": doc.title,
                        "days_since_review": "never"
                    })

                # Check status
                if doc.status == ContentStatus.DEPRECATED:
                    lifecycle_status["deprecated"].append(doc_id)
                elif doc.quality_score < 70.0:
                    lifecycle_status["needs_update"].append({
                        "document_id": doc_id,
                        "title": doc.title,
                        "quality_score": doc.quality_score
                    })
                else:
                    lifecycle_status["healthy"].append(doc_id)

        return lifecycle_status

    def _identify_content_updates(self, lifecycle_status: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify content that needs updates"""
        updates = []

        for item in lifecycle_status.get("needs_update", []):
            updates.append({
                "document_id": item["document_id"],
                "title": item["title"],
                "reason": "Low quality score",
                "priority": "high" if item["quality_score"] < 60 else "medium"
            })

        for item in lifecycle_status.get("needs_review", []):
            updates.append({
                "document_id": item["document_id"],
                "title": item["title"],
                "reason": "Needs review",
                "priority": "medium"
            })

        return updates

    def _archive_deprecated_content(self, lifecycle_status: Dict[str, Any]) -> List[str]:
        """Archive deprecated content"""
        archived = []

        for doc_id in lifecycle_status.get("deprecated", []):
            if doc_id in self.documents:
                doc = self.documents[doc_id]
                doc.status = ContentStatus.ARCHIVED
                archived.append(doc_id)

        return archived

    def _generate_version_history(self, section: str) -> List[Dict[str, Any]]:
        """Generate version history for section"""
        history = []

        for doc_id, doc in self.documents.items():
            if section in doc.categories or section in doc.tags:
                history.append({
                    "document_id": doc_id,
                    "title": doc.title,
                    "version": doc.version,
                    "created_at": doc.created_at,
                    "updated_at": doc.updated_at
                })

        return history

    def _calculate_organization_metrics(self) -> Dict[str, Any]:
        """Calculate knowledge organization metrics"""
        return {
            "total_documents": len(self.documents),
            "total_taxonomy_nodes": len(self.taxonomy),
            "documents_per_category": self._calculate_category_distribution(),
            "average_quality_score": self._calculate_average_quality(),
            "knowledge_graph_metrics": {
                "entities": len(self.knowledge_graph_entities),
                "relationships": len(self.knowledge_graph_relationships),
                "density": self._calculate_graph_density()
            }
        }

    def _calculate_category_distribution(self) -> Dict[str, int]:
        """Calculate distribution of documents per category"""
        distribution = defaultdict(int)

        for doc in self.documents.values():
            for category in doc.categories:
                distribution[category] += 1

        return dict(distribution)

    def _calculate_average_quality(self) -> float:
        """Calculate average quality score"""
        if not self.documents:
            return 0.0

        total_score = sum(doc.quality_score for doc in self.documents.values())
        return total_score / len(self.documents)

    def _generate_organization_recommendations(self, metrics: Dict[str, Any]) -> List[str]:
        """Generate recommendations for knowledge organization"""
        recommendations = []

        # Check document distribution
        dist = metrics.get("documents_per_category", {})
        if dist:
            max_docs = max(dist.values())
            min_docs = min(dist.values())

            if max_docs > min_docs * 3:
                recommendations.append("Consider rebalancing content across categories")

        # Check quality
        avg_quality = metrics.get("average_quality_score", 100)
        if avg_quality < 75:
            recommendations.append("Focus on improving overall content quality")

        # Check knowledge graph
        graph_metrics = metrics.get("knowledge_graph_metrics", {})
        if graph_metrics.get("density", 0) < 0.1:
            recommendations.append("Increase content relationships and cross-references")

        return recommendations

    def _calculate_maintenance_metrics(self, section: str) -> Dict[str, Any]:
        """Calculate maintenance metrics for section"""
        section_docs = [
            doc for doc in self.documents.values()
            if section in doc.categories or section in doc.tags
        ]

        return {
            "total_documents": len(section_docs),
            "average_quality": (
                sum(doc.quality_score for doc in section_docs) / len(section_docs)
                if section_docs else 0
            ),
            "documents_needing_review": sum(
                1 for doc in section_docs
                if not doc.last_reviewed or
                (datetime.now() - datetime.fromisoformat(doc.last_reviewed)).days > 180
            ),
            "average_age_days": self._calculate_average_age(section_docs)
        }

    def _calculate_average_age(self, documents: List[KnowledgeDocument]) -> float:
        """Calculate average document age"""
        if not documents:
            return 0.0

        total_age = 0
        for doc in documents:
            age = (datetime.now() - datetime.fromisoformat(doc.created_at)).days
            total_age += age

        return total_age / len(documents)

    def _create_maintenance_plan(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create maintenance plan based on metrics"""
        plan = {
            "priority_actions": [],
            "schedule": []
        }

        # Determine priority actions
        if metrics["documents_needing_review"] > 0:
            plan["priority_actions"].append({
                "action": "Review outdated content",
                "count": metrics["documents_needing_review"],
                "deadline": (datetime.now() + timedelta(days=30)).isoformat()
            })

        if metrics["average_quality"] < 75:
            plan["priority_actions"].append({
                "action": "Improve content quality",
                "target_score": 80,
                "current_score": metrics["average_quality"]
            })

        # Create schedule
        plan["schedule"] = [
            {"task": "Weekly content review", "frequency": "weekly"},
            {"task": "Monthly quality audit", "frequency": "monthly"},
            {"task": "Quarterly taxonomy review", "frequency": "quarterly"}
        ]

        return plan

    def _generate_content_recommendations(self, knowledge_type: str) -> List[Dict[str, Any]]:
        """Generate personalized content recommendations"""
        recommendations = []

        # Find highly rated content
        top_content = sorted(
            self.documents.values(),
            key=lambda x: x.quality_score,
            reverse=True
        )[:10]

        for doc in top_content:
            if knowledge_type.lower() in [t.lower() for t in doc.tags]:
                recommendations.append({
                    "document_id": doc.document_id,
                    "title": doc.title,
                    "quality_score": doc.quality_score,
                    "reason": "High quality content",
                    "popularity": doc.view_count
                })

        return recommendations

    def _analyze_usage_patterns(self, knowledge_type: str) -> Dict[str, Any]:
        """Analyze content usage patterns"""
        type_docs = [
            doc for doc in self.documents.values()
            if knowledge_type.lower() in [t.lower() for t in doc.tags]
        ]

        total_views = sum(doc.view_count for doc in type_docs)
        total_helpful = sum(doc.helpful_votes for doc in type_docs)

        return {
            "total_documents": len(type_docs),
            "total_views": total_views,
            "total_helpful_votes": total_helpful,
            "average_views_per_doc": total_views / len(type_docs) if type_docs else 0,
            "helpfulness_ratio": total_helpful / total_views if total_views > 0 else 0,
            "most_viewed": self._get_most_viewed(type_docs, 5),
            "trending": self._get_trending(type_docs, 5)
        }

    def _get_most_viewed(
        self,
        documents: List[KnowledgeDocument],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get most viewed documents"""
        sorted_docs = sorted(documents, key=lambda x: x.view_count, reverse=True)

        return [
            {
                "document_id": doc.document_id,
                "title": doc.title,
                "view_count": doc.view_count
            }
            for doc in sorted_docs[:limit]
        ]

    def _get_trending(
        self,
        documents: List[KnowledgeDocument],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get trending documents (simplified)"""
        # For simplicity, return recently created with high views
        recent_docs = [
            doc for doc in documents
            if (datetime.now() - datetime.fromisoformat(doc.created_at)).days < 30
        ]

        sorted_docs = sorted(recent_docs, key=lambda x: x.view_count, reverse=True)

        return [
            {
                "document_id": doc.document_id,
                "title": doc.title,
                "view_count": doc.view_count,
                "created_at": doc.created_at
            }
            for doc in sorted_docs[:limit]
        ]

    def _optimize_search_ranking(self) -> Dict[str, Any]:
        """Optimize search ranking algorithms"""
        optimizations = {
            "index_size": len(self.inverted_index),
            "total_terms": sum(len(docs) for docs in self.inverted_index.values()),
            "average_term_frequency": (
                sum(len(docs) for docs in self.inverted_index.values()) / len(self.inverted_index)
                if self.inverted_index else 0
            ),
            "suggestions": []
        }

        # Analyze search patterns
        if self.search_history:
            common_queries = Counter(q.query_text for q in self.search_history)
            optimizations["common_queries"] = [
                {"query": q, "count": c}
                for q, c in common_queries.most_common(10)
            ]

        # Optimization suggestions
        if len(self.inverted_index) > 10000:
            optimizations["suggestions"].append("Consider implementing search index pruning")

        if len(self.search_history) > 1000:
            optimizations["suggestions"].append("Implement query caching for common searches")

        return optimizations

    def _identify_knowledge_gaps(self, knowledge_type: str) -> List[Dict[str, Any]]:
        """Identify gaps in knowledge coverage"""
        gaps = []

        # Check taxonomy coverage
        for node in self.taxonomy.values():
            if len(node.associated_content) == 0:
                gaps.append({
                    "type": "uncovered_category",
                    "category": node.name,
                    "level": node.level,
                    "priority": "high" if node.level <= 1 else "medium"
                })

        # Check search queries with no results
        if self.search_history:
            for query in self.search_history[-100:]:  # Last 100 queries
                # Simulate checking for zero results
                if len(query.query_text.split()) > 5:  # Complex queries
                    gaps.append({
                        "type": "missing_content",
                        "query": query.query_text,
                        "priority": "medium"
                    })

        return gaps[:10]

    def _create_sharing_strategy(
        self,
        recommendations: List[Dict[str, Any]],
        gaps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create knowledge sharing strategy"""
        strategy = {
            "focus_areas": [],
            "content_promotion": [],
            "gap_filling": []
        }

        # Determine focus areas
        if recommendations:
            strategy["focus_areas"].append({
                "area": "High-quality content promotion",
                "target_docs": [r["document_id"] for r in recommendations[:5]]
            })

        # Content promotion strategy
        strategy["content_promotion"] = [
            {"channel": "Internal newsletter", "frequency": "weekly"},
            {"channel": "Knowledge hub featured section", "frequency": "daily"},
            {"channel": "Email digests", "frequency": "weekly"}
        ]

        # Gap filling strategy
        if gaps:
            strategy["gap_filling"] = [
                {
                    "gap": gap["type"],
                    "action": "Create new content" if gap["type"] == "uncovered_category" else "Improve search",
                    "priority": gap.get("priority", "medium")
                }
                for gap in gaps[:5]
            ]

        return strategy

    def _generate_search_suggestions(self, query: str) -> List[str]:
        """Generate search suggestions"""
        suggestions = []

        # Get common related terms from inverted index
        query_tokens = self._tokenize(query)

        for token in query_tokens:
            # Find related terms (simplified - just similar starts)
            for indexed_term in list(self.inverted_index.keys())[:100]:
                if indexed_term.startswith(token[:3]) and indexed_term != token:
                    suggestions.append(indexed_term)

        return list(set(suggestions))[:5]

    def _get_taxonomy_structure(self, node_id: str) -> Dict[str, Any]:
        """Get taxonomy structure recursively"""
        if node_id not in self.taxonomy:
            return {}

        node = self.taxonomy[node_id]
        structure = {
            "node_id": node.node_id,
            "name": node.name,
            "level": node.level,
            "content_count": len(node.associated_content),
            "children": []
        }

        for child_id in node.children:
            structure["children"].append(self._get_taxonomy_structure(child_id))

        return structure

    def get_history_summary(self) -> Dict[str, Any]:
        """
        Get summary of operations history.

        Returns:
            Dictionary containing history summary
        """
        return {
            "total_operations": len(self.history),
            "recent_operations": self.history[-5:] if self.history else [],
            "agent_id": self.agent_id,
            "knowledge_stats": {
                "total_documents": len(self.documents),
                "total_taxonomy_nodes": len(self.taxonomy),
                "total_entities": len(self.knowledge_graph_entities),
                "total_relationships": len(self.knowledge_graph_relationships)
            }
        }

    def _log_operation(self, operation: str, result: Dict[str, Any]) -> None:
        """Log operation to history"""
        self.history.append({
            "operation": operation,
            "timestamp": datetime.now().isoformat(),
            "status": result.get("status", "unknown"),
            "summary": self._create_operation_summary(operation, result)
        })

    def _create_operation_summary(self, operation: str, result: Dict[str, Any]) -> str:
        """Create operation summary"""
        summaries = {
            "organize_knowledge": f"Organized knowledge for {result.get('domain', 'unknown')}",
            "create_documentation": f"Created documentation: {result.get('document', {}).get('title', 'unknown')}",
            "maintain_wiki": f"Maintained wiki section: {result.get('section', 'unknown')}",
            "facilitate_sharing": f"Facilitated sharing for {result.get('knowledge_type', 'unknown')}"
        }

        return summaries.get(operation, f"Performed {operation}")

    def _create_error_result(self, error: str) -> Dict[str, Any]:
        """Create error result"""
        return {
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": error,
            "data": {}
        }

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID"""
        timestamp = datetime.now().isoformat()
        unique_string = f"{prefix}_{timestamp}_{id(self)}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:12]
