/**
 * Seed script to create test users
 * Run with: npx ts-node apps/auth-service/src/seed.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

const SALT_ROUNDS = 10;

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'funnel_agents',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME || 'funnel_agents',
    entities: [User],
    synchronize: true, // Create tables if they don't exist
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const userRepository = dataSource.getRepository(User);

    // Test User 1: Not onboarded yet
    const testUser1Email = 'test@funnelagents.com';
    const existingUser1 = await userRepository.findOne({ where: { email: testUser1Email } });

    if (!existingUser1) {
      const hashedPassword = await bcrypt.hash('Test123!', SALT_ROUNDS);
      const user1 = userRepository.create({
        email: testUser1Email,
        password: hashedPassword,
        name: 'Test User',
        role: 'admin',
        onboarding_completed: false,
      });
      await userRepository.save(user1);
      console.log(`Created test user: ${testUser1Email} (password: Test123!)`);
    } else {
      console.log(`Test user already exists: ${testUser1Email}`);
    }

    // Test User 2: Already onboarded
    const testUser2Email = 'demo@funnelagents.com';
    const existingUser2 = await userRepository.findOne({ where: { email: testUser2Email } });

    if (!existingUser2) {
      const hashedPassword = await bcrypt.hash('Demo123!', SALT_ROUNDS);
      const user2 = userRepository.create({
        email: testUser2Email,
        password: hashedPassword,
        name: 'Demo User',
        role: 'user',
        onboarding_completed: true,
        company_name: 'Demo Agency',
        team_size: '6-20',
        industry: 'marketing_agency',
      });
      await userRepository.save(user2);
      console.log(`Created demo user: ${testUser2Email} (password: Demo123!)`);
    } else {
      console.log(`Demo user already exists: ${testUser2Email}`);
    }

    console.log('\n=== Test Users ===');
    console.log('1. test@funnelagents.com / Test123! (not onboarded)');
    console.log('2. demo@funnelagents.com / Demo123! (already onboarded)');

    await dataSource.destroy();
    console.log('\nSeed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
