#!/usr/bin/env python3
"""
PTY-Based Multi-Agent Orchestrator

Enables REAL interactive communication between Claude CLI agents.
Each agent runs in a pseudo-terminal (PTY), allowing programmatic
stdin injection while maintaining full interactive session context.

This solves the "TTY-only" limitation of Claude CLI.

Usage:
    python3 pty_orchestrator.py

Requirements:
    pip install pexpect

Architecture:
    ┌─────────────────────────────────────────────────────────────┐
    │                      ORCHESTRATOR                            │
    │                                                              │
    │   marie = Agent("marie", "docker exec -it marie claude")    │
    │   anga = Agent("anga", "docker exec -it anga claude")       │
    │                                                              │
    │   # Send task to Marie (interactive, context preserved!)     │
    │   response = marie.send("Evaluate Emma Rodriguez")          │
    │                                                              │
    │   # Marie can ask Anga for help                              │
    │   anga_response = anga.send(f"Marie needs: {response}")     │
    │                                                              │
    │   # Continue conversation with full context                  │
    │   marie.send(f"Anga says: {anga_response}")                 │
    └─────────────────────────────────────────────────────────────┘
"""

import os
import sys
import time
import json
import re
import signal
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Callable
from dataclasses import dataclass, field

try:
    import pexpect
except ImportError:
    print("❌ pexpect not installed. Run: pip install pexpect")
    sys.exit(1)


@dataclass
class AgentConfig:
    """Configuration for an agent"""
    name: str
    command: str
    # Claude CLI shows "? for shortcuts" when idle at prompt
    prompt_pattern: str = r'\? for shortcuts'
    timeout: int = 120
    working_dir: Optional[str] = None
    # Character send delay for Ink/React TUI apps (in seconds)
    # Increase if characters are being dropped or misorder
    # Claude CLI's Ink TUI needs more time to process each character
    char_delay: float = 0.02  # Increased from 0.01 to 0.02 (20ms) for better reliability
    # Delay after sending full message before pressing Enter
    submit_delay: float = 0.5  # Increased from 0.3 to 0.5 for TUI to fully process input


@dataclass
class Message:
    """A message in the conversation"""
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    agent: Optional[str] = None


class PTYAgent:
    """
    A Claude CLI agent running in a pseudo-terminal.

    Enables programmatic control of an interactive Claude session
    while maintaining full conversation context.
    """

    def __init__(self, config: AgentConfig):
        self.config = config
        self.name = config.name
        self.process: Optional[pexpect.spawn] = None
        self.history: list[Message] = []
        self.is_ready = False
        self._on_output: Optional[Callable[[str], None]] = None

    def start(self) -> bool:
        """Start the agent in a PTY"""
        print(f"🚀 Starting agent: {self.name}")
        print(f"   Command: {self.config.command}")

        try:
            # Spawn in pseudo-terminal
            self.process = pexpect.spawn(
                self.config.command,
                encoding='utf-8',
                timeout=self.config.timeout,
                cwd=self.config.working_dir,
                env={**os.environ, 'TERM': 'xterm-256color'}
            )

            # Set window size - WIDE to prevent message wrapping in TUI
            # Height 40, Width 500 (very wide to avoid line wrapping)
            self.process.setwinsize(40, 500)

            # Configure pexpect delays for TUI interaction
            # Increase delaybeforesend for Ink/React TUI apps that need time
            # to process input through their event loop
            # Higher delay needed for Claude CLI's Ink TUI
            self.process.delaybeforesend = 0.1  # 100ms before each send() - increased for reliability

            # Enable logging to see what's happening
            self.process.logfile_read = sys.stdout

            # Wait for initial prompt - Claude CLI shows '>' when ready
            print(f"   Waiting for Claude CLI to start...")
            print(f"   (Looking for prompt pattern, timeout=60s)")

            # Handle permission prompt and other startup dialogs
            max_attempts = 10
            for attempt in range(max_attempts):
                patterns = [
                    'Yes, continue',            # Permission prompt option (index 0)
                    'Enter to confirm',         # Permission prompt (index 1)
                    'Do you want to work',      # Permission question (index 2)
                    'Esc to exit',              # Permission prompt footer (index 3)
                    r'\? for shortcuts',        # Ready - help text (index 4)
                    pexpect.TIMEOUT             # Timeout (index 5)
                ]

                index = self.process.expect(patterns, timeout=20)
                print(f"   [Attempt {attempt+1}] Matched pattern index: {index}")

                if index in [0, 1, 2, 3]:  # Permission prompt - send Enter to confirm
                    print(f"   📋 Permission prompt detected, sending Enter to accept...")
                    time.sleep(0.5)
                    self.process.send('\r')
                    time.sleep(2)
                    continue
                elif index == 4:  # Ready! (? for shortcuts)
                    print(f"   ✅ Claude CLI ready!")
                    self.process.logfile_read = None
                    break
                elif index == 5:  # TIMEOUT
                    print(f"   ⏳ Timeout on attempt {attempt+1}, checking process...")
                    if not self.process.isalive():
                        print(f"   ❌ Process died")
                        return False
                    self.process.send('\r')
                    time.sleep(1)
                    continue

            # Disable logging after startup
            self.process.logfile_read = None
            self.is_ready = True
            print(f"✅ Agent {self.name} ready!")
            return True

        except pexpect.TIMEOUT:
            print(f"❌ Timeout waiting for {self.name} to start")
            return False
        except pexpect.EOF:
            print(f"❌ Agent {self.name} process ended unexpectedly")
            if self.process:
                print(f"   Output: {self.process.before}")
            return False
        except Exception as e:
            print(f"❌ Failed to start {self.name}: {e}")
            return False

    def send(self, message: str, wait_for_complete: bool = True) -> str:
        """
        Send a message to the agent and get response.

        Args:
            message: The message to send
            wait_for_complete: Wait for Claude to finish responding

        Returns:
            The agent's response
        """
        if not self.process or not self.is_ready:
            raise RuntimeError(f"Agent {self.name} not ready")

        # Record the message
        self.history.append(Message(role='user', content=message, agent='orchestrator'))

        print(f"\n📤 [{self.name}] Sending: {message[:100]}{'...' if len(message) > 100 else ''}")

        # Enable logging to see what's happening
        self.process.logfile_read = sys.stdout

        # CRITICAL: Flush all buffered content BEFORE sending
        # This prevents matching stale "? for shortcuts" from startup
        print(f"   [DEBUG] Flushing buffer...")
        try:
            while True:
                self.process.read_nonblocking(size=4096, timeout=0.1)
        except (pexpect.TIMEOUT, pexpect.EOF):
            pass  # Buffer is now empty

        # Ensure we're at the prompt by waiting for it (with short timeout)
        print(f"   [DEBUG] Ensuring we're at prompt...")
        try:
            self.process.expect([self.config.prompt_pattern, pexpect.TIMEOUT], timeout=2)
        except pexpect.TIMEOUT:
            print(f"   [WARN] Prompt not found, continuing anyway...")
        except pexpect.EOF:
            print(f"   [ERROR] Process ended!")
            return ""

        # FIX: Type message character-by-character for Ink/React TUI
        message_text = message.rstrip()
        print(f"   [DEBUG] Typing message: '{message_text}' ({len(message_text)} chars)")

        # Ensure process is alive
        if not self.process.isalive():
            print(f"   [ERROR] Process is not alive!")
            return ""

        # Type each character with minimal delay for Ink TUI to register
        # Use os.write directly to PTY fd for raw mode compatibility
        import os as _os
        fd = self.process.child_fd

        for i, char in enumerate(message_text):
            _os.write(fd, char.encode('utf-8'))
            time.sleep(0.02)  # 20ms per char for reliability

        print(f"   [DEBUG] Typed {len(message_text)} chars")

        # Wait for TUI to fully render the typed message
        time.sleep(0.5)

        # Submit with Enter via direct PTY write (same method as character typing)
        # Using \r (carriage return) which Ink TUI interprets as submit
        _os.write(fd, b'\r')
        time.sleep(0.3)

        print(f"   [DEBUG] Message submitted, waiting for Claude's response...")

        if not wait_for_complete:
            return ""

        # Wait for response to complete
        # After sending, Claude processes then shows "? for shortcuts" when done
        try:
            # Collect output until we see the idle prompt pattern
            output_chunks = []
            consecutive_timeouts = 0
            max_timeouts = 24  # 24 * 5s = 120s max wait

            while consecutive_timeouts < max_timeouts:
                index = self.process.expect(
                    [self.config.prompt_pattern, pexpect.TIMEOUT],
                    timeout=5
                )

                if self.process.before:
                    output_chunks.append(self.process.before)
                    consecutive_timeouts = 0  # Reset on output

                if index == 0:  # Prompt pattern matched - response complete!
                    break
                else:  # Timeout
                    consecutive_timeouts += 1
                    if not self.process.isalive():
                        break

            response = self._clean_response(''.join(output_chunks))

            # Record the response
            self.history.append(Message(role='assistant', content=response, agent=self.name))

            print(f"📥 [{self.name}] Response: {response[:200]}{'...' if len(response) > 200 else ''}")

            if self._on_output:
                self._on_output(response)

            return response

        except pexpect.TIMEOUT:
            print(f"⚠️ [{self.name}] Response timeout (may still be processing)")
            # Try to get partial output
            partial = self.process.before if self.process.before else ""
            return self._clean_response(partial)
        except pexpect.EOF:
            print(f"❌ [{self.name}] Session ended unexpectedly")
            self.is_ready = False
            return ""

    def _clean_response(self, raw: str) -> str:
        """Clean ANSI codes and TUI artifacts from response"""
        if not raw:
            return ""

        # Remove ANSI escape codes
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        cleaned = ansi_escape.sub('', raw)

        # Remove the echoed command (first line is usually what we sent)
        lines = cleaned.strip().split('\n')
        if lines:
            lines = lines[1:]  # Skip echoed input

        # Remove prompt artifacts and TUI decorations
        cleaned = '\n'.join(lines).strip()

        # Remove common TUI artifacts
        cleaned = re.sub(r'\[\?2026[hl]', '', cleaned)
        cleaned = re.sub(r'\[2K', '', cleaned)
        cleaned = re.sub(r'\[1A', '', cleaned)
        cleaned = re.sub(r'\[\d+G', '', cleaned)

        # Remove box drawing characters and prompt hints
        cleaned = re.sub(r'[─│╭╮╰╯┌┐└┘├┤┬┴┼]+', '', cleaned)
        cleaned = re.sub(r'>\s*Try "[^"]*"', '', cleaned)
        cleaned = re.sub(r'\? for shortcuts.*$', '', cleaned, flags=re.MULTILINE)

        # Clean up multiple blank lines
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

        return cleaned.strip()

    def on_output(self, callback: Callable[[str], None]):
        """Register callback for agent output"""
        self._on_output = callback

    def stop(self):
        """Stop the agent gracefully"""
        if self.process:
            print(f"🛑 Stopping agent: {self.name}")
            try:
                # Send Ctrl+C to interrupt any running operation
                self.process.sendcontrol('c')
                time.sleep(0.3)
                # Send Ctrl+D (EOF) to exit - more reliable than /exit
                self.process.sendcontrol('d')
                self.process.expect(pexpect.EOF, timeout=5)
            except:
                pass
            # Always force terminate to ensure cleanup
            try:
                self.process.terminate(force=True)
            except:
                pass
            self.process = None
            self.is_ready = False

    def get_history(self) -> list[Message]:
        """Get conversation history"""
        return self.history.copy()


class MultiAgentOrchestrator:
    """
    Orchestrates multiple PTY-based Claude agents.

    Enables agents to communicate with each other while
    maintaining their individual interactive sessions.
    """

    def __init__(self):
        self.agents: dict[str, PTYAgent] = {}
        self.conversation_log: list[dict] = []

        # Handle shutdown gracefully
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def add_agent(self, name: str, command: str, **kwargs) -> PTYAgent:
        """Add and start an agent"""
        config = AgentConfig(name=name, command=command, **kwargs)
        agent = PTYAgent(config)

        if agent.start():
            self.agents[name] = agent
            return agent
        else:
            raise RuntimeError(f"Failed to start agent: {name}")

    def send_to(self, agent_name: str, message: str) -> str:
        """Send message to a specific agent"""
        if agent_name not in self.agents:
            raise ValueError(f"Unknown agent: {agent_name}")

        response = self.agents[agent_name].send(message)

        # Log the interaction
        self.conversation_log.append({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'to': agent_name,
            'message': message,
            'response': response
        })

        return response

    def agent_to_agent(self, from_agent: str, to_agent: str, message: str) -> tuple[str, str]:
        """
        Facilitate communication between two agents.

        Agent A sends message → Agent B responds → Agent A receives response
        """
        # Agent A formulates message
        a_message = self.send_to(from_agent, f"Send this message to {to_agent}: {message}")

        # Agent B receives and responds
        b_response = self.send_to(to_agent, f"Message from {from_agent}: {a_message}")

        # Agent A receives response
        final = self.send_to(from_agent, f"Response from {to_agent}: {b_response}")

        return b_response, final

    def broadcast(self, message: str) -> dict[str, str]:
        """Send message to all agents"""
        responses = {}
        for name, agent in self.agents.items():
            responses[name] = agent.send(message)
        return responses

    def _shutdown(self, signum=None, frame=None):
        """Graceful shutdown"""
        print("\n🛑 Shutting down orchestrator...")
        for agent in self.agents.values():
            agent.stop()
        sys.exit(0)

    def save_log(self, path: str):
        """Save conversation log to file"""
        Path(path).write_text(json.dumps(self.conversation_log, indent=2))
        print(f"💾 Conversation log saved to: {path}")


# =============================================================================
# DEMO: Two agents having a conversation
# =============================================================================

def demo_agent_conversation():
    """
    Demo: Marie and Anga having a real conversation.

    Both maintain their own context and can reference
    previous messages in the conversation.
    """
    print("=" * 60)
    print("  PTY-Based Multi-Agent Demo")
    print("  Two Claude agents having a real conversation")
    print("=" * 60)
    print()

    orchestrator = MultiAgentOrchestrator()

    try:
        # Start agents (using docker exec for containerized agents)
        # For local testing, use just 'claude' instead

        print("Starting agents...")
        print()

        # Option 1: Docker containers
        # marie = orchestrator.add_agent("marie", "docker exec -it marie claude")
        # anga = orchestrator.add_agent("anga", "docker exec -it anga claude")

        # Option 2: Local Claude instances (for testing)
        # Create workspace if needed
        import os
        workspace = "/tmp/marie_workspace"
        os.makedirs(workspace, exist_ok=True)

        marie = orchestrator.add_agent(
            "marie",
            "claude",
            working_dir=workspace
        )

        # Give it a moment
        time.sleep(2)

        print("\n" + "=" * 60)
        print("  Starting Conversation")
        print("=" * 60 + "\n")

        # Initialize Marie with her personality
        orchestrator.send_to("marie",
            "You are Marie, a dance teacher assistant. "
            "You're warm, encouraging, and detail-oriented. "
            "When I send you messages from other agents, engage with them naturally. "
            "Acknowledge this by saying 'Marie here, ready to help!'"
        )

        # Send a task
        response = orchestrator.send_to("marie",
            "A student named Emma Rodriguez just finished her ballet exam. "
            "She scored 85/100. Give a brief, encouraging response about her progress."
        )

        print(f"\n{'=' * 60}")
        print("Marie's response:")
        print(f"{'=' * 60}")
        print(response)

        # Follow-up (context preserved!)
        response2 = orchestrator.send_to("marie",
            "What specific areas should Emma focus on to improve further? "
            "Reference her exam performance you just mentioned."
        )

        print(f"\n{'=' * 60}")
        print("Marie's follow-up (with context):")
        print(f"{'=' * 60}")
        print(response2)

        # Save conversation
        orchestrator.save_log("/tmp/agent_conversation.json")

    except KeyboardInterrupt:
        print("\n\nDemo interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        orchestrator._shutdown()


def demo_two_agent_chat():
    """
    Demo: Two agents chatting with each other.
    """
    print("=" * 60)
    print("  Two-Agent Chat Demo")
    print("=" * 60)
    print()

    orchestrator = MultiAgentOrchestrator()

    try:
        # Start both agents
        marie = orchestrator.add_agent("marie", "claude", working_dir="/tmp/marie")
        time.sleep(1)
        anga = orchestrator.add_agent("anga", "claude", working_dir="/tmp/anga")

        # Initialize personalities
        orchestrator.send_to("marie",
            "You are Marie, a dance teacher. Keep responses brief (2-3 sentences). "
            "Say 'Marie ready!' to confirm."
        )

        orchestrator.send_to("anga",
            "You are Anga, a software developer. Keep responses brief (2-3 sentences). "
            "Say 'Anga ready!' to confirm."
        )

        print("\n" + "=" * 60)
        print("  Agents chatting about a dance studio website")
        print("=" * 60 + "\n")

        # Marie asks Anga something
        marie_question = orchestrator.send_to("marie",
            "You need a website for your dance studio. "
            "What's ONE specific feature you'd want? Reply in 1 sentence."
        )

        # Send Marie's question to Anga
        anga_response = orchestrator.send_to("anga",
            f"Marie (dance teacher) says: '{marie_question}' "
            "Reply helpfully in 2 sentences."
        )

        # Send Anga's response back to Marie
        marie_followup = orchestrator.send_to("marie",
            f"Anga (developer) replied: '{anga_response}' "
            "Say thanks and ask ONE follow-up question."
        )

        print("\n" + "=" * 60)
        print("  Conversation Complete!")
        print("=" * 60)

        orchestrator.save_log("/tmp/two_agent_chat.json")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        orchestrator._shutdown()


# =============================================================================
# SERVER MODE: Listen for commands from pty_client.py
# =============================================================================

COMM_DIR = Path("/tmp/pty_orchestrator")
RESPONSES_DIR = COMM_DIR / "responses"
STATUS_FILE = COMM_DIR / "status.json"


def run_server_mode():
    """
    Run orchestrator in server mode - listens for commands from pty_client.py

    Protocol:
    1. Orchestrator writes status.json with available agents
    2. Client writes command to {command_id}.cmd
    3. Orchestrator reads command, sends to agent, writes response to responses/{command_id}.json
    """
    print("=" * 60)
    print("  PTY Orchestrator - Server Mode")
    print("  Listening for commands from pty_client.py")
    print("=" * 60)
    print()

    # Setup communication directories
    COMM_DIR.mkdir(exist_ok=True)
    RESPONSES_DIR.mkdir(exist_ok=True)

    orchestrator = MultiAgentOrchestrator()

    try:
        # Start agents
        print("Starting agents...")
        workspaces = {
            "marie": "/tmp/marie_workspace",
            "anga": "/tmp/anga_workspace",
        }

        for name, workspace in workspaces.items():
            os.makedirs(workspace, exist_ok=True)
            try:
                orchestrator.add_agent(name, "claude", working_dir=workspace)
                time.sleep(2)
            except Exception as e:
                print(f"⚠️ Failed to start {name}: {e}")

        if not orchestrator.agents:
            print("❌ No agents started, exiting")
            return

        # Write status file
        status = {
            "agents": list(orchestrator.agents.keys()),
            "started": datetime.now(timezone.utc).isoformat(),
            "pid": os.getpid()
        }
        STATUS_FILE.write_text(json.dumps(status, indent=2))
        print(f"\n✅ Server ready! Agents: {list(orchestrator.agents.keys())}")
        print(f"   Status file: {STATUS_FILE}")
        print(f"\n📡 Listening for commands...")
        print("   Use: python tools/pty_client.py send marie 'your message'")
        print("   Press Ctrl+C to stop\n")

        # Main loop - watch for command files
        while True:
            # Look for .cmd files
            cmd_files = list(COMM_DIR.glob("*.cmd"))

            for cmd_file in cmd_files:
                try:
                    # Read and parse command
                    cmd_data = json.loads(cmd_file.read_text())
                    cmd_id = cmd_data["id"]
                    agent_name = cmd_data["agent"]
                    message = cmd_data["message"]

                    print(f"\n📥 Received command {cmd_id} for {agent_name}")

                    # Delete command file immediately
                    cmd_file.unlink()

                    # Execute command
                    if agent_name not in orchestrator.agents:
                        response = {"id": cmd_id, "error": f"Unknown agent: {agent_name}"}
                    else:
                        try:
                            output = orchestrator.send_to(agent_name, message)
                            response = {
                                "id": cmd_id,
                                "agent": agent_name,
                                "content": output,
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            }
                        except Exception as e:
                            response = {"id": cmd_id, "error": str(e)}

                    # Write response
                    response_file = RESPONSES_DIR / f"{cmd_id}.json"
                    response_file.write_text(json.dumps(response, indent=2))
                    print(f"📤 Response written to {response_file}")

                except Exception as e:
                    print(f"❌ Error processing {cmd_file}: {e}")
                    # Try to clean up
                    try:
                        cmd_file.unlink()
                    except:
                        pass

            # Small sleep to prevent CPU spinning
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n\n🛑 Server shutting down...")
    finally:
        # Cleanup status file
        try:
            STATUS_FILE.unlink()
        except:
            pass
        orchestrator._shutdown()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="PTY-Based Multi-Agent Orchestrator")
    parser.add_argument("--mode", choices=["demo", "chat", "server"], default="server",
                       help="Mode: demo (single agent demo), chat (two agent demo), server (listen for commands)")

    args = parser.parse_args()

    if args.mode == "chat":
        demo_two_agent_chat()
    elif args.mode == "demo":
        demo_agent_conversation()
    else:
        run_server_mode()
