import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientFeedback } from './client-feedback.entity';
import { ClientFeedbackService } from './client-feedback.service';
import { ClientFeedbackController } from './client-feedback.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientFeedback])],
  controllers: [ClientFeedbackController],
  providers: [ClientFeedbackService],
  exports: [ClientFeedbackService],
})
export class ClientFeedbackModule {}
