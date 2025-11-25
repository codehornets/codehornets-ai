"""
Agent discovery service to scan and catalog available agents.
"""

import os
import yaml
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class AgentMetadata:
    """Agent metadata from config.yaml"""
    domain: str
    agent_name: str
    name: str
    version: str
    description: str
    capabilities: List[str] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)
    integrations: List[str] = field(default_factory=list)
    agent_path: str = ""
    config_path: str = ""


class AgentDiscovery:
    """
    Discovers and catalogs all available agents from the agents directory.

    Scans the /agents directory structure:
    /agents/
      ├── 01_offer/
      │   ├── proposal_writer/
      │   │   ├── agent.py
      │   │   └── config.yaml
      │   └── ...
      ├── 02_marketing/
      └── ...
    """

    def __init__(self, agents_base_path: Optional[str] = None):
        """
        Initialize agent discovery service.

        Args:
            agents_base_path: Base path to agents directory. Defaults to ../agents
        """
        if agents_base_path is None:
            # Default to ../agents relative to this file
            api_dir = Path(__file__).parent.parent.parent
            agents_base_path = api_dir / "agents"

        self.agents_base_path = Path(agents_base_path)
        self.agents_catalog: Dict[str, Dict[str, AgentMetadata]] = {}
        self._initialized = False

        logger.info(f"AgentDiscovery initialized with base path: {self.agents_base_path}")

    def discover_agents(self, force_refresh: bool = False) -> Dict[str, Dict[str, AgentMetadata]]:
        """
        Discover all available agents by scanning the agents directory.

        Args:
            force_refresh: Force re-discovery even if already initialized

        Returns:
            Dictionary of domain -> {agent_name -> AgentMetadata}
        """
        if self._initialized and not force_refresh:
            return self.agents_catalog

        logger.info("Starting agent discovery...")
        self.agents_catalog.clear()

        if not self.agents_base_path.exists():
            logger.error(f"Agents base path does not exist: {self.agents_base_path}")
            return self.agents_catalog

        # Scan all domain directories
        for domain_dir in self.agents_base_path.iterdir():
            if not domain_dir.is_dir() or domain_dir.name.startswith('.'):
                continue

            domain_name = self._extract_domain_name(domain_dir.name)
            logger.debug(f"Scanning domain: {domain_name} ({domain_dir.name})")

            # Scan all agent directories within domain
            for agent_dir in domain_dir.iterdir():
                if not agent_dir.is_dir() or agent_dir.name.startswith('.'):
                    continue

                agent_name = agent_dir.name

                # Check if agent.py exists
                agent_file = agent_dir / "agent.py"
                config_file = agent_dir / "config.yaml"

                if not agent_file.exists():
                    logger.debug(f"Skipping {agent_name}: no agent.py found")
                    continue

                try:
                    metadata = self._load_agent_metadata(
                        domain_name,
                        agent_name,
                        str(agent_file),
                        str(config_file) if config_file.exists() else None
                    )

                    if domain_name not in self.agents_catalog:
                        self.agents_catalog[domain_name] = {}

                    self.agents_catalog[domain_name][agent_name] = metadata
                    logger.info(f"Discovered agent: {domain_name}/{agent_name}")

                except Exception as e:
                    logger.error(f"Error loading agent {domain_name}/{agent_name}: {e}")

        self._initialized = True
        total_agents = sum(len(agents) for agents in self.agents_catalog.values())
        logger.info(f"Discovery complete. Found {total_agents} agents across {len(self.agents_catalog)} domains")

        return self.agents_catalog

    def get_agent_metadata(self, domain: str, agent_name: str) -> Optional[AgentMetadata]:
        """
        Get metadata for a specific agent.

        Args:
            domain: Domain name (e.g., 'offer', 'marketing')
            agent_name: Agent name (e.g., 'proposal_writer')

        Returns:
            AgentMetadata if found, None otherwise
        """
        if not self._initialized:
            self.discover_agents()

        return self.agents_catalog.get(domain, {}).get(agent_name)

    def list_domains(self) -> List[str]:
        """
        List all available domains.

        Returns:
            List of domain names
        """
        if not self._initialized:
            self.discover_agents()

        return sorted(self.agents_catalog.keys())

    def list_agents_in_domain(self, domain: str) -> List[AgentMetadata]:
        """
        List all agents in a specific domain.

        Args:
            domain: Domain name

        Returns:
            List of AgentMetadata for agents in the domain
        """
        if not self._initialized:
            self.discover_agents()

        agents = self.agents_catalog.get(domain, {})
        return sorted(agents.values(), key=lambda x: x.agent_name)

    def list_all_agents(self) -> List[AgentMetadata]:
        """
        List all available agents across all domains.

        Returns:
            List of all AgentMetadata
        """
        if not self._initialized:
            self.discover_agents()

        all_agents = []
        for domain_agents in self.agents_catalog.values():
            all_agents.extend(domain_agents.values())

        return sorted(all_agents, key=lambda x: (x.domain, x.agent_name))

    def search_agents(
        self,
        capability: Optional[str] = None,
        domain: Optional[str] = None,
        name_contains: Optional[str] = None
    ) -> List[AgentMetadata]:
        """
        Search for agents matching criteria.

        Args:
            capability: Filter by capability
            domain: Filter by domain
            name_contains: Filter by name substring

        Returns:
            List of matching AgentMetadata
        """
        if not self._initialized:
            self.discover_agents()

        results = []

        for domain_name, agents in self.agents_catalog.items():
            # Domain filter
            if domain and domain_name != domain:
                continue

            for agent_metadata in agents.values():
                # Capability filter
                if capability and capability not in agent_metadata.capabilities:
                    continue

                # Name filter
                if name_contains and name_contains.lower() not in agent_metadata.agent_name.lower():
                    continue

                results.append(agent_metadata)

        return sorted(results, key=lambda x: (x.domain, x.agent_name))

    def _extract_domain_name(self, dir_name: str) -> str:
        """
        Extract domain name from directory name.
        Removes number prefixes like '01_' from '01_offer'

        Args:
            dir_name: Directory name

        Returns:
            Clean domain name
        """
        # Remove number prefix (e.g., '01_offer' -> 'offer')
        parts = dir_name.split('_', 1)
        if len(parts) > 1 and parts[0].isdigit():
            return parts[1]
        return dir_name

    def _load_agent_metadata(
        self,
        domain: str,
        agent_name: str,
        agent_path: str,
        config_path: Optional[str]
    ) -> AgentMetadata:
        """
        Load agent metadata from config.yaml if available.

        Args:
            domain: Domain name
            agent_name: Agent name
            agent_path: Path to agent.py
            config_path: Path to config.yaml (optional)

        Returns:
            AgentMetadata
        """
        # Default metadata
        metadata = AgentMetadata(
            domain=domain,
            agent_name=agent_name,
            name=agent_name.replace('_', ' ').title(),
            version="0.1.0",
            description=f"{agent_name} agent in {domain} domain",
            agent_path=agent_path,
            config_path=config_path or ""
        )

        # Load from config.yaml if exists
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)

                if config:
                    # Parse agent section
                    agent_config = config.get('agent', {})
                    if agent_config:
                        metadata.name = agent_config.get('name', metadata.name)
                        metadata.version = agent_config.get('version', metadata.version)
                        metadata.description = agent_config.get('description', metadata.description)

                    # Parse capabilities
                    metadata.capabilities = config.get('capabilities', [])

                    # Parse parameters
                    metadata.parameters = config.get('parameters', {})

                    # Parse integrations
                    metadata.integrations = config.get('integrations', [])

            except Exception as e:
                logger.warning(f"Failed to parse config for {domain}/{agent_name}: {e}")

        return metadata
