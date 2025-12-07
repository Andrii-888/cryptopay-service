// src/invoices/dto/update-aml.dto.ts

export type AmlStatus = 'clean' | 'warning' | 'risky';

export class UpdateAmlDto {
  /**
   * AML risk score (0–100).
   * Можно не передавать, если хотим обновить только статус.
   */
  riskScore?: number;

  /**
   * AML status: "clean" | "warning" | "risky".
   * Можно не передавать, если хотим обновить только score.
   */
  amlStatus?: AmlStatus;
}
