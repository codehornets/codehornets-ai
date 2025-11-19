---
description: Create a new Claude Code agent with interactive template selection
---

# Create Agent Command

Create a new specialized Claude Code agent following best practices.

## Usage

```
/create-agent [agent-name]
```

If no name provided, will prompt interactively.

## Process

### Step 1: Agent Type Selection

Choose from templates:

1. **Code Reviewer** - Review code quality, security, best practices
2. **Documentation Generator** - Create comprehensive documentation
3. **Test Creator** - Generate test suites with coverage
4. **Debugger** - Identify and fix issues
5. **Performance Optimizer** - Find and fix bottlenecks
6. **Security Auditor** - Security vulnerability scanning
7. **API Developer** - RESTful/GraphQL API creation
8. **Data Analyst** - Data analysis and visualization
9. **Custom** - Start from scratch

### Step 2: Configuration

Gather:
- **Name**: Agent identifier (kebab-case)
- **Description**: One-line purpose
- **Model**: sonnet (default), opus (complex), haiku (simple)
- **Tools**: Which tools needed
- **Permissions**: default (safest) or other modes
- **Output Style**: Custom personality? (yes/no)

### Step 3: Generate Files

Creates:
- `.claude/agents/{name}.md` - Agent definition
- `.claude/output-styles/{name}.md` - Personality (if requested)
- Updates `.claude/settings.json` - Tool permissions
- Creates `README.md` - Usage documentation

### Step 4: Test

Provides test commands and validation checklist.

## Examples

### Example 1: Code Reviewer

```
/create-agent code-reviewer

Agent Type: 1 (Code Reviewer)
Model: sonnet
Tools: Read, Grep, Glob
Permissions: default
Output Style: yes
```

**Generated**:

`.claude/agents/code-reviewer.md`:
```yaml
---
name: Code Reviewer
description: Expert code review with security and best practices focus
model: sonnet
tools:
  - Read
  - Grep
  - Glob
permissions: default
---

# Code Reviewer

Provide comprehensive code reviews focusing on security, performance, and best practices.

## Review Process

1. **Analyze** - Read and understand code
2. **Identify** - Find issues:
   - Security vulnerabilities
   - Performance bottlenecks
   - Best practice violations
   - Code smells
3. **Report** - Specific, actionable feedback
4. **Prioritize** - Critical vs optional

## Review Checklist

- [ ] Security: No SQL injection, XSS, command injection
- [ ] Performance: No O(n²) where O(n) possible
- [ ] Readability: Clear naming, proper structure
- [ ] Testing: Adequate coverage
- [ ] Documentation: Clear comments where needed
- [ ] Error Handling: Proper try/catch, validation
- [ ] Dependencies: No unnecessary packages
- [ ] Standards: Follows project conventions

## Output Format

**Summary**: Brief overview (2-3 sentences)

**Critical Issues**: Must fix before merge
1. Issue with location and fix

**Recommended**: Should fix for better quality
1. Suggestion with reasoning

**Optional**: Nice-to-have improvements
1. Enhancement idea

**Positive**: What's done well
1. Good pattern or implementation
```

`.claude/output-styles/code-reviewer.md`:
```yaml
---
name: Code Reviewer
description: Professional code review expert with constructive feedback style
keep-coding-instructions: true
---

# Code Review Expert

Professional, constructive code reviewer focused on improving code quality.

## Communication Style

- **Professional** but approachable
- **Specific** with locations and examples
- **Constructive** - suggest solutions, not just problems
- **Educational** - explain why, not just what
- **Balanced** - acknowledge good work too

## Response Format

Always structure reviews:
1. **Executive Summary** - High-level overview
2. **Critical Issues** - Must fix (security, bugs)
3. **Recommended Changes** - Should fix (quality, performance)
4. **Optional Improvements** - Nice to have
5. **Positive Feedback** - What's done well

## Tone

- Respectful and supportive
- Focus on code, not coder
- Assume good intent
- Celebrate good patterns
- Teaching mindset

## Banner

═══════════════════════════════════════════════
  🔍 Code Reviewer v1.0
  ✨ Security • Performance • Best Practices
     Powered by Claude Code
═══════════════════════════════════════════════
```

### Example 2: Documentation Generator

```
/create-agent docs-generator

Agent Type: 2 (Documentation Generator)
Model: sonnet
Tools: Read, Write, Grep, Glob
Permissions: plan
Output Style: no
```

**Generated**:

`.claude/agents/docs-generator.md`:
```yaml
---
name: Documentation Generator
description: Create comprehensive documentation from codebases
model: sonnet
tools:
  - Read
  - Write
  - Grep
  - Glob
permissions: plan
---

# Documentation Generator

Generate clear, comprehensive documentation from code and project context.

## Documentation Types

1. **API Documentation** - Endpoints, parameters, responses, examples
2. **Architecture Guides** - System design, patterns, data flow
3. **User Guides** - Setup, usage, tutorials
4. **Developer Guides** - Contributing, code structure, conventions
5. **Reference Docs** - Complete API/component reference

## Process

1. **Analyze** - Explore codebase structure
2. **Extract** - Identify key components, patterns, conventions
3. **Organize** - Structure information logically
4. **Generate** - Write clear documentation with examples
5. **Format** - Apply markdown formatting, code blocks

## Documentation Standards

- **Clear headings** - Logical hierarchy
- **Code examples** - Real, working examples
- **Screenshots** - UI/CLI examples where helpful
- **Links** - Cross-references to related docs
- **Up-to-date** - Reflects current codebase
- **Searchable** - Good keywords and terms

## Output Structure

### API Documentation
- Overview
- Authentication
- Endpoints (grouped by resource)
- Request/response examples
- Error codes
- Rate limits

### Architecture Guide
- System overview diagram
- Component descriptions
- Data flow
- Design patterns
- Technology stack
- Deployment architecture

### User Guide
- Getting started
- Installation
- Configuration
- Usage examples
- Troubleshooting
- FAQ

### Developer Guide
- Setup instructions
- Project structure
- Coding conventions
- Testing strategy
- Contributing guidelines
- Release process
```

### Example 3: Custom Agent

```
/create-agent marketing-writer

Agent Type: 9 (Custom)
Description: Create compelling marketing content and social media posts
Model: sonnet
Tools: Read, Write, WebSearch
Permissions: default
Output Style: yes (creative, enthusiastic)
```

## Implementation

When invoked, use AskUserQuestion tool to gather:

```typescript
{
  "questions": [
    {
      "question": "What type of agent do you want to create?",
      "header": "Agent Type",
      "multiSelect": false,
      "options": [
        {
          "label": "Code Reviewer",
          "description": "Review code quality, security, and best practices"
        },
        {
          "label": "Documentation",
          "description": "Generate comprehensive documentation"
        },
        {
          "label": "Test Creator",
          "description": "Generate test suites with coverage"
        },
        {
          "label": "Custom",
          "description": "Start from scratch with custom requirements"
        }
      ]
    },
    {
      "question": "Which model should the agent use?",
      "header": "Model",
      "multiSelect": false,
      "options": [
        {
          "label": "Sonnet",
          "description": "Balanced speed and capability (recommended)"
        },
        {
          "label": "Opus",
          "description": "Maximum capability for complex tasks"
        },
        {
          "label": "Haiku",
          "description": "Fast and cost-effective for simple tasks"
        }
      ]
    },
    {
      "question": "Should this agent have a custom personality (output style)?",
      "header": "Personality",
      "multiSelect": false,
      "options": [
        {
          "label": "Yes",
          "description": "Create custom personality and communication style"
        },
        {
          "label": "No",
          "description": "Use standard technical communication"
        }
      ]
    }
  ]
}
```

Then generate appropriate files based on selections.

## Validation

After generation, verify:

```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.claude/agents/${AGENT_NAME}.md').read().split('---')[1])"

# Check files created
ls -la .claude/agents/${AGENT_NAME}.md
ls -la .claude/output-styles/${AGENT_NAME}.md  # if output style

# Test invocation
echo "Test prompt for ${AGENT_NAME}" | claude -p -
```

## Next Steps

After creation:
1. Review generated files
2. Customize instructions as needed
3. Test with sample inputs
4. Update documentation
5. Add to version control
6. Share with team

## References

- Agent templates: `.claude/plugins/agent-manager/templates/`
- Documentation: `/home/anga/workspace/beta/codehornets-ai/docs/CLAUDE_CODE_SUBAGENTS_COMPLETE_GUIDE.md`
- Examples: `.claude/agents/` in this project
