// src/invoices/invoices.module.ts

import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { AmlModule } from '../aml/aml.module';

@Module({
  imports: [AmlModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
