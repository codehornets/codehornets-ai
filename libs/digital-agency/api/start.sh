#!/bin/bash

# Digital Agency API Startup Script

set -e

echo "🚀 Starting Digital Agency Python API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "✏️  Please update .env with your configuration"
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check Redis availability (optional)
if command -v redis-cli &> /dev/null; then
    if redis-cli -a "${REDIS_URL##*:}" ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Some features may not work."
        echo "   Start Redis with: docker-compose up -d redis"
    fi
else
    echo "⚠️  Redis CLI not found. Install with: apt-get install redis-tools"
fi

# Start the API
echo ""
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📖 API Documentation: http://localhost:8000/docs"
echo "📊 Alternative Docs: http://localhost:8000/redoc"
echo ""

# Run with uvicorn
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
