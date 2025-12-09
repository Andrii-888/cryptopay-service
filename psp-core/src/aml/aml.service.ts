// src/aml/aml.service.ts

import { Injectable, Logger } from '@nestjs/common';

export type AmlStatus = 'clean' | 'warning' | 'risky';
export type AssetStatus = 'clean' | 'suspicious' | 'blocked';

export interface AmlCheckInput {
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;

  // Поля «на будущее» для реальных AML-провайдеров (Crystal и др.)
  network?: string;
  walletAddress?: string;
  txHash?: string;
  invoiceId?: string;
}

export interface AmlCheckResult {
  // 0–100: чем выше, тем рискованнее
  riskScore: number;

  // Удобный уровень для UI / дашборда
  level: 'low' | 'medium' | 'high';

  // true = нужна ручная проверка / внимание
  flagged: boolean;

  // Чёткий статус для хранения в БД
  status: AmlStatus;

  // Кто дал оценку — демо или внешний провайдер
  provider: 'internal-demo' | 'crystal';

  // «Чистота» самого актива (стейблкоина)
  assetStatus: AssetStatus;
  assetRiskScore: number;

  // Сырые данные провайдера (под реальный API)
  raw: any;
}

@Injectable()
export class AmlService {
  private readonly logger = new Logger(AmlService.name);

  /**
   * Основная точка входа для всех AML-проверок.
   *
   * Сейчас:
   *  - всегда используем внутренний демо-движок (checkInvoiceInternal).
   *
   * Потом:
   *  - можно переключать на внешний провайдер (Crystal) через переменную окружения:
   *      if (process.env.AML_PROVIDER === 'crystal') → checkInvoiceExternal();
   */
  async checkInvoice(input: AmlCheckInput): Promise<AmlCheckResult> {
    // 🔹 Пока только внутренний движок (демо)
    return this.checkInvoiceInternal(input);

    // 🔹 Будущая логика:
    // if (process.env.AML_PROVIDER === 'crystal') {
    //   return this.checkInvoiceExternal(input);
    // }
    // return this.checkInvoiceInternal(input);
  }

  /**
   * Внутренний демо-движок.
   *
   * Логика:
   * 1) Сначала оцениваем "чистоту" стейблкоина (USDT/USDC и др.).
   * 2) Потом считаем риск по сумме.
   * 3) Комбинируем оба в общий riskScore и статус.
   */
  private async checkInvoiceInternal(
    input: AmlCheckInput,
  ): Promise<AmlCheckResult> {
    const {
      fiatAmount,
      fiatCurrency,
      cryptoCurrency,
      invoiceId,
      network,
      walletAddress,
      txHash,
    } = input;

    // 1) Сначала — "чистота" стейблкоина (готово под внешний провайдер)
    const { assetRiskScore, assetStatus } =
      this.evaluateStablecoinCleanliness(cryptoCurrency);

    // 2) Потом — риск по сумме (твоя оригинальная логика, вынесенная в отдельный метод)
    const amountRiskScore = this.evaluateAmountRisk(fiatAmount);

    // 3) Комбинируем оба риска
    //    Например: 40% — чистота актива, 60% — сумма
    let riskScore = Math.round(assetRiskScore * 0.4 + amountRiskScore * 0.6);

    // Лёгкий tweak по фиатной валюте (демо):
    const normalizedFiat = fiatCurrency?.toUpperCase?.() || '';
    if (!['CHF', 'EUR', 'USD'].includes(normalizedFiat)) {
      riskScore += 5;
    }

    // Нормализуем в диапазон 0–100
    riskScore = Math.min(100, Math.max(0, riskScore));

    // 4) Мэппинг riskScore → level / status / flagged
    let status: AmlStatus = 'clean';
    let level: AmlCheckResult['level'] = 'low';

    if (riskScore >= 70) {
      status = 'risky';
      level = 'high';
    } else if (riskScore >= 30) {
      status = 'warning';
      level = 'medium';
    }

    const flagged = level !== 'low';

    const result: AmlCheckResult = {
      riskScore,
      level,
      flagged,
      status,
      provider: 'internal-demo',
      assetStatus,
      assetRiskScore,
      raw: {
        rules: ['stablecoin-cleanliness-demo', 'simple-amount-threshold'],
        fiatAmount,
        fiatCurrency,
        cryptoCurrency,
        invoiceId,
        network,
        walletAddress,
        txHash,
      },
    };

    this.logger.log(
      `AML (internal) invoice=${invoiceId ?? 'N/A'}: ` +
        `amount=${fiatAmount} ${fiatCurrency}, crypto=${cryptoCurrency}, ` +
        `score=${riskScore}, level=${level}, status=${status}, flagged=${flagged}, ` +
        `assetStatus=${assetStatus}, assetRiskScore=${assetRiskScore}`,
    );

    return result;
  }

  /**
   * Заготовка под внешний AML-провайдер (Crystal и др.).
   *
   * Пока это заглушка:
   *  - мы НЕ делаем реальный HTTP-запрос,
   *  - используем внутренний результат как fallback,
   *  - помечаем provider как 'crystal' и добавляем TODO в raw.
   *
   * Когда подключим Crystal:
   *  - здесь будет HTTP-вызов к API Crystal
   *  - парсинг ответа
   *  - маппинг в формат AmlCheckResult.
   */
  async checkInvoiceExternal(input: AmlCheckInput): Promise<AmlCheckResult> {
    const internalResult = await this.checkInvoiceInternal(input);

    const result: AmlCheckResult = {
      ...internalResult,
      provider: 'crystal',
      raw: {
        todo: 'Replace with real Crystal API response mapping',
        internalFallback: internalResult.raw,
      },
    };

    this.logger.log(
      `AML (external stub) invoice=${input.invoiceId ?? 'N/A'}: ` +
        `using Crystal stub, score=${result.riskScore}, status=${result.status}, ` +
        `assetStatus=${result.assetStatus}, assetRiskScore=${result.assetRiskScore}`,
    );

    return result;
  }

  /**
   * Шаг 1: "чистота" стейблкоина.
   *
   * Сейчас демо-логика:
   *  - USDT / USDC → считаем clean с низким риском (10)
   *  - другие монеты → suspicious с более высоким риском (40)
   *
   * TODO: сюда интегрировать Crystal / другой провайдер:
   *  - использовать txHash / walletAddress / network
   *  - вернуть score + теги (sanctions / darknet / scam и т.п.)
   */
  private evaluateStablecoinCleanliness(cryptoCurrency: string): {
    assetRiskScore: number;
    assetStatus: AssetStatus;
  } {
    const normalized = cryptoCurrency?.toUpperCase?.() || '';

    if (normalized === 'USDT' || normalized === 'USDC') {
      return {
        assetRiskScore: 10,
        assetStatus: 'clean',
      };
    }

    // всё остальное — пока как более рискованное (демо)
    return {
      assetRiskScore: 40,
      assetStatus: 'suspicious',
    };
  }

  /**
   * Шаг 2: оценка риска по сумме.
   *
   * < 1000      → low
   * 1000–3000   → лёгкое повышение
   * 3000–10000  → средний риск
   * >= 10000    → высокий риск
   */
  private evaluateAmountRisk(fiatAmount: number): number {
    let riskScore = 5;

    if (fiatAmount >= 10_000) {
      riskScore = 85; // высокий риск
    } else if (fiatAmount >= 3_000) {
      riskScore = 45; // средний риск
    } else if (fiatAmount >= 1_000) {
      riskScore = 20; // лёгкое повышение
    }

    return riskScore;
  }
}
