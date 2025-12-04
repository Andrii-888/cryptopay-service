// src/invoices/dto/create-invoice.dto.ts

// DTO = Data Transfer Object.
// Это форма данных, которые бэкенд принимает в POST /invoices.

export class CreateInvoiceDto {
  // Сумма в фиате (например, 249)
  fiatAmount: number;

  // Валюта фиата (например, 'EUR', 'CHF', 'USD')
  fiatCurrency: string;

  // Криптовалюта, в которой клиент будет платить ('USDT', 'USDC' и т.п.)
  cryptoCurrency: string;
}
