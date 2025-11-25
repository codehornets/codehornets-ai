# 🌉 Bridging domains/ and orchestration/ Systems

Complete guide to connecting the interactive domain system with the programmatic orchestration system.

## 📊 Current State

### What's Already Shared

✅ **Same Workspace**
- Both systems use `workspaces/dance/studio/`
- Files created by either system are accessible to both
- Data is naturally synchronized through file system

✅ **Similar Templates**
- `domains/dance/marie/templates/DANCE.md` (domain mode)
- `orchestration/marie/DANCE.md` (orchestration mode)
- Both define Marie's personality and behavior

---

## 🌉 Bridge Options

### 1. **Shared Workspace Bridge** (Already Working ✅)

**How it works:**
- Both systems read/write to the same workspace directory
- Files created in domain mode are visible to orchestration
- Files created via API are visible in domain mode

**Example:**
```bash
# Domain mode creates student
make marie
# Chat: "Create profile for Emma"
# → Creates workspaces/dance/studio/students/emma-rodriguez/

# Orchestration mode reads it
curl -X POST http://localhost:8000/execute \
  -d '{"tasks": [{"agent": "marie", "action": "marie_get_student_info", "params": {"student_name": "emma-rodriguez"}}]}'
# → Reads the same file!
```

**Pros:**
- ✅ Zero configuration needed
- ✅ Automatic synchronization
- ✅ No additional code

**Cons:**
- ⚠️ No real-time notifications
- ⚠️ No conflict resolution
- ⚠️ File system only

---

### 2. **CLI Wrapper Bridge** (Easy to Implement)

**How it works:**
- Create a CLI command that calls the orchestrator API
- Use from domain mode or terminal

**Implementation:**

```bash
# domains/dance/marie/launchers/marie-orchestrate.sh
#!/bin/bash

ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:8000}"

# Check if orchestrator is running
if ! curl -s "$ORCHESTRATOR_URL/health" > /dev/null; then
    echo "❌ Orchestrator not running at $ORCHESTRATOR_URL"
    echo "Start it with: cd orchestration && make start"
    exit 1
fi

# Execute workflow
WORKFLOW_FILE="$1"
if [ -z "$WORKFLOW_FILE" ]; then
    echo "Usage: marie-orchestrate <workflow.json>"
    exit 1
fi

curl -X POST "$ORCHESTRATOR_URL/execute" \
  -H "Content-Type: application/json" \
  -d "@$WORKFLOW_FILE" | jq
```

**Usage:**
```bash
# From domain workspace
cd workspaces/dance/studio
../../../domains/dance/marie/launchers/marie-orchestrate.sh \
  ../../../orchestration/workflows/marie-new-student.json
```

**Pros:**
- ✅ Simple to implement
- ✅ Can be called from anywhere
- ✅ Reuses existing workflows

**Cons:**
- ⚠️ Requires orchestrator to be running
- ⚠️ One-way (domain → orchestration)

---

### 3. **Hybrid Launcher Bridge** (Best User Experience)

**How it works:**
- Enhanced launcher that can do both interactive and programmatic
- Detects mode based on arguments

**Implementation:**

```bash
# domains/dance/marie/launchers/marie-hybrid.sh
#!/bin/bash

ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:8000}"

# Check if first argument is a workflow file
if [ -f "$1" ] && [[ "$1" == *.json ]]; then
    # Orchestration mode
    echo "🔄 Executing workflow: $1"
    
    if ! curl -s "$ORCHESTRATOR_URL/health" > /dev/null; then
        echo "❌ Orchestrator not running. Starting in interactive mode instead..."
        # Fall back to interactive
        exec "$(dirname "$0")/marie.sh" "${@:2}"
    fi
    
    curl -X POST "$ORCHESTRATOR_URL/execute" \
      -H "Content-Type: application/json" \
      -d "@$1" | jq
    
    exit $?
else
    # Interactive mode (default)
    exec "$(dirname "$0")/marie.sh" "$@"
fi
```

**Usage:**
```bash
# Interactive mode (default)
make marie
# or
./marie-hybrid.sh

# Orchestration mode
./marie-hybrid.sh ../../orchestration/workflows/marie-new-student.json
```

**Pros:**
- ✅ Single command for both modes
- ✅ Automatic fallback
- ✅ Best user experience

**Cons:**
- ⚠️ Slightly more complex launcher

---

### 4. **Domain Tools as Orchestrator Tools** (Unified API)

**How it works:**
- Expose domain launcher commands as orchestrator tools
- Orchestrator can trigger domain mode operations

**Implementation:**

```typescript
// orchestration/marie/server.ts - Add new tool

{
  name: 'marie_interactive_session',
  description: 'Start an interactive Marie session for a specific task',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'What to ask Marie' },
      workspace_path: { type: 'string', description: 'Workspace path' }
    },
    required: ['prompt']
  }
}

async function handleInteractiveSession(args: any) {
  const { spawn } = require('child_process');
  const workspace = args.workspace_path || WORKSPACE;
  
  // Spawn Claude Code with Marie's template
  const claude = spawn('claude', ['-p', args.prompt], {
    cwd: workspace,
    env: {
      ...process.env,
      CLAUDE_MD_PATH: path.join(__dirname, '../../domains/dance/marie/templates/DANCE.md')
    }
  });
  
  let output = '';
  claude.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  return new Promise((resolve) => {
    claude.on('close', () => {
      resolve({ success: true, output });
    });
  });
}
```

**Usage:**
```json
{
  "tasks": [{
    "agent": "marie",
    "action": "marie_interactive_session",
    "params": {
      "prompt": "Create a profile for Emma Rodriguez, age 14, ballet student"
    }
  }]
}
```

**Pros:**
- ✅ Unified API
- ✅ Can leverage domain mode's natural language
- ✅ Best of both worlds

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Requires Claude Code CLI to be available

---

### 5. **File Watcher Bridge** (Real-time Sync)

**How it works:**
- Watch workspace files for changes
- Trigger orchestrator workflows on file events
- Or notify domain mode of API changes

**Implementation:**

```typescript
// orchestration/bridges/file-watcher.ts
import chokidar from 'chokidar';
import { exec } from 'child_process';

const watcher = chokidar.watch('workspaces/dance/studio/**/*.md', {
  ignored: /CLAUDE\.md/,
  persistent: true
});

watcher.on('add', (path) => {
  console.log(`📄 New file: ${path}`);
  
  // Trigger workflow if student profile created
  if (path.includes('/students/') && path.endsWith('/profile.md')) {
    const studentName = path.split('/students/')[1].split('/')[0];
    
    // Notify orchestrator
    fetch('http://localhost:8000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'student_profile_created',
        data: { student_name: studentName, path }
      })
    });
  }
});

watcher.on('change', (path) => {
  console.log(`📝 File changed: ${path}`);
  // Similar event handling
});
```

**Usage:**
```bash
# Start file watcher
cd orchestration
npm run watch

# Now any file changes trigger events
# Domain mode creates file → Orchestrator receives event
# Orchestrator creates file → Domain mode can react
```

**Pros:**
- ✅ Real-time synchronization
- ✅ Event-driven architecture
- ✅ Can trigger workflows automatically

**Cons:**
- ⚠️ Requires additional service
- ⚠️ More complex setup
- ⚠️ Potential performance impact

---

### 6. **Shared Template System** (Single Source of Truth)

**How it works:**
- Use one DANCE.md template for both systems
- Domain launcher and orchestrator both reference the same file

**Implementation:**

```bash
# domains/dance/marie/launchers/marie.sh - Modified
#!/bin/bash

# Use orchestration template if available, otherwise domain template
if [ -f "../../../orchestration/marie/DANCE.md" ]; then
    TEMPLATE="../../../orchestration/marie/DANCE.md"
elif [ -f "$SEARCH_DIR/domains/dance/marie/templates/DANCE.md" ]; then
    TEMPLATE="$SEARCH_DIR/domains/dance/marie/templates/DANCE.md"
fi

cp "$TEMPLATE" ./CLAUDE.md
```

```typescript
// orchestration/marie/server.ts - Already does this!
const DANCE_MD_PATH = path.join(__dirname, 'DANCE.md');
// Could also reference: path.join(__dirname, '../../domains/dance/marie/templates/DANCE.md')
```

**Pros:**
- ✅ Single source of truth
- ✅ Consistent behavior
- ✅ Easier maintenance

**Cons:**
- ⚠️ Requires careful path management
- ⚠️ May need symlinks or shared location

---

### 7. **MCP Client in Domain Mode** (Domain Can Call Orchestrator)

**How it works:**
- Add MCP client capability to domain launcher
- Domain mode can call orchestrator tools directly

**Implementation:**

```bash
# domains/dance/marie/launchers/marie-with-orchestrator.sh
#!/bin/bash

# Check if orchestrator is available
ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:8000}"

if curl -s "$ORCHESTRATOR_URL/health" > /dev/null; then
    # Add orchestrator context to CLAUDE.md
    cat >> ./CLAUDE.md << EOF

## Orchestrator Integration

You can also use programmatic tools via the orchestrator API at $ORCHESTRATOR_URL.

Available tools:
- marie_create_student_profile
- marie_document_class
- marie_add_progress_note
- marie_create_choreography
- marie_get_student_info
- marie_list_students
- marie_create_student_evaluation

To use orchestrator tools, say: "Use orchestrator to [action]"
EOF
fi

# Launch Claude Code
claude "$@"
```

**Enhanced DANCE.md template addition:**
```markdown
## Orchestrator Tools

When you need to perform structured operations, you can use orchestrator tools:

Example: "Use orchestrator to create a student profile for Emma Rodriguez"

I'll call the orchestrator API to execute the task programmatically.
```

**Pros:**
- ✅ Domain mode gains orchestrator capabilities
- ✅ Natural language interface to API
- ✅ Best user experience

**Cons:**
- ⚠️ Requires orchestrator to be running
- ⚠️ More complex prompt engineering

---

### 8. **Reverse Bridge: Orchestrator Tools in Domain Mode** (Via MCP)

**How it works:**
- Register orchestrator MCP servers in Claude Code
- Domain mode can use orchestrator tools natively

**Implementation:**

```json
// .claude/mcp.json or workspace .claude/mcp.json
{
  "mcpServers": {
    "marie-orchestrator": {
      "command": "tsx",
      "args": ["orchestration/marie/server.ts"],
      "env": {
        "MARIE_WORKSPACE": "${workspaceFolder}/workspaces/dance/studio"
      }
    }
  }
}
```

**Usage:**
```bash
# In domain mode
make marie

# Now you can say:
"Create a student profile for Emma using the orchestrator tool"
# Claude Code will use the MCP tool directly!
```

**Pros:**
- ✅ Native MCP integration
- ✅ No API calls needed
- ✅ Direct tool access

**Cons:**
- ⚠️ Requires MCP server to be running
- ⚠️ More complex setup

---

### 9. **Webhook/Event System Bridge** (Production Ready)

**How it works:**
- Orchestrator exposes webhook endpoints
- Domain mode can register webhooks
- Bidirectional event flow

**Implementation:**

```typescript
// orchestration/orchestrator/webhooks.ts
import express from 'express';

const webhooks = new Map<string, string[]>();

app.post('/webhooks/register', (req, res) => {
  const { event, url } = req.body;
  if (!webhooks.has(event)) {
    webhooks.set(event, []);
  }
  webhooks.get(event)!.push(url);
  res.json({ success: true });
});

function triggerWebhook(event: string, data: any) {
  const urls = webhooks.get(event) || [];
  urls.forEach(url => {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    });
  });
}

// In task execution
async executeTask(task: Task) {
  const result = await /* ... execute task ... */;
  triggerWebhook('task_completed', { task, result });
  return result;
}
```

**Domain mode webhook handler:**
```bash
# domains/dance/marie/hooks/webhook-handler.sh
#!/bin/bash

# Receives webhook from orchestrator
EVENT="$1"
DATA="$2"

case "$EVENT" in
  "student_profile_created")
    echo "🎉 New student profile created: $(echo $DATA | jq -r '.student_name')"
    # Could trigger notifications, updates, etc.
    ;;
  "class_documented")
    echo "📝 Class documented: $(echo $DATA | jq -r '.class_name')"
    ;;
esac
```

**Pros:**
- ✅ Production-ready architecture
- ✅ Decoupled systems
- ✅ Scalable

**Cons:**
- ⚠️ Most complex to implement
- ⚠️ Requires webhook infrastructure

---

### 10. **Shared Configuration Bridge** (Unified Settings)

**How it works:**
- Single configuration file for both systems
- Shared settings, templates, and preferences

**Implementation:**

```json
// domains/dance/marie/config.json
{
  "workspace": "workspaces/dance/studio",
  "orchestrator": {
    "url": "http://localhost:8000",
    "enabled": true
  },
  "templates": {
    "dance_md": "orchestration/marie/DANCE.md",
    "student_profile": "domains/dance/marie/templates/student-profile-template.md"
  },
  "features": {
    "file_watcher": true,
    "webhooks": false,
    "mcp_integration": true
  }
}
```

**Both systems read this:**
```typescript
// orchestration/marie/server.ts
import config from '../../domains/dance/marie/config.json';
const WORKSPACE = config.workspace;
```

```bash
# domains/dance/marie/launchers/marie.sh
source <(jq -r 'to_entries[] | "export \(.key)=\(.value)"' config.json)
```

**Pros:**
- ✅ Single source of configuration
- ✅ Easy to maintain
- ✅ Consistent settings

**Cons:**
- ⚠️ Requires JSON parsing in shell scripts
- ⚠️ Path management complexity

---

### 11. **Command Bridge** (Makefile Integration)

**How it works:**
- Add Makefile targets that bridge both systems
- Simple commands that work with both

**Implementation:**

```makefile
# Makefile additions

# Bridge: Create student via orchestrator
marie-create-student:
	@read -p "Student name: " name; \
	read -p "Age: " age; \
	curl -X POST http://localhost:8000/execute \
	  -H "Content-Type: application/json" \
	  -d "{\"tasks\": [{\"agent\": \"marie\", \"action\": \"marie_create_student_profile\", \"params\": {\"name\": \"$$name\", \"age\": $$age}}]}"

# Bridge: Interactive mode with orchestrator available
marie-hybrid:
	@ORCHESTRATOR_URL=http://localhost:8000 \
	$(MAKE) marie

# Bridge: Sync templates
marie-sync-templates:
	@cp orchestration/marie/DANCE.md domains/dance/marie/templates/DANCE.md
	@echo "✅ Templates synced"
```

**Pros:**
- ✅ Simple commands
- ✅ Easy to remember
- ✅ Integrated workflow

**Cons:**
- ⚠️ Makefile-specific
- ⚠️ Limited flexibility

---

### 12. **API Gateway Bridge** (Unified Interface)

**How it works:**
- Create a unified API that handles both modes
- Single endpoint that routes to appropriate system

**Implementation:**

```typescript
// orchestration/gateway/index.ts
import express from 'express';

const app = express();

app.post('/marie/:action', async (req, res) => {
  const { action } = req.params;
  const { mode = 'orchestrator', ...params } = req.body;
  
  if (mode === 'interactive') {
    // Spawn domain launcher
    const { spawn } = require('child_process');
    const claude = spawn('claude', ['-p', params.prompt], {
      cwd: 'workspaces/dance/studio'
    });
    // Handle output...
  } else {
    // Use orchestrator
    const result = await orchestrator.executeTask({
      agent: 'marie',
      action: `marie_${action}`,
      params
    });
    res.json(result);
  }
});
```

**Pros:**
- ✅ Single API for both
- ✅ Easy to switch modes
- ✅ Clean abstraction

**Cons:**
- ⚠️ Additional service layer
- ⚠️ More complexity

---

## 🎯 Recommended Approach

### For Quick Start: **Hybrid Launcher (#3)**
- Easiest to implement
- Best user experience
- Works immediately

### For Production: **Combination of #1, #3, #7, #10**
- Shared workspace (already working)
- Hybrid launcher for flexibility
- MCP integration for native tools
- Shared configuration for consistency

### For Advanced: **#9 (Webhooks) + #5 (File Watcher)**
- Event-driven architecture
- Real-time synchronization
- Production-ready

---

## 📝 Implementation Priority

1. ✅ **#1 Shared Workspace** - Already working!
2. 🟡 **#3 Hybrid Launcher** - Easy, high value
3. 🟡 **#10 Shared Config** - Medium effort, high value
4. 🟠 **#7 MCP Client** - Medium effort, advanced
5. 🔴 **#9 Webhooks** - High effort, production feature

---

## 🚀 Quick Implementation Example

Here's a minimal hybrid launcher you can use right now:

```bash
#!/bin/bash
# domains/dance/marie/launchers/marie-bridge.sh

ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:8000}"

# Check if orchestrator is available and first arg is a workflow
if [ -f "$1" ] && [[ "$1" == *.json ]] && curl -s "$ORCHESTRATOR_URL/health" > /dev/null 2>&1; then
    echo "🔄 Executing via orchestrator..."
    curl -X POST "$ORCHESTRATOR_URL/execute" \
      -H "Content-Type: application/json" \
      -d "@$1" | jq
else
    # Default to interactive mode
    exec "$(dirname "$0")/marie.sh" "$@"
fi
```

Save as `marie-bridge.sh`, make executable, and use:
```bash
# Interactive
./marie-bridge.sh

# Orchestrator
./marie-bridge.sh ../../orchestration/workflows/marie-new-student.json
```

---

## 📚 See Also

- [Orchestration README](../orchestration/README.md)
- [Domain README](../domains/README.md)
- [Workspace README](../workspaces/README.md)

