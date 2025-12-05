// src/aml/aml.module.ts

import { Module } from '@nestjs/common';
import { AmlService } from './aml.service';

@Module({
  providers: [AmlService],
  exports: [AmlService],
})
export class AmlModule {}
