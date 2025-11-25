# Tools

This directory contains workspace-level tooling and scripts for the FunnelAgents monorepo.

## Purpose

- **Custom Generators**: Nx workspace generators for scaffolding new apps/libs
- **Scripts**: Build, deployment, and maintenance scripts
- **Executors**: Custom Nx executors for specialized build tasks
- **Migrations**: Database and workspace migration utilities

## Directory Structure

```
tools/
├── generators/        # Custom Nx generators
│   └── .gitkeep
├── executors/         # Custom Nx executors
│   └── .gitkeep
├── scripts/           # Utility scripts
│   └── .gitkeep
└── README.md          # This file
```

## Usage

### Creating a Custom Generator

```bash
nx generate @nx/workspace:workspace-generator my-generator
```

### Running Custom Scripts

```bash
node tools/scripts/my-script.js
```

## Guidelines

1. Keep tools focused and single-purpose
2. Document all custom generators and executors
3. Use TypeScript for complex tooling
4. Test generators before committing
