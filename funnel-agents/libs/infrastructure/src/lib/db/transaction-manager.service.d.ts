import { DataSource, EntityManager } from 'typeorm';
import { IUnitOfWork } from '@funnelagents/domain';
export declare class TransactionManager implements IUnitOfWork {
    private readonly dataSource;
    private queryRunner;
    constructor(dataSource: DataSource);
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    getManager(): EntityManager | null;
    isActive(): boolean;
    execute<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T>;
    private cleanup;
}
export declare class TransactionManagerFactory {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    create(): TransactionManager;
    executeInTransaction<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T>;
}
