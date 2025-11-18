# 🩰 Dance Teacher Assistant

**Transform Claude Code into your personal AI teaching assistant that helps you track students, document classes, and manage your dance studio.**

---

## 🎯 What It Does

Your AI assistant helps with:

- ✅ **Student Profiles** - Track skills, goals, learning styles
- ✅ **Progress Notes** - Document every breakthrough and challenge
- ✅ **Class Documentation** - Quick notes after each class
- ✅ **Choreography** - Organize combinations and recital pieces
- ✅ **Skill Tracking** - Monitor improvement across technical areas
- ✅ **Parent Communication** - Track updates and conversations
- ✅ **Recital Planning** - Organize performances from start to finish
- ✅ **Studio Management** - Schedules, tasks, and organization

---

## ⚡ Quick Start

### 1. Create the Assistant (5 minutes)

```bash
cd agent-mod

# Create general assistant
./transform.sh

# Create dance teacher version
./transform-dance-teacher.sh
```

### 2. Make ONE Manual Edit

Open `cli.dance-teacher.js`, find line ~399265, and replace the system prompt paragraph with the dance-focused version from **DANCE_TEACHER_QUICKSTART.md** (it's provided there ready to copy-paste).

### 3. Set Up Your Studio

```bash
mkdir dance-studio
cd dance-studio
node ../cli.dance-teacher.js
```

### 4. Create Your First Student

```
> Create a student profile for Emma Johnson, 12 years old,
  intermediate ballet and jazz, been dancing 3 years
```

**Done!** 🎉

---

## 📚 Documentation

### Getting Started
→ **DANCE_TEACHER_QUICKSTART.md** - 10-minute setup guide

### See It In Action
→ **DANCE_COMPLETE_EXAMPLE.md** - Full week of using the assistant

### Technical Details
→ **DANCE_TEACHER_COMPLETE_GUIDE.md** - Comprehensive setup

### Templates
→ **templates/** folder:
- `student-profile-template.md`
- `class-notes-template.md`
- `progress-log-template.md`

---

## 💡 Common Tasks

### Student Management

```bash
# Create new student
> Create a profile for Sophia Martinez, 13, advanced ballet

# Update skills
> Update Emma's flexibility rating to 5 stars

# Add progress note
> Add a note for Emma - she nailed her pirouettes today!

# Review student
> Show me Emma's progress this month
```

### Class Documentation

```bash
# Document class
> Take notes for today's intermediate ballet class

# Quick note
> Note that Mia was absent today (sick)

# Add observation
> Add to today's notes: Emma had a breakthrough with spotting
```

### Organization

```bash
# Plan recital
> Help me plan our spring recital on May 15

# Document choreography
> Start documenting our Nutcracker Snow Scene choreography

# Track progress
> Show me which students need progress updates
```

---

## 📁 File Structure

The assistant organizes everything for you:

```
dance-studio/
├── students/
│   ├── emma-johnson/
│   │   ├── profile.md
│   │   ├── progress-log.md
│   │   └── parent-notes.md
│   └── [other-students]/
├── class-notes/
│   └── 2024-11/
│       ├── 2024-11-15-intermediate-ballet.md
│       └── [other-classes].md
├── choreography/
│   ├── nutcracker-snow-scene.md
│   └── confident-jazz.md
└── recitals/
    └── spring-2025-dance-through-decades.md
```

---

## ✨ Key Features

### Comprehensive Student Profiles

Each student gets:
- Basic info (age, classes, experience)
- Skill ratings (flexibility, strength, turns, etc.)
- Goals (short-term and long-term)
- Strengths and growth areas
- Learning style notes
- Parent contact and communication tracking
- Detailed progress log

### Intelligent Progress Tracking

The assistant helps you:
- Notice patterns across classes
- Celebrate breakthroughs
- Identify when students need extra help
- Track skill improvement over time
- Prepare for parent meetings
- Set appropriate goals

### Quick Class Documentation

After class, just tell the assistant:
- Who was there
- What you worked on
- Individual observations
- What's next

It creates formatted, organized notes you can reference anytime.

### Recital Organization

Plan performances with:
- Piece tracking
- Choreography documentation
- Costume planning
- Rehearsal schedules
- Timeline management

---

## 🎨 Customization

### Add Your Teaching Style

Edit the system prompt to include your specific:
- Dance styles you teach
- Age groups you work with
- Studio policies
- Teaching philosophy

### Create Custom Commands

Add shortcuts like:
- `/student [name]` - Quick student lookup
- `/class` - Start class notes
- `/progress [name]` - Add progress note

See **DANCE_TEACHER_COMPLETE_GUIDE.md** for how to create these.

---

## 💬 Example Conversation

**You:** *Create a profile for Emma, 12, intermediate ballet and jazz*

**Assistant:**
```
I'll create Emma's profile! 🩰

*creates students/emma-johnson/profile.md*

Profile created with:
✅ Basic information
✅ Skill ratings (ready for you to customize)
✅ Goals section
✅ Strengths and growth areas
✅ Progress log initialized

What are Emma's current skill levels? Or should I help
you document today's class?
```

**You:** *Emma is very flexible, great musicality, but struggles with turns. Document today's ballet class - she had a breakthrough with spotting!*

**Assistant:**
```
Amazing! Let's capture this breakthrough! 🎉

*creates class-notes and updates Emma's progress log*

Documented:
✅ Class notes for today's intermediate ballet
✅ Emma's breakthrough with spotting highlighted
✅ Progress note added to her log with celebration
✅ Updated her turns rating trend

Should I draft an email to Emma's parents about this progress?
They'll love hearing about her breakthrough! 📧
```

---

## 🎯 Who Is This For?

Perfect for:
- 🩰 Dance teachers tracking multiple students
- 🏫 Studio owners managing classes
- 👯 Independent instructors staying organized
- 🎭 Choreographers documenting work
- 📊 Teachers who want better progress tracking

---

## 🚀 Benefits

**Save Time:**
- Quick documentation instead of lengthy note-taking
- Organized files you can find instantly
- Templates that maintain consistency

**Better Teaching:**
- Remember details about each student
- Track progress objectively
- Set appropriate goals
- Identify patterns

**Parent Communication:**
- Specific examples for updates
- Progress evidence
- Professional documentation

**Studio Organization:**
- Everything in one place
- Easy to search and review
- Professional record-keeping

---

## 📖 Learn More

**Quick Start:**
1. Read **DANCE_TEACHER_QUICKSTART.md** (10 min)
2. See **DANCE_COMPLETE_EXAMPLE.md** (see it in action)
3. Setup and start using! (5 min)

**Advanced:**
- **DANCE_TEACHER_COMPLETE_GUIDE.md** - Full technical details
- **templates/** - Copy these for your students

---

## 🎉 Success Story

> "I used to spend 30 minutes after each class trying to remember what happened with each student. Now I just talk to my assistant for 5 minutes and everything is documented beautifully. When parents ask about progress, I have specific examples ready. Game changer!"
>
> *- You, after one week using this! 😊*

---

## 🤝 Next Steps

1. **Setup** (5 min): Run the transformation scripts
2. **First Student** (5 min): Create your first profile
3. **First Class** (5 min): Document a class
4. **Explore** (ongoing): Discover features as you need them

**You'll be organized and tracking progress in 15 minutes!** 🚀

---

## ❓ Questions?

Check these docs:
- **Setup issues?** → DANCE_TEACHER_QUICKSTART.md
- **Want examples?** → DANCE_COMPLETE_EXAMPLE.md
- **Technical details?** → DANCE_TEACHER_COMPLETE_GUIDE.md
- **Templates?** → templates/ folder

---

**Ready to transform your dance teaching organization?** 🩰✨

Run: `./transform-dance-teacher.sh`

Then start creating student profiles and watch how much easier your teaching life becomes!
