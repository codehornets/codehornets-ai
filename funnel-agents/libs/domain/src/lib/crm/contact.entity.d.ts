import { AggregateRoot, UniqueId, Email } from '../shared-kernel';
import { ContactStatus, LeadSource, ContactAddress, ContactInteraction } from './crm.types';
export interface ContactProps {
    firstName: string;
    lastName: string;
    email: Email;
    phone?: string;
    company?: string;
    jobTitle?: string;
    status: ContactStatus;
    source: LeadSource;
    address?: ContactAddress;
    tags?: string[];
    score?: number;
    interactions?: ContactInteraction[];
    customFields?: Record<string, unknown>;
}
export declare class Contact extends AggregateRoot<ContactProps> {
    private constructor();
    get firstName(): string;
    get lastName(): string;
    get fullName(): string;
    get email(): Email;
    get phone(): string | undefined;
    get company(): string | undefined;
    get jobTitle(): string | undefined;
    get status(): ContactStatus;
    get source(): LeadSource;
    get address(): ContactAddress | undefined;
    get tags(): string[];
    get score(): number;
    get interactions(): ContactInteraction[];
    static create(props: Omit<ContactProps, 'status' | 'interactions'> & {
        status?: ContactStatus;
    }, id?: UniqueId): Contact;
    static reconstitute(props: ContactProps, id: UniqueId): Contact;
    updateStatus(status: ContactStatus): void;
    addInteraction(interaction: Omit<ContactInteraction, 'id' | 'timestamp'>): void;
    updateScore(score: number): void;
    addTag(tag: string): void;
    removeTag(tag: string): void;
}
