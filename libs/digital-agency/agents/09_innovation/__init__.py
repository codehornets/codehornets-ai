"""
Innovation Domain - Research, Testing, and Innovation Agents

This package contains agents responsible for new service testing, tool evaluation,
market experimentation, process innovation, competitive research, and pilot program management.
"""

from .new_service_tester.agent import NewServiceTesterAgent
from .tool_evaluator.agent import ToolEvaluatorAgent
from .market_experimenter.agent import MarketExperimenterAgent
from .process_innovator.agent import ProcessInnovatorAgent
from .competitive_researcher.agent import CompetitiveResearcherAgent
from .pilot_program_manager.agent import PilotProgramManagerAgent

__all__ = [
    "NewServiceTesterAgent",
    "ToolEvaluatorAgent",
    "MarketExperimenterAgent",
    "ProcessInnovatorAgent",
    "CompetitiveResearcherAgent",
    "PilotProgramManagerAgent",
]

__version__ = "0.1.0"
