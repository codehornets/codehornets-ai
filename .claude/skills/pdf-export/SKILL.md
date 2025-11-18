---
name: pdf-export
description: Convert markdown files to professional PDF documents. Use this skill when converting evaluations, reports, or any markdown documents to PDF format. Supports custom styling, headers, footers, and batch processing.
---

# PDF Export Skill

## Purpose
Convert markdown files to professional PDF documents with proper formatting, styling, and metadata.

## When to Use This Skill
- Converting dance evaluations to PDF for distribution
- Creating PDF reports from markdown documentation
- Batch converting multiple markdown files
- Exporting formatted documents for printing or sharing

## Supported Tools

This skill can use multiple PDF conversion methods:

### Method 1: Pandoc (Recommended)
Best for professional formatting with custom templates.

**Install**:
```bash
# Windows (via Chocolatey)
choco install pandoc

# Or download from: https://pandoc.org/installing.html
```

**Usage**:
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --template=template.tex \
  --variable=geometry:margin=1in
```

### Method 2: markdown-pdf (Node.js)
Simple, lightweight option.

**Install**:
```bash
npm install -g markdown-pdf
```

**Usage**:
```bash
markdown-pdf input.md -o output.pdf
```

### Method 3: wkhtmltopdf
HTML-based conversion with CSS styling.

**Install**:
```bash
# Download from: https://wkhtmltopdf.org/downloads.html
```

**Usage**:
```bash
wkhtmltopdf --page-size A4 --margin-top 20mm input.html output.pdf
```

## Workflow

### Step 1: Identify Files to Convert

```bash
# Find all markdown evaluations
find workspaces/dance/studio/evaluations/formal/ -name "*.md" -type f
```

### Step 2: Create Output Directory

```bash
# Create PDF output directory
mkdir -p workspaces/dance/studio/evaluations/pdfs/
```

### Step 3: Convert Files

**Single file**:
```bash
pandoc workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md \
  -o workspaces/dance/studio/evaluations/pdfs/Emma_Evaluation_2025-11-17.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \
  --variable=fontsize:11pt
```

**Batch conversion**:
```bash
# Convert all markdown files to PDF
for file in workspaces/dance/studio/evaluations/formal/*.md; do
  filename=$(basename "$file" .md)
  pandoc "$file" \
    -o "workspaces/dance/studio/evaluations/pdfs/${filename}.pdf" \
    --pdf-engine=xelatex \
    --variable=geometry:margin=1in \
    --variable=fontsize:11pt
done
```

### Step 4: Verify Output

```bash
# List generated PDFs
ls -lh workspaces/dance/studio/evaluations/pdfs/

# Count PDFs created
find workspaces/dance/studio/evaluations/pdfs/ -name "*.pdf" | wc -l
```

### Step 5: Report Results

Report to user:
- Number of files converted
- Output location
- Any errors encountered
- Total file size

## File Paths

### Input (Markdown Files)
```
workspaces/dance/studio/evaluations/
├── formal/                           # Formal evaluations (markdown)
│   ├── Emma_Evaluation_2025-11-17.md
│   ├── Sophia_Evaluation_2025-11-17.md
│   └── [more evaluations...]
└── quick-notes/                      # Quick notes (markdown)
    ├── emma.md
    └── sophia.md
```

### Output (PDF Files)
```
workspaces/dance/studio/evaluations/
└── pdfs/                             # Generated PDFs
    ├── formal/
    │   ├── Emma_Evaluation_2025-11-17.pdf
    │   └── Sophia_Evaluation_2025-11-17.pdf
    └── quick-notes/
        ├── emma.pdf
        └── sophia.pdf
```

## Conversion Options

### Basic Conversion (Default)
```bash
pandoc input.md -o output.pdf
```

### Professional Format (APEXX Evaluations)
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \
  --variable=fontsize:11pt \
  --variable=linestretch:1.15 \
  --toc \
  --toc-depth=2
```

### With Custom Header/Footer
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --variable=geometry:margin=1in \
  --include-in-header=header.tex \
  --include-after-body=footer.tex
```

### With Metadata
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  --metadata title="ÉVALUATION HIPHOP - APEXX" \
  --metadata author="Marie" \
  --metadata date="2025-11-17"
```

## Template for APEXX Evaluations

### Create LaTeX Template (Optional)

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

## Batch Conversion Script

### Create Conversion Script

**File**: `scripts/convert-evaluations-to-pdf.sh`

```bash
#!/bin/bash

# PDF Export Script for Dance Evaluations

INPUT_DIR="workspaces/dance/studio/evaluations/formal"
OUTPUT_DIR="workspaces/dance/studio/evaluations/pdfs/formal"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Counter
count=0
errors=0

echo "Converting markdown evaluations to PDF..."
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

# Convert each markdown file
for file in "$INPUT_DIR"/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .md)
    output="$OUTPUT_DIR/${filename}.pdf"

    echo "Converting: $filename.md → $filename.pdf"

    if pandoc "$file" -o "$output" \
      --pdf-engine=xelatex \
      --variable=geometry:margin=1in \
      --variable=fontsize:11pt \
      --variable=linestretch:1.15 \
      2>/dev/null; then
      ((count++))
      echo "  ✓ Success"
    else
      ((errors++))
      echo "  ✗ Error"
    fi
  fi
done

echo ""
echo "Conversion complete:"
echo "  Success: $count files"
echo "  Errors: $errors files"
echo "  Location: $OUTPUT_DIR"
```

**Make executable**:
```bash
chmod +x scripts/convert-evaluations-to-pdf.sh
```

**Run**:
```bash
./scripts/convert-evaluations-to-pdf.sh
```

## Error Handling

### Common Issues

**Issue 1: Pandoc not found**
```
Error: pandoc: command not found
```
**Solution**: Install pandoc (see Method 1 above)

**Issue 2: PDF engine not found**
```
Error: xelatex not found
```
**Solution**: Install TeX distribution:
- Windows: MiKTeX or TeX Live
- Run: `choco install miktex`

**Issue 3: Unicode errors**
```
Error: ! Package inputenc Error: Unicode char not set up
```
**Solution**: Use `--pdf-engine=xelatex` instead of `--pdf-engine=pdflatex`

**Issue 4: File not found**
```
Error: input.md: openBinaryFile: does not exist
```
**Solution**: Verify file path is correct and file exists

## Quality Checklist

Before finalizing PDFs:
- ✅ All French accents display correctly (é, è, à, etc.)
- ✅ Formatting preserved (headings, lists, emphasis)
- ✅ Page margins appropriate (1 inch recommended)
- ✅ Font size readable (11pt recommended)
- ✅ Line spacing comfortable (1.15 recommended)
- ✅ File names match source files
- ✅ All files converted successfully

## Example Usage

### Example 1: Convert Single Evaluation

```
User: "Convert Emma's evaluation to PDF"

Steps:
1. Find: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
2. Create output dir: workspaces/dance/studio/evaluations/pdfs/formal/
3. Convert: pandoc Emma_Evaluation_2025-11-17.md -o Emma_Evaluation_2025-11-17.pdf
4. Verify: Check PDF created successfully
5. Report: "✓ Emma_Evaluation_2025-11-17.pdf created"
```

### Example 2: Batch Convert All Evaluations

```
User: "Convert all formal evaluations to PDF"

Steps:
1. Find all: workspaces/dance/studio/evaluations/formal/*.md
2. Count: 26 files found
3. Create output dir
4. Loop through each file:
   - Convert to PDF
   - Report progress
5. Report: "✓ Converted 26 evaluations to PDF"
```

### Example 3: Convert with Custom Styling

```
User: "Convert evaluations to PDF with APEXX branding"

Steps:
1. Create custom template (if not exists)
2. Convert with template
3. Include APEXX header/footer
4. Report completion
```

## Integration with APEXX Workflow

### Combined Workflow

```
1. APEXX agent creates markdown evaluations
   ↓
2. Use pdf-export skill to convert to PDF
   ↓
3. PDFs ready for distribution
```

**Commands**:
```bash
# Step 1: Create evaluations
> Spawn APEXX agent to evaluate all students

# Step 2: Convert to PDF
> Use pdf-export to convert all evaluations to PDF
```

## Performance

### Conversion Speed

- **Single file**: ~1-2 seconds
- **10 files**: ~10-20 seconds
- **50 files**: ~1 minute
- **100+ files**: Use pdf-batch-converter agent instead

### File Sizes

- **Markdown**: ~2-5 KB per evaluation
- **PDF**: ~50-100 KB per evaluation
- **Batch (26 students)**: ~1-2 MB total

## Troubleshooting

### Test Conversion

```bash
# Test with single file
pandoc workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md \
  -o test-output.pdf

# Check if PDF created
ls -lh test-output.pdf

# Open PDF to verify
# (Windows: start test-output.pdf)
```

### Verify Dependencies

```bash
# Check pandoc installed
pandoc --version

# Check PDF engine available
xelatex --version

# Check markdown files exist
ls workspaces/dance/studio/evaluations/formal/*.md
```

## Tips for Best Results

1. **Use XeLaTeX**: Better Unicode support for French characters
2. **Set Margins**: 1 inch margins for professional appearance
3. **Font Size**: 11pt for readability
4. **Line Spacing**: 1.15 for comfortable reading
5. **Verify Output**: Always check first PDF before batch conversion
6. **Keep Markdown Clean**: Remove any HTML comments or special characters

## Alternative: Node.js Script

For more control, create a Node.js script:

**File**: `scripts/convert-to-pdf.js`

```javascript
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const inputDir = 'workspaces/dance/studio/evaluations/formal';
const outputDir = 'workspaces/dance/studio/evaluations/pdfs/formal';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all markdown files
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.md'));

console.log(`Converting ${files.length} files to PDF...`);

let completed = 0;
let errors = 0;

files.forEach(file => {
  const input = path.join(inputDir, file);
  const output = path.join(outputDir, file.replace('.md', '.pdf'));

  const cmd = `pandoc "${input}" -o "${output}" --pdf-engine=xelatex --variable=geometry:margin=1in`;

  exec(cmd, (error) => {
    if (error) {
      console.error(`✗ Error: ${file}`);
      errors++;
    } else {
      console.log(`✓ Success: ${file}`);
      completed++;
    }

    if (completed + errors === files.length) {
      console.log(`\nCompleted: ${completed}/${files.length}`);
      console.log(`Errors: ${errors}`);
    }
  });
});
```

**Run**:
```bash
node scripts/convert-to-pdf.js
```

## Summary

**This skill provides**:
- ✅ Multiple conversion methods
- ✅ Batch processing capability
- ✅ Custom styling options
- ✅ Error handling
- ✅ Progress reporting
- ✅ Professional formatting

**For large batches (50+ files)**, use the **pdf-batch-converter agent** instead to keep context clean.

---

**Ready to convert!** Just say:
```
Use pdf-export to convert all evaluations to PDF
```
