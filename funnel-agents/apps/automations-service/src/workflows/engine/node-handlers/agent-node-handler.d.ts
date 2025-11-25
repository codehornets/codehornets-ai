import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';
/**
 * AgentNodeHandler - Invokes agents via agents-service
 * Calls the agents service API to execute an agent with given input
 */
export declare class AgentNodeHandler extends BaseNodeHandler {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    constructor(httpService: HttpService, configService: ConfigService);
    execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult>;
    validate(node: WorkflowNode): {
        valid: boolean;
        errors?: string[];
    };
}
