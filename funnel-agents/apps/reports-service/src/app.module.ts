import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const url = new URL(databaseUrl || 'postgresql://user:password@localhost:5432/funnel_agents');

        return {
          type: 'postgres',
          host: url.hostname,
          port: parseInt(url.port, 10) || 5432,
          username: url.username,
          password: url.password,
          database: url.pathname.substring(1),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
