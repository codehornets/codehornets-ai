import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DistributedLockService } from './distributed-lock.service';

/**
 * Global module for distributed locking
 * Provides Redis-based distributed locks for multi-instance deployments
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [DistributedLockService],
  exports: [DistributedLockService],
})
export class DistributedLockModule {}
