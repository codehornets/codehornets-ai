import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import {
  ContentApproval,
  ApprovalStatus,
} from '../entities/content-approval.entity';
import { Content } from '../entities/content.entity';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let approvalRepository: Repository<ContentApproval>;
  let contentRepository: Repository<Content>;

  const mockApprovalRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockContentRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        {
          provide: getRepositoryToken(ContentApproval),
          useValue: mockApprovalRepository,
        },
        {
          provide: getRepositoryToken(Content),
          useValue: mockContentRepository,
        },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    approvalRepository = module.get<Repository<ContentApproval>>(
      getRepositoryToken(ContentApproval),
    );
    contentRepository = module.get<Repository<Content>>(
      getRepositoryToken(Content),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApproval', () => {
    it('should create a new approval', async () => {
      const dto = {
        content_id: 'content-1',
        reviewer_id: 'user-1',
        approval_step: 1,
      };

      const content = { id: 'content-1' } as Content;
      const approval = {
        id: 'approval-1',
        ...dto,
        status: ApprovalStatus.PENDING,
      } as ContentApproval;

      mockContentRepository.findOne.mockResolvedValue(content);
      mockApprovalRepository.findOne.mockResolvedValue(null);
      mockApprovalRepository.create.mockReturnValue(approval);
      mockApprovalRepository.save.mockResolvedValue(approval);

      const result = await service.createApproval(dto);

      expect(result).toEqual(approval);
      expect(mockApprovalRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if content not found', async () => {
      const dto = {
        content_id: 'invalid-id',
        reviewer_id: 'user-1',
      };

      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.createApproval(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if reviewer already has pending approval', async () => {
      const dto = {
        content_id: 'content-1',
        reviewer_id: 'user-1',
      };

      const content = { id: 'content-1' } as Content;
      const existingApproval = {
        id: 'approval-1',
        status: ApprovalStatus.PENDING,
      } as ContentApproval;

      mockContentRepository.findOne.mockResolvedValue(content);
      mockApprovalRepository.findOne.mockResolvedValue(existingApproval);

      await expect(service.createApproval(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateApprovalStatus', () => {
    it('should update approval status', async () => {
      const approvalId = 'approval-1';
      const dto = {
        status: ApprovalStatus.APPROVED,
        comments: 'Looks good',
      };

      const approval = {
        id: approvalId,
        status: ApprovalStatus.PENDING,
      } as ContentApproval;

      mockApprovalRepository.findOne.mockResolvedValue(approval);
      mockApprovalRepository.save.mockResolvedValue({
        ...approval,
        ...dto,
        reviewed_at: expect.any(Date),
      });

      const result = await service.updateApprovalStatus(approvalId, dto);

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(result.reviewed_at).toBeDefined();
    });

    it('should throw BadRequestException if approval is not pending', async () => {
      const approvalId = 'approval-1';
      const dto = {
        status: ApprovalStatus.APPROVED,
      };

      const approval = {
        id: approvalId,
        status: ApprovalStatus.APPROVED,
      } as ContentApproval;

      mockApprovalRepository.findOne.mockResolvedValue(approval);

      await expect(
        service.updateApprovalStatus(approvalId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkApprovalStatus', () => {
    it('should return approval status summary', async () => {
      const contentId = 'content-1';
      const approvals = [
        { status: ApprovalStatus.PENDING } as ContentApproval,
        { status: ApprovalStatus.APPROVED } as ContentApproval,
        { status: ApprovalStatus.APPROVED } as ContentApproval,
      ];

      mockApprovalRepository.find.mockResolvedValue(approvals);

      const result = await service.checkApprovalStatus(contentId);

      expect(result).toEqual({
        all_approved: false,
        pending_count: 1,
        approved_count: 2,
        rejected_count: 0,
        changes_requested_count: 0,
      });
    });
  });
});
