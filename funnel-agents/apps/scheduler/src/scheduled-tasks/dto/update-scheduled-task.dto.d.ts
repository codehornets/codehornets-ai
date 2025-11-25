import { CreateScheduledTaskDto } from './create-scheduled-task.dto';
import { TaskStatus } from '../entities/scheduled-task.entity';
declare const UpdateScheduledTaskDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateScheduledTaskDto>>;
export declare class UpdateScheduledTaskDto extends UpdateScheduledTaskDto_base {
    status?: TaskStatus;
}
export {};
