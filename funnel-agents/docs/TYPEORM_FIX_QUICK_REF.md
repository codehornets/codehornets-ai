# TypeORM Configuration Fix - Quick Reference

## Problem
```typescript
// ERROR: Type 'string | undefined' is not assignable to type 'string'
host: configService.get('DB_HOST', 'localhost'),
```

## Solution
```typescript
// FIXED: Explicit type parameter ensures return type is 'string'
host: configService.get<string>('DB_HOST', 'localhost'),
```

## Pattern for All TypeORM Configs

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';

    const baseConfig = {
      type: 'postgres' as const,  // ← 'as const' for literal type
      entities: [/* ... */],
      synchronize: false,
      migrationsRun: true,
      logging: nodeEnv === 'development',
      autoLoadEntities: true,
      extra: {
        max: configService.get<number>('DB_POOL_MAX', 20),
        min: configService.get<number>('DB_POOL_MIN', 5),
        // ... other pool config
      },
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

    // Option 1: DATABASE_URL
    if (databaseUrl) {
      return {
        ...baseConfig,
        url: databaseUrl,
      };
    }

    // Option 2: Individual parameters
    return {
      ...baseConfig,
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get<string>('DB_USERNAME', 'postgres'),
      password: configService.get<string>('DB_PASSWORD', 'secret'),
      database: configService.get<string>('DB_DATABASE', 'db_name'),
    };
  },
})
```

## Type Parameters Cheat Sheet

| Config Key | Type Parameter | Example |
|------------|----------------|---------|
| DB_HOST | `<string>` | `configService.get<string>('DB_HOST', 'localhost')` |
| DB_PORT | `<number>` | `configService.get<number>('DB_PORT', 5432)` |
| DB_USERNAME | `<string>` | `configService.get<string>('DB_USERNAME', 'postgres')` |
| DB_PASSWORD | `<string>` | `configService.get<string>('DB_PASSWORD', 'secret')` |
| DB_DATABASE | `<string>` | `configService.get<string>('DB_DATABASE', 'dbname')` |
| DATABASE_URL | `<string>` | `configService.get<string>('DATABASE_URL')` |
| NODE_ENV | `<string>` | `configService.get<string>('NODE_ENV', 'development')` |

## Critical Points

1. **Always use type parameters**: `get<string>()` not `get()`
2. **Use `as const` for type property**: `type: 'postgres' as const`
3. **Number types for ports**: `get<number>('DB_PORT', 5432)`
4. **Provide defaults**: Second parameter prevents undefined returns

## Verification

```bash
# Check for type errors
npx tsc -p tsconfig.base.json --noEmit

# Should show 0 TypeORM configuration errors
```

## Services Fixed
- automations-service
- content-service
- crm-service
- tasks-service
- reports-service
- scheduler
- campaigns-service
