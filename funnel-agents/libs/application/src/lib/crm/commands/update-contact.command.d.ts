import { ContactStatus } from '@funnelagents/domain';
export declare class UpdateContactCommand {
    readonly id: string;
    readonly firstName?: string | undefined;
    readonly lastName?: string | undefined;
    readonly phone?: string | undefined;
    readonly company?: string | undefined;
    readonly jobTitle?: string | undefined;
    readonly status?: ContactStatus | undefined;
    readonly score?: number | undefined;
    readonly tags?: string[] | undefined;
    constructor(id: string, firstName?: string | undefined, lastName?: string | undefined, phone?: string | undefined, company?: string | undefined, jobTitle?: string | undefined, status?: ContactStatus | undefined, score?: number | undefined, tags?: string[] | undefined);
}
export interface UpdateContactResult {
    id: string;
    fullName: string;
    status: string;
    score: number;
    updatedAt: Date;
}
