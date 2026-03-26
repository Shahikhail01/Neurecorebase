import { IsInt, IsOptional, Min, Max, IsUUID } from 'class-validator';

export class ForecastRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  periods?: number = 30;
}
