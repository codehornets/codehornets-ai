export declare class CreateClientCommand {
    readonly name: string;
    readonly email: string;
    readonly company?: string | undefined;
    readonly phone?: string | undefined;
    readonly metadata?: Record<string, unknown> | undefined;
    constructor(name: string, email: string, company?: string | undefined, phone?: string | undefined, metadata?: Record<string, unknown> | undefined);
}
export interface CreateClientResult {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    createdAt: Date;
}
