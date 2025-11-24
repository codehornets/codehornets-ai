import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

export abstract class BaseRepository<Entity extends { id: string }> {
  constructor(protected readonly repository: Repository<Entity>) {}

  async findById(id: string): Promise<Entity | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<Entity>,
    });
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Entity>> {
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
      data,
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

  async save(entity: DeepPartial<Entity>): Promise<Entity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as FindOptionsWhere<Entity>,
    });
    return count > 0;
  }

  async count(where?: FindOptionsWhere<Entity>): Promise<number> {
    return this.repository.count({ where });
  }

  protected async paginate(
    queryBuilder: any,
    params?: PaginationParams
  ): Promise<PaginatedResult<Entity>> {
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
      data,
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
}
