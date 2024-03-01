import { Test, TestingModule } from '@nestjs/testing';
import { AimodelsService } from './aimodels.service';

describe('AimodelsService', () => {
  let service: AimodelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AimodelsService],
    }).compile();

    service = module.get<AimodelsService>(AimodelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
