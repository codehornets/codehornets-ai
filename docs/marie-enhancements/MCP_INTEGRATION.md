# Marie MCP Integration

## Overview

The Model Context Protocol (MCP) integration enables programmatic access to Marie's capabilities through a standardized server interface. This document covers the MCP server architecture, available tools, and integration patterns.

## Table of Contents

- [MCP Architecture](#mcp-architecture)
- [Server Configuration](#server-configuration)
- [Available Tools](#available-tools)
- [Tool Specifications](#tool-specifications)
- [Integration Patterns](#integration-patterns)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Examples](#examples)

## MCP Architecture

### Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                    External System                          │
│                  (Orchestrator, API, etc.)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ MCP Protocol
                           │ (JSON-RPC over stdio)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   MCP Server                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Tool Registry                           │  │
│  │  • marie_introduce                                   │  │
│  │  • marie_evaluate                                    │  │
│  │  • marie_document                                    │  │
│  │  • marie_status                                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │          Request Handler                             │  │
│  │  • Validate inputs                                   │  │
│  │  • Create task files                                 │  │
│  │  • Monitor for results                               │  │
│  │  • Return structured responses                       │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Task Queue        │     │   Result Queue      │
│   /tasks/           │     │   /results/         │
└──────────┬──────────┘     └──────────▲──────────┘
           │                           │
           │   ┌───────────────────┐   │
           └──▶│  Marie Worker     │───┘
               │  (Docker Container)│
               └───────────────────┘
```

### Protocol Flow

```
Client                   MCP Server              Task Queue         Marie          Result Queue
  │                          │                       │                │                │
  │ Call marie_evaluate      │                       │                │                │
  ├─────────────────────────▶│                       │                │                │
  │                          │                       │                │                │
  │                          │ Create task JSON      │                │                │
  │                          ├──────────────────────▶│                │                │
  │                          │                       │                │                │
  │                          │                       │ inotify/poll   │                │
  │                          │                       │◀───────────────┤                │
  │                          │                       │                │                │
  │                          │                       │ Read task      │                │
  │                          │                       ├───────────────▶│                │
  │                          │                       │                │                │
  │                          │                       │                │ Process        │
  │                          │                       │                │ (30-60s)       │
  │                          │                       │                │                │
  │                          │                       │                │ Write result   │
  │                          │                       │                ├───────────────▶│
  │                          │                       │                │                │
  │                          │ Poll for result       │                │                │
  │                          ├───────────────────────┼────────────────┼───────────────▶│
  │                          │                       │                │                │
  │                          │◀──────────────────────┴────────────────┴────────────────┤
  │                          │ Read result JSON      │                │                │
  │                          │                       │                │                │
  │◀─────────────────────────┤                       │                │                │
  │ Return structured result │                       │                │                │
  │                          │                       │                │                │
```

## Server Configuration

### MCP Server Setup (Conceptual)

**Note**: The MCP server may not be fully implemented. This section describes the intended architecture.

```typescript
// server/marie/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

class MarieServer {
  private server: Server;
  private taskDir: string = "/home/anga/workspace/beta/codehornets-ai/core/shared/tasks/marie";
  private resultDir: string = "/home/anga/workspace/beta/codehornets-ai/core/shared/results/marie";

  constructor() {
    this.server = new Server(
      {
        name: "marie-dance-assistant",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "marie_introduce",
          description: "Display Marie's banner and introduction",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "marie_evaluate",
          description: "Create a student evaluation using APEXX methodology",
          inputSchema: {
            type: "object",
            properties: {
              student_name: {
                type: "string",
                description: "Student's full name",
              },
              evaluation_type: {
                type: "string",
                enum: ["formal", "quick_note"],
                description: "Type of evaluation to create",
              },
              observations: {
                type: "object",
                description: "Observations for each APEXX component",
                properties: {
                  attitude: { type: "string" },
                  posture: { type: "string" },
                  energy: { type: "string" },
                  expression: { type: "string" },
                  execution: { type: "string" },
                },
              },
            },
            required: ["student_name", "evaluation_type", "observations"],
          },
        },
        // Additional tools...
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "marie_introduce":
          return this.handleIntroduce();
        case "marie_evaluate":
          return this.handleEvaluate(request.params.arguments);
        case "marie_document":
          return this.handleDocument(request.params.arguments);
        case "marie_status":
          return this.handleStatus(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start server
const server = new MarieServer();
server.start();
```

### Client Configuration

```json
// .mcp.json or claude_desktop_config.json
{
  "mcpServers": {
    "marie-dance-assistant": {
      "command": "node",
      "args": ["/path/to/codehornets-ai/server/marie/index.js"],
      "env": {
        "MARIE_TASK_DIR": "/path/to/core/shared/tasks/marie",
        "MARIE_RESULT_DIR": "/path/to/core/shared/results/marie",
        "MARIE_WORKSPACE": "/path/to/workspaces/dance"
      }
    }
  }
}
```

## Available Tools

### 1. marie_introduce

**Purpose**: Display Marie's banner and capabilities
**Use Case**: Session initialization, capability discovery

```typescript
{
  name: "marie_introduce",
  description: "Display Marie's banner and introduction",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

**Response**:
```typescript
{
  content: [
    {
      type: "text",
      text: `
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Hi! I'm Marie, your dance teacher assistant! 🩰

I can help you with:
- Student evaluations (APEXX methodology)
- Class documentation
- Choreography organization
- Recital planning
- Parent communications

What would you like me to help with today?
      `
    }
  ]
}
```

### 2. marie_evaluate

**Purpose**: Create student evaluation
**Use Case**: Formal APEXX evaluation or quick progress note

```typescript
{
  name: "marie_evaluate",
  description: "Create a student evaluation using APEXX methodology",
  inputSchema: {
    type: "object",
    properties: {
      student_name: {
        type: "string",
        description: "Student's full name"
      },
      evaluation_type: {
        type: "string",
        enum: ["formal", "quick_note"],
        description: "Type of evaluation"
      },
      observations: {
        type: "object",
        properties: {
          attitude: { type: "string", description: "Attitude observations" },
          posture: { type: "string", description: "Posture observations" },
          energy: { type: "string", description: "Energy observations" },
          expression: { type: "string", description: "Expression observations" },
          execution: { type: "string", description: "Execution observations" }
        },
        required: ["attitude", "posture", "energy", "expression", "execution"]
      },
      class_context: {
        type: "string",
        description: "Additional context (class type, date, etc.)"
      }
    },
    required: ["student_name", "evaluation_type", "observations"]
  }
}
```

**Response**:
```typescript
{
  content: [
    {
      type: "text",
      text: "Evaluation created successfully for Emma Rodriguez"
    },
    {
      type: "resource",
      resource: {
        uri: "file:///workspace/dance/evaluations/formal/Emma_Rodriguez_Evaluation_2025-11-18.md",
        mimeType: "text/markdown",
        text: "# Emma Rodriguez - Évaluation Hip-Hop\n\n..."
      }
    }
  ],
  metadata: {
    task_id: "task-1700000000-abc123",
    execution_time: 45,
    total_score: 82
  }
}
```

### 3. marie_document

**Purpose**: Create class documentation
**Use Case**: Class notes, observations, attendance

```typescript
{
  name: "marie_document",
  description: "Document a dance class session",
  inputSchema: {
    type: "object",
    properties: {
      class_name: {
        type: "string",
        description: "Name of the class (e.g., 'Intermediate Hip-Hop')"
      },
      date: {
        type: "string",
        description: "Class date (YYYY-MM-DD)"
      },
      attendance: {
        type: "array",
        items: { type: "string" },
        description: "List of student names present"
      },
      class_structure: {
        type: "object",
        properties: {
          warmup: { type: "string" },
          technique: { type: "string" },
          choreography: { type: "string" },
          cooldown: { type: "string" }
        }
      },
      observations: {
        type: "array",
        items: { type: "string" },
        description: "General class observations"
      },
      next_class_focus: {
        type: "string",
        description: "What to focus on next class"
      }
    },
    required: ["class_name", "date", "attendance"]
  }
}
```

### 4. marie_status

**Purpose**: Check task processing status
**Use Case**: Poll for task completion

```typescript
{
  name: "marie_status",
  description: "Check the status of a Marie task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "Task ID to check"
      }
    },
    required: ["task_id"]
  }
}
```

**Response**:
```typescript
{
  content: [
    {
      type: "text",
      text: "Task task-1700000000-abc123 is complete"
    }
  ],
  metadata: {
    task_id: "task-1700000000-abc123",
    status: "complete",
    created_at: "2025-11-18T10:00:00Z",
    completed_at: "2025-11-18T10:00:45Z",
    execution_time: 45
  }
}
```

## Tool Specifications

### Tool Implementation Pattern

```typescript
class MarieServer {
  private async handleEvaluate(args: any) {
    // 1. Validate inputs
    this.validateEvaluationInputs(args);

    // 2. Create task
    const taskId = this.generateTaskId();
    const task = {
      task_id: taskId,
      timestamp: new Date().toISOString(),
      worker: "marie",
      priority: "high",
      description: `Create ${args.evaluation_type} evaluation for ${args.student_name}`,
      context: {
        student_name: args.student_name,
        evaluation_type: args.evaluation_type,
        observations: args.observations,
        class_context: args.class_context,
      },
      requirements: [
        "Use APEXX methodology",
        "Write in French",
        "Include specific observations",
        "Provide actionable next steps",
      ],
      expected_output: {
        format: "markdown",
        artifacts: ["evaluation"],
      },
    };

    // 3. Write task file
    const taskPath = `${this.taskDir}/${taskId}.json`;
    await fs.writeFile(taskPath, JSON.stringify(task, null, 2));

    // 4. Wait for result (with timeout)
    const result = await this.waitForResult(taskId, timeout = 120000);

    // 5. Read artifacts
    const artifacts = await this.readArtifacts(result.artifacts);

    // 6. Return structured response
    return {
      content: [
        {
          type: "text",
          text: result.findings.summary,
        },
        ...artifacts.map((artifact) => ({
          type: "resource",
          resource: {
            uri: `file://${artifact.path}`,
            mimeType: this.getMimeType(artifact.format),
            text: artifact.content,
          },
        })),
      ],
      metadata: {
        task_id: taskId,
        execution_time: result.execution_time_seconds,
        total_score: this.extractScore(artifacts[0].content),
      },
    };
  }

  private async waitForResult(taskId: string, timeout: number): Promise<any> {
    const startTime = Date.now();
    const resultPath = `${this.resultDir}/${taskId}.json`;

    while (Date.now() - startTime < timeout) {
      if (await this.fileExists(resultPath)) {
        const content = await fs.readFile(resultPath, "utf-8");
        return JSON.parse(content);
      }
      await this.sleep(1000); // Poll every second
    }

    throw new Error(`Task ${taskId} timed out after ${timeout}ms`);
  }

  private async readArtifacts(artifacts: any[]): Promise<any[]> {
    const results = [];
    for (const artifact of artifacts) {
      const content = await fs.readFile(artifact.path, "utf-8");
      results.push({
        ...artifact,
        content,
      });
    }
    return results;
  }

  private generateTaskId(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = crypto.randomUUID().split("-")[0];
    return `task-${timestamp}-${random}`;
  }
}
```

## Integration Patterns

### Pattern 1: Direct Tool Invocation

**Use Case**: Single operation via MCP client

```typescript
// Client code
const client = new MCPClient();
await client.connect("marie-dance-assistant");

const result = await client.callTool("marie_evaluate", {
  student_name: "Emma Rodriguez",
  evaluation_type: "formal",
  observations: {
    attitude: "Excellent engagement, always on time, helps classmates",
    posture: "Good alignment, working on core strength",
    energy: "High energy, maintains throughout class",
    expression: "Developing personal style, confident performance",
    execution: "Strong technique, precise movements",
  },
});

console.log(result.content[0].text);
// "Evaluation created successfully for Emma Rodriguez"

console.log(result.content[1].resource.text);
// Full markdown evaluation content
```

### Pattern 2: Batch Processing

**Use Case**: Multiple evaluations in sequence

```typescript
const students = [
  { name: "Emma Rodriguez", observations: {...} },
  { name: "Sophia Chen", observations: {...} },
  { name: "Maya Patel", observations: {...} },
];

const results = [];
for (const student of students) {
  const result = await client.callTool("marie_evaluate", {
    student_name: student.name,
    evaluation_type: "formal",
    observations: student.observations,
  });
  results.push(result);
}

console.log(`Created ${results.length} evaluations`);
```

### Pattern 3: Orchestrator Integration

**Use Case**: Multi-agent workflow with task delegation

```typescript
// Orchestrator (Anga) delegates to Marie
class Orchestrator {
  async processRecitalPreparation(recitalData) {
    // 1. Extract student list
    const students = recitalData.participants;

    // 2. For each student, request Marie evaluation
    const evaluations = [];
    for (const student of students) {
      const observations = await this.gatherObservations(student);

      const evaluation = await marieClient.callTool("marie_evaluate", {
        student_name: student.name,
        evaluation_type: "formal",
        observations: observations,
        class_context: `Recital preparation: ${recitalData.recital_name}`,
      });

      evaluations.push(evaluation);
    }

    // 3. Compile recital readiness report
    return this.compileReadinessReport(evaluations);
  }
}
```

### Pattern 4: Async Status Polling

**Use Case**: Long-running tasks with status updates

```typescript
// Submit task
const taskId = await marieClient.callTool("marie_evaluate", {...});

// Poll for status
let status = "pending";
while (status !== "complete") {
  const statusResult = await marieClient.callTool("marie_status", {
    task_id: taskId,
  });

  status = statusResult.metadata.status;

  if (status === "error") {
    throw new Error("Task failed");
  }

  if (status !== "complete") {
    await sleep(5000); // Wait 5 seconds before checking again
  }
}

console.log("Task complete!");
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Common Errors

#### 1. Invalid Input

```typescript
{
  error: {
    code: "INVALID_INPUT",
    message: "Missing required field: student_name",
    details: {
      field: "student_name",
      provided: undefined,
      required: true
    }
  }
}
```

#### 2. Task Timeout

```typescript
{
  error: {
    code: "TASK_TIMEOUT",
    message: "Task task-1700000000-abc123 exceeded timeout of 120000ms",
    details: {
      task_id: "task-1700000000-abc123",
      timeout: 120000,
      elapsed: 120100
    }
  }
}
```

#### 3. Processing Error

```typescript
{
  error: {
    code: "PROCESSING_ERROR",
    message: "Marie encountered an error while processing the task",
    details: {
      task_id: "task-1700000000-abc123",
      error_message: "Unable to write to workspace",
      partial_results: {...}
    }
  }
}
```

### Error Handling Best Practices

```typescript
try {
  const result = await client.callTool("marie_evaluate", args);
  return result;
} catch (error) {
  if (error.code === "TASK_TIMEOUT") {
    // Retry with longer timeout
    return await client.callTool("marie_evaluate", {
      ...args,
      timeout: 180000, // 3 minutes
    });
  } else if (error.code === "INVALID_INPUT") {
    // Fix input and retry
    const fixedArgs = await validateAndFixInput(args);
    return await client.callTool("marie_evaluate", fixedArgs);
  } else {
    // Log and propagate
    logger.error("Marie evaluation failed", { error, args });
    throw error;
  }
}
```

## Security Considerations

### Authentication

```typescript
// MCP server validates client credentials
class MarieServer {
  private validateClient(clientId: string, token: string): boolean {
    // Check if client is authorized
    return this.authorizedClients.has(clientId) &&
           this.tokens.get(clientId) === token;
  }
}
```

### Input Validation

```typescript
private validateEvaluationInputs(args: any): void {
  // Check required fields
  if (!args.student_name) {
    throw new Error("student_name is required");
  }

  // Validate evaluation type
  if (!["formal", "quick_note"].includes(args.evaluation_type)) {
    throw new Error("Invalid evaluation_type");
  }

  // Validate observations structure
  const requiredFields = ["attitude", "posture", "energy", "expression", "execution"];
  for (const field of requiredFields) {
    if (!args.observations[field]) {
      throw new Error(`observations.${field} is required`);
    }
  }

  // Sanitize inputs (prevent path traversal, injection, etc.)
  args.student_name = this.sanitizeString(args.student_name);
}
```

### File System Security

```typescript
private sanitizePath(path: string): string {
  // Prevent directory traversal
  if (path.includes("..")) {
    throw new Error("Path traversal attempt detected");
  }

  // Ensure path is within allowed directories
  const allowedDirs = [this.taskDir, this.resultDir, this.workspaceDir];
  const resolvedPath = path.resolve(path);

  if (!allowedDirs.some((dir) => resolvedPath.startsWith(dir))) {
    throw new Error("Path outside allowed directories");
  }

  return resolvedPath;
}
```

## Examples

### Example 1: Simple Evaluation

```bash
# Using MCP CLI (if available)
mcp call marie-dance-assistant marie_evaluate \
  --student_name "Emma Rodriguez" \
  --evaluation_type "formal" \
  --observations.attitude "Excellent engagement" \
  --observations.posture "Good alignment" \
  --observations.energy "High energy" \
  --observations.expression "Developing style" \
  --observations.execution "Strong technique"
```

### Example 2: Class Documentation

```typescript
await client.callTool("marie_document", {
  class_name: "Intermediate Hip-Hop",
  date: "2025-11-18",
  attendance: ["Emma Rodriguez", "Sophia Chen", "Maya Patel"],
  class_structure: {
    warmup: "Dynamic stretching, isolation drills",
    technique: "Rock step, bounce, basic grooves",
    choreography: "8-count sequence to 'Uptown Funk'",
    cooldown: "Static stretching, feedback session",
  },
  observations: [
    "Class energy was high throughout",
    "Students struggled with rapid direction changes",
    "Emma showed excellent leadership",
  ],
  next_class_focus: "Continue choreography, add formation changes",
});
```

### Example 3: Status Checking

```typescript
// Submit task
const result = await client.callTool("marie_evaluate", {...});
const taskId = result.metadata.task_id;

// Check status later
const status = await client.callTool("marie_status", {
  task_id: taskId,
});

if (status.metadata.status === "complete") {
  console.log("Evaluation is ready!");
  console.log(`Completed in ${status.metadata.execution_time} seconds`);
}
```

## Conclusion

The MCP integration provides:

- **Standardized Interface**: Consistent tool-based API
- **Programmatic Access**: Automation and integration
- **Type Safety**: Structured inputs and outputs
- **Error Handling**: Robust error reporting
- **Security**: Input validation and authentication

For usage examples, see [EXAMPLES.md](./EXAMPLES.md).

**Note**: The MCP server implementation may be incomplete. Refer to the codebase for actual implementation status.

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: CodeHornets-AI Team
