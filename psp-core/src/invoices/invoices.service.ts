// src/invoices/invoices.service.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AttachTransactionDto } from './dto/attach-transaction.dto';
import { UpdateAmlDto } from './dto/update-aml.dto';
import { SqliteService } from '../db/sqlite.service';
import { WebhookEvent } from '../webhooks/interfaces/webhook-event.interface';

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
  merchantId?: string | null;
}

const DEFAULT_EXPIRY_MINUTES = 15;

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL ?? 'https://demo.your-cryptopay.com';

@Injectable()
export class InvoicesService {
  constructor(private readonly sqlite: SqliteService) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const now = new Date();
    const expires = new Date(
      now.getTime() + DEFAULT_EXPIRY_MINUTES * 60 * 1000,
    );

    const id = this.generateInvoiceId();

    const fiatAmount = Number(dto.fiatAmount ?? 0);
    const fiatCurrency = dto.fiatCurrency || 'EUR';
    const cryptoCurrency = dto.cryptoCurrency || 'USDT';

    const cryptoAmount = fiatAmount;

    const paymentUrl = `${FRONTEND_BASE_URL}/open/pay/${id}`;

    const createdAt = now.toISOString();
    const expiresAt = expires.toISOString();
    const status: InvoiceStatus = 'waiting';

    const db = this.sqlite.connection;

    const stmt = db.prepare(
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
        payment_url
      ) VALUES (
        @id,
        @createdAt,
        @expiresAt,
        @fiatAmount,
        @fiatCurrency,
        @cryptoAmount,
        @cryptoCurrency,
        @status,
        @paymentUrl
      );
    `,
    );

    stmt.run({
      id,
      createdAt,
      expiresAt,
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoCurrency,
      status,
      paymentUrl,
    });

    return {
      id,
      createdAt,
      expiresAt,
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoCurrency,
      status,
      paymentUrl,
    };
  }

  async findOne(id: string): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    const row = db
      .prepare(
        `
        SELECT
          id,
          created_at as createdAt,
          expires_at as expiresAt,
          fiat_amount as fiatAmount,
          fiat_currency as fiatCurrency,
          crypto_amount as cryptoAmount,
          crypto_currency as cryptoCurrency,
          status,
          payment_url as paymentUrl,
          network as network,
          tx_hash as txHash,
          wallet_address as walletAddress,
          risk_score as riskScore,
          aml_status as amlStatus,
          merchant_id as merchantId
        FROM invoices
        WHERE id = ?;
      `,
      )
      .get(id);

    if (!row) {
      return null;
    }

    return row as Invoice;
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    const updateStmt = db.prepare(
      `
      UPDATE invoices
      SET status = @status
      WHERE id = @id;
    `,
    );

    const result = updateStmt.run({ id, status });

    if (result.changes === 0) {
      return null;
    }

    return this.findOne(id);
  }

  async attachTransaction(
    id: string,
    data: AttachTransactionDto,
  ): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    const updateStmt = db.prepare(
      `
      UPDATE invoices
      SET
        network = COALESCE(@network, network),
        tx_hash = @txHash,
        wallet_address = COALESCE(@walletAddress, wallet_address)
      WHERE id = @id;
    `,
    );

    const result = updateStmt.run({
      id,
      network: data.network ?? null,
      txHash: data.txHash,
      walletAddress: data.walletAddress ?? null,
    });

    if (result.changes === 0) {
      return null;
    }

    return this.findOne(id);
  }

  async updateAml(id: string, data: UpdateAmlDto): Promise<Invoice | null> {
    const db = this.sqlite.connection;

    const updateStmt = db.prepare(
      `
      UPDATE invoices
      SET
        risk_score = COALESCE(@riskScore, risk_score),
        aml_status = COALESCE(@amlStatus, aml_status)
      WHERE id = @id;
    `,
    );

    const result = updateStmt.run({
      id,
      riskScore: typeof data.riskScore === 'number' ? data.riskScore : null,
      amlStatus: data.amlStatus ?? null,
    });

    if (result.changes === 0) {
      return null;
    }

    return this.findOne(id);
  }

  async autoCheckAml(id: string): Promise<Invoice | null> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      return null;
    }

    const amount = Number(invoice.fiatAmount ?? 0);

    let riskScore: number;
    let amlStatus: string;

    if (amount < 1000) {
      riskScore = 10;
      amlStatus = 'clean';
    } else if (amount <= 5000) {
      riskScore = 50;
      amlStatus = 'warning';
    } else {
      riskScore = 85;
      amlStatus = 'risky';
    }

    return this.updateAml(id, {
      riskScore,
      amlStatus: amlStatus as UpdateAmlDto['amlStatus'],
    });
  }

  async createWebhookEvent(
    invoiceId: string,
    eventType: string,
    payload: any,
  ): Promise<string> {
    const db = this.sqlite.connection;

    const id = `wh_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
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
        created_at
      ) VALUES (
        @id,
        @invoiceId,
        @eventType,
        @payloadJson,
        'pending',
        0,
        @createdAt
      );
    `,
    ).run({
      id,
      invoiceId,
      eventType,
      payloadJson: JSON.stringify(payload),
      createdAt,
    });

    return id;
  }

  async getWebhookEventsForInvoice(invoiceId: string): Promise<WebhookEvent[]> {
    const db = this.sqlite.connection;

    const rows = db
      .prepare(
        `
        SELECT
          id,
          invoice_id as invoiceId,
          event_type as eventType,
          payload_json as payloadJson,
          status,
          retry_count as retryCount,
          last_attempt_at as lastAttemptAt,
          created_at as createdAt
        FROM webhook_events
        WHERE invoice_id = ?
        ORDER BY created_at DESC;
      `,
      )
      .all(invoiceId);

    return rows as WebhookEvent[];
  }

  /**
   * "Фейковая" отправка webhook-событий для одного инвойса.
   * Сейчас НИЧЕГО никуда не шлём — только помечаем как sent
   * и обновляем retry_count / last_attempt_at.
   *
   * Это идеальный шаг перед реальной HTTP-интеграцией.
   */
  async dispatchPendingWebhooksForInvoice(invoiceId: string): Promise<{
    invoiceId: string;
    processed: number;
  }> {
    const db = this.sqlite.connection;
    const now = new Date().toISOString();

    // Находим все pending события по инвойсу
    const pendingRows = db
      .prepare(
        `
        SELECT id
        FROM webhook_events
        WHERE invoice_id = @invoiceId
          AND status = 'pending'
        ORDER BY created_at ASC;
      `,
      )
      .all({ invoiceId }) as { id: string }[];

    if (pendingRows.length === 0) {
      return {
        invoiceId,
        processed: 0,
      };
    }

    const updateStmt = db.prepare(
      `
      UPDATE webhook_events
      SET
        status = 'sent',
        retry_count = retry_count + 1,
        last_attempt_at = @now
      WHERE id = @id;
    `,
    );

    for (const row of pendingRows) {
      updateStmt.run({
        id: row.id,
        now,
      });
    }

    return {
      invoiceId,
      processed: pendingRows.length,
    };
  }

  private generateInvoiceId(): string {
    try {
      return `inv_${Date.now()}_${randomUUID()}`;
    } catch {
      return `inv_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    }
  }
}
