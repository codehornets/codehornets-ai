export declare enum ContactStatus {
    LEAD = "lead",
    PROSPECT = "prospect",
    QUALIFIED = "qualified",
    CUSTOMER = "customer",
    CHURNED = "churned"
}
export declare enum LeadSource {
    WEBSITE = "website",
    REFERRAL = "referral",
    SOCIAL = "social",
    PAID_ADS = "paid_ads",
    EMAIL = "email",
    EVENT = "event",
    OTHER = "other"
}
export interface ContactAddress {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}
export interface ContactInteraction {
    id: string;
    type: 'email' | 'call' | 'meeting' | 'note';
    subject: string;
    content?: string;
    timestamp: Date;
    userId?: string;
}
