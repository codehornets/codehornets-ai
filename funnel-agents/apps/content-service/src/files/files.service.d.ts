import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { StorageService } from './services/storage.service';
export declare class FilesService {
    private readonly fileRepository;
    private readonly storageService;
    constructor(fileRepository: Repository<File>, storageService: StorageService);
    saveFile(file: any, workspace_id?: string, uploaded_by?: string): Promise<File>;
    findOne(id: string): Promise<File | null>;
    findByFilename(filename: string): Promise<File | null>;
    getFilePath(filename: string): string;
    delete(id: string): Promise<void>;
}
