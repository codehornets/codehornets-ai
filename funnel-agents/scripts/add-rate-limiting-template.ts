/**
 * Template code for adding rate limiting to a service
 *
 * Add these imports to app.module.ts:
 */

// Imports to add:
/*
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from '../../../libs/shared/src/rate-limiting/custom-throttler.guard';
import { createThrottlerConfig, getRedisUrl } from '../../../libs/shared/src/rate-limiting/throttler.config';
*/

// Add to imports array (after ConfigModule):
/*
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisUrl = getRedisUrl();
    const useRedis = !!redisUrl && configService.get('NODE_ENV') !== 'test';
    return createThrottlerConfig(useRedis, redisUrl);
  },
}),
*/

// Add to providers array:
/*
{
  provide: APP_GUARD,
  useClass: CustomThrottlerGuard,
},
*/

export const template = 'Use the comments above as a template';
