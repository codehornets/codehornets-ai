"""
Sales Domain - Multi-Agent System for Sales Process Management

This domain orchestrates the entire sales lifecycle from lead qualification
through deal closure, ensuring systematic conversion of prospects to clients.
"""

from .lead_qualifier.agent import LeadQualifierAgent
from .discovery_specialist.agent import DiscoverySpecialistAgent
from .demo_presenter.agent import DemoPresenterAgent
from .objection_handler.agent import ObjectionHandlerAgent
from .negotiator.agent import NegotiatorAgent
from .deal_closer.agent import DealCloserAgent

__all__ = [
    "LeadQualifierAgent",
    "DiscoverySpecialistAgent",
    "DemoPresenterAgent",
    "ObjectionHandlerAgent",
    "NegotiatorAgent",
    "DealCloserAgent",
]

__version__ = "0.1.0"
__domain__ = "sales"
