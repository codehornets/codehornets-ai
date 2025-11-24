import { AggregateRoot, UniqueId, Email } from '../shared-kernel';
import { ContactStatus, LeadSource, ContactAddress, ContactInteraction } from './crm.types';
import { ContactCreatedEvent, ContactStatusChangedEvent } from './contact.events';

export interface ContactProps {
  firstName: string;
  lastName: string;
  email: Email;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: ContactStatus;
  source: LeadSource;
  address?: ContactAddress;
  tags?: string[];
  score?: number;
  interactions?: ContactInteraction[];
  customFields?: Record<string, unknown>;
}

export class Contact extends AggregateRoot<ContactProps> {
  private constructor(props: ContactProps, id?: UniqueId) {
    super(props, id);
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get company(): string | undefined {
    return this.props.company;
  }

  get jobTitle(): string | undefined {
    return this.props.jobTitle;
  }

  get status(): ContactStatus {
    return this.props.status;
  }

  get source(): LeadSource {
    return this.props.source;
  }

  get address(): ContactAddress | undefined {
    return this.props.address;
  }

  get tags(): string[] {
    return this.props.tags ?? [];
  }

  get score(): number {
    return this.props.score ?? 0;
  }

  get interactions(): ContactInteraction[] {
    return this.props.interactions ?? [];
  }

  public static create(
    props: Omit<ContactProps, 'status' | 'interactions'> & { status?: ContactStatus },
    id?: UniqueId
  ): Contact {
    const contact = new Contact(
      {
        ...props,
        status: props.status ?? ContactStatus.LEAD,
        interactions: [],
      },
      id
    );
    contact.addDomainEvent(
      new ContactCreatedEvent(contact.id.value, contact.fullName, contact.email.value)
    );
    return contact;
  }

  public static reconstitute(props: ContactProps, id: UniqueId): Contact {
    return new Contact(props, id);
  }

  public updateStatus(status: ContactStatus): void {
    const previousStatus = this.props.status;
    this.props.status = status;
    this.touch();
    this.addDomainEvent(new ContactStatusChangedEvent(this.id.value, previousStatus, status));
  }

  public addInteraction(interaction: Omit<ContactInteraction, 'id' | 'timestamp'>): void {
    const newInteraction: ContactInteraction = {
      ...interaction,
      id: UniqueId.create().value,
      timestamp: new Date(),
    };
    this.props.interactions = [...(this.props.interactions ?? []), newInteraction];
    this.touch();
  }

  public updateScore(score: number): void {
    this.props.score = Math.max(0, Math.min(100, score));
    this.touch();
  }

  public addTag(tag: string): void {
    if (!this.props.tags) {
      this.props.tags = [];
    }
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  public removeTag(tag: string): void {
    if (this.props.tags) {
      this.props.tags = this.props.tags.filter((t) => t !== tag);
      this.touch();
    }
  }
}
