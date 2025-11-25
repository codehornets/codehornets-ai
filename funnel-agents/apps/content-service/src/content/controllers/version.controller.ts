import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { VersionService } from '../services/version.service';
import {
  CreateVersionDto,
  VersionCompareDto,
  RollbackVersionDto,
} from '../dto/version.dto';

@Controller('content/:contentId/versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createVersion(
    @Param('contentId') contentId: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.versionService.createVersion(
      contentId,
      dto.change_summary,
      dto.changed_by,
    );
  }

  @Get()
  async getVersionHistory(@Param('contentId') contentId: string) {
    return this.versionService.getVersionHistory(contentId);
  }

  @Get(':versionId')
  async getVersion(@Param('versionId') versionId: string) {
    return this.versionService.getVersion(versionId);
  }

  @Post('compare')
  @UsePipes(new ValidationPipe({ transform: true }))
  async compareVersions(@Body() dto: VersionCompareDto) {
    return this.versionService.compareVersions(
      dto.version1_id,
      dto.version2_id,
    );
  }

  @Post('rollback')
  @UsePipes(new ValidationPipe({ transform: true }))
  async rollbackToVersion(
    @Param('contentId') contentId: string,
    @Body() dto: RollbackVersionDto,
  ) {
    return this.versionService.rollbackToVersion(
      contentId,
      dto.version_id,
      dto.rollback_reason,
    );
  }

  @Delete(':versionId')
  async deleteVersion(@Param('versionId') versionId: string) {
    await this.versionService.deleteVersion(versionId);
    return { success: true };
  }
}
