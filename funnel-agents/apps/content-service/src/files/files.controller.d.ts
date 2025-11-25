import { Response } from 'express';
import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadFile(file: any, workspace_id?: string, uploaded_by?: string): Promise<{
        id: string;
        url: string;
        filename: string;
        mimetype: string;
        size: number;
    }>;
    getFile(filename: string, res: Response): Promise<void>;
}
