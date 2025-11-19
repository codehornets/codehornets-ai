# Model Context Protocol (MCP) - Comprehensive Technical Reference

> Complete technical documentation indexed from https://code.claude.com/docs/en/mcp and https://modelcontextprotocol.io
>
> Last Updated: 2025-11-18

---

## Table of Contents

1. [MCP Overview](#mcp-overview)
2. [Architecture](#architecture)
3. [Protocol Specification](#protocol-specification)
4. [Server Development](#server-development)
5. [Client Development](#client-development)
6. [Transport Layer](#transport-layer)
7. [Core Primitives](#core-primitives)
8. [Security Best Practices](#security-best-practices)
9. [Configuration](#configuration)
10. [Debugging and Testing](#debugging-and-testing)
11. [Real-World Examples](#real-world-examples)
12. [Advanced Patterns](#advanced-patterns)

---

## MCP Overview

### What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to access contextual information through standardized integrations. Introduced by Anthropic in November 2024, MCP provides a unified way for AI models to interact with external tools, databases, APIs, and data sources.

### Key Benefits

- **Standardized Integration**: Single protocol for connecting AI models to diverse data sources
- **Bidirectional Communication**: Servers can expose capabilities and request AI assistance
- **Security First**: Built-in authentication, authorization, and permission controls
- **Language Agnostic**: Official SDKs for 10+ programming languages
- **Flexible Deployment**: Local (stdio), remote (HTTP), and cloud-based options

### Core Use Cases

- Implementing features from issue trackers
- Analyzing monitoring and observability data
- Querying databases and data warehouses
- Accessing file systems and version control
- Automating workflows across multiple services
- Providing real-time data to AI applications

---

## Architecture

### Hierarchical Structure

MCP implements a three-tier architecture:

```
┌─────────────────────────────────────┐
│         MCP Host                    │
│  (AI application coordinator)       │
└──────────┬──────────────────────────┘
           │ Manages multiple clients
           │
     ┌─────┴─────────┬─────────────┐
     │               │             │
┌────▼────┐    ┌────▼────┐   ┌───▼─────┐
│ Client  │    │ Client  │   │ Client  │
│    1    │    │    2    │   │    3    │
└────┬────┘    └────┬────┘   └────┬────┘
     │              │             │
     │ 1:1          │ 1:1         │ 1:1
     │              │             │
┌────▼────┐    ┌───▼─────┐  ┌────▼────┐
│ Server  │    │ Server  │  │ Server  │
│    A    │    │    B    │  │    C    │
└─────────┘    └─────────┘  └─────────┘
```

1. **MCP Host**: The AI application (e.g., Claude for Desktop) that coordinates multiple MCP clients
2. **MCP Client**: Maintains dedicated 1:1 connections to individual servers
3. **MCP Server**: Provides contextual data, tools, and capabilities to clients

### Layered Design

MCP separates concerns into two distinct layers:

#### Data Layer (Protocol Logic)
- Uses JSON-RPC 2.0 for all communication
- Lifecycle management (initialization, capability negotiation)
- Server primitives (tools, resources, prompts)
- Client primitives (sampling, elicitation, logging)
- Notifications and progress tracking

#### Transport Layer (Communication Channels)
- **stdio**: Local process communication
- **Streamable HTTP**: Remote server access with OAuth support
- **Custom transports**: Extensible for specific use cases

---

## Protocol Specification

### Message Format

MCP uses JSON-RPC 2.0 for all messages:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "city": "San Francisco"
    }
  }
}
```

### Protocol Flow

#### 1. Initialization Phase

```json
// Client sends initialization
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": {},
      "sampling": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  }
}

// Server responds with capabilities
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true }
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    }
  }
}
```

#### 2. Discovery Phase

Clients query available primitives:

```json
// List available tools
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}

// Server responds with tool definitions
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "inputSchema": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    ]
  }
}
```

#### 3. Execution Phase

Client invokes tools:

```json
// Call a tool
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "city": "San Francisco"
    }
  }
}

// Server returns results
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Temperature: 72°F, Condition: Sunny"
      }
    ]
  }
}
```

#### 4. Real-Time Updates

Servers notify clients of changes:

```json
// Server sends notification
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```

---

## Server Development

### Language Support

Official SDKs available for:
- TypeScript/JavaScript
- Python
- Go
- Kotlin
- Swift
- Java
- C#
- Ruby
- Rust
- PHP

### TypeScript SDK

#### Installation

```bash
npm install @modelcontextprotocol/sdk
```

#### Basic Server Setup

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'example-server',
  version: '1.0.0'
});

// Register a tool
server.registerTool(
  'calculate_bmi',
  {
    title: 'BMI Calculator',
    description: 'Calculate Body Mass Index',
    inputSchema: {
      type: 'object',
      properties: {
        weightKg: { type: 'number' },
        heightM: { type: 'number' }
      },
      required: ['weightKg', 'heightM']
    }
  },
  async ({ weightKg, heightM }) => {
    const bmi = weightKg / (heightM * heightM);
    return {
      content: [
        {
          type: 'text',
          text: `BMI: ${bmi.toFixed(2)}`
        }
      ],
      structuredContent: { bmi }
    };
  }
);
```

#### Resource Registration

```typescript
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Static resource
server.registerResource(
  'config',
  'config://app',
  {
    title: 'Application Config',
    description: 'Configuration data'
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ theme: 'dark', version: '1.0' })
      }
    ]
  })
);

// Dynamic resource with URI template
server.registerResource(
  'user-profile',
  new ResourceTemplate('users://{userId}/profile', { list: undefined }),
  {
    title: 'User Profile',
    description: 'User profile information'
  },
  async (uri, { userId }) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ userId, name: 'John Doe' })
      }
    ]
  })
);
```

#### HTTP Transport

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, () => {
  console.log('MCP server running on http://localhost:3000/mcp');
});
```

### Python SDK (FastMCP)

#### Installation

```bash
pip install "mcp[cli]"
# or
uv add "mcp[cli]"
```

#### Basic Server Setup

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(name="example-server")

# Register a tool
@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

@mcp.tool()
async def greet(name: str) -> str:
    """Returns a greeting."""
    return f"Hello, {name}!"
```

#### Resource Implementation

```python
# Static resource
@mcp.resource("config://version")
def get_version() -> str:
    """Get application version."""
    return "2.0.1"

# Dynamic resource template
@mcp.resource("users://{user_id}/profile")
def get_profile(user_id: int) -> dict:
    """Get user profile by ID."""
    return {
        "id": user_id,
        "name": f"User {user_id}",
        "status": "active"
    }
```

#### Structured Output with Pydantic

```python
from pydantic import BaseModel

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    condition: str

@mcp.tool()
def get_weather(city: str) -> WeatherData:
    """Get current weather for a city."""
    return WeatherData(
        temperature=72.5,
        humidity=45.0,
        condition="sunny"
    )
```

#### Context Injection

```python
from mcp.server.fastmcp import Context
from mcp.server.session import ServerSession

@mcp.tool()
async def long_task(task_name: str, ctx: Context[ServerSession, None]) -> str:
    """Execute a long-running task with progress updates."""
    await ctx.info(f"Starting: {task_name}")
    await ctx.report_progress(progress=0.5, total=1.0, message="Halfway")
    await ctx.info(f"Completed: {task_name}")
    return f"Task '{task_name}' completed successfully"
```

#### Lifespan Management

```python
from contextlib import asynccontextmanager
from typing import AsyncIterator
from dataclasses import dataclass

@dataclass
class AppContext:
    db: Database

@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    """Manage application lifecycle."""
    db = await Database.connect()
    try:
        yield AppContext(db=db)
    finally:
        await db.disconnect()

mcp = FastMCP("MyApp", lifespan=app_lifespan)

@mcp.tool()
async def query_db(sql: str, ctx: Context[ServerSession, AppContext]) -> list:
    """Query database using managed connection."""
    result = await ctx.app_context.db.query(sql)
    return result
```

#### Prompt Templates

```python
@mcp.prompt()
def greet_user(name: str, style: str = "friendly") -> str:
    """Generate a greeting prompt."""
    styles = {
        "friendly": "Please write a warm, friendly greeting",
        "formal": "Please write a formal, professional greeting"
    }
    return f"{styles.get(style, styles['friendly'])} for someone named {name}."
```

### Critical Logging Requirements

**NEVER write to stdout in stdio servers** - this will corrupt JSON-RPC messages and break your server.

```python
# Python - Use logging module
import logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger(__name__)
logger.info("Server starting...")

# JavaScript/TypeScript - Use console.error
console.error("Server starting...");

# NOT this (breaks stdio transport):
# console.log("Server starting...");  // WRONG!
# print("Server starting...")          // WRONG!
```

### Running Servers

```bash
# Python - Development mode with MCP Inspector
uv run mcp dev server.py

# Python - Install to Claude Desktop
uv run mcp install server.py

# TypeScript - Build and run
npm run build
node build/index.js

# Java - Build with Maven
./mvnw clean install

# C# - Build and run
dotnet run --no-build
```

---

## Client Development

### Client Capabilities

Clients can expose these capabilities to servers:

1. **Sampling**: Allow servers to request LLM completions
2. **Elicitation**: Allow servers to request user input at runtime
3. **Logging**: Receive diagnostic messages from servers

### Python Client Example

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Create client session
server_params = StdioServerParameters(
    command="python",
    args=["server.py"]
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize
        await session.initialize()

        # List available tools
        tools = await session.list_tools()

        # Call a tool
        result = await session.call_tool("get_weather", {"city": "SF"})
        print(result.content)
```

---

## Transport Layer

### stdio Transport

**Use Case**: Local process communication, development, CLI tools

**How it Works**:
1. Client launches server as subprocess
2. Communication via stdin/stdout
3. Messages delimited by newlines
4. stderr used for logging

**Requirements**:
- Server reads JSON-RPC from stdin
- Server writes JSON-RPC to stdout
- NO non-JSON output to stdout
- Logging must go to stderr

**Example Configuration**:

```json
{
  "mcpServers": {
    "local-server": {
      "command": "python",
      "args": ["-m", "my_mcp_server"],
      "env": {
        "API_KEY": "secret"
      }
    }
  }
}
```

### Streamable HTTP Transport

**Use Case**: Remote servers, cloud deployment, multi-user access

**How it Works**:
1. Independent server process (e.g., Express, FastAPI)
2. Client sends POST requests for messages
3. Server responds with JSON or SSE stream
4. Optional GET for server-initiated messages

**Session Management**:

```http
POST /mcp HTTP/1.1
Host: example.com
MCP-Protocol-Version: 2025-03-26
Mcp-Session-Id: uuid-session-id
Content-Type: application/json
Accept: application/json, text/event-stream

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {...}
}
```

**Response Types**:

```http
# Single response
HTTP/1.1 200 OK
Content-Type: application/json

{"jsonrpc": "2.0", "id": 1, "result": {...}}

# Streaming response
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"jsonrpc": "2.0", "id": 1, "result": {...}}

data: {"jsonrpc": "2.0", "method": "notification", "params": {...}}
```

**Python FastAPI Example**:

```python
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP

app = FastAPI()
mcp = FastMCP("remote-server")

@mcp.tool()
def example_tool(param: str) -> str:
    return f"Processed: {param}"

# Mount MCP to FastAPI
app.mount("/mcp", mcp.get_asgi_app())
```

**TypeScript Express Example**:

```typescript
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    enableJsonResponse: true
  });

  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

### Transport Security

#### stdio Transport
- Limited to local machine
- Uses OS-level process isolation
- Inherits client's permissions

#### HTTP Transport
- Validate `Origin` headers (prevent DNS rebinding)
- Bind to localhost (127.0.0.1) for local servers
- Use HTTPS in production
- Implement authentication (OAuth 2.1 recommended)
- Use secure session IDs (UUID, JWT, or cryptographic hash)

---

## Core Primitives

### Tools

**Purpose**: Enable LLMs to take actions (mutations, computations, API calls)

**Structure**:

```json
{
  "name": "create_file",
  "title": "Create File",
  "description": "Creates a new file with specified content",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    },
    "required": ["path", "content"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "message": { "type": "string" }
    }
  }
}
```

**Protocol Operations**:
- `tools/list` - Discover available tools
- `tools/call` - Execute a tool

**Result Format**:

```json
{
  "content": [
    {
      "type": "text",
      "text": "File created successfully"
    }
  ],
  "structuredContent": {
    "success": true,
    "path": "/path/to/file"
  },
  "isError": false
}
```

**Error Handling**:

```python
from mcp.types import CallToolResult, TextContent

@mcp.tool()
def risky_operation(param: str) -> CallToolResult:
    """Execute operation that might fail."""
    try:
        result = perform_operation(param)
        return CallToolResult(
            content=[TextContent(type="text", text=f"Success: {result}")],
            isError=False
        )
    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"Error: {str(e)}")],
            isError=True
        )
```

### Resources

**Purpose**: Provide read-only access to contextual data (files, databases, APIs)

**Types**:

1. **Direct Resources** - Fixed URI

```json
{
  "uri": "file:///path/to/config.json",
  "name": "Configuration",
  "description": "Application configuration file",
  "mimeType": "application/json"
}
```

2. **Resource Templates** - Parameterized URI

```json
{
  "uriTemplate": "logs://{date}/{level}",
  "name": "Application Logs",
  "description": "Logs filtered by date and level",
  "mimeType": "text/plain"
}
```

**Protocol Operations**:
- `resources/list` - List available resources
- `resources/templates/list` - List URI templates
- `resources/read` - Read resource content
- `resources/subscribe` - Monitor resource changes
- `resources/unsubscribe` - Stop monitoring

**Subscription Example**:

```json
// Client subscribes
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/subscribe",
  "params": {
    "uri": "file:///project/config.json"
  }
}

// Server notifies on change
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "file:///project/config.json"
  }
}
```

**Python Implementation**:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("resource-server")

# Static resource
@mcp.resource("file://config/app.json")
def get_config() -> str:
    """Application configuration."""
    return json.dumps({"theme": "dark", "version": "1.0"})

# Dynamic resource with parameters
@mcp.resource("stock://{symbol}/earnings")
def get_earnings(symbol: str) -> str:
    """Get earnings data for stock symbol."""
    data = fetch_earnings(symbol)
    return json.dumps(data)
```

**TypeScript Implementation**:

```typescript
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Template with parameter completion
server.registerResource(
  'logs',
  new ResourceTemplate('logs://{date}/{level}', {
    list: undefined,
    parameters: {
      date: {
        description: 'Date in YYYY-MM-DD format'
      },
      level: {
        description: 'Log level',
        enum: ['info', 'warn', 'error']
      }
    }
  }),
  {
    title: 'Application Logs',
    description: 'Filtered application logs'
  },
  async (uri, { date, level }) => ({
    contents: [
      {
        uri: uri.href,
        text: await readLogs(date, level),
        mimeType: 'text/plain'
      }
    ]
  })
);
```

### Prompts

**Purpose**: Reusable instruction templates for structured LLM interactions

**Structure**:

```json
{
  "name": "code_review",
  "title": "Request Code Review",
  "description": "Asks the LLM to analyze code quality",
  "arguments": [
    {
      "name": "code",
      "description": "The code to review",
      "required": true
    },
    {
      "name": "language",
      "description": "Programming language",
      "required": false
    }
  ]
}
```

**Protocol Operations**:
- `prompts/list` - Discover available prompts
- `prompts/get` - Retrieve prompt with arguments

**Get Prompt Example**:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "prompts/get",
  "params": {
    "name": "code_review",
    "arguments": {
      "code": "def hello():\n    print('world')",
      "language": "python"
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "description": "Code review for Python code",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Please review this Python code:\n\ndef hello():\n    print('world')\n\nProvide feedback on:\n- Code quality\n- Best practices\n- Potential improvements"
        }
      }
    ]
  }
}
```

**Python Implementation**:

```python
@mcp.prompt()
def code_review(code: str, language: str = "python") -> str:
    """Generate code review prompt."""
    return f"""Please review this {language} code:

{code}

Provide feedback on:
- Code quality and style
- Best practices adherence
- Potential bugs or issues
- Performance considerations
- Suggested improvements
"""

@mcp.prompt()
def debug_assistant(error_message: str, context: str = "") -> str:
    """Generate debugging assistance prompt."""
    prompt = f"I encountered this error:\n\n{error_message}\n\n"
    if context:
        prompt += f"Context:\n{context}\n\n"
    prompt += "Please help me:\n1. Understand what caused this error\n2. Suggest how to fix it\n3. Recommend ways to prevent it"
    return prompt
```

### Sampling (Server Requests LLM Completion)

**Purpose**: Allow servers to request AI completions without direct model access

**Use Cases**:
- Agentic behavior (multi-step reasoning)
- Content generation
- Data transformation
- Analysis and summarization

**Python Example**:

```python
from mcp.types import SamplingMessage, TextContent

@mcp.tool()
async def generate_poem(topic: str, ctx: Context) -> str:
    """Generate a poem about a topic using LLM sampling."""
    result = await ctx.session.create_message(
        messages=[
            SamplingMessage(
                role="user",
                content=TextContent(
                    type="text",
                    text=f"Write a short poem about {topic}"
                )
            )
        ],
        max_tokens=200
    )
    return result.content.text
```

### Elicitation (Server Requests User Input)

**Purpose**: Request additional context from users at runtime

**Use Cases**:
- Collect missing parameters
- Request confirmations
- Gather preferences
- Interactive workflows

**Protocol Message**:

```json
{
  "jsonrpc": "2.0",
  "method": "elicitation/request",
  "params": {
    "prompt": "Which date would you prefer?",
    "schema": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "format": "date"
        }
      },
      "required": ["date"]
    }
  }
}
```

**Python Example**:

```python
from pydantic import BaseModel

class BookingPreferences(BaseModel):
    date: str
    time: str
    party_size: int

@mcp.tool()
async def book_table(
    restaurant: str,
    ctx: Context
) -> str:
    """Book restaurant table with user preferences."""

    # Check availability
    if not is_date_available(today()):
        # Request user preferences
        prefs = await ctx.elicit(
            prompt="Your preferred date is unavailable. Please provide alternative preferences:",
            schema=BookingPreferences
        )

        date = prefs.date
        time = prefs.time
        party_size = prefs.party_size
    else:
        date = today()
        time = "7:00 PM"
        party_size = 2

    # Make booking
    confirmation = make_booking(restaurant, date, time, party_size)
    return f"Booked {restaurant} for {party_size} on {date} at {time}. Confirmation: {confirmation}"
```

---

## Security Best Practices

### Authentication

**OAuth 2.1 (Recommended)**

```typescript
// TypeScript server with OAuth
import { OAuthProvider } from '@modelcontextprotocol/sdk/auth';

const oauth = new OAuthProvider({
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  authorizationEndpoint: 'https://auth.example.com/authorize',
  tokenEndpoint: 'https://auth.example.com/token',
  scopes: ['mcp:read', 'mcp:write']
});

server.setAuthProvider(oauth);
```

**Key Principles**:
- Use short-lived tokens with automatic refresh
- Enforce PKCE for additional security
- Integrate with enterprise identity providers (Okta, Azure AD, Auth0)
- NEVER accept tokens not explicitly issued for your MCP server
- Avoid "token passthrough" anti-pattern
- DO NOT use sessions for authentication (use tokens)

### Authorization

**Role-Based Access Control (RBAC)**

```python
from enum import Enum

class Role(Enum):
    VIEWER = "viewer"
    USER = "user"
    ADMIN = "admin"

def require_role(required_role: Role):
    """Decorator to enforce role-based access."""
    def decorator(func):
        async def wrapper(*args, ctx: Context, **kwargs):
            user_role = ctx.session.get_user_role()
            if not has_permission(user_role, required_role):
                raise PermissionError(f"Requires {required_role.value} role")
            return await func(*args, ctx=ctx, **kwargs)
        return wrapper
    return decorator

@mcp.tool()
@require_role(Role.ADMIN)
async def delete_user(user_id: str, ctx: Context) -> str:
    """Delete user (admin only)."""
    await db.delete_user(user_id)
    return f"User {user_id} deleted"
```

### Input Validation

**Strict Schema Validation**

```python
from pydantic import BaseModel, Field, validator

class CreateUserInput(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, pattern=r'^[a-zA-Z0-9_]+$')
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    age: int = Field(..., ge=13, le=120)

    @validator('username')
    def validate_username(cls, v):
        if v.lower() in ['admin', 'root', 'system']:
            raise ValueError('Reserved username')
        return v

@mcp.tool()
def create_user(data: CreateUserInput) -> dict:
    """Create user with validated input."""
    # Input is automatically validated by Pydantic
    user = db.create_user(
        username=data.username,
        email=data.email,
        age=data.age
    )
    return {"id": user.id, "username": user.username}
```

**Context-Based Sanitization**

```python
import html
import re

def sanitize_input(value: str, context: str = "general") -> str:
    """Sanitize input based on context."""
    if context == "html":
        return html.escape(value)
    elif context == "sql":
        # Use parameterized queries instead
        raise ValueError("Use parameterized queries for SQL")
    elif context == "filename":
        # Remove path traversal attempts
        return re.sub(r'[^\w\-\.]', '', value)
    else:
        # General sanitization
        return re.sub(r'[<>&"\']', '', value)
```

### Rate Limiting

**Token Bucket Algorithm**

```python
from datetime import datetime, timedelta
from collections import defaultdict

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self.requests = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """Check if request is within rate limits."""
        now = datetime.now()
        cutoff = now - self.window

        # Remove old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > cutoff
        ]

        # Check limit
        if len(self.requests[client_id]) >= self.max_requests:
            return False

        # Record request
        self.requests[client_id].append(now)
        return True

# Usage
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

@mcp.tool()
async def api_call(param: str, ctx: Context) -> str:
    """Rate-limited API call."""
    client_id = ctx.session.client_id

    if not rate_limiter.is_allowed(client_id):
        raise Exception("Rate limit exceeded. Try again later.")

    return await make_api_call(param)
```

**Per-Route Limits**

```python
from fastapi import FastAPI, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/token")
@limiter.limit("5/minute")  # Stricter for auth endpoints
async def token_endpoint(request: Request):
    """OAuth token endpoint with rate limiting."""
    pass

@app.post("/mcp")
@limiter.limit("100/minute")  # Standard for MCP calls
async def mcp_endpoint(request: Request):
    """MCP endpoint with rate limiting."""
    pass
```

### Output Sanitization

```python
import json
import re

def sanitize_output(data: dict) -> dict:
    """Remove sensitive data from output."""
    sensitive_keys = ['password', 'secret', 'token', 'api_key', 'private_key']

    def clean_dict(obj):
        if isinstance(obj, dict):
            return {
                k: '[REDACTED]' if k.lower() in sensitive_keys else clean_dict(v)
                for k, v in obj.items()
            }
        elif isinstance(obj, list):
            return [clean_dict(item) for item in obj]
        else:
            return obj

    return clean_dict(data)

@mcp.tool()
def get_user_data(user_id: str) -> dict:
    """Get user data with sensitive fields redacted."""
    raw_data = db.get_user(user_id)
    return sanitize_output(raw_data)
```

### Security Headers (HTTP Transport)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://trusted-client.com"],  # Specific origins only
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "MCP-Protocol-Version", "Mcp-Session-Id"],
)

# Host validation (prevent DNS rebinding)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "api.example.com"]
)

# Security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## Configuration

### .mcp.json Structure

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable-command",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR1": "value1",
        "ENV_VAR2": "${ENV_FROM_SYSTEM}"
      },
      "timeout": 30000
    }
  }
}
```

### Configuration Scopes

1. **Project Scope** (`.mcp.json` in project root)
   - Version controlled
   - Shared across team
   - Project-specific servers

2. **Local Scope** (`.claude/settings.local.json`)
   - Not version controlled
   - Personal overrides
   - Private credentials

3. **User Scope** (`~/.claude/settings.local.json`)
   - Cross-project servers
   - Personal utilities
   - Global tools

### Environment Variable Expansion

Supported syntax: `${VAR}` or `${VAR:-default}`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "API_URL": "${API_URL:-https://api.github.com}"
      }
    }
  }
}
```

### Platform-Specific Configuration

**macOS/Linux**:

```json
{
  "mcpServers": {
    "python-server": {
      "command": "python3",
      "args": ["-m", "my_server"]
    }
  }
}
```

**Windows**:

```json
{
  "mcpServers": {
    "python-server": {
      "command": "cmd",
      "args": ["/c", "python", "-m", "my_server"]
    },
    "npx-server": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@example/mcp-server"]
    }
  }
}
```

### Complete Example

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/directory"
      ],
      "timeout": 10000
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "database": {
      "command": "python",
      "args": ["-m", "mcp_postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}",
        "DB_POOL_SIZE": "${DB_POOL_SIZE:-10}"
      }
    },
    "api-server": {
      "command": "node",
      "args": ["/absolute/path/to/server/build/index.js"],
      "env": {
        "API_KEY": "${API_KEY}",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Claude Code CLI Commands

```bash
# Add MCP server (creates .mcp.json in project)
claude mcp add -s project my-server --transport stdio -- python -m my_server

# Add HTTP server
claude mcp add my-remote --transport http http://localhost:3000/mcp

# List configured servers
claude mcp list

# Get specific server details
claude mcp get my-server

# Remove server
claude mcp remove my-server

# Check status in Claude Code
# (inside Claude Code session)
/mcp
```

### Claude Desktop Configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/weather",
        "run",
        "weather.py"
      ]
    }
  }
}
```

**Important**:
- Use absolute paths (not relative)
- Restart Claude completely after changes (Cmd+Q, not just close window)
- Validate JSON syntax

---

## Debugging and Testing

### MCP Inspector

**Installation**: Not required, runs via npx

**Usage**:

```bash
# Test stdio server
npx @modelcontextprotocol/inspector python server.py

# Test with custom args
npx @modelcontextprotocol/inspector node build/index.js --config=dev

# Test HTTP server
# (open inspector, connect to http://localhost:3000/mcp)
npx @modelcontextprotocol/inspector
```

**Access**: Opens at http://localhost:6274

**Features**:
- Interactive tool testing
- Resource browsing
- Prompt exploration
- Real-time message inspection
- Error visualization

### Logging Best Practices

**Python**:

```python
import logging
import sys

# Configure logging to stderr
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

logger = logging.getLogger(__name__)

@mcp.tool()
def debug_tool(param: str) -> str:
    """Tool with comprehensive logging."""
    logger.info(f"debug_tool called with param={param}")

    try:
        result = process_param(param)
        logger.debug(f"Processing result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in debug_tool: {e}", exc_info=True)
        raise
```

**TypeScript**:

```typescript
// Use console.error for logging
console.error(`[${new Date().toISOString()}] Server starting...`);

server.registerTool('debug-tool', schema, async (params) => {
  console.error(`debug-tool called with:`, params);

  try {
    const result = await processParams(params);
    console.error(`Processing successful:`, result);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    console.error(`Error in debug-tool:`, error);
    throw error;
  }
});
```

### Log File Locations

**Claude for Desktop**:
- macOS: `~/Library/Logs/Claude/mcp.log`
- Server logs: `~/Library/Logs/Claude/mcp-server-SERVERNAME.log`

**Claude Code**:
- Check stderr output from server process
- Use `--verbose` flag when starting Claude Code

### Common Issues and Solutions

#### 1. Server Not Connecting

**Check**:
```bash
# Verify server runs standalone
python server.py

# Check configuration
claude mcp get my-server

# View logs
tail -f ~/Library/Logs/Claude/mcp-server-my-server.log
```

#### 2. JSON Parse Errors

**Cause**: Writing to stdout instead of stderr

**Fix**:
```python
# Wrong
print("Debug message")  # Goes to stdout!

# Correct
import sys
print("Debug message", file=sys.stderr)
# or
logger.info("Debug message")
```

#### 3. Tool Not Appearing

**Check**:
- Tool schema is valid JSON Schema
- Server properly initialized
- Capability negotiation succeeded
- No errors in logs

**Debug**:
```python
@mcp.tool()
def test_tool() -> str:
    """Minimal test tool."""
    return "success"

# Run with MCP Inspector to verify
```

#### 4. Environment Variables Not Working

**Verify expansion syntax**:
```json
{
  "env": {
    "CORRECT": "${MY_VAR}",
    "WITH_DEFAULT": "${MY_VAR:-default}",
    "WRONG": "$MY_VAR",  // Not supported
    "ALSO_WRONG": "{MY_VAR}"  // Not supported
  }
}
```

#### 5. Windows npx Issues

**Use cmd wrapper**:
```json
{
  "command": "cmd",
  "args": ["/c", "npx", "-y", "package-name"]
}
```

### Testing Strategies

**Unit Testing Tools**:

```python
import pytest
from mcp.server.fastmcp import FastMCP

@pytest.fixture
def mcp_server():
    mcp = FastMCP("test-server")

    @mcp.tool()
    def add(a: int, b: int) -> int:
        return a + b

    return mcp

def test_add_tool(mcp_server):
    """Test tool execution."""
    # Get tool
    tools = mcp_server.list_tools()
    assert len(tools) == 1
    assert tools[0].name == "add"

    # Call tool
    result = mcp_server.call_tool("add", {"a": 5, "b": 3})
    assert result.content[0].text == "8"
```

**Integration Testing**:

```python
import pytest
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

@pytest.mark.asyncio
async def test_server_integration():
    """Test full client-server integration."""
    server_params = StdioServerParameters(
        command="python",
        args=["server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize
            await session.initialize()

            # List tools
            tools = await session.list_tools()
            assert len(tools) > 0

            # Call tool
            result = await session.call_tool("get_weather", {"city": "SF"})
            assert result.content
```

---

## Real-World Examples

### Filesystem Server

```python
from pathlib import Path
from mcp.server.fastmcp import FastMCP
import json

mcp = FastMCP("filesystem-server")

ALLOWED_DIRECTORY = Path("/path/to/allowed/dir")

@mcp.tool()
def read_file(path: str) -> str:
    """Read file contents."""
    file_path = ALLOWED_DIRECTORY / path

    # Security: Prevent path traversal
    if not file_path.resolve().is_relative_to(ALLOWED_DIRECTORY):
        raise ValueError("Access denied: path outside allowed directory")

    return file_path.read_text()

@mcp.tool()
def write_file(path: str, content: str) -> str:
    """Write content to file."""
    file_path = ALLOWED_DIRECTORY / path

    if not file_path.resolve().is_relative_to(ALLOWED_DIRECTORY):
        raise ValueError("Access denied")

    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    return f"Written {len(content)} bytes to {path}"

@mcp.resource("file://{path}")
def get_file_resource(path: str) -> str:
    """Access files as resources."""
    file_path = ALLOWED_DIRECTORY / path

    if not file_path.resolve().is_relative_to(ALLOWED_DIRECTORY):
        raise ValueError("Access denied")

    return file_path.read_text()
```

### Database Server

```python
from mcp.server.fastmcp import FastMCP, Context
from sqlalchemy import create_engine, text
from pydantic import BaseModel
from typing import List

mcp = FastMCP("database-server")

class QueryResult(BaseModel):
    columns: List[str]
    rows: List[List[any]]
    row_count: int

@mcp.tool()
async def query_database(sql: str, ctx: Context) -> QueryResult:
    """Execute SQL query (SELECT only)."""
    # Security: Only allow SELECT
    if not sql.strip().upper().startswith('SELECT'):
        raise ValueError("Only SELECT queries allowed")

    await ctx.info(f"Executing query: {sql[:100]}...")

    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        result = conn.execute(text(sql))
        columns = list(result.keys())
        rows = [list(row) for row in result.fetchall()]

    await ctx.info(f"Query returned {len(rows)} rows")

    return QueryResult(
        columns=columns,
        rows=rows,
        row_count=len(rows)
    )

@mcp.resource("db://tables/{table_name}/schema")
def get_table_schema(table_name: str) -> str:
    """Get table schema as resource."""
    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = :table
            ORDER BY ordinal_position
        """), {"table": table_name})

        schema = [
            {"column": row[0], "type": row[1], "nullable": row[2]}
            for row in result
        ]

    return json.dumps(schema, indent=2)
```

### GitHub API Server

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Octokit } from '@octokit/rest';

const server = new McpServer({ name: 'github-server', version: '1.0.0' });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Search repositories
server.registerTool(
  'search_repositories',
  {
    description: 'Search GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        sort: { type: 'string', enum: ['stars', 'forks', 'updated'] },
        limit: { type: 'number', default: 10 }
      },
      required: ['query']
    }
  },
  async ({ query, sort, limit }) => {
    const { data } = await octokit.search.repos({
      q: query,
      sort: sort || 'stars',
      per_page: limit || 10
    });

    const results = data.items.map(repo => ({
      name: repo.full_name,
      stars: repo.stargazers_count,
      description: repo.description,
      url: repo.html_url
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }]
    };
  }
);

// Create issue
server.registerTool(
  'create_issue',
  {
    description: 'Create GitHub issue',
    inputSchema: {
      type: 'object',
      properties: {
        repo: { type: 'string', pattern: '^[^/]+/[^/]+$' },
        title: { type: 'string' },
        body: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } }
      },
      required: ['repo', 'title']
    }
  },
  async ({ repo, title, body, labels }) => {
    const [owner, repoName] = repo.split('/');

    const { data } = await octokit.issues.create({
      owner,
      repo: repoName,
      title,
      body: body || '',
      labels: labels || []
    });

    return {
      content: [{
        type: 'text',
        text: `Issue created: ${data.html_url}`
      }]
    };
  }
);
```

### Weather API Server

```python
from mcp.server.fastmcp import FastMCP
import httpx
from pydantic import BaseModel

mcp = FastMCP("weather-server")

class WeatherData(BaseModel):
    temperature: float
    condition: str
    humidity: float
    wind_speed: float

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> WeatherData:
    """Get weather forecast for coordinates."""
    url = f"https://api.weather.gov/points/{latitude},{longitude}"

    async with httpx.AsyncClient() as client:
        # Get forecast URL
        response = await client.get(url)
        data = response.json()
        forecast_url = data['properties']['forecast']

        # Get forecast
        forecast_response = await client.get(forecast_url)
        forecast_data = forecast_response.json()

        current = forecast_data['properties']['periods'][0]

        return WeatherData(
            temperature=current['temperature'],
            condition=current['shortForecast'],
            humidity=current.get('relativeHumidity', {}).get('value', 0),
            wind_speed=float(current['windSpeed'].split()[0])
        )

@mcp.tool()
async def get_alerts(state: str) -> list:
    """Get active weather alerts for state."""
    url = f"https://api.weather.gov/alerts/active?area={state}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()

        return [
            {
                "event": alert['properties']['event'],
                "headline": alert['properties']['headline'],
                "severity": alert['properties']['severity']
            }
            for alert in data['features']
        ]
```

---

## Advanced Patterns

### Multi-Server Orchestration

**Scenario**: Travel planning using multiple MCP servers

```python
# travel-orchestrator.py
from mcp.server.fastmcp import FastMCP, Context

mcp = FastMCP("travel-orchestrator")

@mcp.tool()
async def plan_trip(
    destination: str,
    dates: str,
    budget: float,
    ctx: Context
) -> str:
    """Orchestrate trip planning across multiple services."""
    plan = []

    # 1. Check weather
    await ctx.info("Checking weather forecast...")
    # (Assumes weather MCP server available to client)
    plan.append(f"Weather check for {destination} during {dates}")

    # 2. Search flights
    await ctx.info("Searching for flights...")
    # (Client would invoke flight search tool from flights MCP server)
    plan.append("Flight options researched")

    # 3. Check calendar availability
    await ctx.info("Verifying calendar availability...")
    # (Client accesses calendar resources from calendar MCP server)
    plan.append("Calendar confirmed clear")

    # 4. Suggest accommodations
    await ctx.report_progress(0.75, 1.0, "Finding hotels...")
    # (Hotels MCP server provides accommodation options)
    plan.append("Hotel recommendations compiled")

    return "\n".join([
        f"Trip plan for {destination}:",
        *plan,
        f"\nEstimated total cost: ${budget}"
    ])
```

### Context-Aware Completions

**Resource Template with Parameter Suggestions**:

```typescript
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Cities database
const cities = ['Paris', 'London', 'Tokyo', 'New York', 'Sydney'];

server.registerResource(
  'weather-forecast',
  new ResourceTemplate('weather://{city}/forecast', {
    list: undefined,
    // Parameter completion
    complete: async (paramName, partialValue) => {
      if (paramName === 'city') {
        return cities
          .filter(city => city.toLowerCase().startsWith(partialValue.toLowerCase()))
          .map(city => ({
            value: city,
            label: city,
            description: `Weather forecast for ${city}`
          }));
      }
      return [];
    }
  }),
  {
    title: 'Weather Forecast',
    description: 'Get weather forecast for a city'
  },
  async (uri, { city }) => {
    const forecast = await fetchWeatherForecast(city);
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(forecast, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);
```

### Dynamic Tool Registration

```python
from mcp.server.fastmcp import FastMCP
import importlib

mcp = FastMCP("plugin-server")

def load_plugins():
    """Dynamically load and register plugins."""
    plugins = ['plugin_math', 'plugin_text', 'plugin_data']

    for plugin_name in plugins:
        module = importlib.import_module(plugin_name)

        # Each plugin registers its own tools
        module.register_tools(mcp)

# Load plugins on startup
load_plugins()

# Plugin example: plugin_math.py
def register_tools(mcp_server):
    """Register math tools."""

    @mcp_server.tool()
    def fibonacci(n: int) -> list:
        """Calculate Fibonacci sequence."""
        if n <= 0:
            return []
        elif n == 1:
            return [0]

        seq = [0, 1]
        for i in range(2, n):
            seq.append(seq[-1] + seq[-2])
        return seq
```

### Resource Subscriptions with Real-Time Updates

```python
from mcp.server.fastmcp import FastMCP
import asyncio
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

mcp = FastMCP("file-watcher")

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, mcp_server):
        self.mcp = mcp_server

    def on_modified(self, event):
        if not event.is_directory:
            # Notify subscribers
            asyncio.create_task(
                self.mcp.notify_resource_changed(f"file://{event.src_path}")
            )

@mcp.resource("file://{path}")
def watch_file(path: str) -> str:
    """Watch file for changes."""
    return Path(path).read_text()

# Setup file watcher
observer = Observer()
handler = FileChangeHandler(mcp)
observer.schedule(handler, path='/watched/directory', recursive=True)
observer.start()
```

### Caching Layer

```python
from functools import lru_cache
from datetime import datetime, timedelta
import hashlib

class CacheManager:
    def __init__(self, ttl_seconds: int = 300):
        self.cache = {}
        self.ttl = timedelta(seconds=ttl_seconds)

    def get(self, key: str):
        """Get cached value if not expired."""
        if key in self.cache:
            value, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.ttl:
                return value
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value):
        """Cache value with timestamp."""
        self.cache[key] = (value, datetime.now())

cache = CacheManager(ttl_seconds=300)

@mcp.tool()
async def expensive_api_call(query: str) -> dict:
    """API call with caching."""
    cache_key = hashlib.md5(query.encode()).hexdigest()

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return {"result": cached, "cached": True}

    # Make API call
    result = await make_api_call(query)

    # Cache result
    cache.set(cache_key, result)

    return {"result": result, "cached": False}
```

### Error Recovery and Retry

```python
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx

@mcp.tool()
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
async def resilient_api_call(endpoint: str) -> dict:
    """API call with automatic retry on failure."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(endpoint)
        response.raise_for_status()
        return response.json()
```

### Batch Operations

```python
from typing import List
from pydantic import BaseModel

class BatchOperation(BaseModel):
    operation: str
    params: dict

class BatchResult(BaseModel):
    success: List[dict]
    failures: List[dict]

@mcp.tool()
async def batch_execute(operations: List[BatchOperation]) -> BatchResult:
    """Execute multiple operations in batch."""
    results = BatchResult(success=[], failures=[])

    for i, op in enumerate(operations):
        try:
            # Execute operation
            if op.operation == "create_file":
                result = await create_file(**op.params)
            elif op.operation == "delete_file":
                result = await delete_file(**op.params)
            else:
                raise ValueError(f"Unknown operation: {op.operation}")

            results.success.append({
                "index": i,
                "operation": op.operation,
                "result": result
            })
        except Exception as e:
            results.failures.append({
                "index": i,
                "operation": op.operation,
                "error": str(e)
            })

    return results
```

---

## Appendix: Quick Reference

### Common JSON-RPC Methods

| Method | Direction | Purpose |
|--------|-----------|---------|
| `initialize` | Client → Server | Start session, negotiate capabilities |
| `tools/list` | Client → Server | Get available tools |
| `tools/call` | Client → Server | Execute tool |
| `resources/list` | Client → Server | Get available resources |
| `resources/templates/list` | Client → Server | Get resource templates |
| `resources/read` | Client → Server | Read resource content |
| `resources/subscribe` | Client → Server | Monitor resource changes |
| `prompts/list` | Client → Server | Get available prompts |
| `prompts/get` | Client → Server | Get prompt with arguments |
| `sampling/createMessage` | Server → Client | Request LLM completion |
| `logging/setLevel` | Client → Server | Configure logging |
| `notifications/*/list_changed` | Server → Client | Notify capability changes |
| `notifications/resources/updated` | Server → Client | Notify resource updated |

### Tool Return Types

```python
# Simple text
return "Hello, world!"

# Structured with metadata
from mcp.types import CallToolResult, TextContent
return CallToolResult(
    content=[TextContent(type="text", text="Result")],
    structuredContent={"key": "value"},
    isError=False
)

# Multiple content blocks
return CallToolResult(
    content=[
        TextContent(type="text", text="Description"),
        ImageContent(type="image", data=base64_image, mimeType="image/png")
    ]
)
```

### Content Types

- `text` - Plain text
- `image` - Base64-encoded image (PNG, JPEG, etc.)
- `audio` - Base64-encoded audio
- `resource` - Reference to MCP resource
- `resource_link` - URI link to resource

### Transport Comparison

| Feature | stdio | HTTP |
|---------|-------|------|
| Use case | Local, development | Remote, production |
| Connection | Subprocess | Network |
| Multi-user | No | Yes |
| Authentication | OS-level | OAuth, tokens |
| Scaling | Single instance | Load balanced |
| Debugging | Direct logs | Network inspection |

### Best Practices Checklist

- [ ] Never write to stdout in stdio servers
- [ ] Use structured logging to stderr
- [ ] Validate all inputs with JSON Schema
- [ ] Implement rate limiting on all endpoints
- [ ] Use OAuth 2.1 for HTTP authentication
- [ ] Sanitize outputs before returning
- [ ] Provide clear error messages
- [ ] Use absolute paths in configuration
- [ ] Test with MCP Inspector before deployment
- [ ] Implement proper error handling
- [ ] Document all tools, resources, and prompts
- [ ] Use semantic versioning
- [ ] Monitor server performance and errors
- [ ] Implement request timeouts
- [ ] Use HTTPS in production

---

## Additional Resources

### Official Documentation
- **MCP Specification**: https://modelcontextprotocol.io/specification
- **Claude Code Docs**: https://code.claude.com/docs/en/mcp
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Python SDK**: https://github.com/modelcontextprotocol/python-sdk

### Tools and Utilities
- **MCP Inspector**: https://modelcontextprotocol.io/docs/tools/inspector
- **Example Servers**: https://github.com/modelcontextprotocol/servers
- **Awesome MCP Servers**: https://github.com/wong2/awesome-mcp-servers

### Community Resources
- **Discord**: https://discord.gg/anthropic
- **GitHub Discussions**: https://github.com/modelcontextprotocol/specification/discussions
- **Stack Overflow**: Tag `model-context-protocol`

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Protocol Version**: 2025-03-26
