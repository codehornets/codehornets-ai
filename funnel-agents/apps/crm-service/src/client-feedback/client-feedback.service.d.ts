import { Repository } from 'typeorm';
import { ClientFeedback } from './client-feedback.entity';
import { CreateClientFeedbackDto } from './dto/create-client-feedback.dto';
import { UpdateClientFeedbackDto } from './dto/update-client-feedback.dto';
import { FilterClientFeedbackDto } from './dto/filter-client-feedback.dto';
export declare class ClientFeedbackService {
    private clientFeedbackRepository;
    constructor(clientFeedbackRepository: Repository<ClientFeedback>);
    findAll(filters?: FilterClientFeedbackDto): Promise<{
        data: ClientFeedback[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<ClientFeedback>;
    create(createClientFeedbackDto: CreateClientFeedbackDto): Promise<ClientFeedback>;
    update(id: string, updateClientFeedbackDto: UpdateClientFeedbackDto): Promise<ClientFeedback>;
    remove(id: string): Promise<void>;
}
