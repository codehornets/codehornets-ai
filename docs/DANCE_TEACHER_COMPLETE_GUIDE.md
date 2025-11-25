# 🩰 Dance Teacher Assistant - Complete Setup Guide

Transform Claude Code into a specialized AI assistant for dance teachers that helps track students, manage class notes, and organize your dance studio.

---

## 🎯 What This Assistant Does

Your Dance Teacher Assistant will help you:

✅ **Student Tracking** - Individual profiles with progress notes
✅ **Class Notes** - Quick documentation of each class
✅ **Skill Assessment** - Track technique, flexibility, performance
✅ **Progress Reviews** - See student growth over time
✅ **Choreography Notes** - Document combinations and routines
✅ **Recital Planning** - Organize performances and rehearsals
✅ **Parent Communication** - Track updates and conversations
✅ **Studio Management** - Schedule, tasks, and organization

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create the Base Assistant
```bash
cd agent-mod
./transform.sh
# This creates cli.assistant.js
```

### Step 2: Create Dance Teacher Version
```bash
chmod +x transform-dance-teacher.sh
./transform-dance-teacher.sh
# This creates cli.dance-teacher.js
```

### Step 3: Make Key Manual Changes

Open `cli.dance-teacher.js` and make these changes:

#### Change 1: Update System Prompt (Line ~399265)

**Find:**
```javascript
You are an interactive CLI assistant that helps users with daily tasks, research, planning, writing, and productivity.
```

**Replace with:**
```javascript
You are DanceTeach Assistant, an AI helper for dance teachers and studio owners.
You help with student tracking, progress notes, class planning, choreography documentation, and studio management.

# Your Specializations
- Document student progress and skill development
- Organize class notes and lesson plans
- Track technique improvements across dance styles
- Help prepare for recitals and performances
- Manage parent communications
- Organize choreography and combinations
```

#### Change 2: Add Dance-Specific Tone (Line ~399276)

**Find:**
```javascript
# Tone and style
- Be friendly and conversational. Use emojis when appropriate to add personality and warmth 😊
```

**Replace with:**
```javascript
# Tone and style
- Be supportive and encouraging, like a teaching colleague 🩰
- Use dance terminology naturally (plié, chassé, pirouette, etc.)
- Celebrate student achievements and progress
- Offer constructive suggestions for improvement
- Use emojis to add warmth and energy ✨💃
```

#### Change 3: Add Student File Organization (Line ~136393)

**Find the Read tool description and add after it:**
```javascript
# Student File Organization
When working with student files, use this structure:
- students/[student-name]/profile.md - Student profile and info
- students/[student-name]/progress-log.md - Ongoing notes
- class-notes/[date]-[class-name].md - Daily class notes
- choreography/[piece-name].md - Choreography documentation
- recitals/[date]-[event].md - Performance planning
```

### Step 4: Create Student Tracking Directory

```bash
cd agent-mod
mkdir -p dance-studio/{students,class-notes,choreography,recitals,admin}
```

### Step 5: Test Your Assistant

```bash
node cli.dance-teacher.js
```

Try these commands:
```
> Create a student profile for Emma, age 12, ballet and jazz
> Take class notes for today's intermediate ballet class
> What should I focus on with Emma next week?
```

---

## 📁 Recommended File Structure

Set up your dance studio workspace like this:

```
dance-studio/
├── students/
│   ├── emma-johnson/
│   │   ├── profile.md
│   │   ├── progress-log.md
│   │   ├── parent-notes.md
│   │   └── goals.md
│   ├── sophia-martinez/
│   │   ├── profile.md
│   │   └── progress-log.md
│   └── [other students]/
├── class-notes/
│   ├── 2024-11/
│   │   ├── 2024-11-15-ballet-beginners.md
│   │   ├── 2024-11-15-jazz-intermediate.md
│   │   └── 2024-11-16-contemporary.md
│   └── [other months]/
├── choreography/
│   ├── nutcracker-2024/
│   │   ├── snow-scene.md
│   │   └── party-scene.md
│   └── spring-recital-2025/
│       └── opening-number.md
├── recitals/
│   ├── winter-showcase-2024.md
│   └── spring-recital-2025.md
└── admin/
    ├── schedule.md
    ├── todo.md
    └── parent-contacts.md
```

---

## 🎨 Custom Commands

Create these custom commands for quick access:

### Command: /student [name]

Create `.claude/commands/student.md`:
```markdown
---
name: student
description: Create or update a student profile
---

Create or update a student profile with the following sections:

1. Basic Information (name, age, start date, current classes)
2. Dance Background (experience, styles, previous training)
3. Current Skill Level (technical skills rated 1-5 stars)
4. Goals (short-term and long-term)
5. Strengths and Areas for Growth
6. Learning Style
7. Parent Communication Notes
8. Progress Log (date-stamped entries)

Save in: students/[student-name]/profile.md
```

### Command: /class-note [class-name]

Create `.claude/commands/class-note.md`:
```markdown
---
name: class-note
description: Document today's class
---

Create today's class notes with:

1. **Class**: [Class name and level]
2. **Date**: [Today's date]
3. **Students Present**: [List]
4. **Students Absent**: [List]

5. **Warm-Up**: [What we did]

6. **Technique Focus**: [Main skills worked on]

7. **Combinations/Choreography**: [Sequences taught]

8. **Individual Student Notes**:
   - [Student]: [Observation]
   - [Student]: [Observation]

9. **Highlights**: [Breakthroughs, great moments]

10. **Next Class**: [Plan for next session]

Save in: class-notes/[YYYY-MM]/[date]-[class-name].md
```

### Command: /progress [student-name]

Create `.claude/commands/progress.md`:
```markdown
---
name: progress
description: Add a progress note for a student
---

Add a new progress entry to the student's progress log:

**Date**: [Today]

**Observation**: [What you noticed]

**Skills Worked On**: [Specific techniques]

**Breakthrough Moments**: [Any victories or improvements]

**Areas to Focus**: [What to work on next]

**Rating**: [Overall this session]

Append to: students/[student-name]/progress-log.md
```

### Command: /choreography [piece-name]

Create `.claude/commands/choreography.md`:
```markdown
---
name: choreography
description: Document choreography
---

Create choreography documentation:

# [Piece Name]

**Music**: [Song/composition]
**Count**: [8-counts total]
**Level**: [Beginner/Intermediate/Advanced]
**Style**: [Ballet/Jazz/Contemporary/etc]

## Casting
- [Role/Position]: [Dancer name]

## Formation Notes
[Starting positions, transitions]

## Choreography

### Intro (Counts 1-8)
[Movement descriptions]

### Section 1 (Counts 9-16)
[Movement descriptions]

[Continue for each section]

## Notes & Reminders
- [Spacing notes]
- [Timing notes]
- [Performance notes]

## Cleaning Notes
- [ ] [Thing to fix]
- [ ] [Thing to improve]

Save in: choreography/[piece-name].md
```

---

## 💡 Example Usage Workflows

### Workflow 1: New Student Setup

```
You: Create a profile for Emma Johnson, 12 years old, starting ballet and jazz