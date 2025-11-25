export declare class FilterContactDto {
    type?: 'lead' | 'client' | 'partner' | 'other';
    workspace_id?: string;
    search?: string;
    page?: number;
    limit?: number;
}
