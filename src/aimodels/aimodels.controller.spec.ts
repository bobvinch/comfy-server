import { Test, TestingModule } from '@nestjs/testing';
import { AimodelsController } from './aimodels.controller';
import { AimodelsService } from './aimodels.service';

describe('AimodelsController', () => {
  let controller: AimodelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AimodelsController],
      providers: [AimodelsService],
    }).compile();

    controller = module.get<AimodelsController>(AimodelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
