export enum AutomationStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum TriggerType {
  SCHEDULE = 'schedule',
  EVENT = 'event',
  WEBHOOK = 'webhook',
  MANUAL = 'manual',
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  CREATE_TASK = 'create_task',
  UPDATE_CONTACT = 'update_contact',
  WEBHOOK_CALL = 'webhook_call',
  RUN_AGENT = 'run_agent',
  DELAY = 'delay',
  CONDITION = 'condition',
}

export interface AutomationTrigger {
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface AutomationAction {
  id: string;
  type: ActionType;
  name: string;
  config: Record<string, unknown>;
  nextActionId?: string;
  onFailureActionId?: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface AutomationExecutionLog {
  id: string;
  automationId: string;
  triggeredAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  actionsExecuted: number;
  error?: string;
}
