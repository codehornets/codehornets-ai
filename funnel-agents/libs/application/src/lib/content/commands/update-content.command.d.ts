export declare class UpdateContentCommand {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly notes?: string | undefined;
    constructor(id: string, title: string, body: string, notes?: string | undefined);
}
export interface UpdateContentResult {
    id: string;
    title: string;
    version: number;
    updatedAt: Date;
}
