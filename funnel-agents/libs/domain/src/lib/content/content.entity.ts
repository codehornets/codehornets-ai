import { AggregateRoot, UniqueId } from '../shared-kernel';
import { ContentType, ContentStatus, ContentMetadata, ContentVersion } from './content.types';
import { ContentCreatedEvent, ContentPublishedEvent } from './content.events';

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

export class Content extends AggregateRoot<ContentProps> {
  private constructor(props: ContentProps, id?: UniqueId) {
    super(props, id);
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get type(): ContentType {
    return this.props.type;
  }

  get status(): ContentStatus {
    return this.props.status;
  }

  get clientId(): UniqueId | undefined {
    return this.props.clientId;
  }

  get campaignId(): UniqueId | undefined {
    return this.props.campaignId;
  }

  get metadata(): ContentMetadata | undefined {
    return this.props.metadata;
  }

  get versions(): ContentVersion[] {
    return this.props.versions ?? [];
  }

  get currentVersion(): number {
    return this.versions.length;
  }

  get tags(): string[] {
    return this.props.tags ?? [];
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  public static create(
    props: Omit<ContentProps, 'status' | 'versions'>,
    id?: UniqueId
  ): Content {
    const content = new Content(
      {
        ...props,
        status: ContentStatus.DRAFT,
        versions: [
          {
            version: 1,
            content: props.body,
            createdAt: new Date(),
          },
        ],
      },
      id
    );
    content.addDomainEvent(new ContentCreatedEvent(content.id.value, content.title, content.type));
    return content;
  }

  public static reconstitute(props: ContentProps, id: UniqueId): Content {
    return new Content(props, id);
  }

  public update(title: string, body: string, notes?: string): void {
    this.props.title = title;
    this.props.body = body;
    this.props.versions = [
      ...(this.props.versions ?? []),
      {
        version: this.currentVersion + 1,
        content: body,
        createdAt: new Date(),
        notes,
      },
    ];
    this.touch();
  }

  public submitForReview(): void {
    if (this.status !== ContentStatus.DRAFT) {
      throw new Error('Content can only be submitted for review from draft status');
    }
    this.props.status = ContentStatus.REVIEW;
    this.touch();
  }

  public approve(): void {
    if (this.status !== ContentStatus.REVIEW) {
      throw new Error('Content can only be approved from review status');
    }
    this.props.status = ContentStatus.APPROVED;
    this.touch();
  }

  public publish(): void {
    if (this.status !== ContentStatus.APPROVED) {
      throw new Error('Content can only be published when approved');
    }
    this.props.status = ContentStatus.PUBLISHED;
    this.props.publishedAt = new Date();
    this.touch();
    this.addDomainEvent(new ContentPublishedEvent(this.id.value, this.title));
  }

  public archive(): void {
    this.props.status = ContentStatus.ARCHIVED;
    this.touch();
  }

  public revertToVersion(version: number): void {
    const targetVersion = this.versions.find((v) => v.version === version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found`);
    }
    this.props.body = targetVersion.content;
    this.props.status = ContentStatus.DRAFT;
    this.touch();
  }
}
