# Agent Introduction Feature

## Overview

The multi-agent orchestration system now includes automatic agent introductions at the start of each workflow. When a workflow is executed, each agent involved will introduce themselves before performing their tasks.

## How It Works

### 1. Agent Introduction Tool

Each agent has an `introduce` tool that displays a professional banner and introduction message:

**Marie's Introduction:**
```
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Bonjour! I'm Marie, your dance teaching assistant.

I specialize in:
  🩰 Student management and progress tracking
  📝 Class documentation and choreography notes
  ⭐ Professional student evaluations (APEXX format)
  💃 Hip-Hop, Contemporary, and Ballet instruction

I work in French and English to support sport-études dance programs.

Ready to help you manage your dance studio!
```

### 2. Automatic Execution

The orchestrator automatically:
1. Analyzes the workflow to identify which agents are involved
2. Executes the `introduce` tool for each agent before running workflow tasks
3. Displays the introduction banners in the console logs
4. Proceeds with the actual workflow tasks

### 3. Workflow Execution Flow

```
🎯 Starting workflow
  └─ 👋 Introducing agents
      └─ Agent 1 introduction
      └─ Agent 2 introduction (if multi-agent workflow)
  └─ 📊 Workflow analysis
  └─ ⚡ Execute tasks
  └─ 🎉 Workflow completed
```

## Example Execution

### Running a Marie Workflow

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d @orchestration/workflows/marie-review-and-note-students.json
```

### Console Output

```
🎯 Starting workflow: Marie Student Evaluation Workflow
📝 Professional Hip-Hop dance evaluations in French following Marie's APEXX format

👋 Introducing agents:

🔧 Executing task intro-marie on Marie...
✅ Task intro-marie completed

═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Bonjour! I'm Marie, your dance teaching assistant.

I specialize in:
  🩰 Student management and progress tracking
  📝 Class documentation and choreography notes
  ⭐ Professional student evaluations (APEXX format)
  💃 Hip-Hop, Contemporary, and Ballet instruction

I work in French and English to support sport-études dance programs.

Ready to help you manage your dance studio!

📊 Workflow analysis:
   - Parallel tasks: 2
   - Sequential tasks: 0

⚡ Executing 2 tasks in parallel...
🔧 Executing task evaluate-emma on Marie...
🔧 Executing task evaluate-sophia on Marie...
✅ Task evaluate-sophia completed
✅ Task evaluate-emma completed
✅ Parallel tasks completed

🎉 Workflow "Marie Student Evaluation Workflow" completed successfully!
```

## Implementation Details

### Agent Server (marie/server.ts)

```typescript
// Introduction tool definition
{
  name: 'marie_introduce',
  description: 'Display Marie\'s introduction banner and greeting',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}

// Introduction handler
async function handleIntroduce() {
  const banner = `
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════
...
`;
  return banner;
}
```

### Orchestrator (orchestrator/index.ts)

```typescript
async executeWorkflow(workflow: Workflow): Promise<any> {
  // Identify unique agents used in this workflow
  const agentsUsed = new Set(workflow.tasks.map(task => task.agent));

  // Display agent introductions
  console.log('👋 Introducing agents:\n');
  for (const agentName of agentsUsed) {
    const agent = AGENTS[agentName];
    if (agent && agent.capabilities.includes('introduce')) {
      const introTask: Task = {
        id: `intro-${agentName}`,
        agent: agentName,
        action: `${agentName}_introduce`,
        params: {}
      };
      const introResult = await this.executeTask(introTask);
      // Display introduction...
    }
  }

  // Continue with workflow tasks...
}
```

### Agent Capabilities

Each agent's capability list includes 'introduce' as the first capability:

```typescript
marie: {
  capabilities: [
    'introduce',           // ← First capability
    'create_student_profile',
    'document_class',
    'add_progress_note',
    'create_choreography',
    'get_student_info',
    'list_students',
    'create_student_evaluation'
  ]
}
```

## Benefits

1. **Professional Experience**: Users immediately know which agents are working on their tasks
2. **Clear Context**: Each agent explains their specialization and capabilities
3. **Brand Identity**: Consistent presentation with emojis and formatting
4. **Bilingual Support**: Marie introduces herself in both French and English
5. **Automatic**: No manual configuration needed - works for all workflows

## Future Enhancements

Potential improvements:
- Custom introduction messages per workflow type
- Introduction caching for multi-workflow sessions
- Agent version information in introductions
- Capability highlighting based on workflow tasks
- Multi-language support for all agents

## Testing

To test the introduction feature:

```bash
# 1. Rebuild orchestration
make rebuild-orchestration

# 2. Run any workflow
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d @orchestration/workflows/marie-review-and-note-students.json

# 3. View logs to see introduction
make logs-orchestrator | grep -A 20 "Introducing agents"
```

## Related Files

- `orchestration/marie/server.ts` - Marie's MCP server with introduction tool
- `orchestration/orchestrator/index.ts` - Orchestrator with introduction logic
- `orchestration/workflows/*.json` - Workflow definitions
- `domains/dance/marie/templates/DANCE.md` - Marie's identity and guidelines
