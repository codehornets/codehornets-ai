# Workflow Guide

## Overview

Workflows orchestrate the handoff of data and control between different domains in the Digital Agency Automation system.

## Workflow Architecture

### Five Core Workflows

1. **Offer → Marketing**: Product/service definition to marketing campaign
2. **Marketing → Sales**: Marketing leads to sales qualification
3. **Sales → Fulfillment**: Closed deals to project execution
4. **Fulfillment → Feedback**: Completed projects to feedback collection
5. **Feedback → Offer**: Client insights to product/service refinement

### Workflow Pattern

All workflows follow this pattern:

```python
1. Validate input data
2. Extract relevant information
3. Transform data for target domain
4. Create handoff package
5. Execute handoff
6. Return result
```

## Workflow Execution

### Using the Workflow Script

```bash
python scripts/run_workflow.py <workflow_name> \
  --input data/inputs/sample_data.json \
  --output data/outputs/result.json \
  --verbose
```

### Available Workflows

- `offer_to_marketing`
- `marketing_to_sales`
- `sales_to_fulfillment`
- `fulfillment_to_feedback`
- `feedback_to_offer`

## Workflow Details

### 1. Offer to Marketing Workflow

Transforms product/service offers into marketing campaign briefs.

**Input Data:**
```json
{
  "product_name": "Widget Pro",
  "target_audience": "Tech professionals aged 25-45",
  "value_proposition": "Streamline workflow with AI",
  "pricing_tier": "Premium - $99/month",
  "unique_selling_points": [
    "AI-powered automation",
    "24/7 customer support",
    "Money-back guarantee"
  ],
  "brand_guidelines": {
    "colors": ["#007AFF", "#5AC8FA"],
    "tone": "Professional yet approachable"
  },
  "marketing_budget": "$10,000",
  "launch_timeline": "Q2 2025"
}
```

**Output Data:**
```json
{
  "success": true,
  "workflow_id": "offer_to_marketing_123456",
  "handoff_data": {
    "marketing_brief": {
      "campaign_name": "Widget Pro_launch",
      "target_audience": "Tech professionals aged 25-45",
      "key_messages": ["AI-powered automation", ...],
      "campaign_objectives": ["Build awareness", ...],
      "budget_allocation": "$10,000"
    }
  },
  "next_step": "marketing_campaign_creation"
}
```

### 2. Marketing to Sales Workflow

Qualifies marketing leads and creates sales prospect briefs.

**Input Data:**
```json
{
  "campaign_id": "camp_123",
  "campaign_name": "Widget Pro Launch",
  "leads_generated": [
    {
      "id": "lead_001",
      "contact_info": {
        "name": "John Doe",
        "email": "john@example.com",
        "company": "Tech Corp"
      },
      "score": 85,
      "engagement_level": "high",
      "interests": ["automation", "AI"],
      "pain_points": ["manual processes"],
      "budget_indicator": "high",
      "urgency": "high"
    }
  ],
  "campaign_metrics": {
    "impressions": 50000,
    "clicks": 2500,
    "conversion_rate": 0.05
  }
}
```

**Output Data:**
```json
{
  "success": true,
  "workflow_id": "marketing_to_sales_123456",
  "handoff_data": {
    "sales_briefs": [
      {
        "prospect_id": "lead_001",
        "qualification_score": 85,
        "recommended_approach": "immediate_outreach_high_priority",
        "key_talking_points": [...],
        "next_actions": [...]
      }
    ],
    "qualified_leads_count": 1
  },
  "next_step": "sales_engagement"
}
```

### 3. Sales to Fulfillment Workflow

Converts closed deals into project work orders.

**Input Data:**
```json
{
  "deal_id": "deal_123",
  "status": "closed_won",
  "client_info": {
    "company_name": "Tech Corp",
    "primary_contact": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "tier": "enterprise"
  },
  "service_package": {
    "type": "web_development",
    "deliverables": [
      {
        "name": "Website Design",
        "description": "Custom website design",
        "estimated_days": 10,
        "estimated_hours": 80
      }
    ],
    "timeline": {
      "start_date": "2025-02-01",
      "end_date": "2025-03-15"
    }
  },
  "contract_terms": {
    "total_value": 50000,
    "payment_schedule": ["50% upfront", "50% on completion"]
  },
  "payment_status": "verified"
}
```

**Output Data:**
```json
{
  "success": true,
  "workflow_id": "sales_to_fulfillment_123456",
  "handoff_data": {
    "work_order": {
      "work_order_id": "WO_deal_123_...",
      "client_info": {...},
      "requirements": {
        "deliverables": [...],
        "milestones": [...],
        "resource_requirements": {...}
      },
      "priority": "high",
      "status": "pending_assignment"
    }
  },
  "next_step": "project_initiation"
}
```

### 4. Fulfillment to Feedback Workflow

Prepares feedback collection for completed projects.

**Input Data:**
```json
{
  "project_id": "proj_123",
  "work_order_id": "WO_123",
  "project_name": "Tech Corp Website",
  "client_info": {
    "company_name": "Tech Corp",
    "primary_contact": {...}
  },
  "deliverables_status": [
    {
      "name": "Website Design",
      "status": "completed",
      "completed_date": "2025-02-15T10:00:00Z",
      "client_approved": true
    }
  ],
  "start_date": "2025-02-01T00:00:00Z",
  "completion_date": "2025-02-15T00:00:00Z",
  "contract_value": 50000
}
```

**Output Data:**
```json
{
  "success": true,
  "workflow_id": "fulfillment_to_feedback_123456",
  "handoff_data": {
    "feedback_request": {
      "request_id": "FR_proj_123_...",
      "feedback_questions": [...],
      "rating_categories": [...],
      "collection_methods": [...]
    }
  },
  "next_step": "feedback_collection"
}
```

### 5. Feedback to Offer Workflow

Analyzes feedback to generate offer improvement recommendations.

**Input Data:**
```json
{
  "feedback_id": "fb_123",
  "project_id": "proj_123",
  "responses": [
    {
      "liked_most": "Professional team and great communication",
      "could_improve": "Faster turnaround time",
      "would_recommend": "yes",
      "future_services_interest": "ongoing support"
    }
  ],
  "ratings": {
    "overall_satisfaction": [5],
    "communication": [5],
    "timeliness": [4],
    "quality": [5],
    "value_for_money": [4]
  }
}
```

**Output Data:**
```json
{
  "success": true,
  "workflow_id": "feedback_to_offer_123456",
  "handoff_data": {
    "feedback_analysis": {
      "overall_sentiment": "very_positive",
      "client_satisfaction_score": 92,
      "key_strengths": ["Strong communication", ...],
      "improvement_areas": ["Optimize delivery timelines"]
    },
    "recommendations": {
      "service_adjustments": [...],
      "pricing_adjustments": {...},
      "new_service_opportunities": ["Ongoing support packages"]
    }
  },
  "next_step": "offer_refinement"
}
```

## Creating Custom Workflows

### Workflow Template

```python
from typing import Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CustomWorkflow:
    def __init__(self):
        self.workflow_id = None
        self.status = "initialized"
        self.handoff_data = {}

    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        # Validation logic
        return True

    def transform_data(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Transformation logic
        return {}

    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        self.workflow_id = f"custom_{datetime.utcnow().timestamp()}"

        try:
            if not self.validate_input(input_data):
                return {"success": False, "error": "Validation failed"}

            transformed_data = self.transform_data(input_data)

            self.handoff_data = {
                "workflow_id": self.workflow_id,
                "source_domain": "source",
                "target_domain": "target",
                "data": transformed_data,
                "handoff_timestamp": datetime.utcnow().isoformat()
            }

            self.status = "completed"

            return {
                "success": True,
                "workflow_id": self.workflow_id,
                "handoff_data": self.handoff_data
            }

        except Exception as e:
            self.status = "error"
            logger.error(f"Workflow failed: {e}")
            return {"success": False, "error": str(e)}
```

## Workflow Testing

### Unit Tests

```python
import pytest
from workflows.offer_to_marketing import OfferToMarketingWorkflow


def test_workflow_validation():
    workflow = OfferToMarketingWorkflow()
    valid_data = {
        "product_name": "Test Product",
        "target_audience": "Test Audience",
        "value_proposition": "Test Value",
        "pricing_tier": "Standard",
        "unique_selling_points": ["Point 1"]
    }
    assert workflow.validate_offer(valid_data) == True


def test_workflow_execution():
    workflow = OfferToMarketingWorkflow()
    result = workflow.execute(valid_data)
    assert result["success"] == True
    assert "handoff_data" in result
```

### Integration Tests

```python
def test_complete_workflow_chain():
    # Test Offer → Marketing
    offer_workflow = OfferToMarketingWorkflow()
    marketing_result = offer_workflow.execute(offer_data)

    # Use marketing result as input for next workflow
    # Test Marketing → Sales
    sales_workflow = MarketingToSalesWorkflow()
    sales_result = sales_workflow.execute(
        marketing_result["handoff_data"]["marketing_brief"]
    )

    assert sales_result["success"] == True
```

## Best Practices

### 1. Input Validation

Always validate input data before processing:

```python
def validate_input(self, data: Dict[str, Any]) -> bool:
    required_fields = ["field1", "field2"]
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing field: {field}")
            return False
    return True
```

### 2. Error Handling

Implement comprehensive error handling:

```python
try:
    result = self.process_data(data)
except ValueError as e:
    return {"success": False, "error": f"Invalid data: {e}"}
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    return {"success": False, "error": "Internal error"}
```

### 3. Logging

Log important workflow events:

```python
logger.info(f"Starting workflow {self.workflow_id}")
logger.debug(f"Processing data: {data}")
logger.warning(f"Low quality score detected")
logger.error(f"Workflow failed: {error}")
```

### 4. Idempotency

Ensure workflows can be safely retried:

```python
def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
    # Check if already processed
    if self.is_processed(input_data):
        return self.get_cached_result(input_data)

    # Process and cache result
    result = self.process(input_data)
    self.cache_result(input_data, result)
    return result
```

### 5. Monitoring

Track workflow metrics:

```python
from monitoring.metrics import MetricsCollector

metrics = MetricsCollector()
start_time = time.time()

result = workflow.execute(data)

metrics.record_workflow_execution(
    workflow_id=workflow.workflow_id,
    duration=time.time() - start_time,
    success=result["success"]
)
```

## Troubleshooting

### Common Issues

**Validation Failures:**
- Check input data format
- Verify required fields present
- Review data types

**Transformation Errors:**
- Inspect input data
- Check transformation logic
- Review error logs

**Handoff Failures:**
- Verify target domain availability
- Check network connectivity
- Review handoff data format
