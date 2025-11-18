# 🚀 Makefile Quick Reference

Your Makefile is now set up with easy commands to spin up the Dance Teacher Assistant!

---

## 🎯 Most Common Commands

### Option 1: Full Setup (Everything at Once)
```bash
make quick-setup
```
This does everything:
- ✅ Installs dependencies
- ✅ Copies and beautifies CLI
- ✅ Creates general assistant
- ✅ Creates dance teacher assistant
- Then just make one manual edit and you're done!

### Option 2: Step by Step
```bash
# 1. Setup dependencies
make setup

# 2. Create dance teacher assistant
make dance-teacher

# 3. (Make the one manual edit described in output)

# 4. Launch with workspace
make studio
```

### Option 3: Already Set Up - Just Run It
```bash
make studio
```
Creates workspace and launches the assistant!

---

## 📋 All Available Commands

### Setup Commands

```bash
make setup           # Install js-beautify
make beautify        # Beautify the original CLI
make assistant       # Create general AI assistant
make dance-teacher   # Create dance teacher assistant
make quick-setup     # Do everything at once!
```

### Run Commands

```bash
make run-assistant   # Run general AI assistant
make run-dance       # Run dance teacher assistant (no workspace)
make studio          # Create workspace + run dance assistant ⭐ BEST
```

### Utility Commands

```bash
make templates       # Show available templates
make docs            # List all documentation
make clean           # Remove generated files
make help            # Show help (default)
```

---

## 🎯 Typical Workflow

### First Time Setup

```bash
# 1. Run full setup
make quick-setup

# Output will show you what to do next:
# "Edit: agent-mod/cli.dance-teacher.js (one manual change)"

# 2. Make the one edit (takes 2 minutes)
# Open agent-mod/cli.dance-teacher.js
# Find line ~399265
# Replace system prompt (copy-paste from START_HERE.md)

# 3. Launch!
make studio
```

### Daily Use (After Setup)

```bash
# Just run this:
make studio
```

That's it! Your workspace is created and assistant launches.

---

## 📁 What `make studio` Does

```bash
make studio
```

Creates this structure:
```
dance-studio/
├── students/        # Student profiles and progress
├── class-notes/     # Daily class documentation
├── choreography/    # Choreography documentation
├── recitals/        # Performance planning
└── admin/           # Studio management
```

Then launches the Dance Teacher Assistant in that directory!

---

## 🧹 Clean Up

If you want to start fresh:

```bash
make clean           # Removes generated assistant files
make quick-setup     # Rebuild everything
```

---

## 💡 Pro Tips

**See what's available:**
```bash
make help       # Show all commands
make docs       # List documentation
make templates  # Show templates
```

**Quick access to docs:**
```bash
# After setup, read these:
cat agent-mod/START_HERE.md
cat agent-mod/DANCE_TEACHER_QUICKSTART.md
```

**Test before dance teacher:**
```bash
make run-assistant    # Test general assistant first
```

---

## 🎯 Recommended First Run

```bash
# Complete setup
make quick-setup

# Read the guide (2 minutes)
cat agent-mod/START_HERE.md

# Make one edit (2 minutes)
# Edit cli.dance-teacher.js line ~399265

# Launch!
make studio

# Try creating a student:
> Create a student profile for Emma Johnson, 12, intermediate ballet
```

**Total time: ~10 minutes from zero to working dance teacher assistant!**

---

## 🔍 What Each File Does

After running `make quick-setup`:

```
agent-mod/
├── cli.original.js          # Original from npm (unchanged)
├── cli.readable.js          # Beautified version (readable)
├── cli.assistant.js         # General AI assistant
├── cli.dance-teacher.js     # Dance teacher assistant ⭐
├── transform.sh             # General assistant script
├── transform-dance-teacher.sh  # Dance teacher script
├── templates/               # Student, class, progress templates
└── [documentation files]    # All the guides
```

---

## ❓ Troubleshooting

**Command not found:**
```bash
# Make sure you're in the project root
pwd  # Should show .../codehornets-ai

# Try:
make help
```

**"No such file or directory":**
```bash
# Run setup first:
make quick-setup
```

**Want to restart:**
```bash
make clean
make quick-setup
```

---

## 🎉 You're Ready!

**Quick setup and run:**
```bash
make quick-setup    # One time setup
# (make one edit)
make studio         # Daily use
```

That's all you need to know! The Makefile handles everything else.

**Happy teaching!** 🩰✨
