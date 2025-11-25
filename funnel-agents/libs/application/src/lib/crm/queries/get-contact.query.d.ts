import { ContactStatus, LeadSource, ContactInteraction } from '@funnelagents/domain';
export declare class GetContactQuery {
    readonly id: string;
    constructor(id: string);
}
export declare class GetContactByEmailQuery {
    readonly email: string;
    constructor(email: string);
}
export interface ContactDto {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    status: ContactStatus;
    source: LeadSource;
    score: number;
    tags: string[];
    interactions: ContactInteraction[];
    createdAt: Date;
    updatedAt: Date;
}
