/**
 * WorkflowContext - Stores variables and node outputs during workflow execution
 * Passes data between nodes and tracks execution path
 */
export declare class WorkflowContext {
    private variables;
    private nodeOutputs;
    private executionPath;
    private triggerData;
    constructor(triggerData?: Record<string, any>);
    /**
     * Set a variable in the context
     */
    setVariable(key: string, value: any): void;
    /**
     * Get a variable from the context
     */
    getVariable(key: string): any;
    /**
     * Check if a variable exists
     */
    hasVariable(key: string): boolean;
    /**
     * Get all variables
     */
    getAllVariables(): Record<string, any>;
    /**
     * Store the output of a node execution
     */
    setNodeOutput(nodeId: string, output: any): void;
    /**
     * Get the output from a previously executed node
     */
    getNodeOutput(nodeId: string): any;
    /**
     * Get all node outputs
     */
    getAllNodeOutputs(): Record<string, any>;
    /**
     * Get the execution path (list of node IDs executed in order)
     */
    getExecutionPath(): string[];
    /**
     * Get the trigger data
     */
    getTriggerData(): Record<string, any>;
    /**
     * Evaluate a simple expression using context data
     * Supports: ${variable}, ${node.output}, ${trigger.field}
     */
    evaluateExpression(expression: string): any;
    /**
     * Get a nested value from an object using a path array
     */
    private getNestedValue;
    /**
     * Clone the context for parallel execution paths
     */
    clone(): WorkflowContext;
    /**
     * Serialize context to plain object for storage
     */
    toJSON(): Record<string, any>;
    /**
     * Restore context from serialized data
     */
    static fromJSON(data: Record<string, any>): WorkflowContext;
}
