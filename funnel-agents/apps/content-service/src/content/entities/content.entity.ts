import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContentType {
  BLOG_POST = 'blog_post',
  SOCIAL_POST = 'social_post',
  EMAIL = 'email',
  LANDING_PAGE = 'landing_page',
  AD_CREATIVE = 'ad_creative',
  VIDEO = 'video',
  OTHER = 'other',
}

export enum ContentStatus {
  BRIEF = 'brief',
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ContentChannel {
  BLOG = 'blog',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  EMAIL = 'email',
  GOOGLE_ADS = 'google_ads',
  OTHER = 'other',
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.OTHER,
  })
  type: ContentType;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.BRIEF,
  })
  status: ContentStatus;

  @Column({
    type: 'enum',
    enum: ContentChannel,
    nullable: true,
  })
  channel?: ContentChannel;

  @Column({ nullable: true })
  workspace_id?: string;

  @Column({ nullable: true })
  campaign_id?: string;

  @Column({ nullable: true })
  author_id?: string;

  @Column({ nullable: true })
  file_url?: string;

  @Column({ nullable: true })
  thumbnail_url?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
