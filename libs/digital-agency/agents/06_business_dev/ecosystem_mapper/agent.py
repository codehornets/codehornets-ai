"""
Ecosystem Mapper Agent

Maps business ecosystems, analyzes dependencies, and identifies influence patterns.
Implements ecosystem visualization, network analysis, and strategic positioning.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import logging
import json
import hashlib
from collections import defaultdict, deque
import math

logger = logging.getLogger(__name__)


class EntityType(Enum):
    """Types of ecosystem entities."""
    COMPANY = "company"
    PARTNER = "partner"
    COMPETITOR = "competitor"
    SUPPLIER = "supplier"
    CUSTOMER = "customer"
    PLATFORM = "platform"
    TECHNOLOGY = "technology"
    REGULATOR = "regulator"
    INFLUENCER = "influencer"


class RelationshipType(Enum):
    """Types of ecosystem relationships."""
    PARTNERSHIP = "partnership"
    COMPETITION = "competition"
    SUPPLIER = "supplier"
    CUSTOMER = "customer"
    INTEGRATION = "integration"
    DEPENDENCY = "dependency"
    INFLUENCE = "influence"
    COLLABORATION = "collaboration"


class InfluenceLevel(Enum):
    """Levels of influence in ecosystem."""
    DOMINANT = "dominant"
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    MINIMAL = "minimal"


@dataclass
class EcosystemEntity:
    """Entity in the ecosystem."""
    entity_id: str
    name: str
    entity_type: EntityType
    influence_score: int
    connections: List[str]
    attributes: Dict[str, Any]
    market_share: float
    revenue: float
    created_at: datetime


@dataclass
class EcosystemRelationship:
    """Relationship between entities."""
    relationship_id: str
    from_entity: str
    to_entity: str
    relationship_type: RelationshipType
    strength: float
    bidirectional: bool
    metadata: Dict[str, Any]


@dataclass
class EcosystemMap:
    """Complete ecosystem map."""
    map_id: str
    map_name: str
    entities: Dict[str, EcosystemEntity]
    relationships: List[EcosystemRelationship]
    clusters: List[Dict[str, Any]]
    influence_analysis: Dict[str, Any]
    dependencies: Dict[str, List[str]]
    created_at: datetime


class EcosystemMapperAgent:
    """
    Production-grade Ecosystem Mapper Agent.

    Maps and analyzes business ecosystems with sophisticated network
    analysis, influence detection, dependency mapping, and strategic
    positioning recommendations.

    Features:
    - Ecosystem entity identification and mapping
    - Relationship network analysis
    - Influence and power mapping
    - Dependency chain analysis
    - Cluster identification
    - Strategic positioning analysis
    - Threat and opportunity detection
    - Ecosystem health scoring
    - Network visualization data generation
    - Centrality analysis
    - Path analysis between entities
    - Ecosystem evolution tracking
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Ecosystem Mapper Agent.

        Args:
            config: Configuration dictionary with mapping parameters
        """
        self.config = config or {}
        self.name = "Ecosystem Mapper"
        self.role = "Ecosystem Analysis and Strategy"
        self.goal = "Map and analyze business ecosystems for strategic advantage"

        # Ecosystem storage
        self.ecosystems: Dict[str, EcosystemMap] = {}
        self.entities: Dict[str, EcosystemEntity] = {}
        self.relationships: List[EcosystemRelationship] = []

        # Analysis thresholds
        self.high_influence_threshold = self.config.get("high_influence", 80)
        self.strong_relationship_threshold = self.config.get("strong_relationship", 0.7)

        # Clustering parameters
        self.cluster_threshold = self.config.get("cluster_threshold", 0.6)

        logger.info("Ecosystem Mapper initialized successfully")

    def map_ecosystem(
        self, ecosystem_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Map a complete business ecosystem.

        Args:
            ecosystem_data: Ecosystem entities and relationships data

        Returns:
            Complete ecosystem map and analysis
        """
        try:
            logger.info("Mapping ecosystem")

            if not ecosystem_data:
                raise ValueError("ecosystem_data cannot be empty")

            ecosystem_name = ecosystem_data.get("name")
            if not ecosystem_name:
                raise ValueError("ecosystem name is required")

            # Extract and process entities
            entities_data = ecosystem_data.get("entities", [])
            entities = self._process_entities(entities_data)

            # Extract and process relationships
            relationships_data = ecosystem_data.get("relationships", [])
            relationships = self._process_relationships(relationships_data, entities)

            # Calculate influence scores
            influence_analysis = self._analyze_influence(entities, relationships)

            # Identify dependencies
            dependencies = self._map_dependencies(entities, relationships)

            # Detect clusters
            clusters = self._detect_clusters(entities, relationships)

            # Analyze strategic position
            strategic_position = self._analyze_strategic_position(
                entities, relationships, influence_analysis
            )

            # Identify threats and opportunities
            threats_opportunities = self._identify_threats_opportunities(
                entities, relationships, influence_analysis
            )

            # Calculate ecosystem health
            health_score = self._calculate_ecosystem_health(
                entities, relationships, dependencies
            )

            # Generate network metrics
            network_metrics = self._calculate_network_metrics(entities, relationships)

            # Generate visualization data
            visualization_data = self._generate_visualization_data(
                entities, relationships, clusters
            )

            result = {
                "success": True,
                "ecosystem_name": ecosystem_name,
                "summary": {
                    "total_entities": len(entities),
                    "total_relationships": len(relationships),
                    "clusters_identified": len(clusters),
                    "ecosystem_health": health_score
                },
                "entities": self._serialize_entities(entities),
                "relationships": self._serialize_relationships(relationships),
                "influence_analysis": influence_analysis,
                "dependencies": dependencies,
                "clusters": clusters,
                "strategic_position": strategic_position,
                "threats_opportunities": threats_opportunities,
                "network_metrics": network_metrics,
                "visualization": visualization_data,
                "recommendations": self._generate_ecosystem_recommendations(
                    strategic_position, threats_opportunities
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Ecosystem mapping completed: {ecosystem_name}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in map_ecosystem: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in map_ecosystem: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _process_entities(self, entities_data: List[Dict[str, Any]]) -> Dict[str, EcosystemEntity]:
        """Process and create entity objects."""
        entities = {}

        for entity_data in entities_data:
            entity_id = entity_data.get("id") or self._generate_entity_id(entity_data.get("name"))

            try:
                entity_type = EntityType(entity_data.get("type", "company"))
            except ValueError:
                entity_type = EntityType.COMPANY

            entity = EcosystemEntity(
                entity_id=entity_id,
                name=entity_data.get("name", "Unknown"),
                entity_type=entity_type,
                influence_score=0,  # Will be calculated
                connections=[],
                attributes=entity_data.get("attributes", {}),
                market_share=entity_data.get("market_share", 0),
                revenue=entity_data.get("revenue", 0),
                created_at=datetime.utcnow()
            )

            entities[entity_id] = entity

        return entities

    def _generate_entity_id(self, name: str) -> str:
        """Generate unique entity ID."""
        return hashlib.sha256(name.encode()).hexdigest()[:12]

    def _process_relationships(
        self, relationships_data: List[Dict[str, Any]], entities: Dict[str, EcosystemEntity]
    ) -> List[EcosystemRelationship]:
        """Process and create relationship objects."""
        relationships = []

        for rel_data in relationships_data:
            from_entity = rel_data.get("from")
            to_entity = rel_data.get("to")

            if from_entity not in entities or to_entity not in entities:
                logger.warning(f"Skipping relationship with unknown entity: {from_entity} -> {to_entity}")
                continue

            try:
                rel_type = RelationshipType(rel_data.get("type", "partnership"))
            except ValueError:
                rel_type = RelationshipType.PARTNERSHIP

            relationship = EcosystemRelationship(
                relationship_id=f"{from_entity}_{to_entity}",
                from_entity=from_entity,
                to_entity=to_entity,
                relationship_type=rel_type,
                strength=rel_data.get("strength", 0.5),
                bidirectional=rel_data.get("bidirectional", False),
                metadata=rel_data.get("metadata", {})
            )

            relationships.append(relationship)

            # Update entity connections
            entities[from_entity].connections.append(to_entity)
            if relationship.bidirectional:
                entities[to_entity].connections.append(from_entity)

        return relationships

    def _analyze_influence(
        self, entities: Dict[str, EcosystemEntity], relationships: List[EcosystemRelationship]
    ) -> Dict[str, Any]:
        """Analyze influence patterns in the ecosystem."""
        # Build adjacency matrix for network analysis
        adjacency = defaultdict(list)
        for rel in relationships:
            adjacency[rel.from_entity].append((rel.to_entity, rel.strength))
            if rel.bidirectional:
                adjacency[rel.to_entity].append((rel.from_entity, rel.strength))

        # Calculate influence metrics
        influence_scores = {}

        for entity_id, entity in entities.items():
            # Degree centrality (number of connections)
            degree = len(entity.connections)

            # Weighted centrality (sum of relationship strengths)
            weighted_degree = sum(
                rel.strength for rel in relationships
                if rel.from_entity == entity_id or (rel.bidirectional and rel.to_entity == entity_id)
            )

            # Market-based influence
            market_influence = entity.market_share * 100

            # Revenue-based influence
            revenue_influence = min(math.log10(entity.revenue + 1) * 10, 50) if entity.revenue > 0 else 0

            # Combined influence score
            influence = int(
                degree * 10 +
                weighted_degree * 20 +
                market_influence * 0.3 +
                revenue_influence
            )

            influence_scores[entity_id] = min(influence, 100)
            entities[entity_id].influence_score = influence_scores[entity_id]

        # Identify most influential entities
        sorted_entities = sorted(
            influence_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        top_influencers = [
            {
                "entity_id": ent_id,
                "name": entities[ent_id].name,
                "influence_score": score,
                "influence_level": self._determine_influence_level(score)
            }
            for ent_id, score in sorted_entities[:10]
        ]

        return {
            "influence_scores": influence_scores,
            "top_influencers": top_influencers,
            "average_influence": sum(influence_scores.values()) / len(influence_scores) if influence_scores else 0,
            "influence_distribution": self._calculate_influence_distribution(influence_scores)
        }

    def _determine_influence_level(self, score: int) -> str:
        """Determine influence level based on score."""
        if score >= 80:
            return InfluenceLevel.DOMINANT.value
        elif score >= 60:
            return InfluenceLevel.STRONG.value
        elif score >= 40:
            return InfluenceLevel.MODERATE.value
        elif score >= 20:
            return InfluenceLevel.WEAK.value
        else:
            return InfluenceLevel.MINIMAL.value

    def _calculate_influence_distribution(self, influence_scores: Dict[str, int]) -> Dict[str, int]:
        """Calculate distribution of influence across ecosystem."""
        distribution = {
            "dominant": 0,
            "strong": 0,
            "moderate": 0,
            "weak": 0,
            "minimal": 0
        }

        for score in influence_scores.values():
            level = self._determine_influence_level(score)
            distribution[level] += 1

        return distribution

    def _map_dependencies(
        self, entities: Dict[str, EcosystemEntity], relationships: List[EcosystemRelationship]
    ) -> Dict[str, Any]:
        """Map dependency chains in the ecosystem."""
        dependencies = defaultdict(list)

        # Identify dependency relationships
        for rel in relationships:
            if rel.relationship_type in [RelationshipType.DEPENDENCY, RelationshipType.SUPPLIER]:
                dependencies[rel.from_entity].append({
                    "depends_on": rel.to_entity,
                    "dependency_type": rel.relationship_type.value,
                    "strength": rel.strength
                })

        # Calculate dependency scores
        dependency_scores = {}
        for entity_id in entities.keys():
            # How many dependencies this entity has
            outbound = len(dependencies.get(entity_id, []))

            # How many entities depend on this one
            inbound = sum(
                1 for deps in dependencies.values()
                for dep in deps
                if dep["depends_on"] == entity_id
            )

            dependency_scores[entity_id] = {
                "dependencies": outbound,
                "dependents": inbound,
                "dependency_ratio": outbound / (inbound + 1),  # Avoid division by zero
                "criticality": inbound  # More dependents = more critical
            }

        # Identify critical dependencies
        critical = [
            {
                "entity_id": ent_id,
                "name": entities[ent_id].name,
                "dependents": scores["dependents"],
                "risk_level": "high" if scores["dependents"] > 5 else "medium" if scores["dependents"] > 2 else "low"
            }
            for ent_id, scores in dependency_scores.items()
            if scores["dependents"] > 0
        ]
        critical.sort(key=lambda x: x["dependents"], reverse=True)

        return {
            "dependency_map": dict(dependencies),
            "dependency_scores": dependency_scores,
            "critical_dependencies": critical[:10],
            "single_points_of_failure": [
                c for c in critical if c["risk_level"] == "high"
            ]
        }

    def _detect_clusters(
        self, entities: Dict[str, EcosystemEntity], relationships: List[EcosystemRelationship]
    ) -> List[Dict[str, Any]]:
        """Detect clusters in the ecosystem using community detection."""
        # Build adjacency list
        adjacency = defaultdict(set)
        for rel in relationships:
            adjacency[rel.from_entity].add(rel.to_entity)
            if rel.bidirectional:
                adjacency[rel.to_entity].add(rel.from_entity)

        # Simple clustering based on connectivity
        visited = set()
        clusters = []

        for entity_id in entities.keys():
            if entity_id in visited:
                continue

            # BFS to find connected component
            cluster = set()
            queue = deque([entity_id])

            while queue:
                current = queue.popleft()
                if current in visited:
                    continue

                visited.add(current)
                cluster.add(current)

                # Add strongly connected neighbors
                for neighbor in adjacency[current]:
                    if neighbor not in visited:
                        # Check relationship strength
                        rel_strength = next(
                            (r.strength for r in relationships
                             if (r.from_entity == current and r.to_entity == neighbor) or
                                (r.bidirectional and r.from_entity == neighbor and r.to_entity == current)),
                            0
                        )

                        if rel_strength >= self.cluster_threshold:
                            queue.append(neighbor)

            if len(cluster) > 1:  # Only include clusters with multiple entities
                cluster_entities = [
                    {
                        "id": ent_id,
                        "name": entities[ent_id].name,
                        "type": entities[ent_id].entity_type.value
                    }
                    for ent_id in cluster
                ]

                clusters.append({
                    "cluster_id": f"cluster_{len(clusters) + 1}",
                    "size": len(cluster),
                    "entities": cluster_entities,
                    "cluster_type": self._determine_cluster_type(cluster, entities)
                })

        return clusters

    def _determine_cluster_type(
        self, cluster: Set[str], entities: Dict[str, EcosystemEntity]
    ) -> str:
        """Determine the type/theme of a cluster."""
        # Analyze entity types in cluster
        types = [entities[ent_id].entity_type for ent_id in cluster]
        type_counts = defaultdict(int)

        for entity_type in types:
            type_counts[entity_type.value] += 1

        # Dominant type determines cluster type
        if type_counts:
            dominant_type = max(type_counts.items(), key=lambda x: x[1])[0]
            return f"{dominant_type}_cluster"

        return "mixed_cluster"

    def _analyze_strategic_position(
        self,
        entities: Dict[str, EcosystemEntity],
        relationships: List[EcosystemRelationship],
        influence_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze strategic positioning in the ecosystem."""
        # Identify our position (assuming we're one of the entities)
        our_entity_id = self.config.get("our_entity_id")

        if not our_entity_id or our_entity_id not in entities:
            return {
                "status": "not_mapped",
                "message": "Our entity not identified in ecosystem"
            }

        our_entity = entities[our_entity_id]
        our_influence = influence_analysis["influence_scores"].get(our_entity_id, 0)

        # Analyze competitive position
        competitors = [
                ent for ent in entities.values()
                if ent.entity_type == EntityType.COMPETITOR
            ]

        competitive_position = self._analyze_competitive_position(
            our_entity, competitors, influence_analysis
        )

        # Analyze partnership position
        partnerships = [
            rel for rel in relationships
            if (rel.from_entity == our_entity_id or rel.to_entity == our_entity_id) and
               rel.relationship_type == RelationshipType.PARTNERSHIP
        ]

        partnership_strength = sum(p.strength for p in partnerships) / len(partnerships) if partnerships else 0

        # Analyze market position
        total_market = sum(e.market_share for e in entities.values())
        our_market_share = our_entity.market_share / total_market if total_market > 0 else 0

        # Strategic positioning score
        position_score = int(
            our_influence * 0.40 +
            partnership_strength * 100 * 0.30 +
            our_market_share * 100 * 0.30
        )

        return {
            "our_entity": {
                "id": our_entity_id,
                "name": our_entity.name,
                "influence_score": our_influence
            },
            "position_score": position_score,
            "influence_ranking": self._calculate_ranking(our_entity_id, influence_analysis),
            "competitive_position": competitive_position,
            "partnership_count": len(partnerships),
            "partnership_strength": round(partnership_strength, 2),
            "market_share": round(our_market_share, 3),
            "strategic_advantages": self._identify_strategic_advantages(
                our_entity, relationships, influence_analysis
            ),
            "strategic_gaps": self._identify_strategic_gaps(
                our_entity, relationships, entities
            )
        }

    def _calculate_ranking(self, entity_id: str, influence_analysis: Dict[str, Any]) -> int:
        """Calculate entity's ranking in the ecosystem."""
        sorted_scores = sorted(
            influence_analysis["influence_scores"].items(),
            key=lambda x: x[1],
            reverse=True
        )

        for rank, (ent_id, score) in enumerate(sorted_scores, 1):
            if ent_id == entity_id:
                return rank

        return len(sorted_scores)

    def _analyze_competitive_position(
        self,
        our_entity: EcosystemEntity,
        competitors: List[EcosystemEntity],
        influence_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze competitive position."""
        if not competitors:
            return {"status": "no_competitors_mapped"}

        our_influence = influence_analysis["influence_scores"].get(our_entity.entity_id, 0)

        competitor_comparison = []
        for competitor in competitors:
            comp_influence = influence_analysis["influence_scores"].get(competitor.entity_id, 0)

            competitor_comparison.append({
                "name": competitor.name,
                "their_influence": comp_influence,
                "our_advantage": our_influence - comp_influence,
                "market_share_comparison": our_entity.market_share - competitor.market_share
            })

        competitor_comparison.sort(key=lambda x: x["their_influence"], reverse=True)

        return {
            "competitor_count": len(competitors),
            "top_competitors": competitor_comparison[:5],
            "our_influence_vs_avg": our_influence - (
                sum(c.influence_score for c in competitors) / len(competitors)
            ),
            "competitive_strength": "strong" if our_influence > sum(c.influence_score for c in competitors) / len(competitors) else "weak"
        }

    def _identify_strategic_advantages(
        self,
        our_entity: EcosystemEntity,
        relationships: List[EcosystemRelationship],
        influence_analysis: Dict[str, Any]
    ) -> List[str]:
        """Identify strategic advantages."""
        advantages = []

        # High influence
        our_influence = influence_analysis["influence_scores"].get(our_entity.entity_id, 0)
        if our_influence >= self.high_influence_threshold:
            advantages.append("High ecosystem influence")

        # Strong partnerships
        strong_partnerships = [
            r for r in relationships
            if (r.from_entity == our_entity.entity_id or r.to_entity == our_entity.entity_id) and
               r.strength >= self.strong_relationship_threshold
        ]
        if len(strong_partnerships) >= 3:
            advantages.append("Multiple strong strategic partnerships")

        # Market position
        if our_entity.market_share > 0.15:
            advantages.append("Significant market share")

        # Network position
        if len(our_entity.connections) >= 5:
            advantages.append("Well-connected in ecosystem")

        return advantages if advantages else ["Building ecosystem presence"]

    def _identify_strategic_gaps(
        self,
        our_entity: EcosystemEntity,
        relationships: List[EcosystemRelationship],
        entities: Dict[str, EcosystemEntity]
    ) -> List[str]:
        """Identify strategic gaps."""
        gaps = []

        # Limited partnerships
        partnerships = [
            r for r in relationships
            if (r.from_entity == our_entity.entity_id or r.to_entity == our_entity.entity_id) and
               r.relationship_type == RelationshipType.PARTNERSHIP
        ]

        if len(partnerships) < 3:
            gaps.append("Limited strategic partnerships")

        # Missing key relationships
        platform_partners = [
            e for e in entities.values()
            if e.entity_type == EntityType.PLATFORM
        ]

        connected_platforms = [
            e.entity_id for e in platform_partners
            if e.entity_id in our_entity.connections
        ]

        if len(platform_partners) > 0 and len(connected_platforms) == 0:
            gaps.append("No platform partnerships")

        # Market coverage
        if our_entity.market_share < 0.05:
            gaps.append("Limited market presence")

        return gaps if gaps else ["No significant gaps identified"]

    def _identify_threats_opportunities(
        self,
        entities: Dict[str, EcosystemEntity],
        relationships: List[EcosystemRelationship],
        influence_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Identify threats and opportunities in the ecosystem."""
        threats = []
        opportunities = []

        our_entity_id = self.config.get("our_entity_id")

        # Identify emerging competitors
        emerging_competitors = [
            e for e in entities.values()
            if e.entity_type == EntityType.COMPETITOR and
               e.influence_score > 60 and
               e.entity_id != our_entity_id
        ]

        if emerging_competitors:
            threats.append({
                "type": "competitive",
                "severity": "high",
                "description": f"{len(emerging_competitors)} high-influence competitors present",
                "entities": [e.name for e in emerging_competitors[:3]]
            })

        # Identify partnership opportunities
        potential_partners = [
            e for e in entities.values()
            if e.entity_type in [EntityType.PARTNER, EntityType.COMPANY] and
               e.influence_score > 50 and
               our_entity_id not in e.connections and
               e.entity_id != our_entity_id
        ]

        if potential_partners:
            opportunities.append({
                "type": "partnership",
                "potential": "high",
                "description": f"{len(potential_partners)} high-value potential partners identified",
                "entities": [e.name for e in potential_partners[:5]]
            })

        # Identify dependency risks
        # (Already covered in dependency analysis)

        # Identify white space opportunities
        # Look for underserved clusters
        opportunities.append({
            "type": "market_expansion",
            "potential": "medium",
            "description": "Analyze underserved clusters for expansion"
        })

        return {
            "threats": threats,
            "opportunities": opportunities,
            "threat_level": "high" if len(threats) > 2 else "medium" if len(threats) > 0 else "low",
            "opportunity_score": len(opportunities) * 20
        }

    def _calculate_ecosystem_health(
        self,
        entities: Dict[str, EcosystemEntity],
        relationships: List[EcosystemRelationship],
        dependencies: Dict[str, Any]
    ) -> int:
        """Calculate overall ecosystem health score."""
        score = 0

        # Diversity (30 points)
        entity_types = set(e.entity_type for e in entities.values())
        diversity_score = min(len(entity_types) * 5, 30)
        score += diversity_score

        # Connectivity (30 points)
        avg_connections = sum(len(e.connections) for e in entities.values()) / len(entities)
        connectivity_score = min(int(avg_connections * 5), 30)
        score += connectivity_score

        # Balance (20 points)
        # Check if influence is too concentrated
        top_3_influence = sum(
            sorted([e.influence_score for e in entities.values()], reverse=True)[:3]
        )
        total_influence = sum(e.influence_score for e in entities.values())
        concentration = top_3_influence / total_influence if total_influence > 0 else 0

        balance_score = int((1 - concentration) * 20) if concentration < 1 else 0
        score += balance_score

        # Resilience (20 points)
        # Check for single points of failure
        spof_count = len(dependencies.get("single_points_of_failure", []))
        resilience_score = max(0, 20 - (spof_count * 5))
        score += resilience_score

        return min(score, 100)

    def _calculate_network_metrics(
        self, entities: Dict[str, EcosystemEntity], relationships: List[EcosystemRelationship]
    ) -> Dict[str, Any]:
        """Calculate network-level metrics."""
        total_entities = len(entities)
        total_relationships = len(relationships)

        # Network density
        max_possible_relationships = total_entities * (total_entities - 1)
        density = total_relationships / max_possible_relationships if max_possible_relationships > 0 else 0

        # Average degree
        total_connections = sum(len(e.connections) for e in entities.values())
        avg_degree = total_connections / total_entities if total_entities > 0 else 0

        # Relationship type distribution
        type_distribution = defaultdict(int)
        for rel in relationships:
            type_distribution[rel.relationship_type.value] += 1

        return {
            "total_entities": total_entities,
            "total_relationships": total_relationships,
            "network_density": round(density, 3),
            "average_degree": round(avg_degree, 2),
            "relationship_types": dict(type_distribution),
            "average_relationship_strength": round(
                sum(r.strength for r in relationships) / len(relationships), 2
            ) if relationships else 0
        }

    def _generate_visualization_data(
        self,
        entities: Dict[str, EcosystemEntity],
        relationships: List[EcosystemRelationship],
        clusters: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate data for ecosystem visualization."""
        # Nodes for visualization
        nodes = [
            {
                "id": entity.entity_id,
                "label": entity.name,
                "type": entity.entity_type.value,
                "influence": entity.influence_score,
                "size": entity.influence_score,  # Visual size based on influence
                "market_share": entity.market_share
            }
            for entity in entities.values()
        ]

        # Edges for visualization
        edges = [
            {
                "from": rel.from_entity,
                "to": rel.to_entity,
                "type": rel.relationship_type.value,
                "strength": rel.strength,
                "width": rel.strength * 5,  # Visual width based on strength
                "bidirectional": rel.bidirectional
            }
            for rel in relationships
        ]

        # Cluster groupings
        cluster_groups = [
            {
                "id": cluster["cluster_id"],
                "entities": [e["id"] for e in cluster["entities"]],
                "type": cluster["cluster_type"]
            }
            for cluster in clusters
        ]

        return {
            "nodes": nodes,
            "edges": edges,
            "clusters": cluster_groups,
            "layout_suggestion": "force_directed"
        }

    def _serialize_entities(self, entities: Dict[str, EcosystemEntity]) -> List[Dict[str, Any]]:
        """Serialize entities for output."""
        return [
            {
                "id": entity.entity_id,
                "name": entity.name,
                "type": entity.entity_type.value,
                "influence_score": entity.influence_score,
                "connections": len(entity.connections),
                "market_share": entity.market_share,
                "revenue": entity.revenue
            }
            for entity in entities.values()
        ]

    def _serialize_relationships(self, relationships: List[EcosystemRelationship]) -> List[Dict[str, Any]]:
        """Serialize relationships for output."""
        return [
            {
                "from": rel.from_entity,
                "to": rel.to_entity,
                "type": rel.relationship_type.value,
                "strength": rel.strength,
                "bidirectional": rel.bidirectional
            }
            for rel in relationships
        ]

    def _generate_ecosystem_recommendations(
        self, strategic_position: Dict[str, Any], threats_opportunities: Dict[str, Any]
    ) -> List[str]:
        """Generate strategic recommendations based on ecosystem analysis."""
        recommendations = []

        # Based on position
        if strategic_position.get("position_score", 0) < 50:
            recommendations.append("Strengthen ecosystem position through strategic partnerships")

        # Based on threats
        if threats_opportunities.get("threat_level") == "high":
            recommendations.append("Address competitive threats through differentiation or alliances")

        # Based on opportunities
        opportunities = threats_opportunities.get("opportunities", [])
        if len(opportunities) > 0:
            top_opp = opportunities[0]
            recommendations.append(f"Pursue {top_opp['type']} opportunities")

        # Based on gaps
        gaps = strategic_position.get("strategic_gaps", [])
        if "Limited strategic partnerships" in gaps:
            recommendations.append("Develop 2-3 strategic partnerships in next 6 months")

        return recommendations if recommendations else ["Maintain current ecosystem strategy"]

    def analyze_path(
        self, from_entity_id: str, to_entity_id: str
    ) -> Dict[str, Any]:
        """
        Analyze path between two entities in the ecosystem.

        Args:
            from_entity_id: Starting entity
            to_entity_id: Target entity

        Returns:
            Path analysis including shortest path, relationship strength, etc.
        """
        try:
            logger.info(f"Analyzing path from {from_entity_id} to {to_entity_id}")

            if not from_entity_id or not to_entity_id:
                raise ValueError("Both entity IDs are required")

            # Build adjacency list
            adjacency = defaultdict(list)
            for rel in self.relationships:
                adjacency[rel.from_entity].append((rel.to_entity, rel.strength))
                if rel.bidirectional:
                    adjacency[rel.to_entity].append((rel.from_entity, rel.strength))

            # Find shortest path using BFS
            path = self._find_shortest_path(from_entity_id, to_entity_id, adjacency)

            if not path:
                return {
                    "success": True,
                    "path_exists": False,
                    "message": "No path found between entities"
                }

            # Analyze path characteristics
            path_strength = self._calculate_path_strength(path)
            path_type = self._analyze_path_type(path)

            result = {
                "success": True,
                "path_exists": True,
                "path": path,
                "path_length": len(path) - 1,
                "path_strength": path_strength,
                "path_type": path_type,
                "intermediaries": path[1:-1] if len(path) > 2 else [],
                "recommendation": self._generate_path_recommendation(path, path_strength),
                "timestamp": datetime.utcnow().isoformat()
            }

            logger.info(f"Path analysis completed: {len(path) - 1} steps")
            return result

        except ValueError as e:
            logger.error(f"Validation error in analyze_path: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "validation_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error in analyze_path: {e}", exc_info=True)
            return {
                "success": False,
                "error": "An unexpected error occurred",
                "error_type": "internal_error"
            }

    def _find_shortest_path(
        self, start: str, end: str, adjacency: Dict[str, List[Tuple[str, float]]]
    ) -> List[str]:
        """Find shortest path between entities using BFS."""
        if start == end:
            return [start]

        visited = {start}
        queue = deque([(start, [start])])

        while queue:
            current, path = queue.popleft()

            for neighbor, _ in adjacency.get(current, []):
                if neighbor == end:
                    return path + [neighbor]

                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return []  # No path found

    def _calculate_path_strength(self, path: List[str]) -> float:
        """Calculate overall strength of path."""
        if len(path) < 2:
            return 0

        strengths = []
        for i in range(len(path) - 1):
            # Find relationship strength
            strength = next(
                (r.strength for r in self.relationships
                 if (r.from_entity == path[i] and r.to_entity == path[i + 1]) or
                    (r.bidirectional and r.from_entity == path[i + 1] and r.to_entity == path[i])),
                0
            )
            strengths.append(strength)

        # Overall strength is average of individual strengths
        return round(sum(strengths) / len(strengths), 2) if strengths else 0

    def _analyze_path_type(self, path: List[str]) -> str:
        """Analyze the type of path."""
        if len(path) == 2:
            return "direct"
        elif len(path) == 3:
            return "one_intermediary"
        elif len(path) <= 5:
            return "multi_hop"
        else:
            return "distant"

    def _generate_path_recommendation(self, path: List[str], strength: float) -> str:
        """Generate recommendation based on path analysis."""
        if len(path) == 2 and strength >= 0.7:
            return "Strong direct relationship - leverage for strategic initiatives"
        elif len(path) == 2:
            return "Direct relationship exists - consider strengthening"
        elif len(path) <= 4 and strength >= 0.5:
            return "Viable indirect path - consider using intermediary for introductions"
        else:
            return "Weak or distant connection - consider alternative approaches"
