import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { OnboardWorkspaceDto } from './dto/onboard-workspace.dto';

@Controller()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @MessagePattern({ cmd: 'workspace.findAll' })
  async findAll() {
    return this.workspacesService.findAll();
  }

  @MessagePattern({ cmd: 'workspace.findOne' })
  async findOne(@Payload() id: string) {
    return this.workspacesService.findOne(id);
  }

  @MessagePattern({ cmd: 'workspace.create' })
  async create(@Payload() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @MessagePattern({ cmd: 'workspace.update' })
  async update(
    @Payload() payload: { id: string; data: UpdateWorkspaceDto },
  ) {
    return this.workspacesService.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'workspace.remove' })
  async remove(@Payload() id: string) {
    return this.workspacesService.remove(id);
  }

  @MessagePattern({ cmd: 'workspace.onboard' })
  async onboard(
    @Payload() payload: { id: string; data: OnboardWorkspaceDto },
  ) {
    return this.workspacesService.onboard(payload.id, payload.data);
  }
}
