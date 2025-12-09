// src/invoices/invoices.controller.ts
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  InvoicesService,
  type Invoice,
  type InvoiceStatus,
} from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AttachTransactionDto } from './dto/attach-transaction.dto';
import { UpdateAmlDto } from './dto/update-aml.dto';
import { WebhookEvent } from '../webhooks/interfaces/webhook-event.interface';
import { WebhookDispatchResult } from '../webhooks/interfaces/webhook-dispatch-result.interface';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // 📌 CREATE
  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoicesService.create(createInvoiceDto);
  }

  // 📌 GET ALL (list + фильтры + пагинация)
  @Get()
  async findAll(
    @Query('status') status?: InvoiceStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Invoice[]> {
    // Подстраховка: разрешаем только валидные статусы
    const validStatuses: InvoiceStatus[] = [
      'waiting',
      'confirmed',
      'expired',
      'rejected',
    ];

    const safeStatus: InvoiceStatus | undefined =
      status && validStatuses.includes(status as InvoiceStatus)
        ? (status as InvoiceStatus)
        : undefined;

    return this.invoicesService.findAll({
      status: safeStatus,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  // 📌 GET ONE
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    const invoice = await this.invoicesService.findOne(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  // 📌 WEBHOOK EVENTS — LIST
  @Get(':id/webhooks')
  async getInvoiceWebhooks(@Param('id') id: string): Promise<WebhookEvent[]> {
    const invoice = await this.invoicesService.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return this.invoicesService.getWebhookEventsForInvoice(id);
  }

  // 📌 WEBHOOKS DISPATCH
  @Post(':id/webhooks/dispatch')
  async dispatchInvoiceWebhooks(
    @Param('id') id: string,
  ): Promise<WebhookDispatchResult> {
    const invoice = await this.invoicesService.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return this.invoicesService.dispatchPendingWebhooksForInvoice(id);
  }

  // 📌 CONFIRM
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

  // 📌 EXPIRE
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

  // 📌 REJECT
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

  // 📌 ATTACH TRANSACTION
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

  // 📌 MANUAL AML UPDATE
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

  // 📌 AUTO AML
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
