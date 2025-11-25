import { ApprovalStatus } from '../entities/content-approval.entity';
export declare class CreateApprovalDto {
    content_id: string;
    reviewer_id: string;
    approval_step?: number;
}
export declare class UpdateApprovalDto {
    status: ApprovalStatus;
    comments?: string;
}
export declare class AssignReviewersDto {
    reviewer_ids: string[];
    approval_step?: number;
}
