import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentType } from './content.entity';

@Entity('content_templates')
export class ContentTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  content_type: ContentType;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'text' })
  template_body: string; // Template with variables like {{variable_name}}

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, any>; // Variable definitions with types, defaults, descriptions

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  thumbnail_url?: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
