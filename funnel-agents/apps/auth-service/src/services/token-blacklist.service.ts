import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  async addToBlacklist(
    token: string,
    user_id: string,
    expires_at: Date,
  ): Promise<void> {
    try {
      const existingToken = await this.tokenBlacklistRepository.findOne({
        where: { token },
      });

      if (existingToken) {
        this.logger.warn(`Token already blacklisted: ${token.substring(0, 20)}...`);
        return;
      }

      const blacklistedToken = this.tokenBlacklistRepository.create({
        token,
        user_id,
        expires_at,
      });

      await this.tokenBlacklistRepository.save(blacklistedToken);
      this.logger.log(`Token blacklisted for user: ${user_id}`);
    } catch (error) {
      this.logger.error('Failed to blacklist token', error);
      throw error;
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });

    return !!blacklistedToken;
  }

  async removeFromBlacklist(token: string): Promise<void> {
    await this.tokenBlacklistRepository.delete({ token });
    this.logger.log(`Token removed from blacklist: ${token.substring(0, 20)}...`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.tokenBlacklistRepository.delete({
        expires_at: LessThan(now),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Cleaned up ${result.affected} expired tokens from blacklist`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }

  async getUserBlacklistedTokens(user_id: string): Promise<TokenBlacklist[]> {
    return this.tokenBlacklistRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
    });
  }
}
