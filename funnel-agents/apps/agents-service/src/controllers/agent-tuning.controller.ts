import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AgentTuningService } from '@funnelagents/application';
import {
  CreateAgentTuningDto,
  UpdateAgentTuningDto,
  AgentTuningResponseDto,
  AgentTuningFilterDto,
  PaginationDto,
  ApiResponseDto,
} from '@funnelagents/interfaces';
import { TuningType } from '@funnelagents/domain';

@Controller('agents/tuning')
@ApiTags('agent-tuning')
export class AgentTuningController {
  constructor(private readonly tuningService: AgentTuningService) {}

  @Get()
  @ApiOperation({ summary: 'List all tuning records' })
  @ApiResponse({ status: 200, description: 'Tuning records retrieved successfully' })
  @MessagePattern({ cmd: 'agent.tuning.list' })
  async findAll(
    @Query() filters: AgentTuningFilterDto,
    @Query() pagination: PaginationDto
  ): Promise<ApiResponseDto<AgentTuningResponseDto[]>> {
    try {
      const tuningFilters: any = {};

      if (filters.agent_id) {
        tuningFilters.agentId = filters.agent_id;
      }

      if (filters.tuning_type) {
        tuningFilters.tuningType = filters.tuning_type;
      }

      if (filters.applied_only !== undefined) {
        tuningFilters.appliedOnly = filters.applied_only;
      }

      const result = await this.tuningService.findWithFilters(tuningFilters, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      });

      const responseData = result.data.map((tuning) => this.toResponseDto(tuning));

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
  @ApiOperation({ summary: 'Get tuning record by ID' })
  @ApiResponse({ status: 200, description: 'Tuning record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tuning record not found' })
  @MessagePattern({ cmd: 'agent.tuning.get' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<AgentTuningResponseDto>> {
    try {
      const tuning = await this.tuningService.findById(id);

      if (!tuning) {
        throw new HttpException(
          { success: false, error: { code: 'NOT_FOUND', message: 'Tuning record not found' } },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: this.toResponseDto(tuning),
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
  @ApiOperation({ summary: 'Create tuning record' })
  @ApiResponse({ status: 201, description: 'Tuning record created successfully' })
  @MessagePattern({ cmd: 'agent.tuning.create' })
  async create(
    @Body() createDto: CreateAgentTuningDto
  ): Promise<ApiResponseDto<AgentTuningResponseDto>> {
    try {
      const tuning = await this.tuningService.create({
        agentId: createDto.agent_id,
        tuningType: createDto.tuning_type as TuningType,
        beforeValue: createDto.before_value,
        afterValue: createDto.after_value,
        performanceDelta: createDto.performance_delta,
        notes: createDto.notes,
      });

      return {
        success: true,
        data: this.toResponseDto(tuning),
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
  @ApiOperation({ summary: 'Update tuning record' })
  @ApiResponse({ status: 200, description: 'Tuning record updated successfully' })
  @ApiResponse({ status: 404, description: 'Tuning record not found' })
  @MessagePattern({ cmd: 'agent.tuning.update' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgentTuningDto
  ): Promise<ApiResponseDto<AgentTuningResponseDto>> {
    try {
      const tuning = await this.tuningService.update(id, {
        performanceDelta: updateDto.performance_delta,
        notes: updateDto.notes,
        apply: updateDto.apply,
      });

      return {
        success: true,
        data: this.toResponseDto(tuning),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'UPDATE_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private toResponseDto(tuning: any): AgentTuningResponseDto {
    return {
      id: tuning.id.value,
      agent_id: tuning.agentId,
      tuning_type: tuning.tuningType,
      before_value: tuning.beforeValue,
      after_value: tuning.afterValue,
      performance_delta: tuning.performanceDelta,
      notes: tuning.notes,
      applied_at: tuning.appliedAt,
      created_at: tuning.createdAt,
    };
  }
}
