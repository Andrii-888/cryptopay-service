// src/aml/aml.service.ts

import { Injectable, Logger } from '@nestjs/common';

export interface AmlCheckInput {
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
}

export interface AmlCheckResult {
  riskScore: number; // 0–100
  level: 'low' | 'medium' | 'high';
  flagged: boolean; // true = needs manual review
}

@Injectable()
export class AmlService {
  private readonly logger = new Logger(AmlService.name);

  /**
   * Draft AML / risk check.
   * Сейчас это просто заглушка с простой логикой по сумме,
   * позже здесь будет реальный вызов внешнего AML-провайдера.
   */
  async checkInvoice(input: AmlCheckInput): Promise<AmlCheckResult> {
    const { fiatAmount, fiatCurrency, cryptoCurrency } = input;

    // Примитивный риск-движок по сумме
    let riskScore = 5;

    if (fiatAmount >= 10_000) {
      riskScore = 80; // high risk
    } else if (fiatAmount >= 3_000) {
      riskScore = 40; // medium risk
    }

    const level: AmlCheckResult['level'] =
      riskScore >= 70 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

    const flagged = level !== 'low';

    this.logger.log(
      `AML check: amount=${fiatAmount} ${fiatCurrency}, crypto=${cryptoCurrency}, ` +
        `score=${riskScore}, level=${level}, flagged=${flagged}`,
    );

    return { riskScore, level, flagged };
  }
}
