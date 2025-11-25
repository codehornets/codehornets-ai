/**
 * CRM Service - Public API Exports
 *
 * This file exports all public interfaces, DTOs, and entities
 * that can be used by other services or the API Gateway.
 */

// Workspaces
export { Workspace } from './workspaces/workspace.entity';
export { CreateWorkspaceDto } from './workspaces/dto/create-workspace.dto';
export { UpdateWorkspaceDto } from './workspaces/dto/update-workspace.dto';
export { OnboardWorkspaceDto } from './workspaces/dto/onboard-workspace.dto';
export { WorkspacesService } from './workspaces/workspaces.service';
export { WorkspacesController } from './workspaces/workspaces.controller';
export { WorkspacesModule } from './workspaces/workspaces.module';

// Leads
export { Lead } from '@funnelagents/domain';
export { CreateLeadDto } from './leads/dto/create-lead.dto';
export { UpdateLeadDto } from './leads/dto/update-lead.dto';
export { FilterLeadDto } from './leads/dto/filter-lead.dto';
export { LeadsService } from './leads/leads.service';
export { LeadsController } from './leads/leads.controller';
export { LeadsModule } from './leads/leads.module';

// Lead Activities
export { LeadActivity } from './lead-activities/lead-activity.entity';
export { CreateLeadActivityDto } from './lead-activities/dto/create-lead-activity.dto';
export { FilterLeadActivityDto } from './lead-activities/dto/filter-lead-activity.dto';
export { LeadActivitiesService } from './lead-activities/lead-activities.service';
export { LeadActivitiesController } from './lead-activities/lead-activities.controller';
export { LeadActivitiesModule } from './lead-activities/lead-activities.module';

// Contacts
export { Contact } from './contacts/contact.entity';
export { CreateContactDto } from './contacts/dto/create-contact.dto';
export { UpdateContactDto } from './contacts/dto/update-contact.dto';
export { FilterContactDto } from './contacts/dto/filter-contact.dto';
export { ContactsService } from './contacts/contacts.service';
export { ContactsController } from './contacts/contacts.controller';
export { ContactsModule } from './contacts/contacts.module';

// Deals
export { Deal } from './deals/deal.entity';
export { CreateDealDto } from './deals/dto/create-deal.dto';
export { UpdateDealDto } from './deals/dto/update-deal.dto';
export { UpdateDealStageDto } from './deals/dto/update-deal-stage.dto';
export { FilterDealDto } from './deals/dto/filter-deal.dto';
export { DealsService } from './deals/deals.service';
export { DealsController } from './deals/deals.controller';
export { DealsModule } from './deals/deals.module';

// Client Feedback
export { ClientFeedback } from './client-feedback/client-feedback.entity';
export { CreateClientFeedbackDto } from './client-feedback/dto/create-client-feedback.dto';
export { UpdateClientFeedbackDto } from './client-feedback/dto/update-client-feedback.dto';
export { FilterClientFeedbackDto } from './client-feedback/dto/filter-client-feedback.dto';
export { ClientFeedbackService } from './client-feedback/client-feedback.service';
export { ClientFeedbackController } from './client-feedback/client-feedback.controller';
export { ClientFeedbackModule } from './client-feedback/client-feedback.module';

// App Module
export { AppModule } from './app.module';
