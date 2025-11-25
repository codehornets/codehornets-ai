# Agent Memories Directory

This directory stores persistent memory data for the multi-agent system.

## Structure

```
memories/
├── orchestrator/      # Orchestrator's delegation patterns
│   ├── episodic.json  # Specific delegation decisions
│   └── semantic.json  # Learned worker selection patterns
│
├── marie/             # Marie's dance teaching memories
│   ├── episodic.json  # Student evaluations and sessions
│   └── semantic.json  # Student progress patterns
│
├── anga/              # Anga's code review memories
│   ├── episodic.json  # Code issues found
│   └── semantic.json  # Code pattern learnings
│
├── fabien/            # Fabien's marketing memories
│   ├── episodic.json  # Campaign executions
│   └── semantic.json  # Campaign success patterns
│
├── shared/            # Cross-agent shared knowledge
│   ├── project_context.json    # Project history
│   ├── user_preferences.json   # User preferences
│   └── agent_insights.json     # Shared learnings
│
└── taskmaster/        # Task Master AI learnings
    ├── episodic.json  # Task execution history
    └── semantic.json  # Approach success patterns
```

## Format

All memory files are stored in JSON format for:
- Human readability
- Easy debugging
- Version control friendly
- Cross-platform compatibility

## Persistence

- Memories are automatically saved after each session
- Loaded on agent startup
- Incrementally updated as agents learn
- Can be manually inspected or edited if needed

## Privacy

- No sensitive user data stored
- Only patterns and preferences
- Can be cleared anytime by deleting JSON files
