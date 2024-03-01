import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DrawhistoryService } from './drawhistory.service';
import { CreateDrawhistoryDto } from './dto/create-drawhistory.dto';
import { UpdateDrawhistoryDto } from './dto/update-drawhistory.dto';
import { ApiProperty } from '@nestjs/swagger';

@Controller('drawhistory')
export class DrawhistoryController {
  constructor(private readonly drawhistoryService: DrawhistoryService) {}

  @Post()
  @ApiProperty({
    description: '创建任务',
    example: {
      user_id: '1212121',
      prompt_id: '121212',
    },
  })
  create(@Body() createDrawhistoryDto: CreateDrawhistoryDto) {
    return this.drawhistoryService.create(createDrawhistoryDto);
  }

  @Get()
  findAll() {
    return this.drawhistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drawhistoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDrawhistoryDto: UpdateDrawhistoryDto,
  ) {
    return this.drawhistoryService.updatePromptstatus(id, updateDrawhistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.drawhistoryService.remove(id);
  }
}
