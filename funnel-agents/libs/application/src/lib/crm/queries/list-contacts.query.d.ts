import { PaginationParams, ContactStatus, LeadSource } from '@funnelagents/domain';
export declare class ListContactsQuery {
    readonly filters?: {
        status?: ContactStatus;
        source?: LeadSource;
        tags?: string[];
        search?: string;
        scoreMin?: number;
        scoreMax?: number;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        status?: ContactStatus;
        source?: LeadSource;
        tags?: string[];
        search?: string;
        scoreMin?: number;
        scoreMax?: number;
    } | undefined, pagination?: PaginationParams | undefined);
}
export interface ContactListDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    status: ContactStatus;
    score: number;
    createdAt: Date;
}
