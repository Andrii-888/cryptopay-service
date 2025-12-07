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
import { AttachTransactionDto } from './dto/attach-transaction.dto';
import { UpdateAmlDto } from './dto/update-aml.dto';
import { WebhookEvent } from '../webhooks/interfaces/webhook-event.interface';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = await this.invoicesService.create(createInvoiceDto);
    return invoice;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    const invoice = await this.invoicesService.findOne(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  // ✅ Получить все webhook-события по инвойсу
  @Get(':id/webhooks')
  async getInvoiceWebhooks(@Param('id') id: string): Promise<WebhookEvent[]> {
    const invoice = await this.invoicesService.findOne(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return this.invoicesService.getWebhookEventsForInvoice(id);
  }

  // ✅ "Отправить" все pending webhooks по инвойсу (MVP: просто пометить sent)
  @Post(':id/webhooks/dispatch')
  async dispatchInvoiceWebhooks(
    @Param('id') id: string,
  ): Promise<{ invoiceId: string; processed: number }> {
    const invoice = await this.invoicesService.findOne(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return this.invoicesService.dispatchPendingWebhooksForInvoice(id);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.updateStatus(id, 'confirmed');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    await this.invoicesService.createWebhookEvent(
      updated.id,
      'invoice.confirmed',
      updated,
    );

    return updated;
  }

  @Post(':id/expire')
  async expire(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.updateStatus(id, 'expired');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    await this.invoicesService.createWebhookEvent(
      updated.id,
      'invoice.expired',
      updated,
    );

    return updated;
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.updateStatus(id, 'rejected');

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    await this.invoicesService.createWebhookEvent(
      updated.id,
      'invoice.rejected',
      updated,
    );

    return updated;
  }

  @Post(':id/tx')
  async attachTx(
    @Param('id') id: string,
    @Body() body: AttachTransactionDto,
  ): Promise<Invoice> {
    const updated = await this.invoicesService.attachTransaction(id, body);

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return updated;
  }

  @Post(':id/aml')
  async updateAml(
    @Param('id') id: string,
    @Body() body: UpdateAmlDto,
  ): Promise<Invoice> {
    const updated = await this.invoicesService.updateAml(id, body);

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    await this.invoicesService.createWebhookEvent(
      updated.id,
      'invoice.aml.updated',
      updated,
    );

    return updated;
  }

  @Post(':id/aml/check')
  async autoAml(@Param('id') id: string): Promise<Invoice> {
    const updated = await this.invoicesService.autoCheckAml(id);

    if (!updated) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    await this.invoicesService.createWebhookEvent(
      updated.id,
      'invoice.aml.updated',
      updated,
    );

    return updated;
  }
}
