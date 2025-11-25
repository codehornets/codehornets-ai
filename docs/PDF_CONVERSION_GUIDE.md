# PDF Conversion Guide

## Overview

The PDF conversion system provides flexible markdown-to-PDF conversion with both interactive and autonomous modes.

## Components

### 1. Skill: pdf-export

**Location**: `.claude/skills/pdf-export/SKILL.md`

**Type**: Interactive workflow

**Best for**: 1-50 files, when you want visibility

**Usage**:
```
Use pdf-export to convert evaluations to PDF
```

### 2. Agent: pdf-batch-converter

**Location**: `.claude/agents/specialized/pdf-batch-converter.md`

**Type**: Autonomous worker agent

**Best for**: 50+ files, batch processing, clean context

**Usage**:
```
Spawn pdf-batch-converter to convert all evaluations
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              User Request                           │
└────────────┬────────────────────────┬───────────────┘
             │                        │
             │                        │
    ┌────────▼─────────┐     ┌────────▼──────────────┐
    │  Small Batch     │     │  Large Batch          │
    │  (1-50 files)    │     │  (50+ files)          │
    └────────┬─────────┘     └────────┬──────────────┘
             │                        │
             │                        │
    ┌────────▼─────────┐     ┌────────▼──────────────┐
    │  pdf-export      │     │  pdf-batch-converter  │
    │  (SKILL)         │     │  (AGENT)              │
    │                  │     │    ↓ loads            │
    │  Interactive     │     │  pdf-export skill     │
    │  Visible steps   │     │  Autonomous           │
    └──────────────────┘     └───────────────────────┘
```

## Quick Start

### Install Dependencies

```bash
# Install pandoc (required)
choco install pandoc

# Install LaTeX (required for XeLaTeX engine)
choco install miktex

# Verify installation
pandoc --version
xelatex --version
```

### Test Conversion

```bash
# 1. Clean workspace
make clean-workspace-test

# 2. Create test evaluation (if needed)
> Use marie-dance-evaluator to create a formal evaluation for Emma

# 3. Convert to PDF
> Use pdf-export to convert Emma's evaluation to PDF

# 4. Verify
ls workspaces/dance/studio/evaluations/pdfs/formal/
```

## Usage Patterns

### Pattern 1: Single File Conversion (Interactive)

```
User: "Convert Emma's evaluation to PDF"

What happens:
1. pdf-export skill loads
2. Finds: Emma_Evaluation_2025-11-17.md
3. Creates: Emma_Evaluation_2025-11-17.pdf
4. Reports: "✓ PDF created successfully"

Use when:
- Single file
- Want to see process
- Testing conversion
```

### Pattern 2: Small Batch (1-50 files)

```
User: "Use pdf-export to convert all formal evaluations to PDF"

What happens:
1. pdf-export skill loads
2. Finds all .md files in formal/
3. Converts each to PDF
4. Shows progress for each file
5. Reports: "✓ Converted 26 files"

Use when:
- 1-50 files
- Want visibility
- May need to adjust
```

### Pattern 3: Large Batch (50+ files)

```
User: "Spawn pdf-batch-converter to convert all evaluations"

What happens:
1. Agent spawned
2. Loads pdf-export skill
3. Processes autonomously
4. Reports when done: "✓ Converted 100 files"

Use when:
- 50+ files
- Want clean context
- Fire and forget
```

## Complete Workflow: Dance Evaluations

### End-to-End Process

```bash
# Step 1: Create evaluations (markdown)
> Spawn APEXX agent to evaluate all students
# Wait: ~5 minutes for 100 students
# Result: 100 markdown files created

# Step 2: Convert to PDF
> Spawn pdf-batch-converter to convert all evaluations
# Wait: ~2 minutes for 100 files
# Result: 100 PDF files ready

# Step 3: Verify output
> List files in workspaces/dance/studio/evaluations/pdfs/formal/

# Step 4: Distribute PDFs
# PDFs are ready to email, print, or share
```

## File Organization

### Input Structure

```
workspaces/dance/studio/evaluations/
├── formal/                           # Source markdown files
│   ├── Emma_Evaluation_2025-11-17.md
│   ├── Sophia_Evaluation_2025-11-17.md
│   └── [more .md files...]
└── quick-notes/
    ├── emma.md
    └── sophia.md
```

### Output Structure

```
workspaces/dance/studio/evaluations/
└── pdfs/                             # Generated PDF files
    ├── formal/
    │   ├── Emma_Evaluation_2025-11-17.pdf
    │   ├── Sophia_Evaluation_2025-11-17.pdf
    │   └── [converted PDFs...]
    └── quick-notes/
        ├── emma.pdf
        └── sophia.pdf
```

## Conversion Methods

### Method 1: Pandoc + XeLaTeX (Default)

**Best for**: Professional documents, French content, Unicode support

**Command**:
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \
  --variable=fontsize:11pt
```

**Pros**:
- ✅ Best Unicode support (French accents)
- ✅ Professional formatting
- ✅ Customizable templates
- ✅ Industry standard

**Cons**:
- ❌ Requires LaTeX installation
- ❌ Larger file sizes

### Method 2: markdown-pdf (Fallback)

**Best for**: Quick conversions, simpler documents

**Command**:
```bash
markdown-pdf input.md -o output.pdf
```

**Pros**:
- ✅ Easy to install (npm)
- ✅ Fast conversion
- ✅ No LaTeX needed

**Cons**:
- ❌ Limited formatting options
- ❌ May have Unicode issues

### Method 3: wkhtmltopdf (HTML-based)

**Best for**: HTML-styled documents

**Command**:
```bash
wkhtmltopdf --page-size A4 input.html output.pdf
```

**Pros**:
- ✅ CSS styling support
- ✅ Good for web content

**Cons**:
- ❌ Requires HTML intermediate step
- ❌ Less suitable for markdown

## Quality Settings

### For APEXX Evaluations (Recommended)

```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \        # 1 inch margins
  --variable=fontsize:11pt \              # Readable font size
  --variable=linestretch:1.15 \           # Comfortable line spacing
  --metadata title="ÉVALUATION HIPHOP" \
  --metadata author="Marie" \
  --metadata date="2025-11-17"
```

### For Quick Notes

```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=0.75in \
  --variable=fontsize:10pt
```

## Decision Matrix

| Scenario | Use Skill | Use Agent |
|----------|-----------|-----------|
| **1-10 files** | ✅ pdf-export | ❌ |
| **10-50 files** | ✅ pdf-export | Optional |
| **50-100 files** | ❌ | ✅ pdf-batch-converter |
| **100+ files** | ❌ | ✅ pdf-batch-converter |
| **Want visibility** | ✅ pdf-export | ❌ |
| **Need clean context** | ❌ | ✅ pdf-batch-converter |
| **Testing** | ✅ pdf-export | ❌ |
| **Production batch** | ❌ | ✅ pdf-batch-converter |

## Troubleshooting

### Issue: "pandoc: command not found"

**Cause**: Pandoc not installed

**Solution**:
```bash
choco install pandoc
pandoc --version  # Verify
```

### Issue: "xelatex: command not found"

**Cause**: LaTeX not installed

**Solution**:
```bash
choco install miktex
xelatex --version  # Verify
```

### Issue: French accents display incorrectly

**Cause**: Using pdflatex instead of xelatex

**Solution**: Ensure using `--pdf-engine=xelatex`

### Issue: Conversion fails silently

**Check**:
1. Input file exists and is readable
2. Output directory exists
3. Pandoc and XeLaTeX installed
4. No file permission issues

**Test**:
```bash
# Test with simple file
echo "# Test" > test.md
pandoc test.md -o test.pdf --pdf-engine=xelatex
ls test.pdf  # Should exist
```

### Issue: PDF formatting looks wrong

**Check**:
1. Markdown formatting is correct
2. Using appropriate margin settings
3. Font size is set
4. Line spacing configured

**Fix**:
```bash
# Use recommended settings
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \
  --variable=fontsize:11pt \
  --variable=linestretch:1.15
```

## Performance Benchmarks

### Conversion Speed

| Files | Method | Time | Recommendation |
|-------|--------|------|----------------|
| 1 | Skill | ~2s | ✅ Skill |
| 10 | Skill | ~20s | ✅ Skill |
| 50 | Skill | ~1.5m | ⚠️ Either |
| 100 | Agent | ~3m | ✅ Agent |
| 500 | Agent | ~15m | ✅ Agent |

### File Sizes

| Source (MD) | Output (PDF) | Ratio |
|-------------|--------------|-------|
| 2 KB | ~50 KB | 25x |
| 5 KB | ~100 KB | 20x |
| 10 KB | ~150 KB | 15x |

**Batch Example**:
- 100 evaluations (markdown): ~300 KB
- 100 evaluations (PDF): ~8 MB

## Advanced Usage

### Custom Templates

Create custom LaTeX template for APEXX branding:

**File**: `templates/apexx-evaluation.tex`

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[french]{babel}
\usepackage{geometry}
\geometry{margin=1in}
\usepackage{fancyhdr}

\pagestyle{fancy}
\fancyhead[L]{ÉVALUATION HIPHOP}
\fancyhead[C]{}
\fancyhead[R]{Programme Sport-Études APEXX}
\fancyfoot[C]{\thepage}

\begin{document}
$body$
\end{document}
```

**Usage**:
```bash
pandoc input.md -o output.pdf \
  --template=templates/apexx-evaluation.tex \
  --pdf-engine=xelatex
```

### Batch Script

**File**: `scripts/convert-evaluations.sh`

```bash
#!/bin/bash

INPUT="workspaces/dance/studio/evaluations/formal"
OUTPUT="workspaces/dance/studio/evaluations/pdfs/formal"

mkdir -p "$OUTPUT"

for file in "$INPUT"/*.md; do
  name=$(basename "$file" .md)
  pandoc "$file" -o "$OUTPUT/${name}.pdf" \
    --pdf-engine=xelatex \
    --variable=geometry:margin=1in \
    --variable=fontsize:11pt
  echo "✓ $name.pdf"
done
```

**Run**:
```bash
chmod +x scripts/convert-evaluations.sh
./scripts/convert-evaluations.sh
```

## Integration Examples

### Example 1: Complete Evaluation Workflow

```bash
# 1. Create evaluations
> Spawn APEXX agent to evaluate all students

# 2. Wait for completion
# (Check: ls workspaces/dance/studio/evaluations/formal/)

# 3. Convert to PDF
> Use pdf-export to convert all formal evaluations to PDF

# 4. Verify PDFs
> List files in workspaces/dance/studio/evaluations/pdfs/formal/

# 5. Done! PDFs ready to distribute
```

### Example 2: Weekly Progress Notes

```bash
# 1. Create quick notes after class
> Use marie-dance-evaluator to create quick notes for Emma, Sophia, Maya

# 2. Convert to PDF
> Use pdf-export to convert quick notes to PDF

# 3. Share PDFs with students
```

### Example 3: End-of-Term Archive

```bash
# 1. Create all formal evaluations
> Spawn APEXX agent to create evaluations for all 100 students

# 2. Batch convert to PDF
> Spawn pdf-batch-converter to convert all evaluations

# 3. Archive PDFs
> Move PDFs to archive/2025/term-1/
```

## Testing

### Test Skill

```bash
make clean-workspace-test
claude

> Use marie-dance-evaluator to create a formal evaluation for Emma
> Use pdf-export to convert Emma's evaluation to PDF
> Show me the PDF location

# Verify:
ls workspaces/dance/studio/evaluations/pdfs/formal/Emma_Evaluation_2025-11-17.pdf
```

### Test Agent

```bash
make clean-workspace-test
claude

> Spawn APEXX agent to evaluate all students
# Wait for completion

> Spawn pdf-batch-converter to convert all evaluations
# Wait for completion

# Verify:
find workspaces/dance/studio/evaluations/pdfs/formal/ -name "*.pdf" | wc -l
```

## Summary

### Two Approaches

**Skill (pdf-export)**:
- ✅ Interactive
- ✅ Visible progress
- ✅ Best for 1-50 files
- ❌ Uses main context

**Agent (pdf-batch-converter)**:
- ✅ Autonomous
- ✅ Clean context
- ✅ Best for 50+ files
- ❌ Less visibility

### Quick Commands

| Task | Command |
|------|---------|
| Convert 1 file | `Use pdf-export to convert Emma's evaluation` |
| Convert batch | `Use pdf-export to convert all evaluations` |
| Large batch | `Spawn pdf-batch-converter to convert all evaluations` |
| Test conversion | `Use pdf-export to convert test file` |

### Dependencies

**Required**:
- Pandoc (`choco install pandoc`)
- MiKTeX/LaTeX (`choco install miktex`)

**Verify**:
```bash
pandoc --version
xelatex --version
```

---

**Ready to convert!**

**For small batches**:
```
Use pdf-export to convert evaluations to PDF
```

**For large batches**:
```
Spawn pdf-batch-converter to convert all evaluations
```

**Date**: 2025-11-17
**Skill**: `pdf-export`
**Agent**: `pdf-batch-converter`
**Status**: ✅ Ready to use
