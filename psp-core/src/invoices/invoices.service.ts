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

// Простое in-memory хранилище
const invoiceStore = new Map<string, Invoice>();

@Injectable()
export class InvoicesService {
  // Создать новый инвойс
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const id = `inv_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // +15 минут

    const invoice: Invoice = {
      id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fiatAmount: dto.fiatAmount,
      fiatCurrency: dto.fiatCurrency ?? 'EUR',
      cryptoAmount: dto.fiatAmount, // демо: 1:1
      cryptoCurrency: dto.cryptoCurrency ?? 'USDT',
      status: 'waiting',
      paymentUrl: `https://demo.your-cryptopay.com/open/pay/${id}`,
    };

    invoiceStore.set(id, invoice);
    return invoice;
  }

  // Найти инвойс по id
  async findOne(id: string): Promise<Invoice | null> {
    return invoiceStore.get(id) ?? null;
  }

  // Обновить статус инвойса
  async updateStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<Invoice | null> {
    const existing = invoiceStore.get(id);
    if (!existing) return null;

    const updated: Invoice = { ...existing, status };
    invoiceStore.set(id, updated);
    return updated;
  }
}
