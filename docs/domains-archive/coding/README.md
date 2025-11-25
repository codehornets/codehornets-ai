# Coding Domain

Domain-specific customizations for software development and coding assistance.

## Assistants

### 💻 Anga - Coding Assistant

A specialized AI assistant for developers focused on code quality, architecture, and best practices.

**Features:**
- Code reviews and quality improvements
- Debugging and troubleshooting
- Architecture and design patterns
- Testing and documentation
- Performance optimization
- Security awareness

**Quick Start:**
```bash
make anga
```

**Documentation:** See [anga/README.md](anga/README.md)

## Future Assistants

- **CodeReviewer** - Specialized for comprehensive code reviews
- **Debugger** - Focused on debugging and troubleshooting
- **Architect** - System design and architecture specialist
- **SecurityAuditor** - Security-focused code analysis

## Language Coverage

Current assistants support:
- JavaScript/TypeScript
- Python
- Go
- Rust
- Java
- C#
- Ruby
- PHP
- SQL

## Adding New Coding Assistants

```bash
cd domains/coding/
cp -r anga/ code-reviewer/
# Edit templates and configuration
# Add Makefile target
```

## See Also

- [Anga Documentation](anga/README.md)
- [Domain Guidelines](../README.md)
- [Workspace System](../../workspaces/README.md)
