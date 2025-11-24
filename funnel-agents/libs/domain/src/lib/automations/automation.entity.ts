import { AggregateRoot, UniqueId } from '../shared-kernel';
import {
  AutomationStatus,
  AutomationTrigger,
  AutomationAction,
} from './automation.types';
import { AutomationCreatedEvent, AutomationActivatedEvent } from './automation.events';

export interface AutomationProps {
  name: string;
  description?: string;
  status: AutomationStatus;
  clientId?: UniqueId;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  executionCount?: number;
  lastExecutedAt?: Date;
}

export class Automation extends AggregateRoot<AutomationProps> {
  private constructor(props: AutomationProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): AutomationStatus {
    return this.props.status;
  }

  get clientId(): UniqueId | undefined {
    return this.props.clientId;
  }

  get trigger(): AutomationTrigger {
    return this.props.trigger;
  }

  get actions(): AutomationAction[] {
    return this.props.actions;
  }

  get executionCount(): number {
    return this.props.executionCount ?? 0;
  }

  get lastExecutedAt(): Date | undefined {
    return this.props.lastExecutedAt;
  }

  public static create(
    props: Omit<AutomationProps, 'status' | 'executionCount'>,
    id?: UniqueId
  ): Automation {
    const automation = new Automation(
      {
        ...props,
        status: AutomationStatus.DRAFT,
        executionCount: 0,
      },
      id
    );
    automation.addDomainEvent(new AutomationCreatedEvent(automation.id.value, automation.name));
    return automation;
  }

  public static reconstitute(props: AutomationProps, id: UniqueId): Automation {
    return new Automation(props, id);
  }

  public activate(): void {
    if (this.actions.length === 0) {
      throw new Error('Cannot activate automation without actions');
    }
    this.props.status = AutomationStatus.ACTIVE;
    this.touch();
    this.addDomainEvent(new AutomationActivatedEvent(this.id.value));
  }

  public pause(): void {
    this.props.status = AutomationStatus.PAUSED;
    this.touch();
  }

  public archive(): void {
    this.props.status = AutomationStatus.ARCHIVED;
    this.touch();
  }

  public updateTrigger(trigger: AutomationTrigger): void {
    this.props.trigger = trigger;
    this.touch();
  }

  public addAction(action: AutomationAction): void {
    this.props.actions.push(action);
    this.touch();
  }

  public removeAction(actionId: string): void {
    this.props.actions = this.props.actions.filter((a) => a.id !== actionId);
    // Update references to removed action
    this.props.actions.forEach((action) => {
      if (action.nextActionId === actionId) {
        action.nextActionId = undefined;
      }
      if (action.onFailureActionId === actionId) {
        action.onFailureActionId = undefined;
      }
    });
    this.touch();
  }

  public reorderActions(actionIds: string[]): void {
    const actionMap = new Map(this.props.actions.map((a) => [a.id, a]));
    this.props.actions = actionIds
      .filter((id) => actionMap.has(id))
      .map((id) => actionMap.get(id)!);
    this.touch();
  }

  public recordExecution(): void {
    this.props.executionCount = (this.props.executionCount ?? 0) + 1;
    this.props.lastExecutedAt = new Date();
    this.touch();
  }
}
