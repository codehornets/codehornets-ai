import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

export interface AuditLogParams {
  user_id?: string;
  email: string;
  action: AuditAction;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  error_message?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        user_id: params.user_id,
        email: params.email,
        action: params.action,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        metadata: params.metadata,
        success: params.success !== undefined ? params.success : true,
        error_message: params.error_message,
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.log(
        `Audit log created: ${params.action} for ${params.email}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  async getUserAuditLogs(
    user_id: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getAllAuditLogs(
    limit = 100,
    offset = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { logs, total };
  }

  async getAuditLogsByAction(
    action: AuditAction,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
