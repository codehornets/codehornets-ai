/**
 * WorkflowContext - Stores variables and node outputs during workflow execution
 * Passes data between nodes and tracks execution path
 */
export class WorkflowContext {
  private variables: Map<string, any>;
  private nodeOutputs: Map<string, any>;
  private executionPath: string[];
  private triggerData: Record<string, any>;

  constructor(triggerData: Record<string, any> = {}) {
    this.variables = new Map();
    this.nodeOutputs = new Map();
    this.executionPath = [];
    this.triggerData = triggerData;

    // Initialize context with trigger data
    this.setVariable('trigger', triggerData);
  }

  /**
   * Set a variable in the context
   */
  setVariable(key: string, value: any): void {
    this.variables.set(key, value);
  }

  /**
   * Get a variable from the context
   */
  getVariable(key: string): any {
    return this.variables.get(key);
  }

  /**
   * Check if a variable exists
   */
  hasVariable(key: string): boolean {
    return this.variables.has(key);
  }

  /**
   * Get all variables
   */
  getAllVariables(): Record<string, any> {
    return Object.fromEntries(this.variables);
  }

  /**
   * Store the output of a node execution
   */
  setNodeOutput(nodeId: string, output: any): void {
    this.nodeOutputs.set(nodeId, output);
    this.executionPath.push(nodeId);
  }

  /**
   * Get the output from a previously executed node
   */
  getNodeOutput(nodeId: string): any {
    return this.nodeOutputs.get(nodeId);
  }

  /**
   * Get all node outputs
   */
  getAllNodeOutputs(): Record<string, any> {
    return Object.fromEntries(this.nodeOutputs);
  }

  /**
   * Get the execution path (list of node IDs executed in order)
   */
  getExecutionPath(): string[] {
    return [...this.executionPath];
  }

  /**
   * Get the trigger data
   */
  getTriggerData(): Record<string, any> {
    return this.triggerData;
  }

  /**
   * Evaluate a simple expression using context data
   * Supports: ${variable}, ${node.output}, ${trigger.field}
   */
  evaluateExpression(expression: string): any {
    if (typeof expression !== 'string') {
      return expression;
    }

    // Handle template strings like ${variable}
    return expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const parts = path.trim().split('.');

      if (parts[0] === 'trigger') {
        return this.getNestedValue(this.triggerData, parts.slice(1));
      }

      if (parts[0] === 'node' && parts.length > 1) {
        const nodeId = parts[1];
        const nodeOutput = this.nodeOutputs.get(nodeId);
        return this.getNestedValue(nodeOutput, parts.slice(2));
      }

      if (this.variables.has(parts[0])) {
        const value = this.variables.get(parts[0]);
        return this.getNestedValue(value, parts.slice(1));
      }

      return match; // Return original if not found
    });
  }

  /**
   * Get a nested value from an object using a path array
   */
  private getNestedValue(obj: any, path: string[]): any {
    if (!obj || path.length === 0) {
      return obj;
    }

    let current = obj;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Clone the context for parallel execution paths
   */
  clone(): WorkflowContext {
    const cloned = new WorkflowContext(this.triggerData);

    // Copy variables
    this.variables.forEach((value, key) => {
      cloned.setVariable(key, value);
    });

    // Copy node outputs
    this.nodeOutputs.forEach((value, key) => {
      cloned.setNodeOutput(key, value);
    });

    return cloned;
  }

  /**
   * Serialize context to plain object for storage
   */
  toJSON(): Record<string, any> {
    return {
      variables: this.getAllVariables(),
      nodeOutputs: this.getAllNodeOutputs(),
      executionPath: this.getExecutionPath(),
      triggerData: this.triggerData,
    };
  }

  /**
   * Restore context from serialized data
   */
  static fromJSON(data: Record<string, any>): WorkflowContext {
    const context = new WorkflowContext(data.triggerData || {});

    if (data.variables) {
      Object.entries(data.variables).forEach(([key, value]) => {
        context.setVariable(key, value);
      });
    }

    if (data.nodeOutputs) {
      Object.entries(data.nodeOutputs).forEach(([key, value]) => {
        context.nodeOutputs.set(key, value);
      });
    }

    if (data.executionPath) {
      context.executionPath = [...data.executionPath];
    }

    return context;
  }
}
