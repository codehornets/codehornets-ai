import { ConfigService } from '@nestjs/config';
export interface StorageProvider {
    upload(file: Buffer, filename: string, mimetype: string): Promise<{
        url: string;
        path: string;
    }>;
    delete(filePath: string): Promise<void>;
    getUrl(filename: string): string;
}
export declare class LocalStorageProvider implements StorageProvider {
    private readonly configService;
    private readonly uploadDir;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    upload(file: Buffer, filename: string, mimetype: string): Promise<{
        url: string;
        path: string;
    }>;
    delete(filePath: string): Promise<void>;
    getUrl(filename: string): string;
}
export declare class StorageService {
    private readonly configService;
    private readonly localProvider;
    private provider;
    constructor(configService: ConfigService, localProvider: LocalStorageProvider);
    uploadFile(file: Buffer, filename: string, mimetype: string): Promise<{
        url: string;
        path: string;
    }>;
    deleteFile(filePath: string): Promise<void>;
    getFileUrl(filename: string): string;
    generateThumbnail(file: Buffer, filename: string, width?: number, height?: number): Promise<{
        url: string;
        path: string;
    } | null>;
    isImageFile(mimetype: string): boolean;
    isVideoFile(mimetype: string): boolean;
    isDocumentFile(mimetype: string): boolean;
    getAllowedMimeTypes(): string[];
    validateFileType(mimetype: string): boolean;
    validateFileSize(size: number, maxSize?: number): boolean;
}
