import { PaginationParams } from '@funnelagents/domain';
export declare class ListClientsQuery {
    readonly filters?: {
        status?: string;
        company?: string;
        search?: string;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        status?: string;
        company?: string;
        search?: string;
    } | undefined, pagination?: PaginationParams | undefined);
}
export interface ClientListDto {
    id: string;
    name: string;
    email: string;
    company?: string;
    status: string;
    createdAt: Date;
}
