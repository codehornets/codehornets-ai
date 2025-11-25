import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContentApproval,
  ApprovalStatus,
} from '../entities/content-approval.entity';
import { Content } from '../entities/content.entity';
import {
  CreateApprovalDto,
  UpdateApprovalDto,
  AssignReviewersDto,
} from '../dto/approval.dto';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ContentApproval)
    private readonly approvalRepository: Repository<ContentApproval>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async createApproval(dto: CreateApprovalDto): Promise<ContentApproval> {
    // Verify content exists
    const content = await this.contentRepository.findOne({
      where: { id: dto.content_id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${dto.content_id} not found`);
    }

    // Check if reviewer already has a pending approval for this content
    const existingApproval = await this.approvalRepository.findOne({
      where: {
        content_id: dto.content_id,
        reviewer_id: dto.reviewer_id,
        status: ApprovalStatus.PENDING,
      },
    });

    if (existingApproval) {
      throw new BadRequestException(
        'Reviewer already has a pending approval for this content',
      );
    }

    const approval = this.approvalRepository.create({
      ...dto,
      approval_step: dto.approval_step || 1,
    });

    return this.approvalRepository.save(approval);
  }

  async assignReviewers(
    contentId: string,
    dto: AssignReviewersDto,
  ): Promise<ContentApproval[]> {
    // Verify content exists
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    const approvals: ContentApproval[] = [];

    for (const reviewerId of dto.reviewer_ids) {
      const approval = await this.createApproval({
        content_id: contentId,
        reviewer_id: reviewerId,
        approval_step: dto.approval_step,
      });
      approvals.push(approval);
    }

    return approvals;
  }

  async updateApprovalStatus(
    approvalId: string,
    dto: UpdateApprovalDto,
  ): Promise<ContentApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new NotFoundException(`Approval with ID ${approvalId} not found`);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        'Can only update approvals with pending status',
      );
    }

    approval.status = dto.status;
    approval.comments = dto.comments;

    if (
      dto.status === ApprovalStatus.APPROVED ||
      dto.status === ApprovalStatus.REJECTED
    ) {
      approval.reviewed_at = new Date();
    }

    return this.approvalRepository.save(approval);
  }

  async getContentApprovals(contentId: string): Promise<ContentApproval[]> {
    return this.approvalRepository.find({
      where: { content_id: contentId },
      order: { approval_step: 'ASC', created_at: 'ASC' },
    });
  }

  async getReviewerApprovals(reviewerId: string): Promise<ContentApproval[]> {
    return this.approvalRepository.find({
      where: { reviewer_id: reviewerId },
      order: { created_at: 'DESC' },
      relations: ['content'],
    });
  }

  async getPendingApprovals(reviewerId?: string): Promise<ContentApproval[]> {
    const query = this.approvalRepository
      .createQueryBuilder('approval')
      .where('approval.status = :status', { status: ApprovalStatus.PENDING })
      .leftJoinAndSelect('approval.content', 'content')
      .orderBy('approval.created_at', 'ASC');

    if (reviewerId) {
      query.andWhere('approval.reviewer_id = :reviewerId', { reviewerId });
    }

    return query.getMany();
  }

  async checkApprovalStatus(contentId: string): Promise<{
    all_approved: boolean;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    changes_requested_count: number;
  }> {
    const approvals = await this.getContentApprovals(contentId);

    const pending = approvals.filter(
      (a) => a.status === ApprovalStatus.PENDING,
    ).length;
    const approved = approvals.filter(
      (a) => a.status === ApprovalStatus.APPROVED,
    ).length;
    const rejected = approvals.filter(
      (a) => a.status === ApprovalStatus.REJECTED,
    ).length;
    const changesRequested = approvals.filter(
      (a) => a.status === ApprovalStatus.CHANGES_REQUESTED,
    ).length;

    return {
      all_approved: approvals.length > 0 && pending === 0 && rejected === 0 && changesRequested === 0,
      pending_count: pending,
      approved_count: approved,
      rejected_count: rejected,
      changes_requested_count: changesRequested,
    };
  }

  async deleteApproval(approvalId: string): Promise<void> {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new NotFoundException(`Approval with ID ${approvalId} not found`);
    }

    await this.approvalRepository.remove(approval);
  }
}
