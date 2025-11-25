---
description: Update an existing Claude Code agent with new capabilities or configuration
---

# Update Agent Command

Update an existing agent's configuration, tools, or instructions.

## Usage

```
/update-agent [agent-name]
```

If no name provided, will list available agents and prompt.

## What Can Be Updated

1. **Tools & Permissions** - Add/remove tool access
2. **Model** - Change from Haiku ↔ Sonnet ↔ Opus
3. **Instructions** - Modify agent behavior and guidelines
4. **Output Style** - Update personality and tone
5. **Skills** - Add/remove integrated skills
6. **Frontmatter** - Change configuration fields

## Process

### Step 1: Select Agent

If no agent specified:
```
Available agents:
1. code-reviewer (.claude/agents/code-reviewer.md)
2. student-evaluator (.claude/agents/student-evaluator.md)
3. docs-generator (.claude/agents/docs-generator.md)

Which agent to update?
```

### Step 2: Choose Update Type

```
What do you want to update?

1. Add Tools - Grant access to additional tools
2. Remove Tools - Revoke tool access
3. Change Model - Switch between Haiku/Sonnet/Opus
4. Update Instructions - Modify behavior and guidelines
5. Update Output Style - Change personality/tone
6. Add Skills - Integrate new skills
7. Full Upgrade - Comprehensive update with latest best practices
```

### Step 3: Apply Changes

Based on selection, interactively update:

#### Add Tools
```
Current tools: Read, Grep, Glob
Available to add:
- Write (create/overwrite files)
- Edit (modify files)
- Bash (execute commands)
- WebFetch (fetch web content)
- WebSearch (search the web)
- Task (spawn sub-agents)

Which tools to add? Write, Edit
```

Updates:
- `.claude/agents/{name}.md` frontmatter
- `.claude/settings.json` allowedTools

#### Change Model
```
Current model: sonnet

Choose new model:
1. haiku - Fast, cost-effective (simple tasks)
2. sonnet - Balanced (recommended)
3. opus - Maximum capability (complex reasoning)

Select: opus
```

Updates:
- `.claude/agents/{name}.md` frontmatter: `model: opus`

#### Update Instructions
```
Current instructions:
[Shows current agent instructions]

How to update?
1. Append - Add new guidelines
2. Replace Section - Update specific section
3. Complete Rewrite - Start fresh

Choose: 1 (Append)

What to add?
> Focus on performance optimization
> Check for O(n²) algorithms
> Suggest caching opportunities
```

Updates:
- `.claude/agents/{name}.md` content

#### Update Output Style
```
Current style: Professional code reviewer

How to update?
1. Adjust Tone - More/less formal
2. Change Format - Response structure
3. Add Banner - Custom header
4. Complete Redesign - New personality

Choose: 1 (Adjust Tone)

New tone direction?
> More encouraging and educational
> Focus on explaining *why*, not just *what*
```

Updates:
- `.claude/output-styles/{name}.md` content

#### Add Skills
```
Current skills: (none)

Available skills:
- frontend-dev-guidelines
- backend-dev-guidelines
- testing-best-practices
- security-patterns
- performance-optimization

Which skills to add? security-patterns, performance-optimization
```

Updates:
- `.claude/agents/{name}.md` frontmatter: `skills: [security-patterns, performance-optimization]`

### Step 4: Verification

After updates:
```
✅ Updated: code-reviewer

Changes made:
- Added tools: Write, Edit
- Added skills: security-patterns, performance-optimization
- Updated instructions with performance focus

Files modified:
- .claude/agents/code-reviewer.md
- .claude/settings.json

Test with:
Task(subagent_type="code-reviewer", prompt="Review this code...")
```

## Examples

### Example 1: Add Tools to Existing Agent

```
/update-agent code-reviewer

What to update? 1 (Add Tools)

Which tools? Write, Edit

✅ Updated code-reviewer
   Added tools: Write, Edit
   Updated settings.json
```

### Example 2: Upgrade to Better Model

```
/update-agent student-evaluator

What to update? 3 (Change Model)

Current: sonnet
New model? opus

✅ Updated student-evaluator
   Changed model: sonnet → opus
   Better reasoning for complex evaluations
```

### Example 3: Enhance Instructions

```
/update-agent docs-generator

What to update? 4 (Update Instructions)

How? 1 (Append)

New guidelines:
> Always include code examples
> Add troubleshooting sections
> Include visual diagrams when helpful

✅ Updated docs-generator
   Enhanced instructions with new guidelines
```

## Update Strategies

### Incremental Updates (Recommended)
```
# Add one feature at a time
/update-agent my-agent
→ Add one tool
→ Test
→ Repeat
```

### Batch Updates
```
# Multiple changes at once
/update-agent my-agent
→ Add tools: Write, Edit, Bash
→ Add skills: testing, security
→ Update instructions
→ Test thoroughly
```

### Full Upgrade
```
# Comprehensive modernization
/update-agent my-agent
→ Choose: Full Upgrade
→ Reviews current config
→ Applies latest best practices
→ Updates to current Claude Code patterns
```

## Safety Features

### Backup Before Update
```
Backup created: .claude/agents/code-reviewer.md.backup
Proceed with update? (y/n)
```

### Validation
```
Validating YAML frontmatter... ✓
Checking tool availability... ✓
Verifying skills exist... ✓
Testing agent loads... ✓

All checks passed!
```

### Rollback
```
Update failed or not working?

Rollback options:
1. Restore from backup
2. Undo last change
3. Reset to defaults

Choose: 1 (Restore backup)

✅ Restored from backup
   Agent reverted to previous state
```

## Advanced: Migration Guide

### Migrate Old Agent Format
```
/update-agent legacy-agent

Detected: Old agent format (pre-2024)

Migrate to current format?
- Separate personality → output style
- Update YAML frontmatter
- Add progressive disclosure
- Configure tool permissions

Migrate? yes

✅ Migrated legacy-agent
   Now using modern format
```

### Multi-Agent Update
```
# Update multiple agents with same change
/update-agent code-reviewer,docs-gen,tester

Add tools: Bash(npm test:*)

Apply to all? yes

✅ Updated 3 agents
   All now have npm test access
```

## Best Practices

1. **Test After Updates** - Always verify agent works after changes
2. **Small Changes** - Incremental updates easier to debug
3. **Document Why** - Add comments explaining changes
4. **Version Control** - Commit before major updates
5. **Backup First** - Automatic backups before modifications
6. **Validate Tools** - Ensure new tools in settings.json
7. **Check Dependencies** - Skills must exist before adding

## Troubleshooting

### Issue: YAML Syntax Error
```
Error: Invalid YAML in frontmatter

Fix:
- Check indentation (use spaces, not tabs)
- Validate with: cat .claude/agents/{name}.md | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"
```

### Issue: Tool Not Available
```
Error: Tool 'Write' not in allowedTools

Fix:
- Add to .claude/settings.json:
  "allowedTools": ["Write"]
```

### Issue: Agent Won't Load
```
Error: Agent not found

Check:
- File exists: .claude/agents/{name}.md
- YAML frontmatter has 'name' field
- No duplicate names
```

## Integration with Other Commands

### Create → Update Workflow
```
# Create new agent
/create-agent my-agent

# Later: Add capabilities
/update-agent my-agent

# Later: Full modernization
/update-agent my-agent
→ Full Upgrade
```

### Update → Test Workflow
```
# Make changes
/update-agent my-agent

# Test immediately
Task(subagent_type="my-agent", prompt="Test task")

# If working, commit
git add .claude/agents/my-agent.md
git commit -m "feat: enhanced my-agent with new tools"
```

## Related Commands

- `/create-agent` - Create new agent
- `/list-agents` - Show all available agents
- `/test-agent` - Test agent configuration
- `/delete-agent` - Remove agent

## References

- Update patterns: `.claude/plugins/agent-manager/README.md`
- Agent structure: `docs/CLAUDE_CODE_SUBAGENTS_COMPLETE_GUIDE.md`
- Tool configuration: `docs/CLAUDE_CODE_PLUGINS_COMPLETE_GUIDE.md`

---

**Update agents safely and incrementally!**

Common updates:
- `/update-agent my-agent` → Interactive mode
- Add tools, change model, enhance instructions
