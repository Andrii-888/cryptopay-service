// src/aml/aml.types.ts

export type AmlStatus = 'clean' | 'warning' | 'risky';

export interface AmlCheckInput {
  invoiceId: string;
  fiatAmount: number;
  cryptoAmount: number;
  cryptoCurrency: string;

  // сеть и адрес/tx — будут нужны для Crystal
  network?: string | null;
  walletAddress?: string | null;
  txHash?: string | null;
}

export interface AmlCheckResult {
  status: AmlStatus;
  riskScore: number;

  // JSON-ответ от провайдера (Crystal или внутренний)
  raw: any;

  // имя провайдера
  provider: 'internal-demo' | 'crystal';
}
