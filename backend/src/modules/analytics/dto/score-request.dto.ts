import { IsObject, IsOptional, IsUUID } from 'class-validator';

/**
 * ScoreRequestDto
 * SRP: carries only the request payload for a single scoring call.
 */
export class ScoreRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsObject()
  features!: Record<string, unknown>;
}
