import { AggregateRoot, UniqueId, Email, Status } from '../shared-kernel';
import { ClientCreatedEvent, ClientUpdatedEvent } from './client.events';

export interface ClientProps {
  name: string;
  email: Email;
  company?: string;
  phone?: string;
  status: Status;
  metadata?: Record<string, unknown>;
}

export class Client extends AggregateRoot<ClientProps> {
  private constructor(props: ClientProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get company(): string | undefined {
    return this.props.company;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get status(): Status {
    return this.props.status;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  public static create(props: Omit<ClientProps, 'status'>, id?: UniqueId): Client {
    const client = new Client(
      {
        ...props,
        status: Status.ACTIVE,
      },
      id
    );
    client.addDomainEvent(new ClientCreatedEvent(client.id.value, client.name, client.email.value));
    return client;
  }

  public static reconstitute(props: ClientProps, id: UniqueId): Client {
    return new Client(props, id);
  }

  public update(props: Partial<Omit<ClientProps, 'status'>>): void {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }
    if (props.email !== undefined) {
      this.props.email = props.email;
    }
    if (props.company !== undefined) {
      this.props.company = props.company;
    }
    if (props.phone !== undefined) {
      this.props.phone = props.phone;
    }
    if (props.metadata !== undefined) {
      this.props.metadata = { ...this.props.metadata, ...props.metadata };
    }
    this.touch();
    this.addDomainEvent(new ClientUpdatedEvent(this.id.value));
  }

  public activate(): void {
    this.props.status = Status.ACTIVE;
    this.touch();
  }

  public deactivate(): void {
    this.props.status = Status.INACTIVE;
    this.touch();
  }

  public archive(): void {
    this.props.status = Status.ARCHIVED;
    this.touch();
  }
}
