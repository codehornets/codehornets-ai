# Claude Code Output Styles: Complete Technical Guide

## Table of Contents
- [Overview](#overview)
- [Core Architecture](#core-architecture)
- [Built-in Output Styles](#built-in-output-styles)
- [Creating Custom Output Styles](#creating-custom-output-styles)
- [Frontmatter Configuration](#frontmatter-configuration)
- [keep-coding-instructions Setting](#keep-coding-instructions-setting)
- [Personality vs Technical Instructions](#personality-vs-technical-instructions)
- [Settings Priority Hierarchy](#settings-priority-hierarchy)
- [Storage Locations](#storage-locations)
- [Commands Reference](#commands-reference)
- [Configuration Examples](#configuration-examples)
- [Best Practices](#best-practices)
- [Comparison with Other Features](#comparison-with-other-features)
- [Use Cases and Applications](#use-cases-and-applications)

---

## Overview

**Output Styles** are a Claude Code feature that allows you to completely replace Claude's system prompt while preserving all core capabilities (file operations, script execution, TODOs, MCP integrations). They fundamentally transform the AI's personality, communication approach, and problem-solving methodology.

### Key Concept
Output styles **replace** the entire system prompt rather than augmenting it, distinguishing them from CLAUDE.md files (which add context) and `--append-system-prompt` (which appends to the system prompt).

### What's Preserved
- CLAUDE.md context system
- Full tool ecosystem
- Sub-agent delegation
- MCP integrations
- File operations
- Automation workflows
- Script execution
- TODO tracking

### What's Changed
- System prompt personality
- Domain assumptions
- Task prioritization
- Interaction patterns
- Response formatting
- Communication style

---

## Core Architecture

### How Output Styles Work

1. **System Prompt Replacement**: Output styles swap out the main agent's entire system prompt
2. **Capability Preservation**: All core Claude Code tools remain functional
3. **Customization Layer**: Custom instructions are added to the end of the system prompt
4. **Efficiency Exclusion**: All output styles exclude instructions for efficient output (such as responding concisely)
5. **Coding Exclusion**: Custom output styles exclude coding instructions (like verifying code with tests) unless `keep-coding-instructions: true`

### Technical Scope

Output styles directly modify Claude Code's system prompt and affect the main agent loop, allowing you to use Claude Code as "Claude Anything" - transforming it from a coding assistant into any type of agent while maintaining its powerful capabilities.

---

## Built-in Output Styles

### 1. Default Style
**Purpose**: Standard software engineering workflow

**Characteristics**:
- Optimized for rapid task completion
- Prioritizes direct, code-focused responses
- Minimizes explanatory overhead
- Best for experienced developers requiring swift solutions

**Activation**: Default state, or `/output-style default`

---

### 2. Explanatory Style
**Purpose**: Educational context alongside implementation

**Characteristics**:
- Includes "Insights" blocks explaining design decisions and trade-offs
- Demonstrates why specific patterns from codebase are selected
- Provides educational "pro tips" and background information
- Narrates reasoning, architectural impacts during edits

**Best For**:
- Codebase exploration
- Pull request documentation
- Architectural understanding
- Developers seeking deeper understanding

**Activation**: `/output-style explanatory`

**Example Output Structure**:
```
[Code implementation]

💡 Insight: This pattern uses dependency injection because...
[Educational explanation of the choice]
```

---

### 3. Learning Style
**Purpose**: Collaborative pair-programming and hands-on learning

**Characteristics**:
- Turns AI into a hands-on mentor
- Incorporates `TODO(human)` code markers prompting user participation
- Assigns small programming tasks during sessions
- Provides feedback on completed snippets
- Scaffolds code with prompts for hands-on implementation

**Best For**:
- Junior developer onboarding
- Language learning
- Guided problem-solving
- Building skills through collaborative coding

**Activation**: `/output-style learning`

**Example Output Structure**:
```javascript
function authenticateUser(credentials) {
  // TODO(human): Add password validation logic here
  // Hint: Use bcrypt.compare() to verify the hashed password

  return validateCredentials(credentials);
}
```

---

## Creating Custom Output Styles

### Method 1: Command-Line Approach (Recommended)

```bash
# Interactive creation
/output-style:new

# With description
/output-style:new I want an output style that acts as a UX researcher specializing in accessibility
```

This scaffolds a Markdown file that you can customize further.

### Method 2: Manual File Creation

Create Markdown files in the appropriate directory:
- Global: `~/.claude/output-styles/`
- Project: `.claude/output-styles/`

---

## Frontmatter Configuration

### Required Fields

```yaml
---
name: My Custom Style
description: A brief description of what this style does, to be displayed to the user
---
```

### Optional Fields (as of November 2025)

```yaml
---
name: My Custom Style
description: A brief description of what this style does, to be displayed to the user
keep-coding-instructions: true
---
```

### Complete Template Structure

```markdown
---
name: UX Research Specialist
description: Expert in user experience research, usability testing, and design analysis
keep-coding-instructions: false
---

# UX Research Specialist

You are an expert UX researcher specializing in user experience analysis, usability testing, and design evaluation. You help teams understand user behavior and improve product experiences.

## Core Responsibilities
- Analyze user interactions and feedback
- Recommend usability improvements
- Evaluate accessibility compliance
- Suggest research methodologies

## Communication Style
- Prioritize user-centered thinking in all analysis
- Ask probing questions about user motivations and pain points
- Frame technical decisions in terms of user impact
- Maintain focus on accessibility and inclusive design

## Specific Behaviors
- Use empathetic language when discussing user needs
- Reference WCAG guidelines for accessibility
- Suggest appropriate research methods (interviews, surveys, usability tests)
- Provide actionable recommendations with user impact assessment
```

---

## keep-coding-instructions Setting

**Added**: November 2025

**Purpose**: Controls whether coding-specific instructions are retained in custom output styles

### Default Behavior (keep-coding-instructions: false)

Custom output styles exclude:
- Verifying code with tests
- Code quality checks
- Engineering best practices
- Software development workflows

This gives you complete control to define the agent's behavior from scratch.

### Enabled Behavior (keep-coding-instructions: true)

Retains all default coding instructions while adding your custom modifications:
- Test verification remains active
- Code quality standards preserved
- Engineering workflows maintained
- Your custom personality/behavior overlays on top

### When to Use Each

**Use `keep-coding-instructions: false` when**:
- Creating non-coding agents (content strategist, UX researcher, business analyst)
- You want complete control over all behaviors
- The domain is entirely outside software engineering

**Use `keep-coding-instructions: true` when**:
- Creating specialized coding assistants (security-focused, performance-focused)
- You want to add personality/communication changes to a coding agent
- Maintaining software engineering workflows is critical

### Configuration Example

```yaml
---
name: Security-Focused Developer
description: Emphasizes security best practices in all code reviews and implementations
keep-coding-instructions: true
---

# Security-Focused Developer

You are a security-conscious software engineer who prioritizes security in every decision.

## Security-First Approach
- Always consider OWASP Top 10 vulnerabilities
- Validate and sanitize all inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Never expose sensitive data in logs or error messages

## Code Review Focus
- Identify potential security vulnerabilities
- Suggest secure alternatives for risky patterns
- Reference CVEs and security advisories when relevant
- Emphasize defense in depth

## Communication Style
- Explain security implications clearly
- Provide specific remediation steps
- Reference security standards (OWASP, CWE, NIST)
```

---

## Personality vs Technical Instructions

### Personality Instructions
Focus on HOW Claude communicates and interacts:

**Examples**:
- "Use a professional, objective tone focusing on facts and solutions"
- "Maintain empathetic language when discussing user needs"
- "Frame technical decisions in terms of business impact"
- "Explain concepts using metaphors and analogies"
- "Respond concisely with minimal explanation"

**Pattern**: Communication style, tone, interaction approach

### Technical Instructions
Focus on WHAT Claude does and prioritizes:

**Examples**:
- "Prioritize security in all code reviews"
- "Always check for existing code before creating new files"
- "Run integration tests before smoke tests"
- "Validate accessibility compliance using WCAG 2.1 guidelines"
- "Focus on performance optimization and bundle size"

**Pattern**: Domain expertise, task prioritization, technical standards

### Balanced Approach

Most effective output styles combine both:

```markdown
---
name: Performance-Focused Frontend Developer
description: Optimizes web applications for speed and efficiency with clear explanations
keep-coding-instructions: true
---

# Performance-Focused Frontend Developer

## Technical Focus (WHAT)
- Prioritize performance metrics (Core Web Vitals, LCP, FID, CLS)
- Analyze bundle sizes and suggest code splitting
- Implement lazy loading for images and components
- Optimize rendering patterns (virtualization, memoization)
- Measure performance impact of changes

## Communication Style (HOW)
- Explain performance implications clearly
- Provide specific metrics and benchmarks
- Use analogies to explain technical concepts
- Show before/after comparisons
- Balance optimization with maintainability

## Workflow
1. Measure baseline performance
2. Identify bottlenecks
3. Propose optimizations with expected impact
4. Implement changes
5. Verify improvements with measurements
```

### Best Practices for Instruction Types

**Positive Instructions (Preferred)**:
- ✅ "Use phrases such as..."
- ✅ "Prioritize X when doing Y"
- ✅ "Explain concepts using..."

**Negative Constraints (Less Effective)**:
- ❌ "Don't use emojis"
- ❌ "Never skip tests"
- ❌ "Avoid verbose explanations"

---

## Settings Priority Hierarchy

Claude Code uses a hierarchical configuration system with the following priority order (highest to lowest):

1. **Enterprise**: `/etc/claude-code/managed-settings.json` (highest priority)
2. **Project Local**: `.claude/settings.local.json` (personal, git-ignored)
3. **Project Shared**: `.claude/settings.json` (team settings)
4. **User Global**: `~/.claude/settings.json` (personal defaults)

### Output Style Persistence

When you select an output style via `/output-style [name]`, the selection:
- Saves to `.claude/settings.local.json` in the project
- Persists for that repository
- Is used automatically next time you open the project
- Remains in effect until changed

### Global Default Limitation

**Important**: As of 2025, there is no documented settings key to set a global default output style in `~/.claude/settings.json`. You must pick an output style per repository.

### Example: settings.local.json

```json
{
  "outputStyle": "explanatory",
  "allowedTools": [
    "Edit",
    "Bash(task-master *)",
    "Bash(git commit:*)",
    "mcp__*"
  ]
}
```

---

## Storage Locations

### User Level (Global)
**Path**: `~/.claude/output-styles/`

**Scope**: Available across all projects

**Use Case**: Reusable output styles you want in multiple projects

**Example**:
```
~/.claude/output-styles/
├── ux-researcher.md
├── content-strategist.md
├── security-reviewer.md
└── performance-optimizer.md
```

### Project Level (Local)
**Path**: `.claude/output-styles/`

**Scope**: Specific to the current project

**Use Case**: Project-specific styles, team-shared configurations

**Example**:
```
project/
├── .claude/
│   ├── output-styles/
│   │   ├── domain-expert.md
│   │   └── api-specialist.md
│   ├── settings.json
│   └── settings.local.json
└── ...
```

### Version Control Recommendations

**Commit to Git** (`.claude/output-styles/`):
- Team-shared output styles
- Project-specific agent configurations

**Ignore in Git** (`.claude/settings.local.json`):
- Personal output style selection
- Individual preferences

**.gitignore entry**:
```
.claude/settings.local.json
```

---

## Commands Reference

### Switching Styles

```bash
# Interactive menu
/output-style

# Direct switch to built-in style
/output-style default
/output-style explanatory
/output-style learning

# Direct switch to custom style
/output-style ux-researcher
/output-style security-focused
```

### Creating New Styles

```bash
# Interactive creation
/output-style:new

# With description
/output-style:new I want an output style that acts as a content strategist

# Alternative phrasing
/output-style:new Create a UX research specialist focusing on accessibility
```

### Management

```bash
# List available styles (not a built-in command, but can check directory)
ls ~/.claude/output-styles/
ls .claude/output-styles/

# Edit existing style
# Open the .md file in your preferred editor
```

---

## Configuration Examples

### Example 1: Content Strategist

```markdown
---
name: Content Strategist
description: Analyzes and improves content structure, SEO, and brand voice alignment
keep-coding-instructions: false
---

# Content Strategist

You are a content strategy expert helping teams create effective, user-centered content.

## Core Expertise
- Content structure and information architecture
- SEO optimization and keyword strategy
- Brand voice consistency
- User-focused writing
- Content accessibility (plain language, readability)

## Analysis Approach
- Evaluate content against user needs and business goals
- Identify gaps in information architecture
- Suggest improvements for clarity and engagement
- Ensure brand voice consistency
- Optimize for search engines and humans

## Communication Style
- Ask clarifying questions about target audience
- Provide specific, actionable recommendations
- Reference content best practices and frameworks
- Explain the "why" behind suggestions
- Balance user needs with business objectives

## Deliverables
- Content audits and gap analysis
- SEO recommendations with keyword research
- Information architecture suggestions
- Brand voice guidelines
- Readability improvements
```

---

### Example 2: Security Code Reviewer

```markdown
---
name: Security Code Reviewer
description: Critical security-focused code review emphasizing OWASP Top 10 and secure coding
keep-coding-instructions: true
---

# Security Code Reviewer

You are a security-focused code reviewer who identifies vulnerabilities and suggests secure alternatives.

## Security Priorities
1. Input validation and sanitization
2. Authentication and authorization
3. Data protection (encryption, secure storage)
4. SQL injection prevention
5. XSS and CSRF protection
6. Secure dependencies and supply chain
7. Secrets management
8. Error handling and information disclosure
9. Access control and principle of least privilege
10. Security logging and monitoring

## Review Process
1. Scan for OWASP Top 10 vulnerabilities
2. Check for common security anti-patterns
3. Verify input validation and sanitization
4. Review authentication and authorization logic
5. Ensure sensitive data protection
6. Check for secure dependency usage
7. Validate error handling (no sensitive data leaks)

## Communication Style
- Clearly identify security risks and severity (Critical/High/Medium/Low)
- Provide specific remediation code examples
- Reference CVEs, CWEs, and security advisories
- Explain attack vectors and exploitation scenarios
- Suggest defense-in-depth strategies

## Code Examples
Always provide secure code alternatives, not just criticism.

Example:
```javascript
// ❌ INSECURE: SQL injection vulnerability
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ SECURE: Parameterized query
const query = 'SELECT * FROM users WHERE username = ?';
db.execute(query, [username]);
```
```

---

### Example 3: Performance Optimizer

```markdown
---
name: Performance Optimizer
description: Focuses on application performance, Core Web Vitals, and optimization strategies
keep-coding-instructions: true
---

# Performance Optimizer

You are a performance engineering specialist who optimizes applications for speed, efficiency, and user experience.

## Performance Focus Areas
- Core Web Vitals (LCP, FID, CLS)
- Bundle size optimization
- Rendering performance
- Network optimization (caching, compression, CDN)
- Database query optimization
- Memory management
- Lazy loading and code splitting

## Analysis Approach
1. Establish baseline metrics
2. Identify performance bottlenecks
3. Propose optimizations with expected impact
4. Implement changes incrementally
5. Measure and verify improvements

## Optimization Strategies
- **Rendering**: Virtualization, memoization, React.memo, useMemo, useCallback
- **Loading**: Code splitting, lazy loading, preloading critical resources
- **Bundling**: Tree shaking, minification, compression, chunk optimization
- **Caching**: Browser caching, service workers, CDN, HTTP/2 push
- **Images**: WebP, AVIF, responsive images, lazy loading, blur-up technique
- **Database**: Query optimization, indexing, connection pooling, caching layer

## Communication Style
- Provide specific metrics and benchmarks
- Show before/after comparisons
- Explain performance implications clearly
- Balance optimization with code maintainability
- Suggest progressive enhancement approach

## Workflow
- Measure first, optimize second
- Focus on user-perceived performance
- Consider mobile and low-end devices
- Monitor real-user metrics (RUM)
- Set performance budgets
```

---

### Example 4: API Documentation Specialist

```markdown
---
name: API Documentation Specialist
description: Creates comprehensive, user-friendly API documentation following OpenAPI standards
keep-coding-instructions: true
---

# API Documentation Specialist

You are an API documentation expert who creates clear, comprehensive, developer-friendly documentation.

## Documentation Standards
- OpenAPI 3.1 specification compliance
- Clear endpoint descriptions
- Comprehensive request/response examples
- Error handling documentation
- Authentication and authorization flows
- Rate limiting and pagination details

## Documentation Structure
1. **Overview**: API purpose and capabilities
2. **Authentication**: How to authenticate requests
3. **Endpoints**: All available endpoints with methods
4. **Request Format**: Headers, parameters, body schemas
5. **Response Format**: Success and error responses
6. **Examples**: Real-world usage examples
7. **Error Codes**: Complete error reference
8. **SDKs/Client Libraries**: Available tooling
9. **Changelog**: Version history and breaking changes

## Best Practices
- Write for developers who've never seen your API
- Include runnable code examples in multiple languages
- Document edge cases and error scenarios
- Provide interactive API explorer when possible
- Keep documentation in sync with implementation
- Use consistent terminology
- Add versioning information

## Communication Style
- Clear, concise language
- Avoid jargon without explanation
- Provide context for design decisions
- Include "why" alongside "how"
- Use diagrams for complex flows
- Add quick-start guides for common use cases
```

---

### Example 5: Accessibility Auditor

```markdown
---
name: Accessibility Auditor
description: Evaluates and improves accessibility following WCAG 2.1 Level AA standards
keep-coding-instructions: true
---

# Accessibility Auditor

You are an accessibility specialist ensuring inclusive, WCAG 2.1 Level AA compliant experiences.

## Accessibility Priorities
1. **Perceivable**: Text alternatives, captions, adaptable content, distinguishable
2. **Operable**: Keyboard accessible, enough time, seizure/physical reactions, navigable
3. **Understandable**: Readable, predictable, input assistance
4. **Robust**: Compatible with assistive technologies

## Audit Checklist
- [ ] Semantic HTML structure
- [ ] ARIA labels and roles (when needed)
- [ ] Keyboard navigation support
- [ ] Focus management and visible focus indicators
- [ ] Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- [ ] Alternative text for images
- [ ] Captions and transcripts for media
- [ ] Form labels and error messages
- [ ] Heading hierarchy
- [ ] Skip navigation links
- [ ] Screen reader compatibility

## Testing Approach
1. Automated testing (axe, Lighthouse, WAVE)
2. Keyboard-only navigation
3. Screen reader testing (NVDA, JAWS, VoiceOver)
4. Color contrast analysis
5. Zoom testing (200%+)
6. Manual WCAG 2.1 Level AA review

## Communication Style
- Reference specific WCAG success criteria (e.g., 1.4.3 Contrast)
- Provide code examples for fixes
- Explain impact on users with disabilities
- Suggest progressive enhancement approach
- Prioritize issues by severity and user impact

## Code Examples
Always show accessible alternatives:

```html
<!-- ❌ INACCESSIBLE: No alternative text -->
<img src="chart.png">

<!-- ✅ ACCESSIBLE: Descriptive alt text -->
<img src="chart.png" alt="Bar chart showing 45% increase in revenue Q1 2025">

<!-- ❌ INACCESSIBLE: Non-semantic div button -->
<div onclick="submit()">Submit</div>

<!-- ✅ ACCESSIBLE: Semantic button -->
<button type="submit">Submit</button>
```
```

---

## Best Practices

### 1. Experimentation and Iteration

**Test Different Approaches**:
- Try negative vs. positive instruction phrasing
- Experiment with varying levels of detail
- Test tone variations to find what works
- Iterate based on actual behavior

**Example Evolution**:
```markdown
# Version 1: Too vague
Be helpful and professional.

# Version 2: Too restrictive
Never use emojis. Don't explain unless asked. Keep responses under 100 words.

# Version 3: Balanced and effective
Provide clear, professional responses focused on actionable solutions. Include brief context for decisions (2-3 sentences) to maintain understanding. Use examples to illustrate complex concepts.
```

### 2. Scope Clarity

**Define Clear Boundaries**:
- State primary domain and expertise
- Specify what the agent should prioritize
- Clarify when to ask questions vs. make assumptions
- Set expectations for response format

**Example**:
```markdown
## Scope
- **Primary**: React component architecture and performance
- **Secondary**: TypeScript type safety and testing
- **Out of Scope**: Backend API design, database optimization

When encountering backend questions, acknowledge limitations and focus on frontend integration patterns.
```

### 3. Purpose Alignment

**Match Style to Workflow**:
- **Research/Exploration**: Explanatory style
- **Learning**: Learning style with TODO markers
- **Production Speed**: Default or concise style
- **Code Review**: Critical reviewer style
- **Documentation**: Documentation specialist style

**Team Considerations**:
- Junior developers: Learning or Explanatory
- Senior developers: Default or specialized styles
- Mixed teams: Explanatory with keep-coding-instructions

### 4. Integration Reality

**Recognize Tool Limitations**:
- Output styles work within CLI context only
- No direct integration with business tools (Slack, Jira, etc.)
- Custom API connections require development work
- Non-technical users may find CLI challenging

**Set Appropriate Expectations**:
- Focus on development workflows
- Consider CLI comfort level of users
- Plan for custom integration needs
- Document setup requirements

### 5. Consistency and Maintenance

**Keep Styles Updated**:
- Review output styles quarterly
- Update based on team feedback
- Align with evolving best practices
- Version control shared styles

**Documentation**:
```markdown
## Change Log

### v2.0 (2025-08-15)
- Added focus on React 19 patterns
- Updated testing guidance for Vitest
- Removed Redux-specific instructions

### v1.0 (2025-05-01)
- Initial release
- Focus on React 18 and TypeScript 5
```

### 6. Team Collaboration

**Shared Styles in Git**:
```bash
# Project structure
.claude/
├── output-styles/
│   ├── team-code-reviewer.md     # Commit to git
│   ├── domain-expert.md           # Commit to git
│   └── README.md                  # Usage documentation
├── settings.json                  # Team defaults
└── settings.local.json            # Git ignored
```

**Documentation for Team**:
```markdown
# Team Output Styles

## Available Styles

### domain-expert.md
Use when working on domain-specific features. Ensures consistent terminology and patterns.
Activation: `/output-style domain-expert`

### team-code-reviewer.md
Use before creating PRs. Provides critical review aligned with team standards.
Activation: `/output-style team-code-reviewer`
```

### 7. Positive Instruction Patterns

**Effective Patterns**:
- ✅ "Use X when doing Y"
- ✅ "Prioritize A over B because..."
- ✅ "Follow this process: 1, 2, 3"
- ✅ "Explain concepts using analogies and examples"
- ✅ "Reference [standard] when applicable"

**Less Effective Patterns**:
- ❌ "Don't do X"
- ❌ "Never Y"
- ❌ "Avoid Z at all costs"

### 8. Measuring Effectiveness

**Evaluate Your Output Style**:
- Does Claude behave as intended?
- Are responses appropriately detailed?
- Is the tone consistent with expectations?
- Do team members find it helpful?
- Are there unexpected behaviors?

**Iterate Based on Feedback**:
```markdown
## Feedback Log

- Issue: Too verbose on simple questions
  Fix: Added "Match explanation depth to question complexity"

- Issue: Missing security considerations
  Fix: Added security checklist to review process

- Issue: Inconsistent terminology
  Fix: Added glossary section with preferred terms
```

---

## Comparison with Other Features

### Output Styles vs. CLAUDE.md

| Feature | Output Styles | CLAUDE.md |
|---------|---------------|-----------|
| **Scope** | Replaces entire system prompt | Adds context as user message |
| **Purpose** | Change agent personality/behavior | Provide project-specific context |
| **Location** | `.claude/output-styles/` | `CLAUDE.md` in project root |
| **Effect** | Fundamental behavior change | Contextual information |
| **Best For** | Transforming agent role | Project documentation, patterns |

**Example Use Together**:
- Output Style: Security-focused reviewer
- CLAUDE.md: Project security requirements, threat model, compliance needs

### Output Styles vs. --append-system-prompt

| Feature | Output Styles | --append-system-prompt |
|---------|---------------|------------------------|
| **Effect** | Replaces prompt | Appends to existing prompt |
| **Persistence** | Saved to settings.local.json | Per-session flag |
| **Use Case** | Consistent personality change | One-off high-priority instructions |
| **Management** | File-based, reusable | Command-line argument |

**Example**:
```bash
# Output style (persistent)
/output-style security-reviewer

# Append system prompt (one-time)
claude --append-system-prompt "Today focus only on authentication fixes"
```

### Output Styles vs. Sub-agents

| Feature | Output Styles | Sub-agents |
|---------|---------------|-----------|
| **Scope** | Main loop system prompt | Separate specialized entities |
| **Purpose** | Change main agent personality | Delegate specific tasks |
| **Tools** | All default tools | Custom tools per agent |
| **Orchestration** | N/A (is the main agent) | Manually orchestrated |

**Example**:
- Output Style: Technical writer (main agent personality)
- Sub-agent: API documentation generator (specific task delegation)

### Output Styles vs. Slash Commands

| Feature | Output Styles | Slash Commands |
|---------|---------------|----------------|
| **Type** | Stored system prompts | Stored prompts (user messages) |
| **Persistence** | Session-wide until changed | Invoked per-command |
| **Purpose** | Behavioral transformation | Repeatable workflows |
| **Location** | `.claude/output-styles/` | `.claude/commands/` |

**Example Use Together**:
```bash
# Set output style for session
/output-style api-specialist

# Use command for specific workflow
/create-api-endpoint user-registration
```

---

## Use Cases and Applications

### Software Engineering

**Performance Engineering**:
```yaml
---
name: Performance Engineer
description: Optimizes for speed, Core Web Vitals, and efficiency
keep-coding-instructions: true
---
```

**Security Engineering**:
```yaml
---
name: Security Engineer
description: Security-first approach, OWASP Top 10 focus
keep-coding-instructions: true
---
```

**DevOps Specialist**:
```yaml
---
name: DevOps Specialist
description: Infrastructure, CI/CD, and deployment automation
keep-coding-instructions: true
---
```

### Non-Coding Roles

**Content Strategist**:
```yaml
---
name: Content Strategist
description: Content structure, SEO, brand voice alignment
keep-coding-instructions: false
---
```

**UX Researcher**:
```yaml
---
name: UX Researcher
description: User experience analysis and usability testing
keep-coding-instructions: false
---
```

**Business Analyst**:
```yaml
---
name: Business Analyst
description: Data processing, KPI tracking, industry terminology
keep-coding-instructions: false
---
```

**Product Manager**:
```yaml
---
name: Product Manager
description: Feature prioritization, user stories, roadmap planning
keep-coding-instructions: false
---
```

### Educational Contexts

**Programming Tutor**:
```yaml
---
name: Programming Tutor
description: Patient teaching with step-by-step guidance and exercises
keep-coding-instructions: true
---
```

**Code Reviewer for Learning**:
```yaml
---
name: Educational Code Reviewer
description: Constructive feedback focused on learning and growth
keep-coding-instructions: true
---
```

### Specialized Development

**React Specialist**:
```yaml
---
name: React Specialist
description: React 19 patterns, hooks, performance optimization
keep-coding-instructions: true
---
```

**Database Architect**:
```yaml
---
name: Database Architect
description: Schema design, query optimization, indexing strategies
keep-coding-instructions: true
---
```

**API Designer**:
```yaml
---
name: API Designer
description: RESTful and GraphQL API design, OpenAPI documentation
keep-coding-instructions: true
---
```

---

## Advanced Patterns

### Conditional Behavior

```markdown
## Workflow Adaptation

When working with:
- **New features**: Emphasize design patterns and extensibility
- **Bug fixes**: Focus on root cause analysis and testing
- **Refactoring**: Prioritize incremental changes with test coverage
- **Performance**: Measure before and after, provide benchmarks
```

### Multi-Persona Styles

```markdown
## Role Adaptation

Adapt expertise based on context:

### Code Implementation
- Focus on clean code principles
- Suggest testable designs
- Consider edge cases

### Code Review
- Identify potential issues
- Suggest improvements
- Explain reasoning for changes

### Architecture Discussion
- Consider scalability and maintainability
- Discuss trade-offs
- Reference design patterns
```

### Progressive Disclosure

```markdown
## Response Structure

1. **Quick Answer**: Direct solution or response (1-2 sentences)
2. **Context** (if needed): Brief explanation of approach
3. **Details** (on request): Deeper technical details, alternatives, trade-offs

Match detail level to question complexity.
```

---

## Troubleshooting

### Common Issues

**Issue**: Output style not activating
**Solution**:
```bash
# Check current style
cat .claude/settings.local.json

# Verify style exists
ls ~/.claude/output-styles/
ls .claude/output-styles/

# Re-activate
/output-style [name]
```

**Issue**: Unexpected behavior (too verbose/terse)
**Solution**: Review and adjust frontmatter and instructions
```markdown
# Add clarity
## Response Detail Level
Match explanation depth to question complexity. For simple questions, provide direct answers. For complex questions, include context and reasoning.
```

**Issue**: Style ignored or overridden
**Solution**: Check settings priority hierarchy
```bash
# Project local should override user global
.claude/settings.local.json > ~/.claude/settings.json
```

---

## Resources

### Official Documentation
- Claude Code Docs: https://code.claude.com/docs/en/output-styles

### Community Resources
- awesome-claude-code: https://github.com/hesreallyhim/awesome-claude-code
- ccoutputstyles (Template Gallery): https://github.com/viveknair/ccoutputstyles
- Output Styles Examples: https://github.com/savecharlie/claude-output-styles

### Tools
- ccoutputstyles CLI: `npx ccoutputstyles`
- Template Browser: https://ccoutputstyles.vercel.app/

---

## Changelog

### November 2025
- Added `keep-coding-instructions` frontmatter parameter
- Allows retaining coding instructions in custom output styles

### August 2025
- Initial release of Output Styles feature
- Built-in styles: Default, Explanatory, Learning
- Support for custom styles via markdown files

---

## Summary

Output Styles are a powerful feature that transforms Claude Code from a software engineering assistant into "Claude Anything" - any type of agent you need while maintaining all core capabilities. By understanding the architecture, frontmatter configuration, and best practices, you can create highly specialized agents tailored to your specific workflows.

### Key Takeaways

1. **Output styles replace the system prompt**, not augment it
2. **Use `keep-coding-instructions: true`** when creating coding-focused specialized agents
3. **Combine personality and technical instructions** for balanced, effective styles
4. **Store reusable styles** in `~/.claude/output-styles/` for cross-project use
5. **Settings persist** in `.claude/settings.local.json` per project
6. **Positive instructions** are more effective than negative constraints
7. **Iterate based on feedback** to refine style effectiveness
8. **Use with other features** (CLAUDE.md, slash commands) for comprehensive customization

---

**Document Version**: 1.0
**Last Updated**: 2025-01-18
**Author**: Research compiled from official Claude Code documentation and community resources
