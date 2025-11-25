import { TasksService } from '@funnelagents/application';
import { BaseController } from './base.controller';
import { CreateTaskDto, UpdateTaskDto, ExecuteTaskDto, CompleteTaskDto, FailTaskDto, CancelTaskDto, TaskQueryDto } from '../dto/task.dto';
export declare class TasksController extends BaseController<any, CreateTaskDto, UpdateTaskDto> {
    private readonly tasksService;
    protected readonly service: any;
    constructor(tasksService: TasksService);
    create(dto: CreateTaskDto): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").CreateTaskResult>>;
    findAll(query: TaskQueryDto): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").TaskDto[]>>;
    findOne(id: string): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").TaskDto>>;
    update(id: string, dto: UpdateTaskDto): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").UpdateTaskResult>>;
    remove(id: string): Promise<void>;
    execute(id: string, dto: ExecuteTaskDto): Promise<import("./base.controller").ApiResponseWrapper<import("@funnelagents/application").ExecuteTaskResult>>;
    complete(id: string, dto: CompleteTaskDto): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
    }>>;
    fail(id: string, dto: FailTaskDto): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
    }>>;
    cancel(id: string, dto: CancelTaskDto): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
    }>>;
    retry(id: string): Promise<import("./base.controller").ApiResponseWrapper<{
        message: string;
    }>>;
}
