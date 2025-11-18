# Workspace Cleanup Commands

## Overview

Two new Makefile commands have been added to help clean workspace files and restart testing.

## Commands

### `make clean-workspace`

Cleans all generated files from the workspace directories:
- Dance evaluations: `workspaces/dance/studio/students/*/evaluations/*.md`
- Coding workspace: `workspaces/coding/*.md`
- Marketing workspace: `workspaces/marketing/*.md`

**Usage:**
```bash
make clean-workspace
```

**Output:**
```
Cleaning workspace evaluations...

Dance workspace:
  Found 3 evaluation files
  ✓ All evaluation files deleted

Coding workspace:
  Found 1 files
  ✓ All files deleted

Marketing workspace:
  Found 1 files
  ✓ All files deleted

✓ Workspace cleanup complete
```

---

### `make clean-workspace-test`

Cleans workspace files AND provides instructions to restart testing.

**Usage:**
```bash
make clean-workspace-test
```

**Output:**
```
Cleaning workspace and restarting test...

[cleanup output...]

Ready to test! Run:
  'Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez'

Expected output location:
  workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_2025-11-17.md
```

---

## Testing Marie Dance Evaluator

### Quick Test Workflow

1. **Clean workspace:**
   ```bash
   make clean-workspace-test
   ```

2. **Start Claude Code:**
   ```bash
   claude
   ```

3. **Create test evaluation:**
   ```
   Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
   ```

4. **Verify output:**
   ```bash
   cat workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_2025-11-17.md
   ```

---

## Complete Test Cycle

```bash
# 1. Clean workspace
make clean-workspace-test

# 2. Run test evaluation
claude
# Then in Claude: "Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez"

# 3. Verify file was created
find workspaces/dance/studio/students/*/evaluations/ -type f

# 4. Check file count (should be 1)
find workspaces/dance/studio/students/*/evaluations/ -type f | wc -l
```

---

## What Gets Deleted

The `clean-workspace` command deletes:

### Dance Workspace
- All evaluation files in: `workspaces/dance/studio/students/*/evaluations/*.md`
- Preserves: Directory structure, CLAUDE.md, README.md

### Coding Workspace
- All markdown files in: `workspaces/coding/*.md`
- Preserves: Directory structure, configuration files

### Marketing Workspace
- All markdown files in: `workspaces/marketing/*.md`
- Preserves: Directory structure, configuration files

---

## Safety

- **Safe deletion**: Uses `-delete` flag with `2>/dev/null || true` to prevent errors
- **Selective**: Only deletes `.md` files in specific locations
- **Preserves structure**: Keeps all directories and configuration files intact
- **No git history**: Deleted files can be recovered from git if needed

---

## Makefile Integration

These commands are integrated into the main Makefile help:

```bash
make help
```

Shows:

```
Cleanup:
  make clean          - Stop containers and remove volumes
  make clean-tasks    - Clear all task files
  make clean-results  - Clear all result files
  make clean-workspace - Clean all workspace evaluations
  make clean-workspace-test - Clean workspace and restart test
```

---

## Troubleshooting

### No files found

If cleanup shows "Found 0 files", the workspace is already clean or the paths have changed.

**Check paths:**
```bash
find workspaces/ -type f -name "*.md"
```

### Permission errors

If you get permission errors, check file permissions:
```bash
ls -la workspaces/dance/studio/students/*/evaluations/
```

### Files not deleting

Verify the find command works:
```bash
find workspaces/dance/studio/students/*/evaluations/ -type f -name "*.md"
```

---

## Related Commands

### Clean everything (nuclear option)
```bash
make clean              # Stop containers, remove volumes
make clean-tasks        # Clear task files
make clean-results      # Clear result files
make clean-workspace    # Clear workspace files
```

### Rebuild and clean
```bash
make clean-workspace
make rebuild
```

---

**Date Created:** 2025-11-17
**Related Files:**
- `Makefile` - Contains the cleanup commands
- `workspaces/` - Target directories for cleanup
- `docs/HOW_TO_USE_MARIE_EVALUATOR.md` - Marie evaluator usage guide
