export enum ContentType {
  BLOG_POST = 'blog_post',
  EMAIL = 'email',
  SOCIAL_POST = 'social_post',
  LANDING_PAGE = 'landing_page',
  AD_COPY = 'ad_copy',
  VIDEO_SCRIPT = 'video_script',
  INFOGRAPHIC = 'infographic',
}

export enum ContentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface ContentMetadata {
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  targetAudience?: string;
  tone?: string;
}

export interface ContentVersion {
  version: number;
  content: string;
  createdAt: Date;
  createdBy?: string;
  notes?: string;
}
