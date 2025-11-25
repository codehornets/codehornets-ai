import { HttpService } from '@nestjs/axios';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';
/**
 * WebhookNodeHandler - Calls external HTTP endpoints
 * Supports GET, POST, PUT, PATCH, DELETE with custom headers and body
 */
export declare class WebhookNodeHandler extends BaseNodeHandler {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult>;
    validate(node: WorkflowNode): {
        valid: boolean;
        errors?: string[];
    };
}
