# Prompts Structure - Domain vs Agent

**Date**: 2025-11-17
**Status**: FINAL STRUCTURE

---

## The Correct Separation

Your insight was spot-on! We now have a clean separation:

```
core/prompts/
├── domains/              # WHAT they know (expertise)
│   ├── DANCE.md         # Dance teaching knowledge
│   ├── CODING.md        # Software development knowledge
│   └── MARKETING.md     # Marketing knowledge
│
├── agents/              # WHO they are (personality + orchestration)
│   ├── Marie.md         # extends DANCE.md
│   ├── Anga.md          # extends CODING.md
│   └── Fabien.md        # extends MARKETING.md
│
└── orchestrator.md      # Orchestrator behavior
```

---

## Why This Structure?

### Problem Before

**One file did everything**:
- `DANCE.md` = Domain knowledge + Marie's personality + worker behavior
- Hard to reuse domain knowledge for different agents
- Hard to swap agents using same domain knowledge

### Solution Now

**Separation of concerns**:
- `domains/DANCE.md` = Pure dance teaching knowledge
- `agents/Marie.md` = Marie's personality + how she uses DANCE.md knowledge

**Benefits**:
- ✅ Want a different dance agent? Create `agents/Sophie.md` that extends `domains/DANCE.md`
- ✅ Want to add martial arts? Create `domains/MARTIAL_ARTS.md` and `agents/Bruce.md`
- ✅ Easy to maintain - update domain knowledge once, all agents benefit
- ✅ Clear structure - personality separate from expertise

---

## How It Works

### At Container Startup

Docker containers use `combine-prompts.sh` to merge agent + domain:

```bash
# In docker-compose.yml for Marie:
/prompts/combine-prompts.sh \
  /prompts/agents/Marie.md \
  /prompts/domains/DANCE.md \
  /workspace/CLAUDE.md
```

This creates a combined file:

```markdown
# Marie - Dance Teacher Assistant

**Agent Personality**: Marie, a helpful dance teacher assistant
**Domain Expertise**: Dance teaching (see domains/DANCE.md)

[... Marie's personality, behavior, worker mode ...]

---

# Domain Expertise (Imported)

[... All content from DANCE.md ...]
```

### Result

Marie gets:
- Her unique personality (warm, encouraging, organized)
- Her worker behavior (how to monitor tasks, execute, write results)
- All dance teaching knowledge (terminology, teaching strategies, evaluation protocols)

---

## File Contents

### domains/DANCE.md (11KB)

**Pure domain knowledge**:
- Dance terminology (plié, tendu, chassé, etc.)
- Dance styles (Ballet, Jazz, Contemporary, etc.)
- Skill categories (flexibility, strength, balance, etc.)
- Teaching strategies and best practices
- Student evaluation frameworks
- Choreography documentation methods
- Studio management principles

**No personality, no orchestration behavior - just knowledge.**

### agents/Marie.md (5.3KB)

**Personality + Orchestration**:
- "You are Marie, a dance teacher assistant"
- Session startup banner
- Communication style (warm, encouraging)
- Worker mode (how to monitor tasks, execute, write results)
- File organization preferences
- Integration with other agents
- Reference: "Import all domain knowledge from `../domains/DANCE.md`"

**No domain knowledge - just who Marie is and how she works.**

### The Combination

At runtime, these combine to give Marie:
1. Her personality and communication style
2. Her orchestration behavior (worker mode)
3. Complete dance teaching knowledge

---

## Adding New Agents

### Same Domain, Different Personality

Want another dance assistant with different style?

1. Create `agents/Carlos.md`:
```markdown
# Carlos - Dance Performance Coach

**Agent Personality**: Carlos, a high-energy performance coach
**Domain Expertise**: Dance teaching (see domains/DANCE.md)

You are Carlos, focused on performance excellence and stage presence...
[Different personality from Marie]

**Import all domain knowledge from**: `../domains/DANCE.md`
```

2. Update docker-compose.yml:
```yaml
carlos:
  command: >
    bash -c "
    /prompts/combine-prompts.sh /prompts/agents/Carlos.md /prompts/domains/DANCE.md /workspace/CLAUDE.md &&
    claude
    "
```

**Result**: Carlos has same dance knowledge as Marie, but different personality!

### New Domain, New Agent

Want to add a music teaching agent?

1. Create `domains/MUSIC.md`:
```markdown
# Music Teaching Domain

[All music teaching knowledge...]
```

2. Create `agents/Melody.md`:
```markdown
# Melody - Music Teacher Assistant

**Agent Personality**: Melody, a patient music instructor
**Domain Expertise**: Music teaching (see domains/MUSIC.md)

[Melody's personality and behavior...]

**Import all domain knowledge from**: `../domains/MUSIC.md`
```

3. Add to docker-compose.yml

**Result**: New domain, new agent!

---

## Maintenance Benefits

### Update Domain Knowledge

Change dance teaching best practices:

```bash
# Edit ONE file
vim core/prompts/domains/DANCE.md

# Restart containers
docker-compose restart marie carlos  # All agents using DANCE.md get update
```

### Update Agent Personality

Make Marie more formal:

```bash
# Edit ONE file
vim core/prompts/agents/Marie.md

# Restart container
docker-compose restart marie  # Only Marie changes
```

### Update Worker Behavior

Change how all agents monitor tasks:

```bash
# Edit agent files (orchestration section)
vim core/prompts/agents/Marie.md
vim core/prompts/agents/Anga.md
vim core/prompts/agents/Fabien.md

# Or create shared worker template they all import
```

---

## Comparison

### Before (Confusing)

```
prompts/
├── DANCE.md         # Everything mixed together
├── ANGA.md          # Everything mixed together
└── FABIEN.md        # Everything mixed together
```

**Problems**:
- Domain knowledge coupled with personality
- Hard to reuse knowledge for different agents
- Hard to maintain
- Not extensible

### After (Clear)

```
prompts/
├── domains/         # Reusable knowledge
│   ├── DANCE.md
│   ├── CODING.md
│   └── MARKETING.md
├── agents/          # Unique personalities
│   ├── Marie.md
│   ├── Anga.md
│   └── Fabien.md
└── combine-prompts.sh
```

**Benefits**:
- Clear separation of concerns
- Reusable domain knowledge
- Easy to extend (new agents, new domains)
- Easy to maintain (update one affects many or one)

---

## Real-World Example

### Scenario: Add Coding Reviewer

Want a strict code reviewer agent (different from Anga)?

**Step 1**: Create agent personality

```bash
cat > core/prompts/agents/CodeReviewer.md << 'EOF'
# Code Reviewer - Strict Quality Enforcer

**Agent Personality**: Strict, detail-oriented code reviewer
**Domain Expertise**: Software development (see domains/CODING.md)

You are a strict code reviewer focused on:
- Security vulnerabilities
- Performance issues
- Code standards compliance
- No compromises on quality

[Different from Anga - much stricter personality]

**Import all domain knowledge from**: `../domains/CODING.md`
EOF
```

**Step 2**: Add to docker-compose.yml

```yaml
code-reviewer:
  image: docker/sandbox-templates:claude-code
  container_name: code-reviewer
  command: >
    bash -c "
    /prompts/combine-prompts.sh /prompts/agents/CodeReviewer.md /prompts/domains/CODING.md /workspace/CLAUDE.md &&
    claude
    "
  volumes:
    - ./prompts:/prompts:ro
    - ./shared/auth-homes/code-reviewer:/home/agent/.claude:rw
    - ./shared/tasks/code-reviewer:/tasks:ro
    - ./shared/results/code-reviewer:/results:rw
```

**Step 3**: Authenticate and start

```bash
# Auth
docker run -it --rm \
  -v "$(pwd)/shared/auth-homes/code-reviewer:/home/agent/.claude" \
  docker/sandbox-templates:claude-code claude

# Start
docker-compose up -d code-reviewer
```

**Result**:
- CodeReviewer has same coding knowledge as Anga
- But completely different personality (strict vs. approachable)
- Orchestrator can choose which to use based on task

---

## Summary

**Your insight was correct!**

### domains/ (WHAT they know)
- Pure knowledge base
- Reusable across multiple agents
- Update once, benefit many
- Examples: DANCE.md, CODING.md, MARKETING.md

### agents/ (WHO they are)
- Unique personality
- Orchestration behavior (worker mode)
- Extends specific domain knowledge
- Examples: Marie.md extends DANCE.md

### combine-prompts.sh (HOW they merge)
- Runtime combination
- Agent personality + Domain knowledge = Complete agent
- Simple bash script
- Called by docker-compose on container start

**Clean, maintainable, extensible architecture!** 🎯

---

**Generated**: 2025-11-17
**Status**: Final structure implemented
**Ready for**: Deployment and testing
