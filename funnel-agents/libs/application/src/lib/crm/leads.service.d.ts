import { Repository } from 'typeorm';
import { Lead, PaginationParams, PaginatedResult } from '@funnelagents/domain';
export interface LeadFilters {
    status?: string;
    source?: string;
    minScore?: number;
    maxScore?: number;
    campaignId?: string;
    search?: string;
}
export interface LeadActivitiesFilters {
    type?: string;
    fromDate?: Date;
    toDate?: Date;
}
export interface LeadScoreHistory {
    timestamp: Date;
    score: number;
    reason?: string;
}
export declare class LeadsService {
    private readonly leadsRepository;
    constructor(leadsRepository: Repository<Lead>);
    findById(id: string): Promise<Lead | null>;
    findByEmail(email: string): Promise<Lead | null>;
    findAll(filters?: LeadFilters, params?: PaginationParams): Promise<PaginatedResult<Lead>>;
    create(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        company?: string;
        jobTitle?: string;
        source: string;
        status?: string;
        score?: number;
        metadata?: Record<string, any>;
        tags?: string[];
        campaignId?: string;
    }): Promise<Lead>;
    update(id: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        company?: string;
        jobTitle?: string;
        status?: string;
        score?: number;
        metadata?: Record<string, any>;
        tags?: string[];
        isQualified?: boolean;
    }): Promise<Lead>;
    delete(id: string): Promise<void>;
    qualify(id: string, data: {
        score: number;
        notes?: string;
        qualifiedBy?: string;
    }): Promise<Lead>;
    convert(id: string): Promise<Lead>;
    getActivities(id: string, filters?: LeadActivitiesFilters, params?: PaginationParams): Promise<PaginatedResult<any>>;
    getScoreHistory(id: string): Promise<LeadScoreHistory[]>;
    bulkImport(leads: Array<{
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        company?: string;
        jobTitle?: string;
        source: string;
        metadata?: Record<string, any>;
        tags?: string[];
    }>): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    export(filters?: LeadFilters): Promise<Lead[]>;
}
