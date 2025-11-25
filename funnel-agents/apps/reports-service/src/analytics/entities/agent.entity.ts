import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('agents')
export class AgentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ type: 'jsonb', nullable: true })
  capabilities: any;

  @Column({ type: 'jsonb', nullable: true })
  config: any;

  @Column({ type: 'jsonb', nullable: true })
  metrics: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
