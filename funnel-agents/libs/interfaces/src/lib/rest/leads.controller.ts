import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseController } from './base.controller';
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto, QualifyLeadDto } from '../dto/lead.dto';
import { LeadsService } from '@funnelagents/application';

@ApiTags('leads')
@Controller('leads')
export class LeadsController extends BaseController<any, CreateLeadDto, UpdateLeadDto> {
  protected readonly service: any;

  constructor(private readonly leadsService: LeadsService) {
    super();
    this.service = leadsService;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 409, description: 'Lead already exists' })
  async create(@Body(ValidationPipe) dto: CreateLeadDto) {
    try {
      const lead = await this.leadsService.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        jobTitle: dto.jobTitle,
        source: dto.source,
        status: dto.status,
        score: dto.score,
        metadata: dto.metadata,
        tags: dto.tags,
        campaignId: dto.campaignId,
      });

      return this.success({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.job_title,
        source: lead.source,
        status: lead.status,
        score: lead.score,
        scoreBreakdown: lead.score_breakdown,
        metadata: lead.metadata,
        tags: lead.tags,
        campaignId: lead.campaign_id,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all leads with filters' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  async findAll(@Query(ValidationPipe) query: LeadQueryDto) {
    const filters = {
      status: query.status,
      source: query.source,
      campaignId: query.campaignId,
      minScore: query.minScore,
      search: query.search,
    };

    const paginationParams = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const result = await this.leadsService.findAll(filters, paginationParams);

    const data = result.data.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.job_title,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      scoreBreakdown: lead.score_breakdown,
      tags: lead.tags,
      campaignId: lead.campaign_id,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    }));

    return this.paginated(data, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string) {
    const lead = await this.leadsService.findById(id);

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return this.success({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.job_title,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      scoreBreakdown: lead.score_breakdown,
      metadata: lead.metadata,
      tags: lead.tags,
      campaignId: lead.campaign_id,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lead' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateLeadDto
  ) {
    try {
      const lead = await this.leadsService.update(id, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        jobTitle: dto.jobTitle,
        status: dto.status,
        score: dto.score,
        metadata: dto.metadata,
        tags: dto.tags,
        isQualified: dto.isQualified,
      });

      return this.success({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.job_title,
        source: lead.source,
        status: lead.status,
        score: lead.score,
        scoreBreakdown: lead.score_breakdown,
        metadata: lead.metadata,
        tags: lead.tags,
        campaignId: lead.campaign_id,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead' })
  @ApiResponse({ status: 204, description: 'Lead deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(@Param('id') id: string) {
    try {
      await this.leadsService.delete(id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/qualify')
  @ApiOperation({ summary: 'Qualify lead' })
  @ApiResponse({ status: 200, description: 'Lead qualified successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async qualify(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: QualifyLeadDto
  ) {
    try {
      const lead = await this.leadsService.qualify(id, {
        score: dto.score,
        notes: dto.notes,
        qualifiedBy: dto.qualifiedBy,
      });

      return this.success({
        message: 'Lead qualified successfully',
        lead: {
          id: lead.id,
          status: lead.status,
          score: lead.score,
          scoreBreakdown: lead.score_breakdown,
        },
      });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to customer' })
  @ApiResponse({ status: 200, description: 'Lead converted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async convert(@Param('id') id: string) {
    try {
      const lead = await this.leadsService.convert(id);

      return this.success({
        message: 'Lead converted successfully',
        lead: {
          id: lead.id,
          status: lead.status,
          convertedAt: lead.metadata?.converted_at,
        },
      });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get lead activities' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async getActivities(@Param('id') id: string, @Query(ValidationPipe) query: any) {
    try {
      const filters = {
        type: query.type,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      };

      const paginationParams = {
        page: query.page || 1,
        limit: query.limit || 10,
      };

      const result = await this.leadsService.getActivities(id, filters, paginationParams);

      return this.paginated(result.data, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get(':id/score-history')
  @ApiOperation({ summary: 'Get lead score history' })
  @ApiResponse({ status: 200, description: 'Score history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async getScoreHistory(@Param('id') id: string) {
    try {
      const history = await this.leadsService.getScoreHistory(id);
      return this.success(history);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk import leads' })
  @ApiResponse({ status: 200, description: 'Leads imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid import data' })
  async bulkImport(@Body() dto: { leads: CreateLeadDto[] }) {
    try {
      if (!dto.leads || !Array.isArray(dto.leads)) {
        throw new BadRequestException('Invalid import data: leads array is required');
      }

      const result = await this.leadsService.bulkImport(dto.leads);

      return this.success({
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        message: `Successfully imported ${result.imported} leads, skipped ${result.skipped}`,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('export')
  @ApiOperation({ summary: 'Export leads' })
  @ApiResponse({ status: 200, description: 'Leads export initiated' })
  async export(@Query(ValidationPipe) query: LeadQueryDto) {
    const filters = {
      status: query.status,
      source: query.source,
      campaignId: query.campaignId,
      minScore: query.minScore,
      search: query.search,
    };

    const leads = await this.leadsService.export(filters);

    return this.success({
      count: leads.length,
      leads: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.job_title,
        source: lead.source,
        status: lead.status,
        score: lead.score,
        tags: lead.tags,
        createdAt: lead.created_at,
      })),
    });
  }
}
