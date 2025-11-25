import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from './base.entity';

@Entity('agent_templates')
@Index(['domain'])
@Index(['is_public'])
@Index(['type'])
export class AgentTemplateDbEntity extends BaseDbEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  type?: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  domain: string;

  @Column({ type: 'simple-array' })
  skills: string[];

  @Column({ type: 'simple-array', nullable: true })
  tools?: string[];

  @Column({ type: 'text', nullable: true })
  prompt_template?: string;

  @Column({ type: 'jsonb', nullable: true })
  default_settings?: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'jsonb', nullable: true })
  persona?: {
    firstName: string;
    lastName: string;
    title: string;
    initials: string;
  };

  @Column({ type: 'simple-array', nullable: true })
  use_cases?: string[];

  @Column({ type: 'simple-array', nullable: true })
  typical_tasks?: string[];

  @Column({ type: 'simple-array', nullable: true })
  example_tasks?: string[];

  @Column({ type: 'simple-array', nullable: true })
  overview?: string[];

  @Column({ type: 'simple-array', nullable: true })
  commonly_used_with?: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  popularity_label?: string;
}
