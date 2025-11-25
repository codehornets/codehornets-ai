# Migration from requirements.txt to pyproject.toml

## Summary

Successfully migrated the project from `requirements.txt` to `pyproject.toml` for modern Python dependency management using PEP 621 standards.

## Changes Made

### 1. Created `pyproject.toml`
- All dependencies from `requirements.txt` and `requirements-dev.txt` consolidated
- Development dependencies moved to `[project.optional-dependencies]`
- Fixed version conflicts:
  - **httpx**: Updated from `0.26.0` to `0.27.2` (required by `pytest-httpx==0.30.0`)
  - **hubspot-api-client**: Changed from `9.1.0` (non-existent) to `>=9.0.0,<13.0.0`
  - **safety**: Updated from `2.3.5` to `>=3.0.0` (packaging conflict with black)

### 2. Updated `Makefile`
- Changed `install` target from:
  ```makefile
  uv pip install -r requirements.txt
  uv pip install -r requirements-dev.txt
  ```
  to:
  ```makefile
  uv pip install -e ".[dev]"
  ```
- Removed obsolete `requirements-update` and `requirements-sync` targets
- Added new targets:
  - `deps-sync`: Sync packages with pyproject.toml
  - `deps-list`: List installed dependencies

### 3. Added Tool Configurations
The `pyproject.toml` includes configurations for:
- **Black** (code formatting)
- **isort** (import sorting)
- **pytest** (testing framework)
- **mypy** (type checking)
- **pylint** (linting)
- **coverage** (code coverage)

## Installation

Now you can install dependencies with:

```bash
# Install all dependencies (including dev)
make install

# Or manually
uv pip install -e ".[dev]"

# Install only production dependencies
uv pip install -e .
```

## Next Steps (Optional)

### Remove Old Files
If you're fully satisfied with the migration, you can remove the old requirements files:

```bash
# Backup first (optional)
mkdir -p .backup
mv requirements.txt .backup/
mv requirements-dev.txt .backup/

# Or delete directly
rm requirements.txt requirements-dev.txt
```

### Update CI/CD
If you have CI/CD pipelines (GitHub Actions, GitLab CI, etc.), update them to use:
```yaml
- name: Install dependencies
  run: uv pip install -e ".[dev]"
```

### Update Docker
If you have a `Dockerfile`, update the installation commands:
```dockerfile
# Instead of:
# RUN pip install -r requirements.txt

# Use:
COPY pyproject.toml ./
RUN uv pip install -e .
```

## Benefits of pyproject.toml

1. **Single Source of Truth**: All project metadata and dependencies in one file
2. **Modern Standard**: Following PEP 621 (Python packaging standard)
3. **Better Dependency Resolution**: Clear separation of production vs development dependencies
4. **Tool Configuration**: All tool configurations in one place
5. **Editable Install**: The `-e` flag allows for development without reinstalling

## Verification

Test that everything works:

```bash
# Install dependencies
make install

# Run tests
make test

# Check code quality
make format
make lint
```

## Troubleshooting

If you encounter issues:

1. **Clear the virtual environment**:
   ```bash
   rm -rf .venv
   uv venv
   make install
   ```

2. **Check Python version**: Requires Python >= 3.11
   ```bash
   python --version
   ```

3. **Update uv**:
   ```bash
   pip install --upgrade uv
   ```

## Additional Makefile Fixes (Windows Compatibility)

### Fixed Recursive Make Issues
On Windows with Git Bash, recursive `$(MAKE)` calls fail when make is installed in a path with spaces (e.g., "C:/Program Files (x86)/GnuWin32/bin/make").

**Fixed targets:**
- `setup`: Removed recursive `$(MAKE) migrate` call, now runs Python script directly
- `db-reset`: Replaced `$(MAKE) migrate-rollback`, `$(MAKE) migrate`, `$(MAKE) seed` with direct Python commands
- `lint`: Replaced `$(MAKE) lint-python` and `$(MAKE) lint-yaml` with actual commands

### Added uv run Wrapper
All Python script executions now use `uv run python` instead of just `python` to ensure the virtual environment is used:
```makefile
# Before
python scripts/migrate_db.py

# After
uv run python scripts/migrate_db.py
```

### Improved Setup Flow
- `setup` target now only handles installation and .env creation
- Database migration moved to separate `init-db` target
- `quick-start` now runs: `setup` → `docker-up` → `init-db`
- Added graceful error handling for database operations

### New Targets Added
- `init-db`: Initialize database (run migrations + seed) with error handling
- `deps-sync`: Sync installed packages with pyproject.toml
- `deps-list`: List installed dependencies

## Current Working Flow

```bash
# Full quick start (recommended for first-time setup)
make quick-start

# Or step by step:
make install      # Install dependencies
make setup        # Create .env file
make docker-up    # Start Docker services
make init-db      # Initialize database
make dev          # Start development server
```

## Files Modified

1. `pyproject.toml` - Created (replaced requirements.txt)
2. `Makefile` - Updated for Windows compatibility and pyproject.toml
3. `scripts/seed_data.py` - Created stub file
4. `MIGRATION.md` - This documentation file

## Testing

All basic commands now work on Windows with Git Bash:

```bash
✅ make install
✅ make setup
✅ make docker-up
✅ make init-db
✅ make test
✅ make lint
✅ make format
```

