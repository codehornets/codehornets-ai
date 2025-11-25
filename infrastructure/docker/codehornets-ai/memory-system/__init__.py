"""
Memory System for Multi-Agent AI

Provides episodic and semantic memory capabilities for autonomous agents
to learn and improve across sessions.
"""

from .episodic import EpisodicMemory
from .semantic import SemanticMemory
from .persistence import MemoryPersistence
from .orchestrator_memory import OrchestratorMemory
from .worker_memory import WorkerMemory, MarieMemory, AngaMemory, FabienMemory
from .shared_memory import SharedMemory
from .taskmaster_memory import TaskMasterMemory

__all__ = [
    'EpisodicMemory',
    'SemanticMemory',
    'MemoryPersistence',
    'OrchestratorMemory',
    'WorkerMemory',
    'MarieMemory',
    'AngaMemory',
    'FabienMemory',
    'SharedMemory',
    'TaskMasterMemory'
]

__version__ = '1.0.0'
