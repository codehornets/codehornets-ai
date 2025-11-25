import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AgentDbEntity,
  AgentFeedbackDbEntity,
  AgentTuningDbEntity,
  AgentTemplateDbEntity,
} from '@funnelagents/infrastructure';
import {
  AgentRepository,
  AgentFeedbackRepository,
  AgentTuningRepository,
  AgentTemplateRepository,
} from '@funnelagents/infrastructure';
import {
  AgentsService,
  AgentFeedbackService,
  AgentTuningService,
  AgentTemplateService,
} from '@funnelagents/application';
import {
  AGENT_REPOSITORY,
  AGENT_FEEDBACK_REPOSITORY,
  AGENT_TUNING_REPOSITORY,
  AGENT_TEMPLATE_REPOSITORY,
} from '@funnelagents/domain';
import { AgentsController } from '../controllers/agents.controller';
import { AgentFeedbackController } from '../controllers/agent-feedback.controller';
import { AgentTuningController } from '../controllers/agent-tuning.controller';
import { AgentTemplateController } from '../controllers/agent-template.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentDbEntity,
      AgentFeedbackDbEntity,
      AgentTuningDbEntity,
      AgentTemplateDbEntity,
    ]),
  ],
  controllers: [
    AgentsController,
    AgentFeedbackController,
    AgentTuningController,
    AgentTemplateController,
  ],
  providers: [
    // Repositories
    AgentRepository,
    {
      provide: AGENT_REPOSITORY,
      useClass: AgentRepository,
    },
    AgentFeedbackRepository,
    {
      provide: AGENT_FEEDBACK_REPOSITORY,
      useClass: AgentFeedbackRepository,
    },
    AgentTuningRepository,
    {
      provide: AGENT_TUNING_REPOSITORY,
      useClass: AgentTuningRepository,
    },
    AgentTemplateRepository,
    {
      provide: AGENT_TEMPLATE_REPOSITORY,
      useClass: AgentTemplateRepository,
    },
    // Services
    AgentsService,
    AgentFeedbackService,
    AgentTuningService,
    AgentTemplateService,
  ],
  exports: [AgentsService, AgentFeedbackService, AgentTuningService, AgentTemplateService],
})
export class AgentsModule {}
