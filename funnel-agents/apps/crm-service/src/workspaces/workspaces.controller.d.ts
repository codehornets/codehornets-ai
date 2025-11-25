import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { OnboardWorkspaceDto } from './dto/onboard-workspace.dto';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    findAll(): Promise<import("./workspace.entity").Workspace[]>;
    findOne(id: string): Promise<import("./workspace.entity").Workspace>;
    create(createWorkspaceDto: CreateWorkspaceDto): Promise<import("./workspace.entity").Workspace>;
    update(payload: {
        id: string;
        data: UpdateWorkspaceDto;
    }): Promise<import("./workspace.entity").Workspace>;
    remove(id: string): Promise<void>;
    onboard(payload: {
        id: string;
        data: OnboardWorkspaceDto;
    }): Promise<import("./workspace.entity").Workspace>;
}
