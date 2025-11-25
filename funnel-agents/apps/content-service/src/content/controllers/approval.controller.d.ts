import { ApprovalService } from '../services/approval.service';
import { CreateApprovalDto, UpdateApprovalDto, AssignReviewersDto } from '../dto/approval.dto';
export declare class ApprovalController {
    private readonly approvalService;
    constructor(approvalService: ApprovalService);
    createApproval(dto: CreateApprovalDto): Promise<import("../entities/content-approval.entity").ContentApproval>;
    assignReviewers(contentId: string, dto: AssignReviewersDto): Promise<import("../entities/content-approval.entity").ContentApproval[]>;
    updateApprovalStatus(approvalId: string, dto: UpdateApprovalDto): Promise<import("../entities/content-approval.entity").ContentApproval>;
    getContentApprovals(contentId: string): Promise<import("../entities/content-approval.entity").ContentApproval[]>;
    checkApprovalStatus(contentId: string): Promise<{
        all_approved: boolean;
        pending_count: number;
        approved_count: number;
        rejected_count: number;
        changes_requested_count: number;
    }>;
    getReviewerApprovals(reviewerId: string): Promise<import("../entities/content-approval.entity").ContentApproval[]>;
    getPendingApprovals(reviewerId?: string): Promise<import("../entities/content-approval.entity").ContentApproval[]>;
    deleteApproval(approvalId: string): Promise<{
        success: boolean;
    }>;
}
