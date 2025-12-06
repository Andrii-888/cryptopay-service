// src/invoices/invoices.service.ts

import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

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
}

/**
 * ВРЕМЕННЫЙ in-memory сервис.
 * Хранит инвойсы в памяти процесса (Map) — достаточно для демо и разработки.
 * Потом можно будет вынести в БД.
 */
@Injectable()
export class InvoicesService {
  private readonly invoices = new Map<string, Invoice>();

  /**
   * Создать новый инвойс.
   * Фронт crypto-pay отправляет поля:
   * - fiatAmount
   * - fiatCurrency
   * - cryptoCurrency
   */
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const { fiatAmount, fiatCurrency, cryptoCurrency } = dto;

    if (!fiatAmount || fiatAmount <= 0) {
      throw new Error('Invalid fiatAmount');
    }

    const id = `inv_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 25 * 60 * 1000); // 25 минут

    // Базовый URL фронта — берём из ENV, с дефолтом на демо-домен Vercel
    const frontendBaseUrl =
      process.env.FRONTEND_BASE_URL ?? 'https://crypto-pay-iota.vercel.app';

    const paymentUrl = `${frontendBaseUrl}/open/pay/${id}`;

    const invoice: Invoice = {
      id,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fiatAmount,
      fiatCurrency,
      cryptoAmount: fiatAmount, // пока 1:1, конвертацию добавим позже
      cryptoCurrency,
      status: 'waiting',
      paymentUrl,
    };

    this.invoices.set(id, invoice);

    return invoice;
  }

  /**
   * Найти инвойс по id.
   * Используется фронтом на странице /open/pay/[invoiceId].
   */
  async findOne(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) ?? null;
  }

  /**
   * Обновить статус инвойса.
   * Используется контроллером для confirm / expire / reject.
   */
  async updateStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<Invoice | null> {
    const existing = this.invoices.get(id);
    if (!existing) return null;

    const updated: Invoice = { ...existing, status };
    this.invoices.set(id, updated);

    return updated;
  }
}
