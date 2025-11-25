import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TriggerType = 'manual' | 'webhook' | 'event' | 'scheduled';
export type NodeType = 'trigger' | 'agent' | 'condition' | 'email' | 'delay' | 'webhook';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'draft',
  })
  status!: WorkflowStatus;

  @Column({
    type: 'varchar',
    length: 50,
  })
  trigger_type!: TriggerType;

  @Column({ type: 'jsonb', nullable: true })
  trigger_config?: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  nodes!: WorkflowNode[];

  @Column({ type: 'jsonb', default: [] })
  edges!: WorkflowEdge[];

  @Column({ type: 'uuid', nullable: true })
  workspace_id?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
