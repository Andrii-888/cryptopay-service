// src/invoices/dto/create-invoice.dto.ts

export class CreateInvoiceDto {
  /**
   * Сумма в фиате (то, что видит магазин и платит клиент).
   * Пример: 1399.00
   */
  fiatAmount!: number;

  /**
   * Валюта фиата.
   * Пример: "EUR", "CHF"
   */
  fiatCurrency!: string;

  /**
   * Криптовалюта, в которой клиент будет платить.
   * Пример: "USDT", "USDC"
   */
  cryptoCurrency!: string;
}
