#!/bin/bash

# Interactive Worker Setup Script
# This script helps you set up each worker (Marie, Anga, Fabien) interactively

show_menu() {
    clear
    echo "════════════════════════════════════════════════════════════════"
    echo "   Multi-Agent System - Interactive Setup"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Choose which agent to set up:"
    echo ""
    echo "  1) Orchestrator (Task Coordinator)"
    echo "  2) Marie  (Frontend Specialist)"
    echo "  3) Anga   (Backend Specialist)"
    echo "  4) Fabien (DevOps Specialist)"
    echo "  5) Setup All Workers (Marie, Anga, Fabien)"
    echo "  6) Setup Everything (Orchestrator + All Workers)"
    echo "  7) Check Status & Exit"
    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo ""
}

setup_instructions() {
    echo ""
    echo "IMPORTANT: How to detach without stopping:"
    echo "  - Press Ctrl+P, then Ctrl+Q to detach (keeps container running)"
    echo "  - DO NOT type 'exit' or press Ctrl+C (would stop the container)"
    echo ""
    echo "After choosing the theme:"
    echo "  - Wait a few seconds for Claude Code to fully load"
    echo "  - Then press Ctrl+P then Ctrl+Q to detach"
    echo ""
}

setup_orchestrator() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   Setting up Orchestrator (Task Coordinator)"
    echo "════════════════════════════════════════════════════════════════"
    setup_instructions
    echo "Press Enter to attach to Orchestrator..."
    read
    docker attach codehornets-orchestrator
    echo ""
    echo "✓ Detached from Orchestrator"
    sleep 2
}

setup_marie() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   Setting up Marie (Frontend Specialist)"
    echo "════════════════════════════════════════════════════════════════"
    setup_instructions
    echo "Press Enter to attach to Marie..."
    read
    docker attach codehornets-worker-marie
    echo ""
    echo "✓ Detached from Marie"
    sleep 2
}

setup_anga() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   Setting up Anga (Backend Specialist)"
    echo "════════════════════════════════════════════════════════════════"
    setup_instructions
    echo "Press Enter to attach to Anga..."
    read
    docker attach codehornets-worker-anga
    echo ""
    echo "✓ Detached from Anga"
    sleep 2
}

setup_fabien() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   Setting up Fabien (DevOps Specialist)"
    echo "════════════════════════════════════════════════════════════════"
    setup_instructions
    echo "Press Enter to attach to Fabien..."
    read
    docker attach codehornets-worker-fabien
    echo ""
    echo "✓ Detached from Fabien"
    sleep 2
}

check_status() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   System Status"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Container status:"
    docker ps --filter "name=codehornets" --format "  {{.Names}}: {{.Status}}"
    echo ""
    echo "Agent heartbeats:"
    make heartbeat 2>/dev/null || echo "  (run 'make heartbeat' for detailed status)"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [1-7]: " choice

    case $choice in
        1)
            setup_orchestrator
            ;;
        2)
            setup_marie
            ;;
        3)
            setup_anga
            ;;
        4)
            setup_fabien
            ;;
        5)
            echo ""
            echo "Setting up all workers in sequence..."
            echo "You'll set up: Marie → Anga → Fabien"
            echo ""
            read -p "Press Enter to continue..."
            setup_marie
            setup_anga
            setup_fabien
            echo ""
            echo "✓ All workers configured!"
            check_status
            echo ""
            read -p "Press Enter to return to menu..."
            ;;
        6)
            echo ""
            echo "Setting up everything in sequence..."
            echo "You'll set up: Orchestrator → Marie → Anga → Fabien"
            echo ""
            read -p "Press Enter to continue..."
            setup_orchestrator
            setup_marie
            setup_anga
            setup_fabien
            echo ""
            echo "✓ Complete system configured!"
            check_status
            echo ""
            read -p "Press Enter to return to menu..."
            ;;
        7)
            check_status
            echo ""
            echo "════════════════════════════════════════════════════════════════"
            echo "   Setup Helper"
            echo "════════════════════════════════════════════════════════════════"
            echo ""
            echo "To create tasks:"
            echo "  make task-marie TITLE=\"Update UI\" DESC=\"Fix dashboard\""
            echo "  make task-anga TITLE=\"Fix API\" DESC=\"Update auth endpoint\""
            echo "  make task-fabien TITLE=\"Deploy\" DESC=\"Setup CI/CD\""
            echo ""
            echo "To monitor workers:"
            echo "  make logs-marie"
            echo "  make logs-anga"
            echo "  make logs-fabien"
            echo "  make list-tasks"
            echo "  make list-results"
            echo ""
            echo "Exiting setup helper..."
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo "Invalid choice. Please select 1-7."
            sleep 2
            ;;
    esac
done
