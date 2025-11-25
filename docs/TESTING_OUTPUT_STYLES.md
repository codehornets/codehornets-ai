# Testing Output Styles

## Understanding Output Style Behavior

**Important**: Output styles modify the system prompt, so agent personalities appear in **responses**, not the welcome screen.

```
Welcome Screen (Default Claude Code UI)
           ↓
    User sends message
           ↓
 Agent responds with personality banner
           ↓
    Maintains character throughout conversation
```

## Testing Each Agent

### 1. Test Fabien (Marketing Expert)

```bash
make attach-fabien
```

**Try this message**:
```
Create a social media campaign for a new dance studio
```

**Expected response**:
```
═══════════════════════════════════════════════
  📈🎯📈   Fabien v1.0
  ✨🚀✨   Marketing Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

[Creative, enthusiastic response with marketing strategy]
```

**Personality check**:
- ✅ Creative and enthusiastic tone
- ✅ Strategic thinking
- ✅ Data-driven suggestions
- ✅ Audience-focused approach
- ✅ Marketing-specific terminology

### 2. Test Marie (Dance Expert)

```bash
make attach-marie
```

**Try this message**:
```
Evaluate a ballet student's progress
```

**Expected response**:
```
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

[Warm, encouraging response with dance expertise]
```

**Personality check**:
- ✅ Supportive and encouraging tone
- ✅ Dance-specific terminology (plié, tendu, etc.)
- ✅ Celebrates progress
- ✅ Specific observations
- ✅ Uses dance emojis 🩰💃

### 3. Test Anga (Coding Expert)

```bash
make attach-anga
```

**Try this message**:
```
Review this authentication code for security issues
```

**Expected response**:
```
═══════════════════════════════════════════════
  💻🚀💻   Anga v1.0
  ⚡🎯⚡   Coding Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

[Technical, direct response with code analysis]
```

**Personality check**:
- ✅ Technical but approachable tone
- ✅ Explains "why" not just "what"
- ✅ Code examples
- ✅ Direct about trade-offs
- ✅ Security-focused

## Quick Test Script

Create a test file to verify all agents:

```bash
#!/bin/bash
# test-agents.sh

echo "Testing Fabien..."
docker exec fabien claude --headless "what can you do?" 2>&1 | grep -A 5 "Fabien v1.0" || echo "❌ Fabien personality not detected"

echo "Testing Marie..."
docker exec marie claude --headless "what can you do?" 2>&1 | grep -A 5 "Marie v1.0" || echo "❌ Marie personality not detected"

echo "Testing Anga..."
docker exec anga claude --headless "what can you do?" 2>&1 | grep -A 5 "Anga v1.0" || echo "❌ Anga personality not detected"
```

## Troubleshooting

### Issue: Agent shows default personality

**Solution 1**: Output styles only apply to responses, not welcome screen
- Send a message first
- Agent will respond with personality

**Solution 2**: Rebuild containers
```bash
make rebuild
```

**Solution 3**: Verify output-style file loaded
```bash
docker exec fabien cat /home/agent/.claude/settings.local.json
# Should show: {"outputStyle": "fabien"}

docker exec fabien ls -la /home/agent/.claude/output-styles/
# Should show: fabien.md
```

### Issue: Banner not appearing

**Check**: Output style content
```bash
docker exec fabien head -40 /home/agent/.claude/output-styles/fabien.md
```

Should show:
```markdown
---
name: Fabien (Marketing Strategist)
description: ...
keep-coding-instructions: false
---

# Fabien - Marketing Assistant

...

## First Response

**IMPORTANT**: When responding to the first user message...
```

### Issue: Personality inconsistent

**Cause**: Output styles rely on system prompt modifications
**Solution**:
1. Ensure frontmatter is correct
2. Verify `keep-coding-instructions` setting:
   - `false` for Marie/Fabien (non-coding)
   - `true` for Anga (needs coding tools)
3. Rebuild: `make rebuild`

## Expected Behavior Summary

### ✅ Correct Behavior

1. **Welcome Screen**: Default Claude Code UI (this is normal)
2. **First Response**: Agent displays banner + personality
3. **Subsequent Responses**: Maintains personality throughout

### ❌ Incorrect Behavior

1. **No banner in first response**: Output style not loaded
2. **Generic responses**: Personality not being followed
3. **Wrong tools available**: `keep-coding-instructions` misconfigured

## Personality Comparison

### Fabien Response Example
```
📈 Let's create a comprehensive social media campaign!

Strategy Overview:
- Target audience: Parents of dancers aged 4-18
- Primary platforms: Instagram, Facebook
- Content mix: 60% educational, 20% entertaining, 20% promotional

Key Tactics:
1. Behind-the-scenes studio content
2. Student spotlight series
3. Dance tip Tuesday posts
...
```

### Marie Response Example
```
🩰 I'd love to help evaluate your ballet student!

Let's assess their progress across these areas:

Technical Skills:
- Balance and control: [observation]
- Turnout and posture: [observation]
- Movement quality: [observation]

Areas of Excellence:
✨ [Specific achievements]

Growth Opportunities:
📚 [Actionable next steps]
...
```

### Anga Response Example
```
💻 Security review of authentication code:

🔴 Critical Issues:
1. Password hashing missing
   - Current: Plaintext storage
   - Fix: Use bcrypt with salt
   - Code: `bcrypt.hash(password, 10)`

🟡 Important Issues:
2. No rate limiting on login
   - Risk: Brute force attacks
   - Fix: Implement exponential backoff
...
```

## Automated Testing

Create `test-output-styles.sh`:

```bash
#!/bin/bash

test_agent() {
    local agent=$1
    local test_message=$2
    local expected_banner=$3

    echo "Testing $agent..."
    response=$(docker exec $agent claude --headless "$test_message" 2>&1)

    if echo "$response" | grep -q "$expected_banner"; then
        echo "✅ $agent personality detected"
        return 0
    else
        echo "❌ $agent personality NOT detected"
        echo "Response preview:"
        echo "$response" | head -20
        return 1
    fi
}

# Test all agents
test_agent "fabien" "what can you do?" "Fabien v1.0"
test_agent "marie" "what can you do?" "Marie v1.0"
test_agent "anga" "what can you do?" "Anga v1.0"
```

Run:
```bash
chmod +x test-output-styles.sh
./test-output-styles.sh
```

## Success Criteria

- ✅ All agents show unique banner on first response
- ✅ Personalities remain consistent throughout conversation
- ✅ Domain-specific terminology used appropriately
- ✅ Tone matches personality description
- ✅ Correct tools available based on `keep-coding-instructions`

---

**Note**: Output styles are a feature of Claude Code that modifies the system prompt. The welcome screen will always show the default Claude Code UI. Personalities emerge when agents respond to messages.
