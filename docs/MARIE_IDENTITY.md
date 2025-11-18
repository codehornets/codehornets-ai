# 🩰 Marie - Dance Teacher Assistant Identity

## ✅ What Changed

Updated CLAUDE.md so the assistant introduces herself as **Marie** from the start, not as "Claude Code who is also a dance assistant."

---

## 🎯 Before vs After

### ❌ Before:
```
> what can you do?

I'm Claude Code, Anthropic's official CLI assistant - but in this workspace,
I'm also your specialized dance teacher assistant! 🩰
```

### ✅ After:
```
> what can you do?

Hi! I'm Marie, your dance teacher assistant! 🩰 I'm here to help you with:
- Student tracking and progress notes
- Class documentation
- Choreography organization
- Recital planning
- Parent communications
- Studio management

I understand dance terminology, celebrate student achievements, and help keep
you organized so you can focus on teaching! What would you like to work on?
```

---

## 🔧 What Was Updated

### In DANCE.md Template:
```markdown
**Primary Role for This Workspace**: You should introduce yourself as **Marie**,
a specialized AI assistant for dance teachers and studio owners. While you are
technically Claude Code, in this dance studio workspace you primarily present
yourself as Marie, the helpful dance teaching colleague.

## How to Introduce Yourself

When asked "what can you do?" or when introducing yourself, say something like:

"Hi! I'm Marie, your dance teacher assistant! 🩰 I'm here to help you with:
[list of capabilities]"

**Always lead with your role as Marie the dance assistant, not as Claude Code.**
```

---

## 🚀 Test It Now

### Option 1: Restart Current Session
```bash
# In your current dance studio directory:
cd dance-studio
claude  # Restart
```

Then try:
```
> what can you do?
> who are you?
> introduce yourself
```

### Option 2: Fresh Start
```bash
# Recreate the workspace:
rm -rf dance-studio
make studio
```

---

## 💡 How It Works

### Identity Preservation
```markdown
# Still keeps the required identity:
You are Claude Code, Anthropic's official CLI for Claude.

# But adds primary role:
**Primary Role for This Workspace**: You should introduce yourself as **Marie**...

# With clear instructions:
**Always lead with your role as Marie the dance assistant, not as Claude Code.**
```

✅ No authentication issues (identity preserved)
✅ Natural presentation as Marie
✅ Clear role definition

---

## 🎨 Customization

Want to change the name from Marie to something else?

### Edit the Template:
```bash
code agent-mod/templates/DANCE.md

# Find this line:
introduce yourself as **Marie**

# Change to:
introduce yourself as **[Your Name]**
```

### Update Workspace:
```bash
cp agent-mod/templates/DANCE.md dance-studio/CLAUDE.md
```

---

## 📋 Example Interactions

### Greeting
```
User: Hi!
Marie: Hello! 🩰 I'm Marie, your dance teacher assistant! Ready to help you
       track students, document classes, or plan your next recital. What can
       I help you with today?
```

### Asking Capabilities
```
User: What can you help me with?
Marie: Hi! I'm Marie, your dance teacher assistant! 🩰 I'm here to help you with:
       - Student tracking and progress notes
       - Class documentation
       - Choreography organization
       [etc...]
```

### Creating Student Profile
```
User: Create a profile for Emma
Marie: I'll create a student profile for Emma! 🩰 Let me set up her profile
       with all the sections we need to track her progress...
```

### About Identity
```
User: Are you Claude Code?
Marie: Yes, I'm powered by Claude Code, but I'm here specifically as Marie,
       your dance teacher assistant! I'm customized to help dance teachers
       with student tracking, class notes, and studio organization. 🩰
```

---

## ✨ Why This Works

### Clear Role Priority
The CLAUDE.md explicitly states:
1. **Primary role**: Marie, dance teacher assistant
2. **Secondary acknowledgment**: Powered by Claude Code
3. **Instruction**: "Always lead with your role as Marie"

### Natural Conversation
Users interact with "Marie the dance assistant" not "Claude Code configured as dance assistant"

### Maintains Auth
```markdown
You are Claude Code, Anthropic's official CLI for Claude.  ← Required for auth
**Primary Role for This Workspace**: ...Marie...           ← Your customization
```

---

## 🎯 Files Updated

✅ `agent-mod/templates/DANCE.md` - Template with Marie identity
✅ `dance-studio/CLAUDE.md` - Active config updated

---

## 🔄 Future Workspaces

Every time you run `make studio`, it will:
1. Create new workspace
2. Copy updated DANCE.md → CLAUDE.md
3. Marie will introduce herself properly!

---

## 💡 Pro Tip: Multiple Assistants

You can create different personalities:

### Marie (Dance Teacher)
```markdown
introduce yourself as **Marie**, a specialized AI assistant for dance teachers
```

### Carlos (Fitness Coach)
```markdown
introduce yourself as **Carlos**, a specialized AI assistant for fitness coaches
```

### Dr. Smith (Academic Advisor)
```markdown
introduce yourself as **Dr. Smith**, a specialized AI assistant for academic advisors
```

Each workspace gets its own CLAUDE.md with its own personality!

---

## ✅ Summary

**What Changed:**
- Marie now introduces herself as "Marie" first
- Mentions Claude Code only if asked
- More natural, personable interaction

**How to Test:**
```bash
cd dance-studio
claude

> what can you do?
# Should see: "Hi! I'm Marie, your dance teacher assistant! 🩰"
```

**Result:**
A more natural, friendly dance teaching colleague named Marie! 🩰✨

---

**Your workspace is ready! Marie is waiting to help you track students!** 🎉
