import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadActivity } from './lead-activity.entity';
import { LeadActivitiesService } from './lead-activities.service';
import { LeadActivitiesController } from './lead-activities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadActivity])],
  controllers: [LeadActivitiesController],
  providers: [LeadActivitiesService],
  exports: [LeadActivitiesService],
})
export class LeadActivitiesModule {}
