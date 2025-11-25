import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { AuditLog } from './entities/audit-log.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditLogService } from './services/audit-log.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from './services/email.service';
import { PasswordResetService } from './services/password-reset.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'FATAL: JWT_SECRET environment variable is required but not set. ' +
            'Please set JWT_SECRET in your environment variables before starting the service.',
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: '15m',
          },
        };
      },
    }),
    TypeOrmModule.forFeature([
      User,
      PasswordResetToken,
      TokenBlacklist,
      AuditLog,
      LoginAttempt,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuditLogService,
    TokenBlacklistService,
    EmailService,
    PasswordResetService,
    AccountLockoutService,
    RolesGuard,
    Reflector,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
