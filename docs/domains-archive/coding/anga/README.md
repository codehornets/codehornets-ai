# Anga - Coding Assistant

Anga is a specialized coding assistant focused on code quality, best practices, and developer productivity, built on Claude Code using the CLAUDE.md customization approach.

## Quick Start

```bash
# Launch Anga
make anga
```

## Directory Structure

```
anga/
├── templates/
│   └── ANGA.md       # Anga's behavior configuration (THE KEY FILE)
├── launchers/
│   └── anga.sh       # Launch script
├── docs/            # Documentation
└── tests/           # Test suite
```

## How It Works

Anga uses the **CLAUDE.md approach** - the official, supported way to customize Claude Code:

1. **ANGA.md** - Defines Anga's personality and coding expertise
2. **anga.sh** - Ensures ANGA.md is copied to workspace as CLAUDE.md
3. **Claude Code** - Reads CLAUDE.md and becomes Anga

**No CLI modification needed!** This approach:
- ✅ Works perfectly with authentication
- ✅ Survives Claude Code updates
- ✅ Uses official customization method
- ✅ No risk of breaking changes

## Features

### Code Quality & Review
- Comprehensive code reviews with severity ratings
- Clean code principles and refactoring suggestions
- Style guide adherence and linting recommendations

### Architecture & Design
- System design and architecture patterns
- Scalability and performance considerations
- Trade-off analysis for technical decisions

### Debugging & Troubleshooting
- Systematic debugging approach
- Root cause analysis
- Error handling and prevention

### Testing & Coverage
- Unit test writing and TDD support
- Integration and end-to-end testing
- Test coverage analysis

### Documentation
- Code comments and inline documentation
- README and API documentation
- Architecture decision records (ADRs)

### Performance Optimization
- Profiling and bottleneck identification
- Optimization strategies
- Measurement-driven improvements

### Security Awareness
- Security vulnerability detection
- Input validation and sanitization
- Authentication and authorization patterns

## Language Support

Anga is proficient in:
- **JavaScript/TypeScript** - ES6+, Node.js, React, Vue, Angular
- **Python** - Python 3.x, async/await, type hints
- **Go** - Idiomatic Go, concurrency
- **Rust** - Memory safety, ownership
- **Java** - Modern Java 17+, Spring
- **C#** - .NET Core/5+, LINQ
- **Ruby** - Ruby 3.x, Rails
- **PHP** - PHP 8+, Laravel
- **SQL** - PostgreSQL, MySQL

## Usage

### Launch Anga
```bash
make anga
```

### Create New Workspace
```bash
make create-workspace domain=coding project=my-project
cd workspaces/coding/my-project
../../../domains/coding/anga/launchers/anga.sh
```

### Anga introduces himself
```
═══════════════════════════════════════════════
  💻🚀💻   Anga v1.0
  ⚡🎯⚡   Coding Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Hi! I'm Anga, your coding assistant! 💻
I'm here to help you with:
- Code reviews and quality improvements
- Debugging and troubleshooting
- Architecture and design patterns
- Best practices and code standards
- Documentation and code explanations
- Test writing and coverage
- Performance optimization
- Refactoring and modernization

What are you working on?
```

## Example Interactions

### Code Review
```
You: Can you review this authentication function?

Anga: I'll review your authentication function! 💻

[Provides detailed review with:]
- ✅ What's done well
- 🔴 Critical issues (security, bugs)
- 🟡 Important improvements (performance, maintainability)
- 🟢 Nice-to-have suggestions (style, minor improvements)
- Code examples for each suggestion
```

### Debugging Help
```
You: I'm getting a null pointer exception in production

Anga: Let me help debug this! 🐛

[Systematic debugging:]
1. Understanding the error context
2. Checking recent changes
3. Reproducing the issue
4. Isolating the cause
5. Suggesting fixes with tests
```

### Architecture Discussion
```
You: Should I use microservices or a monolith?

Anga: Let's discuss the trade-offs! 🏗️

[Considers:]
- Your team size
- Scale requirements
- Deployment complexity
- Maintenance burden
- Suggests the right fit for YOUR situation
```

## Technical Details

### The CLAUDE.md Approach

Anga doesn't modify the Claude Code CLI. Instead, he uses CLAUDE.md:

```markdown
# In workspace/CLAUDE.md:
You are Claude Code, Anthropic's official CLI for Claude.

**Primary Role**: Introduce yourself as Anga, a coding assistant...
```

This is the **official, recommended way** to customize Claude Code behavior.

### Why Not Modify CLI?

- ❌ Risk of 401 authentication errors
- ❌ Breaks on Claude Code updates
- ❌ Complex maintenance

CLAUDE.md is better:
- ✅ Always works with authentication
- ✅ Survives updates
- ✅ Simple and maintainable

## Workspace Structure

When you launch Anga, your workspace looks like:

```
workspaces/coding/my-project/
├── CLAUDE.md              # Anga's configuration (from ANGA.md)
├── src/                   # Your source code
├── tests/                 # Your tests
├── docs/                  # Documentation
└── README.md              # Project README
```

## Philosophy

Anga follows these principles:

1. **Readability over cleverness**
2. **Explain the why, not just the what**
3. **Measure before optimizing**
4. **Test behavior, not implementation**
5. **Start simple, scale as needed**
6. **Security from the start**
7. **Documentation matters**
8. **Code is for humans**

## See Also

- [CLAUDE.md specification](https://docs.anthropic.com/claude-code)
- [Workspace system](../../../workspaces/README.md)
- [Domain guidelines](../../README.md)
