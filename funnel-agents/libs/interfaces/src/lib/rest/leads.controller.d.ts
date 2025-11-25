import { BaseController } from './base.controller';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto, QualifyLeadDto } from '../dto/lead.dto';
import { LeadsService } from '@funnelagents/application';
export declare class LeadsController extends BaseController<any, CreateLeadDto, UpdateLeadDto> {
    private readonly leadsService;
    protected readonly service: any;
    constructor(leadsService: LeadsService);
    create(dto: CreateLeadDto): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        email: string;
        phone: string | undefined;
        company: string | undefined;
        jobTitle: any;
        source: string | undefined;
        status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
        score: number | undefined;
        scoreBreakdown: {
            icp_fit: number;
            engagement: number;
            recency: number;
            confidence: number;
        } | undefined;
        metadata: Record<string, any> | undefined;
        tags: string[] | undefined;
        campaignId: any;
        createdAt: any;
        updatedAt: any;
    }>>;
    findAll(query: LeadQueryDto): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        email: string;
        phone: string | undefined;
        company: string | undefined;
        jobTitle: any;
        source: string | undefined;
        status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
        score: number | undefined;
        scoreBreakdown: {
            icp_fit: number;
            engagement: number;
            recency: number;
            confidence: number;
        } | undefined;
        tags: string[] | undefined;
        campaignId: any;
        createdAt: any;
        updatedAt: any;
    }[]>>;
    findOne(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        email: string;
        phone: string | undefined;
        company: string | undefined;
        jobTitle: any;
        source: string | undefined;
        status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
        score: number | undefined;
        scoreBreakdown: {
            icp_fit: number;
            engagement: number;
            recency: number;
            confidence: number;
        } | undefined;
        metadata: Record<string, any> | undefined;
        tags: string[] | undefined;
        campaignId: any;
        createdAt: any;
        updatedAt: any;
    }>>;
    update(id: string, dto: UpdateLeadDto): Promise<import("./base.controller").ApiResponseWrapper<{
        id: string;
        name: string;
        email: string;
        phone: string | undefined;
        company: string | undefined;
        jobTitle: any;
        source: string | undefined;
        status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
        score: number | undefined;
        scoreBreakdown: {
            icp_fit: number;
            engagement: number;
            recency: number;
            confidence: number;
        } | undefined;
        metadata: Record<string, any> | undefined;
        tags: string[] | undefined;
        campaignId: any;
        createdAt: any;
        updatedAt: any;
    }>>;
    remove(id: string): Promise<void>;
    qualify(id: string, dto: QualifyLeadDto): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
        lead: {
            id: string;
            status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
            score: number | undefined;
            scoreBreakdown: {
                icp_fit: number;
                engagement: number;
                recency: number;
                confidence: number;
            } | undefined;
        };
    }>>;
    convert(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
        lead: {
            id: string;
            status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
            convertedAt: any;
        };
    }>>;
    getActivities(id: string, query: any): Promise<import("./base.controller").ApiResponseWrapper<any[]>>;
    getScoreHistory(id: string): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").LeadScoreHistory[]>>;
    bulkImport(dto: {
        leads: CreateLeadDto[];
    }): Promise<import("./base.controller").ApiResponseWrapper<{
        imported: number;
        skipped: number;
        errors: string[];
        message: string;
    }>>;
    export(query: LeadQueryDto): Promise<import("./base.controller").ApiResponseWrapper<{
        count: number;
        leads: {
            id: string;
            name: string;
            email: string;
            phone: string | undefined;
            company: string | undefined;
            jobTitle: any;
            source: string | undefined;
            status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
            score: number | undefined;
            tags: string[] | undefined;
            createdAt: any;
        }[];
    }>>;
}
