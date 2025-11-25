import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Content, ContentChannel } from './content.entity';

export enum AnalyticsEventType {
  VIEW = 'view',
  CLICK = 'click',
  SHARE = 'share',
  LIKE = 'like',
  COMMENT = 'comment',
  CONVERSION = 'conversion',
}

@Entity('content_analytics')
@Index(['content_id', 'event_type', 'created_at'])
@Index(['channel', 'created_at'])
export class ContentAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content_id: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({
    type: 'enum',
    enum: AnalyticsEventType,
  })
  event_type: AnalyticsEventType;

  @Column({
    type: 'enum',
    enum: ContentChannel,
    nullable: true,
  })
  channel?: ContentChannel;

  @Column({ type: 'int', default: 1 })
  count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Additional event data (user_id, session_id, etc.)

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
