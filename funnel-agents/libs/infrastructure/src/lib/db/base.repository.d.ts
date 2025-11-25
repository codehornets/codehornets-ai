import { Repository, FindOptionsWhere } from 'typeorm';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
/**
 * Base repository with support for both DB entity and domain entity types.
 * @template DbEntity - The TypeORM database entity type
 * @template DomainEntity - The domain entity type (defaults to DbEntity if not specified)
 */
export declare abstract class BaseRepository<DbEntity extends {
    id: string;
}, DomainEntity = DbEntity> {
    protected readonly repository: Repository<DbEntity>;
    constructor(repository: Repository<DbEntity>);
    findById(id: string): Promise<DomainEntity | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<DomainEntity>>;
    save(domainEntity: DomainEntity): Promise<DomainEntity>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    count(where?: FindOptionsWhere<DbEntity>): Promise<number>;
    protected paginate(queryBuilder: any, params?: PaginationParams): Promise<PaginatedResult<DomainEntity>>;
    /**
     * Convert a database entity to a domain entity.
     * Override this in derived classes when DomainEntity !== DbEntity.
     */
    protected toDomain(entity: DbEntity): DomainEntity;
    /**
     * Convert a domain entity to a database entity.
     * Override this in derived classes when DomainEntity !== DbEntity.
     */
    protected toDatabase(domainEntity: DomainEntity): Partial<DbEntity>;
}
