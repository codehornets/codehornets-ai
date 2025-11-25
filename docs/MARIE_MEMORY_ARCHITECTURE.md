# Marie Memory System - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Marie Dance Teaching AI Agent                         │
│                     (Claude Code CLI in Docker Container)                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │   Task Processing Engine    │
                    │  (Evaluations, Choreography) │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌──────────────┐         ┌────────────────┐
│  File System  │          │    Memory    │         │  MCP Episodic  │
│   Storage     │◄────────►│   Manager    │◄───────►│     Memory     │
└───────────────┘          └──────┬───────┘         └────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Persistent Storage Layer                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │   SQLite DB     │   │ JSON Indexes │   │  File Documents    │   │
│  │                 │   │              │   │                    │   │
│  │ • Students      │   │ • Student    │   │ • Profiles (.md)   │   │
│  │ • Tasks         │   │ • Task       │   │ • Evaluations      │   │
│  │ • Skills        │   │ • Pattern    │   │ • Choreography     │   │
│  │ • Progress      │   │              │   │ • Class Notes      │   │
│  │ • Patterns      │   │              │   │                    │   │
│  │ • Insights      │   │              │   │                    │   │
│  │                 │   │              │   │                    │   │
│  └─────────────────┘   └──────────────┘   └────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Docker Volume Mount    │
                    │ /workspace/dance/      │
                    │ (Survives restarts)    │
                    └────────────────────────┘
```

## Data Flow Diagram

```
New Task Arrives
       │
       ▼
┌──────────────────┐
│  1. Task Queue   │  Task file created in /tasks/marie/
│  (File-based)    │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│  2. Memory Manager             │
│     - Initialize Connection    │
│     - Load Recent Context      │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  3. Context Retrieval                │
│     ┌──────────────────────────┐     │
│     │ Student Context          │     │
│     │ - Profile & History      │     │
│     │ - Skill Trends           │     │
│     │ - Recent Progress        │     │
│     └──────────────────────────┘     │
│                                      │
│     ┌──────────────────────────┐     │
│     │ Applicable Patterns      │     │
│     │ - Student Struggles      │     │
│     │ - Effective Strategies   │     │
│     │ - Progression Paths      │     │
│     └──────────────────────────┘     │
│                                      │
│     ┌──────────────────────────┐     │
│     │ Similar Past Tasks       │     │
│     │ - Same task type         │     │
│     │ - Similar students       │     │
│     │ - Successful outcomes    │     │
│     └──────────────────────────┘     │
└────────┬─────────────────────────────┘
         │
         ▼
┌───────────────────────────┐
│  4. Task Execution        │
│     - Apply Context       │
│     - Use Patterns        │
│     - Generate Result     │
└────────┬──────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  5. Result Storage                   │
│     ┌────────────────────────┐       │
│     │ Store Task History     │       │
│     │ (SQLite)               │       │
│     └────────────────────────┘       │
│                                      │
│     ┌────────────────────────┐       │
│     │ Update Skill Scores    │       │
│     │ (if evaluation)        │       │
│     └────────────────────────┘       │
│                                      │
│     ┌────────────────────────┐       │
│     │ Create File Artifacts  │       │
│     │ (.md documents)        │       │
│     └────────────────────────┘       │
│                                      │
│     ┌────────────────────────┐       │
│     │ Update Indexes         │       │
│     │ (JSON fast lookup)     │       │
│     └────────────────────────┘       │
└────────┬─────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  6. Learning Phase      │
│     - Detect Patterns   │
│     - Update Confidence │
│     - Store Insights    │
└────────┬────────────────┘
         │
         ▼
┌───────────────────────────┐
│  7. Session Update        │
│     - Increment Counter   │
│     - Update Hot Topics   │
│     - Cache Recent Context│
└───────────────────────────┘
```

## Memory Retrieval Flow

```
Query: "Get context for Emma's evaluation"
           │
           ▼
    ┌──────────────┐
    │ Fast Index   │  Check student-index.json (< 1ms)
    │ Lookup       │  → Quick metadata available
    └──────┬───────┘
           │
           ▼
    ┌─────────────────────┐
    │ Cache Check         │  Is full context cached? (< 1ms)
    │                     │  → If yes, return from cache
    └──────┬──────────────┘
           │ Cache miss
           ▼
    ┌──────────────────────────┐
    │ Database Query           │
    │ (SQLite - optimized)     │  Get student profile + joins
    │                          │  (5-20ms typical)
    └──────┬───────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ Aggregate Data             │
    │ • Recent assessments (5)   │
    │ • Progress logs (10)       │
    │ • Skill trends calculation │
    │ • Related patterns         │
    └──────┬─────────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Cache Result     │  Store for 5 minutes
    │                  │  (for repeated queries)
    └──────┬───────────┘
           │
           ▼
    ┌────────────────────┐
    │ Return Rich        │
    │ Context Object     │
    └────────────────────┘

Total Retrieval Time:
- Index hit: < 1ms
- Cache hit: < 1ms
- Database query: 5-20ms
- Full aggregation: 20-50ms
```

## Pattern Learning Flow

```
Trigger: Every 10 tasks OR manual command
               │
               ▼
    ┌────────────────────────┐
    │ 1. Struggle Detection  │
    │                        │
    │ SELECT struggles,      │
    │   COUNT(*) as freq     │
    │ FROM progress_logs     │
    │ WHERE struggles != ''  │
    │ GROUP BY struggles     │
    │ HAVING freq > 3        │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ Calculate Confidence       │
    │                            │
    │ confidence = f(            │
    │   frequency,               │
    │   context_variety,         │
    │   avg_outcome              │
    │ )                          │
    └──────┬─────────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ 2. Strategy Detection      │
    │                            │
    │ SELECT corrections_given,  │
    │   COUNT(*) as success      │
    │ FROM progress_logs         │
    │ WHERE response LIKE        │
    │   '%positive%'             │
    │ GROUP BY corrections_given │
    │ HAVING success > 5         │
    └──────┬─────────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ 3. Progression Analysis    │
    │                            │
    │ Cluster students by:       │
    │ • Improvement rate         │
    │ • Time to milestones       │
    │ • Common characteristics   │
    └──────┬─────────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ 4. Store Patterns          │
    │                            │
    │ INSERT OR REPLACE INTO     │
    │ learned_patterns           │
    │                            │
    │ • Pattern type             │
    │ • Confidence score         │
    │ • Occurrences              │
    │ • Context                  │
    │ • Applicable to            │
    └──────┬─────────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ 5. Update Pattern Index    │
    │                            │
    │ Write to:                  │
    │ pattern-index.json         │
    │                            │
    │ For fast pattern lookup    │
    └──────┬─────────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ Log Learning Event         │
    │                            │
    │ → learning.log             │
    │ "Detected X patterns..."   │
    └────────────────────────────┘

Pattern Application:
- When processing new task
- Retrieve patterns with confidence > 0.6
- Apply to context enrichment
- Track success/failure
- Update confidence accordingly
```

## Session Continuity Flow

```
Container Starts
       │
       ▼
┌────────────────────┐
│ Startup Script     │
│ (.marie-memory/    │
│  scripts/startup.sh)│
└──────┬─────────────┘
       │
       ▼
┌──────────────────────────┐
│ Check Memory System      │
│                          │
│ Database exists?         │
│ ├─ Yes → Integrity check │
│ └─ No → Initialize       │
└──────┬───────────────────┘
       │
       ▼
┌───────────────────────────┐
│ Query for Incomplete      │
│ Sessions                  │
│                           │
│ SELECT * FROM             │
│ session_context           │
│ WHERE session_end IS NULL │
└──────┬────────────────────┘
       │
       ├─ Found? ──┐
       │           │
       ▼           ▼
   No Session   Recover Session
       │           │
       │           ├─ Load session data
       │           ├─ Get recent context
       │           ├─ Restore hot topics
       │           └─ Resume work
       │
       ▼
┌────────────────────┐
│ Start New Session  │
│                    │
│ • Generate ID      │
│ • Create record    │
│ • Load context     │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────┐
│ Marie Ready          │
│                      │
│ Full memory access   │
│ Context available    │
│ Patterns loaded      │
└──────────────────────┘

During Session:
- Each task updates session
- Hot topics maintained
- Active students tracked
- Tasks completed counted

End of Session:
- Update session_end
- Export to episodic memory
- Create backup
- Clear cache
```

## Storage Distribution

```
/workspace/dance/.marie-memory/
│
├── db/
│   └── marie.db                    [SQLite Database - 10-500MB]
│       • Structured data
│       • Relational queries
│       • ACID guarantees
│       • Full-text search
│
├── indexes/
│   ├── student-index.json          [Fast Lookup - < 1MB]
│   ├── task-index.json             [Recent tasks - < 1MB]
│   └── pattern-index.json          [Hot patterns - < 1MB]
│       • In-memory fast access
│       • Sub-millisecond retrieval
│       • Rebuilt from DB periodically
│
├── cache/
│   ├── recent-context.json         [Session Cache - < 5MB]
│   └── embeddings/                 [Vector Cache - 10-100MB]
│       └── task-*.json
│       • 5-minute TTL
│       • LRU eviction
│       • Optional semantic search
│
├── logs/
│   ├── memory-ops.log              [Operations Log - growing]
│   └── learning.log                [Learning Events - growing]
│       • Audit trail
│       • Debugging
│       • Performance monitoring
│
└── backups/
    └── daily/
        └── marie-backup-*.db.gz    [Daily Backups - compressed]
            • 30-day retention
            • Disaster recovery
            • Point-in-time restore
```

## Performance Characteristics

### Retrieval Performance

| Operation | Index | Cache | Database | Total |
|-----------|-------|-------|----------|-------|
| Student metadata | < 1ms | - | - | < 1ms |
| Full student context | < 1ms | < 1ms | 20ms | 1-20ms |
| Pattern lookup | < 1ms | - | - | < 1ms |
| Similar tasks | - | 5ms | 15ms | 5-15ms |
| Skill trends | - | 10ms | 30ms | 10-30ms |

### Storage Growth

| Data Type | Per Record | 1000 Records | Growth Rate |
|-----------|-----------|--------------|-------------|
| Student | 2 KB | 2 MB | Low |
| Task | 5 KB | 5 MB | Medium |
| Skill Assessment | 1 KB | 1 MB | Medium |
| Progress Log | 2 KB | 2 MB | High |
| Pattern | 3 KB | 3 MB | Low |

**Estimated Storage:**
- Small studio (50 students, 1 year): 50-100 MB
- Medium studio (200 students, 2 years): 200-500 MB
- Large studio (500 students, 5 years): 1-2 GB

### Learning Performance

| Operation | Frequency | Duration |
|-----------|-----------|----------|
| Pattern detection | Every 10 tasks | 2-5 seconds |
| Confidence update | Every task | < 100ms |
| Full learning scan | Daily | 10-30 seconds |

## Scalability Considerations

### Current Design Supports:
- Up to 1,000 students
- Up to 100,000 tasks
- Up to 10,000 patterns
- Years of historical data

### Optimization Strategies:
1. **Indexing**: All foreign keys and common queries
2. **Caching**: 5-minute TTL for hot data
3. **Archiving**: Move old data (>2 years) to archive DB
4. **Partitioning**: Separate DB per year if needed
5. **Compression**: GZIP old backups and logs

### Future Scaling (if needed):
- PostgreSQL migration for 10,000+ students
- Redis for distributed caching
- Elasticsearch for full-text search
- Vector DB (Pinecone/Qdrant) for semantic search

## Security Considerations

### Data Protection:
- SQLite database file permissions: 600 (owner only)
- Sensitive data: Student names, ages, assessments
- No PII in logs
- Backups encrypted (optional)

### Access Control:
- Marie container has exclusive access
- No external network access to DB
- File-based isolation via Docker volumes

### Privacy:
- Student data retention policy (configurable)
- Export/delete student data on request
- Anonymization for pattern learning (optional)

## Integration Points

### 1. Task Queue (File-based)
```
/tasks/marie/*.json → Memory Manager → Process → Store
```

### 2. Result Output
```
Memory → Generate Evaluation → /results/marie/*.json
```

### 3. MCP Episodic Memory
```
Session End → Export Summary → MCP Storage → Future Retrieval
```

### 4. File System Documents
```
Memory Context → Generate .md → /workspace/dance/students/*/
```

## Disaster Recovery

### Backup Strategy:
1. **Daily automated backups** (compressed)
2. **30-day retention** (automatic cleanup)
3. **Manual backups** before major operations
4. **Export to external storage** (optional)

### Recovery Procedures:

#### Database Corruption:
```bash
# Restore from latest backup
LATEST_BACKUP=$(ls -t .marie-memory/backups/daily/*.db.gz | head -1)
gunzip -c "$LATEST_BACKUP" > .marie-memory/db/marie.db
```

#### Index Corruption:
```bash
# Rebuild indexes from database
node .marie-memory/lib/rebuild-indexes.js
```

#### Complete Loss:
```bash
# Reinitialize system
bash .marie-memory/scripts/memory-manager.sh init

# Re-import from file documents
node .marie-memory/lib/reimport-from-files.js
```

## Monitoring Dashboards

### Key Metrics:
1. **Database Size**: Monitor growth rate
2. **Query Performance**: Track slow queries
3. **Pattern Count**: Growth of learned knowledge
4. **Cache Hit Rate**: Optimization effectiveness
5. **Session Recovery**: Successful restarts

### Health Checks:
- Database integrity check (daily)
- Backup verification (weekly)
- Index consistency (daily)
- Disk space monitoring (continuous)

### Alerts:
- Database > 80% disk space
- Query time > 500ms
- Backup failure
- Integrity check failure

---

## Summary

Marie's memory system is architected for:

**Reliability**
- ACID-compliant SQLite database
- Automated daily backups
- Disaster recovery procedures

**Performance**
- Sub-millisecond index lookups
- Smart caching layer
- Optimized database queries

**Scalability**
- Handles years of data
- Supports hundreds of students
- Efficient growth management

**Intelligence**
- Continuous pattern learning
- Confidence-based recommendations
- Context-aware processing

**Persistence**
- Survives container restarts
- Session continuity
- Long-term memory via MCP
