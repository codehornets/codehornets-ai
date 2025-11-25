import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { IUnitOfWork } from '@funnelagents/domain';

@Injectable()
export class TransactionManager implements IUnitOfWork {
  private queryRunner: QueryRunner | null = null;

  constructor(private readonly dataSource: DataSource) {}

  async begin(): Promise<void> {
    if (this.queryRunner) {
      throw new Error('Transaction already in progress');
    }

    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  async commit(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.queryRunner.commitTransaction();
    } finally {
      await this.cleanup();
    }
  }

  async rollback(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.queryRunner.rollbackTransaction();
    } finally {
      await this.cleanup();
    }
  }

  getManager(): EntityManager | null {
    return this.queryRunner?.manager ?? null;
  }

  isActive(): boolean {
    return this.queryRunner !== null && this.queryRunner.isTransactionActive;
  }

  async execute<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
    await this.begin();

    try {
      const manager = this.getManager();
      if (!manager) {
        throw new Error('Transaction manager not available');
      }

      const result = await operation(manager);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }
}

@Injectable()
export class TransactionManagerFactory {
  constructor(private readonly dataSource: DataSource) {}

  create(): TransactionManager {
    return new TransactionManager(this.dataSource);
  }

  async executeInTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    const transactionManager = this.create();
    return transactionManager.execute(operation);
  }
}
