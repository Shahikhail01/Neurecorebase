import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class EmbedRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  texts!: string[];
}
