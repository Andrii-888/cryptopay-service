// src/invoices/invoices.service.ts

import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

// Возможные статусы инвойса
export type InvoiceStatus = 'waiting' | 'confirmed' | 'expired' | 'rejected';

// Описание структуры инвойса,
// как мы его будем хранить в памяти (позже — в базе).
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

@Injectable()
export class InvoicesService {
  // Пока что храним инвойсы в оперативной памяти — обычный массив.
  // Позже заменим на базу данных (PostgreSQL + Prisma).
  private invoices: Invoice[] = [];

  // Создание нового инвойса.
  // На вход получаем данные из CreateInvoiceDto,
  // на выход — готовый объект Invoice.
  create(createInvoiceDto: CreateInvoiceDto): Invoice {
    // Простая генерация id: inv_ + timestamp.
    const id = `inv_${Date.now()}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // +15 минут

    // Временно считаем, что 1 USDT = 1 EUR/CHF/USD (курс 1:1),
    // потом подключим реальный rate.
    const invoice: Invoice = {
      id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fiatAmount: createInvoiceDto.fiatAmount,
      fiatCurrency: createInvoiceDto.fiatCurrency,
      cryptoAmount: createInvoiceDto.fiatAmount, // временно так же, как фиат
      cryptoCurrency: createInvoiceDto.cryptoCurrency,
      status: 'waiting',
      // Позже сюда подставим реальный домен демо-магазина
      paymentUrl: `https://demo.your-cryptopay.com/open/pay/${id}`,
    };

    // Сохраняем инвойс в массив
    this.invoices.push(invoice);

    return invoice;
  }

  // Поиск инвойса по id
  findOne(id: string): Invoice | undefined {
    return this.invoices.find((invoice) => invoice.id === id);
  }

  // Обновление статуса инвойса.
  // Пока не используем снаружи, но скоро повесим на отдельные endpoint'ы.
  updateStatus(id: string, status: InvoiceStatus): Invoice | undefined {
    const invoice = this.invoices.find((item) => item.id === id);

    if (!invoice) {
      return undefined;
    }

    invoice.status = status;
    return invoice;
  }
}
