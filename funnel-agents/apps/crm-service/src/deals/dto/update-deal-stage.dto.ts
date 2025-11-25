import { IsEnum } from 'class-validator';

export class UpdateDealStageDto {
  @IsEnum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
}
