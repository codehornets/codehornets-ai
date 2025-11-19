# Marie Memory System - Implementation Plan

## Overview

This document provides a step-by-step implementation plan for deploying Marie's context memory and learning system.

---

## Phase 1: Foundation Setup (Week 1)

### Day 1: Directory Structure & Schema

**Tasks:**
- [ ] Create `.marie-memory` directory structure
- [ ] Create all subdirectories (db, indexes, cache, logs, backups, schemas, scripts, lib)
- [ ] Write SQLite schema file
- [ ] Initialize empty database
- [ ] Verify directory permissions

**Commands:**
```bash
cd /workspace/dance
mkdir -p .marie-memory/{db,indexes,cache/embeddings,logs,backups/daily,schemas,scripts,lib}

# Copy schema from spec
cat > .marie-memory/schemas/schema.sql << 'EOF'
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 2.1]
EOF

# Initialize database
sqlite3 .marie-memory/db/marie.db < .marie-memory/schemas/schema.sql

# Set permissions
chmod 700 .marie-memory
chmod 600 .marie-memory/db/marie.db
```

**Verification:**
```bash
# Check structure
ls -la .marie-memory/

# Verify database
sqlite3 .marie-memory/db/marie.db ".tables"
sqlite3 .marie-memory/db/marie.db "SELECT * FROM system_meta;"
```

**Deliverables:**
- Complete directory structure
- Initialized SQLite database
- System metadata populated

---

### Day 2: Memory Manager Script

**Tasks:**
- [ ] Create memory-manager.sh script
- [ ] Implement init function
- [ ] Implement store-task function
- [ ] Implement retrieve function
- [ ] Implement backup function
- [ ] Make script executable
- [ ] Test each function

**Implementation:**
```bash
cat > .marie-memory/scripts/memory-manager.sh << 'EOF'
#!/bin/bash
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 3.1]
EOF

chmod +x .marie-memory/scripts/memory-manager.sh
```

**Testing:**
```bash
# Test init
bash .marie-memory/scripts/memory-manager.sh init

# Test store-task
bash .marie-memory/scripts/memory-manager.sh store-task \
    "test-001" \
    "evaluation" \
    '{"task_id":"test-001","description":"Test","status":"complete"}'

# Test retrieve (will implement after adding test data)
# Test backup
bash .marie-memory/scripts/memory-manager.sh backup
```

**Deliverables:**
- Functional memory-manager.sh
- All commands working
- Initial tests passing

---

### Day 3: Node.js Memory API

**Tasks:**
- [ ] Initialize Node.js project
- [ ] Install sqlite3 dependency
- [ ] Create memory-api.js
- [ ] Implement core methods
- [ ] Create test script
- [ ] Run integration tests

**Implementation:**
```bash
cd .marie-memory/lib
npm init -y
npm install sqlite3

cat > memory-api.js << 'EOF'
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 3.2]
EOF

# Create test script
cat > test-api.js << 'EOF'
const MarieMemoryAPI = require('./memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    console.log('Testing Memory API...');

    // Test 1: Store task
    await memory.storeTask({
        task_id: 'test-api-001',
        task_type: 'evaluation',
        description: 'API Test',
        status: 'complete',
        execution_time_seconds: 60,
        context: {},
        result_summary: 'Test passed',
        artifacts: [],
        errors: [],
        related_students: null
    });
    console.log('✓ Task stored');

    // Test 2: Get similar tasks
    const similar = await memory.getSimilarTasks('evaluation', 5);
    console.log(`✓ Found ${similar.length} similar tasks`);

    await memory.close();
    console.log('All tests passed!');
})();
EOF

node test-api.js
```

**Deliverables:**
- Node.js API module
- Test suite passing
- Documentation comments

---

### Day 4: Index System

**Tasks:**
- [ ] Create index initialization
- [ ] Implement student-index.json structure
- [ ] Implement task-index.json structure
- [ ] Implement pattern-index.json structure
- [ ] Create index update functions
- [ ] Test index operations

**Implementation:**
```bash
# Initialize indexes
cat > .marie-memory/scripts/init-indexes.sh << 'EOF'
#!/bin/bash
INDEXES_PATH="/workspace/dance/.marie-memory/indexes"

# Student Index
cat > $INDEXES_PATH/student-index.json << 'EOFINDEX'
{
  "version": "1.0",
  "last_updated": "'$(date -Iseconds)'",
  "students": {}
}
EOFINDEX

# Task Index
cat > $INDEXES_PATH/task-index.json << 'EOFINDEX'
{
  "version": "1.0",
  "last_updated": "'$(date -Iseconds)'",
  "by_type": {},
  "by_date": {}
}
EOFINDEX

# Pattern Index
cat > $INDEXES_PATH/pattern-index.json << 'EOFINDEX'
{
  "version": "1.0",
  "last_updated": "'$(date -Iseconds)'",
  "patterns": {}
}
EOFINDEX

echo "Indexes initialized"
EOF

chmod +x .marie-memory/scripts/init-indexes.sh
bash .marie-memory/scripts/init-indexes.sh
```

**Testing:**
```bash
# Verify indexes exist
ls -la .marie-memory/indexes/

# Validate JSON
jq . .marie-memory/indexes/student-index.json
jq . .marie-memory/indexes/task-index.json
jq . .marie-memory/indexes/pattern-index.json
```

**Deliverables:**
- All three index files
- Index update logic
- Validation passing

---

### Day 5: Integration Testing

**Tasks:**
- [ ] Create comprehensive test suite
- [ ] Test end-to-end workflow
- [ ] Test data persistence
- [ ] Test error handling
- [ ] Document test results

**Test Suite:**
```bash
cat > .marie-memory/scripts/run-tests.sh << 'EOF'
#!/bin/bash

echo "=== Marie Memory System Test Suite ==="
echo ""

# Test 1: Database integrity
echo "Test 1: Database Integrity"
sqlite3 .marie-memory/db/marie.db "PRAGMA integrity_check;" | grep -q "ok"
if [ $? -eq 0 ]; then
    echo "✓ Database integrity check passed"
else
    echo "✗ Database integrity check FAILED"
    exit 1
fi

# Test 2: Store and retrieve task
echo "Test 2: Store and Retrieve Task"
bash .marie-memory/scripts/memory-manager.sh store-task \
    "test-e2e-001" \
    "evaluation" \
    '{"task_id":"test-e2e-001","description":"End-to-end test","status":"complete"}'

COUNT=$(sqlite3 .marie-memory/db/marie.db "SELECT COUNT(*) FROM task_history WHERE task_id='test-e2e-001';")
if [ "$COUNT" -eq 1 ]; then
    echo "✓ Task storage successful"
else
    echo "✗ Task storage FAILED"
    exit 1
fi

# Test 3: Student operations
echo "Test 3: Student Operations"
sqlite3 .marie-memory/db/marie.db << SQL
INSERT INTO students (student_id, full_name, age, current_level)
VALUES ('test-student-e2e', 'Test Student E2E', 12, 'intermediate');
SQL

node -e "
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');
(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();
    const context = await memory.getStudentContext('test-student-e2e');
    await memory.close();
    if (context && context.student) {
        console.log('✓ Student context retrieval successful');
    } else {
        console.log('✗ Student context retrieval FAILED');
        process.exit(1);
    }
})();
"

# Test 4: Index updates
echo "Test 4: Index Updates"
jq '.students["test-student-e2e"] = {"id":"test-student-e2e","name":"Test Student E2E"}' \
    .marie-memory/indexes/student-index.json > .marie-memory/indexes/student-index.json.tmp
mv .marie-memory/indexes/student-index.json.tmp .marie-memory/indexes/student-index.json

if jq -e '.students["test-student-e2e"]' .marie-memory/indexes/student-index.json > /dev/null; then
    echo "✓ Index update successful"
else
    echo "✗ Index update FAILED"
    exit 1
fi

# Test 5: Backup and restore
echo "Test 5: Backup and Restore"
bash .marie-memory/scripts/memory-manager.sh backup
LATEST_BACKUP=$(ls -t .marie-memory/backups/daily/*.db.gz | head -1)
if [ -f "$LATEST_BACKUP" ]; then
    echo "✓ Backup creation successful"
else
    echo "✗ Backup creation FAILED"
    exit 1
fi

echo ""
echo "=== All Tests Passed ==="
EOF

chmod +x .marie-memory/scripts/run-tests.sh
bash .marie-memory/scripts/run-tests.sh
```

**Deliverables:**
- Complete test suite
- All tests passing
- Test documentation

---

## Phase 2: Marie Integration (Week 2)

### Day 6: Startup Integration

**Tasks:**
- [ ] Create startup script
- [ ] Add to Marie's container startup
- [ ] Test container restart
- [ ] Verify memory persistence

**Implementation:**
```bash
cat > .marie-memory/scripts/startup.sh << 'EOF'
#!/bin/bash
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 8.2]
EOF

chmod +x .marie-memory/scripts/startup.sh
```

**Update docker-compose.yml:**
```yaml
marie:
  command: >
    bash -c "
    mkdir -p /home/agent/.claude/output-styles &&
    cp /output-styles/marie.md /home/agent/.claude/output-styles/marie.md &&
    echo '{\"outputStyle\": \"marie\"}' > /home/agent/.claude/settings.local.json &&
    /workspace/dance/.marie-memory/scripts/startup.sh &&
    claude
    "
```

**Testing:**
```bash
# Restart Marie container
docker-compose restart marie

# Check logs
docker logs marie | grep "memory"
```

**Deliverables:**
- Startup script integrated
- Container restart working
- Memory system initializes on startup

---

### Day 7: Task Processing Integration

**Tasks:**
- [ ] Add memory initialization to task processing
- [ ] Implement context retrieval before tasks
- [ ] Implement result storage after tasks
- [ ] Test with sample evaluation task

**Update marie.md:**
```markdown
## Memory-Enhanced Task Processing

Before processing ANY task:

1. Initialize memory (if first task):
```bash
if [ ! -f /workspace/dance/.marie-memory/db/marie.db ]; then
    bash /workspace/dance/.marie-memory/scripts/memory-manager.sh init
fi
```

2. Retrieve relevant context:
```bash
# For evaluation tasks
if [[ "$task_type" == "evaluation" ]]; then
    student_context=$(bash /workspace/dance/.marie-memory/scripts/memory-manager.sh retrieve student $student_id)
fi
```

3. After task completion, store results:
```bash
bash /workspace/dance/.marie-memory/scripts/memory-manager.sh store-task \
    "$task_id" \
    "$task_type" \
    "$result_json"
```
```

**Testing:**
```bash
# Create test evaluation task
cat > /tasks/marie/test-eval-001.json << 'EOF'
{
    "task_id": "test-eval-001",
    "description": "Evaluate test student",
    "context": {
        "student_id": "test-student-e2e",
        "student_name": "Test Student E2E",
        "evaluation_type": "formal"
    }
}
EOF

# Monitor Marie's processing
docker logs -f marie
```

**Deliverables:**
- Memory integration in task workflow
- Context retrieval working
- Result storage working

---

### Day 8: Student Context Enhancement

**Tasks:**
- [ ] Add student profile creation
- [ ] Add skill assessment storage
- [ ] Add progress log storage
- [ ] Implement skill trend calculation
- [ ] Test with real student data

**Implementation:**
```javascript
// Add to memory-api.js
async createStudentProfile(studentData) {
    const sql = `
        INSERT INTO students (
            student_id, full_name, age, start_date, current_level, profile_path
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        this.db.run(sql, [
            studentData.student_id,
            studentData.full_name,
            studentData.age,
            studentData.start_date,
            studentData.current_level,
            studentData.profile_path
        ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}
```

**Testing:**
```bash
# Test student profile creation
node -e "
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');
(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    await memory.createStudentProfile({
        student_id: 'emma-rodriguez',
        full_name: 'Emma Rodriguez',
        age: 13,
        start_date: '2024-01-15',
        current_level: 'intermediate-ballet',
        profile_path: '/workspace/dance/students/emma-rodriguez/profile.md'
    });

    const context = await memory.getStudentContext('emma-rodriguez');
    console.log('Student context:', JSON.stringify(context, null, 2));

    await memory.close();
})();
"
```

**Deliverables:**
- Student profile operations
- Skill assessment storage
- Progress log storage
- Trend calculations

---

### Day 9: Evaluation Enhancement

**Tasks:**
- [ ] Enhance evaluation output with historical context
- [ ] Add skill trend visualization
- [ ] Add pattern-based recommendations
- [ ] Test enhanced evaluations

**Enhanced Evaluation Template:**
```markdown
# {Student Name} - {Style} Evaluation
**Date**: {Date}
**Evaluator**: Marie

## Progress Since Last Evaluation ({Last Date})

**Historical Context**: {Student Name} has completed {N} evaluations over {M} months.

{For each skill}:
**{Skill Name}**: ⭐⭐⭐⭐☆ (was ⭐⭐⭐☆☆)
- Improved by {X} points over {Y} months
- **Trend**: {Improving/Stable/Declining}
- **Memory Insight**: {Pattern information if applicable}

## Detected Patterns Applied

{For each applicable pattern}:
**Pattern**: "{Pattern Name}" (Confidence: {X}%)
- {Pattern description}
- **Recommended Approach**: {Strategy}
- This strategy has helped {N} other students successfully

## Historical Performance

{Student Name} has been with us for {X} months. Reviewing {N} previous evaluations shows:
- Attendance rate: {X}%
- Overall trend: {Direction}
- Strongest areas: {Skills}
- Focus areas: {Skills}

## References
- Last Evaluation: {task_id} ({date})
- Related Patterns: {pattern_ids}
- Teaching Strategies Applied: {strategy_names}
```

**Deliverables:**
- Enhanced evaluation template
- Historical context integration
- Pattern recommendations

---

### Day 10: Testing & Documentation

**Tasks:**
- [ ] Create comprehensive integration tests
- [ ] Document workflow changes
- [ ] Create usage examples
- [ ] Performance testing
- [ ] Bug fixes

**Integration Test:**
```bash
cat > .marie-memory/scripts/integration-test.sh << 'EOF'
#!/bin/bash

echo "=== Marie Memory Integration Test ==="

# 1. Create student
echo "Creating student profile..."
node -e "[student creation code]"

# 2. Add skill assessments over time
echo "Adding skill assessments..."
node -e "[assessment code]"

# 3. Add progress logs
echo "Adding progress logs..."
node -e "[progress log code]"

# 4. Trigger pattern detection
echo "Detecting patterns..."
bash .marie-memory/scripts/memory-manager.sh learn

# 5. Retrieve enhanced context
echo "Retrieving enhanced context..."
context=$(bash .marie-memory/scripts/memory-manager.sh retrieve student emma-rodriguez)

# 6. Verify skill trends calculated
echo "Verifying skill trends..."
node -e "[verification code]"

echo "=== Integration Test Complete ==="
EOF

chmod +x .marie-memory/scripts/integration-test.sh
bash .marie-memory/scripts/integration-test.sh
```

**Deliverables:**
- Integration tests passing
- Documentation updated
- Usage examples
- Performance benchmarks

---

## Phase 3: Pattern Learning (Week 3)

### Day 11: Pattern Detection Implementation

**Tasks:**
- [ ] Implement PatternDetector class
- [ ] Add struggle pattern detection
- [ ] Add strategy pattern detection
- [ ] Add progression pattern detection
- [ ] Test pattern detection

**Implementation:**
```javascript
// Create pattern-detector.js
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 7.1]
```

**Testing:**
```bash
# Add test data
sqlite3 .marie-memory/db/marie.db << 'EOF'
-- Add progress logs with common struggles
INSERT INTO progress_logs (student_id, log_date, struggles, corrections_given, response_to_corrections)
VALUES
    ('student-1', date('now'), 'pirouette spotting difficulty', 'focus on single spot', 'positive improvement'),
    ('student-2', date('now', '-1 day'), 'pirouette spotting', 'mirror work', 'improved significantly'),
    ('student-3', date('now', '-2 days'), 'pirouette spotting issues', 'slow practice', 'better balance'),
    ('student-4', date('now', '-3 days'), 'trouble with spotting', 'one point focus', 'great improvement');
EOF

# Run pattern detection
node -e "
const PatternDetector = require('./.marie-memory/lib/pattern-detector.js');
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    const detector = new PatternDetector(memory);
    const patterns = await detector.detectStrugglePatterns();

    console.log('Detected patterns:', JSON.stringify(patterns, null, 2));

    await memory.close();
})();
"
```

**Deliverables:**
- Pattern detection working
- Multiple pattern types detected
- Confidence scores calculated

---

### Day 12: Continuous Learning

**Tasks:**
- [ ] Implement ContinuousLearner class
- [ ] Add pattern reinforcement
- [ ] Add insight usefulness tracking
- [ ] Test learning cycle

**Implementation:**
```javascript
// Create continuous-learner.js
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 7.2]
```

**Testing:**
```bash
# Test continuous learning
node -e "
const ContinuousLearner = require('./.marie-memory/lib/continuous-learner.js');
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    const learner = new ContinuousLearner(memory);

    // Simulate task completion
    await learner.learnFromTask({
        task_id: 'test-learn-001',
        task_type: 'evaluation',
        context: { student_level: 'intermediate' }
    }, {
        success: true,
        struggles_observed: ['pirouette spotting'],
        strategies_applied: ['mirror work'],
        outcome_positive: true
    });

    await memory.close();
    console.log('Learning complete');
})();
"
```

**Deliverables:**
- Continuous learning working
- Pattern reinforcement functional
- Insight tracking operational

---

### Day 13: Pattern Application

**Tasks:**
- [ ] Integrate pattern retrieval in task processing
- [ ] Add pattern-based recommendations
- [ ] Test pattern application
- [ ] Validate effectiveness

**Enhancement:**
```javascript
// In task processing
async function processTaskWithPatterns(task) {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    // Get applicable patterns
    const patterns = await memory.getApplicablePatterns({
        task_type: task.task_type,
        student_level: task.context?.student_level,
        students: task.context?.students
    });

    // Apply patterns to context
    const enrichedContext = {
        ...task.context,
        applicable_patterns: patterns,
        recommendations: patterns.map(p => generateRecommendation(p))
    };

    // Process task with enriched context
    const result = await executeTask(task, enrichedContext);

    await memory.close();
    return result;
}
```

**Deliverables:**
- Pattern application working
- Recommendations generated
- Effectiveness validated

---

### Day 14-15: Learning Validation

**Tasks:**
- [ ] Collect real evaluation data
- [ ] Run pattern detection
- [ ] Validate detected patterns
- [ ] Adjust confidence thresholds
- [ ] Document learned patterns

**Validation Process:**
```bash
# Import historical data
node .marie-memory/scripts/import-historical-data.js

# Run full pattern detection
bash .marie-memory/scripts/memory-manager.sh learn

# Generate pattern report
node -e "
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    const patterns = await memory.query(\`
        SELECT * FROM learned_patterns
        ORDER BY confidence_score DESC, occurrences DESC
    \`);

    console.log('=== Learned Patterns Report ===');
    patterns.forEach(p => {
        console.log(\`\nPattern: \${p.pattern_name}\`);
        console.log(\`Type: \${p.pattern_type}\`);
        console.log(\`Confidence: \${p.confidence_score}\`);
        console.log(\`Occurrences: \${p.occurrences}\`);
        console.log(\`Applies to: \${p.applies_to}\`);
    });

    await memory.close();
})();
"
```

**Deliverables:**
- Pattern validation complete
- Confidence thresholds tuned
- Pattern documentation

---

## Phase 4: Session Management (Week 4)

### Day 16: Session Manager Implementation

**Tasks:**
- [ ] Implement SessionManager class
- [ ] Add session start/end
- [ ] Add context loading
- [ ] Test session operations

**Implementation:**
```javascript
// Create session-manager.js
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 8.1]
```

**Testing:**
```bash
# Test session lifecycle
node -e "
const SessionManager = require('./.marie-memory/lib/session-manager.js');
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    const sessionMgr = new SessionManager(memory);

    // Start session
    const sessionId = await sessionMgr.startSession();
    console.log('Session started:', sessionId);

    // Update session
    await sessionMgr.updateSession('task-001', 'evaluation', ['student-1']);
    console.log('Session updated');

    // End session
    await sessionMgr.endSession('Test session complete');
    console.log('Session ended');

    await memory.close();
})();
"
```

**Deliverables:**
- SessionManager working
- Session lifecycle functional
- Context loading operational

---

### Day 17: Container Restart Handling

**Tasks:**
- [ ] Implement session recovery
- [ ] Test container restart
- [ ] Verify continuity
- [ ] Handle edge cases

**Testing:**
```bash
# Start session with incomplete tasks
node -e "
const SessionManager = require('./.marie-memory/lib/session-manager.js');
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    const sessionMgr = new SessionManager(memory);
    const sessionId = await sessionMgr.startSession();

    // Simulate work
    await sessionMgr.updateSession('task-001', 'evaluation', ['student-1']);

    // Don't end session - simulate crash
    await memory.close();
    console.log('Session left incomplete:', sessionId);
})();
"

# Restart container
docker-compose restart marie

# Check recovery
docker logs marie | grep "Recovering incomplete session"
```

**Deliverables:**
- Session recovery working
- Container restart handling
- Edge cases covered

---

### Day 18: MCP Episodic Memory Export

**Tasks:**
- [ ] Implement session export
- [ ] Create export format
- [ ] Test MCP integration
- [ ] Verify retrieval

**Implementation:**
```javascript
// Add to session-manager.js
async exportSessionToEpisodicMemory(sessionId) {
    // [Implementation from spec]
}
```

**Testing:**
```bash
# Export session
node -e "
const SessionManager = require('./.marie-memory/lib/session-manager.js');
const MarieMemoryAPI = require('./.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    const sessionMgr = new SessionManager(memory);

    // Create and complete session
    const sessionId = await sessionMgr.startSession();
    await sessionMgr.updateSession('task-001', 'evaluation', ['student-1']);
    await sessionMgr.endSession('Test export session');

    // Export to episodic memory
    await exportSessionToEpisodicMemory(sessionId);

    await memory.close();
    console.log('Session exported');
})();
"

# Verify export file
ls .marie-memory/episodic-exports/
cat .marie-memory/episodic-exports/session-*.md
```

**Deliverables:**
- Session export working
- MCP format correct
- Retrieval tested

---

### Day 19-20: Session Testing & Documentation

**Tasks:**
- [ ] Comprehensive session tests
- [ ] Document session workflow
- [ ] Create recovery procedures
- [ ] Performance testing

**Test Suite:**
```bash
cat > .marie-memory/scripts/test-sessions.sh << 'EOF'
#!/bin/bash

echo "=== Session Management Test Suite ==="

# Test 1: Session lifecycle
echo "Test 1: Session Lifecycle"
[test code]

# Test 2: Session recovery
echo "Test 2: Session Recovery"
[test code]

# Test 3: Context persistence
echo "Test 3: Context Persistence"
[test code]

# Test 4: Export to episodic memory
echo "Test 4: Episodic Memory Export"
[test code]

echo "=== All Session Tests Passed ==="
EOF

chmod +x .marie-memory/scripts/test-sessions.sh
bash .marie-memory/scripts/test-sessions.sh
```

**Deliverables:**
- Session tests passing
- Documentation complete
- Recovery procedures documented

---

## Phase 5: Optimization (Week 5)

### Day 21: Index Optimization

**Tasks:**
- [ ] Implement fast index lookup
- [ ] Benchmark index performance
- [ ] Optimize index updates
- [ ] Test at scale

**Benchmarking:**
```bash
# Create performance test
cat > .marie-memory/scripts/benchmark.sh << 'EOF'
#!/bin/bash

echo "=== Performance Benchmarks ==="

# Test 1: Index lookup
echo "Test 1: Student Index Lookup (1000 iterations)"
time for i in {1..1000}; do
    jq '.students["emma-rodriguez"]' .marie-memory/indexes/student-index.json > /dev/null
done

# Test 2: Database query
echo "Test 2: Database Student Query (1000 iterations)"
time for i in {1..1000}; do
    sqlite3 .marie-memory/db/marie.db "SELECT * FROM students WHERE student_id='emma-rodriguez';" > /dev/null
done

# Test 3: Full context retrieval
echo "Test 3: Full Context Retrieval (100 iterations)"
time for i in {1..100}; do
    bash .marie-memory/scripts/memory-manager.sh retrieve student emma-rodriguez > /dev/null
done

echo "=== Benchmarks Complete ==="
EOF

chmod +x .marie-memory/scripts/benchmark.sh
bash .marie-memory/scripts/benchmark.sh
```

**Deliverables:**
- Index lookups < 1ms
- Benchmarks documented
- Optimization validated

---

### Day 22: Caching Layer

**Tasks:**
- [ ] Implement cache management
- [ ] Add TTL logic
- [ ] Test cache effectiveness
- [ ] Monitor cache hit rate

**Implementation:**
```javascript
// Add to memory-api.js
class CacheManager {
    constructor(ttl = 300000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear() {
        this.cache.clear();
    }
}
```

**Deliverables:**
- Caching implemented
- TTL working
- Hit rate > 60%

---

### Day 23: Database Query Optimization

**Tasks:**
- [ ] Analyze slow queries
- [ ] Add missing indexes
- [ ] Optimize complex queries
- [ ] Benchmark improvements

**Query Analysis:**
```sql
-- Enable query profiling
PRAGMA query_only = ON;

-- Test common queries
EXPLAIN QUERY PLAN
SELECT * FROM students WHERE student_id = 'emma-rodriguez';

EXPLAIN QUERY PLAN
SELECT * FROM skill_assessments
WHERE student_id = 'emma-rodriguez'
ORDER BY assessment_date DESC
LIMIT 5;

-- Add additional indexes if needed
CREATE INDEX IF NOT EXISTS idx_skill_student_date
ON skill_assessments(student_id, assessment_date DESC);
```

**Deliverables:**
- All queries < 50ms
- Indexes optimized
- Performance validated

---

### Day 24: Automated Maintenance

**Tasks:**
- [ ] Create maintenance script
- [ ] Schedule automated tasks
- [ ] Test backup automation
- [ ] Monitor disk usage

**Maintenance Script:**
```bash
cat > .marie-memory/scripts/maintenance.sh << 'EOF'
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 11.2]
EOF

chmod +x .marie-memory/scripts/maintenance.sh

# Add to crontab (in container)
echo "0 2 * * * /workspace/dance/.marie-memory/scripts/maintenance.sh" | crontab -
```

**Deliverables:**
- Maintenance script working
- Automated backups
- Disk monitoring

---

### Day 25: Performance Testing & Tuning

**Tasks:**
- [ ] Load testing
- [ ] Identify bottlenecks
- [ ] Apply optimizations
- [ ] Document performance

**Load Test:**
```bash
# Create load test
cat > .marie-memory/scripts/load-test.sh << 'EOF'
#!/bin/bash

echo "=== Load Test ==="

# Simulate 100 tasks
for i in {1..100}; do
    bash .marie-memory/scripts/memory-manager.sh store-task \
        "load-test-$i" \
        "evaluation" \
        "{\"task_id\":\"load-test-$i\",\"status\":\"complete\"}" &
done

wait

# Test retrieval under load
for i in {1..100}; do
    bash .marie-memory/scripts/memory-manager.sh retrieve student emma-rodriguez > /dev/null &
done

wait

echo "=== Load Test Complete ==="
EOF

chmod +x .marie-memory/scripts/load-test.sh
time bash .marie-memory/scripts/load-test.sh
```

**Deliverables:**
- Load test passing
- Bottlenecks identified
- Optimizations applied
- Performance documented

---

## Phase 6: Production Deployment (Week 6)

### Day 26-27: Production Readiness

**Tasks:**
- [ ] Security audit
- [ ] Permission hardening
- [ ] Backup verification
- [ ] Documentation review
- [ ] Monitoring setup

**Security Checklist:**
```bash
# Set secure permissions
chmod 700 /workspace/dance/.marie-memory
chmod 600 /workspace/dance/.marie-memory/db/marie.db
chmod 600 /workspace/dance/.marie-memory/indexes/*.json

# Verify no sensitive data in logs
grep -r "password\|secret\|key" .marie-memory/logs/

# Test backup encryption (optional)
gpg --encrypt .marie-memory/backups/daily/latest.db.gz
```

**Deliverables:**
- Security audit complete
- Permissions secured
- Backups verified

---

### Day 28: Deployment

**Tasks:**
- [ ] Deploy to production container
- [ ] Migrate existing data
- [ ] Verify functionality
- [ ] Monitor initial operation

**Deployment:**
```bash
# Deploy to Marie container
docker exec -it marie bash

# Initialize memory system
cd /workspace/dance
bash .marie-memory/scripts/memory-manager.sh init

# Import existing data (if any)
node .marie-memory/scripts/import-existing-data.js

# Verify
bash .marie-memory/scripts/run-tests.sh
```

**Deliverables:**
- Production deployment
- Data migrated
- System operational

---

### Day 29: Monitoring Setup

**Tasks:**
- [ ] Setup health monitoring
- [ ] Configure alerts
- [ ] Create dashboards
- [ ] Test alerting

**Health Monitoring:**
```bash
# Create health check script
cat > .marie-memory/scripts/health-check.sh << 'EOF'
[Copy from MARIE_MEMORY_SYSTEM_SPEC.md section 11.1]
EOF

chmod +x .marie-memory/scripts/health-check.sh

# Schedule health checks
echo "*/15 * * * * /workspace/dance/.marie-memory/scripts/health-check.sh" | crontab -
```

**Deliverables:**
- Health monitoring active
- Alerts configured
- Dashboards created

---

### Day 30: Documentation & Handoff

**Tasks:**
- [ ] Finalize documentation
- [ ] Create runbooks
- [ ] Record training materials
- [ ] Conduct handoff

**Documentation Checklist:**
- [x] Technical specification
- [x] Quick start guide
- [x] Architecture overview
- [ ] Operations runbook
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

**Deliverables:**
- Complete documentation
- Runbooks created
- Training complete

---

## Post-Implementation

### Ongoing Tasks

**Daily:**
- Monitor system health
- Review error logs
- Check backup status

**Weekly:**
- Review learned patterns
- Analyze performance metrics
- Check disk usage

**Monthly:**
- Review pattern effectiveness
- Optimize database
- Update documentation

**Quarterly:**
- Security audit
- Performance review
- Feature enhancements

---

## Success Metrics

### Week 1-2 (Foundation & Integration)
- [ ] Database initialized and operational
- [ ] All core scripts working
- [ ] Marie integration complete
- [ ] Basic tests passing

### Week 3-4 (Learning & Sessions)
- [ ] Pattern detection functional
- [ ] Confidence scores accurate
- [ ] Session management working
- [ ] Container restart recovery

### Week 5-6 (Optimization & Deployment)
- [ ] Performance targets met
- [ ] Production deployment successful
- [ ] Monitoring operational
- [ ] Documentation complete

### Performance Targets
- Student context retrieval: < 20ms
- Pattern lookup: < 1ms
- Task storage: < 50ms
- Database size: < 100MB (first year)
- Cache hit rate: > 60%
- Session recovery: < 5 seconds

---

## Risk Mitigation

### Risk: Data Loss
**Mitigation:**
- Daily automated backups
- 30-day retention
- Tested restore procedures

### Risk: Performance Degradation
**Mitigation:**
- Regular database optimization
- Query performance monitoring
- Caching layer

### Risk: Pattern Quality
**Mitigation:**
- Confidence thresholds
- Manual validation
- Feedback loop

### Risk: Container Issues
**Mitigation:**
- Session recovery
- Persistence via volumes
- Health checks

---

## Conclusion

This implementation plan provides a structured, week-by-week approach to deploying Marie's context memory and learning system. Follow the daily tasks, verify deliverables, and adjust timelines as needed based on your specific environment and requirements.

**Total Timeline**: 6 weeks (30 working days)
**Estimated Effort**: 1-2 developers full-time

For questions or issues during implementation, refer to:
- Technical Specification: `MARIE_MEMORY_SYSTEM_SPEC.md`
- Quick Start Guide: `MARIE_MEMORY_QUICK_START.md`
- Architecture Overview: `MARIE_MEMORY_ARCHITECTURE.md`
