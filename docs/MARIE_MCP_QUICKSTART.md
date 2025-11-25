# Marie MCP Integration - Quick Start Guide

**Quick setup guide for Marie's MCP (Model Context Protocol) integrations**

---

## Prerequisites

1. **Node.js** (v18 or later)
2. **Claude Code CLI** installed
3. **Google Account** (for Calendar/Workspace integration)
4. **API Keys** (see Environment Variables section)

---

## Step 1: Copy MCP Configuration

The `.mcp.json` file is already created at:
```
/home/anga/workspace/beta/codehornets-ai/core/shared/auth-homes/marie/.mcp.json
```

This configuration includes:
- task-master-ai (project management)
- audio-inspector (music analysis)
- google-workspace (calendar, docs, sheets, drive)
- student-database (SQLite for student records)

---

## Step 2: Set Up Environment Variables

Create or update `/home/anga/workspace/beta/codehornets-ai/.env`:

```bash
# Required: Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# Optional but recommended: For task-master research
PERPLEXITY_API_KEY=pplx-YOUR_KEY_HERE

# Optional: OpenAI fallback
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Google Workspace Integration
# Get these from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# Google Calendar ID (usually 'primary' for your main calendar)
DANCE_STUDIO_CALENDAR_ID=primary
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Google Calendar API
   - Google Drive API
   - Google Docs API
   - Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/oauth2callback`
7. Copy Client ID and Client Secret to `.env`

---

## Step 3: Initialize Student Database

Run the SQL initialization script:

```bash
# Navigate to Marie's home directory
cd /home/anga/workspace/beta/codehornets-ai/core/shared/auth-homes/marie

# Create the database
sqlite3 /workspace/dance/students.db < init-database.sql
```

This creates:
- 11 tables (students, classes, evaluations, attendance, etc.)
- 4 helpful views for common queries
- Sample data (5 students, 5 classes) for testing

### Verify Database Creation

```bash
# Check tables were created
sqlite3 /workspace/dance/students.db "SELECT name FROM sqlite_master WHERE type='table';"

# View sample students
sqlite3 /workspace/dance/students.db "SELECT * FROM students;"

# Check enrollment counts
sqlite3 /workspace/dance/students.db "SELECT * FROM v_class_enrollment;"
```

---

## Step 4: Test MCP Servers

### Test Audio Inspector

```bash
# Install globally for testing
npx -y mcp-audio-inspector --version

# Test with sample music file (you'll need to provide one)
# The MCP will be available when Marie starts
```

### Test Google Workspace

```bash
# Install the package
npx -y @taylorwilsdon/google-workspace-mcp

# First time: It will open browser for OAuth authentication
# Follow the prompts to authorize access
```

### Test SQLite Database

```bash
# Install the package
npx -y @jparkerweb/mcp-sqlite

# Test database connection (will be handled by MCP)
```

---

## Step 5: Start Marie with MCP Support

```bash
# Navigate to Marie's workspace
cd /home/anga/workspace/beta/codehornets-ai/core/shared/auth-homes/marie

# Start Claude Code CLI (will auto-load .mcp.json)
claude
```

Marie will now have access to all MCP tools!

---

## Step 6: Test MCP Integration

Once Marie is running, test the integrations:

### Test Student Database Query

Ask Marie:
```
Can you query the student database and show me all intermediate ballet students?
```

Expected: Marie uses `mcp_student_database.query()` to run SQL and return results

### Test Calendar Integration

Ask Marie:
```
Create a test calendar event for next Tuesday at 5pm - Intermediate Ballet rehearsal
```

Expected: Marie uses `mcp_google_workspace.create_calendar_event()`

### Test Audio Analysis

Ask Marie:
```
Analyze the BPM and structure of [music file path]
```

Expected: Marie uses `mcp_audio_inspector.analyze_audio()`

---

## Common MCP Tools Marie Can Use

### Student Database (SQLite)

```javascript
// Query students
mcp_student_database.query({
  sql: "SELECT * FROM students WHERE current_level = 'intermediate'"
})

// Insert evaluation
mcp_student_database.execute({
  sql: "INSERT INTO evaluations (student_id, date, technique_score) VALUES (?, ?, ?)",
  params: [1, '2025-11-18', 8]
})

// Get database schema
mcp_student_database.get_schema()
```

### Google Workspace

```javascript
// Create calendar event
mcp_google_workspace.create_calendar_event({
  summary: "Intermediate Ballet",
  start: { dateTime: "2025-11-19T17:00:00" },
  end: { dateTime: "2025-11-19T18:00:00" },
  location: "Studio A"
})

// Create document
mcp_google_workspace.create_document({
  title: "Student Evaluation - Emma Rodriguez",
  content: "Evaluation content here..."
})

// Create spreadsheet
mcp_google_workspace.create_spreadsheet({
  title: "Class Attendance Tracker",
  sheets: [{
    name: "November 2025",
    headers: ["Date", "Student", "Status"],
    data: [["2025-11-18", "Emma", "Present"]]
  }]
})
```

### Audio Inspector

```javascript
// Analyze music
mcp_audio_inspector.analyze_audio({
  file_path: "/workspace/dance/music/recital-piece.mp3",
  analysis_type: "comprehensive"
})
// Returns: { bpm: 128, structure: {...}, duration: 180, ... }

// Get just BPM
mcp_audio_inspector.analyze_audio({
  file_path: "/workspace/dance/music/practice-track.mp3",
  analysis_type: "bpm"
})
```

---

## Directory Structure

Marie's workspace should look like this:

```
/workspace/dance/
├── students/                  # Individual student files
│   ├── emma-rodriguez/
│   │   ├── profile.md
│   │   ├── progress-log.md
│   │   └── evaluations/
│   └── sophia-chen/
├── music/                     # Music files for analysis
│   └── recital-2025/
├── music-analysis/           # Cached audio analysis results
├── videos/                   # Performance videos
│   └── technique/
├── class-notes/              # Daily class documentation
├── choreography/             # Choreography documents
├── evaluations/              # Formal evaluations
│   ├── formal/
│   ├── drafts/
│   └── revised/
├── recitals/                 # Recital planning
└── students.db               # SQLite database
```

Create the structure:

```bash
mkdir -p /workspace/dance/{students,music,music-analysis,videos/technique,class-notes,choreography,evaluations/{formal,drafts,revised},recitals}
```

---

## Troubleshooting

### MCP Server Not Found

If you see "MCP server not found" errors:

```bash
# Test if npx can find the package
npx -y mcp-audio-inspector --help

# Check your Node.js version (must be 18+)
node --version

# Clear npm cache if needed
npm cache clean --force
```

### Google OAuth Issues

If Google authentication fails:

1. Verify redirect URI matches exactly: `http://localhost:3000/oauth2callback`
2. Check that APIs are enabled in Google Cloud Console
3. Try re-authorizing: Delete OAuth tokens and restart Marie

### Database Connection Issues

If SQLite MCP can't connect:

```bash
# Check database exists
ls -lh /workspace/dance/students.db

# Check database permissions
chmod 644 /workspace/dance/students.db

# Test direct connection
sqlite3 /workspace/dance/students.db "SELECT COUNT(*) FROM students;"
```

### Audio Analysis Not Working

If audio analysis fails:

```bash
# Verify music file exists and is readable
file /workspace/dance/music/your-file.mp3

# Check file permissions
chmod 644 /workspace/dance/music/*.mp3

# Ensure directory exists
mkdir -p /workspace/dance/music-analysis
```

---

## Next Steps

1. **Add real student data**: Update database with actual students
2. **Create music library**: Add music files to `/workspace/dance/music/`
3. **Set up Google Calendar**: Create "Dance Studio" calendar in Google
4. **Create document templates**: Set up Google Docs templates for evaluations
5. **Test complete workflows**: Run through full evaluation or choreography planning

---

## Workflow Examples

### Complete Student Evaluation

```
1. Upload performance video to /workspace/dance/videos/
2. Ask Marie: "Analyze Emma's ballet technique from [video path]"
3. Marie will:
   - Query Emma's evaluation history (database MCP)
   - Analyze technique (future: video MCP)
   - Generate evaluation report (Google Docs MCP)
   - Update database with new evaluation (database MCP)
4. Result: Professional evaluation document + updated database
```

### Plan Recital Choreography

```
1. Upload music file to /workspace/dance/music/
2. Ask Marie: "Create choreography plan for intermediate jazz recital using [music file]"
3. Marie will:
   - Analyze music BPM and structure (audio MCP)
   - Query eligible students by level (database MCP)
   - Create choreography document (Google Docs MCP)
   - Schedule rehearsals (Google Calendar MCP)
   - Create casting spreadsheet (Google Sheets MCP)
4. Result: Complete recital plan with timeline
```

### Generate Progress Reports

```
1. Ask Marie: "Create end-of-semester progress reports for all intermediate ballet students"
2. Marie will:
   - Query students in class (database MCP)
   - Retrieve evaluation history (database MCP)
   - Calculate attendance rates (database MCP)
   - Generate individual reports (Google Docs MCP)
   - Create summary spreadsheet (Google Sheets MCP)
   - Schedule parent conferences (Google Calendar MCP)
4. Result: Individual reports + master tracking sheet + scheduled conferences
```

---

## Additional Resources

- **Full Integration Plan**: `/home/anga/workspace/beta/codehornets-ai/docs/MARIE_MCP_INTEGRATION_PLAN.md`
- **Database Schema**: `/home/anga/workspace/beta/codehornets-ai/core/shared/auth-homes/marie/init-database.sql`
- **MCP Configuration**: `/home/anga/workspace/beta/codehornets-ai/core/shared/auth-homes/marie/.mcp.json`
- **MCP Protocol Docs**: https://modelcontextprotocol.io/
- **Google Workspace MCP**: https://github.com/taylorwilsdon/google_workspace_mcp

---

## Support

For issues or questions:
1. Check the full integration plan document
2. Review MCP server documentation
3. Test MCP servers independently before integration
4. Verify environment variables are set correctly

---

**Version**: 1.0
**Last Updated**: 2025-11-18
