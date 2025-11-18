# 🩰 Complete Rebranding: Claude Code → Marie

## 🎯 Goal
Transform Claude Code into Marie, the Dance Teacher Assistant, while maintaining API authentication.

---

## 🔧 What Gets Changed vs What Stays

### ✅ CHANGE (User-Facing)
- Banner/logo display
- Welcome messages
- Help text
- Version name
- All console output
- Error messages
- Command prompts

### ❌ KEEP (API Authentication)
- Core identity strings in system prompt sent to API
- Authentication headers
- API endpoints
- License validation

---

## 📋 Rebranding Checklist

### 1. Visual Banner (cli.js)

**Find:**
```javascript
console.log("  ▐▛███▜▌   Claude Code v2.0.42")
console.log("▝▜█████▛▘  Sonnet 4.5 · Claude Max")
```

**Replace with:**
```javascript
console.log("  🩰💃🩰   Marie v1.0")
console.log("  ✨🎭✨   Dance Teacher Assistant")
console.log("           Built on Claude Code v2.0.42")
```

### 2. Welcome/Help Messages

**Find all instances of:**
- "Claude Code" → "Marie"
- "Anthropic's official CLI" → "Dance Teacher Assistant"
- "software engineering" → "dance teaching"

**Keep in system prompt sent to API:**
```javascript
// DON'T TOUCH - Required for auth:
var ev0 = "You are Claude Code, Anthropic's official CLI for Claude."
```

### 3. Command Prompts

**Find:**
```javascript
prompt: "> "  // or similar
```

**Could change to:**
```javascript
prompt: "🩰 > "  // Marie's prompt
```

### 4. Error Messages

**Find:**
```javascript
"Error: Claude Code encountered..."
```

**Replace:**
```javascript
"Error: Marie encountered..."
```

### 5. CLAUDE.md Behavior

```markdown
You are Claude Code, Anthropic's official CLI for Claude.

**Your name is Marie.** You are a dance teacher assistant.

When introducing yourself, say:
"Hi! I'm Marie, your dance teacher assistant! 🩰"

Never mention "Claude Code" unless explicitly asked about your technical foundation.
```

---

## 🧪 Testing Before Full Rebranding

### Step 1: Test CLAUDE.md First
```bash
cd test-suite/test1-basic
claude
> banana
```

**Must see:** "🍌 TEST PASSED: CLAUDE.md is being read!"

**If fails:** CLAUDE.md doesn't work, need alternative

### Step 2: Test Banner Change is Safe
1. Find banner code
2. Change ONLY banner text
3. Test authentication still works
4. Verify no 401 errors

### Step 3: Gradual Rollout
1. Banner only
2. Add CLAUDE.md behavior
3. Update help/error messages
4. Full rebrand

---

## 🎨 Marie Branding Assets

### Banner Options

**Option 1: Emoji Logo**
```
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
```

**Option 2: ASCII Art**
```
  ╔═══════════════════════════╗
  ║  💃 Marie v1.0 🩰         ║
  ║  Dance Teacher Assistant  ║
  ╚═══════════════════════════╝
```

**Option 3: Simple**
```
Marie - Dance Teacher Assistant v1.0
Powered by Claude Code v2.0.42
```

### Prompt Style
```
🩰 >     (Marie's prompt)
```

### Loading Messages
```
"🩰 Marie is thinking..."
"✨ Organizing your studio files..."
"🎭 Creating student profile..."
```

---

## 🔍 Finding What to Change

### Search for User-Facing Strings

```bash
cd agent-mod

# Find banner
grep -n "Claude Code v" cli.readable.js

# Find welcome messages
grep -n "Welcome\|Hello\|Hi" cli.readable.js

# Find version strings
grep -n "version\|Version" cli.readable.js

# Find help text
grep -n "help.*Claude\|Claude.*help" cli.readable.js

# Find error messages
grep -n "Error.*Claude\|Claude.*error" cli.readable.js
```

### Identity Strings to KEEP

```bash
# These must NOT be changed (API auth):
grep -n "You are Claude Code, Anthropic" cli.readable.js

# Note the line numbers - DON'T TOUCH THESE!
```

---

## 📝 Makefile Integration

Update Makefile with Marie branding:

```makefile
# Marie - Dance Teacher Assistant

help:
	@echo "🩰 Marie - Dance Teacher Assistant"
	@echo ""
	@echo "Commands:"
	@echo "  make marie       - Launch Marie"
	@echo "  make studio      - Create dance studio workspace"
	@echo "  make test        - Test Marie configuration"

marie:
	@echo "🩰 Starting Marie, your dance teacher assistant..."
	@cd dance-studio && node ../agent-mod/cli.marie.js

studio:
	@echo "🏗️  Setting up dance studio for Marie..."
	@mkdir -p dance-studio/{students,class-notes,choreography,recitals}
	@cp agent-mod/templates/DANCE.md dance-studio/CLAUDE.md
	@echo "✅ Studio ready! Marie is waiting for you! 🩰"
```

---

## 🎯 Phased Rollout Plan

### Phase 1: CLAUDE.md Only (Safest)
- ✅ Keep original banner
- ✅ Change behavior via CLAUDE.md
- ✅ Marie introduces herself
- ✅ No code changes yet

**Test:** Does this work? User experience?

### Phase 2: Banner Rebranding
- ✅ Change banner to Marie
- ✅ Keep API identity intact
- ✅ Test authentication

**Test:** Any 401 errors?

### Phase 3: Full UI Rebranding
- ✅ Change all console messages
- ✅ Update help text
- ✅ Custom prompts
- ✅ Error messages

**Test:** Full user experience

### Phase 4: Polish
- ✅ Loading animations
- ✅ Color coding
- ✅ Custom ASCII art
- ✅ Sound effects (optional)

---

## 🚧 Known Challenges

### Challenge 1: Updates
**Problem:** Anthropic updates cli.js, loses our changes
**Solution:**
- Document all changes
- Create patch/diff file
- Script to reapply changes

### Challenge 2: Version Numbers
**Problem:** Marie v1.0 vs Claude Code v2.0.42
**Solution:**
```
Marie v1.0 (Built on Claude Code v2.0.42)
```

### Challenge 3: User Confusion
**Problem:** "Why does it say Claude Code in errors?"
**Solution:**
- Rebrand ALL user-facing text
- Only keep API identity strings

---

## 📄 File Structure for Rebranding

```
agent-mod/
├── cli.original.js          # Original from npm
├── cli.readable.js          # Beautified original
├── cli.marie.js             # Rebranded version
├── marie-changes.patch      # Diff of changes
├── apply-branding.sh        # Script to rebrand
└── templates/
    ├── DANCE.md             # Marie behavior config
    └── marie-banner.txt     # ASCII art
```

---

## 🔧 Quick Rebrand Script

```bash
#!/bin/bash
# apply-marie-branding.sh

echo "🩰 Applying Marie branding to cli.js..."

# Copy readable version
cp cli.readable.js cli.marie.js

# Change banner (find exact line numbers first!)
sed -i 's/Claude Code v2.0.42/Marie v1.0/' cli.marie.js
sed -i 's/Sonnet 4.5 · Claude Max/Dance Teacher Assistant/' cli.marie.js

# Change prompts (careful with this!)
# sed -i 's/prompt: "> "/prompt: "🩰 > "/' cli.marie.js

# Add note at top
sed -i '1i // Marie - Dance Teacher Assistant\n// Rebranded from Claude Code v2.0.42\n' cli.marie.js

echo "✅ Branding applied! Test with: node cli.marie.js"
```

---

## ✅ Verification Checklist

After rebranding, verify:

- [ ] Banner shows "Marie"
- [ ] Welcome message mentions dance teaching
- [ ] Authentication still works (no 401)
- [ ] CLAUDE.md is read and applied
- [ ] Help text is updated
- [ ] Error messages branded
- [ ] Version info shows Marie
- [ ] Links to documentation updated
- [ ] User never sees "Claude Code" (except technical notes)

---

## 🎯 Success Criteria

**Marie is successfully rebranded when:**

1. User launches → sees "Marie" banner
2. User asks "who are you?" → "I'm Marie, your dance teacher assistant"
3. User sees error → message says "Marie encountered..."
4. User types help → Marie-branded help text
5. BUT: API authentication still works perfectly
6. AND: System prompt still contains required identity strings

---

## 📊 Priority Order

1. **Test CLAUDE.md works** ← DO THIS FIRST
2. **Change banner only** ← Safe, visual only
3. **Add CLAUDE.md behavior** ← Marie personality
4. **Update help/messages** ← Full rebrand
5. **Polish & refine** ← Nice to have

---

## ⚡ Quick Start

```bash
# 1. Test CLAUDE.md (critical!)
cd test-suite/test1-basic
claude
> banana

# 2. If passes, locate banner code
cd agent-mod
grep -n "Claude Code v" cli.readable.js

# 3. Change banner
# Edit that line to say "Marie v1.0"

# 4. Test authentication
node cli.marie.js
# Try some commands, verify no 401

# 5. Add CLAUDE.md
cp templates/DANCE.md dance-studio/CLAUDE.md

# 6. Full rebrand
# Continue with all user-facing text
```

---

**Ready to rebrand?**

**Step 1: Run Test 1 to verify CLAUDE.md works!** 🧪
**Step 2: Find banner code!** 🔍
**Step 3: Rebrand safely!** 🩰
