import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Add feature modules here:
    // TaskEngineModule,
    // QueueModule,
    // TaskDefinitionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
