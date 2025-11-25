import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Content, ContentChannel } from './content.entity';

export enum PublishStatus {
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('content_publishes')
export class ContentPublish {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content_id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({
    type: 'enum',
    enum: ContentChannel,
  })
  channel: ContentChannel;

  @Column({
    type: 'enum',
    enum: PublishStatus,
    default: PublishStatus.SCHEDULED,
  })
  status: PublishStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @Column({ type: 'text', nullable: true })
  channel_content?: string; // Channel-specific formatted content

  @Column({ type: 'jsonb', nullable: true })
  channel_metadata?: Record<string, any>; // Channel-specific metadata (post ID, etc.)

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ nullable: true })
  published_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
