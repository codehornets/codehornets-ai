export declare enum LeadStatus {
    NEW = "new",
    QUALIFIED = "qualified",
    CONTACTED = "contacted",
    NURTURING = "nurturing",
    CONVERTED = "converted",
    LOST = "lost"
}
export declare enum LeadSource {
    WEBSITE = "website",
    REFERRAL = "referral",
    SOCIAL_MEDIA = "social_media",
    EMAIL_CAMPAIGN = "email_campaign",
    COLD_OUTREACH = "cold_outreach",
    EVENT = "event",
    OTHER = "other"
}
export declare class CreateLeadDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source: LeadSource;
    status?: LeadStatus;
    score?: number;
    metadata?: Record<string, any>;
    tags?: string[];
    campaignId?: string;
}
export declare class UpdateLeadDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    status?: LeadStatus;
    score?: number;
    metadata?: Record<string, any>;
    tags?: string[];
    isQualified?: boolean;
}
export declare class LeadQueryDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: LeadStatus;
    source?: LeadSource;
    campaignId?: string;
    minScore?: number;
    search?: string;
}
export declare class QualifyLeadDto {
    score: number;
    notes?: string;
    qualifiedBy?: string;
}
