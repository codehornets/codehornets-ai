---
name: pdf-batch-converter
description: Autonomous PDF conversion agent that uses the pdf-export SKILL to batch convert large numbers of markdown files to PDF. Spawned to handle 50+ file conversions without polluting main context. Loads skill, processes files, and reports completion.
color: orange
---

# PDF Batch Converter Agent

## Purpose

This autonomous agent handles large-scale PDF conversion tasks by loading and executing the **pdf-export SKILL**. It runs independently to keep the main Claude Code context clean while processing batch PDF conversions.

## How It Works

When invoked, this agent:

1. **Loads the Skill**: Reads `.claude/skills/pdf-export/SKILL.md`
2. **Follows Workflow**: Executes the skill's conversion steps
3. **Processes Autonomously**: Converts files without user interaction
4. **Reports Back**: Returns completion status and file locations

## Skill Integration

**This agent uses the pdf-export skill for all operations.**

To understand what this agent does, refer to:
- **Skill Definition**: `.claude/skills/pdf-export/SKILL.md`
- **Skill Purpose**: Convert markdown files to professional PDF documents

## When to Use This Agent

**Automatically invoked** when:
- Converting 50+ files (large batch)
- Conversion would pollute main context
- Background PDF processing needed

**Manually invoke via Task tool**:
```javascript
Task({
  subagent_type: "pdf-batch-converter",
  description: "Convert all evaluations to PDF",
  prompt: "Use pdf-export skill to batch convert all markdown evaluations to PDF"
})
```

**Natural language**:
```
Spawn pdf-batch-converter agent to convert all evaluations to PDF
```

## Agent Workflow

### Step 1: Load Skill Instructions
```bash
Read: .claude/skills/pdf-export/SKILL.md
```

### Step 2: Follow Skill Workflow

The agent then follows the pdf-export skill workflow exactly:

1. Identify markdown files to convert
2. Create output directory structure
3. Batch convert files to PDF
4. Verify all conversions successful
5. Report results

### Step 3: Report Results

Returns to main Claude Code with:
- Number of files converted
- Output location
- Any errors encountered
- Total processing time

## File Paths

### Input Files

```
workspaces/dance/studio/evaluations/
├── formal/                           # Formal evaluations (markdown)
│   ├── Emma_Evaluation_2025-11-17.md
│   ├── Sophia_Evaluation_2025-11-17.md
│   └── [50+ more files...]
└── quick-notes/                      # Quick notes (markdown)
    └── [multiple .md files]
```

### Output Files

```
workspaces/dance/studio/evaluations/
└── pdfs/                             # Generated PDFs
    ├── formal/
    │   ├── Emma_Evaluation_2025-11-17.pdf
    │   ├── Sophia_Evaluation_2025-11-17.pdf
    │   └── [50+ more PDFs...]
    └── quick-notes/
        └── [converted PDFs]
```

## Conversion Methods

The agent (via skill) supports multiple PDF engines:

### Method 1: Pandoc with XeLaTeX (Default)
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \
  --variable=fontsize:11pt
```

### Method 2: markdown-pdf (Fallback)
```bash
markdown-pdf input.md -o output.pdf
```

### Method 3: wkhtmltopdf (Alternative)
```bash
wkhtmltopdf --page-size A4 input.html output.pdf
```

## Use Cases

### Use Case 1: Post-Evaluation Batch Export

After APEXX agent creates evaluations:
```
1. APEXX agent creates 100 markdown evaluations
   ↓
2. pdf-batch-converter agent converts to PDF
   ↓
3. PDFs ready for distribution
```

**Workflow**:
```bash
# Step 1: Create evaluations
> Spawn APEXX agent to evaluate all students

# Step 2: Convert to PDF (autonomous)
> Spawn pdf-batch-converter to convert all evaluations
```

### Use Case 2: Archive Previous Evaluations

Converting historical markdown evaluations:
```
> Spawn pdf-batch-converter to convert all evaluations from 2024
```

### Use Case 3: Multi-Format Export

Create both formal and quick note PDFs:
```
> Spawn pdf-batch-converter to convert all formal evaluations and quick notes
```

## Performance

### Expected Processing Times

| Files | Estimated Time | Recommendation |
|-------|---------------|----------------|
| 1-10 | ~10-20 seconds | Use skill directly |
| 10-50 | ~30-60 seconds | Use skill or agent |
| 50-100 | ~1-2 minutes | Use agent ✅ |
| 100+ | ~2-5 minutes | Use agent ✅ |

### Agent Benefits for Large Batches

- ✅ **Clean Context**: Main Claude stays responsive
- ✅ **Autonomous**: Fire and forget
- ✅ **Parallel Ready**: Can run while you do other work
- ✅ **Error Recovery**: Handles failures gracefully
- ✅ **Progress Tracking**: Reports completion status

## Error Handling

The agent handles common errors:

### Missing Dependencies
```
Error: pandoc not found
→ Agent reports: "Install pandoc to enable PDF conversion"
```

### Conversion Failures
```
Error: Failed to convert file.md
→ Agent continues with remaining files
→ Reports failed files at end
```

### Disk Space
```
Error: No space left on device
→ Agent stops and reports status
→ Lists successfully converted files
```

## Integration with APEXX Workflow

### Combined Dance Evaluation Workflow

```
Step 1: Create Evaluations (APEXX Agent)
  ↓
Step 2: Convert to PDF (pdf-batch-converter Agent)
  ↓
Step 3: Distribute PDFs
```

**Complete command sequence**:
```bash
# 1. Create all evaluations
> Spawn APEXX agent to evaluate all 100 students

# 2. Wait for completion (~5 minutes)

# 3. Convert to PDF
> Spawn pdf-batch-converter to convert all evaluations to PDF

# 4. Wait for conversion (~2 minutes)

# 5. Verify output
> List files in workspaces/dance/studio/evaluations/pdfs/formal/
```

## When NOT to Use This Agent

Use the **pdf-export skill directly** instead when:

- ❌ Converting less than 50 files
- ❌ Want to see conversion progress
- ❌ Need to adjust settings during conversion
- ❌ Testing conversion with small batch first

**Direct skill usage**:
```
Use pdf-export to convert Emma's evaluation to PDF
```

## Invocation Examples

### Example 1: Convert All Formal Evaluations

```javascript
Task({
  subagent_type: "pdf-batch-converter",
  description: "Convert all formal evaluations",
  prompt: "Use pdf-export skill to convert all markdown files in workspaces/dance/studio/evaluations/formal/ to PDF"
})
```

### Example 2: Convert Specific Directory

```javascript
Task({
  subagent_type: "pdf-batch-converter",
  description: "Convert 2024 evaluations",
  prompt: "Use pdf-export skill to convert all 2024 evaluations to PDF"
})
```

### Example 3: Natural Language

```
Spawn pdf-batch-converter to convert all dance evaluations to PDF
```

## Quality Assurance

The agent ensures:
- ✅ All French accents preserved (é, è, à, ç)
- ✅ Formatting maintained (headings, lists, emphasis)
- ✅ Professional margins (1 inch default)
- ✅ Readable font size (11pt default)
- ✅ Consistent file naming
- ✅ Error reporting for failed conversions

## Output Report

After completion, the agent reports:

```
PDF Batch Conversion Complete!

Summary:
  ✓ Files processed: 100
  ✓ Successful: 98
  ✗ Failed: 2

Output Location:
  workspaces/dance/studio/evaluations/pdfs/formal/

Failed Files:
  - corrupted_file.md (invalid UTF-8)
  - empty_file.md (no content)

Total Size: 5.2 MB
Processing Time: 2m 15s
```

## Troubleshooting

### Issue: Agent Not Spawning

**Check**:
1. Agent file exists: `.claude/agents/specialized/pdf-batch-converter.md`
2. YAML frontmatter has `name: pdf-batch-converter`
3. Claude Code restarted after agent creation

### Issue: Conversions Failing

**Agent will**:
1. Attempt conversion with primary method (pandoc)
2. Fall back to secondary method if primary fails
3. Report which files failed and why
4. Continue with remaining files

### Issue: Can't See Progress

**Normal behavior** - agent runs autonomously. You'll see:
- Start: "Task(description)"
- End: "Done (X files converted · Xm Xs)"

For visibility, use skill directly:
```
Use pdf-export to convert files
```

## Agent vs Skill Decision Matrix

| Scenario | Use Skill | Use Agent |
|----------|-----------|-----------|
| 1-10 files | ✅ | ❌ |
| 10-50 files | ✅ | Optional |
| 50-100 files | ❌ | ✅ |
| 100+ files | ❌ | ✅ |
| Need visibility | ✅ | ❌ |
| Need clean context | ❌ | ✅ |
| Testing | ✅ | ❌ |
| Production batch | ❌ | ✅ |

## Dependencies

The agent requires (via skill):

### Required
- **Pandoc**: PDF conversion engine
- **XeLaTeX**: PDF rendering (for Unicode support)

### Optional
- **markdown-pdf**: Alternative converter
- **wkhtmltopdf**: HTML-based conversion

### Installation

**Windows**:
```bash
choco install pandoc
choco install miktex
```

**Verify**:
```bash
pandoc --version
xelatex --version
```

## Future Enhancements

Potential agent improvements:
- Parallel processing (convert multiple files simultaneously)
- Custom template support (APEXX branding)
- Compression options (reduce PDF file sizes)
- Metadata embedding (author, date, title)
- Email distribution (send PDFs directly)

## Summary

**This agent provides**:
- ✅ Autonomous batch PDF conversion
- ✅ Clean main context (no pollution)
- ✅ Error handling and recovery
- ✅ Progress reporting
- ✅ Professional formatting
- ✅ Multiple conversion methods

**Use when**: Converting 50+ files or need background processing

**Use skill instead when**: Converting <50 files or want visibility

---

**Ready to convert!** Just say:
```
Spawn pdf-batch-converter to convert all evaluations to PDF
```
