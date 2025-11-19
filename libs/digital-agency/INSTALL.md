# Installation Guide

## Quick Install (All Platforms)

### Using the install script (Recommended)

```bash
# Run the installation script
bash scripts/install.sh
```

This will:
1. Check Python version
2. Install `uv` if not present
3. Install all dependencies
4. Create `.env` file from template

---

## Manual Installation

### 1. Install uv (Fast Python Package Manager)

**Windows (Git Bash/PowerShell):**
```bash
pip install uv
```

**Linux/Mac:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Or with pip:**
```bash
pip install uv
```

### 2. Install Dependencies

```bash
# Install production dependencies
uv pip install -r requirements.txt

# Install development dependencies
uv pip install -r requirements-dev.txt
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# Required: ANTHROPIC_API_KEY
# Optional: HUBSPOT_API_KEY, SENDGRID_API_KEY, etc.
```

### 4. Setup Database

```bash
# Run migrations
python scripts/migrate_db.py
```

---

## Platform-Specific Instructions

### Windows (Git Bash)

```bash
# Option 1: Use the install script
bash scripts/install.sh

# Option 2: Use Windows batch file
make.bat install
make.bat setup

# Option 3: Use Make (if installed)
make install
make setup
```

### Windows (PowerShell)

```powershell
# Install uv
pip install uv

# Install dependencies
uv pip install -r requirements.txt
uv pip install -r requirements-dev.txt

# Setup
copy .env.example .env
python scripts/migrate_db.py
```

### Linux/Mac

```bash
# Option 1: Use the install script
bash scripts/install.sh

# Option 2: Use Make
make install
make setup

# Option 3: Quick start (everything)
make quick-start
```

---

## Verification

Check that everything is installed correctly:

```bash
# Check Python
python --version
# Should be 3.11+

# Check uv
uv --version

# Check dependencies
uv pip list

# Check Docker (if using)
docker --version
docker-compose --version
```

---

## Starting the Platform

### Option 1: Docker (Easiest)

```bash
# Windows
make.bat docker-up

# Linux/Mac or Git Bash
make docker-up
# or
docker-compose up -d
```

### Option 2: Local Development

```bash
# Terminal 1: API Server
make dev
# or
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Celery Worker
make worker
# or
celery -A shared.celery_app worker --loglevel=info

# Terminal 3: Flower (optional)
make flower
# or
celery -A shared.celery_app flower --port=5555
```

### Option 3: Production

See `docs/deployment.md` for production deployment instructions.

---

## Common Issues

### uv not found

```bash
# Install uv
pip install uv

# Or use the official installer
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Permission denied on Windows

```bash
# Run Git Bash as Administrator
# or
# Use PowerShell as Administrator
```

### Docker not starting

```bash
# Check Docker is running
docker ps

# Restart Docker Desktop
# Then retry:
docker-compose up -d
```

### Database connection error

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

---

## Next Steps

After installation:

1. **Configure .env**
   ```bash
   # Edit with your editor
   nano .env
   # or
   code .env
   ```

2. **Start services**
   ```bash
   make quick-start
   ```

3. **Access the platform**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Flower: http://localhost:5555

4. **Read the guides**
   - Quick Start: `QUICK_START.md`
   - API Reference: `docs/api_reference.md`
   - Workflows: `docs/workflows.md`

---

## Troubleshooting

### Get help

```bash
# Show all available commands
make help

# Check service status
make status

# Check health
make health

# View logs
make logs
```

### Clean install

```bash
# Remove all installed packages
uv pip freeze | xargs uv pip uninstall -y

# Reinstall
bash scripts/install.sh
```

---

## Development Tools

After installation, you have access to:

```bash
make help              # All available commands
make dev               # Development server
make test              # Run tests
make lint              # Code quality
make format            # Format code
make docker-up         # Start Docker
make health            # Health check
```

---

## Support

- **Documentation**: Check `docs/` folder
- **Issues**: Check `QUICK_START.md` for common issues
- **Help**: Run `make help` for all commands

Happy coding! 🚀
