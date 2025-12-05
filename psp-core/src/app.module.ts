import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvoicesModule } from './invoices/invoices.module';
import { AmlModule } from './aml/aml.module';

@Module({
  imports: [InvoicesModule, AmlModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
