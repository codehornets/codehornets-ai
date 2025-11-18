# 🩰 Dance Teacher Assistant - Simple Setup

**The Clean Way - No Code Modification Required!**

---

## 🎯 How It Works

Instead of modifying Claude Code's source (which breaks authentication), we use **CLAUDE.md** - the official way to customize Claude Code's behavior!

```
You keep Claude Code unchanged ✓
CLAUDE.md tells it how to act for your project ✓
No 401 errors ✓
No manual code editing ✓
```

---

## ⚡ Setup (2 Commands)

```bash
# 1. Setup (creates templates)
make quick-setup

# 2. Launch!
make studio
```

**That's it!** No code editing needed! 🎉

---

## 🔧 What Happens

### When you run `make studio`:

1. **Creates workspace structure:**
```
dance-studio/
├── students/
├── class-notes/
├── choreography/
├── recitals/
└── admin/
```

2. **Copies DANCE.md → CLAUDE.md**
   - Contains all dance teacher instructions
   - Tells Claude Code how to help you
   - No code modification needed!

3. **Launches Claude Code**
   - Reads CLAUDE.md automatically
   - Behaves as dance teacher assistant
   - Full authentication works ✓

---

## 📋 What's in CLAUDE.md

The CLAUDE.md file tells Claude Code:

### Identity (Preserved)
```markdown
You are Claude Code, Anthropic's official CLI for Claude.

**Additional Role**: You are also a specialized assistant for
dance teachers and studio owners.
```
✅ Keeps the identity line (no auth errors!)
✅ Adds dance teacher role

### Dance Specialization
- Student tracking templates
- Class documentation format
- Choreography organization
- Skill rating system (⭐⭐⭐⭐⭐)
- Parent communication tracking
- Recital planning

### File Organization
- Automatic folder structure
- Naming conventions
- Template usage

### Behavior
- Use emojis for warmth 🩰
- Celebrate achievements 🎉
- Understand dance terminology
- Offer teaching insights

---

## 🚀 Usage Example

### Launch
```bash
make studio
```

### Try This
```
> Create a student profile for Emma Johnson, 12 years old,
  intermediate ballet and jazz. She's flexible but struggles with turns.
```

### Result
Claude Code will:
1. Read CLAUDE.md (knows it's helping a dance teacher)
2. Create `students/emma-johnson/profile.md`
3. Use the complete template with:
   - Skill ratings
   - Goals
   - Learning style
   - Progress log
4. All formatted perfectly!

---

## 💡 Why This is Better

### Old Way (What We Were Doing):
```javascript
// Modify CLI code:
var ev0 = "You are DanceTeach Assistant..." // ❌ Breaks auth!
```
**Problems:**
- 401 authentication errors
- Anthropic detects modification
- Breaks on updates
- Requires manual editing

### New Way (CLAUDE.md):
```markdown
# CLAUDE.md
You are Claude Code...

**Additional Role**: Dance teacher assistant
```
**Benefits:**
- ✅ No authentication issues
- ✅ Official customization method
- ✅ Version control friendly
- ✅ No code editing needed
- ✅ Works with updates

---

## 📁 Files Created

After `make studio`:

```
dance-studio/
├── CLAUDE.md            # ⭐ The magic file!
├── students/
├── class-notes/
├── choreography/
├── recitals/
└── admin/
```

**CLAUDE.md** is what makes it work!

---

## 🎨 Customization

Want to adjust the assistant's behavior?

```bash
# Edit the CLAUDE.md in your workspace:
code dance-studio/CLAUDE.md

# Or edit the template:
code agent-mod/templates/DANCE.md
```

Changes apply immediately on next run!

---

## 🔄 Update CLAUDE.md

```bash
# If you update the template:
cp agent-mod/templates/DANCE.md dance-studio/CLAUDE.md

# Or just run:
make studio
# (It copies the latest version)
```

---

## 📚 What You Get

### Student Management
- Complete profiles with skill tracking
- Progress logs with dates
- Parent communication notes
- Goals and learning styles

### Class Documentation
- Quick notes after teaching
- Attendance tracking
- Individual observations
- Next class planning

### Organization
- Recital planning
- Choreography documentation
- Professional file structure
- Easy searching

---

## 🎯 Commands Reference

```bash
make help          # Show all commands
make quick-setup   # One-time setup
make studio        # Launch assistant
make templates     # Show available templates
make docs          # List documentation
```

---

## ✨ Pro Tips

### Tip 1: Version Control
```bash
cd dance-studio
git init
git add CLAUDE.md
git commit -m "Initial dance studio setup"
```

Now your customization is version controlled!

### Tip 2: Multiple Studios
```bash
# Create different studios:
make studio  # Creates dance-studio

# Or manually:
mkdir ballet-studio
cp agent-mod/templates/DANCE.md ballet-studio/CLAUDE.md
cd ballet-studio && claude
```

### Tip 3: Customize Per Studio
Edit CLAUDE.md in each studio differently:
- ballet-studio/CLAUDE.md - Focus on ballet
- jazz-studio/CLAUDE.md - Focus on jazz
- competition-team/CLAUDE.md - Focus on competitions

---

## 🆘 Troubleshooting

### "Command not found: claude"
```bash
# Install Claude Code first:
npm install -g @anthropic-ai/claude-code
```

### "CLAUDE.md not found"
```bash
# Run from project root:
pwd  # Should show .../codehornets-ai
make studio
```

### Want to start fresh?
```bash
rm -rf dance-studio
make studio
```

---

## 🎓 How CLAUDE.md Works

Claude Code automatically:
1. Looks for `CLAUDE.md` in current directory
2. Reads it before starting
3. Applies instructions on top of base behavior
4. Uses it for all interactions in that workspace

**It's the official way to customize!**

---

## 🎉 You're Done!

```bash
# Setup (one time):
make quick-setup

# Launch (daily use):
make studio
```

Then just start creating student profiles!

**No code editing. No authentication errors. Just works!** ✨

---

## 📖 Learn More

- **agent-mod/templates/DANCE.md** - See the full configuration
- **MAKEFILE_USAGE.md** - All make commands
- **DANCE_COMPLETE_EXAMPLE.md** - Full week example

---

**Ready?** Run `make studio` now! 🚀
