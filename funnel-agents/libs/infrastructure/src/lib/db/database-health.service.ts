import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

export interface PoolStatistics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  timestamp: Date;
}

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    this.logger.log('Database Health Monitoring initialized');
    // Initial log
    await this.logPoolStatistics();
  }

  /**
   * Get current database connection pool statistics
   */
  async getPoolStatistics(): Promise<PoolStatistics> {
    try {
      const driver = this.connection.driver;

      // Access the underlying pool (for postgres)
      if (driver && (driver as any).master) {
        const pool = (driver as any).master;

        return {
          totalConnections: pool.totalCount || 0,
          idleConnections: pool.idleCount || 0,
          waitingClients: pool.waitingCount || 0,
          timestamp: new Date(),
        };
      }

      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get pool statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if database connection is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.connection.query('SELECT 1');
      return result !== null;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Log pool statistics
   * Call this manually or use @Cron decorator in your service module
   */
  async logPoolStatistics(): Promise<void> {
    try {
      const stats = await this.getPoolStatistics();
      this.logger.log(
        `Pool Stats - Total: ${stats.totalConnections}, ` +
        `Idle: ${stats.idleConnections}, ` +
        `Waiting: ${stats.waitingClients}`
      );

      // Warn if pool is near capacity
      if (stats.totalConnections >= 18) { // 90% of default max (20)
        this.logger.warn(
          `Connection pool nearing capacity: ${stats.totalConnections}/20 connections`
        );
      }

      // Warn if clients are waiting
      if (stats.waitingClients > 0) {
        this.logger.warn(
          `${stats.waitingClients} clients waiting for database connections`
        );
      }
    } catch (error: any) {
      this.logger.error(`Failed to log pool statistics: ${error.message}`);
    }
  }

  /**
   * Start automated monitoring (call every 5 minutes)
   * Use this in combination with @nestjs/schedule in your service
   */
  startAutomatedMonitoring(): void {
    // Services using this should call logPoolStatistics() via @Cron decorator
    this.logger.log('Automated pool monitoring available via logPoolStatistics()');
  }

  /**
   * Get detailed connection information
   */
  async getConnectionInfo(): Promise<{
    database: string;
    isConnected: boolean;
    driver: string;
    options: any;
  }> {
    return {
      database: this.connection.options.database as string,
      isConnected: this.connection.isConnected,
      driver: this.connection.options.type,
      options: {
        synchronize: this.connection.options.synchronize,
        logging: this.connection.options.logging,
        maxQueryExecutionTime: (this.connection.options as any).maxQueryExecutionTime,
        poolSize: (this.connection.options as any).extra?.max,
        minPoolSize: (this.connection.options as any).extra?.min,
      },
    };
  }
}
