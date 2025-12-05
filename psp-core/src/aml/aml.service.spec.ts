import { Test, TestingModule } from '@nestjs/testing';
import { AmlService } from './aml.service';

describe('AmlService', () => {
  let service: AmlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmlService],
    }).compile();

    service = module.get<AmlService>(AmlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
