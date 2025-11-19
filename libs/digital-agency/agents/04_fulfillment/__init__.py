"""
Fulfillment Domain - Multi-Agent System for Project Delivery

This domain orchestrates project delivery from initiation through final handoff,
ensuring high-quality execution and client satisfaction.
"""

from .project_manager.agent import ProjectManagerAgent
from .account_manager.agent import AccountManagerAgent
from .creative_producer.agent import CreativeProducerAgent
from .quality_checker.agent import QualityCheckerAgent
from .client_reporter.agent import ClientReporterAgent
from .delivery_coordinator.agent import DeliveryCoordinatorAgent

__all__ = [
    "ProjectManagerAgent",
    "AccountManagerAgent",
    "CreativeProducerAgent",
    "QualityCheckerAgent",
    "ClientReporterAgent",
    "DeliveryCoordinatorAgent",
]

__version__ = "0.1.0"
__domain__ = "fulfillment"
