import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientFeedback } from './client-feedback.entity';
import { CreateClientFeedbackDto } from './dto/create-client-feedback.dto';
import { UpdateClientFeedbackDto } from './dto/update-client-feedback.dto';
import { FilterClientFeedbackDto } from './dto/filter-client-feedback.dto';

@Injectable()
export class ClientFeedbackService {
  constructor(
    @InjectRepository(ClientFeedback)
    private clientFeedbackRepository: Repository<ClientFeedback>,
  ) {}

  async findAll(filters?: FilterClientFeedbackDto): Promise<{
    data: ClientFeedback[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.clientFeedbackRepository.createQueryBuilder('feedback');

    if (filters?.workspace_id) {
      queryBuilder.andWhere('feedback.workspace_id = :workspace_id', {
        workspace_id: filters.workspace_id,
      });
    }

    if (filters?.contact_id) {
      queryBuilder.andWhere('feedback.contact_id = :contact_id', {
        contact_id: filters.contact_id,
      });
    }

    if (filters?.sentiment) {
      queryBuilder.andWhere('feedback.sentiment = :sentiment', {
        sentiment: filters.sentiment,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('feedback.status = :status', {
        status: filters.status,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('feedback.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<ClientFeedback> {
    const feedback = await this.clientFeedbackRepository.findOne({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Client feedback with ID ${id} not found`);
    }

    return feedback;
  }

  async create(
    createClientFeedbackDto: CreateClientFeedbackDto,
  ): Promise<ClientFeedback> {
    const feedback = this.clientFeedbackRepository.create(
      createClientFeedbackDto,
    );
    return this.clientFeedbackRepository.save(feedback);
  }

  async update(
    id: string,
    updateClientFeedbackDto: UpdateClientFeedbackDto,
  ): Promise<ClientFeedback> {
    const feedback = await this.findOne(id);
    Object.assign(feedback, updateClientFeedbackDto);
    return this.clientFeedbackRepository.save(feedback);
  }

  async remove(id: string): Promise<void> {
    const feedback = await this.findOne(id);
    await this.clientFeedbackRepository.remove(feedback);
  }
}
