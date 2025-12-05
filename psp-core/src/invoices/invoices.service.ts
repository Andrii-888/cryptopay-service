import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AmlService } from '../aml/aml.service';

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

// ✅ Base URL for frontend (from env on Render)
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL ?? 'https://demo.your-cryptopay.com';

// Простое in-memory хранилище
const invoiceStore = new Map<string, Invoice>();

@Injectable()
export class InvoicesService {
  constructor(private readonly amlService: AmlService) {}

  // Создать новый инвойс
  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const id = `inv_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // +15 минут

    const fiatCurrency = dto.fiatCurrency ?? 'EUR';
    const cryptoCurrency = dto.cryptoCurrency ?? 'USDT';

    // 🔍 Черновая AML-проверка (пока просто логика в AmlService)
    await this.amlService.checkInvoice({
      fiatAmount: dto.fiatAmount,
      fiatCurrency,
      cryptoCurrency,
    });

    const invoice: Invoice = {
      id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fiatAmount: dto.fiatAmount,
      fiatCurrency,
      cryptoAmount: dto.fiatAmount, // demo: 1:1
      cryptoCurrency,
      status: 'waiting',
      paymentUrl: `${FRONTEND_BASE_URL}/open/pay/${id}`,
    };

    invoiceStore.set(id, invoice);
    return invoice;
  }

  async findOne(id: string): Promise<Invoice | null> {
    return invoiceStore.get(id) ?? null;
  }

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
