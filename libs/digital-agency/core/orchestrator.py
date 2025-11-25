"""
Agent orchestration and workflow coordination.

Manages the lifecycle and coordination of multiple agents, including task
assignment, workflow execution, and resource management.
"""

import asyncio
from typing import Any, Dict, List, Optional, Set
from collections import defaultdict
from datetime import datetime

from .agent_base import AgentBase, AgentStatus
from .task_base import TaskBase, TaskStatus, TaskPriority, TaskResult
from .communication import MessageBus, Message, MessageType
from .state_manager import StateManager
from .logger import get_logger


class WorkflowEngine:
    """
    Manages workflow execution across multiple agents.

    Coordinates complex multi-step workflows involving multiple domains
    and agents with dependency management.
    """

    def __init__(self):
        """Initialize workflow engine."""
        self.logger = get_logger("workflow_engine")
        self.active_workflows: Dict[str, Dict[str, Any]] = {}
        self.workflow_tasks: Dict[str, List[str]] = defaultdict(list)

    async def execute_workflow(
        self,
        workflow_id: str,
        tasks: List[TaskBase],
        agents: List[AgentBase],
    ) -> Dict[str, TaskResult]:
        """
        Execute a workflow with multiple tasks and agents.

        Args:
            workflow_id: Unique workflow identifier
            tasks: List of tasks to execute
            agents: Available agents for execution

        Returns:
            Dict[str, TaskResult]: Results for each task
        """
        self.logger.info(f"Starting workflow: {workflow_id} with {len(tasks)} tasks")

        self.active_workflows[workflow_id] = {
            "status": "running",
            "started_at": datetime.utcnow(),
            "total_tasks": len(tasks),
            "completed_tasks": 0,
        }

        results = {}

        try:
            # Sort tasks by dependencies and priority
            sorted_tasks = self._sort_tasks_by_dependencies(tasks)

            # Execute tasks respecting dependencies
            for task in sorted_tasks:
                self.workflow_tasks[workflow_id].append(task.task_id)

                # Wait for dependencies
                await self._wait_for_dependencies(task, results)

                # Find suitable agent
                agent = self._find_suitable_agent(task, agents)
                if not agent:
                    self.logger.error(f"No suitable agent for task: {task.task_id}")
                    continue

                # Execute task
                result = await agent.execute_task(task)
                results[task.task_id] = result

                self.active_workflows[workflow_id]["completed_tasks"] += 1

            self.active_workflows[workflow_id]["status"] = "completed"
            self.logger.info(f"Workflow completed: {workflow_id}")

        except Exception as e:
            self.logger.error(f"Workflow failed: {workflow_id} - {e}")
            self.active_workflows[workflow_id]["status"] = "failed"
            self.active_workflows[workflow_id]["error"] = str(e)

        return results

    def _sort_tasks_by_dependencies(self, tasks: List[TaskBase]) -> List[TaskBase]:
        """Sort tasks respecting dependencies using topological sort."""
        # Simple implementation - can be enhanced with proper topological sort
        return sorted(
            tasks,
            key=lambda t: (
                len(t.dependencies),
                t.priority.value if hasattr(t.priority, 'value') else t.priority,
            ),
        )

    async def _wait_for_dependencies(
        self, task: TaskBase, results: Dict[str, TaskResult]
    ) -> None:
        """Wait for task dependencies to complete."""
        for dep in task.dependencies:
            if dep.blocking:
                while dep.task_id not in results:
                    await asyncio.sleep(0.5)

    def _find_suitable_agent(
        self, task: TaskBase, agents: List[AgentBase]
    ) -> Optional[AgentBase]:
        """Find suitable agent for task based on domain and availability."""
        suitable_agents = [
            agent
            for agent in agents
            if agent.domain == task.domain and agent.status == AgentStatus.IDLE
        ]

        return suitable_agents[0] if suitable_agents else None


class Orchestrator:
    """
    Orchestrates agent execution and task distribution.

    Manages agent lifecycle, task queuing, load balancing, and
    coordination of multi-agent workflows.
    """

    def __init__(
        self,
        message_bus: Optional[MessageBus] = None,
        state_manager: Optional[StateManager] = None,
    ):
        """
        Initialize orchestrator.

        Args:
            message_bus: Message bus for communication
            state_manager: State manager for persistence
        """
        self.message_bus = message_bus or MessageBus()
        self.state_manager = state_manager or StateManager()
        self.logger = get_logger("orchestrator")

        self.agents: Dict[str, AgentBase] = {}
        self.task_queue: List[TaskBase] = []
        self.active_tasks: Dict[str, TaskBase] = {}
        self.completed_tasks: List[str] = []

        self.workflow_engine = WorkflowEngine()

        self._running = False
        self._task_assignment_interval = 1.0  # seconds

    async def register_agent(self, agent: AgentBase) -> None:
        """
        Register an agent with the orchestrator.

        Args:
            agent: Agent instance to register
        """
        self.logger.info(f"Registering agent: {agent.name} ({agent.agent_id})")
        self.agents[agent.agent_id] = agent

        # Initialize agent if not already initialized
        if not agent._initialized:
            await agent.initialize()

    async def unregister_agent(self, agent_id: str) -> None:
        """
        Unregister an agent.

        Args:
            agent_id: ID of agent to unregister
        """
        if agent_id in self.agents:
            agent = self.agents[agent_id]
            self.logger.info(f"Unregistering agent: {agent.name}")
            await agent.shutdown()
            del self.agents[agent_id]

    async def submit_task(self, task: TaskBase) -> None:
        """
        Submit a task for execution.

        Args:
            task: Task to execute
        """
        self.logger.info(
            f"Submitting task: {task.name} ({task.task_id}) - Priority: {task.priority}"
        )
        self.task_queue.append(task)
        self._sort_task_queue()

    async def submit_workflow(
        self, workflow_id: str, tasks: List[TaskBase]
    ) -> Dict[str, TaskResult]:
        """
        Submit a workflow for execution.

        Args:
            workflow_id: Unique workflow identifier
            tasks: List of tasks in workflow

        Returns:
            Dict[str, TaskResult]: Results for each task
        """
        self.logger.info(f"Submitting workflow: {workflow_id} with {len(tasks)} tasks")
        agents_list = list(self.agents.values())
        return await self.workflow_engine.execute_workflow(
            workflow_id, tasks, agents_list
        )

    def _sort_task_queue(self) -> None:
        """Sort task queue by priority and creation time."""
        priority_order = {
            TaskPriority.CRITICAL: 0,
            TaskPriority.HIGH: 1,
            TaskPriority.MEDIUM: 2,
            TaskPriority.LOW: 3,
        }

        self.task_queue.sort(
            key=lambda t: (priority_order.get(t.priority, 4), t.created_at)
        )

    async def start(self) -> None:
        """Start the orchestrator."""
        self.logger.info("Starting orchestrator")
        self._running = True

        # Start task assignment loop
        asyncio.create_task(self._task_assignment_loop())

    async def stop(self) -> None:
        """Stop the orchestrator."""
        self.logger.info("Stopping orchestrator")
        self._running = False

        # Shutdown all agents
        for agent_id in list(self.agents.keys()):
            await self.unregister_agent(agent_id)

    async def _task_assignment_loop(self) -> None:
        """Main loop for assigning tasks to agents."""
        while self._running:
            try:
                await self._assign_pending_tasks()
                await asyncio.sleep(self._task_assignment_interval)
            except Exception as e:
                self.logger.error(f"Error in task assignment loop: {e}")

    async def _assign_pending_tasks(self) -> None:
        """Assign pending tasks to available agents."""
        if not self.task_queue:
            return

        available_agents = self._get_available_agents()

        for agent in available_agents:
            if not self.task_queue:
                break

            # Find compatible task for agent
            task = self._find_compatible_task(agent)
            if task:
                await self._assign_task_to_agent(task, agent)

    def _get_available_agents(self) -> List[AgentBase]:
        """Get list of available agents."""
        available = []
        for agent in self.agents.values():
            if agent.status == AgentStatus.IDLE:
                current_task_count = len(agent.current_tasks)
                if current_task_count < agent.config.max_concurrent_tasks:
                    available.append(agent)
        return available

    def _find_compatible_task(self, agent: AgentBase) -> Optional[TaskBase]:
        """
        Find a compatible task for an agent.

        Args:
            agent: Agent to find task for

        Returns:
            Optional[TaskBase]: Compatible task or None
        """
        for task in self.task_queue:
            if task.domain == agent.domain and task.status == TaskStatus.PENDING:
                # Check if task dependencies are met
                if not self._are_dependencies_met(task):
                    continue
                return task
        return None

    def _are_dependencies_met(self, task: TaskBase) -> bool:
        """Check if all task dependencies are met."""
        for dep in task.dependencies:
            if dep.blocking and dep.task_id not in self.completed_tasks:
                return False
        return True

    async def _assign_task_to_agent(self, task: TaskBase, agent: AgentBase) -> None:
        """
        Assign a task to an agent.

        Args:
            task: Task to assign
            agent: Agent to assign to
        """
        self.logger.info(f"Assigning task {task.task_id} to agent {agent.agent_id}")

        # Update task
        task.assign_to_agent(agent.agent_id)
        self.task_queue.remove(task)
        self.active_tasks[task.task_id] = task

        # Update agent
        agent.current_tasks.add(task.task_id)
        agent.status = AgentStatus.BUSY

        # Send task assignment message
        message = Message(
            message_id=f"task_assign_{task.task_id}",
            type=MessageType.TASK_ASSIGNMENT,
            sender_id="orchestrator",
            receiver_id=agent.agent_id,
            payload={"task": task.to_dict()},
        )
        await self.message_bus.publish(message)

        # Execute task asynchronously
        asyncio.create_task(self._execute_task(task, agent))

    async def _execute_task(self, task: TaskBase, agent: AgentBase) -> None:
        """
        Execute a task with an agent.

        Args:
            task: Task to execute
            agent: Agent executing the task
        """
        try:
            task.start_execution()

            # Execute with timeout
            result = await asyncio.wait_for(
                agent.execute_task(task),
                timeout=task.timeout_seconds or agent.config.timeout_seconds,
            )

            # Handle result
            if result.is_successful():
                self.completed_tasks.append(task.task_id)
                self.logger.info(f"Task completed successfully: {task.task_id}")
            else:
                self.logger.warning(f"Task failed: {task.task_id} - {result.error}")

                # Retry if applicable
                if task.should_retry():
                    self.logger.info(f"Retrying task: {task.task_id}")
                    task.retry()
                    await self.submit_task(task)

        except asyncio.TimeoutError:
            self.logger.error(f"Task timed out: {task.task_id}")
            task.timeout()

        except Exception as e:
            self.logger.error(f"Task execution error: {task.task_id} - {e}")
            task.fail(str(e))

        finally:
            # Cleanup
            if task.task_id in self.active_tasks:
                del self.active_tasks[task.task_id]

            agent.current_tasks.discard(task.task_id)
            if not agent.current_tasks:
                agent.status = AgentStatus.IDLE

    def get_status(self) -> Dict[str, Any]:
        """
        Get orchestrator status.

        Returns:
            Dict containing orchestrator status
        """
        return {
            "running": self._running,
            "agents": {
                "total": len(self.agents),
                "idle": len([a for a in self.agents.values() if a.status == AgentStatus.IDLE]),
                "busy": len([a for a in self.agents.values() if a.status == AgentStatus.BUSY]),
            },
            "tasks": {
                "queued": len(self.task_queue),
                "active": len(self.active_tasks),
                "completed": len(self.completed_tasks),
            },
            "workflows": {
                "active": len(self.workflow_engine.active_workflows),
            },
        }
