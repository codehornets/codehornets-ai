# Dance Domain

Domain-specific customizations for dance teaching and studio management.

## Assistants

### 🩰 Marie - Dance Teacher Assistant

A specialized AI assistant for dance teachers and studio owners.

**Features:**
- Student progress tracking
- Class documentation
- Choreography organization
- Recital planning
- Parent communications
- Studio management

**Quick Start:**
```bash
make marie
```

**Documentation:** See [marie/README.md](marie/README.md)

## Future Assistants

- **Choreographer** - Specialized for creating and documenting choreography
- **Studio Manager** - Focused on business operations and scheduling
- **Competition Coach** - Competition preparation and tracking

## Adding New Dance Assistants

```bash
cd domains/dance/
cp -r marie/ choreographer/
# Edit templates and configuration
# Add Makefile target
```
