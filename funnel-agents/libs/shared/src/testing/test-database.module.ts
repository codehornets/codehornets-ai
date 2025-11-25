import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Test database module that provides an in-memory SQLite database for testing
 * This ensures tests are fast and isolated
 */
@Module({})
export class TestDatabaseModule {
  /**
   * Create a test database module with the specified entities
   * @param entities - Array of TypeORM entities to register
   * @returns DynamicModule configured for testing
   */
  static forRoot(entities: any[]): DynamicModule {
    return {
      module: TestDatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities,
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TypeOrmModule.forFeature(entities),
      ],
      exports: [TypeOrmModule],
    };
  }

  /**
   * Create a test database module with PostgreSQL test container
   * Use this for integration tests that need PostgreSQL-specific features
   */
  static async forRootPostgres(entities: any[]): Promise<DynamicModule> {
    // For now, we'll use SQLite. In the future, this can be enhanced with testcontainers
    return this.forRoot(entities);
  }
}

/**
 * Helper to clean database between tests
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
}

/**
 * Helper to get a fresh database connection for each test
 */
export async function createTestDataSource(entities: any[]): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities,
    synchronize: true,
    dropSchema: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}
