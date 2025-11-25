export declare class Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    type: 'lead' | 'client' | 'partner' | 'other';
    workspaceId?: string;
    linkedinUrl?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
