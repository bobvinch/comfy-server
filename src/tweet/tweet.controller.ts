import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { TweetProject } from './entities/tweet.schema';
import { ApiOperation } from '@nestjs/swagger';

@Controller('tweet')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}
  @ApiOperation({
    summary: '保存项目',
    description: '保存项目',
  })
  @Post('savePrject')
  savePrject(@Body() createTweetDto: CreateTweetDto) {
    return this.tweetService.savePrject(
      createTweetDto.user_id,
      createTweetDto.projects[0],
    );
  }
  @Get()
  findAll() {
    return this.tweetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tweetService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTweetDto: UpdateTweetDto) {
    return this.tweetService.update(+id, updateTweetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tweetService.remove(+id);
  }
}
