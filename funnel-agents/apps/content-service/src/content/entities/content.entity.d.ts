export declare enum ContentType {
    BLOG_POST = "blog_post",
    SOCIAL_POST = "social_post",
    EMAIL = "email",
    LANDING_PAGE = "landing_page",
    AD_CREATIVE = "ad_creative",
    VIDEO = "video",
    OTHER = "other"
}
export declare enum ContentStatus {
    BRIEF = "brief",
    DRAFT = "draft",
    REVIEW = "review",
    APPROVED = "approved",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
export declare enum ContentChannel {
    BLOG = "blog",
    LINKEDIN = "linkedin",
    TWITTER = "twitter",
    FACEBOOK = "facebook",
    INSTAGRAM = "instagram",
    EMAIL = "email",
    GOOGLE_ADS = "google_ads",
    OTHER = "other"
}
export declare class Content {
    id: string;
    title: string;
    description?: string;
    body?: string;
    type: ContentType;
    status: ContentStatus;
    channel?: ContentChannel;
    workspace_id?: string;
    campaign_id?: string;
    author_id?: string;
    file_url?: string;
    thumbnail_url?: string;
    metadata?: Record<string, any>;
    published_at?: Date;
    created_at: Date;
    updated_at: Date;
}
