import { AggregateRoot, UniqueId } from '../shared-kernel';
import { ContentType, ContentStatus, ContentMetadata, ContentVersion } from './content.types';
export interface ContentProps {
    title: string;
    body: string;
    type: ContentType;
    status: ContentStatus;
    clientId?: UniqueId;
    campaignId?: UniqueId;
    metadata?: ContentMetadata;
    versions?: ContentVersion[];
    tags?: string[];
    publishedAt?: Date;
}
export declare class Content extends AggregateRoot<ContentProps> {
    private constructor();
    get title(): string;
    get body(): string;
    get type(): ContentType;
    get status(): ContentStatus;
    get clientId(): UniqueId | undefined;
    get campaignId(): UniqueId | undefined;
    get metadata(): ContentMetadata | undefined;
    get versions(): ContentVersion[];
    get currentVersion(): number;
    get tags(): string[];
    get publishedAt(): Date | undefined;
    static create(props: Omit<ContentProps, 'status' | 'versions'>, id?: UniqueId): Content;
    static reconstitute(props: ContentProps, id: UniqueId): Content;
    update(title: string, body: string, notes?: string): void;
    submitForReview(): void;
    approve(): void;
    publish(): void;
    archive(): void;
    revertToVersion(version: number): void;
}
