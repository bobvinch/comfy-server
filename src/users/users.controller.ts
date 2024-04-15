import {
  Query,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {
  }
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @ApiOperation({
    summary: '微信登录',
    description: '微信登录',
  })
  @Post('loginBywechat')
  loginBywechat(@Body() createUserDto: CreateUserDto) {
    return this.usersService.loginBywechat(createUserDto);
  }

  @ApiOperation({
    summary: '用户名注册',
    description: '根据用户名注册',
  })
  @Post('registerByUsername')
  registerByUsername(@Body() createUserDto: CreateUserDto) {
    return this.usersService.registerByUsername(createUserDto);
  }

  @ApiOperation({
    summary: '用户名登录',
    description: '根据用户名登录',
  })
  @Post('loginByUsername')
  loginByUsername(@Body() createUserDto: CreateUserDto) {
    return this.usersService.loginByUsername(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
