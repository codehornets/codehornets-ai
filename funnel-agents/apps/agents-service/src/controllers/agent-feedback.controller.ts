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
import { AgentFeedbackService } from '@funnelagents/application';
import {
  CreateAgentFeedbackDto,
  UpdateAgentFeedbackDto,
  AgentFeedbackResponseDto,
  AgentFeedbackFilterDto,
  PaginationDto,
  ApiResponseDto,
} from '@funnelagents/interfaces';
import { FeedbackType } from '@funnelagents/domain';

@Controller('agents/feedback')
@ApiTags('agent-feedback')
export class AgentFeedbackController {
  constructor(private readonly feedbackService: AgentFeedbackService) {}

  @Get()
  @ApiOperation({ summary: 'List all agent feedback' })
  @ApiResponse({ status: 200, description: 'Feedback list retrieved successfully' })
  @MessagePattern({ cmd: 'agent.feedback.list' })
  async findAll(
    @Query() filters: AgentFeedbackFilterDto,
    @Query() pagination: PaginationDto
  ): Promise<ApiResponseDto<AgentFeedbackResponseDto[]>> {
    try {
      const feedbackFilters: any = {};

      if (filters.agent_id) {
        feedbackFilters.agentId = filters.agent_id;
      }

      if (filters.task_id) {
        feedbackFilters.taskId = filters.task_id;
      }

      if (filters.feedback_type) {
        feedbackFilters.feedbackType = filters.feedback_type;
      }

      if (filters.min_rating !== undefined) {
        feedbackFilters.minRating = filters.min_rating;
      }

      if (filters.max_rating !== undefined) {
        feedbackFilters.maxRating = filters.max_rating;
      }

      const result = await this.feedbackService.findWithFilters(feedbackFilters, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      });

      const responseData = result.data.map((feedback) => this.toResponseDto(feedback));

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
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @MessagePattern({ cmd: 'agent.feedback.get' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<AgentFeedbackResponseDto>> {
    try {
      const feedback = await this.feedbackService.findById(id);

      if (!feedback) {
        throw new HttpException(
          { success: false, error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: this.toResponseDto(feedback),
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
  @ApiOperation({ summary: 'Create agent feedback' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @MessagePattern({ cmd: 'agent.feedback.create' })
  async create(
    @Body() createDto: CreateAgentFeedbackDto
  ): Promise<ApiResponseDto<AgentFeedbackResponseDto>> {
    try {
      const feedback = await this.feedbackService.create({
        agentId: createDto.agent_id,
        taskId: createDto.task_id,
        rating: createDto.rating,
        comment: createDto.comment,
        feedbackType: createDto.feedback_type as FeedbackType,
        createdBy: createDto.created_by,
      });

      return {
        success: true,
        data: this.toResponseDto(feedback),
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
  @ApiOperation({ summary: 'Update agent feedback' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @MessagePattern({ cmd: 'agent.feedback.update' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAgentFeedbackDto
  ): Promise<ApiResponseDto<AgentFeedbackResponseDto>> {
    try {
      const feedback = await this.feedbackService.update(id, {
        rating: updateDto.rating,
        comment: updateDto.comment,
      });

      return {
        success: true,
        data: this.toResponseDto(feedback),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        { success: false, error: { code: 'UPDATE_ERROR', message } },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private toResponseDto(feedback: any): AgentFeedbackResponseDto {
    return {
      id: feedback.id.value,
      agent_id: feedback.agentId,
      task_id: feedback.taskId,
      rating: feedback.rating,
      comment: feedback.comment,
      feedback_type: feedback.feedbackType,
      created_by: feedback.createdBy,
      created_at: feedback.createdAt,
    };
  }
}
