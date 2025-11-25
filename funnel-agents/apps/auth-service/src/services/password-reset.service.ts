import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly TOKEN_EXPIRY_HOURS = 1;

  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async createResetToken(user_id: string): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry time (1 hour from now)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Invalidate any existing tokens for this user
    await this.passwordResetTokenRepository.update(
      { user_id, used: false },
      { used: true },
    );

    // Create new token
    const resetToken = this.passwordResetTokenRepository.create({
      token,
      user_id,
      expires_at,
      used: false,
    });

    await this.passwordResetTokenRepository.save(resetToken);
    this.logger.log(`Password reset token created for user: ${user_id}`);

    return token;
  }

  async validateResetToken(token: string): Promise<string> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.used) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (new Date() > resetToken.expires_at) {
      throw new BadRequestException('Reset token has expired');
    }

    return resetToken.user_id;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.passwordResetTokenRepository.update({ token }, { used: true });
    this.logger.log(`Password reset token marked as used`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.passwordResetTokenRepository.delete({
        expires_at: LessThan(now),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Cleaned up ${result.affected} expired password reset tokens`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }
}
