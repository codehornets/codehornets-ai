import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApprovalService } from '../services/approval.service';
import {
  CreateApprovalDto,
  UpdateApprovalDto,
  AssignReviewersDto,
} from '../dto/approval.dto';

@Controller('content')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post('approvals')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createApproval(@Body() dto: CreateApprovalDto) {
    return this.approvalService.createApproval(dto);
  }

  @Post(':contentId/assign-reviewers')
  @UsePipes(new ValidationPipe({ transform: true }))
  async assignReviewers(
    @Param('contentId') contentId: string,
    @Body() dto: AssignReviewersDto,
  ) {
    return this.approvalService.assignReviewers(contentId, dto);
  }

  @Patch('approvals/:approvalId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateApprovalStatus(
    @Param('approvalId') approvalId: string,
    @Body() dto: UpdateApprovalDto,
  ) {
    return this.approvalService.updateApprovalStatus(approvalId, dto);
  }

  @Get(':contentId/approvals')
  async getContentApprovals(@Param('contentId') contentId: string) {
    return this.approvalService.getContentApprovals(contentId);
  }

  @Get(':contentId/approval-status')
  async checkApprovalStatus(@Param('contentId') contentId: string) {
    return this.approvalService.checkApprovalStatus(contentId);
  }

  @Get('reviewers/:reviewerId/approvals')
  async getReviewerApprovals(@Param('reviewerId') reviewerId: string) {
    return this.approvalService.getReviewerApprovals(reviewerId);
  }

  @Get('approvals/pending')
  async getPendingApprovals(@Query('reviewer_id') reviewerId?: string) {
    return this.approvalService.getPendingApprovals(reviewerId);
  }

  @Delete('approvals/:approvalId')
  async deleteApproval(@Param('approvalId') approvalId: string) {
    await this.approvalService.deleteApproval(approvalId);
    return { success: true };
  }
}
