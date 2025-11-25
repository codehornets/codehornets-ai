import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryContentDto } from './dto/query-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern({ cmd: 'create_content' })
  async create(
    @Body() createContentDto: CreateContentDto,
    @Payload() payload?: CreateContentDto,
  ) {
    const dto = payload || createContentDto;
    return this.contentService.create(dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern({ cmd: 'find_all_content' })
  async findAll(
    @Query() query: QueryContentDto,
    @Payload() payload?: QueryContentDto,
  ) {
    const queryDto = payload || query;
    return this.contentService.findAll(queryDto);
  }

  @Get(':id')
  @MessagePattern({ cmd: 'find_one_content' })
  async findOne(@Param('id') id: string, @Payload() payload?: { id: string }) {
    const contentId = payload?.id || id;
    return this.contentService.findOne(contentId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern({ cmd: 'update_content' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
    @Payload() payload?: { id: string; data: UpdateContentDto },
  ) {
    const contentId = payload?.id || id;
    const dto = payload?.data || updateContentDto;
    return this.contentService.update(contentId, dto);
  }

  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern({ cmd: 'update_content_status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Payload() payload?: { id: string; data: UpdateStatusDto },
  ) {
    const contentId = payload?.id || id;
    const dto = payload?.data || updateStatusDto;
    return this.contentService.updateStatus(contentId, dto);
  }

  @Delete(':id')
  @MessagePattern({ cmd: 'delete_content' })
  async remove(@Param('id') id: string, @Payload() payload?: { id: string }) {
    const contentId = payload?.id || id;
    await this.contentService.remove(contentId);
    return { success: true };
  }
}
