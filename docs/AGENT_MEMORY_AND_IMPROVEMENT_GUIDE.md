# Agent Memory and Self-Improvement Guide

## The Problem

You're teaching an agent, don't want to repeat yourself, and want the agent to:
1. **Remember** previous interactions
2. **Improve** based on past conversations
3. **Build** on what was already taught
4. **Adapt** to your teaching style

## Solution: 4 Complementary Approaches

### Approach 1: Episodic Memory (Best for Cross-Session Memory)

**What it does**: Search and retrieve past conversations

**You already have this installed!**

#### Setup

Agent with episodic memory access:
```yaml
---
name: teaching-assistant
tools:
  - mcp__plugin_episodic-memory_episodic-memory__search
  - mcp__plugin_episodic-memory_episodic-memory__read
---
```

#### Usage Pattern

**Agent behavior**:
```typescript
// Before answering, search past conversations
search_memory({
  query: ["dance technique", "teaching"],
  limit: 5
})

// If found, read full context
read_conversation(match_path)

// Build on previous knowledge
respond_with_context(past + current)
```

**Example conversation flow**:

```
Day 1:
You: "Teach me about pirouette spotting"
Agent: [Detailed explanation]

Day 7:
You: "Still struggling with spotting"
Agent:
  → Searches: "spotting" + "pirouette"
  → Finds Day 1 conversation
  → "Last week we covered finding a focal point. Let's
     troubleshoot - are you picking your spot before you turn?"
  → Builds on previous, doesn't repeat
```

#### Configure Agent to Auto-Search

Add to agent instructions:
```markdown
## Memory Protocol

Before responding:
1. Search episodic memory for related past conversations
2. Review what was taught before
3. Build on previous knowledge
4. Never repeat what was already explained

Search query: [current_topic] + "teaching" + "lesson"
```

**Created**: `.claude/agents/learning-assistant.md` (includes this pattern)

---

### Approach 2: Update Agent Instructions (Best for Captured Learnings)

**What it does**: Permanently add learnings to agent's instructions

#### After Teaching Session

```bash
/update-agent teaching-assistant

What to update? Update Instructions
How? Append

New guidelines:
> When teaching pirouettes, always mention spotting first
> User learns best with visual analogies
> Use dance examples, not abstract concepts
> Break complex moves into 3 steps max
```

#### Result

Agent now **permanently** has this knowledge in its instructions.

Next session, it automatically applies these learnings without searching.

#### Best For

- Patterns that emerged over multiple sessions
- Your preferred teaching style
- Effective teaching methods discovered
- Common mistakes and how to address them

---

### Approach 3: Create Persistent Knowledge Base

**What it does**: Build reusable teaching resources

#### Create Reference Files

```bash
# After teaching a concept
Write("lessons/pirouette-spotting.md", `
# Pirouette Spotting Technique

## What Works for This Student
- Visual: "Eyes like a lighthouse beam"
- Kinesthetic: Practice with wall spot first
- Common mistake: Looking down instead of level

## Teaching Sequence
1. Find spot at eye level
2. Practice head isolation (body turns, head stays)
3. Add body rotation with snap

## Effective Exercises
- Wall spotting drill (5 min daily)
- Slow motion turns
- Partner mirror exercise
`)

# Agent reads this file at session start
Read("lessons/pirouette-spotting.md")
```

#### Agent Configuration

```yaml
---
name: teaching-assistant
tools:
  - Read
  - Write
---

# Teaching Assistant

## Session Start Protocol
1. Read: lessons/{current-topic}.md (if exists)
2. Build on documented knowledge
3. Update file with new learnings at session end
```

#### Structure

```
lessons/
├── pirouette-spotting.md       # Captured knowledge
├── balance-techniques.md       # What worked
├── common-mistakes.md          # Patterns observed
└── teaching-progressions.md    # Effective sequences
```

---

### Approach 4: SessionStart Hook (Auto-Load Context)

**What it does**: Automatically inject context every session

#### Create Hook

`.claude/settings.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": "cat lessons/teaching-context.md 2>/dev/null || true"
        }]
      }
    ]
  }
}
```

#### Context File

`lessons/teaching-context.md`:
```markdown
# Teaching Context

## Student Profile
- Learning style: Visual + kinesthetic
- Experience level: Intermediate
- Current focus: Pirouette technique
- Last session: Working on spotting

## Teaching Preferences
- Short explanations, more practice
- Use dance analogies, not abstract
- Break into max 3 steps
- Check understanding frequently

## Progress Tracking
- ✅ Basic spotting understood
- 🔄 Maintaining balance during turn
- ⏳ Multiple rotations (not started)

## Effective Methods
- Visual: "Lighthouse beam" analogy for spotting
- Practice: Wall drills before floor work
- Corrections: Positive reinforcement + specific fixes
```

**Agent automatically sees this every session start.**

---

## Complete Workflow: Memory + Improvement

### 1. During Teaching Session

**Agent behavior**:
```
1. Search episodic memory for past conversations
2. Read lesson files if they exist
3. Teach with context of what was covered before
4. Adapt based on what worked previously
```

### 2. After Teaching Session

**Document learnings**:

```bash
# Option A: Update agent instructions
/update-agent teaching-assistant
→ Append: "Student responds well to dance analogies"

# Option B: Update lesson files
Write("lessons/pirouette-spotting.md", updated_knowledge)

# Option C: Update context file
Edit("lessons/teaching-context.md",
  old: "🔄 Maintaining balance during turn",
  new: "✅ Maintaining balance during turn"
)
```

### 3. Next Session

**Agent automatically**:
- Searches past conversations (episodic memory)
- Reads lesson files (persistent knowledge)
- Loads context (SessionStart hook)
- Applies updated instructions (permanent learnings)

**You**: "Let's work on pirouettes"

**Agent**:
```
→ Searches memory: Finds 3 past conversations
→ Reads: lessons/pirouette-spotting.md
→ Loads: teaching-context.md (via hook)
→ Knows: Student learns via visual analogies
→ Responds: "Last time you mastered spotting with the lighthouse
   technique. Today let's add the balance component - imagine your
   standing leg is a tree trunk rooted to the floor..."
```

---

## Practical Example: Marie's Dance Teaching

### Setup (One Time)

1. **Create specialized agent**:
```bash
/create-agent dance-teacher

Model: sonnet
Tools:
  - Read
  - Write
  - mcp__plugin_episodic-memory_episodic-memory__search
  - mcp__plugin_episodic-memory_episodic-memory__read
Personality: Supportive, encouraging, specific
```

2. **Add memory protocol to instructions**:
```bash
/update-agent dance-teacher

Append:
> Before teaching, search episodic memory for past lessons
> Read lessons/{topic}.md files if they exist
> Build on previous knowledge, don't repeat
> Document what works in lesson files
> Update student progress after each session
```

3. **Create knowledge base structure**:
```bash
mkdir -p lessons/students lessons/techniques

# Context file
Write("lessons/teaching-context.md", `
# Dance Teaching Context

## Current Students
- Sarah: Intermediate ballet, working on pirouettes
- Alex: Beginner jazz, learning isolation techniques

## Teaching Style
- Supportive and encouraging
- Visual + kinesthetic demonstrations
- Max 3 steps per technique
- Frequent positive reinforcement

## Session Notes
[Updated after each session]
`)
```

4. **Add SessionStart hook**:
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "cat lessons/teaching-context.md 2>/dev/null && echo '\n---\nContext loaded for teaching session\n---' || true"
      }]
    }]
  }
}
```

### Usage Pattern

#### Session 1: Teaching Pirouettes

```
You: "Teach Sarah about pirouette spotting"

Agent:
  → Searches memory: No past conversations found
  → Provides comprehensive explanation
  → Documents approach in lessons/techniques/spotting.md
  → Updates lessons/teaching-context.md with progress
```

#### Session 2: Follow-up (Days Later)

```
You: "Sarah is still having trouble with spotting"

Agent:
  → Hook loads: teaching-context.md (knows Sarah's progress)
  → Searches memory: Finds Session 1 conversation
  → Reads: lessons/techniques/spotting.md
  → "Last week we covered finding a focal point and the lighthouse
     analogy. Let's troubleshoot - is she finding her spot before
     starting the turn, or during?"
  → Builds on previous, different angle
```

#### Session 3: New Concept

```
You: "Let's add multiple rotations for Sarah"

Agent:
  → Searches: "Sarah" + "pirouette" + "multiple rotations"
  → Reads: lessons/techniques/spotting.md
  → Reads: teaching-context.md (Sarah's progress)
  → "Great! Sarah has mastered single pirouettes with spotting.
     For multiples, we'll build on that spotting skill..."
  → Updates progress: Multiple rotations started
```

#### Session 4: Meta-Improvement

```
You: "That lighthouse analogy really works for Sarah"

Agent:
  → Updates: lessons/teaching-context.md
  → Adds: "Effective analogies: Lighthouse beam for spotting"
  → Updates agent instructions via /update-agent:
     "When teaching spotting, use lighthouse beam analogy"
  → Future sessions: Automatically uses this approach
```

---

## Comparison: Which Approach When?

| Approach | Best For | Persistence | Effort |
|----------|----------|-------------|--------|
| **Episodic Memory** | Cross-session context, "what did we discuss?" | Forever | Auto |
| **Update Agent** | Permanent behavior changes, teaching style | Forever | Manual |
| **Knowledge Base Files** | Structured knowledge, reference material | Forever | Manual |
| **SessionStart Hook** | Every-session context, student profiles | Forever | One-time |

### Recommended Combination

Use **all four**:

1. **Episodic Memory**: Auto-searches past conversations
2. **Agent Instructions**: Captures teaching style and preferences (update monthly)
3. **Knowledge Base**: Structured lessons and techniques (update after breakthroughs)
4. **SessionStart Hook**: Current context and progress (update weekly)

---

## Quick Start Template

### 1. Create Agent with Memory

```bash
/create-agent my-teacher

Tools:
  - Read
  - Write
  - mcp__plugin_episodic-memory_episodic-memory__search
  - mcp__plugin_episodic-memory_episodic-memory__read
```

### 2. Add Memory Instructions

```bash
/update-agent my-teacher

Append:
> ## Memory Protocol
>
> Before responding:
> 1. Search episodic memory for relevant past conversations
> 2. Read knowledge base files: lessons/{topic}.md
> 3. Build on previous knowledge
> 4. Document learnings after session
>
> Never repeat what was already taught.
> Always reference what was covered before.
```

### 3. Create Knowledge Base

```bash
mkdir -p lessons
cat > lessons/context.md << 'EOF'
# Teaching Context

## Student Profile
[Update as you learn]

## Teaching Preferences
[What works]

## Progress
[Current status]

## Effective Methods
[Proven techniques]
EOF
```

### 4. Add Auto-Load Hook

`.claude/settings.json`:
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "cat lessons/context.md 2>/dev/null || true"
      }]
    }]
  }
}
```

### 5. Use It

```typescript
// First session
Task(subagent_type="my-teacher", prompt="Teach me about X")

// Agent:
// - No memory found (first time)
// - Teaches concept
// - You document what worked

// Update knowledge base
Write("lessons/x-technique.md", "What worked: ...")

// Later sessions
Task(subagent_type="my-teacher", prompt="Help with X again")

// Agent:
// - Searches memory: Finds first session
// - Reads: lessons/x-technique.md
// - Loads: lessons/context.md (via hook)
// - Builds on previous knowledge
// - "Last time we covered Y, let's focus on Z"
```

---

## Self-Improvement Protocol

### Weekly

```bash
/update-agent my-teacher

Append:
> [Observation from this week]
> [Teaching method that worked]
> [Adjustment to make]
```

### Monthly

```bash
# Review all lessons
ls lessons/

# Identify patterns
grep "Effective" lessons/*.md

# Update agent permanently
/update-agent my-teacher

Full Upgrade:
  Apply latest learnings
  Optimize teaching sequence
  Update personality based on what works
```

---

## Example: Complete Iteration Cycle

### Week 1: Initial Teaching

```
Session: Teach concept X
Agent: Provides explanation A
Result: Student confused

Action: None (just observe)
```

### Week 2: Adjustment

```
Session: Teach concept X again
Agent:
  → Searches memory: Finds Week 1
  → Tries explanation B (different angle)
Result: Student understands!

Action: Document what worked
Write("lessons/concept-x.md", "Explanation B worked, not A")
```

### Week 3: Application

```
Session: Teach related concept Y
Agent:
  → Searches memory: Finds Weeks 1, 2
  → Reads: lessons/concept-x.md
  → Knows: Explanation B style works
  → Uses similar approach for Y
Result: Student understands first time

Action: Update agent permanently
/update-agent → "Use explanation B style for this student"
```

### Week 4: Automatic

```
Session: Teach new concept Z
Agent:
  → Searches memory: Rich context
  → Reads: lessons/*.md
  → Loads: Updated instructions (B style)
  → Automatically uses effective approach
Result: Efficient teaching, no repetition
```

---

## Summary

**Best approach for your use case**:

1. ✅ Use **learning-assistant** agent I created (has episodic memory built-in)
2. ✅ After sessions, update knowledge base files
3. ✅ Monthly, update agent instructions with learnings
4. ✅ Add SessionStart hook for auto-context

**Agent will**:
- Remember all past conversations (episodic memory)
- Build on previous lessons (knowledge base)
- Apply proven methods (updated instructions)
- Load context automatically (hook)

**You never repeat yourself. Agent always improves.**

---

**Try the learning-assistant agent**:
```typescript
Task(
  subagent_type="learning-assistant",
  prompt="Teach me about [topic]"
)
```

It's already configured with episodic memory and improvement protocols.
