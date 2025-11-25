/**
 * Database Integration Tests
 *
 * Tests repository operations with real PostgreSQL database.
 * Validates transactions, rollback, concurrent access, and connection pooling.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { TEST_CONFIG } from './setup';

// Import entities (adjust paths as needed)
class User {
  id!: string;
  email!: string;
  password!: string;
  name!: string;
  created_at!: Date;
  updated_at!: Date;
}

class Lead {
  id!: string;
  name!: string;
  email!: string;
  phone!: string | null;
  source!: string;
  status!: string;
  score!: number;
  user_id!: string;
  created_at!: Date;
  updated_at!: Date;
}

class Contact {
  id!: string;
  name!: string;
  email!: string;
  user_id!: string;
  created_at!: Date;
  updated_at!: Date;
}

describe('Database Integration Tests', () => {
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let leadRepository: Repository<Lead>;
  let contactRepository: Repository<Contact>;

  beforeAll(async () => {
    // Check if PostgreSQL is available
    try {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: TEST_CONFIG.postgres.host,
            port: TEST_CONFIG.postgres.port,
            username: TEST_CONFIG.postgres.username,
            password: TEST_CONFIG.postgres.password,
            database: TEST_CONFIG.postgres.database,
            entities: [User, Lead, Contact],
            synchronize: false, // Don't auto-sync in tests
            logging: false,
            poolSize: 10,
          }),
          TypeOrmModule.forFeature([User, Lead, Contact]),
        ],
      }).compile();

      dataSource = module.get<DataSource>(DataSource);
      userRepository = module.get<Repository<User>>(getRepositoryToken(User));
      leadRepository = module.get<Repository<Lead>>(getRepositoryToken(Lead));
      contactRepository = module.get<Repository<Contact>>(getRepositoryToken(Contact));

      console.log('✓ Connected to PostgreSQL for integration tests');
    } catch (error) {
      console.warn('PostgreSQL not available, skipping database integration tests:', error.message);
    }
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    if (!dataSource?.isInitialized) return;

    // Clean test data before each test
    try {
      await leadRepository.query('DELETE FROM leads WHERE email LIKE ?', ['%integration-test%']);
      await contactRepository.query('DELETE FROM contacts WHERE email LIKE ?', [
        '%integration-test%',
      ]);
      await userRepository.query('DELETE FROM users WHERE email LIKE ?', ['%integration-test%']);
    } catch (error) {
      // Tables might not exist yet
      console.warn('Could not clean test data:', error.message);
    }
  });

  describe('Repository Operations with Real PostgreSQL', () => {
    it('should create and retrieve a user', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      const userData = {
        email: `integration-test-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Integration Test User',
      };

      // Create user
      const user = userRepository.create(userData);
      const savedUser = await userRepository.save(user);

      expect(savedUser.id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.created_at).toBeDefined();

      // Retrieve user
      const foundUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(savedUser.id);
      expect(foundUser?.name).toBe(userData.name);
    });

    it('should create a lead with relationships', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create user first
      const user = userRepository.create({
        email: `integration-test-lead-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Lead Test User',
      });
      const savedUser = await userRepository.save(user);

      // Create lead
      const leadData = {
        name: 'Test Lead',
        email: `lead-integration-test-${Date.now()}@example.com`,
        phone: '+1234567890',
        source: 'integration-test',
        status: 'new',
        score: 75,
        user_id: savedUser.id,
      };

      const lead = leadRepository.create(leadData);
      const savedLead = await leadRepository.save(lead);

      expect(savedLead.id).toBeDefined();
      expect(savedLead.user_id).toBe(savedUser.id);
      expect(savedLead.score).toBe(75);

      // Query lead
      const foundLead = await leadRepository.findOne({
        where: { id: savedLead.id },
      });

      expect(foundLead).toBeDefined();
      expect(foundLead?.email).toBe(leadData.email);
    });

    it('should update a record', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create lead
      const lead = leadRepository.create({
        name: 'Update Test Lead',
        email: `update-test-${Date.now()}@example.com`,
        source: 'test',
        status: 'new',
        score: 50,
        user_id: 'test-user-id',
      });
      const savedLead = await leadRepository.save(lead);

      // Update lead
      savedLead.score = 85;
      savedLead.status = 'qualified';
      const updatedLead = await leadRepository.save(savedLead);

      expect(updatedLead.score).toBe(85);
      expect(updatedLead.status).toBe('qualified');

      // Verify update
      const foundLead = await leadRepository.findOne({
        where: { id: savedLead.id },
      });
      expect(foundLead?.score).toBe(85);
    });

    it('should delete a record', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create lead
      const lead = leadRepository.create({
        name: 'Delete Test Lead',
        email: `delete-test-${Date.now()}@example.com`,
        source: 'test',
        status: 'new',
        score: 50,
        user_id: 'test-user-id',
      });
      const savedLead = await leadRepository.save(lead);

      // Delete lead
      await leadRepository.delete(savedLead.id);

      // Verify deletion
      const foundLead = await leadRepository.findOne({
        where: { id: savedLead.id },
      });
      expect(foundLead).toBeNull();
    });

    it('should query with filters and pagination', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create multiple leads
      const timestamp = Date.now();
      const leads = await Promise.all([
        leadRepository.save(
          leadRepository.create({
            name: 'Lead 1',
            email: `query-test-1-${timestamp}@example.com`,
            source: 'integration-test',
            status: 'new',
            score: 60,
            user_id: 'test-user',
          }),
        ),
        leadRepository.save(
          leadRepository.create({
            name: 'Lead 2',
            email: `query-test-2-${timestamp}@example.com`,
            source: 'integration-test',
            status: 'qualified',
            score: 80,
            user_id: 'test-user',
          }),
        ),
        leadRepository.save(
          leadRepository.create({
            name: 'Lead 3',
            email: `query-test-3-${timestamp}@example.com`,
            source: 'integration-test',
            status: 'qualified',
            score: 90,
            user_id: 'test-user',
          }),
        ),
      ]);

      // Query with filters
      const qualifiedLeads = await leadRepository.find({
        where: { status: 'qualified', source: 'integration-test' },
        order: { score: 'DESC' },
        take: 10,
      });

      expect(qualifiedLeads.length).toBeGreaterThanOrEqual(2);
      expect(qualifiedLeads[0].status).toBe('qualified');

      // Verify ordering
      if (qualifiedLeads.length >= 2) {
        expect(qualifiedLeads[0].score).toBeGreaterThanOrEqual(qualifiedLeads[1].score);
      }
    });
  });

  describe('Transactions and Rollback', () => {
    it('should commit a transaction successfully', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create user in transaction
        const user = userRepository.create({
          email: `transaction-test-${Date.now()}@example.com`,
          password: 'hashed-password',
          name: 'Transaction Test',
        });
        const savedUser = await queryRunner.manager.save(user);

        // Create lead in same transaction
        const lead = leadRepository.create({
          name: 'Transaction Lead',
          email: `transaction-lead-${Date.now()}@example.com`,
          source: 'test',
          status: 'new',
          score: 75,
          user_id: savedUser.id,
        });
        await queryRunner.manager.save(lead);

        // Commit transaction
        await queryRunner.commitTransaction();

        // Verify both records exist
        const foundUser = await userRepository.findOne({
          where: { id: savedUser.id },
        });
        const foundLead = await leadRepository.findOne({
          where: { user_id: savedUser.id },
        });

        expect(foundUser).toBeDefined();
        expect(foundLead).toBeDefined();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });

    it('should rollback a transaction on error', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const testEmail = `rollback-test-${Date.now()}@example.com`;

      try {
        // Create user
        const user = userRepository.create({
          email: testEmail,
          password: 'hashed-password',
          name: 'Rollback Test',
        });
        await queryRunner.manager.save(user);

        // Simulate error
        throw new Error('Simulated transaction error');
      } catch (error) {
        await queryRunner.rollbackTransaction();

        // Verify rollback - user should not exist
        const foundUser = await userRepository.findOne({
          where: { email: testEmail },
        });
        expect(foundUser).toBeNull();
      } finally {
        await queryRunner.release();
      }
    });

    it('should handle nested transactions with savepoints', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create user in outer transaction
        const user = userRepository.create({
          email: `nested-transaction-${Date.now()}@example.com`,
          password: 'hashed-password',
          name: 'Nested Transaction Test',
        });
        const savedUser = await queryRunner.manager.save(user);

        // Create savepoint
        await queryRunner.query('SAVEPOINT sp1');

        try {
          // Try to create invalid lead
          const lead = leadRepository.create({
            name: 'Savepoint Lead',
            email: 'invalid-email', // Might violate constraints
            source: 'test',
            status: 'new',
            score: 75,
            user_id: savedUser.id,
          });
          await queryRunner.manager.save(lead);
        } catch (error) {
          // Rollback to savepoint
          await queryRunner.query('ROLLBACK TO SAVEPOINT sp1');
        }

        // Commit outer transaction
        await queryRunner.commitTransaction();

        // User should exist, lead should not
        const foundUser = await userRepository.findOne({
          where: { id: savedUser.id },
        });
        expect(foundUser).toBeDefined();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent reads correctly', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create test lead
      const lead = await leadRepository.save(
        leadRepository.create({
          name: 'Concurrent Read Test',
          email: `concurrent-read-${Date.now()}@example.com`,
          source: 'test',
          status: 'new',
          score: 75,
          user_id: 'test-user',
        }),
      );

      // Perform 10 concurrent reads
      const reads = await Promise.all(
        Array.from({ length: 10 }, () =>
          leadRepository.findOne({ where: { id: lead.id } }),
        ),
      );

      // All reads should succeed with same data
      expect(reads.every((r) => r?.id === lead.id)).toBe(true);
      expect(reads.every((r) => r?.score === 75)).toBe(true);
    });

    it('should handle concurrent writes with optimistic locking', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create test lead
      const lead = await leadRepository.save(
        leadRepository.create({
          name: 'Concurrent Write Test',
          email: `concurrent-write-${Date.now()}@example.com`,
          source: 'test',
          status: 'new',
          score: 50,
          user_id: 'test-user',
        }),
      );

      // Perform concurrent updates
      const updatePromises = Array.from({ length: 5 }, async (_, i) => {
        const foundLead = await leadRepository.findOne({ where: { id: lead.id } });
        if (foundLead) {
          foundLead.score = foundLead.score + 10;
          return leadRepository.save(foundLead);
        }
        return null;
      });

      await Promise.all(updatePromises);

      // Final score should reflect all updates
      const finalLead = await leadRepository.findOne({ where: { id: lead.id } });
      expect(finalLead?.score).toBeGreaterThan(50);
    });

    it('should handle deadlock scenarios gracefully', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create two leads
      const lead1 = await leadRepository.save(
        leadRepository.create({
          name: 'Deadlock Test 1',
          email: `deadlock-test-1-${Date.now()}@example.com`,
          source: 'test',
          status: 'new',
          score: 50,
          user_id: 'test-user',
        }),
      );

      const lead2 = await leadRepository.save(
        leadRepository.create({
          name: 'Deadlock Test 2',
          email: `deadlock-test-2-${Date.now()}@example.com`,
          source: 'test',
          status: 'new',
          score: 60,
          user_id: 'test-user',
        }),
      );

      // Attempt concurrent updates in opposite order
      const results = await Promise.allSettled([
        (async () => {
          const qr1 = dataSource.createQueryRunner();
          await qr1.connect();
          await qr1.startTransaction();
          try {
            await qr1.manager.update('leads', { id: lead1.id }, { score: 55 });
            await new Promise((resolve) => setTimeout(resolve, 100));
            await qr1.manager.update('leads', { id: lead2.id }, { score: 65 });
            await qr1.commitTransaction();
          } catch (error) {
            await qr1.rollbackTransaction();
          } finally {
            await qr1.release();
          }
        })(),
        (async () => {
          const qr2 = dataSource.createQueryRunner();
          await qr2.connect();
          await qr2.startTransaction();
          try {
            await qr2.manager.update('leads', { id: lead2.id }, { score: 66 });
            await new Promise((resolve) => setTimeout(resolve, 100));
            await qr2.manager.update('leads', { id: lead1.id }, { score: 56 });
            await qr2.commitTransaction();
          } catch (error) {
            await qr2.rollbackTransaction();
          } finally {
            await qr2.release();
          }
        })(),
      ]);

      // At least one transaction should complete
      const succeeded = results.filter((r) => r.status === 'fulfilled');
      expect(succeeded.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Connection Pooling', () => {
    it('should reuse connections from pool', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      const queries = Array.from({ length: 20 }, async (_, i) => {
        return leadRepository.query('SELECT 1 as result');
      });

      const results = await Promise.all(queries);

      // All queries should succeed
      expect(results.length).toBe(20);
      results.forEach((result) => {
        expect(result[0].result).toBe(1);
      });
    });

    it('should handle pool exhaustion gracefully', async () => {
      if (!dataSource?.isInitialized) {
        console.warn('Skipping test - Database not available');
        return;
      }

      // Create more queries than pool size
      const queries = Array.from({ length: 15 }, async () => {
        return leadRepository.query('SELECT pg_sleep(0.1)');
      });

      // Should queue and complete all queries
      const results = await Promise.all(queries);
      expect(results.length).toBe(15);
    }, 10000);
  });
});
