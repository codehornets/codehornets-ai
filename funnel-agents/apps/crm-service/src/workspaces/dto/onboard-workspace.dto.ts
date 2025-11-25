import { IsObject, IsOptional } from 'class-validator';

export class OnboardWorkspaceDto {
  @IsOptional()
  @IsObject()
  onboardingData?: Record<string, any>;
}
