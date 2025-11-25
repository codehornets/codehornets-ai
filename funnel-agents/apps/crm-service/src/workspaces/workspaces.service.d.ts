import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { OnboardWorkspaceDto } from './dto/onboard-workspace.dto';
export declare class WorkspacesService {
    private workspacesRepository;
    constructor(workspacesRepository: Repository<Workspace>);
    findAll(): Promise<Workspace[]>;
    findOne(id: string): Promise<Workspace>;
    create(createWorkspaceDto: CreateWorkspaceDto): Promise<Workspace>;
    update(id: string, updateWorkspaceDto: UpdateWorkspaceDto): Promise<Workspace>;
    remove(id: string): Promise<void>;
    onboard(id: string, onboardWorkspaceDto: OnboardWorkspaceDto): Promise<Workspace>;
}
