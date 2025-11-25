import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseController } from './base.controller';
import { CreateAgentDto, UpdateAgentDto, AgentQueryDto } from '../dto/agent.dto';
import { ExecuteAgentDto } from '../dto/agent-execution.dto';
import { AgentsService } from '@funnelagents/application';
import { TasksService } from '@funnelagents/application';
import { AgentType, AgentDomain, AgentStatus, AgentCapability } from '@funnelagents/domain';

@ApiTags('agents')
@Controller('agents')
export class AgentsController extends BaseController<any, CreateAgentDto, UpdateAgentDto> {
  protected readonly service: any;

  constructor(
    private readonly agentsService: AgentsService,
    private readonly tasksService: TasksService
  ) {
    super();
    this.service = agentsService;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(@Body(ValidationPipe) dto: CreateAgentDto) {
    try {
      // Transform DTO capabilities to domain AgentCapability type
      const capabilities: AgentCapability[] = (dto.capabilities || []).map(cap => ({
        name: cap.name,
        description: cap.description,
        parameters: cap.parameters,
      }));

      const agent = await this.agentsService.create({
        name: dto.name,
        type: dto.type as AgentType,
        domain: dto.domain as AgentDomain,
        description: dto.description,
        capabilities,
        config: {
          model: dto.config?.model,
          temperature: dto.config?.temperature,
          maxTokens: dto.config?.maxTokens,
          systemPrompt: dto.config?.systemPrompt,
          tools: dto.config?.tools || [],
        },
        tools: dto.tools,
      });

      return this.success({
        id: agent.id.value,
        name: agent.name,
        type: agent.type,
        domain: agent.domain,
        description: agent.description,
        status: agent.status,
        capabilities: agent.capabilities,
        config: agent.config,
        tools: agent.tools,
        metrics: agent.metrics,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all agents with filters' })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  async findAll(@Query(ValidationPipe) query: AgentQueryDto) {
    const filters: any = {};
    if (query.status) filters.status = query.status;
    if (query.type) filters.type = query.type;
    if (query.domain) filters.domain = query.domain;

    const paginationParams = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const result = await this.agentsService.findWithFilters(filters, paginationParams);

    const data = result.data.map(agent => ({
      id: agent.id.value,
      name: agent.name,
      type: agent.type,
      domain: agent.domain,
      description: agent.description,
      status: agent.status,
      capabilities: agent.capabilities,
      config: agent.config,
      tools: agent.tools,
      metrics: agent.metrics,
    }));

    return this.paginated(data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async findOne(@Param('id') id: string) {
    const agent = await this.agentsService.findById(id);

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return this.success({
      id: agent.id.value,
      name: agent.name,
      type: agent.type,
      domain: agent.domain,
      description: agent.description,
      status: agent.status,
      capabilities: agent.capabilities,
      config: agent.config,
      tools: agent.tools,
      metrics: agent.metrics,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateAgentDto
  ) {
    try {
      const agent = await this.agentsService.findById(id);

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${id} not found`);
      }

      // Update config if provided
      if (dto.config) {
        await this.agentsService.updateConfig(id, dto.config);
      }

      // Update capabilities if provided
      if (dto.capabilities) {
        for (const cap of dto.capabilities) {
          await this.agentsService.addCapability(id, cap as AgentCapability);
        }
      }

      // Update tools if provided
      if (dto.tools) {
        const updatedAgent = await this.agentsService.findById(id);
        updatedAgent.updateTools(dto.tools);
      }

      // Update status if provided
      if (dto.status) {
        if (dto.status === AgentStatus.IDLE) {
          await this.agentsService.activate(id);
        } else if (dto.status === AgentStatus.OFFLINE) {
          await this.agentsService.deactivate(id);
        }
      }

      const updatedAgent = await this.agentsService.findById(id);

      return this.success({
        id: updatedAgent.id.value,
        name: updatedAgent.name,
        type: updatedAgent.type,
        domain: updatedAgent.domain,
        description: updatedAgent.description,
        status: updatedAgent.status,
        capabilities: updatedAgent.capabilities,
        config: updatedAgent.config,
        tools: updatedAgent.tools,
        metrics: updatedAgent.metrics,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete agent' })
  @ApiResponse({ status: 204, description: 'Agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async remove(@Param('id') id: string) {
    try {
      await this.agentsService.delete(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate agent' })
  @ApiResponse({ status: 200, description: 'Agent activated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async activate(@Param('id') id: string) {
    try {
      await this.agentsService.activate(id);
      return this.success({ message: 'Agent activated successfully' });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate agent' })
  @ApiResponse({ status: 200, description: 'Agent deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async deactivate(@Param('id') id: string) {
    try {
      await this.agentsService.deactivate(id);
      return this.success({ message: 'Agent deactivated successfully' });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute agent with input' })
  @ApiResponse({ status: 200, description: 'Agent execution completed' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @ApiResponse({ status: 400, description: 'Agent execution failed' })
  async execute(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: ExecuteAgentDto
  ) {
    try {
      const result = await this.agentsService.executeAgent(id, dto.input, dto.timeout);
      return this.success(result);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get agent tasks' })
  @ApiResponse({ status: 200, description: 'Agent tasks retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getTasks(
    @Param('id') id: string,
    @Query(ValidationPipe) query: any
  ) {
    // Verify agent exists
    const agent = await this.agentsService.findById(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    // Get tasks for this agent
    const result = await this.tasksService.listTasks({
      agentId: id,
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      status: query.status,
      priority: query.priority,
      type: query.type,
    });

    return this.paginated(result.data, result.meta);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get agent performance metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getMetrics(@Param('id') id: string) {
    const agent = await this.agentsService.findById(id);

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return this.success({
      agentId: agent.id.value,
      agentName: agent.name,
      status: agent.status,
      metrics: agent.metrics || {
        tasksCompleted: 0,
        averageExecutionTime: 0,
        successRate: 100,
      },
    });
  }
}
