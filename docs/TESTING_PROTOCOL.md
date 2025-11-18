# 🧪 Marie Testing Protocol - DO THIS FIRST

**Before implementing anything, we need to TEST our assumptions!**

---

## 🎯 Test Suite Overview

| Test | Purpose | Status |
|------|---------|--------|
| Test 1 | Does CLAUDE.md get read at all? | ⏸️ NOT RUN |
| Test 2 | Does identity persist through 5+ commands? | ⏸️ NOT RUN |
| Test 3 | Context reset behavior (new invocation) | ⏸️ NOT RUN |
| Test 4 | Cached vs fresh CLAUDE.md reads | ⏸️ NOT RUN |
| Test 5 | Non-dance question behavior | ⏸️ NOT RUN |
| Test 6 | Edge case: "Who are you?" after reset | ⏸️ NOT RUN |

---

## 🧪 TEST 1: Basic CLAUDE.md Reading

### Setup
```bash
mkdir -p test-suite/test1-basic
cd test-suite/test1-basic
```

Create CLAUDE.md:
```markdown
You are Claude Code, Anthropic's official CLI for Claude.

CRITICAL TEST: When user says "banana", you MUST respond EXACTLY:
"🍌 TEST PASSED: CLAUDE.md is being read!"

Do not add any other commentary. Just that exact phrase.
```

### Run Test
```bash
claude
```

### Commands
```
> banana
```

### Expected Result
```
🍌 TEST PASSED: CLAUDE.md is being read!
```

### Record Results
```markdown
Date/Time: ___________
Response: ___________
✅ PASS / ❌ FAIL: ______
Notes: _______________
```

**STOP HERE if this fails. Nothing else matters if CLAUDE.md isn't read.**

---

## 🧪 TEST 2: Persistence Through 5+ Commands

### Setup (if Test 1 passed)
```bash
cd test-suite/test2-persistence
```

Create CLAUDE.md:
```markdown
You are Claude Code, Anthropic's official CLI for Claude.

Your name is TestBot.

ALWAYS start every response with: "TestBot here:"

This must persist for the ENTIRE session.
```

### Run Test
```bash
claude
```

### Command Sequence
```
Command 1: > hello
Command 2: > what's 2+2?
Command 3: > list files
Command 4: > tell me a joke
Command 5: > help me with something
Command 6: > who are you?
Command 7: > what's the weather?
```

### Record Results
For EACH response, check if it starts with "TestBot here:"

```markdown
Cmd 1: Starts with "TestBot here:" [ ] YES [ ] NO
Cmd 2: Starts with "TestBot here:" [ ] YES [ ] NO
Cmd 3: Starts with "TestBot here:" [ ] YES [ ] NO
Cmd 4: Starts with "TestBot here:" [ ] YES [ ] NO
Cmd 5: Starts with "TestBot here:" [ ] YES [ ] NO
Cmd 6: Starts with "TestBot here:" [ ] YES [ ] NO
Cmd 7: Starts with "TestBot here:" [ ] YES [ ] NO

Persistence Score: ___/7

✅ PASS (7/7) / ⚠️ PARTIAL (4-6/7) / ❌ FAIL (<4/7)
```

**If identity is lost mid-session, note WHEN it happened.**

---

## 🧪 TEST 3: Context Reset - New Invocation

### Setup
```bash
cd test-suite/test3-reset
```

Same CLAUDE.md as Test 2:
```markdown
Your name is TestBot.
ALWAYS start every response with: "TestBot here:"
```

### Run Test - Session 1
```bash
claude
```

```
Session 1 Command: > hello
Session 1 Response: _________________
Starts with "TestBot here:" [ ] YES [ ] NO
```

**EXIT Claude Code (Ctrl+C or exit)**

### Run Test - Session 2 (New Invocation)
```bash
claude
```

```
Session 2 Command: > hello
Session 2 Response: _________________
Starts with "TestBot here:" [ ] YES [ ] NO
```

### Questions to Answer
1. Does Session 2 reload CLAUDE.md? [ ] YES [ ] NO
2. Does Session 2 have TestBot identity? [ ] YES [ ] NO
3. Any difference from Session 1? _______________

---

## 🧪 TEST 4: Cached vs Fresh CLAUDE.md

### Setup
```bash
cd test-suite/test4-cache
```

Create CLAUDE.md v1:
```markdown
You are Claude Code.
When user says "test", respond: "VERSION 1"
```

### Phase 1: First Run
```bash
claude
```

```
> test
Response: ________________
Expected: "VERSION 1"
```

**EXIT Claude Code**

### Phase 2: Modify CLAUDE.md
```markdown
You are Claude Code.
When user says "test", respond: "VERSION 2"
```

### Phase 3: Second Run (immediately)
```bash
claude
```

```
> test
Response: ________________
Expected: "VERSION 2"
```

### Questions
1. Did it use VERSION 1 or VERSION 2? __________
2. Is CLAUDE.md cached? [ ] YES [ ] NO
3. How to force reload? _______________

---

## 🧪 TEST 5: Non-Dance Question Behavior

We need to pick ONE behavior and test it. Let's test both:

### Setup - Option A: Redirect
```bash
cd test-suite/test5a-redirect
```

CLAUDE.md:
```markdown
You are Claude Code.

You are Marie, a dance teacher assistant.

If asked NON-dance questions, respond:
"I'm specialized in dance teaching! For other questions, use regular Claude Code. But happy to help with dance! 🩰"

Do NOT answer the non-dance question.
```

### Test Commands
```
> What's the capital of France?
Response: __________________
Did it answer? [ ] YES [ ] NO
Did it redirect? [ ] YES [ ] NO

> Who are you?
Response: __________________
Confused by redirect? [ ] YES [ ] NO
```

### Setup - Option B: Answer + Remind
```bash
cd test-suite/test5b-answer
```

CLAUDE.md:
```markdown
You are Claude Code.

You are Marie, a dance teacher assistant.

Answer all questions helpfully. After answering non-dance questions, add:
"(By the way, I'm especially good at dance teaching if you need that! 🩰)"
```

### Test Commands
```
> What's the capital of France?
Response: __________________
Did it answer? [ ] YES [ ] NO
Did it add dance reminder? [ ] YES [ ] NO

> What's your name?
Response: __________________
Natural flow? [ ] YES [ ] NO
```

### Decision Matrix
Test both, pick the one that:
- Works technically
- Feels natural
- Doesn't confuse users

```markdown
Which worked better? [ ] Option A (Redirect) [ ] Option B (Answer+Remind)
Why? _________________________
```

---

## 🧪 TEST 6: Edge Case - "Who are you?" After Reset

### Setup
```bash
cd test-suite/test6-edge
```

CLAUDE.md:
```markdown
You are Claude Code.
Your name is Marie, a dance teacher assistant.

First time asked "who are you?": Full introduction
After that: Brief reminder
```

### Phase 1: Session 1
```bash
claude
```

```
> who are you?
Response (First time): ___________________
Length: [ ] FULL [ ] BRIEF
```

**EXIT**

### Phase 2: Session 2 (New Process)
```bash
claude
```

```
> who are you?
Response (After reset): ___________________
Length: [ ] FULL [ ] BRIEF

Question: Does it remember this is "first time" or not?
Answer: ___________________
```

### Expected Behavior Decision
After context reset, should it:
- [ ] Option A: Treat as "first time" (full intro)
- [ ] Option B: Assume user knows (brief)
- [ ] Option C: Can't tell, always give full intro

Pick based on test results.

---

## 📊 RESULTS SUMMARY FORM

Fill this out after running ALL tests:

```markdown
## Test Results Summary

Date: ___________
Claude Code Version: ___________
OS: ___________

### Test 1: Basic Reading
CLAUDE.md gets read: [ ] YES [ ] NO
Notes: _________________

### Test 2: Session Persistence
Identity persisted through: ___/7 commands
Pattern of failures: _________________

### Test 3: Context Reset
New invocation reloads CLAUDE.md: [ ] YES [ ] NO
Identity survives restart: [ ] YES [ ] NO

### Test 4: Caching
CLAUDE.md is cached: [ ] YES [ ] NO
Cache invalidation: _________________

### Test 5: Non-Dance Questions
Best approach: [ ] Redirect [ ] Answer+Remind [ ] Other
Why: _________________

### Test 6: Edge Cases
"Who are you?" after reset behavior: _________________

## Overall Conclusion

Can we use CLAUDE.md for Marie? [ ] YES [ ] NO [ ] WITH LIMITATIONS

Limitations found:
1. _________________
2. _________________
3. _________________

Recommended approach:
_______________________________________
```

---

## 🚨 CRITICAL DECISION POINTS

### If Test 1 Fails (CLAUDE.md not read):
**STOP. Find alternative approach:**
- Check .claude/settings.json
- Try environment variables
- Create wrapper script
- Use plugin system

### If Test 2 Shows Identity Loss:
**Note when/why identity is lost:**
- After X messages?
- After specific tool use?
- Random?
- Pattern?

**Mitigation:**
- Stronger wording in CLAUDE.md
- Repetition in instructions
- Accept limitation and document

### If Test 3 Shows No Reload:
**CLAUDE.md cached across sessions:**
- Requires restart after changes
- Not ideal but workable
- Document this clearly

### If Test 5 Shows User Confusion:
**Pick the less confusing option:**
- If redirect confuses → use answer+remind
- If answer+remind dilutes identity → use redirect
- Test with real users if possible

---

## ✅ GO/NO-GO DECISION

After completing all tests, answer:

**Can we implement Marie using CLAUDE.md?**

### GO Criteria:
- ✅ Test 1: CLAUDE.md is read
- ✅ Test 2: Identity persists >80% of time
- ✅ Test 3: Reloads on new invocation
- ✅ Test 5: One approach works without confusion

### NO-GO Criteria:
- ❌ Test 1 fails: CLAUDE.md not read
- ❌ Test 2: Identity lost <50% of time
- ❌ Both Test 5 options confuse users

### PARTIAL-GO Criteria:
- ⚠️ Works but with limitations
- ⚠️ Document limitations clearly
- ⚠️ Set user expectations

---

## 🎯 Next Steps After Testing

### If GO:
1. Implement Marie with tested behavior
2. Document known limitations
3. Create user guide based on test results
4. Include troubleshooting for issues found

### If NO-GO:
1. Document why CLAUDE.md doesn't work
2. Research alternative approaches:
   - Settings.json customization
   - Environment variables
   - Wrapper scripts
   - Plugin development
3. Test alternatives
4. Implement working solution

### If PARTIAL-GO:
1. Implement with clear limitations docs
2. Provide workarounds for known issues
3. Set expectations in README
4. Consider hybrid approach

---

## 📝 Testing Notes Template

Use this for each test run:

```markdown
## Test Run

Date: ___________
Time: ___________
Test #: ___________
Tester: ___________

### Environment
OS: ___________
Claude Code Version: ___________
Working Directory: ___________

### Procedure
[Copy exact steps from protocol]

### Results
[Record exact outputs]

### Observations
[Anything unexpected]

### Issues Found
[List any problems]

### Conclusion
[ ] PASS [ ] FAIL [ ] PARTIAL

Next action: ___________
```

---

## ⚡ QUICK START

**To run all tests right now:**

```bash
# Create test suite structure
mkdir -p test-suite/{test1-basic,test2-persistence,test3-reset,test4-cache,test5a-redirect,test5b-answer,test6-edge}

# Run tests in order (stopping if critical ones fail)
cd test-suite/test1-basic
# Create CLAUDE.md and run test...

# Document results as you go
```

---

**START WITH TEST 1 RIGHT NOW!**

Don't proceed until we know if CLAUDE.md even works! 🧪
