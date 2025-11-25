import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly ATTEMPT_WINDOW_MINUTES = 30;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
  ) {}

  async recordLoginAttempt(
    email: string,
    ip_address: string,
    success: boolean,
  ): Promise<void> {
    const loginAttempt = this.loginAttemptRepository.create({
      email,
      ip_address,
      success,
    });

    await this.loginAttemptRepository.save(loginAttempt);
    this.logger.log(
      `Login attempt recorded: ${email} - ${success ? 'success' : 'failed'}`,
    );
  }

  async checkAndLockAccount(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return false;
    }

    // Check if account is already locked
    if (user.locked_until && user.locked_until > new Date()) {
      return true;
    }

    // Count failed attempts in the last window
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - this.ATTEMPT_WINDOW_MINUTES,
    );

    const recentFailedAttempts = await this.loginAttemptRepository.count({
      where: {
        email,
        success: false,
        created_at: LessThan(windowStart),
      },
    });

    // Lock account if max attempts exceeded
    if (recentFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      const locked_until = new Date();
      locked_until.setMinutes(
        locked_until.getMinutes() + this.LOCKOUT_DURATION_MINUTES,
      );

      await this.userRepository.update(
        { id: user.id },
        {
          locked_until,
          failed_login_attempts: recentFailedAttempts,
        },
      );

      this.logger.warn(`Account locked for user: ${email} until ${locked_until}`);
      return true;
    }

    // Update failed attempts count
    await this.userRepository.update(
      { id: user.id },
      {
        failed_login_attempts: recentFailedAttempts,
      },
    );

    return false;
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.locked_until) {
      return false;
    }

    // Check if lockout period has expired
    if (user.locked_until <= new Date()) {
      // Unlock the account
      await this.unlockAccount(email);
      return false;
    }

    return true;
  }

  async unlockAccount(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return;
    }

    await this.userRepository.update(
      { id: user.id },
      {
        locked_until: null,
        failed_login_attempts: 0,
      },
    );

    this.logger.log(`Account unlocked for user: ${email}`);
  }

  async resetFailedAttempts(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return;
    }

    await this.userRepository.update(
      { id: user.id },
      {
        failed_login_attempts: 0,
      },
    );

    this.logger.log(`Failed attempts reset for user: ${email}`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldLoginAttempts(): Promise<void> {
    try {
      // Delete attempts older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.loginAttemptRepository.delete({
        created_at: LessThan(sevenDaysAgo),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Cleaned up ${result.affected} old login attempts`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old login attempts', error);
    }
  }
}
