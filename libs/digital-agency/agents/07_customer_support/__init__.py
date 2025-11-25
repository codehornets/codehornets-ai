"""
Customer Support Domain

Provides comprehensive support services including technical support,
help desk operations, bug tracking, documentation, training, and community management.
"""

from .technical_support import TechnicalSupportAgent
from .help_desk_agent import HelpDeskAgent
from .bug_tracker import BugTrackerAgent
from .documentation_specialist import DocumentationSpecialistAgent
from .user_training_coordinator import UserTrainingCoordinatorAgent
from .community_manager import CommunityManagerAgent

__all__ = [
    'TechnicalSupportAgent',
    'HelpDeskAgent',
    'BugTrackerAgent',
    'DocumentationSpecialistAgent',
    'UserTrainingCoordinatorAgent',
    'CommunityManagerAgent',
]
