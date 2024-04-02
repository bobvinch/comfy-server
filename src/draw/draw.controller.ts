import { Controller } from '@nestjs/common';
import { DrawService } from './draw.service';

@Controller('draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}
}
