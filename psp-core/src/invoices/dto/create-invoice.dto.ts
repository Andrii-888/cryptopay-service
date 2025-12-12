// src/invoices/dto/create-invoice.dto.ts
import { IsNumber, IsString, IsOptional, IsPositive } from 'class-validator';

export class CreateInvoiceDto {
  @IsNumber()
  @IsPositive()
  fiatAmount!: number;

  @IsString()
  fiatCurrency!: string;

  @IsString()
  cryptoCurrency!: string;

  @IsOptional()
  @IsString()
  merchantId?: string;
}
