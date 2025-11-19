# Marie PDF Generation Guide

## Overview

Marie can now automatically generate professional PDF evaluations matching the official "ÉVALUATION HIPHOP – SPORT-ÉTUDES APEXX" format with proper formatting, French typography, and Marie-Josée Corriveau's signature.

## What Changed

### Before
- Marie created markdown evaluations only
- Manual PDF conversion required
- Inconsistent formatting

### After
- Marie creates **both** markdown and PDF automatically
- Professional APEXX format with signature
- Consistent, print-ready documents

---

## How It Works

```
┌──────────────┐
│    Task:     │
│   Evaluate   │
│   Student    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│  Marie creates markdown  │
│  evaluation in French    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Marie runs PDF generator │
│ python tool with         │
│ reportlab library        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│   Professional PDF with  │
│   • APEXX format        │
│   • Bold headings       │
│   • Signature line      │
│   • French accents      │
└──────────────────────────┘
```

---

## Setup

### 1. Restart Marie's Container

Marie needs reportlab installed:

```bash
cd core
docker-compose down marie
docker-compose up marie -d
```

**What happens on startup**:
- Container starts
- `pip install reportlab` (automatic)
- PDF generator tool mounted at `/tools/pdf-generator/`
- Marie ready to create PDFs

### 2. Verify Installation

Check Marie's container logs:

```bash
docker logs marie | head -20
```

You should see:
```
Successfully installed reportlab-4.x.x
```

---

## Usage

### Send Evaluation Task to Marie

```bash
./send-task-to-marie.sh "Create formal evaluation for Emma Rodriguez"
```

### What Marie Does

1. **Creates markdown evaluation**:
   - Path: `/workspace/dance/evaluations/formal/Emma_Rodriguez_Evaluation_2025-11-18.md`
   - Format: Standard APEXX sections with scores
   - Language: French

2. **Generates PDF automatically**:
   - Runs: `python3 /tools/pdf-generator/generate_evaluation_pdf.py`
   - Output: `/workspace/dance/evaluations/pdf/Emma_Rodriguez_Evaluation_2025-11-18.pdf`
   - Format: Professional APEXX with signature

3. **Reports results**:
   ```json
   {
     "status": "complete",
     "artifacts": [
       {
         "type": "evaluation-markdown",
         "path": "/workspace/dance/evaluations/formal/Emma_Rodriguez_Evaluation_2025-11-18.md"
       },
       {
         "type": "evaluation-pdf",
         "path": "/workspace/dance/evaluations/pdf/Emma_Rodriguez_Evaluation_2025-11-18.pdf"
       }
     ]
   }
   ```

---

## Output Files

### Markdown (editable)

**Location**: `workspaces/dance/studio/evaluations/formal/[Student]_Evaluation_[Date].md`

```markdown
# Emma Rodriguez - Évaluation Hip-Hop

## Expression artistique (8/10)
Emma démontre une présence scénique...

## Coordination (7/10)
Sa coordination...

[... 7 more sections ...]

## Score Total: 75/100
```

### PDF (distribution)

**Location**: `workspaces/dance/studio/evaluations/pdf/[Student]_Evaluation_[Date].pdf`

**Format**:
```
═══════════════════════════════════════════════
  ÉVALUATION HIPHOP – SPORT-ÉTUDES APEXX
───────────────────────────────────────────────

Nom: Emma Rodriguez
Date: 2025-11-18
Évalué par: Marie-Josée Corriveau

Expression artistique 8/10 :
Emma démontre une présence scénique...

[... 8 more sections ...]

TOTAL: 75/100

Signature: Marie-Josée Corriveau
           ─────────────────────
```

---

## PDF Format Details

### Typography
- **Title**: Helvetica-Bold, 14pt, centered, underlined
- **Headings**: Helvetica-Bold, 11pt
- **Body**: Helvetica, 10pt
- **Signature**: Helvetica-Oblique (italic), 12pt

### Layout
- **Page Size**: Letter (8.5" × 11")
- **Margins**: 1 inch all sides
- **Line Spacing**: 1.2

### Sections (9 total)
1. Expression artistique (X/10)
2. Coordination (X/10)
3. Effort (X/10)
4. Endurance (X/10)
5. Fondation (Bounce / Rock / Groove) (X/30)
6. Musicalité (X/10)
7. Chorégraphie (X/10)
8. Application des corrections (X/5)
9. Processus d'apprentissage (X/5)

### Signature
- Displays: "Signature: Marie-Josée Corriveau"
- Font: Italic/oblique for handwritten appearance
- Position: Bottom of document

---

## Troubleshooting

### PDF Not Generated

**Check Marie's logs**:
```bash
docker logs marie --tail 50
```

**Common issues**:

1. **reportlab not installed**:
   ```
   ModuleNotFoundError: No module named 'reportlab'
   ```
   **Fix**: Restart Marie's container

2. **PDF directory doesn't exist**:
   ```
   FileNotFoundError: [Errno 2] No such file or directory: '/workspace/dance/evaluations/pdf/'
   ```
   **Fix**:
   ```bash
   mkdir -p workspaces/dance/studio/evaluations/pdf
   ```

3. **Permission denied**:
   ```
   PermissionError: [Errno 13] Permission denied: '/workspace/dance/evaluations/pdf/'
   ```
   **Fix**:
   ```bash
   chmod -R 755 workspaces/dance/
   ```

### Verify PDF Generator Tool

From inside Marie's container:

```bash
docker exec -it marie bash

# Test PDF generator
python3 /tools/pdf-generator/generate_evaluation_pdf.py --help

# Should show usage information
```

---

## Manual PDF Generation

If you need to regenerate a PDF from existing markdown:

```bash
# From host
docker exec marie python3 /tools/pdf-generator/generate_evaluation_pdf.py \
  /workspace/dance/evaluations/formal/Emma_Evaluation_2025-11-18.md \
  /workspace/dance/evaluations/pdf/Emma_Evaluation_2025-11-18.pdf
```

---

## Comparison with Target Format

The generated PDFs match the correction examples at `examples/corrections/`:

**Target** (Jeanie_Evaluation 2025.pdf):
- ✅ Bold title with underline
- ✅ Header metadata (Name, Date, Évalué par)
- ✅ 9 APEXX sections with scores
- ✅ French language throughout
- ✅ Professional formatting
- ✅ Signature line

**Generated PDFs have all of these features!**

---

## Next Steps

### Optional Enhancements

1. **Custom signature font**:
   - Install cursive font (e.g., Zapfino)
   - Update PDF generator to use custom font

2. **Logo/Header image**:
   - Add studio logo to PDF header
   - Requires image file + reportlab Image class

3. **Color coding by score**:
   - Green for excellent scores (≥8/10)
   - Yellow for areas to improve (<7/10)
   - Requires PDF styling updates

4. **Batch PDF generation**:
   - Process multiple evaluations at once
   - Combine into single PDF report

---

## Files Reference

### Configuration
- `core/docker-compose.yml` - Marie container with reportlab
- `core/shared/workspaces/marie/CLAUDE.md` - Marie's PDF generation workflow

### Tools
- `tools/pdf-generator/generate_evaluation_pdf.py` - PDF generation script
- `tools/pdf-generator/requirements.txt` - Python dependencies

### Output
- `workspaces/dance/studio/evaluations/formal/` - Markdown evaluations
- `workspaces/dance/studio/evaluations/pdf/` - PDF evaluations

### Examples
- `examples/corrections/Jeanie_Evaluation 2025.pdf` - Target format reference
- `examples/corrections/Olivia Petit 2025.pdf` - Target format reference

---

## Summary

✅ **Marie now creates professional PDFs automatically**
✅ **No manual conversion needed**
✅ **Matches official APEXX format**
✅ **Includes Marie-Josée Corriveau signature**
✅ **Print-ready for distribution**

Simply send evaluation tasks to Marie - she'll handle the rest! 🩰✨

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Author**: CodeHornets-AI Team
