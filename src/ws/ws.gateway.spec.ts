import { Test, TestingModule } from '@nestjs/testing';
import { WsGateway } from './ws.gateway';

describe('WsGateway', () => {
  let gateway: WsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsGateway],
    }).compile();

    gateway = module.get<WsGateway>(WsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
