import { AggregateRoot, UniqueId } from '../shared-kernel';
import { AutomationStatus, AutomationTrigger, AutomationAction } from './automation.types';
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
export declare class Automation extends AggregateRoot<AutomationProps> {
    private constructor();
    get name(): string;
    get description(): string | undefined;
    get status(): AutomationStatus;
    get clientId(): UniqueId | undefined;
    get trigger(): AutomationTrigger;
    get actions(): AutomationAction[];
    get executionCount(): number;
    get lastExecutedAt(): Date | undefined;
    static create(props: Omit<AutomationProps, 'status' | 'executionCount'>, id?: UniqueId): Automation;
    static reconstitute(props: AutomationProps, id: UniqueId): Automation;
    activate(): void;
    pause(): void;
    archive(): void;
    updateTrigger(trigger: AutomationTrigger): void;
    addAction(action: AutomationAction): void;
    removeAction(actionId: string): void;
    reorderActions(actionIds: string[]): void;
    recordExecution(): void;
}
