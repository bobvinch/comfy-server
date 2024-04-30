import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OneAPIUsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OneAPIUser } from './entities/user.entity';

@ApiTags('OneAPI')
@Controller('oneapi/users')
export class UsersController {
  constructor(private readonly oneAPIUsersService: OneAPIUsersService) {}

  @Post()
  create(@Body() user: OneAPIUser) {
    return this.oneAPIUsersService.create(user);
  }

  @ApiOperation({
    summary: '创建ONEAPI用户',
    description: '根据微信uniId传建用户，如果存在则直接返回，没有就重新创建',
  })
  @Post('creatbyuniId')
  async CreateByUniId(@Body() user: OneAPIUser) {
    return await this.oneAPIUsersService.CreateByUniId(user);
  }

  @ApiOperation({
    summary: '获取所有用户',
    description: 'Get all users',
  })
  @Get()
  findAll() {
    return this.oneAPIUsersService.findAll();
  }

  @ApiOperation({
    summary: '根据id获取用户',
    description: 'Get user by id',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.oneAPIUsersService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新用户',
    description: 'Update user by id',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() user: OneAPIUser) {
    return this.oneAPIUsersService.update(+id, user);
  }

  @ApiOperation({
    summary: '删除用户',
    description: 'Delete user by id',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.oneAPIUsersService.remove(+id);
  }
}
