# Claude Code Skills - Complete Technical Guide

Complete indexed documentation of the Claude Code Skills system, extracted from official documentation and implementation examples.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Skill Structure](#skill-structure)
3. [YAML Frontmatter](#yaml-frontmatter)
4. [Progressive Disclosure](#progressive-disclosure)
5. [Trigger System](#trigger-system)
6. [Enforcement Levels](#enforcement-levels)
7. [Hook System](#hook-system)
8. [skill-rules.json Configuration](#skill-rulesjson-configuration)
9. [Best Practices](#best-practices)
10. [File Organization](#file-organization)
11. [Testing and Debugging](#testing-and-debugging)
12. [Common Patterns](#common-patterns)

---

## System Architecture

### Core Concept

Agent Skills operate as a **meta-tool system** rather than executable code. The `Skill` tool (capital S) serves as a container in the API's `tools` array that manages individual skills through prompt injection and context modification.

### Storage Locations

Skills are automatically discovered from three sources:

```
Personal Skills:  ~/.claude/skills/{skill-name}/SKILL.md
Project Skills:   .claude/skills/{skill-name}/SKILL.md  (version-controlled)
Plugin Skills:    Bundled with installed plugins
```

### Invocation Model

**Model-Invoked Activation**: Claude autonomously decides when to use skills based on the request and skill descriptions. This contrasts with slash commands requiring explicit user triggers.

**Selection Process**: The decision-making happens entirely within Claude's reasoning process based on skill descriptions. No algorithmic routing or ML-based intent detection occurs. Claude reads skill names and descriptions from the `<available_skills>` section and reasons about which matches user intent.

### Token Budget

The system enforces a 15,000-character token budget for the `<available_skills>` section. Each skill consumes roughly 30-50 tokens until Claude decides it's relevant.

---

## Skill Structure

### Minimum Required Structure

```
skill-name/
└── SKILL.md (required)
```

### Complete Structure

```
skill-name/
├── SKILL.md           (required - main skill file)
├── reference.md       (optional - detailed documentation)
├── examples.md        (optional - usage examples)
├── scripts/          (optional - Python/Bash automation)
├── templates/        (optional - boilerplate files)
└── assets/           (optional - static resources)
```

### SKILL.md Format

```markdown
---
name: skill-identifier
description: What the Skill does and when to use it
allowed-tools: Read, Grep, Glob  (optional)
---

# Skill Title

## Purpose
What this skill helps with

## When to Use
Specific scenarios and conditions

## Key Information
The actual guidance, documentation, patterns, examples

## Examples
Concrete usage examples

## Guidelines
Principles and best practices
```

---

## YAML Frontmatter

### Required Fields

```yaml
---
name: skill-identifier
description: Brief description of functionality and triggers
---
```

### Field Requirements

| Field | Required | Max Length | Format | Description |
|-------|----------|-----------|--------|-------------|
| `name` | Yes | 64 chars | Lowercase, alphanumeric, hyphens only | Unique skill identifier |
| `description` | Yes | 1024 chars | Natural language | Capability summary + activation triggers |
| `allowed-tools` | No | - | Comma-separated tool names | Restricts available tools |
| `model` | No | - | Model ID | Override session model |
| `disable-model-invocation` | No | - | Boolean | Prevents automatic activation |
| `mode` | No | - | Boolean | Marks skill as mode command |
| `version` | No | - | Version string | Metadata for versioning |

### Naming Conventions

**Recommended**: Gerund form (verb + -ing)
- `processing-pdfs`
- `analyzing-spreadsheets`
- `managing-databases`
- `creating-components`

**Avoid**: Vague names
- `helper`
- `utils`
- `tools`
- `misc`

### Description Best Practices

The description field is **critical** for Claude to discover when to use your skill.

**Effective** (includes what AND when):
```yaml
description: Extract text from PDF files, fill forms, merge documents. Use when working with PDFs or document extraction.
```

**Ineffective** (too vague):
```yaml
description: Helps with documents
```

**Key Points**:
- Write in third person
- Include both functionality and trigger contexts
- Add keywords users would mention
- Be specific with domain terminology
- Max 1024 characters

---

## Progressive Disclosure

### Core Principle

Progressive disclosure is the core design principle that makes Agent Skills flexible and scalable. Like a well-organized manual that starts with a table of contents, then specific chapters, and finally a detailed appendix, skills let Claude load information only as needed.

### Three Levels

1. **Discovery Level (Frontmatter)**: At startup, the agent pre-loads the name and description of every installed skill into its system prompt. This provides just enough information for Claude to know when each skill should be used without loading all of it into context.

2. **Core Instructions (SKILL.md body)**: The actual body of the SKILL.md file is the second level of detail, loaded only when Claude determines the skill is relevant.

3. **Additional Resources**: The SKILL.md can refer to additional files (like reference.md and examples.md) that are read only when needed, with Claude reading these files when specific details are required.

### The 500-Line Rule

**Critical Best Practice**: Keep SKILL.md body under 500 lines for optimal performance.

**Why**: Skills share the context window with conversation history and other metadata. Only include information Claude doesn't already possess.

**Solution**: Use reference files for detailed information.

### Pattern 1: High-Level Guide with References

```markdown
# Main skill overview
- Quick start (in SKILL.md)
- Advanced features: See [FORMS.md](FORMS.md)
- API reference: See [REFERENCE.md](REFERENCE.md)
```

### Pattern 2: Domain-Specific Organization

```
bigquery-skill/
├── SKILL.md (overview)
└── reference/
    ├── finance.md
    ├── sales.md
    ├── product.md
```

### Pattern 3: Conditional Details

Show basic content inline; link to advanced sections only when relevant.

### Reference File Best Practices

**Add Table of Contents** for files exceeding 100 lines:
```markdown
## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
```

**Keep References One Level Deep**: Avoid deeply nested references. Nested references may result in partial file reads.

**Use Forward Slashes**: Always use `reference/guide.md`, never Windows-style `reference\guide.md`.

**Name Files Descriptively**: Use `form_validation_rules.md`, not `doc2.md`.

---

## Trigger System

### Overview

Skills can be triggered by multiple conditions configured in `skill-rules.json`:

1. **Keyword Triggers** - Explicit topic matching
2. **Intent Pattern Triggers** - Implicit action detection
3. **File Path Triggers** - Location-based activation
4. **Content Pattern Triggers** - Technology-specific detection

### 1. Keyword Triggers (Explicit)

**How It Works**: Case-insensitive substring matching in user's prompt.

**Use For**: Topic-based activation where user explicitly mentions the subject.

**Configuration**:
```json
"promptTriggers": {
  "keywords": ["layout", "grid", "toolbar", "submission"]
}
```

**Example**:
- User prompt: "how does the **layout** system work?"
- Matches: "layout" keyword
- Activates: Relevant skill

**Best Practices**:
- Use specific, unambiguous terms
- Include common variations ("layout", "layout system", "grid layout")
- Avoid overly generic words ("system", "work", "create")
- Test with real prompts

### 2. Intent Pattern Triggers (Implicit)

**How It Works**: Regex pattern matching to detect user's intent even when they don't mention the topic explicitly.

**Use For**: Action-based activation where user describes what they want to do.

**Configuration**:
```json
"promptTriggers": {
  "intentPatterns": [
    "(create|add|implement).*?(feature|endpoint)",
    "(how does|explain).*?(layout|workflow)"
  ]
}
```

**Examples**:
```regex
# Database Work
(add|create|implement).*?(user|login|auth|feature)

# Explanations
(how does|explain|what is|describe).*?

# Frontend Work
(create|add|make|build).*?(component|UI|page|modal|dialog)

# Error Handling
(fix|handle|catch|debug).*?(error|exception|bug)
```

**Best Practices**:
- Capture common action verbs: `(create|add|modify|build|implement)`
- Include domain-specific nouns: `(feature|endpoint|component|workflow)`
- Use non-greedy matching: `.*?` instead of `.*`
- Test patterns thoroughly with regex tester (https://regex101.com/)
- Don't make patterns too broad (causes false positives)

### 3. File Path Triggers

**How It Works**: Glob pattern matching against the file path being edited.

**Use For**: Domain/area-specific activation based on file location.

**Configuration**:
```json
"fileTriggers": {
  "pathPatterns": [
    "frontend/src/**/*.tsx",
    "backend/src/**/*.ts"
  ],
  "pathExclusions": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

**Glob Pattern Syntax**:
- `**` = Any number of directories (including zero)
- `*` = Any characters within a directory name

**Common Patterns**:
```glob
# Frontend
frontend/src/**/*.tsx        # All React components
frontend/src/**/*.ts         # All TypeScript files
frontend/src/components/**   # Only components directory

# Backend Services
backend/src/**/*.ts         # Backend TypeScript files
api/routes/**/*.ts          # API route files

# Database
**/schema.prisma            # Prisma schema (anywhere)
**/migrations/**/*.sql      # Migration files

# Test Exclusions
**/*.test.ts                # TypeScript tests
**/*.spec.ts                # Spec files
```

**Best Practices**:
- Be specific to avoid false positives
- Use exclusions for test files
- Consider subdirectory structure
- Test patterns with actual file paths

### 4. Content Pattern Triggers

**How It Works**: Regex pattern matching against the file's actual content.

**Use For**: Technology-specific activation based on what the code imports or uses.

**Configuration**:
```json
"fileTriggers": {
  "contentPatterns": [
    "import.*[Pp]risma",
    "PrismaService",
    "\\.findMany\\(",
    "\\.create\\("
  ]
}
```

**Common Patterns**:
```regex
# Prisma/Database
import.*[Pp]risma                # Prisma imports
PrismaService                    # PrismaService usage
prisma\.                         # prisma.something
\.findMany\(                     # Prisma query methods

# Controllers/Routes
export class.*Controller         # Controller classes
router\.                         # Express router
app\.(get|post|put|delete|patch) # Express app routes

# React/Components
export.*React\.FC               # React functional components
useState|useEffect              # React hooks
```

**Best Practices**:
- Match imports: `import.*[Pp]risma` (case-insensitive with [Pp])
- Escape special regex chars: `\\.findMany\\(` not `.findMany(`
- Patterns use case-insensitive flag
- Make patterns specific enough to avoid false matches

---

## Enforcement Levels

### Overview

Skills can have three enforcement levels that control how they interact with Claude's workflow.

### BLOCK (Critical Guardrails)

**Use For**: Critical mistakes, data integrity issues, security concerns

**Behavior**:
- Physically prevents Edit/Write tool execution
- Exit code 2 from hook, stderr → Claude
- Claude sees message and must use skill to proceed

**Example**: Database column name verification

**Configuration**:
```json
{
  "type": "guardrail",
  "enforcement": "block",
  "priority": "critical",
  "blockMessage": "⚠️ BLOCKED - Action Required\n\n📋 REQUIRED ACTION:\n1. Use Skill tool: 'skill-name'\n2. Review guidelines\n3. Then retry this edit\n\nReason: Prevent critical errors\nFile: {file_path}"
}
```

### SUGGEST (Recommended)

**Use For**: Domain guidance, best practices, how-to guides

**Behavior**:
- Reminder injected before Claude sees prompt
- Claude is aware of relevant skills
- Not enforced, just advisory

**Example**: Frontend development guidelines

**Configuration**:
```json
{
  "type": "domain",
  "enforcement": "suggest",
  "priority": "high"
}
```

### WARN (Optional)

**Use For**: Nice-to-have suggestions, informational reminders

**Behavior**:
- Low priority suggestions
- Advisory only, minimal enforcement

**Note**: Rarely used - most skills are either BLOCK or SUGGEST.

### allowed-tools Field

The `allowed-tools` frontmatter field enables different enforcement levels:

**Read-Only Skill**:
```yaml
---
name: safe-file-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---
```

**When specified**: Claude can only use those specific tools without needing permission

**When not specified**: Claude will ask for permission to use tools as normal

**Common Configurations**:
```yaml
# Read-only
allowed-tools: Read, Grep, Glob

# File manipulation
allowed-tools: Read, Write, Edit

# Git operations
allowed-tools: Bash(git:*)

# Full access (default)
# allowed-tools field omitted
```

---

## Hook System

### Overview

Hooks enable automatic skill activation and quality gates. They react to specific events during Claude's operation.

### Two Essential Hooks

#### 1. UserPromptSubmit Hook (Proactive Suggestions)

**File**: `.claude/hooks/skill-activation-prompt.ts`

**Trigger**: BEFORE Claude sees user's prompt

**Purpose**: Suggest relevant skills based on keywords + intent patterns

**Method**: Injects formatted reminder as context (stdout → Claude's input)

**Use Cases**: Topic-based skills, implicit work detection

**Configuration** (in `.claude/settings.json`):
```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "type": "command",
      "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
    }]
  }
}
```

**Testing**:
```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

#### 2. PreToolUse Hook (Quality Gates)

**File**: `.claude/hooks/skill-verification-guard.ts`

**Trigger**: BEFORE Claude uses Edit/Write tools

**Purpose**: Block execution if skill usage required

**Method**: Exit code 2 blocks, stderr message → Claude

**Use Cases**: Critical guardrails, data integrity checks

**Exit Code Behavior**:
- Exit 0: Allow tool execution
- Exit 1: Generic error
- Exit 2: Block with message (stderr → Claude)

**Testing**:
```bash
cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts
{"session_id":"test","tool_name":"Edit","tool_input":{"file_path":"test.ts"}}
EOF
```

#### 3. Stop Hook (Post-Response Reminders)

**File**: `.claude/hooks/error-handling-reminder.ts`

**Trigger**: AFTER Claude finishes responding

**Purpose**: Gentle reminder to self-assess code quality

**Method**: Analyzes edited files for risky patterns, displays reminder if needed

**Use Cases**: Error handling awareness without blocking friction

### Execution Context Modification

Skills modify runtime behavior through `contextModifier` functions:

- **Pre-approve tools**: Inject specified tools into `alwaysAllowRules`
- **Override model**: Switch to alternative models specified in frontmatter
- **Scope permissions**: Apply changes only during skill execution

Example tool scoping allows granular permission control like `Bash(git:*)` for specific command subsets.

### Dual-Channel Communication

Skills inject specialized instructions through **two distinct user messages**:

1. **Metadata message** (`isMeta: false`): Visible in UI, contains XML tags like `<command-message>`
2. **Skill prompt message** (`isMeta: true`): Hidden from UI, sent to API for Claude's reasoning

The `isMeta` flag enables transparent user-facing updates without cluttering the transcript with internal AI instructions.

---

## skill-rules.json Configuration

### File Location

**Path**: `.claude/skills/skill-rules.json`

This JSON file defines all skills and their trigger conditions for the auto-activation system.

### Complete Schema

```typescript
interface SkillRules {
    version: string;
    skills: Record<string, SkillRule>;
}

interface SkillRule {
    type: 'guardrail' | 'domain';
    enforcement: 'block' | 'suggest' | 'warn';
    priority: 'critical' | 'high' | 'medium' | 'low';

    promptTriggers?: {
        keywords?: string[];
        intentPatterns?: string[];  // Regex strings
    };

    fileTriggers?: {
        pathPatterns: string[];     // Glob patterns
        pathExclusions?: string[];  // Glob patterns
        contentPatterns?: string[]; // Regex strings
        createOnly?: boolean;       // Only trigger on file creation
    };

    blockMessage?: string;  // For guardrails, {file_path} placeholder

    skipConditions?: {
        sessionSkillUsed?: boolean;      // Skip if used in session
        fileMarkers?: string[];          // e.g., ["@skip-validation"]
        envOverride?: string;            // e.g., "SKIP_DB_VERIFICATION"
    };
}
```

### Example: Guardrail Skill

Complete example of a blocking guardrail skill:

```json
{
  "frontend-dev-guidelines": {
    "type": "guardrail",
    "enforcement": "block",
    "priority": "high",

    "promptTriggers": {
      "keywords": [
        "component",
        "react component",
        "UI",
        "page",
        "modal",
        "form"
      ],
      "intentPatterns": [
        "(create|add|make|build).*?(component|UI|page|modal|dialog|form)",
        "(style|design|layout).*?(component|UI)"
      ]
    },

    "fileTriggers": {
      "pathPatterns": [
        "frontend/src/**/*.tsx",
        "frontend/src/**/*.ts"
      ],
      "pathExclusions": [
        "**/*.test.tsx",
        "**/*.test.ts"
      ],
      "contentPatterns": [
        "from '@mui/material';",
        "import.*Grid.*from.*@mui"
      ]
    },

    "blockMessage": "⚠️ BLOCKED - Frontend Best Practices Required\n\n📋 REQUIRED ACTION:\n1. Use Skill tool: 'frontend-dev-guidelines'\n2. Review guidelines\n3. Then retry this edit\n\nFile: {file_path}",

    "skipConditions": {
      "sessionSkillUsed": true,
      "fileMarkers": ["@skip-validation"],
      "envOverride": "SKIP_FRONTEND_GUIDELINES"
    }
  }
}
```

### Example: Domain Skill

Complete example of a suggestion-based domain skill:

```json
{
  "backend-dev-guidelines": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",

    "promptTriggers": {
      "keywords": [
        "backend",
        "controller",
        "service",
        "repository",
        "API",
        "endpoint"
      ],
      "intentPatterns": [
        "(create|add|implement).*?(route|endpoint|API|controller|service)",
        "(how to|best practice).*?(backend|route|controller)"
      ]
    },

    "fileTriggers": {
      "pathPatterns": [
        "backend/src/**/*.ts",
        "api/**/*.ts"
      ],
      "pathExclusions": [
        "**/*.test.ts"
      ]
    }
  }
}
```

### Skip Conditions & User Control

#### 1. Session Tracking

**Purpose**: Don't nag repeatedly in same session

**How it works**:
- First edit → Hook blocks, updates session state
- Second edit (same session) → Hook allows
- Different session → Blocks again

**State File**: `.claude/hooks/state/skills-used-{session_id}.json`

#### 2. File Markers

**Purpose**: Permanent skip for verified files

**Marker**: `// @skip-validation`

**Usage**:
```typescript
// @skip-validation
import { PrismaService } from './prisma';
// This file has been manually verified
```

**Note**: Use sparingly - defeats the purpose if overused

#### 3. Environment Variables

**Purpose**: Emergency disable, temporary override

**Global disable**:
```bash
export SKIP_SKILL_GUARDRAILS=true  # Disables ALL PreToolUse blocks
```

**Skill-specific**:
```bash
export SKIP_DB_VERIFICATION=true
export SKIP_ERROR_REMINDER=true
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | "guardrail" (enforced) or "domain" (advisory) |
| `enforcement` | string | Yes | "block" (PreToolUse), "suggest" (UserPromptSubmit), or "warn" |
| `priority` | string | Yes | "critical", "high", "medium", or "low" |
| `promptTriggers` | object | Optional | Triggers for UserPromptSubmit hook |
| `fileTriggers` | object | Optional | Triggers for PreToolUse hook |
| `blockMessage` | string | Optional* | Required if enforcement="block". Use `{file_path}` placeholder |
| `skipConditions` | object | Optional | Escape hatches and session tracking |

### Validation

**Check JSON Syntax**:
```bash
cat .claude/skills/skill-rules.json | jq .
```

**Validation Checklist**:
- [ ] JSON syntax valid (use `jq`)
- [ ] All skill names match SKILL.md filenames
- [ ] Guardrails have `blockMessage`
- [ ] Block messages use `{file_path}` placeholder
- [ ] Intent patterns are valid regex (test on regex101.com)
- [ ] File path patterns use correct glob syntax
- [ ] Content patterns escape special characters
- [ ] Priority matches enforcement level
- [ ] No duplicate skill names

---

## Best Practices

### Core Principles

**Conciseness is Critical**: Skills share the context window with conversation history and other metadata. Only include information Claude doesn't already possess. Keep SKILL.md body under 500 lines.

**Appropriate Degrees of Freedom**:
- **High freedom** (text-based): Use when multiple valid approaches exist
- **Medium freedom** (pseudocode): When preferred patterns exist with acceptable variation
- **Low freedom** (specific scripts): Operations that are fragile or require exact sequences

**Test Across Models**: Validate Skills with Claude Haiku, Sonnet, and Opus. Different models require varying levels of guidance.

### Anthropic Official Best Practices

1. **500-line rule**: Keep SKILL.md under 500 lines
2. **Progressive disclosure**: Use reference files for details
3. **Table of contents**: Add to reference files > 100 lines
4. **One level deep**: Don't nest references deeply
5. **Rich descriptions**: Include all trigger keywords (max 1024 chars)
6. **Test first**: Build 3+ evaluations before extensive documentation
7. **Gerund naming**: Prefer verb + -ing (e.g., "processing-pdfs")

### Content Guidelines

**Avoid Time-Sensitive Information**: Don't reference dates or temporary API versions. Use "Old patterns" sections for deprecated approaches.

**Use Consistent Terminology**: Choose one term and use it throughout:
- Always "API endpoint," not "URL" or "API route"
- Always "field," not "box" or "element"
- Always "extract," not "pull" or "get"

**Include Concrete Examples**: Supply concrete input/output pairs demonstrating desired style and detail level.

### Workflows & Feedback Loops

**Use Workflows for Complex Tasks**: Break operations into clear, sequential steps with checkboxes:

```markdown
Task Progress:
- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output
```

**Implement Feedback Loops**: Follow the pattern: Run validator → fix errors → repeat. This greatly improves output quality.

### Evaluation & Iteration

**Build Evaluations First**: Create test scenarios before extensive documentation:

1. Identify gaps in unaided Claude performance
2. Create three representative evaluation scenarios
3. Establish baseline metrics
4. Write minimal instructions addressing gaps
5. Iterate based on results

**Develop Iteratively with Claude**: Work with one Claude instance to create Skills used by other instances. The creator instance helps design instructions while test instances reveal gaps.

**Observe Navigation Patterns**: Watch how Claude actually uses Skills:
- Unexpected file access order suggests unclear structure
- Missed references indicate weak signaling
- Repeated file reads suggest content belongs in main SKILL.md

### Security & Dependencies

**Don't Hardcode Sensitive Information**: Avoid API keys, passwords in skills.

**Package Dependencies**: List required packages and verify availability. The documentation notes: "List required packages in the description. Packages must be installed in your environment before Claude can use them."

**MCP Tool References**: Use fully qualified names: `ServerName:tool_name`

### Advanced: Executable Code

**Solve, Don't Punt**: Handle error conditions in scripts rather than delegating to Claude. Document configuration parameters.

**Provide Utility Scripts**: Pre-made scripts offer advantages: reliability, token savings, speed, and consistency.

**Create Verifiable Intermediate Outputs**: For complex tasks, implement: analyze → create plan file → validate plan → execute.

---

## File Organization

### Directory Structure

```
.claude/skills/
├── skill-name-1/
│   ├── SKILL.md
│   ├── reference.md
│   ├── examples.md
│   ├── scripts/
│   │   └── helper.py
│   └── templates/
│       └── template.txt
├── skill-name-2/
│   └── SKILL.md
└── skill-rules.json
```

### File Naming

**DO**:
- Use descriptive names: `form_validation_rules.md`
- Use forward slashes: `reference/guide.md`
- Create focused, single-purpose files

**DON'T**:
- Use generic names: `doc2.md`
- Use Windows paths: `reference\guide.md`
- Create deeply nested structures

### Reference File Organization

**Table of Contents for Large Files** (> 100 lines):
```markdown
# Reference Guide

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

## Section 1
...
```

**Domain-Specific Split**:
```
skill-name/
├── SKILL.md
└── reference/
    ├── getting-started.md
    ├── advanced-usage.md
    ├── api-reference.md
    └── troubleshooting.md
```

### Anti-Patterns to Avoid

- Windows-style paths (use forward slashes)
- Offering excessive options without defaults
- Time-sensitive information
- Deeply nested file references
- Vague descriptions
- Inconsistent terminology
- Magic numbers without justification

---

## Testing and Debugging

### Testing Checklist

When creating a new skill, verify:

- [ ] Skill file created in `.claude/skills/{name}/SKILL.md`
- [ ] Proper frontmatter with name and description
- [ ] Entry added to `skill-rules.json`
- [ ] Keywords tested with real prompts
- [ ] Intent patterns tested with variations
- [ ] File path patterns tested with actual files
- [ ] Content patterns tested against file contents
- [ ] Block message is clear and actionable (if guardrail)
- [ ] Skip conditions configured appropriately
- [ ] Priority level matches importance
- [ ] No false positives in testing
- [ ] No false negatives in testing
- [ ] Performance is acceptable (<100ms or <200ms)
- [ ] JSON syntax validated: `jq . skill-rules.json`
- [ ] SKILL.md under 500 lines
- [ ] Reference files created if needed
- [ ] Table of contents added to files > 100 lines

### Manual Testing

**Test UserPromptSubmit (keyword/intent triggers)**:
```bash
echo '{"session_id":"test","prompt":"your test prompt"}' | \
  npx tsx .claude/hooks/skill-activation-prompt.ts
```

**Test PreToolUse (file path/content triggers)**:
```bash
cat <<'EOF' | npx tsx .claude/hooks/skill-verification-guard.ts
{
  "session_id": "test",
  "tool_name": "Edit",
  "tool_input": {"file_path": "/path/to/test/file.ts"}
}
EOF
```

**Validate JSON Syntax**:
```bash
jq . .claude/skills/skill-rules.json
```

**Test Regex Patterns**: Use https://regex101.com/

### Debugging with Claude Code

**Enable Debug Mode**:
```bash
claude --debug
```

**Common Issues**:

**Skill Not Triggering**:
- Check description includes relevant keywords
- Verify YAML syntax (no tabs, proper delimiters)
- Test keyword/intent patterns manually
- Ensure skill-rules.json is valid JSON

**False Positives (Too Many Triggers)**:
- Make keywords more specific
- Narrow intent patterns
- Add path exclusions for test files
- Increase specificity of content patterns

**Hook Not Executing**:
- Verify hook registered in `.claude/settings.json`
- Check hook file has execute permissions
- Test hook manually with sample input
- Check stderr for error messages

**Performance Issues**:
- Reduce number of content patterns
- Optimize regex patterns (use non-greedy `.*?`)
- Limit glob pattern scope
- Keep SKILL.md under 500 lines

### Troubleshooting Non-Activation

**Causes**:
- Vague descriptions lacking trigger terminology
- Invalid YAML syntax (tabs, missing delimiters, incorrect indentation)
- Incorrect file paths or locations
- Unmet package dependencies
- Skill not listed in skill-rules.json

**Solutions**:
- Add specific trigger keywords to description
- Validate YAML with online validator
- Check file paths are absolute and correct
- Install required packages
- Add skill entry to skill-rules.json

---

## Common Patterns

### Pattern: Template-Based Generation

**Use Case**: Strict output format requirements

**Implementation**:
```markdown
# Output Template

Always use this exact format:

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Pattern: Conditional Workflow

**Use Case**: Guide Claude through decision points

**Implementation**:
```markdown
## Workflow

1. Determine operation type:
   - Creating new content? → Follow "Creation workflow"
   - Editing existing content? → Follow "Editing workflow"
   - Deleting content? → Follow "Deletion workflow"

### Creation Workflow
1. Step 1
2. Step 2

### Editing Workflow
1. Step 1
2. Step 2
```

### Pattern: Script Automation

**Use Case**: Offload complex logic to executable scripts

**Directory Structure**:
```
skill-name/
├── SKILL.md
└── scripts/
    ├── validate.py
    └── transform.sh
```

**Usage in SKILL.md**:
```markdown
## Validation

Run the validation script:

```bash
python scripts/validate.py input.json
```
```

### Pattern: Read-Process-Write

**Use Case**: Transform files following specifications

**Workflow**:
```markdown
1. Read the input file
2. Parse and analyze content
3. Apply transformations per specification
4. Write output file
5. Verify output matches expected format
```

### Pattern: Search-Analyze-Report

**Use Case**: Codebase analysis and reporting

**Workflow**:
```markdown
1. Use Grep to find relevant patterns
2. Analyze findings for trends
3. Generate structured report
4. Provide actionable recommendations
```

### Pattern: Examples-Based Learning

**Use Case**: Show desired output style

**Implementation**:
```markdown
## Examples

### Example 1: Simple Case

Input:
```json
{"name": "John"}
```

Output:
```json
{
  "name": "John",
  "processed": true,
  "timestamp": "2025-01-01"
}
```

### Example 2: Complex Case

Input:
```json
{"name": "John", "items": [1, 2, 3]}
```

Output:
```json
{
  "name": "John",
  "items": [1, 2, 3],
  "itemCount": 3,
  "processed": true,
  "timestamp": "2025-01-01"
}
```
```

### Pattern: Feedback Loop

**Use Case**: Iterative refinement with validation

**Workflow**:
```markdown
1. Generate initial output
2. Run validator script
3. If validation fails:
   - Review error messages
   - Fix issues
   - Go to step 2
4. If validation passes:
   - Finalize output
   - Generate summary
```

---

## Quick Reference

### Creating a New Skill (5 Steps)

1. Create `.claude/skills/{name}/SKILL.md` with frontmatter
2. Add entry to `.claude/skills/skill-rules.json`
3. Test with `npx tsx` commands
4. Refine patterns based on testing
5. Keep SKILL.md under 500 lines

### Skill Types

**Guardrail Skills**:
- Type: `"guardrail"`
- Enforcement: `"block"`
- Priority: `"critical"` or `"high"`
- Block file edits until skill used
- Prevent common mistakes

**Domain Skills**:
- Type: `"domain"`
- Enforcement: `"suggest"`
- Priority: `"high"` or `"medium"`
- Advisory, not mandatory
- Topic or domain-specific

### Trigger Types

- **Keywords**: Explicit topic mentions
- **Intent**: Implicit action detection
- **File Paths**: Location-based activation
- **Content**: Technology-specific detection

### Enforcement Levels

- **BLOCK**: Exit code 2, critical only
- **SUGGEST**: Inject context, most common
- **WARN**: Advisory, rarely used

### Skip Conditions

- **Session tracking**: Automatic (prevents repeated nags)
- **File markers**: `// @skip-validation` (permanent skip)
- **Env vars**: `SKIP_SKILL_GUARDRAILS` (emergency disable)

### Quality Checklist

**Core Quality**:
- [ ] Description is specific with key terms
- [ ] Includes what the Skill does and when to use it
- [ ] SKILL.md under 500 lines
- [ ] No time-sensitive information
- [ ] Consistent terminology
- [ ] Concrete examples

**Testing**:
- [ ] Three+ evaluations created
- [ ] Tested with real scenarios
- [ ] No false positives
- [ ] No false negatives
- [ ] JSON syntax validated

---

## Skill vs Other Features

### Skills vs Slash Commands

| Aspect | Skills | Slash Commands |
|--------|--------|----------------|
| Activation | Model-invoked (automatic) | User-invoked (explicit) |
| Use Case | Ongoing guidance | One-time actions |
| Context | Persistent during use | Temporary expansion |
| Token Cost | ~1,500+ when active | Minimal |

### Skills vs MCP Tools

| Aspect | Skills | MCP Tools |
|--------|--------|----------|
| Purpose | Guide workflows | Perform operations |
| Execution | Prompt expansion | Synchronous action |
| Return | Context changes | Immediate results |
| Complexity | Complex multi-step | Simple operations |

### Skills vs Subagents

| Aspect | Skills | Subagents |
|--------|--------|-----------|
| Scope | Specialized knowledge | Complete task execution |
| Context | Shared with main agent | Isolated context |
| Use Case | Guidelines/patterns | Independent work |
| Invocation | Automatic or manual | Explicit dispatch |

---

## Additional Resources

### Official Documentation

- **Claude Code Docs**: https://code.claude.com/docs/en/skills
- **Agent Skills Best Practices**: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
- **Anthropic Skills Blog**: https://www.anthropic.com/news/skills

### Community Resources

- **GitHub Skills Repository**: https://github.com/anthropics/skills
- **Claude Plugins**: https://claude-plugins.dev/skills

### Testing Tools

- **Regex Tester**: https://regex101.com/
- **JSON Validator**: https://jsonlint.com/
- **jq (JSON processor)**: https://stedolan.github.io/jq/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Sources**: Claude Code Official Documentation, Anthropic Engineering Blog, Community Examples
