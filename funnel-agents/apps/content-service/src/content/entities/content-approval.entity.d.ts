import { Content } from './content.entity';
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CHANGES_REQUESTED = "changes_requested"
}
export declare class ContentApproval {
    id: string;
    content_id: string;
    content: Content;
    reviewer_id: string;
    status: ApprovalStatus;
    comments?: string;
    approval_step: number;
    reviewed_at?: Date;
    created_at: Date;
    updated_at: Date;
}
