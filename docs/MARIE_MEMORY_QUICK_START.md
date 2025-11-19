# Marie Memory System - Quick Start Guide

## Installation (5 minutes)

### Step 1: Create Memory Structure
```bash
cd /workspace/dance
mkdir -p .marie-memory/{db,indexes,cache/embeddings,logs,backups/daily,schemas,scripts,lib}
```

### Step 2: Install SQLite Schema
```bash
cat > .marie-memory/schemas/schema.sql << 'EOF'
-- [Copy schema from MARIE_MEMORY_SYSTEM_SPEC.md section 2.1]
EOF

sqlite3 .marie-memory/db/marie.db < .marie-memory/schemas/schema.sql
```

### Step 3: Install Memory Manager Script
```bash
cat > .marie-memory/scripts/memory-manager.sh << 'EOF'
#!/bin/bash
# [Copy memory-manager.sh from MARIE_MEMORY_SYSTEM_SPEC.md section 3.1]
EOF

chmod +x .marie-memory/scripts/memory-manager.sh
```

### Step 4: Install Node.js API
```bash
cat > .marie-memory/lib/memory-api.js << 'EOF'
// [Copy memory-api.js from MARIE_MEMORY_SYSTEM_SPEC.md section 3.2]
EOF

cd .marie-memory/lib
npm init -y
npm install sqlite3
```

### Step 5: Initialize Memory System
```bash
bash .marie-memory/scripts/memory-manager.sh init
```

## Basic Usage

### Store a Task Result
```bash
task_json='{"task_id":"task-123","description":"Evaluate Emma","status":"complete"}'
bash .marie-memory/scripts/memory-manager.sh store-task "task-123" "evaluation" "$task_json"
```

### Retrieve Student Context
```bash
context=$(bash .marie-memory/scripts/memory-manager.sh retrieve student emma-rodriguez)
echo "$context" | jq .
```

### Detect Patterns
```bash
bash .marie-memory/scripts/memory-manager.sh learn
```

### Backup Database
```bash
bash .marie-memory/scripts/memory-manager.sh backup
```

## Integration with Marie

### Add to marie.md (output-style)

```markdown
## Memory System Integration

Before processing any task, initialize memory:

```bash
# First run only
if [ ! -f /workspace/dance/.marie-memory/db/marie.db ]; then
    bash /workspace/dance/.marie-memory/scripts/memory-manager.sh init
fi
```

When processing evaluations:

```bash
# Retrieve student context
student_context=$(bash /workspace/dance/.marie-memory/scripts/memory-manager.sh retrieve student $STUDENT_ID)

# Use context to enrich evaluation
# ... process evaluation ...

# Store results
bash /workspace/dance/.marie-memory/scripts/memory-manager.sh store-task "$TASK_ID" "evaluation" "$RESULT_JSON"
```

End of session:

```bash
# Learn from completed tasks
bash /workspace/dance/.marie-memory/scripts/memory-manager.sh learn

# Backup
bash /workspace/dance/.marie-memory/scripts/memory-manager.sh backup
```
```

## Testing

### Test 1: Store and Retrieve
```bash
# Store a test task
bash .marie-memory/scripts/memory-manager.sh store-task \
    "test-001" \
    "evaluation" \
    '{"task_id":"test-001","description":"Test evaluation","status":"complete"}'

# Verify storage
sqlite3 .marie-memory/db/marie.db "SELECT * FROM task_history WHERE task_id='test-001';"
```

### Test 2: Student Context
```bash
# Add test student
sqlite3 .marie-memory/db/marie.db << EOF
INSERT INTO students (student_id, full_name, age, current_level)
VALUES ('test-student', 'Test Student', 12, 'intermediate');
EOF

# Retrieve context
bash .marie-memory/scripts/memory-manager.sh retrieve student test-student
```

### Test 3: Pattern Detection
```bash
# Add test progress logs
sqlite3 .marie-memory/db/marie.db << EOF
INSERT INTO progress_logs (student_id, log_date, struggles, corrections_given, response_to_corrections)
VALUES
    ('test-student', date('now'), 'pirouette spotting', 'focus on single spot', 'positive improvement'),
    ('test-student', date('now', '-1 day'), 'pirouette spotting', 'mirror work', 'improved'),
    ('test-student', date('now', '-2 days'), 'balance in releve', 'core engagement', 'better');
EOF

# Run pattern detection
bash .marie-memory/scripts/memory-manager.sh learn

# Check detected patterns
sqlite3 .marie-memory/db/marie.db "SELECT * FROM learned_patterns;"
```

## Monitoring

### Check System Health
```bash
# Database size
du -h .marie-memory/db/marie.db

# Record counts
sqlite3 .marie-memory/db/marie.db << EOF
SELECT 'Students: ' || COUNT(*) FROM students
UNION ALL
SELECT 'Tasks: ' || COUNT(*) FROM task_history
UNION ALL
SELECT 'Patterns: ' || COUNT(*) FROM learned_patterns;
EOF

# Recent activity
sqlite3 .marie-memory/db/marie.db << EOF
SELECT COUNT(*) as recent_tasks
FROM task_history
WHERE timestamp_start >= datetime('now', '-7 days');
EOF
```

### View Logs
```bash
# Memory operations log
tail -f .marie-memory/logs/memory-ops.log

# Learning events
tail -f .marie-memory/logs/learning.log
```

## Troubleshooting

### Issue: Database not found
```bash
# Reinitialize
bash .marie-memory/scripts/memory-manager.sh init
```

### Issue: Corrupted database
```bash
# Restore from backup
LATEST_BACKUP=$(ls -t .marie-memory/backups/daily/*.db.gz | head -1)
gunzip -c "$LATEST_BACKUP" > .marie-memory/db/marie.db
```

### Issue: Slow queries
```bash
# Optimize database
sqlite3 .marie-memory/db/marie.db "VACUUM; ANALYZE;"
```

## Node.js Usage

```javascript
const MarieMemoryAPI = require('/workspace/dance/.marie-memory/lib/memory-api.js');

(async () => {
    const memory = new MarieMemoryAPI();
    await memory.initialize();

    // Get student context
    const context = await memory.getStudentContext('emma-rodriguez');
    console.log('Student Context:', context);

    // Store task
    await memory.storeTask({
        task_id: 'task-456',
        task_type: 'evaluation',
        description: 'Ballet evaluation',
        status: 'complete',
        execution_time_seconds: 120,
        context: { student: 'emma-rodriguez' },
        result_summary: 'Excellent progress',
        artifacts: ['/workspace/dance/evaluations/emma-2025-11-18.md'],
        errors: [],
        related_students: ['emma-rodriguez']
    });

    // Detect patterns
    const patterns = await memory.detectPatterns();
    console.log('Patterns detected:', patterns);

    await memory.close();
})();
```

## Maintenance Schedule

### Daily (Automated)
```bash
# Add to crontab or run at end of each session
0 2 * * * bash /workspace/dance/.marie-memory/scripts/maintenance.sh
```

### Weekly
- Review learned patterns
- Check backup integrity
- Monitor database size

### Monthly
- Clean old backups (>30 days)
- Export to long-term storage
- Review pattern confidence scores

## Next Steps

1. **Phase 1**: Deploy basic memory system (this guide)
2. **Phase 2**: Integrate with Marie's task processing
3. **Phase 3**: Enable pattern learning
4. **Phase 4**: Add session management
5. **Phase 5**: Optimize performance
6. **Phase 6**: Advanced features (semantic search, etc.)

## Resources

- Full specification: `/docs/MARIE_MEMORY_SYSTEM_SPEC.md`
- SQLite documentation: https://www.sqlite.org/docs.html
- Node.js sqlite3: https://github.com/TryGhost/node-sqlite3

## Support

For issues or questions:
1. Check logs in `.marie-memory/logs/`
2. Verify database integrity
3. Review this quick start guide
4. Consult full specification document
