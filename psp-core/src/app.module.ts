import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { InvoicesModule } from './invoices/invoices.module';
import { AmlModule } from './aml/aml.module';

import { SqliteService } from './db/sqlite.service';

@Module({
  imports: [InvoicesModule, AmlModule],
  controllers: [AppController],
  providers: [AppService, SqliteService],
})
export class AppModule {}
