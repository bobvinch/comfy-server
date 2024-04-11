import { AuthService } from './auth.service';
import {
  Get,
  Query,
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @ApiOperation({
    summary: '鉴权',
    description: 'Sign in with username and password,returning a token',
    parameters: [
      {
        name: 'username',
        in: 'query',
        required: true,
        description: 'username',
        schema: {
          type: 'string',
        },
      },
      {
        name: 'password',
        in: 'query',
        required: true,
        description: 'password',
        schema: {
          type: 'string',
        },
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  @Get('signin')
  signIn(
    @Query('username') username: string,
    @Query('password') password: string,
  ) {
    return this.authService.authToken(username, password);
  }
}
