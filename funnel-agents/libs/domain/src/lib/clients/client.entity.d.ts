import { AggregateRoot, UniqueId, Email, Status } from '../shared-kernel';
export interface ClientProps {
    name: string;
    email: Email;
    company?: string;
    phone?: string;
    status: Status;
    metadata?: Record<string, unknown>;
}
export declare class Client extends AggregateRoot<ClientProps> {
    private constructor();
    get name(): string;
    get email(): Email;
    get company(): string | undefined;
    get phone(): string | undefined;
    get status(): Status;
    get metadata(): Record<string, unknown> | undefined;
    static create(props: Omit<ClientProps, 'status'>, id?: UniqueId): Client;
    static reconstitute(props: ClientProps, id: UniqueId): Client;
    update(props: Partial<Omit<ClientProps, 'status'>>): void;
    activate(): void;
    deactivate(): void;
    archive(): void;
}
