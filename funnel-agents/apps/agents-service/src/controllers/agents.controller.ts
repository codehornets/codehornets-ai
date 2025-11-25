import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from '@funnelagents/application';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentResponseDto,
  AgentFilterDto,
  PaginationDto,
  ApiResponseDto,
  ExecuteAgentDto,
  AgentExecutionResultDto,
  AgentInvocationDto,
  ExecutionStatus,
} from '@funnelagents/interfaces';

@Controller('agents')
@ApiTags('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all agents' })
  @ApiResponse({ status: 200, description: 'Agents list retrieved successfully' })
  @MessagePattern({ cmd: 'agents.list' })
  async findAll(
    @Query() filters: AgentFilterDto,
    @Query() pagination: PaginationDto
  ): Promise<ApiResponseDto<AgentResponseDto[]>> {
    try {
      const agentFilters: any = {};

      if (filters.domain) {
        agentFilters.domain = filters.domain;
      }

      if (filters.status) {
        agentFilters.status = filters.status;
      }

      if (filters.skill) {
        agentFilters.skills = [filters.skill];
      }

      const result = await this.agentsService.findWithFilters(agentFilters, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      });

      const responseData = result.data.map((agent) => this.toResponseDto(agent));

      return {
        success: true,
        data: responseData,
        meta: result.meta,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'FETCH_ERROR', message } },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @MessagePattern({ cmd: 'agents.get' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<AgentResponseDto>> {
    try {
      const agent = await this.agentsService.findById(id);

      if (!agent) {
        throw new HttpException(
          { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: this.toResponseDto(agent),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'FETCH_ERROR', message } },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @MessagePattern({ cmd: 'agents.create' })
  async create(@Body() createDto: CreateAgentDto): Promise<ApiResponseDto<AgentResponseDto>> {
    try {
      const agent = await this.agentsService.create({
        name: createDto.name,
        type: createDto.type || ('custom' as any),
        domain: createDto.domain as any,
        description: createDto.description,
        capabilities: createDto.skills.map((skill) => ({
          name: skill,
          description: skill,
        })),
        tools: createDto.tools || [],
        config: {
          model: createDto.model,
          systemPrompt: createDto.prompt_template,
          ...(createDto.settings || {}),
        },
      });

      return {
        success: true,
        data: this.toResponseDto(agent),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'CREATE_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @MessagePattern({ cmd: 'agents.update' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgentDto
  ): Promise<ApiResponseDto<AgentResponseDto>> {
    try {
      const agent = await this.agentsService.findById(id);

      if (!agent) {
        throw new HttpException(
          { success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } },
          HttpStatus.NOT_FOUND
        );
      }

      if (updateDto.settings) {
        await this.agentsService.updateConfig(id, updateDto.settings);
      }

      if (updateDto.status === 'active') {
        await this.agentsService.activate(id);
      } else if (updateDto.status === 'inactive') {
        await this.agentsService.deactivate(id);
      }

      const updatedAgent = await this.agentsService.findById(id);

      return {
        success: true,
        data: this.toResponseDto(updatedAgent!),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'UPDATE_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @MessagePattern({ cmd: 'agents.delete' })
  async delete(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    try {
      await this.agentsService.delete(id);

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'DELETE_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute agent task' })
  @ApiResponse({ status: 200, description: 'Agent execution completed' })
  @ApiResponse({ status: 400, description: 'Invalid execution request' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @MessagePattern({ cmd: 'agents.execute' })
  async executeAgent(
    @Param('id') id: string,
    @Body() executeDto: ExecuteAgentDto
  ): Promise<ApiResponseDto<AgentExecutionResultDto>> {
    try {
      const result = await this.agentsService.executeAgent(
        id,
        executeDto.input,
        executeDto.timeout
      );

      return {
        success: result.success,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'EXECUTION_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/execute/sync')
  @ApiOperation({ summary: 'Execute agent task synchronously' })
  @ApiResponse({ status: 200, description: 'Agent execution completed' })
  @MessagePattern({ cmd: 'agents.executeSync' })
  async executeAgentSync(
    @Param('id') id: string,
    @Body() executeDto: ExecuteAgentDto
  ): Promise<ApiResponseDto<AgentExecutionResultDto>> {
    try {
      const result = await this.agentsService.executeAgentSync(
        id,
        executeDto.input,
        executeDto.timeout
      );

      return {
        success: result.success,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'EXECUTION_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/execute/async')
  @ApiOperation({ summary: 'Queue agent task for async execution' })
  @ApiResponse({ status: 202, description: 'Agent execution queued' })
  @MessagePattern({ cmd: 'agents.executeAsync' })
  async executeAgentAsync(
    @Param('id') id: string,
    @Body() body: { input: Record<string, any>; callback_url?: string; timeout?: number }
  ): Promise<ApiResponseDto<{ execution_id: string; status: ExecutionStatus }>> {
    try {
      const result = await this.agentsService.executeAgentAsync(
        id,
        body.input,
        body.callback_url,
        body.timeout
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'EXECUTION_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private toResponseDto(agent: any): AgentResponseDto {
    return {
      id: agent.id.value,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      domain: agent.domain,
      status: agent.status,
      skills: agent.capabilities.map((c: any) => c.name),
      tools: agent.tools || [],
      success_rate: agent.metrics?.successRate,
      tasks_completed: agent.metrics?.tasksCompleted,
      avg_completion_time: agent.metrics?.averageExecutionTime,
      settings: agent.config,
      prompt_template: agent.config.systemPrompt,
      model: agent.config.model,
      created_at: agent.createdAt,
      updated_at: agent.updatedAt,
    };
  }
}
