# Marie PDF Generation - Quick Start

## ✨ What's New

Marie can now automatically generate professional PDF evaluations with:
- Official APEXX format
- Marie-Josée Corriveau signature
- Professional French typography
- Print-ready output

## 🚀 Quick Setup (30 seconds)

### 1. Restart Marie with PDF Support

```bash
cd core
docker-compose restart marie
```

Marie now auto-installs `reportlab` on startup.

### 2. Create PDF Output Directory

```bash
# User should run this on host:
mkdir -p ../workspaces/dance/evaluations/pdf
```

### 3. Send Evaluation Task

```bash
./send-task-to-marie.sh "Create formal evaluation for Emma Rodriguez"
```

## 📦 What You Get

**Two files automatically created**:

1. **Markdown** (editable):
   ```
   workspaces/dance/evaluations/formal/Emma_Evaluation_2025-11-18.md
   ```

2. **PDF** (distribution):
   ```
   workspaces/dance/evaluations/pdf/Emma_Evaluation_2025-11-18.pdf
   ```

## 🎯 The PDF Format

```
═══════════════════════════════════════════════
  ÉVALUATION HIPHOP – SPORT-ÉTUDES APEXX
───────────────────────────────────────────────

Nom: Emma Rodriguez
Date: 2025-11-18
Évalué par: Marie-Josée Corriveau

Expression artistique 8/10 :
[Detailed feedback in French...]

[8 more sections...]

TOTAL: 75/100

Signature: Marie-Josée Corriveau
```

## 🔧 Troubleshooting

**PDF not created?**

```bash
# Check Marie's logs
docker logs marie --tail 20

# Restart if needed
docker-compose restart marie
```

**Permission errors?**

```bash
# Fix permissions on host
chmod -R 755 workspaces/dance/
```

## 📚 Full Documentation

See `docs/MARIE_PDF_GENERATION.md` for complete details.

---

**That's it! Marie now creates professional PDFs automatically.** 🩰✨
