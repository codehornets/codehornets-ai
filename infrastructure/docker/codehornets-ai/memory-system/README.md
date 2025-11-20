# Memory System for Multi-Agent AI

A comprehensive memory implementation for autonomous agents that learn and improve across sessions through episodic and semantic memory.

## Overview

This memory system enables agents to:
- **Remember specific experiences** (episodic memory)
- **Learn patterns over time** (semantic memory)
- **Share knowledge across agents** (shared memory)
- **Improve with every interaction** (continuous learning)

## Architecture

```
memory-system/
├── episodic.py              # Stores specific experiences
├── semantic.py              # Generalizes patterns
├── persistence.py           # Save/load to disk
├── orchestrator_memory.py   # Orchestrator learning
├── worker_memory.py         # Worker specializations
├── shared_memory.py         # Cross-agent knowledge
└── taskmaster_memory.py     # Task Master integration
```

## Quick Start

### Basic Usage

```python
from memory_system import EpisodicMemory, SemanticMemory

# Create memory systems
episodic = EpisodicMemory(capacity=100)
semantic = SemanticMemory()

# Store an experience
episodic.store(
    state="User requested code review",
    action="Assigned to Anga",
    outcome="Success - found 3 issues"
)

# Record a pattern
semantic.record_pattern(
    context="code_review",
    action="assign_anga",
    success=True
)

# Later: Retrieve similar experiences
similar = episodic.retrieve_similar("Code review needed", k=3)

# Get best action for a context
best_action = semantic.get_best_action("code_review")
```

### Orchestrator Integration

```python
from memory_system import OrchestratorMemory

# Create orchestrator with persistent memory
orchestrator = OrchestratorMemory(
    memory_dir="/memories/orchestrator"
)

# Store delegation decision
orchestrator.store_delegation(
    user_request="Evaluate dance students",
    workers_assigned=["marie"],
    task_description="Student evaluation",
    success=True,
    execution_time=180.0,
    user_satisfaction=0.9
)

# Get recommendation for new task
recommendation = orchestrator.plan_delegation(
    user_request="Review student progress",
    available_workers=["marie", "anga", "fabien"]
)

# Save memory to disk
orchestrator.save()
```

### Worker Memory

```python
from memory_system import MarieMemory, AngaMemory, FabienMemory

# Marie remembers students
marie = MarieMemory(memory_dir="/memories/marie")
marie.remember_student(
    "Emma",
    {"technique": 8.5, "flexibility": 7.0}
)
recommendations = marie.recommend_exercises("Emma")

# Anga learns code patterns
anga = AngaMemory(memory_dir="/memories/anga")
anga.remember_code_issue(
    "auth.py",
    "sql_injection",
    "CRITICAL"
)
high_risk = anga.get_high_risk_areas()

# Fabien tracks campaign success
fabien = FabienMemory(memory_dir="/memories/fabien")
fabien.remember_campaign(
    "social_media",
    {"engagement_rate": 0.08},
    success=True
)
best_campaign = fabien.recommend_campaign_type()
```

### Shared Memory

```python
from memory_system import SharedMemory

shared = SharedMemory(memory_dir="/memories/shared")

# Store user preference (accessible by all agents)
shared.update_user_preference(
    "detail_level",
    0.9,
    source_agent="marie"
)

# Any agent can retrieve
detail_level = shared.get_user_preference("detail_level")

# Share learnings across agents
shared.share_learning(
    learning_type="communication",
    insight="User prefers bullet points",
    source_agent="anga",
    applicable_to=["marie", "fabien"]
)

# Get learnings for an agent
learnings = shared.get_applicable_learnings("marie")
```

## Core Components

### Episodic Memory

Stores specific experiences with full context:

```python
episodic = EpisodicMemory(capacity=100)

# Store episode
episodic.store(
    state="context description",
    action="action taken",
    outcome="result achieved",
    metadata={"task_id": "123", "success": True}
)

# Retrieve similar
similar = episodic.retrieve_similar("query", k=5)

# Search by metadata
results = episodic.search_by_metadata(task_id="123")

# Get recent episodes
recent = episodic.get_recent(n=10)
```

**Features:**
- Fixed capacity (FIFO when full)
- Similarity-based retrieval
- Metadata filtering
- Timestamp tracking

### Semantic Memory

Learns patterns and preferences:

```python
semantic = SemanticMemory()

# Record pattern
semantic.record_pattern(
    context="task_type",
    action="approach_used",
    success=True
)

# Update preference
semantic.update_preference(
    "user_detail_level",
    0.9,
    weight=1.0
)

# Get best action
best = semantic.get_best_action("task_type")

# Get statistics
stats = semantic.get_action_statistics("task_type")
```

**Features:**
- Pattern recognition
- Success rate tracking
- Exponential moving averages
- Preference learning

### Persistence

Save and load memories:

```python
from memory_system import MemoryPersistence

# Save episodic memory
MemoryPersistence.save_episodic(
    episodic,
    "/path/to/episodic.json",
    format='json'
)

# Load episodic memory
episodic = MemoryPersistence.load_episodic(
    "/path/to/episodic.json",
    format='json'
)

# Save both memories
MemoryPersistence.save_all(
    episodic,
    semantic,
    "/path/to/directory",
    format='json'
)

# Load both
episodic, semantic = MemoryPersistence.load_all(
    "/path/to/directory",
    format='json'
)
```

**Formats:**
- `json`: Human-readable, version control friendly
- `pickle`: Faster, more compact (not recommended)

## Advanced Usage

### Custom Memory Integration

```python
class CustomAgentMemory:
    def __init__(self, memory_dir):
        self.episodic = EpisodicMemory(capacity=50)
        self.semantic = SemanticMemory()
        self.memory_dir = memory_dir
        self.load()

    def store_experience(self, context, action, result, success):
        """Store and learn from experience."""
        # Store episode
        self.episodic.store(
            state=context,
            action=action,
            outcome=result,
            metadata={'success': success}
        )

        # Record pattern
        category = self._categorize(context)
        self.semantic.record_pattern(category, action, success)

    def recommend_action(self, context):
        """Recommend action based on memory."""
        category = self._categorize(context)

        # Get best action from patterns
        best_action = self.semantic.get_best_action(category)

        # Get similar past cases
        similar = self.episodic.retrieve_similar(context, k=3)

        return {
            'action': best_action,
            'similar_cases': similar,
            'confidence': self._calculate_confidence(category)
        }

    def save(self):
        """Save to disk."""
        MemoryPersistence.save_all(
            self.episodic,
            self.semantic,
            self.memory_dir
        )

    def load(self):
        """Load from disk."""
        try:
            self.episodic, self.semantic = MemoryPersistence.load_all(
                self.memory_dir
            )
        except:
            pass  # Start with empty memory
```

### Learning from Episodes

```python
# Batch learning from historical data
episodes = [
    {"state": "review needed", "action": "assign_anga", "success": True},
    {"state": "review needed", "action": "assign_anga", "success": True},
    {"state": "review needed", "action": "assign_marie", "success": False},
]

semantic.learn_from_episodes(
    episodes,
    context_extractor=lambda ep: "code_review",
    success_evaluator=lambda ep: ep['success']
)

# Now semantic memory knows: code_review → assign_anga works best
```

## Testing

Run the comprehensive demo:

```bash
cd examples/memory-demo
python demo.py
```

This demonstrates:
- Orchestrator learning delegation patterns
- Marie remembering students across sessions
- Anga identifying high-risk code areas
- Fabien optimizing campaign selection
- Shared memory enabling cross-agent learning
- Task Master integration for approach recommendations

## Integration with Multi-Agent System

### Directory Structure

```
project/
└── core/
    ├── memory-system/          # This directory
    └── shared/
        └── memories/            # Persistent storage
            ├── orchestrator/
            │   ├── episodic.json
            │   └── semantic.json
            ├── marie/
            ├── anga/
            ├── fabien/
            ├── shared/
            │   ├── project_context.json
            │   ├── user_preferences.json
            │   └── agent_insights.json
            └── taskmaster/
```

### Agent Startup

```python
# Load memory on agent startup
memory = OrchestratorMemory(memory_dir="/memories/orchestrator")

# Work happens...

# Save memory on shutdown
memory.save()
```

### Docker Integration

Mount memory directories in `docker-compose.yml`:

```yaml
services:
  orchestrator:
    volumes:
      - ./shared/memories/orchestrator:/memories/orchestrator:rw

  marie:
    volumes:
      - ./shared/memories/marie:/memories/marie:rw
      - ./shared/memories/shared:/memories/shared:ro  # Read-only access
```

## Performance

### Memory Overhead

- **Episodic (100 episodes)**: ~100KB
- **Semantic (1000 patterns)**: ~200KB
- **Total per agent**: ~300KB (negligible)

### Computation

- Memory retrieval: <10ms (hash-based similarity)
- Pattern lookup: <1ms (dictionary access)
- Persistence: ~100ms (JSON serialization)

### Scalability

- Capacity can be increased as needed
- Old episodes automatically removed (FIFO)
- Semantic patterns compress naturally
- No performance degradation over time

## Best Practices

### 1. Capacity Planning

```python
# Choose capacity based on use case
high_volume = EpisodicMemory(capacity=500)  # Busy agents
normal_use = EpisodicMemory(capacity=100)    # Standard
specialized = EpisodicMemory(capacity=50)    # Focused tasks
```

### 2. Regular Persistence

```python
# Save periodically
def reflect_and_save(memory):
    memory.save()  # After each significant interaction

# Or save on shutdown
import atexit
atexit.register(memory.save)
```

### 3. Metadata Usage

```python
# Rich metadata enables better filtering
episodic.store(
    state=context,
    action=action,
    outcome=result,
    metadata={
        'worker': 'marie',
        'task_type': 'evaluation',
        'user_id': 'user123',
        'session_id': 'session456',
        'success': True,
        'execution_time': 180.0
    }
)

# Later: Filter precisely
marie_tasks = episodic.search_by_metadata(worker='marie')
successful = episodic.search_by_metadata(success=True)
```

### 4. Confidence Thresholds

```python
recommendation = orchestrator.plan_delegation(request, workers)

if recommendation['confidence'] > 0.7:
    # High confidence - use learned approach
    use_recommendation(recommendation)
else:
    # Low confidence - use best judgment
    # But still store the outcome for learning
    use_fallback_and_learn()
```

## Limitations

### Current Limitations

1. **Similarity Matching**: Uses simple hash-based embedding
   - Can be upgraded to vector embeddings (OpenAI, Sentence Transformers)

2. **No Automatic Forgetting**: All episodes retained until capacity
   - Could implement importance-based retention

3. **Single-Process**: Not designed for concurrent access
   - Add file locking for multi-process scenarios

### Future Enhancements

- Vector embeddings for better similarity
- Importance-weighted episode retention
- Automatic pattern pruning
- Multi-process safe persistence
- Memory compression for long-term storage

## Troubleshooting

### Memory Not Persisting

```python
# Check directory exists
memory_dir = "/memories/orchestrator"
Path(memory_dir).mkdir(parents=True, exist_ok=True)

# Verify permissions
os.access(memory_dir, os.W_OK)  # Should return True

# Explicit save
memory.save()
```

### Memory Not Loading

```python
# Check file exists
episodic_path = f"{memory_dir}/episodic.json"
os.path.exists(episodic_path)  # Should return True

# Check file is valid JSON
with open(episodic_path) as f:
    json.load(f)  # Should not raise error
```

### Low Confidence Scores

```python
# Confidence increases with data
# If confidence is low, add more episodes

# Check data volume
stats = semantic.get_action_statistics(context)
total_samples = sum(s['total'] for s in stats.values())

# Need 10-20 samples for meaningful patterns
if total_samples < 10:
    print("Insufficient data, keep learning!")
```

## API Reference

See individual module docstrings for complete API documentation:

- `EpisodicMemory`: Specific experience storage
- `SemanticMemory`: Pattern learning
- `MemoryPersistence`: Save/load operations
- `OrchestratorMemory`: Delegation learning
- `MarieMemory`, `AngaMemory`, `FabienMemory`: Domain-specific memory
- `SharedMemory`: Cross-agent knowledge
- `TaskMasterMemory`: Task approach learning

## Contributing

This memory system is extensible. To add new memory types:

1. Inherit from `WorkerMemory` or create custom
2. Implement domain-specific methods
3. Use episodic/semantic as building blocks
4. Add persistence via `MemoryPersistence`

Example:

```python
class NewWorkerMemory(WorkerMemory):
    def __init__(self, memory_dir=None):
        super().__init__('new_worker', memory_dir=memory_dir)

    def custom_learning_method(self, data):
        # Domain-specific logic
        self.episodic.store(...)
        self.semantic.record_pattern(...)
```

## License

See project LICENSE file.

## Version

1.0.0 - Initial Release

---

**Built with ❤️ for autonomous multi-agent systems**
