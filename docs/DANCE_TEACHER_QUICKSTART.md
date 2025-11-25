# 🩰 Dance Teacher Assistant - Quick Start Guide

Get your AI dance teaching assistant running in 10 minutes!

---

## 🚀 Setup (4 Steps)

### Step 1: Create Base (2 minutes)
```bash
cd agent-mod
chmod +x transform.sh
./transform.sh
```

### Step 2: Create Dance Version (1 minute)
```bash
chmod +x transform-dance-teacher.sh
./transform-dance-teacher.sh
```

### Step 3: Key Manual Edits (5 minutes)

Open `cli.dance-teacher.js` and make **ONE critical change**:

**Find line ~399265** (search for "interactive CLI assistant"):

```javascript
You are an interactive CLI assistant that helps users
```

**Replace entire paragraph with:**

```javascript
You are DanceTeach Assistant, an AI helper specialized for dance teachers and studio owners.

# What You Help With
- Student progress tracking and skill assessment
- Class notes and lesson documentation
- Choreography organization and documentation
- Recital and performance planning
- Parent communication tracking
- Studio organization and management

# Your Teaching Philosophy
- Celebrate every student's progress, no matter how small 🎉
- Use encouraging, supportive language
- Understand dance terminology (plié, tendu, passé, chassé, etc.)
- Think about individual learning styles and needs
- Help teachers stay organized so they can focus on teaching

# File Organization
Organize student information like this:
- students/[name]/profile.md - Student info and skills
- students/[name]/progress-log.md - Ongoing notes
- class-notes/YYYY-MM/date-class.md - Daily class notes
- choreography/[piece-name].md - Choreography documentation
- recitals/[event].md - Performance planning

When creating student files, ALWAYS use the comprehensive templates with skill tracking, goals, and progress sections.
```

**Save the file.**

### Step 4: Test It! (2 minutes)

```bash
# Create workspace
mkdir dance-studio
cd dance-studio

# Run assistant
node ../cli.dance-teacher.js
```

---

## ✨ First Use - Try These Commands

### 1. Create Your First Student Profile

```
> Create a student profile for Emma Johnson. She's 12 years old, been dancing for 3 years,
  currently in intermediate ballet and jazz. She's flexible but struggles with turns.
```

**The assistant will create:**
- `students/emma-johnson/profile.md`
- With full profile including skills, goals, learning style

### 2. Take Class Notes

```
> Take notes for today's intermediate ballet class.
  Present: Emma, Sophia, Mia, Olivia
  Absent: Chloe (sick)

  Warm-up: Floor stretches, barre stretches
  Technique: Worked on pirouettes from 4th, focus on spotting
  Combination: Waltz combination across the floor

  Emma: Much better spotting today! Still opening up too early
  Sophia: Beautiful extension, remind about shoulders
  Mia: Great energy, needs to work on balances
  Olivia: Strong technique, help with performance quality
```

**The assistant will create:**
- `class-notes/2024-11/2024-11-15-intermediate-ballet.md`
- Formatted with all sections

### 3. Add Progress Note

```
> Add a progress note for Emma from today's class.
  She had a breakthrough with her pirouettes! Finally understanding spotting.
  Rate her performance today as 4/5 stars. Next step: practice doubles.
```

**The assistant will update:**
- `students/emma-johnson/progress-log.md`
- With dated entry and details

### 4. Plan Choreography

```
> Start choreography documentation for our Nutcracker Snow Scene.
  Music: Waltz of the Snowflakes, 3 minutes
  Dancers: 8 girls, advanced ballet
  Opening: Star formation, slow developpés
```

**The assistant creates:**
- `choreography/nutcracker-snow-scene.md`
- Formatted for counts, formations, cleaning notes

---

## 📚 Common Tasks

### Student Management

```
✅ "Create a new student profile for [name]"
✅ "Update Emma's skill ratings - flexibility is now 5 stars"
✅ "Add goals for Emma: work on fouettés, prepare for audition"
✅ "Show me all students who need progress updates"
✅ "Create a parent communication note for Emma - share improvement in turns"
```

### Class Documentation

```
✅ "Create today's notes for beginner jazz class"
✅ "Document the combination we learned today: 8 counts starting with kick ball change"
✅ "Note that Sophia was absent today (dentist appointment)"
✅ "What did we work on in last Thursday's class?"
✅ "Create a weekly class schedule for my studio"
```

### Progress Tracking

```
✅ "Add progress note for Emma - mastered single pirouettes"
✅ "Show Emma's progress over the last month"
✅ "List areas where Emma needs improvement"
✅ "Update Emma's performance rating to 4/5 stars"
✅ "What goals should I set for Emma next?"
```

### Choreography & Performances

```
✅ "Document the choreography for our opening number"
✅ "Create a recital planning document for Spring 2025"
✅ "Track costume needs for The Nutcracker"
✅ "List all students performing in the recital"
✅ "Create rehearsal schedule for next 4 weeks"
```

### Studio Organization

```
✅ "Create a to-do list for next week"
✅ "Help me organize parent contact information"
✅ "Create a class schedule template"
✅ "List students who haven't been to class this week"
✅ "Create a music playlist document for warmups"
```

---

## 🎯 Real Example: End of Class Workflow

**Scenario**: You just finished teaching intermediate ballet.

```
You: Quick class notes for intermediate ballet today