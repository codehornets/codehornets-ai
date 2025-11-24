import { Module, DynamicModule } from '@nestjs/common';
// import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

export interface GraphQLModuleOptions {
  autoSchemaFile?: string | boolean;
  sortSchema?: boolean;
  playground?: boolean;
  debug?: boolean;
}

/**
 * GraphQL Module placeholder
 * Uncomment and configure when GraphQL is needed
 */
@Module({})
export class GraphQLConfigModule {
  static forRoot(options: GraphQLModuleOptions = {}): DynamicModule {
    // Placeholder for GraphQL configuration
    // Uncomment when @nestjs/graphql and @nestjs/apollo are installed
    return {
      module: GraphQLConfigModule,
      // imports: [
      //   NestGraphQLModule.forRoot<ApolloDriverConfig>({
      //     driver: ApolloDriver,
      //     autoSchemaFile: options.autoSchemaFile ?? 'schema.gql',
      //     sortSchema: options.sortSchema ?? true,
      //     playground: options.playground ?? process.env['NODE_ENV'] !== 'production',
      //     debug: options.debug ?? process.env['NODE_ENV'] !== 'production',
      //   }),
      // ],
    };
  }
}
