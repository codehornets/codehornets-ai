# Agent Development Guide

## Overview

This guide explains how to develop, test, and deploy agents in the Digital Agency Automation system.

## Agent Structure

### Basic Agent Template

```python
class MyAgent:
    def __init__(self, model="gpt-4", temperature=0.7):
        self.agent_id = "unique_agent_id"
        self.name = "My Agent"
        self.domain = "domain_name"
        self.model = model
        self.temperature = temperature
        self.capabilities = ["capability1", "capability2"]
        self.tools = ["tool1", "tool2"]

    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        # Task execution logic
        pass

    def get_capabilities(self) -> List[str]:
        return self.capabilities

    def get_status(self) -> Dict[str, Any]:
        return {"agent_id": self.agent_id, "status": "active"}
```

## Creating a New Agent

### 1. Using the Scaffolding Tool

```bash
python scripts/create_agent.py
```

Follow the prompts to enter:
- Agent name
- Domain
- Description
- Capabilities
- Tools

### 2. Manual Creation

1. Create file in `domains/{domain}/agents/`
2. Implement required methods
3. Add agent to domain `__init__.py`
4. Create tests

## Agent Capabilities

### Defining Capabilities

Capabilities define what an agent can do:

```python
self.capabilities = [
    "text_generation",
    "data_analysis",
    "api_integration",
    "decision_making"
]
```

### Common Capabilities by Domain

**Offer Domain:**
- Product packaging
- Pricing strategy
- Value proposition creation

**Marketing Domain:**
- Campaign creation
- Content generation
- Audience targeting

**Sales Domain:**
- Lead qualification
- Proposal generation
- Follow-up automation

**Fulfillment Domain:**
- Project planning
- Resource allocation
- Deliverable creation

**Feedback Domain:**
- Survey creation
- Sentiment analysis
- Recommendation generation

## Agent Tools

### Built-in Tools

- `web_search`: Search the web
- `calculator`: Mathematical calculations
- `code_executor`: Execute code
- `api_caller`: Call external APIs
- `data_analyzer`: Analyze datasets

### Creating Custom Tools

```python
from typing import Dict, Any

class MyCustomTool:
    name = "my_custom_tool"
    description = "Description of what the tool does"

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Tool logic here
        return {"result": "tool output"}
```

## Task Execution

### Task Structure

```python
task = {
    "task_id": "unique_task_id",
    "type": "task_type",
    "description": "What to do",
    "input_data": {
        "key": "value"
    },
    "priority": "medium"
}
```

### Implementing execute_task()

```python
def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
    logger.info(f"Executing task: {task.get('type')}")

    try:
        # 1. Validate input
        self._validate_task_input(task)

        # 2. Process task
        result = self._process_task(task)

        # 3. Return result
        return {
            "success": True,
            "output": result,
            "completed_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Task failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        }
```

## Testing Agents

### Unit Tests

```python
import pytest
from domains.marketing.agents.campaign_creator import CampaignCreatorAgent

def test_agent_initialization():
    agent = CampaignCreatorAgent()
    assert agent.name == "Campaign Creator"
    assert agent.domain == "marketing"

def test_task_execution():
    agent = CampaignCreatorAgent()
    task = {
        "type": "create_campaign",
        "input_data": {"product": "Widget"}
    }
    result = agent.execute_task(task)
    assert result["success"] == True
```

### Integration Tests

```python
def test_agent_workflow_integration():
    # Test agent interaction with workflows
    pass
```

### Using the Test Script

```bash
# Basic test
python scripts/test_agent.py domains/marketing/agents/campaign_creator.py

# Interactive test
python scripts/test_agent.py -i domains/marketing/agents/campaign_creator.py

# Test with specific task
python scripts/test_agent.py -t '{"type":"test"}' domains/marketing/agents/campaign_creator.py
```

## Agent Configuration

### Configuration File

```python
# domains/marketing/config/agent_config.py

CAMPAIGN_CREATOR_CONFIG = {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000,
    "timeout": 300,
    "retry_attempts": 3
}
```

### Loading Configuration

```python
from domains.marketing.config.agent_config import CAMPAIGN_CREATOR_CONFIG

class CampaignCreatorAgent:
    def __init__(self):
        config = CAMPAIGN_CREATOR_CONFIG
        self.model = config["model"]
        self.temperature = config["temperature"]
```

## Best Practices

### 1. Error Handling

```python
def execute_task(self, task):
    try:
        # Task logic
        pass
    except ValueError as e:
        # Handle validation errors
        return {"success": False, "error": f"Invalid input: {e}"}
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return {"success": False, "error": "Internal error"}
```

### 2. Logging

```python
import logging
logger = logging.getLogger(__name__)

logger.info("Task started")
logger.debug(f"Processing data: {data}")
logger.warning("Potential issue detected")
logger.error("Task failed", exc_info=True)
```

### 3. Input Validation

```python
def _validate_task_input(self, task):
    required_fields = ["type", "description", "input_data"]
    for field in required_fields:
        if field not in task:
            raise ValueError(f"Missing required field: {field}")
```

### 4. Resource Management

```python
def execute_task(self, task):
    # Use context managers for resources
    with self.get_llm_client() as client:
        result = client.generate(task["input"])
    return result
```

### 5. Asynchronous Operations

```python
async def execute_task_async(self, task):
    # Use async for I/O operations
    result = await self.call_external_api(task["input"])
    return result
```

## Deployment

### Deploy to Development

```bash
python scripts/deploy_agent.py domains/marketing/agents/campaign_creator.py \
    --environment dev
```

### Deploy to Production

```bash
python scripts/deploy_agent.py domains/marketing/agents/campaign_creator.py \
    --environment prod \
    --version 1.0.0
```

## Monitoring Agents

### Metrics to Track

- Task completion rate
- Average execution time
- Error rate
- Resource usage

### Adding Custom Metrics

```python
from monitoring.metrics import MetricsCollector

metrics = MetricsCollector()
metrics.record_agent_activity(
    agent_id=self.agent_id,
    activity_type="task_completed",
    metadata={"duration": execution_time}
)
```

## Troubleshooting

### Common Issues

1. **Agent not responding**
   - Check agent status
   - Review logs
   - Verify resource availability

2. **Tasks timing out**
   - Increase timeout configuration
   - Optimize task processing
   - Check external API latency

3. **High error rate**
   - Review error logs
   - Check input validation
   - Verify external dependencies

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

agent = MyAgent()
agent.execute_task(task)  # Will print detailed debug logs
```

## Advanced Topics

### Multi-Agent Coordination

```python
class CoordinatorAgent:
    def __init__(self):
        self.agents = {
            "researcher": ResearchAgent(),
            "writer": WriterAgent(),
            "reviewer": ReviewAgent()
        }

    def execute_coordinated_task(self, task):
        # Distribute work across agents
        research = self.agents["researcher"].execute_task(task)
        content = self.agents["writer"].execute_task(research)
        final = self.agents["reviewer"].execute_task(content)
        return final
```

### State Management

```python
class StatefulAgent:
    def __init__(self):
        self.state = {}

    def execute_task(self, task):
        # Access and update state
        self.state["last_task"] = task
        result = self._process(task)
        self.state["last_result"] = result
        return result
```

### Continuous Learning

```python
def update_from_feedback(self, feedback):
    # Learn from feedback
    self.performance_history.append(feedback)
    self.adjust_parameters(feedback)
```
