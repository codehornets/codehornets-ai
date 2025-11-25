// import { Scalar, CustomScalar } from '@nestjs/graphql';
// import { Kind, ValueNode } from 'graphql';

/**
 * GraphQL custom scalars placeholder
 * Uncomment when @nestjs/graphql is installed
 */

/**
 * DateTime scalar
 */
// @Scalar('DateTime', () => Date)
// export class DateTimeScalar implements CustomScalar<string, Date> {
//   description = 'Date custom scalar type';

//   parseValue(value: string): Date {
//     return new Date(value);
//   }

//   serialize(value: Date): string {
//     return value.toISOString();
//   }

//   parseLiteral(ast: ValueNode): Date | null {
//     if (ast.kind === Kind.STRING) {
//       return new Date(ast.value);
//     }
//     return null;
//   }
// }

/**
 * JSON scalar
 */
// @Scalar('JSON')
// export class JSONScalar implements CustomScalar<unknown, unknown> {
//   description = 'JSON custom scalar type';

//   parseValue(value: unknown): unknown {
//     return value;
//   }

//   serialize(value: unknown): unknown {
//     return value;
//   }

//   parseLiteral(ast: ValueNode): unknown {
//     if (ast.kind === Kind.STRING) {
//       return JSON.parse(ast.value);
//     }
//     return null;
//   }
// }

// Export placeholder types
export const GraphQLScalars = {
  DateTime: 'DateTime',
  JSON: 'JSON',
};
