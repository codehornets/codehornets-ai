/**
 * Factory functions for creating test User entities
 */

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  password?: string;
  name?: string;
  avatar?: string;
  role?: 'user' | 'admin';
  onboarding_completed?: boolean;
  company_name?: string;
  team_size?: string;
  industry?: string;
}

let userIdCounter = 1;

export function createMockUser(options: UserFactoryOptions = {}) {
  const id = options.id || `user-${userIdCounter++}`;

  return {
    id,
    email: options.email || `user${userIdCounter}@example.com`,
    password: options.password || 'hashedpassword123',
    name: options.name || `Test User ${userIdCounter}`,
    avatar: options.avatar || null,
    role: options.role || 'user',
    onboarding_completed: options.onboarding_completed ?? false,
    company_name: options.company_name || null,
    team_size: options.team_size || null,
    industry: options.industry || null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export function createMockUsers(count: number, baseOptions: UserFactoryOptions = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      ...baseOptions,
      email: baseOptions.email || `user${i + 1}@example.com`,
      name: baseOptions.name || `Test User ${i + 1}`,
    })
  );
}

export function createMockAdminUser(options: UserFactoryOptions = {}) {
  return createMockUser({
    ...options,
    role: 'admin',
    onboarding_completed: true,
  });
}
