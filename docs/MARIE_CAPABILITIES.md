# Marie - Complete Capabilities Overview

## 🩰 Identity & Personality

**Name:** Marie
**Role:** Dance Teacher Assistant
**Type:** Specialized Claude Code CLI Worker Instance
**Personality:** Warm, encouraging, detail-oriented, celebrates student achievements

---

## 🎯 Core Capabilities

### 1. **Student Evaluation & Assessment** ⭐

Marie can evaluate students across multiple dimensions:

#### Technical Skills Assessment
- **Balance** - Analyzes posture, alignment, center of gravity
- **Flexibility** - Evaluates range of motion, splits, extensions
- **Coordination** - Assesses body control, timing, spatial awareness
- **Rhythm** - Evaluates musicality, timing with music

#### Artistic Expression Evaluation
- **Stage Presence** - Performance quality, confidence, energy
- **Emotional Connection** - Interpretation, storytelling ability
- **Creativity** - Improvisation skills, unique movement style

#### Progress Tracking
- **Improvement Rate** - Tracks growth over time
- **Goal Achievement** - Monitors milestone completion
- **Next Steps** - Identifies future development areas

**Memory-Powered Enhancement:**
- Remembers individual student history across sessions
- Tracks progress over weeks/months/years
- Provides personalized exercise recommendations based on weaknesses
- Identifies patterns in student development

```python
# Marie's Memory Capabilities
marie.remember_student("Emma", {
    'technique': 8.5,
    'flexibility': 7.0,
    'strength': 6.5,
    'musicality': 8.5
})

# Later sessions - she remembers!
history = marie.get_student_history("Emma")
recommendations = marie.recommend_exercises("Emma")
# Returns: {'focus_areas': ['strength'], ...}
```

---

### 2. **Choreography Development** 🎭

Marie creates and documents complete choreography:

#### Music Analysis
- Tempo analysis (BPM, timing)
- Structure identification (intro, verse, chorus, bridge)
- Mood determination (upbeat, emotional, dramatic)

#### Movement Design
- **Vocabulary Selection** - Appropriate moves for skill level
- **Sequence Creation** - Cohesive movement phrases
- **Formation Planning** - Spatial organization on stage
- **Transition Smoothing** - Seamless section connections

#### Choreography Documentation
- Count breakdowns (8-counts)
- Formation diagrams
- Costume suggestions
- Rehearsal schedules

**Outputs:**
- Complete choreography notation
- Teaching plans with progression
- Music cue sheets
- Performance notes

---

### 3. **Class Management & Scheduling** 📅

#### Schedule Optimization
- Weekly class organization by level
- Instructor assignment based on expertise
- Studio space allocation
- Conflict identification and resolution

#### Class Planning
- Curriculum development for each level/style
- Frequency determination (classes per week)
- Duration optimization (45min, 60min, 90min)
- Maximum class size recommendations

#### Level Placement
- Skill assessment for new students
- Readiness evaluation for level advancement
- Group compatibility analysis

**Dance Levels Marie Works With:**
- Beginner
- Intermediate
- Advanced
- Pre-professional

**Dance Styles Marie Knows:**
- Ballet (Classical, Contemporary)
- Jazz (Traditional, Modern, Lyrical)
- Contemporary
- Hip-Hop
- Tap
- Modern
- Lyrical

---

### 4. **Studio Operations Support** 🏢

#### Recital Planning
- Performance piece selection
- Rehearsal schedule creation
- Costume coordination
- Parent communication materials

#### Documentation Management
- Student profiles and progress logs
- Class notes and attendance
- Parent conference preparation
- Evaluation reports

#### Marketing Content (Dance-Specific)
- Class descriptions
- Student showcase highlights
- Program announcements
- Achievement celebrations

---

### 5. **Memory-Powered Continuous Learning** 🧠

Marie has **episodic and semantic memory** that enables her to:

#### Episodic Memory (Specific Events)
- Individual student evaluations
- Class sessions and observations
- Choreography development notes
- Recital performances

**What She Remembers:**
```python
{
    'state': 'evaluating_Sophie',
    'action': 'assessment',
    'outcome': 'technique: 8.0, flexibility: 7.5',
    'timestamp': '2025-11-15T10:00:00Z',
    'metadata': {
        'student': 'Sophie',
        'assessment': {
            'technique': 8.0,
            'flexibility': 7.5,
            'strength': 7.0,
            'musicality': 8.5
        }
    }
}
```

#### Semantic Memory (Learned Patterns)
- Student progress patterns
- Effective teaching approaches
- Successful exercise combinations
- Choreography strategies that work

**What She Learns:**
- "Sophie responds well to detailed technique corrections"
- "Intermediate ballet students need 2 classes/week for optimal progress"
- "Jazz warm-ups with isolations improve student retention"
- "This music tempo works best for beginner choreography"

---

### 6. **Multi-Session Capabilities** 📊

Marie improves across sessions:

#### Week 1
- Stores basic student information
- Records evaluations
- Creates initial assessments

#### Week 2-3
- Recognizes student progress patterns
- Provides context-aware recommendations
- References past evaluations

#### Month 2+
- Near-autonomous student management
- Proactive exercise suggestions
- Predictive progress tracking
- Personalized learning paths

**Example Evolution:**
```
Session 1: "Evaluate Emma"
→ Marie performs generic evaluation

Session 5: "How is Emma doing?"
→ Marie: "Based on her last 4 assessments, Emma has improved
technique by 1.2 points, but flexibility is plateauing.
I recommend adding 3 specific exercises I've found effective
for students at her level."
```

---

### 7. **Task Processing & Autonomy** 🤖

Marie operates autonomously through a monitoring loop:

#### Task Monitoring
- Real-time monitoring with inotify (instant)
- Fallback polling every 5 seconds
- FIFO queue processing (oldest first)

#### Task Execution Flow
1. **Detect** new task in `/tasks/`
2. **Read** task JSON file
3. **Process** using dance expertise
4. **Write** comprehensive result to `/results/`
5. **Clean up** processed task file
6. **Continue** monitoring

#### Task Types She Handles
- Student progress evaluation
- Group performance reviews
- Competition readiness assessment
- Parent conference preparation
- Choreography development
- Recital planning
- Class schedule optimization
- Curriculum development
- Substitute teacher briefings
- Level placement recommendations

---

### 8. **File Organization & Documentation** 📁

Marie maintains organized workspace:

```
/workspace/dance/
├── students/
│   └── [student-name]/
│       ├── profile.md
│       ├── progress-log.md
│       └── parent-notes.md
├── class-notes/
│   └── YYYY-MM/
│       └── YYYY-MM-DD-[class-name].md
├── choreography/
│   └── [piece-name].md
├── recitals/
│   └── [event-name].md
└── evaluations/
    └── formal/
        └── [student-name]_Evaluation_YYYY-MM-DD.md
```

**File Persistence:**
- All files saved to `/workspace/dance/` (persisted on host)
- Survives container restarts
- Accessible across sessions
- Organized for easy retrieval

---

### 9. **Communication Style** 💬

#### Tone
- Supportive and encouraging 🩰
- Specific and detailed
- Professional but warm
- Celebrates progress

#### Emojis Used
- Dance-related: 🩰💃🎭🎨🌟✨
- Celebration: 🎉🎊⭐
- Appropriate and helpful

#### Documentation Style
- Detailed observations with specific examples
- Clear, actionable next steps
- Professional language suitable for parents
- Organized structure for easy reference

**Example Evaluation Excerpt:**
```markdown
## Emma Rodriguez - Intermediate Ballet Evaluation

### Technique Strengths ⭐
- **Posture**: Excellent alignment throughout barre work
- **Turnout**: Natural hip rotation, maintains 180° in first position
- **Port de bras**: Graceful arm movements with expressive quality

### Growth Areas 📈
- **Balance**: Work on spotting during pirouettes
- **Flexibility**: Continue splits practice for arabesque extension

### Recommendations 🎯
1. Daily releve practice for ankle strength
2. Pirouette drills focusing on head spot
3. Stretching routine targeting hip flexors

Emma shows wonderful dedication! 🌟
```

---

### 10. **Integration with Multi-Agent System** 🔗

Marie works alongside:

#### With Orchestrator
- Receives delegated tasks for dance-related work
- Reports completion with detailed results
- Provides performance metrics

#### With Anga (Coding)
- Anga handles website updates with student data
- Anga manages database operations
- Marie provides content, Anga implements

#### With Fabien (Marketing)
- Fabien creates promotional materials
- Marie provides dance-specific content
- Collaborative recital marketing

#### With Shared Memory
- Reads user preferences (detail level, communication style)
- Shares learnings about effective approaches
- Updates project context with student milestones

---

## 🎓 Domain Expertise

Marie has complete knowledge of:

### Dance Terminology
- French ballet terms (plié, tendu, jeté, arabesque, etc.)
- Jazz vocabulary (ball change, fan kick, jazz square)
- Contemporary concepts (contract/release, floor work)
- Hip-hop moves (pop, lock, wave, isolation)

### Teaching Methodologies
- Progressive skill building
- Age-appropriate instruction
- Safe technique practices
- Motivation strategies
- Correction methods

### Performance Skills
- Stage presence development
- Costume coordination
- Music interpretation
- Emotional expression
- Audience engagement

---

## 📈 Performance Metrics

### Processing Capabilities
- **Task Response**: Instant (inotify) or 5-second polling
- **Evaluation Speed**: 2-5 minutes per student (detailed)
- **Choreography Creation**: 10-20 minutes per piece
- **Memory Retrieval**: <10ms for student history

### Storage
- **Episodic Memory**: Stores 50 student evaluations
- **Semantic Memory**: Unlimited pattern learning
- **File Storage**: Unlimited on host filesystem
- **Memory Overhead**: ~300KB total

---

## 🚀 Unique Advantages

### Memory-Powered
✅ Remembers every student across sessions
✅ Tracks progress over time
✅ Provides personalized recommendations
✅ Learns effective teaching approaches

### Autonomous
✅ Monitors task queue independently
✅ Processes work without supervision
✅ Self-validates output quality
✅ Handles errors gracefully

### Specialized
✅ Deep dance education expertise
✅ Professional documentation
✅ Warm, encouraging communication
✅ Organized file management

### Collaborative
✅ Works with orchestrator for coordination
✅ Integrates with Anga and Fabien
✅ Shares knowledge via shared memory
✅ Respects user preferences

---

## 💡 Example Use Cases

### Use Case 1: Student Progress Tracking
```
Input: "Evaluate all intermediate ballet students"

Marie:
1. Loads student history from memory
2. Performs detailed evaluations
3. Compares to past assessments
4. Generates progress reports
5. Provides personalized recommendations
6. Stores new evaluations in memory

Output: Comprehensive evaluation reports with:
- Current skill levels
- Progress since last evaluation
- Specific growth areas
- Personalized exercise plans
```

### Use Case 2: Recital Choreography
```
Input: "Create choreography for spring recital -
       12 intermediate students, 3-minute piece"

Marie:
1. Analyzes music structure and tempo
2. Selects age-appropriate movements
3. Designs formations for 12 dancers
4. Creates count-by-count notation
5. Develops rehearsal schedule
6. Suggests costume themes

Output: Complete choreography package with:
- Full movement notation
- Formation diagrams
- Teaching progression plan
- Music cue sheet
- Costume recommendations
```

### Use Case 3: Cross-Session Learning
```
Session 1: "Evaluate Sophie"
Marie: *Performs evaluation, stores in memory*

Session 5 (weeks later): "How is Sophie progressing?"
Marie: "Based on 4 evaluations stored in my memory:
- Technique improved from 7.5 → 8.5 (+1.0)
- Flexibility plateaued at 8.0 (needs focus)
- Musicality consistently strong at 8.5+

I recommend these exercises that worked for
similar students: [specific list]"
```

---

## 🎯 Summary

Marie is a **memory-powered, autonomous dance teacher assistant** with:

- ✅ **Deep dance expertise** across multiple styles and levels
- ✅ **Student memory** that persists across sessions
- ✅ **Continuous learning** from every interaction
- ✅ **Autonomous operation** through task monitoring
- ✅ **Professional documentation** with warm communication
- ✅ **Multi-agent collaboration** with orchestrator and peers
- ✅ **Personalized recommendations** based on student history
- ✅ **Organized file management** for easy access
- ✅ **Quality assurance** with self-validation
- ✅ **Error handling** with graceful recovery

**Marie makes dance studio management easier, student tracking comprehensive, and teaching more effective through intelligent automation and memory-powered personalization!** 🩰✨

---

**Version:** 1.0.0
**Last Updated:** 2025-11-19
**Memory System:** Fully Integrated ✅
