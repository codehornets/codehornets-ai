import { Repository } from 'typeorm';
import { ContentApproval } from '../entities/content-approval.entity';
import { Content } from '../entities/content.entity';
import { CreateApprovalDto, UpdateApprovalDto, AssignReviewersDto } from '../dto/approval.dto';
export declare class ApprovalService {
    private readonly approvalRepository;
    private readonly contentRepository;
    constructor(approvalRepository: Repository<ContentApproval>, contentRepository: Repository<Content>);
    createApproval(dto: CreateApprovalDto): Promise<ContentApproval>;
    assignReviewers(contentId: string, dto: AssignReviewersDto): Promise<ContentApproval[]>;
    updateApprovalStatus(approvalId: string, dto: UpdateApprovalDto): Promise<ContentApproval>;
    getContentApprovals(contentId: string): Promise<ContentApproval[]>;
    getReviewerApprovals(reviewerId: string): Promise<ContentApproval[]>;
    getPendingApprovals(reviewerId?: string): Promise<ContentApproval[]>;
    checkApprovalStatus(contentId: string): Promise<{
        all_approved: boolean;
        pending_count: number;
        approved_count: number;
        rejected_count: number;
        changes_requested_count: number;
    }>;
    deleteApproval(approvalId: string): Promise<void>;
}
