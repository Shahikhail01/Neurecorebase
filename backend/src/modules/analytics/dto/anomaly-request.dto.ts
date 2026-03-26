import {
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class AnomalyRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /** 2-D array of numeric vectors — each inner array is one sample */
  @IsArray()
  @ArrayNotEmpty()
  vectors!: number[][];
}
