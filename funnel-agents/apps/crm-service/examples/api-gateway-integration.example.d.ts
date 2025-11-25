/**
 * CRM Service Integration Examples for API Gateway
 *
 * This file demonstrates how to integrate the CRM Service
 * with the API Gateway using NestJS microservices.
 */
import { ClientProxy } from '@nestjs/microservices';
declare class CreateWorkspaceDto {
    name: string;
    description?: string;
    status?: 'active' | 'inactive' | 'archived';
}
declare class CreateLeadDto {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    source?: string;
}
/**
 * Example Workspaces Controller in API Gateway
 */
export declare class WorkspacesController {
    private readonly crmClient;
    constructor(crmClient: ClientProxy);
    getAllWorkspaces(): Promise<any>;
    getWorkspace(id: string): Promise<any>;
    createWorkspace(createDto: CreateWorkspaceDto): Promise<any>;
    updateWorkspace(id: string, updateDto: Partial<CreateWorkspaceDto>): Promise<any>;
    deleteWorkspace(id: string): Promise<any>;
    onboardWorkspace(id: string, onboardData: any): Promise<any>;
}
/**
 * Example Leads Controller in API Gateway
 */
export declare class LeadsController {
    private readonly crmClient;
    constructor(crmClient: ClientProxy);
    getAllLeads(status?: string, source?: string, minScore?: number, maxScore?: number, search?: string, page?: number, limit?: number): Promise<any>;
    getLead(id: string): Promise<any>;
    createLead(createDto: CreateLeadDto): Promise<any>;
    updateLead(id: string, updateDto: Partial<CreateLeadDto>): Promise<any>;
    deleteLead(id: string): Promise<any>;
    qualifyLead(id: string): Promise<any>;
    convertLead(id: string): Promise<any>;
}
/**
 * Example Lead Activities Controller in API Gateway
 */
export declare class LeadActivitiesController {
    private readonly crmClient;
    constructor(crmClient: ClientProxy);
    getAllActivities(lead_id?: string, type?: string, page?: number, limit?: number): Promise<any>;
    getActivitiesByLead(leadId: string): Promise<any>;
    createActivity(createDto: any): Promise<any>;
}
/**
 * Example Deals Controller in API Gateway
 */
export declare class DealsController {
    private readonly crmClient;
    constructor(crmClient: ClientProxy);
    getAllDeals(stage?: string, workspace_id?: string, contact_id?: string, page?: number, limit?: number): Promise<any>;
    createDeal(createDto: any): Promise<any>;
    updateDealStage(id: string, stage: string): Promise<any>;
}
export declare class CrmGatewayModule {
}
/**
 * Usage Examples in Services
 */
export declare class ExampleUsageService {
    private readonly crmClient;
    constructor(crmClient: ClientProxy);
    /**
     * Example: Create a lead and track the activity
     */
    createLeadWithActivity(leadData: CreateLeadDto): Promise<any>;
    /**
     * Example: Qualify a lead and create a deal if qualified
     */
    qualifyAndCreateDeal(leadId: string, workspaceId: string): Promise<{
        lead: any;
        deal: any;
    }>;
    /**
     * Example: Get lead pipeline statistics
     */
    getLeadPipelineStats(): Promise<{
        status: string;
        count: any;
    }[]>;
}
/**
 * Example: Error Handling
 */
export declare class ErrorHandlingExample {
    private readonly crmClient;
    constructor(crmClient: ClientProxy);
    getLeadSafely(id: string): Promise<any>;
}
export {};
