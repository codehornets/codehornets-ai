// Shared DTOs - using explicit exports to avoid conflicts

// Pagination and Response
export * from './pagination.dto';
export * from './response.dto';
export * from './validation';

// Agent DTOs - from agents.dto.ts (used by apps/agents-service)
// These are the primary exports for agent operations
export {
  AgentDomain,
  AgentStatus,
  AgentType,
  AgentTool,
  AGENT_SKILLS,
  CreateAgentDto,
  UpdateAgentDto,
  AgentResponseDto,
  AgentFilterDto,
} from './agents.dto';

// Alternative Agent DTOs - from agent.dto.ts (used by libs/interfaces REST controllers)
// Export with "Query" suffix to distinguish from primary versions
export {
  AgentType as AgentTypeQuery,
  AgentDomain as AgentDomainQuery,
  AgentStatus as AgentStatusQuery,
  CreateAgentDto as CreateAgentQueryDto,
  UpdateAgentDto as UpdateAgentQueryDto,
  AgentQueryDto,
} from './agent.dto';

// Agent Execution DTOs
export {
  TaskType,
  ExecutionPriority,
  ExecutionStatus,
  AgentInvocationDto,
  ExecuteAgentDto,
  AgentExecutionResultDto,
  ExecutionLogDto,
  AgentExecutionStatusDto,
} from './agent-execution.dto';

// Other Agent-related DTOs
export * from './agent-feedback.dto';
export * from './agent-tuning.dto';
export * from './agent-template.dto';

// Task and Lead DTOs
export * from './task.dto';
export * from './lead.dto';
