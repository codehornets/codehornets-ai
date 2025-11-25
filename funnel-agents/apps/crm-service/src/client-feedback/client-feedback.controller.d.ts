import { ClientFeedbackService } from './client-feedback.service';
import { CreateClientFeedbackDto } from './dto/create-client-feedback.dto';
import { UpdateClientFeedbackDto } from './dto/update-client-feedback.dto';
import { FilterClientFeedbackDto } from './dto/filter-client-feedback.dto';
export declare class ClientFeedbackController {
    private readonly clientFeedbackService;
    constructor(clientFeedbackService: ClientFeedbackService);
    findAll(filters?: FilterClientFeedbackDto): Promise<{
        data: import("./client-feedback.entity").ClientFeedback[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./client-feedback.entity").ClientFeedback>;
    create(createClientFeedbackDto: CreateClientFeedbackDto): Promise<import("./client-feedback.entity").ClientFeedback>;
    update(payload: {
        id: string;
        data: UpdateClientFeedbackDto;
    }): Promise<import("./client-feedback.entity").ClientFeedback>;
    remove(id: string): Promise<void>;
}
