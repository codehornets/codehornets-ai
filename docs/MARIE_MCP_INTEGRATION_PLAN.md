# Marie - MCP Integration Plan
## Dance Teaching Assistant Enhanced Capabilities

**Date**: 2025-11-18
**Version**: 1.0
**Status**: Design & Implementation Ready

---

## Executive Summary

This document outlines a comprehensive Model Context Protocol (MCP) integration plan to enhance Marie's capabilities as a dance teaching assistant. The plan leverages existing MCP servers and proposes custom implementations to provide video analysis, music processing, calendar management, student database operations, and professional document generation.

**Current State**: Marie has Read, Write, Bash, Grep, and Episodic-memory MCP
**Target State**: Marie has 5 additional MCP integrations for comprehensive dance teaching support

---

## Table of Contents

1. [Proposed MCP Integrations](#proposed-mcp-integrations)
2. [MCP Server Configurations](#mcp-server-configurations)
3. [Integration Architecture](#integration-architecture)
4. [Workflow Examples](#workflow-examples)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Security Considerations](#security-considerations)
7. [Testing Strategy](#testing-strategy)

---

## Proposed MCP Integrations

### 1. Video Analysis - Custom MCP Server
**Purpose**: Analyze dance performance videos for technique feedback
**Status**: Custom implementation required
**Priority**: HIGH

**Capabilities**:
- Frame extraction at key moments (jumps, turns, landings)
- Pose estimation for technique analysis
- Movement tracking and comparison
- Rhythm/timing analysis against music
- Progress tracking across multiple videos

**Use Cases**:
- Technique corrections for online students
- Competition preparation analysis
- Progress documentation for parent conferences
- Virtual audition evaluation
- Form comparison (before/after)

**Implementation Approach**: Custom Node.js MCP server using:
- FFmpeg for video processing
- MediaPipe/OpenPose for pose estimation
- Custom dance-specific analysis algorithms

---

### 2. Music/Audio Processing - mcp-audio-inspector
**Purpose**: Analyze music for choreography planning
**Status**: Existing server available
**Priority**: HIGH

**Capabilities**:
- BPM (tempo) detection
- Beat/measure identification
- Song structure analysis (intro, verse, chorus, bridge, outro)
- Audio quality assessment
- Metadata extraction

**Use Cases**:
- Choreography planning (matching moves to beats)
- Music editing for recital pieces
- Identifying 8-count sections
- Verifying competition music requirements
- Creating practice tracks with counts

**MCP Server**: `developerzo-mcp-audio-inspector`

---

### 3. Calendar/Scheduling - google-workspace-mcp
**Purpose**: Manage class schedules, recitals, and deadlines
**Status**: Existing comprehensive server
**Priority**: MEDIUM

**Capabilities**:
- Class schedule management
- Recital planning and coordination
- Competition deadline tracking
- Studio booking management
- Parent-teacher conference scheduling
- Recurring class pattern management
- Substitute teacher coordination

**Use Cases**:
- Weekly class schedule optimization
- Recital rehearsal calendar
- Competition registration deadlines
- Private lesson scheduling
- Studio room allocation
- Costume fitting appointments

**MCP Server**: `google_workspace_mcp` (includes Calendar, Drive, Docs, Sheets)

---

### 4. Student Database - mcp-sqlite
**Purpose**: Advanced querying and management of student records
**Status**: Existing server available
**Priority**: MEDIUM

**Capabilities**:
- Complex student queries (by level, age, style)
- Progress tracking over time
- Skill assessment storage
- Parent contact management
- Attendance tracking
- Financial records (tuition, costumes)

**Database Schema Design**:
```sql
-- Students table
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE,
  enrollment_date DATE,
  current_level TEXT,
  primary_style TEXT,
  notes TEXT
);

-- Classes table
CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT,
  level TEXT,
  day_of_week TEXT,
  time TEXT,
  instructor TEXT
);

-- Enrollments (many-to-many)
CREATE TABLE enrollments (
  student_id INTEGER,
  class_id INTEGER,
  enrollment_date DATE,
  status TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(class_id) REFERENCES classes(id)
);

-- Evaluations
CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  date DATE,
  evaluator TEXT,
  technique_score INTEGER,
  musicality_score INTEGER,
  performance_score INTEGER,
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

-- Attendance
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  class_id INTEGER,
  date DATE,
  status TEXT, -- present, absent, excused
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(class_id) REFERENCES classes(id)
);

-- Choreography assignments
CREATE TABLE choreography_assignments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER,
  piece_name TEXT,
  role TEXT,
  rehearsal_start DATE,
  performance_date DATE,
  FOREIGN KEY(student_id) REFERENCES students(id)
);
```

**MCP Server**: `jparkerweb/mcp-sqlite` or `modelcontextprotocol/sqlite`

---

### 5. Document Generation - google-workspace-mcp
**Purpose**: Professional reports, evaluations, and communications
**Status**: Existing server (same as Calendar)
**Priority**: HIGH

**Capabilities**:
- Student evaluation reports (Google Docs)
- Progress tracking charts (Google Sheets)
- Parent communication letters
- Recital programs
- Competition documentation
- Studio policies and handbooks

**Document Templates**:
- Student Evaluation Report
- Parent Conference Summary
- Recital Program Template
- Class Progress Report
- Competition Registration Form
- Studio Policy Document

**MCP Server**: `google_workspace_mcp` (includes Docs, Sheets, Slides)

---

## MCP Server Configurations

### Complete `.mcp.json` Configuration

```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    },

    "marie-video-analysis": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/anga/workspace/beta/codehornets-ai/mcp-servers/video-analysis/index.js"],
      "env": {
        "VIDEO_STORAGE_PATH": "/workspace/dance/videos",
        "ANALYSIS_OUTPUT_PATH": "/workspace/dance/analysis",
        "FFMPEG_PATH": "/usr/bin/ffmpeg",
        "MODEL_PATH": "/models/dance-pose-estimation"
      }
    },

    "audio-inspector": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-audio-inspector"],
      "env": {
        "AUDIO_STORAGE_PATH": "/workspace/dance/music",
        "ANALYSIS_CACHE_PATH": "/workspace/dance/music-analysis"
      }
    },

    "google-workspace": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@taylorwilsdon/google-workspace-mcp"],
      "env": {
        "GOOGLE_CLIENT_ID": "${GOOGLE_CLIENT_ID}",
        "GOOGLE_CLIENT_SECRET": "${GOOGLE_CLIENT_SECRET}",
        "GOOGLE_REDIRECT_URI": "http://localhost:3000/oauth2callback",
        "GOOGLE_CALENDAR_ID": "${DANCE_STUDIO_CALENDAR_ID}",
        "GOOGLE_DRIVE_FOLDER": "Dance Studio Files"
      }
    },

    "student-database": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@jparkerweb/mcp-sqlite"],
      "env": {
        "SQLITE_DB_PATH": "/workspace/dance/students.db",
        "READONLY": "false",
        "MAX_QUERY_RESULTS": "1000"
      }
    }
  }
}
```

---

## Integration Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Marie (Claude Code CLI)                   │
│                     Dance Teaching Assistant                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ MCP Protocol
                      │
          ┌───────────┴────────────┐
          │                        │
┌─────────▼─────────┐    ┌────────▼────────────┐
│  Built-in Tools   │    │   MCP Servers       │
│                   │    │                     │
│  • Read           │    │  1. Video Analysis  │
│  • Write          │    │  2. Audio Inspector │
│  • Bash           │    │  3. Google Workspace│
│  • Grep           │    │  4. Student Database│
│  • Episodic Memory│    │  5. Task Master     │
└───────────────────┘    └─────────────────────┘
          │                        │
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    File System & External Services               │
│                                                                  │
│  /workspace/dance/                Google Services:               │
│    ├── videos/                    • Google Calendar             │
│    ├── music/                     • Google Drive                │
│    ├── students/                  • Google Docs                 │
│    ├── evaluations/               • Google Sheets               │
│    └── students.db                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow for Common Operations

#### Student Evaluation Workflow
```
1. Task arrives: "Evaluate Emma's ballet progress"
2. Marie reads student data from SQLite (student-database MCP)
3. Marie retrieves evaluation history from /workspace/dance/students/emma/
4. Marie analyzes recent performance video (video-analysis MCP)
5. Marie generates evaluation report (google-workspace MCP - Docs)
6. Marie updates student database (student-database MCP)
7. Marie schedules parent conference (google-workspace MCP - Calendar)
8. Marie writes result to /results/
```

#### Choreography Planning Workflow
```
1. Task arrives: "Create choreography for intermediate jazz recital"
2. Marie analyzes music file (audio-inspector MCP)
3. Marie queries students by level and style (student-database MCP)
4. Marie creates choreography document (google-workspace MCP - Docs)
5. Marie schedules rehearsals (google-workspace MCP - Calendar)
6. Marie writes result to /results/
```

---

## Workflow Examples

### Example 1: Video-Based Technique Analysis

**Task Input**:
```json
{
  "task_id": "task-1732012345-abc123",
  "worker": "marie",
  "description": "Analyze Emma's pirouette technique from recent video",
  "context": {
    "student_name": "Emma Rodriguez",
    "video_path": "/workspace/dance/videos/emma-pirouettes-2025-11-15.mp4",
    "skill": "pirouette",
    "style": "ballet"
  }
}
```

**Marie's Workflow**:
```javascript
// 1. Read task
const task = Read("/tasks/task-1732012345-abc123.json");

// 2. Analyze video using MCP
const analysis = mcp_video_analysis.analyze_dance_video({
  video_path: task.context.video_path,
  focus_areas: ["balance", "spotting", "arms", "landing"],
  comparison_reference: "ballet_pirouette_standard"
});

// 3. Query student history from database
const studentHistory = mcp_student_database.query({
  sql: `SELECT * FROM evaluations
        WHERE student_id = (SELECT id FROM students WHERE name = 'Emma Rodriguez')
        AND notes LIKE '%pirouette%'
        ORDER BY date DESC LIMIT 5`
});

// 4. Generate detailed feedback
const evaluation = {
  technique_analysis: {
    spotting: {
      score: analysis.spotting_score,
      observations: "Head spotting is quick and precise",
      improvement: "Maintain focus point throughout entire turn"
    },
    balance: {
      score: analysis.balance_score,
      observations: "Center alignment is strong",
      improvement: "Engage core more during preparation"
    },
    arms: {
      score: analysis.arm_position_score,
      observations: "Arm position is classical and clean",
      improvement: "Soften elbows slightly in fifth position"
    }
  },
  progress_notes: "Significant improvement from last evaluation (3 months ago)",
  next_steps: [
    "Practice double pirouettes",
    "Work on pirouettes en dehors",
    "Add turns from fourth position"
  ]
};

// 5. Create professional report using Google Docs
const reportDoc = mcp_google_workspace.create_document({
  title: "Emma Rodriguez - Pirouette Technique Analysis - Nov 2025",
  template: "student_evaluation_template",
  content: formatEvaluationReport(evaluation)
});

// 6. Update student database
mcp_student_database.execute({
  sql: `INSERT INTO evaluations (student_id, date, evaluator, technique_score, notes)
        VALUES (
          (SELECT id FROM students WHERE name = 'Emma Rodriguez'),
          '2025-11-15',
          'Marie (AI Assistant)',
          ${evaluation.overall_score},
          '${JSON.stringify(evaluation)}'
        )`
});

// 7. Write result
Write("/results/task-1732012345-abc123.json", {
  task_id: task.task_id,
  worker: "marie",
  status: "complete",
  findings: {
    summary: "Emma shows strong pirouette technique with specific areas for refinement",
    details: evaluation
  },
  artifacts: [
    {
      type: "evaluation_report",
      path: reportDoc.url,
      description: "Professional evaluation report in Google Docs"
    },
    {
      type: "video_analysis",
      path: "/workspace/dance/analysis/emma-pirouettes-2025-11-15.json",
      description: "Detailed video analysis data"
    }
  ]
});
```

---

### Example 2: Recital Choreography Planning

**Task Input**:
```json
{
  "task_id": "task-1732012400-def456",
  "worker": "marie",
  "description": "Create choreography for Spring Recital intermediate jazz group",
  "context": {
    "music_file": "/workspace/dance/music/recital-2025-jazz-piece.mp3",
    "student_level": "intermediate",
    "style": "jazz",
    "group_size": "8-12 students",
    "performance_date": "2025-05-15"
  }
}
```

**Marie's Workflow**:
```javascript
// 1. Analyze music
const musicAnalysis = mcp_audio_inspector.analyze_audio({
  file_path: task.context.music_file,
  analysis_type: "comprehensive"
});

// BPM: 128
// Structure: Intro (8 counts) -> Verse (32) -> Chorus (32) -> Verse (32) -> Chorus (32) -> Bridge (16) -> Chorus (32) -> Outro (8)
// Total: 192 counts (96 measures)

// 2. Query eligible students
const students = mcp_student_database.query({
  sql: `SELECT s.name, s.current_level, e.technique_score
        FROM students s
        JOIN enrollments en ON s.id = en.student_id
        JOIN classes c ON en.class_id = c.id
        LEFT JOIN evaluations e ON s.id = e.student_id
        WHERE c.style = 'jazz'
        AND s.current_level IN ('intermediate', 'intermediate-advanced')
        ORDER BY e.date DESC`
});

// 3. Design choreography
const choreography = {
  title: "City Lights - Intermediate Jazz",
  music: {
    artist: musicAnalysis.metadata.artist,
    bpm: musicAnalysis.bpm,
    duration: musicAnalysis.duration,
    structure: musicAnalysis.structure
  },
  sections: [
    {
      section: "Introduction",
      counts: "1-8",
      formation: "Scattered freeze positions",
      movements: [
        "Count 1-4: Hold freeze",
        "Count 5-6: Sharp head isolations",
        "Count 7-8: Arms reach to formation"
      ]
    },
    {
      section: "Verse 1",
      counts: "9-40",
      formation: "Two diagonal lines",
      movements: [
        "Count 9-12: Jazz walks forward (R, L, R, L)",
        "Count 13-16: Triple step, turn, pose",
        "Count 17-20: Pas de bourree, step touch",
        // ... detailed counts continue
      ]
    }
    // ... more sections
  ],
  technical_requirements: {
    jumps: ["Tour jeté", "Pas de chat"],
    turns: ["Pirouette", "Chainé turns"],
    isolations: ["Shoulder rolls", "Hip isolations"],
    difficulty: "Intermediate"
  },
  rehearsal_plan: {
    total_weeks: 20,
    weekly_schedule: "30 minutes per class, twice weekly",
    milestones: [
      { week: 4, goal: "All students know verse 1" },
      { week: 8, goal: "Full routine memorized" },
      { week: 12, goal: "Cleaning details and synchronization" },
      { week: 16, goal: "Full run-throughs with energy" },
      { week: 20, goal: "Performance ready" }
    ]
  }
};

// 4. Create choreography document
const choreoDoc = mcp_google_workspace.create_document({
  title: "City Lights - Jazz Choreography - Spring Recital 2025",
  content: formatChoreographyDocument(choreography),
  folder: "Spring Recital 2025"
});

// 5. Create rehearsal schedule in Google Calendar
const rehearsalDates = generateRehearsalDates("2025-01-01", "2025-05-15", "Tuesday,Thursday");

rehearsalDates.forEach((date, index) => {
  mcp_google_workspace.create_calendar_event({
    summary: `Jazz Recital Rehearsal - Week ${Math.floor(index/2) + 1}`,
    description: `Work on: ${choreography.rehearsal_plan.milestones.find(m => m.week === Math.floor(index/2) + 1)?.goal}`,
    start: { dateTime: `${date}T17:00:00` },
    end: { dateTime: `${date}T17:30:00` },
    location: "Studio A"
  });
});

// 6. Create casting spreadsheet
const castingSheet = mcp_google_workspace.create_spreadsheet({
  title: "City Lights - Casting and Costume Tracking",
  sheets: [
    {
      name: "Dancers",
      headers: ["Name", "Position", "Costume Size", "Costume Received", "Notes"],
      data: students.map(s => [s.name, "TBD", "", "", ""])
    },
    {
      name: "Rehearsal Attendance",
      headers: ["Date", ...students.map(s => s.name)],
      data: rehearsalDates.map(d => [d, ...Array(students.length).fill("")])
    }
  ]
});

// 7. Write result
Write("/results/task-1732012400-def456.json", {
  task_id: task.task_id,
  worker: "marie",
  status: "complete",
  findings: {
    summary: "Created complete choreography plan for Spring Recital jazz piece",
    details: {
      choreography_sections: choreography.sections.length,
      student_count: students.length,
      rehearsal_count: rehearsalDates.length,
      technical_elements: choreography.technical_requirements
    }
  },
  artifacts: [
    {
      type: "choreography_document",
      path: choreoDoc.url,
      description: "Detailed choreography with counts and formations"
    },
    {
      type: "casting_spreadsheet",
      path: castingSheet.url,
      description: "Dancer assignments and costume tracking"
    },
    {
      type: "calendar_events",
      count: rehearsalDates.length,
      description: "Rehearsal schedule in Google Calendar"
    }
  ]
});
```

---

### Example 3: Student Progress Report for Parents

**Task Input**:
```json
{
  "task_id": "task-1732012500-ghi789",
  "worker": "marie",
  "description": "Create end-of-semester progress report for all intermediate ballet students",
  "context": {
    "class_name": "Intermediate Ballet",
    "semester": "Fall 2025",
    "report_type": "parent_communication"
  }
}
```

**Marie's Workflow**:
```javascript
// 1. Query all students in class
const students = mcp_student_database.query({
  sql: `SELECT s.id, s.name, s.birth_date
        FROM students s
        JOIN enrollments e ON s.id = e.student_id
        JOIN classes c ON e.class_id = c.id
        WHERE c.name = 'Intermediate Ballet'
        AND e.status = 'active'`
});

// 2. For each student, gather comprehensive data
const progressReports = await Promise.all(students.map(async (student) => {

  // Get evaluations
  const evaluations = mcp_student_database.query({
    sql: `SELECT * FROM evaluations
          WHERE student_id = ${student.id}
          AND date >= '2025-09-01' AND date <= '2025-11-30'
          ORDER BY date`
  });

  // Get attendance
  const attendance = mcp_student_database.query({
    sql: `SELECT status, COUNT(*) as count
          FROM attendance
          WHERE student_id = ${student.id}
          AND date >= '2025-09-01' AND date <= '2025-11-30'
          GROUP BY status`
  });

  // Calculate progress metrics
  const progress = {
    attendance_rate: (attendance.find(a => a.status === 'present')?.count || 0) /
                     (attendance.reduce((sum, a) => sum + a.count, 0)) * 100,
    technique_improvement: evaluations.length > 1 ?
      evaluations[evaluations.length - 1].technique_score - evaluations[0].technique_score : 0,
    current_level: student.current_level,
    strengths: extractStrengths(evaluations),
    growth_areas: extractGrowthAreas(evaluations)
  };

  // Generate individual report
  const reportDoc = mcp_google_workspace.create_document({
    title: `${student.name} - Fall 2025 Progress Report`,
    template: "parent_progress_report",
    content: {
      student_name: student.name,
      class_name: "Intermediate Ballet",
      semester: "Fall 2025",
      attendance: `${progress.attendance_rate.toFixed(1)}%`,
      technique_summary: generateTechniqueSummary(evaluations),
      achievements: [
        "Mastered center work combinations",
        "Improved turnout and posture",
        "Demonstrated strong work ethic"
      ],
      next_steps: [
        "Continue strengthening for pointe readiness",
        "Focus on épaulement in port de bras",
        "Practice pirouettes from fourth position"
      ],
      teacher_comments: generatePersonalizedComments(student, evaluations)
    }
  });

  return {
    student_name: student.name,
    report_url: reportDoc.url,
    metrics: progress
  };
}));

// 3. Create summary spreadsheet for teacher
const summarySheet = mcp_google_workspace.create_spreadsheet({
  title: "Intermediate Ballet - Fall 2025 Class Summary",
  sheets: [{
    name: "Student Progress",
    headers: ["Student", "Attendance %", "Technique Score", "Improvement", "Report Link"],
    data: progressReports.map(r => [
      r.student_name,
      r.metrics.attendance_rate.toFixed(1),
      r.metrics.current_technique_score,
      r.metrics.technique_improvement > 0 ? `+${r.metrics.technique_improvement}` : r.metrics.technique_improvement,
      r.report_url
    ])
  }]
});

// 4. Schedule parent-teacher conferences
const conferenceSlots = generateConferenceSlots("2025-12-04", "2025-12-08", "30min");

progressReports.forEach((report, index) => {
  if (index < conferenceSlots.length) {
    mcp_google_workspace.create_calendar_event({
      summary: `Parent Conference - ${report.student_name}`,
      description: `Discuss Fall 2025 progress\nReport: ${report.report_url}`,
      start: { dateTime: conferenceSlots[index].start },
      end: { dateTime: conferenceSlots[index].end },
      location: "Studio Office",
      attendees: [
        { email: getParentEmail(report.student_name) }
      ]
    });
  }
});

// 5. Write result
Write("/results/task-1732012500-ghi789.json", {
  task_id: task.task_id,
  worker: "marie",
  status: "complete",
  findings: {
    summary: `Generated ${progressReports.length} individual progress reports and scheduled parent conferences`,
    details: {
      students_evaluated: progressReports.length,
      average_attendance: (progressReports.reduce((sum, r) => sum + r.metrics.attendance_rate, 0) / progressReports.length).toFixed(1),
      conferences_scheduled: conferenceSlots.length
    }
  },
  artifacts: [
    {
      type: "individual_reports",
      count: progressReports.length,
      description: "Individual student progress reports in Google Docs"
    },
    {
      type: "class_summary",
      path: summarySheet.url,
      description: "Class-wide progress summary spreadsheet"
    },
    {
      type: "calendar_events",
      count: conferenceSlots.length,
      description: "Parent-teacher conference appointments"
    }
  ]
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up basic MCP infrastructure and test connectivity

**Tasks**:
1. Install and configure existing MCP servers
   - [ ] Set up `google_workspace_mcp` with OAuth authentication
   - [ ] Install `mcp-sqlite` and create student database schema
   - [ ] Test `mcp-audio-inspector` with sample music files

2. Create database schema and seed data
   - [ ] Design complete SQLite schema for student management
   - [ ] Create migration scripts
   - [ ] Seed with test data (10 sample students, 5 classes)

3. Configure `.mcp.json` for Marie's workspace
   - [ ] Add all MCP server configurations
   - [ ] Set up environment variables
   - [ ] Test MCP connectivity in Claude Code CLI

4. Update Marie's agent prompt to include MCP tools
   - [ ] Document MCP tool usage in workflow
   - [ ] Add examples for each MCP integration
   - [ ] Update error handling for MCP failures

**Deliverables**:
- Working `.mcp.json` configuration
- Populated student database
- Updated Marie agent documentation
- MCP connectivity test results

---

### Phase 2: Audio & Calendar Integration (Week 3-4)
**Goal**: Enable music analysis and scheduling capabilities

**Tasks**:
1. Audio analysis integration
   - [ ] Test BPM detection on various dance music
   - [ ] Create choreography planning workflow using audio analysis
   - [ ] Build music library with analyzed metadata

2. Calendar integration
   - [ ] Set up Google Calendar API authentication
   - [ ] Create class schedule templates
   - [ ] Implement recurring class event management
   - [ ] Build rehearsal scheduling workflow

3. Document generation setup
   - [ ] Create Google Docs templates for:
     - Student evaluations
     - Parent communications
     - Choreography documentation
     - Recital programs
   - [ ] Test document creation via MCP
   - [ ] Implement automated formatting

**Deliverables**:
- Music analysis workflow documentation
- Working calendar integration
- Document template library
- End-to-end scheduling demo

---

### Phase 3: Database Operations (Week 5-6)
**Goal**: Advanced student data management and querying

**Tasks**:
1. Implement common database queries
   - [ ] Student roster by class/level
   - [ ] Attendance tracking and reporting
   - [ ] Evaluation history queries
   - [ ] Progress tracking over time

2. Build reporting workflows
   - [ ] Semester progress reports
   - [ ] Attendance summaries
   - [ ] Skill progression charts
   - [ ] Parent communication logs

3. Data migration and backup
   - [ ] Create backup procedures
   - [ ] Implement data export (CSV, JSON)
   - [ ] Build data import from existing records

**Deliverables**:
- Comprehensive query library
- Automated reporting workflows
- Data backup procedures
- Migration documentation

---

### Phase 4: Custom Video Analysis (Week 7-10)
**Goal**: Build custom MCP server for dance video analysis

**Tasks**:
1. Design MCP server architecture
   - [ ] Define MCP tool interfaces
   - [ ] Design video processing pipeline
   - [ ] Plan pose estimation integration

2. Implement core video processing
   - [ ] FFmpeg integration for frame extraction
   - [ ] Video metadata extraction
   - [ ] Frame-by-frame processing

3. Add pose estimation
   - [ ] Integrate MediaPipe or OpenPose
   - [ ] Map dance-specific poses
   - [ ] Implement comparison algorithms

4. Build analysis algorithms
   - [ ] Balance detection
   - [ ] Alignment analysis
   - [ ] Movement tracking
   - [ ] Rhythm/timing analysis

5. Create MCP server
   - [ ] Implement MCP protocol handlers
   - [ ] Add error handling and logging
   - [ ] Build configuration system
   - [ ] Write documentation

**Deliverables**:
- Working video analysis MCP server
- Dance pose estimation models
- Analysis algorithm documentation
- Integration examples for Marie

---

### Phase 5: Integration & Testing (Week 11-12)
**Goal**: Complete end-to-end workflows and testing

**Tasks**:
1. Integration testing
   - [ ] Test all MCP servers together
   - [ ] Verify cross-MCP workflows
   - [ ] Load testing with realistic data

2. Workflow optimization
   - [ ] Identify bottlenecks
   - [ ] Optimize database queries
   - [ ] Improve video processing speed
   - [ ] Cache frequently accessed data

3. User documentation
   - [ ] Write Marie user guide
   - [ ] Create workflow tutorials
   - [ ] Document troubleshooting steps
   - [ ] Build example task library

4. Error handling improvements
   - [ ] Implement graceful degradation
   - [ ] Add retry logic for API calls
   - [ ] Create error notification system
   - [ ] Build monitoring dashboard

**Deliverables**:
- Complete integration test suite
- Performance optimization report
- Comprehensive user documentation
- Production-ready system

---

## Security Considerations

### 1. API Key Management
**Risk**: Exposure of sensitive API credentials
**Mitigation**:
- Store all API keys in environment variables
- Never commit `.env` files to version control
- Use separate credentials for development/production
- Implement key rotation procedures
- Use Google Cloud Secret Manager for production

### 2. Data Privacy (Student Records)
**Risk**: Unauthorized access to student personal information
**Mitigation**:
- Encrypt SQLite database at rest
- Implement access logging for all database queries
- Use role-based access control
- Regular data access audits
- Comply with FERPA regulations for student records
- Implement data retention policies

### 3. Video/Image Storage
**Risk**: Unauthorized access to student performance videos
**Mitigation**:
- Store videos in encrypted Google Drive folders
- Implement access controls on video directories
- Use signed URLs for temporary access
- Automatic video expiration for old recordings
- Parental consent for video storage

### 4. Google Workspace Access
**Risk**: Over-permissioned access to Google services
**Mitigation**:
- Use OAuth 2.0 with minimal required scopes
- Implement token refresh and expiration
- Regular permission audits
- Separate service accounts for different functions
- Monitor API usage for anomalies

### 5. MCP Server Security
**Risk**: Malicious or buggy MCP servers
**Mitigation**:
- Audit all third-party MCP servers before use
- Run MCP servers in sandboxed environments
- Implement resource limits (CPU, memory, disk)
- Monitor MCP server logs
- Use only verified MCP servers from trusted sources

### 6. File System Access
**Risk**: Unauthorized file system operations
**Mitigation**:
- Restrict file operations to `/workspace/dance/` directory
- Implement file access logging
- Regular file permission audits
- Prevent directory traversal attacks
- Validate all file paths before operations

---

## Testing Strategy

### Unit Testing

**MCP Server Tests**:
```javascript
// Test video analysis MCP
describe('Video Analysis MCP', () => {
  test('should extract frames from video', async () => {
    const result = await mcp_video_analysis.extract_frames({
      video_path: '/test/sample-pirouette.mp4',
      frame_count: 10
    });
    expect(result.frames).toHaveLength(10);
  });

  test('should detect pose landmarks', async () => {
    const result = await mcp_video_analysis.analyze_pose({
      video_path: '/test/sample-pirouette.mp4',
      pose_type: 'ballet'
    });
    expect(result.landmarks).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});

// Test database operations
describe('Student Database MCP', () => {
  test('should query students by level', async () => {
    const students = await mcp_student_database.query({
      sql: "SELECT * FROM students WHERE current_level = 'intermediate'"
    });
    expect(students).toBeInstanceOf(Array);
  });

  test('should insert new evaluation', async () => {
    const result = await mcp_student_database.execute({
      sql: `INSERT INTO evaluations (student_id, date, technique_score)
            VALUES (1, '2025-11-18', 85)`
    });
    expect(result.changes).toBe(1);
  });
});
```

### Integration Testing

**End-to-End Workflow Tests**:
```javascript
describe('Student Evaluation Workflow', () => {
  test('should complete full evaluation from video to report', async () => {
    // 1. Analyze video
    const videoAnalysis = await mcp_video_analysis.analyze_dance_video({
      video_path: '/test/emma-ballet.mp4',
      focus_areas: ['balance', 'alignment']
    });

    // 2. Query student history
    const history = await mcp_student_database.query({
      sql: "SELECT * FROM evaluations WHERE student_id = 1 ORDER BY date DESC LIMIT 5"
    });

    // 3. Generate report
    const report = await mcp_google_workspace.create_document({
      title: 'Test Evaluation Report',
      content: generateEvaluationContent(videoAnalysis, history)
    });

    expect(report.url).toBeDefined();
    expect(videoAnalysis.score).toBeGreaterThan(0);
  });
});

describe('Recital Planning Workflow', () => {
  test('should plan recital with music analysis and scheduling', async () => {
    // 1. Analyze music
    const musicAnalysis = await mcp_audio_inspector.analyze_audio({
      file_path: '/test/recital-music.mp3'
    });

    // 2. Create choreography doc
    const choreoDoc = await mcp_google_workspace.create_document({
      title: 'Test Choreography',
      content: formatChoreography(musicAnalysis)
    });

    // 3. Schedule rehearsals
    const rehearsals = await mcp_google_workspace.create_calendar_events({
      events: generateRehearsalSchedule(musicAnalysis.duration)
    });

    expect(musicAnalysis.bpm).toBeGreaterThan(0);
    expect(choreoDoc.url).toBeDefined();
    expect(rehearsals.length).toBeGreaterThan(0);
  });
});
```

### Load Testing

**Database Performance**:
```javascript
describe('Database Load Tests', () => {
  test('should handle 1000 concurrent student queries', async () => {
    const queries = Array(1000).fill().map((_, i) =>
      mcp_student_database.query({
        sql: `SELECT * FROM students WHERE id = ${i % 100}`
      })
    );

    const startTime = Date.now();
    await Promise.all(queries);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
  });
});
```

### Security Testing

**Access Control Tests**:
```javascript
describe('Security Tests', () => {
  test('should prevent directory traversal in video analysis', async () => {
    await expect(
      mcp_video_analysis.analyze_dance_video({
        video_path: '../../etc/passwd'
      })
    ).rejects.toThrow('Invalid path');
  });

  test('should sanitize SQL queries', async () => {
    await expect(
      mcp_student_database.query({
        sql: "SELECT * FROM students; DROP TABLE students;--"
      })
    ).rejects.toThrow('SQL injection detected');
  });
});
```

---

## Appendix A: MCP Server Tool Reference

### Video Analysis MCP Tools

```javascript
// Extract frames from video
mcp_video_analysis.extract_frames({
  video_path: string,
  frame_count: number,
  output_format: 'png' | 'jpg'
})

// Analyze dance technique
mcp_video_analysis.analyze_dance_video({
  video_path: string,
  focus_areas: string[], // ['balance', 'alignment', 'rhythm', etc.]
  comparison_reference?: string
})

// Track movement over time
mcp_video_analysis.track_movement({
  video_path: string,
  body_part: string, // 'head', 'arm_left', 'leg_right', etc.
  output_visualization: boolean
})

// Compare two videos
mcp_video_analysis.compare_videos({
  video_path_1: string,
  video_path_2: string,
  comparison_type: 'technique' | 'timing' | 'form'
})
```

### Audio Inspector MCP Tools

```javascript
// Analyze audio file
mcp_audio_inspector.analyze_audio({
  file_path: string,
  analysis_type: 'bpm' | 'structure' | 'comprehensive'
})

// Detect beats and measures
mcp_audio_inspector.detect_beats({
  file_path: string,
  time_signature?: string // '4/4', '3/4', etc.
})

// Extract metadata
mcp_audio_inspector.get_metadata({
  file_path: string
})
```

### Google Workspace MCP Tools

```javascript
// Calendar operations
mcp_google_workspace.create_calendar_event({
  summary: string,
  description?: string,
  start: { dateTime: string },
  end: { dateTime: string },
  location?: string,
  attendees?: Array<{ email: string }>
})

mcp_google_workspace.list_calendar_events({
  timeMin: string,
  timeMax: string,
  maxResults?: number
})

// Document operations
mcp_google_workspace.create_document({
  title: string,
  content: string | object,
  folder?: string,
  template?: string
})

mcp_google_workspace.update_document({
  documentId: string,
  content: string | object
})

// Spreadsheet operations
mcp_google_workspace.create_spreadsheet({
  title: string,
  sheets: Array<{
    name: string,
    headers: string[],
    data: any[][]
  }>
})

mcp_google_workspace.update_spreadsheet({
  spreadsheetId: string,
  range: string,
  values: any[][]
})

// Drive operations
mcp_google_workspace.upload_file({
  file_path: string,
  folder?: string,
  mime_type?: string
})

mcp_google_workspace.list_files({
  folder?: string,
  query?: string
})
```

### Student Database MCP Tools

```javascript
// Execute SQL query (SELECT)
mcp_student_database.query({
  sql: string,
  params?: any[]
})

// Execute SQL command (INSERT, UPDATE, DELETE)
mcp_student_database.execute({
  sql: string,
  params?: any[]
})

// Get database schema
mcp_student_database.get_schema()

// Backup database
mcp_student_database.backup({
  backup_path: string
})
```

---

## Appendix B: Environment Variables Reference

```bash
# .env file for Marie MCP integrations

# Anthropic (for Claude Code and task-master)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity (for research in task-master)
PERPLEXITY_API_KEY=pplx-...

# OpenAI (optional, for task-master fallback)
OPENAI_API_KEY=sk-proj-...

# Google Workspace
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
DANCE_STUDIO_CALENDAR_ID=primary

# Video Analysis (custom MCP)
VIDEO_STORAGE_PATH=/workspace/dance/videos
ANALYSIS_OUTPUT_PATH=/workspace/dance/analysis
FFMPEG_PATH=/usr/bin/ffmpeg
MODEL_PATH=/models/dance-pose-estimation

# Audio Analysis
AUDIO_STORAGE_PATH=/workspace/dance/music
ANALYSIS_CACHE_PATH=/workspace/dance/music-analysis

# Student Database
SQLITE_DB_PATH=/workspace/dance/students.db
```

---

## Appendix C: Sample Database Queries

```sql
-- Get all students in a specific class
SELECT s.name, s.current_level, e.enrollment_date
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
WHERE c.name = 'Intermediate Ballet'
AND e.status = 'active'
ORDER BY s.name;

-- Calculate attendance rate for a student
SELECT
  s.name,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*) as attendance_rate
FROM students s
JOIN attendance a ON s.id = a.student_id
WHERE s.id = 1
AND a.date >= date('now', '-3 months');

-- Get progress over time (technique scores)
SELECT
  s.name,
  e.date,
  e.technique_score,
  LAG(e.technique_score) OVER (PARTITION BY s.id ORDER BY e.date) as previous_score,
  e.technique_score - LAG(e.technique_score) OVER (PARTITION BY s.id ORDER BY e.date) as improvement
FROM students s
JOIN evaluations e ON s.id = e.student_id
WHERE s.id = 1
ORDER BY e.date DESC;

-- Find students ready for level advancement
SELECT s.name, s.current_level, AVG(e.technique_score) as avg_score
FROM students s
JOIN evaluations e ON s.id = e.student_id
WHERE e.date >= date('now', '-6 months')
GROUP BY s.id, s.name, s.current_level
HAVING AVG(e.technique_score) >= 85
ORDER BY avg_score DESC;

-- Get recital casting conflicts (students in multiple pieces at same time)
SELECT s.name, COUNT(*) as piece_count, GROUP_CONCAT(ca.piece_name) as pieces
FROM students s
JOIN choreography_assignments ca ON s.id = ca.student_id
WHERE ca.performance_date = '2025-05-15'
GROUP BY s.id, s.name
HAVING COUNT(*) > 1;
```

---

## Conclusion

This MCP integration plan provides Marie with comprehensive capabilities for dance teaching assistance:

1. **Video Analysis**: Custom-built MCP for technique feedback
2. **Music Processing**: Existing MCP for choreography planning
3. **Calendar Management**: Google Workspace integration for scheduling
4. **Student Database**: SQLite MCP for advanced queries
5. **Document Generation**: Google Workspace for professional reports

**Implementation Timeline**: 12 weeks
**Total MCP Servers**: 5 (including existing task-master)
**Custom Development**: 1 server (video analysis)

This architecture enables Marie to operate as a truly comprehensive dance teaching assistant, handling everything from video technique analysis to parent communications, all through standardized MCP interfaces.

---

**Next Steps**:
1. Review and approve integration plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
5. Plan user acceptance testing

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Author**: Claude Code (MCP Integration Specialist)
