@echo off
REM Digital Agency Automation Platform - Windows Batch Helper
REM For Windows users who can't use Make directly

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="install" goto install
if "%1"=="setup" goto setup
if "%1"=="quick-start" goto quick-start
if "%1"=="dev" goto dev
if "%1"=="worker" goto worker
if "%1"=="test" goto test
if "%1"=="docker-up" goto docker-up
if "%1"=="docker-down" goto docker-down
if "%1"=="docker-logs" goto docker-logs
if "%1"=="health" goto health
goto help

:help
echo Digital Agency Automation Platform - Windows Commands
echo.
echo Usage: make.bat [command]
echo.
echo Common Commands:
echo   install       - Install dependencies with uv
echo   setup         - Complete setup
echo   quick-start   - Quick start (setup + docker-up)
echo   dev           - Start development server
echo   worker        - Start Celery worker
echo   test          - Run tests
echo   docker-up     - Start Docker services
echo   docker-down   - Stop Docker services
echo   docker-logs   - Show Docker logs
echo   health        - Check service health
echo.
echo For full list, see Makefile or use WSL/Git Bash with 'make help'
goto end

:install
echo 📦 Installing Python dependencies with uv...
uv pip install -r requirements.txt
uv pip install -r requirements-dev.txt
echo ✅ Dependencies installed
goto end

:setup
echo 🔧 Setting up environment...
call :install
if not exist .env (
    copy .env.example .env
    echo 📝 Created .env file - please configure it
) else (
    echo ✓ .env file already exists
)
echo 🗄️  Setting up database...
python scripts/migrate_db.py
echo ✅ Setup complete! Run 'make.bat dev' to start
goto end

:quick-start
echo 🚀 Quick start...
call :setup
call :docker-up
echo.
echo 🎉 Quick start complete!
echo.
echo ✅ Your Digital Agency Platform is running!
echo.
echo Access the services:
echo   API:    http://localhost:8000
echo   Docs:   http://localhost:8000/docs
echo   Flower: http://localhost:5555
goto end

:dev
echo 🚀 Starting development server...
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
goto end

:worker
echo 👷 Starting Celery worker...
celery -A shared.celery_app worker --loglevel=info
goto end

:test
echo 🧪 Running tests...
pytest tests/ -v
goto end

:docker-up
echo 🐳 Starting Docker services...
docker-compose up -d
echo ✅ Services started
echo   API:    http://localhost:8000
echo   Flower: http://localhost:5555
goto end

:docker-down
echo 🛑 Stopping Docker services...
docker-compose down
echo ✅ Services stopped
goto end

:docker-logs
echo 📋 Docker logs...
docker-compose logs -f
goto end

:health
echo 🏥 Checking service health...
curl -s http://localhost:8000/health
goto end

:end
