// src/invoices/invoices.module.ts
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { SqliteService } from '../db/sqlite.service';

@Module({
  imports: [],
  controllers: [InvoicesController],
  providers: [InvoicesService, SqliteService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
