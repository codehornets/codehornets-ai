# Multi-Agent Orchestration System - Makefile
# Convenient commands for managing orchestrator and workers

.PHONY: help all pull setup-auth-dirs fix-permissions auth-orchestrator auth-marie auth-anga auth-fabien auth-all start stop restart restart-orchestrator restart-workers logs status attach clean rebuild clean-workspace clean-workspace-test start-activated stop-activated restart-activated test-activation check-heartbeats activation-status switch-to-redis switch-to-inotify start-hooks stop-hooks restart-hooks start-hybrid logs-watcher-marie logs-watcher-anga logs-watcher-fabien test-hooks hooks-status check-triggers clean-triggers check-pipes test-marie test-anga test-fabien test-all-workers watch-results clean-test-data test-quick test-load

# Default target
help:
	@echo "Multi-Agent Orchestration System - Available Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make all            - Complete setup: pull + fix-permissions + auth-all + start + interactive-setup"
	@echo ""
	@echo "Setup (one-time):"
	@echo "  make pull           - Pull Claude Code Docker image"
	@echo "  make fix-permissions - Fix auth directory permissions (run with sudo if needed)"
	@echo "  make auth-all       - Authenticate all 4 agents (orchestrator, marie, anga, fabien)"
	@echo "  make setup-workers-interactive - Interactively set up workers (Marie, Anga, Fabien)"
	@echo "  make auth-orchestrator - Authenticate orchestrator only"
	@echo "  make auth-marie     - Authenticate Marie only"
	@echo "  make auth-anga      - Authenticate Anga only"
	@echo "  make auth-fabien    - Authenticate Fabien only"
	@echo ""
	@echo "System management:"
	@echo "  make start          - Start all containers in background"
	@echo "  make stop           - Stop all containers"
	@echo "  make restart        - Restart all containers"
	@echo "  make restart-orchestrator - Restart orchestrator only (reload prompt)"
	@echo "  make restart-workers - Restart all workers (reload prompts)"
	@echo "  make rebuild        - Rebuild and restart (use after prompt changes)"
	@echo ""
	@echo "Monitoring:"
	@echo "  make status         - Show container status"
	@echo "  make logs           - Show logs from all containers"
	@echo "  make logs-orchestrator - Show orchestrator logs"
	@echo "  make logs-marie     - Show Marie logs"
	@echo "  make logs-anga      - Show Anga logs"
	@echo "  make logs-fabien    - Show Fabien logs"
	@echo ""
	@echo "Interaction:"
	@echo "  make attach         - Attach to orchestrator (Ctrl+P Ctrl+Q to detach)"
	@echo "  make attach-marie   - Attach to Marie"
	@echo "  make attach-anga    - Attach to Anga"
	@echo "  make attach-fabien  - Attach to Fabien"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Stop containers and remove volumes"
	@echo "  make clean-tasks    - Clear all task files"
	@echo "  make clean-results  - Clear all result files"
	@echo "  make clean-workspace - Clean all workspace evaluations"
	@echo "  make clean-workspace-test - Clean workspace and restart test"
	@echo ""
	@echo "File Management:"
	@echo "  make copy-from-marie  - Copy files from Marie's container to host"
	@echo "  make copy-from-anga   - Copy files from Anga's container to host"
	@echo "  make copy-from-fabien - Copy files from Fabien's container to host"
	@echo ""
	@echo "Backup & Safety:"
	@echo "  make backup-marie     - Backup Marie's work and chat history"
	@echo "  make backup-anga      - Backup Anga's work and chat history"
	@echo "  make backup-fabien    - Backup Fabien's work and chat history"
	@echo "  make backup-all       - Backup all agents (run before restart!)"
	@echo ""
	@echo "Event-Driven Activation (Zero CPU Idle):"
	@echo "  make start-activated  - Start system with event-driven activation"
	@echo "  make stop-activated   - Stop activated system"
	@echo "  make restart-activated - Restart activated system"
	@echo "  make test-activation  - Run comprehensive activation tests"
	@echo "  make check-heartbeats - Monitor worker heartbeats (live)"
	@echo "  make activation-status - Check activation mode and worker status"
	@echo "  make switch-to-redis  - Switch workers to Redis pub/sub mode"
	@echo "  make switch-to-inotify - Switch workers to inotify mode (default)"
	@echo ""
	@echo "Hooks-Based Communication (NEW):"
	@echo "  make start-hooks      - Start system with hooks-based communication"
	@echo "  make stop-hooks       - Stop hooks system"
	@echo "  make restart-hooks    - Restart hooks system"
	@echo "  make start-hybrid     - Start hybrid mode (wrapper + hooks)"
	@echo "  make logs-watcher-marie  - View Marie's hook watcher logs"
	@echo "  make logs-watcher-anga   - View Anga's hook watcher logs"
	@echo "  make logs-watcher-fabien - View Fabien's hook watcher logs"
	@echo "  make test-hooks       - Run hooks integration tests"
	@echo "  make hooks-status     - Check hooks system status"
	@echo "  make check-triggers   - Check trigger files"
	@echo "  make clean-triggers   - Clean up trigger files"
	@echo "  make check-pipes      - Check named pipes status"
	@echo ""
	@echo "Testing Commands (NEW):"
	@echo "  make test-marie       - Test Marie with a sample task"
	@echo "  make test-anga        - Test Anga with a sample task"
	@echo "  make test-fabien      - Test Fabien with a sample task"
	@echo "  make test-all-workers - Test all workers simultaneously"
	@echo "  make test-quick       - Quick automated test (Marie)"
	@echo "  make test-load        - Load test with 10 concurrent tasks"
	@echo "  make watch-results    - Watch for new results (live)"
	@echo "  make clean-test-data  - Clean all test tasks and results"

# Complete setup - pull, auth, start
all:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Multi-Agent Orchestration System - Complete Setup"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "This will:"
	@echo "  1. Pull Claude Code Docker image"
	@echo "  2. Fix any permission issues (may ask for sudo password)"
	@echo "  3. Authenticate all 4 agents (orchestrator, marie, anga, fabien)"
	@echo "  4. Start the multi-agent system"
	@echo "  5. Interactive setup for each agent (theme selection)"
	@echo "  6. Show you how to connect"
	@echo ""
	@echo "Press Enter to continue or Ctrl+C to cancel..."
	@read dummy
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Step 1/5: Pulling Docker Image"
	@echo "════════════════════════════════════════════════════════════════"
	@make pull
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Step 2/5: Fixing Permissions"
	@echo "════════════════════════════════════════════════════════════════"
	@make fix-permissions
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Step 3/5: Starting Multi-Agent System"
	@echo "════════════════════════════════════════════════════════════════"
	@make start
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Step 4/5: Interactive Agent Setup"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Now you'll complete the setup for each agent interactively."
	@echo "This is a one-time setup (theme selection, etc.)"
	@echo "Press Enter to start interactive setup..."
	@read dummy
	@make setup-workers-interactive
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Step 5/5: Setup Complete!"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "✓ Docker image pulled"
	@echo "✓ Permissions fixed"
	@echo "✓ All agents authenticated"
	@echo "✓ System started"
	@echo "✓ Interactive setup completed"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Next Steps"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Connect to orchestrator:"
	@echo "  $$ make attach"
	@echo ""
	@echo "Try these commands:"
	@echo '  "Evaluate all dance students"'
	@echo '  "Review the authentication code"'
	@echo '  "Create a social media campaign"'
	@echo '  "Do all three at once"'
	@echo ""
	@echo "Other useful commands:"
	@echo "  make status         - Check system status"
	@echo "  make logs           - View all logs"
	@echo "  make help           - Show all commands"
	@echo ""
	@echo "Detach without stopping: Ctrl+P then Ctrl+Q"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Ready to orchestrate! 🎯"
	@echo "════════════════════════════════════════════════════════════════"

# Pull Docker image
pull:
	@echo "Pulling Claude Code Docker image..."
	docker pull docker/sandbox-templates:claude-code

# Fix permissions on auth directories (run if you see EACCES errors)
fix-permissions:
	@echo "Fixing permissions on auth directories..."
	@if [ -d "infrastructure/docker/codehornets-ai/shared/auth-homes" ]; then \
		echo "Changing ownership of infrastructure/docker/codehornets-ai/shared/auth-homes to $(USER):$(USER)..."; \
		sudo chown -R $(USER):$(USER) infrastructure/docker/codehornets-ai/shared/auth-homes; \
		echo "✓ Permissions fixed"; \
	else \
		echo "✓ No auth directories found (will be created automatically)"; \
	fi

# Setup auth directories with correct permissions
setup-auth-dirs:
	@mkdir -p infrastructure/docker/codehornets-ai/shared/auth-homes/orchestrator
	@mkdir -p infrastructure/docker/codehornets-ai/shared/auth-homes/marie
	@mkdir -p infrastructure/docker/codehornets-ai/shared/auth-homes/anga
	@mkdir -p infrastructure/docker/codehornets-ai/shared/auth-homes/fabien
	@echo "✓ Auth directories created"

# Authentication commands
auth-orchestrator: setup-auth-dirs
	@echo "Authenticating orchestrator..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/infrastructure/docker/codehornets-ai/shared/auth-homes/orchestrator:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-marie: setup-auth-dirs
	@echo "Authenticating Marie..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/infrastructure/docker/codehornets-ai/shared/auth-homes/marie:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-anga: setup-auth-dirs
	@echo "Authenticating Anga..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/infrastructure/docker/codehornets-ai/shared/auth-homes/anga:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-fabien: setup-auth-dirs
	@echo "Authenticating Fabien..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/infrastructure/docker/codehornets-ai/shared/auth-homes/fabien:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-all:
	@echo "Authenticating all agents..."
	@echo "You'll authenticate 4 agents: orchestrator, marie, anga, fabien"
	@echo ""
	@echo "Press Enter to start with orchestrator..."
	@read dummy
	@make auth-orchestrator
	@echo ""
	@echo "Press Enter to continue with Marie..."
	@read dummy
	@make auth-marie
	@echo ""
	@echo "Press Enter to continue with Anga..."
	@read dummy
	@make auth-anga
	@echo ""
	@echo "Press Enter to continue with Fabien..."
	@read dummy
	@make auth-fabien
	@echo ""
	@echo "✓ All agents authenticated!"

# System management
start:
	@echo "Starting multi-agent system..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose up -d
	@echo ""
	@echo "✓ System started!"
	@echo ""
	@echo "To attach to orchestrator: make attach"
	@echo "To view logs: make logs"
	@echo "To check status: make status"

stop:
	@echo "Stopping multi-agent system..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose down
	@echo "✓ System stopped"

restart:
	@echo "Restarting multi-agent system..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose restart
	@echo "✓ System restarted"

restart-orchestrator:
	@echo "Restarting orchestrator with fresh prompt..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose stop orchestrator
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose rm -f orchestrator
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose up -d orchestrator
	@echo ""
	@echo "✓ Orchestrator restarted with fresh prompt"
	@echo ""
	@echo "Connect with: make attach"

restart-workers:
	@echo "Restarting all workers with fresh prompts..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose stop marie anga fabien
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose rm -f marie anga fabien
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose up -d marie anga fabien
	@echo ""
	@echo "✓ All workers restarted with fresh prompts"
	@echo ""
	@echo "Check status with: make status"

rebuild:
	@echo "Rebuilding and restarting system..."
	@echo "Use this after changing prompts in prompts/ directory"
	@echo "Stopping and removing containers..."
	@docker stop orchestrator marie anga fabien 2>/dev/null || true
	@docker rm orchestrator marie anga fabien 2>/dev/null || true
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose down 2>/dev/null || true
	@echo "Starting fresh containers..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose up -d --force-recreate
	@echo ""
	@echo "✓ System rebuilt and restarted"
	@echo ""
	@echo "Connect with: make attach"

clean-containers:
	@echo "Force cleaning all containers..."
	@docker stop orchestrator marie anga fabien 2>/dev/null || true
	@docker rm orchestrator marie anga fabien 2>/dev/null || true
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose down 2>/dev/null || true
	@echo "✓ All containers cleaned"

# Monitoring
status:
	@echo "Container status:"
	@cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose ps

logs:
	@echo "Showing logs from all containers (Ctrl+C to exit)..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose logs -f

logs-orchestrator:
	@echo "Showing orchestrator logs (Ctrl+C to exit)..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose logs -f orchestrator

logs-marie:
	@echo "Showing Marie logs (Ctrl+C to exit)..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose logs -f marie

logs-anga:
	@echo "Showing Anga logs (Ctrl+C to exit)..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose logs -f anga

logs-fabien:
	@echo "Showing Fabien logs (Ctrl+C to exit)..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose logs -f fabien

# Interaction
attach:
	@echo "Attaching to orchestrator..."
	@echo "Press Ctrl+P then Ctrl+Q to detach without stopping"
	@echo ""
	docker attach orchestrator

attach-marie:
	@echo "Attaching to Marie..."
	@echo "Press Ctrl+P then Ctrl+Q to detach without stopping"
	@echo ""
	docker attach marie

attach-anga:
	@echo "Attaching to Anga..."
	@echo "Press Ctrl+P then Ctrl+Q to detach without stopping"
	@echo ""
	docker attach anga

attach-fabien:
	@echo "Attaching to Fabien..."
	@echo "Press Ctrl+P then Ctrl+Q to detach without stopping"
	@echo ""
	docker attach fabien

# Cleanup
clean:
	@echo "Stopping containers and cleaning up..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose down -v
	@echo "✓ Cleanup complete"

clean-tasks:
	@echo "Clearing all task files..."
	@find infrastructure/docker/codehornets-ai/shared/tasks/ -type f -name "*.json" -delete 2>/dev/null || true
	@echo "✓ Task files cleared"

clean-results:
	@echo "Clearing all result files..."
	@find infrastructure/docker/codehornets-ai/shared/results/ -type f -delete 2>/dev/null || true
	@echo "✓ Result files cleared"

# Interactive worker setup (attach to each container)
setup-workers-interactive:
	@./setup-workers-interactive.sh

# Authenticate workers while system is running
auth-workers-running:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Authenticating Workers (System Running)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "This will authenticate Marie, Anga, and Fabien while containers are running."
	@echo "The running containers will automatically pick up credentials after authentication."
	@echo ""
	@echo "Press Enter to start with Marie..."
	@read dummy
	@make auth-marie
	@echo ""
	@echo "Press Enter to continue with Anga..."
	@read dummy
	@make auth-anga
	@echo ""
	@echo "Press Enter to continue with Fabien..."
	@read dummy
	@make auth-fabien
	@echo ""
	@echo "✓ All workers authenticated!"
	@echo ""
	@echo "Now restart workers to load credentials: make restart-workers"

# Quick check - verify authentication
check-auth:
	@echo "Checking authentication status..."
	@echo ""
	@echo "Orchestrator:"
	@test -f infrastructure/docker/codehornets-ai/shared/auth-homes/orchestrator/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-orchestrator)"
	@echo "Marie:"
	@test -f infrastructure/docker/codehornets-ai/shared/auth-homes/marie/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-marie)"
	@echo "Anga:"
	@test -f infrastructure/docker/codehornets-ai/shared/auth-homes/anga/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-anga)"
	@echo "Fabien:"
	@test -f infrastructure/docker/codehornets-ai/shared/auth-homes/fabien/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-fabien)"

# Development helpers
check-tasks:
	@echo "Current tasks in queue:"
	@echo ""
	@echo "Marie:"
	@ls -1 infrastructure/docker/codehornets-ai/shared/tasks/marie/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} tasks"
	@echo "Anga:"
	@ls -1 infrastructure/docker/codehornets-ai/shared/tasks/anga/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} tasks"
	@echo "Fabien:"
	@ls -1 infrastructure/docker/codehornets-ai/shared/tasks/fabien/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} tasks"

check-results:
	@echo "Results available:"
	@echo ""
	@echo "Marie:"
	@ls -1 infrastructure/docker/codehornets-ai/shared/results/marie/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} results"
	@echo "Anga:"
	@ls -1 infrastructure/docker/codehornets-ai/shared/results/anga/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} results"
	@echo "Fabien:"
	@ls -1 infrastructure/docker/codehornets-ai/shared/results/fabien/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} results"

# Workspace cleanup
clean-workspace:
	@echo "Cleaning workspace evaluations..."
	@echo ""
	@echo "Dance workspace:"
	@find workspaces/dance/studio/students/*/evaluations/ -type f -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  Found {} evaluation files"
	@find workspaces/dance/studio/students/*/evaluations/ -type f -name "*.md" -delete 2>/dev/null || true
	@echo "  ✓ All evaluation files deleted"
	@echo ""
	@echo "Coding workspace:"
	@find workspaces/coding/ -type f -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  Found {} files"
	@find workspaces/coding/ -type f -name "*.md" -delete 2>/dev/null || true
	@echo "  ✓ All files deleted"
	@echo ""
	@echo "Marketing workspace:"
	@find workspaces/marketing/ -type f -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  Found {} files"
	@find workspaces/marketing/ -type f -name "*.md" -delete 2>/dev/null || true
	@echo "  ✓ All files deleted"
	@echo ""
	@echo "✓ Workspace cleanup complete"

clean-workspace-test:
	@echo "Cleaning workspace and restarting test..."
	@echo ""
	@make clean-workspace
	@echo ""
	@echo "Ready to test! Run:"
	@echo "  'Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez'"
	@echo ""
	@echo "Expected output location:"
	@echo "  workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_2025-11-17.md"

# Copy files from agent containers to host
copy-from-marie:
	@echo "Copying files from Marie container..."
	@echo ""
	@read -p "Source path in container (e.g., /home/agent/workspace/evaluations_revised): " src; \
	read -p "Destination on host (e.g., ./workspaces/dance/evaluations_revised): " dest; \
	mkdir -p "$$dest"; \
	docker cp marie:"$$src/." "$$dest/"; \
	echo ""; \
	echo "✓ Files copied to $$dest"

copy-from-anga:
	@echo "Copying files from Anga container..."
	@echo ""
	@read -p "Source path in container: " src; \
	read -p "Destination on host: " dest; \
	mkdir -p "$$dest"; \
	docker cp anga:"$$src/." "$$dest/"; \
	echo ""; \
	echo "✓ Files copied to $$dest"

copy-from-fabien:
	@echo "Copying files from Fabien container..."
	@echo ""
	@read -p "Source path in container: " src; \
	read -p "Destination on host: " dest; \
	mkdir -p "$$dest"; \
	docker cp fabien:"$$src/." "$$dest/"; \
	echo ""; \
	echo "✓ Files copied to $$dest"

# Backup commands
backup-marie:
	@./save-agent-work.sh marie

backup-anga:
	@./save-agent-work.sh anga

backup-fabien:
	@./save-agent-work.sh fabien

backup-all:
	@echo "Backing up all agents..."
	@./save-agent-work.sh marie
	@./save-agent-work.sh anga
	@./save-agent-work.sh fabien
	@echo ""
	@echo "✓ All agents backed up!"
	@echo ""
	@echo "⚠️  IMPORTANT: Backups are in backups/ directory"
	@echo "   These include conversation history and all work"

# Event-Driven Activation System Commands
# Zero CPU when idle, instant wakeup on task arrival

start-activated:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Starting Event-Driven Activation System"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Features:"
	@echo "  • Zero CPU usage when idle (0%)"
	@echo "  • Instant wakeup on task arrival (<1ms with inotify)"
	@echo "  • Thread-safe task queueing (no lost signals)"
	@echo "  • Graceful shutdown (60s grace period)"
	@echo "  • Heartbeat monitoring (10s interval)"
	@echo "  • Automatic fallback (Redis → inotify → polling)"
	@echo ""
	@mkdir -p infrastructure/docker/codehornets-ai/shared/heartbeats
	@mkdir -p infrastructure/docker/codehornets-ai/shared/tasks/marie infrastructure/docker/codehornets-ai/shared/tasks/anga infrastructure/docker/codehornets-ai/shared/tasks/fabien
	@mkdir -p infrastructure/docker/codehornets-ai/shared/results/marie infrastructure/docker/codehornets-ai/shared/results/anga infrastructure/docker/codehornets-ai/shared/results/fabien
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER=1 docker-compose --profile activated up -d
	@echo ""
	@echo "✓ System started with event-driven activation!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Check worker status: make activation-status"
	@echo "  2. Monitor heartbeats:  make check-heartbeats"
	@echo "  3. Run tests:           make test-activation"
	@echo "  4. Attach to orchestrator: make attach"

stop-activated:
	@echo "Stopping event-driven activation system..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER= ACTIVATION_MODE= docker-compose --profile activated down
	@echo "✓ System stopped"

restart-activated:
	@echo "Restarting event-driven activation system..."
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER=1 docker-compose --profile activated restart
	@echo "✓ System restarted"
	@echo ""
	@echo "Check status with: make activation-status"

test-activation:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Running Activation System Tests"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@if [ ! -f tools/test_activation.sh ]; then \
		echo "❌ Test script not found: tools/test_activation.sh"; \
		exit 1; \
	fi
	@chmod +x tools/test_activation.sh
	@./tools/test_activation.sh

check-heartbeats:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Worker Heartbeat Monitor"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Press Ctrl+C to exit"
	@echo ""
	@while true; do \
		clear; \
		echo "Worker Heartbeats (refreshing every 2s)"; \
		echo ""; \
		if [ -f infrastructure/docker/codehornets-ai/shared/heartbeats/marie.json ]; then \
			echo "Marie:"; \
			cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie.json | jq -r '"  Status: \(.status) | Task: \(.current_task // "idle") | Queue: \(.queue_size) | Last: \(.timestamp)"' 2>/dev/null || echo "  Error reading heartbeat"; \
			echo ""; \
		else \
			echo "Marie: No heartbeat file"; \
			echo ""; \
		fi; \
		if [ -f infrastructure/docker/codehornets-ai/shared/heartbeats/anga.json ]; then \
			echo "Anga:"; \
			cat infrastructure/docker/codehornets-ai/shared/heartbeats/anga.json | jq -r '"  Status: \(.status) | Task: \(.current_task // "idle") | Queue: \(.queue_size) | Last: \(.timestamp)"' 2>/dev/null || echo "  Error reading heartbeat"; \
			echo ""; \
		else \
			echo "Anga: No heartbeat file"; \
			echo ""; \
		fi; \
		if [ -f infrastructure/docker/codehornets-ai/shared/heartbeats/fabien.json ]; then \
			echo "Fabien:"; \
			cat infrastructure/docker/codehornets-ai/shared/heartbeats/fabien.json | jq -r '"  Status: \(.status) | Task: \(.current_task // "idle") | Queue: \(.queue_size) | Last: \(.timestamp)"' 2>/dev/null || echo "  Error reading heartbeat"; \
			echo ""; \
		else \
			echo "Fabien: No heartbeat file"; \
			echo ""; \
		fi; \
		sleep 2; \
	done

activation-status:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Activation System Status"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Container Status:"
	@docker ps --filter "name=marie" --filter "name=anga" --filter "name=fabien" --filter "name=codehornets-redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No containers running"
	@echo ""
	@echo "Worker Heartbeats:"
	@if [ -f infrastructure/docker/codehornets-ai/shared/heartbeats/marie.json ]; then \
		echo "  Marie:  $(cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie.json | jq -r .status 2>/dev/null || echo 'unknown') - $(cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie.json | jq -r .timestamp 2>/dev/null || echo 'no timestamp')"; \
	else \
		echo "  Marie:  No heartbeat"; \
	fi
	@if [ -f infrastructure/docker/codehornets-ai/shared/heartbeats/anga.json ]; then \
		echo "  Anga:   $(cat infrastructure/docker/codehornets-ai/shared/heartbeats/anga.json | jq -r .status 2>/dev/null || echo 'unknown') - $(cat infrastructure/docker/codehornets-ai/shared/heartbeats/anga.json | jq -r .timestamp 2>/dev/null || echo 'no timestamp')"; \
	else \
		echo "  Anga:   No heartbeat"; \
	fi
	@if [ -f infrastructure/docker/codehornets-ai/shared/heartbeats/fabien.json ]; then \
		echo "  Fabien: $(cat infrastructure/docker/codehornets-ai/shared/heartbeats/fabien.json | jq -r .status 2>/dev/null || echo 'unknown') - $(cat infrastructure/docker/codehornets-ai/shared/heartbeats/fabien.json | jq -r .timestamp 2>/dev/null || echo 'no timestamp')"; \
	else \
		echo "  Fabien: No heartbeat"; \
	fi
	@echo ""
	@echo "CPU Usage (should be ~0% when idle):"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" marie anga fabien 2>/dev/null || echo "  No containers running"
	@echo ""
	@echo "Task Queue:"
	@echo "  Marie:  $(find infrastructure/docker/codehornets-ai/shared/tasks/marie -name '*.json' 2>/dev/null | wc -l) tasks"
	@echo "  Anga:   $(find infrastructure/docker/codehornets-ai/shared/tasks/anga -name '*.json' 2>/dev/null | wc -l) tasks"
	@echo "  Fabien: $(find infrastructure/docker/codehornets-ai/shared/tasks/fabien -name '*.json' 2>/dev/null | wc -l) tasks"
	@echo ""
	@echo "Results:"
	@echo "  Marie:  $(find infrastructure/docker/codehornets-ai/shared/results/marie -name '*.json' 2>/dev/null | wc -l) results"
	@echo "  Anga:   $(find infrastructure/docker/codehornets-ai/shared/results/anga -name '*.json' 2>/dev/null | wc -l) results"
	@echo "  Fabien: $(find infrastructure/docker/codehornets-ai/shared/results/fabien -name '*.json' 2>/dev/null | wc -l) results"

switch-to-redis:
	@echo "Switching workers to Redis pub/sub mode..."
	@echo ""
	@echo "⚠️  This will restart all workers"
	@echo ""
	@read -p "Continue? (y/N): " confirm; \
	if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
		echo "Cancelled"; \
		exit 1; \
	fi
	@echo "Stopping workers..."
	@docker stop marie anga fabien 2>/dev/null || true
	@echo "Updating environment to Redis mode..."
	@echo "Starting workers in Redis mode..."
	@cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER=1 ACTIVATION_MODE=redis docker-compose --profile activated up -d marie anga fabien
	@echo ""
	@echo "✓ Workers switched to Redis pub/sub mode"
	@echo ""
	@echo "Verify with: make activation-status"
	@echo "Check logs: docker logs marie"

switch-to-inotify:
	@echo "Switching workers to inotify mode (default)..."
	@echo ""
	@echo "⚠️  This will restart all workers"
	@echo ""
	@read -p "Continue? (y/N): " confirm; \
	if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
		echo "Cancelled"; \
		exit 1; \
	fi
	@echo "Stopping workers..."
	@docker stop marie anga fabien 2>/dev/null || true
	@echo "Updating environment to inotify mode..."
	@echo "Starting workers in inotify mode..."
	@cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER=1 ACTIVATION_MODE=inotify docker-compose --profile activated up -d marie anga fabien
	@echo ""
	@echo "✓ Workers switched to inotify mode"
	@echo ""
	@echo "Verify with: make activation-status"
	@echo "Check logs: docker logs marie"

# =============================================================================
# HOOKS-BASED COMMUNICATION SYSTEM (NEW)
# Filesystem triggers + named pipes for Claude Code hooks integration
# =============================================================================

start-hooks:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Starting Hooks-Based Communication System"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Features:"
	@echo "  • File-based triggers (inotify on Linux)"
	@echo "  • Named pipes for bidirectional IPC"
	@echo "  • Claude Code hooks integration"
	@echo "  • Watcher logs for debugging"
	@echo "  • Redis pub/sub (optional)"
	@echo ""
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/marie
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/anga
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/fabien
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/orchestrator
	@mkdir -p infrastructure/docker/codehornets-ai/shared/pipes
	@mkdir -p infrastructure/docker/codehornets-ai/shared/watcher-logs
	cd infrastructure/docker/codehornets-ai && HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hooks up -d
	@echo ""
	@echo "✓ Hooks system started!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Check status:     make hooks-status"
	@echo "  2. View watchers:    make logs-watcher-marie"
	@echo "  3. Run tests:        make test-hooks"
	@echo "  4. Attach:           make attach"

stop-hooks:
	@echo "Stopping hooks-based communication system..."
	cd infrastructure/docker/codehornets-ai && HOOKS_MODE= docker-compose -f docker-compose.hooks.yml --profile hooks down
	@echo "✓ Hooks system stopped"

restart-hooks:
	@echo "Restarting hooks-based communication system..."
	cd infrastructure/docker/codehornets-ai && HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hooks restart
	@echo "✓ Hooks system restarted"
	@echo ""
	@echo "Check status with: make hooks-status"

start-hybrid:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Starting HYBRID Mode (Wrapper + Hooks)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Combines:"
	@echo "  • activation_wrapper.py (zero-CPU idle)"
	@echo "  • hook_watcher.py (Claude Code hooks)"
	@echo "  • Best of both worlds"
	@echo ""
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/marie
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/anga
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/fabien
	@mkdir -p infrastructure/docker/codehornets-ai/shared/triggers/orchestrator
	@mkdir -p infrastructure/docker/codehornets-ai/shared/pipes
	@mkdir -p infrastructure/docker/codehornets-ai/shared/watcher-logs
	@mkdir -p infrastructure/docker/codehornets-ai/shared/heartbeats
	cd infrastructure/docker/codehornets-ai && ACTIVATION_WRAPPER=1 HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hybrid up -d
	@echo ""
	@echo "✓ Hybrid system started!"
	@echo ""
	@echo "Verify with: make hooks-status && make activation-status"

logs-watcher-marie:
	@echo "Showing Marie's hook watcher logs (Ctrl+C to exit)..."
	@if [ -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log ]; then \
		tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log; \
	else \
		echo "❌ Watcher log not found. Is hooks mode enabled?"; \
	fi

logs-watcher-anga:
	@echo "Showing Anga's hook watcher logs (Ctrl+C to exit)..."
	@if [ -f infrastructure/docker/codehornets-ai/shared/watcher-logs/anga-watcher.log ]; then \
		tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/anga-watcher.log; \
	else \
		echo "❌ Watcher log not found. Is hooks mode enabled?"; \
	fi

logs-watcher-fabien:
	@echo "Showing Fabien's hook watcher logs (Ctrl+C to exit)..."
	@if [ -f infrastructure/docker/codehornets-ai/shared/watcher-logs/fabien-watcher.log ]; then \
		tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/fabien-watcher.log; \
	else \
		echo "❌ Watcher log not found. Is hooks mode enabled?"; \
	fi

test-hooks:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Running Hooks Integration Tests"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@if [ ! -f tools/test_hooks.sh ]; then \
		echo "❌ Test script not found: tools/test_hooks.sh"; \
		exit 1; \
	fi
	@chmod +x tools/test_hooks.sh
	@./tools/test_hooks.sh

hooks-status:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Hooks System Status"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Container Status:"
	@docker ps --filter "name=marie" --filter "name=anga" --filter "name=fabien" --filter "name=orchestrator" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "  No containers running"
	@echo ""
	@echo "Watcher Logs:"
	@echo "  Marie:  $(shell if [ -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log ]; then echo '✓ Active'; else echo '✗ Not found'; fi)"
	@echo "  Anga:   $(shell if [ -f infrastructure/docker/codehornets-ai/shared/watcher-logs/anga-watcher.log ]; then echo '✓ Active'; else echo '✗ Not found'; fi)"
	@echo "  Fabien: $(shell if [ -f infrastructure/docker/codehornets-ai/shared/watcher-logs/fabien-watcher.log ]; then echo '✓ Active'; else echo '✗ Not found'; fi)"
	@echo ""
	@echo "Hook Configurations:"
	@echo "  Marie:  $(shell if [ -f infrastructure/docker/codehornets-ai/hooks-config/marie-hooks.json ]; then echo '✓ Loaded'; else echo '✗ Missing'; fi)"
	@echo "  Anga:   $(shell if [ -f infrastructure/docker/codehornets-ai/hooks-config/anga-hooks.json ]; then echo '✓ Loaded'; else echo '✗ Missing'; fi)"
	@echo "  Fabien: $(shell if [ -f infrastructure/docker/codehornets-ai/hooks-config/fabien-hooks.json ]; then echo '✓ Loaded'; else echo '✗ Missing'; fi)"
	@echo ""
	@make check-triggers
	@echo ""
	@make check-pipes

check-triggers:
	@echo "Trigger Files:"
	@echo "  Marie:  $(shell find infrastructure/docker/codehornets-ai/shared/triggers/marie -name '*.trigger' 2>/dev/null | wc -l) triggers"
	@echo "  Anga:   $(shell find infrastructure/docker/codehornets-ai/shared/triggers/anga -name '*.trigger' 2>/dev/null | wc -l) triggers"
	@echo "  Fabien: $(shell find infrastructure/docker/codehornets-ai/shared/triggers/fabien -name '*.trigger' 2>/dev/null | wc -l) triggers"
	@echo "  Orchestrator: $(shell find infrastructure/docker/codehornets-ai/shared/triggers/orchestrator -name '*.trigger' 2>/dev/null | wc -l) triggers"

clean-triggers:
	@echo "Cleaning trigger files..."
	@find infrastructure/docker/codehornets-ai/shared/triggers/ -name '*.trigger' -delete 2>/dev/null || true
	@echo "✓ Trigger files cleaned"

check-pipes:
	@echo "Named Pipes:"
	@echo "  Marie:"
	@echo "    - control: $(shell if [ -p infrastructure/docker/codehornets-ai/shared/pipes/marie-control ]; then echo '✓'; else echo '✗'; fi)"
	@echo "    - status:  $(shell if [ -p infrastructure/docker/codehornets-ai/shared/pipes/marie-status ]; then echo '✓'; else echo '✗'; fi)"
	@echo "  Anga:"
	@echo "    - control: $(shell if [ -p infrastructure/docker/codehornets-ai/shared/pipes/anga-control ]; then echo '✓'; else echo '✗'; fi)"
	@echo "    - status:  $(shell if [ -p infrastructure/docker/codehornets-ai/shared/pipes/anga-status ]; then echo '✓'; else echo '✗'; fi)"
	@echo "  Fabien:"
	@echo "    - control: $(shell if [ -p infrastructure/docker/codehornets-ai/shared/pipes/fabien-control ]; then echo '✓'; else echo '✗'; fi)"
	@echo "    - status:  $(shell if [ -p infrastructure/docker/codehornets-ai/shared/pipes/fabien-status ]; then echo '✓'; else echo '✗'; fi)"

# =============================================================================
# TESTING COMMANDS
# Automated testing for hooks-based communication
# =============================================================================

test-marie:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Testing Marie (Dance Teacher)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@TASK_ID=test-marie-$$(date +%s); \
	echo "Creating test task: $$TASK_ID"; \
	printf '{"task_id":"%s","description":"Create a brief dance evaluation summary for student Emma Rodriguez (2-3 sentences only)","timeout":60}\n' "$$TASK_ID" > infrastructure/docker/codehornets-ai/shared/tasks/marie/$$TASK_ID.json; \
	echo "✅ Task created: $$TASK_ID"; \
	echo ""; \
	echo "Monitoring (max 60 seconds)..."; \
	timeout 60 bash -c " \
		while [ ! -f infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json ]; do \
			echo -n '.'; \
			sleep 2; \
		done; \
		echo ''; \
	" && echo "✅ Task completed!" || echo "⏱️  Timeout - check logs with: make logs-watcher-marie"; \
	if [ -f infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json ]; then \
		echo ""; \
		echo "Result:"; \
		cat infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json | jq . 2>/dev/null || cat infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json; \
	fi

test-anga:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Testing Anga (DevOps Assistant)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@TASK_ID=test-anga-$$(date +%s); \
	echo "Creating test task: $$TASK_ID"; \
	printf '{"task_id":"%s","description":"List the files in the core/ directory and provide a 1-sentence summary","timeout":60}\n' "$$TASK_ID" > infrastructure/docker/codehornets-ai/shared/tasks/anga/$$TASK_ID.json; \
	echo "✅ Task created: $$TASK_ID"; \
	echo ""; \
	echo "Monitoring (max 60 seconds)..."; \
	timeout 60 bash -c " \
		while [ ! -f infrastructure/docker/codehornets-ai/shared/results/anga/$$TASK_ID.json ]; do \
			echo -n '.'; \
			sleep 2; \
		done; \
		echo ''; \
	" && echo "✅ Task completed!" || echo "⏱️  Timeout - check logs with: make logs-watcher-anga"; \
	if [ -f infrastructure/docker/codehornets-ai/shared/results/anga/$$TASK_ID.json ]; then \
		echo ""; \
		echo "Result:"; \
		cat infrastructure/docker/codehornets-ai/shared/results/anga/$$TASK_ID.json | jq . 2>/dev/null || cat infrastructure/docker/codehornets-ai/shared/results/anga/$$TASK_ID.json; \
	fi

test-fabien:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Testing Fabien (Full-Stack Developer)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@TASK_ID=test-fabien-$$(date +%s); \
	echo "Creating test task: $$TASK_ID"; \
	printf '{"task_id":"%s","description":"Create a short social media post (1-2 sentences) announcing a new dance class","timeout":60}\n' "$$TASK_ID" > infrastructure/docker/codehornets-ai/shared/tasks/fabien/$$TASK_ID.json; \
	echo "✅ Task created: $$TASK_ID"; \
	echo ""; \
	echo "Monitoring (max 60 seconds)..."; \
	timeout 60 bash -c " \
		while [ ! -f infrastructure/docker/codehornets-ai/shared/results/fabien/$$TASK_ID.json ]; do \
			echo -n '.'; \
			sleep 2; \
		done; \
		echo ''; \
	" && echo "✅ Task completed!" || echo "⏱️  Timeout - check logs with: make logs-watcher-fabien"; \
	if [ -f infrastructure/docker/codehornets-ai/shared/results/fabien/$$TASK_ID.json ]; then \
		echo ""; \
		echo "Result:"; \
		cat infrastructure/docker/codehornets-ai/shared/results/fabien/$$TASK_ID.json | jq . 2>/dev/null || cat infrastructure/docker/codehornets-ai/shared/results/fabien/$$TASK_ID.json; \
	fi

test-all-workers:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Testing All Workers Simultaneously"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Creating tasks for all workers..."
	@make test-marie &
	@make test-anga &
	@make test-fabien &
	@wait
	@echo ""
	@echo "✅ All workers tested!"

test-quick:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Quick Automated Test"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@TASK_ID=quick-test-$$(date +%s); \
	printf '{"task_id":"%s","description":"Respond with Hello! I received your test task successfully. and nothing else.","timeout":30}\n' "$$TASK_ID" > infrastructure/docker/codehornets-ai/shared/tasks/marie/$$TASK_ID.json; \
	echo "📝 Task created: $$TASK_ID"; \
	echo "⏳ Waiting for processing (max 60s)..."; \
	timeout 60 bash -c " \
		while [ ! -f infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json ]; do \
			echo -n '.'; \
			sleep 2; \
		done; \
		echo ''; \
	"; \
	if [ -f infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json ]; then \
		echo "✅ SUCCESS! System is working."; \
		echo ""; \
		echo "Result:"; \
		cat infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json | jq . 2>/dev/null || cat infrastructure/docker/codehornets-ai/shared/results/marie/$$TASK_ID.json; \
	else \
		echo "❌ FAILED! Task did not complete in 60s"; \
		echo "Troubleshooting:"; \
		echo "  1. Check watcher logs: make logs-watcher-marie"; \
		echo "  2. Check container logs: docker logs marie"; \
		echo "  3. Check system status: make hooks-status"; \
		exit 1; \
	fi

test-load:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Load Test - 10 Concurrent Tasks"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Creating 10 tasks for Marie..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		TASK_ID=load-test-$$i-$$(date +%s); \
		printf '{"task_id":"%s","description":"Quick response: Task %d received","timeout":60}\n' "$$TASK_ID" $$i > infrastructure/docker/codehornets-ai/shared/tasks/marie/$$TASK_ID.json; \
		echo "  Created task $$i: $$TASK_ID"; \
		sleep 1; \
	done
	@echo ""
	@echo "✅ All tasks created!"
	@echo ""
	@echo "Monitoring completion (max 120s)..."
	@START_COUNT=$$(ls -1 infrastructure/docker/codehornets-ai/shared/results/marie/ 2>/dev/null | wc -l); \
	timeout 120 bash -c " \
		while true; do \
			CURRENT_COUNT=\$$(ls -1 infrastructure/docker/codehornets-ai/shared/results/marie/ 2>/dev/null | wc -l); \
			COMPLETED=\$$((CURRENT_COUNT - $$START_COUNT)); \
			echo -ne '\rCompleted: \$$COMPLETED/10'; \
			if [ \$$COMPLETED -ge 10 ]; then \
				echo ''; \
				break; \
			fi; \
			sleep 2; \
		done; \
	" && echo "✅ Load test complete!" || echo "⏱️  Some tasks still processing..."

watch-results:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "   Watching for New Results (Ctrl+C to exit)"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Monitoring: infrastructure/docker/codehornets-ai/shared/results/"
	@echo ""
	@watch -n 2 'echo "Marie: $$(ls -1 infrastructure/docker/codehornets-ai/shared/results/marie/ 2>/dev/null | wc -l) results"; echo "Anga: $$(ls -1 infrastructure/docker/codehornets-ai/shared/results/anga/ 2>/dev/null | wc -l) results"; echo "Fabien: $$(ls -1 infrastructure/docker/codehornets-ai/shared/results/fabien/ 2>/dev/null | wc -l) results"; echo ""; echo "Latest:"; ls -lt infrastructure/docker/codehornets-ai/shared/results/*/*.json 2>/dev/null | head -5'

clean-test-data:
	@echo "Cleaning test data..."
	@echo ""
	@echo "Tasks to delete:"
	@find infrastructure/docker/codehornets-ai/shared/tasks/ -name 'test-*.json' -o -name 'quick-*.json' -o -name 'load-*.json' 2>/dev/null | wc -l | xargs -I {} echo "  {} test task files"
	@echo "Results to delete:"
	@find infrastructure/docker/codehornets-ai/shared/results/ -name 'test-*.json' -o -name 'quick-*.json' -o -name 'load-*.json' 2>/dev/null | wc -l | xargs -I {} echo "  {} test result files"
	@echo ""
	@read -p "Delete all test data? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		find infrastructure/docker/codehornets-ai/shared/tasks/ -name 'test-*.json' -delete 2>/dev/null || true; \
		find infrastructure/docker/codehornets-ai/shared/tasks/ -name 'quick-*.json' -delete 2>/dev/null || true; \
		find infrastructure/docker/codehornets-ai/shared/tasks/ -name 'load-*.json' -delete 2>/dev/null || true; \
		find infrastructure/docker/codehornets-ai/shared/results/ -name 'test-*.json' -delete 2>/dev/null || true; \
		find infrastructure/docker/codehornets-ai/shared/results/ -name 'quick-*.json' -delete 2>/dev/null || true; \
		find infrastructure/docker/codehornets-ai/shared/results/ -name 'load-*.json' -delete 2>/dev/null || true; \
		echo "✓ Test data cleaned"; \
	else \
		echo "Cancelled"; \
	fi
