import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { VersionService } from './services/version.service';
export declare class ContentService {
    private readonly contentRepository;
    private readonly versionService;
    private readonly validTransitions;
    constructor(contentRepository: Repository<Content>, versionService: VersionService);
    create(createContentDto: CreateContentDto): Promise<Content>;
    findAll(query: QueryContentDto): Promise<{
        data: Content[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Content>;
    update(id: string, updateContentDto: UpdateContentDto): Promise<Content>;
    updateStatus(id: string, updateStatusDto: UpdateStatusDto): Promise<Content>;
    remove(id: string): Promise<void>;
}
