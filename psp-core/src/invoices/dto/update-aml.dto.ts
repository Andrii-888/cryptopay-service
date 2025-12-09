// src/invoices/dto/update-aml.dto.ts
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import type { AmlStatus, AssetStatus } from '../../aml/aml.service';

export class UpdateAmlDto {
  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsIn(['clean', 'warning', 'risky'])
  amlStatus?: AmlStatus;

  @IsOptional()
  @IsNumber()
  assetRiskScore?: number;

  @IsOptional()
  @IsIn(['clean', 'suspicious', 'blocked'])
  assetStatus?: AssetStatus;
}
