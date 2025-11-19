"""
Offer Domain - Service Offering and Pricing Agents

This package contains agents responsible for market research, service design,
pricing strategy, proposal writing, competitor analysis, and value proposition creation.
"""

from .market_researcher.agent import MarketResearcherAgent
from .service_designer.agent import ServiceDesignerAgent
from .pricing_strategist.agent import PricingStrategistAgent
from .proposal_writer.agent import ProposalWriterAgent
from .competitor_analyst.agent import CompetitorAnalystAgent
from .value_proposition_creator.agent import ValuePropositionCreatorAgent

__all__ = [
    "MarketResearcherAgent",
    "ServiceDesignerAgent",
    "PricingStrategistAgent",
    "ProposalWriterAgent",
    "CompetitorAnalystAgent",
    "ValuePropositionCreatorAgent",
]

__version__ = "0.1.0"
