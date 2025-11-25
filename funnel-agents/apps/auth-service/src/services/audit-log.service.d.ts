import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
export interface AuditLogParams {
    user_id?: string;
    email: string;
    action: AuditAction;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
    error_message?: string;
}
export declare class AuditLogService {
    private auditLogRepository;
    private readonly logger;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(params: AuditLogParams): Promise<void>;
    getUserAuditLogs(user_id: string, limit?: number): Promise<AuditLog[]>;
    getAllAuditLogs(limit?: number, offset?: number): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    getAuditLogsByAction(action: AuditAction, limit?: number): Promise<AuditLog[]>;
}
