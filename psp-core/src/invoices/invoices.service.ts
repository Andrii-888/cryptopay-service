// src/invoices/invoices.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SqliteService } from '../db/sqlite.service';
import { AmlService } from '../aml/aml.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AttachTransactionDto } from './dto/attach-transaction.dto';
import { UpdateAmlDto } from './dto/update-aml.dto';
import { WebhookEvent } from '../webhooks/interfaces/webhook-event.interface';
import { WebhookDispatchResult } from '../webhooks/interfaces/webhook-dispatch-result.interface';

export type InvoiceStatus = 'waiting' | 'confirmed' | 'expired' | 'rejected';

export interface Invoice {
  id: string;
  createdAt: string;
  expiresAt: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  status: InvoiceStatus;
  paymentUrl: string;

  network?: string | null;
  txHash?: string | null;
  walletAddress?: string | null;

  riskScore?: number | null;
  amlStatus?: string | null;

  assetRiskScore?: number | null;
  assetStatus?: string | null;

  merchantId?: string | null;
}

interface FindAllParams {
  status?: InvoiceStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly sqlite: SqliteService,
    private readonly amlService: AmlService,
  ) {}

  // 🧩 Маппинг строки SQLite → Invoice
  // Здесь мы предполагаем, что row всегда есть (проверка выше)
  private mapRow(row: any): Invoice {
    return {
      id: row.id,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      fiatAmount: row.fiatAmount,
      fiatCurrency: row.fiatCurrency,
      cryptoAmount: row.cryptoAmount,
      cryptoCurrency: row.cryptoCurrency,
      status: row.status as InvoiceStatus,
      paymentUrl: row.paymentUrl,

      network: row.network ?? null,
      txHash: row.txHash ?? null,
      walletAddress: row.walletAddress ?? null,

      riskScore: row.riskScore ?? null,
      amlStatus: row.amlStatus ?? null,

      assetRiskScore: row.assetRiskScore ?? null,
      assetStatus: row.assetStatus ?? null,

      merchantId: row.merchantId ?? null,
    };
  }

  // 🔹 SELECT-часть, чтобы не дублировать в findOne / findAll
  private baseSelectSql = `
    SELECT
      id,
      created_at       AS createdAt,
      expires_at       AS expiresAt,
      fiat_amount      AS fiatAmount,
      fiat_currency    AS fiatCurrency,
      crypto_amount    AS cryptoAmount,
      crypto_currency  AS cryptoCurrency,
      status,
      payment_url      AS paymentUrl,
      network,
      tx_hash          AS txHash,
      wallet_address   AS walletAddress,
      risk_score       AS riskScore,
      aml_status       AS amlStatus,
      asset_risk_score AS assetRiskScore,
      asset_status     AS assetStatus,
      merchant_id      AS merchantId
    FROM invoices
  `;

  // 🚀 CREATE
  // 🚀 CREATE
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const db = this.sqlite.connection;

    // Логируем, что реально прилетает в body
    this.logger.log(`CreateInvoice DTO: ${JSON.stringify(dto)}`);

    const now = new Date();
    const id = `inv_${now.getTime()}_${randomUUID()}`;

    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 минут

    // Аккуратно парсим сумму, чтобы НИКОГДА не было undefined / null
    const rawFiatAmount: unknown = (dto as any).fiatAmount;
    let fiatAmount = 0;

    if (typeof rawFiatAmount === 'number') {
      fiatAmount = rawFiatAmount;
    } else if (typeof rawFiatAmount === 'string') {
      const parsed = Number(rawFiatAmount.replace(',', '.'));
      fiatAmount = Number.isFinite(parsed) ? parsed : 0;
    } else {
      fiatAmount = 0; // на всякий случай, чтобы не было NULL
    }

    const fiatCurrency = (dto.fiatCurrency || 'EUR').toUpperCase();
    const cryptoCurrency = (dto.cryptoCurrency || 'USDT').toUpperCase();

    // В MVP курс 1:1, потом сюда подставим реальный прайсинг
    const cryptoAmount = fiatAmount;

    const status: InvoiceStatus = 'waiting';
    const paymentUrl = `https://demo.your-cryptopay.com/open/pay/${id}`;

    const params = {
      id,
      createdAt,
      expiresAt,
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoCurrency,
      status,
      paymentUrl,
      network: null,
      txHash: null,
      walletAddress: null,
      riskScore: null,
      amlStatus: null,
      assetRiskScore: null,
      assetStatus: null,
      merchantId: dto.merchantId ?? null,
    };

    this.logger.log(
      `Inserting invoice: ${JSON.stringify({
        id,
        fiatAmount,
        fiatCurrency,
        cryptoAmount,
        cryptoCurrency,
        merchantId: params.merchantId,
      })}`,
    );

    db.prepare(
      `
        INSERT INTO invoices (
          id,
          created_at,
          expires_at,
          fiat_amount,
          fiat_currency,
          crypto_amount,
          crypto_currency,
          status,
          payment_url,
          network,
          tx_hash,
          wallet_address,
          risk_score,
          aml_status,
          asset_risk_score,
          asset_status,
          merchant_id
        ) VALUES (
          @id,
          @createdAt,
          @expiresAt,
          @fiatAmount,
          @fiatCurrency,
          @cryptoAmount,
          @cryptoCurrency,
          @status,
          @paymentUrl,
          @network,
          @txHash,
          @walletAddress,
          @riskScore,
          @amlStatus,
          @assetRiskScore,
          @assetStatus,
          @merchantId
        );
      `,
    ).run(params);

    this.logger.log(
      `Created invoice ${id}: ${fiatAmount} ${fiatCurrency} → ${cryptoAmount} ${cryptoCurrency}`,
    );

    // findOne возвращает Invoice | null, поэтому кастим
    return this.findOne(id) as Promise<Invoice>;
  }

  // 🔍 GET ONE
  async findOne(id: string): Promise<Invoice | null> {
    const db = this.sqlite.connection;
    const row = db.prepare(`${this.baseSelectSql} WHERE id = ?`).get(id);

    if (!row) {
      return null;
    }

    return this.mapRow(row);
  }

  // 📄 LIST / FILTERS
  async findAll(params: FindAllParams = {}): Promise<Invoice[]> {
    const db = this.sqlite.connection;

    const where: string[] = [];
    const bind: any[] = [];

    if (params.status) {
      where.push('status = ?');
      bind.push(params.status);
    }

    if (params.from) {
      where.push('created_at >= ?');
      bind.push(params.from);
    }

    if (params.to) {
      where.push('created_at <= ?');
      bind.push(params.to);
    }

    let sql = this.baseSelectSql;
    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';

    if (typeof params.limit === 'number') {
      sql += ' LIMIT ?';
      bind.push(params.limit);
    }
    if (typeof params.offset === 'number') {
      sql += ' OFFSET ?';
      bind.push(params.offset);
    }

    const rows = db.prepare(sql).all(...bind);
    return rows.map((r: any) => this.mapRow(r));
  }

  // 🔗 ATTACH TRANSACTION
  async attachTransaction(
    id: string,
    dto: AttachTransactionDto,
  ): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    db.prepare(
      `
      UPDATE invoices
      SET
        network = @network,
        tx_hash = @txHash,
        wallet_address = @walletAddress
      WHERE id = @id
    `,
    ).run({
      id,
      network: dto.network ?? null,
      txHash: dto.txHash ?? null,
      walletAddress: dto.walletAddress ?? null,
    });

    return this.findOne(id);
  }

  // 🔄 UPDATE STATUS
  async updateStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    db.prepare(
      `
      UPDATE invoices
      SET status = ?
      WHERE id = ?
    `,
    ).run(status, id);

    return this.findOne(id);
  }

  // ✍️ MANUAL AML
  async updateAml(id: string, dto: UpdateAmlDto): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    db.prepare(
      `
      UPDATE invoices
      SET
        aml_status = @amlStatus,
        risk_score = @riskScore
      WHERE id = @id
    `,
    ).run({
      id,
      amlStatus: dto.amlStatus ?? null,
      riskScore: typeof dto.riskScore === 'number' ? dto.riskScore : null,
    });

    return this.findOne(id);
  }

  // 🤖 AUTO AML (amount + stablecoin)
  async autoCheckAml(id: string): Promise<Invoice | null> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      return null;
    }

    const amlResult = await this.amlService.checkInvoice({
      fiatAmount: invoice.fiatAmount,
      fiatCurrency: invoice.fiatCurrency,
      cryptoCurrency: invoice.cryptoCurrency,
      invoiceId: invoice.id,
      network: invoice.network ?? undefined,
      walletAddress: invoice.walletAddress ?? undefined,
      txHash: invoice.txHash ?? undefined,
    });

    const db = this.sqlite.connection;

    db.prepare(
      `
      UPDATE invoices
      SET
        risk_score       = @riskScore,
        aml_status       = @amlStatus,
        asset_risk_score = @assetRiskScore,
        asset_status     = @assetStatus
      WHERE id = @id
    `,
    ).run({
      id,
      riskScore: amlResult.riskScore,
      amlStatus: amlResult.status,
      assetRiskScore: amlResult.assetRiskScore,
      assetStatus: amlResult.assetStatus,
    });

    return this.findOne(id);
  }

  // 📦 WEBHOOKS: CREATE EVENT
  async createWebhookEvent(
    invoiceId: string,
    eventType: string,
    payload: any,
  ): Promise<void> {
    const db = this.sqlite.connection;
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO webhook_events (
        id,
        invoice_id,
        event_type,
        payload_json,
        status,
        retry_count,
        last_attempt_at,
        created_at
      ) VALUES (
        @id,
        @invoiceId,
        @eventType,
        @payloadJson,
        'pending',
        0,
        NULL,
        @createdAt
      )
    `,
    ).run({
      id,
      invoiceId,
      eventType,
      payloadJson: JSON.stringify(payload),
      createdAt,
    });

    this.logger.log(
      `Created webhook event ${id} for invoice=${invoiceId}, type=${eventType}`,
    );
  }

  // 📜 WEBHOOKS: LIST BY INVOICE
  async getWebhookEventsForInvoice(invoiceId: string): Promise<WebhookEvent[]> {
    const db = this.sqlite.connection;

    const rows = db
      .prepare(
        `
        SELECT
          id,
          invoice_id   AS invoiceId,
          event_type   AS eventType,
          payload_json AS payloadJson,
          status,
          retry_count  AS retryCount,
          last_attempt_at AS lastAttemptAt,
          created_at   AS createdAt
        FROM webhook_events
        WHERE invoice_id = ?
        ORDER BY created_at DESC
      `,
      )
      .all(invoiceId);

    return rows as WebhookEvent[];
  }

  // 🚚 WEBHOOKS: DISPATCH PENDING (MVP — просто помечаем как "sent")
  async dispatchPendingWebhooksForInvoice(
    invoiceId: string,
  ): Promise<WebhookDispatchResult> {
    const db = this.sqlite.connection;

    const pending = db
      .prepare(
        `
        SELECT id
        FROM webhook_events
        WHERE invoice_id = ?
          AND status = 'pending'
      `,
      )
      .all(invoiceId) as { id: string }[];

    if (pending.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    const now = new Date().toISOString();

    const updateStmt = db.prepare(
      `
      UPDATE webhook_events
      SET
        status = 'sent',
        retry_count = retry_count + 1,
        last_attempt_at = @now
      WHERE id = @id
    `,
    );

    let sent = 0;

    for (const ev of pending) {
      updateStmt.run({ id: ev.id, now });
      sent++;
    }

    this.logger.log(
      `Dispatched ${sent} webhook events for invoice=${invoiceId} (MVP: marked as sent).`,
    );

    return {
      processed: pending.length,
      sent,
      failed: 0,
    };
  }
}
