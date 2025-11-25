export declare class UpdateClientCommand {
    readonly id: string;
    readonly name?: string | undefined;
    readonly email?: string | undefined;
    readonly company?: string | undefined;
    readonly phone?: string | undefined;
    readonly metadata?: Record<string, unknown> | undefined;
    constructor(id: string, name?: string | undefined, email?: string | undefined, company?: string | undefined, phone?: string | undefined, metadata?: Record<string, unknown> | undefined);
}
export interface UpdateClientResult {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    updatedAt: Date;
}
