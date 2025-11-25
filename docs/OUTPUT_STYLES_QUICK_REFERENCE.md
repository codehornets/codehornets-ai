# Claude Code Output Styles - Quick Reference

## What Are Output Styles?

Output styles **replace** Claude Code's system prompt while preserving all tools (file operations, scripts, TODOs, MCP). They transform the AI's personality and behavior.

## Quick Commands

```bash
# Switch styles
/output-style                    # Interactive menu
/output-style default           # Built-in: standard coding
/output-style explanatory       # Built-in: educational insights
/output-style learning          # Built-in: pair programming
/output-style my-custom-style   # Your custom style

# Create new style
/output-style:new              # Interactive creation
/output-style:new [description] # With description
```

## File Structure Template

```markdown
---
name: Style Name
description: Brief description shown to user
keep-coding-instructions: false
---

# Style Name

Main instructions here...

## Communication Style
How to communicate...

## Specific Behaviors
- Behavior 1
- Behavior 2
```

## Storage Locations

- **User-level** (all projects): `~/.claude/output-styles/`
- **Project-level** (this project): `.claude/output-styles/`
- **Settings persistence**: `.claude/settings.local.json`

## Frontmatter Fields

| Field | Required | Default | Purpose |
|-------|----------|---------|---------|
| `name` | Yes | filename | Display name |
| `description` | Yes | none | UI description |
| `keep-coding-instructions` | No | false | Retain coding instructions |

## keep-coding-instructions

**Added**: November 2025

```yaml
keep-coding-instructions: false  # Excludes coding instructions (for non-coding agents)
keep-coding-instructions: true   # Retains coding instructions (for specialized coding agents)
```

**Use `false` for**: Content writers, UX researchers, business analysts
**Use `true` for**: Security reviewers, performance optimizers, specialized developers

## Built-in Styles

| Style | Purpose | Best For |
|-------|---------|----------|
| **Default** | Fast, efficient coding | Experienced developers |
| **Explanatory** | Educational insights | Learning codebases, PR docs |
| **Learning** | Pair programming | Junior devs, learning |

## Settings Priority (High to Low)

1. Enterprise: `/etc/claude-code/managed-settings.json`
2. Project Local: `.claude/settings.local.json` (git-ignored)
3. Project Shared: `.claude/settings.json` (team)
4. User Global: `~/.claude/settings.json`

## Quick Examples

### Security Reviewer (with coding)
```yaml
---
name: Security Reviewer
description: OWASP-focused security analysis
keep-coding-instructions: true
---

# Security Reviewer
Focus on OWASP Top 10, input validation, auth/authz...
```

### Content Strategist (no coding)
```yaml
---
name: Content Strategist
description: Content structure and SEO optimization
keep-coding-instructions: false
---

# Content Strategist
Analyze content structure, SEO, brand voice...
```

## Comparison Chart

| Feature | Output Styles | CLAUDE.md | --append-system-prompt |
|---------|---------------|-----------|----------------------|
| Effect | Replace prompt | Add context | Append to prompt |
| Scope | Session-wide | Project context | Per-session |
| Best for | Personality change | Project info | One-off priority |

## Common Patterns

### Positive Instructions (Preferred)
```markdown
✅ "Use X when doing Y"
✅ "Prioritize A over B"
✅ "Explain using examples"
```

### Negative Constraints (Less Effective)
```markdown
❌ "Don't use emojis"
❌ "Never skip tests"
```

## Workflow Examples

### Development Session
```bash
# Start with performance focus
/output-style performance-optimizer

# Switch to security review before PR
/output-style security-reviewer

# Reset to default
/output-style default
```

### Team Setup
```bash
# Add project-specific style
mkdir -p .claude/output-styles
cat > .claude/output-styles/domain-expert.md << 'EOF'
---
name: Domain Expert
description: Project-specific domain knowledge
keep-coding-instructions: true
---
# Domain Expert
...
EOF

# Commit to git for team
git add .claude/output-styles/
git commit -m "Add domain expert output style"
```

## Troubleshooting

```bash
# Check active style
cat .claude/settings.local.json

# List available styles
ls ~/.claude/output-styles/
ls .claude/output-styles/

# Reset to default
/output-style default
```

## Resources

- **Official Docs**: https://code.claude.com/docs/en/output-styles
- **Template Gallery**: https://ccoutputstyles.vercel.app/
- **Install Templates**: `npx ccoutputstyles`

## Key Takeaways

1. Output styles **replace** the system prompt (don't add to it)
2. Use `keep-coding-instructions: true` for specialized coding agents
3. Store reusable styles in `~/.claude/output-styles/`
4. Settings persist per-project in `.claude/settings.local.json`
5. Combine personality (how) + technical (what) instructions
6. Positive instructions work better than negative constraints

---

**See Also**:
- Complete Guide: `/home/anga/workspace/beta/codehornets-ai/docs/CLAUDE_CODE_OUTPUT_STYLES_COMPLETE_GUIDE.md`
- Official Documentation: https://code.claude.com/docs/en/output-styles
