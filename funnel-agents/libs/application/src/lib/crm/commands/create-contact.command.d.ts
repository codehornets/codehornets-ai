import { LeadSource } from '@funnelagents/domain';
export declare class CreateContactCommand {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly source: LeadSource;
    readonly phone?: string | undefined;
    readonly company?: string | undefined;
    readonly jobTitle?: string | undefined;
    readonly tags?: string[] | undefined;
    constructor(firstName: string, lastName: string, email: string, source: LeadSource, phone?: string | undefined, company?: string | undefined, jobTitle?: string | undefined, tags?: string[] | undefined);
}
export interface CreateContactResult {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    source: LeadSource;
    createdAt: Date;
}
