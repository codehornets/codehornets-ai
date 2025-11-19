# Multi-Agent Orchestration System - Makefile
# Convenient commands for managing orchestrator and workers

.PHONY: help all pull setup-auth-dirs fix-permissions auth-orchestrator auth-marie auth-anga auth-fabien auth-all start stop restart restart-orchestrator restart-workers logs status attach clean rebuild clean-workspace clean-workspace-test start-activated stop-activated restart-activated test-activation check-heartbeats activation-status switch-to-redis switch-to-inotify

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
	@if [ -d "core/shared/auth-homes" ]; then \
		echo "Changing ownership of core/shared/auth-homes to $(USER):$(USER)..."; \
		sudo chown -R $(USER):$(USER) core/shared/auth-homes; \
		echo "✓ Permissions fixed"; \
	else \
		echo "✓ No auth directories found (will be created automatically)"; \
	fi

# Setup auth directories with correct permissions
setup-auth-dirs:
	@mkdir -p core/shared/auth-homes/orchestrator
	@mkdir -p core/shared/auth-homes/marie
	@mkdir -p core/shared/auth-homes/anga
	@mkdir -p core/shared/auth-homes/fabien
	@echo "✓ Auth directories created"

# Authentication commands
auth-orchestrator: setup-auth-dirs
	@echo "Authenticating orchestrator..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/core/shared/auth-homes/orchestrator:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-marie: setup-auth-dirs
	@echo "Authenticating Marie..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/core/shared/auth-homes/marie:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-anga: setup-auth-dirs
	@echo "Authenticating Anga..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/core/shared/auth-homes/anga:/home/agent/.claude" \
		docker/sandbox-templates:claude-code \
		claude

auth-fabien: setup-auth-dirs
	@echo "Authenticating Fabien..."
	@echo "A browser will open. Log in to Claude and complete authentication."
	docker run -it --rm \
		-v "$$(pwd)/core/shared/auth-homes/fabien:/home/agent/.claude" \
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
	cd core && docker-compose up -d
	@echo ""
	@echo "✓ System started!"
	@echo ""
	@echo "To attach to orchestrator: make attach"
	@echo "To view logs: make logs"
	@echo "To check status: make status"

stop:
	@echo "Stopping multi-agent system..."
	cd core && docker-compose down
	@echo "✓ System stopped"

restart:
	@echo "Restarting multi-agent system..."
	cd core && docker-compose restart
	@echo "✓ System restarted"

restart-orchestrator:
	@echo "Restarting orchestrator with fresh prompt..."
	cd core && docker-compose stop orchestrator
	cd core && docker-compose rm -f orchestrator
	cd core && docker-compose up -d orchestrator
	@echo ""
	@echo "✓ Orchestrator restarted with fresh prompt"
	@echo ""
	@echo "Connect with: make attach"

restart-workers:
	@echo "Restarting all workers with fresh prompts..."
	cd core && docker-compose stop marie anga fabien
	cd core && docker-compose rm -f marie anga fabien
	cd core && docker-compose up -d marie anga fabien
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
	cd core && docker-compose down 2>/dev/null || true
	@echo "Starting fresh containers..."
	cd core && docker-compose up -d --force-recreate
	@echo ""
	@echo "✓ System rebuilt and restarted"
	@echo ""
	@echo "Connect with: make attach"

clean-containers:
	@echo "Force cleaning all containers..."
	@docker stop orchestrator marie anga fabien 2>/dev/null || true
	@docker rm orchestrator marie anga fabien 2>/dev/null || true
	cd core && docker-compose down 2>/dev/null || true
	@echo "✓ All containers cleaned"

# Monitoring
status:
	@echo "Container status:"
	@cd core && docker-compose ps

logs:
	@echo "Showing logs from all containers (Ctrl+C to exit)..."
	cd core && docker-compose logs -f

logs-orchestrator:
	@echo "Showing orchestrator logs (Ctrl+C to exit)..."
	cd core && docker-compose logs -f orchestrator

logs-marie:
	@echo "Showing Marie logs (Ctrl+C to exit)..."
	cd core && docker-compose logs -f marie

logs-anga:
	@echo "Showing Anga logs (Ctrl+C to exit)..."
	cd core && docker-compose logs -f anga

logs-fabien:
	@echo "Showing Fabien logs (Ctrl+C to exit)..."
	cd core && docker-compose logs -f fabien

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
	cd core && docker-compose down -v
	@echo "✓ Cleanup complete"

clean-tasks:
	@echo "Clearing all task files..."
	@find core/shared/tasks/ -type f -name "*.json" -delete 2>/dev/null || true
	@echo "✓ Task files cleared"

clean-results:
	@echo "Clearing all result files..."
	@find core/shared/results/ -type f -delete 2>/dev/null || true
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
	@test -f core/shared/auth-homes/orchestrator/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-orchestrator)"
	@echo "Marie:"
	@test -f core/shared/auth-homes/marie/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-marie)"
	@echo "Anga:"
	@test -f core/shared/auth-homes/anga/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-anga)"
	@echo "Fabien:"
	@test -f core/shared/auth-homes/fabien/.credentials.json && echo "  ✓ Authenticated" || echo "  ✗ Not authenticated (run: make auth-fabien)"

# Development helpers
check-tasks:
	@echo "Current tasks in queue:"
	@echo ""
	@echo "Marie:"
	@ls -1 core/shared/tasks/marie/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} tasks"
	@echo "Anga:"
	@ls -1 core/shared/tasks/anga/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} tasks"
	@echo "Fabien:"
	@ls -1 core/shared/tasks/fabien/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} tasks"

check-results:
	@echo "Results available:"
	@echo ""
	@echo "Marie:"
	@ls -1 core/shared/results/marie/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} results"
	@echo "Anga:"
	@ls -1 core/shared/results/anga/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} results"
	@echo "Fabien:"
	@ls -1 core/shared/results/fabien/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} results"

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
	@mkdir -p core/shared/heartbeats
	@mkdir -p core/shared/tasks/marie core/shared/tasks/anga core/shared/tasks/fabien
	@mkdir -p core/shared/results/marie core/shared/results/anga core/shared/results/fabien
	cd core && docker-compose -f docker-compose-activated.yml up -d
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
	cd core && docker-compose -f docker-compose-activated.yml down
	@echo "✓ System stopped"

restart-activated:
	@echo "Restarting event-driven activation system..."
	cd core && docker-compose -f docker-compose-activated.yml restart
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
		if [ -f core/shared/heartbeats/marie.json ]; then \
			echo "Marie:"; \
			cat core/shared/heartbeats/marie.json | jq -r '"  Status: \(.status) | Task: \(.current_task // "idle") | Queue: \(.queue_size) | Last: \(.timestamp)"' 2>/dev/null || echo "  Error reading heartbeat"; \
			echo ""; \
		else \
			echo "Marie: No heartbeat file"; \
			echo ""; \
		fi; \
		if [ -f core/shared/heartbeats/anga.json ]; then \
			echo "Anga:"; \
			cat core/shared/heartbeats/anga.json | jq -r '"  Status: \(.status) | Task: \(.current_task // "idle") | Queue: \(.queue_size) | Last: \(.timestamp)"' 2>/dev/null || echo "  Error reading heartbeat"; \
			echo ""; \
		else \
			echo "Anga: No heartbeat file"; \
			echo ""; \
		fi; \
		if [ -f core/shared/heartbeats/fabien.json ]; then \
			echo "Fabien:"; \
			cat core/shared/heartbeats/fabien.json | jq -r '"  Status: \(.status) | Task: \(.current_task // "idle") | Queue: \(.queue_size) | Last: \(.timestamp)"' 2>/dev/null || echo "  Error reading heartbeat"; \
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
	@if [ -f core/shared/heartbeats/marie.json ]; then \
		echo "  Marie:  $(cat core/shared/heartbeats/marie.json | jq -r .status 2>/dev/null || echo 'unknown') - $(cat core/shared/heartbeats/marie.json | jq -r .timestamp 2>/dev/null || echo 'no timestamp')"; \
	else \
		echo "  Marie:  No heartbeat"; \
	fi
	@if [ -f core/shared/heartbeats/anga.json ]; then \
		echo "  Anga:   $(cat core/shared/heartbeats/anga.json | jq -r .status 2>/dev/null || echo 'unknown') - $(cat core/shared/heartbeats/anga.json | jq -r .timestamp 2>/dev/null || echo 'no timestamp')"; \
	else \
		echo "  Anga:   No heartbeat"; \
	fi
	@if [ -f core/shared/heartbeats/fabien.json ]; then \
		echo "  Fabien: $(cat core/shared/heartbeats/fabien.json | jq -r .status 2>/dev/null || echo 'unknown') - $(cat core/shared/heartbeats/fabien.json | jq -r .timestamp 2>/dev/null || echo 'no timestamp')"; \
	else \
		echo "  Fabien: No heartbeat"; \
	fi
	@echo ""
	@echo "CPU Usage (should be ~0% when idle):"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" marie anga fabien 2>/dev/null || echo "  No containers running"
	@echo ""
	@echo "Task Queue:"
	@echo "  Marie:  $(find core/shared/tasks/marie -name '*.json' 2>/dev/null | wc -l) tasks"
	@echo "  Anga:   $(find core/shared/tasks/anga -name '*.json' 2>/dev/null | wc -l) tasks"
	@echo "  Fabien: $(find core/shared/tasks/fabien -name '*.json' 2>/dev/null | wc -l) tasks"
	@echo ""
	@echo "Results:"
	@echo "  Marie:  $(find core/shared/results/marie -name '*.json' 2>/dev/null | wc -l) results"
	@echo "  Anga:   $(find core/shared/results/anga -name '*.json' 2>/dev/null | wc -l) results"
	@echo "  Fabien: $(find core/shared/results/fabien -name '*.json' 2>/dev/null | wc -l) results"

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
	@# The docker-compose file will need to be edited or use env var override
	@echo "Starting workers in Redis mode..."
	@cd core && ACTIVATION_MODE=redis docker-compose -f docker-compose-activated.yml up -d marie anga fabien
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
	@cd core && ACTIVATION_MODE=inotify docker-compose -f docker-compose-activated.yml up -d marie anga fabien
	@echo ""
	@echo "✓ Workers switched to inotify mode"
	@echo ""
	@echo "Verify with: make activation-status"
	@echo "Check logs: docker logs marie"
