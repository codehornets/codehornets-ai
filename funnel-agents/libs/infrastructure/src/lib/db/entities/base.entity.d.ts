import { BaseEntity as TypeOrmBaseEntity } from 'typeorm';
export declare abstract class BaseDbEntity extends TypeOrmBaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
