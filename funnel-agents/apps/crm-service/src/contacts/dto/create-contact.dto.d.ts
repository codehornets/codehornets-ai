export declare class CreateContactDto {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    type?: 'lead' | 'client' | 'partner' | 'other';
    workspace_id?: string;
    linkedin_url?: string;
    notes?: string;
}
