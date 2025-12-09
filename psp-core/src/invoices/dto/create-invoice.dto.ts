// src/invoices/dto/create-invoice.dto.ts
import {
  IsNumber,
  IsPositive,
  IsString,
  Length,
  IsOptional,
} from 'class-validator';

export class CreateInvoiceDto {
  /**
   * Сумма в фиате (то, что видит магазин и платит клиент).
   * Пример: 1399.00
   */
  @IsNumber()
  @IsPositive()
  fiatAmount!: number;

  /**
   * Валюта фиата.
   * Пример: "EUR", "CHF"
   */
  @IsString()
  @Length(3, 3)
  fiatCurrency!: string;

  /**
   * Криптовалюта, в которой клиент будет платить.
   * Пример: "USDT", "USDC"
   */
  @IsString()
  @Length(3, 10)
  cryptoCurrency!: string;

  /**
   * ID мерчанта (опционально, но мы его принимаем).
   */
  @IsOptional()
  @IsString()
  merchantId?: string;
}
