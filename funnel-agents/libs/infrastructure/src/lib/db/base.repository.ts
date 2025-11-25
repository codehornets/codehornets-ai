import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

/**
 * Base repository with support for both DB entity and domain entity types.
 * @template DbEntity - The TypeORM database entity type
 * @template DomainEntity - The domain entity type (defaults to DbEntity if not specified)
 */
export abstract class BaseRepository<
  DbEntity extends { id: string },
  DomainEntity = DbEntity
> {
  constructor(protected readonly repository: Repository<DbEntity>) {}

  async findById(id: string): Promise<DomainEntity | null> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<DbEntity>,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<DomainEntity>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: limit,
      order: params?.sortBy
        ? { [params.sortBy]: params.sortOrder ?? 'asc' } as any
        : { createdAt: 'DESC' } as any,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((entity) => this.toDomain(entity)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async save(domainEntity: DomainEntity): Promise<DomainEntity> {
    const dbEntity = this.toDatabase(domainEntity);
    const saved = await this.repository.save(dbEntity as DeepPartial<DbEntity>);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as FindOptionsWhere<DbEntity>,
    });
    return count > 0;
  }

  async count(where?: FindOptionsWhere<DbEntity>): Promise<number> {
    return this.repository.count({ where });
  }

  protected async paginate(
    queryBuilder: any,
    params?: PaginationParams
  ): Promise<PaginatedResult<DomainEntity>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    if (params?.sortBy) {
      queryBuilder.orderBy(
        `entity.${params.sortBy}`,
        params.sortOrder?.toUpperCase() ?? 'ASC'
      );
    } else {
      queryBuilder.orderBy('entity.createdAt', 'DESC');
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((entity: DbEntity) => this.toDomain(entity)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Convert a database entity to a domain entity.
   * Override this in derived classes when DomainEntity !== DbEntity.
   */
  protected toDomain(entity: DbEntity): DomainEntity {
    return entity as unknown as DomainEntity;
  }

  /**
   * Convert a domain entity to a database entity.
   * Override this in derived classes when DomainEntity !== DbEntity.
   */
  protected toDatabase(domainEntity: DomainEntity): Partial<DbEntity> {
    return domainEntity as unknown as Partial<DbEntity>;
  }
}
