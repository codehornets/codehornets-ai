# Workspaces Directory

This directory contains domain-specific workspaces for different use cases of the Claude Code customization system.

## Structure

```
workspaces/
├── {domain}/          # Domain category (e.g., dance, education, business)
│   └── {project}/     # Specific project workspace
│       ├── CLAUDE.md  # Project-specific Claude Code configuration
│       └── ...        # Project files and directories
```

## Current Workspaces

### dance/studio/
Dance teacher assistant workspace configured for Marie.

**Launch:** `make marie` or `make studio`

**Features:**
- Student progress tracking
- Class documentation
- Choreography organization
- Recital planning
- Parent communications

**Directory Structure:**
```
dance/studio/
├── CLAUDE.md          # Marie configuration
├── students/          # Student profiles and progress
├── class-notes/       # Class documentation
├── choreography/      # Routines and combinations
├── recitals/          # Performance planning
└── admin/             # Studio management
```

## Creating New Workspaces

### Method 1: Using Makefile Variables

Edit `Makefile` and add new workspace configuration:

```makefile
# New workspace configuration
MY_DOMAIN = education
MY_PROJECT = tutoring
MY_PATH = $(WORKSPACE_ROOT)/$(MY_DOMAIN)/$(MY_PROJECT)

# Create workspace target
my-workspace:
	@mkdir -p $(MY_PATH)
	@cp agent-mod/templates/MY_TEMPLATE.md $(MY_PATH)/CLAUDE.md
	@cd $(MY_PATH) && claude
```

### Method 2: Manual Creation

```bash
# 1. Create directory structure
mkdir -p workspaces/education/tutoring

# 2. Copy or create CLAUDE.md
cp agent-mod/templates/TEMPLATE.md workspaces/education/tutoring/CLAUDE.md

# 3. Customize CLAUDE.md for your use case

# 4. Launch
cd workspaces/education/tutoring
claude
```

## Benefits of This Structure

✅ **Organized:** Clear separation by domain and project
✅ **Scalable:** Easy to add new workspaces
✅ **Isolated:** Each workspace has its own configuration
✅ **Discoverable:** Easy to find and navigate workspaces
✅ **Version Control:** Can gitignore or commit selectively

## .gitignore Recommendations

Add to `.gitignore`:
```
# Ignore all workspace content but keep structure
workspaces/**/
!workspaces/README.md
!workspaces/**/.gitkeep
```

Or commit template workspaces:
```
# Ignore personal workspaces
workspaces/*/my-*
workspaces/*/personal-*
```
