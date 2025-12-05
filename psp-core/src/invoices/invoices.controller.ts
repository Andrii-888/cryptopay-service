// src/invoices/invoices.controller.ts

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InvoicesService, type Invoice } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // POST /invoices
  // Создать новый инвойс
  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // сервис теперь async → ждём результат
    const invoice = await this.invoicesService.create(createInvoiceDto);
    return invoice;
  }

  // GET /invoices/:id
  // Получить инвойс по id
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    const invoice = await this.invoicesService.findOne(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  // POST /invoices/:id/confirm
  // Подтвердить оплату инвойса
  @Post(':id/confirm')
  async confirm(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.updateStatus(id, 'confirmed');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }

  // POST /invoices/:id/expire
  // Пометить инвойс как истёкший (оплата не поступила вовремя)
  @Post(':id/expire')
  async expire(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.updateStatus(id, 'expired');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }

  // POST /invoices/:id/reject
  // Отклонить инвойс (manual reject / AML / risk)
  @Post(':id/reject')
  async reject(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.updateStatus(id, 'rejected');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }
}
