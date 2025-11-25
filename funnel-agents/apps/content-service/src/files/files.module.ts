import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File } from './entities/file.entity';
import {
  StorageService,
  LocalStorageProvider,
} from './services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([File]), ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, StorageService, LocalStorageProvider],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
