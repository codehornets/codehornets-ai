.PHONY: help up down restart logs status clean test task heartbeat setup config

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Configuration
COMPOSE_FILE := docker-compose.yml
PROJECT_NAME := codehornets-ai

help: ## Show this help message
	@echo "$(CYAN)CodeHornets AI - Multi-Agent Orchestration System$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  1. make up                  - Start all agents"
	@echo "  2. make setup-interactive   - Complete interactive setup (one-time)"
	@echo "  3. make complete-theme      - Complete theme selection (after restart)"
	@echo "  4. make status              - Check agent status"
	@echo "  5. make task-anga           - Create a task"
	@echo "  6. make wake-anga           - Wake worker to process tasks"

##
## System Management
##

up: ## Start all agents (orchestrator + workers)
	@echo "$(GREEN)Starting CodeHornets AI agents...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✓ All agents started$(NC)"
	@echo "$(CYAN)Waiting for agents to initialize...$(NC)"
	@sleep 6
	@$(MAKE) --no-print-directory status

down: ## Stop all agents
	@echo "$(YELLOW)Stopping all agents...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✓ All agents stopped$(NC)"

restart: ## Restart all agents
	@echo "$(YELLOW)Restarting all agents...$(NC)"
	@$(MAKE) --no-print-directory down
	@sleep 2
	@$(MAKE) --no-print-directory up
	@echo ""
	@echo "$(YELLOW)⚠ After restart, agents need theme selection:$(NC) make complete-theme"

start-orchestrator: ## Start only the orchestrator
	@echo "$(GREEN)Starting orchestrator...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d orchestrator
	@echo "$(GREEN)✓ Orchestrator started$(NC)"

start-marie: ## Start Marie (frontend worker)
	@echo "$(GREEN)Starting Marie...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d marie
	@echo "$(GREEN)✓ Marie started$(NC)"

start-anga: ## Start Anga (backend worker)
	@echo "$(GREEN)Starting Anga...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d anga
	@echo "$(GREEN)✓ Anga started$(NC)"

start-fabien: ## Start Fabien (DevOps worker)
	@echo "$(GREEN)Starting Fabien...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d fabien
	@echo "$(GREEN)✓ Fabien started$(NC)"

start-monitor: ## Start monitor daemon
	@echo "$(GREEN)Starting monitor daemon...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d monitor
	@echo "$(GREEN)✓ Monitor started$(NC)"

stop-monitor: ## Stop monitor daemon
	@echo "$(YELLOW)Stopping monitor daemon...$(NC)"
	docker-compose -f $(COMPOSE_FILE) stop monitor
	@echo "$(GREEN)✓ Monitor stopped$(NC)"

start-automation: ## Start automation helper container
	@echo "$(GREEN)Starting automation helper...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d automation
	@echo "$(GREEN)✓ Automation helper started$(NC)"
	@echo "  Now you can use: make wake-<worker>"

stop-automation: ## Stop automation helper container
	@echo "$(YELLOW)Stopping automation helper...$(NC)"
	docker-compose -f $(COMPOSE_FILE) stop automation
	@echo "$(GREEN)✓ Automation helper stopped$(NC)"

check-notifications: ## Check for pending worker notifications
	@./tools/helpers/monitoring/show_notifications.sh

wake-orchestrator: ## Wake orchestrator (send activation prompt)
	@./tools/wake_worker.sh orchestrator

wake-marie: ## Wake Marie worker (send activation prompt)
	@./tools/wake_worker.sh marie

wake-anga: ## Wake Anga worker (send activation prompt)
	@./tools/wake_worker.sh anga

wake-fabien: ## Wake Fabien worker (send activation prompt)
	@./tools/wake_worker.sh fabien

wake-all: ## Wake all agents (orchestrator + workers)
	@echo "$(CYAN)Waking all agents...$(NC)"
	@echo ""
	@./tools/wake_worker.sh orchestrator
	@echo ""
	@./tools/wake_worker.sh marie
	@echo ""
	@./tools/wake_worker.sh anga
	@echo ""
	@./tools/wake_worker.sh fabien
	@echo ""
	@echo "$(GREEN)✓ All agents activated$(NC)"

wake-workers: ## Wake all workers only (marie, anga, fabien)
	@echo "$(CYAN)Waking all workers...$(NC)"
	@echo ""
	@./tools/wake_worker.sh marie
	@echo ""
	@./tools/wake_worker.sh anga
	@echo ""
	@./tools/wake_worker.sh fabien
	@echo ""
	@echo "$(GREEN)✓ All workers activated$(NC)"

##
## Logging & Monitoring
##

logs: ## Show logs from all agents
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-orchestrator: ## Show orchestrator logs
	docker-compose -f $(COMPOSE_FILE) logs -f orchestrator

logs-marie: ## Show Marie logs
	docker-compose -f $(COMPOSE_FILE) logs -f marie

logs-anga: ## Show Anga logs
	docker-compose -f $(COMPOSE_FILE) logs -f anga

logs-fabien: ## Show Fabien logs
	docker-compose -f $(COMPOSE_FILE) logs -f fabien

logs-monitor: ## Show monitor daemon logs
	docker-compose -f $(COMPOSE_FILE) logs -f monitor

activity: ## Show clean system activity from monitor log file
	@echo "$(CYAN)📊 System Activity (from monitor)$(NC)"
	@echo "════════════════════════════════════════════════════════════"
	@tail -50 shared/watcher-logs/monitor-daemon.log 2>/dev/null || echo "No monitor logs yet. Run 'make start-monitor' first."
	@echo "════════════════════════════════════════════════════════════"

activity-live: ## Follow system activity in real-time (clean output)
	@echo "$(CYAN)📊 Live System Activity$(NC)"
	@echo "Press Ctrl+C to exit"
	@echo "════════════════════════════════════════════════════════════"
	@tail -f shared/watcher-logs/monitor-daemon.log 2>/dev/null || echo "No monitor logs yet. Run 'make start-monitor' first."

status: ## Show status of all agents
	@echo "$(CYAN)CodeHornets AI System Status$(NC)"
	@echo ""
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@$(MAKE) --no-print-directory heartbeat

heartbeat: ## Show heartbeat status of all agents
	@echo "$(CYAN)Agent Heartbeats:$(NC)"
	@for agent in orchestrator marie anga fabien; do \
		if [ -f "./shared/heartbeats/$$agent.json" ]; then \
			echo ""; \
			echo "$(GREEN)$$agent:$(NC)"; \
			cat ./shared/heartbeats/$$agent.json | python3 -m json.tool 2>/dev/null || cat ./shared/heartbeats/$$agent.json; \
		else \
			echo ""; \
			container_name="codehornets-$$agent"; \
			if [ "$$agent" != "orchestrator" ]; then \
				container_name="codehornets-worker-$$agent"; \
			fi; \
			if docker ps --format '{{.Names}}' | grep -q "$$container_name"; then \
				echo "$(YELLOW)$$agent: Initializing...$(NC)"; \
			else \
				echo "$(RED)$$agent: Not running$(NC)"; \
			fi; \
		fi; \
	done

watch-logs: ## Watch watcher logs
	@echo "$(CYAN)Watching file system logs...$(NC)"
	tail -f shared/watcher-logs/*.log 2>/dev/null || echo "$(YELLOW)No log files yet$(NC)"

##
## Task Management
##

task-marie: ## Create a task for Marie (usage: make task-marie TITLE="Task title" DESC="Description")
	@if [ -z "$(TITLE)" ]; then \
		echo "$(RED)Error: TITLE is required$(NC)"; \
		echo "Usage: make task-marie TITLE=\"Update UI\" DESC=\"Fix dashboard layout\""; \
		exit 1; \
	fi
	@docker exec codehornets-orchestrator python3 /tools/create_worker_task.py marie "$(TITLE)" "$(DESC)"
	@echo "$(GREEN)✓ Task created for Marie$(NC)"

task-anga: ## Create a task for Anga (usage: make task-anga TITLE="Task title" DESC="Description")
	@if [ -z "$(TITLE)" ]; then \
		echo "$(RED)Error: TITLE is required$(NC)"; \
		echo "Usage: make task-anga TITLE=\"Fix API\" DESC=\"Update authentication\""; \
		exit 1; \
	fi
	@docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga "$(TITLE)" "$(DESC)"
	@echo "$(GREEN)✓ Task created for Anga$(NC)"

task-fabien: ## Create a task for Fabien (usage: make task-fabien TITLE="Task title" DESC="Description")
	@if [ -z "$(TITLE)" ]; then \
		echo "$(RED)Error: TITLE is required$(NC)"; \
		echo "Usage: make task-fabien TITLE=\"Deploy\" DESC=\"Setup CI/CD pipeline\""; \
		exit 1; \
	fi
	@docker exec codehornets-orchestrator python3 /tools/create_worker_task.py fabien "$(TITLE)" "$(DESC)"
	@echo "$(GREEN)✓ Task created for Fabien$(NC)"

list-tasks: ## List all pending tasks
	@echo "$(CYAN)Pending Tasks:$(NC)"
	@for worker in marie anga fabien; do \
		echo ""; \
		echo "$(GREEN)$$worker:$(NC)"; \
		if [ -d "./shared/tasks/$$worker" ]; then \
			find ./shared/tasks/$$worker -name "*.json" -type f 2>/dev/null | while read task; do \
				echo "  - $$(basename $$task)"; \
			done | head -10; \
		else \
			echo "  $(YELLOW)No tasks$(NC)"; \
		fi; \
	done

list-results: ## List all completed results
	@echo "$(CYAN)Completed Results:$(NC)"
	@for worker in marie anga fabien; do \
		echo ""; \
		echo "$(GREEN)$$worker:$(NC)"; \
		if [ -d "./shared/results/$$worker" ]; then \
			find ./shared/results/$$worker -name "*.json" -type f 2>/dev/null | while read result; do \
				echo "  - $$(basename $$result)"; \
			done | head -10; \
		else \
			echo "  $(YELLOW)No results$(NC)"; \
		fi; \
	done

##
## Setup & Configuration
##

setup: ## Initial setup - create directories and copy configs
	@echo "$(GREEN)Setting up CodeHornets AI...$(NC)"
	@# Copy orchestrator prompt to .claude directory
	@mkdir -p ./shared/auth-homes/orchestrator
	@cp prompts/orchestrator.md ./shared/auth-homes/orchestrator/CLAUDE.md
	@echo "$(GREEN)✓ Copied orchestrator prompt$(NC)"
	@# Copy hooks configuration
	@cp hooks-config/orchestrator-hooks.json ./shared/auth-homes/orchestrator/hooks.json
	@echo "$(GREEN)✓ Copied hooks configuration$(NC)"
	@# Fix permissions on shared directory (Docker-created dirs are owned by root)
	@docker run --rm -v "$(PWD)/shared:/shared" alpine:latest chown -R $(shell id -u):$(shell id -g) /shared
	@# Create .gitkeep files in empty directories
	@find shared -type d -empty -exec touch {}/.gitkeep \;
	@echo "$(GREEN)✓ Setup complete$(NC)"

setup-auth-dirs: ## Create auth directories with correct permissions
	@mkdir -p ./shared/auth-homes/orchestrator
	@mkdir -p ./shared/auth-homes/marie
	@mkdir -p ./shared/auth-homes/anga
	@mkdir -p ./shared/auth-homes/fabien
	@echo "$(GREEN)✓ Auth directories created$(NC)"

##
## Interactive Setup (First-Time Authentication)
##

setup-interactive: ## Interactive setup for all agents (one-time)
	@echo "$(CYAN)═══════════════════════════════════════════$(NC)"
	@echo "$(CYAN)   Interactive Agent Setup$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════════$(NC)"
	@echo ""
	@echo "This will guide you through setting up each agent interactively."
	@echo "You'll attach to each running container to complete authentication."
	@echo ""
	@echo "$(YELLOW)Make sure agents are running first:$(NC) make up"
	@echo ""
	@./setup-workers-interactive.sh

attach-orchestrator: ## Attach to orchestrator for interactive setup
	@echo "$(CYAN)Attaching to orchestrator...$(NC)"
	@echo "$(YELLOW)Press Ctrl+P then Ctrl+Q to detach without stopping$(NC)"
	@echo ""
	docker attach codehornets-orchestrator

attach-marie: ## Attach to Marie for interactive setup
	@echo "$(CYAN)Attaching to Marie...$(NC)"
	@echo "$(YELLOW)Press Ctrl+P then Ctrl+Q to detach without stopping$(NC)"
	@echo ""
	docker attach codehornets-worker-marie

attach-anga: ## Attach to Anga for interactive setup
	@echo "$(CYAN)Attaching to Anga...$(NC)"
	@echo "$(YELLOW)Press Ctrl+P then Ctrl+Q to detach without stopping$(NC)"
	@echo ""
	docker attach codehornets-worker-anga

attach-fabien: ## Attach to Fabien for interactive setup
	@echo "$(CYAN)Attaching to Fabien...$(NC)"
	@echo "$(YELLOW)Press Ctrl+P then Ctrl+Q to detach without stopping$(NC)"
	@echo ""
	docker attach codehornets-worker-fabien

check-setup: ## Check if agents are set up and authenticated
	@echo "$(CYAN)Agent Setup Status:$(NC)"
	@echo ""
	@echo "Orchestrator:"
	@test -f shared/auth-homes/orchestrator/.credentials.json && echo "  $(GREEN)✓ Set up$(NC)" || echo "  $(YELLOW)⚠ Not set up (run: make attach-orchestrator)$(NC)"
	@echo "Marie:"
	@test -f shared/auth-homes/marie/.credentials.json && echo "  $(GREEN)✓ Set up$(NC)" || echo "  $(YELLOW)⚠ Not set up (run: make attach-marie)$(NC)"
	@echo "Anga:"
	@test -f shared/auth-homes/anga/.credentials.json && echo "  $(GREEN)✓ Set up$(NC)" || echo "  $(YELLOW)⚠ Not set up (run: make attach-anga)$(NC)"
	@echo "Fabien:"
	@test -f shared/auth-homes/fabien/.credentials.json && echo "  $(GREEN)✓ Set up$(NC)" || echo "  $(YELLOW)⚠ Not set up (run: make attach-fabien)$(NC)"

complete-theme: ## Complete theme selection for all agents (after restart)
	@echo "$(CYAN)═══════════════════════════════════════════$(NC)"
	@echo "$(CYAN)   Complete Theme Selection$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════════$(NC)"
	@echo ""
	@echo "After restarting containers, agents need theme selection."
	@echo "This command will guide you through the process."
	@echo ""
	@./tools/helpers/setup/auto-theme-select.sh

config: ## Show current configuration
	@echo "$(CYAN)Configuration:$(NC)"
	@echo ""
	@echo "$(GREEN)Compose File:$(NC) $(COMPOSE_FILE)"
	@echo "$(GREEN)Project Name:$(NC) $(PROJECT_NAME)"
	@echo "$(GREEN)Auth Method:$(NC) Claude Code web session"
	@echo ""
	@echo "$(CYAN)Directories:$(NC)"
	@echo "  Tasks:     $(shell ls -d shared/tasks/* 2>/dev/null | wc -l) workers"
	@echo "  Results:   $(shell ls -d shared/results/* 2>/dev/null | wc -l) workers"
	@echo "  Triggers:  $(shell ls -d shared/triggers/* 2>/dev/null | wc -l) workers"
	@echo "  Workspaces: $(shell ls -d shared/workspaces/* 2>/dev/null | wc -l) workers"

##
## Maintenance
##

clean: ## Clean up runtime files (logs, heartbeats, tasks, results, triggers)
	@echo "$(YELLOW)Cleaning up runtime files...$(NC)"
	@# Core runtime files
	@rm -f shared/heartbeats/*.json
	@rm -f shared/watcher-logs/*.log
	@find shared/tasks -name "*.json" -type f -delete 2>/dev/null || true
	@find shared/results -name "*.json" -type f -delete 2>/dev/null || true
	@find shared/triggers -name "*.txt" -type f -delete 2>/dev/null || true
	@find shared/triggers -name "*.trigger" -type f -delete 2>/dev/null || true
	@# Workspace temporary files
	@find shared/workspaces -name "*.py" -type f -delete 2>/dev/null || true
	@find shared/workspaces -name "*.js" -type f -delete 2>/dev/null || true
	@find shared/workspaces -name "*.txt" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Runtime files cleaned$(NC)"

clean-deep: clean ## Deep clean - includes debug files, caches, shell snapshots, session data
	@echo "$(YELLOW)Deep cleaning temporary files...$(NC)"
	@# Debug files
	@find shared/auth-homes/*/debug -name "*.txt" -type f -delete 2>/dev/null || true
	@# Shell snapshots
	@find shared/auth-homes/*/shell-snapshots -name "*.sh" -type f -delete 2>/dev/null || true
	@# File history
	@find shared/auth-homes/*/file-history -type f -delete 2>/dev/null || true
	@# Statsig cache files
	@find shared/auth-homes/*/statsig -name "statsig.cached.*" -type f -delete 2>/dev/null || true
	@find shared/auth-homes/*/statsig -name "statsig.failed_logs.*" -type f -delete 2>/dev/null || true
	@# Todo files
	@find shared/auth-homes/*/todos -name "*.json" -type f -delete 2>/dev/null || true
	@# Project session files
	@find shared/auth-homes/*/projects -name "*.jsonl" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Deep clean complete$(NC)"
	@echo "$(CYAN)Kept: .credentials.json, CLAUDE.md, hooks.json, history.jsonl, archives$(NC)"

clean-all: clean-deep down ## Clean everything including containers
	@echo "$(YELLOW)Removing all containers and volumes...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down -v
	@echo "$(GREEN)✓ All cleaned$(NC)"

reset: clean-all setup up ## Full reset - clean, setup, and start fresh
	@echo "$(GREEN)✓ System reset complete$(NC)"

##
## Development & Testing
##

shell-orchestrator: ## Open shell in orchestrator container
	@docker exec -it codehornets-orchestrator /bin/bash

shell-marie: ## Open shell in Marie container
	@docker exec -it codehornets-worker-marie /bin/bash

shell-anga: ## Open shell in Anga container
	@docker exec -it codehornets-worker-anga /bin/bash

shell-fabien: ## Open shell in Fabien container
	@docker exec -it codehornets-worker-fabien /bin/bash

test-hook: ## Test the Stop hook (creates task for Anga)
	@echo "$(CYAN)Testing Stop hook...$(NC)"
	@docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga
	@echo "$(GREEN)✓ Hook executed$(NC)"
	@echo ""
	@echo "$(CYAN)Check trigger and task files:$(NC)"
	@ls -lh shared/triggers/anga/ 2>/dev/null || echo "No triggers"
	@ls -lh shared/tasks/anga/ 2>/dev/null || echo "No tasks"

test: test-hook ## Run basic system tests
	@echo "$(CYAN)Running system tests...$(NC)"
	@echo ""
	@echo "$(GREEN)1. Checking containers...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(GREEN)2. Checking heartbeats...$(NC)"
	@$(MAKE) --no-print-directory heartbeat
	@echo ""
	@echo "$(GREEN)3. Checking file structure...$(NC)"
	@ls -la shared/
	@echo ""
	@echo "$(GREEN)✓ Tests complete$(NC)"

##
## Documentation
##

docs: ## Show documentation links
	@echo "$(CYAN)Documentation:$(NC)"
	@echo "  README:          ./README.md"
	@echo "  Setup Guide:     ./CLAUDE.md"
	@echo "  Orchestrator:    ./prompts/orchestrator.md"
	@echo "  Hooks Config:    ./hooks-config/orchestrator-hooks.json"

tree: ## Show directory tree
	@echo "$(CYAN)Directory Structure:$(NC)"
	@find . -type d -not -path '*/\.*' -not -path './shared/workspaces/*' | sort | sed 's|^\./||' | sed 's|[^/]*/|  |g'

info: config docs ## Show system information

restart-workers: ## Restart workers to apply new configuration
	@echo "$(YELLOW)Restarting workers with new configuration...$(NC)"
	docker-compose restart marie anga fabien
	@echo "$(GREEN)✓ Workers restarted$(NC)"

archive-tasks: ## Archive all completed tasks
	@echo "$(CYAN)Archiving completed tasks...$(NC)"
	@python3 tools/archive_task.py --auto
	@echo "$(GREEN)✓ Tasks archived$(NC)"

archive-worker: ## Archive tasks for specific worker (use: make archive-worker WORKER=anga)
	@echo "$(CYAN)Archiving tasks for $(WORKER)...$(NC)"
	@python3 tools/archive_task.py $(WORKER) --auto
	@echo "$(GREEN)✓ Tasks archived for $(WORKER)$(NC)"

list-archive: ## List archived tasks
	@echo "$(CYAN)Archived Tasks:$(NC)"
	@find shared/archive -name "*.json" -type f | sort

view-archive: ## View archive statistics
	@echo "$(CYAN)Archive Statistics:$(NC)"
	@echo ""
	@for worker in marie anga fabien; do \
		success=$$(ls shared/archive/$$worker/success/*.json 2>/dev/null | wc -l); \
		failed=$$(ls shared/archive/$$worker/failed/*.json 2>/dev/null | wc -l); \
		total=$$((success + failed)); \
		echo "  $(GREEN)$$worker:$(NC) $$total total ($$success success, $$failed failed)"; \
	done


##
## Task Creation Helpers
##

create-test-task: ## Create a test task for Anga
	@echo "$(CYAN)Creating test task for Anga...$(NC)"
	@docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga
	@echo "$(GREEN)✓ Test task created$(NC)"
	@echo "$(YELLOW)Run 'make wake-anga' to activate the worker$(NC)"

create-task-anga: ## Create a custom task for Anga (use: make create-task-anga PROMPT="your task")
	@if [ -z "$(PROMPT)" ]; then \
		echo "$(RED)Error: PROMPT is required$(NC)"; \
		echo "Usage: make create-task-anga PROMPT=\"Create a Python function...\""; \
		exit 1; \
	fi
	@echo "$(CYAN)Creating task for Anga...$(NC)"
	@docker exec codehornets-orchestrator python3 -c "import sys; exec('''import json, os, subprocess\nfrom datetime import datetime\nfrom pathlib import Path\n\nworker = \"anga\"\nprompt = sys.argv[1]\ntrigger_root = Path(\"/shared/triggers\")\ntasks_root = Path(\"/tasks\")\nworker_task_dir = tasks_root / worker\nworker_trigger_dir = trigger_root / worker\nworker_task_dir.mkdir(parents=True, exist_ok=True)\nworker_trigger_dir.mkdir(parents=True, exist_ok=True)\nts = datetime.utcnow().strftime(\"%Y%m%dT%H%M%S\")\ntask_id = f\"custom-task-{worker}-{ts}\"\ntask_payload = {\"task_id\": task_id, \"from\": \"makefile\", \"worker\": worker, \"prompt\": prompt, \"meta\": {\"source\": \"make-create-task\", \"timestamp\": ts}}\ntask_path = worker_task_dir / f\"{task_id}.json\"\ntask_path.write_text(json.dumps(task_payload, indent=2), encoding=\"utf-8\")\ntrigger_path = worker_trigger_dir / f\"task-{task_id}.trigger\"\ntrigger_path.touch()\nprint(f\"✓ Task created: {task_id}\")\ntry:\n    subprocess.run([\"docker\", \"exec\", \"codehornets-svc-automation\", \"bash\", \"/tools/wake_worker.sh\", worker, f\"New task: {task_id}\"], timeout=10, check=False)\nexcept: pass\n''')" "$(PROMPT)"
	@echo "$(GREEN)✓ Task created and worker notified$(NC)"

create-task-marie: ## Create a custom task for Marie (use: make create-task-marie PROMPT="your task")
	@if [ -z "$(PROMPT)" ]; then \
		echo "$(RED)Error: PROMPT is required$(NC)"; \
		echo "Usage: make create-task-marie PROMPT=\"Create a React component...\""; \
		exit 1; \
	fi
	@echo "$(CYAN)Creating task for Marie...$(NC)"
	@docker exec codehornets-orchestrator python3 -c "import sys; exec('''import json, os, subprocess\nfrom datetime import datetime\nfrom pathlib import Path\n\nworker = \"marie\"\nprompt = sys.argv[1]\ntrigger_root = Path(\"/shared/triggers\")\ntasks_root = Path(\"/tasks\")\nworker_task_dir = tasks_root / worker\nworker_trigger_dir = trigger_root / worker\nworker_task_dir.mkdir(parents=True, exist_ok=True)\nworker_trigger_dir.mkdir(parents=True, exist_ok=True)\nts = datetime.utcnow().strftime(\"%Y%m%dT%H%M%S\")\ntask_id = f\"custom-task-{worker}-{ts}\"\ntask_payload = {\"task_id\": task_id, \"from\": \"makefile\", \"worker\": worker, \"prompt\": prompt, \"meta\": {\"source\": \"make-create-task\", \"timestamp\": ts}}\ntask_path = worker_task_dir / f\"{task_id}.json\"\ntask_path.write_text(json.dumps(task_payload, indent=2), encoding=\"utf-8\")\ntrigger_path = worker_trigger_dir / f\"task-{task_id}.trigger\"\ntrigger_path.touch()\nprint(f\"✓ Task created: {task_id}\")\ntry:\n    subprocess.run([\"docker\", \"exec\", \"codehornets-svc-automation\", \"bash\", \"/tools/wake_worker.sh\", worker, f\"New task: {task_id}\"], timeout=10, check=False)\nexcept: pass\n''')" "$(PROMPT)"
	@echo "$(GREEN)✓ Task created and worker notified$(NC)"

create-task-fabien: ## Create a custom task for Fabien (use: make create-task-fabien PROMPT="your task")
	@if [ -z "$(PROMPT)" ]; then \
		echo "$(RED)Error: PROMPT is required$(NC)"; \
		echo "Usage: make create-task-fabien PROMPT=\"Setup Docker compose...\""; \
		exit 1; \
	fi
	@echo "$(CYAN)Creating task for Fabien...$(NC)"
	@docker exec codehornets-orchestrator python3 -c "import sys; exec('''import json, os, subprocess\nfrom datetime import datetime\nfrom pathlib import Path\n\nworker = \"fabien\"\nprompt = sys.argv[1]\ntrigger_root = Path(\"/shared/triggers\")\ntasks_root = Path(\"/tasks\")\nworker_task_dir = tasks_root / worker\nworker_trigger_dir = trigger_root / worker\nworker_task_dir.mkdir(parents=True, exist_ok=True)\nworker_trigger_dir.mkdir(parents=True, exist_ok=True)\nts = datetime.utcnow().strftime(\"%Y%m%dT%H%M%S\")\ntask_id = f\"custom-task-{worker}-{ts}\"\ntask_payload = {\"task_id\": task_id, \"from\": \"makefile\", \"worker\": worker, \"prompt\": prompt, \"meta\": {\"source\": \"make-create-task\", \"timestamp\": ts}}\ntask_path = worker_task_dir / f\"{task_id}.json\"\ntask_path.write_text(json.dumps(task_payload, indent=2), encoding=\"utf-8\")\ntrigger_path = worker_trigger_dir / f\"task-{task_id}.trigger\"\ntrigger_path.touch()\nprint(f\"✓ Task created: {task_id}\")\ntry:\n    subprocess.run([\"docker\", \"exec\", \"codehornets-svc-automation\", \"bash\", \"/tools/wake_worker.sh\", worker, f\"New task: {task_id}\"], timeout=10, check=False)\nexcept: pass\n''')" "$(PROMPT)"
	@echo "$(GREEN)✓ Task created and worker notified$(NC)"

##
## End-to-End Testing
##

reset-test: ## Reset test environment (clean all tasks, results, archives)
	@echo "$(YELLOW)Resetting test environment...$(NC)"
	@echo "  - Cleaning pending tasks..."
	@find shared/tasks -name "*.json" -type f -delete 2>/dev/null || true
	@echo "  - Cleaning pending results..."
	@find shared/results -name "*.json" -type f -delete 2>/dev/null || true
	@echo "  - Cleaning archived tasks..."
	@find shared/archive -name "*.json" -type f -delete 2>/dev/null || true
	@echo "  - Cleaning triggers..."
	@find shared/triggers -name "*.trigger" -type f -delete 2>/dev/null || true
	@find shared/triggers -name "*.txt" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Test environment reset complete$(NC)"

watch-workflow: ## Watch autonomous workflow in real-time
	@echo "$(CYAN)📊 Watching Autonomous Workflow$(NC)"
	@echo "════════════════════════════════════════════════════════════"
	@echo "Monitoring: tasks → wake → process → results → archive"
	@echo "Press Ctrl+C to exit"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@tail -f shared/watcher-logs/monitor-daemon.log 2>/dev/null || echo "$(YELLOW)No monitor logs yet. Run 'make start-monitor' first.$(NC)"

test-e2e: ## Run complete end-to-end workflow test
	@echo "════════════════════════════════════════════════════════════"
	@echo "🧪 End-to-End Workflow Test"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Step 1: Resetting test environment..."
	@$(MAKE) --no-print-directory reset-test
	@echo ""
	@echo "Step 2: Creating test task for Anga..."
	@$(MAKE) --no-print-directory create-test-task
	@echo ""
	@echo "Step 3: Monitoring workflow (15 seconds)..."
	@echo "   - Monitor will detect task"
	@echo "   - Worker will be auto-woken"
	@echo "   - Task will be processed"
	@echo "   - Result will be archived"
	@echo ""
	@for i in 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1; do \
		echo "   Waiting $$i seconds..."; \
		sleep 1; \
	done
	@echo ""
	@echo "════════════════════════════════════════════════════════════"
	@echo "📊 Test Results"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Pending Tasks:"
	@for worker in marie anga fabien; do \
		count=$$(ls shared/tasks/$$worker/*.json 2>/dev/null | wc -l); \
		echo "  $$worker: $$count"; \
	done
	@echo ""
	@echo "Pending Results:"
	@for worker in marie anga fabien; do \
		count=$$(ls shared/results/$$worker/*.json 2>/dev/null | wc -l); \
		echo "  $$worker: $$count"; \
	done
	@echo ""
	@echo "Archived Tasks:"
	@for worker in marie anga fabien; do \
		success=$$(ls shared/archive/$$worker/success/*.json 2>/dev/null | wc -l); \
		failed=$$(ls shared/archive/$$worker/failed/*.json 2>/dev/null | wc -l); \
		total=$$((success + failed)); \
		echo "  $$worker: $$total ($$success success, $$failed failed)"; \
	done
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

test-orchestrator-flow: ## Test orchestrator delegation workflow (manual)
	@echo "════════════════════════════════════════════════════════════"
	@echo "🎯 Orchestrator Delegation Test"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "This test requires manual interaction with the orchestrator."
	@echo ""
	@echo "Instructions:"
	@echo "  1. In another terminal, run: make watch-workflow"
	@echo "  2. Then run: make attach-orchestrator"
	@echo "  3. Give this request to the orchestrator:"
	@echo ""
	@echo "     \"I need to create a Python function that validates email addresses"
	@echo "     using regex. Can you help delegate this to the right agent?\""
	@echo ""
	@echo "  4. Watch as orchestrator:"
	@echo "     - Analyzes the request"
	@echo "     - Suggests Anga (backend developer)"
	@echo "     - Asks if you want to assign"
	@echo "     - Creates task file"
	@echo ""
	@echo "  5. Watch the autonomous workflow:"
	@echo "     - Monitor detects new task"
	@echo "     - Anga is auto-woken"
	@echo "     - Task is processed"
	@echo "     - Result is created"
	@echo "     - Task is archived"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

##
## Inter-Agent Messaging
##

msg-orchestrator: ## Send message to Orchestrator (use: make msg-orchestrator MSG="your message")
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Error: MSG is required$(NC)"; \
		echo "Usage: make msg-orchestrator MSG=\"What are your capabilities?\""; \
		exit 1; \
	fi
	@bash tools/send_agent_message.sh orchestrator "$(MSG)"

msg-anga: ## Send message to Anga (use: make msg-anga MSG="your message")
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Error: MSG is required$(NC)"; \
		echo "Usage: make msg-anga MSG=\"Review the auth code\""; \
		exit 1; \
	fi
	@bash tools/send_agent_message.sh anga "$(MSG)"

msg-marie: ## Send message to Marie (use: make msg-marie MSG="your message")
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Error: MSG is required$(NC)"; \
		echo "Usage: make msg-marie MSG=\"Evaluate Emma's progress\""; \
		exit 1; \
	fi
	@bash tools/send_agent_message.sh marie "$(MSG)"

msg-fabien: ## Send message to Fabien (use: make msg-fabien MSG="your message")
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Error: MSG is required$(NC)"; \
		echo "Usage: make msg-fabien MSG=\"Create social media post\""; \
		exit 1; \
	fi
	@bash tools/send_agent_message.sh fabien "$(MSG)"

##
## Agent Activity Status (Slack/Teams-like status)
##

activity-orchestrator: ## Check if orchestrator is busy or idle
	@bash tools/check_agent_activity.sh orchestrator 2

activity-anga: ## Check if Anga is busy or idle
	@bash tools/check_agent_activity.sh anga 2

activity-marie: ## Check if Marie is busy or idle
	@bash tools/check_agent_activity.sh marie 2

activity-fabien: ## Check if Fabien is busy or idle
	@bash tools/check_agent_activity.sh fabien 2

activity-all: ## Check all agents' activity status
	@echo "$(CYAN)════════════════════════════════════════════════════════════$(NC)"
	@echo "$(CYAN)  All Agents Activity Status$(NC)"
	@echo "$(CYAN)════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@bash tools/check_agent_activity.sh orchestrator 1
	@echo ""
	@bash tools/check_agent_activity.sh marie 1
	@echo ""
	@bash tools/check_agent_activity.sh anga 1
	@echo ""
	@bash tools/check_agent_activity.sh fabien 1

