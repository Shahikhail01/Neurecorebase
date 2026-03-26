import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RegisterConnectorDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  /** provider key, e.g. "salesforce" | "hubspot" | "pipedrive" */
  @IsString()
  @MaxLength(50)
  provider!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class ConnectConnectorDto {
  @IsObject()
  config!: Record<string, unknown>;
}

export class SyncConnectorDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  contacts?: boolean;

  @IsOptional()
  @IsBoolean()
  leads?: boolean;
}
