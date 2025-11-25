import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { OnboardWorkspaceDto } from './dto/onboard-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
  ) {}

  async findAll(): Promise<Workspace[]> {
    return this.workspacesRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.workspacesRepository.findOne({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    return workspace;
  }

  async create(createWorkspaceDto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = this.workspacesRepository.create(createWorkspaceDto);
    return this.workspacesRepository.save(workspace);
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id);
    Object.assign(workspace, updateWorkspaceDto);
    return this.workspacesRepository.save(workspace);
  }

  async remove(id: string): Promise<void> {
    const workspace = await this.findOne(id);
    await this.workspacesRepository.remove(workspace);
  }

  async onboard(
    id: string,
    onboardWorkspaceDto: OnboardWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id);

    // AI onboarding logic would go here
    // For now, we'll just update the settings with onboarding data
    workspace.settings = {
      ...workspace.settings,
      onboarding: {
        completed: true,
        data: onboardWorkspaceDto.onboardingData,
        completedAt: new Date(),
      },
    };

    return this.workspacesRepository.save(workspace);
  }
}
