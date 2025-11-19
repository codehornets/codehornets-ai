# Customer Support Agents - Quick Reference Guide

## Import Statements

```python
# Import all agents
from support_specialist import SupportSpecialistAgent
from chatbot_manager import ChatbotManagerAgent
from knowledge_base_curator import KnowledgeBaseCuratorAgent
from escalation_coordinator import EscalationCoordinatorAgent
from satisfaction_tracker import SatisfactionTrackerAgent
from retention_specialist import RetentionSpecialistAgent
```

---

## Support Specialist - Quick Start

```python
agent = SupportSpecialistAgent()

# Create ticket
ticket = await agent.create_ticket({
    'customer_id': 'C123',
    'customer_name': 'John Doe',
    'customer_email': 'john@example.com',
    'subject': 'Cannot login',
    'description': 'Getting error when trying to login'
})
# Returns: ticket_id, priority, category, sentiment_score

# Track SLA
sla = await agent.track_sla(ticket['ticket_id'])
# Returns: response_sla, resolution_sla, escalation_needed

# Update status
await agent.update_ticket_status(ticket_id, 'resolved', notes="Fixed password")

# Get analytics
stats = await agent.get_analytics()
# Returns: total_tickets, status_distribution, sla_metrics
```

**Key Methods:**
- `create_ticket()` - Auto-classifies and routes
- `route_ticket()` - Manual or auto routing
- `track_sla()` - Check SLA compliance
- `escalate_ticket()` - Move to higher tier
- `get_analytics()` - Performance metrics

---

## Chatbot Manager - Quick Start

```python
agent = ChatbotManagerAgent()

# Start conversation
conv = await agent.start_conversation('user_123', channel='web')
# Returns: conversation_id, response

# Process messages
response = await agent.process_message(
    conv['conversation_id'],
    "I need help with my password"
)
# Returns: intent, response, should_escalate

# Add training data
await agent.add_training_data([
    {'text': 'reset password', 'intent': 'account_question'},
    {'text': 'refund please', 'intent': 'billing_question'}
])

# Get analytics
stats = await agent.get_conversation_analytics()
# Returns: total_conversations, resolution_rate, intent_distribution
```

**Key Methods:**
- `start_conversation()` - Initialize chat session
- `process_message()` - Handle user input
- `recognize_intent()` - Classify message
- `add_training_data()` - Improve recognition
- `optimize_intents()` - Get recommendations

---

## Knowledge Base Curator - Quick Start

```python
agent = KnowledgeBaseCuratorAgent()

# Create article
article = await agent.create_article({
    'title': 'How to Reset Password',
    'content': 'Step 1: Click Forgot Password...',
    'category': 'how_to',
    'author': 'admin',
    'tags': ['password', 'account']
})
# Returns: article_id, quality_metrics, keywords

# Search articles
results = await agent.search_articles('password reset', user_id='U123')
# Returns: results with relevance_score, excerpts

# Identify gaps
gaps = await agent.identify_content_gaps()
# Returns: missing topics, frequency, suggested_title

# Update article
await agent.update_article(
    article_id,
    {'content': 'Updated content...'},
    author='editor',
    change_summary='Added new steps'
)
```

**Key Methods:**
- `create_article()` - Add content with auto-analysis
- `search_articles()` - TF-IDF ranked search
- `identify_content_gaps()` - Find missing topics
- `update_article()` - Version-controlled updates
- `get_analytics()` - Usage statistics

---

## Escalation Coordinator - Quick Start

```python
agent = EscalationCoordinatorAgent()

# Calculate priority
priority = await agent.calculate_priority_score({
    'ticket_id': 'TKT-001',
    'severity': 'high',
    'affected_users': 50,
    'customer_tier': 'enterprise',
    'revenue_impact': 25000
})
# Returns: total_priority_score, component_scores, recommended_level

# Create escalation
escalation = await agent.create_escalation(
    'TKT-001',
    EscalationReason.SLA_BREACH,
    ticket_data
)
# Returns: escalation_id, escalation_level, assigned_team

# Escalate further
await agent.escalate_further(escalation_id, reason="Unresolved after 48hrs")

# Resolve
await agent.resolve_escalation(escalation_id, notes="Issue fixed")
```

**Key Methods:**
- `calculate_priority_score()` - Multi-factor scoring
- `create_escalation()` - Escalate with routing
- `escalate_further()` - Move to next level
- `resolve_escalation()` - Close escalation
- `get_analytics()` - Escalation metrics

---

## Satisfaction Tracker - Quick Start

```python
agent = SatisfactionTrackerAgent()

# Record survey
survey = await agent.record_survey_response({
    'survey_type': 'nps',
    'customer_id': 'C123',
    'score': 9,
    'feedback_text': 'Great service, very helpful!',
    'agent_id': 'A001'
})
# Returns: sentiment_score, sentiment_category, alerts_triggered

# Calculate NPS
nps = await agent.calculate_nps(days=30)
# Returns: nps_score, promoters, passives, detractors

# Calculate CSAT
csat = await agent.calculate_csat(days=30)
# Returns: csat_percentage, average_score

# Analyze trends
trends = await agent.analyze_trends(days=30)
# Returns: trend_direction, weekly_trends, sentiment_distribution

# Agent performance
perf = await agent.get_agent_performance(agent_id='A001')
# Returns: avg_score, response_count, avg_sentiment
```

**Key Methods:**
- `record_survey_response()` - Track satisfaction
- `calculate_nps()` - Net Promoter Score
- `calculate_csat()` - Customer Satisfaction
- `analyze_trends()` - Trend detection
- `get_agent_performance()` - Agent metrics

---

## Retention Specialist - Quick Start

```python
agent = RetentionSpecialistAgent()

# Predict churn
prediction = await agent.predict_churn_risk({
    'customer_id': 'C123',
    'engagement_score': 25,
    'satisfaction_score': 2.5,
    'last_interaction_days': 45,
    'lifetime_value': 5000,
    'tenure_days': 180,
    'support_ticket_count': 8,
    'payment_issues': 1,
    'feature_usage_score': 30
})
# Returns: churn_probability, risk_level, contributing_factors

# Create intervention
intervention = await agent.create_intervention(
    'C123',
    InterventionType.PROACTIVE_OUTREACH,
    auto_execute=True
)

# Create campaign
campaign = await agent.create_campaign({
    'name': 'Q4 Win-Back',
    'campaign_type': 'win_back_campaign',
    'target_segment': 'churned',
    'criteria': {'min_lifetime_value': 1000}
})

# Execute win-back
result = await agent.execute_win_back_campaign(campaign_id)

# Predict LTV
ltv = await agent.calculate_ltv_prediction('C123', customer_data)
# Returns: predicted_ltv, predicted_remaining_value
```

**Key Methods:**
- `predict_churn_risk()` - ML-ready prediction
- `create_intervention()` - Retention action
- `create_campaign()` - Target segment
- `execute_win_back_campaign()` - Mass outreach
- `calculate_ltv_prediction()` - Value forecast

---

## Common Patterns

### Error Handling
```python
result = await agent.method(params)
if result['success']:
    # Process successful result
    data = result['data']
else:
    # Handle error
    error_type = result['error_type']  # 'validation_error' or 'internal_error'
    error_msg = result['error']
```

### Configuration
```python
# Load with custom config
agent = AgentClass(config_path='/path/to/config.yaml')

# Or use defaults
agent = AgentClass()
```

### Analytics Pattern
```python
# All agents have get_analytics()
analytics = await agent.get_analytics()
# Returns: total_*, distribution, metrics, trends
```

---

## Enum Reference

### Support Specialist
```python
TicketPriority: CRITICAL, HIGH, MEDIUM, LOW, MINIMAL
TicketStatus: NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
TicketCategory: TECHNICAL, BILLING, ACCOUNT, BUG_REPORT, etc.
```

### Chatbot Manager
```python
IntentType: GREETING, HELP, PRODUCT_INQUIRY, TECHNICAL_SUPPORT, etc.
ConversationState: INITIATED, ACTIVE, RESOLVED, ESCALATED, etc.
```

### Escalation Coordinator
```python
EscalationLevel: TIER1, TIER2, TIER3, MANAGER, DIRECTOR, EXECUTIVE
EscalationReason: SLA_BREACH, COMPLEXITY, CUSTOMER_REQUEST, etc.
```

### Satisfaction Tracker
```python
SurveyType: CSAT, NPS, CES, POST_INTERACTION
SentimentCategory: VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE
NPSCategory: PROMOTER, PASSIVE, DETRACTOR
```

### Retention Specialist
```python
ChurnRiskLevel: CRITICAL, HIGH, MEDIUM, LOW, MINIMAL
InterventionType: PROACTIVE_OUTREACH, DISCOUNT_OFFER, etc.
CustomerStatus: ACTIVE, AT_RISK, CHURNED, RECOVERED
```

---

## Configuration Options

### Support Specialist (config.yaml)
```yaml
enable_auto_routing: true
enable_sla_tracking: true
default_response_time_hours: 4
default_resolution_time_hours: 24
max_escalation_level: 3
```

### Chatbot Manager
```yaml
min_confidence_threshold: 0.6
enable_learning: true
session_timeout_minutes: 30
fallback_to_human_threshold: 3
```

### Knowledge Base Curator
```yaml
min_quality_score: 3.0
min_readability_score: 60.0
max_search_results: 10
content_gap_threshold: 5
```

### Escalation Coordinator
```yaml
priority_score_threshold: 75.0
high_value_customer_threshold: 50000
auto_escalate_enabled: true
```

### Satisfaction Tracker
```yaml
csat_low_threshold: 3.0
nps_low_threshold: 30
sentiment_negative_threshold: -0.3
alert_enabled: true
```

### Retention Specialist
```yaml
churn_risk_threshold: 0.6
auto_intervention_enabled: true
min_engagement_score: 30.0
max_inactive_days: 30
```

---

## Performance Tips

1. **Batch Operations**: Process multiple items when possible
2. **Caching**: Agents cache frequently used data
3. **Async**: Use await for I/O operations
4. **Indexing**: Search uses inverted index for speed
5. **Thresholds**: Tune config for your use case

---

## Troubleshooting

**Q: Intent not recognized?**
- Add training data with `add_training_data()`
- Lower `min_confidence_threshold` in config
- Check for typos in training phrases

**Q: Search returns no results?**
- Ensure articles are published (not draft)
- Check if articles are indexed
- Try broader search terms

**Q: SLA always breaching?**
- Adjust `default_response_time_hours` in config
- Check priority calculation weights
- Review team capacity

**Q: Churn prediction low confidence?**
- Provide more customer data fields
- Ensure engagement_score is calculated
- Check tenure_days is populated

---

## File Paths Reference

```
Base: C:\workspace\@ornomedia-ai\digital-agency\agents\07_customer_support\

Agents:
- support_specialist/agent.py
- chatbot_manager/agent.py
- knowledge_base_curator/agent.py
- escalation_coordinator/agent.py
- satisfaction_tracker/agent.py
- retention_specialist/agent.py

Configs:
- {agent_name}/config.yaml

Docs:
- NEW_AGENTS_SUMMARY.md
- IMPLEMENTATION_REPORT.md
- QUICK_REFERENCE.md (this file)
```

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
