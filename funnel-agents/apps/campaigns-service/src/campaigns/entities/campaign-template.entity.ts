import { Entity, Column, Index } from 'typeorm';
import { BaseDbEntity } from '@funnelagents/infrastructure';

export interface TaskTemplate {
  title: string;
  description?: string;
  agent_domain?: string;
  priority?: string;
}

@Entity('campaign_templates')
@Index(['category'])
@Index(['is_public'])
export class CampaignTemplateEntity extends BaseDbEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  category: string;

  @Column({ name: 'default_settings', type: 'jsonb', nullable: true })
  default_settings?: Record<string, any>;

  @Column({ name: 'default_agents', type: 'simple-array', nullable: true })
  default_agents?: string[];

  @Column({ name: 'default_tasks', type: 'jsonb', nullable: true })
  default_tasks?: TaskTemplate[];

  @Column({ name: 'is_public', default: false })
  is_public: boolean;
}
