# 🩰 Marie Quick Start - Complete Rebranding

## 🎯 Two Approaches

### Approach 1: CLAUDE.md Only (Safest - No Code Changes)
✅ Behavior is Marie
✅ No authentication issues
⚠️ Banner still says "Claude Code"

### Approach 2: Full Rebrand (Changes cli.js)
✅ Banner says "Marie"
✅ All text rebranded
⚠️ Risk of breaking auth
⚠️ Breaks on updates

---

## ⚡ Recommended: Start with Approach 1

### Step 1: Test CLAUDE.md Works
```bash
cd test-suite/test1-basic
claude
> banana
```

**Must see:** "🍌 TEST PASSED: CLAUDE.md is being read!"

### Step 2: Create Marie Workspace
```bash
make studio
```

This creates:
- `dance-studio/` workspace
- `CLAUDE.md` with Marie behavior
- Proper file structure

### Step 3: Launch Marie
```bash
cd dance-studio
claude
```

**Result:**
- Banner: Still says "Claude Code" (visual only)
- Behavior: Acts as Marie (from CLAUDE.md)
- Authentication: Works perfectly

---

## 🎨 Add Visual Marie Identity (Optional)

If you want the banner to say "Marie" too:

### Option A: Wrapper Command

Create `marie.sh`:
```bash
#!/bin/bash
clear
echo "  🩰💃🩰   Marie v1.0"
echo "  ✨🎭✨   Dance Teacher Assistant"
echo "           Powered by Claude Code"
echo ""
cd dance-studio && claude
```

Run with: `./marie.sh`

### Option B: Modify cli.js (Advanced)

```bash
cd agent-mod
chmod +x rebrand-to-marie.sh
./rebrand-to-marie.sh
```

**Test immediately:**
```bash
node cli.marie.js
# Verify no 401 errors!
```

---

## 📋 Complete Setup Commands

```bash
# 1. Quick setup
make quick-setup

# 2. Create studio
make studio

# 3. Test (in dance-studio)
claude
> what can you do?

# Should say: "Hi! I'm Marie..."
```

---

## ✅ Success Checklist

- [ ] CLAUDE.md test passed (banana test)
- [ ] Studio workspace created
- [ ] Marie introduces herself correctly
- [ ] No 401 authentication errors
- [ ] Student profiles can be created
- [ ] Class notes work properly

---

**Start here: Run Test 1!** 🧪

```bash
cd test-suite/test1-basic
claude
> banana
```
