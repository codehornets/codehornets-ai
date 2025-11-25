import { DynamicModule } from '@nestjs/common';
import { DataSource } from 'typeorm';
/**
 * Test database module that provides an in-memory SQLite database for testing
 * This ensures tests are fast and isolated
 */
export declare class TestDatabaseModule {
    /**
     * Create a test database module with the specified entities
     * @param entities - Array of TypeORM entities to register
     * @returns DynamicModule configured for testing
     */
    static forRoot(entities: any[]): DynamicModule;
    /**
     * Create a test database module with PostgreSQL test container
     * Use this for integration tests that need PostgreSQL-specific features
     */
    static forRootPostgres(entities: any[]): Promise<DynamicModule>;
}
/**
 * Helper to clean database between tests
 */
export declare function cleanDatabase(dataSource: DataSource): Promise<void>;
/**
 * Helper to get a fresh database connection for each test
 */
export declare function createTestDataSource(entities: any[]): Promise<DataSource>;
