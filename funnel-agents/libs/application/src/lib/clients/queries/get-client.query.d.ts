export declare class GetClientQuery {
    readonly id: string;
    constructor(id: string);
}
export declare class GetClientByEmailQuery {
    readonly email: string;
    constructor(email: string);
}
export interface ClientDto {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    status: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
