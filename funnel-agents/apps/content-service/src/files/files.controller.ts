import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Query('workspace_id') workspace_id?: string,
    @Query('uploaded_by') uploaded_by?: string,
  ) {
    const savedFile = await this.filesService.saveFile(
      file,
      workspace_id,
      uploaded_by,
    );

    return {
      id: savedFile.id,
      url: savedFile.url,
      filename: savedFile.original_name,
      mimetype: savedFile.mimetype,
      size: savedFile.size,
    };
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const file = await this.filesService.findByFilename(filename);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = this.filesService.getFilePath(filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
