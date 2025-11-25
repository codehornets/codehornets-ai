import { DynamicModule } from '@nestjs/common';
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
export declare class GraphQLConfigModule {
    static forRoot(options?: GraphQLModuleOptions): DynamicModule;
}
