// src/invoices/invoices.controller.ts

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import type { Invoice } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // -------------------------
  // POST /invoices
  // Создать новый инвойс
  // -------------------------
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto): Invoice {
    return this.invoicesService.create(createInvoiceDto);
  }

  // -------------------------
  // GET /invoices/:id
  // Получить инвойс по id
  // -------------------------
  @Get(':id')
  findOne(@Param('id') id: string): Invoice {
    const invoice = this.invoicesService.findOne(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  // -------------------------
  // POST /invoices/:id/confirm
  // Подтвердить оплату инвойса
  // -------------------------
  @Post(':id/confirm')
  confirm(@Param('id') id: string): Invoice {
    const updated = this.invoicesService.updateStatus(id, 'confirmed');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }

  // -------------------------
  // POST /invoices/:id/expire
  // Пометить инвойс как истёкший
  // -------------------------
  @Post(':id/expire')
  expire(@Param('id') id: string): Invoice {
    const updated = this.invoicesService.updateStatus(id, 'expired');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }

  // -------------------------
  // POST /invoices/:id/reject
  // Отклонить инвойс (ошибка / AML)
  // -------------------------
  @Post(':id/reject')
  reject(@Param('id') id: string): Invoice {
    const updated = this.invoicesService.updateStatus(id, 'rejected');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }
}
